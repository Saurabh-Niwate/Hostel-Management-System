const { Pool } = require("pg");
require("dotenv").config();

// Extract connection config
let poolConfig;

if (process.env.DATABASE_URL) {
  // If a full connection string (e.g. postgresql://...) is provided (standard in cloud)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
  };
} else {
  // Local fallback / standard env variables
  const connString = process.env.DB_CONNECTION_STRING || "localhost/postgres";
  const parts = connString.split("/");
  const hostAndPort = parts[0] || "localhost";
  const database = parts[1] || "postgres";
  const [host, port] = hostAndPort.split(":");

  poolConfig = {
    user: (process.env.DB_USER || "postgres").trim(),
    password: (process.env.DB_PASSWORD || "postgres").trim(),
    host: host.trim(),
    port: parseInt(port || "5432", 10),
    database: database.trim(),
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

const pool = new Pool(poolConfig);

async function initialize() {
  // Test connection
  const client = await pool.connect();
  client.release();
  console.log("PostgreSQL Database connected successfully");
}

// Helper to convert Oracle bind parameter objects into PostgreSQL positional parameters
function parseSqlAndParams(sql, params) {
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    return { query: sql, values: params || [] };
  }

  const values = [];
  const keyMap = {}; // Maps paramName -> index (1-based)
  let paramCounter = 1;

  // Match colons followed by word character, but skip standard casting syntaxes like ::date
  // Regex matches any colon followed by letters/numbers/underscores, provided it is not preceded by a colon.
  const regex = /(?<!:):([a-zA-Z0-9_]+)/g;

  const query = sql.replace(regex, (match, name) => {
    if (keyMap[name] !== undefined) {
      return `$${keyMap[name]}`;
    }

    let val = params[name];
    if (val === undefined) {
      // Case-insensitive lookup
      const foundKey = Object.keys(params).find(k => k.toLowerCase() === name.toLowerCase());
      if (foundKey !== undefined) {
        val = params[foundKey];
      } else {
        val = null;
      }
    }

    keyMap[name] = paramCounter;
    values.push(val);
    paramCounter++;
    return `$${keyMap[name]}`;
  });

  return { query, values };
}

// Oracle Database constants
const OUT_FORMAT_ARRAY = 4001;
const OUT_FORMAT_OBJECT = 4002;

class PostgresConnectionWrapper {
  constructor(client) {
    this.client = client;
    this.inTransaction = false;
  }

  async execute(sql, bindParams = {}, options = {}) {
    // 1. Pre-process SQL query syntax differences (Oracle vs PostgreSQL)
    let processedSql = sql;

    // A. FROM dual -> remove FROM dual (Postgres allows: SELECT col)
    processedSql = processedSql.replace(/\bFROM\s+dual\b/gi, "");

    // B. NVL(a, b) -> COALESCE(a, b)
    processedSql = processedSql.replace(/\bNVL\b/gi, "COALESCE");

    // C. SYSDATE -> CURRENT_TIMESTAMP
    processedSql = processedSql.replace(/\bSYSDATE\b/gi, "CURRENT_TIMESTAMP");

    // D. TRUNC(CURRENT_TIMESTAMP) -> CURRENT_DATE
    processedSql = processedSql.replace(/\bTRUNC\s*\(\s*CURRENT_TIMESTAMP\s*\)/gi, "CURRENT_DATE");

    // E. TRUNC(date_col) -> date_col::date
    processedSql = processedSql.replace(/\bTRUNC\s*\(\s*([a-zA-Z0-9_.]+)\s*\)/gi, "$1::date");

    // F. TO_DATE(x, '...') -> TO_TIMESTAMP(x, '...')
    processedSql = processedSql.replace(/\bTO_DATE\b/gi, "TO_TIMESTAMP");

    // 2. Parse parameters
    const { query, values } = parseSqlAndParams(processedSql, bindParams);

    // 3. Auto-transaction logic (if autoCommit is false and not already in transaction)
    if (options.autoCommit === false && !this.inTransaction) {
      await this.client.query("BEGIN");
      this.inTransaction = true;
    }

    // 4. Execute query
    const res = await this.client.query(query, values);

    // 5. Auto-commit logic
    if (options.autoCommit !== false && this.inTransaction) {
      await this.client.query("COMMIT");
      this.inTransaction = false;
    }

    // 6. Format the output to match what the Oracle controller expects
    const outFormat = options.outFormat || OUT_FORMAT_ARRAY;
    let formattedRows = [];

    if (outFormat === OUT_FORMAT_OBJECT) {
      // Return array of objects with UPPERCASE column keys (Oracle standard behavior)
      formattedRows = res.rows.map(row => {
        const uppercaseRow = {};
        for (const [key, val] of Object.entries(row)) {
          uppercaseRow[key.toUpperCase()] = val;
        }
        return uppercaseRow;
      });
    } else {
      // OUT_FORMAT_ARRAY: return array of arrays, ordered by field metadata
      formattedRows = res.rows.map(row => res.fields.map(f => row[f.name]));
    }

    return {
      rows: formattedRows,
      metaData: res.fields.map(f => ({ name: f.name.toUpperCase() })),
      rowsAffected: res.rowCount || 0
    };
  }

  async commit() {
    await this.client.query("COMMIT");
    this.inTransaction = false;
  }

  async rollback() {
    await this.client.query("ROLLBACK");
    this.inTransaction = false;
  }

  async close() {
    // If transaction was started but not committed/rolled back, clean up
    if (this.inTransaction) {
      try {
        await this.client.query("ROLLBACK");
      } catch (e) {
        // Ignore
      }
    }
    this.client.release();
  }
}

// Mimic oracledb object
const oracledb = {
  OUT_FORMAT_ARRAY,
  OUT_FORMAT_OBJECT,
  getConnection: async () => {
    const client = await pool.connect();
    return new PostgresConnectionWrapper(client);
  }
};

module.exports = {
  initialize,
  oracledb
};
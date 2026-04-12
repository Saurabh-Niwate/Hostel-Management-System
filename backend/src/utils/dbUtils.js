const { oracledb } = require("../config/db");

async function withConnection(fn) {
  const conn = await oracledb.getConnection();
  try {
    return await fn(conn);
  } finally {
    try {
      await conn.close();
    } catch (e) {
      console.error("Error closing connection:", e);
    }
  }
}

async function withTransaction(fn) {
  const conn = await oracledb.getConnection();
  try {
    // Ensure autoCommit is false for explicit transaction
    await conn.execute(`BEGIN NULL; END;`);
    try {
      const result = await fn(conn);
      try {
        await conn.commit();
      } catch (commitErr) {
        console.error("Commit failed:", commitErr);
      }
      return result;
    } catch (err) {
      try {
        await conn.rollback();
      } catch (rbErr) {
        console.error("Rollback failed:", rbErr);
      }
      throw err;
    }
  } finally {
    try {
      await conn.close();
    } catch (e) {
      console.error("Error closing connection:", e);
    }
  }
}

module.exports = { withConnection, withTransaction };

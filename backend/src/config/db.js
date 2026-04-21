const oracledb = require("oracledb");

// Thick mode (since you use Oracle 11g)
oracledb.initOracleClient({
  libDir: "C:\\oracle\\instantclient_19_29"
});

require("dotenv").config();

async function initialize() {
  await oracledb.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION_STRING,
    poolMin: 10,
    poolMax: 10,
    poolIncrement: 0
  });

  console.log("Oracle Database connected successfully");
}

module.exports = {
  initialize,
  oracledb
};
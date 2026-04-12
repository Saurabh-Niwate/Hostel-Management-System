const jwt = require("jsonwebtoken");
const { oracledb } = require("../config/db");

exports.verifyToken = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(403).json({ message: "Token required" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

exports.requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

exports.validateStudentExists = async (req, res, next) => {
  const userId = req.user.userId;
  let conn;
  try {
    conn = await oracledb.getConnection();
    const result = await conn.execute(
      `SELECT user_id FROM students WHERE user_id = :b_user_id`,
      { b_user_id: userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found. Please complete your profile first." });
    }

    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Database error checking student profile" });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error("Error closing connection:", closeErr);
      }
    }
  }
};

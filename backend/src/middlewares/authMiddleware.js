const jwt = require("jsonwebtoken");
const { oracledb } = require("../config/db");

exports.verifyToken = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(403).json({ message: "Token required" });
  }

  const token = header.split(" ")[1];

  let conn;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    conn = await oracledb.getConnection();

    const userResult = await conn.execute(
      `
      SELECT NVL(token_version, 0) AS token_version
      FROM users
      WHERE user_id = :b_user_id
      `,
      { b_user_id: decoded.userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const currentTokenVersion = Number(userResult.rows[0].TOKEN_VERSION || 0);
    if (Number(decoded.tokenVersion || 0) !== currentTokenVersion) {
      return res.status(401).json({ message: "Session has expired. Please login again." });
    }

    if (decoded.jti) {
      const revokedResult = await conn.execute(
        `
        SELECT jti
        FROM revoked_tokens
        WHERE jti = :b_jti
          AND expires_at > SYSDATE
        `,
        { b_jti: String(decoded.jti) },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (revokedResult.rows && revokedResult.rows.length > 0) {
        return res.status(401).json({ message: "Session has been logged out" });
      }
    }

    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error("Error closing database connection:", closeErr);
      }
    }
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

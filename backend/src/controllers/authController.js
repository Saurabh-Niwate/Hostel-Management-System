const { oracledb } = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const staffRoles = new Set(["Admin", "Technical Staff", "Warden", "Security", "Canteen Owner"]);

exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  let conn;

  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
  `
  SELECT u.user_id, u.password, r.role_name
  FROM users u
  JOIN roles r ON u.role_id = r.role_id
  WHERE TRIM(u.student_id) = :id
     OR TRIM(u.emp_id) = :id
     OR TRIM(u.email) = :id
  `,
  { id: identifier }   
);



    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const userId = user[0];
    const dbPassword = user[1];
    const role = user[2];


    const passwordMatches = await bcrypt.compare(password, dbPassword);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials"
       });
    }
    
    const token = jwt.sign(
      { userId, role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role });

  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({ message: "Login failed" });
  } finally {

    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error("Error closing database connection:", err);
      }
    }
  }
};

exports.getMyProfile = async (req, res) => {
  const { userId, role } = req.user;

  if (!staffRoles.has(role)) {
    return res.status(403).json({ message: "This profile endpoint is for staff roles only" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        u.user_id,
        u.emp_id,
        u.email,
        r.role_name,
        sp.full_name,
        sp.phone,
        TO_CHAR(sp.created_at, 'YYYY-MM-DD HH24:MI:SS') AS profile_created_at
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      LEFT JOIN staff_profiles sp ON sp.user_id = u.user_id
      WHERE u.user_id = :b_user_id
      `,
      { b_user_id: userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch profile" });
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

exports.updateMyProfile = async (req, res) => {
  const { userId, role } = req.user;
  const { email, fullName, phone } = req.body;

  if (!staffRoles.has(role)) {
    return res.status(403).json({ message: "This profile update endpoint is for staff roles only" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const trimmedEmail = email ? String(email).trim().toLowerCase() : null;
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const duplicateEmailCheck = await conn.execute(
        `
        SELECT user_id
        FROM users
        WHERE LOWER(TRIM(email)) = :b_email
          AND user_id <> :b_user_id
        `,
        {
          b_email: trimmedEmail,
          b_user_id: userId
        }
      );

      if (duplicateEmailCheck.rows.length > 0) {
        return res.status(409).json({ message: "Email already in use" });
      }
    }

    await conn.execute(
      `
      UPDATE users
      SET email = :b_email
      WHERE user_id = :b_user_id
      `,
      {
        b_email: trimmedEmail,
        b_user_id: userId
      },
      { autoCommit: false }
    );

    await conn.execute(
      `
      MERGE INTO staff_profiles sp
      USING (SELECT :b_user_id AS user_id FROM dual) src
      ON (sp.user_id = src.user_id)
      WHEN MATCHED THEN
        UPDATE SET
          full_name = :b_full_name,
          phone = :b_phone
      WHEN NOT MATCHED THEN
        INSERT (user_id, full_name, phone)
        VALUES (:b_user_id, :b_full_name, :b_phone)
      `,
      {
        b_user_id: userId,
        b_full_name: fullName ? String(fullName).trim() : null,
        b_phone: phone ? String(phone).trim() : null
      },
      { autoCommit: false }
    );

    await conn.commit();
    return res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    }
    return res.status(500).json({ message: "Failed to update profile" });
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

exports.changeMyPassword = async (req, res) => {
  const { userId } = req.user;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !String(oldPassword).trim() || !newPassword || !String(newPassword).trim()) {
    return res.status(400).json({ message: "oldPassword and newPassword are required" });
  }

  if (confirmPassword !== undefined && String(newPassword) !== String(confirmPassword)) {
    return res.status(400).json({ message: "newPassword and confirmPassword do not match" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT password
      FROM users
      WHERE user_id = :b_user_id
      `,
      { b_user_id: userId }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentHash = result.rows[0][0];
    const passwordMatches = await bcrypt.compare(String(oldPassword), currentHash);
    if (!passwordMatches) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword).trim(), 10);
    await conn.execute(
      `
      UPDATE users
      SET password = :b_password
      WHERE user_id = :b_user_id
      `,
      {
        b_password: hashedPassword,
        b_user_id: userId
      },
      { autoCommit: true }
    );

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to change password" });
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

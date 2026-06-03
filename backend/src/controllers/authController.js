const { oracledb } = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { clearAuthAttempts } = require("../middlewares/authSecurityMiddleware");
const { toPublicUrl, deleteProfileImageFile, safeUnlink } = require("../utils/fileUtils");

const staffRoles = new Set(["Admin", "Technical Staff", "Warden", "Security", "Canteen Owner"]);

exports.login = async (req, res) => {
  const { identifier, password, roleHint } = req.body;

  if (typeof identifier !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "identifier and password are required" });
  }

  let conn;

  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
  `
  SELECT u.user_id, u.password, r.role_name, NVL(u.token_version, 0) AS token_version
  FROM users u
  JOIN roles r ON u.role_id = r.role_id
  WHERE r.role_name = :role_hint
    AND (
      TRIM(u.student_id) = :id
      OR TRIM(u.emp_id) = :id
      OR LOWER(TRIM(u.email)) = :id_lower
    )
  `,
  {
    id: identifier,
    id_lower: String(identifier).trim().toLowerCase(),
    role_hint: roleHint
  }
);



    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const userId = user[0];
    const dbPassword = user[1];
    const role = user[2];
    const tokenVersion = Number(user[3] || 0);


    const passwordMatches = await bcrypt.compare(password, dbPassword);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials"
       });
    }
    
    const token = jwt.sign(
      { userId, role, tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: "1d", jwtid: crypto.randomUUID() }
    );

    clearAuthAttempts(req);

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

exports.logout = async (req, res) => {
  const { userId, jti, exp } = req.user || {};

  if (!userId || !jti || !exp) {
    return res.status(400).json({ message: "Valid authenticated session is required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    await conn.execute(
      `
      INSERT INTO revoked_tokens (jti, user_id, expires_at)
      VALUES (:b_jti, :b_user_id, TO_DATE(:b_expires_at, 'YYYY-MM-DD HH24:MI:SS'))
      ON CONFLICT (jti) DO NOTHING
      `,
      {
        b_jti: String(jti),
        b_user_id: Number(userId),
        b_expires_at: new Date(Number(exp) * 1000).toISOString().slice(0, 19).replace("T", " ")
      },
      { autoCommit: true }
    );

    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to logout" });
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
        sp.profile_image_url,
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

    result.rows[0].PROFILE_IMAGE_URL = toPublicUrl(req, result.rows[0].PROFILE_IMAGE_URL);
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
      INSERT INTO staff_profiles (user_id, full_name, phone)
      VALUES (:b_user_id, :b_full_name, :b_phone)
      ON CONFLICT (user_id)
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone
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
      SET password = :b_password,
          token_version = NVL(token_version, 0) + 1
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

exports.uploadMyProfileImage = async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;

  if (!staffRoles.has(role)) {
    return res.status(403).json({ message: "Only staff members can upload profile image" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  const { isValidImageSignature } = require("../middlewares/uploadMiddleware");

  if (!(await isValidImageSignature(req.file.path, req.file.mimetype))) {
    safeUnlink(req.file.path);
    return res.status(400).json({ message: "Uploaded file content is not a valid image" });
  }

  const imagePath = `/uploads/profile-images/${req.file.filename}`;
  let conn;
  try {
    conn = await oracledb.getConnection();
    const previousResult = await conn.execute(
      `
      SELECT profile_image_url
      FROM staff_profiles
      WHERE user_id = :b_user_id
      `,
      { b_user_id: userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const previousImagePath =
      previousResult.rows && previousResult.rows[0]
        ? previousResult.rows[0].PROFILE_IMAGE_URL
        : null;

    await conn.execute(
      `
      INSERT INTO staff_profiles (user_id, profile_image_url)
      VALUES (:b_user_id, :b_profile_image_url)
      ON CONFLICT (user_id)
      DO UPDATE SET
        profile_image_url = EXCLUDED.profile_image_url
      `,
      {
        b_user_id: userId,
        b_profile_image_url: imagePath
      },
      { autoCommit: true }
    );

    if (previousImagePath && previousImagePath !== imagePath) {
      deleteProfileImageFile(previousImagePath);
    }

    return res.json({
      message: "Profile image uploaded successfully",
      profileImageUrl: toPublicUrl(req, imagePath)
    });
  } catch (err) {
    console.error(err);
    safeUnlink(req.file && req.file.path);
    return res.status(500).json({ message: "Failed to upload profile image" });
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

exports.deleteMyProfileImage = async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;

  if (!staffRoles.has(role)) {
    return res.status(403).json({ message: "Only staff members can delete profile image" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const previousResult = await conn.execute(
      `
      SELECT profile_image_url
      FROM staff_profiles
      WHERE user_id = :b_user_id
      `,
      { b_user_id: userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const previousImagePath =
      previousResult.rows && previousResult.rows[0]
        ? previousResult.rows[0].PROFILE_IMAGE_URL
        : null;

    await conn.execute(
      `
      UPDATE staff_profiles
      SET profile_image_url = NULL
      WHERE user_id = :b_user_id
      `,
      { b_user_id: userId },
      { autoCommit: true }
    );

    if (previousImagePath) {
      deleteProfileImageFile(previousImagePath);
    }

    return res.json({ message: "Profile image removed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete profile image" });
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

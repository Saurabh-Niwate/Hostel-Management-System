const { oracledb } = require("../config/db");

exports.getMyProfile = async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can view this profile" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        u.user_id,
        u.student_id,
        u.email,
        r.role_name,
        s.full_name,
        s.phone,
        s.guardian_name,
        s.guardian_phone,
        s.address,
        s.room_no,
        TO_CHAR(s.created_at, 'YYYY-MM-DD HH24:MI:SS') AS profile_created_at
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      LEFT JOIN students s ON s.user_id = u.user_id
      WHERE u.user_id = :b_user_id
      `,
      { b_user_id: userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    return res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch student profile" });
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
  const userId = req.user.userId;
  const role = req.user.role;
  const { email, fullName, phone, guardianName, guardianPhone, address, roomNo } = req.body;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can update this profile" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const trimmedEmail = email ? email.trim().toLowerCase() : null;
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
      MERGE INTO students s
      USING (SELECT :b_user_id AS user_id FROM dual) src
      ON (s.user_id = src.user_id)
      WHEN MATCHED THEN
        UPDATE SET
          full_name = :b_full_name,
          phone = :b_phone,
          guardian_name = :b_guardian_name,
          guardian_phone = :b_guardian_phone,
          address = :b_address,
          room_no = :b_room_no
      WHEN NOT MATCHED THEN
        INSERT (
          user_id,
          full_name,
          phone,
          guardian_name,
          guardian_phone,
          address,
          room_no
        )
        VALUES (
          :b_user_id,
          :b_full_name,
          :b_phone,
          :b_guardian_name,
          :b_guardian_phone,
          :b_address,
          :b_room_no
        )
      `,
      {
        b_user_id: userId,
        b_full_name: fullName ? fullName.trim() : null,
        b_phone: phone ? phone.trim() : null,
        b_guardian_name: guardianName ? guardianName.trim() : null,
        b_guardian_phone: guardianPhone ? guardianPhone.trim() : null,
        b_address: address ? address.trim() : null,
        b_room_no: roomNo ? roomNo.trim() : null
      },
      { autoCommit: false }
    );

    await conn.commit();

    return res.json({ message: "Student profile updated successfully" });
  } catch (err) {
    console.error(err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    }
    return res.status(500).json({ message: "Failed to update student profile" });
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

exports.getMyAttendance = async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can view attendance" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        attendance_id,
        TO_CHAR(attendance_date, 'YYYY-MM-DD') AS attendance_date,
        status,
        remarks,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM attendance_records
      WHERE user_id = :b_user_id
      ORDER BY attendance_date DESC
      `,
      { b_user_id: userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({ attendance: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch attendance" });
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

exports.getMyFeeStatus = async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can view fee status" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        fee_id,
        term_name,
        amount_total,
        amount_paid,
        (amount_total - amount_paid) AS amount_due,
        TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
        status,
        TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
      FROM student_fees
      WHERE user_id = :b_user_id
      ORDER BY due_date DESC NULLS LAST, fee_id DESC
      `,
      { b_user_id: userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({ fees: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch fee status" });
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

exports.submitFeedback = async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;
  const { facilityArea, subject, message, rating } = req.body;
  const area = (facilityArea || subject || "").trim();

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can submit feedback" });
  }

  if (!area || !message || !message.trim()) {
    return res.status(400).json({ message: "facilityArea and message are required" });
  }

  const parsedRating = rating === undefined || rating === null ? null : Number(rating);
  if (parsedRating !== null && (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5)) {
    return res.status(400).json({ message: "rating must be between 1 and 5" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    await conn.execute(
      `
      INSERT INTO student_feedback (user_id, facility_area, message, rating)
      VALUES (:b_user_id, :b_facility_area, :b_message, :b_rating)
      `,
      {
        b_user_id: userId,
        b_facility_area: area,
        b_message: message.trim(),
        b_rating: parsedRating
      },
      { autoCommit: true }
    );

    return res.status(201).json({ message: "Feedback submitted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to submit feedback" });
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

exports.getMyFeedback = async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can view feedback" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        feedback_id,
        facility_area,
        message,
        rating,
        status,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM student_feedback
      WHERE user_id = :b_user_id
      ORDER BY created_at DESC
      `,
      { b_user_id: userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({ feedback: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch feedback" });
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

exports.getCanteenMenu = async (req, res) => {
  const role = req.user.role;
  const { date } = req.query;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can view canteen menu" });
  }

  const menuDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;

  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        menu_id,
        TO_CHAR(menu_date, 'YYYY-MM-DD') AS menu_date,
        meal_type,
        item_name,
        is_available,
        TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
      FROM canteen_menu
      WHERE (:b_menu_date IS NULL AND menu_date = TRUNC(SYSDATE))
         OR (:b_menu_date IS NOT NULL AND menu_date = TO_DATE(:b_menu_date, 'YYYY-MM-DD'))
      ORDER BY
        CASE meal_type
          WHEN 'Breakfast' THEN 1
          WHEN 'Lunch' THEN 2
          WHEN 'Snacks' THEN 3
          WHEN 'Dinner' THEN 4
          ELSE 5
        END,
        menu_id
      `,
      { b_menu_date: menuDate },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({ menu: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch canteen menu" });
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

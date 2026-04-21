const { oracledb } = require("../config/db");
const { syncOverdueFeeStatuses } = require("../utils/feeStatus");
const { toPublicUrl, deleteProfileImageFile, safeUnlink } = require("../utils/fileUtils");
const { withConnection, withTransaction } = require("../utils/dbUtils");
const { getStudentRoomState } = require("../utils/studentRoomAccess");
const { isValidImageSignature } = require("../middlewares/uploadMiddleware");

exports.getMyProfile = async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can view this profile" });
  }

  try {
    return await withConnection(async (conn) => {
      const result = await conn.execute(
      `
      SELECT
        u.user_id,
        u.student_id,
        u.email,
        r.role_name,
        s.full_name,
        s.phone,
        s.aadhar_no,
        s.guardian_name,
        s.guardian_email,
        s.guardian_phone,
        s.address,
        s.room_no,
        s.profile_image_url,
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

      result.rows[0].PROFILE_IMAGE_URL = toPublicUrl(req, result.rows[0].PROFILE_IMAGE_URL);
      return res.json({ profile: result.rows[0] });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch student profile" });
  }
};

exports.uploadMyProfileImage = async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can upload profile image" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

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
      FROM students
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
      MERGE INTO students s
      USING (SELECT :b_user_id AS user_id FROM dual) src
      ON (s.user_id = src.user_id)
      WHEN MATCHED THEN
        UPDATE SET profile_image_url = :b_profile_image_url
      WHEN NOT MATCHED THEN
        INSERT (user_id, profile_image_url)
        VALUES (:b_user_id, :b_profile_image_url)
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

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can delete profile image" });
  }

  try {
    return await withConnection(async (conn) => {
      const previousResult = await conn.execute(
      `
      SELECT profile_image_url
      FROM students
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
        UPDATE students
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
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to remove profile image" });
  }
};

exports.updateMyProfile = async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;
  const { email, fullName, phone, guardianName } = req.body;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can update this profile" });
  }

  try {
    return await withTransaction(async (conn) => {
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
            guardian_name = :b_guardian_name
        WHEN NOT MATCHED THEN
          INSERT (
            user_id,
            full_name,
            phone,
            guardian_name
          )
          VALUES (
            :b_user_id,
            :b_full_name,
            :b_phone,
            :b_guardian_name
          )
        `,
        {
          b_user_id: userId,
          b_full_name: fullName ? fullName.trim() : null,
          b_phone: phone ? phone.trim() : null,
          b_guardian_name: guardianName ? guardianName.trim() : null
        },
        { autoCommit: false }
      );

      return res.json({ message: "Student profile updated successfully" });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update student profile" });
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
    const roomState = await getStudentRoomState(conn, userId);
    if (!roomState.hasAssignedRoom) {
      return res.status(403).json({ message: "Attendance is available only after hostel room allocation" });
    }

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
    const roomState = await getStudentRoomState(conn, userId);
    if (!roomState.hasAssignedRoom) {
      return res.status(403).json({ message: "Fee status is available only after hostel room allocation" });
    }
    await syncOverdueFeeStatuses(conn);

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
    const roomState = await getStudentRoomState(conn, userId);
    if (!roomState.hasAssignedRoom) {
      return res.status(403).json({ message: "Feedback is available only after hostel room allocation" });
    }

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
    const roomState = await getStudentRoomState(conn, userId);
    if (!roomState.hasAssignedRoom) {
      return res.status(403).json({ message: "Feedback history is available only after hostel room allocation" });
    }

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

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can view canteen menu" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        menu_id,
        meal_type,
        item_name,
        is_available,
        TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
      FROM canteen_menu
      WHERE is_available = 1
        AND TRUNC(menu_date) = TRUNC(SYSDATE)
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
      {},
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

exports.getNearbyStaySuggestions = async (req, res) => {
  const role = req.user.role;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can view nearby stay suggestions" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const result = await conn.execute(
      `
      SELECT
        accommodation_id,
        name,
        accommodation_type,
        address,
        distance_km,
        contact_phone,
        contact_email,
        rent_min,
        rent_max,
        gender_allowed,
        availability_status,
        notes
      FROM external_accommodations
      WHERE availability_status IN ('Available', 'Limited')
      ORDER BY
        CASE availability_status
          WHEN 'Available' THEN 1
          ELSE 2
        END,
        NVL(distance_km, 999999),
        accommodation_id DESC
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({ accommodations: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch nearby stay suggestions" });
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

exports.getRoomAllocationStatus = async (req, res) => {
  const role = req.user.role;
  const userId = req.user.userId;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can view room allocation status" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const roomState = await getStudentRoomState(conn, userId);
    const vacancyResult = await conn.execute(
      `
      SELECT NVL(SUM(
        CASE
          WHEN NVL(r.is_active, 1) = 1 THEN
            GREATEST(
              NVL(r.capacity, 0) - (
                SELECT COUNT(*)
                FROM students s
                WHERE TRIM(s.room_no) = TRIM(r.room_no)
              ),
              0
            )
          ELSE 0
        END
      ), 0) AS total_vacancy
      FROM rooms r
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const requestResult = await conn.execute(
      `
      SELECT *
      FROM (
        SELECT
          request_id,
          status,
          assigned_room_no,
          remarks,
          TO_CHAR(requested_at, 'YYYY-MM-DD HH24:MI:SS') AS requested_at,
          TO_CHAR(reviewed_at, 'YYYY-MM-DD HH24:MI:SS') AS reviewed_at
        FROM room_allocation_requests
        WHERE user_id = :b_user_id
        ORDER BY requested_at DESC, request_id DESC
      )
      WHERE ROWNUM = 1
      `,
      { b_user_id: userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const latestRequest = requestResult.rows?.[0] || null;
    const totalVacancy = Number(vacancyResult.rows?.[0]?.TOTAL_VACANCY || 0);
    const hasPendingRequest = latestRequest?.STATUS === "Pending";

    return res.json({
      hasAssignedRoom: roomState.hasAssignedRoom,
      roomNo: roomState.roomNo || null,
      totalVacancy,
      hasPendingRequest,
      canRequestRoom: !roomState.hasAssignedRoom && totalVacancy > 0 && !hasPendingRequest,
      latestRequest
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch room allocation status" });
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

exports.createRoomAllocationRequest = async (req, res) => {
  const role = req.user.role;
  const userId = req.user.userId;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can request hostel room allocation" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const roomState = await getStudentRoomState(conn, userId);
    if (roomState.hasAssignedRoom) {
      return res.status(400).json({ message: "Hostel room is already assigned to this student" });
    }

    const lockedStudentResult = await conn.execute(
      `
      SELECT room_no
      FROM students
      WHERE user_id = :b_user_id
      FOR UPDATE
      `,
      { b_user_id: userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const lockedRoomNo = lockedStudentResult.rows?.[0]?.ROOM_NO ? String(lockedStudentResult.rows[0].ROOM_NO).trim() : "";
    if (lockedRoomNo) {
      return res.status(400).json({ message: "Hostel room is already assigned to this student" });
    }

    const existingPendingRequest = await conn.execute(
      `
      SELECT request_id
      FROM room_allocation_requests
      WHERE user_id = :b_user_id
        AND status = 'Pending'
      `,
      { b_user_id: userId }
    );

    if (existingPendingRequest.rows.length > 0) {
      return res.status(409).json({ message: "A room allocation request is already pending" });
    }

    const vacancyResult = await conn.execute(
      `
      SELECT NVL(SUM(
        CASE
          WHEN NVL(r.is_active, 1) = 1 THEN
            GREATEST(
              NVL(r.capacity, 0) - (
                SELECT COUNT(*)
                FROM students s
                WHERE TRIM(s.room_no) = TRIM(r.room_no)
              ),
              0
            )
          ELSE 0
        END
      ), 0) AS total_vacancy
      FROM rooms r
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const totalVacancy = Number(vacancyResult.rows?.[0]?.TOTAL_VACANCY || 0);
    if (totalVacancy <= 0) {
      return res.status(400).json({ message: "No hostel vacancy is available right now" });
    }

    const insertResult = await conn.execute(
      `
      INSERT INTO room_allocation_requests (user_id, status)
      VALUES (:b_user_id, 'Pending')
      RETURNING request_id INTO :b_request_id
      `,
      {
        b_user_id: userId,
        b_request_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: false }
    );

    await conn.commit();
    return res.status(201).json({
      message: "Room allocation request submitted successfully",
      requestId: insertResult.outBinds.b_request_id[0]
    });
  } catch (err) {
    console.error(err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    }
    return res.status(500).json({ message: "Failed to submit room allocation request" });
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

exports.getDinnerPollsForStudents = async (req, res) => {
  const role = req.user.role;
  const userId = req.user.userId;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can view dinner polls" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const pollsResult = await conn.execute(
      `
      SELECT
        p.poll_id,
        p.title,
        TO_CHAR(p.dinner_date, 'YYYY-MM-DD') AS dinner_date,
        TO_CHAR(p.closes_at, 'YYYY-MM-DD HH24:MI:SS') AS closes_at,
        CASE
          WHEN p.status = 'Closed' OR p.closes_at < SYSDATE THEN 'Closed'
          WHEN TRUNC(p.dinner_date) > TRUNC(SYSDATE) THEN 'Scheduled'
          ELSE 'Active'
        END AS poll_status
      FROM dinner_polls p
      ORDER BY p.dinner_date DESC, p.poll_id DESC
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const pollRows = pollsResult.rows || [];
    if (!pollRows.length) {
      return res.json({ polls: [] });
    }

    const pollIds = pollRows.map((row) => row.POLL_ID);
    const pollBinds = {};
    const pollPlaceholders = pollIds.map((id, index) => {
      const key = `b_poll_id_${index}`;
      pollBinds[key] = id;
      return `:${key}`;
    });

    const optionsResult = await conn.execute(
      `
      SELECT
        o.option_id,
        o.poll_id,
        o.option_name,
        o.description,
        o.display_order,
        (
          SELECT COUNT(*)
          FROM dinner_poll_votes v
          WHERE v.option_id = o.option_id
        ) AS vote_count
      FROM dinner_poll_options o
      WHERE o.poll_id IN (${pollPlaceholders.join(", ")})
      ORDER BY o.poll_id, o.display_order, o.option_id
      `,
      pollBinds,
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const votesResult = await conn.execute(
      `
      SELECT poll_id, option_id
      FROM dinner_poll_votes
      WHERE user_id = :b_user_id
        AND poll_id IN (${pollPlaceholders.join(", ")})
      `,
      {
        b_user_id: userId,
        ...pollBinds
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const myVoteMap = new Map((votesResult.rows || []).map((row) => [row.POLL_ID, row.OPTION_ID]));
    const optionRows = optionsResult.rows || [];
    const polls = pollRows.map((poll) => {
      const options = optionRows
        .filter((option) => option.POLL_ID === poll.POLL_ID)
        .map((option) => ({
          OPTION_ID: option.OPTION_ID,
          OPTION_NAME: option.OPTION_NAME,
          DESCRIPTION: option.DESCRIPTION,
          DISPLAY_ORDER: option.DISPLAY_ORDER,
          VOTE_COUNT: Number(option.VOTE_COUNT || 0)
        }));

      return {
        ...poll,
        MY_OPTION_ID: myVoteMap.get(poll.POLL_ID) || null,
        TOTAL_VOTES: options.reduce((sum, option) => sum + option.VOTE_COUNT, 0),
        OPTIONS: options
      };
    });

    return res.json({ polls });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch dinner polls" });
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

exports.voteDinnerPoll = async (req, res) => {
  const role = req.user.role;
  const userId = req.user.userId;
  const { pollId } = req.params;
  const { optionId } = req.body;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can vote in dinner polls" });
  }
  if (!pollId || Number.isNaN(Number(pollId)) || !optionId || Number.isNaN(Number(optionId))) {
    return res.status(400).json({ message: "Valid pollId and optionId are required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const pollResult = await conn.execute(
      `
      SELECT poll_id, status, closes_at
      FROM dinner_polls
      WHERE poll_id = :b_poll_id
      `,
      { b_poll_id: Number(pollId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!pollResult.rows.length) {
      return res.status(404).json({ message: "Dinner poll not found" });
    }

    const poll = pollResult.rows[0];
    if (poll.STATUS === "Closed" || new Date(poll.CLOSES_AT) < new Date()) {
      return res.status(400).json({ message: "This poll is already closed" });
    }

    const optionResult = await conn.execute(
      `
      SELECT option_id
      FROM dinner_poll_options
      WHERE option_id = :b_option_id
        AND poll_id = :b_poll_id
      `,
      {
        b_option_id: Number(optionId),
        b_poll_id: Number(pollId)
      }
    );

    if (!optionResult.rows.length) {
      return res.status(404).json({ message: "Selected option does not belong to this poll" });
    }

    await conn.execute(
      `
      MERGE INTO dinner_poll_votes v
      USING (
        SELECT :b_poll_id AS poll_id, :b_user_id AS user_id, :b_option_id AS option_id
        FROM dual
      ) src
      ON (v.poll_id = src.poll_id AND v.user_id = src.user_id)
      WHEN MATCHED THEN
        UPDATE SET
          v.option_id = src.option_id,
          v.voted_at = SYSDATE
      WHEN NOT MATCHED THEN
        INSERT (poll_id, option_id, user_id, voted_at)
        VALUES (src.poll_id, src.option_id, src.user_id, SYSDATE)
      `,
      {
        b_poll_id: Number(pollId),
        b_user_id: userId,
        b_option_id: Number(optionId)
      },
      { autoCommit: true }
    );

    return res.json({ message: "Vote submitted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to submit vote" });
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

const { oracledb } = require("../config/db");

const isValidIsoDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const allowedLeaveStatuses = new Set(["Pending", "Approved", "Rejected"]);
const allowedAttendanceStatuses = new Set(["Present", "Absent"]);
const allowedFeedbackStatuses = new Set(["Open", "In Review", "Closed"]);

const toPublicUrl = (req, value) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${req.protocol}://${req.get("host")}${value}`;
};

exports.getRooms = async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        r.room_no,
        r.block_name,
        r.floor_no,
        r.capacity,
        r.room_type,
        r.is_active,
        (
          SELECT COUNT(*)
          FROM students s
          WHERE TRIM(s.room_no) = TRIM(r.room_no)
        ) AS occupied
      FROM rooms r
      ORDER BY r.block_name, r.floor_no, r.room_no
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({ rooms: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch rooms" });
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

exports.getStudents = async (req, res) => {
  const { q, roomNo } = req.query;
  const normalizedQuery = q ? String(q).trim().toLowerCase() : null;
  const normalizedRoomNo = roomNo ? String(roomNo).trim() : null;

  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        u.user_id,
        u.student_id,
        u.email,
        s.full_name,
        s.phone,
        s.aadhar_no,
        s.guardian_name,
        s.guardian_phone,
        s.address,
        s.room_no,
        s.profile_image_url
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      LEFT JOIN students s ON s.user_id = u.user_id
      WHERE r.role_name = 'Student'
        AND (
          :b_query IS NULL
          OR LOWER(TRIM(u.student_id)) LIKE '%' || :b_query || '%'
          OR LOWER(TRIM(NVL(s.full_name, ''))) LIKE '%' || :b_query || '%'
          OR LOWER(TRIM(NVL(u.email, ''))) LIKE '%' || :b_query || '%'
        )
        AND (:b_room_no IS NULL OR TRIM(s.room_no) = :b_room_no)
      ORDER BY u.student_id
      `,
      {
        b_query: normalizedQuery,
        b_room_no: normalizedRoomNo
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const students = (result.rows || []).map((row) => ({
      ...row,
      PROFILE_IMAGE_URL: toPublicUrl(req, row.PROFILE_IMAGE_URL)
    }));

    return res.json({ students });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch students" });
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

exports.markAttendance = async (req, res) => {
  const { roomNo, attendanceDate, records } = req.body;

  if (!roomNo || !String(roomNo).trim()) {
    return res.status(400).json({ message: "roomNo is required" });
  }
  if (!attendanceDate || !isValidIsoDate(String(attendanceDate).trim())) {
    return res.status(400).json({ message: "attendanceDate must be YYYY-MM-DD" });
  }
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: "records must be a non-empty array" });
  }

  const normalizedRoomNo = String(roomNo).trim();
  const normalizedDate = String(attendanceDate).trim();
  const normalizedRecords = records.map((row) => ({
    studentId: row && row.studentId ? String(row.studentId).trim() : "",
    status: row && row.status ? String(row.status).trim() : "",
    remarks: row && row.remarks ? String(row.remarks).trim() : null
  }));

  for (const row of normalizedRecords) {
    if (!row.studentId) {
      return res.status(400).json({ message: "Each record requires studentId" });
    }
    if (!allowedAttendanceStatuses.has(row.status)) {
      return res.status(400).json({
        message: "Each record status must be Present or Absent"
      });
    }
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const roomCheck = await conn.execute(
      `
      SELECT room_no
      FROM rooms
      WHERE TRIM(room_no) = :b_room_no
      `,
      { b_room_no: normalizedRoomNo }
    );

    if (!roomCheck.rows || roomCheck.rows.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }

    const resultRows = [];

    for (const row of normalizedRecords) {
      const studentLookup = await conn.execute(
        `
        SELECT u.user_id, u.student_id
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        JOIN students s ON s.user_id = u.user_id
        WHERE r.role_name = 'Student'
          AND TRIM(u.student_id) = :b_student_id
          AND TRIM(s.room_no) = :b_room_no
        `,
        {
          b_student_id: row.studentId,
          b_room_no: normalizedRoomNo
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (!studentLookup.rows || studentLookup.rows.length === 0) {
        return res.status(400).json({
          message: `Student ${row.studentId} does not belong to room ${normalizedRoomNo}`
        });
      }

      const userId = Number(studentLookup.rows[0].USER_ID);
      const updateResult = await conn.execute(
        `
        UPDATE attendance_records
        SET status = :b_status,
            remarks = :b_remarks
        WHERE user_id = :b_user_id
          AND TRUNC(attendance_date) = TO_DATE(:b_attendance_date, 'YYYY-MM-DD')
        `,
        {
          b_status: row.status,
          b_remarks: row.remarks,
          b_user_id: userId,
          b_attendance_date: normalizedDate
        },
        { autoCommit: false }
      );

      if (!updateResult.rowsAffected) {
        await conn.execute(
          `
          INSERT INTO attendance_records (user_id, attendance_date, status, remarks)
          VALUES (
            :b_user_id,
            TO_DATE(:b_attendance_date, 'YYYY-MM-DD'),
            :b_status,
            :b_remarks
          )
          `,
          {
            b_user_id: userId,
            b_attendance_date: normalizedDate,
            b_status: row.status,
            b_remarks: row.remarks
          },
          { autoCommit: false }
        );
      }

      resultRows.push({
        studentId: studentLookup.rows[0].STUDENT_ID,
        status: row.status,
        remarks: row.remarks
      });
    }

    await conn.commit();
    return res.status(201).json({
      message: "Attendance marked successfully",
      roomNo: normalizedRoomNo,
      attendanceDate: normalizedDate,
      records: resultRows
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
    return res.status(500).json({ message: "Failed to mark attendance" });
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

exports.getRoomStudents = async (req, res) => {
  const { roomNo } = req.params;
  if (!roomNo || !String(roomNo).trim()) {
    return res.status(400).json({ message: "roomNo is required" });
  }

  const normalizedRoomNo = String(roomNo).trim();
  let conn;
  try {
    conn = await oracledb.getConnection();

    const roomResult = await conn.execute(
      `
      SELECT
        room_no,
        block_name,
        floor_no,
        capacity,
        room_type,
        is_active,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM rooms
      WHERE TRIM(room_no) = :b_room_no
      `,
      { b_room_no: normalizedRoomNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!roomResult.rows || roomResult.rows.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }

    const studentsResult = await conn.execute(
      `
      SELECT
        u.student_id,
        u.email,
        s.full_name,
        s.phone,
        s.guardian_name,
        s.guardian_phone,
        s.room_no
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      JOIN students s ON s.user_id = u.user_id
      WHERE r.role_name = 'Student'
        AND TRIM(s.room_no) = :b_room_no
      ORDER BY u.student_id
      `,
      { b_room_no: normalizedRoomNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const room = roomResult.rows[0];
    const students = studentsResult.rows || [];
    const capacity = Number(room.CAPACITY || 0);

    return res.json({
      room: {
        ...room,
        OCCUPIED: students.length,
        AVAILABLE: capacity > 0 ? Math.max(capacity - students.length, 0) : null
      },
      students
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch room students" });
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

exports.getAttendanceByDate = async (req, res) => {
  const { date } = req.params;
  const { roomNo } = req.query;

  if (!date || !isValidIsoDate(String(date).trim())) {
    return res.status(400).json({ message: "date must be YYYY-MM-DD" });
  }

  const normalizedDate = String(date).trim();
  const normalizedRoomNo = roomNo ? String(roomNo).trim() : null;

  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        ar.attendance_id,
        TO_CHAR(ar.attendance_date, 'YYYY-MM-DD') AS attendance_date,
        ar.status,
        ar.remarks,
        u.student_id,
        s.full_name,
        s.room_no
      FROM attendance_records ar
      JOIN users u ON u.user_id = ar.user_id
      JOIN roles r ON r.role_id = u.role_id
      LEFT JOIN students s ON s.user_id = u.user_id
      WHERE r.role_name = 'Student'
        AND TRUNC(ar.attendance_date) = TO_DATE(:b_attendance_date, 'YYYY-MM-DD')
        AND (:b_room_no IS NULL OR TRIM(s.room_no) = :b_room_no)
      ORDER BY s.room_no, u.student_id
      `,
      {
        b_attendance_date: normalizedDate,
        b_room_no: normalizedRoomNo
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({
      attendanceDate: normalizedDate,
      roomNo: normalizedRoomNo,
      attendance: result.rows || []
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch attendance by date" });
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

exports.getStudentBasic = async (req, res) => {
  const { studentId } = req.params;

  if (!studentId || !String(studentId).trim()) {
    return res.status(400).json({ message: "studentId is required" });
  }

  const normalizedStudentId = String(studentId).trim();
  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        u.student_id,
        u.email,
        s.full_name,
        s.phone,
        s.aadhar_no,
        s.guardian_name,
        s.guardian_phone,
        s.address,
        s.room_no,
        s.profile_image_url
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      LEFT JOIN students s ON s.user_id = u.user_id
      WHERE r.role_name = 'Student'
        AND TRIM(u.student_id) = :b_student_id
      `,
      { b_student_id: normalizedStudentId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    result.rows[0].PROFILE_IMAGE_URL = toPublicUrl(req, result.rows[0].PROFILE_IMAGE_URL);
    return res.json({ student: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch student basic details" });
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

exports.getLeaveStatus = async (req, res) => {
  const { roomNo, status } = req.query;

  if (status && !allowedLeaveStatuses.has(String(status).trim())) {
    return res.status(400).json({
      message: "status must be one of Pending, Approved, Rejected"
    });
  }

  const normalizedRoomNo = roomNo ? String(roomNo).trim() : null;
  const normalizedStatus = status ? String(status).trim() : null;

  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        lr.leave_id,
        u.student_id,
        s.full_name,
        s.room_no,
        lr.leave_type,
        TO_CHAR(lr.from_date, 'YYYY-MM-DD') AS from_date,
        TO_CHAR(lr.to_date, 'YYYY-MM-DD') AS to_date,
        lr.reason,
        lr.status,
        TO_CHAR(lr.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM leave_requests lr
      JOIN users u ON u.user_id = lr.user_id
      JOIN roles r ON r.role_id = u.role_id
      LEFT JOIN students s ON s.user_id = u.user_id
      WHERE r.role_name = 'Student'
        AND (:b_room_no IS NULL OR TRIM(s.room_no) = :b_room_no)
        AND (:b_status IS NULL OR lr.status = :b_status)
      ORDER BY lr.created_at DESC
      `,
      {
        b_room_no: normalizedRoomNo,
        b_status: normalizedStatus
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({
      roomNo: normalizedRoomNo,
      status: normalizedStatus,
      leaves: result.rows || []
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch leave status" });
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

exports.getFeedbackList = async (req, res) => {
  const { status, q } = req.query;

  if (status && !allowedFeedbackStatuses.has(String(status).trim())) {
    return res.status(400).json({
      message: "status must be one of Open, In Review, Closed"
    });
  }

  const normalizedStatus = status ? String(status).trim() : null;
  const normalizedQuery = q ? String(q).trim() : null;

  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        sf.feedback_id,
        u.student_id,
        s.full_name,
        s.room_no,
        sf.facility_area,
        sf.message,
        sf.rating,
        sf.status,
        TO_CHAR(sf.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM student_feedback sf
      JOIN users u ON u.user_id = sf.user_id
      JOIN roles r ON r.role_id = u.role_id
      LEFT JOIN students s ON s.user_id = u.user_id
      WHERE r.role_name = 'Student'
        AND (:b_status IS NULL OR sf.status = :b_status)
        AND (
          :b_query IS NULL
          OR UPPER(NVL(u.student_id, '')) LIKE '%' || UPPER(:b_query) || '%'
          OR UPPER(NVL(s.full_name, '')) LIKE '%' || UPPER(:b_query) || '%'
          OR UPPER(NVL(s.room_no, '')) LIKE '%' || UPPER(:b_query) || '%'
          OR UPPER(NVL(sf.facility_area, '')) LIKE '%' || UPPER(:b_query) || '%'
          OR UPPER(NVL(sf.message, '')) LIKE '%' || UPPER(:b_query) || '%'
        )
      ORDER BY sf.created_at DESC, sf.feedback_id DESC
      `,
      {
        b_status: normalizedStatus,
        b_query: normalizedQuery
      },
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

exports.updateFeedbackStatus = async (req, res) => {
  const { feedbackId } = req.params;
  const { status } = req.body;

  if (!feedbackId || Number.isNaN(Number(feedbackId))) {
    return res.status(400).json({ message: "Valid feedbackId is required" });
  }

  if (!status || !allowedFeedbackStatuses.has(String(status).trim())) {
    return res.status(400).json({
      message: "status must be one of Open, In Review, Closed"
    });
  }

  const normalizedStatus = String(status).trim();

  let conn;
  try {
    conn = await oracledb.getConnection();

    const existingResult = await conn.execute(
      `
      SELECT feedback_id
      FROM student_feedback
      WHERE feedback_id = :b_feedback_id
      `,
      { b_feedback_id: Number(feedbackId) }
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    await conn.execute(
      `
      UPDATE student_feedback
      SET status = :b_status
      WHERE feedback_id = :b_feedback_id
      `,
      {
        b_status: normalizedStatus,
        b_feedback_id: Number(feedbackId)
      },
      { autoCommit: true }
    );

    return res.json({ message: "Feedback status updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update feedback status" });
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

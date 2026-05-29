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

const getCurrentIndiaDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata"
  }).format(new Date());

const getStudentProfile = async (conn, studentId) => {
  const result = await conn.execute(
    `
    SELECT
      u.user_id,
      u.student_id,
      u.email,
      s.full_name,
      s.phone,
      s.room_no,
      s.guardian_name,
      s.guardian_email
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    LEFT JOIN students s ON s.user_id = u.user_id
    WHERE r.role_name = 'Student'
      AND TRIM(u.student_id) = :b_student_id
    `,
    { b_student_id: studentId },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  return result.rows && result.rows[0] ? result.rows[0] : null;
};

const getActiveApprovedLeave = async (conn, userId, refDate) => {
  const result = await conn.execute(
    `
    SELECT
      leave_id,
      leave_type,
      TO_CHAR(from_date, 'YYYY-MM-DD') AS from_date,
      TO_CHAR(to_date, 'YYYY-MM-DD') AS to_date,
      reason,
      status
    FROM leave_requests
    WHERE user_id = :b_user_id
      AND status = 'Approved'
      AND TO_DATE(:b_ref_date, 'YYYY-MM-DD') BETWEEN TRUNC(from_date) AND TRUNC(to_date)
    ORDER BY from_date DESC, leave_id DESC
    `,
    {
      b_user_id: userId,
      b_ref_date: refDate
    },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  return result.rows && result.rows[0] ? result.rows[0] : null;
};

const getOpenExitLog = async (conn, userId) => {
  const result = await conn.execute(
    `
    SELECT
      log_id,
      user_id,
      TO_CHAR(exit_time, 'YYYY-MM-DD HH24:MI:SS') AS exit_time,
      TO_CHAR(entry_time, 'YYYY-MM-DD HH24:MI:SS') AS entry_time,
      status,
      leave_id,
      exit_remarks,
      entry_remarks
    FROM entry_exit_logs
    WHERE user_id = :b_user_id
      AND status = 'OUT'
      AND entry_time IS NULL
    ORDER BY exit_time DESC, log_id DESC
    LIMIT 1
    `,
    { b_user_id: userId },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  return result.rows && result.rows[0] ? result.rows[0] : null;
};

exports.markExit = async (req, res) => {
  const { studentId, remarks } = req.body;
  const actorUserId = req.user.userId;

  if (!studentId || !String(studentId).trim()) {
    return res.status(400).json({ message: "studentId is required" });
  }

  const normalizedStudentId = String(studentId).trim();
  const normalizedRemarks = remarks ? String(remarks).trim() : null;
  const today = getCurrentIndiaDate();

  let conn;
  try {
    conn = await oracledb.getConnection();

    const student = await getStudentProfile(conn, normalizedStudentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const openLog = await getOpenExitLog(conn, Number(student.USER_ID));
    if (openLog) {
      return res.status(400).json({ message: "Student is already marked outside" });
    }

    const activeLeave = await getActiveApprovedLeave(conn, Number(student.USER_ID), today);
    const leaveId = activeLeave ? Number(activeLeave.LEAVE_ID) : null;

    await conn.execute(
      `
      INSERT INTO entry_exit_logs (
        user_id,
        exit_time,
        status,
        leave_id,
        exit_remarks,
        created_by,
        updated_by
      )
      VALUES (
        :b_user_id,
        CURRENT_TIMESTAMP,
        'OUT',
        :b_leave_id,
        :b_exit_remarks,
        :b_created_by,
        :b_updated_by
      )
      `,
      {
        b_user_id: Number(student.USER_ID),
        b_leave_id: leaveId,
        b_exit_remarks: normalizedRemarks,
        b_created_by: actorUserId,
        b_updated_by: actorUserId
      },
      { autoCommit: true }
    );

    // Asynchronously trigger guardian notification if on long leave
    if (activeLeave && student.GUARDIAN_EMAIL) {
      const { sendGuardianLeaveAlert } = require("../utils/notificationService");
      sendGuardianLeaveAlert({
        studentName: student.FULL_NAME,
        studentId: student.STUDENT_ID,
        guardianName: student.GUARDIAN_NAME,
        guardianEmail: student.GUARDIAN_EMAIL,
        type: "EXIT",
        details: {
          time: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
          leaveType: activeLeave.LEAVE_TYPE,
          fromDate: activeLeave.FROM_DATE,
          toDate: activeLeave.TO_DATE,
          reason: activeLeave.REASON,
          remarks: normalizedRemarks || "None"
        }
      }).catch(err => console.error("Error in background exit alert:", err));
    }

    return res.status(201).json({
      message: activeLeave
        ? "Student exit marked successfully (Long Leave Alert Triggered)"
        : "Student exit marked successfully (Daily Routine Exit)",
      student: {
        studentId: student.STUDENT_ID,
        fullName: student.FULL_NAME,
        roomNo: student.ROOM_NO
      },
      leave: activeLeave || null
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to mark exit" });
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

exports.markEntry = async (req, res) => {
  const { studentId, remarks } = req.body;
  const actorUserId = req.user.userId;

  if (!studentId || !String(studentId).trim()) {
    return res.status(400).json({ message: "studentId is required" });
  }

  const normalizedStudentId = String(studentId).trim();
  const normalizedRemarks = remarks ? String(remarks).trim() : null;

  let conn;
  try {
    conn = await oracledb.getConnection();

    const student = await getStudentProfile(conn, normalizedStudentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const openLog = await getOpenExitLog(conn, Number(student.USER_ID));
    if (!openLog) {
      return res.status(400).json({ message: "Student is not currently marked outside" });
    }

    await conn.execute(
      `
      UPDATE entry_exit_logs
      SET entry_time = CURRENT_TIMESTAMP,
          entry_remarks = :b_entry_remarks,
          status = 'IN',
          updated_by = :b_updated_by
      WHERE log_id = :b_log_id
      `,
      {
        b_entry_remarks: normalizedRemarks,
        b_updated_by: actorUserId,
        b_log_id: Number(openLog.LOG_ID)
      },
      { autoCommit: true }
    );

    // If it was a long leave exit, fetch details to trigger return notification to guardian
    let leaveDetails = null;
    if (openLog.LEAVE_ID && student.GUARDIAN_EMAIL) {
      const leaveResult = await conn.execute(
        `
        SELECT leave_type, reason, TO_CHAR(from_date, 'YYYY-MM-DD') AS from_date, TO_CHAR(to_date, 'YYYY-MM-DD') AS to_date
        FROM leave_requests
        WHERE leave_id = :b_leave_id
        `,
        { b_leave_id: Number(openLog.LEAVE_ID) },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      leaveDetails = leaveResult.rows && leaveResult.rows[0] ? leaveResult.rows[0] : null;

      if (leaveDetails) {
        const { sendGuardianLeaveAlert } = require("../utils/notificationService");
        sendGuardianLeaveAlert({
          studentName: student.FULL_NAME,
          studentId: student.STUDENT_ID,
          guardianName: student.GUARDIAN_NAME,
          guardianEmail: student.GUARDIAN_EMAIL,
          type: "ENTRY",
          details: {
            time: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
            leaveType: leaveDetails.LEAVE_TYPE,
            fromDate: leaveDetails.FROM_DATE,
            toDate: leaveDetails.TO_DATE,
            reason: leaveDetails.REASON,
            remarks: normalizedRemarks || "None"
          }
        }).catch(err => console.error("Error in background entry alert:", err));
      }
    }

    return res.json({
      message: leaveDetails
        ? "Student entry marked successfully (Long Leave Return Alert Triggered)"
        : "Student entry marked successfully (Daily Routine Return)",
      student: {
        studentId: student.STUDENT_ID,
        fullName: student.FULL_NAME,
        roomNo: student.ROOM_NO
      },
      logId: Number(openLog.LOG_ID)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to mark entry" });
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

exports.getTodayLogs = async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        eel.log_id,
        u.student_id,
        s.full_name,
        s.room_no,
        TO_CHAR(eel.exit_time, 'YYYY-MM-DD HH24:MI:SS') AS exit_time,
        TO_CHAR(eel.entry_time, 'YYYY-MM-DD HH24:MI:SS') AS entry_time,
        eel.status,
        eel.exit_remarks,
        eel.entry_remarks,
        eel.leave_id
      FROM entry_exit_logs eel
      JOIN users u ON u.user_id = eel.user_id
      LEFT JOIN students s ON s.user_id = eel.user_id
      WHERE TRUNC(eel.exit_time) = TRUNC(SYSDATE)
         OR (eel.entry_time IS NOT NULL AND TRUNC(eel.entry_time) = TRUNC(SYSDATE))
      ORDER BY eel.exit_time DESC, eel.log_id DESC
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({ logs: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch today's logs" });
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

exports.getStudentsOutside = async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        eel.log_id,
        u.student_id,
        s.full_name,
        s.room_no,
        TO_CHAR(eel.exit_time, 'YYYY-MM-DD HH24:MI:SS') AS exit_time,
        eel.exit_remarks,
        eel.leave_id
      FROM entry_exit_logs eel
      JOIN users u ON u.user_id = eel.user_id
      LEFT JOIN students s ON s.user_id = eel.user_id
      WHERE eel.status = 'OUT'
        AND eel.entry_time IS NULL
      ORDER BY eel.exit_time DESC, eel.log_id DESC
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({ studentsOutside: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch students outside" });
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

exports.getStudentStatus = async (req, res) => {
  const { studentId } = req.params;
  const { date } = req.query;

  if (!studentId || !String(studentId).trim()) {
    return res.status(400).json({ message: "studentId is required" });
  }
  if (date && !isValidIsoDate(String(date).trim())) {
    return res.status(400).json({ message: "date must be YYYY-MM-DD" });
  }

  const normalizedStudentId = String(studentId).trim();
  const referenceDate = date ? String(date).trim() : getCurrentIndiaDate();

  let conn;
  try {
    conn = await oracledb.getConnection();

    const student = await getStudentProfile(conn, normalizedStudentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const activeLeave = await getActiveApprovedLeave(conn, Number(student.USER_ID), referenceDate);
    const openLog = await getOpenExitLog(conn, Number(student.USER_ID));

    return res.json({
      student: {
        studentId: student.STUDENT_ID,
        fullName: student.FULL_NAME,
        roomNo: student.ROOM_NO,
        phone: student.PHONE,
        email: student.EMAIL
      },
      referenceDate,
      currentGateStatus: openLog ? "OUTSIDE" : "INSIDE",
      activeLeave,
      openLog
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch student status" });
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

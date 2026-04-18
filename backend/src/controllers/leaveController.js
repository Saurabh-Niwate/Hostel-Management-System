const { oracledb } = require("../config/db");
const { getStudentRoomState } = require("../utils/studentRoomAccess");

exports.applyLeave = async (req, res) => {
  const { leaveType, fromDate, toDate, reason } = req.body;
  const userId = req.user.userId;
  const role = req.user.role;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can apply for leave" });
  }

  if (!leaveType || !leaveType.trim() || !fromDate || !toDate || !reason || !reason.trim()) {
    return res.status(400).json({ message: "leaveType, fromDate, toDate and reason are required" });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(fromDate) || !dateRegex.test(toDate)) {
    return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
  }

  if (fromDate > toDate) {
    return res.status(400).json({ message: "fromDate cannot be after toDate" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const roomState = await getStudentRoomState(conn, userId);
    if (!roomState.hasAssignedRoom) {
      return res.status(403).json({ message: "Leave requests are available only after hostel room allocation" });
    }

    await conn.execute(
      `
      INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, reason)
      VALUES (:b_user_id,
              :b_leave_type,
              TO_DATE(:b_from_date, 'YYYY-MM-DD'),
              TO_DATE(:b_to_date, 'YYYY-MM-DD'),
              :b_reason)
      `,
      {
        b_user_id: userId,
        b_leave_type: leaveType.trim(),
        b_from_date: fromDate,
        b_to_date: toDate,
        b_reason: reason.trim()
      },
      { autoCommit: true }
    );

    res.json({ message: "Leave request submitted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Leave failed" });
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

exports.getMyLeaves = async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can view their leaves" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const roomState = await getStudentRoomState(conn, userId);
    if (!roomState.hasAssignedRoom) {
      return res.status(403).json({ message: "Leave history is available only after hostel room allocation" });
    }

    const result = await conn.execute(
      `
      SELECT
        leave_id,
        leave_type,
        TO_CHAR(from_date, 'YYYY-MM-DD') AS from_date,
        TO_CHAR(to_date, 'YYYY-MM-DD') AS to_date,
        reason,
        status,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM leave_requests
      WHERE user_id = :b_user_id
      ORDER BY created_at DESC
      `,
      { b_user_id: userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({ leaves: result.rows || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to fetch leave history" });
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

exports.getMyLeaveById = async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;
  const { leaveId } = req.params;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can view their leaves" });
  }

  if (!leaveId || Number.isNaN(Number(leaveId))) {
    return res.status(400).json({ message: "Valid leaveId is required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const roomState = await getStudentRoomState(conn, userId);
    if (!roomState.hasAssignedRoom) {
      return res.status(403).json({ message: "Leave details are available only after hostel room allocation" });
    }

    const result = await conn.execute(
      `
      SELECT
        leave_id,
        leave_type,
        TO_CHAR(from_date, 'YYYY-MM-DD') AS from_date,
        TO_CHAR(to_date, 'YYYY-MM-DD') AS to_date,
        reason,
        status,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM leave_requests
      WHERE leave_id = :b_leave_id
        AND user_id = :b_user_id
      `,
      {
        b_leave_id: Number(leaveId),
        b_user_id: userId
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    return res.json({ leave: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unable to fetch leave request" });
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

exports.deleteMyPendingLeave = async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;
  const { leaveId } = req.params;

  if (role !== "Student") {
    return res.status(403).json({ message: "Only students can cancel their leaves" });
  }

  if (!leaveId || Number.isNaN(Number(leaveId))) {
    return res.status(400).json({ message: "Valid leaveId is required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const roomState = await getStudentRoomState(conn, userId);
    if (!roomState.hasAssignedRoom) {
      return res.status(403).json({ message: "Leave cancellation is available only after hostel room allocation" });
    }

    const leaveCheck = await conn.execute(
      `
      SELECT status
      FROM leave_requests
      WHERE leave_id = :b_leave_id
        AND user_id = :b_user_id
      `,
      {
        b_leave_id: Number(leaveId),
        b_user_id: userId
      }
    );

    if (!leaveCheck.rows || leaveCheck.rows.length === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leaveCheck.rows[0][0] !== "Pending") {
      return res.status(400).json({ message: "Only pending leave can be canceled" });
    }

    await conn.execute(
      `
      DELETE FROM leave_requests
      WHERE leave_id = :b_leave_id
        AND user_id = :b_user_id
      `,
      {
        b_leave_id: Number(leaveId),
        b_user_id: userId
      },
      { autoCommit: true }
    );

    return res.json({ message: "Pending leave request canceled successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unable to cancel leave request" });
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

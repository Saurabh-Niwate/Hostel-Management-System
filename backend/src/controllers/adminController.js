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

exports.getAllLeaves = async (req, res) => {
  const { status, q } = req.query;

  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        lr.leave_id,
        lr.user_id,
        u.student_id,
        TO_CHAR(lr.from_date, 'YYYY-MM-DD') AS from_date,
        TO_CHAR(lr.to_date, 'YYYY-MM-DD') AS to_date,
        lr.reason,
        lr.status,
        TO_CHAR(lr.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
        lr.reviewed_by,
        TO_CHAR(lr.reviewed_at, 'YYYY-MM-DD HH24:MI:SS') AS reviewed_at,
        lr.remarks
      FROM leave_requests lr
      JOIN users u ON u.user_id = lr.user_id
      WHERE (:b_status IS NULL OR lr.status = :b_status)
        AND (
          :b_query IS NULL
          OR UPPER(NVL(u.student_id, '')) LIKE '%' || UPPER(:b_query) || '%'
          OR UPPER(NVL(lr.reason, '')) LIKE '%' || UPPER(:b_query) || '%'
        )
      ORDER BY lr.created_at DESC
      `,
      {
        b_status: status ? status.trim() : null,
        b_query: q ? q.trim() : null
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({ leaves: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch leave requests" });
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

exports.getStudentLeaves = async (req, res) => {
  const { studentId } = req.params;

  if (!studentId || !studentId.trim()) {
    return res.status(400).json({ message: "studentId is required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `
      SELECT
        lr.leave_id,
        lr.user_id,
        u.student_id,
        TO_CHAR(lr.from_date, 'YYYY-MM-DD') AS from_date,
        TO_CHAR(lr.to_date, 'YYYY-MM-DD') AS to_date,
        lr.reason,
        lr.status,
        TO_CHAR(lr.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
        lr.reviewed_by,
        TO_CHAR(lr.reviewed_at, 'YYYY-MM-DD HH24:MI:SS') AS reviewed_at,
        lr.remarks
      FROM leave_requests lr
      JOIN users u ON u.user_id = lr.user_id
      WHERE TRIM(u.student_id) = :b_student_id
      ORDER BY lr.created_at DESC
      `,
      { b_student_id: studentId.trim() },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({ leaves: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch student leave history" });
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

exports.approveLeave = async (req, res) => {
  const { leaveId } = req.params;
  const { remarks } = req.body;
  const reviewerId = req.user.userId;

  if (!leaveId || Number.isNaN(Number(leaveId))) {
    return res.status(400).json({ message: "Valid leaveId is required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const leaveResult = await conn.execute(
      `
      SELECT status
      FROM leave_requests
      WHERE leave_id = :b_leave_id
      `,
      { b_leave_id: Number(leaveId) }
    );

    if (leaveResult.rows.length === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leaveResult.rows[0][0] !== "Pending") {
      return res.status(400).json({ message: "Only pending leave can be approved" });
    }

    await conn.execute(
      `
      UPDATE leave_requests
      SET status = 'Approved',
          reviewed_by = :b_reviewer_id,
          reviewed_at = SYSDATE,
          remarks = :b_remarks
      WHERE leave_id = :b_leave_id
      `,
      {
        b_reviewer_id: reviewerId,
        b_remarks: remarks ? remarks.trim() : null,
        b_leave_id: Number(leaveId)
      },
      { autoCommit: true }
    );

    return res.json({ message: "Leave approved successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to approve leave" });
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

exports.rejectLeave = async (req, res) => {
  const { leaveId } = req.params;
  const { remarks } = req.body;
  const reviewerId = req.user.userId;

  if (!leaveId || Number.isNaN(Number(leaveId))) {
    return res.status(400).json({ message: "Valid leaveId is required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const leaveResult = await conn.execute(
      `
      SELECT status
      FROM leave_requests
      WHERE leave_id = :b_leave_id
      `,
      { b_leave_id: Number(leaveId) }
    );

    if (leaveResult.rows.length === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leaveResult.rows[0][0] !== "Pending") {
      return res.status(400).json({ message: "Only pending leave can be rejected" });
    }

    await conn.execute(
      `
      UPDATE leave_requests
      SET status = 'Rejected',
          reviewed_by = :b_reviewer_id,
          reviewed_at = SYSDATE,
          remarks = :b_remarks
      WHERE leave_id = :b_leave_id
      `,
      {
        b_reviewer_id: reviewerId,
        b_remarks: remarks ? remarks.trim() : null,
        b_leave_id: Number(leaveId)
      },
      { autoCommit: true }
    );

    return res.json({ message: "Leave rejected successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to reject leave" });
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

exports.getOverviewReport = async (req, res) => {
  const { dateFrom, dateTo } = req.query;

  if (dateFrom && !isValidIsoDate(dateFrom.trim())) {
    return res.status(400).json({ message: "dateFrom must be a valid YYYY-MM-DD date" });
  }
  if (dateTo && !isValidIsoDate(dateTo.trim())) {
    return res.status(400).json({ message: "dateTo must be a valid YYYY-MM-DD date" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const dateFilter = `
      (:b_date_from IS NULL OR created_at >= TO_DATE(:b_date_from, 'YYYY-MM-DD'))
      AND (:b_date_to IS NULL OR created_at < TO_DATE(:b_date_to, 'YYYY-MM-DD') + 1)
    `;

    const leaveCounts = await conn.execute(
      `
      SELECT status, COUNT(*) AS total
      FROM leave_requests
      WHERE ${dateFilter}
      GROUP BY status
      `,
      {
        b_date_from: dateFrom ? dateFrom.trim() : null,
        b_date_to: dateTo ? dateTo.trim() : null
      }
    );

    const attendanceCounts = await conn.execute(
      `
      SELECT status, COUNT(*) AS total
      FROM attendance_records
      WHERE ${dateFilter}
      GROUP BY status
      `,
      {
        b_date_from: dateFrom ? dateFrom.trim() : null,
        b_date_to: dateTo ? dateTo.trim() : null
      }
    );

    const feeCounts = await conn.execute(
      `
      SELECT status, COUNT(*) AS total
      FROM student_fees
      WHERE (:b_date_from IS NULL OR updated_at >= TO_DATE(:b_date_from, 'YYYY-MM-DD'))
        AND (:b_date_to IS NULL OR updated_at < TO_DATE(:b_date_to, 'YYYY-MM-DD') + 1)
      GROUP BY status
      `,
      {
        b_date_from: dateFrom ? dateFrom.trim() : null,
        b_date_to: dateTo ? dateTo.trim() : null
      }
    );

    const feedbackCounts = await conn.execute(
      `
      SELECT status, COUNT(*) AS total
      FROM student_feedback
      WHERE ${dateFilter}
      GROUP BY status
      `,
      {
        b_date_from: dateFrom ? dateFrom.trim() : null,
        b_date_to: dateTo ? dateTo.trim() : null
      }
    );

    const revenueSummary = await conn.execute(
      `
      SELECT
        NVL(SUM(amount_total), 0) AS total_fee_amount,
        NVL(SUM(amount_paid), 0) AS total_paid_amount,
        NVL(SUM(amount_total - amount_paid), 0) AS total_due_amount
      FROM student_fees
      WHERE (:b_date_from IS NULL OR updated_at >= TO_DATE(:b_date_from, 'YYYY-MM-DD'))
        AND (:b_date_to IS NULL OR updated_at < TO_DATE(:b_date_to, 'YYYY-MM-DD') + 1)
      `,
      {
        b_date_from: dateFrom ? dateFrom.trim() : null,
        b_date_to: dateTo ? dateTo.trim() : null
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({
      range: {
        dateFrom: dateFrom || null,
        dateTo: dateTo || null
      },
      leaveSummary: leaveCounts.rows || [],
      attendanceSummary: attendanceCounts.rows || [],
      feeSummary: feeCounts.rows || [],
      feedbackSummary: feedbackCounts.rows || [],
      feeTotals: (revenueSummary.rows && revenueSummary.rows[0]) || {
        TOTAL_FEE_AMOUNT: 0,
        TOTAL_PAID_AMOUNT: 0,
        TOTAL_DUE_AMOUNT: 0
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch overview report" });
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

exports.getAttendanceSummary = async (req, res) => {
  const { dateFrom, dateTo, groupBy } = req.query;

  if (dateFrom && !isValidIsoDate(dateFrom.trim())) {
    return res.status(400).json({ message: "dateFrom must be a valid YYYY-MM-DD date" });
  }
  if (dateTo && !isValidIsoDate(dateTo.trim())) {
    return res.status(400).json({ message: "dateTo must be a valid YYYY-MM-DD date" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const safeGroupBy = groupBy === "student" ? "student" : "date";

    if (safeGroupBy === "student") {
      const byStudent = await conn.execute(
        `
        SELECT
          u.student_id,
          ar.status,
          COUNT(*) AS total
        FROM attendance_records ar
        JOIN users u ON u.user_id = ar.user_id
        WHERE (:b_date_from IS NULL OR ar.attendance_date >= TO_DATE(:b_date_from, 'YYYY-MM-DD'))
          AND (:b_date_to IS NULL OR ar.attendance_date < TO_DATE(:b_date_to, 'YYYY-MM-DD') + 1)
        GROUP BY u.student_id, ar.status
        ORDER BY u.student_id, ar.status
        `,
        {
          b_date_from: dateFrom ? dateFrom.trim() : null,
          b_date_to: dateTo ? dateTo.trim() : null
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      return res.json({
        groupBy: "student",
        range: {
          dateFrom: dateFrom || null,
          dateTo: dateTo || null
        },
        summary: byStudent.rows || []
      });
    }

    const byDate = await conn.execute(
      `
      SELECT
        TO_CHAR(ar.attendance_date, 'YYYY-MM-DD') AS attendance_date,
        ar.status,
        COUNT(*) AS total
      FROM attendance_records ar
      WHERE (:b_date_from IS NULL OR ar.attendance_date >= TO_DATE(:b_date_from, 'YYYY-MM-DD'))
        AND (:b_date_to IS NULL OR ar.attendance_date < TO_DATE(:b_date_to, 'YYYY-MM-DD') + 1)
      GROUP BY TO_CHAR(ar.attendance_date, 'YYYY-MM-DD'), ar.status
      ORDER BY attendance_date, ar.status
      `,
      {
        b_date_from: dateFrom ? dateFrom.trim() : null,
        b_date_to: dateTo ? dateTo.trim() : null
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({
      groupBy: "date",
      range: {
        dateFrom: dateFrom || null,
        dateTo: dateTo || null
      },
      summary: byDate.rows || []
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch attendance summary" });
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

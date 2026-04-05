const { oracledb } = require("../config/db");
const { syncOverdueFeeStatuses } = require("../utils/feeStatus");

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
    await syncOverdueFeeStatuses(conn);

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
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
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
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
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
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
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
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
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

    const pendingFeeStudents = await conn.execute(
      `
      SELECT
        u.student_id,
        sf.term_name,
        sf.amount_total,
        sf.amount_paid,
        (sf.amount_total - sf.amount_paid) AS amount_due,
        TO_CHAR(sf.due_date, 'YYYY-MM-DD') AS due_date,
        sf.status
      FROM student_fees sf
      JOIN users u ON u.user_id = sf.user_id
      WHERE (sf.amount_total - sf.amount_paid) > 0
        AND (:b_date_from IS NULL OR sf.updated_at >= TO_DATE(:b_date_from, 'YYYY-MM-DD'))
        AND (:b_date_to IS NULL OR sf.updated_at < TO_DATE(:b_date_to, 'YYYY-MM-DD') + 1)
      ORDER BY amount_due DESC, sf.updated_at DESC
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
      },
      pendingFeeStudents: pendingFeeStudents.rows || []
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

const toPublicUrl = (req, value) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${req.protocol}://${req.get("host")}${value}`;
};

exports.getStudentDetails = async (req, res) => {
  const { studentId } = req.params;

  if (!studentId || !studentId.trim()) {
    return res.status(400).json({ message: "studentId is required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    await syncOverdueFeeStatuses(conn);

    const profileResult = await conn.execute(
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
      WHERE TRIM(u.student_id) = :b_student_id
        AND r.role_name = 'Student'
      `,
      { b_student_id: studentId.trim() },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!profileResult.rows || profileResult.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const profile = profileResult.rows[0];
    profile.PROFILE_IMAGE_URL = toPublicUrl(req, profile.PROFILE_IMAGE_URL);
    const userId = profile.USER_ID;

    const attendanceResult = await conn.execute(
      `
      SELECT
        attendance_id,
        TO_CHAR(attendance_date, 'YYYY-MM-DD') AS attendance_date,
        status,
        remarks,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM attendance_records
      WHERE user_id = :b_user_id
      ORDER BY attendance_date DESC, attendance_id DESC
      `,
      { b_user_id: userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const feesResult = await conn.execute(
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

    const fees = feesResult.rows || [];
    const attendance = attendanceResult.rows || [];

    const feeSummary = fees.reduce(
      (acc, row) => {
        const status = String(row.STATUS || "");
        if (status === "Paid") acc.paidCount += 1;
        else acc.pendingCount += 1;
        acc.totalDue += Number(row.AMOUNT_DUE || 0);
        return acc;
      },
      { paidCount: 0, pendingCount: 0, totalDue: 0 }
    );

    const attendanceSummary = attendance.reduce(
      (acc, row) => {
        const status = String(row.STATUS || "");
        if (status === "Present") acc.present += 1;
        else if (status === "Absent") acc.absent += 1;
        else if (status === "Late") acc.late += 1;
        return acc;
      },
      { present: 0, absent: 0, late: 0 }
    );

    return res.json({
      profile,
      attendance,
      fees,
      attendanceSummary: {
        ...attendanceSummary,
        total: attendance.length
      },
      feeSummary
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch student details" });
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

exports.getAllStudents = async (req, res) => {
  const { q } = req.query;
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
        s.room_no,
        s.profile_image_url
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      LEFT JOIN students s ON s.user_id = u.user_id
      WHERE r.role_name = 'Student'
        AND (
          :b_query IS NULL
          OR UPPER(NVL(u.student_id, '')) LIKE '%' || UPPER(:b_query) || '%'
          OR UPPER(NVL(u.email, '')) LIKE '%' || UPPER(:b_query) || '%'
          OR UPPER(NVL(s.full_name, '')) LIKE '%' || UPPER(:b_query) || '%'
          OR UPPER(NVL(s.room_no, '')) LIKE '%' || UPPER(:b_query) || '%'
        )
      ORDER BY u.user_id
      `,
      {
        b_query: q ? q.trim() : null
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
    return res.status(500).json({ message: "Failed to fetch students list" });
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

const { oracledb } = require("../config/db");
const bcrypt = require("bcrypt");

const insertSystemLog = async (
  conn,
  { actorUserId, actorRole, action, entityType, entityId, details }
) => {
  await conn.execute(
    `
    INSERT INTO system_logs (
      actor_user_id,
      actor_role,
      action,
      entity_type,
      entity_id,
      details
    )
    VALUES (
      :b_actor_user_id,
      :b_actor_role,
      :b_action,
      :b_entity_type,
      :b_entity_id,
      :b_details
    )
    `,
    {
      b_actor_user_id: actorUserId,
      b_actor_role: actorRole,
      b_action: action,
      b_entity_type: entityType || null,
      b_entity_id: entityId || null,
      b_details: details || null
    },
    { autoCommit: false }
  );
};

exports.createStudent = async (req, res) => {
  const {
    studentId,
    email,
    password,
    fullName,
    phone,
    guardianName,
    guardianPhone,
    address,
    roomNo
  } = req.body;

  if (!studentId || !password) {
    return res.status(400).json({ message: "studentId and password are required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const duplicateCheck = await conn.execute(
      `
      SELECT user_id
      FROM users
      WHERE TRIM(student_id) = :b_student_id
         OR (:b_email IS NOT NULL AND LOWER(TRIM(email)) = :b_email)
      `,
      {
        b_student_id: studentId.trim(),
        b_email: email ? email.trim().toLowerCase() : null
      }
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ message: "Student ID already exists" });
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim().toLowerCase())) {
        return res.status(400).json({ message: "Invalid email format" });
      }
    }

    const roleResult = await conn.execute(
      `
      SELECT role_id
      FROM roles
      WHERE role_name = :b_role_name
      `,
      { b_role_name: "Student" }
    );

    if (roleResult.rows.length === 0) {
      return res.status(500).json({ message: "Student role not found in roles table" });
    }

    const studentRoleId = roleResult.rows[0][0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await conn.execute(
      `
      INSERT INTO users (student_id, email, password, role_id)
      VALUES (:b_student_id, :b_email, :b_password, :b_role_id)
      `,
      {
        b_student_id: studentId.trim(),
        b_email: email ? email.trim().toLowerCase() : null,
        b_password: hashedPassword,
        b_role_id: studentRoleId
      },
      { autoCommit: false }
    );

    const createdUserResult = await conn.execute(
      `
      SELECT user_id
      FROM users
      WHERE TRIM(student_id) = :b_student_id
      `,
      { b_student_id: studentId.trim() }
    );

    const createdUserId = createdUserResult.rows[0][0];

    await conn.execute(
      `
      INSERT INTO students (
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
        b_user_id: createdUserId,
        b_full_name: fullName ? fullName.trim() : null,
        b_phone: phone ? phone.trim() : null,
        b_guardian_name: guardianName ? guardianName.trim() : null,
        b_guardian_phone: guardianPhone ? guardianPhone.trim() : null,
        b_address: address ? address.trim() : null,
        b_room_no: roomNo ? roomNo.trim() : null
      },
      { autoCommit: false }
    );

    await insertSystemLog(conn, {
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "CREATE_STUDENT",
      entityType: "USER",
      entityId: createdUserId,
      details: `studentId=${studentId.trim()}`
    });

    await conn.commit();

    return res.status(201).json({
      message: "Student account created successfully",
      userId: createdUserId
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
    return res.status(500).json({ message: "Failed to create student account" });
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

exports.createStaff = async (req, res) => {
  const { empId, email, password, roleName } = req.body;

  if (!empId || !password || !roleName) {
    return res.status(400).json({ message: "empId, password and roleName are required" });
  }

  if (roleName === "Student") {
    return res.status(400).json({ message: "Use create-student endpoint for students" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const duplicateCheck = await conn.execute(
      `
      SELECT user_id
      FROM users
      WHERE TRIM(emp_id) = :b_emp_id
         OR (:b_email IS NOT NULL AND TRIM(email) = :b_email)
      `,
      {
        b_emp_id: empId.trim(),
        b_email: email ? email.trim() : null
      }
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ message: "Employee ID or email already exists" });
    }

    const roleResult = await conn.execute(
      `
      SELECT role_id
      FROM roles
      WHERE role_name = :b_role_name
      `,
      { b_role_name: roleName.trim() }
    );

    if (roleResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid roleName" });
    }

    const targetRoleId = roleResult.rows[0][0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await conn.execute(
      `
      INSERT INTO users (emp_id, email, password, role_id)
      VALUES (:b_emp_id, :b_email, :b_password, :b_role_id)
      `,
      {
        b_emp_id: empId.trim(),
        b_email: email ? email.trim() : null,
        b_password: hashedPassword,
        b_role_id: targetRoleId
      },
      { autoCommit: false }
    );

    const createdUserResult = await conn.execute(
      `
      SELECT user_id
      FROM users
      WHERE TRIM(emp_id) = :b_emp_id
      `,
      { b_emp_id: empId.trim() }
    );

    const createdUserId = createdUserResult.rows[0][0];

    await insertSystemLog(conn, {
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "CREATE_STAFF",
      entityType: "USER",
      entityId: createdUserId,
      details: `empId=${empId.trim()}, roleName=${roleName.trim()}`
    });

    await conn.commit();

    return res.status(201).json({
      message: "Staff account created successfully",
      userId: createdUserId
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
    return res.status(500).json({ message: "Failed to create staff account" });
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

exports.getRoles = async (_req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection();
    const result = await conn.execute(
      `
      SELECT role_id, role_name
      FROM roles
      ORDER BY role_id
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return res.json({ roles: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch roles" });
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

exports.updateUserRole = async (req, res) => {
  const { userId } = req.params;
  const { roleName } = req.body;
  const requesterUserId = req.user.userId;

  if (!userId || Number.isNaN(Number(userId))) {
    return res.status(400).json({ message: "Valid userId param is required" });
  }
  if (!roleName || !roleName.trim()) {
    return res.status(400).json({ message: "roleName is required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const roleResult = await conn.execute(
      `
      SELECT role_id
      FROM roles
      WHERE role_name = :b_role_name
      `,
      { b_role_name: roleName.trim() }
    );
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid roleName" });
    }

    const targetRoleId = roleResult.rows[0][0];
    const userResult = await conn.execute(
      `
      SELECT user_id
      FROM users
      WHERE user_id = :b_user_id
      `,
      { b_user_id: Number(userId) }
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    if (Number(userId) === requesterUserId) {
      return res.status(400).json({ message: "You cannot update your own role" });
    }

    await conn.execute(
      `
      UPDATE users
      SET role_id = :b_role_id
      WHERE user_id = :b_user_id
      `,
      {
        b_role_id: targetRoleId,
        b_user_id: Number(userId)
      },
      { autoCommit: false }
    );

    await insertSystemLog(conn, {
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "UPDATE_USER_ROLE",
      entityType: "USER",
      entityId: Number(userId),
      details: `newRole=${roleName.trim()}`
    });

    await conn.commit();
    return res.json({ message: "User role updated successfully" });
  } catch (err) {
    console.error(err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    }
    return res.status(500).json({ message: "Failed to update user role" });
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

exports.getAllUsers = async (req, res) => {
  const { roleName, q } = req.query;
  let conn;
  try {
    conn = await oracledb.getConnection();
    const result = await conn.execute(
      `
      SELECT
        u.user_id,
        u.student_id,
        u.emp_id,
        u.email,
        r.role_name
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE (:b_role_name IS NULL OR r.role_name = :b_role_name)
        AND (
          :b_query IS NULL
          OR UPPER(NVL(u.student_id, '')) LIKE '%' || UPPER(:b_query) || '%'
          OR UPPER(NVL(u.emp_id, '')) LIKE '%' || UPPER(:b_query) || '%'
          OR UPPER(NVL(u.email, '')) LIKE '%' || UPPER(:b_query) || '%'
        )
      ORDER BY u.user_id
      `,
      {
        b_role_name: roleName ? roleName.trim() : null,
        b_query: q ? q.trim() : null
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return res.json({ users: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch users" });
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

exports.getUserById = async (req, res) => {
  const { userId } = req.params;
  if (!userId || Number.isNaN(Number(userId))) {
    return res.status(400).json({ message: "Valid userId param is required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const userResult = await conn.execute(
      `
      SELECT
        u.user_id,
        u.student_id,
        u.emp_id,
        u.email,
        r.role_name
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE u.user_id = :b_user_id
      `,
      { b_user_id: Number(userId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const studentProfile = await conn.execute(
      `
      SELECT
        full_name,
        phone,
        guardian_name,
        guardian_phone,
        address,
        room_no,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM students
      WHERE user_id = :b_user_id
      `,
      { b_user_id: Number(userId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({
      user: userResult.rows[0],
      studentProfile: (studentProfile.rows && studentProfile.rows[0]) || null
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch user details" });
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

exports.getStudents = async (_req, res) => {
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
        s.guardian_name,
        s.guardian_phone,
        s.address,
        s.room_no
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      LEFT JOIN students s ON s.user_id = u.user_id
      WHERE r.role_name = 'Student'
      ORDER BY u.user_id
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return res.json({ students: result.rows || [] });
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

exports.getStaff = async (_req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection();
    const result = await conn.execute(
      `
      SELECT
        u.user_id,
        u.emp_id,
        u.email,
        r.role_name
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE r.role_name <> 'Student'
      ORDER BY u.user_id
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return res.json({ staff: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch staff users" });
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

exports.resetUserPassword = async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;
  const requesterUserId = req.user.userId;

  if (!userId || Number.isNaN(Number(userId))) {
    return res.status(400).json({ message: "Valid userId param is required" });
  }
  if (!newPassword || !newPassword.trim()) {
    return res.status(400).json({ message: "newPassword is required" });
  }
  if (Number(userId) === requesterUserId) {
    return res.status(400).json({ message: "Use your own change-password flow" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const userResult = await conn.execute(
      `
      SELECT user_id
      FROM users
      WHERE user_id = :b_user_id
      `,
      { b_user_id: Number(userId) }
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    await conn.execute(
      `
      UPDATE users
      SET password = :b_password
      WHERE user_id = :b_user_id
      `,
      {
        b_password: hashedPassword,
        b_user_id: Number(userId)
      },
      { autoCommit: false }
    );

    await insertSystemLog(conn, {
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "RESET_USER_PASSWORD",
      entityType: "USER",
      entityId: Number(userId),
      details: null
    });

    await conn.commit();
    return res.json({ message: "User password reset successfully" });
  } catch (err) {
    console.error(err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    }
    return res.status(500).json({ message: "Failed to reset password" });
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

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;
  const requesterUserId = req.user.userId;
  const force = String(req.query.force || "false").toLowerCase() === "true";

  if (!userId || Number.isNaN(Number(userId))) {
    return res.status(400).json({ message: "Valid userId param is required" });
  }
  const targetUserId = Number(userId);
  if (targetUserId === requesterUserId) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const userResult = await conn.execute(
      `
      SELECT user_id
      FROM users
      WHERE user_id = :b_user_id
      `,
      { b_user_id: targetUserId }
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const leaveRefResult = await conn.execute(
      `
      SELECT COUNT(*)
      FROM leave_requests
      WHERE user_id = :b_user_id
         OR reviewed_by = :b_user_id
      `,
      { b_user_id: targetUserId }
    );
    const leaveRefCount = leaveRefResult.rows[0][0];
    if (leaveRefCount > 0 && !force) {
      return res.status(400).json({
        message: "User has leave references. Use ?force=true to delete anyway."
      });
    }

    await conn.execute(
      `
      DELETE FROM students
      WHERE user_id = :b_user_id
      `,
      { b_user_id: targetUserId },
      { autoCommit: false }
    );

    if (force) {
      await conn.execute(
        `
        UPDATE leave_requests
        SET reviewed_by = NULL
        WHERE reviewed_by = :b_user_id
        `,
        { b_user_id: targetUserId },
        { autoCommit: false }
      );
      await conn.execute(
        `
        DELETE FROM leave_requests
        WHERE user_id = :b_user_id
        `,
        { b_user_id: targetUserId },
        { autoCommit: false }
      );
    }

    await conn.execute(
      `
      DELETE FROM users
      WHERE user_id = :b_user_id
      `,
      { b_user_id: targetUserId },
      { autoCommit: false }
    );

    await insertSystemLog(conn, {
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "DELETE_USER",
      entityType: "USER",
      entityId: targetUserId,
      details: `force=${force}`
    });

    await conn.commit();
    return res.json({ message: "User deleted successfully", forceUsed: force });
  } catch (err) {
    console.error(err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    }
    return res.status(500).json({ message: "Failed to delete user" });
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

exports.getFeeRecords = async (req, res) => {
  const { studentId, status } = req.query;
  let conn;
  try {
    conn = await oracledb.getConnection();
    const result = await conn.execute(
      `
      SELECT
        sf.fee_id,
        sf.user_id,
        u.student_id,
        sf.term_name,
        sf.amount_total,
        sf.amount_paid,
        (sf.amount_total - sf.amount_paid) AS amount_due,
        TO_CHAR(sf.due_date, 'YYYY-MM-DD') AS due_date,
        sf.status,
        TO_CHAR(sf.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
      FROM student_fees sf
      JOIN users u ON u.user_id = sf.user_id
      WHERE (:b_student_id IS NULL OR TRIM(u.student_id) = :b_student_id)
        AND (:b_status IS NULL OR sf.status = :b_status)
      ORDER BY sf.updated_at DESC, sf.fee_id DESC
      `,
      {
        b_student_id: studentId ? studentId.trim() : null,
        b_status: status ? status.trim() : null
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return res.json({ fees: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch fee records" });
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

exports.createFeeRecord = async (req, res) => {
  const { studentId, termName, amountTotal, amountPaid, dueDate, status } = req.body;

  if (!studentId || !studentId.trim() || !termName || !termName.trim() || amountTotal === undefined) {
    return res.status(400).json({ message: "studentId, termName and amountTotal are required" });
  }

  const total = Number(amountTotal);
  const paid = amountPaid === undefined || amountPaid === null ? 0 : Number(amountPaid);
  if (Number.isNaN(total) || Number.isNaN(paid) || total < 0 || paid < 0 || paid > total) {
    return res.status(400).json({ message: "Invalid amount values" });
  }

  const derivedStatus =
    status && status.trim()
      ? status.trim()
      : paid === 0
        ? "Pending"
        : paid === total
          ? "Paid"
          : "Partially Paid";

  let conn;
  try {
    conn = await oracledb.getConnection();
    const userResult = await conn.execute(
      `
      SELECT u.user_id
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE TRIM(u.student_id) = :b_student_id
        AND r.role_name = 'Student'
      `,
      { b_student_id: studentId.trim() }
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentUserId = userResult.rows[0][0];
    await conn.execute(
      `
      INSERT INTO student_fees (user_id, term_name, amount_total, amount_paid, due_date, status)
      VALUES (
        :b_user_id,
        :b_term_name,
        :b_amount_total,
        :b_amount_paid,
        CASE WHEN :b_due_date IS NULL THEN NULL ELSE TO_DATE(:b_due_date, 'YYYY-MM-DD') END,
        :b_status
      )
      `,
      {
        b_user_id: studentUserId,
        b_term_name: termName.trim(),
        b_amount_total: total,
        b_amount_paid: paid,
        b_due_date: dueDate ? dueDate.trim() : null,
        b_status: derivedStatus
      },
      { autoCommit: false }
    );

    const feeResult = await conn.execute(
      `
      SELECT MAX(fee_id)
      FROM student_fees
      WHERE user_id = :b_user_id
      `,
      { b_user_id: studentUserId }
    );
    const createdFeeId = feeResult.rows[0][0];

    await insertSystemLog(conn, {
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "CREATE_FEE_RECORD",
      entityType: "FEE",
      entityId: createdFeeId,
      details: `studentId=${studentId.trim()}, term=${termName.trim()}, status=${derivedStatus}`
    });

    await conn.commit();
    return res.status(201).json({ message: "Fee record created successfully", feeId: createdFeeId });
  } catch (err) {
    console.error(err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    }
    return res.status(500).json({ message: "Failed to create fee record" });
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

exports.updateFeeRecord = async (req, res) => {
  const { feeId } = req.params;
  const { termName, amountTotal, amountPaid, dueDate, status } = req.body;

  if (!feeId || Number.isNaN(Number(feeId))) {
    return res.status(400).json({ message: "Valid feeId is required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const existingResult = await conn.execute(
      `
      SELECT term_name, amount_total, amount_paid, TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date, status
      FROM student_fees
      WHERE fee_id = :b_fee_id
      `,
      { b_fee_id: Number(feeId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ message: "Fee record not found" });
    }

    const current = existingResult.rows[0];
    const nextTotal = amountTotal === undefined ? Number(current.AMOUNT_TOTAL) : Number(amountTotal);
    const nextPaid = amountPaid === undefined ? Number(current.AMOUNT_PAID) : Number(amountPaid);
    if (Number.isNaN(nextTotal) || Number.isNaN(nextPaid) || nextTotal < 0 || nextPaid < 0 || nextPaid > nextTotal) {
      return res.status(400).json({ message: "Invalid amount values" });
    }

    const nextStatus =
      status && status.trim()
        ? status.trim()
        : nextPaid === 0
          ? "Pending"
          : nextPaid === nextTotal
            ? "Paid"
            : "Partially Paid";

    await conn.execute(
      `
      UPDATE student_fees
      SET term_name = :b_term_name,
          amount_total = :b_amount_total,
          amount_paid = :b_amount_paid,
          due_date = CASE WHEN :b_due_date IS NULL THEN NULL ELSE TO_DATE(:b_due_date, 'YYYY-MM-DD') END,
          status = :b_status,
          updated_at = SYSDATE
      WHERE fee_id = :b_fee_id
      `,
      {
        b_term_name: termName ? termName.trim() : current.TERM_NAME,
        b_amount_total: nextTotal,
        b_amount_paid: nextPaid,
        b_due_date: dueDate === undefined ? current.DUE_DATE : (dueDate ? dueDate.trim() : null),
        b_status: nextStatus,
        b_fee_id: Number(feeId)
      },
      { autoCommit: false }
    );

    await insertSystemLog(conn, {
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "UPDATE_FEE_RECORD",
      entityType: "FEE",
      entityId: Number(feeId),
      details: `status=${nextStatus}`
    });

    await conn.commit();
    return res.json({ message: "Fee record updated successfully" });
  } catch (err) {
    console.error(err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    }
    return res.status(500).json({ message: "Failed to update fee record" });
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

exports.getSystemLogs = async (req, res) => {
  const { action, actorUserId, dateFrom, dateTo, limit } = req.query;
  const rowLimit = limit && !Number.isNaN(Number(limit)) ? Number(limit) : 100;

  let conn;
  try {
    conn = await oracledb.getConnection();
    const result = await conn.execute(
      `
      SELECT *
      FROM (
        SELECT
          log_id,
          actor_user_id,
          actor_role,
          action,
          entity_type,
          entity_id,
          details,
          TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
        FROM system_logs
        WHERE (:b_action IS NULL OR action = :b_action)
          AND (:b_actor_user_id IS NULL OR actor_user_id = :b_actor_user_id)
          AND (:b_date_from IS NULL OR created_at >= TO_DATE(:b_date_from, 'YYYY-MM-DD'))
          AND (:b_date_to IS NULL OR created_at < TO_DATE(:b_date_to, 'YYYY-MM-DD') + 1)
        ORDER BY created_at DESC, log_id DESC
      )
      WHERE ROWNUM <= :b_row_limit
      `,
      {
        b_action: action ? action.trim() : null,
        b_actor_user_id: actorUserId ? Number(actorUserId) : null,
        b_date_from: dateFrom ? dateFrom.trim() : null,
        b_date_to: dateTo ? dateTo.trim() : null,
        b_row_limit: rowLimit
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return res.json({ logs: result.rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch system logs" });
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

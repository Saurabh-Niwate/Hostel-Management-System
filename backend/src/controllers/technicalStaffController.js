const { oracledb } = require("../config/db");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const { syncOverdueFeeStatuses } = require("../utils/feeStatus");
const { isValidImageSignature } = require("../middlewares/uploadMiddleware");

const toPublicUrl = (req, value) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${req.protocol}://${req.get("host")}${value}`;
};

const deleteProfileImageFile = (imagePath) => {
  if (!imagePath) return;
  const fileName = path.basename(imagePath);
  if (!fileName) return;
  const absolutePath = path.join(__dirname, "../../uploads/profile-images", fileName);
  try {
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (_e) {
    // ignore cleanup failures
  }
};

const deleteUploadedFile = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (_e) {
    // ignore cleanup failures
  }
};

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

const ensureRoomExists = async (conn, roomNo) => {
  const normalizedRoomNo = roomNo ? String(roomNo).trim() : "";
  if (!normalizedRoomNo) {
    return false;
  }

  const roomResult = await conn.execute(
    `
    SELECT room_no
    FROM rooms
    WHERE TRIM(room_no) = :b_room_no
    `,
    { b_room_no: normalizedRoomNo }
  );

  return roomResult.rows.length > 0;
};

const ensureRoomHasVacancy = async (conn, roomNo, excludedUserId = null) => {
  const normalizedRoomNo = roomNo ? String(roomNo).trim() : "";
  if (!normalizedRoomNo) {
    return false;
  }

  const result = await conn.execute(
    `
    SELECT
      r.capacity,
      (
        SELECT COUNT(*)
        FROM students s
        WHERE TRIM(s.room_no) = TRIM(r.room_no)
          AND (:b_excluded_user_id IS NULL OR s.user_id <> :b_excluded_user_id)
      ) AS occupied
    FROM rooms r
    WHERE TRIM(r.room_no) = :b_room_no
    `,
    {
      b_room_no: normalizedRoomNo,
      b_excluded_user_id: excludedUserId
    },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  if (!result.rows.length) {
    return false;
  }

  const room = result.rows[0];
  return Number(room.OCCUPIED || 0) < Number(room.CAPACITY || 0);
};

const allowedAccommodationTypes = ["PG", "Dormitory", "Apartment"];
const allowedAccommodationStatuses = ["Available", "Limited", "Full"];
const allowedAccommodationGenders = ["Male", "Female", "Any"];

const normalizeAadharNo = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).replace(/\s+/g, "").trim();
  return normalized || null;
};

const isValidAadharNo = (value) => /^\d{12}$/.test(value);

const getRoomAllocationRequestRows = async (conn) => {
  const result = await conn.execute(
    `
    SELECT
      rar.request_id,
      rar.user_id,
      u.student_id,
      s.full_name,
      s.phone,
      s.room_no AS current_room_no,
      rar.status,
      rar.assigned_room_no,
      rar.remarks,
      TO_CHAR(rar.requested_at, 'YYYY-MM-DD HH24:MI:SS') AS requested_at,
      TO_CHAR(rar.reviewed_at, 'YYYY-MM-DD HH24:MI:SS') AS reviewed_at
    FROM room_allocation_requests rar
    JOIN users u ON u.user_id = rar.user_id
    LEFT JOIN students s ON s.user_id = rar.user_id
    ORDER BY
      CASE rar.status
        WHEN 'Pending' THEN 1
        WHEN 'Assigned' THEN 2
        WHEN 'Rejected' THEN 3
        ELSE 4
      END,
      rar.requested_at ASC,
      rar.request_id ASC
    `,
    {},
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  return result.rows || [];
};

const lockRoomAndGetOccupancy = async (conn, roomNo, excludedUserId = null) => {
  const normalizedRoomNo = roomNo ? String(roomNo).trim() : "";
  if (!normalizedRoomNo) {
    return null;
  }

  const roomResult = await conn.execute(
    `
    SELECT room_no, capacity, is_active
    FROM rooms
    WHERE TRIM(room_no) = :b_room_no
    FOR UPDATE
    `,
    { b_room_no: normalizedRoomNo },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  if (!roomResult.rows.length) {
    return null;
  }

  const occupancyResult = await conn.execute(
    `
    SELECT COUNT(*) AS occupied_count
    FROM students
    WHERE TRIM(room_no) = :b_room_no
      AND (:b_excluded_user_id IS NULL OR user_id <> :b_excluded_user_id)
    `,
    {
      b_room_no: normalizedRoomNo,
      b_excluded_user_id: excludedUserId
    },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  return {
    ...roomResult.rows[0],
    OCCUPIED_COUNT: Number(occupancyResult.rows?.[0]?.OCCUPIED_COUNT || 0)
  };
};

exports.createStudent = async (req, res) => {
  const {
    studentId,
    email,
    password,
    fullName,
    phone,
    aadharNo,
    guardianName,
    guardianEmail,
    guardianPhone,
    address,
    roomNo
  } = req.body;
  const profileImageUrl = req.file ? `/uploads/profile-images/${req.file.filename}` : null;
  const normalizedAadharNo = normalizeAadharNo(aadharNo);
  const normalizedRoomNo = roomNo ? String(roomNo).trim() : "";

  if (
    !studentId || !studentId.trim() ||
    !password || !password.trim() ||
    !fullName || !fullName.trim() ||
    !phone || !phone.trim() ||
    !normalizedAadharNo ||
    !guardianName || !guardianName.trim() ||
    !guardianPhone || !guardianPhone.trim() ||
    !address || !address.trim()
  ) {
    deleteUploadedFile(req.file?.path);
    return res.status(400).json({
      message: "studentId, password, fullName, phone, aadharNo, guardianName, guardianPhone and address are required (email, guardianEmail and roomNo are optional when hostel is full)"
    });
  }

  if (!isValidAadharNo(normalizedAadharNo)) {
    deleteUploadedFile(req.file?.path);
    return res.status(400).json({ message: "aadharNo must be exactly 12 digits" });
  }

  if (req.file && !(await isValidImageSignature(req.file.path, req.file.mimetype))) {
    deleteUploadedFile(req.file.path);
    return res.status(400).json({ message: "Uploaded file content is not a valid image" });
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
      deleteUploadedFile(req.file?.path);
      return res.status(409).json({ message: "Student ID already exists" });
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim().toLowerCase())) {
        deleteUploadedFile(req.file?.path);
        return res.status(400).json({ message: "Invalid email format" });
      }
    }

    if (guardianEmail && guardianEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guardianEmail.trim().toLowerCase())) {
        deleteUploadedFile(req.file?.path);
        return res.status(400).json({ message: "Invalid guardian email format" });
      }
    }

    if (normalizedRoomNo) {
      const roomExists = await ensureRoomExists(conn, normalizedRoomNo);
      if (!roomExists) {
        deleteUploadedFile(req.file?.path);
        return res.status(400).json({ message: "Assigned room does not exist. Create the room first before allocating it." });
      }

      const roomHasVacancy = await ensureRoomHasVacancy(conn, normalizedRoomNo);
      if (!roomHasVacancy) {
        deleteUploadedFile(req.file?.path);
        return res.status(400).json({ message: "Assigned room has no vacancy left. Select another room or use nearby stay suggestions." });
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
      deleteUploadedFile(req.file?.path);
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
        aadhar_no,
        guardian_name,
        guardian_email,
        guardian_phone,
        address,
        room_no,
        profile_image_url
      )
      VALUES (
        :b_user_id,
        :b_full_name,
        :b_phone,
        :b_aadhar_no,
        :b_guardian_name,
        :b_guardian_email,
        :b_guardian_phone,
        :b_address,
        :b_room_no,
        :b_profile_image_url
      )
      `,
      {
        b_user_id: createdUserId,
        b_full_name: fullName ? fullName.trim() : null,
        b_phone: phone ? phone.trim() : null,
        b_aadhar_no: normalizedAadharNo,
        b_guardian_name: guardianName ? guardianName.trim() : null,
        b_guardian_email: guardianEmail ? guardianEmail.trim().toLowerCase() : null,
        b_guardian_phone: guardianPhone ? guardianPhone.trim() : null,
        b_address: address ? address.trim() : null,
        b_room_no: normalizedRoomNo || null,
        b_profile_image_url: profileImageUrl
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
  const { empId, email, password, roleName, fullName, phone } = req.body;

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

    await conn.execute(
      `
      INSERT INTO staff_profiles (user_id, full_name, phone)
      VALUES (:b_user_id, :b_full_name, :b_phone)
      `,
      {
        b_user_id: createdUserId,
        b_full_name: fullName ? fullName.trim() : null,
        b_phone: phone ? phone.trim() : null
      },
      { autoCommit: false }
    );

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
          OR UPPER(NVL(r.role_name, '')) LIKE '%' || UPPER(:b_query) || '%'
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
        aadhar_no,
        guardian_name,
        guardian_email,
        guardian_phone,
        address,
        room_no,
        profile_image_url,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM students
      WHERE user_id = :b_user_id
      `,
      { b_user_id: Number(userId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const staffProfile = await conn.execute(
      `
      SELECT
        full_name,
        phone,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM staff_profiles
      WHERE user_id = :b_user_id
      `,
      { b_user_id: Number(userId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({
      user: userResult.rows[0],
      studentProfile: (() => {
        const row = (studentProfile.rows && studentProfile.rows[0]) || null;
        if (!row) return null;
        return {
          ...row,
          PROFILE_IMAGE_URL: toPublicUrl(req, row.PROFILE_IMAGE_URL)
        };
      })(),
      staffProfile: (staffProfile.rows && staffProfile.rows[0]) || null
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

exports.updateStudentByStudentId = async (req, res) => {
  const { studentId } = req.params;
  const {
    email,
    fullName,
    phone,
    aadharNo,
    guardianName,
    guardianEmail,
    guardianPhone,
    address,
    roomNo
  } = req.body;

  if (!studentId || !studentId.trim()) {
    return res.status(400).json({ message: "studentId param is required" });
  }

  const normalizedAadharNo = normalizeAadharNo(aadharNo);
  if (normalizedAadharNo && !isValidAadharNo(normalizedAadharNo)) {
    return res.status(400).json({ message: "aadharNo must be exactly 12 digits" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const studentUserResult = await conn.execute(
      `
      SELECT u.user_id
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE TRIM(u.student_id) = :b_student_id
        AND r.role_name = 'Student'
      `,
      { b_student_id: studentId.trim() }
    );

    if (studentUserResult.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const targetUserId = studentUserResult.rows[0][0];

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
          b_user_id: targetUserId
        }
      );
      if (duplicateEmailCheck.rows.length > 0) {
        return res.status(409).json({ message: "Email already in use" });
      }
    }

    const trimmedGuardianEmail = guardianEmail ? guardianEmail.trim().toLowerCase() : null;
    if (trimmedGuardianEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedGuardianEmail)) {
        return res.status(400).json({ message: "Invalid guardian email format" });
      }
    }

    if (roomNo && roomNo.trim()) {
      const roomExists = await ensureRoomExists(conn, roomNo);
      if (!roomExists) {
        return res.status(400).json({ message: "Assigned room does not exist. Create the room first before allocating it." });
      }

      const roomHasVacancy = await ensureRoomHasVacancy(conn, roomNo, targetUserId);
      if (!roomHasVacancy) {
        return res.status(400).json({ message: "Assigned room has no vacancy left. Select another room or use nearby stay suggestions." });
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
        b_user_id: targetUserId
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
          aadhar_no = :b_aadhar_no,
          guardian_name = :b_guardian_name,
          guardian_email = :b_guardian_email,
          guardian_phone = :b_guardian_phone,
          address = :b_address,
          room_no = :b_room_no
      WHEN NOT MATCHED THEN
        INSERT (
          user_id,
          full_name,
          phone,
          aadhar_no,
          guardian_name,
          guardian_email,
          guardian_phone,
          address,
          room_no
        )
        VALUES (
          :b_user_id,
          :b_full_name,
          :b_phone,
          :b_aadhar_no,
          :b_guardian_name,
          :b_guardian_email,
          :b_guardian_phone,
          :b_address,
          :b_room_no
        )
      `,
      {
        b_user_id: targetUserId,
        b_full_name: fullName ? fullName.trim() : null,
        b_phone: phone ? phone.trim() : null,
        b_aadhar_no: normalizedAadharNo,
        b_guardian_name: guardianName ? guardianName.trim() : null,
        b_guardian_email: trimmedGuardianEmail,
        b_guardian_phone: guardianPhone ? guardianPhone.trim() : null,
        b_address: address ? address.trim() : null,
        b_room_no: roomNo ? roomNo.trim() : null
      },
      { autoCommit: false }
    );

    await insertSystemLog(conn, {
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "UPDATE_STUDENT_PROFILE",
      entityType: "USER",
      entityId: targetUserId,
      details: `studentId=${studentId.trim()}`
    });

    await conn.commit();
    return res.json({ message: "Student profile updated successfully" });
  } catch (err) {
    console.error(err);
    deleteUploadedFile(req.file?.path);
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

exports.uploadStudentProfileImageByStudentId = async (req, res) => {
  const { studentId } = req.params;
  if (!studentId || !studentId.trim()) {
    return res.status(400).json({ message: "studentId param is required" });
  }
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  if (!(await isValidImageSignature(req.file.path, req.file.mimetype))) {
    try {
      fs.unlinkSync(req.file.path);
    } catch (_e) {
      // ignore cleanup failure
    }
    return res.status(400).json({ message: "Uploaded file content is not a valid image" });
  }

  const imagePath = `/uploads/profile-images/${req.file.filename}`;
  let conn;
  try {
    conn = await oracledb.getConnection();

    const studentUserResult = await conn.execute(
      `
      SELECT u.user_id
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE TRIM(u.student_id) = :b_student_id
        AND r.role_name = 'Student'
      `,
      { b_student_id: studentId.trim() },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!studentUserResult.rows || studentUserResult.rows.length === 0) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_e) {
        // ignore cleanup failure
      }
      return res.status(404).json({ message: "Student not found" });
    }

    const targetUserId = studentUserResult.rows[0].USER_ID;

    const previousResult = await conn.execute(
      `
      SELECT profile_image_url
      FROM students
      WHERE user_id = :b_user_id
      `,
      { b_user_id: targetUserId },
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
        b_user_id: targetUserId,
        b_profile_image_url: imagePath
      },
      { autoCommit: false }
    );

    await insertSystemLog(conn, {
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "UPLOAD_STUDENT_PROFILE_IMAGE",
      entityType: "USER",
      entityId: targetUserId,
      details: `studentId=${studentId.trim()}`
    });

    await conn.commit();

    if (previousImagePath && previousImagePath !== imagePath) {
      deleteProfileImageFile(previousImagePath);
    }

    return res.json({
      message: "Student profile image uploaded successfully",
      profileImageUrl: toPublicUrl(req, imagePath)
    });
  } catch (err) {
    console.error(err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (_e) {
        // ignore rollback failure
      }
    }
    try {
      fs.unlinkSync(req.file.path);
    } catch (_e) {
      // ignore cleanup failure
    }
    return res.status(500).json({ message: "Failed to upload student profile image" });
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

exports.getRooms = async (_req, res) => {
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
        TO_CHAR(r.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
        (
          SELECT COUNT(*)
          FROM students s
          WHERE TRIM(s.room_no) = TRIM(r.room_no)
        ) AS occupied,
        (
          r.capacity - (
            SELECT COUNT(*)
            FROM students s
            WHERE TRIM(s.room_no) = TRIM(r.room_no)
          )
        ) AS vacancy
      FROM rooms
      r
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

exports.createRoom = async (req, res) => {
  const { roomNo, blockName, floorNo, capacity, roomType, isActive } = req.body;

  if (!roomNo || !String(roomNo).trim()) {
    return res.status(400).json({ message: "roomNo is required" });
  }

  const normalizedRoomNo = String(roomNo).trim();
  const normalizedBlockName = blockName ? String(blockName).trim() : null;
  const normalizedRoomType = roomType ? String(roomType).trim() : "Regular";
  const parsedFloorNo = floorNo === undefined || floorNo === null || floorNo === "" ? null : Number(floorNo);
  const parsedCapacity = capacity === undefined || capacity === null || capacity === "" ? 1 : Number(capacity);
  const normalizedIsActive =
    isActive === undefined || isActive === null || isActive === ""
      ? 1
      : Number(isActive) === 0
        ? 0
        : 1;

  if ((parsedFloorNo !== null && Number.isNaN(parsedFloorNo)) || Number.isNaN(parsedCapacity) || parsedCapacity <= 0) {
    return res.status(400).json({ message: "floorNo must be numeric and capacity must be greater than 0" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const duplicateResult = await conn.execute(
      `
      SELECT room_no
      FROM rooms
      WHERE TRIM(room_no) = :b_room_no
      `,
      { b_room_no: normalizedRoomNo }
    );

    if (duplicateResult.rows.length > 0) {
      return res.status(409).json({ message: "Room already exists" });
    }

    await conn.execute(
      `
      INSERT INTO rooms (room_no, block_name, floor_no, capacity, room_type, is_active)
      VALUES (:b_room_no, :b_block_name, :b_floor_no, :b_capacity, :b_room_type, :b_is_active)
      `,
      {
        b_room_no: normalizedRoomNo,
        b_block_name: normalizedBlockName,
        b_floor_no: parsedFloorNo,
        b_capacity: parsedCapacity,
        b_room_type: normalizedRoomType,
        b_is_active: normalizedIsActive
      },
      { autoCommit: false }
    );

    await insertSystemLog(conn, {
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "CREATE_ROOM",
      entityType: "ROOM",
      entityId: null,
      details: `roomNo=${normalizedRoomNo}`
    });

    await conn.commit();
    return res.status(201).json({ message: "Room created successfully", roomNo: normalizedRoomNo });
  } catch (err) {
    console.error(err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    }
    return res.status(500).json({ message: "Failed to create room" });
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

exports.updateRoom = async (req, res) => {
  const { roomNo } = req.params;
  const { blockName, floorNo, capacity, roomType, isActive } = req.body;

  if (!roomNo || !String(roomNo).trim()) {
    return res.status(400).json({ message: "roomNo param is required" });
  }

  const normalizedRoomNo = String(roomNo).trim();
  const parsedFloorNo = floorNo === undefined || floorNo === null || floorNo === "" ? undefined : Number(floorNo);
  const parsedCapacity = capacity === undefined || capacity === null || capacity === "" ? undefined : Number(capacity);
  const normalizedIsActive =
    isActive === undefined || isActive === null || isActive === ""
      ? undefined
      : Number(isActive) === 0
        ? 0
        : 1;

  if ((parsedFloorNo !== undefined && Number.isNaN(parsedFloorNo)) || (parsedCapacity !== undefined && (Number.isNaN(parsedCapacity) || parsedCapacity <= 0))) {
    return res.status(400).json({ message: "floorNo must be numeric and capacity must be greater than 0" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const existingResult = await conn.execute(
      `
      SELECT room_no, block_name, floor_no, capacity, room_type, is_active
      FROM rooms
      WHERE TRIM(room_no) = :b_room_no
      `,
      { b_room_no: normalizedRoomNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }

    const current = existingResult.rows[0];
    const occupancyResult = await conn.execute(
      `
      SELECT COUNT(*) AS occupied_count
      FROM students
      WHERE TRIM(room_no) = :b_room_no
      `,
      { b_room_no: normalizedRoomNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const occupiedCount = Number(occupancyResult.rows?.[0]?.OCCUPIED_COUNT || 0);
    const nextCapacity = parsedCapacity === undefined ? Number(current.CAPACITY || 0) : parsedCapacity;
    const nextIsActive = normalizedIsActive === undefined ? Number(current.IS_ACTIVE || 0) : normalizedIsActive;

    if (nextCapacity < occupiedCount) {
      return res.status(400).json({
        message: `Room capacity cannot be set below current occupied count (${occupiedCount}). Reassign students first.`
      });
    }

    if (nextIsActive === 0 && occupiedCount > 0) {
      return res.status(400).json({
        message: `Room cannot be marked inactive while ${occupiedCount} student(s) are still assigned. Reassign students first.`
      });
    }

    await conn.execute(
      `
      UPDATE rooms
      SET block_name = :b_block_name,
          floor_no = :b_floor_no,
          capacity = :b_capacity,
          room_type = :b_room_type,
          is_active = :b_is_active
      WHERE TRIM(room_no) = :b_room_no
      `,
      {
        b_block_name: blockName === undefined ? current.BLOCK_NAME : (blockName ? String(blockName).trim() : null),
        b_floor_no: parsedFloorNo === undefined ? current.FLOOR_NO : parsedFloorNo,
        b_capacity: parsedCapacity === undefined ? current.CAPACITY : parsedCapacity,
        b_room_type: roomType === undefined ? current.ROOM_TYPE : (roomType ? String(roomType).trim() : "Regular"),
        b_is_active: normalizedIsActive === undefined ? current.IS_ACTIVE : normalizedIsActive,
        b_room_no: normalizedRoomNo
      },
      { autoCommit: false }
    );

    await insertSystemLog(conn, {
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "UPDATE_ROOM",
      entityType: "ROOM",
      entityId: null,
      details: `roomNo=${normalizedRoomNo}`
    });

    await conn.commit();
    return res.json({ message: "Room updated successfully", roomNo: normalizedRoomNo });
  } catch (err) {
    console.error(err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    }
    return res.status(500).json({ message: "Failed to update room" });
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

exports.deleteRoom = async (req, res) => {
  const { roomNo } = req.params;
  const force = String(req.query.force || "false").toLowerCase() === "true";

  if (!roomNo || !String(roomNo).trim()) {
    return res.status(400).json({ message: "roomNo param is required" });
  }

  const normalizedRoomNo = String(roomNo).trim();
  let conn;
  try {
    conn = await oracledb.getConnection();

    const roomResult = await conn.execute(
      `
      SELECT room_no
      FROM rooms
      WHERE TRIM(room_no) = :b_room_no
      `,
      { b_room_no: normalizedRoomNo }
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }

    const assignedStudentsResult = await conn.execute(
      `
      SELECT COUNT(*) AS total
      FROM students
      WHERE TRIM(room_no) = :b_room_no
      `,
      { b_room_no: normalizedRoomNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const assignedStudents = Number(assignedStudentsResult.rows[0]?.TOTAL || 0);
    if (assignedStudents > 0 && !force) {
      return res.status(400).json({
        message: "Room has assigned students. Use ?force=true to unassign students and delete anyway.",
        assignedStudents
      });
    }

    if (force && assignedStudents > 0) {
      await conn.execute(
        `
        UPDATE students
        SET room_no = NULL
        WHERE TRIM(room_no) = :b_room_no
        `,
        { b_room_no: normalizedRoomNo },
        { autoCommit: false }
      );
    }

    await conn.execute(
      `
      DELETE FROM rooms
      WHERE TRIM(room_no) = :b_room_no
      `,
      { b_room_no: normalizedRoomNo },
      { autoCommit: false }
    );

    await insertSystemLog(conn, {
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "DELETE_ROOM",
      entityType: "ROOM",
      entityId: null,
      details: `roomNo=${normalizedRoomNo}, force=${force}`
    });

    await conn.commit();
    return res.json({ message: "Room deleted successfully", forceUsed: force });
  } catch (err) {
    console.error(err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    }
    return res.status(500).json({ message: "Failed to delete room" });
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

exports.getExternalAccommodations = async (_req, res) => {
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
        notes,
        created_by,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
        TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
      FROM external_accommodations
      ORDER BY
        CASE availability_status
          WHEN 'Available' THEN 1
          WHEN 'Limited' THEN 2
          ELSE 3
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

exports.createExternalAccommodation = async (req, res) => {
  const {
    name,
    accommodationType,
    address,
    distanceKm,
    contactPhone,
    contactEmail,
    rentMin,
    rentMax,
    genderAllowed,
    availabilityStatus,
    notes
  } = req.body;

  if (!name || !String(name).trim() || !accommodationType || !address || !String(address).trim()) {
    return res.status(400).json({ message: "name, accommodationType and address are required" });
  }

  const normalizedType = String(accommodationType).trim();
  const normalizedGender = genderAllowed ? String(genderAllowed).trim() : "Any";
  const normalizedStatus = availabilityStatus ? String(availabilityStatus).trim() : "Available";
  const normalizedDistance = distanceKm === undefined || distanceKm === null || distanceKm === "" ? null : Number(distanceKm);
  const normalizedRentMin = rentMin === undefined || rentMin === null || rentMin === "" ? null : Number(rentMin);
  const normalizedRentMax = rentMax === undefined || rentMax === null || rentMax === "" ? null : Number(rentMax);

  if (!allowedAccommodationTypes.includes(normalizedType)) {
    return res.status(400).json({ message: "accommodationType must be PG, Dormitory or Apartment" });
  }
  if (!allowedAccommodationGenders.includes(normalizedGender)) {
    return res.status(400).json({ message: "genderAllowed must be Male, Female or Any" });
  }
  if (!allowedAccommodationStatuses.includes(normalizedStatus)) {
    return res.status(400).json({ message: "availabilityStatus must be Available, Limited or Full" });
  }
  if ((normalizedDistance !== null && Number.isNaN(normalizedDistance)) ||
      (normalizedRentMin !== null && Number.isNaN(normalizedRentMin)) ||
      (normalizedRentMax !== null && Number.isNaN(normalizedRentMax))) {
    return res.status(400).json({ message: "distanceKm, rentMin and rentMax must be numeric" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const insertResult = await conn.execute(
      `
      INSERT INTO external_accommodations (
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
        notes,
        created_by,
        updated_at
      )
      VALUES (
        :b_name,
        :b_accommodation_type,
        :b_address,
        :b_distance_km,
        :b_contact_phone,
        :b_contact_email,
        :b_rent_min,
        :b_rent_max,
        :b_gender_allowed,
        :b_availability_status,
        :b_notes,
        :b_created_by,
        SYSDATE
      )
      RETURNING accommodation_id INTO :b_accommodation_id
      `,
      {
        b_name: String(name).trim(),
        b_accommodation_type: normalizedType,
        b_address: String(address).trim(),
        b_distance_km: normalizedDistance,
        b_contact_phone: contactPhone ? String(contactPhone).trim() : null,
        b_contact_email: contactEmail ? String(contactEmail).trim().toLowerCase() : null,
        b_rent_min: normalizedRentMin,
        b_rent_max: normalizedRentMax,
        b_gender_allowed: normalizedGender,
        b_availability_status: normalizedStatus,
        b_notes: notes ? String(notes).trim() : null,
        b_created_by: req.user.userId,
        b_accommodation_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: false }
    );

    const accommodationId = insertResult.outBinds.b_accommodation_id[0];
    await insertSystemLog(conn, {
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "CREATE_EXTERNAL_ACCOMMODATION",
      entityType: "EXTERNAL_ACCOMMODATION",
      entityId: accommodationId,
      details: `name=${String(name).trim()}`
    });

    await conn.commit();
    return res.status(201).json({ message: "Nearby stay suggestion created successfully", accommodationId });
  } catch (err) {
    console.error(err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    }
    return res.status(500).json({ message: "Failed to create nearby stay suggestion" });
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

exports.updateExternalAccommodation = async (req, res) => {
  const { accommodationId } = req.params;
  const {
    name,
    accommodationType,
    address,
    distanceKm,
    contactPhone,
    contactEmail,
    rentMin,
    rentMax,
    genderAllowed,
    availabilityStatus,
    notes
  } = req.body;

  if (!accommodationId || Number.isNaN(Number(accommodationId))) {
    return res.status(400).json({ message: "Valid accommodationId is required" });
  }

  const normalizedType = accommodationType === undefined ? undefined : String(accommodationType).trim();
  const normalizedGender = genderAllowed === undefined ? undefined : String(genderAllowed).trim();
  const normalizedStatus = availabilityStatus === undefined ? undefined : String(availabilityStatus).trim();
  const normalizedDistance = distanceKm === undefined || distanceKm === "" ? undefined : distanceKm === null ? null : Number(distanceKm);
  const normalizedRentMin = rentMin === undefined || rentMin === "" ? undefined : rentMin === null ? null : Number(rentMin);
  const normalizedRentMax = rentMax === undefined || rentMax === "" ? undefined : rentMax === null ? null : Number(rentMax);

  if (normalizedType !== undefined && !allowedAccommodationTypes.includes(normalizedType)) {
    return res.status(400).json({ message: "accommodationType must be PG, Dormitory or Apartment" });
  }
  if (normalizedGender !== undefined && !allowedAccommodationGenders.includes(normalizedGender)) {
    return res.status(400).json({ message: "genderAllowed must be Male, Female or Any" });
  }
  if (normalizedStatus !== undefined && !allowedAccommodationStatuses.includes(normalizedStatus)) {
    return res.status(400).json({ message: "availabilityStatus must be Available, Limited or Full" });
  }
  if ((normalizedDistance !== undefined && normalizedDistance !== null && Number.isNaN(normalizedDistance)) ||
      (normalizedRentMin !== undefined && normalizedRentMin !== null && Number.isNaN(normalizedRentMin)) ||
      (normalizedRentMax !== undefined && normalizedRentMax !== null && Number.isNaN(normalizedRentMax))) {
    return res.status(400).json({ message: "distanceKm, rentMin and rentMax must be numeric" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const existingResult = await conn.execute(
      `
      SELECT *
      FROM external_accommodations
      WHERE accommodation_id = :b_accommodation_id
      `,
      { b_accommodation_id: Number(accommodationId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ message: "Nearby stay suggestion not found" });
    }

    const current = existingResult.rows[0];
    await conn.execute(
      `
      UPDATE external_accommodations
      SET name = :b_name,
          accommodation_type = :b_accommodation_type,
          address = :b_address,
          distance_km = :b_distance_km,
          contact_phone = :b_contact_phone,
          contact_email = :b_contact_email,
          rent_min = :b_rent_min,
          rent_max = :b_rent_max,
          gender_allowed = :b_gender_allowed,
          availability_status = :b_availability_status,
          notes = :b_notes,
          updated_at = SYSDATE
      WHERE accommodation_id = :b_accommodation_id
      `,
      {
        b_name: name === undefined ? current.NAME : (name ? String(name).trim() : null),
        b_accommodation_type: normalizedType === undefined ? current.ACCOMMODATION_TYPE : normalizedType,
        b_address: address === undefined ? current.ADDRESS : (address ? String(address).trim() : null),
        b_distance_km: normalizedDistance === undefined ? current.DISTANCE_KM : normalizedDistance,
        b_contact_phone: contactPhone === undefined ? current.CONTACT_PHONE : (contactPhone ? String(contactPhone).trim() : null),
        b_contact_email: contactEmail === undefined ? current.CONTACT_EMAIL : (contactEmail ? String(contactEmail).trim().toLowerCase() : null),
        b_rent_min: normalizedRentMin === undefined ? current.RENT_MIN : normalizedRentMin,
        b_rent_max: normalizedRentMax === undefined ? current.RENT_MAX : normalizedRentMax,
        b_gender_allowed: normalizedGender === undefined ? current.GENDER_ALLOWED : normalizedGender,
        b_availability_status: normalizedStatus === undefined ? current.AVAILABILITY_STATUS : normalizedStatus,
        b_notes: notes === undefined ? current.NOTES : (notes ? String(notes).trim() : null),
        b_accommodation_id: Number(accommodationId)
      },
      { autoCommit: false }
    );

    await insertSystemLog(conn, {
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "UPDATE_EXTERNAL_ACCOMMODATION",
      entityType: "EXTERNAL_ACCOMMODATION",
      entityId: Number(accommodationId),
      details: null
    });

    await conn.commit();
    return res.json({ message: "Nearby stay suggestion updated successfully" });
  } catch (err) {
    console.error(err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    }
    return res.status(500).json({ message: "Failed to update nearby stay suggestion" });
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

exports.deleteExternalAccommodation = async (req, res) => {
  const { accommodationId } = req.params;

  if (!accommodationId || Number.isNaN(Number(accommodationId))) {
    return res.status(400).json({ message: "Valid accommodationId is required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();
    const existingResult = await conn.execute(
      `
      SELECT name
      FROM external_accommodations
      WHERE accommodation_id = :b_accommodation_id
      `,
      { b_accommodation_id: Number(accommodationId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ message: "Nearby stay suggestion not found" });
    }

    await conn.execute(
      `
      DELETE FROM external_accommodations
      WHERE accommodation_id = :b_accommodation_id
      `,
      { b_accommodation_id: Number(accommodationId) },
      { autoCommit: false }
    );

    await insertSystemLog(conn, {
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "DELETE_EXTERNAL_ACCOMMODATION",
      entityType: "EXTERNAL_ACCOMMODATION",
      entityId: Number(accommodationId),
      details: `name=${existingResult.rows[0].NAME || ""}`
    });

    await conn.commit();
    return res.json({ message: "Nearby stay suggestion deleted successfully" });
  } catch (err) {
    console.error(err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    }
    return res.status(500).json({ message: "Failed to delete nearby stay suggestion" });
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

exports.getRoomAllocationRequests = async (_req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection();
    const requests = await getRoomAllocationRequestRows(conn);
    return res.json({ requests });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch room allocation requests" });
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

exports.assignRoomAllocationRequest = async (req, res) => {
  const { requestId } = req.params;
  const { roomNo, remarks } = req.body;
  const normalizedRoomNo = roomNo ? String(roomNo).trim() : "";

  if (!requestId || Number.isNaN(Number(requestId))) {
    return res.status(400).json({ message: "Valid requestId is required" });
  }

  if (!normalizedRoomNo) {
    return res.status(400).json({ message: "roomNo is required" });
  }

  let conn;
  try {
    conn = await oracledb.getConnection();

    const requestResult = await conn.execute(
      `
      SELECT request_id, user_id, status
      FROM room_allocation_requests
      WHERE request_id = :b_request_id
      FOR UPDATE
      `,
      { b_request_id: Number(requestId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!requestResult.rows.length) {
      return res.status(404).json({ message: "Room allocation request not found" });
    }

    const requestRow = requestResult.rows[0];
    if (requestRow.STATUS !== "Pending") {
      return res.status(400).json({ message: "Only pending room allocation requests can be assigned" });
    }

    const roomState = await lockRoomAndGetOccupancy(conn, normalizedRoomNo, requestRow.USER_ID);
    if (!roomState) {
      return res.status(400).json({ message: "Assigned room does not exist" });
    }

    if (Number(roomState.IS_ACTIVE || 0) !== 1) {
      return res.status(400).json({ message: "Assigned room is inactive" });
    }

    if (Number(roomState.OCCUPIED_COUNT || 0) >= Number(roomState.CAPACITY || 0)) {
      return res.status(400).json({ message: "Assigned room has no vacancy left" });
    }

    const studentResult = await conn.execute(
      `
      SELECT room_no
      FROM students
      WHERE user_id = :b_user_id
      FOR UPDATE
      `,
      { b_user_id: requestRow.USER_ID },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const currentRoomNo = studentResult.rows?.[0]?.ROOM_NO ? String(studentResult.rows[0].ROOM_NO).trim() : "";
    if (currentRoomNo) {
      return res.status(400).json({ message: "Student already has a hostel room assigned" });
    }

    await conn.execute(
      `
      UPDATE students
      SET room_no = :b_room_no
      WHERE user_id = :b_user_id
      `,
      {
        b_room_no: normalizedRoomNo,
        b_user_id: requestRow.USER_ID
      },
      { autoCommit: false }
    );

    await conn.execute(
      `
      UPDATE room_allocation_requests
      SET status = 'Assigned',
          assigned_room_no = :b_room_no,
          reviewed_by = :b_reviewed_by,
          reviewed_at = SYSDATE,
          remarks = :b_remarks
      WHERE request_id = :b_request_id
      `,
      {
        b_room_no: normalizedRoomNo,
        b_reviewed_by: req.user.userId,
        b_remarks: remarks ? String(remarks).trim() : null,
        b_request_id: Number(requestId)
      },
      { autoCommit: false }
    );

    await insertSystemLog(conn, {
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "ASSIGN_ROOM_BY_REQUEST",
      entityType: "ROOM_ALLOCATION_REQUEST",
      entityId: Number(requestId),
      details: `Assigned room ${normalizedRoomNo} for request ${requestId}`
    });

    await conn.commit();
    return res.json({ message: "Room assigned successfully from request queue" });
  } catch (err) {
    console.error(err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    }
    return res.status(500).json({ message: "Failed to assign room from request queue" });
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

    // Fetch student profile image before deletion
    const studentResult = await conn.execute(
      `
      SELECT profile_image_url
      FROM students
      WHERE user_id = :b_user_id
      `,
      { b_user_id: targetUserId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const profileImageUrl = studentResult.rows && studentResult.rows[0] 
      ? studentResult.rows[0].PROFILE_IMAGE_URL 
      : null;

    const refsResult = await conn.execute(
      `
      SELECT
        (SELECT COUNT(*) FROM leave_requests WHERE user_id = :b_user_id OR reviewed_by = :b_user_id) AS leave_refs,
        (SELECT COUNT(*) FROM attendance_records WHERE user_id = :b_user_id) AS attendance_refs,
        (SELECT COUNT(*) FROM student_fees WHERE user_id = :b_user_id) AS fee_refs,
        (SELECT COUNT(*) FROM student_feedback WHERE user_id = :b_user_id) AS feedback_refs,
        (SELECT COUNT(*) FROM canteen_menu WHERE created_by = :b_user_id) AS canteen_refs,
        (SELECT COUNT(*) FROM external_accommodations WHERE created_by = :b_user_id) AS accommodation_refs,
        (SELECT COUNT(*) FROM room_allocation_requests WHERE user_id = :b_user_id OR reviewed_by = :b_user_id) AS room_request_refs,
        (SELECT COUNT(*) FROM system_logs WHERE actor_user_id = :b_user_id) AS log_refs
      FROM dual
      `,
      { b_user_id: targetUserId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const refs = refsResult.rows[0] || {};
    const totalRefs =
      Number(refs.LEAVE_REFS || 0) +
      Number(refs.ATTENDANCE_REFS || 0) +
      Number(refs.FEE_REFS || 0) +
      Number(refs.FEEDBACK_REFS || 0) +
      Number(refs.CANTEEN_REFS || 0) +
      Number(refs.ACCOMMODATION_REFS || 0) +
      Number(refs.ROOM_REQUEST_REFS || 0) +
      Number(refs.LOG_REFS || 0);

    if (totalRefs > 0 && !force) {
      return res.status(400).json({
        message: "User has dependent records. Use ?force=true to delete anyway.",
        refs
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

    await conn.execute(
      `
      DELETE FROM staff_profiles
      WHERE user_id = :b_user_id
      `,
      { b_user_id: targetUserId },
      { autoCommit: false }
    );

    // Delete profile image file if it exists
    if (profileImageUrl) {
      deleteProfileImageFile(profileImageUrl);
    }

    if (force) {
      await conn.execute(
        `
        DELETE FROM attendance_records
        WHERE user_id = :b_user_id
        `,
        { b_user_id: targetUserId },
        { autoCommit: false }
      );
      await conn.execute(
        `
        DELETE FROM student_fees
        WHERE user_id = :b_user_id
        `,
        { b_user_id: targetUserId },
        { autoCommit: false }
      );
      await conn.execute(
        `
        DELETE FROM student_feedback
        WHERE user_id = :b_user_id
        `,
        { b_user_id: targetUserId },
        { autoCommit: false }
      );
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
      await conn.execute(
        `
        UPDATE canteen_menu
        SET created_by = NULL
        WHERE created_by = :b_user_id
        `,
        { b_user_id: targetUserId },
        { autoCommit: false }
      );
      await conn.execute(
        `
        UPDATE external_accommodations
        SET created_by = NULL
        WHERE created_by = :b_user_id
        `,
        { b_user_id: targetUserId },
        { autoCommit: false }
      );
      await conn.execute(
        `
        UPDATE room_allocation_requests
        SET reviewed_by = NULL
        WHERE reviewed_by = :b_user_id
        `,
        { b_user_id: targetUserId },
        { autoCommit: false }
      );
      await conn.execute(
        `
        DELETE FROM room_allocation_requests
        WHERE user_id = :b_user_id
        `,
        { b_user_id: targetUserId },
        { autoCommit: false }
      );
      await conn.execute(
        `
        DELETE FROM system_logs
        WHERE actor_user_id = :b_user_id
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
    await syncOverdueFeeStatuses(conn);
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

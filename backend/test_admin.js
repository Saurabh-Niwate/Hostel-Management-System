const { initialize, oracledb } = require('./src/config/db');
async function run() {
  await initialize();
  const conn = await oracledb.getConnection();
  
  // Try to generate a JWT token for the admin
  const jwt = require('jsonwebtoken');
  const res = await conn.execute("SELECT user_id, role_name FROM users JOIN roles ON users.role_id = roles.role_id WHERE role_name = 'Admin'");
  if (res.rows.length === 0) { console.log("No admin found"); return; }
  
  const admin = res.rows[0];
  const token = jwt.sign(
      { userId: admin.USER_ID, role: admin.ROLE_NAME },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: "1h" }
  );
  
  console.log("TOKEN:", token);
  
  // Now simulate the GET /admin/students request!
  try {
      const result = await conn.execute(
        `
        SELECT
          u.user_id,
          u.student_id,
          u.email,
          s.full_name,
          s.room_no,
          u.is_active
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        LEFT JOIN students s ON s.user_id = u.user_id
        WHERE r.role_name = 'Student'
        ORDER BY s.full_name ASC
        `,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      console.log("DB RESULT SUCCESS! Length:", result.rows.length);
  } catch(e) {
      console.log("DB ERROR:", e.message);
  }

  await conn.close();
}
run().catch(console.error);

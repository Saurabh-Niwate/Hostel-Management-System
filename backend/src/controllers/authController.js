const { oracledb } = require("../config/db");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  console.log("LOGIN ROUTE HIT");
  const { identifier, password } = req.body;
  console.log("Identifier:", identifier);
  console.log("Entered:", password);


  let conn;

  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
<<<<<<< HEAD
      `
      SELECT u.user_id, u.password, r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.student_id = :id
         OR u.emp_id = :id
         OR u.email = :id
      `,

      { id: identifier }
    );
=======
  `
  SELECT u.user_id, u.password, r.role_name
  FROM users u
  JOIN roles r ON u.role_id = r.role_id
  WHERE TRIM(u.student_id) = :id
     OR TRIM(u.emp_id) = :id
     OR TRIM(u.email) = :id
  `,
  { id: identifier }   
);
>>>>>>> backend



    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const userId = user[0];
    const dbPassword = user[1];
    const role = user[2];


    if (password !== dbPassword) {
      return res.status(401).json({ message: "Invalid credentials"
       });
    }
    
    const token = jwt.sign(
      { userId, role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role });

  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({ message: "Login failed" });
  } finally {

    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error("Error closing database connection:", err);
      }
    }
  }
};
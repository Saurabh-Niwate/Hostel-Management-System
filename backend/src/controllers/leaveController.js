const { oracledb } = require("../config/db");

exports.applyLeave = async (req, res) => {
  const { fromDate, toDate, reason } = req.body;
  const userId = req.user.userId;

  try {
    const conn = await oracledb.getConnection();

    await conn.execute(
      `
      INSERT INTO leave_requests (user_id, from_date, to_date, reason)
      VALUES (:uid,
              TO_DATE(:fd,'YYYY-MM-DD'),
              TO_DATE(:td,'YYYY-MM-DD'),
              :reason)
      `,
      {
        uid: userId,
        fd: fromDate,
        td: toDate,
        reason
      },
      { autoCommit: true }
    );

    res.json({ message: "Leave request submitted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Leave failed" });
  }
};
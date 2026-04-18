const { oracledb } = require("../config/db");

const getStudentRoomState = async (conn, userId) => {
  const result = await conn.execute(
    `
    SELECT room_no
    FROM students
    WHERE user_id = :b_user_id
    `,
    { b_user_id: userId },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  const roomNo = result.rows?.[0]?.ROOM_NO ? String(result.rows[0].ROOM_NO).trim() : "";
  return {
    roomNo,
    hasAssignedRoom: Boolean(roomNo)
  };
};

module.exports = {
  getStudentRoomState
};

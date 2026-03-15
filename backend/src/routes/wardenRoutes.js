const express = require("express");
const router = express.Router();
const {
  getRooms,
  getStudents,
  markAttendance,
  getRoomStudents,
  getAttendanceByDate,
  getStudentBasic,
  getLeaveStatus
} = require("../controllers/wardenController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

router.get("/rooms", verifyToken, requireRole("Warden"), getRooms);
router.get("/students", verifyToken, requireRole("Warden"), getStudents);
router.post("/mark-attendance", verifyToken, requireRole("Warden"), markAttendance);
router.get("/room-students/:roomNo", verifyToken, requireRole("Warden"), getRoomStudents);
router.get("/attendance/date/:date", verifyToken, requireRole("Warden"), getAttendanceByDate);
router.get("/students/:studentId/basic", verifyToken, requireRole("Warden"), getStudentBasic);
router.get("/leave-status", verifyToken, requireRole("Warden"), getLeaveStatus);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  markExit,
  markEntry,
  getTodayLogs,
  getStudentsOutside,
  getStudentStatus
} = require("../controllers/securityController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

router.post("/mark-exit", verifyToken, requireRole("Security"), markExit);
router.post("/mark-entry", verifyToken, requireRole("Security"), markEntry);
router.get("/today-logs", verifyToken, requireRole("Security"), getTodayLogs);
router.get("/students-outside", verifyToken, requireRole("Security"), getStudentsOutside);
router.get("/student-status/:studentId", verifyToken, requireRole("Security"), getStudentStatus);

module.exports = router;

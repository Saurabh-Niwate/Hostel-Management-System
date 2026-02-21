const express = require("express");
const router = express.Router();
const {
  getAllLeaves,
  getStudentLeaves,
  approveLeave,
  rejectLeave,
  getOverviewReport,
  getAttendanceSummary
} = require("../controllers/adminController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

router.get("/leaves", verifyToken, requireRole("Admin"), getAllLeaves);
router.get("/leaves/student/:studentId", verifyToken, requireRole("Admin"), getStudentLeaves);
router.get("/reports/overview", verifyToken, requireRole("Admin"), getOverviewReport);
router.get("/attendance/summary", verifyToken, requireRole("Admin"), getAttendanceSummary);
router.put("/leave/:leaveId/approve", verifyToken, requireRole("Admin"), approveLeave);
router.put("/leave/:leaveId/reject", verifyToken, requireRole("Admin"), rejectLeave);

module.exports = router;

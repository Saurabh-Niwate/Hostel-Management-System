const express = require("express");
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  getMyAttendance,
  getMyFeeStatus,
  submitFeedback,
  getMyFeedback,
  getCanteenMenu
} = require("../controllers/studentController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

router.get("/profile", verifyToken, requireRole("Student"), getMyProfile);
router.put("/profile", verifyToken, requireRole("Student"), updateMyProfile);
router.get("/attendance", verifyToken, requireRole("Student"), getMyAttendance);
router.get("/fees", verifyToken, requireRole("Student"), getMyFeeStatus);
router.post("/feedback", verifyToken, requireRole("Student"), submitFeedback);
router.get("/feedback", verifyToken, requireRole("Student"), getMyFeedback);
router.get("/canteen-menu", verifyToken, requireRole("Student"), getCanteenMenu);

module.exports = router;

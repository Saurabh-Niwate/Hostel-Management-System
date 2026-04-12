const express = require("express");
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getMyLeaveById,
  deleteMyPendingLeave
} = require("../controllers/leaveController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

router.post("/apply", verifyToken, requireRole("Student"), applyLeave);
router.get("/my-leaves", verifyToken, requireRole("Student"), getMyLeaves);
router.get("/:leaveId", verifyToken, requireRole("Student"), getMyLeaveById);
router.delete("/:leaveId", verifyToken, requireRole("Student"), deleteMyPendingLeave);

module.exports = router;

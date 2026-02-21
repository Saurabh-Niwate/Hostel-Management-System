const express = require("express");
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getMyLeaveById,
  deleteMyPendingLeave
} = require("../controllers/leaveController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/apply", verifyToken, applyLeave);
router.get("/my-leaves", verifyToken, getMyLeaves);
router.get("/:leaveId", verifyToken, getMyLeaveById);
router.delete("/:leaveId", verifyToken, deleteMyPendingLeave);

module.exports = router;

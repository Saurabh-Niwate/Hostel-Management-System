const express = require("express");
const router = express.Router();
const {
  createStudent,
  createStaff,
  getRoles,
  updateUserRole,
  getAllUsers,
  getUserById,
  updateStudentByStudentId,
  uploadStudentProfileImageByStudentId,
  getStudents,
  getStaff,
  resetUserPassword,
  deleteUser,
  getFeeRecords,
  createFeeRecord,
  updateFeeRecord,
  getSystemLogs
} = require("../controllers/technicalStaffController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");
const { uploadProfileImage } = require("../middlewares/uploadMiddleware");

router.get("/roles", verifyToken, requireRole("Technical Staff"), getRoles);
router.get("/users", verifyToken, requireRole("Technical Staff"), getAllUsers);
router.get("/users/:userId", verifyToken, requireRole("Technical Staff"), getUserById);
router.put("/students/:studentId", verifyToken, requireRole("Technical Staff"), updateStudentByStudentId);
router.post("/students/:studentId/profile-image", verifyToken, requireRole("Technical Staff"), uploadProfileImage.single("image"), uploadStudentProfileImageByStudentId);
router.get("/students", verifyToken, requireRole("Technical Staff"), getStudents);
router.get("/staff", verifyToken, requireRole("Technical Staff"), getStaff);
router.get("/fees", verifyToken, requireRole("Technical Staff"), getFeeRecords);
router.post("/fees", verifyToken, requireRole("Technical Staff"), createFeeRecord);
router.put("/fees/:feeId", verifyToken, requireRole("Technical Staff"), updateFeeRecord);
router.get("/system-logs", verifyToken, requireRole("Technical Staff"), getSystemLogs);
router.post("/create-student", verifyToken, requireRole("Technical Staff"), uploadProfileImage.single("image"), createStudent);
router.post("/create-staff", verifyToken, requireRole("Technical Staff"), createStaff);
router.put("/users/:userId/role", verifyToken, requireRole("Technical Staff"), updateUserRole);
router.put("/users/:userId/password", verifyToken, requireRole("Technical Staff"), resetUserPassword);
router.delete("/users/:userId", verifyToken, requireRole("Technical Staff"), deleteUser);

module.exports = router;

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
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getExternalAccommodations,
  createExternalAccommodation,
  updateExternalAccommodation,
  deleteExternalAccommodation,
  getRoomAllocationRequests,
  assignRoomAllocationRequest,
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
router.get("/rooms", verifyToken, requireRole("Technical Staff"), getRooms);
router.post("/rooms", verifyToken, requireRole("Technical Staff"), createRoom);
router.put("/rooms/:roomNo", verifyToken, requireRole("Technical Staff"), updateRoom);
router.delete("/rooms/:roomNo", verifyToken, requireRole("Technical Staff"), deleteRoom);
router.get("/external-accommodations", verifyToken, requireRole("Technical Staff"), getExternalAccommodations);
router.post("/external-accommodations", verifyToken, requireRole("Technical Staff"), createExternalAccommodation);
router.put("/external-accommodations/:accommodationId", verifyToken, requireRole("Technical Staff"), updateExternalAccommodation);
router.delete("/external-accommodations/:accommodationId", verifyToken, requireRole("Technical Staff"), deleteExternalAccommodation);
router.get("/room-allocation-requests", verifyToken, requireRole("Technical Staff"), getRoomAllocationRequests);
router.put("/room-allocation-requests/:requestId/assign", verifyToken, requireRole("Technical Staff"), assignRoomAllocationRequest);
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

const express = require("express");
const router = express.Router();
const {
  login,
  logout,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  uploadMyProfileImage,
  deleteMyProfileImage
} = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { uploadProfileImage } = require("../middlewares/uploadMiddleware");
const {
  authRateLimiter,
  validateLoginPayload,
  validateChangePasswordPayload
} = require("../middlewares/authSecurityMiddleware");

router.post("/login", authRateLimiter, validateLoginPayload, login);
router.post("/logout", verifyToken, logout);
router.get("/profile", verifyToken, getMyProfile);
router.put("/profile", verifyToken, updateMyProfile);
router.put("/change-password", verifyToken, authRateLimiter, validateChangePasswordPayload, changeMyPassword);
router.post("/profile-image", verifyToken, uploadProfileImage.single("image"), uploadMyProfileImage);
router.delete("/profile-image", verifyToken, deleteMyProfileImage);

module.exports = router;

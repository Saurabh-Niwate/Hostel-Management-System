const express = require("express");
const router = express.Router();
const { login, getMyProfile, updateMyProfile, changeMyPassword } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  authRateLimiter,
  validateLoginPayload,
  validateChangePasswordPayload
} = require("../middlewares/authSecurityMiddleware");

router.post("/login", authRateLimiter, validateLoginPayload, login);
router.get("/profile", verifyToken, getMyProfile);
router.put("/profile", verifyToken, updateMyProfile);
router.put("/change-password", verifyToken, authRateLimiter, validateChangePasswordPayload, changeMyPassword);

module.exports = router;

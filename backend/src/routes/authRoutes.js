const express = require("express");
const router = express.Router();
const { login, getMyProfile, updateMyProfile, changeMyPassword } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/login", login);
router.get("/profile", verifyToken, getMyProfile);
router.put("/profile", verifyToken, updateMyProfile);
router.put("/change-password", verifyToken, changeMyPassword);

module.exports = router;

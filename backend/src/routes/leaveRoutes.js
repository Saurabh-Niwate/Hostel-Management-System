const express = require("express");
const router = express.Router();
const { applyLeave } = require("../controllers/leaveController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/apply", verifyToken, applyLeave);

module.exports = router;
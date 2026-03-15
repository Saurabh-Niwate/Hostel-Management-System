require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { initialize } = require("./src/config/db");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/student", require("./src/routes/studentRoutes"));
app.use("/api/leave", require("./src/routes/leaveRoutes"));
app.use("/api/technical-staff", require("./src/routes/technicalStaffRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));
app.use("/api/warden", require("./src/routes/wardenRoutes"));
app.use("/api/security", require("./src/routes/securityRoutes"));
app.use("/api/canteen-owner", require("./src/routes/canteenOwnerRoutes"));

async function start() {
  await initialize();
  app.listen(process.env.PORT, () => {
    console.log("Server running on port", process.env.PORT);
  });
}

start();

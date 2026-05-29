require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { initialize } = require("./src/config/db");

const http = require("http");
const { Server } = require("socket.io");

const compression = require("compression");
const app = express();

app.set("trust proxy", true);
app.use(compression());
app.use(cors());
app.use(express.json({ limit: "16kb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Socket connection handler
io.on("connection", (socket) => {
  console.log("Socket client connected:", socket.id);
  
  socket.on("join", (userId) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined room user:${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket client disconnected:", socket.id);
  });
});

// Attach io to app
app.set("io", io);

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
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log("Server running on port", PORT);
  });
}

start();

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initialize } = require("./src/config/db");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/leave", require("./src/routes/leaveRoutes"));

async function start() {
  await initialize();
  app.listen(process.env.PORT, () => {
    console.log("Server running on port", process.env.PORT);
  });
}

start();
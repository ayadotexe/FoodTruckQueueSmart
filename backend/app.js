const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/AuthRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "QueueSmart backend is running" });
});

app.use("/api/auth", authRoutes);

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON." });
  }

  res.status(500).json({ error: "Server error." });
});

module.exports = app;
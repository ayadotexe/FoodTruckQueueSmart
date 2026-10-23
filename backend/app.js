const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/AuthRoutes");
const queueRoutes = require("./routes/queueRoutes");
const menuRoutes = require("./routes/MenuRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "QueueSmart backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/menu", menuRoutes);

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON." });
  }

  const status = err.status || 500;

  res.status(status).json({
    error: status === 500 ? "Server error." : err.message,
  });
});

module.exports = app;
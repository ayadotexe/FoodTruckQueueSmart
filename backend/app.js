const express = require("express");
const cors = require("cors");
const queueRoutes = require("./routes/queueRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "QueueSmart backend is running" });
});

app.use("/api/queue", queueRoutes);

// Error handler: turns thrown errors into JSON responses (400, 404, 409, ...)
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON" });
  }
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

module.exports = app;
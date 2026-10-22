const express = require("express");
const cors = require("cors");
const menuRoutes = require("./routes/MenuRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "QueueSmart backend is running" });
});

app.use("/api/menu", menuRoutes);

module.exports = app;
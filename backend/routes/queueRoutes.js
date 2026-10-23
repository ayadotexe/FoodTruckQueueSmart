/**
 * Queue Management Module - Routes
 * User:   POST /join, DELETE /leave/:userId, GET /status/:userId,
 *         GET /history/:userId, GET /summary
 * Admin:  GET / (view queue), POST /serve-next
 */
const express = require("express");
const controller = require("../controllers/queueController");

const router = express.Router();

// Temporary role check until the Authentication module is ready.
// Admin requests must send the header: x-user-role: admin
function requireAdmin(req, res, next) {
  if (req.header("x-user-role") !== "admin") {
    return res.status(403).json({ error: "Administrator access required" });
  }
  next();
}

router.post("/join", controller.joinQueue);
router.delete("/leave/:userId", controller.leaveQueue);
router.get("/status/:userId", controller.getStatus);
router.get("/history/:userId", controller.getHistory);
router.get("/summary", controller.getSummary);

router.get("/", requireAdmin, controller.getQueue);
router.post("/serve-next", requireAdmin, controller.serveNext);

module.exports = router;
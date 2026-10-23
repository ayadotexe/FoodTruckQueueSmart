/**
 * Queue Management Module - Controller
 * Handles request/response for the queue endpoints and shares one
 * in-memory queue service. Notifications are logged for now.
 */
const { createQueueService } = require("../services/queueService");

const queue = createQueueService({
  onNotify: (n) => console.log("[notification]", n),
});

// Express 5 forwards errors thrown here to the error handler in app.js
function joinQueue(req, res) {
  res.status(201).json(queue.joinQueue(req.body));
}

function leaveQueue(req, res) {
  res.status(200).json(queue.leaveQueue(req.params.userId));
}

function getStatus(req, res) {
  res.status(200).json(queue.getStatus(req.params.userId));
}

function getQueue(req, res) {
  res.status(200).json(queue.getQueue());
}

function getSummary(req, res) {
  res.status(200).json(queue.getSummary());
}

function serveNext(req, res) {
  res.status(200).json(queue.serveNext());
}

function getHistory(req, res) {
  res.status(200).json(queue.getHistory(req.params.userId));
}

module.exports = {
  joinQueue,
  leaveQueue,
  getStatus,
  getQueue,
  getSummary,
  serveNext,
  getHistory,
};
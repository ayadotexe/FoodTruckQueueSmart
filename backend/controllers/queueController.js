/**
 * Queue Management Module - Controller
 * Handles request/response for the queue endpoints. The queue service
 * stores everything in the MySQL database. Notifications are also logged.
 */
const history = require("../services/history");
const notification = require("../services/notification");
const { createQueueService } = require("../services/queueService");

// const queue = createQueueService({
//   onNotify: (n) => {
//     const typeMap = {
//       JOINED: notification.TYPES.JOINED,
//       NEAR_FRONT: notification.TYPES.NEAR_TURN,
//       SERVED: notification.TYPES.SERVED,
//     };

//     const type = typeMap[n.type];

//     if (type) {
//       notification.notify(n.userId, type, n.message);
//     }

//     console.log("[notification]", n);
//   },
// });

// changed by aya
const queue = createQueueService({
  onNotify: (n) => {
    console.log("[notification]", n);
  },
});

// Express 5 forwards errors thrown here to the error handler in app.js
async function joinQueue(req, res) {
  res.status(201).json(await queue.joinQueue(req.body));
}

async function leaveQueue(req, res) {
  res.status(200).json(await queue.leaveQueue(req.params.userId));
}

async function getStatus(req, res) {
  res.status(200).json(await queue.getStatus(req.params.userId));
}

async function getQueue(req, res) {
  res.status(200).json(await queue.getQueue());
}

async function getSummary(req, res) {
  res.status(200).json(await queue.getSummary());
}

async function serveNext(req, res) {
  res.status(200).json(await queue.serveNext());
}

async function getHistory(req, res) {
  res.status(200).json(await queue.getHistory(req.params.userId));
}

// added by aya
async function getNotifications(req, res) {
  res.status(200).json(
    await notification.getNotifications(req.params.userId)
  );
}

module.exports = {
  joinQueue,
  leaveQueue,
  getStatus,
  getQueue,
  getSummary,
  serveNext,
  getHistory,
  getNotifications,

};
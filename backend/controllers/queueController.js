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
// added by aya
async function joinQueue(req, res) {
  const result = await queue.joinQueue(req.body);

  await history.record(result.userId, {
    entryId: result.id,
    event: history.EVENTS.JOINED,
    position: result.position,
  });

  res.status(201).json(result);
}

// added by aya
async function leaveQueue(req, res) {
  const userId = req.params.userId;
  const previousStatus = await queue.getStatus(userId);
  const result = await queue.leaveQueue(userId);

  await history.record(userId, {
    entryId: previousStatus.id,
    event: history.EVENTS.LEFT,
    position: previousStatus.position,
  });

  res.status(200).json(result);
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

// added by aya
async function serveNext(req, res) {
  const result = await queue.serveNext();

  await history.record(result.userId, {
    entryId: result.id,
    event: history.EVENTS.SERVED,
  });

  res.status(200).json(result);
}

// added by aya
async function getHistory(req, res) {
  const rows = await history.getHistory(req.params.userId);

  const events = rows.map((row) => ({
    id: row.history_id,
    userId: row.user_id,
    entryId: row.entry_id,
    queueId: row.queue_id,
    event: row.event === "CANCELED" ? "LEFT" : row.event,
    position: row.position,
    at: new Date(row.created_at).toISOString(),
  }));

  res.status(200).json(events);
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
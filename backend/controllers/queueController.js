/**
 * Queue Management Module - Controller
 * Handles request/response for the queue endpoints and shares one
 * in-memory queue service. Notifications are logged for now.
 */
const history = require("../services/history");
const notification = require("../services/notification");
const { createQueueService } = require("../services/queueService");

const queue = createQueueService({
  onNotify: (n) => {
    const typeMap = {
      JOINED: notification.TYPES.JOINED,
      NEAR_FRONT: notification.TYPES.NEAR_TURN,
      SERVED: notification.TYPES.SERVED,
    };

    const type = typeMap[n.type];

    if (type) {
      notification.notify(n.userId, type, n.message);
    }

    console.log("[notification]", n);
  },
});

// Express 5 forwards errors thrown here to the error handler in app.js
function joinQueue(req, res) {
  const result = queue.joinQueue(req.body);

  history.record(result.userId, {
    truckId: null,
    event: history.EVENTS.JOINED,
    position: result.position,
  });

  res.status(201).json(result);
}

function leaveQueue(req, res) {
  const userId = req.params.userId;
  const previousStatus = queue.getStatus(userId);

  const result = queue.leaveQueue(userId);

  history.record(userId, {
    truckId: null,
    event: history.EVENTS.LEFT,
    position: previousStatus.position,
  });

  res.status(200).json(result);
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
  const result = queue.serveNext();

  history.record(result.userId, {
    truckId: null,
    event: history.EVENTS.SERVED,
  });

  res.status(200).json(result);
}

function getHistory(req, res) {
  res.status(200).json(history.getHistory(req.params.userId));
}

function getNotifications(req, res) {
  res.status(200).json(
    notification.getNotifications(req.params.userId)
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
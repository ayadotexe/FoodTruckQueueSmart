
/**
 * Queue Management Module - Controller
 * Handles request/response for queue endpoints.
 */
const history = require("../services/history");
const notification = require("../services/notification");
const { createQueueService } = require("../services/queueService");

const queue = createQueueService({
  onNotify: (n) => {
    const typeMap = {
      JOINED: notification.TYPES.JOINED,
      NEAR_FRONT: notification.TYPES.NEAR_FRONT,
      SERVED: notification.TYPES.SERVED,
    };

    const type = typeMap[n.type];

    if (type) {
      notification
        .notify(n.userId, type, n.message, {
          entryId: n.entryId ?? null,
        })
        .catch((error) => {
          console.error("Failed to save notification:", error);
        });
    }

    console.log("[notification]", n);
  },
});

// Only records history when a real database entry ID is available.
async function recordHistory(userId, entryId, event, position = null) {
  if (!entryId) {
    console.warn(
      `History not saved for ${userId}: database entry ID is unavailable.`
    );
    return null;
  }

  return history.record(userId, {
    entryId,
    event,
    position,
  });
}

async function joinQueue(req, res) {
  const result = queue.joinQueue(req.body);

  await recordHistory(
    result.userId,
    result.entryId,
    history.EVENTS.JOINED,
    result.position
  );

  res.status(201).json(result);
}

async function leaveQueue(req, res) {
  const userId = req.params.userId;
  const previousStatus = queue.getStatus(userId);

  const result = queue.leaveQueue(userId);

  await recordHistory(
    userId,
    result.entryId,
    history.EVENTS.LEFT,
    previousStatus.position
  );

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

async function serveNext(req, res) {
  const result = queue.serveNext();

  await recordHistory(
    result.userId,
    result.entryId,
    history.EVENTS.SERVED
  );

  res.status(200).json(result);
}

async function getHistory(req, res) {
  const result = await history.getHistory(req.params.userId);
  res.status(200).json(result);
}

async function getNotifications(req, res) {
  const result = await notification.getNotifications(req.params.userId);
  res.status(200).json(result);
}

async function markNotificationAsViewed(req, res) {
  const notificationId = Number(req.params.notificationId);
  const userId = req.params.userId;

  const result = await notification.markAsViewed(
    notificationId,
    userId
  );

  res.status(200).json(result);
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
  markNotificationAsViewed
};

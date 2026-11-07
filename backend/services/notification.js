// Simulated notifications: stored in memory and logged. No real email/SMS.
const TYPES = Object.freeze({ JOINED: 'JOINED', NEAR_TURN: 'NEAR_TURN', SERVED: 'SERVED' });
const NEAR_THRESHOLD = 2; // first 2 people in line count as "close to being served"

const store = new Map(); // userId -> array of notifications
let counter = 0;

function notify(userId, type, message, meta = {}) {
  const notification = {
    id: ++counter,
    userId,
    type,
    message,
    ...meta,
    createdAt: new Date().toISOString(),
  };
  if (!store.has(userId)) store.set(userId, []);
  store.get(userId).push(notification);
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[NOTIFY] (${type}) -> ${userId}: ${message}`);
  }
  return notification;
}

// Trigger 1: user joins a queue
function notifyJoined(userId, name, truckId, position) {
  return notify(
    userId,
    TYPES.JOINED,
    `${name}, you joined the queue at ${truckId}. Your position: ${position}.`,
    { truckId, position }
  );
}

// Trigger 2: user is close to being served.
// `queue` is the array of entries for one truck: [{ userId, name, ... }, ...]
// Each user is only notified once.
function checkNearTurn(truckId, queue) {
  const sent = [];
  queue.forEach((entry, i) => {
    if (i < NEAR_THRESHOLD && !entry.nearNotified) {
      entry.nearNotified = true;
      const position = i + 1;
      const text =
        position === 1
          ? `${entry.name}, you're next at ${truckId}! Head to the truck.`
          : `${entry.name}, you're almost up at ${truckId} (position ${position}).`;
      sent.push(notify(entry.userId, TYPES.NEAR_TURN, text, { truckId, position }));
    }
  });
  return sent;
}

function notifyServed(userId, name, truckId) {
  return notify(userId, TYPES.SERVED, `${name}, your order is ready at ${truckId}!`, { truckId });
}

function getNotifications(userId) {
  return [...(store.get(userId) || [])];
}

function reset() {
  store.clear();
  counter = 0;
}

module.exports = {
  TYPES,
  NEAR_THRESHOLD,
  notify,
  notifyJoined,
  checkNearTurn,
  notifyServed,
  getNotifications,
  reset,
};
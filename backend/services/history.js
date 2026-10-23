// In-memory queue participation history (no database).
const EVENTS = Object.freeze({ JOINED: 'JOINED', SERVED: 'SERVED', LEFT: 'LEFT' });

const store = new Map(); // userId -> array of history entries

function record(userId, { truckId, event, position = null }) {
  const entry = { userId, truckId, event, position, at: new Date().toISOString() };
  if (!store.has(userId)) store.set(userId, []);
  store.get(userId).push(entry);
  return entry;
}

function getHistory(userId) {
  return [...(store.get(userId) || [])];
}

function reset() {
  store.clear();
}

module.exports = { EVENTS, record, getHistory, reset };
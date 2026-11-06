// Database-backed queue participation history.
const db = require('../config/db');

const EVENTS = Object.freeze({
  JOINED: 'JOINED',
  NEAR_FRONT: 'NEAR_FRONT',
  NEAR_TURN: 'NEAR_FRONT',
  SERVED: 'SERVED',
  CANCELED: 'CANCELED',
  LEFT: 'CANCELED'
});

const VALID_EVENTS = [
  EVENTS.JOINED,
  EVENTS.NEAR_FRONT,
  EVENTS.SERVED,
  EVENTS.CANCELED
];

const MAX_ENTRY_ID = 4294967295;
const MAX_POSITION = 2147483647;

// Validate user ID.
function validateUserId(userId) {
  if (typeof userId !== 'string' || userId.length !== 36) {
    throw new Error('A valid user ID is required.');
  }
}

// Record a queue event in MySQL.
async function record(userId, data = {}) {
  const { entryId, event, position = null } = data;

  validateUserId(userId);

  if (
    !Number.isInteger(entryId) ||
    entryId < 1 ||
    entryId > MAX_ENTRY_ID
  ) {
    throw new Error('A valid queue entry ID is required.');
  }

  if (!VALID_EVENTS.includes(event)) {
    throw new Error('Invalid history event.');
  }

  if (
    position !== null &&
    (!Number.isInteger(position) ||
      position < 0 ||
      position > MAX_POSITION)
  ) {
    throw new Error('Position must be a non-negative integer or null.');
  }

  const [result] = await db.execute(
    `INSERT INTO QueueHistory (entry_id, event, position)
     SELECT qe.entry_id, ?, ?
     FROM QueueEntry qe
     JOIN CustomerOrder co ON qe.order_id = co.order_id
     WHERE qe.entry_id = ? AND co.user_id = ?`,
    [event, position, entryId, userId]
  );

  if (result.affectedRows === 0) {
    throw new Error('Queue entry not found for this user.');
  }

  const [rows] = await db.execute(
    `SELECT history_id, entry_id, event, position, created_at
     FROM QueueHistory
     WHERE history_id = ?`,
    [result.insertId]
  );

  if (!rows || rows.length === 0) {
    throw new Error('Could not retrieve the saved history record.');
  }

  return rows[0];
}

// Retrieve history records belonging to a user.
async function getHistory(userId) {
  validateUserId(userId);

  const [rows] = await db.execute(
    `SELECT
       ch.history_id,
       co.user_id,
       qe.entry_id,
       qe.queue_id,
       ch.event,
       ch.position,
       ch.created_at
     FROM QueueHistory ch
     JOIN QueueEntry qe ON ch.entry_id = qe.entry_id
     JOIN CustomerOrder co ON qe.order_id = co.order_id
     WHERE co.user_id = ?
     ORDER BY ch.created_at DESC, ch.history_id DESC`,
    [userId]
  );

  return rows;
}

module.exports = {
  EVENTS,
  record,
  getHistory
};
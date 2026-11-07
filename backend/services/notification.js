
const db = require('../config/db');

const TYPES = Object.freeze({
    JOINED: 'JOINED',
    NEAR_FRONT: 'NEAR_FRONT',
    NEAR_TURN: 'NEAR_FRONT',
    SERVED: 'SERVED'
});

const NEAR_THRESHOLD = 2;
const MAX_ENTRY_ID = 4294967295;

// Validate user IDs.
function validateUserId(userId) {
    if (typeof userId !== 'string' || userId.length !== 36) {
        throw new Error('User ID must be a valid 36-character ID.');
    }
}

// Validate entry IDs.
function validateEntryId(entryId) {
    if (
        entryId !== null &&
        entryId !== undefined &&
        (!Number.isInteger(entryId) ||
         entryId < 1 ||
         entryId > MAX_ENTRY_ID)
    ) {
        throw new Error('Entry ID must be a positive integer.');
    }
}

// Validate notification IDs.
function validateNotificationId(notificationId) {
    if (
        !Number.isInteger(notificationId) ||
        notificationId < 1 ||
        notificationId > MAX_ENTRY_ID
    ) {
        throw new Error('Invalid notification ID.');
    }
}

// Create and save a notification in MySQL.
async function notify(userId, type, message, meta = {}) {
    validateUserId(userId);

    if (typeof message !== 'string' ||
        message.trim().length === 0 ||
        message.length > 500) {
        throw new Error('Message must be between 1 and 500 characters.');
    }

    if (!Object.values(TYPES).includes(type)) {
        throw new Error('Invalid notification type.');
    }

    const entryId = meta.entryId ?? null;
    validateEntryId(entryId);

    const [result] = await db.execute(
        `INSERT INTO Notification
            (user_id, entry_id, type, message)
         VALUES (?, ?, ?, ?)`,
        [userId, entryId, type, message]
    );

    const [rows] = await db.execute(
        `SELECT
            notification_id AS id,
            user_id AS userId,
            entry_id AS entryId,
            type,
            message,
            created_at AS createdAt,
            status
         FROM Notification
         WHERE notification_id = ?`,
        [result.insertId]
    );

    if (!rows || rows.length === 0) {
        throw new Error('Failed to retrieve saved notification.');
    }

    return rows[0];
}

// Trigger 1: User joins a queue.
async function notifyJoined(userId, name, truckId, position, entryId = null) {
    if (typeof name !== 'string' || !name.trim()) {
        throw new Error('Name is required.');
    }

    if (typeof truckId !== 'string' || !truckId.trim()) {
        throw new Error('Truck ID is required.');
    }

    if (!Number.isInteger(position) || position < 1) {
        throw new Error('Position must be a positive integer.');
    }

    validateEntryId(entryId);

    return notify(
        userId,
        TYPES.JOINED,
        `${name}, you joined the queue at ${truckId}. Your position: ${position}.`,
        { entryId }
    );
}

// Trigger 2: User is close to being served.
async function checkNearTurn(truckId, queue) {
    if (typeof truckId !== 'string' || !truckId.trim()) {
        throw new Error('Truck ID is required.');
    }

    if (!Array.isArray(queue)) {
        throw new Error('Queue must be an array.');
    }

    const sent = [];

    for (let i = 0; i < Math.min(NEAR_THRESHOLD, queue.length); i++) {
        const entry = queue[i];

        if (!entry.nearNotified) {
            const position = i + 1;

            const message =
                position === 1
                    ? `${entry.name}, you're next at ${truckId}! Head to the truck.`
                    : `${entry.name}, you're almost up at ${truckId} (position ${position}).`;

            const result = await notify(
                entry.userId,
                TYPES.NEAR_FRONT,
                message,
                { entryId: entry.entryId ?? null }
            );

            // Only mark after the database insert succeeds.
            entry.nearNotified = true;

            sent.push(result);
        }
    }

    return sent;
}

// Trigger 3: User's order has been served.
async function notifyServed(userId, name, truckId, entryId = null) {
    if (typeof name !== 'string' || !name.trim()) {
        throw new Error('Name is required.');
    }

    if (typeof truckId !== 'string' || !truckId.trim()) {
        throw new Error('Truck ID is required.');
    }

    validateEntryId(entryId);

    return notify(
        userId,
        TYPES.SERVED,
        `${name}, your order is ready at ${truckId}!`,
        { entryId }
    );
}

// Retrieve notifications belonging to a user.
async function getNotifications(userId) {
    validateUserId(userId);

    const [rows] = await db.execute(
        `SELECT
            notification_id AS id,
            user_id AS userId,
            entry_id AS entryId,
            type,
            message,
            created_at AS createdAt,
            status
         FROM Notification
         WHERE user_id = ?
         ORDER BY created_at DESC, notification_id DESC`,
        [userId]
    );

    return rows;
}

// Mark one of the user's notifications as viewed.
async function markAsViewed(notificationId, userId) {
    validateNotificationId(notificationId);
    validateUserId(userId);

    const [result] = await db.execute(
        `UPDATE Notification
         SET status = 'viewed'
         WHERE notification_id = ?
           AND user_id = ?`,
        [notificationId, userId]
    );

    if (result.affectedRows === 0) {
        throw new Error('Notification not found for this user.');
    }

    return { message: 'Notification marked as viewed.' };
}

module.exports = {
    TYPES,
    NEAR_THRESHOLD,
    notify,
    notifyJoined,
    checkNearTurn,
    notifyServed,
    getNotifications,
    markAsViewed
};

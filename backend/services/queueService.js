/**
 * Queue Management Module (database version)
 * - Custom error classes (400, 404, 409) and validateJoin(), which checks
 *   required fields, types, and length limits for joining the queue.
 * - createQueueService(): stores the queue in MySQL (Queue, QueueEntry,
 *   CustomerOrder, OrderItem, Notification). Ordering is priority first,
 *   then arrival order. Wait estimate = total prep time of the orders ahead.
 */

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
    this.status = 404;
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConflictError";
    this.status = 409;
  }
}

const VALID_PRIORITIES = ["normal", "high"];

function validateJoin({ userId, items, priority = "normal", notes = "" }) {
  if (typeof userId !== "string" || !userId.trim()) {
    throw new ValidationError("userId is required and must be a string");
  }
  if (userId.length > 36) {
    throw new ValidationError("userId must be 36 characters or less");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError("items must be a non-empty array");
  }
  if (items.length > 20) {
    throw new ValidationError("items cannot exceed 20 entries");
  }

  items.forEach((item, i) => {
    if (!Number.isInteger(item?.menuItemId) || item.menuItemId < 1) {
      throw new ValidationError(`items[${i}].menuItemId must be a positive integer`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      throw new ValidationError(`items[${i}].quantity must be an integer from 1 to 20`);
    }
  });

  if (!VALID_PRIORITIES.includes(priority)) {
    throw new ValidationError("priority must be 'normal' or 'high'");
  }
  if (typeof notes !== "string" || notes.length > 200) {
    throw new ValidationError("notes must be a string of 200 characters or less");
  }

  return { userId: userId.trim(), items, priority, notes: notes.trim() };
}

const NEAR_THRESHOLD = 2; // "close to being served" = position 2 or better

function createQueueService({ db = require("../config/db"), onNotify = () => {} } = {}) {
  // The single queue (first row in the Queue table)
  async function loadQueue() {
    const [rows] = await db.query(
      "SELECT queue_id, status FROM Queue ORDER BY queue_id LIMIT 1"
    );
    if (rows.length === 0) throw new NotFoundError("No queue exists");
    return rows[0];
  }

  // People currently waiting, in serving order (high priority first, then arrival)
  async function getWaiting(queueId) {
    const [entries] = await db.query(
      `SELECT qe.entry_id AS id, qe.priority, qe.joined_at AS joinedAt,
              qe.near_notified AS nearNotified,
              o.order_id AS orderId, o.user_id AS userId, o.notes
         FROM QueueEntry qe
         JOIN CustomerOrder o ON o.order_id = qe.order_id
        WHERE qe.queue_id = ? AND qe.status = 'waiting'
        ORDER BY qe.priority DESC, qe.entry_id ASC`,
      [queueId]
    );
    if (entries.length === 0) return [];

    const [items] = await db.query(
      `SELECT order_id AS orderId, item_name AS name, quantity, prep_minutes AS prepMinutes
         FROM OrderItem WHERE order_id IN (?)`,
      [entries.map((e) => e.orderId)]
    );
    return entries.map((e) => ({
      ...e,
      items: items
        .filter((it) => it.orderId === e.orderId)
        .map(({ name, quantity, prepMinutes }) => ({ name, quantity, prepMinutes })),
    }));
  }

  const prepTime = (entry) =>
    entry.items.reduce((sum, it) => sum + it.prepMinutes * it.quantity, 0);

  function estimateWait(position, ordered) {
    return ordered.slice(0, position - 1).reduce((sum, e) => sum + prepTime(e), 0);
  }

  function view(entry, ordered) {
    const position = ordered.findIndex((e) => e.id === entry.id) + 1;
    return {
      id: entry.id,
      userId: entry.userId,
      items: entry.items,
      priority: entry.priority,
      notes: entry.notes,
      joinedAt: new Date(entry.joinedAt).toISOString(),
      position,
      estimatedWaitMinutes: estimateWait(position, ordered),
    };
  }

  async function notify(userId, entryId, type, message) {
    await db.query(
      "INSERT INTO Notification (user_id, entry_id, type, message) VALUES (?, ?, ?, ?)",
      [userId, entryId, type, message]
    );
    onNotify({ userId, type, message });
  }

  async function notifyNearFront(queueId) {
    const ordered = await getWaiting(queueId);
    const nearFront = ordered.slice(0, NEAR_THRESHOLD);
    for (let i = 0; i < nearFront.length; i++) {
      const e = nearFront[i];
      if (!e.nearNotified) {
        await db.query("UPDATE QueueEntry SET near_notified = 1 WHERE entry_id = ?", [e.id]);
        await notify(
          e.userId,
          e.id,
          "NEAR_FRONT",
          `You're #${i + 1} in line. Get ready for pickup!`
        );
      }
    }
  }

  return {
    async joinQueue(input) {
      const data = validateJoin(input);
      const queue = await loadQueue();
      if (queue.status !== "open") throw new ConflictError("The queue is closed");

      const waiting = await getWaiting(queue.queue_id);
      if (waiting.some((e) => e.userId === data.userId)) {
        throw new ConflictError("User is already in the queue");
      }

      // Name, price, and prep time come from the menu, not from the client
      const ids = [...new Set(data.items.map((it) => it.menuItemId))];
      const [menu] = await db.query(
        `SELECT menu_item_id, name, price, expected_duration_minutes
           FROM MenuItem WHERE menu_item_id IN (?) AND is_active = 1`,
        [ids]
      );
      const byId = new Map(menu.map((m) => [m.menu_item_id, m]));
      data.items.forEach((it, i) => {
        if (!byId.has(it.menuItemId)) {
          throw new ValidationError(`items[${i}].menuItemId does not exist`);
        }
      });

      // Order + items + queue entry are saved together or not at all
      const conn = await db.getConnection();
      let entryId;
      try {
        await conn.beginTransaction();
        const [order] = await conn.query(
          "INSERT INTO CustomerOrder (user_id, notes) VALUES (?, ?)",
          [data.userId, data.notes]
        );
        const rows = data.items.map((it) => {
          const m = byId.get(it.menuItemId);
          return [order.insertId, m.menu_item_id, m.name, it.quantity, m.price, m.expected_duration_minutes];
        });
        await conn.query(
          "INSERT INTO OrderItem (order_id, menu_item_id, item_name, quantity, unit_price, prep_minutes) VALUES ?",
          [rows]
        );
        const [entry] = await conn.query(
          "INSERT INTO QueueEntry (queue_id, order_id, priority) VALUES (?, ?, ?)",
          [queue.queue_id, order.insertId, data.priority]
        );
        entryId = entry.insertId;
        await conn.commit();
      } catch (err) {
        await conn.rollback();
        if (err.code === "ER_NO_REFERENCED_ROW_2") throw new NotFoundError("User not found");
        throw err;
      } finally {
        conn.release();
      }

      const ordered = await getWaiting(queue.queue_id);
      const result = view(ordered.find((e) => e.id === entryId), ordered);
      await notify(
        data.userId,
        entryId,
        "JOINED",
        `You joined the queue at position ${result.position}. Estimated wait: ${result.estimatedWaitMinutes} min.`
      );
      await notifyNearFront(queue.queue_id);
      return result;
    },

    async leaveQueue(userId) {
      const { queue_id } = await loadQueue();
      const waiting = await getWaiting(queue_id);
      const entry = waiting.find((e) => e.userId === userId);
      if (!entry) throw new NotFoundError("User is not in the queue");
      await db.query(
        "UPDATE QueueEntry SET status = 'canceled', finished_at = NOW() WHERE entry_id = ?",
        [entry.id]
      );
      await notifyNearFront(queue_id);
      return { message: "Left the queue" };
    },

    async getStatus(userId) {
      const { queue_id } = await loadQueue();
      const ordered = await getWaiting(queue_id);
      const entry = ordered.find((e) => e.userId === userId);
      if (!entry) throw new NotFoundError("User is not in the queue");
      return view(entry, ordered);
    },

    // Admin: current queue in serving order
    async getQueue() {
      const { queue_id } = await loadQueue();
      const ordered = await getWaiting(queue_id);
      return ordered.map((e) => view(e, ordered));
    },

    // Public: how busy the line is (for the user dashboard)
    // estimatedWaitMinutes = how long someone joining right now would wait
    async getSummary() {
      const { queue_id } = await loadQueue();
      const ordered = await getWaiting(queue_id);
      return {
        count: ordered.length,
        estimatedWaitMinutes: ordered.reduce((sum, e) => sum + prepTime(e), 0),
      };
    },

    // Admin: serve the next user
    async serveNext() {
      const { queue_id } = await loadQueue();
      const [next] = await getWaiting(queue_id);
      if (!next) throw new NotFoundError("Queue is empty");
      await db.query(
        "UPDATE QueueEntry SET status = 'served', finished_at = NOW() WHERE entry_id = ?",
        [next.id]
      );
      await notify(next.userId, next.id, "SERVED", "Your order is ready for pickup!");
      await notifyNearFront(queue_id);
      return { id: next.id, userId: next.userId, items: next.items, status: "served" };
    },

    // For the History module ("canceled" is reported as "left", like before)
    async getHistory(userId) {
      const [rows] = await db.query(
        `SELECT qe.entry_id AS id, qe.order_id AS orderId, o.user_id AS userId, o.notes,
                qe.priority, qe.joined_at AS joinedAt, qe.status, qe.finished_at AS finishedAt
           FROM QueueEntry qe
           JOIN CustomerOrder o ON o.order_id = qe.order_id
          WHERE o.user_id = ? AND qe.status IN ('served', 'canceled')
          ORDER BY qe.finished_at DESC, qe.entry_id DESC`,
        [userId]
      );
      if (rows.length === 0) return [];

      const [items] = await db.query(
        `SELECT order_id AS orderId, item_name AS name, quantity, prep_minutes AS prepMinutes
           FROM OrderItem WHERE order_id IN (?)`,
        [rows.map((r) => r.orderId)]
      );
      return rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        notes: r.notes,
        priority: r.priority,
        joinedAt: new Date(r.joinedAt).toISOString(),
        finishedAt: r.finishedAt ? new Date(r.finishedAt).toISOString() : null,
        status: r.status === "canceled" ? "left" : r.status,
        items: items
          .filter((it) => it.orderId === r.orderId)
          .map(({ name, quantity, prepMinutes }) => ({ name, quantity, prepMinutes })),
      }));
    },
  };
}

module.exports = {
  ValidationError,
  NotFoundError,
  ConflictError,
  validateJoin,
  createQueueService,
};
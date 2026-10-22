/**
 * Queue Management Module
 * - Custom error classes (400, 404, 409) and validateJoin(), which checks
 *   required fields, types, and length limits for joining the queue.
 * - createQueueService(): single in-memory queue. Ordering is priority first,
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
  if (userId.length > 50) {
    throw new ValidationError("userId must be 50 characters or less");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError("items must be a non-empty array");
  }
  if (items.length > 20) {
    throw new ValidationError("items cannot exceed 20 entries");
  }

  items.forEach((item, i) => {
    if (typeof item?.name !== "string" || !item.name.trim() || item.name.length > 50) {
      throw new ValidationError(`items[${i}].name must be a string (1-50 chars)`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      throw new ValidationError(`items[${i}].quantity must be an integer from 1 to 20`);
    }
    if (!Number.isInteger(item.prepMinutes) || item.prepMinutes < 1 || item.prepMinutes > 60) {
      throw new ValidationError(`items[${i}].prepMinutes must be an integer from 1 to 60`);
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

const PRIORITY_RANK = { high: 2, normal: 1 };
const NEAR_THRESHOLD = 2; // "close to being served" = position 2 or better

function createQueueService({ onNotify = () => {} } = {}) {
  let waiting = []; // people currently in line
  let history = []; // people who were served or left (for the History module)
  let nextId = 1;
  let seq = 1; // arrival counter, used to break ties

  const sorted = () =>
    [...waiting].sort(
      (a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || a.seq - b.seq
    );

  const prepTime = (entry) =>
    entry.items.reduce((sum, it) => sum + it.prepMinutes * it.quantity, 0);

  function estimateWait(position, ordered = sorted()) {
    return ordered.slice(0, position - 1).reduce((sum, e) => sum + prepTime(e), 0);
  }

  function view(entry, ordered = sorted()) {
    const position = ordered.findIndex((e) => e.id === entry.id) + 1;
    return {
      id: entry.id,
      userId: entry.userId,
      items: entry.items,
      priority: entry.priority,
      notes: entry.notes,
      joinedAt: entry.joinedAt,
      position,
      estimatedWaitMinutes: estimateWait(position, ordered),
    };
  }

  function notifyNearFront() {
    sorted()
      .slice(0, NEAR_THRESHOLD)
      .forEach((e, i) => {
        if (!e.nearNotified) {
          e.nearNotified = true;
          onNotify({
            userId: e.userId,
            type: "NEAR_FRONT",
            message: `You're #${i + 1} in line. Get ready for pickup!`,
          });
        }
      });
  }

  return {
    joinQueue(input) {
      const data = validateJoin(input);
      if (waiting.some((e) => e.userId === data.userId)) {
        throw new ConflictError("User is already in the queue");
      }
      const entry = {
        id: nextId++,
        seq: seq++,
        ...data,
        joinedAt: new Date().toISOString(),
        nearNotified: false,
      };
      waiting.push(entry);
      const result = view(entry);
      onNotify({
        userId: entry.userId,
        type: "JOINED",
        message: `You joined the queue at position ${result.position}. Estimated wait: ${result.estimatedWaitMinutes} min.`,
      });
      notifyNearFront();
      return result;
    },

    leaveQueue(userId) {
      const entry = waiting.find((e) => e.userId === userId);
      if (!entry) throw new NotFoundError("User is not in the queue");
      waiting = waiting.filter((e) => e !== entry);
      history.push({ ...entry, status: "left", finishedAt: new Date().toISOString() });
      notifyNearFront();
      return { message: "Left the queue" };
    },

    getStatus(userId) {
      const entry = waiting.find((e) => e.userId === userId);
      if (!entry) throw new NotFoundError("User is not in the queue");
      return view(entry);
    },

    // Admin: current queue in serving order
    getQueue() {
      const ordered = sorted();
      return ordered.map((e) => view(e, ordered));
    },

    // Admin: serve the next user
    serveNext() {
      const [next] = sorted();
      if (!next) throw new NotFoundError("Queue is empty");
      waiting = waiting.filter((e) => e !== next);
      history.push({ ...next, status: "served", finishedAt: new Date().toISOString() });
      onNotify({
        userId: next.userId,
        type: "SERVED",
        message: "Your order is ready for pickup!",
      });
      notifyNearFront();
      return { id: next.id, userId: next.userId, items: next.items, status: "served" };
    },

    // For the History module
    getHistory(userId) {
      return history.filter((e) => e.userId === userId);
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
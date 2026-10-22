/**
 * Queue Management Module - Validation & Errors
 * Defines custom error classes (400, 404, 409) and validateJoin(),
 * which checks required fields, types, and length limits for joining the queue.
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

module.exports = {
  ValidationError,
  NotFoundError,
  ConflictError,
  validateJoin,
};
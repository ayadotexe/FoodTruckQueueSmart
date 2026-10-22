/**
 * Unit tests for the Queue Management Module (queueService).
 * Covers core business logic (join, leave, status, serve, ordering,
 * wait estimate, notifications, history) and validation rules.
 */
const {
  createQueueService,
  validateJoin,
  ValidationError,
  NotFoundError,
  ConflictError,
} = require("../services/queueService");

const order = (userId, extra = {}) => ({
  userId,
  items: [{ name: "Taco", quantity: 2, prepMinutes: 5 }],
  ...extra,
});

describe("queueService", () => {
  let queue;
  let notify;

  beforeEach(() => {
    notify = jest.fn();
    queue = createQueueService({ onNotify: notify });
  });

  describe("joinQueue", () => {
    it("returns position and wait estimate for the first user", () => {
      const a = queue.joinQueue(order("a"));
      expect(a.position).toBe(1);
      expect(a.estimatedWaitMinutes).toBe(0);
      expect(a.priority).toBe("normal");
    });

    it("estimates wait as the total prep time of orders ahead", () => {
      queue.joinQueue(order("a")); // 2 tacos x 5 min = 10
      const b = queue.joinQueue(order("b"));
      expect(b.position).toBe(2);
      expect(b.estimatedWaitMinutes).toBe(10);
    });

    it("rejects a user who is already in the queue", () => {
      queue.joinQueue(order("a"));
      expect(() => queue.joinQueue(order("a"))).toThrow(ConflictError);
    });
  });

  describe("ordering", () => {
    it("serves in arrival order for equal priority", () => {
      queue.joinQueue(order("a"));
      queue.joinQueue(order("b"));
      queue.joinQueue(order("c"));
      expect(queue.getQueue().map((e) => e.userId)).toEqual(["a", "b", "c"]);
    });

    it("puts high priority ahead of normal, then by arrival", () => {
      queue.joinQueue(order("a"));
      queue.joinQueue(order("b", { priority: "high" }));
      queue.joinQueue(order("c"));
      queue.joinQueue(order("d", { priority: "high" }));
      expect(queue.getQueue().map((e) => e.userId)).toEqual(["b", "d", "a", "c"]);
    });
  });

  describe("getStatus", () => {
    it("returns the user's current position", () => {
      queue.joinQueue(order("a"));
      queue.joinQueue(order("b"));
      expect(queue.getStatus("b").position).toBe(2);
    });

    it("throws NotFoundError if the user is not queued", () => {
      expect(() => queue.getStatus("ghost")).toThrow(NotFoundError);
    });
  });

  describe("leaveQueue", () => {
    it("removes the user and records history as left", () => {
      queue.joinQueue(order("a"));
      queue.leaveQueue("a");
      expect(() => queue.getStatus("a")).toThrow(NotFoundError);
      expect(queue.getHistory("a")[0].status).toBe("left");
    });

    it("moves everyone behind up a position", () => {
      queue.joinQueue(order("a"));
      queue.joinQueue(order("b"));
      queue.leaveQueue("a");
      expect(queue.getStatus("b").position).toBe(1);
    });

    it("throws NotFoundError if the user is not queued", () => {
      expect(() => queue.leaveQueue("ghost")).toThrow(NotFoundError);
    });
  });

  describe("serveNext", () => {
    it("serves the first user and updates positions", () => {
      queue.joinQueue(order("a"));
      queue.joinQueue(order("b"));
      const served = queue.serveNext();
      expect(served.userId).toBe("a");
      expect(served.status).toBe("served");
      expect(queue.getStatus("b").position).toBe(1);
      expect(queue.getHistory("a")[0].status).toBe("served");
    });

    it("serves a high priority user before earlier normal users", () => {
      queue.joinQueue(order("a"));
      queue.joinQueue(order("b", { priority: "high" }));
      expect(queue.serveNext().userId).toBe("b");
    });

    it("throws NotFoundError when the queue is empty", () => {
      expect(() => queue.serveNext()).toThrow(NotFoundError);
    });
  });

  describe("notifications", () => {
    it("notifies when a user joins", () => {
      queue.joinQueue(order("a"));
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "a", type: "JOINED" })
      );
    });

    it("notifies when a user is close to being served", () => {
      queue.joinQueue(order("a"));
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "a", type: "NEAR_FRONT" })
      );
    });

    it("notifies a user who moves up to the front after someone is served", () => {
      queue.joinQueue(order("a"));
      queue.joinQueue(order("b"));
      queue.joinQueue(order("c"));
      notify.mockClear();
      queue.serveNext(); // c moves into position 2
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "c", type: "NEAR_FRONT" })
      );
    });

    it("notifies the user when they are served", () => {
      queue.joinQueue(order("a"));
      queue.serveNext();
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "a", type: "SERVED" })
      );
    });
  });

  describe("history", () => {
    it("only returns history for the requested user", () => {
      queue.joinQueue(order("a"));
      queue.joinQueue(order("b"));
      queue.serveNext();
      expect(queue.getHistory("a")).toHaveLength(1);
      expect(queue.getHistory("b")).toHaveLength(0);
    });
  });
});

describe("validateJoin", () => {
  it("returns cleaned data for valid input", () => {
    const result = validateJoin({ ...order("  a  "), notes: "  no onions " });
    expect(result.userId).toBe("a");
    expect(result.notes).toBe("no onions");
    expect(result.priority).toBe("normal");
  });

  it.each([
    ["missing userId", { items: order("x").items }],
    ["non-string userId", order(5)],
    ["blank userId", order("   ")],
    ["userId too long", order("x".repeat(51))],
    ["missing items", { userId: "a" }],
    ["items not an array", { userId: "a", items: "taco" }],
    ["empty items", { userId: "a", items: [] }],
    ["too many items", {
      userId: "a",
      items: Array.from({ length: 21 }, () => ({ name: "T", quantity: 1, prepMinutes: 1 })),
    }],
    ["empty item name", { userId: "a", items: [{ name: "", quantity: 1, prepMinutes: 5 }] }],
    ["item name too long", { userId: "a", items: [{ name: "x".repeat(51), quantity: 1, prepMinutes: 5 }] }],
    ["quantity of 0", { userId: "a", items: [{ name: "T", quantity: 0, prepMinutes: 5 }] }],
    ["quantity too large", { userId: "a", items: [{ name: "T", quantity: 21, prepMinutes: 5 }] }],
    ["non-integer quantity", { userId: "a", items: [{ name: "T", quantity: 1.5, prepMinutes: 5 }] }],
    ["prepMinutes not a number", { userId: "a", items: [{ name: "T", quantity: 1, prepMinutes: "5" }] }],
    ["prepMinutes too large", { userId: "a", items: [{ name: "T", quantity: 1, prepMinutes: 61 }] }],
    ["invalid priority", order("a", { priority: "urgent" })],
    ["notes not a string", order("a", { notes: 123 })],
    ["notes too long", order("a", { notes: "n".repeat(201) })],
  ])("rejects %s", (_, input) => {
    expect(() => validateJoin(input)).toThrow(ValidationError);
  });

  it("gives validation errors a 400 status", () => {
    try {
      validateJoin({});
    } catch (e) {
      expect(e.status).toBe(400);
    }
  });
});
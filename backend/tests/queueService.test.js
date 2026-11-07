/**
 * Unit tests for the Queue Management Module (queueService, database version).
 * The MySQL pool is replaced by an in-memory fake (tests/helpers/fakeDb.js),
 * so nothing touches the real database.
 * Fake menu: 1 = Taco (5 min), 2 = Coke (3 min), 3 = Old Special (inactive).
 */
const {
  createQueueService,
  validateJoin,
  ValidationError,
  NotFoundError,
  ConflictError,
} = require("../services/queueService");
const { createFakeDb } = require("./helpers/fakeDb");

// 2 tacos x 5 min = 10 minutes of prep
const order = (userId, extra = {}) => ({
  userId,
  items: [{ menuItemId: 1, quantity: 2 }],
  ...extra,
});

function setup(options) {
  const db = createFakeDb(options);
  const notify = jest.fn();
  const queue = createQueueService({ db, onNotify: notify });
  return { db, notify, queue };
}

describe("queueService", () => {
  describe("joinQueue", () => {
    it("returns position and wait estimate for the first user", async () => {
      const { queue } = setup();
      const a = await queue.joinQueue(order("a"));
      expect(a.position).toBe(1);
      expect(a.estimatedWaitMinutes).toBe(0);
      expect(a.priority).toBe("normal");
    });

    it("takes item names and prep times from the menu", async () => {
      const { queue } = setup();
      const a = await queue.joinQueue(order("a"));
      expect(a.items).toEqual([{ name: "Taco", quantity: 2, prepMinutes: 5 }]);
    });

    it("estimates wait as the total prep time of orders ahead", async () => {
      const { queue } = setup();
      await queue.joinQueue(order("a")); // 2 tacos x 5 min = 10
      const b = await queue.joinQueue(order("b"));
      expect(b.position).toBe(2);
      expect(b.estimatedWaitMinutes).toBe(10);
    });

    it("adds up prep time across several items", async () => {
      const { queue } = setup();
      await queue.joinQueue({
        userId: "a",
        items: [
          { menuItemId: 1, quantity: 2 }, // 10
          { menuItemId: 2, quantity: 1 }, // 3
        ],
      });
      const b = await queue.joinQueue(order("b"));
      expect(b.estimatedWaitMinutes).toBe(13);
    });

    it("saves the order, its items, and the queue entry", async () => {
      const { queue, db } = setup();
      await queue.joinQueue(order("a", { notes: "  no onions " }));
      expect(db.state.orders).toEqual([{ order_id: 1, user_id: "a", notes: "no onions" }]);
      expect(db.state.orderItems).toHaveLength(1);
      expect(db.state.orderItems[0]).toMatchObject({
        item_name: "Taco",
        quantity: 2,
        unit_price: "4.00",
        prep_minutes: 5,
      });
      expect(db.state.entries[0]).toMatchObject({ queue_id: 1, order_id: 1, status: "waiting" });
      expect(db.released).toBe(1);
    });

    it("rejects a user who is already in the queue", async () => {
      const { queue } = setup();
      await queue.joinQueue(order("a"));
      await expect(queue.joinQueue(order("a"))).rejects.toThrow(ConflictError);
    });

    it("rejects joining when the queue is closed", async () => {
      const { queue } = setup({ queueStatus: "closed" });
      await expect(queue.joinQueue(order("a"))).rejects.toMatchObject({ status: 409 });
    });

    it("throws NotFoundError when no queue exists", async () => {
      const { queue } = setup({ noQueue: true });
      await expect(queue.joinQueue(order("a"))).rejects.toThrow(NotFoundError);
    });

    it("rejects a menu item that does not exist", async () => {
      const { queue } = setup();
      await expect(
        queue.joinQueue({ userId: "a", items: [{ menuItemId: 99, quantity: 1 }] })
      ).rejects.toThrow(ValidationError);
    });

    it("rejects a menu item that is no longer active", async () => {
      const { queue } = setup();
      await expect(
        queue.joinQueue({ userId: "a", items: [{ menuItemId: 3, quantity: 1 }] })
      ).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError for a user that does not exist, and saves nothing", async () => {
      const { queue, db } = setup({ knownUsers: new Set(["a"]) });
      await expect(queue.joinQueue(order("ghost"))).rejects.toThrow(NotFoundError);
      expect(db.state.orders).toHaveLength(0);
      expect(db.state.entries).toHaveLength(0);
      expect(db.released).toBe(1);
    });

    it("rolls back the whole order if saving the queue entry fails", async () => {
      const { queue, db } = setup();
      db.failOn = /INSERT INTO QueueEntry/;
      await expect(queue.joinQueue(order("a"))).rejects.toThrow("fake db failure");
      expect(db.state.orders).toHaveLength(0);
      expect(db.state.orderItems).toHaveLength(0);
      expect(db.state.entries).toHaveLength(0);
      expect(db.released).toBe(1);
    });
  });

  describe("ordering", () => {
    it("serves in arrival order for equal priority", async () => {
      const { queue } = setup();
      await queue.joinQueue(order("a"));
      await queue.joinQueue(order("b"));
      await queue.joinQueue(order("c"));
      expect((await queue.getQueue()).map((e) => e.userId)).toEqual(["a", "b", "c"]);
    });

    it("puts high priority ahead of normal, then by arrival", async () => {
      const { queue } = setup();
      await queue.joinQueue(order("a"));
      await queue.joinQueue(order("b", { priority: "high" }));
      await queue.joinQueue(order("c"));
      await queue.joinQueue(order("d", { priority: "high" }));
      expect((await queue.getQueue()).map((e) => e.userId)).toEqual(["b", "d", "a", "c"]);
    });

    it("returns an empty list when nobody is waiting", async () => {
      const { queue } = setup();
      expect(await queue.getQueue()).toEqual([]);
    });
  });

  describe("getStatus", () => {
    it("returns the user's current position", async () => {
      const { queue } = setup();
      await queue.joinQueue(order("a"));
      await queue.joinQueue(order("b"));
      expect((await queue.getStatus("b")).position).toBe(2);
    });

    it("throws NotFoundError if the user is not queued", async () => {
      const { queue } = setup();
      await expect(queue.getStatus("ghost")).rejects.toThrow(NotFoundError);
    });
  });

  describe("leaveQueue", () => {
    it("removes the user and records history as left", async () => {
      const { queue, db } = setup();
      await queue.joinQueue(order("a"));
      await queue.leaveQueue("a");
      await expect(queue.getStatus("a")).rejects.toThrow(NotFoundError);
      expect((await queue.getHistory("a"))[0].status).toBe("left");
      expect(db.state.entries[0].status).toBe("canceled");
    });

    it("moves everyone behind up a position", async () => {
      const { queue } = setup();
      await queue.joinQueue(order("a"));
      await queue.joinQueue(order("b"));
      await queue.leaveQueue("a");
      expect((await queue.getStatus("b")).position).toBe(1);
    });

    it("lets the user join again after leaving", async () => {
      const { queue } = setup();
      await queue.joinQueue(order("a"));
      await queue.leaveQueue("a");
      const again = await queue.joinQueue(order("a"));
      expect(again.position).toBe(1);
    });

    it("throws NotFoundError if the user is not queued", async () => {
      const { queue } = setup();
      await expect(queue.leaveQueue("ghost")).rejects.toThrow(NotFoundError);
    });
  });

  describe("serveNext", () => {
    it("serves the first user and updates positions", async () => {
      const { queue, db } = setup();
      await queue.joinQueue(order("a"));
      await queue.joinQueue(order("b"));
      const served = await queue.serveNext();
      expect(served.userId).toBe("a");
      expect(served.status).toBe("served");
      expect((await queue.getStatus("b")).position).toBe(1);
      expect((await queue.getHistory("a"))[0].status).toBe("served");
      expect(db.state.entries[0].finished_at).not.toBeNull();
    });

    it("serves a high priority user before earlier normal users", async () => {
      const { queue } = setup();
      await queue.joinQueue(order("a"));
      await queue.joinQueue(order("b", { priority: "high" }));
      expect((await queue.serveNext()).userId).toBe("b");
    });

    it("throws NotFoundError when the queue is empty", async () => {
      const { queue } = setup();
      await expect(queue.serveNext()).rejects.toThrow(NotFoundError);
    });
  });

  describe("notifications", () => {
    it("notifies when a user joins", async () => {
      const { queue, notify } = setup();
      await queue.joinQueue(order("a"));
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "a", type: "JOINED" })
      );
    });

    it("notifies when a user is close to being served", async () => {
      const { queue, notify } = setup();
      await queue.joinQueue(order("a"));
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "a", type: "NEAR_FRONT" })
      );
    });

    it("notifies a user who moves up to the front after someone is served", async () => {
      const { queue, notify } = setup();
      await queue.joinQueue(order("a"));
      await queue.joinQueue(order("b"));
      await queue.joinQueue(order("c"));
      notify.mockClear();
      await queue.serveNext(); // c moves into position 2
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "c", type: "NEAR_FRONT" })
      );
    });

    it("does not send the near-front notification twice", async () => {
      const { queue, db } = setup();
      await queue.joinQueue(order("a"));
      await queue.joinQueue(order("b"));
      await queue.leaveQueue("zzz").catch(() => {});
      const nearFront = db.state.notifications.filter((n) => n.type === "NEAR_FRONT");
      expect(nearFront.map((n) => n.user_id)).toEqual(["a", "b"]);
    });

    it("notifies the user when they are served", async () => {
      const { queue, notify } = setup();
      await queue.joinQueue(order("a"));
      await queue.serveNext();
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "a", type: "SERVED" })
      );
    });

    it("saves notifications in the database", async () => {
      const { queue, db } = setup();
      await queue.joinQueue(order("a"));
      expect(db.state.notifications.map((n) => n.type)).toEqual(["JOINED", "NEAR_FRONT"]);
      expect(db.state.notifications[0].message).toContain("position 1");
      expect(db.state.notifications[0].entry_id).toBe(1);
    });
  });

  describe("history", () => {
    it("only returns history for the requested user", async () => {
      const { queue } = setup();
      await queue.joinQueue(order("a"));
      await queue.joinQueue(order("b"));
      await queue.serveNext();
      expect(await queue.getHistory("a")).toHaveLength(1);
      expect(await queue.getHistory("b")).toHaveLength(0);
    });

    it("includes the items and finish time", async () => {
      const { queue } = setup();
      await queue.joinQueue(order("a"));
      await queue.serveNext();
      const [entry] = await queue.getHistory("a");
      expect(entry.items).toEqual([{ name: "Taco", quantity: 2, prepMinutes: 5 }]);
      expect(typeof entry.finishedAt).toBe("string");
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

  const item = (overrides = {}) => ({ menuItemId: 1, quantity: 1, ...overrides });

  it.each([
    ["missing userId", { items: order("x").items }],
    ["non-string userId", order(5)],
    ["blank userId", order("   ")],
    ["userId too long", order("x".repeat(37))],
    ["missing items", { userId: "a" }],
    ["items not an array", { userId: "a", items: "taco" }],
    ["empty items", { userId: "a", items: [] }],
    ["too many items", { userId: "a", items: Array.from({ length: 21 }, () => item()) }],
    ["item that is null", { userId: "a", items: [null] }],
    ["missing menuItemId", { userId: "a", items: [{ quantity: 1 }] }],
    ["menuItemId of 0", { userId: "a", items: [item({ menuItemId: 0 })] }],
    ["non-integer menuItemId", { userId: "a", items: [item({ menuItemId: 1.5 })] }],
    ["menuItemId as a string", { userId: "a", items: [item({ menuItemId: "1" })] }],
    ["quantity of 0", { userId: "a", items: [item({ quantity: 0 })] }],
    ["quantity too large", { userId: "a", items: [item({ quantity: 21 })] }],
    ["non-integer quantity", { userId: "a", items: [item({ quantity: 1.5 })] }],
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
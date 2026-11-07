jest.mock("../config/db", () => ({
  execute: jest.fn(),
}));

const db = require("../config/db");
const notification = require("../services/notification");

beforeEach(() => {
  notification.reset();
  db.execute.mockReset();
});

const makeQueue = (...ids) =>
  ids.map((id) => ({
    userId: id,
    name: id,
    nearNotified: false,
  }));

describe("Legacy notification helpers", () => {
  test("notifyJoined builds a JOINED notification with position", () => {
    const n = notification.notifyJoined("u1", "Aya", "taco-1", 4);

    expect(n).toMatchObject({
      type: "JOINED",
      userId: "u1",
      truckId: "taco-1",
      position: 4,
    });
    expect(n.message).toContain("Aya");
  });

  test("checkNearTurn notifies only the first NEAR_THRESHOLD people", () => {
    const sent = notification.checkNearTurn(
      "t1",
      makeQueue("a", "b", "c")
    );

    expect(sent).toHaveLength(notification.NEAR_THRESHOLD);
    expect(sent.map((n) => n.userId)).toEqual(["a", "b"]);
  });

  test("position 1 gets next wording and position 2 gets almost up", () => {
    const sent = notification.checkNearTurn("t1", makeQueue("a", "b"));

    expect(sent[0].message).toMatch(/you're next/);
    expect(sent[1].message).toMatch(/almost up/);
  });

  test("each user is only notified once", () => {
    const queue = makeQueue("a", "b");

    notification.checkNearTurn("t1", queue);

    expect(notification.checkNearTurn("t1", queue)).toEqual([]);
  });

  test("someone moving into range gets notified later", () => {
    const queue = makeQueue("a", "b", "c");

    notification.checkNearTurn("t1", queue);
    queue.shift();

    const sent = notification.checkNearTurn("t1", queue);

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      userId: "c",
      type: "NEAR_TURN",
    });
  });

  test("notifyServed builds a SERVED notification", () => {
    expect(
      notification.notifyServed("u1", "Aya", "t1").type
    ).toBe("SERVED");
  });

  test("generates unique legacy notification IDs", () => {
    const first = notification.notifyJoined("u1", "Aya", "t1", 1);
    const second = notification.notifyServed("u1", "Aya", "t1");

    expect(first.id).not.toBe(second.id);
  });
});

describe("MySQL notification retrieval", () => {
  test("returns saved notifications for the requested user", async () => {
    const rows = [{
      id: 42,
      userId: "user-a",
      entryId: 7,
      type: "SERVED",
      message: "Order ready",
      createdAt: "2026-11-06T12:00:00.000Z",
      status: "sent",
    }];

    db.execute.mockResolvedValueOnce([rows, []]);

    expect(
      await notification.getNotifications("user-a")
    ).toEqual(rows);

    expect(db.execute).toHaveBeenCalledWith(
      expect.stringContaining("WHERE user_id = ?"),
      ["user-a"]
    );
  });

  test("returns an empty array when no saved notifications exist", async () => {
    db.execute.mockResolvedValueOnce([[], []]);

    expect(
      await notification.getNotifications("nobody")
    ).toEqual([]);
  });

  test("queries each requested user separately", async () => {
    db.execute.mockResolvedValue([[], []]);

    await notification.getNotifications("user-a");
    await notification.getNotifications("user-b");

    expect(
      db.execute.mock.calls.map((call) => call[1])
    ).toEqual([["user-a"], ["user-b"]]);
  });

  test("does not return legacy in-memory messages as database records", async () => {
    notification.notifyServed("user-a", "Aya", "t1");
    db.execute.mockResolvedValueOnce([[], []]);

    expect(
      await notification.getNotifications("user-a")
    ).toEqual([]);
  });

  test("propagates database failures", async () => {
    const error = new Error("Database unavailable");
    db.execute.mockRejectedValueOnce(error);

    await expect(
      notification.getNotifications("user-a")
    ).rejects.toBe(error);
  });
});
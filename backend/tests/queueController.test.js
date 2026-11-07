jest.mock("../services/queueService", () => ({
  createQueueService: jest.fn(() => ({
    joinQueue: jest.fn(),
    leaveQueue: jest.fn(),
    getStatus: jest.fn(),
    getQueue: jest.fn(),
    getSummary: jest.fn(),
    serveNext: jest.fn(),
    getHistory: jest.fn(),
  })),
}));

jest.mock("../services/notification", () => ({
  getNotifications: jest.fn(),
  notify: jest.fn(),
}));

jest.mock("../services/history", () => ({
  EVENTS: {
    JOINED: "JOINED",
    LEFT: "CANCELED",
    SERVED: "SERVED",
  },
  record: jest.fn(),
  getHistory: jest.fn(),
}));

const { createQueueService } = require("../services/queueService");
const notification = require("../services/notification");
const history = require("../services/history");
const controller = require("../controllers/queueController");

const queue = createQueueService.mock.results[0].value;
const onNotify = createQueueService.mock.calls[0][0].onNotify;

const userId = "11111111-1111-4111-8111-111111111111";

const joinBody = {
  userId,
  items: [{ menuItemId: 1, quantity: 2 }],
};

const cases = [
  ["joinQueue", 201, [joinBody], { id: 1, userId, position: 1 }],
  ["leaveQueue", 200, [userId], { message: "Left the queue" }],
  ["getStatus", 200, [userId], { id: 1, userId, position: 2 }],
  ["getQueue", 200, [], [{ id: 1, userId }]],
  ["getSummary", 200, [], { count: 1, estimatedWaitMinutes: 10 }],
  ["serveNext", 200, [], { id: 1, userId, status: "served" }],
];

function response() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function request() {
  return {
    body: joinBody,
    params: { userId },
  };
}

beforeEach(() => {
  Object.values(queue).forEach((method) => method.mockReset());

  notification.getNotifications.mockReset();
  notification.notify.mockReset();

  history.record.mockReset().mockResolvedValue(null);
  history.getHistory.mockReset();

  queue.getStatus.mockResolvedValue({
    id: 1,
    userId,
    position: 2,
  });
});

describe("Queue controller", () => {
  test.each(cases)(
    "%s awaits its service and returns its result",
    async (name, status, args, result) => {
      queue[name].mockResolvedValueOnce(result);
      const res = response();

      await controller[name](request(), res);

      expect(queue[name]).toHaveBeenCalledTimes(1);
      expect(queue[name]).toHaveBeenCalledWith(...args);
      expect(res.status).toHaveBeenCalledWith(status);
      expect(res.json).toHaveBeenCalledWith(result);

      if (name === "joinQueue") {
        expect(history.record).toHaveBeenCalledWith(userId, {
          entryId: 1,
          event: "JOINED",
          position: 1,
        });
      }

      if (name === "leaveQueue") {
        expect(history.record).toHaveBeenCalledWith(userId, {
          entryId: 1,
          event: "CANCELED",
          position: 2,
        });
      }

      if (name === "serveNext") {
        expect(history.record).toHaveBeenCalledWith(userId, {
          entryId: 1,
          event: "SERVED",
        });
      }
    }
  );

  test.each(cases)(
    "%s propagates service errors to Express",
    async (name) => {
      const error = Object.assign(new Error("Service failed"), {
        status: 409,
      });

      queue[name].mockRejectedValueOnce(error);
      const res = response();

      await expect(
        controller[name](request(), res)
      ).rejects.toBe(error);

      expect(history.record).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    }
  );

  test.each(["joinQueue", "leaveQueue", "serveNext"])(
    "%s propagates history write errors",
    async (name) => {
      const error = new Error("History could not be saved");

      queue[name].mockResolvedValueOnce({
        id: 1,
        userId,
        position: 1,
      });

      history.record.mockRejectedValueOnce(error);
      const res = response();

      await expect(
        controller[name](request(), res)
      ).rejects.toBe(error);

      expect(res.json).not.toHaveBeenCalled();
    }
  );

  test("leaveQueue stops if the current entry cannot be retrieved", async () => {
    const error = new Error("Queue entry unavailable");
    queue.getStatus.mockRejectedValueOnce(error);
    const res = response();

    await expect(
      controller.leaveQueue(request(), res)
    ).rejects.toBe(error);

    expect(queue.leaveQueue).not.toHaveBeenCalled();
    expect(history.record).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test("getHistory returns database events in the page's format", async () => {
    history.getHistory.mockResolvedValueOnce([
      {
        history_id: 7,
        user_id: userId,
        entry_id: 1,
        queue_id: 1,
        event: "CANCELED",
        position: 2,
        created_at: new Date("2026-11-07T12:00:00Z"),
      },
      {
        history_id: 6,
        user_id: userId,
        entry_id: 1,
        queue_id: 1,
        event: "JOINED",
        position: 2,
        created_at: new Date("2026-11-07T11:00:00Z"),
      },
    ]);

    const res = response();

    await controller.getHistory(request(), res);

    expect(history.getHistory).toHaveBeenCalledWith(userId);
    expect(queue.getHistory).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      {
        id: 7,
        userId,
        entryId: 1,
        queueId: 1,
        event: "LEFT",
        position: 2,
        at: "2026-11-07T12:00:00.000Z",
      },
      {
        id: 6,
        userId,
        entryId: 1,
        queueId: 1,
        event: "JOINED",
        position: 2,
        at: "2026-11-07T11:00:00.000Z",
      },
    ]);
  });

  test("getHistory returns an empty array when there are no events", async () => {
    history.getHistory.mockResolvedValueOnce([]);
    const res = response();

    await controller.getHistory(request(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("getHistory propagates database errors", async () => {
    const error = new Error("Database unavailable");
    history.getHistory.mockRejectedValueOnce(error);
    const res = response();

    await expect(
      controller.getHistory(request(), res)
    ).rejects.toBe(error);

    expect(res.json).not.toHaveBeenCalled();
  });

  test("getNotifications awaits the notification reader", async () => {
    const rows = [{ id: 1, userId, message: "Order ready" }];
    notification.getNotifications.mockResolvedValueOnce(rows);
    const res = response();

    await controller.getNotifications(request(), res);

    expect(notification.getNotifications).toHaveBeenCalledWith(userId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(rows);
  });

  test("getNotifications propagates reader errors", async () => {
    const error = new Error("Database unavailable");
    notification.getNotifications.mockRejectedValueOnce(error);
    const res = response();

    await expect(
      controller.getNotifications(request(), res)
    ).rejects.toBe(error);

    expect(res.json).not.toHaveBeenCalled();
  });

  test("onNotify logs without saving a second notification", () => {
    const event = {
      userId,
      type: "JOINED",
      message: "Joined queue",
    };

    const log = jest.spyOn(console, "log").mockImplementation(() => {});

    try {
      onNotify(event);

      expect(log).toHaveBeenCalledWith("[notification]", event);
      expect(notification.notify).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});
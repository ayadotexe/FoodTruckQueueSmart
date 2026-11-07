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
}), { virtual: true });

jest.mock("../services/notification", () => ({
  getNotifications: jest.fn(),
  notify: jest.fn(),
}), { virtual: true });

jest.mock("../services/history", () => ({}), { virtual: true });

const { createQueueService } = require("../services/queueService");
const notification = require("../services/notification");
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
  ["getHistory", 200, [userId], [{ id: 1, status: "served" }]],
];

function response() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

beforeEach(() => {
  Object.values(queue).forEach((method) => method.mockReset());
  notification.getNotifications.mockReset();
  notification.notify.mockReset();
});

describe("Queue controller", () => {
  test.each(cases)(
    "%s awaits its service and returns its result",
    async (name, status, args, result) => {
      queue[name].mockResolvedValueOnce(result);
      const res = response();

      await controller[name](
        { body: joinBody, params: { userId } },
        res
      );

      expect(queue[name]).toHaveBeenCalledTimes(1);
      expect(queue[name]).toHaveBeenCalledWith(...args);
      expect(res.status).toHaveBeenCalledWith(status);
      expect(res.json).toHaveBeenCalledWith(result);
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
        controller[name](
          { body: joinBody, params: { userId } },
          res
        )
      ).rejects.toBe(error);

      expect(res.json).not.toHaveBeenCalled();
    }
  );

  test("getNotifications awaits the notification reader", async () => {
    const rows = [{ id: 1, userId, message: "Order ready" }];
    notification.getNotifications.mockResolvedValueOnce(rows);
    const res = response();

    await controller.getNotifications({ params: { userId } }, res);

    expect(notification.getNotifications).toHaveBeenCalledWith(userId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(rows);
  });

  test("getNotifications propagates reader errors", async () => {
    const error = new Error("Database unavailable");
    notification.getNotifications.mockRejectedValueOnce(error);
    const res = response();

    await expect(
      controller.getNotifications({ params: { userId } }, res)
    ).rejects.toBe(error);

    expect(res.json).not.toHaveBeenCalled();
  });

  test("onNotify logs without saving a second notification", () => {
    const event = {
      userId,
      type: "JOINED",
      message: "Joined queue",
    };

    const log = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    try {
      onNotify(event);

      expect(log).toHaveBeenCalledWith("[notification]", event);
      expect(notification.notify).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});
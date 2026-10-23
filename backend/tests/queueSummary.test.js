/**
 * Tests for the queue summary (service logic + public route).
 */
const request = require("supertest");
const { createQueueService } = require("../services/queueService");

const order = (userId) => ({
  userId,
  items: [{ name: "Taco", quantity: 2, prepMinutes: 5 }],
});

describe("getSummary (service)", () => {
  it("is empty when nobody is in line", () => {
    const queue = createQueueService();
    expect(queue.getSummary()).toEqual({ count: 0, estimatedWaitMinutes: 0 });
  });

  it("counts people and adds up their prep time", () => {
    const queue = createQueueService();
    queue.joinQueue(order("a")); // 2 x 5 = 10
    queue.joinQueue(order("b")); // 2 x 5 = 10
    expect(queue.getSummary()).toEqual({ count: 2, estimatedWaitMinutes: 20 });
  });

  it("drops people who were served", () => {
    const queue = createQueueService();
    queue.joinQueue(order("a"));
    queue.joinQueue(order("b"));
    queue.serveNext();
    expect(queue.getSummary()).toEqual({ count: 1, estimatedWaitMinutes: 10 });
  });
});

describe("GET /api/queue/summary (route)", () => {
  let app;

  beforeEach(() => {
    jest.resetModules(); // fresh in-memory queue
    jest.spyOn(console, "log").mockImplementation(() => {});
    app = require("../app");
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  it("is public and returns zeros for an empty queue", async () => {
    const res = await request(app).get("/api/queue/summary");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 0, estimatedWaitMinutes: 0 });
  });

  it("reflects people who joined", async () => {
    await request(app).post("/api/queue/join").send(order("a"));
    const res = await request(app).get("/api/queue/summary");
    expect(res.body).toEqual({ count: 1, estimatedWaitMinutes: 10 });
  });
});
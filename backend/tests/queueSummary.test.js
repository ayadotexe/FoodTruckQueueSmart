/**
 * Tests for the queue summary (service logic + public route).
 * The database is replaced by an in-memory fake (tests/helpers/fakeDb.js).
 */
const request = require("supertest");
const { createQueueService } = require("../services/queueService");
const { createFakeDb } = require("./helpers/fakeDb");

// Fake menu item 1 = Taco, 5 minutes each
const order = (userId) => ({
  userId,
  items: [{ menuItemId: 1, quantity: 2 }],
});

describe("getSummary (service)", () => {
  let queue;

  beforeEach(() => {
    queue = createQueueService({ db: createFakeDb() });
  });

  it("is empty when nobody is in line", async () => {
    expect(await queue.getSummary()).toEqual({ count: 0, estimatedWaitMinutes: 0 });
  });

  it("counts people and adds up their prep time", async () => {
    await queue.joinQueue(order("a")); // 2 x 5 = 10
    await queue.joinQueue(order("b")); // 2 x 5 = 10
    expect(await queue.getSummary()).toEqual({ count: 2, estimatedWaitMinutes: 20 });
  });

  it("drops people who were served", async () => {
    await queue.joinQueue(order("a"));
    await queue.joinQueue(order("b"));
    await queue.serveNext();
    expect(await queue.getSummary()).toEqual({ count: 1, estimatedWaitMinutes: 10 });
  });
});

describe("GET /api/queue/summary (route)", () => {
  let app;

  beforeEach(() => {
    jest.resetModules(); // fresh app and fresh fake database
    jest.spyOn(console, "log").mockImplementation(() => {});
    const fakeDb = createFakeDb();
    jest.doMock("../config/db", () => fakeDb); // the real db.js is never loaded
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
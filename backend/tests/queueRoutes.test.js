/**
 * Route tests for the Queue Management Module.
 * Calls the real Express app with supertest. The app is reloaded before
 * each test, and the MySQL pool is replaced by an in-memory fake
 * (tests/helpers/fakeDb.js), so every test starts with an empty queue and
 * never touches the real database.
 * Fake menu: 1 = Taco (5 min), 2 = Coke (3 min), 3 = Old Special (inactive).
 */
const request = require("supertest");
const { createFakeDb } = require("./helpers/fakeDb");

const ADMIN = { "x-user-role": "admin" };
const body = (userId, extra = {}) => ({
  userId,
  items: [{ menuItemId: 1, quantity: 2 }], // 2 x 5 = 10 minutes
  ...extra,
});

describe("queue routes", () => {
  let app;
  let fakeDb;

  // Loads a fresh app wired to a fresh fake database
  function loadApp(options) {
    jest.resetModules();
    fakeDb = createFakeDb(options);
    jest.doMock("../config/db", () => fakeDb); // the real db.js is never loaded
    app = require("../app");
  }

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {}); // silence notification logs
    loadApp();
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  describe("health", () => {
    it("GET /api/health returns 200", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/queue/join", () => {
    it("returns 201 with position and wait estimate", async () => {
      const res = await request(app).post("/api/queue/join").send(body("11111111-1111-4111-8111-111111111111"));
      expect(res.status).toBe(201);
      expect(res.body.position).toBe(1);
      expect(res.body.estimatedWaitMinutes).toBe(0);
    });

    it("saves the order in the database", async () => {
      await request(app).post("/api/queue/join").send(body("11111111-1111-4111-8111-111111111111"));
      expect(fakeDb.state.orders).toHaveLength(1);
      expect(fakeDb.state.entries[0].status).toBe("waiting");
    });

    it("returns 400 for invalid input", async () => {
      const res = await request(app).post("/api/queue/join").send({ userId: "11111111-1111-4111-8111-111111111111" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("returns 400 for malformed JSON", async () => {
      const res = await request(app)
        .post("/api/queue/join")
        .set("Content-Type", "application/json")
        .send("{bad json");
      expect(res.status).toBe(400);
    });

    it("returns 400 for a menu item that does not exist", async () => {
      const res = await request(app)
        .post("/api/queue/join")
        .send({ userId: "11111111-1111-4111-8111-111111111111", items: [{ menuItemId: 99, quantity: 1 }] });
      expect(res.status).toBe(400);
    });

    it("returns 409 if the user is already in the queue", async () => {
      await request(app).post("/api/queue/join").send(body("11111111-1111-4111-8111-111111111111"));
      const res = await request(app).post("/api/queue/join").send(body("11111111-1111-4111-8111-111111111111"));
      expect(res.status).toBe(409);
    });

    it("returns 409 if the queue is closed", async () => {
      loadApp({ queueStatus: "closed" });
      const res = await request(app).post("/api/queue/join").send(body("11111111-1111-4111-8111-111111111111"));
      expect(res.status).toBe(409);
    });

    it("returns 404 if the user does not exist", async () => {
      loadApp({ knownUsers: new Set(["11111111-1111-4111-8111-111111111111"]) });
      const res = await request(app).post("/api/queue/join").send(body("33333333-3333-4333-8333-333333333333"));
      expect(res.status).toBe(404);
    });

    it("returns 500 if the database fails", async () => {
      fakeDb.failOn = /FROM Queue ORDER BY/;
      const res = await request(app).post("/api/queue/join").send(body("11111111-1111-4111-8111-111111111111"));
      expect(res.status).toBe(500);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("GET /api/queue/status/:userId", () => {
    it("returns the user's position", async () => {
      await request(app).post("/api/queue/join").send(body("11111111-1111-4111-8111-111111111111"));
      await request(app).post("/api/queue/join").send(body("22222222-2222-4222-8222-222222222222"));
      const res = await request(app).get("/api/queue/status/22222222-2222-4222-8222-222222222222");
      expect(res.status).toBe(200);
      expect(res.body.position).toBe(2);
      expect(res.body.estimatedWaitMinutes).toBe(10);
    });

    it("returns 404 if the user is not queued", async () => {
      const res = await request(app).get("/api/queue/status/33333333-3333-4333-8333-333333333333");
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/queue/leave/:userId", () => {
    it("removes the user from the queue", async () => {
      await request(app).post("/api/queue/join").send(body("11111111-1111-4111-8111-111111111111"));
      const res = await request(app).delete("/api/queue/leave/11111111-1111-4111-8111-111111111111");
      expect(res.status).toBe(200);
      const status = await request(app).get("/api/queue/status/11111111-1111-4111-8111-111111111111");
      expect(status.status).toBe(404);
      expect(fakeDb.state.entries[0].status).toBe("canceled");
    });

    it("returns 404 if the user is not queued", async () => {
      const res = await request(app).delete("/api/queue/leave/33333333-3333-4333-8333-333333333333");
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/queue (admin view)", () => {
    it("returns 403 without the admin role", async () => {
      const res = await request(app).get("/api/queue");
      expect(res.status).toBe(403);
    });

    it("lists the queue in order for an admin", async () => {
      await request(app).post("/api/queue/join").send(body("11111111-1111-4111-8111-111111111111"));
      await request(app).post("/api/queue/join").send(body("22222222-2222-4222-8222-222222222222", { priority: "high" }));
      const res = await request(app).get("/api/queue").set(ADMIN);
      expect(res.status).toBe(200);
      expect(res.body.map((e) => e.userId)).toEqual(["22222222-2222-4222-8222-222222222222", "11111111-1111-4111-8111-111111111111"]);
    });
  });

  describe("POST /api/queue/serve-next (admin)", () => {
    it("returns 403 without the admin role", async () => {
      const res = await request(app).post("/api/queue/serve-next");
      expect(res.status).toBe(403);
    });

    it("serves the next user", async () => {
      await request(app).post("/api/queue/join").send(body("11111111-1111-4111-8111-111111111111"));
      await request(app).post("/api/queue/join").send(body("22222222-2222-4222-8222-222222222222"));
      const res = await request(app).post("/api/queue/serve-next").set(ADMIN);
      expect(res.status).toBe(200);
      expect(res.body.userId).toBe("11111111-1111-4111-8111-111111111111");
      const status = await request(app).get("/api/queue/status/22222222-2222-4222-8222-222222222222");
      expect(status.body.position).toBe(1);
    });

    it("returns 404 when the queue is empty", async () => {
      const res = await request(app).post("/api/queue/serve-next").set(ADMIN);
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/queue/history/:userId", () => {
    it("returns a user's served history", async () => {
      await request(app).post("/api/queue/join").send(body("11111111-1111-4111-8111-111111111111"));
      await request(app).post("/api/queue/serve-next").set(ADMIN);
      const res = await request(app).get("/api/queue/history/11111111-1111-4111-8111-111111111111");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.map((entry) => entry.event)).toEqual([
        "SERVED",
        "JOINED",
      ]);
      expect(res.body[0].at).toBeDefined();
    });

    it("returns an empty list for a user with no history", async () => {
      const res = await request(app).get("/api/queue/history/33333333-3333-4333-8333-333333333333");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
/**
 * Route tests for the Queue Management Module.
 * Calls the real Express app with supertest. The app is reloaded before
 * each test so every test starts with a fresh, empty queue.
 */
const request = require("supertest");

const ADMIN = { "x-user-role": "admin" };
const body = (userId, extra = {}) => ({
  userId,
  items: [{ name: "Taco", quantity: 2, prepMinutes: 5 }],
  ...extra,
});

describe("queue routes", () => {
  let app;

  beforeEach(() => {
    jest.resetModules(); // fresh controller = fresh in-memory queue
    jest.spyOn(console, "log").mockImplementation(() => {}); // silence notification logs
    app = require("../app");
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
      const res = await request(app).post("/api/queue/join").send(body("a"));
      expect(res.status).toBe(201);
      expect(res.body.position).toBe(1);
      expect(res.body.estimatedWaitMinutes).toBe(0);
    });

    it("returns 400 for invalid input", async () => {
      const res = await request(app).post("/api/queue/join").send({ userId: "a" });
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

    it("returns 409 if the user is already in the queue", async () => {
      await request(app).post("/api/queue/join").send(body("a"));
      const res = await request(app).post("/api/queue/join").send(body("a"));
      expect(res.status).toBe(409);
    });
  });

  describe("GET /api/queue/status/:userId", () => {
    it("returns the user's position", async () => {
      await request(app).post("/api/queue/join").send(body("a"));
      await request(app).post("/api/queue/join").send(body("b"));
      const res = await request(app).get("/api/queue/status/b");
      expect(res.status).toBe(200);
      expect(res.body.position).toBe(2);
      expect(res.body.estimatedWaitMinutes).toBe(10);
    });

    it("returns 404 if the user is not queued", async () => {
      const res = await request(app).get("/api/queue/status/ghost");
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/queue/leave/:userId", () => {
    it("removes the user from the queue", async () => {
      await request(app).post("/api/queue/join").send(body("a"));
      const res = await request(app).delete("/api/queue/leave/a");
      expect(res.status).toBe(200);
      const status = await request(app).get("/api/queue/status/a");
      expect(status.status).toBe(404);
    });

    it("returns 404 if the user is not queued", async () => {
      const res = await request(app).delete("/api/queue/leave/ghost");
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/queue (admin view)", () => {
    it("returns 403 without the admin role", async () => {
      const res = await request(app).get("/api/queue");
      expect(res.status).toBe(403);
    });

    it("lists the queue in order for an admin", async () => {
      await request(app).post("/api/queue/join").send(body("a"));
      await request(app).post("/api/queue/join").send(body("b", { priority: "high" }));
      const res = await request(app).get("/api/queue").set(ADMIN);
      expect(res.status).toBe(200);
      expect(res.body.map((e) => e.userId)).toEqual(["b", "a"]);
    });
  });

  describe("POST /api/queue/serve-next (admin)", () => {
    it("returns 403 without the admin role", async () => {
      const res = await request(app).post("/api/queue/serve-next");
      expect(res.status).toBe(403);
    });

    it("serves the next user", async () => {
      await request(app).post("/api/queue/join").send(body("a"));
      await request(app).post("/api/queue/join").send(body("b"));
      const res = await request(app).post("/api/queue/serve-next").set(ADMIN);
      expect(res.status).toBe(200);
      expect(res.body.userId).toBe("a");
      const status = await request(app).get("/api/queue/status/b");
      expect(status.body.position).toBe(1);
    });

    it("returns 404 when the queue is empty", async () => {
      const res = await request(app).post("/api/queue/serve-next").set(ADMIN);
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/queue/history/:userId", () => {
    it("returns a user's served history", async () => {
      await request(app).post("/api/queue/join").send(body("a"));
      await request(app).post("/api/queue/serve-next").set(ADMIN);
      const res = await request(app).get("/api/queue/history/a");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].status).toBe("served");
    });

    it("returns an empty list for a user with no history", async () => {
      const res = await request(app).get("/api/queue/history/ghost");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
// No real MySQL connections are opened by these tests.
jest.mock("../db", () => ({
  getConnection: jest.fn(),
  execute: jest.fn(),
}), { virtual: true });

const request = require("supertest");
const { scryptSync } = require("node:crypto");

describe("Authentication API", () => {
  let app;
  let pool;
  let connection;

  const salt = "0123456789abcdef0123456789abcdef";

  const storedUser = {
    user_id: "11111111-1111-4111-8111-111111111111",
    first_name: "Aya",
    last_name: "A",
    email: "aya@example.com",
    role: "user",
    password_salt: salt,
    password_hash: scryptSync("Test123!", salt, 64).toString("hex"),
  };

  const validUser = {
    firstName: "Aya",
    lastName: "A",
    email: "aya@example.com",
    password: "Test123!",
  };

  beforeEach(() => {
    jest.resetModules();
    pool = require("../db");

    connection = {
      beginTransaction: jest.fn().mockResolvedValue(),
      execute: jest.fn().mockResolvedValue([{}, []]),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn(),
    };

    pool.getConnection.mockResolvedValue(connection);
    pool.execute.mockResolvedValue([[{ ...storedUser }], []]);

    app = require("../app");
  });

  describe("Registration", () => {
    it("creates a user without exposing password data", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(validUser);

      expect(response.status).toBe(201);
      expect(response.body.user).toEqual({
        id: expect.any(String),
        firstName: "Aya",
        lastName: "A",
        email: "aya@example.com",
        role: "user",
      });
    });

    it("rejects duplicate emails regardless of capitalization", async () => {
      connection.execute.mockRejectedValueOnce(
        Object.assign(new Error("Duplicate email"), {
          code: "ER_DUP_ENTRY",
        })
      );

      const response = await request(app)
        .post("/api/auth/register")
        .send({ ...validUser, email: "AYA@example.com" });

      expect(response.status).toBe(409);
      expect(response.body.error).toBeDefined();

      expect(connection.execute.mock.calls[0][1][1])
        .toBe("aya@example.com");

      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it("trims names and normalizes email addresses", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...validUser,
          firstName: " Aya ",
          lastName: " A ",
          email: " AYA@example.com ",
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toMatchObject({
        firstName: "Aya",
        lastName: "A",
        email: "aya@example.com",
      });
    });

    it("does not allow registration to assign an administrator role", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ ...validUser, role: "admin" });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe("user");
    });

    it.each([
      ["missing first name", { firstName: undefined }],
      ["blank first name", { firstName: "   " }],
      ["non-string first name", { firstName: 123 }],
      ["first name over 50 characters", { firstName: "a".repeat(51) }],
      ["missing last name", { lastName: undefined }],
      ["non-string last name", { lastName: 123 }],
      ["last name over 50 characters", { lastName: "a".repeat(51) }],
      ["missing email", { email: undefined }],
      ["non-string email", { email: 123 }],
      ["invalid email", { email: "invalid" }],
      [
        "email over 254 characters",
        { email: `${"a".repeat(243)}@example.com` },
      ],
      ["missing password", { password: undefined }],
      ["non-string password", { password: 12345678 }],
      ["password under 8 characters", { password: "short" }],
      ["password over 128 characters", { password: "a".repeat(129) }],
    ])("rejects %s", async (_, changes) => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ ...validUser, ...changes });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("rejects an empty registration request", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("Database writes and failures", () => {
    it("stores a verifiable salted hash and matching profile, then commits", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(validUser);

      expect(response.status).toBe(201);

      const [credentialsSQL, values] = connection.execute.mock.calls[0];
      const [profileSQL, profileValues] = connection.execute.mock.calls[1];
      const [id, email, hash, savedSalt, role] = values;

      expect(credentialsSQL).toContain("INSERT INTO UserCredentials");
      expect(profileSQL).toContain("INSERT INTO UserProfile");

      expect(id).toBe(response.body.user.id);
      expect(email).toBe(validUser.email);
      expect(role).toBe("user");
      expect(savedSalt).toMatch(/^[0-9a-f]{32}$/);

      expect(hash).toBe(
        scryptSync(validUser.password, savedSalt, 64).toString("hex")
      );

      expect(hash).not.toBe(validUser.password);
      expect(profileValues).toEqual([id, "Aya", "A"]);

      expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(connection.rollback).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);

      expect(Object.keys(response.body.user).sort()).toEqual(
        ["id", "firstName", "lastName", "email", "role"].sort()
      );
    });

    it("rolls back and releases the connection when profile insertion fails", async () => {
      connection.execute
        .mockResolvedValueOnce([{}, []])
        .mockRejectedValueOnce(new Error("Profile insert failed"));

      const response = await request(app)
        .post("/api/auth/register")
        .send(validUser);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Server error." });
      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it("returns a generic error when no database connection is available", async () => {
      pool.getConnection.mockRejectedValueOnce(
        new Error("Connection unavailable")
      );

      const response = await request(app)
        .post("/api/auth/register")
        .send(validUser);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Server error." });
    });

    it("returns a generic error when the login query fails", async () => {
      pool.execute.mockRejectedValueOnce(
        new Error("Database unavailable")
      );

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
          password: validUser.password,
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Server error." });
    });

    it("rejects a stored hash of an unexpected length without crashing", async () => {
      pool.execute.mockResolvedValueOnce([
        [{ ...storedUser, password_hash: "00" }],
        [],
      ]);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
          password: validUser.password,
        });

      expect(response.status).toBe(401);
    });
  });

  describe("Login", () => {
    it("logs in a user retrieved from the database", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "AYA@example.com",
          password: validUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({
        id: storedUser.user_id,
        firstName: "Aya",
        lastName: "A",
        email: "aya@example.com",
        role: "user",
      });

      expect(pool.execute.mock.calls[0][1]).toEqual(["aya@example.com"]);
    });

    it("logs in an administrator retrieved from the database", async () => {
      pool.execute.mockResolvedValueOnce([
        [{
          ...storedUser,
          email: "admin@tacoexpress.com",
          role: "admin",
        }],
        [],
      ]);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "admin@tacoexpress.com",
          password: validUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe("admin");
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.salt).toBeUndefined();
      expect(response.body.user.hash).toBeUndefined();
    });

    it("rejects an incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
          password: "Wrong123!",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Incorrect email or password.");
    });

    it("rejects an email that has not been registered", async () => {
      pool.execute.mockResolvedValueOnce([[], []]);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "unknown@example.com",
          password: "Test123!",
        });

      expect(response.status).toBe(401);
    });

    it.each([
      ["missing email", { password: "Test123!" }],
      ["invalid email", { email: "invalid", password: "Test123!" }],
      ["missing password", { email: "aya@example.com" }],
      [
        "non-string password",
        { email: "aya@example.com", password: 12345678 },
      ],
      ["short password", { email: "aya@example.com", password: "short" }],
    ])("rejects %s", async (_, credentials) => {
      const response = await request(app)
        .post("/api/auth/login")
        .send(credentials);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .set("Content-Type", "application/json")
      .send('{"email":');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid JSON.");
  });
});
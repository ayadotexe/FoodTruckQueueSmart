const request = require("supertest");

describe("Authentication API", () => {
  let app;

  const validUser = {
    firstName: "Aya",
    lastName: "A",
    email: "aya@example.com",
    password: "Test123!",
  };

  beforeEach(() => {
    jest.resetModules();
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
      await request(app).post("/api/auth/register").send(validUser);

      const response = await request(app)
        .post("/api/auth/register")
        .send({ ...validUser, email: "AYA@example.com" });

      expect(response.status).toBe(409);
      expect(response.body.error).toBeDefined();
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
      ["email over 254 characters", { email: `${"a".repeat(243)}@example.com` }],
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

  describe("Login", () => {
    it("logs in a registered user and returns the same account ID", async () => {
      const registration = await request(app)
        .post("/api/auth/register")
        .send(validUser);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "AYA@example.com",
          password: validUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual(registration.body.user);
    });

    it("logs in the predefined administrator", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "admin@tacoexpress.com",
          password: "Admin123!",
        });

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe("admin");
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.salt).toBeUndefined();
      expect(response.body.user.hash).toBeUndefined();
    });

    it("rejects an incorrect password", async () => {
      await request(app).post("/api/auth/register").send(validUser);

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
      ["non-string password", { email: "aya@example.com", password: 12345678 }],
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
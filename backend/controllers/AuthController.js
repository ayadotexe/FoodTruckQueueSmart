const { randomUUID, randomBytes, scryptSync, timingSafeEqual } = require("node:crypto");

// accounts are stored in memory and reset when the server restarts.
const users = [];

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return { salt, hash };
}

function passwordMatches(password, user) {
  const enteredHash = scryptSync(password, user.salt, 64);
  const storedHash = Buffer.from(user.hash, "hex");

  return timingSafeEqual(enteredHash, storedHash);
}

// return account information without exposing password data
function publicUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };
}

function validText(value, maxLength) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function validEmail(email) {
  return (
    validText(email, 254) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
}

function validPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 128
  );
}

// predefined administrator for A3 demo
users.push({
  id: randomUUID(),
  firstName: "Admin",
  lastName: "Account",
  email: "admin@tacoexpress.com",
  role: "admin",
  ...hashPassword("Admin123!"),
});

function register(req, res) {
  const { firstName, lastName, email, password } = req.body || {};

  if (!validText(firstName, 50) || !validText(lastName, 50)) {
    return res.status(400).json({
      error: "First and last names are required and must be 1–50 characters.",
    });
  }

  if (!validEmail(email)) {
    return res.status(400).json({
      error: "A valid email address of at most 254 characters is required.",
    });
  }

  if (!validPassword(password)) {
    return res.status(400).json({
      error: "Password must be a string containing 8–128 characters.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((user) => user.email === normalizedEmail)) {
    return res.status(409).json({
      error: "An account with this email already exists.",
    });
  }

  const user = {
    id: randomUUID(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    role: "user",
    ...hashPassword(password),
  };

  users.push(user);

  return res.status(201).json({
    message: "Account created successfully.",
    user: publicUser(user),
  });
}

function login(req, res) {
  const { email, password } = req.body || {};

  if (!validEmail(email) || !validPassword(password)) {
    return res.status(400).json({
      error: "A valid email and password containing 8–128 characters are required.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((account) => account.email === normalizedEmail);

  if (!user || !passwordMatches(password, user)) {
    return res.status(401).json({
      error: "Incorrect email or password.",
    });
  }

  return res.status(200).json({
    message: "Login successful.",
    user: publicUser(user),
  });
}

module.exports = { register, login };
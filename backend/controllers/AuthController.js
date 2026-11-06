const {
  randomUUID,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} = require("node:crypto");

const pool = require("../db");

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return { salt, hash };
}

function passwordMatches(password, user) {
  const enteredHash = scryptSync(password, user.password_salt, 64);
  const storedHash = Buffer.from(user.password_hash, "hex");

  return (
    enteredHash.length === storedHash.length &&
    timingSafeEqual(enteredHash, storedHash)
  );
}

function publicUser(user) {
  return {
    id: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
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

async function register(req, res) {
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

  const userId = randomUUID();
  const normalizedEmail = email.trim().toLowerCase();
  const { salt, hash } = hashPassword(password);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `INSERT INTO UserCredentials
        (user_id, email, password_hash, password_salt, role)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, normalizedEmail, hash, salt, "user"]
    );

    await connection.execute(
      `INSERT INTO UserProfile
        (user_id, first_name, last_name)
       VALUES (?, ?, ?)`,
      [userId, firstName.trim(), lastName.trim()]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    throw error;
  } finally {
    connection.release();
  }

  return res.status(201).json({
    message: "Account created successfully.",
    user: {
      id: userId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      role: "user",
    },
  });
}

async function login(req, res) {
  const { email, password } = req.body || {};

  if (!validEmail(email) || !validPassword(password)) {
    return res.status(400).json({
      error: "A valid email and password containing 8–128 characters are required.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [rows] = await pool.execute(
    `SELECT
       c.user_id,
       c.email,
       c.password_hash,
       c.password_salt,
       c.role,
       p.first_name,
       p.last_name
     FROM UserCredentials AS c
     INNER JOIN UserProfile AS p
       ON p.user_id = c.user_id
     WHERE c.email = ?`,
    [normalizedEmail]
  );

  const user = rows[0];

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
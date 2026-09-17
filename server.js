/**
 * Reading Nook API
 * ------------------------------------------------------------
 * A json-server instance (db.json) for data, wrapped by a thin
 * Express layer that adds *real* auth:
 *   - passwords hashed with bcrypt (never stored in plain text)
 *   - JWT issued on login/register, verified on protected routes
 *
 * Routes:
 *   POST /auth/register   { name, email, password } -> { user, token }
 *   POST /auth/login      { email, password }        -> { user, token }
 *   GET  /api/books                                   public
 *   GET  /api/books/:id                                public
 *   GET  /api/mylist?userId=..                         protected (own data only)
 *   POST /api/mylist      { bookId }                   protected
 *   DELETE /api/mylist/:id                              protected (own entry only)
 * ------------------------------------------------------------
 */

const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jsonServer = require("json-server");

const JWT_SECRET = process.env.JWT_SECRET || "reading-nook-dev-secret";
const TOKEN_TTL = "2h";
const PORT = process.env.PORT || 4000;

const dbPath = path.join(__dirname, "db.json");
const router = jsonServer.router(dbPath);
const db = router.db; // lowdb instance - lets us read/write users, books, mylist directly

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------- helpers ----------

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

function publicUser(user) {
  const { password, ...safe } = user;
  return safe;
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Missing or malformed Authorization header" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// ---------- auth routes ----------

app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are all required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const existing = db.get("users").find({ email: email.toLowerCase() }).value();
  if (existing) {
    return res.status(409).json({ message: "An account with that email already exists." });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: `u_${Date.now()}`,
    name,
    email: email.toLowerCase(),
    password: hashed,
    createdAt: new Date().toISOString(),
  };

  db.get("users").push(user).write();

  const token = signToken(user);
  return res.status(201).json({ user: publicUser(user), token });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = db.get("users").find({ email: email.toLowerCase() }).value();
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = signToken(user);
  return res.json({ user: publicUser(user), token });
});

app.get("/auth/me", requireAuth, (req, res) => {
  const user = db.get("users").find({ id: req.userId }).value();
  if (!user) return res.status(404).json({ message: "User not found." });
  return res.json({ user: publicUser(user) });
});

// ---------- books (public reads) ----------

app.get("/api/books", (req, res) => {
  res.json(db.get("books").value());
});

app.get("/api/books/:id", (req, res) => {
  const book = db.get("books").find({ id: req.params.id }).value();
  if (!book) return res.status(404).json({ message: "Book not found." });
  res.json(book);
});

// ---------- mylist (protected, scoped to the logged-in user) ----------

app.get("/api/mylist", requireAuth, (req, res) => {
  const entries = db.get("mylist").filter({ userId: req.userId }).value();
  res.json(entries);
});

app.post("/api/mylist", requireAuth, (req, res) => {
  const { bookId } = req.body || {};
  if (!bookId) return res.status(400).json({ message: "bookId is required." });

  const alreadySaved = db
    .get("mylist")
    .find({ userId: req.userId, bookId })
    .value();
  if (alreadySaved) {
    return res.status(409).json({ message: "Already in your reading list." });
  }

  const entry = {
    id: `m_${Date.now()}`,
    userId: req.userId,
    bookId,
    addedAt: new Date().toISOString(),
  };
  db.get("mylist").push(entry).write();
  res.status(201).json(entry);
});

app.delete("/api/mylist/:id", requireAuth, (req, res) => {
  const entry = db.get("mylist").find({ id: req.params.id }).value();
  if (!entry) return res.status(404).json({ message: "Entry not found." });
  if (entry.userId !== req.userId) {
    return res.status(403).json({ message: "You can only remove your own entries." });
  }
  db.get("mylist").remove({ id: req.params.id }).write();
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Reading Nook API running at http://localhost:${PORT}`);
});

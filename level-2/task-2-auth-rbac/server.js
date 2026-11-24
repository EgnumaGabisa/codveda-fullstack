require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4100;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

const VALID_ROLES = ["viewer", "editor", "admin"];

const users = [];
let nextUserId = 1;

const campaigns = [
  { id: 1, title: "Q4 Product Launch", channel: "LinkedIn", status: "active" }
];
let nextCampaignId = 2;

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Authentication token required" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.find((u) => u.id === payload.sub);
    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden: insufficient role permissions",
        requiredRoles: allowedRoles,
        currentRole: req.user ? req.user.role : null
      });
    }
    return next();
  };
}

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required" });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  if (users.some((u) => u.email === normalizedEmail)) {
    return res.status(409).json({ error: "Email is already registered" });
  }
  const assignedRole = VALID_ROLES.includes(role) ? role : "viewer";
  const passwordHash = await bcrypt.hash(String(password), 10);

  const user = {
    id: nextUserId++,
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    role: assignedRole
  };
  users.push(user);

  const token = signToken(user);
  return res.status(201).json({
    message: "User registered successfully",
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = users.find((u) => u.email === normalizedEmail);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const passwordMatches = await bcrypt.compare(String(password), user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user);
  return res.json({
    message: "Login successful",
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

app.get("/api/auth/me", authenticate, (req, res) => {
  return res.json({ user: req.user });
});

app.get("/api/campaigns", authenticate, (req, res) => {
  return res.json({ data: campaigns });
});

app.post("/api/campaigns", authenticate, authorize("editor", "admin"), (req, res) => {
  const { title, channel, status } = req.body || {};
  if (!title || !channel) {
    return res.status(400).json({ error: "title and channel are required" });
  }
  const item = {
    id: nextCampaignId++,
    title: String(title).trim(),
    channel: String(channel).trim(),
    status: ["planned", "active", "completed"].includes(status) ? status : "planned",
    createdBy: req.user.email
  };
  campaigns.push(item);
  return res.status(201).json({ data: item });
});

app.delete("/api/campaigns/:id", authenticate, authorize("admin"), (req, res) => {
  const id = Number(req.params.id);
  const idx = campaigns.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Campaign not found" });
  }
  const [deleted] = campaigns.splice(idx, 1);
  return res.json({ message: "Deleted", data: deleted });
});

app.listen(PORT, () => {
  console.log(`Level 2 Auth & RBAC server running on http://localhost:${PORT}`);
});

import express from "express";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "climaclaro_admin";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.FILE_ADMIN_TOKEN || "";
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function safeCompare(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

function createSessionToken() {
  const payload = base64Url(JSON.stringify({
    sub: "admin",
    role: "admin",
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  }));
  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(token) {
  if (!token || !getSecret()) return false;
  const [payload, signature] = String(token).split(".");
  if (!payload || !signature || !safeCompare(signature, sign(payload))) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.sub === "admin" && data.role === "admin" && data.exp > Date.now();
  } catch {
    return false;
  }
}

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return index === -1
          ? [part, ""]
          : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function cookieOptions(maxAgeSeconds = SESSION_MAX_AGE_SECONDS) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}${secure}`;
}

function adminUser() {
  return {
    id: "admin",
    full_name: "Administrador Clima Claro",
    email: "admin@climaclaro.local",
    role: "admin",
  };
}

const router = express.Router();

router.get("/me", (req, res) => {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!verifySessionToken(token)) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  res.json(adminUser());
});

router.post("/login", (req, res) => {
  const expected = getAdminPassword();
  if (!expected || !getSecret()) {
    res.status(503).json({ message: "Admin login is not configured." });
    return;
  }

  if (!safeCompare(req.body?.password || "", expected)) {
    res.status(401).json({ message: "Contraseña incorrecta." });
    return;
  }

  const token = createSessionToken();
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(token)}; ${cookieOptions()}`);
  res.json(adminUser());
});

router.post("/logout", (_req, res) => {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; ${cookieOptions(0)}`);
  res.json({ ok: true });
});

export default router;

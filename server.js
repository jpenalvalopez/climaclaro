import "dotenv/config";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import quoteRoutes from "./server/routes/quotes.js";

dotenv.config({ path: ".env.local", override: false, quiet: true });

const app = express();
const port = Number(process.env.PORT) || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");

app.use("/api", (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-api-secret");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});
app.use(express.json());
app.use("/api", quoteRoutes);
app.use("/api", async (req, res) => {
  const base44Url = process.env.VITE_BASE44_APP_BASE_URL || "https://base44.app";
  const targetUrl = new URL(req.originalUrl, base44Url);
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (!["host", "connection", "content-length"].includes(key.toLowerCase()) && value) {
      headers.set(key, Array.isArray(value) ? value.join(",") : value);
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body || {}),
    });

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (!["content-encoding", "transfer-encoding", "connection"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.status(502).json({
      error: "No se pudo conectar con Base44 legacy.",
      details: error.message,
    });
  }
});

app.use(express.static(distPath));

app.use((_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`ClimaClaro running on port ${port}`);
});

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT) || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");
const base44Url = process.env.BASE44_PROXY_URL || "https://base44.app";

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

function getProxyHeaders(req) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;
    const lowerKey = key.toLowerCase();
    if (["host", "connection", "content-length", "accept-encoding"].includes(lowerKey)) continue;
    headers.set(key, Array.isArray(value) ? value.join(",") : value);
  }
  return headers;
}

app.use("/api", async (req, res) => {
  const targetUrl = `${base44Url}${req.originalUrl}`;

  try {
    const hasBody = !["GET", "HEAD"].includes(req.method);
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: getProxyHeaders(req),
      body: hasBody ? await readRequestBody(req) : undefined,
    });

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (!["content-encoding", "transfer-encoding", "connection"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    const body = Buffer.from(await response.arrayBuffer());
    res.send(body);
  } catch (error) {
    console.error("Base44 API proxy error:", error);
    res.status(502).json({ message: "Base44 API proxy error" });
  }
});

app.use(express.static(distPath));

app.use((_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`ClimaClaro running on port ${port}`);
});

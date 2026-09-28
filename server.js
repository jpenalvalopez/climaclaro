import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import adminAuthRouter from "./server/adminAuth.js";
import filesRouter from "./server/storage/filesRouter.js";
import {
  createEntity,
  deleteEntity,
  deleteManyEntities,
  getEntity,
  initStore,
  listEntities,
  updateEntity,
  updateManyEntities,
} from "./server/entityStore.js";

const app = express();
const port = Number(process.env.PORT) || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");

app.use(express.json({ limit: "10mb" }));
app.use("/api/admin", adminAuthRouter);
app.use("/api/files", filesRouter);

function parseQuery(raw) {
  if (!raw) return undefined;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return undefined;
  }
}

function entityOptions(req) {
  return {
    q: parseQuery(req.query.q),
    sort: req.query.sort,
    limit: req.query.limit,
    skip: req.query.skip,
    fields: req.query.fields,
  };
}

function asyncRoute(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}

const entityRouter = express.Router({ mergeParams: true });

entityRouter.get("/:entity", asyncRoute(async (req, res) => {
  res.json(await listEntities(req.params.entity, entityOptions(req)));
}));

entityRouter.get("/:entity/:id", asyncRoute(async (req, res) => {
  res.json(await getEntity(req.params.entity, req.params.id));
}));

entityRouter.post("/:entity", asyncRoute(async (req, res) => {
  res.status(201).json(await createEntity(req.params.entity, req.body));
}));

entityRouter.post("/:entity/bulk", asyncRoute(async (req, res) => {
  const records = Array.isArray(req.body) ? req.body : [];
  const created = [];
  for (const record of records) created.push(await createEntity(req.params.entity, record));
  res.status(201).json(created);
}));

entityRouter.put("/:entity/bulk", asyncRoute(async (req, res) => {
  const records = Array.isArray(req.body) ? req.body : [];
  const updated = [];
  for (const record of records) updated.push(await updateEntity(req.params.entity, record.id, record));
  res.json(updated);
}));

entityRouter.put("/:entity/:id", asyncRoute(async (req, res) => {
  res.json(await updateEntity(req.params.entity, req.params.id, req.body));
}));

entityRouter.patch("/:entity/update-many", asyncRoute(async (req, res) => {
  res.json(await updateManyEntities(req.params.entity, req.body?.query, req.body?.data));
}));

entityRouter.delete("/:entity", asyncRoute(async (req, res) => {
  res.json(await deleteManyEntities(req.params.entity, req.body));
}));

entityRouter.delete("/:entity/:id", asyncRoute(async (req, res) => {
  res.json(await deleteEntity(req.params.entity, req.params.id));
}));

app.use("/api/entities", entityRouter);
app.use("/api/apps/:appId/entities", entityRouter);

app.post("/api/functions/:name", (req, res) => {
  console.log(`Function ${req.params.name} requested`, req.body);
  res.json({ ok: true });
});

app.post("/api/apps/:appId/analytics/track/batch", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/apps/public/prod/public-settings/by-id/:appId", (req, res) => {
  res.json({ id: req.params.appId, public_settings: { requires_auth: false } });
});

app.get("/api/apps/:appId/entities/User/me", (_req, res) => {
  res.status(401).json({ message: "Not authenticated" });
});

app.use(express.static(distPath));

app.use((_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

initStore()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`ClimaClaro running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize data store:", error);
    process.exit(1);
  });

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ message: "El archivo supera el tamano maximo permitido." });
    return;
  }
  res.status(error.status || 500).json({ message: error.message || "Internal server error" });
});

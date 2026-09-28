import express from "express";
import multer from "multer";
import {
  deleteFile,
  getFileMetadata,
  getSignedUrl,
  uploadFile,
} from "./storageService.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1,
  },
});

const router = express.Router();

function requireAdminToken(req, _res, next) {
  const expectedToken = process.env.FILE_ADMIN_TOKEN;
  if (!expectedToken) {
    const error = new Error("FILE_ADMIN_TOKEN no esta configurado para operaciones privadas.");
    error.status = 503;
    next(error);
    return;
  }

  const authHeader = req.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : req.get("x-file-admin-token");
  if (token !== expectedToken) {
    const error = new Error("No autorizado.");
    error.status = 401;
    next(error);
    return;
  }

  next();
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

function pickExtra(body) {
  return {
    brandSlug: body.brandSlug,
    productSlug: body.productSlug,
    serviceSlug: body.serviceSlug,
    quoteNumber: body.quoteNumber,
    orderNumber: body.orderNumber,
    installationId: body.installationId,
    clientId: body.clientId,
    leadId: body.leadId,
    phase: body.phase,
    kind: body.kind,
    entityId: body.entityId,
  };
}

router.post("/upload", upload.single("file"), asyncRoute(async (req, res) => {
  if (!req.file) {
    const error = new Error("No se ha recibido ningun archivo.");
    error.status = 400;
    throw error;
  }

  const asset = await uploadFile({
    buffer: req.file.buffer,
    originalFilename: req.file.originalname,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    type: req.body.type,
    entityId: req.body.entityId,
    extra: pickExtra(req.body),
  });

  res.status(201).json(asset);
}));

router.get("/:id/metadata", requireAdminToken, asyncRoute(async (req, res) => {
  res.json(await getFileMetadata(req.params.id));
}));

router.get("/:id/signed-url", requireAdminToken, asyncRoute(async (req, res) => {
  res.json(await getSignedUrl(req.params.id, req.query.expiresMinutes));
}));

router.delete("/:id", requireAdminToken, asyncRoute(async (req, res) => {
  res.json(await deleteFile(req.params.id));
}));

export default router;

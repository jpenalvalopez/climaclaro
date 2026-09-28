import path from "node:path";
import { randomUUID } from "node:crypto";

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PDF_MIME_TYPES = new Set(["application/pdf"]);
const ALLOWED_EXTENSIONS = new Map([
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/png", new Set([".png"])],
  ["image/webp", new Set([".webp"])],
  ["application/pdf", new Set([".pdf"])],
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_BYTES = 20 * 1024 * 1024;

export function isImageMime(mimeType) {
  return IMAGE_MIME_TYPES.has(mimeType);
}

export function isPdfMime(mimeType) {
  return PDF_MIME_TYPES.has(mimeType);
}

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export function normalizeIdentifier(value, fieldName = "identifier") {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized || normalized.includes("..") || normalized.includes("/") || normalized.includes("\\")) {
    throw badRequest(`${fieldName} no es valido.`);
  }

  return normalized;
}

export function normalizeFileName(originalFilename, mimeType) {
  const originalExtension = path.extname(originalFilename || "");
  const extension = originalExtension.toLowerCase();
  const baseName = path.basename(originalFilename || "archivo", originalExtension);
  const allowed = ALLOWED_EXTENSIONS.get(mimeType);

  if (!extension || !allowed?.has(extension)) {
    throw badRequest("La extension del archivo no coincide con el tipo permitido.");
  }

  const cleanBase = normalizeIdentifier(baseName, "filename");
  return `${Date.now()}-${randomUUID()}-${cleanBase}${extension}`;
}

export function validateFile({ originalFilename, mimeType, sizeBytes }) {
  if (!originalFilename) throw badRequest("El archivo debe tener nombre.");
  if (!mimeType || !ALLOWED_EXTENSIONS.has(mimeType)) throw badRequest("Tipo de archivo no permitido.");

  if (isImageMime(mimeType) && sizeBytes > MAX_IMAGE_BYTES) {
    throw badRequest("La imagen supera el limite de 10 MB.");
  }

  if (isPdfMime(mimeType) && sizeBytes > MAX_PDF_BYTES) {
    throw badRequest("El PDF supera el limite de 20 MB.");
  }

  return true;
}

export function validateKind(value, allowed, fieldName) {
  const normalized = normalizeIdentifier(value, fieldName);
  if (!allowed.includes(normalized)) {
    throw badRequest(`${fieldName} no es valido.`);
  }
  return normalized;
}

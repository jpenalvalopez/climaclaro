import { Storage } from "@google-cloud/storage";
import { createHash } from "node:crypto";
import {
  createEntity,
  getEntity,
  updateEntity,
} from "../entityStore.js";
import { normalizeFileName, validateFile } from "./fileValidation.js";
import { resolveStoragePath } from "./storagePaths.js";

const DEFAULT_SIGNED_URL_MINUTES = Number(process.env.SIGNED_URL_EXPIRES_MINUTES || 10);

let storageClient;

function getStorage() {
  if (!storageClient) {
    storageClient = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || undefined,
    });
  }
  return storageClient;
}

function getBucketName(visibility) {
  if (visibility === "public") {
    return process.env.GOOGLE_CLOUD_PUBLIC_BUCKET || "climaclaro-public-assets";
  }

  return process.env.GOOGLE_CLOUD_PRIVATE_BUCKET || "climaclaro-private-documents";
}

function encodeObjectPath(objectPath) {
  return objectPath.split("/").map(encodeURIComponent).join("/");
}

function publicUrl(bucket, objectPath) {
  return `https://storage.googleapis.com/${bucket}/${encodeObjectPath(objectPath)}`;
}

function checksum(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function toFileAssetResponse(record) {
  return {
    id: record.id,
    bucket: record.bucket,
    object_path: record.object_path,
    public_url: record.public_url || null,
    visibility: record.visibility,
    file_type: record.file_type,
    entity_type: record.entity_type,
    entity_id: record.entity_id,
    original_filename: record.original_filename,
    stored_filename: record.stored_filename,
    mime_type: record.mime_type,
    size_bytes: record.size_bytes,
    checksum: record.checksum,
    created_date: record.created_date,
    updated_date: record.updated_date,
    deleted_date: record.deleted_date || null,
  };
}

export async function uploadFile({
  buffer,
  originalFilename,
  mimeType,
  sizeBytes,
  type,
  entityId,
  extra = {},
}) {
  validateFile({ originalFilename, mimeType, sizeBytes });

  const storedFilename = normalizeFileName(originalFilename, mimeType);
  const resolved = resolveStoragePath({
    type,
    filename: storedFilename,
    mimeType,
    fields: { ...extra, entityId },
  });
  const bucket = getBucketName(resolved.visibility);
  const objectPath = resolved.objectPath;
  const public_url = resolved.visibility === "public" ? publicUrl(bucket, objectPath) : null;

  await getStorage().bucket(bucket).file(objectPath).save(buffer, {
    resumable: false,
    contentType: mimeType,
    metadata: {
      cacheControl: resolved.visibility === "public" ? "public, max-age=31536000, immutable" : "private, max-age=0",
      metadata: {
        originalFilename,
        fileType: type,
        entityType: resolved.entityType,
        entityId: entityId || extra.entityId || "",
      },
    },
  });

  const asset = await createEntity("FileAsset", {
    bucket,
    object_path: objectPath,
    public_url,
    visibility: resolved.visibility,
    file_type: type,
    entity_type: resolved.entityType,
    entity_id: entityId || extra.entityId || "",
    original_filename: originalFilename,
    stored_filename: storedFilename,
    mime_type: mimeType,
    size_bytes: sizeBytes,
    checksum: checksum(buffer),
    deleted_date: null,
  });

  return toFileAssetResponse(asset);
}

export async function getFileMetadata(fileId) {
  const record = await getEntity("FileAsset", fileId);
  if (record.deleted_date) {
    const error = new Error("Archivo eliminado.");
    error.status = 410;
    throw error;
  }

  return toFileAssetResponse(record);
}

export async function getPublicUrl(fileId) {
  const record = await getFileMetadata(fileId);
  if (record.visibility !== "public") {
    const error = new Error("El archivo no es publico.");
    error.status = 403;
    throw error;
  }

  return record.public_url || publicUrl(record.bucket, record.object_path);
}

export async function getSignedUrl(fileId, expiresMinutes = DEFAULT_SIGNED_URL_MINUTES) {
  const record = await getFileMetadata(fileId);
  if (record.visibility === "public") {
    return {
      url: record.public_url || publicUrl(record.bucket, record.object_path),
      expires_at: null,
    };
  }

  const minutes = Math.max(1, Math.min(Number(expiresMinutes) || DEFAULT_SIGNED_URL_MINUTES, 60));
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
  const [url] = await getStorage()
    .bucket(record.bucket)
    .file(record.object_path)
    .getSignedUrl({
      version: "v4",
      action: "read",
      expires: expiresAt,
    });

  return {
    url,
    expires_at: expiresAt.toISOString(),
  };
}

export async function deleteFile(fileId) {
  const record = await getFileMetadata(fileId);
  await getStorage().bucket(record.bucket).file(record.object_path).delete({ ignoreNotFound: true });

  const updated = await updateEntity("FileAsset", fileId, {
    ...record,
    deleted_date: new Date().toISOString(),
  });

  return toFileAssetResponse(updated);
}

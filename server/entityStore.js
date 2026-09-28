import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import pg from "pg";

const { Pool } = pg;

const DATA_FILE = path.join(process.cwd(), "data", "local-db.json");
const SYSTEM_FIELDS = new Set(["id", "created_date", "updated_date"]);
const PRIVATE_FIELDS = new Set(["created_by", "created_by_id", "is_sample"]);

let pool;

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function initStore() {
  if (!hasDatabase()) {
    await ensureLocalFile();
    return;
  }

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS entity_records (
      entity TEXT NOT NULL,
      id TEXT NOT NULL,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (entity, id)
    );

    CREATE INDEX IF NOT EXISTS entity_records_entity_idx ON entity_records(entity);
    CREATE INDEX IF NOT EXISTS entity_records_data_gin_idx ON entity_records USING GIN(data);
  `);
}

async function ensureLocalFile() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({}, null, 2));
  }
}

async function readLocalDb() {
  await ensureLocalFile();
  return JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
}

async function writeLocalDb(db) {
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2));
}

function nowIso() {
  return new Date().toISOString();
}

function toRecord(row) {
  return {
    id: row.id,
    created_date: row.created_date instanceof Date ? row.created_date.toISOString() : row.created_date,
    updated_date: row.updated_date instanceof Date ? row.updated_date.toISOString() : row.updated_date,
    ...row.data,
  };
}

function pickFields(record, fields) {
  const publicRecord = stripPrivateFields(record);
  if (!fields) return publicRecord;
  const wanted = Array.isArray(fields) ? fields : String(fields).split(",");
  return wanted.reduce((acc, field) => {
    const key = field.trim();
    if (key && publicRecord[key] !== undefined) acc[key] = publicRecord[key];
    return acc;
  }, { id: publicRecord.id });
}

function stripPrivateFields(record) {
  return Object.fromEntries(
    Object.entries(record || {}).filter(([key]) => !PRIVATE_FIELDS.has(key))
  );
}

function matchesQuery(record, query = {}) {
  return Object.entries(query || {}).every(([key, expected]) => {
    const actual = record[key];
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      if ("$in" in expected) return expected.$in.includes(actual);
      if ("$ne" in expected) return actual !== expected.$ne;
    }
    return actual === expected;
  });
}

function compareValues(a, b) {
  if (a === b) return 0;
  if (a === undefined || a === null) return 1;
  if (b === undefined || b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });
}

function applyListOptions(records, { q, sort, limit, skip, fields } = {}) {
  let result = [...records];
  if (q) result = result.filter((record) => matchesQuery(record, q));
  if (sort) {
    const descending = String(sort).startsWith("-");
    const field = descending ? String(sort).slice(1) : String(sort);
    result.sort((a, b) => (descending ? -1 : 1) * compareValues(a[field], b[field]));
  }
  if (skip) result = result.slice(Number(skip));
  if (limit) result = result.slice(0, Number(limit));
  return result.map((record) => pickFields(record, fields));
}

function splitData(record) {
  const data = {};
  for (const [key, value] of Object.entries(record || {})) {
    if (!SYSTEM_FIELDS.has(key) && !PRIVATE_FIELDS.has(key)) data[key] = value;
  }
  return data;
}

export async function listEntities(entity, options = {}) {
  if (hasDatabase()) {
    const { rows } = await getPool().query(
      "SELECT id, data, created_date, updated_date FROM entity_records WHERE entity = $1",
      [entity]
    );
    return applyListOptions(rows.map(toRecord), options);
  }

  const db = await readLocalDb();
  return applyListOptions(db[entity] || [], options);
}

export async function getEntity(entity, id) {
  const records = await listEntities(entity);
  const record = records.find((item) => item.id === id);
  if (!record) {
    const error = new Error(`${entity} not found`);
    error.status = 404;
    throw error;
  }
  return record;
}

export async function createEntity(entity, payload = {}) {
  const timestamp = nowIso();
  const record = {
    id: payload.id || randomUUID(),
    created_date: payload.created_date || timestamp,
    updated_date: payload.updated_date || timestamp,
    ...payload,
  };

  if (hasDatabase()) {
    await getPool().query(
      `INSERT INTO entity_records (entity, id, data, created_date, updated_date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (entity, id)
       DO UPDATE SET data = EXCLUDED.data, updated_date = EXCLUDED.updated_date`,
      [entity, record.id, splitData(record), record.created_date, record.updated_date]
    );
    return record;
  }

  const db = await readLocalDb();
  db[entity] = db[entity] || [];
  db[entity].push(record);
  await writeLocalDb(db);
  return record;
}

export async function updateEntity(entity, id, payload = {}) {
  const current = await getEntity(entity, id);
  const record = { ...current, ...payload, id, updated_date: nowIso() };

  if (hasDatabase()) {
    await getPool().query(
      "UPDATE entity_records SET data = $3, updated_date = $4 WHERE entity = $1 AND id = $2",
      [entity, id, splitData(record), record.updated_date]
    );
    return record;
  }

  const db = await readLocalDb();
  db[entity] = (db[entity] || []).map((item) => (item.id === id ? record : item));
  await writeLocalDb(db);
  return record;
}

export async function deleteEntity(entity, id) {
  if (hasDatabase()) {
    await getPool().query("DELETE FROM entity_records WHERE entity = $1 AND id = $2", [entity, id]);
    return { success: true };
  }

  const db = await readLocalDb();
  db[entity] = (db[entity] || []).filter((item) => item.id !== id);
  await writeLocalDb(db);
  return { success: true };
}

export async function deleteManyEntities(entity, query = {}) {
  const records = await listEntities(entity);
  const toDelete = records.filter((record) => matchesQuery(record, query));
  for (const record of toDelete) await deleteEntity(entity, record.id);
  return { deleted: toDelete.length };
}

export async function updateManyEntities(entity, query = {}, data = {}) {
  const records = await listEntities(entity);
  const matched = records.filter((record) => matchesQuery(record, query));
  const updated = [];
  for (const record of matched) updated.push(await updateEntity(entity, record.id, data));
  return updated;
}

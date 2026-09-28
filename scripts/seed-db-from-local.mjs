import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;
const dataPath = path.join(process.cwd(), "data", "local-db.json");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to seed PostgreSQL.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

const db = JSON.parse(await fs.readFile(dataPath, "utf8"));

function splitRecord(record) {
  const { id, created_date, updated_date, ...data } = record;
  return {
    id,
    created_date: created_date || new Date().toISOString(),
    updated_date: updated_date || new Date().toISOString(),
    data,
  };
}

try {
  for (const [entity, records] of Object.entries(db)) {
    for (const record of records) {
      const split = splitRecord(record);
      await pool.query(
        `INSERT INTO entity_records (entity, id, data, created_date, updated_date)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (entity, id)
         DO UPDATE SET data = EXCLUDED.data, updated_date = EXCLUDED.updated_date`,
        [entity, split.id, split.data, split.created_date, split.updated_date]
      );
    }
    console.log(`${entity}: ${records.length}`);
  }
} finally {
  await pool.end();
}

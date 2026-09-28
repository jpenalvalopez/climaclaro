import "dotenv/config";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local", override: false, quiet: true });

const { Pool } = pg;

let pool;

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDatabaseMissingMessage() {
  return "DATABASE_URL no esta configurada. Define DATABASE_URL para usar la base de datos propia de Quotes.";
}

export function getPool() {
  if (!hasDatabaseUrl()) {
    throw new Error(getDatabaseMissingMessage());
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
    });
  }

  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}

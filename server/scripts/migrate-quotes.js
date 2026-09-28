import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDatabaseMissingMessage, query } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsPath = path.join(__dirname, "..", "migrations");

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error(getDatabaseMissingMessage());
  }

  const files = (await fs.readdir(migrationsPath))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = await fs.readFile(path.join(migrationsPath, file), "utf8");
    await query(sql);
    console.log(`Applied ${file}.`);
  }

  console.log("Quote migration completed.");
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

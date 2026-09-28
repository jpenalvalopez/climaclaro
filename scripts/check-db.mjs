import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to check the database connection.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

try {
  const { rows } = await pool.query(`
    SELECT
      current_database() AS database,
      current_user AS user,
      version() AS version
  `);

  console.log("Database connection OK");
  console.log(`Database: ${rows[0].database}`);
  console.log(`User: ${rows[0].user}`);
  console.log(rows[0].version);
} finally {
  await pool.end();
}

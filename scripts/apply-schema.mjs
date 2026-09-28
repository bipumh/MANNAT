// Applies all neon/migrations/*.sql to the Neon database pointed at by
// DATABASE_URL, in filename order. Idempotent migrations can be re-run safely.
// Usage: node --env-file=.env.local scripts/apply-schema.mjs
import { neon } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(__dirname, "../neon/migrations");

const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set.");

const sql = neon(url);

let total = 0;
for (const file of files) {
  const sqlText = readFileSync(join(migrationsDir, file), "utf8");
  const statements = sqlText
    .replace(/--[^\n]*/g, "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await sql.query(stmt);
    total += 1;
  }
  console.log(`Applied ${file} (${statements.length} statements)`);
}

console.log(`Done — ${total} statements across ${files.length} migrations.`);

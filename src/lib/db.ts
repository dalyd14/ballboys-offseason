import { neon } from "@neondatabase/serverless";

/**
 * Neon serverless driver for raw SQL queries.
 * Uses HTTP-based connection — ideal for serverless/edge on Vercel.
 *
 * Usage:
 *   const sql = getSql();
 *   const users = await sql`SELECT * FROM "user" WHERE email = ${email}`;
 *
 * The tagged template handles parameterization automatically.
 * Returns rows as plain objects.
 */
export function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local");
  }
  return neon(connectionString);
}

/**
 * Neon Pool for Better Auth's Kysely adapter.
 * Uses WebSocket-based connection — pg-compatible.
 * Only used by the auth layer; app code uses getSql() above.
 */
export function getPool() {
  const { Pool } = require("@neondatabase/serverless");
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local");
  }
  return new Pool({ connectionString });
}

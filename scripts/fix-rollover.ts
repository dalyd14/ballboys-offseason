// One-off script to mark the active season's rollover as complete.
// Usage: npx tsx scripts/fix-rollover.ts

import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

async function main() {
  const { getSql } = await import("../src/lib/db");
  const sql = getSql();

  // Find the active season
  const seasons = await sql`
    SELECT id, year, rollover_completed, status
    FROM season
    WHERE status IN ('setup', 'open', 'locked')
    ORDER BY year DESC LIMIT 1
  `;

  if (!seasons[0]) {
    console.log("No active season found.");
    process.exit(1);
  }

  console.log("Active season:", JSON.stringify(seasons[0], null, 2));

  if (seasons[0].rollover_completed) {
    console.log("Rollover already marked complete. Nothing to do.");
    process.exit(0);
  }

  // Mark rollover as complete
  await sql`
    UPDATE season SET rollover_completed = true WHERE id = ${seasons[0].id}
  `;
  console.log(`✅ Marked season ${seasons[0].year} rollover as complete.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});

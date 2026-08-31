import { readFileSync } from "fs";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";

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
  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`
    SELECT
      u.email,
      u."ownerName",
      u."teamName",
      u.role,
      a.password IS NOT NULL AS has_password
    FROM "user" u
    LEFT JOIN "account" a ON a."userId" = u.id AND a."providerId" = 'credential'
    ORDER BY u."ownerName"
  `;

  console.table(rows);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * ============================================================
 * Seed Script — Create all 12 league owners
 * ============================================================
 *
 * Uses Better Auth's server-side API to create accounts with
 * properly hashed passwords. Run with:
 *
 *   npx tsx scripts/seed-owners.ts
 *
 * The first owner (David Daly) is created as admin.
 * All others are regular users.
 *
 * Password is passed as a CLI arg:
 *   npx tsx scripts/seed-owners.ts <password>
 *
 * If no password is given, defaults to "ballboys2026" and
 * prints a warning.
 * ============================================================
 */

// Load .env.local before anything else (script runs outside Next.js).
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

// Dynamic import so env vars are set before auth (which reads DATABASE_URL
// at module-load time) is evaluated. Deferred to main() for CJS compat.
let auth: Awaited<ReturnType<typeof import("../src/lib/auth")>["auth"]>;

interface OwnerSeed {
  teamName: string;
  ownerName: string;
  email: string;
  role: "admin" | "user";
}

const owners: OwnerSeed[] = [
  { teamName: "Hold the Door Please", ownerName: "David Daly", email: "dalyd14@gmail.com", role: "admin" },
  { teamName: "I Got Butker", ownerName: "Chris Daly", email: "cmd3442@gmail.com", role: "user" },
  { teamName: "Harbaugh Bros", ownerName: "Justin McDonald", email: "jhmcdonald25@gmail.com", role: "user" },
  { teamName: "Quiche For Dinner", ownerName: "Tim Daly", email: "tim.mj.daly@gmail.com", role: "user" },
  { teamName: "Mr. Mickey D", ownerName: "Matt McDonald", email: "mattmcd1221@gmail.com", role: "user" },
  { teamName: "Team mcdonald", ownerName: "Colin McDonald", email: "colinmcdonald222@gmail.com", role: "user" },
  { teamName: "Swamp Donkeys", ownerName: "Tyler Howard-Reardon", email: "thofmannreardon@gmail.com", role: "user" },
  { teamName: "Favre Dollar Footlong", ownerName: "Mike Welch", email: "mewelch11@gmail.com", role: "user" },
  { teamName: "Jobe Squad", ownerName: "Jon Karas", email: "jkaras95@gmail.com", role: "user" },
  { teamName: "Mayfield a good team", ownerName: "Evan Ulatowski", email: "ewu5006@icloud.com", role: "user" },
  { teamName: "The Wet Bandits", ownerName: "Braxton Ambrose", email: "braxton.j.ambrose@gmail.com", role: "user" },
  { teamName: "Laces Out Finkle", ownerName: "Chad Bartnicki", email: "chadbartnicki@gmail.com", role: "user" },
];

async function main() {
  // Dynamic import here so env vars are loaded first.
  const authModule = await import("../src/lib/auth");
  auth = authModule.auth;

  const password = process.argv[2] ?? "ballboys2026";
  if (!process.argv[2]) {
    console.log("⚠️  No password provided, using default: ballboys2026");
    console.log("   Pass one explicitly: npx tsx scripts/seed-owners.ts <password>\n");
  }

  let created = 0;
  let skipped = 0;

  for (const owner of owners) {
    try {
      const res = await auth.api.signUpEmail({
        body: {
          email: owner.email,
          password,
          name: owner.ownerName,
          // additionalFields — these are set via the user table directly
          // since Better Auth's signUp doesn't accept custom fields in body
          // in all versions. We'll update them after signup.
        },
      });

      // Update the league-specific fields that Better Auth doesn't
      // accept through signUpEmail (they're marked input: false).
      if (res?.user?.id) {
        const { getSql } = await import("../src/lib/db");
        const sql = getSql();
        await sql`
          UPDATE "user"
          SET "ownerName" = ${owner.ownerName},
              "teamName" = ${owner.teamName},
              "role" = ${owner.role}
          WHERE id = ${res.user.id}
        `;
        console.log(`✅ Created: ${owner.ownerName} (${owner.teamName}) — ${owner.email} [${owner.role}]`);
        created++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already") || msg.includes("unique") || msg.includes("duplicate")) {
        console.log(`⏭️  Skipped (already exists): ${owner.ownerName} — ${owner.email}`);
        skipped++;
      } else {
        console.error(`❌ Failed: ${owner.ownerName} — ${owner.email}`);
        console.error(`   Error: ${msg}`);
      }
    }
  }

  console.log(`\nDone. ${created} created, ${skipped} skipped.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});

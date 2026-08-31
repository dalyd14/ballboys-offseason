# Ballboys Offseason v2

Fantasy football offseason contract manager for the Ballboys League. Migrated from the original Create React App + Pipedream + MongoDB stack to Next.js + Better Auth + Neon Postgres.

## Stack

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions)
- **Auth:** Better Auth (email/password, credential provider)
- **Database:** Neon Postgres via `@neondatabase/serverless` (HTTP driver, raw SQL)
- **Styling:** Tailwind CSS v4
- **Deployment:** Vercel

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

- `DATABASE_URL` — Neon connection string (from [console.neon.tech](https://console.neon.tech))
- `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32`
- `BETTER_AUTH_URL` — `http://localhost:3000` for dev

### 3. Create the database schema

```bash
psql $DATABASE_URL -f db/schema.sql
```

Or run the Better Auth migration for just the auth tables:

```bash
npx auth@latest migrate
```

Then run the league tables portion of `db/schema.sql` manually.

### 4. Create the first admin user

After the schema is created, sign up via the API or use the Better Auth CLI:

```bash
npx auth@latest create-admin
```

Then manually set the user's `role` to `'admin'` in the database:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
src/
├── app/
│   ├── api/auth/[...all]/route.ts   # Better Auth handler
│   ├── sign-in/page.tsx             # Login page (client)
│   ├── submit-roster/               # Owner: submit offseason roster
│   ├── my-team/                     # Owner: view own team
│   ├── other-teams/                 # Owner: browse all teams
│   └── admin/                       # Commissioner dashboard
│       ├── season/                  # Create seasons, run rollover
│       ├── import/                  # ESPN HTML upload + parse
│       ├── review/                  # Review trade/cut exceptions
│       ├── owners/                  # Set budgets & submission locks
│       ├── players/                 # Edit player contracts
│       └── audit/                   # Activity log
├── components/                      # React components
├── lib/
│   ├── auth.ts                      # Better Auth config
│   ├── auth-client.ts               # Better Auth client (React)
│   ├── db.ts                        # Neon serverless driver
│   ├── data.ts                      # Data access layer (raw SQL)
│   ├── offseason.ts                 # Rules engine (pure functions)
│   ├── espn-parser.ts               # ESPN HTML parser
│   ├── session.ts                   # Session helpers
│   └── types.ts                     # TypeScript types
└── proxy.ts                         # Auth-protecting proxy (middleware)
db/
└── schema.sql                       # Full database schema
```

## League Rules (encoded in `src/lib/offseason.ts`)

### Salary Cap
Each owner has a pool of "Available Years" (default 8). Signing or renegotiating a player spends years. Existing contracts count against the cap.

### Cutting Players
- **Penalty:** `ceil(contractYears / 2)`, rounded up.
- **Offseason cut:** based on post-rollover years. Player goes to draft pool.
- **In-season cut:** based on pre-rollover years. Contract & negotiation history wiped. If the original owner ends up with the player again, they cannot re-sign — player auto-enters draft.

### Renegotiations
- 1 per owner per offseason by default (tradeable).
- Can extend OR reduce a contract.
- Cannot renegotiate the same player twice (lifetime lock).
- Tokens do not roll over — use it or lose it.

### Signing
Only for players with no contract (`contractYears = null`). Assign a new contract; sets negotiation eligibility to true.

### Draft Pool Reset
When a player enters the draft pool, both contract years AND negotiation eligibility reset to clean state.

## Commissioner Workflow

1. **Create season** (admin/season) — set year, base cap, base negotiations
2. **Run rollover** — decrement all contract years by 1
3. **Import ESPN rosters** (admin/import) — upload HTML export per owner
4. **Review exceptions** (admin/review) — mark trades vs cuts vs pickups
5. **Set budgets** (admin/owners) — available years & negotiations per owner
6. **Open submissions** (admin/owners) — toggle "Can Submit" per owner
7. **Owners submit rosters** — each owner makes offseason decisions
8. **Lock & archive** — close the window, archive the season

## ESPN Import

The parser (`src/lib/espn-parser.ts`) attempts several HTML patterns. It needs a sample export file to be finalized for the exact ESPN template structure.

## Deployment

1. Push to GitHub
2. Import to Vercel
3. Set environment variables in Vercel dashboard
4. Run `db/schema.sql` against Neon
5. Create the admin user

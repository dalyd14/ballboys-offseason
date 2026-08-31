-- ============================================================
-- Ballboys Offseason — Database Schema
-- Target: Neon (PostgreSQL)
-- ============================================================
-- This file is the single source of truth for the database.
-- It includes:
--   1. Better Auth core tables (user, session, account, verification)
--      — the `user` table is extended with league fields via
--      `additionalFields` in src/lib/auth.ts.
--   2. League tables (seasons, players, roster_moves, audit_log).
--
-- Run this against your Neon database:
--   psql $DATABASE_URL -f db/schema.sql
--
-- The Better Auth CLI can also generate/migrate the auth tables:
--   npx auth@latest migrate
-- But the full league schema must be run manually (or via a script).
-- ============================================================

-- ============================================================
-- 1. BETTER AUTH CORE TABLES
-- ============================================================
-- These mirror what `npx auth generate --output` produces for
-- PostgreSQL, with the league-specific additionalFields columns
-- added to the `user` table.

CREATE TABLE IF NOT EXISTS "user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  emailVerified boolean NOT NULL DEFAULT false,
  image text,
  -- League-specific fields (from additionalFields in auth.ts)
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  "ownerName" text,
  "teamName" text,
  "availableYears" integer NOT NULL DEFAULT 0,
  "availableNegotiations" integer NOT NULL DEFAULT 1,
  "rosterSubmitted" boolean NOT NULL DEFAULT false,
  "canSubmit" boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  id text PRIMARY KEY,
  expiresAt timestamp NOT NULL,
  token text NOT NULL UNIQUE,
  createdAt timestamp NOT NULL,
  updatedAt timestamp NOT NULL,
  ipAddress text,
  userAgent text,
  userId text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  id text PRIMARY KEY,
  accountId text NOT NULL,
  providerId text NOT NULL,
  userId text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  accessToken text,
  refreshToken text,
  idToken text,
  accessTokenExpiresAt timestamp,
  refreshTokenExpiresAt timestamp,
  scope text,
  password text,
  createdAt timestamp NOT NULL,
  updatedAt timestamp NOT NULL,
  issuer text,
  UNIQUE (issuer, accountId)
);

CREATE TABLE IF NOT EXISTS "verification" (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  expiresAt timestamp NOT NULL,
  createdAt timestamp,
  updatedAt timestamp
);

-- ============================================================
-- 2. LEAGUE TABLES
-- ============================================================

-- ---- Seasons ----
-- Tracks each NFL season/offseason cycle. The admin drives the
-- lifecycle: setup → open (owners submit) → locked → archived.
CREATE TABLE IF NOT EXISTS "season" (
  id text PRIMARY KEY,
  year integer NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'setup'
    CHECK (status IN ('setup', 'open', 'locked', 'archived')),
  rollover_completed boolean NOT NULL DEFAULT false,
  -- Base salary cap years each owner starts with (before penalties).
  base_cap_years integer NOT NULL DEFAULT 8,
  -- Base renegotiation tokens each owner starts with.
  base_negotiations integer NOT NULL DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- ---- Players ----
-- One row per player per season. The ESPN HTML upload creates/updates
-- these rows. contract_years is NULL when "none" (free agent pickup).
CREATE TABLE IF NOT EXISTS "player" (
  id text PRIMARY KEY,
  season_id text NOT NULL REFERENCES "season"(id) ON DELETE CASCADE,
  owner_id text REFERENCES "user"(id) ON DELETE SET NULL,
  player_name text NOT NULL,
  nfl_team text NOT NULL,
  position text NOT NULL,
  image_url text,
  -- Contract years remaining. NULL = "none" (no contract, free agent).
  contract_years integer,
  -- Whether the player is eligible for renegotiation this offseason.
  -- LIFETIME LOCK: once false, stays false until player goes to the
  -- draft pool, which resets it to true. (Per rule: "You CANNOT issue
  -- a contract renegotiation to the same player more than once.")
  negotiation_available boolean NOT NULL DEFAULT true,
  -- Whether the owner dropped this player during the ESPN regular season.
  -- Set during admin review; drives the cut penalty calculation.
  cut_during_season boolean NOT NULL DEFAULT false,
  -- If cut_during_season, the contract years at time of cut (pre-rollover).
  -- Used to compute the penalty: ceil(contract_years_at_cut / 2).
  contract_years_at_cut integer,
  -- Whether this player is headed to the draft pool (no contract, no owner).
  -- Set by rollover logic or admin. When true, contract & negotiation reset.
  to_draft boolean NOT NULL DEFAULT false,
  -- ESPN headshot/team logo URL from the import.
  espn_player_id text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_player_season_owner
  ON "player" (season_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_player_season_to_draft
  ON "player" (season_id, to_draft);
CREATE INDEX IF NOT EXISTS idx_player_owner_name
  ON "player" (owner_id, player_name);

-- ---- Roster Moves ----
-- The submitted offseason decisions. One row per player per owner per
-- season. Created when the owner submits their roster.
CREATE TABLE IF NOT EXISTS "roster_move" (
  id text PRIMARY KEY,
  season_id text NOT NULL REFERENCES "season"(id) ON DELETE CASCADE,
  player_id text NOT NULL REFERENCES "player"(id) ON DELETE CASCADE,
  owner_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('sign', 'renegotiate', 'cut', 'nothing')),
  -- The new contract years after this move (0 for cut, null/none for N/A).
  new_contract integer,
  -- Whether the player is eligible for renegotiation after this move.
  new_negotiation_available boolean,
  -- Years debited against the owner's salary cap by this move.
  year_debit integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now(),
  UNIQUE (season_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_roster_move_season_owner
  ON "roster_move" (season_id, owner_id);

-- ---- Audit Log ----
-- Tracks admin actions for history: rollovers, cut penalties,
-- contract edits, season status changes, etc.
CREATE TABLE IF NOT EXISTS "audit_log" (
  id text PRIMARY KEY,
  season_id text REFERENCES "season"(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  -- JSON blob with event-specific details.
  details jsonb,
  -- The admin user who triggered the event.
  actor_id text REFERENCES "user"(id) ON DELETE SET NULL,
  -- The affected owner (if any).
  owner_id text REFERENCES "user"(id) ON DELETE SET NULL,
  -- The affected player (if any).
  player_id text REFERENCES "player"(id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_season
  ON "audit_log" (season_id, created_at);

-- ============================================================
-- HELPFUL VIEWS
-- ============================================================

-- Players going to the draft this season (contract 0, negotiation false).
-- Matches the old "Players to the Draft" view in OtherTeamView.
CREATE OR REPLACE VIEW v_players_to_draft AS
SELECT
  p.id,
  p.season_id,
  p.player_name,
  p.nfl_team,
  p.position,
  p.image_url,
  u."ownerName" AS owner_name
FROM "player" p
LEFT JOIN "user" u ON p.owner_id = u.id
WHERE p.to_draft = true
ORDER BY p.player_name;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_user_updated
  BEFORE UPDATE ON "user"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_season_updated
  BEFORE UPDATE ON "season"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_player_updated
  BEFORE UPDATE ON "player"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

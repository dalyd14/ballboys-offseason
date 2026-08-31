import { getSql } from "@/lib/db";
import { randomUUID } from "crypto";
import type {
  Owner,
  Season,
  Player,
  RosterMove,
  PlayerWithMove,
  ParsedEspnPlayer,
  AuditEventType,
  PlayerHistoryEntry,
} from "@/lib/types";

/**
 * ============================================================
 * Data Access Layer
 * ============================================================
 *
 * All database queries for the league. Uses the Neon serverless
 * driver (HTTP-based, tagged template literals).
 *
 * Every function here is safe to call from Server Components and
 * Server Actions. No client-side usage.
 * ============================================================
 */

/**
 * Convert a snake_case string to camelCase.
 */
function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Map a row's snake_case keys to camelCase.
 * The `user` table already uses camelCase columns, so this is
 * only needed for season/player/roster_move/audit_log rows.
 */
function mapRow<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    out[snakeToCamel(key)] = row[key];
  }
  return out as T;
}

function mapRows<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((r) => mapRow<T>(r));
}

// ---- Seasons ----

export async function getActiveSeason(): Promise<Season | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM "season"
    WHERE status IN ('setup', 'open', 'locked')
    ORDER BY year DESC LIMIT 1
  `;
  return (rows[0] ? mapRow<Season>(rows[0]) : null);
}

export async function getSeasons(): Promise<Season[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM "season" ORDER BY year DESC`;
  return mapRows<Season>(rows);
}

export async function getSeasonById(id: string): Promise<Season | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM "season" WHERE id = ${id}`;
  return (rows[0] ? mapRow<Season>(rows[0]) : null);
}

export async function createSeason(
  year: number,
  baseCapYears = 8,
  baseNegotiations = 1,
): Promise<Season> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO "season" (id, year, base_cap_years, base_negotiations)
    VALUES (${randomUUID()}, ${year}, ${baseCapYears}, ${baseNegotiations})
    RETURNING *
  `;
  const season = mapRow<Season>(rows[0]);

  // Initialize all owners' budgets to the season base values.
  await sql`
    UPDATE "user"
    SET "availableYears" = ${baseCapYears},
        "availableNegotiations" = ${baseNegotiations},
        "rosterSubmitted" = false,
        "canSubmit" = false
  `;

  return season;
}

export async function updateSeasonStatus(
  id: string,
  status: Season["status"],
): Promise<void> {
  const sql = getSql();
  await sql`UPDATE "season" SET status = ${status} WHERE id = ${id}`;
}

// ---- Owners (users) ----

export async function getOwners(): Promise<Owner[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM "user" ORDER BY "ownerName"
  `;
  return rows as unknown as Owner[];
}

export async function getOwnerById(id: string): Promise<Owner | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM "user" WHERE id = ${id}`;
  return (rows[0] as unknown as Owner) ?? null;
}

export async function getOwnerByEmail(email: string): Promise<Owner | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM "user" WHERE email = ${email}`;
  return (rows[0] as unknown as Owner) ?? null;
}

export async function updateOwnerBudget(
  id: string,
  availableYears: number,
  availableNegotiations: number,
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE "user"
    SET "availableYears" = ${availableYears},
        "availableNegotiations" = ${availableNegotiations}
    WHERE id = ${id}
  `;
}

export async function updateOwnerLock(
  id: string,
  canSubmit: boolean,
): Promise<void> {
  const sql = getSql();
  await sql`UPDATE "user" SET "canSubmit" = ${canSubmit} WHERE id = ${id}`;
}

export async function setRosterSubmitted(
  ownerId: string,
  submitted: boolean,
): Promise<void> {
  const sql = getSql();
  await sql`UPDATE "user" SET "rosterSubmitted" = ${submitted} WHERE id = ${ownerId}`;
}

export async function updateOwnerProfile(
  id: string,
  ownerName: string,
  teamName: string,
  email: string,
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE "user"
    SET "ownerName" = ${ownerName},
        "teamName" = ${teamName},
        email = ${email}
    WHERE id = ${id}
  `;
}

export async function deleteOwner(id: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM "user" WHERE id = ${id}`;
}

export async function setOwnerRole(id: string, role: "user" | "admin"): Promise<void> {
  const sql = getSql();
  await sql`UPDATE "user" SET role = ${role} WHERE id = ${id}`;
}

// ---- Players ----

export async function getPlayersByOwner(
  seasonId: string,
  ownerId: string,
): Promise<Player[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM "player"
    WHERE season_id = ${seasonId} AND owner_id = ${ownerId}
    ORDER BY position, player_name
  `;
  return mapRows<Player>(rows);
}

export async function getPlayersBySeason(
  seasonId: string,
): Promise<Player[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM "player"
    WHERE season_id = ${seasonId}
    ORDER BY owner_id, position, player_name
  `;
  return mapRows<Player>(rows);
}

export async function getPlayersToDraft(
  seasonId: string,
): Promise<Player[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM "player"
    WHERE season_id = ${seasonId} AND to_draft = true
    ORDER BY player_name
  `;
  return mapRows<Player>(rows);
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM "player" WHERE id = ${id}`;
  return (rows[0] ? mapRow<Player>(rows[0]) : null);
}

/**
 * Get a player's transaction history across all seasons.
 * Matches by espn_player_id (preferred) or player_name.
 * Returns seasons joined with the player row and any roster move.
 */
export async function getPlayerHistory(
  playerId: string,
): Promise<PlayerHistoryEntry[]> {
  const sql = getSql();

  // First get the player to find their espn_player_id and name.
  const playerRows = await sql`
    SELECT espn_player_id, player_name FROM "player" WHERE id = ${playerId}
  `;
  if (!playerRows[0]) return [];

  const espnId = playerRows[0].espn_player_id;
  const name = playerRows[0].player_name;

  // Match by espn_player_id if available, otherwise by name.
  const rows = espnId
    ? await sql`
        SELECT
          p.id, p.season_id, p.owner_id, p.player_name, p.nfl_team,
          p.position, p.image_url, p.contract_years, p.negotiation_available,
          p.to_draft, p.cut_during_season, p.contract_years_at_cut,
          s.year AS season_year,
          u."ownerName" AS owner_name,
          rm.action AS move_action,
          rm.new_contract AS move_new_contract,
          rm.new_negotiation_available AS move_new_negotiation,
          rm.year_debit AS move_year_debit
        FROM "player" p
        JOIN "season" s ON p.season_id = s.id
        LEFT JOIN "user" u ON p.owner_id = u.id
        LEFT JOIN "roster_move" rm ON rm.player_id = p.id AND rm.season_id = p.season_id
        WHERE p.espn_player_id = ${espnId}
        ORDER BY s.year DESC
      `
    : await sql`
        SELECT
          p.id, p.season_id, p.owner_id, p.player_name, p.nfl_team,
          p.position, p.image_url, p.contract_years, p.negotiation_available,
          p.to_draft, p.cut_during_season, p.contract_years_at_cut,
          s.year AS season_year,
          u."ownerName" AS owner_name,
          rm.action AS move_action,
          rm.new_contract AS move_new_contract,
          rm.new_negotiation_available AS move_new_negotiation,
          rm.year_debit AS move_year_debit
        FROM "player" p
        JOIN "season" s ON p.season_id = s.id
        LEFT JOIN "user" u ON p.owner_id = u.id
        LEFT JOIN "roster_move" rm ON rm.player_id = p.id AND rm.season_id = p.season_id
        WHERE p.player_name = ${name}
        ORDER BY s.year DESC
      `;

  return rows as unknown as PlayerHistoryEntry[];
}

export async function updatePlayerContract(
  id: string,
  contractYears: number | null,
  negotiationAvailable: boolean,
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE "player"
    SET contract_years = ${contractYears},
        negotiation_available = ${negotiationAvailable}
    WHERE id = ${id}
  `;
}

export async function markPlayerCutDuringSeason(
  id: string,
  contractYearsAtCut: number,
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE "player"
    SET cut_during_season = true,
        contract_years_at_cut = ${contractYearsAtCut}
    WHERE id = ${id}
  `;
}

export async function setPlayerToDraft(
  id: string,
  toDraft: boolean,
): Promise<void> {
  const sql = getSql();
  if (toDraft) {
    // Mark player as heading to draft pool, but keep owner_id so the
    // owner can see the player on their roster as "Going to Draft".
    // Contract & negotiation are reset so the player is clean for the draft.
    await sql`
      UPDATE "player"
      SET to_draft = true,
          contract_years = NULL,
          negotiation_available = true,
          cut_during_season = false,
          contract_years_at_cut = NULL
      WHERE id = ${id}
    `;
  } else {
    await sql`UPDATE "player" SET to_draft = false WHERE id = ${id}`;
  }
}

/**
 * Bulk-decrement all players' contract years by 1 for a season.
 * This is the rollover operation. Players at 0 or null are unaffected.
 * Returns a count of affected players.
 */
export async function rolloverSeason(seasonId: string): Promise<number> {
  const sql = getSql();

  // 1. Decrement all positive contract years by 1.
  const rows = await sql`
    UPDATE "player"
    SET contract_years = contract_years - 1
    WHERE season_id = ${seasonId}
      AND contract_years IS NOT NULL
      AND contract_years > 0
    RETURNING id
  `;

  // 2. Send players with 0 contract years and no negotiation to the draft pool.
  await sql`
    UPDATE "player"
    SET to_draft = true,
        contract_years = null,
        negotiation_available = true
    WHERE season_id = ${seasonId}
      AND contract_years = 0
      AND negotiation_available = false
  `;

  // 3. Mark the season's rollover as complete.
  await sql`
    UPDATE "season"
    SET rollover_completed = true
    WHERE id = ${seasonId}
  `;

  return rows.length;
}

/**
 * Remove all players for a season (used before re-importing).
 * Also cascades to roster_moves via FK.
 */
export async function clearSeasonPlayers(seasonId: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM "player" WHERE season_id = ${seasonId}`;
}

/**
 * Import parsed ESPN players into a season.
 * Creates new player rows. Does NOT overwrite existing contracts —
 * the admin review step handles the diff/merge separately.
 */
export async function importPlayers(
  seasonId: string,
  ownerId: string,
  players: ParsedEspnPlayer[],
): Promise<number> {
  const sql = getSql();
  let count = 0;
  for (const p of players) {
    await sql`
      INSERT INTO "player"
        (id, season_id, owner_id, player_name, nfl_team, position,
         image_url, espn_player_id, contract_years, negotiation_available)
      VALUES (
        ${randomUUID()}, ${seasonId}, ${ownerId},
        ${p.playerName}, ${p.nflTeam}, ${p.position},
        ${p.imageUrl}, ${p.espnPlayerId},
        NULL, true
      )
    `;
    count++;
  }
  return count;
}

/**
 * Update a player's owner (used for trades during exception review).
 */
export async function updatePlayerOwner(
  playerId: string,
  newOwnerId: string | null,
): Promise<void> {
  const sql = getSql();
  await sql`UPDATE "player" SET owner_id = ${newOwnerId} WHERE id = ${playerId}`;
}

// ---- Roster Moves ----

export async function getRosterMovesByOwner(
  seasonId: string,
  ownerId: string,
): Promise<RosterMove[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM "roster_move"
    WHERE season_id = ${seasonId} AND owner_id = ${ownerId}
  `;
  return mapRows<RosterMove>(rows);
}

/**
 * Get players with their roster moves attached for display.
 */
export async function getPlayersWithMoves(
  seasonId: string,
  ownerId: string,
): Promise<PlayerWithMove[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      p.*,
      rm.action,
      rm.new_contract AS "newContract",
      rm.new_negotiation_available AS "newNegotiationAvailable",
      rm.year_debit AS "yearDebit"
    FROM "player" p
    LEFT JOIN "roster_move" rm
      ON rm.player_id = p.id AND rm.season_id = p.season_id
    WHERE p.season_id = ${seasonId} AND p.owner_id = ${ownerId}
    ORDER BY p.to_draft DESC, p.position, p.player_name
  `;
  return mapRows<PlayerWithMove>(rows);
}

export async function getRosterMovesBySeason(
  seasonId: string,
): Promise<RosterMove[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM "roster_move" WHERE season_id = ${seasonId}
  `;
  return mapRows<RosterMove>(rows);
}

/**
 * Submit a roster: delete old moves, insert new ones, mark owner submitted.
 */
export async function submitRoster(
  seasonId: string,
  ownerId: string,
  moves: {
    playerId: string;
    action: "sign" | "renegotiate" | "cut" | "nothing";
    newContract: number | null;
    newNegotiationAvailable: boolean;
    yearDebit: number;
  }[],
): Promise<void> {
  const sql = getSql();
  // Clear old moves for this owner/season.
  await sql`
    DELETE FROM "roster_move"
    WHERE season_id = ${seasonId} AND owner_id = ${ownerId}
  `;

  // Insert new moves.
  for (const m of moves) {
    await sql`
      INSERT INTO "roster_move"
        (id, season_id, player_id, owner_id, action,
         new_contract, new_negotiation_available, year_debit)
      VALUES (
        ${randomUUID()}, ${seasonId}, ${m.playerId}, ${ownerId}, ${m.action},
        ${m.newContract}, ${m.newNegotiationAvailable}, ${m.yearDebit}
      )
    `;
  }

  // Mark owner as submitted.
  await setRosterSubmitted(ownerId, true);
}

/**
 * Reset an owner's roster submission: delete moves, unmark submitted.
 */
export async function resetRoster(
  seasonId: string,
  ownerId: string,
): Promise<void> {
  const sql = getSql();
  await sql`
    DELETE FROM "roster_move"
    WHERE season_id = ${seasonId} AND owner_id = ${ownerId}
  `;
  await setRosterSubmitted(ownerId, false);
}

// ---- Audit Log ----

export async function logEvent(
  seasonId: string | null,
  eventType: AuditEventType,
  details: Record<string, unknown> = {},
  actorId?: string,
  ownerId?: string,
  playerId?: string,
): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO "audit_log"
      (id, season_id, event_type, details, actor_id, owner_id, player_id)
    VALUES (
      ${randomUUID()}, ${seasonId}, ${eventType},
      ${JSON.stringify(details)}::jsonb,
      ${actorId ?? null}, ${ownerId ?? null}, ${playerId ?? null}
    )
  `;
}

interface AuditLogEntry {
  id: string;
  seasonId: string | null;
  eventType: string;
  details: unknown;
  actorId: string | null;
  ownerId: string | null;
  playerId: string | null;
  createdAt: Date;
}

export async function getAuditLog(
  seasonId: string,
  limit = 50,
): Promise<AuditLogEntry[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM "audit_log"
    WHERE season_id = ${seasonId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return mapRows<AuditLogEntry>(rows);
}

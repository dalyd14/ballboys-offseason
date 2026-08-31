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

// ---- Seasons ----

export async function getActiveSeason(): Promise<Season | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM "season"
    WHERE status IN ('setup', 'open', 'locked')
    ORDER BY year DESC LIMIT 1
  `;
  return (rows[0] as unknown as Season) ?? null;
}

export async function getSeasons(): Promise<Season[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM "season" ORDER BY year DESC`;
  return rows as unknown as Season[];
}

export async function getSeasonById(id: string): Promise<Season | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM "season" WHERE id = ${id}`;
  return (rows[0] as unknown as Season) ?? null;
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
  return rows[0] as unknown as Season;
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
    SELECT * FROM "user" WHERE role = 'user' ORDER BY "ownerName"
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
  return rows as unknown as Player[];
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
  return rows as unknown as Player[];
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
  return rows as unknown as Player[];
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM "player" WHERE id = ${id}`;
  return (rows[0] as unknown as Player) ?? null;
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
    // Reset contract & negotiation when sending to draft pool.
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
  const rows = await sql`
    UPDATE "player"
    SET contract_years = contract_years - 1
    WHERE season_id = ${seasonId}
      AND contract_years IS NOT NULL
      AND contract_years > 0
    RETURNING id
  `;
  return rows.length;
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
  return rows as unknown as RosterMove[];
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
    ORDER BY p.position, p.player_name
  `;
  return rows as unknown as PlayerWithMove[];
}

export async function getRosterMovesBySeason(
  seasonId: string,
): Promise<RosterMove[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM "roster_move" WHERE season_id = ${seasonId}
  `;
  return rows as unknown as RosterMove[];
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
  season_id: string | null;
  event_type: string;
  details: unknown;
  actor_id: string | null;
  owner_id: string | null;
  player_id: string | null;
  created_at: Date;
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
  return rows as unknown as AuditLogEntry[];
}

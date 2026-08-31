/**
 * Shared TypeScript types for the Ballboys Offseason app.
 * These mirror the database schema in db/schema.sql.
 */

export type Role = "user" | "admin";

export type SeasonStatus = "setup" | "open" | "locked" | "archived";

export type PlayerAction = "sign" | "renegotiate" | "cut" | "nothing";

/** A user/owner row from the database (auth + league fields). */
export interface Owner {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: Role;
  ownerName: string | null;
  teamName: string | null;
  availableYears: number;
  availableNegotiations: number;
  rosterSubmitted: boolean;
  canSubmit: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** A season row. */
export interface Season {
  id: string;
  year: number;
  status: SeasonStatus;
  rolloverCompleted: boolean;
  baseCapYears: number;
  baseNegotiations: number;
  createdAt: Date;
  updatedAt: Date;
}

/** A player row. */
export interface Player {
  id: string;
  seasonId: string;
  ownerId: string | null;
  playerName: string;
  nflTeam: string;
  position: string;
  imageUrl: string | null;
  /** Contract years remaining. null = "none" (no contract). */
  contractYears: number | null;
  /** Eligible for renegotiation this offseason. Lifetime lock. */
  negotiationAvailable: boolean;
  /** Dropped during the ESPN regular season (admin flag). */
  cutDuringSeason: boolean;
  /** Contract years at the time of mid-season cut (pre-rollover). */
  contractYearsAtCut: number | null;
  /** Headed to the draft pool (contract & negotiation reset). */
  toDraft: boolean;
  espnPlayerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** A roster_move row — a submitted offseason decision. */
export interface RosterMove {
  id: string;
  seasonId: string;
  playerId: string;
  ownerId: string;
  action: PlayerAction;
  newContract: number | null;
  newNegotiationAvailable: boolean | null;
  yearDebit: number;
  createdAt: Date;
}

/** A player with its roster move attached (for display). */
export interface PlayerWithMove extends Player {
  action?: PlayerAction;
  newContract?: number | null;
  newNegotiationAvailable?: boolean | null;
  yearDebit?: number;
}

/** Shape of a parsed player from the ESPN HTML upload. */
export interface ParsedEspnPlayer {
  playerName: string;
  nflTeam: string;
  position: string;
  imageUrl: string | null;
  espnPlayerId: string | null;
}

/** Result of an ESPN HTML parse. */
export interface ParseEspnResult {
  players: ParsedEspnPlayer[];
  errors: string[];
}

/** Shape returned by the offseason rules engine for a single move. */
export interface MoveResult {
  newContract: number | null;
  newNegotiationAvailable: boolean;
  yearDebit: number;
}

/** Audit log event types. */
export type AuditEventType =
  | "season_created"
  | "season_status_changed"
  | "rollover_started"
  | "rollover_completed"
  | "espn_imported"
  | "cut_penalty_applied"
  | "owner_budget_updated"
  | "owner_lock_toggled"
  | "player_edited"
  | "roster_submitted"
  | "roster_reset"
  | "exception_resolved"
  | "owner_created"
  | "owner_profile_updated"
  | "owner_password_reset"
  | "owner_deleted"
  | "owner_role_changed";

/** A player's transaction history entry across seasons. */
export interface PlayerHistoryEntry {
  id: string;
  season_id: string;
  owner_id: string | null;
  player_name: string;
  nfl_team: string;
  position: string;
  image_url: string | null;
  contract_years: number | null;
  negotiation_available: boolean;
  to_draft: boolean;
  cut_during_season: boolean;
  contract_years_at_cut: number | null;
  season_year: number;
  owner_name: string | null;
  move_action: string | null;
  move_new_contract: number | null;
  move_new_negotiation: boolean | null;
  move_year_debit: number | null;
}

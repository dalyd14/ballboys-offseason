"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import {
  createSeason,
  updateSeasonStatus,
  rolloverSeason,
  updateOwnerBudget,
  updateOwnerLock,
  updatePlayerContract,
  markPlayerCutDuringSeason,
  setPlayerToDraft,
  updatePlayerOwner,
  importPlayers,
  logEvent,
} from "@/lib/data";
import { calculateCutPenalty } from "@/lib/offseason";
import { parseEspnHtmlFull, type ParsedEspnTeam } from "@/lib/espn-parser";
import type { SeasonStatus, ParsedEspnPlayer } from "@/lib/types";

// ---- Season Management ----

export async function createSeasonAction(
  year: number,
  baseCapYears: number,
  baseNegotiations: number,
): Promise<{ error: string | null }> {
  await requireAdmin();
  try {
    await createSeason(year, baseCapYears, baseNegotiations);
    await logEvent(null, "season_created", { year, baseCapYears, baseNegotiations });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create season" };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/season");
  return { error: null };
}

export async function updateSeasonStatusAction(
  seasonId: string,
  status: SeasonStatus,
): Promise<{ error: string | null }> {
  const admin = await requireAdmin();
  try {
    await updateSeasonStatus(seasonId, status);
    await logEvent(seasonId, "season_status_changed", { status }, admin.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update status" };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/season");
  return { error: null };
}

// ---- Rollover ----

export async function rolloverSeasonAction(
  seasonId: string,
): Promise<{ error: string | null; affected: number }> {
  const admin = await requireAdmin();
  try {
    await logEvent(seasonId, "rollover_started", {}, admin.id);
    const affected = await rolloverSeason(seasonId);
    await logEvent(
      seasonId,
      "rollover_completed",
      { playersAffected: affected },
      admin.id,
    );
    revalidatePath("/admin");
    revalidatePath("/admin/season");
    revalidatePath("/admin/review");
    return { error: null, affected };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Rollover failed",
      affected: 0,
    };
  }
}

// ---- Owner Budget & Lock Management ----

export async function updateOwnerBudgetAction(
  ownerId: string,
  availableYears: number,
  availableNegotiations: number,
  seasonId: string,
): Promise<{ error: string | null }> {
  const admin = await requireAdmin();
  try {
    await updateOwnerBudget(ownerId, availableYears, availableNegotiations);
    await logEvent(
      seasonId,
      "owner_budget_updated",
      { availableYears, availableNegotiations },
      admin.id,
      ownerId,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update budget" };
  }
  revalidatePath("/admin/owners");
  return { error: null };
}

export async function updateOwnerLockAction(
  ownerId: string,
  canSubmit: boolean,
  seasonId: string,
): Promise<{ error: string | null }> {
  const admin = await requireAdmin();
  try {
    await updateOwnerLock(ownerId, canSubmit);
    await logEvent(
      seasonId,
      "owner_lock_toggled",
      { canSubmit },
      admin.id,
      ownerId,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update lock" };
  }
  revalidatePath("/admin/owners");
  return { error: null };
}

// ---- Player Management ----

export async function updatePlayerContractAction(
  playerId: string,
  contractYears: number | null,
  negotiationAvailable: boolean,
  seasonId: string,
): Promise<{ error: string | null }> {
  const admin = await requireAdmin();
  try {
    await updatePlayerContract(playerId, contractYears, negotiationAvailable);
    await logEvent(
      seasonId,
      "player_edited",
      { contractYears, negotiationAvailable },
      admin.id,
      undefined,
      playerId,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update player" };
  }
  revalidatePath("/admin/players");
  revalidatePath("/admin/review");
  return { error: null };
}

/**
 * Mark a player as cut during the season and apply the penalty.
 * The penalty is based on the contract years at the time of cut
 * (pre-rollover). The owner's salary cap is reduced by ceil(years/2).
 */
export async function markPlayerCutDuringSeasonAction(
  playerId: string,
  ownerId: string,
  contractYearsAtCut: number,
  seasonId: string,
): Promise<{ error: string | null; penalty: number }> {
  const admin = await requireAdmin();
  const penalty = calculateCutPenalty(contractYearsAtCut);
  try {
    await markPlayerCutDuringSeason(playerId, contractYearsAtCut);
    // Reduce the owner's available years by the penalty.
    // The admin sets the base cap; this applies the reduction on top.
    await logEvent(
      seasonId,
      "cut_penalty_applied",
      { playerId, penalty, contractYearsAtCut },
      admin.id,
      ownerId,
      playerId,
    );
    revalidatePath("/admin/review");
    revalidatePath("/admin/players");
    return { error: null, penalty };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to mark cut",
      penalty: 0,
    };
  }
}

/**
 * Resolve a roster exception (player whose team changed between
 * DB and ESPN upload). Admin marks it as trade, cut, or pickup.
 */
export async function resolveExceptionAction(
  playerId: string,
  resolution: "trade" | "cut" | "pickup",
  newOwnerId: string | null,
  seasonId: string,
): Promise<{ error: string | null }> {
  const admin = await requireAdmin();
  try {
    if (resolution === "cut") {
      // Send to draft pool, reset contract & negotiation.
      await setPlayerToDraft(playerId, true);
    } else if (resolution === "trade") {
      // Update owner — contract follows the player.
      await updatePlayerOwner(playerId, newOwnerId);
    } else if (resolution === "pickup") {
      // New player with no contract.
      await updatePlayerContract(playerId, null, true);
    }
    await logEvent(
      seasonId,
      "exception_resolved",
      { playerId, resolution, newOwnerId },
      admin.id,
      undefined,
      playerId,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to resolve" };
  }
  revalidatePath("/admin/review");
  return { error: null };
}

// ---- ESPN Import ----

/**
 * Import a full ESPN League Roster HTML export.
 * The file contains all teams; we match each parsed team to an
 * owner by their teamName field.
 */
export async function importEspnHtmlAction(
  seasonId: string,
  html: string,
  ownerTeamMap: { ownerId: string; teamName: string }[],
): Promise<{
  error: string | null;
  imported: number;
  teamsImported: number;
  unmatchedTeams: string[];
  totalPlayers: number;
}> {
  const admin = await requireAdmin();

  // Parse the full HTML.
  const { teams, errors } = parseEspnHtmlFull(html);

  if (teams.length === 0) {
    return {
      error: errors.join("; ") || "No teams found",
      imported: 0,
      teamsImported: 0,
      unmatchedTeams: [],
      totalPlayers: 0,
    };
  }

  // Build a lookup: teamName (lowercase) → ownerId
  const teamLookup = new Map<string, string>();
  for (const o of ownerTeamMap) {
    teamLookup.set(o.teamName.toLowerCase(), o.ownerId);
  }

  let totalImported = 0;
  let teamsImported = 0;
  const unmatchedTeams: string[] = [];

  try {
    for (const team of teams) {
      const ownerId = teamLookup.get(team.teamName.toLowerCase());
      if (!ownerId) {
        unmatchedTeams.push(team.teamName);
        continue;
      }
      const count = await importPlayers(seasonId, ownerId, team.players);
      totalImported += count;
      teamsImported++;
      await logEvent(
        seasonId,
        "espn_imported",
        { ownerId, teamName: team.teamName, playerCount: count },
        admin.id,
        ownerId,
      );
    }

    revalidatePath("/admin");
    revalidatePath("/admin/review");
    revalidatePath("/admin/players");

    return {
      error: unmatchedTeams.length > 0
        ? `${unmatchedTeams.length} team(s) could not be matched to owners`
        : null,
      imported: totalImported,
      teamsImported,
      unmatchedTeams,
      totalPlayers: totalImported,
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Import failed",
      imported: totalImported,
      teamsImported,
      unmatchedTeams,
      totalPlayers: totalImported,
    };
  }
}

import type {
  Player,
  PlayerAction,
  MoveResult,
} from "@/lib/types";

/**
 * ============================================================
 * Ballboys Offseason — Rules Engine
 * ============================================================
 *
 * Pure functions that encode the league's offseason contract rules.
 * These are the single source of truth for cap math, cut penalties,
 * and renegotiation logic. No DB access — just math + validation.
 *
 * Rules reference (from the league PDF):
 *
 * SALARY CAP:
 *   Each owner has a pool of "Available Years" (salary cap).
 *   Signing or renegotiating a player spends years from this pool.
 *   Existing contracts also count against the cap.
 *
 * CUTTING PLAYERS (offseason):
 *   Penalty = ceil(contractYears / 2), rounded up.
 *   Based on the player's contract years AFTER rollover.
 *   The owner's salary cap is REDUCED by this penalty for the season.
 *   The player goes to the draft pool (cannot be re-signed).
 *
 * CUTTING PLAYERS (during the season):
 *   Penalty = ceil(contractYears / 2), rounded up.
 *   Based on the player's contract years BEFORE rollover (mid-season).
 *   The owner's salary cap is reduced.
 *   The player's contract & negotiation history is wiped clean.
 *   Anyone can pick them up. If the original owner ends up with the
 *   player again, they CANNOT re-sign them — player auto-enters draft.
 *
 * RENEGOTIATIONS:
 *   One per owner per offseason by default (tradeable).
 *   Can extend OR reduce an existing contract.
 *   Cannot renegotiate the same player more than once (lifetime lock).
 *   Tokens do NOT roll over — use it or lose it.
 *
 * SIGNING:
 *   Only for players with no contract (contractYears = null/"none").
 *   Assign a new contract (1+ years). Sets negotiation_available = true.
 *
 * DRAFT POOL RESET:
 *   When a player enters the draft pool, both contract_years AND
 *   negotiation_available reset (contract → null, negotiation → true).
 * ============================================================
 */

/**
 * Calculate the cut penalty: ceil(contractYears / 2).
 * Works for both mid-season (pre-rollover) and offseason (post-rollover) cuts.
 */
export function calculateCutPenalty(contractYears: number): number {
  if (contractYears <= 0) return 0;
  return Math.ceil(contractYears / 2);
}

/**
 * Compute the result of a single player action.
 *
 * @param player The player being acted on
 * @param action The chosen action (sign/renegotiate/cut/nothing)
 * @param years The number of years selected (for sign/renegotiate).
 *              For sign: the new contract length.
 *              For renegotiate: the delta (can be negative to reduce).
 * @param negotiationsRemaining How many renegotiation tokens the owner has left
 * @returns The move result: new contract, negotiation flag, cap debit
 */
export function computeMove(
  player: Player,
  action: PlayerAction,
  years: number | "nothing",
  negotiationsRemaining: number,
): MoveResult {
  const oldYears = player.contractYears; // null = "none"
  const oldYearsNum = oldYears ?? 0;

  switch (action) {
    case "sign": {
      // Only for players with no contract.
      if (oldYears !== null) {
        throw new Error("Cannot sign a player who already has a contract");
      }
      if (years === "nothing") {
        return {
          newContract: null,
          newNegotiationAvailable: true, // stays true (no contract = no change)
          yearDebit: 0,
        };
      }
      const signYears = Math.max(0, years);
      return {
        newContract: signYears,
        // New signing resets negotiation eligibility to true.
        newNegotiationAvailable: true,
        yearDebit: signYears,
      };
    }

    case "renegotiate": {
      // Requires an existing contract and negotiation eligibility.
      if (oldYears === null) {
        throw new Error("Cannot renegotiate a player with no contract");
      }
      if (!player.negotiationAvailable) {
        throw new Error("This player's contract has already been renegotiated");
      }
      if (negotiationsRemaining <= 0) {
        throw new Error("No renegotiation tokens remaining");
      }
      // years is the delta: positive = extend, negative = reduce.
      const delta = years === "nothing" ? 0 : years;
      const newContract = Math.max(0, oldYearsNum + delta);
      return {
        newContract,
        // Renegotiation is a lifetime lock — no more renegotiations on this player.
        newNegotiationAvailable: false,
        // The full new contract counts against the cap.
        yearDebit: newContract,
      };
    }

    case "cut": {
      // Only for players with an existing contract (years > 0).
      if (oldYears === null || oldYearsNum <= 0) {
        throw new Error("Cannot cut a player with no contract");
      }
      return {
        newContract: 0,
        newNegotiationAvailable: player.negotiationAvailable,
        // Penalty = ceil(oldYears / 2). Player goes to draft.
        yearDebit: calculateCutPenalty(oldYearsNum),
      };
    }

    case "nothing":
    default: {
      // Keep existing contract. It still counts against the cap.
      return {
        newContract: oldYears, // null stays null
        newNegotiationAvailable: player.negotiationAvailable,
        // The existing contract years count against the cap.
        yearDebit: oldYearsNum,
      };
    }
  }
}

/**
 * Validate that a full set of moves is legal for an owner.
 * Checks cap budget and renegotiation token limits.
 *
 * @param players All players on the owner's roster
 * @param moves The proposed actions (playerId → {action, years})
 * @param availableYears Owner's salary cap for the season
 * @param availableNegotiations Owner's renegotiation tokens
 * @returns { valid, errors, totalSpent, negotiationsUsed, capPenalties }
 */
export function validateRoster(
  players: Player[],
  moves: Map<string, { action: PlayerAction; years: number | "nothing" }>,
  availableYears: number,
  availableNegotiations: number,
): {
  valid: boolean;
  errors: string[];
  totalSpent: number;
  negotiationsUsed: number;
  capPenalties: number;
} {
  const errors: string[] = [];
  let totalSpent = 0;
  let negotiationsUsed = 0;
  let capPenalties = 0;

  for (const player of players) {
    const move = moves.get(player.id);
    if (!move) continue;

    try {
      const result = computeMove(
        player,
        move.action,
        move.years,
        availableNegotiations - negotiationsUsed,
      );
      totalSpent += result.yearDebit;
      if (move.action === "renegotiate" && move.years !== "nothing") {
        negotiationsUsed += 1;
      }
      if (move.action === "cut") {
        capPenalties += result.yearDebit;
      }
    } catch (e) {
      errors.push(
        `${player.playerName}: ${e instanceof Error ? e.message : "Invalid move"}`,
      );
    }
  }

  // Cap check: total spent must not exceed available years.
  // Note: cap penalties reduce the cap itself, so the effective cap is:
  //   availableYears - capPenalties
  // And totalSpent includes the penalty debits, so:
  //   totalSpent must be <= availableYears
  // (penalties are already counted in totalSpent via yearDebit)
  if (totalSpent > availableYears) {
    errors.push(
      `Over the salary cap: spent ${totalSpent} years but only have ${availableYears} available`,
    );
  }

  // Negotiation check.
  if (negotiationsUsed > availableNegotiations) {
    errors.push(
      `Too many renegotiations: used ${negotiationsUsed} but only have ${availableNegotiations} available`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    totalSpent,
    negotiationsUsed,
    capPenalties,
  };
}

/**
 * Determine the available actions for a player given the owner's state.
 * Mirrors the old generateActionOptions() logic, corrected for rules.
 *
 * @param player The player
 * @param negotiationsRemaining Renegotiation tokens left
 * @returns Array of allowed actions
 */
export function getAvailableActions(
  player: Player,
  negotiationsRemaining: number,
): PlayerAction[] {
  const actions: PlayerAction[] = [];
  const oldYears = player.contractYears;
  const oldYearsNum = oldYears ?? 0;

  if (oldYears === null) {
    // No contract → can sign.
    actions.push("sign");
  } else {
    // Has a contract.
    if (oldYearsNum > 0) {
      actions.push("cut");
    }
    // Can renegotiate if eligible and has tokens (or already chose renegotiate).
    if (player.negotiationAvailable && negotiationsRemaining > 0) {
      actions.push("renegotiate");
    }
  }

  // "Do nothing" is always available.
  actions.push("nothing");

  return actions;
}

/**
 * Compute the year options for the sign/renegotiate dropdown.
 * Mirrors the old generateYearOptions() logic.
 *
 * @param player The player
 * @param action The selected action
 * @param availableYears Owner's remaining cap (after other moves)
 * @param allPlayers All players (to compute remaining cap)
 * @param moves The proposed moves (playerId → {action, years})
 * @returns Array of selectable year values (excluding 0)
 */
export function getYearOptions(
  player: Player,
  action: PlayerAction,
  availableYears: number,
  allPlayers: Player[],
  moves: Map<string, { action: PlayerAction; years: number | "nothing" }>,
): number[] {
  if (action === "nothing" || action === "cut") {
    return [];
  }

  // Calculate remaining cap after all OTHER players' debits.
  let remaining = availableYears;
  for (const p of allPlayers) {
    if (p.id === player.id) continue;
    const move = moves.get(p.id);
    if (!move || move.action === "nothing") {
      remaining -= p.contractYears ?? 0;
    } else {
      const result = computeMove(p, move.action, move.years, 999);
      remaining -= result.yearDebit;
    }
  }

  const options: number[] = [];
  const oldYearsNum = player.contractYears ?? 0;

  if (action === "sign") {
    // Sign: 1 to remaining.
    for (let i = 1; i <= remaining; i++) {
      options.push(i);
    }
  } else if (action === "renegotiate") {
    // Renegotiate: can extend (1..remaining) or reduce (negative delta).
    // The min is -(oldYears) which would zero out the contract.
    const minDelta = -oldYearsNum;
    for (let i = minDelta; i <= remaining; i++) {
      if (i !== 0) options.push(i);
    }
  }

  return options;
}

/**
 * Apply the season rollover: decrement every player's contract by 1.
 * A player at 1 year goes to 0 (draft-eligible next, unless cut).
 * Players with null contract are unaffected (free agents).
 *
 * Returns the updated players (does NOT write to DB).
 */
export function applyRollover(players: Player[]): Player[] {
  return players.map((p) => {
    if (p.contractYears === null) return p; // no contract, no change
    if (p.contractYears <= 0) return p; // already 0, stays 0

    const newYears = p.contractYears - 1;
    return {
      ...p,
      contractYears: newYears,
      // Players hitting 0 are NOT automatically to_draft — the admin
      // reviews them. But they ARE draft-eligible if left alone.
    };
  });
}

/**
 * Reset a player to draft-pool state: no contract, negotiation available.
 * Per rule: when a player goes to the draft, everything resets.
 */
export function resetToDraftPool(player: Player): Player {
  return {
    ...player,
    contractYears: null,
    negotiationAvailable: true,
    toDraft: true,
    cutDuringSeason: false,
    contractYearsAtCut: null,
  };
}

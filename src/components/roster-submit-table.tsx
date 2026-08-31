"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import type { Player, PlayerAction } from "@/lib/types";
import {
  getAvailableActions,
  getYearOptions,
  computeMove,
  validateRoster,
} from "@/lib/offseason";
import { submitRosterAction } from "@/app/submit-roster/actions";

interface RosterSubmitTableProps {
  players: Player[];
  availableYears: number;
  availableNegotiations: number;
  ownerEmail: string;
  seasonId: string;
}

interface PlayerMove {
  action: PlayerAction;
  years: number | "nothing";
}

export function RosterSubmitTable({
  players: initialPlayers,
  availableYears,
  availableNegotiations,
  ownerEmail,
  seasonId,
}: RosterSubmitTableProps) {
  const [moves, setMoves] = useState<Map<string, PlayerMove>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Track renegotiations used (for the counter display + validation).
  const negotiationsUsed = useMemo(() => {
    let count = 0;
    for (const [, move] of moves) {
      if (move.action === "renegotiate" && move.years !== "nothing") {
        count++;
      }
    }
    return count;
  }, [moves]);

  const negotiationsRemaining = availableNegotiations - negotiationsUsed;

  // Calculate the total years spent so far (for the cap counter).
  const yearsSpent = useMemo(() => {
    let total = 0;
    for (const player of initialPlayers) {
      const move = moves.get(player.id);
      if (!move || move.action === "nothing") {
        total += player.contractYears ?? 0;
      } else {
        const result = computeMove(
          player,
          move.action,
          move.years,
          negotiationsRemaining,
        );
        total += result.yearDebit;
      }
    }
    return total;
  }, [initialPlayers, moves, negotiationsRemaining]);

  const yearsRemaining = availableYears - yearsSpent;
  const capPercent = (yearsRemaining / availableYears) * 100;

  const handleActionChange = (playerId: string, action: PlayerAction) => {
    setMoves((prev) => {
      const next = new Map(prev);
      next.set(playerId, { action, years: "nothing" });
      return next;
    });
  };

  const handleYearChange = (playerId: string, years: number | "nothing") => {
    setMoves((prev) => {
      const next = new Map(prev);
      const existing = next.get(playerId) ?? { action: "nothing" as PlayerAction, years: "nothing" as const };
      next.set(playerId, { ...existing, years });
      return next;
    });
  };

  const handleReset = () => {
    setMoves(new Map());
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);

    // Build the moves map for validation.
    const movesMap = new Map<string, { action: PlayerAction; years: number | "nothing" }>();
    for (const [pid, m] of moves) {
      movesMap.set(pid, { action: m.action, years: m.years });
    }

    const validation = validateRoster(
      initialPlayers,
      movesMap,
      availableYears,
      availableNegotiations,
    );

    if (!validation.valid) {
      setError(validation.errors.join("\n"));
      setSubmitting(false);
      return;
    }

    // Build the submission payload.
    const submissionMoves: {
      playerId: string;
      action: PlayerAction;
      newContract: number | null;
      newNegotiationAvailable: boolean;
      yearDebit: number;
    }[] = [];

    for (const player of initialPlayers) {
      const move = moves.get(player.id);
      const action = move?.action ?? "nothing";
      const years = move?.years ?? "nothing";

      const result = computeMove(player, action, years, negotiationsRemaining);

      submissionMoves.push({
        playerId: player.id,
        action,
        newContract: result.newContract,
        newNegotiationAvailable: result.newNegotiationAvailable,
        yearDebit: result.yearDebit,
      });
    }

    const result = await submitRosterAction(seasonId, ownerEmail, submissionMoves);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <div className="rounded-lg bg-green-50 border border-green-200 p-8">
          <h2 className="text-2xl font-bold text-green-700">You are all set!</h2>
          <p className="mt-2 text-green-600">
            Your roster was submitted. Redirecting to your team...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
          <p className="font-bold text-red-700">Dave Sucks!</p>
          <p className="mt-1 whitespace-pre-line text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Cap & Negotiations Counter */}
      <div className="mb-6 flex flex-wrap items-center gap-6 rounded-lg bg-white p-4 shadow">
        <div>
          <h2 className="text-2xl font-bold">
            {yearsRemaining} Years Left
          </h2>
          <div className="mt-2 h-2 w-48 overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full transition-all ${
                capPercent < 30
                  ? "bg-red-500"
                  : capPercent < 60
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${Math.max(0, capPercent)}%` }}
            />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">
            {negotiationsRemaining} Negotiation{negotiationsRemaining === 1 ? "" : "s"} Left
          </h2>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-green-600 px-6 py-2 text-white font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
          <button
            onClick={handleReset}
            className="rounded-md bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3"></th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Player</th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">NFL Team</th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Position</th>
              <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Contract</th>
              <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Negotiation?</th>
              <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Action</th>
              <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Years</th>
              <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Final Contract</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {initialPlayers.map((player) => {
              const move = moves.get(player.id);
              const action = move?.action ?? "nothing";
              const years = move?.years ?? "nothing";
              const availableActions = getAvailableActions(player, negotiationsRemaining);
              const yearOptions = getYearOptions(
                player,
                action,
                availableYears,
                initialPlayers,
                moves,
              );
              const result = computeMove(player, action, years, negotiationsRemaining);
              const finalContract =
                result.newContract == null
                  ? player.contractYears ?? ""
                  : result.newContract === 0
                    ? ""
                    : result.newContract;

              return (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    {player.imageUrl && (
                      <Image
                        src={player.imageUrl}
                        alt={player.playerName}
                        width={100}
                        height={100}
                        className="rounded"
                        unoptimized
                      />
                    )}
                  </td>
                  <td className="px-3 py-3 font-medium">{player.playerName}</td>
                  <td className="px-3 py-3 text-gray-600">{player.nflTeam}</td>
                  <td className="px-3 py-3 text-gray-600">{player.position}</td>
                  <td className="px-3 py-3 text-center text-2xl font-bold">
                    {player.contractYears == null ? "" : player.contractYears}
                  </td>
                  <td className="px-3 py-3 text-center text-2xl">
                    {player.negotiationAvailable ? "✅" : "❌"}
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={action}
                      onChange={(e) =>
                        handleActionChange(player.id, e.target.value as PlayerAction)
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    >
                      {availableActions.map((a) => (
                        <option key={a} value={a}>
                          {a === "sign"
                            ? "Sign"
                            : a === "renegotiate"
                              ? "Renegotiate"
                              : a === "cut"
                                ? "Cut"
                                : "Do Nothing"}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    {action !== "nothing" && action !== "cut" ? (
                      <select
                        value={years === "nothing" ? "" : String(years)}
                        onChange={(e) =>
                          handleYearChange(
                            player.id,
                            e.target.value === "" ? "nothing" : parseInt(e.target.value),
                          )
                        }
                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      >
                        <option value=""></option>
                        {yearOptions.map((y) => (
                          <option key={y} value={y}>
                            {y > 0 ? `+${y}` : y}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center text-2xl font-bold">
                    {finalContract}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

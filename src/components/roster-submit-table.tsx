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
import { CustomSelect } from "@/components/custom-select";

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

  const yearsSpent = useMemo(() => {
    let total = 0;
    for (const player of initialPlayers) {
      if (player.toDraft) continue;
      const move = moves.get(player.id);
      if (!move || move.action === "nothing") {
        total += player.contractYears ?? 0;
      } else {
        const result = computeMove(
          player,
          move.action,
          move.years,
          999,
        );
        total += result.yearDebit;
      }
    }
    return total;
  }, [initialPlayers, moves]);

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

    const submissionMoves: {
      playerId: string;
      action: PlayerAction;
      newContract: number | null;
      newNegotiationAvailable: boolean;
      yearDebit: number;
    }[] = [];

    for (const player of initialPlayers) {
      // Skip players already marked as going to draft — no action needed.
      if (player.toDraft) continue;

      const move = moves.get(player.id);
      const action = move?.action ?? "nothing";
      const years = move?.years ?? "nothing";

      const result = computeMove(player, action, years, 999);

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
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-xl border border-success/20 bg-success/5 p-8">
          <h2 className="text-xl font-semibold text-success">You are all set!</h2>
          <p className="mt-2 text-[14px] text-success/80">
            Your roster was submitted. Redirecting to your team...
          </p>
        </div>
      </div>
    );
  }

  const thClass = "px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-fg-subtle";
  const tdClass = "px-3 py-3";
  const selectClass = "w-full rounded-lg border border-line bg-elevated px-2 py-1.5 text-[13px] text-fg focus:border-accent focus:outline-none";
  const mobileSelectClass = "rounded-lg border border-line bg-elevated px-3 py-2 text-[14px] text-fg focus:border-accent focus:outline-none";

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3">
          <p className="font-medium text-danger">Dave Sucks!</p>
          <p className="mt-1 whitespace-pre-line text-[13px] text-danger/80">{error}</p>
        </div>
      )}

      {/* Mobile: sticky compact counter */}
      <div className="sticky top-12 z-40 -mx-4 mb-4 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur-md sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-semibold text-fg">{yearsRemaining}</span>
            <span className="text-[12px] text-fg-muted">Years</span>
          </div>
          <div className="mx-2 h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
            <div
              className={`h-full rounded-full transition-all ${
                capPercent < 30
                  ? "bg-danger"
                  : capPercent < 60
                    ? "bg-warning"
                    : "bg-success"
              }`}
              style={{ width: `${Math.max(0, capPercent)}%` }}
            />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-semibold text-fg">{negotiationsRemaining}</span>
            <span className="text-[12px] text-fg-muted">Neg{negotiationsRemaining === 1 ? "" : "s"}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-accent px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-1.5 text-[13px] font-medium text-danger transition-colors hover:bg-danger/10"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: normal counter */}
      <div className="mb-6 hidden rounded-xl border border-line bg-surface p-5 sm:block">
        <div className="hidden flex-wrap items-center gap-6 sm:flex">
          <div>
            <h2 className="text-2xl font-semibold text-fg">
              {yearsRemaining} <span className="text-[16px] font-normal text-fg-muted">Years Left</span>
            </h2>
            <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-elevated">
              <div
                className={`h-full rounded-full transition-all ${
                  capPercent < 30
                    ? "bg-danger"
                    : capPercent < 60
                      ? "bg-warning"
                      : "bg-success"
                }`}
                style={{ width: `${Math.max(0, capPercent)}%` }}
              />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-fg">
              {negotiationsRemaining} <span className="text-[16px] font-normal text-fg-muted">Negotiation{negotiationsRemaining === 1 ? "" : "s"} Left</span>
            </h2>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-accent px-6 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-2 text-[13px] font-medium text-danger transition-colors hover:bg-danger/10"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: Card list */}
      <div className="space-y-3 sm:hidden">
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
          const result = computeMove(player, action, years, 999);
          const finalContract =
            result.newContract == null
              ? player.contractYears ?? ""
              : result.newContract === 0
                ? ""
                : result.newContract;

          if (player.toDraft) {
            return (
              <div key={player.id} className="rounded-xl border border-danger/20 bg-danger/5 p-3">
                <div className="flex items-center gap-3">
                  {player.imageUrl && (
                    <Image
                      src={player.imageUrl}
                      alt={player.playerName}
                      width={44}
                      height={44}
                      className="rounded-lg opacity-60"
                      unoptimized
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-fg-muted">{player.playerName}</p>
                    <p className="text-[12px] text-fg-subtle">{player.nflTeam} · {player.position}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-[12px] font-medium text-danger">
                    Going to Draft
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div key={player.id} className="rounded-xl border border-line bg-surface p-3">
              <div className="flex items-center gap-3">
                {player.imageUrl && (
                  <Image
                    src={player.imageUrl}
                    alt={player.playerName}
                    width={44}
                    height={44}
                    className="rounded-lg"
                    unoptimized
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-fg">{player.playerName}</p>
                  <p className="text-[12px] text-fg-subtle">{player.nflTeam} · {player.position}</p>
                </div>
                <div className="flex shrink-0 items-start gap-3 text-center">
                  <div className="w-12">
                    <p className="text-[10px] uppercase text-fg-subtle">Contract</p>
                    <p className="text-lg font-bold text-fg">
                      {player.contractYears == null ? "" : player.contractYears}
                    </p>
                  </div>
                  <div className="w-12">
                    <p className="text-[10px] uppercase text-fg-subtle">Final</p>
                    <p className="text-lg font-bold text-fg">{finalContract}</p>
                  </div>
                  <div className="w-8">
                    <p className="text-[10px] uppercase text-fg-subtle">Neg</p>
                    <p className="text-lg">
                      {player.negotiationAvailable ? (
                        <span className="text-success">✓</span>
                      ) : (
                        <span className="text-fg-subtle">—</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-2.5 flex gap-2">
                <CustomSelect
                  value={action}
                  options={availableActions.map((a) => ({
                    value: a,
                    label:
                      a === "sign"
                        ? "Sign"
                        : a === "renegotiate"
                          ? "Renegotiate"
                          : a === "cut"
                            ? "Cut"
                            : "Do Nothing",
                  }))}
                  onChange={(val) =>
                    handleActionChange(player.id, val as PlayerAction)
                  }
                  className="flex-1"
                />
                {action !== "nothing" && action !== "cut" ? (
                  <CustomSelect
                    value={years === "nothing" ? "" : String(years)}
                    options={[
                      { value: "", label: "Years" },
                      ...yearOptions.map((y) => ({
                        value: String(y),
                        label: y > 0 ? `+${y}` : String(y),
                      })),
                    ]}
                    onChange={(val) =>
                      handleYearChange(
                        player.id,
                        val === "" ? "nothing" : parseInt(val),
                      )
                    }
                    className="w-20 shrink-0"
                  />
                ) : (
                  <div className="w-20 shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: Roster Table */}
      <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface sm:block">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-elevated/50">
            <tr>
              <th className={thClass}></th>
              <th className={thClass}>Player</th>
              <th className={thClass}>NFL Team</th>
              <th className={thClass}>Position</th>
              <th className={`${thClass} text-center`}>Contract</th>
              <th className={`${thClass} text-center`}>Negotiation?</th>
              <th className={`${thClass} text-center`}>Action</th>
              <th className={`${thClass} text-center`}>Years</th>
              <th className={`${thClass} text-center`}>Final Contract</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
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
              const result = computeMove(player, action, years, 999);
              const finalContract =
                result.newContract == null
                  ? player.contractYears ?? ""
                  : result.newContract === 0
                    ? ""
                    : result.newContract;

              if (player.toDraft) {
                return (
                  <tr key={player.id} className="bg-danger/5 transition-colors hover:bg-danger/10">
                    <td className={tdClass}>
                      {player.imageUrl && (
                        <Image
                          src={player.imageUrl}
                          alt={player.playerName}
                          width={48}
                          height={48}
                          className="rounded-lg opacity-60"
                          unoptimized
                        />
                      )}
                    </td>
                    <td className={`${tdClass} font-medium text-fg-muted`}>{player.playerName}</td>
                    <td className={`${tdClass} text-fg-muted`}>{player.nflTeam}</td>
                    <td className={`${tdClass} text-fg-muted`}>{player.position}</td>
                    <td className={`${tdClass} text-center text-fg-subtle`}>—</td>
                    <td className={`${tdClass} text-center`}>
                      <span className="text-fg-subtle">—</span>
                    </td>
                    <td className={tdClass} colSpan={3}>
                      <span className="inline-block rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-[12px] font-medium text-danger">
                        Going to Draft
                      </span>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={player.id} className="transition-colors hover:bg-hover/50">
                  <td className={tdClass}>
                    {player.imageUrl && (
                      <Image
                        src={player.imageUrl}
                        alt={player.playerName}
                        width={48}
                        height={48}
                        className="rounded-lg"
                        unoptimized
                      />
                    )}
                  </td>
                  <td className={`${tdClass} font-medium text-fg`}>{player.playerName}</td>
                  <td className={`${tdClass} text-fg-muted`}>{player.nflTeam}</td>
                  <td className={`${tdClass} text-fg-muted`}>{player.position}</td>
                  <td className={`${tdClass} text-center text-xl font-bold text-fg`}>
                    {player.contractYears == null ? "" : player.contractYears}
                  </td>
                  <td className={`${tdClass} text-center`}>
                    {player.negotiationAvailable ? (
                      <span className="text-success">✓</span>
                    ) : (
                      <span className="text-fg-subtle">—</span>
                    )}
                  </td>
                  <td className={tdClass}>
                    <select
                      value={action}
                      onChange={(e) =>
                        handleActionChange(player.id, e.target.value as PlayerAction)
                      }
                      className={selectClass}
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
                  <td className={tdClass}>
                    {action !== "nothing" && action !== "cut" ? (
                      <select
                        value={years === "nothing" ? "" : String(years)}
                        onChange={(e) =>
                          handleYearChange(
                            player.id,
                            e.target.value === "" ? "nothing" : parseInt(e.target.value),
                          )
                        }
                        className={selectClass}
                      >
                        <option value=""></option>
                        {yearOptions.map((y) => (
                          <option key={y} value={y}>
                            {y > 0 ? `+${y}` : y}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-fg-subtle">—</span>
                    )}
                  </td>
                  <td className={`${tdClass} text-center text-xl font-bold text-fg`}>
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

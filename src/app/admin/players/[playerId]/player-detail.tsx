"use client";

import { useState } from "react";
import Link from "next/link";
import type { Player, PlayerHistoryEntry } from "@/lib/types";
import { HistoryIcon, CloseIcon, CheckIcon } from "@/components/icons";

interface PlayerDetailProps {
  player: Player;
  history: PlayerHistoryEntry[];
  ownerMap: Map<string, string>;
  seasonId: string;
  updateAction: (
    playerId: string,
    contractYears: number | null,
    negotiationAvailable: boolean,
    seasonId: string,
  ) => Promise<{ error: string | null }>;
}

export function PlayerDetail({
  player,
  history,
  ownerMap,
  seasonId,
  updateAction,
}: PlayerDetailProps) {
  const [years, setYears] = useState<number | "none">(player.contractYears ?? "none");
  const [negotiation, setNegotiation] = useState(player.negotiationAvailable);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    setSaved(false);
    const contractYears = years === "none" ? null : years;
    const res = await updateAction(player.id, contractYears, negotiation, seasonId);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSaved(true);
    }
  };

  const thClass = "px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-fg-subtle";
  const tdClass = "px-3 py-2.5";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/admin/players" className="text-[13px] text-fg-muted hover:text-fg">
          ← Back to Players
        </Link>
        <Link
          href="/admin/players"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-hover hover:text-fg"
        >
          <CloseIcon className="h-4 w-4" />
        </Link>
      </div>

      {/* Player info */}
      <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4 sm:p-6">
        {player.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.imageUrl}
            alt={player.playerName}
            className="h-14 w-14 shrink-0 rounded-lg object-cover sm:h-16 sm:w-16"
          />
        )}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight text-fg sm:text-xl">{player.playerName}</h2>
          <p className="mt-0.5 text-[13px] text-fg-muted sm:text-[14px]">
            {player.position} · {player.nflTeam}
            {player.ownerId && ` · ${ownerMap.get(player.ownerId) ?? "—"}`}
          </p>
        </div>
      </div>

      {/* Edit current contract */}
      <div className="rounded-xl border border-line bg-surface p-4 sm:p-6">
        <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-fg-muted">
          Current Contract
        </h3>
        {error && (
          <div className="mb-3 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-[13px] text-danger">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-6">
          <div className="space-y-1.5">
            <label className="block text-[12px] text-fg-subtle">Contract Years</label>
            <input
              type="number"
              value={years === "none" ? "" : years}
              onChange={(e) => {
                const v = e.target.value;
                setYears(v === "" ? "none" : parseInt(v));
              }}
              placeholder="none"
              className="w-full rounded-lg border border-line bg-elevated px-3 py-2 text-center text-[14px] text-fg focus:border-accent focus:outline-none sm:w-24"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[12px] text-fg-subtle">Negotiation Available</label>
            <button
              onClick={() => setNegotiation(!negotiation)}
              className={`rounded-lg border px-4 py-2 text-[14px] font-medium transition-colors ${
                negotiation
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-line bg-elevated text-fg-muted"
              }`}
            >
              {negotiation ? "✓ Available" : "— Locked"}
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            {busy ? "Saving..." : "Save Changes"}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-[13px] text-success">
              <CheckIcon className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
        {player.toDraft && (
          <p className="mt-3 text-[12px] text-danger">This player is marked for the draft pool.</p>
        )}
      </div>

      {/* Transaction history */}
      <div className="rounded-xl border border-line bg-surface p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <HistoryIcon className="h-4 w-4 text-fg-muted" />
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-fg-muted">
            Transaction History
          </h3>
        </div>
        {history.length === 0 ? (
          <p className="text-[13px] text-fg-muted">No history available.</p>
        ) : (
          <>
            {/* Mobile: Card list */}
            <div className="space-y-2.5 sm:hidden">
              {history.map((h) => (
                <div key={h.id} className="rounded-lg border border-line bg-elevated/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-semibold text-fg">{h.season_year}</span>
                    <span className="text-[12px]">
                      {h.to_draft ? (
                        <span className="rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 font-medium text-danger">Draft</span>
                      ) : h.cut_during_season ? (
                        <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 font-medium text-warning">Cut</span>
                      ) : (
                        <span className="text-fg-subtle">Active</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-fg-muted">
                    <div><span className="text-fg-subtle">Owner:</span> {h.owner_name ?? "—"}</div>
                    <div><span className="text-fg-subtle">Contract:</span> <span className="font-semibold text-fg">{h.contract_years == null ? "none" : h.contract_years}</span></div>
                    <div><span className="text-fg-subtle">Neg:</span> {h.negotiation_available ? <span className="text-success">✓</span> : <span className="text-fg-subtle">—</span>}</div>
                  </div>
                  {(h.move_action || h.move_year_debit) && (
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-fg-muted">
                      {h.move_action && <div><span className="text-fg-subtle">Action:</span> {formatAction(h.move_action)}</div>}
                      {h.move_year_debit ? <div><span className="text-fg-subtle">Debit:</span> −{h.move_year_debit}</div> : null}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden overflow-x-auto rounded-lg border border-line sm:block">
              <table className="min-w-full divide-y divide-line">
                <thead className="bg-elevated/50">
                  <tr>
                    <th className={thClass}>Season</th>
                    <th className={thClass}>Owner</th>
                    <th className={`${thClass} text-center`}>Contract</th>
                    <th className={`${thClass} text-center`}>Negotiation</th>
                    <th className={thClass}>Action</th>
                    <th className={`${thClass} text-center`}>Year Debit</th>
                    <th className={thClass}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {history.map((h) => (
                    <tr key={h.id} className="transition-colors hover:bg-hover/50">
                      <td className={`${tdClass} font-semibold text-fg`}>{h.season_year}</td>
                      <td className={`${tdClass} text-fg-muted`}>{h.owner_name ?? "—"}</td>
                      <td className={`${tdClass} text-center font-semibold text-fg`}>
                        {h.contract_years == null ? "none" : h.contract_years}
                      </td>
                      <td className={`${tdClass} text-center`}>
                        {h.negotiation_available ? (
                          <span className="text-success">✓</span>
                        ) : (
                          <span className="text-fg-subtle">—</span>
                        )}
                      </td>
                      <td className={`${tdClass} text-[13px] text-fg-muted`}>
                        {h.move_action ? formatAction(h.move_action) : "—"}
                      </td>
                      <td className={`${tdClass} text-center text-[13px] text-fg-muted`}>
                        {h.move_year_debit ? `−${h.move_year_debit}` : "—"}
                      </td>
                      <td className={`${tdClass} text-[12px]`}>
                        {h.to_draft ? (
                          <span className="rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 font-medium text-danger">Draft</span>
                        ) : h.cut_during_season ? (
                          <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 font-medium text-warning">Cut</span>
                        ) : (
                          <span className="text-fg-subtle">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatAction(action: string): string {
  const labels: Record<string, string> = {
    nothing: "Carry Over",
    sign: "Signed",
    renegotiate: "Renegotiated",
    cut: "Cut",
  };
  return labels[action] ?? action;
}

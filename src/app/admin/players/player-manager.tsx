"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchIcon, EditIcon, HistoryIcon } from "@/components/icons";

interface PlayerRow {
  id: string;
  playerName: string;
  nflTeam: string;
  position: string;
  imageUrl: string | null;
  ownerName: string;
  contractYears: number | null;
  negotiationAvailable: boolean;
  toDraft: boolean;
  espnPlayerId: string | null;
}

interface PlayerManagerProps {
  players: PlayerRow[];
  seasonId: string;
  updateAction: (
    playerId: string,
    contractYears: number | null,
    negotiationAvailable: boolean,
    seasonId: string,
  ) => Promise<{ error: string | null }>;
}

export function PlayerManager({
  players,
  seasonId,
  updateAction,
}: PlayerManagerProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [years, setYears] = useState<number | "none">(0);
  const [negotiation, setNegotiation] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const startEdit = (p: PlayerRow) => {
    setEditing(p.id);
    setYears(p.contractYears ?? "none");
    setNegotiation(p.negotiationAvailable);
  };

  const save = async (playerId: string) => {
    setBusy(true);
    setError(null);
    const contractYears = years === "none" ? null : years;
    const res = await updateAction(playerId, contractYears, negotiation, seasonId);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      setEditing(null);
    }
  };

  const filtered = players.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.playerName ?? "").toLowerCase().includes(q) ||
      (p.ownerName ?? "").toLowerCase().includes(q) ||
      (p.nflTeam ?? "").toLowerCase().includes(q)
    );
  });

  const thClass = "px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-fg-subtle";
  const tdClass = "px-3 py-2.5";

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-[13px] text-danger">
          {error}
        </div>
      )}

      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
        <input
          type="text"
          placeholder="Search players, teams, owners..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-line bg-elevated py-2 pl-9 pr-3 text-[13px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
      </div>

      <div className="max-h-[60vh] overflow-auto rounded-lg border border-line">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-elevated/50 sticky top-0">
            <tr>
              <th className={thClass}>Player</th>
              <th className={thClass}>Pos</th>
              <th className={thClass}>Team</th>
              <th className={thClass}>Owner</th>
              <th className={`${thClass} text-center`}>Contract</th>
              <th className={`${thClass} text-center`}>Negotiation</th>
              <th className={`${thClass} text-center`}>Draft?</th>
              <th className={thClass}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-hover/50">
                <td className={`${tdClass} font-medium text-fg`}>
                  <Link href={`/admin/players/${p.id}`} className="hover:underline">
                    {p.playerName}
                  </Link>
                </td>
                <td className={`${tdClass} text-fg-muted`}>{p.position}</td>
                <td className={`${tdClass} text-fg-muted`}>{p.nflTeam}</td>
                <td className={`${tdClass} text-fg-muted`}>{p.ownerName}</td>
                <td className={`${tdClass} text-center`}>
                  {editing === p.id ? (
                    <input
                      type="number"
                      value={years === "none" ? "" : years}
                      onChange={(e) => {
                        const v = e.target.value;
                        setYears(v === "" ? "none" : parseInt(v));
                      }}
                      placeholder="none"
                      className="w-16 rounded border border-line bg-elevated px-2 py-1 text-center text-[14px] text-fg focus:border-accent focus:outline-none"
                    />
                  ) : p.contractYears == null ? (
                    <span className="text-fg-subtle">none</span>
                  ) : (
                    <span className="font-semibold text-fg">{p.contractYears}</span>
                  )}
                </td>
                <td className={`${tdClass} text-center`}>
                  {editing === p.id ? (
                    <input
                      type="checkbox"
                      checked={negotiation}
                      onChange={(e) => setNegotiation(e.target.checked)}
                      className="h-4 w-4 accent-accent"
                    />
                  ) : p.negotiationAvailable ? (
                    <span className="text-success">✓</span>
                  ) : (
                    <span className="text-fg-subtle">—</span>
                  )}
                </td>
                <td className={`${tdClass} text-center text-[13px]`}>
                  {p.toDraft ? (
                    <span className="text-danger">✕</span>
                  ) : (
                    <span className="text-fg-subtle">—</span>
                  )}
                </td>
                <td className={`${tdClass} text-right`}>
                  <div className="flex items-center justify-end gap-2">
                    {editing === p.id ? (
                      <button
                        onClick={() => save(p.id)}
                        disabled={busy}
                        className="rounded-lg bg-accent px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
                      >
                        Save
                      </button>
                    ) : (
                      <>
                        <Link
                          href={`/admin/players/${p.id}`}
                          className="flex items-center gap-1 text-[12px] text-fg-muted hover:text-fg"
                          title="Transaction history"
                        >
                          <HistoryIcon className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => startEdit(p)}
                          className="flex items-center gap-1 text-[12px] text-accent hover:underline"
                        >
                          <EditIcon className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[13px] text-fg-muted">
                  No players found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

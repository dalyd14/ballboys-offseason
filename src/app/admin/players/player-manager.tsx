"use client";

import { useState } from "react";

interface PlayerRow {
  id: string;
  playerName: string;
  nflTeam: string;
  position: string;
  ownerName: string;
  contractYears: number | null;
  negotiationAvailable: boolean;
  toDraft: boolean;
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
      p.playerName.toLowerCase().includes(q) ||
      p.ownerName.toLowerCase().includes(q) ||
      p.nflTeam.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Search players, teams, owners..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm"
      />

      <div className="max-h-[60vh] overflow-auto rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Player</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Pos</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Team</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Owner</th>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">Contract</th>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">Negotiation?</th>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">Draft?</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{p.playerName}</td>
                <td className="px-3 py-2 text-gray-600">{p.position}</td>
                <td className="px-3 py-2 text-gray-600">{p.nflTeam}</td>
                <td className="px-3 py-2 text-gray-600">{p.ownerName}</td>
                <td className="px-3 py-2 text-center font-bold">
                  {editing === p.id ? (
                    <input
                      type="number"
                      value={years === "none" ? "" : years}
                      onChange={(e) => {
                        const v = e.target.value;
                        setYears(v === "" ? "none" : parseInt(v));
                      }}
                      placeholder="none"
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm"
                    />
                  ) : p.contractYears == null ? (
                    <span className="text-gray-400">none</span>
                  ) : (
                    p.contractYears
                  )}
                </td>
                <td className="px-3 py-2 text-center text-xl">
                  {editing === p.id ? (
                    <input
                      type="checkbox"
                      checked={negotiation}
                      onChange={(e) => setNegotiation(e.target.checked)}
                    />
                  ) : p.negotiationAvailable ? (
                    "✅"
                  ) : (
                    "❌"
                  )}
                </td>
                <td className="px-3 py-2 text-center text-sm">
                  {p.toDraft ? "❌" : "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  {editing === p.id ? (
                    <button
                      onClick={() => save(p.id)}
                      disabled={busy}
                      className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white font-medium hover:bg-blue-700"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(p)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
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

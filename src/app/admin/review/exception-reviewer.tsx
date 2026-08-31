"use client";

import { useState } from "react";

interface ExceptionRow {
  id: string;
  playerName: string;
  nflTeam: string;
  position: string;
  ownerId: string | null;
  ownerName: string;
  contractYears: number | null;
  contractYearsAtCut: number | null;
  cutDuringSeason: boolean;
  toDraft: boolean;
}

interface DraftCandidateRow {
  id: string;
  playerName: string;
  nflTeam: string;
  position: string;
  ownerName: string;
  contractYears: number | null;
}

interface ExceptionReviewerProps {
  exceptions: ExceptionRow[];
  draftCandidates: DraftCandidateRow[];
  owners: { id: string; name: string }[];
  seasonId: string;
  resolveAction: (
    playerId: string,
    resolution: "trade" | "cut" | "pickup",
    newOwnerId: string | null,
    seasonId: string,
  ) => Promise<{ error: string | null }>;
  markCutAction: (
    playerId: string,
    ownerId: string,
    contractYearsAtCut: number,
    seasonId: string,
  ) => Promise<{ error: string | null; penalty: number }>;
}

export function ExceptionReviewer({
  exceptions,
  draftCandidates,
  owners,
  seasonId,
  resolveAction,
  markCutAction,
}: ExceptionReviewerProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tradeOwner, setTradeOwner] = useState<Record<string, string>>({});

  const handleResolve = async (
    playerId: string,
    resolution: "trade" | "cut" | "pickup",
    ownerId: string | null,
  ) => {
    setBusy(playerId);
    setError(null);
    const newOwnerId =
      resolution === "trade" ? tradeOwner[playerId] ?? null : ownerId;
    const res = await resolveAction(playerId, resolution, newOwnerId, seasonId);
    setBusy(null);
    if (res.error) setError(res.error);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Exceptions (cut during season) */}
      <div>
        <h3 className="mb-3 font-medium">
          In-Season Cuts ({exceptions.length})
        </h3>
        {exceptions.length === 0 ? (
          <p className="text-sm text-gray-500">
            No in-season cuts flagged. Import ESPN rosters and flag exceptions
            during review.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Player</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Pos</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Original Owner</th>
                  <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">Years at Cut</th>
                  <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">Penalty</th>
                  <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {exceptions.map((ex) => {
                  const penalty = ex.contractYearsAtCut
                    ? Math.ceil(ex.contractYearsAtCut / 2)
                    : 0;
                  return (
                    <tr key={ex.id}>
                      <td className="px-3 py-2 font-medium">{ex.playerName}</td>
                      <td className="px-3 py-2 text-gray-600">{ex.position}</td>
                      <td className="px-3 py-2 text-gray-600">{ex.ownerName}</td>
                      <td className="px-3 py-2 text-center font-bold">
                        {ex.contractYearsAtCut ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-red-600">
                        {penalty > 0 ? `-${penalty}y` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() =>
                            handleResolve(ex.id, "cut", ex.ownerId)
                          }
                          disabled={busy === ex.id}
                          className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                        >
                          Send to Draft
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Draft candidates */}
      <div>
        <h3 className="mb-3 font-medium">
          Draft-Eligible Players ({draftCandidates.length})
        </h3>
        <p className="mb-3 text-xs text-gray-500">
          Players with 0 contract years and no negotiation available. These will
          go to the draft pool unless the owner renegotiates.
        </p>
        {draftCandidates.length === 0 ? (
          <p className="text-sm text-gray-500">No draft candidates yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Player</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Pos</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Owner</th>
                  <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {draftCandidates.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 font-medium">{p.playerName}</td>
                    <td className="px-3 py-2 text-gray-600">{p.position}</td>
                    <td className="px-3 py-2 text-gray-600">{p.ownerName}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() =>
                          handleResolve(p.id, "cut", null)
                        }
                        disabled={busy === p.id}
                        className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                      >
                        Send to Draft
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

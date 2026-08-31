"use client";

import { useState } from "react";

interface OwnerRow {
  id: string;
  ownerName: string;
  teamName: string;
  email: string;
  availableYears: number;
  availableNegotiations: number;
  canSubmit: boolean;
  rosterSubmitted: boolean;
}

interface OwnerManagerProps {
  owners: OwnerRow[];
  seasonId: string;
  baseCapYears: number;
  baseNegotiations: number;
  updateBudgetAction: (
    ownerId: string,
    availableYears: number,
    availableNegotiations: number,
    seasonId: string,
  ) => Promise<{ error: string | null }>;
  updateLockAction: (
    ownerId: string,
    canSubmit: boolean,
    seasonId: string,
  ) => Promise<{ error: string | null }>;
}

export function OwnerManager({
  owners,
  seasonId,
  baseCapYears,
  baseNegotiations,
  updateBudgetAction,
  updateLockAction,
}: OwnerManagerProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [years, setYears] = useState(0);
  const [negotiations, setNegotiations] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const startEdit = (owner: OwnerRow) => {
    setEditing(owner.id);
    setYears(owner.availableYears);
    setNegotiations(owner.availableNegotiations);
  };

  const saveBudget = async (ownerId: string) => {
    setBusy(true);
    setError(null);
    const res = await updateBudgetAction(ownerId, years, negotiations, seasonId);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      setEditing(null);
    }
  };

  const toggleLock = async (owner: OwnerRow) => {
    setBusy(true);
    setError(null);
    const res = await updateLockAction(owner.id, !owner.canSubmit, seasonId);
    setBusy(false);
    if (res.error) setError(res.error);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2 text-xs">
        <button
          onClick={() => {
            owners.forEach((o) => startEdit(o));
          }}
          className="rounded bg-gray-100 px-3 py-1 text-gray-600"
        >
          Set all to base ({baseCapYears}y / {baseNegotiations}n)
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Owner</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Team</th>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">Cap Years</th>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">Negotiations</th>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">Submitted?</th>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">Can Submit?</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {owners.map((owner) => (
              <tr key={owner.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">
                  {owner.ownerName}
                  <div className="text-xs text-gray-400">{owner.email}</div>
                </td>
                <td className="px-3 py-2 text-gray-600">{owner.teamName}</td>
                <td className="px-3 py-2 text-center">
                  {editing === owner.id ? (
                    <input
                      type="number"
                      value={years}
                      onChange={(e) => setYears(parseInt(e.target.value) || 0)}
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm"
                    />
                  ) : (
                    <span className="font-bold">{owner.availableYears}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  {editing === owner.id ? (
                    <input
                      type="number"
                      value={negotiations}
                      onChange={(e) => setNegotiations(parseInt(e.target.value) || 0)}
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm"
                    />
                  ) : (
                    <span className="font-bold">{owner.availableNegotiations}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  {owner.rosterSubmitted ? "✅" : "❌"}
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => toggleLock(owner)}
                    disabled={busy}
                    className={`rounded-md px-3 py-1 text-xs font-medium ${
                      owner.canSubmit
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {owner.canSubmit ? "Open" : "Locked"}
                  </button>
                </td>
                <td className="px-3 py-2 text-right">
                  {editing === owner.id ? (
                    <button
                      onClick={() => saveBudget(owner.id)}
                      disabled={busy}
                      className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white font-medium hover:bg-blue-700"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(owner)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit Budget
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

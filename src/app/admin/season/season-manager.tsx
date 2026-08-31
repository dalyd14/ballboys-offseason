"use client";

import { useState } from "react";
import type { Season, SeasonStatus } from "@/lib/types";

interface SeasonManagerProps {
  createAction: (
    year: number,
    baseCapYears: number,
    baseNegotiations: number,
  ) => Promise<{ error: string | null }>;
  updateStatusAction: (
    seasonId: string,
    status: SeasonStatus,
  ) => Promise<{ error: string | null }>;
  rolloverAction: (
    seasonId: string,
  ) => Promise<{ error: string | null; affected: number }>;
  seasons: Season[];
  activeSeasonId: string | null;
}

export function SeasonManager({
  createAction,
  updateStatusAction,
  rolloverAction,
  seasons,
  activeSeasonId,
}: SeasonManagerProps) {
  const [year, setYear] = useState(new Date().getFullYear() + 1);
  const [capYears, setCapYears] = useState(8);
  const [negotiations, setNegotiations] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rolloverMsg, setRolloverMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await createAction(year, capYears, negotiations);
    setLoading(false);
    if (res.error) setError(res.error);
  };

  const handleStatusChange = async (seasonId: string, status: SeasonStatus) => {
    setError(null);
    const res = await updateStatusAction(seasonId, status);
    if (res.error) setError(res.error);
  };

  const handleRollover = async (seasonId: string) => {
    if (!confirm("Run rollover? This decrements all contract years by 1.")) return;
    setLoading(true);
    setError(null);
    setRolloverMsg(null);
    const res = await rolloverAction(seasonId);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setRolloverMsg(`Rollover complete: ${res.affected} players decremented.`);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {rolloverMsg && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {rolloverMsg}
        </div>
      )}

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs uppercase text-gray-500">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="mt-1 w-24 rounded-md border border-gray-300 px-2 py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs uppercase text-gray-500">Base Cap Years</label>
          <input
            type="number"
            value={capYears}
            onChange={(e) => setCapYears(parseInt(e.target.value))}
            className="mt-1 w-24 rounded-md border border-gray-300 px-2 py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs uppercase text-gray-500">Base Negotiations</label>
          <input
            type="number"
            value={negotiations}
            onChange={(e) => setNegotiations(parseInt(e.target.value))}
            className="mt-1 w-24 rounded-md border border-gray-300 px-2 py-1.5"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Create Season
        </button>
      </form>

      {/* Existing seasons */}
      <div className="space-y-2">
        <h3 className="font-medium">Existing Seasons</h3>
        {seasons.map((season) => (
          <div
            key={season.id}
            className={`flex items-center justify-between rounded-md border p-3 ${
              season.id === activeSeasonId
                ? "border-blue-300 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="font-bold">{season.year}</span>
              <span className="text-sm text-gray-600">
                Status: <span className="font-medium">{season.status}</span>
              </span>
              <span className="text-sm text-gray-600">
                Cap: {season.baseCapYears}yrs
              </span>
              <span className="text-sm text-gray-600">
                Rollover: {season.rolloverCompleted ? "✅" : "⏳"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {season.id === activeSeasonId && (
                <>
                  <select
                    value={season.status}
                    onChange={(e) =>
                      handleStatusChange(season.id, e.target.value as SeasonStatus)
                    }
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                  >
                    <option value="setup">setup</option>
                    <option value="open">open</option>
                    <option value="locked">locked</option>
                    <option value="archived">archived</option>
                  </select>
                  {!season.rolloverCompleted && (
                    <button
                      onClick={() => handleRollover(season.id)}
                      disabled={loading}
                      className="rounded-md bg-orange-600 px-3 py-1 text-sm text-white font-medium hover:bg-orange-700 disabled:opacity-50"
                    >
                      Run Rollover
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {seasons.length ===  0 && (
          <p className="text-sm text-gray-500">No seasons yet.</p>
        )}
      </div>
    </div>
  );
}

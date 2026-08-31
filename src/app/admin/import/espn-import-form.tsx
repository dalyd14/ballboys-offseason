"use client";

import { useState } from "react";

interface ImportResult {
  error: string | null;
  imported: number;
  teamsImported: number;
  unmatchedTeams: string[];
  totalPlayers: number;
}

interface EspnImportFormProps {
  seasonId: string;
  seasonYear: number;
  ownerTeamMap: { ownerId: string; teamName: string }[];
  importAction: (
    seasonId: string,
    html: string,
    ownerTeamMap: { ownerId: string; teamName: string }[],
  ) => Promise<ImportResult>;
}

export function EspnImportForm({
  seasonId,
  seasonYear,
  ownerTeamMap,
  importAction,
}: EspnImportFormProps) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setHtml(ev.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!html) {
      setError("Please upload an HTML file first");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await importAction(seasonId, html, ownerTeamMap);
    setLoading(false);
    if (res.error && res.imported === 0) {
      setError(res.error);
    } else {
      setResult(res);
      if (res.error) setError(res.error);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {result && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4">
          <p className="font-medium text-green-700">
            Imported {result.imported} players across {result.teamsImported}{" "}
            teams for the {seasonYear} season.
          </p>
          {result.unmatchedTeams.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-orange-600">
                Could not match these teams to owners:
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-orange-600">
                {result.unmatchedTeams.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-gray-500">
                Update the owner&apos;s team name in the database to match, then
                re-import.
              </p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase text-gray-500">
            ESPN League Roster HTML Export
          </label>
          <input
            type="file"
            accept=".html,.htm"
            onChange={handleFileUpload}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
          {html && (
            <p className="mt-1 text-xs text-gray-500">
              Loaded {html.length.toLocaleString()} characters
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !html}
          className="rounded-md bg-green-600 px-6 py-2 text-sm text-white font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Importing..." : `Import to ${seasonYear} Season`}
        </button>
      </form>
    </div>
  );
}

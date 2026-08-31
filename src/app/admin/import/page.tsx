import { getActiveSeason, getOwners } from "@/lib/data";
import { EspnImportForm } from "./espn-import-form";
import { importEspnHtmlAction } from "../actions";

export default async function AdminImportPage() {
  const [season, owners] = await Promise.all([
    getActiveSeason(),
    getOwners(),
  ]);

  if (!season) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-600">
          No active season. Create a season first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-2 text-lg font-bold">Import ESPN League Rosters</h2>
        <p className="mb-4 text-sm text-gray-600">
          Export the full <strong>League Roster</strong> page from ESPN as HTML,
          then upload the single file below. The system parses all teams and
          matches each to an owner by team name. Players are loaded into the{" "}
          {season.year} season with no contracts (free agents) — use the review
          and players screens to set contracts afterward.
        </p>
        <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
          <strong>Team name matching:</strong> Each owner&apos;s team name in
          the database must match their ESPN team name exactly. Current mappings:
          <ul className="mt-2 list-inside list-disc">
            {owners.map((o) => (
              <li key={o.id}>
                {o.ownerName ?? o.name} → &quot;{o.teamName ?? "(not set)"}&quot;
              </li>
            ))}
          </ul>
        </div>
        <EspnImportForm
          seasonId={season.id}
          seasonYear={season.year}
          ownerTeamMap={owners.map((o) => ({
            ownerId: o.id,
            teamName: o.teamName ?? "",
          }))}
          importAction={importEspnHtmlAction}
        />
      </div>
    </div>
  );
}

import { getSeasons, getActiveSeason } from "@/lib/data";
import { SeasonManager } from "./season-manager";
import { createSeasonAction, updateSeasonStatusAction, rolloverSeasonAction } from "../actions";

export default async function AdminSeasonPage() {
  const [seasons, activeSeason] = await Promise.all([
    getSeasons(),
    getActiveSeason(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-bold">Create New Season</h2>
        <SeasonManager
          createAction={createSeasonAction}
          updateStatusAction={updateSeasonStatusAction}
          rolloverAction={rolloverSeasonAction}
          seasons={seasons}
          activeSeasonId={activeSeason?.id ?? null}
        />
      </div>
    </div>
  );
}

import { getActiveSeason, getPlayersBySeason, getOwners } from "@/lib/data";
import { ExceptionReviewer } from "./exception-reviewer";
import { resolveExceptionAction, markPlayerCutDuringSeasonAction } from "../actions";
import type { Player, Owner } from "@/lib/types";

export default async function AdminReviewPage() {
  const [season, owners] = await Promise.all([
    getActiveSeason(),
    getOwners(),
  ]);

  if (!season) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-600">No active season.</p>
      </div>
    );
  }

  const allPlayers = await getPlayersBySeason(season.id);

  // Build owner lookup map.
  const ownerMap = new Map<string, Owner>(owners.map((o) => [o.id, o]));

  // Flag players that need review: those marked cut_during_season,
  // or those whose owner doesn't match expected (exceptions from diff).
  // For now, show players flagged cut_during_season as needing review.
  const exceptions = allPlayers
    .filter((p) => p.cutDuringSeason)
    .map((p) => ({
      ...p,
      ownerName: p.ownerId
        ? ownerMap.get(p.ownerId)?.ownerName ?? "—"
        : "—",
    }));

  // Also show players at contract year 0 (draft-eligible candidates).
  const draftCandidates = allPlayers
    .filter(
      (p) =>
        p.contractYears === 0 && !p.negotiationAvailable && !p.toDraft,
    )
    .map((p) => ({
      ...p,
      ownerName: p.ownerId
        ? ownerMap.get(p.ownerId)?.ownerName ?? "—"
        : "—",
    }));

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-2 text-lg font-bold">Review Exceptions</h2>
        <p className="mb-4 text-sm text-gray-600">
          These players changed teams during the season and need manual review.
          Mark each as a trade (contract follows), cut (penalty + draft pool),
          or pickup (new player, no contract).
        </p>
        <ExceptionReviewer
          exceptions={exceptions}
          draftCandidates={draftCandidates}
          owners={owners.map((o) => ({
            id: o.id,
            name: o.ownerName ?? o.name,
          }))}
          seasonId={season.id}
          resolveAction={resolveExceptionAction}
          markCutAction={markPlayerCutDuringSeasonAction}
        />
      </div>
    </div>
  );
}

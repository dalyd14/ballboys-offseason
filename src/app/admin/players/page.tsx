import { getActiveSeason, getPlayersBySeason, getOwners } from "@/lib/data";
import { PlayerManager } from "./player-manager";
import { updatePlayerContractAction } from "../actions";
import type { Owner } from "@/lib/types";

export default async function AdminPlayersPage() {
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

  const players = await getPlayersBySeason(season.id);
  const ownerMap = new Map<string, Owner>(owners.map((o) => [o.id, o]));

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-2 text-lg font-bold">Players — {season.year} Season</h2>
      <p className="mb-4 text-sm text-gray-600">
        Manually edit any player&apos;s contract years and negotiation
        eligibility. Use this for corrections and edge cases.
      </p>
      <PlayerManager
        players={players.map((p) => ({
          id: p.id,
          playerName: p.playerName,
          nflTeam: p.nflTeam,
          position: p.position,
          ownerName: p.ownerId
            ? ownerMap.get(p.ownerId)?.ownerName ?? "—"
            : "—",
          contractYears: p.contractYears,
          negotiationAvailable: p.negotiationAvailable,
          toDraft: p.toDraft,
        }))}
        seasonId={season.id}
        updateAction={updatePlayerContractAction}
      />
    </div>
  );
}

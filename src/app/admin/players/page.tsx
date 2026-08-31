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
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="text-[14px] text-fg-muted">No active season.</p>
      </div>
    );
  }

  const players = await getPlayersBySeason(season.id);
  const ownerMap = new Map<string, Owner>(owners.map((o) => [o.id, o]));

  return (
    <div className="rounded-xl border border-line bg-surface p-6">
      <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-fg-muted">
        Players — {season.year} Season
      </h2>
      <p className="mb-5 text-[13px] text-fg-muted">
        Click any player to view their transaction history across seasons.
        Manually edit contracts and negotiation eligibility as needed.
      </p>
      <PlayerManager
        players={players.map((p) => ({
          id: p.id,
          playerName: p.playerName,
          nflTeam: p.nflTeam,
          position: p.position,
          imageUrl: p.imageUrl,
          ownerName: p.ownerId
            ? ownerMap.get(p.ownerId)?.ownerName ?? "—"
            : "—",
          contractYears: p.contractYears,
          negotiationAvailable: p.negotiationAvailable,
          toDraft: p.toDraft,
          espnPlayerId: p.espnPlayerId,
        }))}
        seasonId={season.id}
        updateAction={updatePlayerContractAction}
      />
    </div>
  );
}

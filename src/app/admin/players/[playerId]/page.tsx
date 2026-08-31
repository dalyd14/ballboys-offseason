import { getPlayerById, getPlayerHistory, getOwners } from "@/lib/data";
import { updatePlayerContractAction } from "../../actions";
import { PlayerDetail } from "./player-detail";

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const player = await getPlayerById(playerId);

  if (!player) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="text-[14px] text-fg-muted">Player not found.</p>
      </div>
    );
  }

  const [history, owners] = await Promise.all([
    getPlayerHistory(playerId),
    getOwners(),
  ]);

  const ownerMap = new Map(owners.map((o) => [o.id, o.ownerName ?? o.name]));

  return (
    <PlayerDetail
      player={player}
      history={history}
      ownerMap={ownerMap}
      seasonId={player.seasonId}
      updateAction={updatePlayerContractAction}
    />
  );
}

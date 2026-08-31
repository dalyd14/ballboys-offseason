import { requireOwner } from "@/lib/session";
import { getActiveSeason, getOwners, getPlayersBySeason, getPlayersToDraft, getRosterMovesBySeason } from "@/lib/data";
import { OtherTeamView } from "@/components/other-team-view";
import type { Player, Owner, PlayerWithMove, PlayerAction } from "@/lib/types";

export default async function OtherTeamsPage() {
  const owner = await requireOwner();
  const season = await getActiveSeason();

  if (!season) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-xl font-semibold text-fg">No active season</h1>
      </div>
    );
  }

  const [owners, allPlayers, draftPlayers, rosterMoves] = await Promise.all([
    getOwners(),
    getPlayersBySeason(season.id),
    getPlayersToDraft(season.id),
    getRosterMovesBySeason(season.id),
  ]);

  // Build a lookup: playerId → roster move
  const moveMap = new Map<string, { action: PlayerAction; newContract: number | null; newNegotiationAvailable: boolean | null; yearDebit: number }>();
  for (const m of rosterMoves) {
    moveMap.set(m.playerId, {
      action: m.action,
      newContract: m.newContract,
      newNegotiationAvailable: m.newNegotiationAvailable,
      yearDebit: m.yearDebit,
    });
  }

  const ownersWithPlayers = owners.map((o) => {
    const players = allPlayers.filter((p) => p.ownerId === o.id);
    // If the owner is locked (can't submit), merge their roster moves
    // onto the players so the component can show post-submission state.
    const playersWithMoves: PlayerWithMove[] = !o.canSubmit
      ? players.map((p) => {
          const move = moveMap.get(p.id);
          return move
            ? { ...p, ...move }
            : { ...p };
        })
      : players.map((p) => ({ ...p }));
    return {
      owner: o,
      players: playersWithMoves,
    };
  });

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <OtherTeamView
        ownersWithPlayers={ownersWithPlayers}
        draftPlayers={draftPlayers}
        currentOwnerId={owner.id}
      />
    </div>
  );
}

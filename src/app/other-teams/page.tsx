import { requireOwner } from "@/lib/session";
import { getActiveSeason, getOwners, getPlayersBySeason, getPlayersToDraft } from "@/lib/data";
import { OtherTeamView } from "@/components/other-team-view";
import type { Player, Owner } from "@/lib/types";

export default async function OtherTeamsPage() {
  const owner = await requireOwner();
  const season = await getActiveSeason();

  if (!season) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">No active season</h1>
      </div>
    );
  }

  const [owners, allPlayers, draftPlayers] = await Promise.all([
    getOwners(),
    getPlayersBySeason(season.id),
    getPlayersToDraft(season.id),
  ]);

  // Group players by owner.
  const ownersWithPlayers = owners.map((o) => ({
    owner: o,
    players: allPlayers.filter((p) => p.ownerId === o.id),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <OtherTeamView
        ownersWithPlayers={ownersWithPlayers}
        draftPlayers={draftPlayers}
        currentOwnerId={owner.id}
      />
    </div>
  );
}

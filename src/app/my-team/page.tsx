import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/session";
import { getActiveSeason, getPlayersWithMoves } from "@/lib/data";
import { TeamViewTable } from "@/components/team-view-table";

export default async function MyTeamPage() {
  const owner = await requireOwner();
  const season = await getActiveSeason();

  if (!season) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">No active season</h1>
        <p className="mt-2 text-gray-600">
          The offseason hasn&apos;t been opened yet. Check back later.
        </p>
      </div>
    );
  }

  const players = await getPlayersWithMoves(season.id, owner.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <TeamViewTable
        players={players}
        ownerName={owner.ownerName ?? owner.name}
        teamName={owner.teamName ?? ""}
        rosterSubmitted={owner.rosterSubmitted}
      />
    </div>
  );
}

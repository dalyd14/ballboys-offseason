import { redirect } from "next/navigation";
import Link from "next/link";
import { requireOwner } from "@/lib/session";
import { getActiveSeason, getPlayersByOwner } from "@/lib/data";
import { RosterSubmitTable } from "@/components/roster-submit-table";
import { resetRosterAction } from "@/app/submit-roster/actions";

export default async function SubmitRosterPage() {
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

  // If already submitted or locked out, show the confirmation screen.
  if (owner.rosterSubmitted || !owner.canSubmit) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">
          {owner.rosterSubmitted
            ? "It seems as though you already submitted your roster"
            : "The offseason window is currently closed"}
        </h1>
        <p className="mt-4 text-gray-600">You can view your team here:</p>
        <Link
          href="/my-team"
          className="mt-4 inline-block rounded-md bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700"
        >
          View Submitted Roster
        </Link>
        {owner.rosterSubmitted && owner.canSubmit && (
          <div className="mt-8">
            <p className="text-gray-600">
              If you did a crappy job, you can reset all changes to your roster
              and start from scratch:
            </p>
            <form action={resetRosterAction}>
              <input type="hidden" name="seasonId" value={season.id} />
              <button
                type="submit"
                className="mt-4 rounded-md bg-red-600 px-6 py-2 text-white font-medium hover:bg-red-700"
              >
                Reset Roster
              </button>
            </form>
          </div>
        )}
        {owner.rosterSubmitted && !owner.canSubmit && (
          <p className="mt-8 text-gray-600">
            Sorry if you did a crappy job, you are locked in now.
          </p>
        )}
      </div>
    );
  }

  const players = await getPlayersByOwner(season.id, owner.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <RosterSubmitTable
        players={players}
        availableYears={owner.availableYears}
        availableNegotiations={owner.availableNegotiations}
        ownerEmail={owner.email}
        seasonId={season.id}
      />
    </div>
  );
}

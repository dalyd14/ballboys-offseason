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
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-xl font-semibold text-fg">No active season</h1>
        <p className="mt-2 text-[14px] text-fg-muted">
          The offseason hasn&apos;t been opened yet. Check back later.
        </p>
      </div>
    );
  }

  if (owner.rosterSubmitted || !owner.canSubmit) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-xl font-semibold text-fg">
          {owner.rosterSubmitted
            ? "Roster Already Submitted"
            : "Offseason Window Closed"}
        </h1>
        <p className="mt-3 text-[14px] text-fg-muted">
          You can view your team here:
        </p>
        <Link
          href="/my-team"
          className="mt-5 inline-block rounded-lg bg-accent px-6 py-2 text-[14px] font-medium text-white transition-colors hover:bg-accent-hover"
        >
          View Submitted Roster
        </Link>

        {owner.rosterSubmitted && owner.canSubmit && (
          <div className="mt-8">
            <p className="text-[14px] text-fg-muted">
              If you did a crappy job, you can reset all changes to your roster
              and start from scratch:
            </p>
            <form action={resetRosterAction}>
              <input type="hidden" name="seasonId" value={season.id} />
              <button
                type="submit"
                className="mt-4 rounded-lg border border-danger/20 bg-danger/5 px-6 py-2 text-[14px] font-medium text-danger transition-colors hover:bg-danger/10"
              >
                Reset Roster
              </button>
            </form>
          </div>
        )}
        {owner.rosterSubmitted && !owner.canSubmit && (
          <p className="mt-8 text-[14px] text-fg-muted">
            Sorry if you did a crappy job, you are locked in now.
          </p>
        )}
      </div>
    );
  }

  const players = await getPlayersByOwner(season.id, owner.id);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
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

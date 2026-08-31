import Link from "next/link";
import { getActiveSeason, getOwners, getPlayersBySeason, getAuditLog } from "@/lib/data";
import { CheckIcon } from "@/components/icons";

export default async function AdminOverviewPage() {
  const season = await getActiveSeason();
  const owners = await getOwners();
  const players = season ? await getPlayersBySeason(season.id) : [];
  const auditLog = season ? await getAuditLog(season.id, 5) : [];

  const submittedCount = owners.filter((o) => o.rosterSubmitted).length;
  const draftPoolCount = season ? players.filter((p) => p.toDraft).length : 0;
  const exceptionCount = season ? players.filter((p) => p.cutDuringSeason).length : 0;

  // Checklist state
  const hasSeason = !!season;
  const hasPlayers = players.length > 0;
  const rolloverDone = season?.rolloverCompleted ?? false;
  const exceptionsResolved = exceptionCount === 0;

  const checklist = [
    { label: "Create new season", done: hasSeason },
    { label: "Import ESPN rosters", done: hasPlayers },
    { label: "Run rollover", done: rolloverDone },
    { label: "Review exceptions", done: exceptionsResolved },
    { label: "Set owner budgets & locks", done: false },
  ];

  const eventLabels: Record<string, string> = {
    season_created: "Season Created",
    season_status_changed: "Season Status Changed",
    rollover_started: "Rollover Started",
    rollover_completed: "Rollover Completed",
    owner_budget_updated: "Owner Budget Updated",
    owner_lock_toggled: "Owner Lock Toggled",
    player_edited: "Player Edited",
    cut_penalty_applied: "Cut Penalty Applied",
    exception_resolved: "Exception Resolved",
    espn_imported: "ESPN Rosters Imported",
    owner_created: "Owner Created",
    owner_profile_updated: "Owner Profile Updated",
    owner_password_reset: "Owner Password Reset",
    owner_deleted: "Owner Deleted",
    owner_role_changed: "Owner Role Changed",
  };

  return (
    <div className="space-y-6">
      {/* Season status card */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <h2 className="mb-5 text-[13px] font-semibold uppercase tracking-wider text-fg-muted">
          Current Season
        </h2>
        {season ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <dt className="text-[12px] text-fg-subtle">Year</dt>
              <dd className="mt-1 text-2xl font-semibold text-fg">{season.year}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-fg-subtle">Status</dt>
              <dd className="mt-1 text-2xl font-semibold capitalize text-fg">{season.status}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-fg-subtle">Base Cap</dt>
              <dd className="mt-1 text-2xl font-semibold text-fg">
                {season.baseCapYears}<span className="text-[14px] text-fg-muted"> yrs</span>
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-fg-subtle">Rollover</dt>
              <dd className="mt-1 text-2xl font-semibold text-fg">
                {season.rolloverCompleted ? "Done" : "Pending"}
              </dd>
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-fg-muted">
            No active season.{" "}
            <Link href="/admin/offseason" className="text-accent hover:underline">
              Create one →
            </Link>
          </p>
        )}
      </div>

      {/* Offseason progress checklist */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-fg-muted">
            Offseason Progress
          </h2>
          <Link href="/admin/offseason" className="text-[12px] text-accent hover:underline">
            Go to Offseason →
          </Link>
        </div>
        <div className="space-y-2.5">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                {item.done ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15">
                    <CheckIcon className="h-3.5 w-3.5 text-success" />
                  </span>
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line text-[11px] font-semibold text-fg-subtle">
                    {i + 1}
                  </span>
                )}
              </div>
              <span className={`text-[13px] ${item.done ? "text-fg-muted line-through" : "text-fg"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-6">
          <p className="text-[12px] text-fg-subtle">Owners Submitted</p>
          <p className="mt-2 text-3xl font-semibold text-fg">
            {submittedCount}<span className="text-[16px] text-fg-muted"> / {owners.length}</span>
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-6">
          <p className="text-[12px] text-fg-subtle">Draft Pool</p>
          <p className="mt-2 text-3xl font-semibold text-fg">{draftPoolCount}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-6">
          <p className="text-[12px] text-fg-subtle">Pending Exceptions</p>
          <p className="mt-2 text-3xl font-semibold text-fg">{exceptionCount}</p>
        </div>
      </div>

      {/* Recent activity */}
      {auditLog.length > 0 && (
        <div className="rounded-xl border border-line bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-fg-muted">
              Recent Activity
            </h2>
            <Link href="/admin/audit" className="text-[12px] text-accent hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-1">
            {auditLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between border-b border-line py-2.5 text-[13px] last:border-0"
              >
                <span className="font-medium text-fg">
                  {eventLabels[entry.eventType] ?? entry.eventType}
                </span>
                <span className="text-[12px] text-fg-subtle">
                  {entry.createdAt.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

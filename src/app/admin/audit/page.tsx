import { getActiveSeason, getAuditLog, getOwners } from "@/lib/data";

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

export default async function AdminAuditPage() {
  const season = await getActiveSeason();

  if (!season) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="text-[14px] text-fg-muted">No active season.</p>
      </div>
    );
  }

  const [log, owners] = await Promise.all([
    getAuditLog(season.id, 100),
    getOwners(),
  ]);

  const ownerMap = new Map(owners.map((o) => [o.id, o.ownerName ?? o.name]));

  const thClass = "px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-fg-subtle";

  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:p-6">
      <h2 className="mb-5 text-[13px] font-semibold uppercase tracking-wider text-fg-muted">
        Audit Log — {season.year} Season
      </h2>

      {/* Mobile: Card list */}
      <div className="max-h-[70vh] space-y-2.5 overflow-auto sm:hidden">
        {log.map((entry) => {
          const details = entry.details as Record<string, unknown> | null;
          return (
            <div key={entry.id} className="rounded-lg border border-line bg-elevated/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-fg">
                  {eventLabels[entry.eventType] ?? entry.eventType}
                </span>
                <span className="shrink-0 text-[11px] text-fg-subtle">
                  {entry.createdAt.toLocaleDateString()}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-fg-muted">
                <div><span className="text-fg-subtle">Actor:</span> {entry.actorId ? ownerMap.get(entry.actorId) ?? "—" : "—"}</div>
                <div><span className="text-fg-subtle">Owner:</span> {entry.ownerId ? ownerMap.get(entry.ownerId) ?? "—" : "—"}</div>
              </div>
              {details && (
                <p className="mt-1.5 text-[12px] text-fg-muted">{formatDetails(details)}</p>
              )}
            </div>
          );
        })}
        {log.length === 0 && (
          <div className="rounded-lg border border-line p-8 text-center text-[13px] text-fg-muted">
            No activity recorded yet.
          </div>
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden max-h-[70vh] overflow-auto rounded-lg border border-line sm:block">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-elevated/50 sticky top-0">
            <tr>
              <th className={thClass}>Time</th>
              <th className={thClass}>Event</th>
              <th className={thClass}>Actor</th>
              <th className={thClass}>Owner</th>
              <th className={thClass}>Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {log.map((entry) => {
              const details = entry.details as Record<string, unknown> | null;
              return (
                <tr key={entry.id} className="transition-colors hover:bg-hover/50">
                  <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-fg-subtle">
                    {entry.createdAt.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-[13px] font-medium text-fg">
                    {eventLabels[entry.eventType] ?? entry.eventType}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-fg-muted">
                    {entry.actorId ? ownerMap.get(entry.actorId) ?? "—" : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-fg-muted">
                    {entry.ownerId ? ownerMap.get(entry.ownerId) ?? "—" : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-fg-muted">
                    {details ? formatDetails(details) : "—"}
                  </td>
                </tr>
              );
            })}
            {log.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-fg-muted">
                  No activity recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDetails(details: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(details)) {
    if (value == null) continue;
    const label = key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase())
      .replace(/_/g, " ");
    parts.push(`${label}: ${typeof value === "object" ? JSON.stringify(value) : value}`);
  }
  return parts.join(" · ");
}

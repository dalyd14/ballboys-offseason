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
    <div className="rounded-xl border border-line bg-surface p-6">
      <h2 className="mb-5 text-[13px] font-semibold uppercase tracking-wider text-fg-muted">
        Audit Log — {season.year} Season
      </h2>
      <div className="max-h-[70vh] overflow-auto rounded-lg border border-line">
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

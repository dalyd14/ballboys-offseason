import Link from "next/link";
import { getActiveSeason, getOwners, getPlayersBySeason, getAuditLog } from "@/lib/data";

export default async function AdminOverviewPage() {
  const season = await getActiveSeason();
  const owners = await getOwners();
  const players = season ? await getPlayersBySeason(season.id) : [];
  const auditLog = season ? await getAuditLog(season.id, 10) : [];

  const submittedCount = owners.filter((o) => o.rosterSubmitted).length;
  const draftPoolCount = season
    ? players.filter((p) => p.toDraft).length
    : 0;
  const exceptionCount = season
    ? players.filter((p) => p.cutDuringSeason).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Season Status Card */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-bold">Current Season</h2>
        {season ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Year" value={String(season.year)} />
            <Stat label="Status" value={season.status} />
            <Stat label="Base Cap" value={`${season.baseCapYears} yrs`} />
            <Stat label="Rollover" value={season.rolloverCompleted ? "Done" : "Pending"} />
          </div>
        ) : (
          <p className="text-gray-500">
            No active season.{" "}
            <Link href="/admin/season" className="text-blue-600 hover:underline">
              Create one →
            </Link>
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Owners Submitted"
          value={`${submittedCount} / ${owners.length}`}
          href="/admin/owners"
        />
        <StatCard
          label="Draft Pool"
          value={String(draftPoolCount)}
          href="/admin/review"
        />
        <StatCard
          label="Pending Exceptions"
          value={String(exceptionCount)}
          href="/admin/review"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-bold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/season"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700"
          >
            Manage Season
          </Link>
          <Link
            href="/admin/import"
            className="rounded-md bg-green-600 px-4 py-2 text-sm text-white font-medium hover:bg-green-700"
          >
            Import ESPN Rosters
          </Link>
          <Link
            href="/admin/review"
            className="rounded-md bg-orange-600 px-4 py-2 text-sm text-white font-medium hover:bg-orange-700"
          >
            Review Exceptions
          </Link>
          <Link
            href="/admin/owners"
            className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white font-medium hover:bg-purple-700"
          >
            Set Budgets & Locks
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      {auditLog.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-bold">Recent Activity</h2>
          <div className="space-y-2">
            {auditLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between border-b border-gray-100 pb-2 text-sm"
              >
                <span className="font-mono text-xs text-gray-500">
                  {entry.event_type}
                </span>
                <span className="text-gray-400">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-gray-500">{label}</dt>
      <dd className="mt-1 text-lg font-bold">{value}</dd>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg bg-white p-6 shadow hover:shadow-md transition"
    >
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </Link>
  );
}

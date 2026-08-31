import { getActiveSeason, getAuditLog } from "@/lib/data";

export default async function AdminAuditPage() {
  const season = await getActiveSeason();

  if (!season) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-600">No active season.</p>
      </div>
    );
  }

  const log = await getAuditLog(season.id, 100);

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-bold">Audit Log — {season.year} Season</h2>
      <div className="max-h-[70vh] overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Time</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Event</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {log.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{entry.event_type}</td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  {entry.details
                    ? JSON.stringify(entry.details)
                    : "—"}
                </td>
              </tr>
            ))}
            {log.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
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

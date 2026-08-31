import type { PlayerWithMove } from "@/lib/types";

interface TeamViewTableProps {
  players: PlayerWithMove[];
  ownerName: string;
  teamName: string;
  rosterSubmitted: boolean;
}

export function TeamViewTable({
  players,
  ownerName,
  teamName,
  rosterSubmitted,
}: TeamViewTableProps) {
  const shownPlayers = rosterSubmitted
    ? players.filter(
        (p) => (p.newContract != null && p.newContract !== 0) || p.toDraft,
      )
    : players;

  const thClass = "px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-fg-subtle";
  const tdClass = "px-4 py-3";

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-fg">
            {ownerName}&apos;s Team
          </h1>
          <p className="mt-0.5 text-[14px] text-fg-muted">{teamName}</p>
        </div>
        <div>
          {rosterSubmitted ? (
            <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[12px] font-medium text-success">
              Roster Submitted ✓
            </span>
          ) : (
            <span className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-[12px] font-medium text-warning">
              Not submitted yet
            </span>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-elevated/50">
            <tr>
              <th className={thClass}></th>
              <th className={thClass}>Player</th>
              <th className={thClass}>NFL Team</th>
              <th className={thClass}>Position</th>
              {rosterSubmitted ? (
                <>
                  <th className={`${thClass} text-center`}>Action</th>
                  <th className={`${thClass} text-center`}>New Contract</th>
                  <th className={`${thClass} text-center`}>Negotiation?</th>
                </>
              ) : (
                <>
                  <th className={`${thClass} text-center`}>Contract</th>
                  <th className={`${thClass} text-center`}>Negotiation?</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shownPlayers.map((player) => (
              <tr
                key={player.id}
                className={`transition-colors hover:bg-hover/50 ${
                  player.toDraft ? "bg-danger/5" : ""
                }`}
              >
                <td className={tdClass}>
                  {player.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={player.imageUrl}
                      alt={player.playerName}
                      className={`h-12 w-12 rounded-lg object-cover ${
                        player.toDraft ? "opacity-60" : ""
                      }`}
                    />
                  )}
                </td>
                <td className={`${tdClass} font-medium ${player.toDraft ? "text-fg-muted" : "text-fg"}`}>
                  {player.playerName}
                </td>
                <td className={`${tdClass} text-fg-muted`}>{player.nflTeam}</td>
                <td className={`${tdClass} text-fg-muted`}>{player.position}</td>
                {player.toDraft ? (
                  <td className={tdClass} colSpan={rosterSubmitted ? 3 : 2}>
                    <span className="inline-block rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-[12px] font-medium text-danger">
                      Going to Draft
                    </span>
                  </td>
                ) : rosterSubmitted ? (
                  <>
                    <td className={`${tdClass} text-center font-medium text-fg-muted`}>
                      {player.action === "nothing"
                        ? "Carry Over"
                        : player.action === "sign"
                          ? "Signed"
                          : player.action === "renegotiate"
                            ? "Renegotiated"
                            : player.action === "cut"
                              ? "Cut"
                              : "—"}
                    </td>
                    <td className={`${tdClass} text-center text-xl font-bold text-fg`}>
                      {player.newContract == null || player.newContract === 0
                        ? ""
                        : player.newContract}
                    </td>
                    <td className={`${tdClass} text-center`}>
                      {player.newNegotiationAvailable ? (
                        <span className="text-success">✓</span>
                      ) : (
                        <span className="text-fg-subtle">—</span>
                      )}
                    </td>
                  </>
                ) : (
                  <>
                    <td className={`${tdClass} text-center text-xl font-bold text-fg`}>
                      {player.contractYears == null ? "" : player.contractYears}
                    </td>
                    <td className={`${tdClass} text-center`}>
                      {player.negotiationAvailable ? (
                        <span className="text-success">✓</span>
                      ) : (
                        <span className="text-fg-subtle">—</span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
            {shownPlayers.length === 0 && (
              <tr>
                <td colSpan={rosterSubmitted ? 7 : 6} className="px-4 py-8 text-center text-[14px] text-fg-muted">
                  No players on this roster.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

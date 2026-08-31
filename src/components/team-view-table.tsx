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
      <div className="sticky top-12 z-40 -mx-4 mb-6 flex items-baseline justify-between gap-3 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-fg">
            {ownerName}&apos;s Team
          </h1>
          <p className="mt-0.5 truncate text-[14px] text-fg-muted">{teamName}</p>
        </div>
        <div className="shrink-0">
          {rosterSubmitted ? (
            <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[12px] font-medium text-success">
              Submitted ✓
            </span>
          ) : (
            <span className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-[12px] font-medium text-warning">
              Not submitted
            </span>
          )}
        </div>
      </div>

      {/* Mobile: Card list */}
      <div className="space-y-2.5 sm:hidden">
        {shownPlayers.map((player) => (
          <div
            key={player.id}
            className={`rounded-xl border border-line bg-surface p-3 ${
              player.toDraft ? "border-danger/20 bg-danger/5" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              {player.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={player.imageUrl}
                  alt={player.playerName}
                  className={`h-11 w-11 shrink-0 rounded-lg object-cover ${
                    player.toDraft ? "opacity-60" : ""
                  }`}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[14px] font-medium ${player.toDraft ? "text-fg-muted" : "text-fg"}`}>
                  {player.playerName}
                </p>
                <p className="text-[12px] text-fg-subtle">{player.nflTeam} · {player.position}</p>
              </div>
              {player.toDraft ? (
                <span className="shrink-0 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-[12px] font-medium text-danger">
                  Going to Draft
                </span>
              ) : (
                <div className="flex shrink-0 items-start gap-3 text-center">
                  {rosterSubmitted ? (
                    <>
                      <div className="w-16 text-left">
                        <p className="text-[10px] uppercase text-fg-subtle">Action</p>
                        <p className="truncate text-[12px] font-medium text-fg-muted">
                          {player.action === "nothing"
                            ? "Carry Over"
                            : player.action === "sign"
                              ? "Signed"
                              : player.action === "renegotiate"
                                ? "Renegotiated"
                                : player.action === "cut"
                                  ? "Cut"
                                  : "—"}
                        </p>
                      </div>
                      <div className="w-12">
                        <p className="text-[10px] uppercase text-fg-subtle">Contract</p>
                        <p className="text-lg font-bold text-fg">
                          {player.newContract == null || player.newContract === 0 ? "" : player.newContract}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12">
                        <p className="text-[10px] uppercase text-fg-subtle">Contract</p>
                        <p className="text-lg font-bold text-fg">
                          {player.contractYears == null ? "" : player.contractYears}
                        </p>
                      </div>
                      <div className="w-8">
                        <p className="text-[10px] uppercase text-fg-subtle">Neg</p>
                        <p className="text-lg">
                          {player.negotiationAvailable ? (
                            <span className="text-success">✓</span>
                          ) : (
                            <span className="text-fg-subtle">—</span>
                          )}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            {rosterSubmitted && !player.toDraft && (
              <div className="mt-1.5 text-[12px] text-fg-subtle">
                Neg: {player.newNegotiationAvailable ? <span className="text-success">✓</span> : <span className="text-fg-subtle">—</span>}
              </div>
            )}
          </div>
        ))}
        {shownPlayers.length === 0 && (
          <div className="rounded-xl border border-line bg-surface p-8 text-center text-[14px] text-fg-muted">
            No players on this roster.
          </div>
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden overflow-hidden rounded-xl border border-line bg-surface sm:block">
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

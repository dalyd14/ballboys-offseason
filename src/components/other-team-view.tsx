"use client";

import Image from "next/image";
import { useState } from "react";
import type { Player, Owner, PlayerWithMove } from "@/lib/types";

interface OtherTeamViewProps {
  ownersWithPlayers: { owner: Owner; players: PlayerWithMove[] }[];
  draftPlayers: Player[];
  currentOwnerId: string;
}

type View =
  | { type: "owner"; ownerId: string }
  | { type: "draft" }
  | { type: "none" };

export function OtherTeamView({
  ownersWithPlayers,
  draftPlayers,
  currentOwnerId,
}: OtherTeamViewProps) {
  const [view, setView] = useState<View>({ type: "none" });

  const selectedOwner =
    view.type === "owner"
      ? ownersWithPlayers.find((o) => o.owner.id === view.ownerId)
      : null;

  return (
    <div className="flex flex-col gap-6 lg:flex-row" style={{ minHeight: "70vh" }}>
      {/* Left sidebar: team list — horizontal scroll on mobile, vertical on desktop */}
      <div className="shrink-0 lg:w-60">
        <div className="flex gap-1 overflow-x-auto pb-1 lg:space-y-1 lg:overflow-visible lg:flex-col lg:pb-0">
          {ownersWithPlayers.map(({ owner, players }) => (
            <button
              key={owner.id}
              onClick={() => setView({ type: "owner", ownerId: owner.id })}
              className={`flex shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors lg:w-full ${
                view.type === "owner" && view.ownerId === owner.id
                  ? "bg-accent text-white"
                  : "text-fg-muted hover:bg-hover hover:text-fg"
              }`}
            >
              <span className="font-medium">
                {owner.ownerName ?? owner.name}
              </span>
              <span className="text-[12px] opacity-70">
                {!owner.canSubmit ? "✓" : null}
                {owner.id === currentOwnerId ? " (You)" : null}
              </span>
            </button>
          ))}
          <div className="pt-0 lg:pt-2">
            <button
              onClick={() => setView({ type: "draft" })}
              className={`flex shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors lg:w-full ${
                view.type === "draft"
                  ? "bg-accent text-white"
                  : "text-fg-muted hover:bg-hover hover:text-fg"
              }`}
            >
              <span className="font-medium">Players to the Draft</span>
              <span className="text-[12px] opacity-70">✕</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right content area */}
      <div className="min-w-0 flex-1 overflow-visible lg:overflow-auto">
        {selectedOwner ? (
          <OwnerDetail owner={selectedOwner.owner} players={selectedOwner.players} />
        ) : view.type === "draft" ? (
          <DraftView players={draftPlayers} ownersWithPlayers={ownersWithPlayers} />
        ) : (
          <div className="flex h-full items-center justify-center text-fg-subtle">
            <p className="text-[15px]">Select a team from the list</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OwnerDetail({ owner, players }: { owner: Owner; players: PlayerWithMove[] }) {
  const submitted = !owner.canSubmit;

  const keptPlayers = submitted
    ? players.filter(
        (p) => !p.toDraft && p.action !== "cut" && p.newContract != null && p.newContract !== 0,
      )
    : players.filter((p) => !p.toDraft);
  const cutPlayers = submitted
    ? players.filter((p) => p.toDraft || p.action === "cut")
    : players.filter((p) => p.toDraft);

  return (
    <div>
      <div className="sticky top-12 z-40 -mx-4 mb-6 flex items-baseline justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur-md lg:static lg:z-auto lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-fg">
            {owner.ownerName ?? owner.name}&apos;s Team
          </h2>
          <p className="mt-0.5 text-[14px] text-fg-muted">{owner.teamName}</p>
        </div>
        <div>
          {submitted ? (
            <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[12px] font-medium text-success">
              Roster Submitted ✓
            </span>
          ) : (
            <div className="text-right text-[13px] text-fg-muted">
              <p>{owner.availableYears} years this offseason</p>
              <p>
                {owner.availableNegotiations} negotiation
                {owner.availableNegotiations !== 1 ? "s" : ""} this offseason
              </p>
            </div>
          )}
        </div>
      </div>

      {submitted && (
        <p className="mb-4 text-center text-[13px] text-fg-muted">
          The following {keptPlayers.length} players were kept by{" "}
          {owner.ownerName ?? owner.name}
        </p>
      )}

      <PlayerTable players={keptPlayers} showAction={submitted} />

      {cutPlayers.length > 0 && (
        <div className="mt-8">
          <p className="mb-4 text-center text-[13px] text-fg-muted">
            {submitted ? (
              <>
                The following players were not kept on{" "}
                {owner.ownerName ?? owner.name}&apos;s team. They will be available
                in the draft.
              </>
            ) : (
              <>
                The following players from{" "}
                {owner.ownerName ?? owner.name}&apos;s team are going to the draft.
              </>
            )}
          </p>
          <PlayerTable players={cutPlayers} showAction={submitted} isCutTable />
        </div>
      )}
    </div>
  );
}

function DraftView({
  players,
  ownersWithPlayers,
}: {
  players: Player[];
  ownersWithPlayers: { owner: Owner; players: PlayerWithMove[] }[];
}) {
  const ownerMap = new Map(ownersWithPlayers.map((o) => [o.owner.id, o.owner]));
  const draftList = players.map((p) => ({
    ...p,
    ownerName: p.ownerId ? ownerMap.get(p.ownerId)?.ownerName ?? "—" : "—",
  }));

  const thClass = "px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-fg-subtle";
  const tdClass = "px-3 py-3";

  return (
    <div>
      <h3 className="mb-4 text-[15px] font-medium text-fg">
        These players are going to the draft no matter what
      </h3>

      {/* Mobile: Card list */}
      <div className="space-y-2.5 sm:hidden">
        {draftList.map((player) => (
          <div key={player.id} className="rounded-xl border border-line bg-surface p-3">
            <div className="flex items-center gap-3">
              {player.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={player.imageUrl}
                  alt={player.playerName}
                  className="h-11 w-11 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-fg">{player.playerName}</p>
                <p className="text-[12px] text-fg-subtle">{player.nflTeam} · {player.position}</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5 text-[12px]">
              <div>
                <span className="text-fg-subtle">Owner: </span>
                <span className="font-medium text-fg-muted">{player.ownerName}</span>
              </div>
              <span className="shrink-0 text-[12px] font-medium text-danger">Expired</span>
            </div>
          </div>
        ))}
        {draftList.length === 0 && (
          <div className="rounded-xl border border-line bg-surface p-8 text-center text-[14px] text-fg-muted">
            No players in the draft pool yet.
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
              <th className={`${thClass} text-center`}>Owner</th>
              <th className={`${thClass} text-center`}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {draftList.map((player) => (
              <tr key={player.id} className="transition-colors hover:bg-hover/50">
                <td className={tdClass}>
                  {player.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={player.imageUrl}
                      alt={player.playerName}
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                  )}
                </td>
                <td className={`${tdClass} font-medium text-fg`}>{player.playerName}</td>
                <td className={`${tdClass} text-fg-muted`}>{player.nflTeam}</td>
                <td className={`${tdClass} text-fg-muted`}>{player.position}</td>
                <td className={`${tdClass} text-center text-[13px] font-medium text-fg-muted`}>
                  {player.ownerName}
                </td>
                <td className={`${tdClass} text-center`}>
                  <span className="text-[12px] font-medium text-danger">Expired</span>
                </td>
              </tr>
            ))}
            {draftList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[14px] text-fg-muted">
                  No players in the draft pool yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayerTable({
  players,
  showAction,
  isCutTable,
}: {
  players: PlayerWithMove[];
  showAction: boolean;
  isCutTable?: boolean;
}) {
  const thClass = "px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-fg-subtle";
  const tdClass = "px-3 py-3";

  return (
    <>
      {/* Mobile: Card list */}
      <div className="space-y-2.5 sm:hidden">
        {players.map((player) => (
          <div
            key={player.id}
            className={`rounded-xl border border-line bg-surface p-3 ${
              isCutTable ? "border-danger/20" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              {player.imageUrl && (
                <Image
                  src={player.imageUrl}
                  alt={player.playerName}
                  width={44}
                  height={44}
                  className="shrink-0 rounded-lg"
                  unoptimized
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-fg">{player.playerName}</p>
                <p className="text-[12px] text-fg-subtle">{player.nflTeam} · {player.position}</p>
              </div>
              {isCutTable ? (
                <span className="shrink-0 text-[12px] font-medium text-danger">
                  {player.action === "cut" ? "Cut" : "Expired"}
                </span>
              ) : showAction ? (
                <div className="flex shrink-0 items-start gap-3 text-center">
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
                </div>
              ) : (
                <div className="flex shrink-0 items-start gap-3 text-center">
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
                </div>
              )}
            </div>
            {showAction && !isCutTable && (
              <div className="mt-1.5 text-[12px] text-fg-subtle">
                Neg: {player.newNegotiationAvailable ? <span className="text-success">✓</span> : <span className="text-fg-subtle">—</span>}
              </div>
            )}
          </div>
        ))}
        {players.length === 0 && (
          <div className="rounded-xl border border-line bg-surface p-8 text-center text-[14px] text-fg-muted">
            No players.
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
              {isCutTable ? (
                <th className={`${thClass} text-center`}>Action</th>
              ) : showAction ? (
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
            {players.map((player) => (
              <tr key={player.id} className="transition-colors hover:bg-hover/50">
                <td className={tdClass}>
                  {player.imageUrl && (
                    <Image
                      src={player.imageUrl}
                      alt={player.playerName}
                      width={44}
                      height={44}
                      className="rounded-lg"
                      unoptimized
                    />
                  )}
                </td>
                <td className={`${tdClass} font-medium text-fg`}>{player.playerName}</td>
                <td className={`${tdClass} text-fg-muted`}>{player.nflTeam}</td>
                <td className={`${tdClass} text-fg-muted`}>{player.position}</td>
                {isCutTable ? (
                  <td className={`${tdClass} text-center font-medium text-danger`}>
                    {player.action === "cut" ? "Cut" : "Expired"}
                  </td>
                ) : showAction ? (
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
            {players.length === 0 && (
              <tr>
                <td colSpan={isCutTable ? 5 : showAction ? 7 : 6} className="px-4 py-8 text-center text-[14px] text-fg-muted">
                  No players.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}


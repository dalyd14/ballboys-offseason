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
    <div className="flex flex-row gap-6" style={{ minHeight: "70vh" }}>
      {/* Left sidebar: team list */}
      <div className="w-60 shrink-0 space-y-1">
        {ownersWithPlayers.map(({ owner, players }) => (
          <button
            key={owner.id}
            onClick={() => setView({ type: "owner", ownerId: owner.id })}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${
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
        <div className="pt-2">
          <button
            onClick={() => setView({ type: "draft" })}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${
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

      {/* Right content area */}
      <div className="flex-1 overflow-auto">
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
    : players;
  const cutPlayers = submitted
    ? players.filter((p) => p.toDraft || p.action === "cut")
    : [];

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
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

      {submitted && cutPlayers.length > 0 && (
        <div className="mt-8">
          <p className="mb-4 text-center text-[13px] text-fg-muted">
            The following players were not kept on{" "}
            {owner.ownerName ?? owner.name}&apos;s team. They will be available
            in the draft.
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
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-elevated/50">
            <tr>
              <th className={thClass}></th>
              <th className={thClass}>Player</th>
              <th className={thClass}>NFL Team</th>
              <th className={thClass}>Position</th>
              <th className={`${thClass} text-center`}>Owner</th>
              <th className={`${thClass} text-center`}>Contract</th>
              <th className={`${thClass} text-center`}>Negotiation?</th>
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
                <td className={`${tdClass} text-center text-[13px] font-bold text-fg`}>
                  {player.contractYears == null ? "" : player.contractYears}
                </td>
                <td className={`${tdClass} text-center`}>
                  {player.negotiationAvailable ? (
                    <span className="text-success">✓</span>
                  ) : (
                    <span className="text-fg-subtle">—</span>
                  )}
                </td>
              </tr>
            ))}
            {draftList.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[14px] text-fg-muted">
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
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
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
    );
  }


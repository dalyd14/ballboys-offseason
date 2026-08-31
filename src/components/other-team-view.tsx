"use client";

import Image from "next/image";
import { useState } from "react";
import type { Player, Owner } from "@/lib/types";

interface OtherTeamViewProps {
  ownersWithPlayers: { owner: Owner; players: Player[] }[];
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
    <div className="flex flex-row gap-4" style={{ minHeight: "70vh" }}>
      {/* Left sidebar: team list */}
      <div className="w-64 shrink-0 space-y-2">
        {ownersWithPlayers.map(({ owner, players }) => (
          <button
            key={owner.id}
            onClick={() => setView({ type: "owner", ownerId: owner.id })}
            className={`flex w-full items-center justify-between rounded-md px-4 py-3 text-left transition ${
              view.type === "owner" && view.ownerId === owner.id
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="font-medium">
              {owner.ownerName ?? owner.name}
            </span>
            <span>
              {!owner.canSubmit ? "✔️" : null}
              {owner.id === currentOwnerId ? " (You)" : null}
            </span>
          </button>
        ))}
        <button
          onClick={() => setView({ type: "draft" })}
          className={`flex w-full items-center justify-between rounded-md px-4 py-3 text-left transition ${
            view.type === "draft"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="font-medium">Players to the Draft</span>
          <span>❌</span>
        </button>
      </div>

      {/* Right content area */}
      <div className="flex-1 overflow-auto">
        {selectedOwner ? (
          <OwnerDetail
            owner={selectedOwner.owner}
            players={selectedOwner.players}
          />
        ) : view.type === "draft" ? (
          <DraftView players={draftPlayers} ownersWithPlayers={ownersWithPlayers} />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <p className="text-lg">👈 Select a team from the list</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OwnerDetail({ owner, players }: { owner: Owner; players: Player[] }) {
  const submitted = !owner.canSubmit;

  // If submitted, split into kept and cut players.
  const keptPlayers = submitted
    ? players.filter((p) => p.toDraft === false)
    : players;
  const cutPlayers = submitted
    ? players.filter((p) => p.toDraft === true)
    : [];

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {owner.ownerName ?? owner.name}&apos;s Team
          </h2>
          <p className="text-gray-600">{owner.teamName}</p>
        </div>
        <div>
          {submitted ? (
            <span className="rounded-md bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              Roster Submitted ✔️
            </span>
          ) : (
            <div className="text-right text-sm text-gray-600">
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
        <p className="mb-4 text-center text-gray-600">
          The following {keptPlayers.length} players were kept by{" "}
          {owner.ownerName ?? owner.name}
        </p>
      )}

      <PlayerTable players={keptPlayers} showAction={submitted} />

      {submitted && cutPlayers.length > 0 && (
        <div className="mt-8">
          <p className="mb-4 text-center text-gray-600">
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
  ownersWithPlayers: { owner: Owner; players: Player[] }[];
}) {
  // For draft view, we show players whose contract is 0 and negotiation is false,
  // OR explicitly flagged to_draft. Match the old logic.
  const ownerMap = new Map(ownersWithPlayers.map((o) => [o.owner.id, o.owner]));
  const draftList = players.map((p) => ({
    ...p,
    ownerName: p.ownerId ? ownerMap.get(p.ownerId)?.ownerName ?? "-" : "-",
  }));

  return (
    <div>
      <h3 className="mb-4 text-lg font-medium">
        These players are going to the draft no matter what
      </h3>
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3"></th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Player</th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">NFL Team</th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Position</th>
              <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Owner</th>
              <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Contract</th>
              <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Negotiation?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {draftList.map((player) => (
              <tr key={player.id} className="hover:bg-gray-50">
                <td className="px-3 py-3">
                  {player.imageUrl && (
                    <Image
                      src={player.imageUrl}
                      alt={player.playerName}
                      width={70}
                      height={70}
                      className="rounded"
                      unoptimized
                    />
                  )}
                </td>
                <td className="px-3 py-3 font-medium">{player.playerName}</td>
                <td className="px-3 py-3 text-gray-600">{player.nflTeam}</td>
                <td className="px-3 py-3 text-gray-600">{player.position}</td>
                <td className="px-3 py-3 text-center text-sm font-medium">
                  {player.ownerName}
                </td>
                <td className="px-3 py-3 text-center text-sm font-bold">
                  {player.contractYears == null ? "" : player.contractYears}
                </td>
                <td className="px-3 py-3 text-center text-xl">
                  {player.negotiationAvailable ? "✅" : "❌"}
                </td>
              </tr>
            ))}
            {draftList.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
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
  players: Player[];
  showAction: boolean;
  isCutTable?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3"></th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Player</th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">NFL Team</th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Position</th>
            {isCutTable ? (
              <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Action</th>
            ) : showAction ? (
              <>
                <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Contract</th>
                <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Negotiation?</th>
              </>
            ) : (
              <>
                <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Contract</th>
                <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Negotiation?</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {players.map((player) => (
            <tr key={player.id} className="hover:bg-gray-50">
              <td className="px-3 py-3">
                {player.imageUrl && (
                  <Image
                    src={player.imageUrl}
                    alt={player.playerName}
                    width={showAction ? 70 : 100}
                    height={showAction ? 70 : 100}
                    className="rounded"
                    unoptimized
                  />
                )}
              </td>
              <td className="px-3 py-3 font-medium">{player.playerName}</td>
              <td className="px-3 py-3 text-gray-600">{player.nflTeam}</td>
              <td className="px-3 py-3 text-gray-600">{player.position}</td>
              {isCutTable ? (
                <td className="px-3 py-3 text-center font-bold">Cut</td>
              ) : (
                <>
                  <td className="px-3 py-3 text-center text-2xl font-bold">
                    {player.contractYears == null ? "" : player.contractYears}
                  </td>
                  <td className="px-3 py-3 text-center text-2xl">
                    {player.negotiationAvailable ? "✅" : "❌"}
                  </td>
                </>
              )}
            </tr>
          ))}
          {players.length === 0 && (
            <tr>
              <td colSpan={isCutTable ? 5 : 6} className="px-4 py-8 text-center text-gray-500">
                No players.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

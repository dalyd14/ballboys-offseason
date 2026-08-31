import Image from "next/image";
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
  // If roster submitted, only show kept players (those with a contract).
  const shownPlayers = rosterSubmitted
    ? players.filter(
        (p) => p.newContract != null && p.newContract !== 0,
      )
    : players;

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold">{ownerName}&apos;s Team</h1>
          <p className="text-gray-600">{teamName}</p>
        </div>
        <div>
          {rosterSubmitted ? (
            <span className="rounded-md bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              Roster Submitted ✔️
            </span>
          ) : (
            <span className="rounded-md bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
              Roster not submitted yet...
            </span>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500"></th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Player</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">NFL Team</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Position</th>
              {rosterSubmitted ? (
                <>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Action</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">New Contract</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Negotiation?</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Contract</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Negotiation?</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {shownPlayers.map((player) => (
              <tr key={player.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
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
                <td className="px-4 py-3 font-medium">{player.playerName}</td>
                <td className="px-4 py-3 text-gray-600">{player.nflTeam}</td>
                <td className="px-4 py-3 text-gray-600">{player.position}</td>
                {rosterSubmitted ? (
                  <>
                    <td className="px-4 py-3 text-center font-medium">
                      {player.action === "nothing"
                        ? "Carry Over"
                        : player.action === "sign"
                          ? "Signed"
                          : player.action === "renegotiate"
                            ? "Renegotiated"
                            : player.action === "cut"
                              ? "Cut"
                              : "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-2xl font-bold">
                      {player.newContract == null || player.newContract === 0
                        ? ""
                        : player.newContract}
                    </td>
                    <td className="px-4 py-3 text-center text-2xl">
                      {player.newNegotiationAvailable ? "✅" : "❌"}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-center text-2xl font-bold">
                      {player.contractYears == null ? "" : player.contractYears}
                    </td>
                    <td className="px-4 py-3 text-center text-2xl">
                      {player.negotiationAvailable ? "✅" : "❌"}
                    </td>
                  </>
                )}
              </tr>
            ))}
            {shownPlayers.length === 0 && (
              <tr>
                <td colSpan={rosterSubmitted ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
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

import { getSeasons, getOwners, getPlayersBySeason } from "@/lib/data";
import { OffseasonWorkflow } from "./offseason-workflow";
import {
  createSeasonAction,
  updateSeasonStatusAction,
  rolloverSeasonAction,
  importEspnHtmlAction,
  updateOwnerBudgetAction,
  updateOwnerLockAction,
  resolveExceptionAction,
  markPlayerCutDuringSeasonAction,
} from "../actions";
import type { Owner, Season, Player } from "@/lib/types";

interface SeasonChecklistData {
  season: Season;
  players: Player[];
  playerCount: number;
  exceptionCount: number;
  draftPoolCount: number;
  submittedCount: number;
  exceptions: {
    id: string;
    playerName: string;
    nflTeam: string;
    position: string;
    ownerName: string;
    contractYearsAtCut: number | null;
    ownerId: string | null;
  }[];
  draftCandidates: {
    id: string;
    playerName: string;
    nflTeam: string;
    position: string;
    ownerName: string;
  }[];
}

export default async function AdminOffseasonPage() {
  const [seasons, owners] = await Promise.all([
    getSeasons(),
    getOwners(),
  ]);

  const ownerMap = new Map<string, Owner>(owners.map((o) => [o.id, o]));

  // Load player data for each season to compute checklist state.
  const seasonData: SeasonChecklistData[] = await Promise.all(
    seasons.map(async (season) => {
      const allPlayers = await getPlayersBySeason(season.id);

      return {
        season,
        players: allPlayers,
        playerCount: allPlayers.length,
        exceptionCount: allPlayers.filter((p) => p.cutDuringSeason).length,
        draftPoolCount: allPlayers.filter((p) => p.toDraft).length,
        submittedCount: owners.filter((o) => o.rosterSubmitted).length,
        exceptions: allPlayers
          .filter((p) => p.cutDuringSeason)
          .map((p) => ({
            id: p.id,
            playerName: p.playerName,
            nflTeam: p.nflTeam,
            position: p.position,
            ownerName: p.ownerId ? ownerMap.get(p.ownerId)?.ownerName ?? "—" : "—",
            contractYearsAtCut: p.contractYearsAtCut,
            ownerId: p.ownerId,
          })),
        draftCandidates: allPlayers
          .filter((p) => p.contractYears === 0 && !p.negotiationAvailable && !p.toDraft)
          .map((p) => ({
            id: p.id,
            playerName: p.playerName,
            nflTeam: p.nflTeam,
            position: p.position,
            ownerName: p.ownerId ? ownerMap.get(p.ownerId)?.ownerName ?? "—" : "—",
          })),
      };
    }),
  );

  return (
    <OffseasonWorkflow
      seasonData={seasonData}
      owners={owners.map((o) => ({
        id: o.id,
        ownerName: o.ownerName ?? o.name,
        teamName: o.teamName ?? "",
        email: o.email,
        availableYears: o.availableYears,
        availableNegotiations: o.availableNegotiations,
        canSubmit: o.canSubmit,
        rosterSubmitted: o.rosterSubmitted,
      }))}
      ownerTeamMap={owners.map((o) => ({
        ownerId: o.id,
        teamName: o.teamName ?? "",
        ownerName: o.ownerName ?? o.name,
      }))}
      ownerOptions={owners.map((o) => ({ id: o.id, name: o.ownerName ?? o.name }))}
      createAction={createSeasonAction}
      updateStatusAction={updateSeasonStatusAction}
      rolloverAction={rolloverSeasonAction}
      importAction={importEspnHtmlAction}
      updateBudgetAction={updateOwnerBudgetAction}
      updateLockAction={updateOwnerLockAction}
      resolveExceptionAction={resolveExceptionAction}
      markCutAction={markPlayerCutDuringSeasonAction}
    />
  );
}

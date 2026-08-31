import type { ParsedEspnPlayer, ParseEspnResult } from "@/lib/types";

/**
 * ============================================================
 * ESPN Fantasy Football Roster HTML Parser
 * ============================================================
 *
 * Parses an exported ESPN "League Roster" HTML page. The page
 * contains ALL teams, each in a .roster-container with a table
 * of player rows. The team name is in <span class="teamName">.
 *
 * Per-row structure (from real ESPN export):
 *   <tr class="Table__TR Table__TR--sm Table__odd">
 *     <td> SLOT:  <div title="Quarterback">QB</div>  (or Bench, Flex, etc.)
 *     <td> PLAYER: <div title="Trevor Lawrence" aria-label="...">
 *            <img src="https://a.espncdn.com/.../headshots/nfl/players/full/4360310.png...">
 *            <a>Trevor Lawrence</a>
 *            <span class="playerinfo__playerteam">JAX</span>
 *            <span class="playerinfo__playerpos ttu">QB</span>
 *        For D/ST: <img src=".../teamlogos/nfl/500/jax.png...">, name="Jaguars D/ST"
 *        For FA players: playerteam = "FA"
 *     <td> ACQ:   <div>Draft</div>  (or Free Agency, Trade, Waivers, etc.)
 *
 * Extracts: playerName, nflTeam, position, imageUrl, espnPlayerId
 * ============================================================
 */

/** A parsed team with its players. */
export interface ParsedEspnTeam {
  teamName: string;
  players: ParsedEspnPlayer[];
}

/** Result of parsing the full ESPN HTML (all teams). */
export interface ParseEspnFullResult {
  teams: ParsedEspnTeam[];
  errors: string[];
}

/**
 * Parse a full ESPN League Roster HTML export.
 * Returns all teams and their players.
 */
export function parseEspnHtmlFull(html: string): ParseEspnFullResult {
  const teams: ParsedEspnTeam[] = [];
  const errors: string[] = [];

  try {
    // Find all team name spans with their positions.
    const teamNameRegex =
      /<span title="([^"]+)" class="teamName[^"]*">[^<]+<\/span>/g;
    const nameMatches = [...html.matchAll(teamNameRegex)];

    if (nameMatches.length === 0) {
      return {
        teams: [],
        errors: ["No team names found in the HTML."],
      };
    }

    for (let i = 0; i < nameMatches.length; i++) {
      const teamName = nameMatches[i][1];
      const startPos = nameMatches[i].index!;
      // Grab from this team name to the next team name (or end of html).
      const endPos =
        i + 1 < nameMatches.length
          ? nameMatches[i + 1].index!
          : html.length;
      const block = html.slice(startPos, endPos);
      const players = extractPlayersFromBlock(block);
      if (players.length > 0) {
        teams.push({ teamName, players });
      }
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "Failed to parse HTML");
  }

  if (teams.length === 0) {
    errors.push(
      "No teams found. Verify the HTML is an ESPN League Roster export.",
    );
  }

  return { teams, errors };
}

function extractPlayersFromBlock(block: string): ParsedEspnPlayer[] {
  const players: ParsedEspnPlayer[] = [];
  const rowRegex =
    /<tr class="Table__TR Table__TR--sm Table__odd"[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = [...block.matchAll(rowRegex)];

  for (const rowMatch of rows) {
    const player = parsePlayerRow(rowMatch[1]);
    if (player) players.push(player);
  }

  // Deduplicate by name.
  const seen = new Set<string>();
  return players.filter((p) => {
    const key = p.playerName.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Parse a single <tr> player row.
 */
function parsePlayerRow(rowHtml: string): ParsedEspnPlayer | null {
  // Extract the player name from the title attribute on the player column div.
  const nameMatch = rowHtml.match(
    /<div title="([^"]+)"[^>]*aria-label="[^"]*"[^>]*class="[^"]*player__column[^"]*"/,
  );
  if (!nameMatch) return null;
  const playerName = nameMatch[1].trim();

  // Extract the headshot/team-logo image URL.
  const imgMatch = rowHtml.match(
    /<img[^>]*src="(https:\/\/a\.espncdn\.com\/combiner\/i\?img=[^"]*)"/,
  );
  const imageUrl = imgMatch?.[1] ?? null;

  // Extract ESPN player ID from headshot URL (not present for D/ST).
  let espnPlayerId: string | null = null;
  if (imageUrl) {
    const idMatch = imageUrl.match(/\/players\/full\/(\d+)\.png/i);
    espnPlayerId = idMatch?.[1] ?? null;
  }

  // Extract NFL team abbreviation from playerinfo__playerteam span.
  const teamMatch = rowHtml.match(
    /<span class="playerinfo__playerteam">([^<]+)<\/span>/,
  );
  const nflTeam = teamMatch?.[1].trim() ?? "FA";

  // Extract position from playerinfo__playerpos span.
  const posMatch = rowHtml.match(
    /<span class="playerinfo__playerpos ttu">([^<]+)<\/span>/,
  );
  const position = posMatch?.[1].trim() ?? "—";

  return {
    playerName,
    nflTeam,
    position,
    imageUrl,
    espnPlayerId,
  };
}

/**
 * Parse ESPN roster HTML into a flat list of players (legacy single-team).
 * Use parseEspnHtmlFull for the full league export.
 */
export function parseEspnHtml(html: string): ParseEspnResult {
  const { teams, errors } = parseEspnHtmlFull(html);
  const allPlayers = teams.flatMap((t) => t.players);

  // Deduplicate across teams.
  const seen = new Set<string>();
  const unique = allPlayers.filter((p) => {
    const key = p.playerName.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (unique.length === 0 && errors.length > 0) {
    return { players: [], errors };
  }

  return { players: unique, errors: [] };
}

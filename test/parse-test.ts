import { parseEspnHtmlFull } from "../src/lib/espn-parser";
import { readFileSync } from "fs";
import { join } from "path";

const html = readFileSync(join(__dirname, "espn-sample.html"), "utf-8");
const result = parseEspnHtmlFull(html);

console.log(`Parsed ${result.teams.length} team(s)`);
if (result.errors.length > 0) {
  console.log("Errors:", result.errors);
}
for (const team of result.teams) {
  console.log(`\n=== ${team.teamName} (${team.players.length} players) ===`);
  for (const p of team.players) {
    console.log(`  ${p.playerName} | ${p.nflTeam} | ${p.position} | id:${p.espnPlayerId ?? "-"} | ${p.imageUrl ? "img" : "no-img"}`);
  }
}

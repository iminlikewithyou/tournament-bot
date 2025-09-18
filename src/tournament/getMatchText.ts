import { getPlayerIdentity } from "../models/Participant.js";
import { Match } from "../types/Match.js";
import { toDate, toDiscordTimestamp } from "../utils/toDate.js";

export async function getMatchText(match: Match) {
  const {
    dictionary,
    gameMode,
    generationType,
    players,
    serverType,
    startTime,
    status,
  } = match;

  const startDate = toDate(startTime);

  let matchText =
    `- [${toDiscordTimestamp(startDate)}] • ${players.length} players\n` +
    `  - 📖 ${dictionary} • 🕹️ ${gameMode} • ✏️ ${generationType}\n` +
    `  - 🖥️ **Server type:** ${serverType} • 📊 **Status:** ${status}`;

  if (status === "completed") {
    const winnerRobloxId = players.find((player) => player.position === 1);
    const winnerIdentity = await getPlayerIdentity(winnerRobloxId?.id);
    matchText += `\n  - 🏆 **Winner**: ${winnerIdentity}`;
  }

  const playerTexts: string[] = [];
  if (status === "completed") players.sort((a, b) => a.position - b.position);
  for (const player of players) {
    if ("position" in player) {
      playerTexts.push(
        `**[${player.position}]** ${await getPlayerIdentity(player.id)}`
      );
    } else {
      playerTexts.push(`**[•]** ${await getPlayerIdentity(player.id)}`);
    }
  }
  const playerList = playerTexts.join(" ");
  matchText += `\n  - ${playerList}`;

  return matchText;
}

import { TextChannel } from "discord.js";
import { config } from "../config.js";
import { getMatchDetails } from "../tournament/getMatchDetails.js";
import { getMatchText } from "../tournament/getMatchText.js";
import { CompletedMatch, OngoingMatch } from "../types/Match.js";
import { client } from "./client.js";
import { sendFeed, sendLog } from "./sendLog.js";

export async function logGameCreated(match: OngoingMatch) {
  const { participants, participantsPlayingWrongMatch, ignore, invalid } =
    await getMatchDetails(match);

  if (ignore) return;

  const saves = [];

  if (invalid) {
    for (const participant of participantsPlayingWrongMatch) {
      participant.status = "wrong match";
      participant.joinCode = match.joinCode;
      saves.push(participant.save());
    }
    const wrongMentions = participantsPlayingWrongMatch
      .map((participant) => `<@${participant.discordId}>`)
      .join(", ");
    sendLog({
      content:
        `${wrongMentions} ${
          participantsPlayingWrongMatch.length === 1 ? "is" : "are"
        } playing the wrong match. ${invalid}\n` + (await getMatchText(match)),
    });
    await Promise.all(saves);
    return;
  }

  for (const participant of participants) {
    if (
      participant.status === "lost match" ||
      participant.status === "won match"
    ) {
      continue;
    }
    participant.status = "in match";
    participant.joinCode = match.joinCode;
    saves.push(participant.save());
  }

  const mentions = participants
    .map((participant) => `<@${participant.discordId}>`)
    .join(", ");

  sendLog({
    content: `${mentions} ${
      participants.length === 1 ? "has" : "have"
    } started their match.`,
  });

  await Promise.all(saves);
}

export async function logGameCompleted(match: CompletedMatch) {
  const { participants, ignore, invalid } = await getMatchDetails(match);

  if (ignore || invalid) return;

  const saves = [];

  for (const participant of participants) {
    if (
      participant.status === "lost match" ||
      participant.status === "won match"
    ) {
      continue;
    }

    const matchPlayer = match.players.find(
      (player) => player.id === participant.robloxId
    );
    if (!matchPlayer) continue;

    if (matchPlayer.position === 1) {
      participant.status = "won match";
    } else {
      participant.status = "lost match";
    }
    participant.joinCode = undefined;

    saves.push(participant.save());
  }

  const mentions = participants
    .map((participant) => `<@${participant.discordId}>`)
    .join(", ");

  const winners = match.players
    .filter((player) => player.position === 1)
    .map(
      (player) =>
        `<@${
          participants.find((participant) => participant.robloxId === player.id)
            ?.discordId
        }>`
    )
    .join(", ");
  const losers = match.players
    .filter((player) => player.position !== 1)
    .map(
      (player) =>
        `<@${
          participants.find((participant) => participant.robloxId === player.id)
            ?.discordId
        }>`
    )
    .join(", ");

  sendLog({
    content:
      `${mentions} ${
        participants.length === 1 ? "has" : "have"
      } completed their match.\n` + (await getMatchText(match)),
  });
  sendFeed({
    content: `- 🏆 ${winners} has won their match against ${losers}!`,
  });

  await Promise.all(saves);
}

import { TextChannel } from "discord.js";
import { config } from "../config.js";
import { getMatchDetails } from "../tournament/getMatchDetails.js";
import { getMatchText } from "../tournament/getMatchText.js";
import { CompletedMatch, OngoingMatch } from "../types/Match.js";
import { client } from "./client.js";
import { sendLog } from "./sendLog.js";

export async function logGameCreated(match: OngoingMatch) {
  const { participants, participantsPlayingWrongMatch, ignore, invalid } =
    await getMatchDetails(match);

  if (ignore) return;

  if (invalid) {
    for (const participant of participantsPlayingWrongMatch) {
      participant.status = "wrong match";
      await participant.save();
    }
    const wrongMentions = participantsPlayingWrongMatch
      .map((participant) => `<@${participant.discordId}>`)
      .join(", ");
    (
      client.channels.cache.get(config.discord.gameLogChannel) as TextChannel
    ).send({
      content:
        `${wrongMentions} ${
          participantsPlayingWrongMatch.length === 1 ? "is" : "are"
        } playing the wrong match. ${invalid}\n` + (await getMatchText(match)),
    });
    return;
  }

  for (const participant of participants) {
    if (
      participant.status === "eliminated" ||
      participant.status === "won match"
    ) {
      continue;
    }
    participant.status = "in match";
    participant.save();
  }

  const mentions = participants
    .map((participant) => `<@${participant.discordId}>`)
    .join(", ");

  sendLog({
    content: `${mentions} ${
      participants.length === 1 ? "has" : "have"
    } started their match.`,
  });
}

export async function logGameCompleted(match: CompletedMatch) {
  const { participants, ignore, invalid } = await getMatchDetails(match);

  if (ignore || invalid) return;

  for (const participant of participants) {
    if (
      participant.status === "eliminated" ||
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
      participant.status = "eliminated";
    }

    await participant.save();
  }

  const mentions = participants
    .map((participant) => `<@${participant.discordId}>`)
    .join(", ");

  sendLog({
    content:
      `${mentions} ${
        participants.length === 1 ? "has" : "have"
      } completed their match.\n` + (await getMatchText(match)),
  });
}

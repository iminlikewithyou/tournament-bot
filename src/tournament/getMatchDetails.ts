import Participant from "../models/Participant.js";
import { Match } from "../types/Match.js";

export async function getMatchDetails(match: Match) {
  const participants = await Participant.find({
    robloxId: { $in: match.players.map((player) => player.id) },
  });

  const participantsPlayingWrongMatch = participants.filter(
    (participant) =>
      participant.status !== "won match" && participant.status !== "eliminated"
  );

  const result = {
    participants,
    participantsPlayingWrongMatch,
    ignore: participants.length === 0,
    allPlayersAreParticipants: participants.length === match.players.length,
    invalid: undefined as string | undefined,
  };

  if (result.ignore) return result;

  if (!result.allPlayersAreParticipants) {
    result.invalid =
      "Some players in the match are not tournament participants.";
    return result;
  }
  if (match.dictionary !== "english") {
    result.invalid = "Dictionary is not English.";
    return result;
  }
  if (match.gameMode !== "default") {
    result.invalid = "Game mode is not Default.";
    return result;
  }
  if (match.generationType !== "waterfall") {
    result.invalid = "Generation type is not Waterfall.";
    return result;
  }
  if (match.players.length !== 2) {
    result.invalid = "Match is not a 1v1.";
    return result;
  }
  if (match.serverType !== "reserved") {
    result.invalid = "Match is not in a reserved server.";
    return result;
  }

  return result;
}

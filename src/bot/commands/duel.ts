import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import Participant from "../../models/Participant.js";
import { getParticipantPairCode } from "../../models/ParticipantPair.js";
import { getTournamentHostRobloxIds } from "../../models/TournamentHost.js";
import { createGameLink } from "../utils/gameLink.js";

export const data = new SlashCommandBuilder()
  .setName("duel")
  .setDescription(
    "Duel another player! This will let you join a server between you and the other participant."
  )
  .addUserOption((option) =>
    option
      .setName("participant")
      .setDescription("The participant to duel")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const user = interaction.options.getUser("participant", true);
  const [dueler, duelee, hosts] = await Promise.all([
    Participant.findOne({ discordId: interaction.user.id }),
    Participant.findOne({ discordId: user.id }),
    getTournamentHostRobloxIds(),
  ]);
  if (!dueler) {
    interaction.editReply({
      content: `You are not participating in the tournament.`,
    });
    return;
  }
  if (!duelee) {
    interaction.editReply({
      content: `<@${user.id}> is not participating in the tournament.`,
    });
    return;
  }

  const code = await getParticipantPairCode(dueler.discordId, duelee.discordId);
  const players = [dueler.robloxId, duelee.robloxId];

  const duelLink = createGameLink({
    id: code,
    hosts,
    players,
    speakers: [...hosts, ...players],
    // startAmount: players.length.toString(),
  });

  interaction.editReply({
    content: `[Click this link to join a reserved server](${duelLink}) which will host the duel between you and <@${duelee.discordId}>.`,
  });
}

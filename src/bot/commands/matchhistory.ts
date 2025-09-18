import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { config } from "../../config.js";
import Participant from "../../models/Participant.js";
import { Match } from "../../types/Match.js";
import { getMatchText } from "../../tournament/getMatchText.js";
import { sendLog } from "../sendLog.js";

export const data = new SlashCommandBuilder()
  .setName("matchhistory")
  .setDescription("Get the match history of a participant")
  .addUserOption((option) =>
    option
      .setName("participant")
      .setDescription("The participant to get the match history of")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const user = interaction.options.getUser("participant", true);
  const participant = await Participant.findOne({
    discordId: user.id,
  }).lean();

  if (!participant) {
    interaction.editReply({
      content: `<@${user.id}> is not a participant in the tournament.`,
    });
    return;
  }

  const robloxId = participant.robloxId;
  const matchesResponse = await fetch(
    `${config.omg.apiUrl}/v1/wb/players/${robloxId}/matches?limit=5`,
    {
      headers: {
        Authorization: config.omg.apiToken,
      },
    }
  );

  const matchesResult = await matchesResponse.json();
  if (matchesResult.status !== "success") {
    interaction.editReply({
      content: matchesResult.message,
    });
    return;
  }
  const matches = matchesResult.data as Match[];

  const matchTexts: string[] = [];
  for (const match of matches) {
    matchTexts.push(await getMatchText(match));
  }

  const finalText = matchTexts.join("\n");
  interaction.editReply({
    content: finalText,
  });
  sendLog({
    content: `<@${interaction.user.id}> requested <@${user.id}>'s match history.`,
    flags: MessageFlags.SuppressNotifications,
  });
}

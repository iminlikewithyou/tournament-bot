import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import Participant, { ParticipantStatus } from "../../models/Participant.js";
import { client } from "../client.js";

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Retrieve and modify participant statuses")
  .addSubcommand((subcommand) =>
    subcommand.setName("list").setDescription("List all participants' status")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("set")
      .setDescription("Set a participant's status manually")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("The user to set the status of")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("status")
          .setDescription("The status to set")
          .setChoices([
            { name: "not started", value: "not started" },
            { name: "won match", value: "won match" },
            { name: "eliminated", value: "eliminated" },
          ])
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("resetall")
      .setDescription(
        'Clear eliminated players from the participant list, and reset all players to "not started"'
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const subcommand = interaction.options.getSubcommand(true);
  if (subcommand === "list") {
    await statusList(interaction);
  } else if (subcommand === "set") {
    await statusSet(interaction);
  } else if (subcommand === "resetall") {
    await statusResetAll(interaction);
  }
}

async function statusList(interaction: ChatInputCommandInteraction) {
  const participants = await Participant.find({});
  participants.sort((a, b) => a.status.localeCompare(b.status));
  interaction.editReply({
    content:
      participants
        .map((participant) => {
          const discordNameDisplay = `<@${participant.discordId}>`;
          const robloxNameDisplay = `\\@${participant.robloxUsername}`;
          return `**${participant.status}** • ${discordNameDisplay} | ${robloxNameDisplay}`;
        })
        .join("\n") || "No participants.",
  });
}

async function statusSet(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user", true);
  const status = interaction.options.getString("status", true);
  const participant = await Participant.findOne({
    discordId: user.id,
  });
  if (!participant) {
    interaction.editReply({
      content: `<@${user.id}> is not a participant in the tournament.`,
    });
    return;
  }
  participant.status = status as ParticipantStatus;
  participant
    .save()
    .then(() => {
      interaction.editReply({
        content: `Set <@${user.id}>'s status to \"${status}\".`,
      });
    })
    .catch(() => {
      interaction.editReply({
        content: `Failed to set the participant's status.`,
      });
    });
}

async function statusResetAll(interaction: ChatInputCommandInteraction) {
  const deleteResult = await Participant.deleteMany({
    status: "eliminated",
  });
  const updateResult = await Participant.updateMany(
    {},
    {
      status: "not started",
    }
  );
  interaction.editReply({
    content: `Cleared ${deleteResult.deletedCount} eliminated ${
      deleteResult.deletedCount === 1 ? "player" : "players"
    } from the tournament, and reset ${updateResult.modifiedCount} ${
      updateResult.modifiedCount === 1 ? "participants" : "participants"
    } to the status \"not started\"`,
  });
}

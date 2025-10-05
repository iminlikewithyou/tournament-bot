import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { config } from "../../config.js";
import Participant, {
  IParticipant,
  ParticipantStatus,
  StatusEmoji,
} from "../../models/Participant.js";
import { SavedMessageManager } from "../../models/SavedMessage.js";
import { sendLog } from "../sendLog.js";
import { getParticipantMentionDisplay } from "../utils/members.js";
import { createGameLink } from "../utils/gameLink.js";

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
            { name: "lost match", value: "lost match" },
          ])
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("reset")
      .setDescription(
        'Resets all players\' status to "not started". »» Make sure to remove any eliminated players first! ««'
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const subcommand = interaction.options.getSubcommand(true);
  if (subcommand === "list") {
    await statusList(interaction);
  } else if (subcommand === "set") {
    await statusSet(interaction);
  } else if (subcommand === "reset") {
    await statusReset(interaction);
  }
}

export async function getStatusList() {
  const participants = await Participant.find({});

  const statusOrder = Object.keys(StatusEmoji);
  const participantsByStatus = Object.entries(
    participants.reduce((acc, participant) => {
      const status = participant.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(participant);
      return acc;
    }, {} as Record<string, IParticipant[]>)
  ).sort(([a], [b]) => statusOrder.indexOf(a) - statusOrder.indexOf(b));

  return (
    participantsByStatus
      .map(([status, participants]) => {
        const participantList =
          participants
            .map((participant) => {
              const display = `**${status}** • ${getParticipantMentionDisplay(
                participant.discordId,
                participant.robloxUsername
              )}`;
              const joinLink = participant.joinCode
                ? ` • [Join](${createGameLink({ id: participant.joinCode })})`
                : "";
              return display + joinLink;
            })
            .join("\n") || "No participants yet.";
        return (
          `## ${StatusEmoji[status as ParticipantStatus]} ${status}\n` +
          participantList
        );
      })
      .join("\n") || "No participants yet."
  );
}

export async function updateStatusList() {
  SavedMessageManager.update("statusList", config.discord.statusChannel, {
    content: await getStatusList(),
  });
}

async function statusList(interaction: ChatInputCommandInteraction) {
  interaction.editReply({
    content: await getStatusList(),
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
      sendLog({
        content: `<@${interaction.user.id}> manually set <@${user.id}>'s status to \"${status}\".`,
      });
    })
    .catch(() => {
      interaction.editReply({
        content: `Failed to set the participant's status.`,
      });
    });
}

async function statusReset(interaction: ChatInputCommandInteraction) {
  // const deleteResult = await Participant.deleteMany({
  //   status: "eliminated",
  // });
  const updateResult = await Participant.updateMany(
    {},
    {
      status: "not started",
    }
  );
  interaction.editReply({
    content: `Reset ${updateResult.modifiedCount} ${
      updateResult.modifiedCount === 1 ? "participant" : "participants"
    } to the status \"not started\".`,
  });
  sendLog({
    content: `<@${interaction.user.id}> reset ${updateResult.modifiedCount} ${
      updateResult.modifiedCount === 1 ? "participant" : "participants"
    } to the status \"not started\".`,
  });
}

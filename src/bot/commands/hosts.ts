import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { getUser } from "../../api/roblox/UsersV1.js";
import Participant from "../../models/Participant.js";
import { client } from "../client.js";
import { sendLog } from "../sendLog.js";
import { getParticipantDisplayName } from "../utils/members.js";
import { TournamentHost } from "../../models/TournamentHost.js";
import { discordToRoblox } from "../../api/bloxlink/discordToRoblox.js";

export const data = new SlashCommandBuilder()
  .setName("hosts")
  .setDescription(
    "Retrieve and modify hosts. Hosts can run Word Bomb commands and speak in servers."
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("list").setDescription("List all the hosts")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("add")
      .setDescription("Add a new host for the tournament")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("The user to add")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("remove")
      .setDescription("Remove a host from the tournament")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("The user to remove")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("clear")
      .setDescription("Clear all hosts from the tournament")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const subcommand = interaction.options.getSubcommand(true);
  if (subcommand === "clear") {
    await hostsClear(interaction);
  } else if (subcommand === "list") {
    await hostsList(interaction);
  } else if (subcommand === "add") {
    await hostsAdd(interaction);
  } else if (subcommand === "remove") {
    await hostsRemove(interaction);
  }
}

async function hostsClear(interaction: ChatInputCommandInteraction) {
  await TournamentHost.deleteMany({});

  interaction.editReply({
    content: "Cleared all hosts from the tournament.",
  });

  sendLog({
    content: `<@${interaction.user.id}> cleared all hosts from the tournament.`,
  });
}

async function hostsList(interaction: ChatInputCommandInteraction) {
  const participants = await TournamentHost.find({});
  interaction.editReply({
    content:
      participants
        .map((participant) => `<@${participant.discordId}>`)
        .join(" ") || "No hosts.",
  });
}

async function hostsAdd(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user", true);

  const discordToRobloxResponse = await discordToRoblox(interaction.user.id);
  if (discordToRobloxResponse.status === "apiError") {
    interaction.editReply({
      content: `There was an error getting that user's Roblox account details.\n${discordToRobloxResponse.message}`,
    });
    return;
  } else if (discordToRobloxResponse.status === "notFound") {
    interaction.editReply({
      content: `That Discord account doesn't have Bloxlink set up!`,
    });
    return;
  }

  const robloxId = discordToRobloxResponse.data;
  const robloxUser = await getUser(robloxId);
  if (!robloxUser) {
    interaction.editReply({
      content:
        "Failed to retrieve Roblox user information. Did you enter the correct user ID?",
    });
    return;
  }

  const { displayName, name } = robloxUser;

  const host = new TournamentHost({
    discordId: user.id,
    robloxId: robloxUser.id,
  });

  host
    .save()
    .then(() => {
      interaction.editReply({
        content: `Successfully added <@${user.id}> as a tournament host.`,
      });
      sendLog({
        content: `<@${interaction.user.id}> added <@${user.id}> as a tournament host.`,
      });
    })
    .catch(() => {
      interaction.editReply({
        content: `Failed to add tournament host. The Discord account or Roblox account may already be a tournament host.`,
      });
    });
}

async function hostsRemove(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user", true);
  const host = await TournamentHost.findOne({
    discordId: user.id,
  });
  if (!host) {
    interaction.editReply({
      content: `<@${user.id}> is not a tournament host.`,
    });
    return;
  }
  host
    .deleteOne()
    .then(() => {
      interaction.editReply({
        content: `Removed <@${user.id}> from tournament hosts.`,
      });
      sendLog({
        content: `<@${interaction.user.id}> removed <@${user.id}> from tournament hosts.`,
      });
    })
    .catch(() => {
      interaction.editReply({
        content: `Failed to remove that user from tournament hosts.`,
      });
    });
}

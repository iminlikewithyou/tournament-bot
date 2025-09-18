import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { getUser } from "../../api/roblox/UsersV1.js";
import Participant from "../../models/Participant.js";
import { client } from "../client.js";

export const data = new SlashCommandBuilder()
  .setName("participants")
  .setDescription("Retrieve and modify participants")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("list")
      .setDescription("List all the participants by Roblox username/Discord ID")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("add")
      .setDescription("Manually add a new participant to the tournament")
      .addUserOption((option) =>
        option
          .setName("discord")
          .setDescription("The Discord user to add")
          .setRequired(true)
      )
      .addNumberOption((option) =>
        option
          .setName("roblox")
          .setDescription("The user ID of the Roblox account")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("remove")
      .setDescription("Manually remove a participant from the tournament")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("The user to remove")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("cleareliminated")
      .setDescription("Remove all eliminated players from the participant list")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const subcommand = interaction.options.getSubcommand(true);
  if (subcommand === "list") {
    await participantsList(interaction);
  } else if (subcommand === "add") {
    await participantsAdd(interaction);
  } else if (subcommand === "remove") {
    await participantsRemove(interaction);
  } else if (subcommand === "cleareliminated") {
    await participantsClearEliminated(interaction);
  }
}

async function participantsList(interaction: ChatInputCommandInteraction) {
  const participants = await Participant.find({});
  interaction.editReply({
    content:
      participants
        .map((participant) => {
          const discordUser = client.users.cache.get(participant.discordId);
          // const discordNameDisplay =
          //   discordUser?.displayName === discordUser?.username
          //     ? `\\@${discordUser?.username}`
          //     : `${discordUser?.displayName} • \\@${discordUser?.username}`;
          // const robloxNameDisplay =
          //   participant.robloxUsername === participant.robloxDisplayName
          //     ? `\\@${participant.robloxUsername}`
          //     : `${participant.robloxDisplayName} • \\@${participant.robloxUsername}`;
          const discordNameDisplay = `\\@${discordUser?.username}`;
          const robloxNameDisplay = `\\@${participant.robloxUsername}`;
          if (discordNameDisplay === robloxNameDisplay) {
            return discordNameDisplay;
          }
          return `${discordNameDisplay} | ${robloxNameDisplay}`;
        })
        .join("\n") || "No participants.",
  });
}

async function participantsAdd(interaction: ChatInputCommandInteraction) {
  const discordUser = interaction.options.getUser("discord", true);
  const robloxId = interaction.options.getNumber("roblox", true);

  const robloxUser = await getUser(robloxId);
  if (!robloxUser) {
    interaction.editReply({
      content:
        "Failed to retrieve Roblox user information. Did you enter the correct user ID?",
    });
    return;
  }

  const { displayName, name } = robloxUser;

  const participant = new Participant({
    discordId: discordUser.id,
    robloxId: robloxUser.id,
    robloxDisplayName: displayName,
    robloxUsername: name,
  });

  console.log({
    discordId: discordUser.id,
    robloxId: robloxUser.id,
    robloxDisplayName: displayName,
    robloxUsername: name,
  });

  participant
    .save()
    .then(() => {
      interaction.editReply({
        content: `Successfully added <@${discordUser.id}> to the tournament.`,
      });
    })
    .catch(() => {
      interaction.editReply({
        content: `Failed to add participant. The Discord account or Roblox account may already be in the tournament.`,
      });
    });
}

async function participantsRemove(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user", true);
  const participant = await Participant.findOne({
    discordId: user.id,
  });
  if (!participant) {
    interaction.editReply({
      content: `<@${user.id}> is not a participant in the tournament.`,
    });
    return;
  }
  participant
    .deleteOne()
    .then(() => {
      interaction.editReply({
        content: `Removed <@${user.id}> from the tournament.`,
      });
    })
    .catch(() => {
      interaction.editReply({
        content: `Failed to remove that user from the tournament.`,
      });
    });
}

async function participantsClearEliminated(
  interaction: ChatInputCommandInteraction
) {
  Participant.deleteMany({
    status: "eliminated",
  })
    .then((result) => {
      interaction.editReply({
        content: `Cleared ${result.deletedCount} eliminated ${
          result.deletedCount === 1 ? "player" : "players"
        } from the tournament.`,
      });
    })
    .catch(() => {
      interaction.editReply({
        content: `Failed to clear eliminated players from the tournament.`,
      });
    });
}

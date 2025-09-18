import { Events, MessageFlags } from "discord.js";
import { client } from "../client.js";
import Participant from "../../models/Participant.js";
import { discordToRoblox } from "../../api/bloxlink/discordToRoblox.js";
import { getUser } from "../../api/roblox/UsersV1.js";
import { getRegistrationMessage } from "../../models/RegistrationMessage.js";
import { sendLog } from "../sendLog.js";

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "register") return;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if ((await getRegistrationMessage())?.type !== "open") {
    interaction.editReply({
      content: "Registration is no longer open.",
    });
    return;
  }

  const currentDiscordParticipant = await Participant.findOne({
    discordId: interaction.user.id,
  });
  if (currentDiscordParticipant) {
    interaction.editReply({
      content: "Your Discord account is already registered in this tournament!",
    });
    return;
  }

  const discordToRobloxResponse = await discordToRoblox(interaction.user.id);
  if (discordToRobloxResponse.status === "apiError") {
    interaction.editReply({
      content: `There was an error getting your Roblox account details.\n${discordToRobloxResponse.message}`,
    });
    return;
  } else if (discordToRobloxResponse.status === "notFound") {
    interaction.editReply({
      content: `Your Discord account doesn't have Bloxlink setup!\nYou can link your Discord account with Bloxlink using [this link](https://blox.link/dashboard/user/verifications/verify).`,
    });
    return;
  }

  const robloxId = discordToRobloxResponse.data;
  const currentRobloxParticipant = await Participant.findOne({ robloxId });
  if (currentRobloxParticipant) {
    interaction.editReply({
      content: "Your Roblox account is already registered in this tournament!",
    });
    return;
  }

  const robloxUserInfo = await getUser(robloxId);
  if (!robloxUserInfo) {
    interaction.editReply({
      content:
        "Your Roblox account is connected to your Discord account with Bloxlink, but your Roblox account could not be retrieved. Check your account status on Roblox or try again in a few moments.",
    });
    return;
  }

  const newParticipant = new Participant({
    discordId: interaction.user.id,
    robloxId,
    robloxDisplayName: robloxUserInfo.displayName,
    robloxUsername: robloxUserInfo.name,
  });

  newParticipant
    .save()
    .then(() => {
      const robloxDisplay =
        `**${robloxUserInfo.displayName}**` +
        (robloxUserInfo.displayName === robloxUserInfo.name
          ? ""
          : ` (\\@${robloxUserInfo.name})`);
      interaction.editReply({
        content: `You've joined the tournament! You will be playing as ${robloxDisplay}.\nSit tight while everything gets ready!`,
      });
      sendLog({
        content: `<@${interaction.user.id}> joined the tournament as Roblox user ${robloxDisplay}.`,
      });
    })
    .catch((error) => {
      console.error(error);
      interaction.editReply({
        content:
          "Your account seems like it's set up correctly, but still failed to register you for the tournament. Try again in a few moments.",
      });
    });
});

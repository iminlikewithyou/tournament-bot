import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { getRegistrationMessage } from "../../models/RegistrationMessage.js";
import { client } from "../client.js";
import { config } from "../../config.js";

export const data = new SlashCommandBuilder()
  .setName("registration")
  .setDescription("Manage the registration button")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("open")
      .setDescription("Opens registration to all users.")
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("close").setDescription("Closes registration.")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const registrationChannel = client.channels.cache.get(
    config.discord.registrationChannel
  ) as TextChannel | undefined;
  if (!registrationChannel) {
    interaction.editReply({
      content: "Could not find the registration channel.",
    });
    return;
  }
  const registrationMessageData = await getRegistrationMessage();
  const registrationMessage = registrationMessageData
    ? registrationChannel.messages.cache.get(registrationMessageData.message)
    : undefined;
  const subcommand = interaction.options.getSubcommand(true);
  if (subcommand === "open") {
    if (registrationMessageData?.type === "open") {
      interaction.editReply({ content: "Registration is already open." });
      return;
    }
    await registrationMessage?.delete();
    await registrationChannel.send({
      content:
        "**Registration is now open**!\n" +
        "Users who have linked their Roblox account to Discord using Bloxlink can press the button below to join the event.\n" +
        "**Connect your Roblox account to Discord with Bloxlink** by using **[this link](https://blox.link/dashboard/user/verifications/verify)**.\n" +
        "After connecting your account, **press the button below** to register into the event!",
      components: [
        {
          type: 1,
          components: [
            {
              custom_id: "register",
              type: 2,
              style: 3,
              label: "Register",
              emoji: {
                name: "📝",
                animated: false,
              },
            },
            {
              type: 2,
              style: 5,
              label: "Go to Bloxlink dashboard",
              url: "https://blox.link/dashboard/user/verifications/verify",
            },
          ],
        },
      ],
    });
    interaction.editReply({ content: "Registration is now open." });
  } else if (subcommand === "close") {
    if (registrationMessageData?.type === "closed") {
      interaction.editReply({ content: "Registration is already closed." });
      return;
    }
    await registrationMessage?.delete();
    registrationChannel.send({
      content: "Registration is now closed.",
    });
    interaction.editReply({ content: "Registration is now closed." });
  }
}

import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { getTournament, TournamentState } from "../../models/Tournament.js";
import { SavedMessageManager } from "../../models/SavedMessage.js";
import { config } from "../../config.js";
import { sendLog } from "../sendLog.js";
import Participant from "../../models/Participant.js";
import { ParticipantPair } from "../../models/ParticipantPair.js";

export const data = new SlashCommandBuilder()
  .setName("tournament")
  .setDescription("Update the tournament")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("state")
      .setDescription("Set the state of the tournament")
      .addStringOption((option) =>
        option
          .setName("state")
          .setDescription(
            'The state to set. Setting the tournament to "reset" will clear the tournament.'
          )
          .addChoices([
            {
              name: "recruiting",
              value: "recruiting",
            },
            {
              name: "in progress",
              value: "in progress",
            },
            {
              name: "reset",
              value: "reset",
            },
          ])
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const subcommand = interaction.options.getSubcommand(true);
  if (subcommand === "state") {
    await tournamentState(interaction);
  }
}

async function tournamentState(interaction: ChatInputCommandInteraction) {
  const state = interaction.options.getString("state", true) as TournamentState;
  const tournament = await getTournament();
  const previousState = tournament.state;
  if (previousState === state && state !== "reset") {
    interaction.editReply({ content: `Tournament is already ${state}.` });
    return;
  }
  if (state === "recruiting") {
    SavedMessageManager.update(
      "registration",
      config.discord.registrationChannel,
      {
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
      }
    );
  } else {
    SavedMessageManager.update(
      "registration",
      config.discord.registrationChannel,
      {
        content: "Registration is now closed.",
      }
    );
  }

  if (state === "reset") {
    Participant.deleteMany({});
    ParticipantPair.deleteMany({});
  }

  tournament.state = state;
  tournament.save();
  sendLog({
    content: `<@${interaction.user.id}> set the tournament state to ${state}`,
  });
}

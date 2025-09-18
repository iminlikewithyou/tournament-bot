import {
  ChatInputCommandInteraction,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CommandModule {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
export const commands = new Map<string, CommandModule>();

const folderPath = path.join(__dirname, "commands");
const commandFolder = fs.readdirSync(folderPath);

const commandFiles = commandFolder.filter((file) => file.endsWith(".ts"));

for (const file of commandFiles) {
  const filePath = path.join(folderPath, file);
  const command = await import(`file://${filePath}`);

  const commandModule = command.default || command;

  if ("data" in commandModule && "execute" in commandModule) {
    commands.set(commandModule.data.name, commandModule);
  }
}

const rest = new REST().setToken(config.discord.token);

(async () => {
  console.log(`Refreshing ${commands.size} commands...`);

  const commandsJSON = Array.from(commands.values()).map((commandModule) =>
    commandModule.data.toJSON()
  );

  await rest.put(
    Routes.applicationGuildCommands(
      config.discord.appId,
      config.discord.guildId
    ),
    {
      body: commandsJSON,
    }
  );

  console.log(`Refreshed commands!`);
})();

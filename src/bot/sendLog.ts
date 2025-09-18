import { MessageCreateOptions, MessagePayload, TextChannel } from "discord.js";
import { config } from "../config.js";
import { client } from "./client.js";

export async function sendLog(
  options: string | MessagePayload | MessageCreateOptions
) {
  await (
    client.channels.cache.get(config.discord.gameLogChannel) as TextChannel
  ).send(options);
}

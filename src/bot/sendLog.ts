import { MessageCreateOptions, MessagePayload, TextChannel } from "discord.js";
import { config } from "../config.js";
import { client } from "./client.js";

export async function sendLog(
  options: string | MessagePayload | MessageCreateOptions
) {
  try {
    await (
      client.channels.cache.get(config.discord.gameLogChannel) as TextChannel
    ).send(options);
  } catch {}
}

export async function sendFeed(
  options: string | MessagePayload | MessageCreateOptions
) {
  try {
    await (
      client.channels.cache.get(config.discord.feedChannel) as TextChannel
    ).send(options);
  } catch {}
}

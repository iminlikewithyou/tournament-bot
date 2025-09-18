import { Client, Events, GatewayIntentBits } from "discord.js";
import { config } from "../config.js";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  allowedMentions: { parse: [] },
});

const clientReady = new Promise((resolve) => {
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
    resolve(readyClient);
  });
});

await client.login(config.discord.token);
await clientReady;

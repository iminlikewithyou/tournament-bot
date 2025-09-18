import dotenv from "dotenv-multi-x";

dotenv.init();

function getRequiredEnv(envVar: string) {
  const value = process.env[envVar];
  if (value === undefined) {
    throw `Required environment variable "${envVar}" is not set.`;
  }
  return value;
}

export const config = {
  omg: {
    apiUrl: getRequiredEnv("OMG_API_URL"),
    apiToken: getRequiredEnv("OMG_API_TOKEN"),
  },
  db: {
    mongoUrl: getRequiredEnv("MONGO_URL"),
    valkeyUrl: getRequiredEnv("VALKEY_URL"),
  },
  discord: {
    token: getRequiredEnv("DISCORD_TOKEN"),
    guildId: getRequiredEnv("DISCORD_GUILD_ID"),
    appId: getRequiredEnv("DISCORD_APP_ID"),
    gameLogChannel: getRequiredEnv("DISCORD_GAME_LOG_CHANNEL"),
    registrationChannel: getRequiredEnv("DISCORD_REGISTRATION_CHANNEL"),
  },
  roblosecurity: process.env.ROBLOSECURITY,
  bloxlinkKey: getRequiredEnv("BLOXLINK_KEY"),
} as const;

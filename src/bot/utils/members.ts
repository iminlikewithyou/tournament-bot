import { GuildMember } from "discord.js";
import { config } from "../../config.js";
import { client } from "../client.js";
import Participant from "../../models/Participant.js";

export async function getMember(id: string) {
  const memberCache = client.guilds.cache.get(config.discord.guildId)?.members;
  return memberCache?.cache.get(id) ?? (await memberCache?.fetch(id));
}

export function getParticipantDisplayNameFromParts(
  discordUsername: string,
  robloxUsername: string
) {
  if (discordUsername.toLowerCase() === robloxUsername.toLowerCase()) {
    return `\\@${robloxUsername}`;
  }
  return `\\@${discordUsername} | \\@${robloxUsername}`;
}

export async function getParticipantDisplayName(
  member: GuildMember | string,
  robloxUsername?: string
) {
  let m: GuildMember | undefined;
  if (typeof member === "string") {
    m = await getMember(member);
  }
  if (!m) return undefined;
  if (robloxUsername === undefined) {
    const participant = await Participant.findOne({ discordId: m.id });
    if (!participant) return undefined;
    robloxUsername = participant.robloxUsername;
  }
  return getParticipantDisplayNameFromParts(m.user.username, robloxUsername);
}

export function getParticipantMentionDisplay(
  discordId: string,
  robloxUsername: string
) {
  const discordNameDisplay = `<@${discordId}>`;
  const robloxNameDisplay = `\\@${robloxUsername}`;
  return `${discordNameDisplay} | ${robloxNameDisplay}`;
}

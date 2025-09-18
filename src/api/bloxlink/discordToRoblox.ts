import { config } from "../../config.js";

interface APIError {
  status: "apiError";
  message: string;
}

interface NotFound {
  status: "notFound";
  message: string;
}

interface Success {
  status: "success";
  data: number;
}

type DiscordToRobloxResponse = APIError | NotFound | Success;

interface BloxlinkError {
  error: string;
}

interface BloxlinkSuccessResponse {
  robloxID: number;
  resolved: {
    discord: {
      avatar: string;
      nick: string;
    };
    roblox: null;
  };
}

type BloxlinkResponse = BloxlinkError | BloxlinkSuccessResponse;

export async function discordToRoblox(
  id: string
): Promise<DiscordToRobloxResponse> {
  const bloxlinkResponse = await fetch(
    `https://api.blox.link/v4/public/guilds/476593983485902850/discord-to-roblox/${id}`,
    { headers: { Authorization: config.bloxlinkKey } }
  );
  const bloxlinkResult = (await bloxlinkResponse.json()) as BloxlinkResponse;

  if ("error" in bloxlinkResult) {
    const message = bloxlinkResult.error.endsWith(".")
      ? bloxlinkResult.error
      : bloxlinkResult.error + ".";
    if (message === "User not found.") return { status: "notFound", message };
    return { status: "apiError", message };
  }

  const robloxID = bloxlinkResult.robloxID;

  return { status: "success", data: robloxID };
}

discordToRoblox("971202946895339550");

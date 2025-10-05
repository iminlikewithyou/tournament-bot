interface LaunchData {
  id: string;
  hosts?: number[];
  players?: number[];
  speakers?: number[];
  startAmount?: string;
}

function objectToBase64(obj: any) {
  const json = JSON.stringify(obj);
  return Buffer.from(json).toString("base64");
}

export function createGameLink(launchData: LaunchData) {
  return `<https://www.roblox.com/games/start?placeId=2653064683&launchData=${objectToBase64(
    launchData
  )}>`;
}

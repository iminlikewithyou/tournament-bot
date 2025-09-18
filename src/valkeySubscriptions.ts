import { logGameCompleted, logGameCreated } from "./bot/gameLogger.js";
import { valkey } from "./database/database.js";
import { CompletedMatch, OngoingMatch } from "./types/Match.js";

valkey.on("message", (channel: string, message: string) => {
  const data = JSON.parse(message);
  if (channel === "game:created") {
    gameCreated(data as OngoingMatch);
  } else if (channel === "game:completed") {
    gameCompleted(data as CompletedMatch);
  }
});

function gameCreated(match: OngoingMatch) {
  logGameCreated(match);
}

function gameCompleted(match: CompletedMatch) {
  logGameCompleted(match);
}

async function subscribeToChannel() {
  await valkey.subscribe("game:created");
  await valkey.subscribe("game:completed");
  console.log(`Listening for messages on channels`);
}

subscribeToChannel();

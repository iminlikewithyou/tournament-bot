import mongoose, { Schema } from "mongoose";
import { updateStatusList } from "../bot/commands/status.js";

export type ParticipantStatus =
  | "not started"
  | "in match"
  | "wrong match"
  | "won match"
  | "lost match";

export const StatusEmoji = {
  "wrong match": "❔",
  "not started": "⌛",
  "in match": "🕹️",
  "won match": "🏆",
  "lost match": "❌",
} satisfies Record<ParticipantStatus, string>;

export interface IParticipant {
  robloxId: number;
  robloxUsername: string;
  robloxDisplayName: string;
  discordId: string;
  status: ParticipantStatus;
  joinCode: string | undefined;
}

const ParticipantSchema = new Schema<IParticipant>({
  robloxId: { type: Number, required: true, unique: true, index: true },
  robloxUsername: { type: String, required: true },
  robloxDisplayName: { type: String, required: true },
  discordId: { type: String, required: true, unique: true, index: true },
  status: {
    type: String,
    enum: ["not started", "in match", "wrong match", "won match", "lost match"],
    default: "not started",
    index: true,
  },
  joinCode: { type: String, required: false },
});

let updateStatusTimer: NodeJS.Timeout | undefined;

async function onDebouncedChange() {
  updateStatusList();
}

function debounceChange() {
  if (updateStatusTimer) {
    clearTimeout(updateStatusTimer);
  }

  updateStatusTimer = setTimeout(() => {
    onDebouncedChange();
    updateStatusTimer = undefined;
  }, 250);
}

ParticipantSchema.post("save", debounceChange);
ParticipantSchema.post("insertMany", debounceChange);
ParticipantSchema.post("updateOne", debounceChange);
ParticipantSchema.post("updateMany", debounceChange);
ParticipantSchema.post("findOneAndUpdate", debounceChange);
ParticipantSchema.post("findOneAndReplace", debounceChange);
ParticipantSchema.post("deleteOne", debounceChange);
ParticipantSchema.post("deleteMany", debounceChange);
ParticipantSchema.post("findOneAndDelete", debounceChange);

const Participant = mongoose.model("Participant", ParticipantSchema);

export async function getPlayerIdentity(robloxId: number | undefined) {
  if (robloxId === undefined) return "Nobody";
  const participant = await Participant.findOne({
    robloxId: robloxId,
  }).lean();
  if (!participant) return "Non-Participant";
  return `<@${participant.discordId}>`;
}

export default Participant;

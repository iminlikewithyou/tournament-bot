import mongoose, { Schema } from "mongoose";

export type ParticipantStatus =
  | "not started"
  | "in match"
  | "wrong match"
  | "won match"
  | "eliminated";

export interface IParticipant {
  robloxId: number;
  robloxUsername: string;
  robloxDisplayName: string;
  discordId: string;
  status: ParticipantStatus;
}

const ParticipantSchema = new Schema<IParticipant>({
  robloxId: { type: Number, required: true, unique: true, index: true },
  robloxUsername: { type: String, required: true },
  robloxDisplayName: { type: String, required: true },
  discordId: { type: String, required: true, unique: true, index: true },
  status: {
    type: String,
    enum: ["not started", "in match", "wrong match", "won match", "eliminated"],
    default: "not started",
    index: true,
  },
});

const Participant = mongoose.model<IParticipant>(
  "Participant",
  ParticipantSchema
);

export async function getPlayerIdentity(robloxId: number | undefined) {
  if (robloxId === undefined) return "Nobody";
  const participant = await Participant.findOne({
    robloxId: robloxId,
  }).lean();
  if (!participant) return "Non-Participant";
  return `<@${participant.discordId}>`;
}

export default Participant;

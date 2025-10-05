import mongoose, { Schema } from "mongoose";
import { randomUUID } from "node:crypto";

interface IParticipantPair extends Document {
  participant1: string;
  participant2: string;
  code: string;
  createdAt: Date;
}

const participantPairSchema = new Schema<IParticipantPair>({
  participant1: {
    type: String,
    required: true,
  },
  participant2: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    default: () => randomUUID(),
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7200,
  },
});

participantPairSchema.index(
  { participant1: 1, participant2: 1 },
  { unique: true }
);

export const ParticipantPair = mongoose.model(
  "ParticipantPair",
  participantPairSchema
);

export async function getParticipantPairCode(
  participant1: string,
  participant2: string
) {
  const [sortedParticipant1, sortedParticipant2] = [
    participant1,
    participant2,
  ].sort();

  let pair = await ParticipantPair.findOne({
    participant1: sortedParticipant1,
    participant2: sortedParticipant2,
  });

  if (!pair) {
    pair = await ParticipantPair.create({
      participant1: sortedParticipant1,
      participant2: sortedParticipant2,
    });
  }

  return pair.code;
}

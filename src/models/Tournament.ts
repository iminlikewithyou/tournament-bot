import mongoose, { Schema } from "mongoose";

type TournamentState = "not started" | "recruiting" | "in progress";

interface Tournament {
  state: TournamentState;
}

const TournamentSchema = new Schema<Tournament>({
  state: {
    type: String,
    enum: ["not started", "recruiting", "in progress"],
    default: "not started",
  },
});

const Tournament = mongoose.model<Tournament>("Tournament", TournamentSchema);

export async function getTournament() {
  let instance = await Tournament.findOne({});
  if (!instance) instance = await Tournament.create({});
  return instance;
}

export default Tournament;

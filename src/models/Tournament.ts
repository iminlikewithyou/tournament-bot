import mongoose, { Schema } from "mongoose";

export type TournamentState = "reset" | "recruiting" | "in progress";

interface ITournament {
  state: TournamentState;
}

const TournamentSchema = new Schema<ITournament>({
  state: {
    type: String,
    enum: ["reset", "recruiting", "in progress"],
    default: "reset",
  },
});

const Tournament = mongoose.model("Tournament", TournamentSchema);

export async function getTournament() {
  let instance = await Tournament.findOne({});
  if (!instance) instance = await Tournament.create({});
  return instance;
}

export default Tournament;

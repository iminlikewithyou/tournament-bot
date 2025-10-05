import mongoose, { Schema } from "mongoose";

interface ITournamentHost {
  discordId: string;
  robloxId: number;
}

const TournamentHostSchema = new Schema<ITournamentHost>({
  discordId: { type: String, required: true, unique: true },
  robloxId: { type: Number, required: true, unique: true },
});

export const TournamentHost = mongoose.model(
  "TournamentHost",
  TournamentHostSchema
);

export async function getTournamentHostRobloxIds() {
  return (await TournamentHost.find({})).map((host) => host.robloxId);
}

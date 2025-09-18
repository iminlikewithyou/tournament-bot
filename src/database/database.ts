import mongoose from "mongoose";
import { Redis } from "ioredis";
import { config } from "../config.js";

export async function connectDB() {
  await Promise.all([
    mongoose.connect(config.db.mongoUrl, {
      dbName: "community",
    }),
  ]);
}

export const valkey = new Redis(config.db.valkeyUrl);

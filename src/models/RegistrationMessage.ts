import mongoose, { Schema } from "mongoose";

interface IRegistrationMessage {
  channel: string;
  message: string;
  type: "open" | "closed";
}

const RegistrationMessageSchema = new Schema<IRegistrationMessage>({
  channel: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["open", "closed"], required: true },
});

const RegistrationMessage = mongoose.model<IRegistrationMessage>(
  "RegistrationMessage",
  RegistrationMessageSchema
);

export async function getRegistrationMessage() {
  return await RegistrationMessage.findOne({});
}

export default RegistrationMessage;

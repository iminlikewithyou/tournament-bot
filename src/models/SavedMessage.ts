import { BaseMessageOptions, Message } from "discord.js";
import mongoose, { Schema } from "mongoose";
import { client } from "../bot/client.js";
import { setTimeout as sleep } from "node:timers/promises";

interface ISavedMessage {
  name: string;
  channelId: string;
  messageId: string;
}

const SavedMessageSchema = new Schema<ISavedMessage>({
  name: { type: String, required: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true },
});

SavedMessageSchema.index({ name: 1, channelId: 1 }, { unique: true });

const SavedMessage = mongoose.model("SavedMessage", SavedMessageSchema);

interface QueuedUpdate {
  channelId: string;
  options: BaseMessageOptions;
  resolvers: ((value: Message) => void)[];
}

export class SavedMessageManager {
  private static pendingUpdates = new Map<string, QueuedUpdate>();
  private static isExecuting = new Map<string, boolean>();
  private static lastUpdateTime = new Map<string, number>();
  private static updateTimers = new Map<string, NodeJS.Timeout>();
  private static readonly UPDATE_COOLDOWN = 3000;
  private static readonly RETRY_DELAY = 2000;

  static async update(
    name: string,
    channelId: string,
    options: BaseMessageOptions
  ): Promise<Message> {
    return new Promise((resolve) => {
      const key = `${name}:${channelId}`;
      const now = Date.now();
      const lastUpdate = this.lastUpdateTime.get(key) || 0;
      const timeSinceLastUpdate = now - lastUpdate;
      const isCurrentlyExecuting = this.isExecuting.get(key) || false;

      // If nothing is executing and cooldown has passed, execute immediately
      if (
        !isCurrentlyExecuting &&
        timeSinceLastUpdate >= this.UPDATE_COOLDOWN
      ) {
        this.isExecuting.set(key, true);
        this.executeUpdate(name, channelId, options).then((result) => {
          this.isExecuting.set(key, false);
          resolve(result);
          // Check if there are pending updates to process
          this.checkAndProcessPending(key, name);
        });
      } else {
        // Either executing or on cooldown, queue this update
        const existing = this.pendingUpdates.get(key);
        if (existing) {
          existing.options = options;
          existing.resolvers.push(resolve);
        } else {
          this.pendingUpdates.set(key, {
            channelId,
            options,
            resolvers: [resolve],
          });
        }

        // Only set timer if not currently executing (execution will handle pending when done)
        if (!isCurrentlyExecuting) {
          const existingTimer = this.updateTimers.get(key);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }

          const timeToWait = this.UPDATE_COOLDOWN - timeSinceLastUpdate;
          const timer = setTimeout(() => {
            this.processPendingUpdate(key, name);
          }, timeToWait);

          this.updateTimers.set(key, timer);
        }
      }
    });
  }

  private static checkAndProcessPending(key: string, name: string) {
    const now = Date.now();
    const lastUpdate = this.lastUpdateTime.get(key) || 0;
    const timeSinceLastUpdate = now - lastUpdate;

    if (timeSinceLastUpdate >= this.UPDATE_COOLDOWN) {
      // Can process immediately
      this.processPendingUpdate(key, name);
    } else if (this.pendingUpdates.has(key)) {
      // Need to wait for cooldown
      const timeToWait = this.UPDATE_COOLDOWN - timeSinceLastUpdate;
      const timer = setTimeout(() => {
        this.processPendingUpdate(key, name);
      }, timeToWait);
      this.updateTimers.set(key, timer);
    }
  }

  private static async processPendingUpdate(key: string, name: string) {
    const pending = this.pendingUpdates.get(key);
    if (!pending) return;

    this.pendingUpdates.delete(key);
    this.updateTimers.delete(key);
    this.isExecuting.set(key, true);

    const result = await this.executeUpdate(
      name,
      pending.channelId,
      pending.options
    );

    this.isExecuting.set(key, false);

    pending.resolvers.forEach((resolve) => resolve(result));

    // Check if more updates came in while we were executing
    this.checkAndProcessPending(key, name);
  }

  private static async executeUpdate(
    name: string,
    channelId: string,
    options: BaseMessageOptions
  ): Promise<Message> {
    const key = `${name}:${channelId}`;
    this.lastUpdateTime.set(key, Date.now());

    while (true) {
      try {
        let savedMessage = await SavedMessage.findOne({ name, channelId });
        let savedMessageId: string | undefined;

        if (savedMessage) {
          savedMessageId = savedMessage.messageId;
        } else {
          savedMessage = new SavedMessage({ name, channelId });
        }

        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased() || !channel.isSendable()) {
          await sleep(this.RETRY_DELAY);
          continue;
        }

        if (savedMessageId) {
          try {
            const existingMessage = await channel.messages.fetch(
              savedMessageId
            );
            return await existingMessage.edit(options);
          } catch (error: any) {
            // If it isn't an unknown message, retry
            if (error.code !== 10008) {
              await sleep(this.RETRY_DELAY);
              continue;
            }
            // If unknown message (10008), continue to send new message
          }
        }

        const newMessage = await channel.send(options);
        savedMessage.messageId = newMessage.id;
        await savedMessage.save();

        return newMessage;
      } catch (error) {
        // Retry on any unexpected error
        await sleep(this.RETRY_DELAY);
      }
    }
  }
}

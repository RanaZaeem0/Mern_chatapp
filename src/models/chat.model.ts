import mongoose, { Schema, model, Document, Types } from "mongoose";

// Define the TypeScript interface for the Chat document
interface IChat extends Document {
  name: string;
  groupChat: boolean;
  creator: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date; // Optional, added by timestamps
  updatedAt: Date; // Optional, added by timestamps
}

// Define the schema with the appropriate TypeScript types
const schema = new Schema<IChat>(
  {
    name: {
      type: String,
      required: true,
    },
    groupChat: {
      type: Boolean,
      default: false,
    },
    creator: {
      type: Types.ObjectId,
      ref: "User",
    },
    members: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Export the Chat model
export const Chat = mongoose.models.Chat || model<IChat>("Chat", schema);

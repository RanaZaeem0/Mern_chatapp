import mongoose, { Schema, model, Types, Document } from "mongoose";

// Define an interface for the Request document
interface IRequest extends Document {
  status: "pending" | "accepted" | "rejected";
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
}

// Create the schema with TypeScript types
const requestSchema = new Schema<IRequest>(
  {
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "accepted", "rejected"],
    },
    sender: {
      type: Schema.Types.ObjectId,  // Corrected here
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,  // Corrected here
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Export the Request model with TypeScript type safety
export const Request = mongoose.models.Request || model<IRequest>("Request", requestSchema);

import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["Financial", "Package", "Income", "Technical", "Account", "Other"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    attachment: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "open", "resolved", "closed", "rejected"],
      default: "pending",
    },
    replies: [
      {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        senderType: {
          type: String,
          enum: ["User", "Admin"],
        },
        message: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

export const Ticket = mongoose.model("Ticket", ticketSchema);

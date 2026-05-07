import mongoose from "mongoose";
import { type } from "os";

export const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "commission",
        "referral",
        "investment",
        "withdrawal",
        "bonus",
        "system",
      ],
      default: "system",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Notification = mongoose.model("Notification", notificationSchema);

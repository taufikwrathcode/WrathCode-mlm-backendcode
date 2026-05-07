import mongoose from "mongoose";

const BinaryConfigSchema = new mongoose.Schema(
  {
    pairValue: {
      type: Number,
      required: true,
      default: 100,
    },

    leftRightRatio: {
      type: String,
      required: true,
      default: "1:1",
    },

    carryForward: {
      type: Boolean,
      default: true,
    },

    dailyCapping: {
      type: Number,
      default: 5000,
    },

    weeklyCapping: {
      type: Number,
      default: 25000,
    },

    flushOut: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const BinaryConfig = mongoose.model("BinaryConfig", BinaryConfigSchema);

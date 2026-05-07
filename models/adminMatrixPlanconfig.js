import mongoose from "mongoose";

const MatrixConfigSchema = new mongoose.Schema(
  {
    matrixSize: {
      type: String,
      required: true,
      default: "3x3",
    },

    spilloverLogic: {
      type: String,
      required: true,
      enum: ["left", "right", "auto", "balanced"],
      default: "auto",
    },

    reEntryAllowed: {
      type: Boolean,
      default: false,
    },

    reEntryLevel: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export const MatrixConfig = mongoose.model("MatrixConfig", MatrixConfigSchema);

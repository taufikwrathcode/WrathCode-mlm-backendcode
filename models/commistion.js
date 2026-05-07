import mongoose from "mongoose";

const CommissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    treeType: {
      type: String,
      enum: ["binary", "matrix", "unilevel"],
    },

    type: {
      type: String,
      enum: ["direct", "level", "binary", "roi", "bonus"],
    },

    plan: {
      type: String,
      enum: ["Binary", "Matrix", "Unilevel"],
    },

    amount: { type: Number, required: true },

    level: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["paid", "pending"],
      default: "paid",
    },
  },
  { timestamps: true },
);

export const Commission = mongoose.model("Commission", CommissionSchema);

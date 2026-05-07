import mongoose from "mongoose";

const RankPlanSchema = new mongoose.Schema(
  {
    rank: {
      type: String,
      required: true,
      enum: ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "VIP"],
      unique: true,
    },
    min: {
      type: Number,
    },
    max: {
      type: Number,
    },
    roi: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    dailyPercent: {
      type: Number,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true },
);

export const RankPlan = mongoose.model("RankPlan", RankPlanSchema);

import mongoose from "mongoose";

const commonSettings = {
  active: { type: Boolean, default: true },
  autoCredit: { type: Boolean, default: true },
  minAmount: { type: Number, default: 0 },
  maxAmount: { type: Number, default: 100000 }
};

const IncomeConfigSchema = new mongoose.Schema({
  directCommission: {
    ...commonSettings,
    percentage: { type: Number, default: 5 }
  },

  levelCommission: {
    ...commonSettings,
    levels: [{
      level: { type: Number, required: true },     
      percentage: { type: Number, required: true }
    }]
  },

  binaryCommission: {
    ...commonSettings,
    pairValue: { type: Number, default: 100 }
  },

  matchingBonus: {
    ...commonSettings,
    percentage: { type: Number, default: 5 },
    levels: { type: Number, default: 3 }           
  },

  leadershipBonus: {
    ...commonSettings,
    percentage: { type: Number, default: 3 },
    rankRequired: { type: String, default: "Gold" }
  },

  roiCommission: {
    ...commonSettings,
    roiFrequency: { type: String, enum: ["daily", "weekly", "monthly"], default: "daily" },
    roiPercentage: { type: Number, default: 5 },
    validityPeriod: { type: Number, default: 30 },
    capitalLock: { type: Boolean, default: false }
  },

  rewardBonus: {
    ...commonSettings,
    rewardType: { type: String, enum: ["fixed", "percentage"], default: "fixed" },
    rewardValue: { type: Number, default: 0 }
  },

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }

}, { timestamps: true });

export const IncomeConfig = mongoose.model("IncomeConfig", IncomeConfigSchema);
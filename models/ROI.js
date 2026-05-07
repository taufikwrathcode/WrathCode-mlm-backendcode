import mongoose from "mongoose";

const ROIConfigSchema = new mongoose.Schema({

  
  roiPercentage: {
    type: Number,
    required: true,
    default: 5,
    min: 0,
    max: 100
  },

  
  roiFrequency: {
    type: String,
    required: true,
    enum: ["daily", "weekly", "monthly"],
    default: "daily"
  },

  
  validityPeriod: {
    type: Number,
    required: true,
    default: 30,
    min: 1
  },

  
  capitalLock: {
    type: Boolean,
    default: false
  },

  
  roiStopConditions: {
    type: [String],
    default: ["period_expiry", "max_reached"],
    enum: ["period_expiry", "max_reached", "manual_stop", "withdrawal"]
  },

  
  maxROIAmount: {
    type: Number,
    default: 0,  
    description: "Maximum ROI amount (0 = unlimited)"
  },

  isActive: {
    type: Boolean,
    default: true
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  }

}, { timestamps: true });

export const ROIConfig = mongoose.model("ROIConfig", ROIConfigSchema);
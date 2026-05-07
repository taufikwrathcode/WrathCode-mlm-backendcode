import mongoose from "mongoose";

const UnilevelConfigSchema = new mongoose.Schema(
  {
    levelDepth: {
      type: Number,
      required: true,
      default: 10,
    },

    sponsorIncome: {
      type: Number,
      required: true,
      default: 5,
    },

    levelCommission: [
      {
        level: {
          type: Number,
          required: true,
        },
        percentage: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

export const UnilevelConfig = mongoose.model(
  "UnilevelConfig",
  UnilevelConfigSchema,
);

import { mongoose } from "mongoose";

export const correncyConvertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fromCurrency: {
      type: String,
      default: "USD",
    },
    toCurrency: {
      type: String,
      default: "INR",
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

export const CurrencyConvert = mongoose.model(
  "CurrencyConvert",
  correncyConvertSchema,
);

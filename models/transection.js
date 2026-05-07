import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  type: {
    type: String,
    enum: ["credit", "debit", "transfer"]
  },

  walletType: {
    type: String,
    enum: ["main", "binary", "matrix", "unilevel", "roi", "income", "fund", "internal"]
  },

  source: {
    type: String,
    enum: ["direct", "level", "binary", "roi", "bonus", "refund"]
  },

  amount: Number,

  description: String,

  status: {
    type: String,
    enum: ["paid", "pending"]
  }
}, { timestamps: true });

export const Transaction= new mongoose.model("Transaction",TransactionSchema )
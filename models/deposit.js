import mongoose from "mongoose";

const DepositSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  amount: Number,

  method: {
    type: String,
    enum: ["bank", "upi", "razorpay"]
  },

  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifsc: String,
    accountHolder: String
  },

  upiId: String,

  razorpayPaymentId: String,
  razorpayOrderId: String,

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
   transactionId: {
    type: String,
    default: null
  },
  approvedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Admin"
},
approvedAt: Date
}, { timestamps: true });


export const Deposit = new mongoose.model("Deposit",DepositSchema)
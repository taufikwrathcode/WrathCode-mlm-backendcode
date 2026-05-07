import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema({
  user: {
     type: mongoose.Schema.Types.ObjectId,
      ref: "User",
       required: true 
      },
  
  
  amount: { 
    type: Number,
     required: true 
    },          
  taxAmount: {
     type: Number, 
     required: true
     },        
  finalAmount: {
     type: Number,
      required: true
     },      
  
  
  method: {
     type: String,
      enum: ["bank", "upi", "crypto"], 
      required: true
     },
  
  
  paymentDetails: {
    bank: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      bankName: String,
    },
    upiId: String,
    cryptoAddress: String,
  },
  
  
  fundAccountId: {
     type: String 
    },
  
  
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected", "failed"], 
    default: "pending" 
  },

  
  transactionId: {
     type: String 
    },     
  referenceId: {
     type: String
     },
  
  
  processedBy: { type:
     mongoose.Schema.Types.ObjectId,
      ref: "Admin"
     },
  processedAt: Date,
  adminRemark: {
     type: String, 
     default: ""
     },
  
  
  payoutResponse: {
     type: Object
     }

}, { timestamps: true });

export const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);
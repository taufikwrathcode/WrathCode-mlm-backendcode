import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },
  
  confirmPassword: {
    type: String,
    required: true
  },
  
  // ================= BLOCK STATUS =================
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedReason: {
    type: String,
    default: ""
  },
  blockedAt: Date,
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  },
  unblockedAt: Date,
  unblockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  },
  
  // ================= PASSWORD RESET =================
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // ================= LOGIN TRACKING =================
  lastLogin: {
    type: Date,
    default: null
  },

  // ================= REFERRAL =================
  referral: {
    type: String,
    required: true,
    default: " "
  },

  // ================= PLANS =================
  plans: [
    {
      name: {
        type: String,
        enum: ["Binary", "Unilevel", "Matrix"]
      },
      amount: {
        type: Number,
        required: true
      },
      purchaseDate: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ["pending", "active", "completed"],
        default: "active"
      }
    }
  ],

  investment: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: false
  },

  wallet: {
    type: Number,
    default: 0
  },

  totalEarned: {
    type: Number,
    default: 0
  },
  
  // ================= CAPITAL LOCK  =================
  capitalLocked: { 
    type: Boolean, 
    default: false 
  },
  capitalLockUntil: { 
    type: Date, 
    default: null 
  },
  lockedWallet: { 
    type: Number, 
    default: 0 
  },

  // ================= DAILY & WEEKLY CAPPING TRACKING =================
  dailyIncome: {
    type: Number,
    default: 0
  },
  lastDailyDate: {
    type: Date,
    default: Date.now
  },
  weeklyIncome: {
    type: Number,
    default: 0
  },
  lastWeeklyDate: {
    type: Date,
    default: Date.now
  },

  // ================= RANK =================
  rank: {
    type: String,
    enum: ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "VIP"],
    default: "Bronze"
  },

  // ================= BINARY TREE =================
  left: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  right: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  position: {
    type: String,
    enum: ["left", "right"]
  },
  leftBusiness: { type: Number, default: 0 },
  rightBusiness: { type: Number, default: 0 },
  leftCarry: { type: Number, default: 0 },
  rightCarry: { type: Number, default: 0 },

  // ================= UNILEVEL TREE =================
  parentUnilevel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  childrenUni: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  // ================= MATRIX TREE =================
  parentMatrix: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  leftMatrix: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  middleMatrix: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  rightMatrix: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  positionMatrix: {
    type: String,
    enum: ["left", "middle", "right"]
  },
  levelMatrix: {
    type: Number,
    default: 0
  },

  // ================= ROI =================
  roiStartDate: Date,
  roiEndDate: Date,
  dailyROI: {
    type: Number,
    default: 0
  },
  roiGiven: {
    type: Number,
    default: 0
  },
  maxEarning: {
    type: Number,
    default: 0
  },

  // ================= REFERRAL TRACKING =================
  referredUsers: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    hasInvested: { 
      type: Boolean, 
      default: false 
    },
    investedAt: { 
      type: Date, 
      default: null 
    },
    selectedPlan: { 
      type: String, 
      enum: ["Binary", "Matrix", "Unilevel", null], 
      default: null 
    },
    amountInvested: {
      type: Number,
      default: 0
    }
  }],
  
  activeReferralCount: {
    type: Number,
    default: 0
  },
  
  pendingReferralCount: {
    type: Number,
    default: 0
  },

  totalReferralEarnings: {
    type: Number,
    default: 0
  },

  // ================= AUTH =================
  token: {
    type: String,
    default: ""
  }

}, { 
  timestamps: true 
});

// ================= PASSWORD HASH (PRE-SAVE) =================
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});
// ================= COMPARE PASSWORD METHOD =================
UserSchema.methods.comparePassword = async function (pass) {
  return bcrypt.compare(pass, this.password);
};

export const User = mongoose.model("User", UserSchema);
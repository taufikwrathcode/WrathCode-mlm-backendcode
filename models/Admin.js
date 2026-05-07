import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { type } from "os";

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  confirmPassword: {
    type: String,
    default: "",
  },
  referral: {
    type: String,
    required: true,
    unique: true,
  },
  paln: {
    type: String,
    enum: ["Binary", "Unilevel", "Matrix"],
    default: "Binary",
  },
  currentPlan: {
    type: String,
    enum: ["Binary", "Unilevel", "Matrix"],
    default: "Binary",
  },
  token: {
    type: String,
    default: "",
  },
  wallet: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Password hashing
AdminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});
// Password comparison method
AdminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const Admin = mongoose.model("Admin", AdminSchema);

import mongoose from "mongoose";

const KYCSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },

    fullName: String,
    dateOfBirth: Date,
    address: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
    phoneNumber: String,

    idType: {
      type: String,
      enum: ["Aadhaar", "PAN", "Passport", "VoterID", "Driver_License"],
    },
    idNumber: String,
    idName: String,
    frontImage: String,
    backImage: String,

    selfiewithidnumber: String,
    addressImage: String,

    kycStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    adminRemark: {
      type: String,
      default: "",
    },

    submitted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const KYC = mongoose.model("KYC", KYCSchema);

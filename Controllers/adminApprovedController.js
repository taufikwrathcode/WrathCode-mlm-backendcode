
import jwt from "jsonwebtoken";


import { KYC } from "../models/KYC.js";
import { User } from "../models/User.js";
import { Withdrawal } from "../models/Withdrawal.js";
import { addTransaction } from "../Utils/wallet.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert file to Base64
const getBase64Image = (filePath) => {
  try {
    if (!filePath) return null;
    const fullPath = path.join(__dirname, "..", filePath);
    if (fs.existsSync(fullPath)) {
      const imageBuffer = fs.readFileSync(fullPath);
      const base64 = imageBuffer.toString("base64");
      const ext = path.extname(fullPath).toLowerCase();
      const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
      return `data:${mimeType};base64,${base64}`;
    }
    return null;
  } catch (error) {
    console.error("Base64 conversion error:", error);
    return null;
  }
};

// ================= GET ALL KYC SUBMISSIONS =================
export const getAllKYC = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (status && status !== "all") {
      filter.kycStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const kycs = await KYC.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "name email");

    const totalKYC = await KYC.countDocuments(filter);

    const stats = {
      pending: await KYC.countDocuments({ kycStatus: "Pending" }),
      approved: await KYC.countDocuments({ kycStatus: "Approved" }),
      rejected: await KYC.countDocuments({ kycStatus: "Rejected" }),
    };

    res.status(200).json({
      success: true,
      stats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalKYC / parseInt(limit)),
        total: totalKYC,
      },
      kycs: kycs.map((kyc) => ({
        id: kyc._id,
        userId: kyc.userId?._id,
        userName: kyc.userId?.name,
        userEmail: kyc.userId?.email,
        fullName: kyc.fullName,
        idType: kyc.idType,
        phoneNumber: kyc.phoneNumber,
        kycStatus: kyc.kycStatus,
        submittedAt: kyc.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET SINGLE KYC DETAILS  =================
export const getKYCDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const kyc = await KYC.findById(id).populate("userId", "name email");
    if (!kyc) {
      return res.status(404).json({ success: false, message: "KYC not found" });
    }

    const uploadPath = "uploads/up/";

    res.status(200).json({
      success: true,
      data: {
        id: kyc._id,
        userId: kyc.userId?._id,
        userName: kyc.userId?.name,
        userEmail: kyc.userId?.email,
        personalInfo: {
          fullName: kyc.fullName,
          dateOfBirth: kyc.dateOfBirth,
          address: kyc.address,
          city: kyc.city,
          state: kyc.state,
          country: kyc.country,
          pincode: kyc.pincode,
          phoneNumber: kyc.phoneNumber,
        },
        idInfo: {
          idType: kyc.idType,
          idNumber: kyc.idNumber,
          idName: kyc.idName,
        },
        kycStatus: kyc.kycStatus,
        adminRemark: kyc.adminRemark,
        submittedAt: kyc.createdAt,
        verifiedAt: kyc.verifiedAt,
        documents: {
          frontImage: getBase64Image(`${uploadPath}${kyc.frontImage}`),
          backImage: getBase64Image(`${uploadPath}${kyc.backImage}`),
          selfie: getBase64Image(`${uploadPath}${kyc.selfiewithidnumber}`),
          addressProof: getBase64Image(`${uploadPath}${kyc.addressImage}`),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= UPDATE KYC STATUS (APPROVE/REJECT) =================
export const updateKYCStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;

    if (!status || !["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Status must be 'Approved' or 'Rejected'" 
      });
    }

    if (status === "Rejected" && (!remark || remark.trim() === "")) {
      return res.status(400).json({ 
        success: false, 
        message: "Remark is required for rejection" 
      });
    }

    const kyc = await KYC.findById(id);
    if (!kyc) {
      return res.status(404).json({ success: false, message: "KYC not found" });
    }

    kyc.kycStatus = status;
    kyc.adminRemark = remark || "";
    kyc.verifiedAt = new Date();
    await kyc.save();

    if (status === "Approved") {
      await User.findByIdAndUpdate(kyc.userId, { isActive: true });
    }

    res.status(200).json({
      success: true,
      message: status === "Approved" ? "KYC Approved successfully" : "KYC Rejected",
      data: {
        kycStatus: kyc.kycStatus,
        adminRemark: kyc.adminRemark,
        verifiedAt: kyc.verifiedAt
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




// =================  BLOCK/UNBLOCK USER =================
export const blockUnblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; 

    if (!action || !["block", "unblock"].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: "Action must be 'block' or 'unblock'" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (action === "block") {
      user.isBlocked = true;
      user.blockedAt = new Date();
      user.blockedBy = req.admin._id;
    } else {
      user.isBlocked = false;
      user.unblockedAt = new Date();
      user.unblockedBy = req.admin._id;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${action}ed successfully`,
      data: {
        userId: user._id,
        name: user.name,
        isBlocked: user.isBlocked
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= DELETE USER =================
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userName = user.name;
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: `User "${userName}" deleted successfully`
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =================  EDIT REFERRAL  =================
export const editReferral = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, bonusAmount } = req.body;

    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    
    const referrals = user.referredUsers || [];
    if (referrals.length === 0) {
      return res.status(404).json({ success: false, message: "No referrals found for this user" });
    }

    
    let updatedCount = 0;
    let totalBonusDiff = 0;

    for (const referral of referrals) {
      let oldStatus = referral.hasInvested;
      let oldBonus = (referral.amountInvested * 5) / 100;

    
      if (status === "approved" && oldStatus === false) {
        referral.hasInvested = true;
        referral.investedAt = new Date();
        updatedCount++;
        
  
        await User.findByIdAndUpdate(referral.user, { isActive: true });
      } else if (status === "pending" && oldStatus === true) {
        referral.hasInvested = false;
        updatedCount++;
      } else if (status === "rejected" && oldStatus === true) {
        referral.hasInvested = false;
        updatedCount++;
      }

    
      if (bonusAmount !== undefined && bonusAmount !== oldBonus) {
        const bonusDiff = bonusAmount - oldBonus;
        totalBonusDiff += bonusDiff;
      }
    }

    
    if (totalBonusDiff !== 0) {
      user.totalReferralEarnings = (user.totalReferralEarnings || 0) + totalBonusDiff;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Updated ${updatedCount} referral(s) for user ${user.name}`,
      data: {
        userId: user._id,
        userName: user.name,
        updatedCount: updatedCount,
        status: status,
        bonusAmount: bonusAmount,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error("Edit Referral Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= ADMIN UPDATE WITHDRAWAL STATUS =================
export const updateWithdrawalStatus = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { status, adminRemark } = req.body;
    
    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Status must be 'approved' or 'rejected'" 
      });
    }
    
    const withdrawal = await Withdrawal.findById(withdrawalId).populate("user");
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: "Withdrawal not found" });
    }
    
    if (withdrawal.status !== "pending") {
      return res.status(400).json({ success: false, message: "Withdrawal already processed" });
    }
    
    if (status === "approved") {
      // ✅ NO SECOND DEDUCTION HERE! 
      // (Money was already deducted during requestWithdrawal)
      
      withdrawal.status = "approved";
      withdrawal.processedAt = new Date();
      withdrawal.adminRemark = adminRemark || "Approved by admin";

      
      
    } else if (status === "rejected") {
      const user = withdrawal.user;
      
  
      user.wallet += withdrawal.amount;
      await user.save();

      // Record Refund Transaction
      await addTransaction({
        userId: user._id,
        type: "credit",
        walletType: "main",
        amount: withdrawal.amount,
        description: `Withdrawal Refunded (Ref: ${withdrawal.referenceId})`,
        status: "paid"
      });

      withdrawal.status = "rejected";
      withdrawal.processedAt = new Date();
      withdrawal.adminRemark = adminRemark || "Rejected by admin";
    }
    
    await withdrawal.save();
    
    res.status(200).json({
      success: true,
      message: `Withdrawal ${status} successfully`,
      data: {
        withdrawalId: withdrawal._id,
        userName: withdrawal.user?.name,
        amount: withdrawal.amount,
        transactionId: withdrawal.transactionId,  
        status: withdrawal.status,
        adminRemark: withdrawal.adminRemark,
        processedAt: withdrawal.processedAt
      }
    });
    
  } catch (error) {
    console.error("Update Withdrawal Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
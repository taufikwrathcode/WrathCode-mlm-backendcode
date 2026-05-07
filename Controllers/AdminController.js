import { Admin } from "../models/Admin.js";
import { AdminToken } from "../Utils/Token.js";
import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import { generateReferralCode } from "../Utils/refralcode.js";
import { KYC } from "../models/KYC.js";

import { Deposit } from "../models/deposit.js";
import { addTransaction } from "../Utils/wallet.js";
import { sendKYCApprovalEmail, sendPlanActivationEmail, sendPaymentRejectionEmail } from "../Utils/Email.js";

// ------------------- Admin Register -------------------
export const AdminRegister = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, } = req.body;

    if (!name || !email || !password || !confirmPassword)
      return res.status(400).json({ succ: false, message: "All fields required" });

    if (password !== confirmPassword)
      return res.status(400).json({ succ: false, message: "Passwords do not match" });

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin)
      return res.status(400).json({ succ: false, message: "Email already exists" });

    let referralCode = generateReferralCode();
    while (await Admin.findOne({ referral: referralCode })) {
      referralCode = generateReferralCode();
    }

    
    const newAdmin = new Admin({
      name,
      email,
      password,
      confirmPassword,
      referral: referralCode
    });
   const savedAdmin = await newAdmin.save();

  
    return res.status(201).json({
      succ: true,
      message: "Admin registered",
      admin: {
        id: savedAdmin._id,
        name: savedAdmin.name,
        email: savedAdmin.email,
        password:savedAdmin,
        confirmPassword,
        referral: savedAdmin.referral
      }
    });
       
  } catch (error) {
    console.error(error);
    return res.status(500).json({ succ: false, message: "Internal server error" });
  }
};
// ------------------- Admin Login -------------------
export const AdminLogin = async (req, res) => {
  try {
    const { email, password, plan } = req.body;

    if (!email || !password)
      return res.status(400).json({ succ: false, message: "Email and password required" });

    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(400).json({ succ: false, message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(400).json({ succ: false, message: "Invalid email or password" });

    // Plan selection
    if (plan && ["Binary","Unilevel","Matrix"].includes(plan)) {
      admin.currentPlan = plan;
    } else if (!admin.currentPlan) {
      admin.currentPlan = "Binary";
    }

    const token = AdminToken(admin);
    admin.token = token;
    await admin.save();

    return res.status(200).json({
      succ: true,
      message: "Admin logged in",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        referral: admin.referral,
        plans: admin.plans,
        currentPlan: admin.currentPlan,
        token,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ succ: false, message: "Internal server error" });
  }
};


//=================================== Add new user================

export const addUserByAdmin = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      status, 
      initialInvestment, 
      joinDate 
    } = req.body;

    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

  
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    
    let referralCode = generateReferralCode();
    while (await User.findOne({ referral: referralCode })) {
      referralCode = generateReferralCode();
    }

    
    let isActive = false;
    if (status === "active") isActive = true;
    if (status === "pending") isActive = false;
    if (status === "rejected") isActive = false;

  
    const user = new User({
      name,
      email,
      password,
      confirmPassword: password,
      referral: referralCode,
      isActive: isActive,
      investment: initialInvestment || 0,
      wallet: 0,
      createdAt: joinDate ? new Date(joinDate) : new Date()
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "User added successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        referral: user.referral,
        status: status || "pending",
        initialInvestment: user.investment,
        joinDate: user.createdAt
      }
    });

  } catch (error) {
    console.error("Add User Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};





//==========================deposit==================


export const approveDeposit = async (req, res) => {
  try {
    const { depositId } = req.body;

    const deposit = await Deposit.findById(depositId);

    if (!deposit) {
      return res.status(404).json({ message: "Deposit not found" });
    }

    if (deposit.status !== "pending") {
      return res.status(400).json({ message: "Already processed" });
    }

    
    deposit.status = "approved";
    deposit.approvedBy = req.admin._id; 
    deposit.approvedAt = new Date();
    await deposit.save();

  
    await addTransaction({
      userId: deposit.user,
      type: "credit",
      walletType: "main",
      amount: deposit.amount,
      description: `Deposit:${deposit._id}`,
      status: "paid"
    });

    res.json({
      success: true,
      message: "Deposit approved"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};






// =================  GET ALL WITHDRAWALS =================
export const getAllWithdrawals = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status && status !== "all") filter.status = status;

    const withdrawals = await Withdrawal.find(filter)
      .populate("user", "name email wallet phone")
      .sort({ createdAt: -1 });

    const stats = {
      pending: await Withdrawal.countDocuments({ status: "pending" }),
      approved: await Withdrawal.countDocuments({ status: "approved" }),
      rejected: await Withdrawal.countDocuments({ status: "rejected" }),
      totalAmount: await Withdrawal.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    };

    res.status(200).json({
      success: true,
      stats: {
        pending: stats.pending,
        approved: stats.approved,
        rejected: stats.rejected,
        totalAmountApproved: stats.totalAmount[0]?.total || 0
      },
      withdrawals
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= PROCESS WITHDRAWAL  =================
export const processWithdrawal = async (req, res) => {
  try {
    const { withdrawalId, action, adminRemark } = req.body;
    const adminId = req.admin._id;

    const withdrawal = await Withdrawal.findById(withdrawalId).populate("user");
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({ success: false, message: "Withdrawal already processed" });
    }

    // ================= REJECT WITHDRAWAL =================
    if (action === "reject") {
      withdrawal.status = "rejected";
      withdrawal.processedBy = adminId;
      withdrawal.processedAt = new Date();
      withdrawal.adminRemark = adminRemark || "Rejected by admin";
      await withdrawal.save();

      return res.status(200).json({ 
        success: true, 
        message: "Withdrawal rejected",
        withdrawal
      });
    }

    // ================= APPROVE WITHDRAWAL - REAL MONEY TRANSFER =================
    if (action === "approve") {
      const user = withdrawal.user;

      // Check balance again
      const freshUser = await User.findById(user._id);
      if (freshUser.wallet < withdrawal.amount) {
        return res.status(400).json({ 
          success: false, 
          message: "Insufficient balance in user wallet" 
        });
      }

      let payout;
      let fundAccountId = withdrawal.fundAccountId;

      try {
        // Process based on method
        if (withdrawal.method === "bank") {
          // Create fund account if not exists
          if (!fundAccountId) {
            const fundAccount = await createBankFundAccount(
              withdrawal.paymentDetails.bank,
              user.name
            );
            fundAccountId = fundAccount.id;
            withdrawal.fundAccountId = fundAccountId;
            await withdrawal.save();
          }
          
          // Process payout (REAL MONEY)
          payout = await processBankPayout(withdrawal, fundAccountId);
          
        } else if (withdrawal.method === "upi") {
          // Create UPI fund account if not exists
          if (!fundAccountId) {
            const fundAccount = await createUPIFundAccount(
              withdrawal.paymentDetails.upiId,
              user.name
            );
            fundAccountId = fundAccount.id;
            withdrawal.fundAccountId = fundAccountId;
            await withdrawal.save();
          }
          
          // Process UPI payout (REAL MONEY)
          payout = await processUPIPayout(withdrawal, fundAccountId);
          
        } else if (withdrawal.method === "crypto") {
          // Crypto payouts require separate integration (Coinbase/Binance)
          return res.status(400).json({
            success: false,
            message: "Crypto withdrawals coming soon. Please use bank or UPI."
          });
        }

        // ✅ PAYOUT SUCCESSFUL - Now deduct from wallet
        freshUser.wallet -= withdrawal.amount;
        await freshUser.save();

        // Update withdrawal status
        withdrawal.status = "approved";
        withdrawal.transactionId = payout.id;
        withdrawal.processedBy = adminId;
        withdrawal.processedAt = new Date();
        withdrawal.payoutResponse = payout;
        withdrawal.adminRemark = adminRemark || "Approved";
        await withdrawal.save();

        // Add transaction record
        await addTransaction({
          userId: user._id,
          type: "debit",
          walletType: "main",
          amount: withdrawal.amount,
          description: `Withdrawal to ${withdrawal.method} - ${payout.id}`,
          status: "paid"
        });

        return res.status(200).json({
          success: true,
          message: `₹${withdrawal.finalAmount} transferred to user's ${withdrawal.method}`,
          data: {
            withdrawalId: withdrawal._id,
            transactionId: payout.id,
            amount: withdrawal.finalAmount,
            method: withdrawal.method,
            status: "approved"
          }
        });

      } catch (payoutError) {
        console.error("Payout Error:", payoutError);
        
        withdrawal.status = "failed";
        withdrawal.adminRemark = `Payout failed: ${payoutError.message}`;
        withdrawal.processedBy = adminId;
        withdrawal.processedAt = new Date();
        await withdrawal.save();

        return res.status(400).json({
          success: false,
          message: "Payout failed. Please try again or contact support.",
          error: payoutError.message
        });
      }
    }

  } catch (error) {
    console.error("Process Withdrawal Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
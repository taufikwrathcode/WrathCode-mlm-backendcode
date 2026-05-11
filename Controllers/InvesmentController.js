import mongoose from "mongoose";
import { User } from "../models/User.js";
import { addTransaction } from "../Utils/wallet.js";
import { checkKYCApproved } from "../Utils/KYC.js";
import { Wallet } from "../models/wallet.js";
import { RANK_PLANS } from "../Utils/RANK_PLANS.js";
import { startROI } from "../Utils/ROI.js";
import { getRankByInvestment, getNextRankInfo } from "../Utils/getRank.js";
import { activateReferralAndGiveBonus } from "../Utils/referralBonus.js";
import { distributeLevelIncome } from "../Utils/Level.js";
import {
  sendBankTransferEmail,
  sendRazorpayOrderEmail,
} from "../Utils/Email.js";
import {
  joinBinaryAuto,
  joinMatrixAuto,
  joinUnilevelAuto,
} from "../Utils/autojoin.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_key",
  key_secret: process.env.RAZORPAY_SECRET || "rzp_test_secret",
});

const PLAN_PRICE = {
  Binary: 100,
  Matrix: 200,
  Unilevel: 150,
  basic: 100,
};

// Bank Configuration
const BANK_DETAILS = {
  accountName: "MLM Network India Pvt Ltd",
  accountNumber: "1234567890123456",
  bankName: "State Bank of India",
  ifsc: "SBIN0001234",
  upiId: "mlmnetwork@okhdfcbank",
};

// ================== GET PAYMENT METHODS ==================
export const getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = [
      {
        id: "wallet",
        name: "Wallet (Instant)",
        description: "Pay from your existing wallet balance",
      },
      {
        id: "razorpay_upi",
        name: "Razorpay UPI",
        description: "All UPI methods (Google Pay, PhonePe, Paytm, etc.)",
      },
      {
        id: "razorpay_bank",
        name: "Razorpay Bank Transfer",
        description: "Online bank transfer via Razorpay",
      },
      {
        id: "bank_transfer",
        name: "Manual Bank Transfer",
        description: "Direct bank account transfer",
      },
    ];

    res.status(200).json({
      success: true,
      methods: paymentMethods,
      bankDetails: BANK_DETAILS,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================== CREATE RAZORPAY ORDER ==================
export const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { plan, paymentMethod } = req.body;

    if (!PLAN_PRICE[plan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected",
      });
    }

    const isKYC = await checkKYCApproved(userId);
    if (!isKYC) {
      return res.status(400).json({
        success: false,
        message: "Complete KYC approval required first",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const amount = PLAN_PRICE[plan];

    const orderOptions = {
      amount: amount * 100,
      currency: "INR",
      receipt: `${userId}-${plan}-${Date.now()}`,
      payment_capture: 1,
      notes: {
        userId,
        plan,
        userEmail: user.email,
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    if (!user.payments) user.payments = [];

    user.payments.push({
      plan,
      amount,
      paymentMethod,
      status: "pending",
      razorpayOrderId: order.id,
      initiatedAt: new Date(),
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      order: {
        orderId: order.id,
        amount,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================== VERIFY RAZORPAY PAYMENT ==================
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);

    hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Payment failed" });
    }

    const order = await razorpay.orders.fetch(razorpayOrderId);
    const { plan } = order.notes;

    const user = await User.findById(userId);

    const paymentIndex = user.payments.findIndex(
      (p) => p.razorpayOrderId === razorpayOrderId,
    );

    if (paymentIndex !== -1) {
      user.payments[paymentIndex].status = "completed";
      user.payments[paymentIndex].razorpayPaymentId = razorpayPaymentId;
    }

    const amount = PLAN_PRICE[plan];

    user.plans.push({
      name: plan,
      amount,
      purchaseDate: new Date(),
      paymentMethod: "razorpay",
      razorpayPaymentId,
      treeJoined: false,
    });

    user.investment += amount;
    user.isActive = true;

    // Get rank based on investment amount
    const { rank, limits } = getRankByInvestment(amount);
    user.userRank = rank;
    user.maxEarning =
      (user.maxEarning || 0) + (amount + (amount * limits.roi) / 100);

    // Start ROI based on rank
    await startROI(user, amount, limits);

    await user.save();

    const freshUser = await User.findById(user._id);
    const { mlmType: noteMLMType } = order.notes;

    const planMap = {
      binary: "Binary",
      matrix: "Matrix",
      unilevel: "Unilevel",
      basic: "Binary",
    };

    const normalizedMLMType = noteMLMType?.toLowerCase?.() || "";
    let finalPlanToJoin = planMap[normalizedMLMType];

    if (!finalPlanToJoin) {
      const normalizedPlan = plan?.toLowerCase?.() || "";
      finalPlanToJoin = planMap[normalizedPlan];
    }

    if (finalPlanToJoin === "Binary") await joinBinaryAuto(freshUser);
    else if (finalPlanToJoin === "Matrix") await joinMatrixAuto(freshUser);
    else if (finalPlanToJoin === "Unilevel") await joinUnilevelAuto(freshUser);
    return res.status(200).json({
      success: true,
      message: "Payment verified & plan activated",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ================== INITIALIZE MANUAL BANK TRANSFER ==================
export const initializeBankTransfer = async (req, res) => {
  try {
    const userId = req.user._id;
    const { plan } = req.body;

    if (!PLAN_PRICE[plan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected",
      });
    }

    const isKYC = await checkKYCApproved(userId);
    if (!isKYC) {
      return res.status(400).json({
        success: false,
        message: "Complete KYC approval required first",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const amount = PLAN_PRICE[plan];
    const referenceId = `REF-${userId}-${plan}-${Date.now()}`;

    if (!user.payments) user.payments = [];

    user.payments.push({
      plan: plan,
      amount: amount,
      paymentMethod: "bank_transfer",
      status: "pending",
      referenceId: referenceId,
      initiatedAt: new Date(),
    });

    await user.save();

    await sendBankTransferEmail(user, plan, amount, referenceId, BANK_DETAILS);

    return res.status(200).json({
      success: true,
      message:
        "Bank transfer details provided. Check your email for bank account details.",
      paymentDetails: {
        referenceId: referenceId,
        amount: amount,
        plan: plan,
        bankDetails: BANK_DETAILS,
        instructions: [
          `Transfer ₹${amount} to the below bank account`,
          `Account Name: ${BANK_DETAILS.accountName}`,
          `Account Number: ${BANK_DETAILS.accountNumber}`,
          `Bank Name: ${BANK_DETAILS.bankName}`,
          `IFSC Code: ${BANK_DETAILS.ifsc}`,
          `Use Reference ID as payment description: ${referenceId}`,
          `After transfer, submit transaction ID for verification`,
        ],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================== VERIFY BANK TRANSFER ==================
export const verifyBankTransfer = async (req, res) => {
  try {
    const userId = req.user._id;
    const { referenceId, transactionId } = req.body;

    if (!referenceId || !transactionId) {
      return res.status(400).json({
        message: "Reference ID and transaction ID required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const paymentIndex = user.payments.findIndex(
      (p) => p.referenceId === referenceId,
    );

    if (paymentIndex === -1) {
      return res.status(404).json({ message: "Payment request not found" });
    }

    const payment = user.payments[paymentIndex];
    const { plan, amount } = payment;

    payment.status = "pending_admin_verification";
    payment.transactionId = transactionId;
    payment.submittedAt = new Date();

    user.plans.push({
      name: plan,
      amount: amount,
      purchaseDate: new Date(),
      paymentMethod: "bank_transfer",
      transactionId: transactionId,
      status: "pending_verification",
    });

    user.investment = (user.investment || 0) + amount;
    user.maxEarning = (user.maxEarning || 0) + amount * 2;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Payment submitted for verification. Admin will verify and activate your plan.",
      data: {
        plan: plan,
        amount: amount,
        referenceId: referenceId,
        transactionId: transactionId,
        status: "pending_admin_verification",
        investment: user.investment,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================== BUY PLAN WITH WALLET ==================

export const buyPlan = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { amount, planId, mlmType } = req.body;
    console.log(
      "BUY PLAN REQUEST - User:",
      userId,
      "Plan:",
      planId,
      "MLM Type:",
      mlmType,
      "Amount:",
      amount,
    );

    // VALIDATION
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!amount || !planId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: amount and planId",
      });
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid positive number",
      });
    }

    //  KYC CHECK
    const isKYC = await checkKYCApproved(userId);
    if (!isKYC) {
      return res.status(400).json({
        success: false,
        message: "KYC approval required! Complete your KYC first.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.wallet < amountNum) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Your balance: ₹${user.wallet}, Required: ₹${amountNum}`,
        availableBalance: user.wallet,
      });
    }

    try {
      const { rank, limits, dailyROI, maxEarning, nextRank } =
        getRankByInvestment(amountNum, user.userRank || null);

      // Update user rank
      user.userRank = rank;

      const planMap = {
        binary: "Binary",
        matrix: "Matrix",
        unilevel: "Unilevel",
        basic: "Binary",
      };

      const normalizedMLMType = mlmType?.toLowerCase?.() || "";
      let finalPlanName = planMap[normalizedMLMType];

      if (!finalPlanName) {
        const normalizedPlanId = planId?.toLowerCase?.() || "";
        finalPlanName = planMap[normalizedPlanId];
      }

      if (!finalPlanName) {
        return res.status(400).json({
          success: false,
          message: `Invalid plan or MLM type selected. Valid types: Binary, Matrix, Unilevel`,
        });
      }

      console.log(
        `Plan requested: "${planId}" → resolved to: "${finalPlanName}"`,
      );

      // Deduct from wallet
      user.wallet -= amountNum;
      user.investment = (user.investment || 0) + amountNum;
      user.isActive = true;
      user.maxEarning = (user.maxEarning || 0) + maxEarning;

      if (!user.plans) user.plans = [];

      user.plans.push({
        name: finalPlanName,
        amount: amountNum,
        purchaseDate: new Date(),
        planSelected: finalPlanName,
        investmentConfirm: true,
        status: "active",
        rank: rank,
        dailyROI: dailyROI,
      });

      // Start ROI based on rank
      await startROI(user, amountNum, limits);

      await user.save();

      // ================= AUTO JOIN TREE =================
      const freshUser = await User.findById(user._id);

      console.log("=== AUTO JOIN CHECK ===");
      console.log("User Name:", freshUser.name);
      console.log("Plan:", finalPlanName);
      console.log("Rank:", rank);

      if (finalPlanName === "Binary") {
        await joinBinaryAuto(freshUser);
      } else if (finalPlanName === "Matrix") {
        await joinMatrixAuto(freshUser);
      } else if (finalPlanName === "Unilevel") {
        await joinUnilevelAuto(freshUser);
      }

      console.log("========== SPONSOR BONUS CHECK ==========");
      console.log("User ID:", user._id);
      console.log("User Name:", user.name);
      console.log("Rank:", rank);

      if (user.parentUnilevel) {
        console.log(
          "Calling activateReferralAndGiveBonus for sponsor:",
          user.parentUnilevel,
        );
        const bonusResult = await activateReferralAndGiveBonus(
          user.parentUnilevel,
          user._id,
          finalPlanName,
          amountNum,
        );
        console.log("Bonus Result:", JSON.stringify(bonusResult, null, 2));
      }

      await distributeLevelIncome(user, amountNum, finalPlanName);
    } catch (rankError) {
      return res.status(400).json({
        success: false,
        message: rankError.message || "Rank progression error",
      });
    }

    try {
      await addTransaction({
        userId,
        type: "debit",
        walletType: "main",
        amount: amountNum,
        description: `${finalPlanName} Plan Purchase`,
        status: "paid",
      });
    } catch (transactionError) {
      console.warn("Transaction Log Warning:", transactionError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Investment Successful!",
      investment: {
        planSelected: finalPlanName,
        planName: finalPlanName.toUpperCase(),
        amount: amountNum,
        purchaseDate: new Date(),
      },
      wallet: {
        remainingBalance: user.wallet,
        totalInvestment: user.investment,
      },
    });
  } catch (error) {
    console.error("BUY PLAN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
// ================== GET INVESTMENT PLANS  ==================
export const getInvestment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const plans = user.plans || [];

    let totalInvested = 0;
    let totalReturns = 0;
    let pendingReturns = 0;

    let activeCount = 0;

    const activeInvestments = [];

    const history = [];

    const monthlyTrend = {};

    plans.forEach((plan) => {
      const rank = user.rank || "Bronze";
      const limits = RANK_PLANS[rank];

      const amount = plan.amount || 0;
      const roi = limits?.roi || 0;

      const totalReturn = (amount * roi) / 100;

      const startDate = new Date(plan.purchaseDate);
      const endDate = new Date(
        startDate.getTime() + limits.duration * 24 * 60 * 60 * 1000,
      );

      const today = new Date();

      const isCompleted = today >= endDate;

      totalInvested += amount;

      if (isCompleted) {
        totalReturns += totalReturn;
      } else {
        activeCount++;

        const daysPassed = Math.floor(
          (today - startDate) / (1000 * 60 * 60 * 24),
        );

        const daysRemaining = Math.max(0, limits.duration - daysPassed);

        const currentReturn = (amount * limits.dailyPercent * daysPassed) / 100;

        totalReturns += currentReturn;
        pendingReturns += totalReturn - currentReturn;

        activeInvestments.push({
          plan: plan.planSelected || plan.name,
          amount: `$${amount}`,
          status: "Active",
          daysElapsed: `${daysPassed} days`,
          daysRemaining: `${daysRemaining} days`,
          expectedReturn: `$${totalReturn}`,
          currentReturns: `$${currentReturn.toFixed(2)}`,
          roi: `${roi}%`,
        });
      }

      history.push({
        plan: plan.planSelected || plan.name,
        amount: `$${amount}`,
        returns: `$${totalReturn}`,
        roi: `${roi}%`,
        endDate: endDate.toLocaleDateString(),
        status: isCompleted ? "Completed" : "Pending",
      });

      const month = startDate.toLocaleString("default", {
        month: "short",
      });

      monthlyTrend[month] = (monthlyTrend[month] || 0) + totalReturn;
    });

    const availablePlans = Object.keys(RANK_PLANS).map((rank) => {
      const p = RANK_PLANS[rank];

      return {
        plan: rank,
        minimum: `$${p.min}`,
        maximum: `$${p.max}`,
        roi: `${p.roi}%`,
        duration: `${p.duration} days`,
      };
    });

    return res.status(200).json({
      success: true,

      summary: {
        totalInvested: `$${totalInvested.toFixed(2)}`,
        totalReturns: `$${totalReturns.toFixed(2)}`,
        pendingReturns: `$${pendingReturns.toFixed(2)}`,
      },

      activeInvestmentsCount: activeCount,

      monthlyEarningsTrend: monthlyTrend,

      availablePlans,

      activeInvestments,

      investmentHistory: history,
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
// ================== ADMIN: APPROVE BANK TRANSFER PAYMENT ==================
export const approveBankTransferPayment = async (req, res) => {
  try {
    const { userId, paymentId } = req.body;

    if (!userId || !paymentId) {
      return res.status(400).json({
        success: false,
        message: "userId and paymentId required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Find payment
    const paymentIndex = user.payments.findIndex(
      (p) => p._id.toString() === paymentId,
    );
    if (paymentIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    const payment = user.payments[paymentIndex];
    if (payment.paymentMethod !== "bank_transfer") {
      return res
        .status(400)
        .json({
          success: false,
          message: "This is not a bank transfer payment",
        });
    }

    if (payment.status === "completed") {
      return res
        .status(400)
        .json({ success: false, message: "Payment already approved" });
    }

    const amount = payment.amount;

    // Update payment status
    payment.status = "completed";
    payment.verifiedAt = new Date();
    payment.verifiedBy = req.admin._id;

    // Get rank based on investment amount
    const { rank, limits } = getRankByInvestment(amount);
    user.userRank = rank;

    // Start ROI based on rank
    await startROI(user, amount, limits);

    // Auto-enroll in Binary/Matrix/Unilevel
    const planMap = {
      binary: "Binary",
      matrix: "Matrix",
      unilevel: "Unilevel",
    };

    // Update plans array status
    const planIndex = user.plans.findIndex(
      (p) =>
        p.paymentMethod === "bank_transfer" &&
        p.transactionId === payment.transactionId,
    );

    if (planIndex !== -1) {
      user.plans[planIndex].status = "active";
    }

    await user.save();

    // Auto join tree
    const freshUser = await User.findById(user._id);
    const planToJoin = planMap[payment.plan?.toLowerCase()] || "Binary";

    if (planToJoin === "Binary") await joinBinaryAuto(freshUser);
    else if (planToJoin === "Matrix") await joinMatrixAuto(freshUser);
    else if (planToJoin === "Unilevel") await joinUnilevelAuto(freshUser);

    return res.status(200).json({
      success: true,
      message: "Bank transfer payment approved. ROI started.",
      data: {
        userId: user._id,
        userName: user.name,
        amount: amount,
        rank: rank,
        dailyROI: (amount * limits.dailyPercent) / 100,
        maxEarning: amount + (amount * limits.roi) / 100,
        duration: `${limits.duration} days`,
        status: "active",
      },
    });
  } catch (error) {
    console.error("Approve Bank Transfer Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

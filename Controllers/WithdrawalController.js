import { User } from "../models/User.js";
import { Withdrawal } from "../models/Withdrawal.js";
import { addTransaction } from "../Utils/wallet.js";
import { checkKYCApproved } from "../Utils/KYC.js";
import { 
  createBankFundAccount, 
  createUPIFundAccount, 
  processBankPayout, 
  processUPIPayout 
} from "../Utils/razorpayPayout.js";

// ================= USER: REQUEST WITHDRAWAL (WITH TRANSACTION ID) =================
export const requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, method, paymentDetails } = req.body;

    // KYC Check
    const isKYC = await checkKYCApproved(userId);
    if (!isKYC) {
      return res.status(400).json({ 
        success: false, 
        message: "KYC approval required for withdrawal" 
      });
    }

    // Amount validation
    if (!amount || amount < 100) {
      return res.status(400).json({ 
        success: false, 
        message: "Minimum withdrawal amount is ₹100" 
      });
    }

    // Method validation
    const validMethods = ["bank", "upi", "crypto"];
    if (!method || !validMethods.includes(method)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid withdrawal method. Use: bank, upi, or crypto" 
      });
    }

    // Payment details validation
    if (method === "bank") {
      if (!paymentDetails?.bank?.accountNumber || 
          !paymentDetails?.bank?.ifscCode || 
          !paymentDetails?.bank?.accountHolderName) {
        return res.status(400).json({
          success: false,
          message: "Bank details required: accountNumber, ifscCode, accountHolderName"
        });
      }
    } else if (method === "upi") {
      if (!paymentDetails?.upiId || !paymentDetails.upiId.includes("@")) {
        return res.status(400).json({
          success: false,
          message: "Valid UPI ID required (e.g., user@okhdfcbank)"
        });
      }
    } else if (method === "crypto") {
      if (!paymentDetails?.cryptoAddress || paymentDetails.cryptoAddress.length < 10) {
        return res.status(400).json({
          success: false,
          message: "Valid crypto wallet address required"
        });
      }
    }

    // Balance check
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.wallet < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
        availableBalance: user.wallet
      });
    }

    // Calculate tax (10% TDS)
    const taxAmount = (amount * 10) / 100;
    const finalAmount = amount - taxAmount;

    // ✅ Generate Transaction ID immediately
    const transactionId = `WD${Date.now()}${userId.toString().slice(-6)}`;

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      user: userId,
      amount,
      taxAmount,
      finalAmount,
      method,
      paymentDetails,
      status: "pending",
      referenceId: `WD_${Date.now()}_${userId.toString().slice(-6)}`,
      transactionId: transactionId  // ✅ Set immediately
    });

    res.status(200).json({
      success: true,
      message: "Withdrawal request submitted. Admin will process within 24 hours.",
      data: {
        withdrawalId: withdrawal._id,
        referenceId: withdrawal.referenceId,
        transactionId: transactionId,  // ✅ Show in response
        amount: withdrawal.amount,
        taxAmount: withdrawal.taxAmount,
        finalAmount: withdrawal.finalAmount,
        method: withdrawal.method,
        status: withdrawal.status,
        requestedAt: withdrawal.createdAt
      }
    });

  } catch (error) {
    console.error("Withdrawal Request Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= USER: GET WITHDRAWAL HISTORY (WITH TRANSACTION ID) =================
export const getWithdrawalHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await Withdrawal.find({ user: userId }).sort({
      createdAt: -1,
    });

    if (!history || history.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No withdrawal history found",
        data: [],
      });
    }

    const formattedHistory = history.map((item) => ({
      withdrawalDate: item.createdAt,
      amount: item.amount,
      taxAmount: item.taxAmount,
      netAmount: item.finalAmount,
      status: item.status,
      paymentMethod: item.method,
      transactionId: item.transactionId  // ✅ Added
    }));

    return res.status(200).json({
      success: true,
      count: formattedHistory.length,
      data: formattedHistory,
    });
  } catch (error) {
    console.error("GET WITHDRAWAL HISTORY ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching history",
      error: error.message,
    });
  }
};
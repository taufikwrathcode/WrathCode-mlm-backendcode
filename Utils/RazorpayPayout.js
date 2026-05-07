import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET
});


const RAZORPAYX_ACCOUNT_NUMBER = process.env.RAZORPAYX_ACCOUNT_NUMBER;

// ================= CREATE FUND ACCOUNT (BANK) =================
export const createBankFundAccount = async (bankDetails, userName) => {
  try {
    const fundAccount = await razorpay.fundAccounts.create({
      account_type: "bank_account",
      bank_account: {
        name: bankDetails.accountHolderName,
        ifsc: bankDetails.ifscCode,
        account_number: bankDetails.accountNumber
      }
    });
    
    return fundAccount;
  } catch (error) {
    console.error("Create Bank Fund Account Error:", error);
    throw error;
  }
};

// ================= CREATE FUND ACCOUNT (UPI) =================
export const createUPIFundAccount = async (upiId, userName) => {
  try {
    const fundAccount = await razorpay.fundAccounts.create({
      account_type: "vpa",
      vpa: {
        address: upiId
      }
    });
    
    return fundAccount;
  } catch (error) {
    console.error("Create UPI Fund Account Error:", error);
    throw error;
  }
};

// ================= PROCESS BANK PAYOUT (REAL MONEY) =================
export const processBankPayout = async (withdrawal, fundAccountId) => {
  try {
    const payout = await razorpay.payouts.create({
      account_number: RAZORPAYX_ACCOUNT_NUMBER,
      amount: withdrawal.finalAmount * 100, // Convert to paise
      currency: "INR",
      mode: "IMPS", // or "NEFT", "RTGS"
      purpose: "commission",
      fund_account_id: fundAccountId,
      reference_id: `WD_${withdrawal._id}`,
      narration: "MLM Commission Withdrawal",
      notes: {
        user_id: withdrawal.user.toString(),
        withdrawal_id: withdrawal._id.toString()
      }
    });
    
    return payout;
  } catch (error) {
    console.error("Bank Payout Error:", error);
    throw error;
  }
};

// ================= PROCESS UPI PAYOUT (REAL MONEY) =================
export const processUPIPayout = async (withdrawal, fundAccountId) => {
  try {
    const payout = await razorpay.payouts.create({
      account_number: RAZORPAYX_ACCOUNT_NUMBER,
      amount: withdrawal.finalAmount * 100,
      currency: "INR",
      mode: "UPI",
      purpose: "commission",
      fund_account_id: fundAccountId,
      reference_id: `WD_${withdrawal._id}`,
      narration: "MLM Commission Withdrawal"
    });
    
    return payout;
  } catch (error) {
    console.error("UPI Payout Error:", error);
    throw error;
  }
};

// ================= CHECK PAYOUT STATUS =================
export const checkPayoutStatus = async (payoutId) => {
  try {
    const payout = await razorpay.payouts.fetch(payoutId);
    return payout;
  } catch (error) {
    console.error("Payout Status Error:", error);
    throw error;
  }
};
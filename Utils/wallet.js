import { Wallet } from "../models/wallet.js";
import { Transaction } from "../models/transection.js";
import { User } from "../models/User.js";

export const addTransaction = async ({
  userId,
  type,        
  walletType,  
  amount,
  description,
  status = "paid",
}) => {
  try {
    if (!userId || !amount) {
      throw new Error("userId and amount are required");
    }

    // ================= MAIN WALLET  =================
    if (walletType === "main") {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      if (type === "credit") {
        user.wallet = (user.wallet || 0) + amount;
      } else if (type === "debit") {
        if (user.wallet < amount) throw new Error("Insufficient balance");
        user.wallet = (user.wallet || 0) - amount;
      }
      await user.save();
    }

    // ================= INCOME/ROI/FUND WALLETS  =================
    else if (["income", "roi", "fund"].includes(walletType)) {
      let wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        wallet = await Wallet.create({
          user: userId,
          incomeWallet: { balance: 0, pending: 0 },
          roiWallet: { balance: 0, pending: 0 },
          fundWallet: { balance: 0, pending: 0 }
        });
      }

      const targetWallet = wallet[`${walletType}Wallet`];
      if (!targetWallet) throw new Error("Invalid wallet type");

      if (status === "pending") {
        targetWallet.pending = (targetWallet.pending || 0) + amount;
      } else {
        if (type === "credit") {
          targetWallet.balance = (targetWallet.balance || 0) + amount;
        } else if (type === "debit") {
          if (targetWallet.balance < amount) throw new Error("Insufficient balance");
          targetWallet.balance = (targetWallet.balance || 0) - amount;
        }
      }
      await wallet.save();
    }

    // ================= TRANSACTION HISTORY =================
    const transaction = await Transaction.create({
      user: userId,
      type,
      walletType,
      amount,
      description,
      status
    });

    return transaction;

  } catch (error) {
    console.error("addTransaction Error:", error.message);
    throw error;
  }
};
import { User } from "../models/User.js";
import { Commission } from "../models/commistion.js";
import { Wallet } from "../models/wallet.js";
import { Transaction } from "../models/transection.js"
import { addTransaction } from "../Utils/wallet.js";
import dotenv from "dotenv"
dotenv.config();
// For dashboard summary

export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate("childrenUni referredUsers.user", "name email isActive");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ================== 1. DASHBOARD STATS ==================
    const totalReferrals = (user.activeReferralCount || 0) + (user.pendingReferralCount || 0);
    const activeReferrals = user.activeReferralCount || 0;
    const pendingReferrals = user.pendingReferralCount || 0;

    // Get total earnings from commissions
    const totalEarningsFromCommissions = await Commission.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Merge commission earnings + referral earnings
    const commissionEarnings = totalEarningsFromCommissions[0]?.total || 0;
    const referralEarnings = user.totalReferralEarnings || 0;
    const totalEarnings = commissionEarnings + referralEarnings;

    const monthlyEarning = await Commission.aggregate([
      {
        $match: {
          user: user._id,
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const dashboardStats = {
      totalReferrals,
      activeReferrals,
      pendingReferrals,
      totalEarnings: totalEarnings,
      availableBalance: user.wallet || 0,
      monthlyEarning: monthlyEarning[0]?.total || 0

    };

    // ================== 2. RECENT COMMISSIONS ==================
    const recentCommissions = await Commission.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("fromUser", "name");

    const formattedCommissions = recentCommissions.map((c) => ({
      from: c.fromUser?.name || "System",
      type: c.type,
      amount: c.amount,
      date: c.createdAt,
    }));

    // ================== 3. RECENT ORDERS ==================
    const recentOrders = (user.plans || [])
      .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
      .slice(0, 5)
      .map((p) => ({
        plan: p.name,
        amount: p.amount,
        date: p.purchaseDate,
      }));

    // ================== 4. TOP PERFORMERS ==================
    const topPerformers = await User.find({ parentUnilevel: user._id })
      .sort({ totalEarned: -1 })
      .limit(5)
      .select("name rank totalEarned totalReferralEarnings investment");

    const formattedTop = topPerformers.map((u) => ({
      name: u.name,
      rank: u.rank,
      amount: (u.totalEarned || 0) + (u.totalReferralEarnings || 0),
      investment: u.investment || 0
    }));

    // ================== FINAL RESPONSE ==================
    return res.json({
      success: true,
      data: {
        dashboardStats,
        recentCommissions: formattedCommissions,
        recentOrders,
        topPerformers: formattedTop,
      },
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: error.message });
  }
};
//====================================Quick Action===============================

//=================================Shere Reffal Link==============================

// shere refferal or code
export const getUserReferralDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // NEW WAY - referredUsers field use karo (jo User Schema mein add kiya tha)
    const user = await User.findById(userId).populate("referredUsers.user", "name email createdAt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ================== 1. REFERRAL INFO ==================
    const referralCode = user.referral;
    const referralLink = `${process.env.APP_URL}/register?ref=${referralCode}`;
    console.log(referralCode, referralLink);

    // ================== 2. REFERRAL STATS (FROM USER SCHEMA) ==================
    const totalReferrals = (user.activeReferralCount || 0) + (user.pendingReferralCount || 0);
    const activeReferrals = user.activeReferralCount || 0;
    const pendingReferrals = user.pendingReferralCount || 0;
    const totalEarnings = user.totalReferralEarnings || 0;

    // ================== 3. REFERRAL LIST ==================
    const referralList = (user.referredUsers || []).map((ref) => ({
      name: ref.user?.name || "Unknown",
      email: ref.user?.email || "Unknown",
      joinDate: ref.user?.createdAt,
      status: ref.hasInvested ? "Active" : "Pending",
      selectedPlan: ref.selectedPlan || null,
      investedAt: ref.investedAt,
      amountInvested: ref.amountInvested || 0
    }));

    return res.json({
      success: true,
      data: {
        referralInfo: {
          referralCode,
          referralLink,
        },
        stats: {
          totalReferrals,
          activeReferrals,
          pendingReferrals,
          totalEarnings,
        },
        referralList,
      },
    });

  } catch (error) {
    console.error("Referral Dashboard Error:", error);
    res.status(500).json({ message: error.message });
  }
};



//================================Commission list============================


export const getCommissionDashboard = async (req, res) => {
  try {
    const userId = req.user._id;


    const user = await User.findById(userId);
    console.log(user)
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const baseQuery = {
      user: userId,
      type: "credit",
      description: { $not: /Deposit|Transfer/i }
    };

    // ================= SUMMARY (OPTIMIZED) =================
    const summaryData = await Transaction.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          paid: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0]
            }
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0]
            }
          }
        }
      }
    ]);
    console.log(summaryData)

    // ================= THIS MONTH =================
    const thisMonthData = await Transaction.aggregate([
      {
        $match: {
          ...baseQuery,
          createdAt: {
            $gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            )
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);
    console.log(thisMonthData)
    const summary = {
      total: summaryData[0]?.total || 0,
      paid: summaryData[0]?.paid || 0,
      pending: summaryData[0]?.pending || 0,
      thisMonth: thisMonthData[0]?.total || 0
    };
    console.log(summary)
    // ================= MONTHLY TREND =================
    const trend = await Transaction.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthlyTrend = trend.map((t) => ({
      year: t._id.year,
      month: t._id.month,
      total: t.total
    }));
    console.log(monthlyTrend)
    // ================= HISTORY =================
    const commissions = await Transaction.find(baseQuery)
      .sort({ createdAt: -1 });

    const history = commissions.map((c) => {
      return {
        type: c.description || "General Commission",
        memberName: "System",
        amount: c.amount,
        date: c.createdAt,
        status: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : "Paid"
      };
    });

    // ================= RESPONSE =================
    return res.status(200).json({
      success: true,
      data: {
        summary,
        monthlyTrend,
        history
      }
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// ====================================Wallet===================================




// ================= GET WALLET DASHBOARD =================
export const getWalletDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Main wallet from User model
    const user = await User.findById(userId);
    const mainBalance = user?.wallet || 0;

    // Other wallets from Wallet model
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({
        user: userId,
        incomeWallet: { balance: 0, pending: 0 },
        roiWallet: { balance: 0, pending: 0 },
        fundWallet: { balance: 0, pending: 0 }
      });
    }

    const income = wallet.incomeWallet || { balance: 0, pending: 0 };
    const roi = wallet.roiWallet || { balance: 0, pending: 0 };
    const fund = wallet.fundWallet || { balance: 0, pending: 0 };

    const totalBalance = mainBalance + income.balance + roi.balance + fund.balance;
    const totalPending = income.pending + roi.pending + fund.pending;

    // Transactions
    const transactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    const formattedTransactions = transactions.map(t => ({
      id: t._id,
      type: t.type,
      walletType: t.walletType,
      description: t.description,
      amount: t.amount,
      status: t.status,
      date: t.createdAt
    }));

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalBalance,
          totalPending,
          availableBalance: totalBalance - totalPending
        },
        wallets: {
          main: { balance: mainBalance, pending: 0 },
          income,
          roi,
          fund
        },
        transactions: formattedTransactions
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================= TRANSFER WALLET TO WALLET (FULLY FIXED) =================
const VALID_FROM = ["main", "income", "roi", "fund"];
const VALID_TO = ["income", "roi", "fund"];

export const transferWalletToWallet = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fromWallet, toWallet, amount } = req.body;

    // Validations
    if (!fromWallet || !toWallet || !amount) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }
    if (!VALID_FROM.includes(fromWallet)) {
      return res.status(400).json({ success: false, message: "Invalid from wallet" });
    }
    if (!VALID_TO.includes(toWallet)) {
      return res.status(400).json({ success: false, message: "Invalid to wallet" });
    }
    if (fromWallet === toWallet) {
      return res.status(400).json({ success: false, message: "Cannot transfer to same wallet" });
    }
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // ================= CASE 1: FROM MAIN WALLET =================
    if (fromWallet === "main") {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      if (user.wallet < amount) {
        return res.status(400).json({ success: false, message: "Insufficient balance in main wallet" });
      }

      // Deduct from main
      user.wallet -= amount;
      await user.save();

      // Add to target wallet
      let wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        wallet = await Wallet.create({
          user: userId,
          incomeWallet: { balance: 0, pending: 0 },
          roiWallet: { balance: 0, pending: 0 },
          fundWallet: { balance: 0, pending: 0 }
        });
      }

      const target = wallet[`${toWallet}Wallet`];
      if (!target) {
        return res.status(400).json({ success: false, message: "Invalid target wallet" });
      }

      target.balance = (target.balance || 0) + amount;
      await wallet.save();

      // Transaction record - Debit from source
      await Transaction.create({
        user: userId,
        type: "debit",
        walletType: fromWallet,
        amount,
        description: `Transferred to ${toWallet} wallet`,
        status: "paid"
      });

      // Transaction record - Credit to destination
      await Transaction.create({
        user: userId,
        type: "credit",
        walletType: toWallet,
        amount,
        description: `Received from ${fromWallet} wallet`,
        status: "paid"
      });

      return res.status(200).json({
        success: true,
        message: "Transfer successful",
        data: {
          fromWallet,
          toWallet,
          amount,
          fromBalance: user.wallet,
          toBalance: target.balance
        }
      });
    }

    // ================= CASE 2: FROM INCOME/ROI/FUND WALLET =================
    else {
      let wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        return res.status(404).json({ success: false, message: "Wallet not found" });
      }

      const from = wallet[`${fromWallet}Wallet`];
      const to = wallet[`${toWallet}Wallet`];

      if (!from || !to) {
        return res.status(400).json({ success: false, message: "Invalid wallet structure" });
      }

      if ((from.balance || 0) < amount) {
        return res.status(400).json({ success: false, message: `Insufficient balance in ${fromWallet} wallet` });
      }

      // Transfer
      from.balance = (from.balance || 0) - amount;
      to.balance = (to.balance || 0) + amount;
      await wallet.save();

      // Transaction record - Debit from source
      await Transaction.create({
        user: userId,
        type: "debit",
        walletType: fromWallet,
        amount,
        description: `Transferred to ${toWallet} wallet`,
        status: "paid"
      });

      // Transaction record - Credit to destination
      await Transaction.create({
        user: userId,
        type: "credit",
        walletType: toWallet,
        amount,
        description: `Received from ${fromWallet} wallet`,
        status: "paid"
      });

      return res.status(200).json({
        success: true,
        message: "Transfer successful",
        data: {
          fromWallet,
          toWallet,
          amount,
          fromBalance: from.balance,
          toBalance: to.balance
        }
      });
    }

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};



//=============================My Team /Downline======================================




const getUserLevel = async (rootId, targetId) => {
  const queue = [{ id: rootId, level: 1 }];
  const visited = new Set();

  while (queue.length) {
    const { id, level } = queue.shift();

    if (!id || visited.has(id.toString())) continue;
    visited.add(id.toString());

    if (id.toString() === targetId.toString()) {
      return level;
    }

    const user = await User.findById(id);
    if (!user) continue;

    const children = [
      user.left,
      user.right,
      user.leftMatrix,
      user.middleMatrix,
      user.rightMatrix,
      ...(user.childrenUni || [])
    ];

    for (let c of children) {
      if (c) queue.push({ id: c, level: level + 1 });
    }
  }

  return 0;
};


export const getNetworkDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const search = req.query.search || "";

    const rootUser = await User.findById(userId);
    if (!rootUser) {
      return res.status(404).json({ message: "User not found" });
    }

    /* =========================
       GET ALL MEMBERS (3 TREES)
    ========================= */
    const rawMembers = await User.find({
      $or: [
        { parent: userId },
        { parentMatrix: userId },
        { parentUnilevel: userId }
      ]
    });

    /* =========================
       SEARCH FILTER
    ========================= */
    let filtered = rawMembers;

    if (search) {
      filtered = rawMembers.filter((m) =>
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase()) ||
        m._id.toString().includes(search)
      );
    }

    /* =========================
       FORMAT MEMBERS LIST
    ========================= */
    const members = await Promise.all(
      filtered.map(async (m) => ({
        id: m._id,
        name: m.name,

        // REAL LEVEL (1,2,3...)
        level: await getUserLevel(userId, m._id),

        referrals: m.childrenUni?.length || 0,
        totalEarning: m.totalEarned,
        joinDate: m.createdAt
      }))
    );

    /* =========================
       LEVEL WISE COUNT
    ========================= */
    const levelMap = {};

    members.forEach((m) => {
      levelMap[m.level] = (levelMap[m.level] || 0) + 1;
    });

    const levelSummary = Object.keys(levelMap).map((lvl) => ({
      level: Number(lvl),
      members: levelMap[lvl]
    }));

    const totalMembers = members.length;

    /* =========================
       NETWORK GROWTH
    ========================= */
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const newMembers = await User.countDocuments({
      createdAt: { $gte: last7Days }
    });


    return res.status(200).json({
      success: true,
      data: {
        totalMembers,
        levelSummary,

        networkGrowth: {
          totalMembers,
          newMembers
        },


        search,


        members
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};


//==============================Get Investment Plans====================================



export const getInvestmentDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const today = new Date();

    //  INVESTMENT SUMMARY (Top Cards) ---
    const summary = {
      totalInvestedAmount: user.investment || 0,
      totalReturnAmount: user.roiGiven || 0,
      pendingReturnAmount: Math.max(0, (user.maxEarning || 0) - (user.roiGiven || 0)),
      activeInvestment: (user.roiEndDate && today <= new Date(user.roiEndDate)) ? user.investment : 0,
    };

    //  MONTHLY EARNINGS TREND (Last 6 Months) ---
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const earnings = await Transaction.find({
      userId: userId,
      type: "credit",
      createdAt: { $gte: sixMonthsAgo }
    });

    const monthlyTrend = {};

    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = d.toLocaleString('default', { month: 'short' });
      monthlyTrend[mName] = 0;
    }

    earnings.forEach(tx => {
      const month = tx.createdAt.toLocaleString('default', { month: 'short' });
      if (monthlyTrend[month] !== undefined) {
        monthlyTrend[month] += tx.amount;
      }
    });


    const plansHistory = user.plans.map((plan) => {
      const isExpired = user.roiEndDate && today > new Date(user.roiEndDate);


      const roiPercent = user.dailyROI ? ((user.dailyROI / plan.amount) * 100).toFixed(2) : "0";

      return {
        planName: plan.name,
        rank: user.rank || "Bronze",
        amount: plan.amount,
        returnReceived: user.roiGiven,
        roiPercentage: `${roiPercent}%`,
        startDate: plan.purchaseDate,
        endDate: user.roiEndDate,
        status: isExpired ? "Completed" : "Pending"
      };
    });

    // --- FINAL RESPONSE ---
    return res.status(200).json({
      success: true,
      data: {
        summary,
        monthlyTrend: Object.keys(monthlyTrend).map(month => ({ month, amount: monthlyTrend[month] })).reverse(),
        plansHistory
      }
    });

  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
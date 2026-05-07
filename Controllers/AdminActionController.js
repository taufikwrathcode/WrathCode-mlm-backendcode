import { BinaryConfig } from "../models/adminBinaryPlanconfig.js";
import { UnilevelConfig } from "../models/AdminUnilevelPlanconfig.js";
import { MatrixConfig } from "../models/adminMatrixPlanconfig.js";
import { ROIConfig } from "../models/ROI.js";
import { RankPlan } from "../models/RankPlan.js";
import { RANK_PLANS } from "../Utils/RANK_PLANS.js";
import { User } from "../models/User.js";
import { Deposit } from "../models/deposit.js";
import { addTransaction } from "../Utils/wallet.js";
import { Commission } from "../models/commistion.js";
import { IncomeConfig } from "../models/incomconfig.js";
import { Wallet } from "../models/wallet.js";
import { Transaction } from "../models/transection.js";
//===========================BINARY PLAN=========================
export const updateBinaryConfig = async (req, res) => {
  try {
    const {
      pairValue,
      leftRightRatio,
      carryForward,
      dailyCapping,
      weeklyCapping,
      flushOut,
    } = req.body;

    let config = await BinaryConfig.findOne();

    if (!config) {
      config = new BinaryConfig();
    }

    if (pairValue !== undefined) config.pairValue = pairValue;
    if (leftRightRatio !== undefined) config.leftRightRatio = leftRightRatio;
    if (carryForward !== undefined) config.carryForward = carryForward;
    if (dailyCapping !== undefined) config.dailyCapping = dailyCapping;
    if (weeklyCapping !== undefined) config.weeklyCapping = weeklyCapping;
    if (flushOut !== undefined) config.flushOut = flushOut;

    await config.save();

    res.status(200).json({
      success: true,
      message: "Binary configuration updated",
      data: config,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetBinaryConfig = async (req, res) => {
  try {
    let config = await BinaryConfig.findOne();

    const defaultConfig = {
      pairValue: 100,
      leftRightRatio: "1:1",
      carryForward: true,
      dailyCapping: 5000,
      weeklyCapping: 25000,
      flushOut: false,
    };

    if (config) {
      Object.assign(config, defaultConfig);
      await config.save();
    } else {
      config = await BinaryConfig.create(defaultConfig);
    }

    res.status(200).json({
      success: true,
      message: "Binary configuration reset to default",
      data: config,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= UNILEVEL PLAN  =================
export const updateUnilevelConfig = async (req, res) => {
  try {
    const { levelDepth, sponsorIncome, levelCommission } = req.body;

    let config = await UnilevelConfig.findOne();

    if (!config) {
      config = new UnilevelConfig();
    }

    if (levelDepth !== undefined) config.levelDepth = levelDepth;
    if (sponsorIncome !== undefined) config.sponsorIncome = sponsorIncome;
    if (levelCommission !== undefined) config.levelCommission = levelCommission;

    await config.save();

    res.status(200).json({
      success: true,
      message: "Unilevel configuration updated",
      data: config,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetUnilevelConfig = async (req, res) => {
  try {
    let config = await UnilevelConfig.findOne();

    const defaultConfig = {
      levelDepth: 10,
      sponsorIncome: 5,
      levelCommission: [
        { level: 1, percentage: 10 },
        { level: 2, percentage: 5 },
        { level: 3, percentage: 3 },
        { level: 4, percentage: 2 },
        { level: 5, percentage: 1 },
      ],
    };

    if (config) {
      config.levelDepth = defaultConfig.levelDepth;
      config.sponsorIncome = defaultConfig.sponsorIncome;
      config.levelCommission = defaultConfig.levelCommission;
      await config.save();
    } else {
      config = await UnilevelConfig.create(defaultConfig);
    }

    res.status(200).json({
      success: true,
      message: "Unilevel configuration reset to default",
      data: config,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =================  MATRIX PLAN =================
export const updateMatrixConfig = async (req, res) => {
  try {
    const { matrixSize, spilloverLogic, reEntryAllowed, reEntryLevel } =
      req.body;

    let config = await MatrixConfig.findOne();

    if (!config) {
      config = new MatrixConfig();
    }

    if (matrixSize !== undefined) config.matrixSize = matrixSize;
    if (spilloverLogic !== undefined) config.spilloverLogic = spilloverLogic;
    if (reEntryAllowed !== undefined) config.reEntryAllowed = reEntryAllowed;
    if (reEntryLevel !== undefined) config.reEntryLevel = reEntryLevel;

    await config.save();

    res.status(200).json({
      success: true,
      message: "Matrix configuration updated",
      data: config,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetMatrixConfig = async (req, res) => {
  try {
    let config = await MatrixConfig.findOne();

    const defaultConfig = {
      matrixSize: "3x3",
      spilloverLogic: "auto",
      reEntryAllowed: false,
      reEntryLevel: 0,
    };

    if (config) {
      config.matrixSize = defaultConfig.matrixSize;
      config.spilloverLogic = defaultConfig.spilloverLogic;
      config.reEntryAllowed = defaultConfig.reEntryAllowed;
      config.reEntryLevel = defaultConfig.reEntryLevel;
      await config.save();
    } else {
      config = await MatrixConfig.create(defaultConfig);
    }

    res.status(200).json({
      success: true,
      message: "Matrix configuration reset to default",
      data: config,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//=======================ROI PLAN=======================

export const updateROIConfig = async (req, res) => {
  try {
    const {
      roiPercentage,
      roiFrequency,
      validityPeriod,
      capitalLock,
      roiStopConditions,
      maxROIAmount,
      isActive,
    } = req.body;

    let config = await ROIConfig.findOne();

    if (!config) {
      config = new ROIConfig();
    }

    if (roiPercentage !== undefined) config.roiPercentage = roiPercentage;
    if (roiFrequency !== undefined) config.roiFrequency = roiFrequency;
    if (validityPeriod !== undefined) config.validityPeriod = validityPeriod;
    if (capitalLock !== undefined) config.capitalLock = capitalLock;
    if (roiStopConditions !== undefined)
      config.roiStopConditions = roiStopConditions;
    if (maxROIAmount !== undefined) config.maxROIAmount = maxROIAmount;
    if (isActive !== undefined) config.isActive = isActive;

    config.updatedBy = req.admin._id;
    await config.save();

    res.status(200).json({
      success: true,
      message: "ROI configuration updated",
      data: config,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetROIConfig = async (req, res) => {
  try {
    let config = await ROIConfig.findOne();

    const defaultConfig = {
      roiPercentage: 5,
      roiFrequency: "daily",
      validityPeriod: 30,
      capitalLock: false,
      roiStopConditions: ["period_expiry", "max_reached"],
      maxROIAmount: 0,
      isActive: true,
    };

    if (config) {
      config.roiPercentage = defaultConfig.roiPercentage;
      config.roiFrequency = defaultConfig.roiFrequency;
      config.validityPeriod = defaultConfig.validityPeriod;
      config.capitalLock = defaultConfig.capitalLock;
      config.roiStopConditions = defaultConfig.roiStopConditions;
      config.maxROIAmount = defaultConfig.maxROIAmount;
      config.isActive = defaultConfig.isActive;
      config.updatedBy = req.admin._id;
      await config.save();
    } else {
      config = await ROIConfig.create(defaultConfig);
    }

    res.status(200).json({
      success: true,
      message: "ROI configuration reset to default",
      data: config,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//============================Rank invesment/Pakege=======================

export const updateRankPlan = async (req, res) => {
  try {
    const { rank } = req.params;
    const { min, max, roi, duration, dailyPercent } = req.body;

    if (!RANK_PLANS[rank]) {
      return res
        .status(404)
        .json({ success: false, message: "Rank not found" });
    }

    let plan = await RankPlan.findOne({ rank });

    if (!plan) {
      plan = new RankPlan({ rank });
    }

    if (min !== undefined) plan.min = min;
    if (max !== undefined) plan.max = max;
    if (roi !== undefined) plan.roi = roi;
    if (duration !== undefined) plan.duration = duration;
    if (dailyPercent !== undefined) plan.dailyPercent = dailyPercent;

    plan.updatedBy = req.admin._id;
    await plan.save();

    res.status(200).json({
      success: true,
      message: `${rank} plan updated successfully`,
      data: {
        rank,
        min: plan.min ?? RANK_PLANS[rank].min,
        max: plan.max ?? RANK_PLANS[rank].max,
        roi: plan.roi ?? RANK_PLANS[rank].roi,
        duration: plan.duration ?? RANK_PLANS[rank].duration,
        dailyPercent: plan.dailyPercent ?? RANK_PLANS[rank].dailyPercent,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetRankPlan = async (req, res) => {
  try {
    const { rank } = req.params;

    await RankPlan.findOneAndDelete({ rank });

    res.status(200).json({
      success: true,
      message: `${rank} plan reset to default`,
      data: RANK_PLANS[rank],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= CREATE INVESTMENT ===================
export const createInvestment = async (req, res) => {
  try {
    const { userName, plan, amount, roi, status, date } = req.body;
    
    if (!userName) {
      return res.status(400).json({ success: false, message: "userName is required" });
    }
    
    const user = await User.findOne({ name: userName });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with this name" });
    }
    
    if (plan && ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "VIP"].includes(plan)) {
      user.rank = plan;
    }
    
    user.investment = (user.investment || 0) + amount;
    user.wallet = (user.wallet || 0) - amount;
    user.isActive = true;
    
    if (!user.plans) user.plans = [];
    user.plans.push({
      name: "Binary",
      amount: amount,
      purchaseDate: date ? new Date(date) : new Date(),
      status: status || "active"
    });
    
    if (roi) {
      user.maxEarning = (user.maxEarning || 0) + (amount * roi) / 100;
    }
    
    await user.save();
    
    const rankLimits = RANK_PLANS[user.rank] || RANK_PLANS.Bronze;
    
    res.status(201).json({
      success: true,
      message: "Investment created successfully",
      data: {
        userName: user.name,
        plan: user.rank,
        amount: amount,
        roi: `${roi || rankLimits.roi}%`,
        status: status || "active",
        date: date || new Date()
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= UPDATE INVESTMENT =================================
export const updateInvestment = async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan, amount, roi, status, date } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const plans = user.plans || [];
    if (plans.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No investment found for this user" });
    }

    const latestPlan = plans[plans.length - 1];

    if (plan) {
      if (
        ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "VIP"].includes(
          plan,
        )
      ) {
        user.rank = plan;
      }
    }

    if (amount) {
      const oldAmount = latestPlan.amount;
      user.investment = (user.investment || 0) + (amount - oldAmount);
      latestPlan.amount = amount;
    }

    if (roi) {
      const newMaxEarning = (latestPlan.amount * roi) / 100;
      user.maxEarning = newMaxEarning;
    }

    if (status) {
      latestPlan.status = status;
    }

    if (date) {
      latestPlan.purchaseDate = new Date(date);
    }

    await user.save();

    const rankLimits = RANK_PLANS[user.rank] || RANK_PLANS.Bronze;

    res.status(200).json({
      success: true,
      message: "Investment updated successfully",
      data: {
        userName: user.name,
        plan: user.rank,
        amount: latestPlan.amount,
        roi: `${roi || rankLimits.roi}%`,
        status: latestPlan.status,
        date: latestPlan.purchaseDate,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ================= CREATE NEW DEPOSIT =================
export const createDeposit = async (req, res) => {
  try {
    const { userName, amount, paymentMethod, transactionId, date, status } = req.body;
    
    if (!userName) {
      return res.status(400).json({ success: false, message: "userName is required" });
    }
    
    const user = await User.findOne({ name: userName });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with this name" });
    }
    
    const newDeposit = await Deposit.create({
      user: user._id,
      amount: amount,
      method: paymentMethod,
      razorpayPaymentId: transactionId,
      status: status || "pending",
      createdAt: date ? new Date(date) : new Date()
    });
    
    if (status === "approved") {
      
      await addTransaction({
        userId: user._id,
        type: "credit",
        walletType: "main",
        amount: amount,
        description: `Deposit: ${transactionId}`,
        status: "paid"
      });
    }
    
    res.status(201).json({
      success: true,
      message: "Deposit created successfully",
      data: {
        userName: user.name,
        amount: newDeposit.amount,
        paymentMethod: newDeposit.method,
        transactionId: newDeposit.razorpayPaymentId,
        date: newDeposit.createdAt,
        status: newDeposit.status
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ================= UPDATE DEPOSIT (BY USER ID) =================

export const updateDeposit = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Status must be 'approved' or 'rejected'" 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // ✅ Find the LATEST PENDING deposit
    const deposit = await Deposit.findOne({ 
      user: userId, 
      status: "pending" 
    }).sort({ createdAt: -1 });
    
    if (!deposit) {
      return res.status(404).json({ success: false, message: "No pending deposit found" });
    }
    
    const depositAmount = deposit.amount;
    
    if (deposit.status === "approved") {
      return res.status(400).json({ 
        success: false, 
        message: "Deposit already approved" 
      });
    }
    
    // ✅ Update deposit status
    deposit.status = status;
    deposit.approvedBy = req.admin._id;
    deposit.approvedAt = new Date();
    await deposit.save();
    
    if (status === "approved") {
      // ✅ CUMULATIVE: Add to existing wallet
      
      await addTransaction({
        userId: user._id,
        type: "credit",
        walletType: "main",
        amount: depositAmount,
        description: `Deposit approved: ${deposit.transactionId}`,
        status: "paid"
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Deposit ${status} successfully`,
      data: {
        userName: user.name,
        amount: depositAmount,
        paymentMethod: deposit.method,
        transactionId: deposit.transactionId,
        date: deposit.createdAt,
        status: deposit.status,
        walletBalance: user.wallet
      }
    });
    
  } catch (error) {
    console.error("Update Deposit Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// ================= CREATE NEW COMMISSION =================
export const createCommission = async (req, res) => {
  try {
    const { userName, type, amount, plan, level, status, date } = req.body;
    
    if (!userName) {
      return res.status(400).json({ success: false, message: "userName is required" });
    }
    
    const user = await User.findOne({ name: userName });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with this name" });
    }
    
    const newCommission = await Commission.create({
      user: user._id,
      type: type,
      amount: amount,
      plan: plan,
      level: level || 0,
      status: status || "paid",
      createdAt: date ? new Date(date) : new Date()
    });
    
    // Update user wallet if commission is paid
    if (status === "paid") {
      user.wallet = (user.wallet || 0) + amount;
      user.totalEarned = (user.totalEarned || 0) + amount;
      await user.save();
    }
    
    res.status(201).json({
      success: true,
      message: "Commission created successfully",
      data: {
        userName: user.name,
        type: newCommission.type,
        amount: newCommission.amount,
        plan: newCommission.plan,
        level: newCommission.level,
        status: newCommission.status,
        date: newCommission.createdAt
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= UPDATE COMMISSION  =================
export const updateCommission = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, type, plan, level, status, date } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const commission = await Commission.findOne({ user: userId }).sort({ createdAt: -1 });
    if (!commission) {
      return res.status(404).json({ success: false, message: "No commission found for this user" });
    }
    
    const oldAmount = commission.amount;
    const oldStatus = commission.status;
    
    if (amount) commission.amount = amount;
    if (type) commission.type = type;
    if (plan) commission.plan = plan;
    if (level !== undefined) commission.level = level;
    if (status) commission.status = status;
    if (date) commission.createdAt = new Date(date);
    
    await commission.save();
    
    // Update user wallet if status changed to paid
    if (status === "paid" && oldStatus !== "paid") {
      user.wallet = (user.wallet || 0) + commission.amount;
      user.totalEarned = (user.totalEarned || 0) + commission.amount;
      await user.save();
    }
    
    // If status changed from paid to something else
    if (oldStatus === "paid" && status !== "paid") {
      user.wallet = (user.wallet || 0) - oldAmount;
      user.totalEarned = (user.totalEarned || 0) - oldAmount;
      await user.save();
    }
    
    res.status(200).json({
      success: true,
      message: "Commission updated successfully",
      data: {
        userName: user.name,
        type: commission.type,
        amount: commission.amount,
        plan: commission.plan,
        level: commission.level,
        status: commission.status,
        date: commission.createdAt
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ================= UPDATE INCOME CONFIGURATION =================
export const updateIncomeConfig = async (req, res) => {
  try {
    let config = await IncomeConfig.findOne();
    
    if (!config) {
      config = new IncomeConfig();
    }
    
    const {
      directCommission,
      levelCommission,
      binaryCommission,
      matchingBonus,
      leadershipBonus,
      roiCommission,
      rewardBonus
    } = req.body;
    
    if (directCommission) {
      config.directCommission = { ...config.directCommission, ...directCommission };
    }
    
    if (levelCommission) {
      config.levelCommission = { ...config.levelCommission, ...levelCommission };
    }
    
    if (binaryCommission) {
      config.binaryCommission = { ...config.binaryCommission, ...binaryCommission };
    }
    
    if (matchingBonus) {
      config.matchingBonus = { ...config.matchingBonus, ...matchingBonus };
    }
    
    if (leadershipBonus) {
      config.leadershipBonus = { ...config.leadershipBonus, ...leadershipBonus };
    }
    
    if (roiCommission) {
      config.roiCommission = { ...config.roiCommission, ...roiCommission };
    }
    
    if (rewardBonus) {
      config.rewardBonus = { ...config.rewardBonus, ...rewardBonus };
    }
    
    config.updatedBy = req.admin._id;
    await config.save();
    
    res.status(200).json({
      success: true,
      message: "Income configuration updated successfully",
      data: config
    });
    
  } catch (error) {
    console.error("Update Income Config Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ================= 2. UPDATE USER WALLET STATUS  =================
export const updateWalletStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    if (!status || !["active", "reject"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'active' or 'reject'" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    if (status === "active") {
      user.isActive = true;
    } else if (status === "reject") {
      user.isActive = false;
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `Wallet ${status === "active" ? "activated" : "rejected/frozen"} successfully`,
      data: {
        userId: user._id,
        userName: user.name,
        status: status
      }
    });
    
  } catch (error) {
    console.error("Update Wallet Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


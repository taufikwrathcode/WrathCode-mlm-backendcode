import { User } from "../models/User.js";
import { BinaryConfig } from "../models/adminBinaryPlanconfig.js";
import { checkRank } from "./RANK.js";
import { addTransaction } from "./wallet.js";

export const distributeBinaryIncome = async (userId) => {
  // Read config from database
  let config = await BinaryConfig.findOne();
  if (!config) {
    config = {
      pairValue: 100,
      leftRightRatio: "1:1",
      carryForward: true,
      dailyCapping: false,
      dailyMaxIncome: 5000,
      weeklyCapping: false,
      weeklyMaxIncome: 25000
    };
  }

  // Parse ratio (e.g., "2:1" -> leftRatio=2, rightRatio=1)
  const [leftRatio, rightRatio] = config.leftRightRatio.split(":").map(Number);
  
  let current = await User.findById(userId);
  let level = 0;
  const MAX_LEVEL = 10;

  while (current && current.parent && level < MAX_LEVEL) {
    const parent = await User.findById(current.parent);
    if (!parent) break;

    // Update business count
    if (current.position === "left") {
      parent.leftBusiness = (parent.leftBusiness || 0) + 1;
    } else {
      parent.rightBusiness = (parent.rightBusiness || 0) + 1;
    }

    // Calculate total with carry
    let leftTotal = (parent.leftBusiness || 0) + (parent.leftCarry || 0);
    let rightTotal = (parent.rightBusiness || 0) + (parent.rightCarry || 0);
    
    // Calculate pairs based on ratio
    let leftPairs = Math.floor(leftTotal / leftRatio);
    let rightPairs = Math.floor(rightTotal / rightRatio);
    let pairs = Math.min(leftPairs, rightPairs);

    if (pairs > 0) {
      let income = pairs * config.pairValue;

      // ROI Cap Check
      if (parent.maxEarning > 0 && parent.totalEarned >= parent.maxEarning) {
        income = 0;
      } else if (parent.maxEarning > 0 && parent.totalEarned + income > parent.maxEarning) {
        income = parent.maxEarning - parent.totalEarned;
      }

      // Daily Capping Check
      if (config.dailyCapping && income > 0) {
        const today = new Date().toDateString();
        if (parent.lastDailyDate?.toDateString() !== today) {
          parent.dailyIncome = 0;
          parent.lastDailyDate = new Date();
        }
        const remaining = config.dailyMaxIncome - (parent.dailyIncome || 0);
        if (income > remaining) income = remaining;
        if (income > 0) parent.dailyIncome = (parent.dailyIncome || 0) + income;
      }

      // Weekly Capping Check
      if (config.weeklyCapping && income > 0) {
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        if (parent.lastWeeklyDate?.toDateString() !== weekStart.toDateString()) {
          parent.weeklyIncome = 0;
          parent.lastWeeklyDate = weekStart;
        }
        const remaining = config.weeklyMaxIncome - (parent.weeklyIncome || 0);
        if (income > remaining) income = remaining;
        if (income > 0) parent.weeklyIncome = (parent.weeklyIncome || 0) + income;
      }

      if (income > 0) {
        await addTransaction({
          userId: parent._id,
          type: "credit",
          walletType: "main",
          amount: income,
          description: `Binary Level ${level + 1} Income (${pairs} pairs)`,
          status: "paid"
        });
        
        parent.totalEarned = (parent.totalEarned || 0) + income;
      }

      // Carry forward logic
      if (config.carryForward) {
        parent.leftCarry = leftTotal - (pairs * leftRatio);
        parent.rightCarry = rightTotal - (pairs * rightRatio);
      } else {
        parent.leftCarry = 0;
        parent.rightCarry = 0;
      }
      
      parent.leftBusiness = 0;
      parent.rightBusiness = 0;
    }

    await parent.save();
    await checkRank(parent._id);
    current = parent;
    level++;
  }
};
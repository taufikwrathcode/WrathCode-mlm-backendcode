import { User } from "../models/User.js";
import { BinaryConfig } from "../models/adminBinaryPlanconfig.js";
import { checkRank } from "./RANK.js";
import { addTransaction } from "./wallet.js";

export const distributeBinaryIncome = async (userId) => {
  
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

  
  const [leftRatio, rightRatio] = config.leftRightRatio.split(":").map(Number);
  
  let current = await User.findById(userId);
  let level = 0;
  const MAX_LEVEL = 10;

  while (current && current.parent && level < MAX_LEVEL) {
    const parent = await User.findById(current.parent);
    if (!parent) break;

    
    if (current.position === "left") {
      parent.leftBusiness = (parent.leftBusiness || 0) + 1;
    } else {
      parent.rightBusiness = (parent.rightBusiness || 0) + 1;
    }

    
    let leftTotal = (parent.leftBusiness || 0) + (parent.leftCarry || 0);
    let rightTotal = (parent.rightBusiness || 0) + (parent.rightCarry || 0);
    
    
    let leftPairs = Math.floor(leftTotal / leftRatio);
    let rightPairs = Math.floor(rightTotal / rightRatio);
    let pairs = Math.min(leftPairs, rightPairs);

    if (pairs > 0) {
      let income = pairs * config.pairValue;

    
      if (parent.maxEarning > 0 && parent.totalEarned >= parent.maxEarning) {
        income = 0;
      } else if (parent.maxEarning > 0 && parent.totalEarned + income > parent.maxEarning) {
        income = parent.maxEarning - parent.totalEarned;
      }

      
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
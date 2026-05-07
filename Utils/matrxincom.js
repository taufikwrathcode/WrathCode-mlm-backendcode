import { User } from "../models/User.js";
import { MatrixConfig } from "../models/adminMatrixPlanconfig.js";
import { addTransaction } from "./wallet.js";
import { checkRank } from "./RANK.js";

export const distributeMatrixIncome = async (user, amount) => {
  // Read config from database
  let config = await MatrixConfig.findOne();
  if (!config) {
    config = {
      levelDepth: 6,
      sponsorIncome: 5,
      levelCommission: [
        { level: 1, percentage: 10 },
        { level: 2, percentage: 5 },
        { level: 3, percentage: 3 },
        { level: 4, percentage: 2 },
        { level: 5, percentage: 1 },
        { level: 6, percentage: 1 }
      ]
    };
  }

  let current = user;
  let level = 0;

  while (level < config.levelDepth) {
    let parentId = current.parentMatrix;
    if (!parentId) break;

    const parent = await User.findById(parentId);
    if (!parent) break;

    // Find percentage for this level
    let levelConfig = config.levelCommission.find(l => l.level === level + 1);
    let percent = levelConfig ? levelConfig.percentage : 1;
    let income = (amount * percent) / 100;

    // ROI Cap Check
    if (parent.maxEarning > 0 && parent.totalEarned >= parent.maxEarning) {
      income = 0;
    } else if (parent.maxEarning > 0 && parent.totalEarned + income > parent.maxEarning) {
      income = parent.maxEarning - parent.totalEarned;
    }

    if (income > 0) {
      await addTransaction({
        userId: parent._id,
        type: "credit",
        walletType: "main",
        amount: income,
        description: `Matrix Level ${level + 1} Income (${percent}%)`,
        status: "paid"
      });
      
      parent.totalEarned = (parent.totalEarned || 0) + income;
      await parent.save();
    }

    await checkRank(parent._id);
    current = parent;
    level++;
  }
};
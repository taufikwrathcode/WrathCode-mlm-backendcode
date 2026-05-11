import { User } from "../models/User.js";
import { addTransaction } from "./wallet.js";
import { checkRank } from "./RANK.js";

export const LEVEL_PERCENT = [10, 5, 4, 3, 2, 1.5, 1];

export const distributeLevelIncome = async (user, amount, planName = "General") => {
  let current = user;
  let level = 0;

  while (level < LEVEL_PERCENT.length) {
    let parentId = current.parent || current.parentMatrix || current.parentUnilevel;
    if (!parentId) break;

    const parent = await User.findById(parentId);
    if (!parent) break;

    const percent = LEVEL_PERCENT[level];
    let income = (amount * percent) / 100;

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
        description: `Level ${level + 1} Commission from ${planName} (${percent}%)`,
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
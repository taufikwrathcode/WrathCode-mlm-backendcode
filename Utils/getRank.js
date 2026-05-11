import { RANK_PLANS } from "./RANK_PLANS.js";


const RANK_ORDER = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "VIP"];


export const getRankByInvestment = (
  investmentAmount,
  userCurrentRank = null,
) => {
  // ==================== VALIDATION ====================


  if (investmentAmount === null || investmentAmount === undefined) {
    throw new Error("Investment amount is required");
  }

  
  const amount = Number(investmentAmount);

  
  if (isNaN(amount)) {
    throw new Error("Investment amount must be a valid number");
  }

  
  if (amount <= 0) {
    throw new Error("Investment amount must be greater than 0");
  }

  if (!Number.isInteger(amount)) {
    throw new Error("Investment amount must be a whole number");
  }

  // ==================== RANK PROGRESSION CHECK ====================


  if (!userCurrentRank || userCurrentRank === null) {
    
    const bronzeLimit = RANK_PLANS.Bronze;
    if (amount < bronzeLimit.min || amount > bronzeLimit.max) {
      throw new Error(
        `First investment must be between ₹${bronzeLimit.min} - ₹${bronzeLimit.max} (Bronze Rank)`,
      );
    }

    return {
      rank: "Bronze",
      limits: bronzeLimit,
      dailyROI: (amount * bronzeLimit.dailyPercent) / 100,
      maxEarning: amount + (amount * bronzeLimit.roi) / 100,
      nextRank: "Silver",
    };
  }

  
  if (!RANK_ORDER.includes(userCurrentRank)) {
    throw new Error(`Invalid current rank: ${userCurrentRank}`);
  }


  const currentRankIndex = RANK_ORDER.indexOf(userCurrentRank);
  if (currentRankIndex === RANK_ORDER.length - 1) {
    throw new Error(
      `You have already reached VIP (highest rank). Cannot invest further.`,
    );
  }

  const nextRankName = RANK_ORDER[currentRankIndex + 1];
  const nextRankLimit = RANK_PLANS[nextRankName];

  
  if (amount < nextRankLimit.min || amount > nextRankLimit.max) {
    throw new Error(
      `To upgrade to ${nextRankName}, invest between ₹${nextRankLimit.min} - ₹${nextRankLimit.max}`,
    );
  }

  return {
    rank: nextRankName,
    limits: nextRankLimit,
    dailyROI: (amount * nextRankLimit.dailyPercent) / 100,
    maxEarning: amount + (amount * nextRankLimit.roi) / 100,
    nextRank:
      currentRankIndex + 2 < RANK_ORDER.length
        ? RANK_ORDER[currentRankIndex + 2]
        : null,
    upgradeFromRank: userCurrentRank,
  };
};


export const getNextRankInfo = (userCurrentRank = null) => {
  if (!userCurrentRank) {
    return {
      currentRank: "None",
      nextRank: "Bronze",
      minInvest: RANK_PLANS.Bronze.min,
      maxInvest: RANK_PLANS.Bronze.max,
      roi: RANK_PLANS.Bronze.roi,
      dailyPercent: RANK_PLANS.Bronze.dailyPercent,
      duration: RANK_PLANS.Bronze.duration,
      message: "Start your investment journey with Bronze rank",
    };
  }

  const currentIndex = RANK_ORDER.indexOf(userCurrentRank);

  if (currentIndex === -1 || currentIndex === RANK_ORDER.length - 1) {
    return {
      currentRank: userCurrentRank,
      nextRank: null,
      message:
        userCurrentRank === "VIP"
          ? "You have reached the highest rank!"
          : "Invalid rank",
    };
  }

  const nextRank = RANK_ORDER[currentIndex + 1];
  const nextLimits = RANK_PLANS[nextRank];

  return {
    currentRank: userCurrentRank,
    nextRank: nextRank,
    minInvest: nextLimits.min,
    maxInvest: nextLimits.max,
    roi: nextLimits.roi,
    dailyPercent: nextLimits.dailyPercent,
    duration: nextLimits.duration,
    message: `Upgrade to ${nextRank} by investing ₹${nextLimits.min} - ₹${nextLimits.max}`,
  };
};



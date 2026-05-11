import { User } from "../models/User.js";


const countDownlines = async (userId) => {
  try {
    const stats = { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0, vip: 0 };

    
    const directChildren = await User.find({ 
      parentUnilevel: userId,
      isActive: true 
    }).select("_id userRank");

    for (let child of directChildren) {
    
      const currentRank = (child.userRank || "Bronze").toLowerCase();
      if (stats.hasOwnProperty(currentRank)) {
        stats[currentRank] += 1;
      }

      
      const childStats = await countDownlines(child._id);
      for (let key in childStats) {
        stats[key] += childStats[key];
      }
    }

    return stats;
  } catch (error) {
    console.error("countDownlines Error:", error.message);
    return { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0, vip: 0 };
  }
};


 
const RANKS = [
  { name: "VIP", requirement: { diamond: 2, platinum: 4, gold: 10, silver: 20, bronze: 50 } },
  { name: "Diamond", requirement: { platinum: 2, gold: 4, silver: 10, bronze: 20 } },
  { name: "Platinum", requirement: { gold: 2, silver: 4, bronze: 9 } },
  { name: "Gold", requirement: { silver: 2, bronze: 4 } },
  { name: "Silver", requirement: { bronze: 2 } },
  { name: "Bronze", requirement: {} }
];


 
 
export const checkRank = async (userId) => {
  try {
    const stats = await countDownlines(userId);
    const user = await User.findById(userId);
    if (!user) return "Bronze";

    
    const currentRankName = user.userRank || "Bronze";
    
    
    for (let rank of RANKS) {
      let canUpgrade = true;
      for (let key in rank.requirement) {
        if ((stats[key] || 0) < rank.requirement[key]) {
          canUpgrade = false;
          break;
        }
      }

      if (canUpgrade) {
        
        if (rank.name !== currentRankName) {
          user.userRank = rank.name;
          await user.save();
          console.log(`Rank Upgraded: ${user.name} is now ${rank.name}`);
        }
        return rank.name;
      }
    }
    return user.userRank || "Bronze";
  } catch (error) {
    console.error("checkRank Error:", error.message);
    return "Bronze";
  }
};
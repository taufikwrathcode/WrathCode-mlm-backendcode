import { User } from "../models/User.js";


const countDownlines = async (userId) => {
  const user = await User.findById(userId);

  if (!user) return {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0,
    diamond: 0,
    vip: 0,
    
  };

  let stats = {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0,
    diamond: 0,
    vip: 0,
    
  };

  for (let childId of user.downlines || []) {
    const child = await User.findById(childId);
    if (!child) continue;

  
    stats[child.rank.toLowerCase()] += 1;

    
    const childStats = await countDownlines(child._id);
    for (let key in childStats) {
      stats[key] += childStats[key];
    }
  }

  return stats;
};


 // Define the rank requirements
 
const RANKS = [
  { name: "VIP", requirement: { diamond: 2, platinum: 4, gold: 10, silver: 20, bronze: 50 } },
  { name: "Diamond", requirement: { platinum: 2, gold: 4, silver: 10, bronze: 20 } },
  { name: "Platinum", requirement: { gold: 2, silver: 4, bronze: 9 } },
  { name: "Gold", requirement: { silver: 2, bronze: 4 } },
  { name: "Silver", requirement: { bronze: 2 } },
  { name: "Bronze", requirement: {} }
];


 // Auto rank upgrade
 
export const checkRank = async (userId) => {
  const stats = await countDownlines(userId);

  for (let rank of RANKS) {
    let canUpgrade = true;
    for (let key in rank.requirement) {
      if ((stats[key] || 0) < rank.requirement[key]) {
        canUpgrade = false;
        break;
      }
    }
    if (canUpgrade) {
      const user = await User.findById(userId);
      user.rank = rank.name;
      await user.save();
      return rank.name;
    }
  }

  return "Bronze";
};
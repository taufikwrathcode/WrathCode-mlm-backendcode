import { User } from "../models/User.js";
import { addTransaction } from "./wallet.js";

export const SPONSOR_BONUS_PERCENT = 5;

export const giveReferralBonus = async (sponsorId, userId, investmentAmount, planName) => {
  try {
    const sponsor = await User.findById(sponsorId);
    if (!sponsor) {
      return { success: false, message: "Sponsor not found" };
    }

    const sponsorBonus = (investmentAmount * SPONSOR_BONUS_PERCENT) / 100;

    if (sponsorBonus <= 0) {
      return { success: false, message: "Bonus amount is zero" };
    }

    await addTransaction({
      userId: sponsor._id,
      type: "credit",
      walletType: "main",
      amount: sponsorBonus,
      description: `Sponsor Bonus from ${userId} for ${planName} plan`,
      status: "paid"
    });

    sponsor.totalEarned = (sponsor.totalEarned || 0) + sponsorBonus;
    sponsor.totalReferralEarnings = (sponsor.totalReferralEarnings || 0) + sponsorBonus;
    await sponsor.save();

    return {
      success: true,
      bonusAmount: sponsorBonus,
      message: `Sponsor bonus of ₹${sponsorBonus} given to ${sponsor.name}`
    };

  } catch (error) {
    console.error("Give Referral Bonus Error:", error.message);
    return { success: false, message: error.message };
  }
};

export const activateReferralAndGiveBonus = async (sponsorId, userId, planName, investmentAmount) => {
  try {
    console.log(" activateReferralAndGiveBonus START");
    console.log("sponsorId:", sponsorId);
    console.log("userId:", userId);
    
    const sponsor = await User.findById(sponsorId);
    if (!sponsor) {
      console.log(" Sponsor NOT found");
      return { success: false, message: "Sponsor not found" };
    }
    
    console.log("Sponsor found:", sponsor.name);
    console.log("Sponsor pendingReferralCount before:", sponsor.pendingReferralCount);
    console.log("Sponsor activeReferralCount before:", sponsor.activeReferralCount);
    
    
    const userIdStr = userId.toString();
    
  
    let referralIndex = -1;
    let referral = null;
    
    for (let i = 0; i < sponsor.referredUsers.length; i++) {
      const ref = sponsor.referredUsers[i];
      if (ref.user && ref.user.toString() === userIdStr) {
        referralIndex = i;
        referral = ref;
        break;
      }
    }
    
    console.log("referralIndex:", referralIndex);
    
    
    if (referralIndex === -1) {
      console.log(" Referral NOT found in array! Creating new entry...");
      
      sponsor.referredUsers.push({
        user: userId,
        hasInvested: true,
        investedAt: new Date(),
        selectedPlan: planName,
        amountInvested: investmentAmount
      });
      
      // Adjust counts
      if (sponsor.pendingReferralCount > 0) {
        sponsor.pendingReferralCount -= 1;
      }
      sponsor.activeReferralCount = (sponsor.activeReferralCount || 0) + 1;
      
      await sponsor.save();
      console.log(" New referral entry created successfully");
      
      // Give bonus
      const bonusResult = await giveReferralBonus(sponsorId, userId, investmentAmount, planName);
      
      return {
        success: true,
        message: "Referral activated and bonus given (new entry created)",
        bonus: bonusResult
      };
    }
    
    console.log("Referral found:", referral);
    
    if (referral.hasInvested === true) {
      console.log("⚠️ Referral already activated!");
      return { success: false, message: "Referral already activated" };
    }
    
    // Update referral status to active
    sponsor.referredUsers[referralIndex].hasInvested = true;
    sponsor.referredUsers[referralIndex].investedAt = new Date();
    sponsor.referredUsers[referralIndex].selectedPlan = planName;
    sponsor.referredUsers[referralIndex].amountInvested = investmentAmount;
    
    // Update counts
    sponsor.pendingReferralCount = Math.max(0, (sponsor.pendingReferralCount || 0) - 1);
    sponsor.activeReferralCount = (sponsor.activeReferralCount || 0) + 1;
    
    console.log("Sponsor pendingReferralCount after:", sponsor.pendingReferralCount);
    console.log("Sponsor activeReferralCount after:", sponsor.activeReferralCount);
    
    await sponsor.save();
    console.log(" Sponsor saved successfully!");
    
    // Give bonus
    const bonusResult = await giveReferralBonus(sponsorId, userId, investmentAmount, planName);
    
    console.log("Bonus Result:", bonusResult);
    console.log(" activateReferralAndGiveBonus END");
    
    return {
      success: true,
      message: "Referral activated and bonus given",
      bonus: bonusResult
    };
    
  } catch (error) {
    console.error(" Activate Referral Error:", error.message);
    return { success: false, message: error.message };
  }
};
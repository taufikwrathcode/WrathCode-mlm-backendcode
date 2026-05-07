import { User } from "../models/User.js";
import { KYC } from "../models/KYC.js";

export const getProfile = async (req, res) => {
  try {
    const user = req.user;

    // ===== KYC =====
    const kyc = await KYC.findOne({ userId: user._id });

    let kycStatus = "Pending";
    if (kyc) {
      if (kyc.kycStatus === "Approved") kycStatus = "Verified";
      else if (kyc.kycStatus === "Rejected") kycStatus = "Rejected";
    }

    
    const phone = kyc?.phoneNumber?.trim() || "";
    const city = kyc?.city?.trim() || "";
    const address = kyc?.address?.trim() || "";
    const userCountry = kyc?.country?.trim() || "";  

    // ===== REFERRALS =====
    const binaryCount = await User.countDocuments({ parent: user._id });
    const unilevelCount = await User.countDocuments({ parentUnilevel: user._id });
    const matrixCount = await User.countDocuments({ parentMatrix: user._id });

    const totalReferrals = binaryCount + unilevelCount + matrixCount;

    // ===== PROFILE COMPLETION =====
    const fields = [
      user.name,
      user.email,
      phone,
      city,
      address,
      userCountry
    ];

    const completed = fields.filter((f) => f && f !== "").length;
    const profilePercent = Math.floor((completed / fields.length) * 100);

    // ===== ACTIVE PLANS =====
    const activePlans = user.plans?.map((p) => p.name) || [];

      const achievements = [
        { id: 1, title: "Account Created", description: "Successfully joined the platform", unlocked: true },
        { id: 2, title: "Profile Completed", description: "Filled out all profile details", unlocked: profilePercent === 100 },
        { id: 3, title: "Team Builder", description: "Referred your first member", unlocked: totalReferrals > 0 },
        { id: 4, title: "First Income", description: "Earned your first commission", unlocked: user.totalEarned > 0 },
        { id: 5, title: `Rank: ${user.rank}`, description: `Reached ${user.rank} rank level`, unlocked: true }
      ];

      // ===== RESPONSE =====
      return res.status(200).json({
        success: true,

        profile: {
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          kycStatus,
          rank: user.rank,
          activePlans
        },

        statistics: {
          referralCode: user.referral,
          totalReferrals,
          totalEarning: user.totalEarned,
          profileCompletion: profilePercent
        },

        accountInfo: {
          name: user.name,
          email: user.email,
          phone,
          city,
          address,
          country: userCountry,
          memberSince: user.createdAt
        },

        achievements
      });

  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
//==================================UPDATE PROFILE===================================


export const Updateprofile = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      name,
      phoneNumber,
      city,
      address,
      country,
      state,
      pincode
    } = req.body || {};

    // ===== FIND USER =====
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ===== UPDATE USER =====
    if (name) {
      user.name = name;
    }

    await user.save();

    // ===== KYC UPDATE =====
    let kyc = await KYC.findOne({ userId });

    if (!kyc) {
      kyc = new KYC({ userId });
    }

    if (phoneNumber !== undefined) {
      kyc.phoneNumber = phoneNumber;
    }

    if (city !== undefined) {
      kyc.city = city;
    }

    if (address !== undefined) {
      kyc.address = address;
    }

    if (country !== undefined) {
      kyc.country = country;
    }

    if (state !== undefined) {
      kyc.state = state;
    }

    if (pincode !== undefined) {
      kyc.pincode = pincode;
    }

    // ===== OPTIONAL: AUTO COMPLETE FLAG =====
    if (
      kyc.phoneNumber &&
      kyc.city &&
      kyc.address &&
      kyc.country
    ) {
      kyc.isProfileComplete = true;
    }

    await kyc.save();

    // ===== RESPONSE =====
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        name: user.name,
        phoneNumber: kyc.phoneNumber,
        city: kyc.city,
        address: kyc.address,
        country: kyc.country
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
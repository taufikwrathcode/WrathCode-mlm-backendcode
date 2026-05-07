import { User } from "../models/User.js";
import { generateReferralCode } from "../Utils/refralcode.js";
import { Usertoken } from "../Utils/Token.js";
import { Admin } from "../models/Admin.js";
import { sendRegistrationEmail } from "../Utils/Email.js";

// ------------------- User Register -------------------
export const Register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, referral, referrel } =
      req.body;

    // ================= VALIDATION =================
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Name, Email, Password and Confirm Password are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password do not match",
      });
    }

    // ================= CHECK EXISTING USER =================
    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // ================= REFERRAL HANDLING (OPTIONAL) =================
    let parent = null;
    let referredByName = null;

    // Check both field names
    const referralCode = referral || referrel;

    if (referralCode && referralCode.trim() !== "") {
      parent =
        (await User.findOne({ referral: referralCode.trim() })) ||
        (await Admin.findOne({ referral: referralCode.trim() }));

      if (!parent) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral code",
        });
      }
      referredByName = parent.name;

      console.log("Parent found:", parent.name);
      console.log(
        "Parent pendingReferralCount before:",
        parent.pendingReferralCount,
      );
    }

    // ================= GENERATE UNIQUE REFERRAL CODE =================
    let newReferralCode = generateReferralCode();
    while (await User.findOne({ referral: newReferralCode })) {
      newReferralCode = generateReferralCode();
    }

    // ================= CREATE USER =================
    const user = new User({
      name,
      email,
      password,
      confirmPassword,
      referral: newReferralCode,
    });
    console.log(user);
    // ================= IF REFERRAL EXISTS - SET parentUnilevel BEFORE SAVE =================
    if (parent) {
      user.parentUnilevel = parent._id;
      console.log(" Set parentUnilevel to:", user.parentUnilevel);
    }

    // ================= SAVE USER FIRST =================
    await user.save();
    console.log(" User saved successfully:", user.name);

    // ================= IF REFERRAL EXISTS - UPDATE PARENT AFTER SAVE =================
    if (parent) {
      // Add to parent's referredUsers array and increment pendingReferralCount
      await User.findByIdAndUpdate(parent._id, {
        $push: {
          referredUsers: {
            user: user._id,
            hasInvested: false,
            selectedPlan: null,
            amountInvested: 0,
            investedAt: null,
          },
          childrenUni: user._id,
        },
        $inc: { pendingReferralCount: 1 },
      });

      // Verify update
      const updatedParent = await User.findById(parent._id);
      console.log(
        " Parent pendingReferralCount after:",
        updatedParent.pendingReferralCount,
      );
      console.log(
        " Parent referredUsers count:",
        updatedParent.referredUsers?.length || 0,
      );
    }

    // ================= GENERATE TOKEN =================
    const userToken = Usertoken(user);
    user.token = userToken;
    await user.save();

    // ================= SEND WELCOME EMAIL =================
    await sendRegistrationEmail(user);

    // ================= RESPONSE =================
    return res.status(201).json({
      success: true,
      message: parent
        ? "Registration successful! Sponsor will get bonus when you invest."
        : "Registration successful!",
      token: userToken,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          referral: user.referral,
          referredBy: referredByName || null,
          hasReferral: parent ? true : false,
        },
      },
    });

    // ✅ ADD CONSOLE LOG HERE
    console.log("=== REGISTER RESPONSE DATA ===");
    console.log("User ID:", user._id);
    console.log("User Name:", user.name);
    console.log("User Email:", user.email);
    console.log("Referral Code:", user.referral);
    console.log("Referred By:", referredByName || "None");
    console.log("Has Referral:", parent ? true : false);
    console.log("Parent ID:", parent?._id || "None");
    console.log("Parent Name:", parent?.name || "None");
    console.log("==============================");
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// ------------------- User Login -------------------
export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Please contact admin.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate token
    const userToken = Usertoken(user);
    user.token = userToken;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          referral: user.referral,
          isActive: user.isActive,
          rank: user.rank,
          wallet: user.wallet,
          totalEarned: user.totalEarned,
          activeReferralCount: user.activeReferralCount || 0,
          pendingReferralCount: user.pendingReferralCount || 0,
        },
      },
      token: userToken,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

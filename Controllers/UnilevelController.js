
import { User } from "../models/User.js";
import { Admin } from "../models/Admin.js";
import { startROI } from "../Utils/ROI.js";
import { distributeLevelIncome } from "../Utils/Level.js";
import { checkRank } from "../Utils/RANK.js";
import { distributeUnilevelIncome } from "../Utils/unilevelincom.js";



export const joinUnilevel = async (req, res) => {
  try {
    const { referral } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    const hasPlan = user.plans.some(p => p.name === "Unilevel");
    if (!hasPlan) {
      return res.status(400).json({ message: "Buy Unilevel plan first" });
    }

    if (user.parentUnilevel) {
      return res.status(400).json({ message: "Already joined" });
    }

    let parent = await User.findOne({ referral }) || await Admin.findOne({ referral });
    if (!parent) return res.status(400).json({ message: "Invalid referral" });

    user.parentUnilevel = parent._id;
    parent.childrenUni.push(user._id);

    await user.save();
    await parent.save();

    const plan = user.plans.find(p => p.name === "Unilevel");
    await distributeUnilevelIncome(user, plan.amount);

    res.json({ success: true, message: "Joined Unilevel successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================== GET UNILEVEL TREE =============================


const getUserLevel = async (rootId, targetId) => {
  const queue = [{ id: rootId, level: 1 }];
  const visited = new Set();

  while (queue.length) {
    const { id, level } = queue.shift();

    if (!id || visited.has(id.toString())) continue;
    visited.add(id.toString());

    if (id.toString() === targetId.toString()) {
      return level;
    }

    const user = await User.findById(id);
    if (!user) continue;

    const children = [
      user.left,
      user.right,
      user.leftMatrix,
      user.middleMatrix,
      user.rightMatrix,
      ...(user.childrenUni || [])
    ];

    for (let c of children) {
      if (c) queue.push({ id: c, level: level + 1 });
    }
  }

  return 0;
};


export const getUnilevelTree = async (req, res) => {
  try {
    const userId = req.user._id;
    const search = req.query.search || "";

    const rootUser = await User.findById(userId);
    if (!rootUser) {
      return res.status(404).json({ message: "User not found" });
    }

    /* =========================
       GET ALL MEMBERS (3 TREES)
    ========================= */
    const rawMembers = await User.find({
      $or: [
        { parent: userId },
        { parentMatrix: userId },
        { parentUnilevel: userId }
      ]
    });

    /* =========================
       SEARCH FILTER
    ========================= */
    let filtered = rawMembers;

    if (search) {
      filtered = rawMembers.filter((m) =>
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase()) ||
        m._id.toString().includes(search)
      );
    }

    /* =========================
       FORMAT MEMBERS LIST
    ========================= */
    const members = await Promise.all(
      filtered.map(async (m) => ({
        id: m._id,
        name: m.name,

        // REAL LEVEL (1,2,3...)
        level: await getUserLevel(userId, m._id),

        referrals: m.childrenUni?.length || 0,
        totalEarning: m.totalEarned,
        joinDate: m.createdAt
      }))
    );

    /* =========================
       LEVEL WISE COUNT
    ========================= */
    const levelMap = {};

    members.forEach((m) => {
      levelMap[m.level] = (levelMap[m.level] || 0) + 1;
    });

    const levelSummary = Object.keys(levelMap).map((lvl) => ({
      level: Number(lvl),
      members: levelMap[lvl]
    }));

    const totalMembers = members.length;

    /* =========================
       NETWORK GROWTH
    ========================= */
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const newMembers = await User.countDocuments({
      createdAt: { $gte: last7Days }
    });


    return res.status(200).json({
      success: true,
      data: {
        totalMembers,
        levelSummary,

        networkGrowth: {
          totalMembers,
          newMembers
        },


        search,


        members
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};
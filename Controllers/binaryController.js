import { User } from "../models/User.js";
import { Admin } from "../models/Admin.js";
import { startROI } from "../Utils/ROI.js";
import { distributeLevelIncome } from "../Utils/Level.js";
import { checkRank } from "../Utils/RANK.js";
import { distributeBinaryIncome } from "../Utils/Binaryincom.js";

export const joinBinary = async (req, res) => {
  try {
    const { referral, position } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    const hasPlan = user.plans.some(p => p.name === "Binary");
    if (!hasPlan) {
      return res.status(400).json({ message: "Buy Binary plan first" });
    }

    if (user.parent) {
      return res.status(400).json({ message: "Already joined Binary tree" });
    }

    let parent = await User.findOne({ referral }) || await Admin.findOne({ referral });
    if (!parent) return res.status(400).json({ message: "Invalid referral code" });

    let finalParent = parent;
    let finalPosition = position;

    if (!finalPosition) {
      if (!finalParent.left) {
        finalPosition = "left";
      } else if (!finalParent.right) {
        finalPosition = "right";
      }
    }

    if (finalParent.left && finalParent.right) {
      const queue = [finalParent];
      let found = false;

      while (queue.length && !found) {
        const current = queue.shift();

        if (current.left) queue.push(await User.findById(current.left));
        if (current.right) queue.push(await User.findById(current.right));

        if (!current.left || !current.right) {
          finalParent = current;
          finalPosition = !current.left ? "left" : "right";
          found = true;
          break;
        }
      }

      if (!found) {
        return res.status(400).json({ message: "Binary tree full" });
      }
    }

    user.parent = finalParent._id;
    user.position = finalPosition;
    await user.save();

    if (finalPosition === "left") finalParent.left = user._id;
    else finalParent.right = user._id;

    await finalParent.save();
    await distributeBinaryIncome(user._id);

    return res.status(200).json({
      success: true,
      message: `Joined Binary successfully at ${finalParent.name}'s ${finalPosition}`
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================== GET BINARY TREE (AMOUNT FIXED) =============================
export const getBinaryTree = async (req, res) => {
  try {
    const userId = req.user._id;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const getLevelData = async (memberId, currentLevel) => {
      if (currentLevel > 10) return null;

      const member = await User.findById(memberId)
        .select("name isActive createdAt left right plans")
        .lean();

      if (!member) return null;

      // Calculate user's total investment
      const userInvestment = member.plans?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      let leftNode = null;
      let rightNode = null;

      if (member.left) {
        leftNode = await getLevelData(member.left, currentLevel + 1);
      }
      if (member.right) {
        rightNode = await getLevelData(member.right, currentLevel + 1);
      }

      const isNewJoin = (date) => new Date(date) >= startOfToday;

      let leftCount = 0, leftAmount = 0, leftNewJoins = 0;
      let rightCount = 0, rightAmount = 0, rightNewJoins = 0;

      if (leftNode) {
        leftCount = leftNode.stats.leftCount + leftNode.stats.rightCount + 1;
        leftAmount = leftNode.stats.leftAmount + leftNode.stats.rightAmount + userInvestment;
        leftNewJoins = leftNode.stats.leftNewJoins + leftNode.stats.rightNewJoins + (isNewJoin(leftNode.createdAt) ? 1 : 0);
      }

      if (rightNode) {
        rightCount = rightNode.stats.leftCount + rightNode.stats.rightCount + 1;
        rightAmount = rightNode.stats.leftAmount + rightNode.stats.rightAmount + userInvestment;
        rightNewJoins = rightNode.stats.leftNewJoins + rightNode.stats.rightNewJoins + (isNewJoin(rightNode.createdAt) ? 1 : 0);
      }

      const currentNewJoin = isNewJoin(member.createdAt) ? 1 : 0;

      return {
        _id: member._id,
        name: member.name,
        level: currentLevel,
        createdAt: member.createdAt,
        stats: {
          leftCount,
          rightCount,
          leftAmount,
          rightAmount,
          leftNewJoins,
          rightNewJoins,
          totalNewJoins: leftNewJoins + rightNewJoins + currentNewJoin,
          totalMembers: leftCount + rightCount + 1,
          totalAmount: leftAmount + rightAmount + userInvestment
        },
        children: {
          left: leftNode,
          right: rightNode
        }
      };
    };

    const tree = await getLevelData(userId, 0);

    res.status(200).json({
      success: true,
      data: tree
    });

  } catch (error) {
    console.error("Get Binary Tree Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =================== GET LIST VIEW =================


export const getListView = async (req, res) => {
  try {
    const userId = req.user._id;

    const fetchDownline = async (parentIds, currentLevel, type, allMembers = []) => {
      if (currentLevel > 10) return allMembers;

      let query = {};
      let sponsorField = "";

      if (type === "Matrix") {
        query = { parentMatrix: { $in: parentIds }, "plans.name": "Matrix" };
        sponsorField = "parentMatrix";
      } else if (type === "Unilevel") {
        query = { parentUnilevel: { $in: parentIds }, "plans.name": "Unilevel" };
        sponsorField = "parentUnilevel";
      } else {
        query = { parent: { $in: parentIds }, "plans.name": "Binary" };
        sponsorField = "parent";
      }

      const members = await User.find(query)
        .populate(sponsorField, "name")
        .select(`name email isActive createdAt parent parentMatrix parentUnilevel plans childrenUni`)
        .lean();

      if (members.length === 0) return allMembers;

      const membersFormatted = await Promise.all(
        members.map(async (m) => {
          let referralCount = 0;
          if (type === "Matrix") referralCount = (m.leftMatrix ? 1 : 0) + (m.middleMatrix ? 1 : 0) + (m.rightMatrix ? 1 : 0);
          else if (type === "Unilevel") referralCount = m.childrenUni?.length || 0;
          else referralCount = (m.left ? 1 : 0) + (m.right ? 1 : 0);

          const volume = m.plans?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

          return {
            name: m.name,
            email: m.email,
            level: `Level ${currentLevel}`,
            referrals: referralCount,
            joinDate: new Date(m.createdAt).toLocaleDateString("en-GB"),
            sponsor: m[sponsorField] ? m[sponsorField].name : "You",
            status: m.isActive ? "Active" : "Inactive",
            volume: volume,
            isActive: m.isActive
          };
        })
      );

      allMembers.push(...membersFormatted);
      const nextParentIds = members.map(m => m._id);
      return fetchDownline(nextParentIds, currentLevel + 1, type, allMembers);
    };

    const binaryMembers = await fetchDownline([userId], 1, "Binary");
    const matrixMembers = await fetchDownline([userId], 1, "Matrix");
    const unilevelMembers = await fetchDownline([userId], 1, "Unilevel");

    const getStats = (members) => ({
      totalMembers: members.length,
      activeMembers: members.filter(m => m.isActive).length,
      totalVolume: members.reduce((sum, m) => sum + (m.volume || 0), 0)
    });

    res.status(200).json({
      success: true,
      data: {
        Binary: {
          stats: getStats(binaryMembers),
          members: binaryMembers
        },
        Matrix: {
          stats: getStats(matrixMembers),
          members: matrixMembers
        },
        Unilevel: {
          stats: getStats(unilevelMembers),
          members: unilevelMembers
        }
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
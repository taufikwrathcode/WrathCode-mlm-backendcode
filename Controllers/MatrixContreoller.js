import { User } from "../models/User.js";
import { Admin } from "../models/Admin.js";
import { startROI } from "../Utils/ROI.js";
import {distributeLevelIncome} from "../Utils/Level.js";
import {checkRank } from "../Utils/RANK.js";

import { distributeMatrixIncome } from "../Utils/matrxincom.js";



export const joinMatrix = async (req, res) => {
  try {
    const { referral } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    const hasPlan = user.plans.some(p => p.name === "Matrix");
    if (!hasPlan) {
      return res.status(400).json({ message: "Buy Matrix plan first" });
    }

    if (user.parentMatrix) {
      return res.status(400).json({ message: "Already joined Matrix" });
    }

    let parent = await User.findOne({ referral }) || await Admin.findOne({ referral });
    if (!parent) return res.status(400).json({ message: "Invalid referral" });

    const queue = [parent];
    let foundParent = null;

    while (queue.length) {
      const current = queue.shift();

      if (!current.leftMatrix || !current.middleMatrix || !current.rightMatrix) {
        foundParent = current;
        break;
      }

      if (current.leftMatrix) queue.push(await User.findById(current.leftMatrix));
      if (current.middleMatrix) queue.push(await User.findById(current.middleMatrix));
      if (current.rightMatrix) queue.push(await User.findById(current.rightMatrix));
    }

    if (!foundParent) return res.status(400).json({ message: "Matrix full" });

    let position;
    if (!foundParent.leftMatrix) position = "left";
    else if (!foundParent.middleMatrix) position = "middle";
    else position = "right";

    user.parentMatrix = foundParent._id;
    user.positionMatrix = position;
    await user.save();

    if (position === "left") foundParent.leftMatrix = user._id;
    else if (position === "middle") foundParent.middleMatrix = user._id;
    else foundParent.rightMatrix = user._id;

    await foundParent.save();

    const plan = user.plans.find(p => p.name === "Matrix");
    await distributeMatrixIncome(user, plan.amount);

    res.json({ success: true, message: "Joined Matrix successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================== GET MATRIX TREE =============================
export const getMatrixTree = async (req, res) => {
  try {
    const userId = req.user._id;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const getLevelData = async (memberId, currentLevel) => {
      if (currentLevel > 10) return null;

      const member = await User.findById(memberId)
        .select("name isActive createdAt leftMatrix middleMatrix rightMatrix plans")
        .lean();

      if (!member) return null;

      
      const userInvestment = member.plans?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      let leftNode = null, midNode = null, rightNode = null;

      if (member.leftMatrix) {
        leftNode = await getLevelData(member.leftMatrix, currentLevel + 1);
      }
      if (member.middleMatrix) {
        midNode = await getLevelData(member.middleMatrix, currentLevel + 1);
      }
      if (member.rightMatrix) {
        rightNode = await getLevelData(member.rightMatrix, currentLevel + 1);
      }

      const isNewJoin = (date) => new Date(date) >= startOfToday;

      const getNodeData = (node) => {
        if (!node) return { count: 0, amount: 0, new: 0 };
        const nodeSelfNew = isNewJoin(node.createdAt) ? 1 : 0;
        return {
          count: node.stats.totalMembers + 1,
          amount: node.stats.totalAmount + userInvestment,
          new: node.stats.totalNewJoins + nodeSelfNew
        };
      };

      const leftData = getNodeData(leftNode);
      const midData = getNodeData(midNode);
      const rightData = getNodeData(rightNode);
      const currentNewJoin = isNewJoin(member.createdAt) ? 1 : 0;

      return {
        _id: member._id,
        name: member.name,
        level: currentLevel,
        createdAt: member.createdAt,
        stats: {
          leftCount: leftData.count,
          midCount: midData.count,
          rightCount: rightData.count,
          leftAmount: leftData.amount,
          midAmount: midData.amount,
          rightAmount: rightData.amount,
          leftNewJoins: leftData.new,
          midNewJoins: midData.new,
          rightNewJoins: rightData.new,
          totalMembers: leftData.count + midData.count + rightData.count,
          totalAmount: leftData.amount + midData.amount + rightData.amount,
          totalNewJoins: leftData.new + midData.new + rightData.new + currentNewJoin
        },
        children: {
          left: leftNode,
          mid: midNode,
          right: rightNode
        }
      };
    };

    const tree = await getLevelData(userId, 0);

    res.status(200).json({
      success: true,
      type: "3-Leg Matrix",
      data: tree
    });

  } catch (error) {
    console.error("Get Matrix Tree Error:", error);
    res.status(500).json({ message: "Matrix Tree Error: " + error.message });
  }
};
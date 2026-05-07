import { joinBinary } from "../Controllers/binaryController.js";
import { joinMatrix } from "../Controllers/MatrixContreoller.js";
import { joinUnilevel } from "../Controllers/UnilevelController.js";

import { Admin } from "../models/Admin.js";
import { User } from "../models/User.js";

// ================= BINARY AUTO JOIN =================
export const joinBinaryAuto = async (user) => {
  try {
    console.log("=== joinBinaryAuto CALLED ===");
    console.log("User Name:", user.name);
    
    if (user.parent) {
      console.log("User already joined binary tree");
      return;
    }
    
    const sponsorId = user.parentUnilevel;
    if (!sponsorId) {
      console.log("No sponsor found - cannot auto join binary");
      return;
    }
    
    const sponsor = await User.findById(sponsorId);
    if (!sponsor) {
      console.log("Sponsor not found");
      return;
    }
    
    console.log("Sponsor found:", sponsor.name);
    
    let finalParent = sponsor;
    let finalPosition = null;
    
    if (!finalParent.left) {
      finalPosition = "left";
    } else if (!finalParent.right) {
      finalPosition = "right";
    } else {
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
        console.log("Binary tree full");
        return;
      }
    }
    
    user.parent = finalParent._id;
    user.position = finalPosition;
    await user.save();
    
    if (finalPosition === "left") finalParent.left = user._id;
    else finalParent.right = user._id;
    
    await finalParent.save();
    
    console.log(`✅ Binary joined: ${user.name} at ${finalParent.name}'s ${finalPosition}`);
    
  } catch (err) {
    console.log("Binary Auto Join Error:", err.message);
  }
};

// ================= MATRIX AUTO JOIN =================
export const joinMatrixAuto = async (user) => {
  try {
    console.log("=== joinMatrixAuto CALLED ===");
    console.log("User Name:", user.name);
    
    if (user.parentMatrix) {
      console.log("User already joined matrix tree");
      return;
    }
    
    const sponsorId = user.parentUnilevel;
    if (!sponsorId) {
      console.log("No sponsor found - cannot auto join matrix");
      return;
    }
    
    const sponsor = await User.findById(sponsorId);
    if (!sponsor) {
      console.log("Sponsor not found");
      return;
    }
    
    console.log("Sponsor found:", sponsor.name);
    
    let finalParent = sponsor;
    let finalPosition = null;
    
    if (!finalParent.leftMatrix) {
      finalPosition = "left";
    } else if (!finalParent.middleMatrix) {
      finalPosition = "middle";
    } else if (!finalParent.rightMatrix) {
      finalPosition = "right";
    } else {
      const queue = [finalParent];
      let found = false;
      
      while (queue.length && !found) {
        const current = queue.shift();
        
        if (current.leftMatrix) queue.push(await User.findById(current.leftMatrix));
        if (current.middleMatrix) queue.push(await User.findById(current.middleMatrix));
        if (current.rightMatrix) queue.push(await User.findById(current.rightMatrix));
        
        if (!current.leftMatrix || !current.middleMatrix || !current.rightMatrix) {
          finalParent = current;
          if (!finalParent.leftMatrix) finalPosition = "left";
          else if (!finalParent.middleMatrix) finalPosition = "middle";
          else finalPosition = "right";
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.log("Matrix tree full");
        return;
      }
    }
    
    user.parentMatrix = finalParent._id;
    user.positionMatrix = finalPosition;
    await user.save();
    
    if (finalPosition === "left") finalParent.leftMatrix = user._id;
    else if (finalPosition === "middle") finalParent.middleMatrix = user._id;
    else finalParent.rightMatrix = user._id;
    
    await finalParent.save();
    
    console.log(`✅ Matrix joined: ${user.name} at ${finalParent.name}'s ${finalPosition}`);
    
  } catch (err) {
    console.log("Matrix Auto Join Error:", err.message);
  }
};

// ================= UNILEVEL AUTO JOIN =================
export const joinUnilevelAuto = async (user) => {
  try {
    console.log("=== joinUnilevelAuto CALLED ===");
    console.log("User Name:", user.name);
    
    if (user.parentUnilevel && user.parentUnilevel.toString() === user.parentUnilevel?.toString()) {
      console.log("User already joined unilevel tree");
      return;
    }
    
    const sponsorId = user.parentUnilevel;
    if (!sponsorId) {
      console.log("No sponsor found - cannot auto join unilevel");
      return;
    }
    
    const sponsor = await User.findById(sponsorId);
    if (!sponsor) {
      console.log("Sponsor not found");
      return;
    }
    
    console.log("Sponsor found:", sponsor.name);
    
    user.parentUnilevel = sponsor._id;
    await user.save();
    
    sponsor.childrenUni.push(user._id);
    await sponsor.save();
    
    console.log(`✅ Unilevel joined: ${user.name} under ${sponsor.name}`);
    
  } catch (err) {
    console.log("Unilevel Auto Join Error:", err.message);
  }
};
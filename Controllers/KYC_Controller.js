import { KYC } from "../models/KYC.js";
import {
  isValidAdharNumber,
  isValidPanNumber,
  isValidPassportNumber,
  isValidVoterId,
  isValidPhone,
  isDraiverylicenceId
} from "../Utils/RegisterValidation.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert file to Base64
const getBase64Image = (filePath) => {
  try {
    if (!filePath) return null;
    const fullPath = path.join(__dirname, "..", filePath);
    if (fs.existsSync(fullPath)) {
      const imageBuffer = fs.readFileSync(fullPath);
      const base64 = imageBuffer.toString("base64");
      const ext = path.extname(fullPath).toLowerCase();
      const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
      return `data:${mimeType};base64,${base64}`;
    }
    return null;
  } catch (error) {
    console.error("Base64 conversion error:", error);
    return null;
  }
};
 
// ================= SUBMIT KYC =================
export const submitKYC = async (req, res) => {
  try {
    const userId = req.user._id;
    const files = req.files || {};

    const {
      fullName,
      dateOfBirth,
      address,
      city,
      state,
      country,
      pincode,
      phoneNumber,
      idType,
      idNumber,
      idName,
      submit
    } = req.body;

    let kyc = await KYC.findOne({ userId });
    if (!kyc) kyc = new KYC({ userId });

    // Validation
    if (phoneNumber && !isValidPhone(phoneNumber)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }
    if (idType === "Aadhaar" && !isValidAdharNumber(idNumber)) {
      return res.status(400).json({ message: "Invalid Aadhaar" });
    }
    if (idType === "PAN" && !isValidPanNumber(idNumber)) {
      return res.status(400).json({ message: "Invalid PAN" });
    }

    
    kyc.fullName = fullName || kyc.fullName;
    kyc.dateOfBirth = dateOfBirth || kyc.dateOfBirth;
    kyc.address = address || kyc.address;
    kyc.city = city || kyc.city;
    kyc.state = state || kyc.state;
    kyc.country = country || kyc.country;
    kyc.pincode = pincode || kyc.pincode;
    kyc.phoneNumber = phoneNumber || kyc.phoneNumber;
    kyc.idType = idType || kyc.idType;
    kyc.idNumber = idNumber || kyc.idNumber;
    kyc.idName = idName || kyc.idName;

    
    if (files.frontImage) kyc.frontImage = files.frontImage[0].filename;
    if (files.backImage) kyc.backImage = files.backImage[0].filename;
    if (files.selfiewithidnumber) kyc.selfiewithidnumber = files.selfiewithidnumber[0].filename;
    if (files.addressImage) kyc.addressImage = files.addressImage[0].filename;

    if (submit === "true" || submit === true) {
      if (!kyc.frontImage || !kyc.backImage || !kyc.selfiewithidnumber || !kyc.addressImage) {
        return res.status(400).json({ message: "All images are required before submitting KYC" });
      }
      if (!kyc.fullName || !kyc.dateOfBirth || !kyc.address || !kyc.city || !kyc.state || !kyc.pincode || !kyc.phoneNumber || !kyc.idType || !kyc.idNumber) {
        return res.status(400).json({ message: "All fields are required before submitting KYC" });
      }
      kyc.submitted = true;
      kyc.kycStatus = "Pending";
    }

    await kyc.save();
    console.log("KYC saved:", kyc);
    return res.status(200).json({
      success: true,
      message: "KYC updated successfully",
      data: kyc
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ================= GET MY KYC  =================
export const getMyKYC = async (req, res) => {
  try {
    const userId = req.user._id;
    const kyc = await KYC.findOne({ userId });
    const uploadPath = "uploads/up/";

    if (!kyc) {
      return res.status(200).json({
        success: true,
        data: {
          hasKYC: false,
          message: "You haven't submitted KYC yet. Please submit your KYC documents."
        }
      });
    }

    let statusMessage = "";
    if (kyc.kycStatus === "Approved") {
      statusMessage = "Your KYC has been approved";
    } else if (kyc.kycStatus === "Rejected") {
      statusMessage = `Your KYC was rejected. Reason: ${kyc.adminRemark || "No reason provided"}`;
    } else {
      statusMessage = "Your KYC is under review. Admin will verify soon.";
    }

    res.status(200).json({
      success: true,
      data: {
        hasKYC: true,
        status: kyc.kycStatus.toLowerCase(),
        statusMessage: statusMessage,
        adminRemark: kyc.adminRemark || "",
        submittedAt: kyc.createdAt,
        verifiedAt: kyc.verifiedAt || null,
        personalInfo: {
          fullName: kyc.fullName,
          dateOfBirth: kyc.dateOfBirth,
          address: kyc.address,
          city: kyc.city,
          state: kyc.state,
          country: kyc.country,
          pincode: kyc.pincode,
          phoneNumber: kyc.phoneNumber
        },
        idInfo: {
          idType: kyc.idType,
          idNumber: kyc.idNumber,
          idName: kyc.idName
        },
        documents: {
          frontImage: getBase64Image(`${uploadPath}${kyc.frontImage}`),
          backImage: getBase64Image(`${uploadPath}${kyc.backImage}`),
          selfie: getBase64Image(`${uploadPath}${kyc.selfiewithidnumber}`),
          addressProof: getBase64Image(`${uploadPath}${kyc.addressImage}`)
        }
      }
    });

  } catch (error) {
    console.error("Get My KYC Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


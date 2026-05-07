import { Router } from "express";

import {
  AdminRegister,
  AdminLogin,
  addUserByAdmin,
} from "../Controllers/AdminController.js";

import {
  updateKYCStatus,
  blockUnblockUser,
  deleteUser,
  editReferral,
  updateWithdrawalStatus,
} from "../Controllers/adminApprovedController.js";
import {
  updateBinaryConfig,
  resetBinaryConfig,
  updateUnilevelConfig,
  resetUnilevelConfig,
  resetROIConfig,
  updateROIConfig,
  updateMatrixConfig,
  resetMatrixConfig,
  updateRankPlan,
  resetRankPlan,
  createInvestment,
  updateInvestment,
  createDeposit,
  updateDeposit,
  createCommission,
  updateCommission,
  updateIncomeConfig,
  updateWalletStatus ,
} from "../Controllers/AdminActionController.js";

import {
  getAllTickets,
  updateTicketStatus,
  addReply,
} from "../Controllers/CreateTicketController.js";
import { adminProtect } from "../middleware/MIddlewares.js";

const router = Router();

router.post("/register", AdminRegister);
router.post("/login", AdminLogin);

//============================add new User==========================
router.post("/create_new_user", adminProtect, addUserByAdmin);

//=============================BLOCK/UNBLOCK========================
router.patch("/user/block/:id", adminProtect, blockUnblockUser);

//===============================DELETE USER=======================

router.delete("/user/:id", adminProtect, deleteUser);

// KYC Management
router.patch("/kyc/status/:id", adminProtect, updateKYCStatus);

//===============================Edit Referrals===================
router.patch("/referral/:id", adminProtect, editReferral);

//============================PLAN CONFIG SYSTEM===================

router.patch("/binary/edit", adminProtect, updateBinaryConfig);
router.post("/binary/reset", adminProtect, resetBinaryConfig);
router.patch("/unilevel/edit", adminProtect, updateUnilevelConfig);
router.post("/unilevel/reset", adminProtect, resetUnilevelConfig);
router.patch("/matrix/edit", adminProtect, updateMatrixConfig);
router.post("/matrix/reset", adminProtect, resetMatrixConfig);
router.patch("/roi/edit", adminProtect, updateROIConfig);
router.post("/roi/reset", adminProtect, resetROIConfig);

//===============================Inesment============================
router.patch("/rank-plan/:rank", adminProtect,updateRankPlan);
router.post("/rank-plan/:rank", adminProtect,resetRankPlan);
router.post("/investments",  adminProtect,createInvestment);
router.patch("/investments/:userId", adminProtect,updateInvestment);

//=============================DEPOSIT============================
router.post("/deposits/add",adminProtect, createDeposit);
router.patch("/deposits/user/:userId",adminProtect, updateDeposit);

//==============================COMMISSIONS==========================
router.post("/commissions", adminProtect, createCommission);
router.patch("/commissions/user/:userId", adminProtect, updateCommission);

//==============================INCOME ========================
router.patch("/income/add", adminProtect, updateIncomeConfig);

//==============================WALLET MANAGEMENT===========================
router.patch("/wallets/user/status/:userId", adminProtect, updateWalletStatus);

// ================================= Withdrawal Management============================
router.patch("/withdrawal/status/:withdrawalId", adminProtect, updateWithdrawalStatus);

// Admin get all tickets (with optional status filter)
router.get("/all-tickets", adminProtect, getAllTickets);

// Admin status change (Pending to Open etc.)
router.put("/update-status/:id", adminProtect, updateTicketStatus);

// Admin chat reply
router.post("/reply", adminProtect, addReply);
export const AdminRouter = router;

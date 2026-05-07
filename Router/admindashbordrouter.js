import { Router } from "express";

import {
  getAdminDashboard,
  getSystemReport,
  getAllUsers,
  getUserOverallDetails,
  checkUserLogin,
  getUserDownlineManagement,
  getAllReferralsHistory,
  getReferralDetails,
  getBinaryConfig,
  getUnilevelConfig,
  getMatrixConfig,
  getROIConfig,
  getAllRankPlans,
  getAllInvestments,
  getInvestmentByUserId,
  getAllDeposits,
  getDepositByUserId,
  getAllCommissions ,
  getCommissionByUserId,
  getIncome,
  getAllWallets,
  getWithdrawal,
} from "../Controllers/AdminDashordController.js";
import { getAllKYC, getKYCDetails } from "../Controllers/adminApprovedController.js";
import { adminProtect } from "../middleware/MIddlewares.js";

const router = Router();

router.get("/Dashboard", adminProtect, getAdminDashboard);
//=============System Report==================================
router.get("/report", adminProtect, getSystemReport);

//=====================user management======================

router.get("/allUsers", adminProtect, getAllUsers);
router.get("/user/overall/:Id", adminProtect, getUserOverallDetails);

//===========================KYC MANAGEMENT===================

router.get("/kyc", adminProtect, getAllKYC);

router.get("/kyc/:kycid", adminProtect, getKYCDetails);

//========================Check user login=======================

router.get("/login/user/:id", adminProtect, checkUserLogin);

//===========================Downline Management=======================

router.get("/user/downline", adminProtect, getUserDownlineManagement);

//===============================REFERRALS MANAGEMENT========================

router.get("/get_referral", adminProtect, getAllReferralsHistory);
router.get("/referral/:id", adminProtect, getReferralDetails);

//============================PLAN CONFIG===================================

router.get("/Binary_plan/system", adminProtect, getBinaryConfig);
router.get("/Unilevel_plan/system", adminProtect, getUnilevelConfig);
router.get("/Matrix_plan/system", adminProtect, getMatrixConfig);
router.get("/ROI_plan/system",adminProtect,getROIConfig)

//==============================INVESMENT/RANK PLAN==========================

router.get("/invesment_plan",adminProtect,getAllRankPlans);
router.get("/investments", adminProtect,getAllInvestments);
router.get("/investments/user/:userId", adminProtect,getInvestmentByUserId);

//==============================DEPOSIT MANAGEMENT===========================
router.get("/deposits",adminProtect, getAllDeposits);
router.get("/deposits/user/:userId",adminProtect, getDepositByUserId);

//================================COMMISSIONS================================

router.get("/commissions",  adminProtect,getAllCommissions);
router.get("/commissions/user/:userId",adminProtect, getCommissionByUserId);

//==============================INCOME REPORT===========================
router.get("/income/user", adminProtect, getIncome);

//==============================WALLET MANAGEMENT===========================
router.get("/wallets", adminProtect, getAllWallets);

//==============================WITHDRAWAL MANAGEMENT===========================
router.get("/withdrawals", adminProtect, getWithdrawal);

export const AdminDashboardRouter = router;
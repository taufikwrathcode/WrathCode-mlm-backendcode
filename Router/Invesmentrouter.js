import { Router } from "express";
import { Userprotect, adminProtect } from "../middleware/MIddlewares.js";
import {
  getInvestment,
  buyPlan,
  getPaymentMethods,
  createRazorpayOrder,
  verifyRazorpayPayment,
  initializeBankTransfer,
  verifyBankTransfer,
  approveBankTransferPayment,
} from "../Controllers/InvesmentController.js";

const router = Router();

// Get available payment methods and bank details
router.get("/methods", Userprotect, getPaymentMethods);

// Razorpay Payment Flow
router.post("/razorpay/order", Userprotect, createRazorpayOrder);
router.post("/razorpay/verify", Userprotect, verifyRazorpayPayment);

// Manual Bank Transfer Flow
router.post("/bank/initialize", Userprotect, initializeBankTransfer);
router.post("/bank/verify", Userprotect, verifyBankTransfer);

// Direct Wallet Payment
router.post("/buy", Userprotect, buyPlan);
// Get investment history
router.get("/history/investment", Userprotect, getInvestment);

// ==================== ADMIN ROUTES ====================
// Admin: Approve Bank Transfer Payment
router.post(
  "/admin/approve/bank-transfer",
  adminProtect,
  approveBankTransferPayment,
);

export const InvestmentRouter = router;

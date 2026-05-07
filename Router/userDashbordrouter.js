import  { Router } from "express";

import { 
getUserDashboard ,getUserReferralDashboard , getCommissionDashboard ,getWalletDashboard , transferWalletToWallet,getNetworkDashboard, getInvestmentDashboard
} from "../Controllers/usersDashbord.js";
import { Userprotect } from "../middleware/MIddlewares.js";

const router = Router();

//user DashBord

router.get("/dashboard" ,Userprotect,getUserDashboard)

//referral 
router.get("/referral" ,Userprotect, getUserReferralDashboard)

//commission

router.get("/commission" ,Userprotect,getCommissionDashboard)

//wallet
router.get("/wallet",Userprotect,getWalletDashboard)
router.post("/wallet/transfer" ,Userprotect,transferWalletToWallet)


//Downline network/unilevel


router.get("/downlinenetwork" , Userprotect,getNetworkDashboard)


//==============================Investment Plans====================================
router.get("/investment", Userprotect, getInvestmentDashboard)

export const  UserDashboardRouter = router
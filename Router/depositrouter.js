import { Router } from "express";

import { createDeposit,getDepositHistory } from "../Controllers/depositController.js";

import { Userprotect } from "../middleware/MIddlewares.js";

const router = Router();

router.post("/wallet", Userprotect, createDeposit);
router.get("/wallet/history", Userprotect, getDepositHistory);
export const depositrouter = router;

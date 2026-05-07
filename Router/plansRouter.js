import { Router } from "express";

import {
  joinBinary, getBinaryTree, getListView

} from "../Controllers/binaryController.js";
import { joinMatrix, getMatrixTree } from "../Controllers/MatrixContreoller.js";
import { joinUnilevel, getUnilevelTree } from "../Controllers/UnilevelController.js";
import { Userprotect } from "../middleware/MIddlewares.js";

const router = Router();

// Binary routes
router.post("/binary/join", Userprotect, joinBinary);
//==============================Get Binary Tree====================================
router.get("/binary/tree", Userprotect, getBinaryTree);
// Matrix routes
router.post("/matrix/join", Userprotect, joinMatrix);
//==============================Get Matrix Tree====================================
router.get("/matrix/sponsor", Userprotect, getMatrixTree);

// Unilevel routes
router.post("/unilevel/join", Userprotect, joinUnilevel);
router.get("/unilevel/tree", Userprotect, getUnilevelTree);



// List view for downline members
router.get("/network/list", Userprotect, getListView);

export const PlansRouter = router;

import { Router } from "express";

import { getProfile ,Updateprofile } from "../Controllers/userProfileController.js";
import { Userprotect } from "../middleware/MIddlewares.js";
import { upload } from "../Uploads/multer.js";
const router = Router()


router.get("/getprofile" ,Userprotect, getProfile)



router.patch("/edit/profile", Userprotect, upload.any(), Updateprofile)


export  const profilerouter  = router
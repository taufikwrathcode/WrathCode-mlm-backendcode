import { Router } from "express";

import { getProfile ,Updateprofile } from "../Controllers/userProfileController.js";
import { Userprotect } from "../middleware/MIddlewares.js";
import { upload } from "../Uploads/multer.js";
const router = Router()

//profile get
router.get("/getprofile" ,Userprotect, getProfile)

//edit profile

router.patch("/edit/profile", Userprotect, upload.any(), Updateprofile)


export  const profilerouter  = router
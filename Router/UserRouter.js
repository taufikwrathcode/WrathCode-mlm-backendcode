import {Router} from "express";
import { Register , Login} from "../Controllers/UserController.js";

const router = Router();

//  Request & Response Logger Middleware
router.use((req, res, next) => {
  ``;
  console.log("=================================");
  console.log(`[AUTH API] ${req.method} ${req.originalUrl}`);

  // Log request body
  if (Object.keys(req.body || {}).length > 0) {
    console.log(" Request Body:", req.body);
  } else {
    console.log(" Request Body: Empty");
  }

  // Capture response body
  const originalSend = res.send;
  res.send = function (body) {
    console.log("Response Status:", res.statusCode);
    console.log(" Response Body:", body);
    console.log("=================================");
    return originalSend.call(this, body);
  };

  next();
});

router.post("/register",Register)
router.post("/Login",Login)

export  const UserRegisterRouter = router 
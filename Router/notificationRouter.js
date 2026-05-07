import {
  createNotification,
  getUserNotifications,
  markAsRead,
} from "../Controllers/notificationController.js";
import { Userprotect } from "../middleware/MIddlewares.js";
import { Router } from "express";

const router = Router();


router.post("/create", Userprotect, createNotification);
router.get("/user/:userId", Userprotect, getUserNotifications);
router.put("/mark-as-read/:notificationId", Userprotect, markAsRead);

export const NotificationRouter = router;

import { Notification } from "../models/notification.js";
import { getIO } from "../Utils/soket.js"; 
import { timeAgo } from "../Utils/timeago.js";

 
export const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const notification = new Notification({
      userId,
      title,
      message,
      type: type || "system",
      createdAt: new Date(),
      isRead: false,
    });

    await notification.save();

    
    const io = getIO();
    io.to(userId.toString()).emit("newNotification", notification);

    return res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get all notifications for a user

export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    let notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

    notifications = notifications.map((n) => ({
      ...n._doc,
      timeAgo: timeAgo(n.createdAt),
    }));

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
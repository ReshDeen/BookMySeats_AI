const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Notification = require("../models/Notification");
const User = require("../models/User");

const resolveUser = async (identifier, email) => {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return User.findById(identifier).select("_id email uid");
  }

  const orConditions = [{ uid: identifier }];
  if (email) orConditions.push({ email });
  if (identifier && String(identifier).includes("@")) orConditions.push({ email: identifier });

  return User.findOne({ $or: orConditions }).select("_id email uid");
};

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.query;
    const limit = Math.min(Number(req.query.limit || 50), 200);

    const resolvedUser = await resolveUser(userId, email);
    if (!resolvedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId: resolvedUser._id }).sort({ createdAt: -1 }).limit(limit),
      Notification.countDocuments({ userId: resolvedUser._id, isRead: false })
    ]);

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/user/:userId/read-all", async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.query;

    const resolvedUser = await resolveUser(userId, email);
    if (!resolvedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await Notification.updateMany({ userId: resolvedUser._id, isRead: false }, { $set: { isRead: true } });
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

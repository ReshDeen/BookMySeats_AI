const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../models/User");
const Notification = require("../models/Notification");
const Payment = require("../models/Payment");

const resolveUser = async (identifier, email) => {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return User.findById(identifier).select("_id name email age provider createdAt uid");
  }

  const orConditions = [{ uid: identifier }];
  if (email) orConditions.push({ email });
  if (identifier && String(identifier).includes("@")) orConditions.push({ email: identifier });

  return User.findOne({ $or: orConditions }).select("_id name email age provider createdAt uid");
};

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.query;

    const resolvedUser = await resolveUser(userId, email);
    if (!resolvedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const [notifications, recentPayments] = await Promise.all([
      Notification.find({ userId: resolvedUser._id }).sort({ createdAt: -1 }).limit(10),
      Payment.find({ user: resolvedUser._id })
        .populate("booking", "movieName seats bookingDate showTime")
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({ user: resolvedUser, notifications, recentPayments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

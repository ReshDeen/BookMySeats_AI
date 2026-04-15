const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const mongoose = require("mongoose");
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

// 1. Submit Feedback
router.post("/submit", async (req, res) => {
  try {
    const { userId, bookingId, paymentId, movieId, rating, comment, email } = req.body;

    if (!userId || !paymentId) {
      return res.status(400).json({ error: "userId and paymentId are required" });
    }

    const resolvedUser = await resolveUser(userId, email);
    if (!resolvedUser || !mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ error: "Invalid feedback details" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1-5" });
    }

    const existing = await Feedback.findOne({ user: resolvedUser._id, payment: paymentId });
    if (existing) {
      return res.status(200).json({
        message: "Feedback already submitted for this payment",
        feedback: existing,
        alreadySubmitted: true,
      });
    }

    const feedback = new Feedback({
      user: resolvedUser._id,
      booking: bookingId,
      payment: paymentId,
      movie: movieId,
      rating,
      comment
    });

    await feedback.save();

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback,
      alreadySubmitted: false,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        error: "Feedback already submitted for this payment",
        alreadySubmitted: true,
      });
    }
    res.status(500).json({ error: "Unable to submit feedback" });
  }
});

// 2. Get Movie Feedback
router.get("/movie/:movieId", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ movie: req.params.movieId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length || 0;

    res.json({
      feedbacks,
      stats: {
        totalFeedbacks: feedbacks.length,
        averageRating: avgRating.toFixed(1)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get User Feedback
router.get("/user/:userId", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.params.userId })
      .populate("booking", "_id")
      .populate("payment", "_id")
      .populate("movie", "title")
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: "Unable to load feedback" });
  }
});

// 4. Get All Feedbacks (Admin)
router.get("/", async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("user", "name")
      .populate("movie", "title")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

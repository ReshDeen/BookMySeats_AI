const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true },
  movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
});

// One feedback per user per payment
feedbackSchema.index(
  { user: 1, payment: 1 },
  {
    unique: true,
    partialFilterExpression: { payment: { $exists: true, $ne: null } },
  }
);

module.exports = mongoose.model("Feedback", feedbackSchema);

const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  language: { type: String, enum: ["english", "tamil"], default: "english" },
  context: {
    currentPage: String,
    userAge: Number,
    favoriteGenres: [String],
    recentBookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }]
  },
  messages: [
    {
      sender: { type: String, enum: ["user", "assistant"], required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ChatHistory", chatHistorySchema);

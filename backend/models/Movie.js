const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  genre: { type: String, required: true },
  poster: String,
  rating: Number,
  votes: String,
  description: String,
  language: String,
  duration: String,
  ageGroup: { type: String, default: "UA" },
  releaseDate: Date,
  trending: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Movie", movieSchema);

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: Number,
  mobile: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  uid: { type: String, unique: true, sparse: true },
  password: { type: String },
  provider: { type: String, enum: ["mobile", "google", "email", "guest"], default: "mobile" },
  verified: { type: Boolean, default: false },
  preferredLanguage: { type: String, enum: ["english", "tamil"], default: "english" },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
  preferences: {
    genres: { type: [String], default: [] },
    watched: { type: [String], default: [] },
    previousBookings: { type: [String], default: [] }
  },
  otpCode: String,
  otpExpires: Date,
  googleId: { type: String, sparse: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);

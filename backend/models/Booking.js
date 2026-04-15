const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  movieName: { type: String, required: true },
  seats: [{ type: String, required: true }],
  totalPrice: { type: Number, required: true },
  bookingDate: { type: Date, default: Date.now },
  showDate: { type: Date },
  showTime: { type: String },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  paymentId: { type: String },
  status: { type: String, enum: ['active', 'cancelled', 'completed'], default: 'active' },
  theatre: { type: String, default: 'Default Theatre' },
  screen: { type: String, default: 'Screen 1' }
});

module.exports = mongoose.model("Booking", bookingSchema);
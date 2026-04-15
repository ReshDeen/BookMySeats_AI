const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  movieName: { type: String, default: "" },
  seatDetails: { type: [String], default: [] },
  method: { type: String, enum: ["upi", "card", "cash"], required: true },
  status: { type: String, enum: ["pending", "successful", "failed"], default: "pending" },
  amount: { type: Number, required: true },
  transactionId: { type: String },
  upiId: String,
  cardLast4: String,
  details: { type: Object, default: {} },
  receiptNumber: { type: String, index: true },
  receiptSentToEmail: { type: Boolean, default: false },
  receiptEmailStatus: { type: String, enum: ["sent", "smtp-not-configured", "failed", "not-applicable"], default: "not-applicable" },
  date: { type: String, required: true },
  time: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Payment", paymentSchema);

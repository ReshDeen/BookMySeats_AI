const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { createNotificationForPayment } = require("../services/notificationService");
const { sendReceiptEmail, buildReceiptPdfBuffer } = require("../services/receiptEmailService");

// Initialize Razorpay instance with your .env keys
const hasRazorpayConfig = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
const razorpay = hasRazorpayConfig
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

const ensureRazorpayConfigured = (req, res, next) => {
  if (!hasRazorpayConfig) {
    return res.status(503).json({
      message: "Payment service is not configured. Please set Razorpay keys in backend/.env"
    });
  }
  return next();
};

const normalizeMethod = (method) => {
  const normalized = String(method || "upi").toLowerCase();
  if (normalized.includes("card")) return "card";
  if (normalized.includes("cash")) return "cash";
  return "upi";
};

const makeReceiptNumber = () => `BMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const resolveUser = async (identifier, email) => {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const byId = await User.findById(identifier).select("_id email uid");
    if (byId) {
      return byId;
    }
  }

  const orConditions = [{ uid: identifier }];
  if (email) orConditions.push({ email });
  if (identifier && String(identifier).includes("@")) orConditions.push({ email: identifier });

  return User.findOne({ $or: orConditions }).select("_id email uid");
};

// ROUTE 1: Create an Order
router.post("/create-order", ensureRazorpayConfigured, async (req, res) => {
  try {
    const { amount } = req.body; // Amount passed from Frontend
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const options = {
      amount: Math.round(numericAmount * 100), // Convert INR to Paise (e.g., 500 INR = 50000 Paise)
      currency: "INR",
      receipt: `receipt_order_${Math.floor(Math.random() * 1000)}`,
    };

    const order = await razorpay.orders.create(options);
    
    if (!order) return res.status(500).json({ message: "Unable to create Razorpay order" });

    res.json(order); // Send the order details (including order_id) back to React
  } catch (error) {
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
});

// ROUTE 2: Verify Payment Signature
router.post("/verify", ensureRazorpayConfigured, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    // The Algorithm: Sign order_id + payment_id using your Secret Key
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    // Check if the signature matches
    if (razorpay_signature === expectedSign) {
      return res.status(200).json({ message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ message: "Invalid signature sent!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!", error: error.message });
  }
});

// ROUTE 3: Record payment result and create history/notification/email receipt
router.post("/record", async (req, res) => {
  try {
    const {
      userId,
      bookingId,
      method,
      status,
      amount,
      transactionId,
      details,
      bookingSnapshot,
      email
    } = req.body;

    const resolvedUser = await resolveUser(userId, email);
    if (!resolvedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const paymentStatus = status === "successful" ? "successful" : "failed";
    const receiptNumber = makeReceiptNumber();
    const now = new Date();
    const paymentData = {
      user: resolvedUser._id,
      userId: resolvedUser._id,
      method: normalizeMethod(method),
      status: paymentStatus,
      amount: Number(amount) || 0,
      transactionId,
      movieName: bookingSnapshot?.movieName || "",
      seatDetails: Array.isArray(bookingSnapshot?.seats) ? bookingSnapshot.seats : [],
      details: {
        ...(details || {}),
        bookingSnapshot: bookingSnapshot || {}
      },
      receiptNumber,
      date: now.toLocaleDateString("en-CA"),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    let booking = null;
    if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          paymentId: transactionId,
          paymentStatus: paymentStatus === "successful" ? "completed" : "failed",
          status: paymentStatus === "successful" ? "active" : "cancelled"
        },
        { new: true }
      );
      if (booking) {
        paymentData.booking = booking._id;
        paymentData.movieName = booking.movieName || paymentData.movieName;
        paymentData.seatDetails = Array.isArray(booking.seats) ? booking.seats : paymentData.seatDetails;
      }
    }

    const payment = await Payment.create(paymentData);

    const movieName = booking?.movieName || bookingSnapshot?.movieName;
    await createNotificationForPayment({
      userId: resolvedUser._id,
      status: paymentStatus,
      movieName,
      amount: payment.amount,
      transactionId
    });

    let emailResult = { sent: false, reason: "not-applicable" };
    if (paymentStatus === "successful") {
      emailResult = await sendReceiptEmail({
        toEmail: email,
        receipt: {
          receiptNumber,
          movieName,
          seats: booking?.seats || bookingSnapshot?.seats,
          amount: payment.amount,
          status: paymentStatus,
          transactionId,
          bookingDate:
            booking?.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : bookingSnapshot?.showDate,
          bookingTime: booking?.showTime || bookingSnapshot?.showTime
        }
      });
    }

    payment.receiptSentToEmail = Boolean(emailResult.sent);
    payment.receiptEmailStatus = emailResult.sent
      ? "sent"
      : emailResult.reason === "smtp-not-configured"
      ? "smtp-not-configured"
      : paymentStatus === "successful"
      ? "failed"
      : "not-applicable";
    await payment.save();

    res.status(201).json({
      message: "Payment recorded",
      payment
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to record payment" });
  }
});

// ROUTE 4: Payment history for user
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.query;

    const resolvedUser = await resolveUser(userId, email);
    if (!resolvedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const payments = await Payment.find({ user: resolvedUser._id })
      .populate("booking", "movieName seats bookingDate showDate showTime paymentStatus")
      .sort({ createdAt: -1 });

    const history = payments.map((payment) => {
      const snapshot = payment.details?.bookingSnapshot || {};
      const booking = payment.booking || {};
      return {
        id: payment._id,
        bookingId: booking._id,
        paymentId: payment._id,
        userId: payment.userId,
        movieName: booking.movieName || snapshot.movieName || "Movie",
        seats: booking.seats || snapshot.seats || payment.seatDetails || [],
        seatDetails: booking.seats || snapshot.seats || payment.seatDetails || [],
        bookingDate: booking.bookingDate || payment.createdAt,
        showDate: booking.showDate || snapshot.showDate || null,
        showTime: booking.showTime || snapshot.showTime || null,
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
        transactionId: payment.transactionId,
        receiptNumber: payment.receiptNumber,
        receiptEmailStatus: payment.receiptEmailStatus,
        date: payment.date,
        time: payment.time,
        createdAt: payment.createdAt
      };
    });

    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: "Unable to load payment history" });
  }
});

// ROUTE 5: Receipt details by payment id
router.get("/receipt/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { format } = req.query;
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ error: "Invalid payment id" });
    }

    const payment = await Payment.findById(paymentId)
      .populate("booking", "movieName seats bookingDate showDate showTime")
      .populate("user", "email name uid");
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const snapshot = payment.details?.bookingSnapshot || {};
    const booking = payment.booking || {};

    const receiptPayload = {
      paymentId: payment._id,
      receiptNumber: payment.receiptNumber,
      movieName: booking.movieName || snapshot.movieName || "Movie",
      seats: booking.seats || snapshot.seats || [],
      amount: payment.amount,
      status: payment.status,
      transactionId: payment.transactionId,
      bookingDate: booking.bookingDate || payment.createdAt,
      showDate: booking.showDate || snapshot.showDate || null,
      showTime: booking.showTime || snapshot.showTime || null,
      createdAt: payment.createdAt,
      bookingTime: booking.showTime || snapshot.showTime || booking.showTime || null,
    };

    if (String(format || '').toLowerCase() === 'pdf') {
      const pdfBuffer = await buildReceiptPdfBuffer(receiptPayload);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=receipt-${receiptPayload.receiptNumber}.pdf`);
      return res.send(pdfBuffer);
    }

    res.json({
      receipt: receiptPayload
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROUTE 5B: Download receipt as PDF by payment id
router.get("/receipt/:paymentId/pdf", async (req, res) => {
  try {
    const { paymentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ error: "Invalid payment id" });
    }

    const payment = await Payment.findById(paymentId).populate("booking", "movieName seats bookingDate showDate showTime");
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const snapshot = payment.details?.bookingSnapshot || {};
    const booking = payment.booking || {};
    const receipt = {
      receiptNumber: payment.receiptNumber,
      movieName: booking.movieName || snapshot.movieName || "Movie",
      seats: booking.seats || snapshot.seats || [],
      amount: payment.amount,
      status: payment.status,
      transactionId: payment.transactionId,
      bookingDate: booking.bookingDate || payment.createdAt,
      bookingTime: booking.showTime || snapshot.showTime || booking.showTime || null,
    };

    const pdfBuffer = await buildReceiptPdfBuffer(receipt);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${receipt.receiptNumber}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to generate receipt PDF." });
  }
});

// ROUTE 6: Send receipt email by payment id
router.post("/receipt/:paymentId/send", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { email } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ error: "Invalid payment id" });
    }

    const payment = await Payment.findById(paymentId).populate("booking", "movieName seats bookingDate showDate showTime");
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const resolvedEmail = email || req.body?.toEmail || req.body?.userEmail || payment?.user?.email || '';
    if (!resolvedEmail) {
      return res.status(400).json({ error: "Email address is required" });
    }

    const snapshot = payment.details?.bookingSnapshot || {};
    const booking = payment.booking || {};
    const receipt = {
      receiptNumber: payment.receiptNumber || makeReceiptNumber(),
      movieName: booking.movieName || snapshot.movieName || "Movie",
      seats: booking.seats || snapshot.seats || [],
      amount: payment.amount,
      status: payment.status,
      transactionId: payment.transactionId,
      bookingDate: booking.bookingDate || payment.createdAt,
      bookingTime: booking.showTime || snapshot.showTime || booking.showTime || null,
    };

    const emailResult = await sendReceiptEmail({
      toEmail: resolvedEmail,
      receipt,
    });

    const receiptPdfBuffer = emailResult?.pdfBuffer || (await buildReceiptPdfBuffer(receipt));
    const receiptPdfBase64 = receiptPdfBuffer.toString('base64');

    payment.receiptSentToEmail = Boolean(emailResult.sent);
    payment.receiptEmailStatus = emailResult.sent ? "sent" : "failed";
    await payment.save();

    if (!emailResult.sent) {
      return res.status(503).json({
        error: "Unable to send receipt. Try again.",
        reason: emailResult.reason || "email-not-sent",
        receipt,
        receiptPdfBase64,
      });
    }

    return res.json({
      message: "Receipt email sent successfully",
      emailSent: true,
      receipt,
      receiptPdfBase64,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Unable to send receipt. Try again.",
      reason: "send-failed"
    });
  }
});

module.exports = router;
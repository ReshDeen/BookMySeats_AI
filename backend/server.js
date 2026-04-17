const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto"); // Built-in Node module for security
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/authRoutes");
const movieRoutes = require("./routes/movieRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes"); // Ensure this contains your Razorpay logic
const aiRoutes = require("./routes/aiRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();

// Middleware
const isLocalhost = (origin) => {
  if (!origin) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
};

const isProductionOrigin = (origin) => {
  if (!origin) return false;
  // Vercel, Netlify, and other production domains
  return /^https:\/\/(.*\.vercel\.app|.*\.netlify\.app|.*\.render\.com)(\/)?$/i.test(origin);
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin such as Postman/cURL
    if (!origin || isLocalhost(origin) || isProductionOrigin(origin)) {
      return callback(null, true);
    }
    // For debugging: log rejected origins
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- SECURITY CHECK: Verify Environment Variables ---
const REQUIRED_ENV = ["MONGO_URI"];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`✗ MISSING CONFIG: ${key} is not defined in .env`);
    process.exit(1);
  }
});

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("⚠ Razorpay keys are missing. Payment APIs will return configuration errors until keys are set.");
}

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✓ MongoDB Connected"))
  .catch(err => console.log("✗ MongoDB Connection Error:", err));

// ==================== API Routes ====================

// Authentication APIs
app.use("/api/auth", authRoutes);

// Movie APIs
app.use("/api/movies", movieRoutes);

// Booking APIs
app.use("/api/bookings", bookingRoutes);

// Payment APIs (Where your Razorpay orders and verification happen)
app.use("/api/payments", paymentRoutes);

// AI Recommendations API
app.use("/api/ai", aiRoutes);

// Chatbot APIs
app.use("/api/chat", chatbotRoutes);

// Feedback APIs
app.use("/api/feedback", feedbackRoutes);

// Notification APIs
app.use("/api/notifications", notificationRoutes);

// Profile APIs
app.use("/api/profile", profileRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "Server is running", 
    db_status: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    timestamp: new Date() 
  });
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error("✗ SERVER ERROR:", err.stack);
  res.status(500).json({ error: "Something went wrong on the server" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const crypto = require("crypto");

// Helper: Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. Request OTP for Login via Mobile
router.post("/request-otp", async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber || mobileNumber.length < 10) {
      return res.status(400).json({ error: "Valid mobile number required" });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    let user = await User.findOne({ mobile: mobileNumber });

    if (!user) {
      user = new User({
        mobile: mobileNumber,
        provider: "mobile",
        otpCode: otp,
        otpExpires: otpExpires
      });
    } else {
      user.otpCode = otp;
      user.otpExpires = otpExpires;
    }

    await user.save();

    // In real app, send SMS here
    console.log(`OTP for ${mobileNumber}: ${otp}`);

    res.json({
      message: "OTP sent successfully",
      otp: otp // For testing, remove in production
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Verify OTP and Login
router.post("/verify-otp", async (req, res) => {
  try {
    const { mobileNumber, otp, name, age } = req.body;

    const user = await User.findOne({ mobile: mobileNumber });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ error: "OTP Expired" });
    }

    // Update user details if provided
    if (name) user.name = name;
    if (age) user.age = age;
    user.verified = true;
    user.otpCode = null;
    user.otpExpires = null;

    await user.save();

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        age: user.age,
        provider: user.provider
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Email Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, age, uid } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const newUser = new User({
      name,
      email,
      uid,
      password: hashedPassword,
      age,
      provider: "email",
      verified: true
    });

    await newUser.save();

    res.status(201).json({
      message: "Signup successful",
      user: {
        id: newUser._id,
        uid: newUser.uid,
        name: newUser.name,
        email: newUser.email,
        age: newUser.age
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Email Login
router.post("/login", async (req, res) => {
  try {
    const { email, password, uid } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    if (user.password !== hashedPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.uid && uid) {
      user.uid = uid;
      await user.save();
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        age: user.age,
        provider: user.provider
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Guest Login
router.post("/guest", async (req, res) => {
  try {
    const { name = "Guest User", age = 25 } = req.body;
    const newUser = new User({
      name,
      age,
      provider: "guest",
      verified: true
    });
    await newUser.save();
    res.json({
      message: "Guest login successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        age: newUser.age,
        provider: newUser.provider
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Google Login (simplified - in real app integrate Google OAuth)
router.post("/google-login", async (req, res) => {
  try {
    const { googleId, uid, name, email } = req.body;
    const resolvedGoogleId = googleId || uid;
    const resolvedName = name || (email ? email.split('@')[0] : 'User');

    let user = await User.findOne({
      $or: [
        { googleId: resolvedGoogleId },
        { email }
      ]
    });

    if (!user) {
      user = new User({
        name: resolvedName,
        email,
        uid,
        googleId: resolvedGoogleId,
        provider: "google",
        verified: true
      });
      await user.save();
    } else {
      user.name = user.name || resolvedName;
      user.uid = user.uid || uid;
      user.googleId = user.googleId || resolvedGoogleId;
      user.provider = "google";
      user.verified = true;
      await user.save();
    }

    res.json({
      message: "Google login successful",
      user: {
        id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        provider: user.provider
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Get User Profile
router.get("/profile/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("bookings");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Update User Preferences
router.put("/profile/:userId", async (req, res) => {
  try {
    const { genres, preferredLanguage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        "preferences.genres": genres,
        preferredLanguage: preferredLanguage
      },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

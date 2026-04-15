const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const User = require("../models/User");
const Movie = require("../models/Movie");
const mongoose = require("mongoose");

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 1. Get all booked seats for a movie
router.get("/seats/:movieId", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
      return res.json({ bookedSeats: [] });
    }

    const bookings = await Booking.find({ movieId: req.params.movieId });
    const bookedSeats = bookings.flatMap(b => b.seats);
    res.json({ bookedSeats });
  } catch (err) {
    res.status(500).json({ error: "Unable to fetch booked seats" });
  }
});

// 2. Book seats
router.post("/book", async (req, res) => {
  try {
    const { userId, userEmail, movieId, movieName, seats, totalPrice, showDate, showTime } = req.body;

    let resolvedUserId = userId;
    if (!mongoose.Types.ObjectId.isValid(resolvedUserId)) {
      const user = await User.findOne({
        $or: [
          { uid: resolvedUserId },
          ...(userEmail ? [{ email: userEmail }] : []),
          ...(resolvedUserId && String(resolvedUserId).includes('@') ? [{ email: resolvedUserId }] : [])
        ]
      }).select("_id");

      if (!user) {
        return res.status(404).json({ error: "User not found for booking" });
      }

      resolvedUserId = user._id;
    }

    let resolvedMovieId = movieId;
    if (!mongoose.Types.ObjectId.isValid(resolvedMovieId)) {
      const safeMovieName = String(movieName || "").trim();
      const movie = await Movie.findOne({ title: new RegExp(`^${escapeRegex(safeMovieName)}$`, "i") }).select("_id");
      if (!movie) {
        return res.status(400).json({ error: "Invalid movie details" });
      }
      resolvedMovieId = movie._id;
    }

    const parsedShowDate = showDate ? new Date(showDate) : null;
    if (!parsedShowDate || Number.isNaN(parsedShowDate.getTime())) {
      return res.status(400).json({ error: "Invalid show date" });
    }

    const newBooking = new Booking({
      userId: resolvedUserId,
      movieId: resolvedMovieId,
      movieName,
      seats,
      totalPrice,
      showDate: parsedShowDate,
      showTime,
      paymentStatus: "pending",
      status: "active"
    });

    const savedBooking = await newBooking.save();

    // Add booking to user's bookings array
    await User.findByIdAndUpdate(resolvedUserId, {
      $push: { bookings: savedBooking._id }
    });

    res.status(201).json({
      message: "Booking created successfully",
      booking: savedBooking
    });
  } catch (err) {
    res.status(500).json({ error: "Unable to create booking" });
  }
});

// 3. Get user bookings
router.get("/user/:userId", async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId })
      .populate("movieId")
      .sort({ bookingDate: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get single booking
router.get("/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("userId")
      .populate("movieId");
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Update booking payment status
router.put("/:bookingId/payment", async (req, res) => {
  try {
    const { paymentId, paymentStatus } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      {
        paymentId,
        paymentStatus,
        status: paymentStatus === "completed" ? "active" : "cancelled"
      },
      { new: true }
    );
    res.json({ message: "Booking updated", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Cancel booking
router.put("/:bookingId/cancel", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { status: "cancelled" },
      { new: true }
    );
    res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
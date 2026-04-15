const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const buildNotificationPayload = ({ status, movieName, amount, transactionId }) => {
  if (status === "successful") {
    return {
      title: "Payment Successful",
      message: `${movieName || "Booking"} payment of INR ${Number(amount || 0).toFixed(2)} was successful.`,
      type: "payment-success",
      metadata: { transactionId }
    };
  }

  if (status === "failed") {
    return {
      title: "Payment Failed",
      message: `${movieName || "Booking"} payment of INR ${Number(amount || 0).toFixed(2)} failed. Please retry.`,
      type: "payment-failed",
      metadata: { transactionId }
    };
  }

  return {
    title: "System Update",
    message: "There is an update on your account activity.",
    type: "system-update",
    metadata: {}
  };
};

const createNotificationForPayment = async ({ userId, status, movieName, amount, transactionId }) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  const payload = buildNotificationPayload({ status, movieName, amount, transactionId });
  return Notification.create({
    userId,
    title: payload.title,
    message: payload.message,
    type: payload.type,
    metadata: payload.metadata
  });
};

module.exports = { createNotificationForPayment };

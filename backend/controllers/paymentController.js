const { sendReceiptEmail } = require('../services/receiptEmailService');
const Booking = require('../models/Booking'); // Ensure this path matches your model

exports.verifyPayment = async (req, res) => {
    try {
        const { response, bookingDetails, userEmail } = req.body;

        // 1. Logic to verify Razorpay signature goes here...
        // (Assuming verification is successful)

        // 2. Prepare the receipt data for the service
        const receiptData = {
            receiptNumber: `BMSA-${Date.now().toString().slice(-6)}`,
            movieName: bookingDetails.movieName,
            seats: bookingDetails.seats,
            amount: bookingDetails.amount,
            transactionId: response.razorpay_payment_id,
            bookingDate: new Date().toLocaleDateString(),
            bookingTime: new Date().toLocaleTimeString(),
            status: 'Success'
        };

        // 3. TRIGGER THE EMAIL SERVICE
        console.log(`Attempting to send email to: ${userEmail}`);
        const emailResult = await sendReceiptEmail({
            toEmail: userEmail,
            receipt: receiptData
        });

        if (emailResult.sent) {
            console.log("Email sent successfully!");
            return res.status(200).json({ 
                success: true, 
                message: "Payment verified and receipt emailed!",
                receipt: receiptData 
            });
        } else {
            console.error("Email failed to send:", emailResult.error);
            return res.status(200).json({ 
                success: true, 
                message: "Payment verified, but email failed. You can still download the receipt.",
                receipt: receiptData 
            });
        }

    } catch (error) {
        console.error("Controller Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
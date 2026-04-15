const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

// --- HELPER FUNCTIONS ---
const formatCurrency = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const formatDateValue = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

const formatTimeValue = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- PDF GENERATION LOGIC ---
const buildReceiptPdfBuffer = (receipt) => new Promise((resolve, reject) => {
  try {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Theme Palette: Cinema Dark
    const primaryMaroon = '#782828';
    const backgroundLight = '#f5f1ef';
    const textDark = '#241616';
    const mutedText = '#866';
    const pageWidth = doc.page.width - 80;

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(backgroundLight);

    // Header Banner (Brand Identity)
    doc.roundedRect(40, 40, pageWidth, 120, 15).fill(primaryMaroon);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(14).text('BookMySeat AI', 65, 65);
    doc.fontSize(26).text('Booking Receipt', 65, 90);
    doc.font('Helvetica').fontSize(9).fillColor('#ffffff').text('Author: Developer, Reshma Edition', 65, 130, { opacity: 0.8 });

    // Main Content Card
    doc.roundedRect(40, 175, pageWidth, 480, 15).fill('#ffffff');
    doc.fillColor(textDark).font('Helvetica-Bold').fontSize(16).text('Transaction Summary', 70, 205);
    
    // Table-style Row Logic
    const drawRow = (label, value, y) => {
      doc.fillColor(mutedText).font('Helvetica').fontSize(10).text(label.toUpperCase(), 70, y);
      doc.fillColor(textDark).font('Helvetica-Bold').fontSize(11).text(String(value), 220, y, { width: pageWidth - 200 });
      doc.moveTo(70, y + 20).lineTo(pageWidth + 10, y + 20).strokeColor('#eadede').lineWidth(0.5).stroke();
    };

    let currentY = 245;
    const seatText = Array.isArray(receipt.seats) ? receipt.seats.join(', ') : (receipt.seats || 'N/A');

    drawRow('Receipt No', receipt.receiptNumber || `BMSA-${Date.now().toString().slice(-6)}`, currentY);
    drawRow('Movie Name', receipt.movieName || 'N/A', currentY += 40);
    drawRow('Seats', seatText, currentY += 40);
    drawRow('Amount Paid', formatCurrency(receipt.amount), currentY += 40);
    drawRow('Transaction ID', receipt.transactionId || 'TXN-PENDING', currentY += 40);
    drawRow('Date', formatDateValue(receipt.bookingDate || new Date()), currentY += 40);
    drawRow('Time', formatTimeValue(receipt.bookingTime || new Date()), currentY += 40);
    drawRow('Status', (receipt.status || 'Confirmed').toUpperCase(), currentY += 40);

    // Footer
    doc.fillColor(mutedText).font('Helvetica-Oblique').fontSize(9)
      .text('Thank you for choosing BookMySeat AI. Please present this at the cinema counter.', 40, 700, { align: 'center', width: pageWidth });

    doc.end();
  } catch (error) {
    reject(error);
  }
});

// --- EMAIL HTML TEMPLATE ---
const buildReceiptEmailHtml = (receipt) => {
  const seatText = Array.isArray(receipt.seats) ? receipt.seats.join(', ') : receipt.seats;
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f5f1ef; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 15px; overflow: hidden; border: 1px solid #eadede;">
            <div style="background: #782828; color: #ffffff; padding: 40px; text-align: center;">
                <h1 style="margin: 0; font-size: 26px;">BookMySeat AI</h1>
                <p style="margin: 5px 0 0; opacity: 0.8;">Author: Developer, Reshma Edition</p>
            </div>
            <div style="padding: 40px;">
                <h2 style="color: #241616;">Ticket Confirmation</h2>
                <p>Hello, your ticket for <strong>${receipt.movieName}</strong> has been successfully booked!</p>
                <div style="background: #fdfaf9; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #eadede;">
                    <p style="margin: 5px 0;"><strong>Receipt No:</strong> ${receipt.receiptNumber}</p>
                    <p style="margin: 5px 0;"><strong>Seats:</strong> ${seatText}</p>
                    <p style="margin: 5px 0;"><strong>Total Amount:</strong> ${formatCurrency(receipt.amount)}</p>
                </div>
                <p style="font-size: 13px; color: #866;">A professional PDF receipt is attached to this email for your records.</p>
            </div>
            <div style="background: #eadede; padding: 20px; text-align: center; font-size: 12px; color: #782828;">
                © 2026 BookMySeat AI · Built with MERN Stack
            </div>
        </div>
    </div>`;
};

// --- MAIN EMAIL SENDER ---
const sendReceiptEmail = async ({ toEmail, receipt }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS  
    }
  });

  try {
    const pdfBuffer = await buildReceiptPdfBuffer(receipt);

    const mailOptions = {
      // UPDATED: Brand Display Name applied here
      from: `"BookMySeat AI" <${process.env.EMAIL_USER}>`, 
      to: toEmail,
      subject: `Booking Confirmed: ${receipt.movieName} - ${receipt.receiptNumber}`,
      html: buildReceiptEmailHtml(receipt),
      attachments: [
        {
          filename: `Receipt-${receipt.receiptNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    return { sent: true, messageId: info.messageId, pdfBuffer };
  } catch (error) {
    console.error("Email Service Error:", error);
    return { sent: false, error: error.message };
  }
};

module.exports = {
  buildReceiptPdfBuffer,
  sendReceiptEmail
};
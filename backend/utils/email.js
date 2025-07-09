const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Parking Spot Finder" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<p>${options.message}</p>`
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.email}`);
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Email could not be sent');
  }
};

// Send booking confirmation email
const sendBookingConfirmation = async (booking, user, spot) => {
  const subject = 'Booking Confirmation - Parking Spot Finder';
  const html = `
    <h2>Booking Confirmation</h2>
    <p>Dear ${user.name},</p>
    <p>Your parking spot booking has been confirmed!</p>
    
    <h3>Booking Details:</h3>
    <ul>
      <li><strong>Spot:</strong> ${spot.title}</li>
      <li><strong>Address:</strong> ${spot.address.fullAddress}</li>
      <li><strong>Start Time:</strong> ${booking.startTime}</li>
      <li><strong>End Time:</strong> ${booking.endTime}</li>
      <li><strong>Total Amount:</strong> $${booking.totalAmount}</li>
      <li><strong>Vehicle:</strong> ${booking.vehicleInfo.make} ${booking.vehicleInfo.model} (${booking.vehicleInfo.licensePlate})</li>
    </ul>
    
    <p>Your booking reference ID: ${booking._id}</p>
    
    <p>Thank you for using Parking Spot Finder!</p>
  `;
  
  await sendEmail({
    email: user.email,
    subject,
    html
  });
};

// Send booking cancellation email
const sendBookingCancellation = async (booking, user, spot) => {
  const subject = 'Booking Cancelled - Parking Spot Finder';
  const html = `
    <h2>Booking Cancelled</h2>
    <p>Dear ${user.name},</p>
    <p>Your parking spot booking has been cancelled.</p>
    
    <h3>Cancelled Booking Details:</h3>
    <ul>
      <li><strong>Spot:</strong> ${spot.title}</li>
      <li><strong>Address:</strong> ${spot.address.fullAddress}</li>
      <li><strong>Start Time:</strong> ${booking.startTime}</li>
      <li><strong>End Time:</strong> ${booking.endTime}</li>
      <li><strong>Refund Amount:</strong> $${booking.refundAmount}</li>
    </ul>
    
    <p>If you have any questions, please contact our support team.</p>
    
    <p>Thank you for using Parking Spot Finder!</p>
  `;
  
  await sendEmail({
    email: user.email,
    subject,
    html
  });
};

// Send payment receipt email
const sendPaymentReceipt = async (payment, user, booking, spot) => {
  const subject = 'Payment Receipt - Parking Spot Finder';
  const html = `
    <h2>Payment Receipt</h2>
    <p>Dear ${user.name},</p>
    <p>Thank you for your payment!</p>
    
    <h3>Payment Details:</h3>
    <ul>
      <li><strong>Amount:</strong> $${payment.amount}</li>
      <li><strong>Payment Method:</strong> ${payment.paymentMethod}</li>
      <li><strong>Transaction ID:</strong> ${payment.transactionId}</li>
      <li><strong>Date:</strong> ${payment.paidAt}</li>
    </ul>
    
    <h3>Booking Details:</h3>
    <ul>
      <li><strong>Spot:</strong> ${spot.title}</li>
      <li><strong>Address:</strong> ${spot.address.fullAddress}</li>
      <li><strong>Start Time:</strong> ${booking.startTime}</li>
      <li><strong>End Time:</strong> ${booking.endTime}</li>
    </ul>
    
    <p>Your booking reference ID: ${booking._id}</p>
    
    <p>Thank you for using Parking Spot Finder!</p>
  `;
  
  await sendEmail({
    email: user.email,
    subject,
    html
  });
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendBookingCancellation,
  sendPaymentReceipt
};

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');
const { validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');

// PayPal environment setup
const paypalClient = () => {
  const environment = process.env.PAYPAL_MODE === 'live' 
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
  return new paypal.core.PayPalHttpClient(environment);
};

// Create payment intent
const createPaymentIntent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { bookingId, amount, paymentMethod } = req.body;
    const userId = req.user.id;

    // Verify booking exists and belongs to user
    const booking = await Booking.findById(bookingId).populate('user parkingSpot');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to make payment for this booking'
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ booking: bookingId, status: { $in: ['pending', 'processing', 'succeeded'] } });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already exists for this booking'
      });
    }

    let paymentIntent, transactionId;

    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      // Create Stripe payment intent
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          bookingId: bookingId,
          userId: userId
        }
      });
      transactionId = paymentIntent.id;
    } else if (paymentMethod === 'paypal') {
      // Create PayPal order
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: amount.toString()
          },
          description: `Parking spot booking - ${booking.parkingSpot.name}`
        }]
      });

      const order = await paypalClient().execute(request);
      transactionId = order.result.id;
    }

    // Create payment record
    const payment = new Payment({
      booking: bookingId,
      user: userId,
      amount,
      paymentMethod,
      paymentProvider: paymentMethod === 'paypal' ? 'paypal' : 'stripe',
      transactionId,
      paymentIntentId: paymentIntent ? paymentIntent.id : null,
      status: 'pending',
      description: `Payment for parking spot: ${booking.parkingSpot.name}`
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        paymentId: payment._id,
        clientSecret: paymentIntent ? paymentIntent.client_secret : null,
        paypalOrderId: paymentMethod === 'paypal' ? transactionId : null
      }
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
};

// Process payment
const processPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { paymentIntentId, paymentMethodId } = req.body;
    const userId = req.user.id;

    // Find payment by paymentIntentId
    const payment = await Payment.findOne({ paymentIntentId }).populate('booking user');
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to process this payment'
      });
    }

    if (payment.paymentProvider === 'stripe') {
      // Confirm Stripe payment
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId
      });

      if (paymentIntent.status === 'succeeded') {
        payment.status = 'succeeded';
        payment.paidAt = new Date();
        await payment.save();

        // Update booking status
        const booking = await Booking.findById(payment.booking);
        booking.paymentStatus = 'paid';
        booking.status = 'active';
        await booking.save();

        // Send confirmation email
        await sendEmail({
          to: payment.user.email,
          subject: 'Payment Confirmation',
          html: `
            <h2>Payment Successful</h2>
            <p>Your payment of $${payment.amount} has been processed successfully.</p>
            <p>Booking ID: ${payment.booking}</p>
            <p>Transaction ID: ${payment.transactionId}</p>
          `
        });

        res.json({
          success: true,
          message: 'Payment processed successfully',
          data: {
            paymentId: payment._id,
            status: payment.status,
            transactionId: payment.transactionId
          }
        });
      } else {
        payment.status = 'failed';
        payment.failureReason = paymentIntent.last_payment_error?.message || 'Unknown error';
        await payment.save();

        res.status(400).json({
          success: false,
          message: 'Payment failed',
          error: payment.failureReason
        });
      }
    } else if (payment.paymentProvider === 'paypal') {
      // Process PayPal payment
      const request = new paypal.orders.OrdersCaptureRequest(payment.transactionId);
      request.requestBody({});

      const capture = await paypalClient().execute(request);
      
      if (capture.result.status === 'COMPLETED') {
        payment.status = 'succeeded';
        payment.paidAt = new Date();
        await payment.save();

        // Update booking status
        const booking = await Booking.findById(payment.booking);
        booking.paymentStatus = 'paid';
        booking.status = 'active';
        await booking.save();

        // Send confirmation email
        await sendEmail({
          to: payment.user.email,
          subject: 'Payment Confirmation',
          html: `
            <h2>Payment Successful</h2>
            <p>Your payment of $${payment.amount} has been processed successfully.</p>
            <p>Booking ID: ${payment.booking}</p>
            <p>Transaction ID: ${payment.transactionId}</p>
          `
        });

        res.json({
          success: true,
          message: 'Payment processed successfully',
          data: {
            paymentId: payment._id,
            status: payment.status,
            transactionId: payment.transactionId
          }
        });
      } else {
        payment.status = 'failed';
        payment.failureReason = 'PayPal payment failed';
        await payment.save();

        res.status(400).json({
          success: false,
          message: 'Payment failed'
        });
      }
    }

  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

// Get payment by booking ID
const getPaymentByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findOne({ booking: bookingId })
      .populate('booking user', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user owns this payment or is admin
    if (payment.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this payment'
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Get payment by booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment',
      error: error.message
    });
  }
};

// Get user's payments
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ user: userId })
      .populate('booking', 'startTime endTime totalAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments({ user: userId });

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user payments',
      error: error.message
    });
  }
};

// Request refund
const requestRefund = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { paymentId } = req.params;
    const { amount, reason } = req.body;
    const userId = req.user.id;

    const payment = await Payment.findById(paymentId).populate('user booking');
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to request refund for this payment'
      });
    }

    if (!payment.canBeRefunded()) {
      return res.status(400).json({
        success: false,
        message: 'Payment cannot be refunded'
      });
    }

    const refundAmount = amount || payment.netAmount;
    if (refundAmount > payment.netAmount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount exceeds available amount'
      });
    }

    // Add refund to payment
    const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await payment.addRefund(refundAmount, reason, refundId);

    // Send notification to admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'Refund Request',
      html: `
        <h2>New Refund Request</h2>
        <p>User: ${payment.user.name} (${payment.user.email})</p>
        <p>Payment ID: ${payment._id}</p>
        <p>Amount: $${refundAmount}</p>
        <p>Reason: ${reason}</p>
      `
    });

    res.json({
      success: true,
      message: 'Refund request submitted successfully',
      data: {
        refundId,
        amount: refundAmount,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request refund',
      error: error.message
    });
  }
};

// Get refunds for a payment
const getRefunds = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findById(paymentId).populate('user');
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view refunds for this payment'
      });
    }

    res.json({
      success: true,
      data: payment.refunds
    });

  } catch (error) {
    console.error('Get refunds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get refunds',
      error: error.message
    });
  }
};

// Admin: Get all payments
const getAllPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const paymentMethod = req.query.paymentMethod;

    const filter = {};
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const payments = await Payment.find(filter)
      .populate('user', 'name email')
      .populate('booking', 'startTime endTime totalAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments',
      error: error.message
    });
  }
};

// Admin: Process refund
const processRefund = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(paymentId).populate('user');
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const refundAmount = amount || payment.netAmount;
    let refundResult;

    if (payment.paymentProvider === 'stripe') {
      refundResult = await stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: 'requested_by_customer'
      });
    } else if (payment.paymentProvider === 'paypal') {
      // PayPal refund implementation
      const request = new paypal.payments.CapturesRefundRequest(payment.transactionId);
      request.requestBody({
        amount: {
          currency_code: 'USD',
          value: refundAmount.toString()
        }
      });
      refundResult = await paypalClient().execute(request);
    }

    // Update refund status in payment
    const refund = payment.refunds.find(r => r.status === 'pending');
    if (refund) {
      refund.status = 'succeeded';
      refund.refundId = refundResult.id;
      await payment.save();
    }

    // Send confirmation email
    await sendEmail({
      to: payment.user.email,
      subject: 'Refund Processed',
      html: `
        <h2>Refund Processed</h2>
        <p>Your refund of $${refundAmount} has been processed successfully.</p>
        <p>Payment ID: ${payment._id}</p>
        <p>Refund ID: ${refundResult.id}</p>
      `
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refundResult.id,
        amount: refundAmount,
        status: 'succeeded'
      }
    });

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  }
};

// Admin: Get payment analytics
const getPaymentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;
    
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const analytics = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            status: '$status',
            paymentMethod: '$paymentMethod'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.status',
          methods: {
            $push: {
              method: '$_id.paymentMethod',
              count: '$count',
              totalAmount: '$totalAmount'
            }
          },
          totalCount: { $sum: '$count' },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Revenue over time
    const revenueOverTime = await Payment.aggregate([
      {
        $match: {
          status: 'succeeded',
          ...matchStage
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: period === 'day' ? { $dayOfMonth: '$createdAt' } : undefined
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        analytics,
        revenueOverTime
      }
    });

  } catch (error) {
    console.error('Get payment analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment analytics',
      error: error.message
    });
  }
};

// Handle Stripe webhook
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
        if (payment) {
          payment.status = 'succeeded';
          payment.paidAt = new Date();
          await payment.save();
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        const failedPaymentRecord = await Payment.findOne({ paymentIntentId: failedPayment.id });
        if (failedPaymentRecord) {
          failedPaymentRecord.status = 'failed';
          failedPaymentRecord.failureReason = failedPayment.last_payment_error?.message;
          await failedPaymentRecord.save();
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Handle PayPal webhook
const handlePayPalWebhook = async (req, res) => {
  try {
    const event = req.body;
    
    // PayPal webhook verification would go here
    
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        const resource = event.resource;
        const payment = await Payment.findOne({ transactionId: resource.id });
        if (payment) {
          payment.status = 'succeeded';
          payment.paidAt = new Date();
          await payment.save();
        }
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        const deniedResource = event.resource;
        const deniedPayment = await Payment.findOne({ transactionId: deniedResource.id });
        if (deniedPayment) {
          deniedPayment.status = 'failed';
          deniedPayment.failureReason = 'Payment denied by PayPal';
          await deniedPayment.save();
        }
        break;

      default:
        console.log(`Unhandled PayPal event type ${event.event_type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook handler error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPaymentIntent,
  processPayment,
  getPaymentByBooking,
  getUserPayments,
  requestRefund,
  getRefunds,
  getAllPayments,
  processRefund,
  getPaymentAnalytics,
  handleStripeWebhook,
  handlePayPalWebhook
};

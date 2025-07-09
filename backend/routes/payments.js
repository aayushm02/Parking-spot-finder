const express = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const createPaymentIntentValidation = [
  body('bookingId').isMongoId().withMessage('Invalid booking ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be at least 0.01'),
  body('paymentMethod').isIn(['credit_card', 'debit_card', 'paypal']).withMessage('Invalid payment method')
];

const processPaymentValidation = [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
  body('paymentMethodId').notEmpty().withMessage('Payment method ID is required')
];

const refundValidation = [
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Refund amount must be at least 0.01'),
  body('reason').notEmpty().withMessage('Refund reason is required')
];

// Protected routes
router.post('/create-payment-intent', authenticateToken, createPaymentIntentValidation, paymentController.createPaymentIntent);
router.post('/process-payment', authenticateToken, processPaymentValidation, paymentController.processPayment);
router.get('/booking/:bookingId', authenticateToken, paymentController.getPaymentByBooking);
router.get('/user/payments', authenticateToken, paymentController.getUserPayments);

// Refund routes
router.post('/:paymentId/refund', authenticateToken, refundValidation, paymentController.requestRefund);
router.get('/:paymentId/refunds', authenticateToken, paymentController.getRefunds);

// Admin routes
router.get('/admin/all', authenticateToken, authorizeRoles('admin'), paymentController.getAllPayments);
router.post('/admin/:paymentId/refund', authenticateToken, authorizeRoles('admin'), refundValidation, paymentController.processRefund);
router.get('/admin/analytics', authenticateToken, authorizeRoles('admin'), paymentController.getPaymentAnalytics);

// Webhook routes (public)
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), paymentController.handleStripeWebhook);
router.post('/webhook/paypal', paymentController.handlePayPalWebhook);

module.exports = router;

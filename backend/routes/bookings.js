const express = require('express');
const { body, query } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const createBookingValidation = [
  body('parkingSpotId').isMongoId().withMessage('Invalid parking spot ID'),
  body('startTime').isISO8601().withMessage('Start time must be a valid date'),
  body('endTime').isISO8601().withMessage('End time must be a valid date'),
  body('vehicleInfo.licensePlate').notEmpty().withMessage('License plate is required'),
  body('vehicleInfo.type').isIn(['car', 'motorcycle', 'bicycle', 'truck', 'van']).withMessage('Invalid vehicle type'),
  body('paymentMethod').isIn(['credit_card', 'debit_card', 'paypal', 'stripe']).withMessage('Invalid payment method')
];

const updateBookingValidation = [
  body('startTime').optional().isISO8601().withMessage('Start time must be a valid date'),
  body('endTime').optional().isISO8601().withMessage('End time must be a valid date'),
  body('vehicleInfo.licensePlate').optional().notEmpty().withMessage('License plate cannot be empty'),
  body('vehicleInfo.type').optional().isIn(['car', 'motorcycle', 'bicycle', 'truck', 'van']).withMessage('Invalid vehicle type')
];

const checkAvailabilityValidation = [
  query('spotId').isMongoId().withMessage('Invalid parking spot ID'),
  query('startTime').isISO8601().withMessage('Start time must be a valid date'),
  query('endTime').isISO8601().withMessage('End time must be a valid date')
];

const ratingValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
];

// Public routes
router.get('/availability', checkAvailabilityValidation, bookingController.checkAvailability);

// Protected routes
router.post('/', authenticateToken, createBookingValidation, bookingController.createBooking);
router.get('/', authenticateToken, bookingController.getUserBookings);
router.get('/:id', authenticateToken, bookingController.getBookingById);
router.put('/:id', authenticateToken, updateBookingValidation, bookingController.updateBooking);
router.delete('/:id', authenticateToken, bookingController.cancelBooking);

// Booking actions
router.post('/:id/check-in', authenticateToken, bookingController.checkIn);
router.post('/:id/check-out', authenticateToken, bookingController.checkOut);
router.post('/:id/extend', authenticateToken, [
  body('additionalHours').isInt({ min: 1, max: 24 }).withMessage('Additional hours must be between 1 and 24')
], bookingController.extendBooking);

// Rating
router.post('/:id/rating', authenticateToken, ratingValidation, bookingController.rateBooking);

// Spot owner routes
router.get('/spot/:spotId', authenticateToken, authorizeRoles('spot_owner', 'admin'), bookingController.getSpotBookings);
router.put('/:id/status', authenticateToken, authorizeRoles('spot_owner', 'admin'), [
  body('status').isIn(['confirmed', 'cancelled', 'no_show']).withMessage('Invalid status')
], bookingController.updateBookingStatus);

// Admin routes
router.get('/admin/all', authenticateToken, authorizeRoles('admin'), bookingController.getAllBookings);
router.get('/admin/analytics', authenticateToken, authorizeRoles('admin'), bookingController.getBookingAnalytics);

module.exports = router;

const express = require('express');
const { body, query } = require('express-validator');
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Middleware to ensure all routes are admin-only
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// Validation middleware
const userUpdateValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('role').optional().isIn(['user', 'spot_owner', 'admin']).withMessage('Invalid role'),
  body('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean')
];

const spotUpdateValidation = [
  body('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('pricing.hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

// Dashboard and analytics
router.get('/dashboard', adminController.getDashboard);
router.get('/analytics', adminController.getAnalytics);
router.get('/reports', adminController.getReports);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', userUpdateValidation, adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/ban', [
  body('reason').notEmpty().withMessage('Ban reason is required'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer')
], adminController.banUser);
router.post('/users/:id/unban', adminController.unbanUser);

// Parking spot management
router.get('/spots', adminController.getAllSpots);
router.get('/spots/:id', adminController.getSpotById);
router.put('/spots/:id', spotUpdateValidation, adminController.updateSpot);
router.delete('/spots/:id', adminController.deleteSpot);
router.post('/spots/:id/approve', adminController.approveSpot);
router.post('/spots/:id/reject', [
  body('reason').notEmpty().withMessage('Rejection reason is required')
], adminController.rejectSpot);

// Booking management
router.get('/bookings', adminController.getAllBookings);
router.get('/bookings/:id', adminController.getBookingById);
router.put('/bookings/:id/status', [
  body('status').isIn(['confirmed', 'cancelled', 'no_show']).withMessage('Invalid status'),
  body('reason').optional().notEmpty().withMessage('Reason cannot be empty')
], adminController.updateBookingStatus);

// Payment management
router.get('/payments', adminController.getAllPayments);
router.get('/payments/:id', adminController.getPaymentById);
router.post('/payments/:id/refund', [
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Refund amount must be at least 0.01'),
  body('reason').notEmpty().withMessage('Refund reason is required')
], adminController.processRefund);

// System settings
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// Content management
router.get('/reports/spots', adminController.getSpotReports);
router.get('/reports/users', adminController.getUserReports);
router.post('/reports/:id/resolve', [
  body('action').isIn(['dismiss', 'warning', 'suspend', 'ban']).withMessage('Invalid action'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], adminController.resolveReport);

// System logs
router.get('/logs', adminController.getSystemLogs);
router.get('/logs/errors', adminController.getErrorLogs);

module.exports = router;

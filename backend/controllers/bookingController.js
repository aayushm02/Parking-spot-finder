const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const ParkingSpot = require('../models/ParkingSpot');
const User = require('../models/User');
const QRCode = require('qrcode');
const { sendBookingConfirmation, sendBookingCancellation } = require('../utils/email');


// Check availability for a specific time slot
const checkAvailability = async (req, res) => {
  try {
    const { spotId, startTime, endTime } = req.query;

    if (!spotId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Spot ID, start time, and end time are required'
      });
    }

    const spot = await ParkingSpot.findById(spotId);
    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // Check if spot is generally available
    if (!spot.availability.isAvailable) {
      return res.json({
        success: true,
        data: { isAvailable: false, reason: 'Spot is not available' }
      });
    }

    // Check for conflicting bookings
    const conflictingBookings = await Booking.find({
      parkingSpot: spotId,
      status: { $in: ['confirmed', 'active'] },
      $or: [
        { startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } }
      ]
    });

    const isAvailable = conflictingBookings.length === 0;

    res.json({
      success: true,
      data: { 
        isAvailable,
        reason: isAvailable ? null : 'Time slot is already booked'
      }
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking availability'
    });
  }
};

// Create new booking
const createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { parkingSpotId, startTime, endTime, vehicleInfo, paymentMethod } = req.body;

    // Check if spot exists and is available
    const spot = await ParkingSpot.findById(parkingSpotId);
    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    if (!spot.availability.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Parking spot is not available'
      });
    }

    // Check for conflicting bookings
    const conflictingBookings = await Booking.find({
      parkingSpot: parkingSpotId,
      status: { $in: ['confirmed', 'active'] },
      $or: [
        { startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } }
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is already booked'
      });
    }

    // Calculate total amount
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const durationMs = endDate - startDate;
    const durationHours = durationMs / (1000 * 60 * 60);
    const totalAmount = durationHours * spot.pricing.hourlyRate;

    // Generate QR code
    const qrData = {
      bookingId: null, // Will be set after booking is created
      spotId: parkingSpotId,
      userId: req.user._id,
      startTime,
      endTime
    };

    const booking = new Booking({
      user: req.user._id,
      parkingSpot: parkingSpotId,
      startTime,
      endTime,
      totalAmount,
      vehicleInfo,
      paymentMethod,
      status: 'pending'
    });

    await booking.save();

    // Update QR code with booking ID
    qrData.bookingId = booking._id;
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
    booking.qrCode = qrCode;
    await booking.save();

    // Populate booking for response
    await booking.populate([
      { path: 'user', select: 'name email' },
      { path: 'parkingSpot', select: 'title address pricing' }
    ]);

    // Send confirmation email
    try {
      await sendBookingConfirmation(booking, req.user, spot);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking'
    });
  }
};

// Get user's bookings
const getUserBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('parkingSpot', 'title address pricing images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings'
    });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('parkingSpot', 'title address pricing images owner')
      .populate('parkingSpot.owner', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking or is the spot owner or admin
    if (booking.user._id.toString() !== req.user._id.toString() && 
        booking.parkingSpot.owner.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking'
    });
  }
};

// Update booking
const updateBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Only allow updates for pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update booking in current status'
      });
    }

    const { startTime, endTime, vehicleInfo } = req.body;

    // If time is being updated, check for conflicts
    if (startTime || endTime) {
      const newStartTime = startTime || booking.startTime;
      const newEndTime = endTime || booking.endTime;

      const conflictingBookings = await Booking.find({
        _id: { $ne: booking._id },
        parkingSpot: booking.parkingSpot,
        status: { $in: ['confirmed', 'active'] },
        $or: [
          { startTime: { $lt: new Date(newEndTime) }, endTime: { $gt: new Date(newStartTime) } }
        ]
      });

      if (conflictingBookings.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'New time slot conflicts with existing booking'
        });
      }

      // Recalculate total amount if time changed
      if (startTime || endTime) {
        const spot = await ParkingSpot.findById(booking.parkingSpot);
        const durationMs = new Date(newEndTime) - new Date(newStartTime);
        const durationHours = durationMs / (1000 * 60 * 60);
        const totalAmount = durationHours * spot.pricing.hourlyRate;
        
        booking.totalAmount = totalAmount;
      }
    }

    // Update fields
    if (startTime) booking.startTime = startTime;
    if (endTime) booking.endTime = endTime;
    if (vehicleInfo) booking.vehicleInfo = { ...booking.vehicleInfo, ...vehicleInfo };

    await booking.save();

    await booking.populate([
      { path: 'user', select: 'name email' },
      { path: 'parkingSpot', select: 'title address pricing' }
    ]);

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking'
    });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('parkingSpot', 'title address');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (!booking.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled at this time'
      });
    }

    // Calculate refund amount based on cancellation policy
    const now = new Date();
    const timeUntilStart = booking.startTime - now;
    const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);
    
    let refundAmount = 0;
    if (hoursUntilStart > 24) {
      refundAmount = booking.totalAmount; // Full refund
    } else if (hoursUntilStart > 1) {
      refundAmount = booking.totalAmount * 0.5; // 50% refund
    }

    booking.status = 'cancelled';
    booking.refundAmount = refundAmount;
    booking.cancellationReason = req.body.reason || 'Cancelled by user';

    await booking.save();

    // Send cancellation email
    try {
      await sendBookingCancellation(booking, booking.user, booking.parkingSpot);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking'
    });
  }
};

// Check in
const checkIn = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check in'
      });
    }

    // Check if booking is confirmed
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Booking must be confirmed to check in'
      });
    }

    // Check if check-in is within allowed time
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const timeDiff = Math.abs(now - startTime) / (1000 * 60); // in minutes

    if (timeDiff > 30) { // Allow 30 minutes before/after start time
      return res.status(400).json({
        success: false,
        message: 'Check-in is only allowed within 30 minutes of start time'
      });
    }

    booking.status = 'active';
    booking.checkInTime = now;
    await booking.save();

    res.json({
      success: true,
      message: 'Checked in successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking in'
    });
  }
};

// Check out
const checkOut = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check out'
      });
    }

    // Check if booking is active
    if (booking.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Booking must be active to check out'
      });
    }

    booking.status = 'completed';
    booking.checkOutTime = new Date();
    await booking.save();

    // Update spot's total bookings
    await ParkingSpot.findByIdAndUpdate(booking.parkingSpot, {
      $inc: { totalBookings: 1 }
    });

    res.json({
      success: true,
      message: 'Checked out successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Check out error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking out'
    });
  }
};

// Extend booking
const extendBooking = async (req, res) => {
  try {
    const { additionalHours } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to extend this booking'
      });
    }

    // Check if booking is active
    if (booking.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active bookings can be extended'
      });
    }

    const newEndTime = new Date(booking.endTime);
    newEndTime.setHours(newEndTime.getHours() + additionalHours);

    // Check for conflicts with the extension
    const conflictingBookings = await Booking.find({
      _id: { $ne: booking._id },
      parkingSpot: booking.parkingSpot,
      status: { $in: ['confirmed', 'active'] },
      startTime: { $lt: newEndTime },
      endTime: { $gt: booking.endTime }
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot extend booking due to conflicting reservations'
      });
    }

    // Calculate additional cost
    const spot = await ParkingSpot.findById(booking.parkingSpot);
    const additionalCost = additionalHours * spot.pricing.hourlyRate;

    booking.endTime = newEndTime;
    booking.totalAmount += additionalCost;
    await booking.save();

    res.json({
      success: true,
      message: 'Booking extended successfully',
      data: { 
        booking,
        additionalCost
      }
    });
  } catch (error) {
    console.error('Extend booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error extending booking'
    });
  }
};

// Rate booking
const rateBooking = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this booking'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed bookings can be rated'
      });
    }

    // Check if already rated
    if (booking.rating && booking.rating.score) {
      return res.status(400).json({
        success: false,
        message: 'Booking has already been rated'
      });
    }

    booking.rating = {
      score: rating,
      comment: comment || '',
      createdAt: new Date()
    };
    await booking.save();

    // Update spot's rating
    const spot = await ParkingSpot.findById(booking.parkingSpot);
    const newRatingCount = spot.ratings.count + 1;
    const newAverage = ((spot.ratings.average * spot.ratings.count) + rating) / newRatingCount;

    await ParkingSpot.findByIdAndUpdate(booking.parkingSpot, {
      'ratings.average': newAverage,
      'ratings.count': newRatingCount
    });

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Rate booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rating booking'
    });
  }
};

// Get spot bookings (for spot owners)
const getSpotBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const skip = (page - 1) * limit;

    const spot = await ParkingSpot.findById(req.params.spotId);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // Check if user owns this spot
    if (spot.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these bookings'
      });
    }

    const filter = { parkingSpot: req.params.spotId };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get spot bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching spot bookings'
    });
  }
};

// Update booking status (for spot owners/admins)
const updateBookingStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    const booking = await Booking.findById(req.params.id)
      .populate('parkingSpot', 'owner');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the spot or is admin
    if (booking.parkingSpot.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    booking.status = status;
    if (reason) booking.cancellationReason = reason;
    
    await booking.save();

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status'
    });
  }
};

// Get all bookings (admin only)
const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('user', 'name email')
      .populate('parkingSpot', 'title address owner')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all bookings'
    });
  }
};

// Get booking analytics (admin only)
const getBookingAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await Booking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageAmount: { $avg: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const statusDistribution = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        analytics,
        statusDistribution
      }
    });
  } catch (error) {
    console.error('Get booking analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking analytics'
    });
  }
};

module.exports = {
  checkAvailability,
  createBooking,
  getUserBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  checkIn,
  checkOut,
  extendBooking,
  rateBooking,
  getSpotBookings,
  updateBookingStatus,
  getAllBookings,
  getBookingAnalytics
};

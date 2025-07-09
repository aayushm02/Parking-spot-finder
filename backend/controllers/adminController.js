const { validationResult } = require('express-validator');
const User = require('../models/User');
const ParkingSpot = require('../models/ParkingSpot');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

// Dashboard data
const getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalSpots, totalBookings, totalRevenue] = await Promise.all([
      User.countDocuments(),
      ParkingSpot.countDocuments(),
      Booking.countDocuments(),
      Payment.aggregate([
        { $match: { status: 'succeeded' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate('parkingSpot', 'title address')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalSpots,
          totalBookings,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        recentBookings,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
};

// Analytics data
const getAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bookingStats = await Booking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const spotsByLocation = await ParkingSpot.aggregate([
      {
        $group: {
          _id: '$address.city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        bookingStats,
        userGrowth,
        spotsByLocation
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data'
    });
  }
};

// Reports
const getReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const bookingsReport = await Booking.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: { createdAt: dateFilter } }] : []),
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const spotsReport = await ParkingSpot.aggregate([
      {
        $group: {
          _id: '$availability.isAvailable',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        bookingsReport,
        spotsReport
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports'
    });
  }
};

// User management
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userBookings = await Booking.find({ user: user._id })
      .populate('parkingSpot', 'title address')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        user,
        recentBookings: userBookings
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
};

const banUser = async (req, res) => {
  try {
    const { reason, duration } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isBanned: true,
        banReason: reason,
        banExpires: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User banned successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error banning user'
    });
  }
};

const unbanUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isBanned: false,
        banReason: null,
        banExpires: null
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User unbanned successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unbanning user'
    });
  }
};

// Parking spot management
const getAllSpots = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'address.fullAddress': { $regex: search, $options: 'i' } }
      ];
    }
    if (status) filter.isActive = status === 'active';

    const spots = await ParkingSpot.find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ParkingSpot.countDocuments(filter);

    res.json({
      success: true,
      data: {
        spots,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all spots error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching spots'
    });
  }
};

const getSpotById = async (req, res) => {
  try {
    const spot = await ParkingSpot.findById(req.params.id).populate('owner', 'name email');
    
    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    res.json({
      success: true,
      data: { spot }
    });
  } catch (error) {
    console.error('Get spot by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching spot'
    });
  }
};

const updateSpot = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const spot = await ParkingSpot.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    res.json({
      success: true,
      message: 'Parking spot updated successfully',
      data: { spot }
    });
  } catch (error) {
    console.error('Update spot error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating spot'
    });
  }
};

const deleteSpot = async (req, res) => {
  try {
    const spot = await ParkingSpot.findByIdAndDelete(req.params.id);
    
    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    res.json({
      success: true,
      message: 'Parking spot deleted successfully'
    });
  } catch (error) {
    console.error('Delete spot error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting spot'
    });
  }
};

const approveSpot = async (req, res) => {
  try {
    const spot = await ParkingSpot.findByIdAndUpdate(
      req.params.id,
      { isActive: true, approvedAt: new Date() },
      { new: true }
    ).populate('owner', 'name email');

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    res.json({
      success: true,
      message: 'Parking spot approved successfully',
      data: { spot }
    });
  } catch (error) {
    console.error('Approve spot error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving spot'
    });
  }
};

const rejectSpot = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const spot = await ParkingSpot.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        rejectedAt: new Date(),
        rejectionReason: reason
      },
      { new: true }
    ).populate('owner', 'name email');

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    res.json({
      success: true,
      message: 'Parking spot rejected successfully',
      data: { spot }
    });
  } catch (error) {
    console.error('Reject spot error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting spot'
    });
  }
};

// Booking management
const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('user', 'name email')
      .populate('parkingSpot', 'title address')
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
      message: 'Error fetching bookings'
    });
  }
};

const getBookingById = async (req, res) => {
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

const updateBookingStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        ...(reason && { cancellationReason: reason })
      },
      { new: true }
    ).populate('user', 'name email').populate('parkingSpot', 'title address');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

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

// Payment management
const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .populate('user', 'name email')
      .populate('booking', 'startTime endTime')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments'
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email')
      .populate('booking', 'startTime endTime totalAmount');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment'
    });
  }
};

const processRefund = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Add refund logic here (integrate with payment processor)
    const refundAmount = amount || payment.amount;
    
    await payment.addRefund(refundAmount, reason, `refund_${Date.now()}`);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: { payment }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund'
    });
  }
};

// Settings management
const getSettings = async (req, res) => {
  try {
    // In a real app, you'd store these in a separate Settings collection
    const settings = {
      siteName: 'Parking Spot Finder',
      contactEmail: 'admin@parkingspotfinder.com',
      maxBookingHours: 24,
      cancellationPolicy: 'Free cancellation up to 1 hour before booking',
      paymentMethods: ['credit_card', 'debit_card', 'paypal']
    };

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings'
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    // In a real app, you'd update these in a Settings collection
    const settings = req.body;

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings'
    });
  }
};

// Report management
const getSpotReports = async (req, res) => {
  try {
    // Mock report data - in real app, you'd have a Reports collection
    const reports = [];

    res.json({
      success: true,
      data: { reports }
    });
  } catch (error) {
    console.error('Get spot reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching spot reports'
    });
  }
};

const getUserReports = async (req, res) => {
  try {
    // Mock report data - in real app, you'd have a Reports collection
    const reports = [];

    res.json({
      success: true,
      data: { reports }
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user reports'
    });
  }
};

const resolveReport = async (req, res) => {
  try {
    const { action, notes } = req.body;
    
    // In a real app, you'd update the report in the database
    res.json({
      success: true,
      message: 'Report resolved successfully',
      data: { action, notes }
    });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving report'
    });
  }
};

// System logs
const getSystemLogs = async (req, res) => {
  try {
    // Mock log data - in real app, you'd have proper logging system
    const logs = [];

    res.json({
      success: true,
      data: { logs }
    });
  } catch (error) {
    console.error('Get system logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system logs'
    });
  }
};

const getErrorLogs = async (req, res) => {
  try {
    // Mock error log data - in real app, you'd have proper error logging
    const errorLogs = [];

    res.json({
      success: true,
      data: { errorLogs }
    });
  } catch (error) {
    console.error('Get error logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching error logs'
    });
  }
};

module.exports = {
  getDashboard,
  getAnalytics,
  getReports,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  banUser,
  unbanUser,
  getAllSpots,
  getSpotById,
  updateSpot,
  deleteSpot,
  approveSpot,
  rejectSpot,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  getAllPayments,
  getPaymentById,
  processRefund,
  getSettings,
  updateSettings,
  getSpotReports,
  getUserReports,
  resolveReport,
  getSystemLogs,
  getErrorLogs
};

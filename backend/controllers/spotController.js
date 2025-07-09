const { validationResult } = require('express-validator');
const ParkingSpot = require('../models/ParkingSpot');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Get all spots with pagination and filtering
const getAllSpots = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      vehicleType = '', 
      features = [], 
      maxPrice = '', 
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const filter = { isActive: true };

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'address.fullAddress': { $regex: search, $options: 'i' } }
      ];
    }

    // Vehicle type filter
    if (vehicleType) {
      filter.vehicleTypes = vehicleType;
    }

    // Features filter
    if (features.length > 0) {
      filter.features = { $in: Array.isArray(features) ? features : [features] };
    }

    // Price filter
    if (maxPrice) {
      filter['pricing.hourlyRate'] = { $lte: parseFloat(maxPrice) };
    }

    // Availability filter
    filter['availability.isAvailable'] = true;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const spots = await ParkingSpot.find(filter)
      .populate('owner', 'name email')
      .sort(sortOptions)
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
      message: 'Error fetching parking spots'
    });
  }
};

// Search spots with advanced filtering
const searchSpots = async (req, res) => {
  try {
    const { 
      q = '', 
      lat, 
      lng, 
      radius = 5, 
      vehicleType = '', 
      features = [], 
      maxPrice = '',
      startTime,
      endTime
    } = req.query;

    const filter = { isActive: true, 'availability.isAvailable': true };

    // Text search
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'address.fullAddress': { $regex: q, $options: 'i' } }
      ];
    }

    // Location-based search
    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    // Vehicle type filter
    if (vehicleType) {
      filter.vehicleTypes = vehicleType;
    }

    // Features filter
    if (features.length > 0) {
      filter.features = { $in: Array.isArray(features) ? features : [features] };
    }

    // Price filter
    if (maxPrice) {
      filter['pricing.hourlyRate'] = { $lte: parseFloat(maxPrice) };
    }

    let spots = await ParkingSpot.find(filter)
      .populate('owner', 'name email')
      .limit(50);

    // Filter by availability for specific time range
    if (startTime && endTime) {
      const spotIds = spots.map(spot => spot._id);
      const conflictingBookings = await Booking.find({
        parkingSpot: { $in: spotIds },
        status: { $in: ['confirmed', 'active'] },
        $or: [
          { startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } }
        ]
      });

      const bookedSpotIds = conflictingBookings.map(booking => booking.parkingSpot.toString());
      spots = spots.filter(spot => !bookedSpotIds.includes(spot._id.toString()));
    }

    res.json({
      success: true,
      data: {
        spots,
        count: spots.length
      }
    });
  } catch (error) {
    console.error('Search spots error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching parking spots'
    });
  }
};

// Get nearby spots
const getNearbySpots = async (req, res) => {
  try {
    const { lat, lng, radius = 5, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const spots = await ParkingSpot.find({
      isActive: true,
      'availability.isAvailable': true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    })
    .populate('owner', 'name email')
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        spots,
        count: spots.length
      }
    });
  } catch (error) {
    console.error('Get nearby spots error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby spots'
    });
  }
};

// Get spot by ID
const getSpotById = async (req, res) => {
  try {
    const spot = await ParkingSpot.findById(req.params.id)
      .populate('owner', 'name email phone avatar');

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // Get recent bookings for this spot
    const recentBookings = await Booking.find({
      parkingSpot: spot._id,
      status: 'completed'
    })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(5);

    res.json({
      success: true,
      data: {
        spot,
        recentBookings
      }
    });
  } catch (error) {
    console.error('Get spot by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching parking spot'
    });
  }
};

// Create new spot
const createSpot = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const spotData = {
      ...req.body,
      owner: req.user._id
    };

    const spot = new ParkingSpot(spotData);
    await spot.save();

    await spot.populate('owner', 'name email');

    res.status(201).json({
      success: true,
      message: 'Parking spot created successfully',
      data: { spot }
    });
  } catch (error) {
    console.error('Create spot error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating parking spot'
    });
  }
};

// Update spot
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

    const spot = await ParkingSpot.findById(req.params.id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // Check if user owns this spot or is admin
    if (spot.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this spot'
      });
    }

    const updatedSpot = await ParkingSpot.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    res.json({
      success: true,
      message: 'Parking spot updated successfully',
      data: { spot: updatedSpot }
    });
  } catch (error) {
    console.error('Update spot error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating parking spot'
    });
  }
};

// Delete spot
const deleteSpot = async (req, res) => {
  try {
    const spot = await ParkingSpot.findById(req.params.id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // Check if user owns this spot or is admin
    if (spot.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this spot'
      });
    }

    // Check for active bookings
    const activeBookings = await Booking.find({
      parkingSpot: spot._id,
      status: { $in: ['confirmed', 'active'] }
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete spot with active bookings'
      });
    }

    await ParkingSpot.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Parking spot deleted successfully'
    });
  } catch (error) {
    console.error('Delete spot error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting parking spot'
    });
  }
};

// Get my spots (for spot owners)
const getMySpots = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const spots = await ParkingSpot.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ParkingSpot.countDocuments({ owner: req.user._id });

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
    console.error('Get my spots error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your spots'
    });
  }
};

// Update availability
const updateAvailability = async (req, res) => {
  try {
    const { isAvailable, availableFrom, availableTo } = req.body;

    const spot = await ParkingSpot.findById(req.params.id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // Check if user owns this spot or is admin
    if (spot.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this spot'
      });
    }

    const updatedSpot = await ParkingSpot.findByIdAndUpdate(
      req.params.id,
      {
        'availability.isAvailable': isAvailable,
        ...(availableFrom && { 'availability.availableFrom': availableFrom }),
        ...(availableTo && { 'availability.availableTo': availableTo })
      },
      { new: true }
    ).populate('owner', 'name email');

    // Emit real-time update
    if (req.io) {
      req.io.emit('spot-availability-changed', {
        spotId: updatedSpot._id,
        isAvailable,
        title: updatedSpot.title,
        lat: updatedSpot.location.coordinates[1],
        lng: updatedSpot.location.coordinates[0]
      });
    }

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: { spot: updatedSpot }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating availability'
    });
  }
};

// Add rating
const addRating = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const spot = await ParkingSpot.findById(req.params.id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // Check if user has completed a booking for this spot
    const completedBooking = await Booking.findOne({
      user: req.user._id,
      parkingSpot: spot._id,
      status: 'completed'
    });

    if (!completedBooking) {
      return res.status(400).json({
        success: false,
        message: 'You can only rate spots you have used'
      });
    }

    // Update rating
    const newRatingCount = spot.ratings.count + 1;
    const newAverage = ((spot.ratings.average * spot.ratings.count) + rating) / newRatingCount;

    await ParkingSpot.findByIdAndUpdate(req.params.id, {
      'ratings.average': newAverage,
      'ratings.count': newRatingCount
    });

    // Add rating to booking
    await Booking.findByIdAndUpdate(completedBooking._id, {
      'rating.score': rating,
      'rating.comment': comment
    });

    res.json({
      success: true,
      message: 'Rating added successfully'
    });
  } catch (error) {
    console.error('Add rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding rating'
    });
  }
};

// Add to favorites
const addToFavorites = async (req, res) => {
  try {
    const spot = await ParkingSpot.findById(req.params.id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // Add to user's favorites (you'd need to add a favorites field to User model)
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { favorites: spot._id }
    });

    res.json({
      success: true,
      message: 'Added to favorites'
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to favorites'
    });
  }
};

// Remove from favorites
const removeFromFavorites = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { favorites: req.params.id }
    });

    res.json({
      success: true,
      message: 'Removed from favorites'
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from favorites'
    });
  }
};

// Get favorites
const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      populate: {
        path: 'owner',
        select: 'name email'
      }
    });

    res.json({
      success: true,
      data: {
        favorites: user.favorites || []
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites'
    });
  }
};

// Report spot
const reportSpot = async (req, res) => {
  try {
    const { reason, description } = req.body;

    const spot = await ParkingSpot.findById(req.params.id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // In a real app, you'd store this in a Reports collection
    console.log(`Spot reported: ${spot.title} - Reason: ${reason} - Description: ${description}`);

    res.json({
      success: true,
      message: 'Report submitted successfully'
    });
  } catch (error) {
    console.error('Report spot error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting spot'
    });
  }
};

module.exports = {
  getAllSpots,
  searchSpots,
  getNearbySpots,
  getSpotById,
  createSpot,
  updateSpot,
  deleteSpot,
  getMySpots,
  updateAvailability,
  addRating,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  reportSpot
};

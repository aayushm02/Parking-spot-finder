const mongoose = require('mongoose');

const parkingSpotSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(val) {
          return val.length === 2;
        },
        message: 'Coordinates must be [longitude, latitude]'
      }
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    fullAddress: String
  },
  pricing: {
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Hourly rate cannot be negative']
    },
    dailyRate: {
      type: Number,
      min: [0, 'Daily rate cannot be negative']
    },
    weeklyRate: {
      type: Number,
      min: [0, 'Weekly rate cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    availableFrom: {
      type: Date,
      default: Date.now
    },
    availableTo: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    },
    timeSlots: [{
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6
      },
      startTime: String,
      endTime: String
    }]
  },
  features: {
    type: [String],
    enum: ['covered', 'security', 'ev_charging', 'handicap_accessible', 'valet', 'camera_surveillance', 'lighting'],
    default: []
  },
  vehicleTypes: {
    type: [String],
    enum: ['car', 'motorcycle', 'bicycle', 'truck', 'van'],
    default: ['car']
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['feet', 'meters'],
      default: 'feet'
    }
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  rules: {
    type: String,
    maxlength: [1000, 'Rules cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
parkingSpotSchema.index({ location: '2dsphere' });
parkingSpotSchema.index({ 'availability.isAvailable': 1 });
parkingSpotSchema.index({ owner: 1 });
parkingSpotSchema.index({ createdAt: -1 });

// Virtual for getting latitude and longitude
parkingSpotSchema.virtual('latitude').get(function() {
  return this.location.coordinates[1];
});

parkingSpotSchema.virtual('longitude').get(function() {
  return this.location.coordinates[0];
});

// Ensure virtual fields are serialized
parkingSpotSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('ParkingSpot', parkingSpotSchema);

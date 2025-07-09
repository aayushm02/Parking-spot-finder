const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parkingSpot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSpot',
    required: true
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  duration: {
    hours: Number,
    minutes: Number
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'cash'],
    default: 'credit_card'
  },
  paymentId: {
    type: String
  },
  vehicleInfo: {
    licensePlate: {
      type: String,
      required: [true, 'License plate is required'],
      uppercase: true,
      trim: true
    },
    make: String,
    model: String,
    color: String,
    type: {
      type: String,
      enum: ['car', 'motorcycle', 'bicycle', 'truck', 'van'],
      default: 'car'
    }
  },
  qrCode: {
    type: String
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  cancellationReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  },
  refundAmount: {
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

// Indexes for better query performance
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ parkingSpot: 1, startTime: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ startTime: 1, endTime: 1 });

// Virtual to calculate actual duration
bookingSchema.virtual('actualDuration').get(function() {
  if (this.checkInTime && this.checkOutTime) {
    const diffMs = this.checkOutTime - this.checkInTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours: diffHours, minutes: diffMinutes };
  }
  return null;
});

// Method to check if booking is active
bookingSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && this.startTime <= now && this.endTime >= now;
};

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const timeDiff = this.startTime - now;
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return this.status === 'confirmed' && hoursDiff > 1; // Can cancel up to 1 hour before
};

// Pre-save middleware to calculate duration
bookingSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    const diffMs = this.endTime - this.startTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    this.duration = {
      hours: diffHours,
      minutes: diffMinutes
    };
  }
  next();
});

// Ensure virtual fields are serialized
bookingSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);

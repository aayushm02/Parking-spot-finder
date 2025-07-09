const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'cash'],
    required: true
  },
  paymentProvider: {
    type: String,
    enum: ['stripe', 'paypal', 'square', 'cash'],
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentIntentId: {
    type: String // For Stripe payment intents
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  failureReason: {
    type: String
  },
  refunds: [{
    amount: {
      type: Number,
      required: true
    },
    reason: String,
    refundId: String,
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    type: Map,
    of: String
  },
  receiptUrl: {
    type: String
  },
  description: {
    type: String
  },
  fees: {
    platformFee: {
      type: Number,
      default: 0
    },
    processingFee: {
      type: Number,
      default: 0
    },
    taxes: {
      type: Number,
      default: 0
    }
  },
  paidAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ paymentIntentId: 1 });

// Virtual for total refunded amount
paymentSchema.virtual('totalRefunded').get(function() {
  if (this.refunds && this.refunds.length > 0) {
    return this.refunds
      .filter(refund => refund.status === 'succeeded')
      .reduce((total, refund) => total + refund.amount, 0);
  }
  return 0;
});

// Virtual for net amount (amount - refunds)
paymentSchema.virtual('netAmount').get(function() {
  return this.amount - this.totalRefunded;
});

// Method to check if payment can be refunded
paymentSchema.methods.canBeRefunded = function() {
  return this.status === 'succeeded' && this.netAmount > 0;
};

// Method to add a refund
paymentSchema.methods.addRefund = function(amount, reason, refundId) {
  this.refunds.push({
    amount: amount,
    reason: reason,
    refundId: refundId,
    status: 'pending'
  });
  return this.save();
};

// Pre-save middleware to set paidAt timestamp
paymentSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'succeeded' && !this.paidAt) {
    this.paidAt = new Date();
  }
  next();
});

// Ensure virtual fields are serialized
paymentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Payment', paymentSchema);

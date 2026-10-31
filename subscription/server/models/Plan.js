const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    billingCycle: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: [true, 'Billing cycle is required'],
      default: 'monthly',
    },
    intervalCount: {
      type: Number,
      default: 1, // e.g. every 1 month, every 3 months, etc.
      min: [1, 'Interval must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Plan price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: [1, 'Minimum quantity must be at least 1'],
    },
    trialDays: {
      type: Number,
      default: 0,
      min: [0, 'Trial days cannot be negative'],
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    availableTo: {
      type: Date,
      default: null, // null means indefinitely available
    },
    description: {
      type: String,
      default: '',
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    allowPause: {
      type: Boolean,
      default: true,
    },
    allowRenewal: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);


const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Discount name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Discount code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum purchase amount cannot be negative'],
    },
    minQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Minimum quantity cannot be negative'],
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    timesUsed: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Method to check if discount is currently valid
discountSchema.methods.isValid = function (subtotal = 0, quantity = 0) {
  if (!this.isActive) return { valid: false, reason: 'Discount is inactive' };
  
  const now = new Date();
  if (this.startDate && now < this.startDate) {
    return { valid: false, reason: 'Discount has not started yet' };
  }
  if (this.endDate && now > this.endDate) {
    return { valid: false, reason: 'Discount has expired' };
  }
  if (this.usageLimit !== null && this.timesUsed >= this.usageLimit) {
    return { valid: false, reason: 'Discount usage limit reached' };
  }
  if (this.minPurchaseAmount > 0 && subtotal < this.minPurchaseAmount) {
    return {
      valid: false,
      reason: `Minimum order amount of $${this.minPurchaseAmount} required`,
    };
  }
  if (this.minQuantity > 0 && quantity < this.minQuantity) {
    return {
      valid: false,
      reason: `Minimum quantity of ${this.minQuantity} items required`,
    };
  }

  return { valid: true };
};

module.exports = mongoose.model('Discount', discountSchema);


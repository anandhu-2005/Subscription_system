const mongoose = require('mongoose');

const subscriptionItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: { type: String, required: true },
  variant: {
    groupName: { type: String, default: '' },
    optionName: { type: String, default: '' },
    priceAdjustment: { type: Number, default: 0 },
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative'],
  },
  subtotal: {
    type: Number,
    required: true,
  },
});

const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Subscription plan is required'],
    },
    items: [subscriptionItemSchema],
    planPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    productsSubtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxes: [
      {
        tax: { type: mongoose.Schema.Types.ObjectId, ref: 'Tax' },
        name: String,
        rate: Number,
        amount: Number,
      },
    ],
    taxTotal: {
      type: Number,
      default: 0,
    },
    discounts: [
      {
        discount: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount' },
        code: String,
        type: { type: String, enum: ['percentage', 'fixed'] },
        value: Number,
        amount: Number,
      },
    ],
    discountTotal: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    billingCycle: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly',
    },
    paymentTerms: {
      type: String,
      enum: ['immediate', 'net15', 'net30', 'net60'],
      default: 'immediate',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    nextBillingDate: {
      type: Date,
      required: true,
    },
    lastBilledDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'quotation', 'confirmed', 'active', 'paused', 'closed'],
      default: 'draft',
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    pausedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    closeReason: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);


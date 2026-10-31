const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null,
  },
  variant: {
    groupName: { type: String, default: '' },
    optionName: { type: String, default: '' },
  },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: [true, 'Subscription reference is required'],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    customerSnapshot: {
      name: String,
      email: String,
      company: String,
      phone: String,
      billingAddress: Object,
      taxId: String,
    },
    billingPeriodStart: {
      type: Date,
      required: true,
    },
    billingPeriodEnd: {
      type: Date,
      required: true,
    },
    items: [invoiceItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxes: [
      {
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
    amountPaid: {
      type: Number,
      default: 0,
    },
    balanceDue: {
      type: Number,
      required: true,
      default: 0,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'confirmed', 'paid', 'partially_paid', 'overdue', 'void'],
      default: 'draft',
    },
    paymentTerms: {
      type: String,
      default: 'immediate',
    },
    generationType: {
      type: String,
      enum: ['automated', 'manual'],
      default: 'automated',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);


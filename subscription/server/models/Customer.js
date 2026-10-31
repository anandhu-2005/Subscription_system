const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  country: { type: String, default: 'USA' },
});

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    company: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    taxId: {
      type: String,
      default: '',
      trim: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentTerms: {
      type: String,
      enum: ['immediate', 'net15', 'net30', 'net60'],
      default: 'immediate',
    },
    billingAddress: addressSchema,
    shippingAddress: addressSchema,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);


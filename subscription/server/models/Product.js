const mongoose = require('mongoose');

const variantOptionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Pro", "Enterprise", "5 Users", "10 Users"
  priceAdjustment: { type: Number, default: 0 }, // Additional cost, e.g. +25
  skuSuffix: { type: String, default: '' },
});

const variantGroupSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Tier", "Capacity", "Support Level"
  options: [variantOptionSchema],
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['service', 'software_license', 'consumable', 'storable'],
      default: 'service',
    },
    salesPrice: {
      type: Number,
      required: [true, 'Sales price is required'],
      min: [0, 'Sales price cannot be negative'],
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price cannot be negative'],
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
    },
    variants: [variantGroupSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);


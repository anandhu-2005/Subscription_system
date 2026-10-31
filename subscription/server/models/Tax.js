const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tax name is required'],
      trim: true,
    },
    rate: {
      type: Number,
      required: [true, 'Tax rate is required'],
      min: [0, 'Tax rate cannot be negative'],
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    description: {
      type: String,
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tax', taxSchema);


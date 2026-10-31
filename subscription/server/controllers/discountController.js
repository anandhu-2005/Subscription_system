const Discount = require('../models/Discount');

// @desc    Get all discounts
// @route   GET /api/discounts
// @access  Authenticated
exports.getDiscounts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    const discounts = await Discount.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: discounts.length, discounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate a discount code against a subtotal and item quantity
// @route   POST /api/discounts/validate
// @access  Authenticated
exports.validateDiscount = async (req, res) => {
  try {
    const { code, subtotal = 0, quantity = 0 } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Discount code is required' });
    }

    const discount = await Discount.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
    });

    if (!discount) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid or inactive discount code',
      });
    }

    const validity = discount.isValid(Number(subtotal), Number(quantity));
    if (!validity.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: validity.reason,
      });
    }

    let calculatedDiscount = 0;
    if (discount.type === 'percentage') {
      calculatedDiscount = (Number(subtotal) * discount.value) / 100;
    } else {
      calculatedDiscount = Math.min(discount.value, Number(subtotal));
    }
    calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;

    res.status(200).json({
      success: true,
      valid: true,
      discount: {
        id: discount._id,
        code: discount.code,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        calculatedAmount: calculatedDiscount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a discount
// @route   POST /api/discounts
// @access  Admin
exports.createDiscount = async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      value,
      minPurchaseAmount,
      minQuantity,
      startDate,
      endDate,
      usageLimit,
      isActive,
    } = req.body;

    if (!name || !code || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, unique code, and value are required',
      });
    }

    const existing = await Discount.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A discount with this code already exists',
      });
    }

    const discount = await Discount.create({
      name,
      code: code.toUpperCase().trim(),
      type: type || 'percentage',
      value: Number(value),
      minPurchaseAmount: Number(minPurchaseAmount || 0),
      minQuantity: Number(minQuantity || 0),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      usageLimit: usageLimit !== undefined && usageLimit !== '' ? Number(usageLimit) : null,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: 'Discount created successfully',
      discount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a discount
// @route   PUT /api/discounts/:id
// @access  Admin
exports.updateDiscount = async (req, res) => {
  try {
    const discount = await Discount.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }
    res.status(200).json({ success: true, message: 'Discount updated successfully', discount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a discount
// @route   DELETE /api/discounts/:id
// @access  Admin
exports.deleteDiscount = async (req, res) => {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }
    res.status(200).json({ success: true, message: 'Discount deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


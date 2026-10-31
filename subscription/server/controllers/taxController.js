const Tax = require('../models/Tax');

// @desc    Get all taxes
// @route   GET /api/taxes
// @access  Authenticated
exports.getTaxes = async (req, res) => {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    const taxes = await Tax.find(filter).sort({ rate: 1 });
    res.status(200).json({ success: true, count: taxes.length, taxes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a tax rate
// @route   POST /api/taxes
// @access  Admin
exports.createTax = async (req, res) => {
  try {
    const { name, rate, type, description, isDefault, isActive } = req.body;
    if (!name || rate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Tax name and rate are required',
      });
    }

    const tax = await Tax.create({
      name,
      rate: Number(rate),
      type: type || 'percentage',
      description: description || '',
      isDefault: Boolean(isDefault),
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ success: true, message: 'Tax created successfully', tax });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a tax rate
// @route   PUT /api/taxes/:id
// @access  Admin
exports.updateTax = async (req, res) => {
  try {
    const tax = await Tax.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!tax) {
      return res.status(404).json({ success: false, message: 'Tax not found' });
    }
    res.status(200).json({ success: true, message: 'Tax updated successfully', tax });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a tax rate
// @route   DELETE /api/taxes/:id
// @access  Admin
exports.deleteTax = async (req, res) => {
  try {
    const tax = await Tax.findByIdAndDelete(req.params.id);
    if (!tax) {
      return res.status(404).json({ success: false, message: 'Tax not found' });
    }
    res.status(200).json({ success: true, message: 'Tax deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


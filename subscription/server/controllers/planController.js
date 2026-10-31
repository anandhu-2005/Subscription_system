const Plan = require('../models/Plan');

// @desc    Get all plans
// @route   GET /api/plans
// @access  Authenticated
exports.getPlans = async (req, res) => {
  try {
    const { cycle, activeOnly } = req.query;
    const filter = {};

    if (activeOnly === 'true' || req.user.role === 'customer') {
      filter.isActive = true;
    } else if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    if (cycle) filter.billingCycle = cycle;

    const plans = await Plan.find(filter).sort({ price: 1 });
    res.status(200).json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single plan by ID
// @route   GET /api/plans/:id
// @access  Authenticated
exports.getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.status(200).json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a plan
// @route   POST /api/plans
// @access  Admin
exports.createPlan = async (req, res) => {
  try {
    const {
      name,
      code,
      billingCycle,
      intervalCount,
      price,
      currency,
      minQuantity,
      trialDays,
      availableFrom,
      availableTo,
      description,
      features,
      allowPause,
      allowRenewal,
      isActive,
    } = req.body;

    if (!name || price === undefined || !billingCycle) {
      return res.status(400).json({
        success: false,
        message: 'Plan name, price, and billing cycle are required',
      });
    }

    const plan = await Plan.create({
      name,
      code: code ? code.toUpperCase() : `PLN-${billingCycle.slice(0, 1).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      billingCycle,
      intervalCount: Number(intervalCount || 1),
      price: Number(price),
      currency: currency || 'USD',
      minQuantity: Number(minQuantity || 1),
      trialDays: Number(trialDays || 0),
      availableFrom: availableFrom ? new Date(availableFrom) : new Date(),
      availableTo: availableTo ? new Date(availableTo) : null,
      description: description || '',
      features: features || [],
      allowPause: allowPause !== undefined ? allowPause : true,
      allowRenewal: allowRenewal !== undefined ? allowRenewal : true,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      plan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a plan
// @route   PUT /api/plans/:id
// @access  Admin
exports.updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      plan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a plan
// @route   DELETE /api/plans/:id
// @access  Admin
exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


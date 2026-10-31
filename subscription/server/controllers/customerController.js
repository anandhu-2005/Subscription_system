const Customer = require('../models/Customer');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Admin, Staff
exports.getCustomers = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(filter).sort({ createdAt: -1 });

    // Attach subscription & invoice counts for convenience
    const customerIds = customers.map((c) => c._id);
    const subscriptionCounts = await Subscription.aggregate([
      { $match: { customer: { $in: customerIds }, status: 'active' } },
      { $group: { _id: '$customer', count: { $sum: 1 } } },
    ]);

    const subCountMap = {};
    subscriptionCounts.forEach((s) => {
      subCountMap[s._id.toString()] = s.count;
    });

    const enrichedCustomers = customers.map((c) => ({
      ...c.toObject(),
      activeSubscriptionsCount: subCountMap[c._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      count: customers.length,
      customers: enrichedCustomers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single customer by ID
// @route   GET /api/customers/:id
// @access  Admin, Staff, or Customer if their own
exports.getCustomerById = async (req, res) => {
  try {
    // If customer role, only allow access to their own customer profile
    if (req.user.role === 'customer' && req.user.customerId?.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own customer details',
      });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const subscriptions = await Subscription.find({ customer: customer._id })
      .populate('plan')
      .populate('items.product')
      .sort({ createdAt: -1 });

    const invoices = await Invoice.find({ customer: customer._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      customer,
      subscriptions,
      invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Admin, Staff
exports.createCustomer = async (req, res) => {
  try {
    const { name, email, company, phone, taxId, paymentTerms, billingAddress, notes } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and email are required',
      });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A customer with this email already exists',
      });
    }

    const customer = await Customer.create({
      name,
      email: email.toLowerCase().trim(),
      company: company || '',
      phone: phone || '',
      taxId: taxId || '',
      paymentTerms: paymentTerms || 'immediate',
      billingAddress: billingAddress || {},
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Admin, Staff
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Admin
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


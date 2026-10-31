const Invoice = require('../models/Invoice');
const Subscription = require('../models/Subscription');
const { runBillingEngine } = require('../services/billingEngine');

// @desc    Get all invoices (Role-aware)
// @route   GET /api/invoices
// @access  Authenticated
exports.getInvoices = async (req, res) => {
  try {
    const { status, customerId, search } = req.query;
    const filter = {};

    if (req.user.role === 'customer') {
      if (!req.user.customerId) {
        return res.status(200).json({ success: true, count: 0, invoices: [] });
      }
      filter.customer = req.user.customerId;
    } else if (customerId) {
      filter.customer = customerId;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.company': { $regex: search, $options: 'i' } },
      ];
    }

    const invoices = await Invoice.find(filter)
      .populate('customer', 'name email company')
      .populate('subscription', 'subscriptionNumber billingCycle')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Authenticated
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('subscription');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (
      req.user.role === 'customer' &&
      invoice.customer._id.toString() !== req.user.customerId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this invoice',
      });
    }

    res.status(200).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Trigger automated billing engine run
// @route   POST /api/invoices/run-billing
// @access  Admin, Staff
exports.triggerBillingEngine = async (req, res) => {
  try {
    const { asOfDate } = req.body;
    const results = await runBillingEngine({ asOfDate });

    res.status(200).json({
      success: true,
      message: `Billing engine executed successfully. Generated ${results.generatedCount} invoice(s), skipped ${results.skippedCount}.`,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update invoice status (e.g. draft -> confirmed)
// @route   PATCH /api/invoices/:id/status
// @access  Admin, Staff
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['draft', 'confirmed', 'void'];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(', ')}`,
      });
    }

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({
      success: true,
      message: `Invoice status updated to ${status}`,
      invoice,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


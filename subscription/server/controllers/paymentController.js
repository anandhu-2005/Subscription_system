const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Subscription = require('../models/Subscription');

const generatePaymentNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Payment.countDocuments();
  return `PAY-${year}-${String(count + 1).padStart(5, '0')}`;
};

// @desc    Get payments (Role-aware)
// @route   GET /api/payments
// @access  Authenticated
exports.getPayments = async (req, res) => {
  try {
    const { invoiceId, customerId } = req.query;
    const filter = {};

    if (req.user.role === 'customer') {
      if (!req.user.customerId) {
        return res.status(200).json({ success: true, count: 0, payments: [] });
      }
      filter.customer = req.user.customerId;
    } else if (customerId) {
      filter.customer = customerId;
    }

    if (invoiceId) filter.invoice = invoiceId;

    const payments = await Payment.find(filter)
      .populate('invoice', 'invoiceNumber totalAmount balanceDue status')
      .populate('customer', 'name email company')
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record a new payment for an invoice
// @route   POST /api/payments
// @access  Authenticated (Customer can pay their invoice, Admin/Staff can record payments)
exports.recordPayment = async (req, res) => {
  try {
    const {
      invoiceId,
      amount,
      paymentMethod = 'credit_card',
      transactionReference = '',
      notes = '',
    } = req.body;

    if (!invoiceId || amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid invoiceId and positive amount are required',
      });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Customer security check
    if (
      req.user.role === 'customer' &&
      invoice.customer.toString() !== req.user.customerId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only pay for your own invoices',
      });
    }

    const payAmount = Number(amount);
    if (payAmount > invoice.balanceDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount ($${payAmount}) exceeds balance due ($${invoice.balanceDue})`,
      });
    }

    const paymentNumber = await generatePaymentNumber();
    const payment = await Payment.create({
      paymentNumber,
      invoice: invoice._id,
      subscription: invoice.subscription,
      customer: invoice.customer,
      amount: payAmount,
      paymentMethod,
      transactionReference: transactionReference || `TXN-${Date.now().toString().slice(-8)}`,
      paymentDate: new Date(),
      status: 'success',
      notes,
      processedBy: req.user._id,
    });

    // Update invoice balance and status
    invoice.amountPaid = Math.round((invoice.amountPaid + payAmount) * 100) / 100;
    invoice.balanceDue = Math.max(0, Math.round((invoice.totalAmount - invoice.amountPaid) * 100) / 100);

    if (invoice.balanceDue === 0) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'partially_paid';
    }

    await invoice.save();

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      payment,
      invoice: {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        amountPaid: invoice.amountPaid,
        balanceDue: invoice.balanceDue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


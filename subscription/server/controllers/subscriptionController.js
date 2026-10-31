const Subscription = require('../models/Subscription');
const Customer = require('../models/Customer');
const Plan = require('../models/Plan');
const Product = require('../models/Product');
const Tax = require('../models/Tax');
const Discount = require('../models/Discount');
const { calculateNextBillingDate, generateInvoiceForSubscription } = require('../services/billingEngine');

const generateSubscriptionNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Subscription.countDocuments();
  return `SUB-${year}-${String(count + 1).padStart(4, '0')}`;
};

// @desc    Get subscriptions (Role-aware)
// @route   GET /api/subscriptions
// @access  Authenticated
exports.getSubscriptions = async (req, res) => {
  try {
    const { status, customerId, search } = req.query;
    const filter = {};

    // Customer can only see their own subscriptions
    if (req.user.role === 'customer') {
      if (!req.user.customerId) {
        return res.status(200).json({ success: true, count: 0, subscriptions: [] });
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
        { subscriptionNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const subscriptions = await Subscription.find(filter)
      .populate('customer', 'name email company phone')
      .populate('plan', 'name billingCycle price intervalCount')
      .populate('items.product', 'name code salesPrice')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      subscriptions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get subscription by ID
// @route   GET /api/subscriptions/:id
// @access  Authenticated
exports.getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('customer')
      .populate('plan')
      .populate('items.product')
      .populate('taxes.tax')
      .populate('discounts.discount');

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    // Role security check
    if (
      req.user.role === 'customer' &&
      subscription.customer._id.toString() !== req.user.customerId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this subscription',
      });
    }

    res.status(200).json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new subscription
// @route   POST /api/subscriptions
// @access  Admin, Staff
exports.createSubscription = async (req, res) => {
  try {
    const {
      customerId,
      planId,
      items = [],
      taxIds = [],
      discountCodes = [],
      paymentTerms = 'immediate',
      startDate = new Date(),
      expiryDate = null,
      autoRenew = true,
      notes = '',
      status = 'draft',
    } = req.body;

    if (!customerId || !planId) {
      return res.status(400).json({
        success: false,
        message: 'Customer and Plan are required',
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Process line items
    let productsSubtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      let unitPrice = product.salesPrice;
      let variantData = { groupName: '', optionName: '', priceAdjustment: 0 };

      if (item.variant && item.variant.optionName) {
        variantData = {
          groupName: item.variant.groupName || 'Variant',
          optionName: item.variant.optionName,
          priceAdjustment: Number(item.variant.priceAdjustment || 0),
        };
        unitPrice += variantData.priceAdjustment;
      }

      const quantity = Math.max(1, Number(item.quantity || 1));
      const lineSubtotal = Math.round(unitPrice * quantity * 100) / 100;
      productsSubtotal += lineSubtotal;

      processedItems.push({
        product: product._id,
        productName: product.name,
        variant: variantData,
        quantity,
        unitPrice,
        subtotal: lineSubtotal,
      });
    }

    const planPrice = plan.price || 0;
    const subtotal = Math.round((planPrice + productsSubtotal) * 100) / 100;

    // Process discounts
    let discountTotal = 0;
    const processedDiscounts = [];

    if (discountCodes && discountCodes.length > 0) {
      for (const code of discountCodes) {
        const discount = await Discount.findOne({
          code: code.toUpperCase().trim(),
          isActive: true,
        });

        if (discount) {
          const validity = discount.isValid(subtotal, processedItems.length);
          if (validity.valid) {
            let discAmount = 0;
            if (discount.type === 'percentage') {
              discAmount = (subtotal * discount.value) / 100;
            } else {
              discAmount = Math.min(discount.value, subtotal);
            }
            discAmount = Math.round(discAmount * 100) / 100;
            discountTotal += discAmount;

            processedDiscounts.push({
              discount: discount._id,
              code: discount.code,
              type: discount.type,
              value: discount.value,
              amount: discAmount,
            });
          }
        }
      }
    }

    const taxableAmount = Math.max(0, subtotal - discountTotal);

    // Process taxes
    let taxTotal = 0;
    const processedTaxes = [];

    if (taxIds && taxIds.length > 0) {
      const taxes = await Tax.find({ _id: { $in: taxIds }, isActive: true });
      for (const t of taxes) {
        const taxAmount = Math.round(((taxableAmount * t.rate) / 100) * 100) / 100;
        taxTotal += taxAmount;
        processedTaxes.push({
          tax: t._id,
          name: t.name,
          rate: t.rate,
          amount: taxAmount,
        });
      }
    }

    const totalAmount = Math.round((taxableAmount + taxTotal) * 100) / 100;
    const subscriptionNumber = await generateSubscriptionNumber();

    const start = new Date(startDate);
    const nextBilling = start;

    const subscription = await Subscription.create({
      subscriptionNumber,
      customer: customer._id,
      plan: plan._id,
      items: processedItems,
      planPrice,
      productsSubtotal,
      subtotal,
      taxes: processedTaxes,
      taxTotal,
      discounts: processedDiscounts,
      discountTotal,
      totalAmount,
      billingCycle: plan.billingCycle,
      paymentTerms: paymentTerms || customer.paymentTerms || 'immediate',
      startDate: start,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      nextBillingDate: nextBilling,
      status: status || 'draft',
      autoRenew,
      notes,
      createdBy: req.user._id,
    });

    const populatedSub = await Subscription.findById(subscription._id)
      .populate('customer', 'name email company')
      .populate('plan', 'name billingCycle price');

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription: populatedSub,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update subscription status (Workflow transitions)
// @route   PATCH /api/subscriptions/:id/status
// @access  Admin, Staff
exports.updateSubscriptionStatus = async (req, res) => {
  try {
    const { action, reason } = req.body;
    const subscription = await Subscription.findById(req.params.id)
      .populate('customer')
      .populate('plan')
      .populate('items.product');

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const validTransitions = {
      send_quotation: { from: ['draft'], to: 'quotation' },
      confirm: { from: ['draft', 'quotation'], to: 'confirmed' },
      activate: { from: ['draft', 'quotation', 'confirmed', 'paused'], to: 'active' },
      pause: { from: ['active'], to: 'paused' },
      resume: { from: ['paused'], to: 'active' },
      close: { from: ['draft', 'quotation', 'confirmed', 'active', 'paused'], to: 'closed' },
      renew: { from: ['closed', 'active'], to: 'active' },
    };

    const transition = validTransitions[action];
    if (!transition) {
      return res.status(400).json({
        success: false,
        message: `Invalid action '${action}'. Valid actions are: ${Object.keys(validTransitions).join(', ')}`,
      });
    }

    if (!transition.from.includes(subscription.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${subscription.status}' with action '${action}'. Expected one of: ${transition.from.join(', ')}`,
      });
    }

    subscription.status = transition.to;

    if (action === 'activate' || action === 'resume') {
      subscription.pausedAt = null;
      if (!subscription.nextBillingDate || subscription.nextBillingDate < new Date()) {
        subscription.nextBillingDate = new Date();
      }
    } else if (action === 'pause') {
      subscription.pausedAt = new Date();
    } else if (action === 'close') {
      subscription.closedAt = new Date();
      subscription.closeReason = reason || 'Closed by user';
    } else if (action === 'renew') {
      subscription.closedAt = null;
      subscription.closeReason = '';
      subscription.nextBillingDate = new Date();
    }

    await subscription.save();

    res.status(200).json({
      success: true,
      message: `Subscription status updated to '${subscription.status}'`,
      subscription,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate an invoice immediately for a subscription
// @route   POST /api/subscriptions/:id/generate-invoice
// @access  Admin, Staff
exports.triggerInvoiceGeneration = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('customer')
      .populate('plan')
      .populate('items.product');

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const result = await generateInvoiceForSubscription(subscription, {
      force: req.body.force || false,
      generationType: 'manual',
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.reason || 'Could not generate invoice',
        existingInvoice: result.invoice,
      });
    }

    res.status(201).json({
      success: true,
      message: `Invoice ${result.invoice.invoiceNumber} generated successfully`,
      invoice: result.invoice,
      subscription: result.subscription,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a subscription
// @route   DELETE /api/subscriptions/:id
// @access  Admin
exports.deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    res.status(200).json({ success: true, message: 'Subscription deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


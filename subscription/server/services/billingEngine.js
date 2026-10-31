const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Discount = require('../models/Discount');

/**
 * Calculate the next billing date based on cycle and interval
 */
const calculateNextBillingDate = (startDate, cycle, intervalCount = 1) => {
  const next = new Date(startDate);
  switch (cycle) {
    case 'daily':
      next.setDate(next.getDate() + intervalCount);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7 * intervalCount);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + intervalCount);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + intervalCount);
      break;
    default:
      next.setMonth(next.getMonth() + intervalCount);
  }
  return next;
};

/**
 * Calculate invoice due date based on payment terms
 */
const calculateDueDate = (issueDate, paymentTerms) => {
  const due = new Date(issueDate);
  switch (paymentTerms) {
    case 'net15':
      due.setDate(due.getDate() + 15);
      break;
    case 'net30':
      due.setDate(due.getDate() + 30);
      break;
    case 'net60':
      due.setDate(due.getDate() + 60);
      break;
    case 'immediate':
    default:
      // Due on receipt / same day
      break;
  }
  return due;
};

/**
 * Generate a unique sequential invoice number
 */
const generateInvoiceNumber = async () => {
  const currentYear = new Date().getFullYear();
  const count = await Invoice.countDocuments();
  return `INV-${currentYear}-${String(count + 1).padStart(5, '0')}`;
};

/**
 * Generate invoice for a specific active subscription
 */
const generateInvoiceForSubscription = async (subscription, options = {}) => {
  // Ensure subscription is populated or fetch it
  let sub = subscription;
  if (!sub.populated || !sub.customer || !sub.customer.name) {
    sub = await Subscription.findById(sub._id || sub)
      .populate('customer')
      .populate('plan')
      .populate('items.product');
  }

  if (!sub) {
    throw new Error('Subscription not found');
  }

  if (sub.status !== 'active') {
    return {
      success: false,
      skipped: true,
      reason: `Subscription ${sub.subscriptionNumber} is not active (current status: ${sub.status})`,
    };
  }

  const periodStart = new Date(sub.nextBillingDate || sub.startDate);
  const periodEnd = calculateNextBillingDate(periodStart, sub.billingCycle || 'monthly');

  // Prevent duplicate invoices: check if an invoice already exists for this subscription & period
  const existingInvoice = await Invoice.findOne({
    subscription: sub._id,
    billingPeriodStart: {
      $gte: new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate()),
      $lt: new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate() + 1),
    },
  });

  if (existingInvoice && !options.force) {
    return {
      success: false,
      skipped: true,
      reason: `Invoice ${existingInvoice.invoiceNumber} already exists for subscription ${sub.subscriptionNumber} for billing date ${periodStart.toISOString().split('T')[0]}`,
      invoice: existingInvoice,
    };
  }

  // Construct invoice line items
  const items = [];

  // Base plan charge if any
  if (sub.planPrice > 0) {
    const planName = sub.plan?.name || 'Subscription Plan';
    items.push({
      title: `${planName} (${sub.billingCycle} cycle)`,
      description: `Recurring base fee for ${planName}`,
      product: null,
      quantity: 1,
      unitPrice: sub.planPrice,
      subtotal: sub.planPrice,
    });
  }

  // Subscription product line items
  if (sub.items && sub.items.length > 0) {
    for (const item of sub.items) {
      let variantLabel = '';
      if (item.variant && item.variant.optionName) {
        variantLabel = ` - ${item.variant.groupName ? item.variant.groupName + ': ' : ''}${item.variant.optionName}`;
      }
      items.push({
        title: `${item.productName}${variantLabel}`,
        description: `Product subscription line item`,
        product: item.product?._id || item.product,
        variant: item.variant,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      });
    }
  }

  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);

  // Calculate discounts
  let discountTotal = 0;
  const appliedDiscounts = [];

  if (sub.discounts && sub.discounts.length > 0) {
    for (const disc of sub.discounts) {
      let discountAmount = 0;
      if (disc.type === 'percentage') {
        discountAmount = (subtotal * disc.value) / 100;
      } else {
        discountAmount = Math.min(disc.value, subtotal);
      }
      discountTotal += discountAmount;
      appliedDiscounts.push({
        code: disc.code,
        type: disc.type,
        value: disc.value,
        amount: Math.round(discountAmount * 100) / 100,
      });

      // Increment timesUsed on Discount model if ref present
      if (disc.discount) {
        await Discount.findByIdAndUpdate(disc.discount, { $inc: { timesUsed: 1 } });
      }
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountTotal);

  // Calculate taxes
  let taxTotal = 0;
  const appliedTaxes = [];

  if (sub.taxes && sub.taxes.length > 0) {
    for (const tax of sub.taxes) {
      const taxAmount = (taxableAmount * tax.rate) / 100;
      taxTotal += taxAmount;
      appliedTaxes.push({
        name: tax.name,
        rate: tax.rate,
        amount: Math.round(taxAmount * 100) / 100,
      });
    }
  }

  const totalAmount = Math.round((taxableAmount + taxTotal) * 100) / 100;
  const issueDate = options.issueDate || new Date();
  const dueDate = calculateDueDate(issueDate, sub.paymentTerms);
  const invoiceNumber = await generateInvoiceNumber();

  // Snapshot customer info for permanent record
  const customerSnapshot = {
    name: sub.customer?.name || 'Customer',
    email: sub.customer?.email || '',
    company: sub.customer?.company || '',
    phone: sub.customer?.phone || '',
    billingAddress: sub.customer?.billingAddress || {},
    taxId: sub.customer?.taxId || '',
  };

  const invoice = new Invoice({
    invoiceNumber,
    subscription: sub._id,
    customer: sub.customer?._id || sub.customer,
    customerSnapshot,
    billingPeriodStart: periodStart,
    billingPeriodEnd: periodEnd,
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    taxes: appliedTaxes,
    taxTotal: Math.round(taxTotal * 100) / 100,
    discounts: appliedDiscounts,
    discountTotal: Math.round(discountTotal * 100) / 100,
    totalAmount,
    amountPaid: 0,
    balanceDue: totalAmount,
    issueDate,
    dueDate,
    status: options.initialStatus || 'confirmed', // Confirmed and ready for payment
    paymentTerms: sub.paymentTerms || 'immediate',
    generationType: options.generationType || 'automated',
    notes: `Invoice automatically generated for subscription ${sub.subscriptionNumber}.`,
  });

  await invoice.save();

  // Update subscription billing dates
  sub.lastBilledDate = periodStart;
  sub.nextBillingDate = periodEnd;

  // Check if subscription has expired
  if (sub.expiryDate && periodEnd > sub.expiryDate) {
    if (!sub.autoRenew) {
      sub.status = 'closed';
      sub.closedAt = new Date();
      sub.closeReason = 'Subscription reached expiry date without auto-renewal';
    }
  }

  await sub.save();

  return {
    success: true,
    invoice,
    subscription: sub,
  };
};

/**
 * Run automated billing for all due subscriptions
 */
const runBillingEngine = async (options = {}) => {
  const today = options.asOfDate ? new Date(options.asOfDate) : new Date();
  
  // Set to end of current day to catch all due items today
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  // Find all active subscriptions with nextBillingDate <= today
  const dueSubscriptions = await Subscription.find({
    status: 'active',
    nextBillingDate: { $lte: endOfToday },
  })
    .populate('customer')
    .populate('plan')
    .populate('items.product');

  const results = {
    executedAt: new Date(),
    totalEvaluated: dueSubscriptions.length,
    generatedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    invoices: [],
    skippedDetails: [],
    errors: [],
  };

  for (const sub of dueSubscriptions) {
    try {
      const res = await generateInvoiceForSubscription(sub, {
        generationType: 'automated',
        issueDate: today,
      });

      if (res.success) {
        results.generatedCount += 1;
        results.invoices.push({
          invoiceNumber: res.invoice.invoiceNumber,
          subscriptionNumber: sub.subscriptionNumber,
          customerName: sub.customer?.name,
          totalAmount: res.invoice.totalAmount,
          dueDate: res.invoice.dueDate,
        });
      } else if (res.skipped) {
        results.skippedCount += 1;
        results.skippedDetails.push({
          subscriptionNumber: sub.subscriptionNumber,
          reason: res.reason,
        });
      }
    } catch (err) {
      results.errorCount += 1;
      results.errors.push({
        subscriptionNumber: sub.subscriptionNumber,
        error: err.message,
      });
    }
  }

  // Also check for unpaid overdue invoices and mark them as overdue
  const overdueInvoices = await Invoice.updateMany(
    {
      status: 'confirmed',
      dueDate: { $lt: today },
      balanceDue: { $gt: 0 },
    },
    {
      $set: { status: 'overdue' },
    }
  );

  results.markedOverdueCount = overdueInvoices.modifiedCount || 0;

  return results;
};

module.exports = {
  calculateNextBillingDate,
  calculateDueDate,
  generateInvoiceNumber,
  generateInvoiceForSubscription,
  runBillingEngine,
};


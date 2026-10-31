const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');

// @desc    Get dashboard metrics & reporting data
// @route   GET /api/dashboard/stats
// @access  Authenticated
exports.getDashboardStats = async (req, res) => {
  try {
    const isCustomer = req.user.role === 'customer';
    const customerFilter = isCustomer && req.user.customerId ? { customer: req.user.customerId } : {};

    // 1. Subscriptions stats
    const activeSubscriptionsCount = await Subscription.countDocuments({
      ...customerFilter,
      status: 'active',
    });

    const allSubscriptions = await Subscription.find(customerFilter).select('status totalAmount billingCycle');
    const subscriptionStatusSummary = {
      draft: 0,
      quotation: 0,
      confirmed: 0,
      active: 0,
      paused: 0,
      closed: 0,
    };

    let calculatedMrr = 0;

    allSubscriptions.forEach((sub) => {
      if (subscriptionStatusSummary[sub.status] !== undefined) {
        subscriptionStatusSummary[sub.status] += 1;
      }
      if (sub.status === 'active') {
        const amt = sub.totalAmount || 0;
        if (sub.billingCycle === 'monthly') calculatedMrr += amt;
        else if (sub.billingCycle === 'yearly') calculatedMrr += amt / 12;
        else if (sub.billingCycle === 'weekly') calculatedMrr += (amt * 52) / 12;
        else if (sub.billingCycle === 'daily') calculatedMrr += amt * 30;
      }
    });

    // 2. Invoices & Revenue stats
    const invoiceMatch = isCustomer && req.user.customerId ? { customer: req.user.customerId } : {};
    const invoiceAgg = await Invoice.aggregate([
      { $match: invoiceMatch },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$amountPaid' },
          totalOutstanding: { $sum: '$balanceDue' },
        },
      },
    ]);

    const totalRevenue = invoiceAgg[0]?.totalPaid || 0;
    const outstandingAmount = invoiceAgg[0]?.totalOutstanding || 0;
    const totalBilled = invoiceAgg[0]?.totalBilled || 0;

    const overdueCount = await Invoice.countDocuments({
      ...customerFilter,
      $or: [
        { status: 'overdue' },
        { status: { $in: ['confirmed', 'partially_paid'] }, dueDate: { $lt: new Date() }, balanceDue: { $gt: 0 } },
      ],
    });

    const pendingInvoicesCount = await Invoice.countDocuments({
      ...customerFilter,
      status: { $in: ['confirmed', 'partially_paid', 'overdue'] },
      balanceDue: { $gt: 0 },
    });

    // 3. Recent Payments
    const recentPayments = await Payment.find(customerFilter)
      .populate('customer', 'name email company')
      .populate('invoice', 'invoiceNumber')
      .sort({ paymentDate: -1 })
      .limit(6);

    // 4. Recent Invoices
    const recentInvoices = await Invoice.find(customerFilter)
      .populate('customer', 'name email company')
      .populate('subscription', 'subscriptionNumber')
      .sort({ createdAt: -1 })
      .limit(6);

    // 5. Monthly Revenue Timeline (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const paymentTrend = await Payment.aggregate([
      {
        $match: {
          ...customerFilter,
          status: 'success',
          paymentDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' },
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timelineLabels = [];
    const timelineData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const label = `${monthNames[m - 1]} ${y}`;
      timelineLabels.push(label);

      const match = paymentTrend.find((p) => p._id.year === y && p._id.month === m);
      timelineData.push(match ? Math.round(match.revenue * 100) / 100 : 0);
    }

    // 6. Total customers count (for admin/staff)
    const totalCustomersCount = isCustomer ? 1 : await Customer.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      stats: {
        activeSubscriptionsCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        outstandingAmount: Math.round(outstandingAmount * 100) / 100,
        overdueInvoicesCount: overdueCount,
        pendingInvoicesCount,
        totalBilled: Math.round(totalBilled * 100) / 100,
        mrr: Math.round(calculatedMrr * 100) / 100,
        arr: Math.round(calculatedMrr * 12 * 100) / 100,
        totalCustomersCount,
        subscriptionStatusSummary,
        revenueTimeline: {
          labels: timelineLabels,
          data: timelineData,
        },
      },
      recentPayments,
      recentInvoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


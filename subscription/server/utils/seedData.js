const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Product = require('../models/Product');
const Plan = require('../models/Plan');
const Customer = require('../models/Customer');
const Tax = require('../models/Tax');
const Discount = require('../models/Discount');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/subscription_system';

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear existing collections
    console.log('Clearing old collections...');
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Plan.deleteMany({}),
      Customer.deleteMany({}),
      Tax.deleteMany({}),
      Discount.deleteMany({}),
      Subscription.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
    ]);

    console.log('Creating standard Taxes...');
    const [taxSales, taxVat, taxGst] = await Tax.create([
      { name: 'Standard Sales Tax (8%)', rate: 8, type: 'percentage', isDefault: true, isActive: true },
      { name: 'VAT (20%)', rate: 20, type: 'percentage', isDefault: false, isActive: true },
      { name: 'GST (18%)', rate: 18, type: 'percentage', isDefault: false, isActive: true },
    ]);

    console.log('Creating Discounts...');
    const [discWelcome, discEnterprise, discHackathon] = await Discount.create([
      {
        name: 'Welcome Hackathon Special',
        code: 'WELCOME20',
        type: 'percentage',
        value: 20,
        minPurchaseAmount: 50,
        usageLimit: 200,
        timesUsed: 12,
        isActive: true,
      },
      {
        name: 'Enterprise VIP Tier Discount',
        code: 'ENTERPRISE100',
        type: 'fixed',
        value: 100,
        minPurchaseAmount: 400,
        usageLimit: 50,
        timesUsed: 5,
        isActive: true,
      },
      {
        name: 'Odoo Partner Promo',
        code: 'ODOO50',
        type: 'percentage',
        value: 50,
        minPurchaseAmount: 100,
        usageLimit: 100,
        timesUsed: 1,
        isActive: true,
      },
    ]);

    console.log('Creating Products...');
    const [prodCloudEngine, prodDedicatedDb, prodSupport, prodStorage] = await Product.create([
      {
        name: 'Cloud Infrastructure Engine',
        code: 'ENG-CLOUD-01',
        type: 'software_license',
        salesPrice: 149,
        costPrice: 40,
        category: 'Compute & Cloud',
        description: 'Scalable cloud container runtime with auto-scaling and health monitoring.',
        variants: [
          {
            name: 'Compute Sizing',
            options: [
              { name: 'Standard (2 vCPU, 8GB RAM)', priceAdjustment: 0 },
              { name: 'Pro (4 vCPU, 16GB RAM)', priceAdjustment: 80 },
              { name: 'Ultra (8 vCPU, 32GB RAM)', priceAdjustment: 180 },
            ],
          },
        ],
        isActive: true,
      },
      {
        name: 'Managed Dedicated Database Cluster',
        code: 'DB-DEDICATED-02',
        type: 'software_license',
        salesPrice: 120,
        costPrice: 35,
        category: 'Database',
        description: 'High-availability PostgreSQL/MongoDB dedicated cluster with automated backups.',
        variants: [
          {
            name: 'High Availability',
            options: [
              { name: 'Single Node (Dev)', priceAdjustment: 0 },
              { name: 'Multi-AZ Replica Cluster', priceAdjustment: 130 },
            ],
          },
        ],
        isActive: true,
      },
      {
        name: '24/7 Enterprise Support & SLA',
        code: 'SRV-SUPP-03',
        type: 'service',
        salesPrice: 99,
        costPrice: 20,
        category: 'Support',
        description: 'Guaranteed 15-minute response time SLA and dedicated solution architect.',
        variants: [],
        isActive: true,
      },
      {
        name: 'High-Performance SSD Storage (100GB)',
        code: 'STG-100GB-04',
        type: 'consumable',
        salesPrice: 25,
        costPrice: 8,
        category: 'Storage',
        description: 'NVMe-backed high IOPS persistent block volume.',
        variants: [],
        isActive: true,
      },
    ]);

    console.log('Creating Subscription Plans...');
    const [planStarter, planPro, planEnterprise] = await Plan.create([
      {
        name: 'Starter Cloud Tier',
        code: 'PLN-M-STARTER',
        billingCycle: 'monthly',
        intervalCount: 1,
        price: 49,
        currency: 'USD',
        minQuantity: 1,
        trialDays: 14,
        description: 'Ideal for early-stage startups and small development teams.',
        features: ['Up to 3 team members', 'Standard compute nodes', 'Community support', 'Basic analytics'],
        allowPause: true,
        allowRenewal: true,
        isActive: true,
      },
      {
        name: 'Professional Business Tier',
        code: 'PLN-M-PRO',
        billingCycle: 'monthly',
        intervalCount: 1,
        price: 199,
        currency: 'USD',
        minQuantity: 1,
        trialDays: 0,
        description: 'Comprehensive package for growing organizations with mission-critical applications.',
        features: ['Unlimited team members', 'Auto-scaling infrastructure', 'Priority 24/7 SLA', 'Automated daily backups', 'Custom domains'],
        allowPause: true,
        allowRenewal: true,
        isActive: true,
      },
      {
        name: 'Enterprise Scale Tier',
        code: 'PLN-Y-ENTERPRISE',
        billingCycle: 'yearly',
        intervalCount: 1,
        price: 1999,
        currency: 'USD',
        minQuantity: 1,
        trialDays: 0,
        description: 'Complete unified platform with dedicated infrastructure and compliance certifications.',
        features: ['Multi-region deployment', 'Dedicated Solution Engineer', 'Custom SLAs & SSO (SAML/Okta)', 'SOC2 Type II compliance pack', 'Zero rate limits'],
        allowPause: true,
        allowRenewal: true,
        isActive: true,
      },
    ]);

    console.log('Creating Customers...');
    const [custNexus, custApex, custQuantum, custHorizon] = await Customer.create([
      {
        name: 'Sarah Chen',
        email: 'sarah.chen@nexusai.com',
        company: 'Nexus AI Solutions Inc.',
        phone: '+1 (555) 234-5678',
        taxId: 'US-EIN-94827104',
        paymentTerms: 'net30',
        billingAddress: {
          street: '100 Innovation Way, Suite 400',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94107',
          country: 'USA',
        },
        notes: 'High-growth AI startup looking to expand clusters.',
        isActive: true,
      },
      {
        name: 'Marcus Vance',
        email: 'marcus.vance@apexcloud.io',
        company: 'Apex Cloud Technologies',
        phone: '+1 (555) 876-5432',
        taxId: 'US-EIN-88392019',
        paymentTerms: 'immediate',
        billingAddress: {
          street: '55 Technology Blvd',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'USA',
        },
        notes: 'Enterprise client with regular multi-tier subscriptions.',
        isActive: true,
      },
      {
        name: 'Elena Rostova',
        email: 'elena.rostova@quantumlabs.org',
        company: 'Quantum Leap Labs',
        phone: '+1 (555) 345-9876',
        taxId: 'US-EIN-77291034',
        paymentTerms: 'net15',
        billingAddress: {
          street: '12 Cambridge Research Park',
          city: 'Boston',
          state: 'MA',
          postalCode: '02142',
          country: 'USA',
        },
        notes: 'Research institute requiring dedicated hardware.',
        isActive: true,
      },
      {
        name: 'David Kim',
        email: 'david.kim@horizonmedia.com',
        company: 'Horizon Media Global',
        phone: '+1 (555) 654-3210',
        taxId: 'US-EIN-66281920',
        paymentTerms: 'immediate',
        billingAddress: {
          street: '750 Broadway, 12th Floor',
          city: 'New York',
          state: 'NY',
          postalCode: '10003',
          country: 'USA',
        },
        notes: 'Media streaming platform with large storage needs.',
        isActive: true,
      },
    ]);

    console.log('Creating User Accounts...');
    const adminUser = await User.create({
      name: 'Alexander Wright',
      email: 'admin@subflow.io',
      password: 'Admin@12345',
      role: 'admin',
      phone: '+1 (555) 000-0001',
    });

    const staffUser = await User.create({
      name: 'Jessica Reynolds',
      email: 'staff@subflow.io',
      password: 'Staff@12345',
      role: 'staff',
      phone: '+1 (555) 000-0002',
    });

    const customerUser1 = await User.create({
      name: 'Sarah Chen',
      email: 'sarah.chen@nexusai.com',
      password: 'Customer@12345',
      role: 'customer',
      customerId: custNexus._id,
      phone: '+1 (555) 234-5678',
    });

    const customerUser2 = await User.create({
      name: 'Marcus Vance',
      email: 'marcus.vance@apexcloud.io',
      password: 'Customer@12345',
      role: 'customer',
      customerId: custApex._id,
      phone: '+1 (555) 876-5432',
    });

    await Customer.findByIdAndUpdate(custNexus._id, { userId: customerUser1._id });
    await Customer.findByIdAndUpdate(custApex._id, { userId: customerUser2._id });

    console.log('Creating Subscriptions...');
    // 1. Apex Cloud - Active subscription (already billed and paid in past months)
    const subApex = await Subscription.create({
      subscriptionNumber: 'SUB-2026-0001',
      customer: custApex._id,
      plan: planPro._id,
      items: [
        {
          product: prodCloudEngine._id,
          productName: prodCloudEngine.name,
          variant: { groupName: 'Compute Sizing', optionName: 'Pro (4 vCPU, 16GB RAM)', priceAdjustment: 80 },
          quantity: 2,
          unitPrice: 229, // 149 + 80
          subtotal: 458,
        },
        {
          product: prodDedicatedDb._id,
          productName: prodDedicatedDb.name,
          variant: { groupName: 'High Availability', optionName: 'Multi-AZ Replica Cluster', priceAdjustment: 130 },
          quantity: 1,
          unitPrice: 250, // 120 + 130
          subtotal: 250,
        },
      ],
      planPrice: 199,
      productsSubtotal: 708,
      subtotal: 907,
      taxes: [{ tax: taxSales._id, name: taxSales.name, rate: 8, amount: 72.56 }],
      taxTotal: 72.56,
      discounts: [{ discount: discWelcome._id, code: 'WELCOME20', type: 'percentage', value: 20, amount: 181.4 }],
      discountTotal: 181.4,
      totalAmount: 798.16,
      billingCycle: 'monthly',
      paymentTerms: 'immediate',
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // In 15 days
      lastBilledDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      status: 'active',
      autoRenew: true,
      notes: 'Monthly enterprise tier with compute and multi-AZ database.',
      createdBy: adminUser._id,
    });

    // 2. Nexus AI - Active subscription due TODAY (perfect for testing Automated Billing Engine!)
    const subNexus = await Subscription.create({
      subscriptionNumber: 'SUB-2026-0002',
      customer: custNexus._id,
      plan: planPro._id,
      items: [
        {
          product: prodCloudEngine._id,
          productName: prodCloudEngine.name,
          variant: { groupName: 'Compute Sizing', optionName: 'Ultra (8 vCPU, 32GB RAM)', priceAdjustment: 180 },
          quantity: 1,
          unitPrice: 329,
          subtotal: 329,
        },
        {
          product: prodSupport._id,
          productName: prodSupport.name,
          variant: { groupName: '', optionName: '', priceAdjustment: 0 },
          quantity: 1,
          unitPrice: 99,
          subtotal: 99,
        },
      ],
      planPrice: 199,
      productsSubtotal: 428,
      subtotal: 627,
      taxes: [{ tax: taxSales._id, name: taxSales.name, rate: 8, amount: 50.16 }],
      taxTotal: 50.16,
      discounts: [],
      discountTotal: 0,
      totalAmount: 677.16,
      billingCycle: 'monthly',
      paymentTerms: 'net30',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      nextBillingDate: new Date(), // DUE TODAY! Ready to be picked up by automated billing!
      lastBilledDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      status: 'active',
      autoRenew: true,
      notes: 'High-compute AI workload subscription.',
      createdBy: adminUser._id,
    });

    // 3. Quantum Leap Labs - Quotation stage
    const subQuantum = await Subscription.create({
      subscriptionNumber: 'SUB-2026-0003',
      customer: custQuantum._id,
      plan: planEnterprise._id,
      items: [
        {
          product: prodStorage._id,
          productName: prodStorage.name,
          variant: { groupName: '', optionName: '', priceAdjustment: 0 },
          quantity: 10,
          unitPrice: 25,
          subtotal: 250,
        },
      ],
      planPrice: 1999,
      productsSubtotal: 250,
      subtotal: 2249,
      taxes: [{ tax: taxSales._id, name: taxSales.name, rate: 8, amount: 171.92 }],
      taxTotal: 171.92,
      discounts: [{ discount: discEnterprise._id, code: 'ENTERPRISE100', type: 'fixed', value: 100, amount: 100 }],
      discountTotal: 100,
      totalAmount: 2320.92,
      billingCycle: 'yearly',
      paymentTerms: 'net15',
      startDate: new Date(),
      nextBillingDate: new Date(),
      status: 'quotation',
      autoRenew: true,
      notes: 'Enterprise annual quote pending customer review.',
      createdBy: staffUser._id,
    });

    // 4. Horizon Media - Draft stage
    const subHorizon = await Subscription.create({
      subscriptionNumber: 'SUB-2026-0004',
      customer: custHorizon._id,
      plan: planStarter._id,
      items: [
        {
          product: prodStorage._id,
          productName: prodStorage.name,
          variant: { groupName: '', optionName: '', priceAdjustment: 0 },
          quantity: 4,
          unitPrice: 25,
          subtotal: 100,
        },
      ],
      planPrice: 49,
      productsSubtotal: 100,
      subtotal: 149,
      taxes: [{ tax: taxSales._id, name: taxSales.name, rate: 8, amount: 11.92 }],
      taxTotal: 11.92,
      discounts: [],
      discountTotal: 0,
      totalAmount: 160.92,
      billingCycle: 'monthly',
      paymentTerms: 'immediate',
      startDate: new Date(),
      nextBillingDate: new Date(),
      status: 'draft',
      autoRenew: true,
      notes: 'Draft subscription for video storage backup.',
      createdBy: staffUser._id,
    });

    console.log('Creating Historical Invoices & Payments for Analytics...');
    // Historical Invoice 1 - Apex Cloud (2 months ago - PAID)
    const inv1 = await Invoice.create({
      invoiceNumber: 'INV-2026-00001',
      subscription: subApex._id,
      customer: custApex._id,
      customerSnapshot: {
        name: custApex.name,
        email: custApex.email,
        company: custApex.company,
        billingAddress: custApex.billingAddress,
      },
      billingPeriodStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      billingPeriodEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      items: [
        { title: 'Professional Business Tier', unitPrice: 199, quantity: 1, subtotal: 199 },
        { title: 'Cloud Infrastructure Engine - Pro (4 vCPU, 16GB RAM)', unitPrice: 229, quantity: 2, subtotal: 458 },
        { title: 'Managed Dedicated Database Cluster - Multi-AZ', unitPrice: 250, quantity: 1, subtotal: 250 },
      ],
      subtotal: 907,
      taxes: [{ name: 'Standard Sales Tax (8%)', rate: 8, amount: 72.56 }],
      taxTotal: 72.56,
      discounts: [{ code: 'WELCOME20', type: 'percentage', value: 20, amount: 181.4 }],
      discountTotal: 181.4,
      totalAmount: 798.16,
      amountPaid: 798.16,
      balanceDue: 0,
      issueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      status: 'paid',
      paymentTerms: 'immediate',
      generationType: 'automated',
    });

    await Payment.create({
      paymentNumber: 'PAY-2026-00001',
      invoice: inv1._id,
      subscription: subApex._id,
      customer: custApex._id,
      amount: 798.16,
      paymentMethod: 'credit_card',
      transactionReference: 'TXN-STRIPE-98218734',
      paymentDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      status: 'success',
      notes: 'Automatic credit card debit via Stripe gateway.',
      processedBy: adminUser._id,
    });

    // Historical Invoice 2 - Apex Cloud (1 month ago - PAID)
    const inv2 = await Invoice.create({
      invoiceNumber: 'INV-2026-00002',
      subscription: subApex._id,
      customer: custApex._id,
      customerSnapshot: {
        name: custApex.name,
        email: custApex.email,
        company: custApex.company,
        billingAddress: custApex.billingAddress,
      },
      billingPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      billingPeriodEnd: new Date(),
      items: [
        { title: 'Professional Business Tier', unitPrice: 199, quantity: 1, subtotal: 199 },
        { title: 'Cloud Infrastructure Engine - Pro (4 vCPU, 16GB RAM)', unitPrice: 229, quantity: 2, subtotal: 458 },
        { title: 'Managed Dedicated Database Cluster - Multi-AZ', unitPrice: 250, quantity: 1, subtotal: 250 },
      ],
      subtotal: 907,
      taxes: [{ name: 'Standard Sales Tax (8%)', rate: 8, amount: 72.56 }],
      taxTotal: 72.56,
      discounts: [{ code: 'WELCOME20', type: 'percentage', value: 20, amount: 181.4 }],
      discountTotal: 181.4,
      totalAmount: 798.16,
      amountPaid: 798.16,
      balanceDue: 0,
      issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      status: 'paid',
      paymentTerms: 'immediate',
      generationType: 'automated',
    });

    await Payment.create({
      paymentNumber: 'PAY-2026-00002',
      invoice: inv2._id,
      subscription: subApex._id,
      customer: custApex._id,
      amount: 798.16,
      paymentMethod: 'bank_transfer',
      transactionReference: 'ACH-WIRE-00492817',
      paymentDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      status: 'success',
      notes: 'ACH Direct Bank Transfer settled.',
      processedBy: staffUser._id,
    });

    // Outstanding / Confirmed Invoice for Nexus AI (ready for testing payment recording)
    const inv3 = await Invoice.create({
      invoiceNumber: 'INV-2026-00003',
      subscription: subNexus._id,
      customer: custNexus._id,
      customerSnapshot: {
        name: custNexus.name,
        email: custNexus.email,
        company: custNexus.company,
        billingAddress: custNexus.billingAddress,
      },
      billingPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      billingPeriodEnd: new Date(),
      items: [
        { title: 'Professional Business Tier', unitPrice: 199, quantity: 1, subtotal: 199 },
        { title: 'Cloud Infrastructure Engine - Ultra (8 vCPU, 32GB RAM)', unitPrice: 329, quantity: 1, subtotal: 329 },
        { title: '24/7 Enterprise Support & SLA', unitPrice: 99, quantity: 1, subtotal: 99 },
      ],
      subtotal: 627,
      taxes: [{ name: 'Standard Sales Tax (8%)', rate: 8, amount: 50.16 }],
      taxTotal: 50.16,
      discounts: [],
      discountTotal: 0,
      totalAmount: 677.16,
      amountPaid: 0,
      balanceDue: 677.16,
      issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'confirmed',
      paymentTerms: 'net30',
      generationType: 'automated',
      notes: 'Open invoice for Sarah Chen / Nexus AI awaiting payment.',
    });

    console.log('----------------------------------------------------');
    console.log('Database seeded successfully with rich realistic demo data!');
    console.log('Demo Accounts:');
    console.log('  Admin:    admin@subflow.io / Admin@12345');
    console.log('  Staff:    staff@subflow.io / Staff@12345');
    console.log('  Customer: sarah.chen@nexusai.com / Customer@12345');
    console.log('  Customer: marcus.vance@apexcloud.io / Customer@12345');
    console.log('----------------------------------------------------');

    if (require.main === module) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB.');
      process.exit(0);
    }
  } catch (err) {
    console.error('Error seeding database:', err);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;


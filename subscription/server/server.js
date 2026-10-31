const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cron = require('node-cron');
const { runBillingEngine } = require('./services/billingEngine');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/subscription_system';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Subscription Management System API',
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/plans', require('./routes/planRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/taxes', require('./routes/taxRoutes'));
app.use('/api/discounts', require('./routes/discountRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Connect to MongoDB & Start Server
const startServer = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${MONGODB_URI.split('@').pop()}`);
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully.');

    // Check if database needs initial seeding
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Database is empty. Automatically running initial seed data...');
      const seedDatabase = require('./utils/seedData');
      await seedDatabase();
    }

    // Schedule Recurring Automated Billing Engine
    // Runs every midnight (0 0 * * *) to evaluate due subscriptions
    cron.schedule('0 0 * * *', async () => {
      console.log('[CRON] Running daily automated billing cycle check...');
      try {
        const results = await runBillingEngine();
        console.log(`[CRON] Billing run complete: ${results.generatedCount} invoice(s) generated.`);
      } catch (err) {
        console.error('[CRON] Automated billing run failed:', err);
      }
    });

    app.listen(PORT, () => {
      console.log(`SubFlow Backend Server running on port ${PORT}`);
      console.log(`API base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

startServer();


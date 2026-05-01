require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const { logger } = require('./utils/logger');
const { initDatabase } = require('./models/database');

const authRoutes = require('./routes/auth');
const webhookRoutes = require('./routes/webhooks');
const warpRoutes = require('./routes/warp');
const repairRoutes = require('./routes/repairs');
const dashboardRoutes = require('./routes/dashboard');
const billingRoutes = require('./routes/billing');
const healthRoutes = require('./routes/health');
const reviewRoutes = require('./routes/reviews');
const learningsRoutes = require('./routes/learnings');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 4000;

// Trust proxy for Render
app.set('trust proxy', 1);

// Webhook route needs raw body for signature verification
app.use('/webhooks/github', express.raw({ type: 'application/json' }));

// Global middleware
app.use(helmet());
app.use(cors({
  origin: process.env.APP_BASE_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'warpfix-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// Passport
require('./middleware/passport');
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/warp', warpRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/billing', billingRoutes);
app.use('/health', healthRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/learnings', learningsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handler
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await initDatabase();
    logger.info('Database initialized');

    app.listen(PORT, () => {
      logger.info(`WarpFix API server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

start();

module.exports = app;

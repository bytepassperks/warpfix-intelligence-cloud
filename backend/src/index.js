require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('passport');
const { logger } = require('./utils/logger');
const { initDatabase, getPool } = require('./models/database');

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
const intelligenceRoutes = require('./routes/intelligence');
const marketplaceRoutes = require('./routes/marketplace');

const app = express();
const PORT = process.env.PORT || 4000;

// Trust proxy for Render
app.set('trust proxy', 1);

// Webhook routes need raw body for signature verification
app.use('/webhooks/github', express.raw({ type: 'application/json' }));
app.use('/webhooks/marketplace', express.raw({ type: 'application/json' }));

// Global middleware
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.APP_BASE_URL || 'http://localhost:3000',
      'https://warpfix.org',
      'https://www.warpfix.org',
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use((req, res, next) => {
  // Skip JSON parsing for webhook routes that need raw body for signature verification
  if (req.path === '/api/billing/webhook/dodo' || req.path === '/webhooks/github' || req.path === '/webhooks/marketplace') {
    return next();
  }
  express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

// Session with PostgreSQL store for persistence across restarts
app.use(session({
  store: new pgSession({
    pool: getPool(),
    tableName: 'user_sessions',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'warpfix-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.warpfix.org' : undefined,
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
app.use('/api/intelligence', intelligenceRoutes);
app.use('/webhooks/marketplace', marketplaceRoutes);

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

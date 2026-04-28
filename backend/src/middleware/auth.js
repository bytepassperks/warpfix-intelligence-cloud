const { logger } = require('../utils/logger');

function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  // Also allow API key auth for Warp CLI
  const apiKey = req.headers['x-warpfix-key'];
  if (apiKey && req.warpUser) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

function requirePlan(allowedPlans) {
  return (req, res, next) => {
    const plan = req.user?.plan || 'free';
    if (allowedPlans.includes(plan)) {
      return next();
    }
    res.status(403).json({ error: 'Plan upgrade required', current_plan: plan });
  };
}

async function checkUsageLimit(req, res, next) {
  try {
    const user = req.user;
    if (!user) return next();

    if (user.plan === 'free' && user.repairs_used_this_month >= 3) {
      return res.status(429).json({
        error: 'Monthly repair limit reached',
        limit: 3,
        used: user.repairs_used_this_month,
        upgrade_url: `${process.env.APP_BASE_URL}/pricing`,
      });
    }
    next();
  } catch (err) {
    logger.error('Usage limit check error', { error: err.message });
    next();
  }
}

module.exports = { requireAuth, requirePlan, checkUsageLimit };

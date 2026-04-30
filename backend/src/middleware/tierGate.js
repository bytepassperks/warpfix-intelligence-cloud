const { logger } = require('../utils/logger');

const TIER_LIMITS = {
  free: {
    repairs_per_month: 3,
    repos_limit: 1,
    reviews_enabled: false,
    security_scan: false,
    pr_split: false,
    dead_code_detection: false,
    test_coverage: false,
    tech_debt_tracking: false,
    quality_gates: false,
    dependency_radar: false,
    predictive_ci: false,
    chat_agent: false,
    custom_rules: false,
    priority_queue: false,
    api_access: false,
    webhooks: true,
    retention_days: 7,
  },
  pro: {
    repairs_per_month: -1,
    repos_limit: -1,
    reviews_enabled: true,
    security_scan: true,
    pr_split: true,
    dead_code_detection: true,
    test_coverage: true,
    tech_debt_tracking: false,
    quality_gates: true,
    dependency_radar: true,
    predictive_ci: true,
    chat_agent: true,
    custom_rules: true,
    priority_queue: true,
    api_access: true,
    webhooks: true,
    retention_days: 90,
  },
  team: {
    repairs_per_month: -1,
    repos_limit: -1,
    reviews_enabled: true,
    security_scan: true,
    pr_split: true,
    dead_code_detection: true,
    test_coverage: true,
    tech_debt_tracking: true,
    quality_gates: true,
    dependency_radar: true,
    predictive_ci: true,
    chat_agent: true,
    custom_rules: true,
    priority_queue: true,
    api_access: true,
    webhooks: true,
    retention_days: 365,
  },
};

function requireFeature(feature) {
  return (req, res, next) => {
    const plan = req.user?.plan || 'free';
    const limits = TIER_LIMITS[plan] || TIER_LIMITS.free;

    if (!limits[feature]) {
      return res.status(403).json({
        error: 'Feature not available on your plan',
        feature,
        current_plan: plan,
        required_plan: feature === 'tech_debt_tracking' ? 'team' : 'pro',
        upgrade_url: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/dashboard/billing`,
      });
    }
    next();
  };
}

function requireRepoLimit(req, res, next) {
  const plan = req.user?.plan || 'free';
  const limits = TIER_LIMITS[plan] || TIER_LIMITS.free;

  if (limits.repos_limit === -1) return next();

  const { query: dbQuery } = require('../models/database');
  dbQuery('SELECT COUNT(*) FROM repositories WHERE user_id = $1', [req.user.id])
    .then(result => {
      const count = parseInt(result.rows[0].count);
      if (count >= limits.repos_limit) {
        return res.status(403).json({
          error: 'Repository limit reached',
          current: count,
          limit: limits.repos_limit,
          current_plan: plan,
          upgrade_url: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/dashboard/billing`,
        });
      }
      next();
    })
    .catch(err => {
      logger.error('Repo limit check error', { error: err.message });
      next();
    });
}

function getTierLimits(plan) {
  return TIER_LIMITS[plan] || TIER_LIMITS.free;
}

module.exports = { TIER_LIMITS, requireFeature, requireRepoLimit, getTierLimits };

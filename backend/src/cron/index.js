require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { query } = require('../models/database');
const { logger } = require('../utils/logger');
const { scanDependencies } = require('../engines/dependencyRadar');
const { aggregateMonthlyStats } = require('../agents/intelligenceGrowth');

async function monthlyUsageReset() {
  logger.info('Running monthly usage reset');
  try {
    await query('UPDATE users SET repairs_used_this_month = 0');
    logger.info('Monthly usage reset completed');
  } catch (err) {
    logger.error('Monthly usage reset failed', { error: err.message });
  }
}

async function dependencyRadarRefresh() {
  logger.info('Running dependency radar refresh');
  try {
    const repos = await query('SELECT * FROM repositories LIMIT 100');
    for (const repo of repos.rows) {
      try {
        await scanDependencies(repo.id, null);
      } catch (err) {
        logger.error('Dependency scan failed', { repo: repo.full_name, error: err.message });
      }
    }
    logger.info('Dependency radar refresh completed');
  } catch (err) {
    logger.error('Dependency radar refresh failed', { error: err.message });
  }
}

async function telemetryAggregation() {
  logger.info('Running telemetry aggregation');
  try {
    // Aggregate daily metrics
    await query(`
      INSERT INTO telemetry_metrics (metric_type, metric_value)
      SELECT 'daily_aggregate', jsonb_build_object(
        'total_repairs', COUNT(*) FILTER (WHERE metric_type = 'repair_completed'),
        'total_failures', COUNT(*) FILTER (WHERE metric_type = 'failure_detected'),
        'date', CURRENT_DATE::text
      )
      FROM telemetry_metrics
      WHERE recorded_at > NOW() - INTERVAL '24 hours'
    `);
    logger.info('Telemetry aggregation completed');
  } catch (err) {
    logger.error('Telemetry aggregation failed', { error: err.message });
  }
}

async function expiredSubscriptionDowngrade() {
  logger.info('Running expired subscription downgrade check');
  try {
    const result = await query(
      `UPDATE users SET plan = 'free', updated_at = NOW()
       WHERE id IN (
         SELECT s.user_id FROM subscriptions s
         WHERE s.status = 'active'
         AND s.current_period_end IS NOT NULL
         AND s.current_period_end < NOW()
       )
       AND plan != 'free'
       RETURNING id, username, plan`
    );
    if (result.rows.length > 0) {
      await query(
        `UPDATE subscriptions SET status = 'expired', updated_at = NOW()
         WHERE status = 'active' AND current_period_end IS NOT NULL AND current_period_end < NOW()`
      );
      logger.info('Expired subscription downgrades', { count: result.rows.length, users: result.rows.map(r => r.username) });
    } else {
      logger.info('No expired subscriptions found');
    }
  } catch (err) {
    logger.error('Expired subscription downgrade failed', { error: err.message });
  }
}

async function expiredPromoDowngrade() {
  logger.info('Running expired promo downgrade check');
  try {
    const result = await query(
      `UPDATE users SET plan = 'free', updated_at = NOW()
       WHERE id IN (
         SELECT pr.user_id FROM promo_redemptions pr
         JOIN promo_codes pc ON pr.promo_id = pc.id
         WHERE pc.plan_override IS NOT NULL
         AND pc.expires_at IS NOT NULL
         AND pc.expires_at < NOW()
       )
       AND plan != 'free'
       AND id NOT IN (
         SELECT user_id FROM subscriptions WHERE status = 'active'
       )
       RETURNING id, username`
    );
    if (result.rows.length > 0) {
      logger.info('Expired promo downgrades', { count: result.rows.length, users: result.rows.map(r => r.username) });
    } else {
      logger.info('No expired promo downgrades needed');
    }
  } catch (err) {
    logger.error('Expired promo downgrade failed', { error: err.message });
  }
}

// Determine which cron to run based on args
const cronType = process.argv[2] || 'all';

async function run() {
  switch (cronType) {
    case 'usage-reset':
      await monthlyUsageReset();
      break;
    case 'dependency-radar':
      await dependencyRadarRefresh();
      break;
    case 'telemetry':
      await telemetryAggregation();
      break;
    case 'genome-stats':
      await aggregateMonthlyStats();
      break;
    case 'plan-downgrade':
      await expiredSubscriptionDowngrade();
      await expiredPromoDowngrade();
      break;
    case 'all':
    default:
      await telemetryAggregation();
      await dependencyRadarRefresh();
      await aggregateMonthlyStats();
      await expiredSubscriptionDowngrade();
      await expiredPromoDowngrade();
      break;
  }
  process.exit(0);
}

run().catch((err) => {
  logger.error('Cron job failed', { error: err.message });
  process.exit(1);
});

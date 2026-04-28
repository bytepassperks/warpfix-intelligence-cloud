require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { query } = require('../models/database');
const { logger } = require('../utils/logger');
const { scanDependencies } = require('../engines/dependencyRadar');

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
    case 'all':
    default:
      await telemetryAggregation();
      await dependencyRadarRefresh();
      break;
  }
  process.exit(0);
}

run().catch((err) => {
  logger.error('Cron job failed', { error: err.message });
  process.exit(1);
});

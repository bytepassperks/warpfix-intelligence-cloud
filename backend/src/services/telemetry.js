const { query } = require('../models/database');
const { logger } = require('../utils/logger');

async function recordTelemetry(userId, repositoryId, metricType, metricValue) {
  try {
    await query(
      `INSERT INTO telemetry_metrics (user_id, repository_id, metric_type, metric_value)
       VALUES ($1, $2, $3, $4)`,
      [userId, repositoryId, metricType, JSON.stringify(metricValue)]
    );
  } catch (err) {
    logger.error('Telemetry recording error', { error: err.message });
  }
}

async function getOrgStabilityScore(userId) {
  try {
    const [ciTrend, repairFreq, depDrift] = await Promise.all([
      query(
        `SELECT COUNT(*) as failures FROM failures f
         JOIN repositories r ON r.id = f.repository_id
         WHERE r.user_id = $1 AND f.created_at > NOW() - INTERVAL '30 days'`,
        [userId]
      ),
      query(
        `SELECT COUNT(*) as repairs FROM repairs
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
        [userId]
      ),
      query(
        `SELECT COUNT(*) as alerts FROM dependency_alerts da
         JOIN repositories r ON r.id = da.repository_id
         WHERE r.user_id = $1 AND da.resolved = FALSE`,
        [userId]
      ),
    ]);

    const failures = parseInt(ciTrend.rows[0].failures);
    const repairs = parseInt(repairFreq.rows[0].repairs);
    const alerts = parseInt(depDrift.rows[0].alerts);

    const repairRate = failures > 0 ? (repairs / failures) * 100 : 100;
    const failurePenalty = Math.min(failures * 2, 40);
    const alertPenalty = Math.min(alerts * 3, 30);

    const score = Math.max(0, Math.min(100,
      100 - failurePenalty - alertPenalty + (repairRate > 80 ? 10 : 0)
    ));

    return {
      score,
      ci_failures_30d: failures,
      repairs_30d: repairs,
      repair_rate: Math.round(repairRate),
      open_alerts: alerts,
    };
  } catch (err) {
    logger.error('Stability score error', { error: err.message });
    return { score: 0, error: err.message };
  }
}

module.exports = { recordTelemetry, getOrgStabilityScore };

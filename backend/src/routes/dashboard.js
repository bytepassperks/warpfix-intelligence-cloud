const express = require('express');
const { query } = require('../models/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Helper: get all repo IDs the user has access to (via direct ownership or installation)
async function getUserRepoIds(userId) {
  const result = await query(
    `SELECT DISTINCT rp.id FROM repositories rp
     LEFT JOIN installations i ON i.installation_id::text = rp.installation_id
     LEFT JOIN users u ON u.username = i.account_login
     WHERE rp.user_id = $1 OR u.id = $1`,
    [userId]
  );
  return result.rows.map(r => r.id);
}

// Public stats endpoint — shows all repairs (including webhook-triggered ones without user_id)
router.get('/public-stats', async (req, res) => {
  try {
    const [repairsResult, successResult, fingerprintResult, recentResult] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM repairs`),
      query(`SELECT COUNT(*) as total FROM repairs WHERE sandbox_passed = TRUE`),
      query(
        `SELECT COUNT(DISTINCT fingerprint_id) as unique_fingerprints,
                COALESCE(SUM(CASE WHEN fingerprint_id IS NOT NULL THEN 1 ELSE 0 END), 0) as reused
         FROM repairs`
      ),
      query(
        `SELECT r.*, repo.full_name as repo_name
         FROM repairs r
         LEFT JOIN repositories repo ON repo.id = r.repository_id
         ORDER BY r.created_at DESC LIMIT 20`
      ),
    ]);

    const totalRepairs = parseInt(repairsResult.rows[0].total);
    const successfulRepairs = parseInt(successResult.rows[0].total);
    const successRate = totalRepairs > 0 ? Math.round((successfulRepairs / totalRepairs) * 100) : 0;

    res.json({
      stats: {
        total_repairs: totalRepairs,
        successful_repairs: successfulRepairs,
        success_rate: successRate,
        unique_fingerprints: parseInt(fingerprintResult.rows[0].unique_fingerprints),
        fingerprint_reuse_count: parseInt(fingerprintResult.rows[0].reused),
        repairs_this_month: totalRepairs,
        plan: 'FREE',
      },
      recent_repairs: recentResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch public stats' });
  }
});

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const repoIds = await getUserRepoIds(userId);
    const repoIdList = repoIds.length > 0 ? repoIds : ['00000000-0000-0000-0000-000000000000'];

    const [repairsResult, successResult, fingerprintResult, recentResult] = await Promise.all([
      query(
        `SELECT COUNT(*) as total FROM repairs WHERE user_id = $1 OR repository_id = ANY($2::uuid[])`,
        [userId, repoIdList]
      ),
      query(
        `SELECT COUNT(*) as total FROM repairs WHERE (user_id = $1 OR repository_id = ANY($2::uuid[])) AND sandbox_passed = TRUE`,
        [userId, repoIdList]
      ),
      query(
        `SELECT COUNT(DISTINCT fingerprint_id) as unique_fingerprints,
                COALESCE(SUM(CASE WHEN fingerprint_id IS NOT NULL THEN 1 ELSE 0 END), 0) as reused
         FROM repairs WHERE user_id = $1 OR repository_id = ANY($2::uuid[])`,
        [userId, repoIdList]
      ),
      query(
        `SELECT r.*, repo.full_name as repo_name
         FROM repairs r
         LEFT JOIN repositories repo ON repo.id = r.repository_id
         WHERE r.user_id = $1 OR r.repository_id = ANY($2::uuid[])
         ORDER BY r.created_at DESC LIMIT 5`,
        [userId, repoIdList]
      ),
    ]);

    const totalRepairs = parseInt(repairsResult.rows[0].total);
    const successfulRepairs = parseInt(successResult.rows[0].total);
    const successRate = totalRepairs > 0 ? Math.round((successfulRepairs / totalRepairs) * 100) : 0;

    res.json({
      stats: {
        total_repairs: totalRepairs,
        successful_repairs: successfulRepairs,
        success_rate: successRate,
        unique_fingerprints: parseInt(fingerprintResult.rows[0].unique_fingerprints),
        fingerprint_reuse_count: parseInt(fingerprintResult.rows[0].reused),
        repairs_this_month: req.user.repairs_used_this_month,
        plan: req.user.plan,
      },
      recent_repairs: recentResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

router.get('/stability', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const repoIds = await getUserRepoIds(userId);
    const repoIdList = repoIds.length > 0 ? repoIds : ['00000000-0000-0000-0000-000000000000'];

    const [ciTrend, repairFreq, depAlerts] = await Promise.all([
      query(
        `SELECT DATE(created_at) as day, COUNT(*) as failures
         FROM failures f
         WHERE f.repository_id = ANY($1::uuid[]) AND f.created_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at) ORDER BY day`,
        [repoIdList]
      ),
      query(
        `SELECT DATE(created_at) as day, COUNT(*) as repairs
         FROM repairs
         WHERE (user_id = $1 OR repository_id = ANY($2::uuid[])) AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at) ORDER BY day`,
        [userId, repoIdList]
      ),
      query(
        `SELECT COUNT(*) as total FROM dependency_alerts da
         WHERE da.repository_id = ANY($1::uuid[]) AND da.resolved = FALSE`,
        [repoIdList]
      ),
    ]);

    const totalFailures30d = ciTrend.rows.reduce((sum, r) => sum + parseInt(r.failures), 0);
    const daysWithFailures = ciTrend.rows.length;
    const stabilityScore = Math.max(0, 100 - (totalFailures30d * 2) - (daysWithFailures * 3));

    res.json({
      stability_score: Math.min(100, stabilityScore),
      ci_failure_trend: ciTrend.rows,
      repair_frequency: repairFreq.rows,
      open_dependency_alerts: parseInt(depAlerts.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stability data' });
  }
});

router.get('/telemetry', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT metric_type, metric_value, recorded_at
       FROM telemetry_metrics
       WHERE user_id = $1 OR user_id IS NULL
       ORDER BY recorded_at DESC LIMIT 100`,
      [req.user.id]
    );
    res.json({ metrics: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

module.exports = router;

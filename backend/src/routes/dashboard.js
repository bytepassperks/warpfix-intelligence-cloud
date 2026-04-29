const express = require('express');
const { query } = require('../models/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [repairsResult, successResult, fingerprintResult, recentResult] = await Promise.all([
      query('SELECT COUNT(*) as total FROM repairs WHERE user_id = $1', [userId]),
      query('SELECT COUNT(*) as total FROM repairs WHERE user_id = $1 AND sandbox_passed = TRUE', [userId]),
      query(
        `SELECT COUNT(DISTINCT fingerprint_id) as unique_fingerprints,
                COALESCE(SUM(CASE WHEN fingerprint_id IS NOT NULL THEN 1 ELSE 0 END), 0) as reused
         FROM repairs WHERE user_id = $1`,
        [userId]
      ),
      query(
        `SELECT r.*, repo.full_name as repo_name
         FROM repairs r
         LEFT JOIN repositories repo ON repo.id = r.repository_id
         WHERE r.user_id = $1
         ORDER BY r.created_at DESC LIMIT 5`,
        [userId]
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

    const [ciTrend, repairFreq, depAlerts] = await Promise.all([
      query(
        `SELECT DATE(created_at) as day, COUNT(*) as failures
         FROM failures f
         JOIN repositories r ON r.id = f.repository_id
         WHERE r.user_id = $1 AND f.created_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at) ORDER BY day`,
        [userId]
      ),
      query(
        `SELECT DATE(created_at) as day, COUNT(*) as repairs
         FROM repairs
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at) ORDER BY day`,
        [userId]
      ),
      query(
        `SELECT COUNT(*) as total FROM dependency_alerts da
         JOIN repositories r ON r.id = da.repository_id
         WHERE r.user_id = $1 AND da.resolved = FALSE`,
        [userId]
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
       WHERE user_id = $1
       ORDER BY recorded_at DESC LIMIT 100`,
      [req.user.id]
    );
    res.json({ metrics: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

module.exports = router;

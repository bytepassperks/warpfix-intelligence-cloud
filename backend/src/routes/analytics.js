const express = require('express');
const { query } = require('../models/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// 1. Quality Metrics
router.get('/quality', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [reviewStats, severityBreakdown, topIssues] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) as total_reviews,
          AVG((review_data->>'review_effort_level')::int) as avg_effort,
          COUNT(CASE WHEN review_data->>'risk_level' = 'critical' THEN 1 END) as critical_count,
          COUNT(CASE WHEN review_data->>'risk_level' = 'high' THEN 1 END) as high_count
        FROM reviews WHERE created_at > NOW() - INTERVAL '30 days' AND user_id = $1
      `, [userId]),
      query(`
        SELECT 
          COALESCE(SUM((review_data->>'critical_count')::int), 0) as critical,
          COALESCE(SUM((review_data->>'warning_count')::int), 0) as warnings,
          COALESCE(SUM((review_data->>'nitpick_count')::int), 0) as nitpicks
        FROM reviews WHERE created_at > NOW() - INTERVAL '30 days' AND user_id = $1
      `, [userId]),
      query(`
        SELECT review_data->>'top_category' as category, COUNT(*) as count
        FROM reviews WHERE created_at > NOW() - INTERVAL '30 days'
        AND review_data->>'top_category' IS NOT NULL AND user_id = $1
        GROUP BY review_data->>'top_category'
        ORDER BY count DESC LIMIT 10
      `, [userId]),
    ]);

    res.json({
      review_stats: reviewStats.rows[0],
      severity_breakdown: severityBreakdown.rows[0],
      top_issue_categories: topIssues.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quality metrics' });
  }
});

// 2. Time Saved
router.get('/time-saved', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [reviewTimeSaved, repairTimeSaved, monthlyTrend] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) as reviews_automated,
          SUM(COALESCE((review_data->>'estimated_minutes')::int, 15)) as minutes_saved,
          ROUND(AVG(COALESCE((review_data->>'estimated_minutes')::int, 15)), 1) as avg_minutes_per_review
        FROM reviews WHERE created_at > NOW() - INTERVAL '30 days' AND user_id = $1
      `, [userId]),
      query(`
        SELECT 
          COUNT(*) as repairs_automated,
          SUM(CASE WHEN sandbox_passed THEN 1 ELSE 0 END) as successful_repairs,
          ROUND(AVG(duration_ms) / 1000, 1) as avg_repair_seconds
        FROM repairs WHERE created_at > NOW() - INTERVAL '30 days' AND user_id = $1
      `, [userId]),
      query(`
        SELECT 
          DATE_TRUNC('week', created_at) as week,
          COUNT(*) FILTER (WHERE status = 'completed') as repairs,
          0 as reviews
        FROM repairs WHERE created_at > NOW() - INTERVAL '90 days' AND user_id = $1
        GROUP BY week ORDER BY week
      `, [userId]),
    ]);

    const reviewMinutes = parseInt(reviewTimeSaved.rows[0]?.minutes_saved || 0);
    const repairCount = parseInt(repairTimeSaved.rows[0]?.repairs_automated || 0);
    const totalMinutesSaved = reviewMinutes + (repairCount * 30); // Estimate 30 min per manual repair

    res.json({
      review_time_saved: reviewTimeSaved.rows[0],
      repair_time_saved: repairTimeSaved.rows[0],
      total_minutes_saved: totalMinutesSaved,
      total_hours_saved: Math.round(totalMinutesSaved / 60 * 10) / 10,
      monthly_trend: monthlyTrend.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch time saved' });
  }
});

// 3. Knowledge & Learnings
router.get('/knowledge', requireAuth, async (req, res) => {
  try {
    const [learningStats, recentLearnings, fingerprintStats] = await Promise.all([
      query(`
        SELECT COUNT(*) as total, 
               COUNT(CASE WHEN active THEN 1 END) as active,
               COUNT(DISTINCT repository_id) as repos_with_learnings
        FROM learnings
      `),
      query(`
        SELECT l.*, repo.full_name as repo_name
        FROM learnings l
        LEFT JOIN repositories repo ON repo.id = l.repository_id
        ORDER BY l.created_at DESC LIMIT 10
      `),
      query(`
        SELECT COUNT(*) as total,
               SUM(times_matched) as total_matches,
               ROUND(AVG(resolution_confidence), 1) as avg_confidence
        FROM fingerprints
      `),
    ]);

    res.json({
      learning_stats: learningStats.rows[0],
      recent_learnings: recentLearnings.rows,
      fingerprint_stats: fingerprintStats.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch knowledge stats' });
  }
});

// 4. Trends
router.get('/trends', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [repairTrend, reviewTrend, confidenceTrend, typeTrend] = await Promise.all([
      query(`
        SELECT DATE(created_at) as day, COUNT(*) as count,
               SUM(CASE WHEN sandbox_passed THEN 1 ELSE 0 END) as successful
        FROM repairs WHERE created_at > NOW() - INTERVAL '30 days' AND user_id = $1
        GROUP BY DATE(created_at) ORDER BY day
      `, [userId]),
      query(`
        SELECT DATE(created_at) as day, COUNT(*) as count
        FROM reviews WHERE created_at > NOW() - INTERVAL '30 days' AND user_id = $1
        GROUP BY DATE(created_at) ORDER BY day
      `, [userId]),
      query(`
        SELECT DATE(created_at) as day, 
               ROUND(AVG(confidence_score), 1) as avg_confidence
        FROM repairs WHERE created_at > NOW() - INTERVAL '30 days' AND user_id = $1
        GROUP BY DATE(created_at) ORDER BY day
      `, [userId]),
      query(`
        SELECT engine_used as type, COUNT(*) as count
        FROM repairs WHERE created_at > NOW() - INTERVAL '30 days' AND user_id = $1
        GROUP BY engine_used ORDER BY count DESC
      `, [userId]),
    ]);

    res.json({
      repair_trend: repairTrend.rows,
      review_trend: reviewTrend.rows,
      confidence_trend: confidenceTrend.rows,
      failure_type_distribution: typeTrend.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// 5. Security
router.get('/security', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [vulnStats, recentVulns] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) as total_scans,
          COALESCE(SUM((review_data->>'security_issues')::int), 0) as total_issues,
          COALESCE(SUM((review_data->>'security_critical')::int), 0) as critical_issues
        FROM reviews WHERE created_at > NOW() - INTERVAL '30 days' AND user_id = $1
      `, [userId]),
      query(`
        SELECT da.*, repo.full_name as repo_name
        FROM dependency_alerts da
        LEFT JOIN repositories repo ON repo.id = da.repository_id
        WHERE da.resolved = false
        ORDER BY da.created_at DESC LIMIT 20
      `),
    ]);

    res.json({
      vulnerability_stats: vulnStats.rows[0],
      unresolved_alerts: recentVulns.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch security stats' });
  }
});

// 6. Tech Debt
router.get('/tech-debt', requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT metric_value
      FROM telemetry_metrics
      WHERE metric_type = 'tech_debt_score'
      ORDER BY recorded_at DESC LIMIT 30
    `);

    const scores = result.rows.map(r => r.metric_value);

    res.json({
      scores,
      current_score: scores[0] || null,
      trend: scores.length > 1
        ? (scores[0]?.overall_score || 0) - (scores[scores.length - 1]?.overall_score || 0)
        : 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tech debt' });
  }
});

// 7. Repositories
router.get('/repositories', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(`
      SELECT 
        repo.id, repo.full_name, repo.language,
        COUNT(DISTINCT r.id) as repair_count,
        COUNT(DISTINCT rv.id) as review_count,
        MAX(r.created_at) as last_repair,
        MAX(rv.created_at) as last_review
      FROM repositories repo
      LEFT JOIN repairs r ON r.repository_id = repo.id
      LEFT JOIN reviews rv ON rv.repository_id = repo.id
      WHERE repo.user_id = $1
      GROUP BY repo.id, repo.full_name, repo.language
      ORDER BY repair_count DESC
    `, [userId]);

    res.json({ repositories: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// 8. Contributors
router.get('/contributors', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(`
      SELECT 
        review_data->>'pr_author' as author,
        COUNT(*) as prs_reviewed,
        ROUND(AVG(COALESCE((review_data->>'estimated_minutes')::int, 15)), 1) as avg_review_time
      FROM reviews
      WHERE review_data->>'pr_author' IS NOT NULL
      AND created_at > NOW() - INTERVAL '30 days' AND user_id = $1
      GROUP BY review_data->>'pr_author'
      ORDER BY prs_reviewed DESC
    `, [userId]);

    res.json({ contributors: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contributors' });
  }
});

// 9. Predictions
router.get('/predictions', requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT metric_value
      FROM telemetry_metrics
      WHERE metric_type = 'ci_prediction'
      ORDER BY recorded_at DESC LIMIT 50
    `);

    const predictions = result.rows.map(r => r.metric_value);
    const correct = predictions.filter(p => p.was_correct).length;
    const accuracy = predictions.length > 0
      ? Math.round((correct / predictions.length) * 100)
      : 0;

    res.json({
      total_predictions: predictions.length,
      accuracy_percentage: accuracy,
      recent_predictions: predictions.slice(0, 20),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// 10. Release Notes
router.get('/releases', requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT metric_value
      FROM telemetry_metrics
      WHERE metric_type = 'release_notes'
      ORDER BY recorded_at DESC LIMIT 10
    `);

    res.json({ releases: result.rows.map(r => r.metric_value) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch releases' });
  }
});

module.exports = router;

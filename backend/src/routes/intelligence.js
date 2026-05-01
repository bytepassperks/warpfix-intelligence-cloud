const express = require('express');
const router = express.Router();
const { query } = require('../models/database');
const { logger } = require('../utils/logger');

// ── CI Brain: test reliability & fingerprint stats ──
router.get('/ci-brain', async (req, res) => {
  try {
    // Total test runs and unique tests
    const testStats = await query(`
      SELECT
        COUNT(*) AS total_runs,
        COUNT(DISTINCT test_name) AS unique_tests,
        COUNT(DISTINCT test_file) AS unique_files,
        COUNT(*) FILTER (WHERE status = 'failed') AS total_failures,
        COUNT(*) FILTER (WHERE status = 'passed') AS total_passes
      FROM test_runs
    `);

    // Fingerprint count
    const fpStats = await query(`
      SELECT COUNT(*) AS total_fingerprints, SUM(times_matched) AS total_matches
      FROM fingerprints
    `);

    // Top flaky tests (lowest pass rate with at least 50 runs)
    const flakyTests = await query(`
      SELECT
        test_name,
        test_file,
        COUNT(*) AS total_runs,
        COUNT(*) FILTER (WHERE status = 'passed') AS passes,
        COUNT(*) FILTER (WHERE status = 'failed') AS failures,
        ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'passed') / NULLIF(COUNT(*), 0), 1) AS pass_rate
      FROM test_runs
      GROUP BY test_name, test_file
      HAVING COUNT(*) >= 50
      ORDER BY pass_rate ASC
      LIMIT 15
    `);

    // Failure-prone files (most failures)
    const hotspotFiles = await query(`
      SELECT
        test_file,
        COUNT(*) FILTER (WHERE status = 'failed') AS failures,
        COUNT(*) AS total_runs,
        ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'failed') / NULLIF(COUNT(*), 0), 1) AS fail_rate
      FROM test_runs
      GROUP BY test_file
      HAVING COUNT(*) >= 30
      ORDER BY failures DESC
      LIMIT 10
    `);

    // Daily failure trend (last 30 days)
    const dailyTrend = await query(`
      SELECT
        DATE(created_at) AS date,
        COUNT(*) FILTER (WHERE status = 'passed') AS passes,
        COUNT(*) FILTER (WHERE status = 'failed') AS failures
      FROM test_runs
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Unique team categories (from org preferences)
    const teamCount = await query(`
      SELECT COUNT(DISTINCT category) AS teams FROM org_preferences
    `);

    res.json({
      overview: {
        totalTestRuns: parseInt(testStats.rows[0]?.total_runs || 0),
        uniqueTests: parseInt(testStats.rows[0]?.unique_tests || 0),
        uniqueFiles: parseInt(testStats.rows[0]?.unique_files || 0),
        totalFailures: parseInt(testStats.rows[0]?.total_failures || 0),
        totalPasses: parseInt(testStats.rows[0]?.total_passes || 0),
        totalFingerprints: parseInt(fpStats.rows[0]?.total_fingerprints || 0),
        totalMatches: parseInt(fpStats.rows[0]?.total_matches || 0),
        teams: parseInt(teamCount.rows[0]?.teams || 0),
      },
      flakyTests: flakyTests.rows,
      hotspotFiles: hotspotFiles.rows,
      dailyTrend: dailyTrend.rows,
    });
  } catch (err) {
    logger.error('CI Brain fetch failed', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch CI Brain data' });
  }
});

// ── Failure Genome: fingerprint database + monthly index ──
router.get('/failure-genome', async (req, res) => {
  try {
    // All fingerprints with metadata
    const fingerprints = await query(`
      SELECT
        id, hash, error_pattern, dependency_context,
        resolution_confidence, times_matched, last_matched_at, created_at
      FROM fingerprints
      ORDER BY times_matched DESC
      LIMIT 100
    `);

    // Category breakdown
    const categories = await query(`
      SELECT
        dependency_context->>'category' AS category,
        COUNT(*) AS count,
        SUM(times_matched) AS total_matches,
        ROUND(AVG(resolution_confidence), 0) AS avg_confidence
      FROM fingerprints
      WHERE dependency_context->>'category' IS NOT NULL
      GROUP BY dependency_context->>'category'
      ORDER BY total_matches DESC
    `);

    // Monthly genome index
    const monthly = await query(`
      SELECT month_year, new_patterns, total_matches, avg_confidence, top_category
      FROM genome_monthly_stats
      ORDER BY created_at DESC
    `);

    // Aggregate stats
    const agg = await query(`
      SELECT
        COUNT(*) AS total_fingerprints,
        COUNT(DISTINCT dependency_context->>'category') AS unique_categories,
        SUM(times_matched) AS total_matches,
        ROUND(AVG(resolution_confidence), 0) AS avg_confidence
      FROM fingerprints
    `);

    res.json({
      overview: {
        totalFingerprints: parseInt(agg.rows[0]?.total_fingerprints || 0),
        uniqueCategories: parseInt(agg.rows[0]?.unique_categories || 0),
        totalMatches: parseInt(agg.rows[0]?.total_matches || 0),
        avgConfidence: parseInt(agg.rows[0]?.avg_confidence || 0),
      },
      fingerprints: fingerprints.rows,
      categories: categories.rows,
      monthlyIndex: monthly.rows,
    });
  } catch (err) {
    logger.error('Failure Genome fetch failed', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch Failure Genome data' });
  }
});

// ── Network Intelligence: cross-repo predictions ──
router.get('/network-intelligence', async (req, res) => {
  try {
    // All predictions
    const predictions = await query(`
      SELECT
        id, pattern_type, description, probability, category,
        based_on_prs, based_on_repos, times_prevented, suggestion, last_triggered_at
      FROM network_predictions
      ORDER BY probability DESC
    `);

    // Aggregate stats
    const agg = await query(`
      SELECT
        SUM(based_on_repos) AS total_repos,
        SUM(based_on_prs) AS total_prs,
        SUM(times_prevented) AS total_prevented,
        ROUND(AVG(probability), 0) AS avg_accuracy
      FROM network_predictions
    `);

    // Category distribution
    const catDist = await query(`
      SELECT
        category,
        COUNT(*) AS count,
        SUM(times_prevented) AS prevented,
        ROUND(AVG(probability), 0) AS avg_probability
      FROM network_predictions
      GROUP BY category
      ORDER BY prevented DESC
    `);

    // Fingerprint stats for network context
    const fpNetwork = await query(`
      SELECT
        dependency_context->>'framework' AS framework,
        COUNT(*) AS patterns,
        SUM(times_matched) AS total_matches
      FROM fingerprints
      WHERE dependency_context->>'framework' IS NOT NULL
      GROUP BY dependency_context->>'framework'
      ORDER BY total_matches DESC
      LIMIT 15
    `);

    res.json({
      overview: {
        totalRepos: parseInt(agg.rows[0]?.total_repos || 0),
        totalPRs: parseInt(agg.rows[0]?.total_prs || 0),
        totalPrevented: parseInt(agg.rows[0]?.total_prevented || 0),
        avgAccuracy: parseInt(agg.rows[0]?.avg_accuracy || 0),
      },
      predictions: predictions.rows,
      categoryDistribution: catDist.rows,
      frameworkBreakdown: fpNetwork.rows,
    });
  } catch (err) {
    logger.error('Network Intelligence fetch failed', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch Network Intelligence data' });
  }
});

// ── Org Memory: learned preferences & feedback log ──
router.get('/org-memory', async (req, res) => {
  try {
    const userId = req.query.user_id;

    // All org preferences (if user_id, filter; otherwise show all)
    let prefsQuery = `
      SELECT id, category, rule, confidence, source, times_applied, last_used_at, created_at
      FROM org_preferences
    `;
    const params = [];
    if (userId) {
      prefsQuery += ' WHERE user_id = $1';
      params.push(userId);
    }
    prefsQuery += ' ORDER BY confidence DESC, times_applied DESC';

    const preferences = await query(prefsQuery, params);

    // Category breakdown
    let catQuery = `
      SELECT
        category,
        COUNT(*) AS rules_count,
        ROUND(AVG(confidence), 0) AS avg_confidence,
        SUM(times_applied) AS total_applications
      FROM org_preferences
    `;
    if (userId) {
      catQuery += ' WHERE user_id = $1';
    }
    catQuery += ' GROUP BY category ORDER BY rules_count DESC';

    const categories = await query(catQuery, params);

    // PR feedback signals (from learnings table)
    const feedbackLog = await query(`
      SELECT id, rule, category, context, source, times_applied, created_at
      FROM learnings
      ORDER BY created_at DESC
      LIMIT 50
    `);

    // Aggregate
    const total = preferences.rows.length;
    const totalApplied = preferences.rows.reduce((sum, p) => sum + (parseInt(p.times_applied) || 0), 0);
    const avgConf = total > 0
      ? Math.round(preferences.rows.reduce((sum, p) => sum + (parseInt(p.confidence) || 0), 0) / total)
      : 0;

    res.json({
      overview: {
        totalPreferences: total,
        totalApplications: totalApplied,
        avgConfidence: avgConf,
        categories: categories.rows.length,
        feedbackSignals: feedbackLog.rows.length,
      },
      preferences: preferences.rows,
      categories: categories.rows,
      feedbackLog: feedbackLog.rows,
    });
  } catch (err) {
    logger.error('Org Memory fetch failed', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch Org Memory data' });
  }
});

module.exports = router;

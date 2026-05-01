const { query } = require('../models/database');
const { logger } = require('../utils/logger');

/**
 * Extract individual test results from CI logs and store in test_runs table.
 * Parses common test framework output formats (Jest, Vitest, pytest, Go test, etc.)
 */
async function recordTestResults({ rawLog, repoId, branch, commitSha, workflowRunId }) {
  if (!rawLog || !repoId) return 0;

  const testResults = parseTestResults(rawLog);
  let inserted = 0;

  for (const t of testResults) {
    try {
      await query(
        `INSERT INTO test_runs (repository_id, test_name, test_file, status, duration_ms, branch, commit_sha, workflow_run_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [repoId, t.name, t.file || null, t.status, t.durationMs || null, branch, commitSha, workflowRunId]
      );
      inserted++;
    } catch (err) {
      logger.debug('Failed to insert test run', { test: t.name, error: err.message });
    }
  }

  if (inserted > 0) {
    logger.info('Recorded test results', { count: inserted, repoId });
  }
  return inserted;
}

function parseTestResults(rawLog) {
  const results = [];

  // Jest / Vitest: "✓ should do X (123 ms)" or "✕ should do X (45 ms)"
  const jestPass = /(?:✓|√|PASS)\s+(.+?)(?:\s+\((\d+)\s*(?:ms|s)\))?$/gm;
  const jestFail = /(?:✕|×|FAIL)\s+(.+?)(?:\s+\((\d+)\s*(?:ms|s)\))?$/gm;

  // Jest suite: "PASS src/foo.test.ts" or "FAIL src/bar.test.ts"
  const jestSuite = /(?:PASS|FAIL)\s+([\w/.@-]+\.(?:test|spec)\.\w+)/gm;
  const suiteFiles = new Set();
  let m;
  while ((m = jestSuite.exec(rawLog))) {
    suiteFiles.add(m[1]);
  }
  const currentFile = suiteFiles.size > 0 ? [...suiteFiles][suiteFiles.size - 1] : null;

  while ((m = jestPass.exec(rawLog))) {
    const dur = m[2] ? (m[2].includes('s') ? parseInt(m[2]) * 1000 : parseInt(m[2])) : null;
    results.push({ name: m[1].trim(), file: currentFile, status: 'passed', durationMs: dur });
  }
  while ((m = jestFail.exec(rawLog))) {
    const dur = m[2] ? parseInt(m[2]) : null;
    results.push({ name: m[1].trim(), file: currentFile, status: 'failed', durationMs: dur });
  }

  // Go test: "--- PASS: TestFoo (0.12s)" or "--- FAIL: TestBar (1.23s)"
  const goTest = /---\s+(PASS|FAIL):\s+(\S+)\s+\(([\d.]+)s\)/gm;
  while ((m = goTest.exec(rawLog))) {
    results.push({
      name: m[2],
      file: null,
      status: m[1].toLowerCase() === 'pass' ? 'passed' : 'failed',
      durationMs: Math.round(parseFloat(m[3]) * 1000),
    });
  }

  // pytest: "PASSED test_foo.py::test_bar" or "FAILED test_foo.py::test_bar"
  const pytest = /(PASSED|FAILED)\s+([\w/.]+\.py)::(\w+)/gm;
  while ((m = pytest.exec(rawLog))) {
    results.push({
      name: m[3],
      file: m[2],
      status: m[1].toLowerCase() === 'passed' ? 'passed' : 'failed',
      durationMs: null,
    });
  }

  // Jest summary line: "Tests: X failed, Y passed, Z total"
  const jestSummary = /Tests:\s+(?:(\d+)\s+failed,\s+)?(\d+)\s+passed,\s+(\d+)\s+total/;
  const summMatch = jestSummary.exec(rawLog);
  if (summMatch && results.length === 0) {
    const failed = parseInt(summMatch[1] || '0');
    const passed = parseInt(summMatch[2]);
    if (failed > 0) {
      results.push({ name: 'unknown_failed_tests', file: null, status: 'failed', durationMs: null });
    }
    if (passed > 0) {
      results.push({ name: 'unknown_passed_tests', file: null, status: 'passed', durationMs: null });
    }
  }

  return results;
}

/**
 * When a user edits a WarpFix PR before merging, capture the edit pattern as an org preference.
 * Called from webhook handler when a WarpFix PR is merged with modifications.
 */
async function captureOrgPreference({ userId, category, rule, source, confidence }) {
  if (!userId || !rule) return null;

  try {
    const existing = await query(
      'SELECT id, times_applied, confidence FROM org_preferences WHERE user_id = $1 AND rule = $2',
      [userId, rule]
    );

    if (existing.rows[0]) {
      const newConf = Math.min(100, Math.max(existing.rows[0].confidence, confidence || 50));
      await query(
        `UPDATE org_preferences SET times_applied = times_applied + 1, confidence = $1, last_used_at = NOW() WHERE id = $2`,
        [newConf, existing.rows[0].id]
      );
      return existing.rows[0].id;
    }

    const result = await query(
      `INSERT INTO org_preferences (user_id, category, rule, confidence, source) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, category || 'general', rule, confidence || 50, source || 'pr_feedback']
    );
    logger.info('New org preference captured', { category, rule: rule.substring(0, 80) });
    return result.rows[0]?.id;
  } catch (err) {
    logger.error('Failed to capture org preference', { error: err.message });
    return null;
  }
}

/**
 * Update network prediction stats when a pattern is detected.
 * Increments times_prevented and updates probability based on new data.
 */
async function updateNetworkPrediction({ patternType, category, basedOnPrs, basedOnRepos }) {
  try {
    const existing = await query(
      'SELECT id, based_on_prs, based_on_repos, times_prevented FROM network_predictions WHERE pattern_type = $1 AND category = $2',
      [patternType, category]
    );

    if (existing.rows[0]) {
      await query(
        `UPDATE network_predictions
         SET times_prevented = times_prevented + 1,
             based_on_prs = based_on_prs + $1,
             based_on_repos = GREATEST(based_on_repos, $2),
             last_triggered_at = NOW()
         WHERE id = $3`,
        [basedOnPrs || 1, basedOnRepos || 0, existing.rows[0].id]
      );
    }
  } catch (err) {
    logger.debug('Failed to update network prediction', { error: err.message });
  }
}

/**
 * Auto-create a network prediction if a fingerprint is seen across multiple repos.
 * Called after fingerprint matching to detect cross-repo patterns.
 */
async function checkCrossRepoPattern(fingerprintHash, classification) {
  try {
    const fp = await query(
      'SELECT times_matched, error_pattern, dependency_context FROM fingerprints WHERE hash = $1',
      [fingerprintHash]
    );
    if (!fp.rows[0] || fp.rows[0].times_matched < 5) return;

    const ctx = fp.rows[0].dependency_context || {};
    const category = ctx.category || classification?.type || 'unknown';
    const pattern = fp.rows[0].error_pattern || '';

    const existing = await query(
      'SELECT id FROM network_predictions WHERE description = $1',
      [pattern.substring(0, 200)]
    );
    if (existing.rows[0]) {
      await query(
        'UPDATE network_predictions SET times_prevented = times_prevented + 1, last_triggered_at = NOW() WHERE id = $1',
        [existing.rows[0].id]
      );
      return;
    }

    const timesMatched = fp.rows[0].times_matched;
    const probability = Math.min(95, 50 + Math.floor(timesMatched / 2));

    await query(
      `INSERT INTO network_predictions (pattern_type, description, probability, category, based_on_prs, based_on_repos, times_prevented, suggestion)
       VALUES ($1, $2, $3, $4, $5, $6, 1, $7)`,
      [
        classification?.type || 'unknown',
        pattern.substring(0, 200),
        probability,
        category,
        timesMatched,
        Math.ceil(timesMatched / 3),
        `This pattern has been seen ${timesMatched} times. Consider checking your CI configuration.`,
      ]
    );
    logger.info('New network prediction created from cross-repo pattern', { hash: fingerprintHash, probability });
  } catch (err) {
    logger.debug('Cross-repo pattern check failed', { error: err.message });
  }
}

/**
 * Aggregate monthly genome stats. Run as a cron job or after each repair.
 */
async function aggregateMonthlyStats() {
  try {
    const currentMonth = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

    const stats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) AS new_patterns,
        SUM(times_matched) AS total_matches,
        ROUND(AVG(resolution_confidence)) AS avg_confidence
      FROM fingerprints
    `);

    const topCat = await query(`
      SELECT dependency_context->>'category' AS cat, COUNT(*) AS cnt
      FROM fingerprints
      WHERE dependency_context->>'category' IS NOT NULL
        AND created_at >= date_trunc('month', NOW())
      GROUP BY cat ORDER BY cnt DESC LIMIT 1
    `);

    const row = stats.rows[0];
    const topCategory = topCat.rows[0]?.cat || 'type_error';

    await query(
      `INSERT INTO genome_monthly_stats (month_year, new_patterns, total_matches, avg_confidence, top_category)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [currentMonth, parseInt(row.new_patterns) || 0, parseInt(row.total_matches) || 0,
       parseInt(row.avg_confidence) || 0, topCategory]
    );

    logger.info('Monthly genome stats aggregated', { month: currentMonth });
  } catch (err) {
    logger.debug('Monthly stats aggregation failed', { error: err.message });
  }
}

/**
 * Detect org preferences from PR modifications.
 * Compare original WarpFix patch with the merged version to find human edits.
 */
async function detectPreferenceFromPREdit({ userId, originalPatch, mergedPatch, classification }) {
  if (!originalPatch || !mergedPatch || originalPatch === mergedPatch) return;

  const rules = [];

  // Detect package manager preference
  if (originalPatch.includes('npm install') && mergedPatch.includes('pnpm')) {
    rules.push({ category: 'Package Manager', rule: 'Prefer pnpm over npm for dependency commands' });
  }
  if (originalPatch.includes('npm install') && mergedPatch.includes('yarn')) {
    rules.push({ category: 'Package Manager', rule: 'Prefer yarn over npm for dependency commands' });
  }

  // Detect lint fix preference
  if (originalPatch.includes('eslint-disable') && !mergedPatch.includes('eslint-disable')) {
    rules.push({ category: 'Linting', rule: 'Fix ESLint errors properly instead of using disable comments' });
  }

  // Detect type annotation preference
  if (originalPatch.includes(': any') && !mergedPatch.includes(': any')) {
    rules.push({ category: 'TypeScript', rule: 'Avoid using any type — prefer specific types' });
  }

  // Detect test style preference
  if (originalPatch.includes('.toBe(') && mergedPatch.includes('.toEqual(')) {
    rules.push({ category: 'Testing', rule: 'Prefer toEqual over toBe for object comparisons' });
  }

  for (const r of rules) {
    await captureOrgPreference({
      userId,
      category: r.category,
      rule: r.rule,
      source: 'pr_edit',
      confidence: 70,
    });
  }

  if (rules.length === 0 && originalPatch !== mergedPatch) {
    await captureOrgPreference({
      userId,
      category: classification?.type || 'general',
      rule: `Human edited WarpFix patch for ${classification?.type || 'unknown'} fix — review pattern`,
      source: 'pr_edit',
      confidence: 50,
    });
  }
}

module.exports = {
  recordTestResults,
  captureOrgPreference,
  updateNetworkPrediction,
  checkCrossRepoPattern,
  aggregateMonthlyStats,
  detectPreferenceFromPREdit,
  parseTestResults,
};

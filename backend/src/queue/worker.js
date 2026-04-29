require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Worker } = require('bullmq');
const { createRedisConnection } = require('./redis');
const { logger } = require('../utils/logger');
const { query } = require('../models/database');

// Agent pipeline
const { parseLog } = require('../agents/logParser');
const { classifyError } = require('../agents/classifier');
const { generateFingerprint } = require('../agents/fingerprint');
const { lookupFingerprint, storeFingerprint } = require('../agents/fingerprintStore');
const { generatePatch } = require('../agents/patchGenerator');
const { validateInSandbox } = require('../agents/sandboxValidator');
const { computeConfidence } = require('../agents/confidenceEngine');
const { createPullRequest } = require('../agents/pullRequestAgent');
const { recordTelemetry } = require('../services/telemetry');

async function processRepairJob(job) {
  const { jobId, type, repository, workflow_run, installation_id, user_id, context } = job.data;
  const startTime = Date.now();

  logger.info('Processing repair job', { jobId, type });

  try {
    // Step 1: Parse logs
    job.updateProgress(10);
    const logData = await parseLog({
      type,
      repository,
      workflow_run,
      installation_id,
      context,
    });

    // Step 2: Classify error
    job.updateProgress(20);
    const classification = await classifyError(logData);

    // Step 3: Generate fingerprint
    job.updateProgress(30);
    const fingerprint = generateFingerprint(logData, classification);

    // Step 4: Check fingerprint DB
    job.updateProgress(40);
    const existingFix = await lookupFingerprint(fingerprint.hash);

    let patch;
    if (existingFix && existingFix.resolution_patch) {
      logger.info('Fingerprint match found, reusing patch', { hash: fingerprint.hash });
      patch = existingFix.resolution_patch;
    } else {
      // Step 5: Generate patch via LLM
      job.updateProgress(50);
      patch = await generatePatch({
        logData,
        classification,
        repository,
        context,
      });
    }

    // Step 6: Validate patch in sandbox
    job.updateProgress(70);
    const sandboxResult = await validateInSandbox({
      patch,
      repository,
      installation_id,
    });

    // Step 7: Compute confidence
    job.updateProgress(80);
    const confidence = computeConfidence({
      sandboxPassed: sandboxResult.passed,
      patchSize: patch.length,
      fingerprintReuse: !!existingFix,
      classification,
    });

    // Step 8: Store failure record (auto-create repo if missing)
    let failureId = null;
    let repoId = null;
    if (repository) {
      const repoResult = await query(
        'SELECT id FROM repositories WHERE github_id = $1',
        [repository.id]
      );
      repoId = repoResult.rows[0]?.id;

      if (!repoId) {
        const insertRepo = await query(
          `INSERT INTO repositories (github_id, full_name, owner, name, default_branch, installation_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (github_id) DO UPDATE SET updated_at = NOW()
           RETURNING id`,
          [repository.id, repository.full_name, repository.owner, repository.name,
           repository.default_branch, installation_id]
        );
        repoId = insertRepo.rows[0]?.id;
        logger.info('Auto-created repository record', { repoId, full_name: repository.full_name });
      }

      if (repoId) {
        const failureResult = await query(
          `INSERT INTO failures (repository_id, workflow_run_id, error_message, stack_trace, failure_type, branch, commit_sha)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [repoId, workflow_run?.id, logData.errorMessage, logData.stackTrace,
           classification.type, workflow_run?.head_branch, workflow_run?.head_sha]
        );
        failureId = failureResult.rows[0].id;
      }
    }

    // Step 9: Store fingerprint
    const fingerprintId = await storeFingerprint(fingerprint, patch, confidence.score);

    // Step 10: Create PR if confidence is sufficient
    let prUrl = null;
    let prNumber = null;
    if (confidence.score >= 40 && sandboxResult.passed) {
      job.updateProgress(90);
      const prResult = await createPullRequest({
        patch,
        repository,
        installation_id,
        classification,
        confidence,
        fingerprint,
      });
      prUrl = prResult.url;
      prNumber = prResult.number;
    }

    // Step 11: Store repair record
    const duration = Date.now() - startTime;
    await query(
      `INSERT INTO repairs (failure_id, repository_id, user_id, fingerprint_id,
        patch_diff, patch_summary, confidence_score, sandbox_passed,
        pr_number, pr_url, status, engine_used, duration_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [failureId, repoId, user_id, fingerprintId, patch, classification.summary,
       confidence.score, sandboxResult.passed, prNumber, prUrl,
       sandboxResult.passed ? 'completed' : 'failed',
       classification.type, duration]
    );

    // Step 12: Increment usage
    if (user_id) {
      await query(
        'UPDATE users SET repairs_used_this_month = repairs_used_this_month + 1 WHERE id = $1',
        [user_id]
      );
    }

    // Step 13: Record telemetry
    await recordTelemetry(user_id, null, 'repair_completed', {
      type,
      confidence: confidence.score,
      sandbox_passed: sandboxResult.passed,
      duration_ms: duration,
      fingerprint_reused: !!existingFix,
    });

    job.updateProgress(100);

    return {
      status: 'completed',
      confidence: confidence.score,
      sandbox_passed: sandboxResult.passed,
      pr_url: prUrl,
      duration_ms: duration,
    };
  } catch (err) {
    logger.error('Repair job failed', { jobId, error: err.message, stack: err.stack });
    throw err;
  }
}

// Start worker
const worker = new Worker('repair-jobs', processRepairJob, {
  connection: createRedisConnection(),
  concurrency: 3,
  limiter: { max: 10, duration: 60000 },
});

worker.on('completed', (job, result) => {
  logger.info('Job completed', { jobId: job.id, result });
});

worker.on('failed', (job, err) => {
  logger.error('Job failed', { jobId: job?.id, error: err.message });
});

worker.on('error', (err) => {
  logger.error('Worker error', { error: err.message });
});

logger.info('WarpFix repair worker started');

module.exports = { worker };

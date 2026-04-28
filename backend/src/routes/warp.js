const express = require('express');
const { logger } = require('../utils/logger');
const { enqueueRepairJob } = require('../queue/producer');
const { query } = require('../models/database');
const { checkUsageLimit } = require('../middleware/auth');
const router = express.Router();

// Warp CLI commands hit this endpoint
router.post('/command', async (req, res) => {
  const {
    command,
    api_key,
    context = {},
  } = req.body;

  if (!api_key) {
    return res.status(401).json({ error: 'API key required. Run /warpfix-login first.' });
  }

  // Look up user by API key (stored as access_token for simplicity)
  const userResult = await query('SELECT * FROM users WHERE access_token = $1', [api_key]);
  const user = userResult.rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Usage limit check
  if (user.plan === 'free' && user.repairs_used_this_month >= 3) {
    return res.status(429).json({
      error: 'Monthly repair limit reached (3/3)',
      upgrade_url: `${process.env.APP_BASE_URL}/pricing`,
    });
  }

  logger.info('Warp command received', { command, user: user.username });

  const validCommands = ['fix-ci', 'fix-tests', 'fix-deps', 'fix-runtime', 'repair-last', 'predict-failure'];

  if (!validCommands.includes(command)) {
    return res.status(400).json({
      error: `Unknown command: ${command}`,
      valid_commands: validCommands,
    });
  }

  try {
    const jobData = {
      type: command,
      user_id: user.id,
      context: {
        git_branch: context.git_branch,
        language: context.language,
        package_manager: context.package_manager,
        runtime_version: context.runtime_version,
        recent_commands: context.recent_commands,
        repo_url: context.repo_url,
        cwd: context.cwd,
      },
    };

    if (command === 'predict-failure') {
      // Prediction doesn't count toward usage
      const alerts = await query(
        `SELECT da.* FROM dependency_alerts da
         JOIN repositories r ON r.id = da.repository_id
         WHERE r.user_id = $1 AND da.resolved = FALSE
         ORDER BY da.created_at DESC LIMIT 10`,
        [user.id]
      );
      return res.json({
        status: 'ok',
        command,
        predictions: alerts.rows,
      });
    }

    if (command === 'repair-last') {
      const lastRepair = await query(
        `SELECT * FROM repairs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [user.id]
      );
      if (lastRepair.rows[0]) {
        return res.json({ status: 'ok', command, repair: lastRepair.rows[0] });
      }
      return res.json({ status: 'ok', command, message: 'No previous repairs found' });
    }

    const jobId = await enqueueRepairJob(jobData);

    res.json({
      status: 'queued',
      command,
      job_id: jobId,
      message: `Repair job queued. Track at ${process.env.APP_BASE_URL}/repairs/${jobId}`,
    });
  } catch (err) {
    logger.error('Warp command error', { error: err.message, command });
    res.status(500).json({ error: 'Failed to process command' });
  }
});

// Get job status
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = await query('SELECT * FROM repairs WHERE id = $1', [jobId]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ status: 'ok', repair: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

module.exports = router;

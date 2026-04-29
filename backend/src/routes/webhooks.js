const express = require('express');
const crypto = require('crypto');
const { logger } = require('../utils/logger');
const { enqueueRepairJob } = require('../queue/producer');
const { query } = require('../models/database');
const router = express.Router();

function verifyGitHubSignature(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    logger.warn('GITHUB_WEBHOOK_SECRET not set, skipping verification');
    return next();
  }

  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(Buffer.isBuffer(req.body) ? req.body : body)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse raw body if needed
  if (Buffer.isBuffer(req.body)) {
    req.body = JSON.parse(req.body.toString());
  }

  next();
}

router.post('/github', verifyGitHubSignature, async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  logger.info('Webhook received', { event, action: payload.action });

  try {
    switch (event) {
      case 'workflow_run': {
        if (payload.action === 'completed' && payload.workflow_run.conclusion === 'failure') {
          const run = payload.workflow_run;
          const repo = payload.repository;

          // Skip warpfix branches to prevent repair loops
          if (run.head_branch && run.head_branch.startsWith('warpfix/')) {
            logger.info('Skipping warpfix branch failure (prevent repair loop)', {
              branch: run.head_branch,
              repo: repo.full_name,
            });
            break;
          }

          logger.info('CI failure detected', {
            repo: repo.full_name,
            workflow: run.name,
            branch: run.head_branch,
          });

          // Look up user_id from installation
          let userId = null;
          const installId = payload.installation?.id;
          if (installId) {
            const instResult = await query(
              `SELECT u.id FROM installations i
               JOIN users u ON u.username = i.account_login
               WHERE i.installation_id = $1`,
              [installId]
            );
            userId = instResult.rows[0]?.id || null;
          }

          await enqueueRepairJob({
            type: 'ci_failure',
            repository: {
              id: repo.id,
              full_name: repo.full_name,
              owner: repo.owner.login,
              name: repo.name,
              default_branch: repo.default_branch,
            },
            workflow_run: {
              id: run.id,
              name: run.name,
              head_branch: run.head_branch,
              head_sha: run.head_sha,
              logs_url: run.logs_url,
              jobs_url: run.jobs_url,
            },
            installation_id: installId,
            user_id: userId,
          });
        }
        break;
      }

      case 'installation': {
        if (payload.action === 'created') {
          const inst = payload.installation;
          await query(
            `INSERT INTO installations (installation_id, account_login, account_type, target_type, permissions, events)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (installation_id) DO UPDATE SET
               permissions = EXCLUDED.permissions,
               events = EXCLUDED.events,
               updated_at = NOW()`,
            [inst.id, inst.account.login, inst.account.type, inst.target_type,
             JSON.stringify(inst.permissions), JSON.stringify(inst.events)]
          );
          logger.info('Installation created', { id: inst.id, account: inst.account.login });
        }
        break;
      }

      case 'push':
      case 'pull_request':
        logger.info(`${event} event received`, { repo: payload.repository?.full_name });
        break;

      default:
        logger.debug('Unhandled event', { event });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error('Webhook processing error', { error: err.message, event });
    res.status(500).json({ error: 'Processing failed' });
  }
});

module.exports = router;

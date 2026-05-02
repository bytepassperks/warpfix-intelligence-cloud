const express = require('express');
const crypto = require('crypto');
const { logger } = require('../utils/logger');
const { enqueueRepairJob, enqueueReviewJob, enqueueChatJob } = require('../queue/producer');
const { query } = require('../models/database');
const { captureOrgPreference, detectPreferenceFromPREdit } = require('../agents/intelligenceGrowth');
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

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
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

          // Auto-save repos from the installation payload
          if (payload.repositories && payload.repositories.length > 0) {
            const userResult = await query(
              'SELECT id FROM users WHERE username = $1',
              [inst.account.login]
            );
            const userId = userResult.rows[0]?.id || null;

            for (const repo of payload.repositories) {
              await query(
                `INSERT INTO repositories (github_id, full_name, owner, name, default_branch, installation_id, user_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (github_id) DO UPDATE SET
                   full_name = EXCLUDED.full_name,
                   user_id = COALESCE(repositories.user_id, EXCLUDED.user_id),
                   installation_id = EXCLUDED.installation_id,
                   updated_at = NOW()`,
                [repo.id, repo.full_name, repo.full_name.split('/')[0], repo.name,
                 'main', String(inst.id), userId]
              );
            }
            logger.info('Saved repos from installation', { count: payload.repositories.length, account: inst.account.login });
          }
        }
        break;
      }

      case 'pull_request': {
        const pr = payload.pull_request;
        const repo = payload.repository;
        const installId = payload.installation?.id;

        // Capture org preferences when a WarpFix PR is closed/merged with edits
        if (payload.action === 'closed' && pr.merged && pr.head?.ref?.startsWith('warpfix/')) {
          logger.info('WarpFix PR merged — checking for org preference signals', {
            repo: repo.full_name, pr: pr.number,
          });

          let userId = null;
          if (installId) {
            const instResult = await query(
              `SELECT u.id FROM installations i JOIN users u ON u.username = i.account_login WHERE i.installation_id = $1`,
              [installId]
            );
            userId = instResult.rows[0]?.id || null;
          }

          if (userId) {
            const repair = await query(
              'SELECT patch_diff, engine_used FROM repairs WHERE pr_number = $1 ORDER BY created_at DESC LIMIT 1',
              [pr.number]
            );
            if (repair.rows[0]) {
              await detectPreferenceFromPREdit({
                userId,
                originalPatch: repair.rows[0].patch_diff,
                mergedPatch: pr.body || '',
                classification: { type: repair.rows[0].engine_used },
              });
            }

            await captureOrgPreference({
              userId,
              category: 'Workflow',
              rule: `Team merged WarpFix PR #${pr.number} — auto-repair accepted for ${repo.name}`,
              source: 'pr_merge',
              confidence: 60,
            });
          }
        }

        if (payload.action === 'opened' || payload.action === 'synchronize') {
          // Skip warpfix's own PRs
          if (pr.head?.ref?.startsWith('warpfix/')) {
            logger.info('Skipping review for warpfix PR', { branch: pr.head.ref });
            break;
          }

          logger.info('PR opened/updated — enqueuing review', {
            repo: repo.full_name, pr: pr.number, action: payload.action,
          });

          // Look up user_id
          let userId = null;
          if (installId) {
            const instResult = await query(
              `SELECT u.id FROM installations i
               JOIN users u ON u.username = i.account_login
               WHERE i.installation_id = $1`,
              [installId]
            );
            userId = instResult.rows[0]?.id || null;
          }

          await enqueueReviewJob({
            type: 'pr_review',
            repository: {
              id: repo.id,
              full_name: repo.full_name,
              owner: repo.owner.login,
              name: repo.name,
              default_branch: repo.default_branch,
            },
            pull_request: {
              number: pr.number,
              title: pr.title,
              body: pr.body,
              head_ref: pr.head?.ref,
              head_sha: pr.head?.sha,
              base_ref: pr.base?.ref,
              user_login: pr.user?.login,
              html_url: pr.html_url,
            },
            installation_id: installId,
            user_id: userId,
          });
        }
        break;
      }

      case 'issue_comment': {
        // Handle @warpfix mentions in PR comments
        if (payload.action === 'created' && payload.issue?.pull_request) {
          const body = payload.comment?.body || '';
          if (/@warpfix/i.test(body)) {
            const repo = payload.repository;
            const installId = payload.installation?.id;

            logger.info('@warpfix mention detected', {
              repo: repo.full_name, pr: payload.issue.number,
            });

            await enqueueChatJob({
              type: 'chat_mention',
              repository: {
                id: repo.id,
                full_name: repo.full_name,
                owner: repo.owner.login,
                name: repo.name,
                default_branch: repo.default_branch,
              },
              issue_number: payload.issue.number,
              comment: {
                id: payload.comment.id,
                body: payload.comment.body,
                user_login: payload.comment.user?.login,
              },
              installation_id: installId,
            });
          }
        }
        break;
      }

      case 'push':
        logger.info('Push event received', { repo: payload.repository?.full_name });
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

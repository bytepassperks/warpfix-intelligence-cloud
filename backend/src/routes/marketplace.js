const express = require('express');
const crypto = require('crypto');
const { logger } = require('../utils/logger');
const { query } = require('../models/database');
const router = express.Router();

/**
 * Verify the GitHub webhook signature for Marketplace events.
 * Uses the same GITHUB_WEBHOOK_SECRET as the App webhook.
 */
function verifyMarketplaceSignature(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    logger.warn('GITHUB_WEBHOOK_SECRET not set, skipping marketplace signature verification');
    return next();
  }

  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  if (Buffer.isBuffer(req.body)) {
    req.body = JSON.parse(req.body.toString());
  }

  next();
}

/**
 * Map a GitHub Marketplace plan name to the internal WarpFix plan key.
 * Marketplace plan names are configured in the listing; normalise them here.
 */
function resolveInternalPlan(marketplacePlan) {
  const name = (marketplacePlan?.name || '').toLowerCase();
  if (name.includes('team')) return 'team';
  if (name.includes('pro')) return 'pro';
  return 'free';
}

router.post('/', verifyMarketplaceSignature, async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;
  const action = payload.action;

  logger.info('Marketplace webhook received', { event, action });

  if (event !== 'marketplace_purchase') {
    return res.status(200).json({ received: true, skipped: true });
  }

  try {
    const purchase = payload.marketplace_purchase;
    const account = purchase?.account;
    const plan = purchase?.plan;

    if (!account || !plan) {
      logger.warn('Marketplace payload missing account or plan', { action });
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const githubId = account.id;
    const login = account.login;
    const internalPlan = resolveInternalPlan(plan);
    const effectiveDate = payload.effective_date || new Date().toISOString();

    switch (action) {
      case 'purchased': {
        logger.info('Marketplace purchase', { login, plan: plan.name, internalPlan });

        await query(
          `UPDATE users SET plan = $1, updated_at = NOW() WHERE github_id = $2`,
          [internalPlan, githubId]
        );

        await query(
          `INSERT INTO subscriptions (user_id, dodo_subscription_id, plan, status, current_period_start)
           SELECT u.id, $1, $2, 'active', $3
           FROM users u WHERE u.github_id = $4`,
          [`marketplace_${githubId}`, internalPlan, effectiveDate, githubId]
        );

        logger.info('User upgraded via Marketplace', { login, plan: internalPlan });
        break;
      }

      case 'changed': {
        logger.info('Marketplace plan changed', { login, plan: plan.name, internalPlan });

        await query(
          `UPDATE users SET plan = $1, updated_at = NOW() WHERE github_id = $2`,
          [internalPlan, githubId]
        );

        await query(
          `UPDATE subscriptions SET plan = $1, status = 'active', updated_at = NOW()
           WHERE user_id = (SELECT id FROM users WHERE github_id = $2)
             AND status = 'active'`,
          [internalPlan, githubId]
        );

        logger.info('User plan changed via Marketplace', { login, plan: internalPlan });
        break;
      }

      case 'cancelled': {
        logger.info('Marketplace cancellation', { login });

        await query(
          `UPDATE users SET plan = 'free', updated_at = NOW() WHERE github_id = $1`,
          [githubId]
        );

        await query(
          `UPDATE subscriptions SET status = 'cancelled', updated_at = NOW()
           WHERE user_id = (SELECT id FROM users WHERE github_id = $1)
             AND status = 'active'`,
          [githubId]
        );

        logger.info('User downgraded to free via Marketplace cancellation', { login });
        break;
      }

      case 'pending_change': {
        logger.info('Marketplace pending change', { login, plan: plan.name, effectiveDate });
        break;
      }

      case 'pending_change_cancelled': {
        logger.info('Marketplace pending change cancelled', { login });
        break;
      }

      default:
        logger.debug('Unhandled marketplace action', { action });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error('Marketplace webhook processing error', { error: err.message, action });
    res.status(500).json({ error: 'Processing failed' });
  }
});

module.exports = router;

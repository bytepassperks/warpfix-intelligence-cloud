const express = require('express');
const { query } = require('../models/database');
const { requireAuth } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const router = express.Router();

const PLANS = {
  free: { name: 'Free', repairs_per_month: 3, max_repos: 1, price_usd: 0 },
  pro: { name: 'Pro', repairs_per_month: 999999, max_repos: -1, price_usd: 12 },
  team: { name: 'Team', repairs_per_month: 999999, max_repos: -1, price_usd: 36 },
};

router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

router.get('/subscription', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
      [req.user.id, 'active']
    );
    res.json({
      subscription: result.rows[0] || null,
      current_plan: req.user.plan,
      usage: {
        repairs_used: req.user.repairs_used_this_month,
        repairs_limit: PLANS[req.user.plan]?.repairs_per_month || 3,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

router.post('/checkout', requireAuth, async (req, res) => {
  const { plan } = req.body;

  if (!PLANS[plan] || plan === 'free') {
    return res.status(400).json({ error: 'Invalid plan selection' });
  }

  try {
    // Dodo Payments integration
    const dodoApiKey = process.env.DODO_API_KEY;
    if (!dodoApiKey) {
      return res.status(503).json({ error: 'Billing service not configured' });
    }

    const response = await fetch('https://live.dodopayments.com/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dodoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billing: {
          city: '',
          country: 'US',
          state: '',
          street: '',
          zipcode: '',
        },
        customer: {
          email: req.user.email,
          name: req.user.username,
        },
        product_id: plan === 'pro'
          ? (process.env.DODO_PRO_PRODUCT_ID || 'pdt_0Ndi5McnUkYnmcneC5Lc7')
          : (process.env.DODO_TEAM_PRODUCT_ID || 'pdt_0Ndi5OJovSYC93Y51BlZ5'),
        quantity: 1,
        payment_link: true,
      }),
    });

    const data = await response.json();

    if (data.payment_link) {
      return res.json({ checkout_url: data.payment_link });
    }

    res.status(500).json({ error: 'Failed to create checkout session' });
  } catch (err) {
    logger.error('Checkout error', { error: err.message });
    res.status(500).json({ error: 'Billing service error' });
  }
});

// User-facing promo code application
router.post('/promo/apply', requireAuth, async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Promo code is required' });
  }

  try {
    // Look up the promo code
    const promoResult = await query(
      'SELECT * FROM promo_codes WHERE UPPER(code) = UPPER($1) AND active = true',
      [code.trim()]
    );
    const promo = promoResult.rows[0];
    if (!promo) {
      return res.status(404).json({ error: 'Invalid or expired promo code' });
    }

    // Check expiry
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This promo code has expired' });
    }

    // Check max redemptions
    if (promo.max_redemptions) {
      const countResult = await query(
        'SELECT COUNT(*) FROM promo_redemptions WHERE promo_id = $1',
        [promo.id]
      );
      if (parseInt(countResult.rows[0].count) >= promo.max_redemptions) {
        return res.status(400).json({ error: 'This promo code has reached its redemption limit' });
      }
    }

    // Check if user already redeemed this promo
    const alreadyRedeemed = await query(
      'SELECT id FROM promo_redemptions WHERE promo_id = $1 AND user_id = $2',
      [promo.id, req.user.id]
    );
    if (alreadyRedeemed.rows.length > 0) {
      return res.status(400).json({ error: 'You have already used this promo code' });
    }

    // Apply promo: if plan_override, upgrade the user's plan
    if (promo.plan_override && PLANS[promo.plan_override]) {
      await query('UPDATE users SET plan = $1 WHERE id = $2', [promo.plan_override, req.user.id]);
    }

    // Record the redemption
    await query(
      'INSERT INTO promo_redemptions (promo_id, user_id) VALUES ($1, $2)',
      [promo.id, req.user.id]
    );

    logger.info('User applied promo', { userId: req.user.id, code: promo.code, plan_override: promo.plan_override });

    const message = promo.plan_override
      ? `Promo applied! You've been upgraded to the ${PLANS[promo.plan_override].name} plan.`
      : promo.discount_type === 'percentage'
        ? `Promo applied! ${promo.discount_value}% discount activated.`
        : `Promo applied! $${promo.discount_value} discount activated.`;

    res.json({
      message,
      plan_override: promo.plan_override || null,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
    });
  } catch (err) {
    logger.error('Promo apply error', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to apply promo code. Please try again.' });
  }
});

// Dodo Payments webhook
router.post('/webhook/dodo', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secret = process.env.DODO_WEBHOOK_SECRET;
    if (secret) {
      const crypto = require('crypto');
      const signature = req.headers['x-dodo-signature'];
      if (!signature) {
        return res.status(401).json({ error: 'Missing webhook signature' });
      }
      const bodyStr = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
      const expected = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');
      // Validate signature is valid hex before comparing
      if (!/^[0-9a-f]+$/i.test(signature) || signature.length !== expected.length) {
        return res.status(401).json({ error: 'Invalid webhook signature format' });
      }
      const sigBuf = Buffer.from(signature, 'hex');
      const expBuf = Buffer.from(expected, 'hex');
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) :
                  Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;

    logger.info('Dodo webhook received', { type: event.type });

    if (event.type === 'subscription.active') {
      const sub = event.data;
      await query(
        `INSERT INTO subscriptions (user_id, dodo_subscription_id, plan, status, current_period_start, current_period_end)
         SELECT u.id, $1, $2, 'active', $3, $4
         FROM users u WHERE u.email = $5`,
        [sub.subscription_id, sub.product_id, sub.current_period_start, sub.current_period_end, sub.customer.email]
      );
      const plan = sub.product_id === (process.env.DODO_PRO_PRODUCT_ID || 'pdt_0Ndi5McnUkYnmcneC5Lc7') ? 'pro' : 'team';
      await query(
        "UPDATE users SET plan = $1 WHERE email = $2",
        [plan, sub.customer.email]
      );
      logger.info('User upgraded via Dodo subscription', { email: sub.customer.email, plan });
    }

    if (event.type === 'subscription.cancelled' || event.type === 'subscription.expired') {
      const sub = event.data;
      await query(
        `UPDATE subscriptions SET status = $1, updated_at = NOW()
         WHERE dodo_subscription_id = $2`,
        [event.type === 'subscription.cancelled' ? 'cancelled' : 'expired', sub.subscription_id]
      );
      await query(
        "UPDATE users SET plan = 'free' WHERE email = $1",
        [sub.customer.email]
      );
      logger.info('User downgraded to free via Dodo subscription event', { email: sub.customer.email, type: event.type });
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('Dodo webhook error', { error: err.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;

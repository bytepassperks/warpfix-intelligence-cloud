const express = require('express');
const { query } = require('../models/database');
const { requireAuth } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const router = express.Router();

const PLANS = {
  free: { name: 'Free', repairs_per_month: 3, price_inr: 0 },
  pro: { name: 'Pro', repairs_per_month: 999999, price_inr: 999 },
  team: { name: 'Team', repairs_per_month: 999999, price_inr: 2999 },
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
          country: 'IN',
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
      const bodyStr = Buffer.isBuffer(req.body) ? req.body.toString() : req.body;
      const expected = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');
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
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('Dodo webhook error', { error: err.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;

const express = require('express');
const { query } = require('../models/database');
const { hashPassword, verifyPassword, generateToken, requireAdmin, requireSuperAdmin } = require('../middleware/adminAuth');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

/* ─── Tier definitions ─── */
const TIER_LIMITS = {
  free:  { repairs_per_month: 3,  repos: 1,    reviews: false, security: false, pr_split: false, dead_code: false, test_coverage: false, tech_debt: false, quality_gates: false, dependency_radar: false, predictive_ci: false, chat_agent: false },
  pro:   { repairs_per_month: -1, repos: -1,   reviews: true,  security: true,  pr_split: true,  dead_code: true,  test_coverage: true,  tech_debt: false, quality_gates: true,  dependency_radar: true,  predictive_ci: true,  chat_agent: true },
  team:  { repairs_per_month: -1, repos: -1,   reviews: true,  security: true,  pr_split: true,  dead_code: true,  test_coverage: true,  tech_debt: true,  quality_gates: true,  dependency_radar: true,  predictive_ci: true,  chat_agent: true },
};

/* ─────────────────────────────────────────────────
   AUTH
   ───────────────────────────────────────────────── */

// POST /admin/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const result = await query('SELECT * FROM admins WHERE email = $1 AND active = true', [email]);
    const admin = result.rows[0];
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await query('UPDATE admins SET last_login_at = NOW() WHERE id = $1', [admin.id]);

    const token = generateToken(admin);
    const { password_hash, ...safeAdmin } = admin;
    res.json({ token, admin: safeAdmin });
  } catch (err) {
    logger.error('Admin login error', { error: err.message });
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /admin/me
router.get('/me', requireAdmin, async (req, res) => {
  try {
    const result = await query('SELECT id, email, name, role, last_login_at, created_at FROM admins WHERE id = $1', [req.admin.id]);
    res.json({ admin: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin info' });
  }
});

/* ─────────────────────────────────────────────────
   DASHBOARD STATS
   ───────────────────────────────────────────────── */

// GET /admin/stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [users, repos, repairs, reviews, promos] = await Promise.all([
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL \'30 days\') as new_30d FROM users'),
      query('SELECT COUNT(*) as total FROM repositories'),
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'completed\') as completed, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL \'30 days\') as last_30d FROM repairs'),
      query('SELECT COUNT(*) as total FROM reviews'),
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE active = true) as active FROM promo_codes'),
    ]);

    const tierBreakdown = await query("SELECT plan, COUNT(*) as count FROM users GROUP BY plan ORDER BY plan");
    const recentSignups = await query("SELECT id, username, email, plan, created_at FROM users ORDER BY created_at DESC LIMIT 10");

    res.json({
      users: { total: parseInt(users.rows[0].total), new_30d: parseInt(users.rows[0].new_30d) },
      repositories: { total: parseInt(repos.rows[0].total) },
      repairs: { total: parseInt(repairs.rows[0].total), completed: parseInt(repairs.rows[0].completed), last_30d: parseInt(repairs.rows[0].last_30d) },
      reviews: { total: parseInt(reviews.rows[0].total) },
      promos: { total: parseInt(promos.rows[0].total), active: parseInt(promos.rows[0].active) },
      tier_breakdown: tierBreakdown.rows,
      recent_signups: recentSignups.rows,
    });
  } catch (err) {
    logger.error('Admin stats error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/* ─────────────────────────────────────────────────
   USER MANAGEMENT
   ───────────────────────────────────────────────── */

// GET /admin/users
router.get('/users', requireAdmin, async (req, res) => {
  const { page = 1, limit = 50, search, plan, sort = 'created_at', order = 'desc' } = req.query;
  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (plan) {
      whereClause += ` AND plan = $${paramIndex}`;
      params.push(plan);
      paramIndex++;
    }

    const allowedSorts = ['created_at', 'username', 'email', 'plan', 'repairs_used_this_month'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    const countResult = await query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT id, github_id, username, email, avatar_url, plan, repairs_used_this_month, created_at, updated_at
       FROM users ${whereClause} ORDER BY ${sortCol} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ users: result.rows, total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error('Admin list users error', { error: err.message });
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// GET /admin/users/:id
router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await query(
      `SELECT u.*, 
        (SELECT COUNT(*) FROM repositories r WHERE r.user_id = u.id) as repo_count,
        (SELECT COUNT(*) FROM repairs rp WHERE rp.user_id = u.id) as repair_count,
        (SELECT COUNT(*) FROM reviews rv WHERE rv.user_id = u.id) as review_count
       FROM users u WHERE u.id = $1`,
      [req.params.id]
    );
    if (!user.rows[0]) return res.status(404).json({ error: 'User not found' });

    const { access_token, ...safeUser } = user.rows[0];
    const repos = await query('SELECT id, full_name, language, created_at FROM repositories WHERE user_id = $1 ORDER BY created_at DESC', [req.params.id]);
    const recentRepairs = await query('SELECT id, status, confidence_score, created_at FROM repairs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10', [req.params.id]);
    const subscription = await query('SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1', [req.params.id, 'active']);

    res.json({ user: safeUser, repositories: repos.rows, recent_repairs: recentRepairs.rows, subscription: subscription.rows[0] || null });
  } catch (err) {
    logger.error('Admin get user error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /admin/users  — create user manually
router.post('/users', requireAdmin, async (req, res) => {
  const { username, email, plan = 'free', github_id } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email required' });
  }

  try {
    const ghId = github_id || Math.floor(Math.random() * 900000000) + 100000000;
    const result = await query(
      `INSERT INTO users (github_id, username, email, plan) VALUES ($1, $2, $3, $4) RETURNING id, github_id, username, email, plan, created_at`,
      [ghId, username, email, plan]
    );
    logger.info('Admin created user', { admin: req.admin.email, userId: result.rows[0].id });
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'User already exists' });
    logger.error('Admin create user error', { error: err.message });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /admin/users/:id  — update user
router.patch('/users/:id', requireAdmin, async (req, res) => {
  const { plan, email, username, repairs_used_this_month } = req.body;
  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (plan !== undefined) { updates.push(`plan = $${paramIndex}`); params.push(plan); paramIndex++; }
  if (email !== undefined) { updates.push(`email = $${paramIndex}`); params.push(email); paramIndex++; }
  if (username !== undefined) { updates.push(`username = $${paramIndex}`); params.push(username); paramIndex++; }
  if (repairs_used_this_month !== undefined) { updates.push(`repairs_used_this_month = $${paramIndex}`); params.push(repairs_used_this_month); paramIndex++; }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  updates.push(`updated_at = NOW()`);

  try {
    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, username, email, plan, repairs_used_this_month, updated_at`,
      [...params, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    logger.info('Admin updated user', { admin: req.admin.email, userId: req.params.id, updates: req.body });
    res.json({ user: result.rows[0] });
  } catch (err) {
    logger.error('Admin update user error', { error: err.message });
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PATCH /admin/users/:id/tier  — change user tier specifically
router.patch('/users/:id/tier', requireAdmin, async (req, res) => {
  const { plan } = req.body;
  if (!plan || !TIER_LIMITS[plan]) {
    return res.status(400).json({ error: 'Invalid plan. Must be: free, pro, or team' });
  }

  try {
    const result = await query(
      'UPDATE users SET plan = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, plan',
      [plan, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });

    // Also update subscription record
    await query(
      `INSERT INTO subscriptions (user_id, plan, status) VALUES ($1, $2, 'active')
       ON CONFLICT (user_id) DO UPDATE SET plan = $2, status = 'active', updated_at = NOW()`,
      [req.params.id, plan]
    ).catch(() => {});

    logger.info('Admin changed user tier', { admin: req.admin.email, userId: req.params.id, plan });
    res.json({ user: result.rows[0], tier_limits: TIER_LIMITS[plan] });
  } catch (err) {
    logger.error('Admin tier change error', { error: err.message });
    res.status(500).json({ error: 'Failed to change tier' });
  }
});

// POST /admin/users/:id/reset-password  — not applicable for GitHub OAuth users, but for admin-created users
router.post('/users/:id/reset-usage', requireAdmin, async (req, res) => {
  try {
    const result = await query(
      'UPDATE users SET repairs_used_this_month = 0, updated_at = NOW() WHERE id = $1 RETURNING id, username, repairs_used_this_month',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    logger.info('Admin reset user usage', { admin: req.admin.email, userId: req.params.id });
    res.json({ user: result.rows[0], message: 'Usage reset to 0' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset usage' });
  }
});

// DELETE /admin/users/:id
router.delete('/users/:id', requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id, username', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    logger.info('Admin deleted user', { admin: req.admin.email, userId: req.params.id });
    res.json({ message: 'User deleted', user: result.rows[0] });
  } catch (err) {
    logger.error('Admin delete user error', { error: err.message });
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/* ─────────────────────────────────────────────────
   PROMO CODE MANAGEMENT
   ───────────────────────────────────────────────── */

// GET /admin/promos
router.get('/promos', requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, 
        (SELECT COUNT(*) FROM promo_redemptions pr WHERE pr.promo_id = p.id) as times_redeemed
       FROM promo_codes p ORDER BY p.created_at DESC`
    );
    res.json({ promos: result.rows });
  } catch (err) {
    logger.error('Admin list promos error', { error: err.message });
    res.status(500).json({ error: 'Failed to list promos' });
  }
});

// POST /admin/promos  — create promo
router.post('/promos', requireAdmin, async (req, res) => {
  const { code, description, discount_type, discount_value, plan_override, max_redemptions, expires_at } = req.body;
  if (!code) return res.status(400).json({ error: 'Promo code required' });

  try {
    const result = await query(
      `INSERT INTO promo_codes (code, description, discount_type, discount_value, plan_override, max_redemptions, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [code.toUpperCase(), description || '', discount_type || 'percentage', discount_value || 0, plan_override || null, max_redemptions || null, expires_at || null, req.admin.id]
    );
    logger.info('Admin created promo', { admin: req.admin.email, code });
    res.status(201).json({ promo: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Promo code already exists' });
    logger.error('Admin create promo error', { error: err.message });
    res.status(500).json({ error: 'Failed to create promo' });
  }
});

// PATCH /admin/promos/:id  — update promo
router.patch('/promos/:id', requireAdmin, async (req, res) => {
  const { active, description, discount_value, max_redemptions, expires_at } = req.body;
  const updates = [];
  const params = [];
  let idx = 1;

  if (active !== undefined) { updates.push(`active = $${idx}`); params.push(active); idx++; }
  if (description !== undefined) { updates.push(`description = $${idx}`); params.push(description); idx++; }
  if (discount_value !== undefined) { updates.push(`discount_value = $${idx}`); params.push(discount_value); idx++; }
  if (max_redemptions !== undefined) { updates.push(`max_redemptions = $${idx}`); params.push(max_redemptions); idx++; }
  if (expires_at !== undefined) { updates.push(`expires_at = $${idx}`); params.push(expires_at); idx++; }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  try {
    const result = await query(
      `UPDATE promo_codes SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      [...params, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Promo not found' });
    res.json({ promo: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update promo' });
  }
});

// DELETE /admin/promos/:id
router.delete('/promos/:id', requireAdmin, async (req, res) => {
  try {
    const result = await query('DELETE FROM promo_codes WHERE id = $1 RETURNING id, code', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Promo not found' });
    res.json({ message: 'Promo deleted', promo: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete promo' });
  }
});

// POST /admin/promos/:id/apply  — apply promo to a user
router.post('/promos/:id/apply', requireAdmin, async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  try {
    const promo = await query('SELECT * FROM promo_codes WHERE id = $1 AND active = true', [req.params.id]);
    if (!promo.rows[0]) return res.status(404).json({ error: 'Promo not found or inactive' });

    const p = promo.rows[0];
    if (p.expires_at && new Date(p.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Promo has expired' });
    }

    if (p.max_redemptions) {
      const redeemed = await query('SELECT COUNT(*) FROM promo_redemptions WHERE promo_id = $1', [p.id]);
      if (parseInt(redeemed.rows[0].count) >= p.max_redemptions) {
        return res.status(400).json({ error: 'Promo redemption limit reached' });
      }
    }

    // Apply plan override if set
    if (p.plan_override) {
      await query('UPDATE users SET plan = $1, updated_at = NOW() WHERE id = $2', [p.plan_override, user_id]);
    }

    await query(
      'INSERT INTO promo_redemptions (promo_id, user_id, applied_by) VALUES ($1, $2, $3)',
      [p.id, user_id, req.admin.id]
    );

    logger.info('Admin applied promo', { admin: req.admin.email, promo: p.code, userId: user_id });
    res.json({ message: 'Promo applied', promo_code: p.code, plan_override: p.plan_override });
  } catch (err) {
    logger.error('Admin apply promo error', { error: err.message });
    res.status(500).json({ error: 'Failed to apply promo' });
  }
});

/* ─────────────────────────────────────────────────
   TIER / FEATURE CONFIG
   ───────────────────────────────────────────────── */

// GET /admin/tiers
router.get('/tiers', requireAdmin, (req, res) => {
  res.json({ tiers: TIER_LIMITS });
});

/* ─────────────────────────────────────────────────
   ADMIN MANAGEMENT (super_admin only)
   ───────────────────────────────────────────────── */

// GET /admin/admins
router.get('/admins', requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const result = await query('SELECT id, email, name, role, active, last_login_at, created_at FROM admins ORDER BY created_at');
    res.json({ admins: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list admins' });
  }
});

// POST /admin/admins  — create new admin
router.post('/admins', requireAdmin, requireSuperAdmin, async (req, res) => {
  const { email, password, name, role = 'admin' } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const hash = await hashPassword(password);
    const result = await query(
      'INSERT INTO admins (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [email, hash, name || '', role]
    );
    logger.info('Super admin created admin', { admin: req.admin.email, newAdmin: email });
    res.status(201).json({ admin: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Admin with this email already exists' });
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// PATCH /admin/admins/:id/password
router.patch('/admins/:id/password', requireAdmin, async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // Only super_admin can change other admin passwords; admins can change their own
  if (req.admin.id !== req.params.id && req.admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'Cannot change another admin\'s password' });
  }

  try {
    const hash = await hashPassword(new_password);
    await query('UPDATE admins SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

/* ─────────────────────────────────────────────────
   ACTIVITY LOG
   ───────────────────────────────────────────────── */

// GET /admin/activity
router.get('/activity', requireAdmin, async (req, res) => {
  const { limit = 50 } = req.query;
  try {
    const result = await query(
      `SELECT al.*, a.email as admin_email FROM admin_activity_log al
       LEFT JOIN admins a ON al.admin_id = a.id
       ORDER BY al.created_at DESC LIMIT $1`,
      [limit]
    );
    res.json({ activity: result.rows });
  } catch (err) {
    logger.error('Admin activity log error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

/* ─────────────────────────────────────────────────
   BULK OPERATIONS
   ───────────────────────────────────────────────── */

// POST /admin/users/bulk-tier
router.post('/users/bulk-tier', requireAdmin, async (req, res) => {
  const { user_ids, plan } = req.body;
  if (!user_ids || !Array.isArray(user_ids) || !plan || !TIER_LIMITS[plan]) {
    return res.status(400).json({ error: 'user_ids array and valid plan required' });
  }

  try {
    const result = await query(
      'UPDATE users SET plan = $1, updated_at = NOW() WHERE id = ANY($2) RETURNING id, username, plan',
      [plan, user_ids]
    );
    logger.info('Admin bulk tier change', { admin: req.admin.email, count: result.rowCount, plan });
    res.json({ updated: result.rows, count: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: 'Bulk tier update failed' });
  }
});

// POST /admin/users/bulk-reset-usage
router.post('/users/bulk-reset-usage', requireAdmin, async (req, res) => {
  try {
    const result = await query('UPDATE users SET repairs_used_this_month = 0, updated_at = NOW()');
    logger.info('Admin reset all usage counters', { admin: req.admin.email, count: result.rowCount });
    res.json({ message: 'All usage counters reset', count: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: 'Bulk reset failed' });
  }
});

module.exports = router;

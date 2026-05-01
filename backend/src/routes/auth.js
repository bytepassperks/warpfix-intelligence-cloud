const express = require('express');
const passport = require('passport');
const { logger } = require('../utils/logger');
const router = express.Router();

router.get('/github', passport.authenticate('github', { scope: ['user:email', 'repo'] }));

router.get('/github/callback', (req, res, next) => {
  passport.authenticate('github', (err, user, info) => {
    if (err) {
      logger.error('OAuth callback error', { error: err.message, stack: err.stack });
      return res.redirect(
        `${process.env.APP_BASE_URL || 'http://localhost:3000'}/auth-error?error=oauth_error`
      );
    }
    if (!user) {
      logger.warn('OAuth callback: no user returned', { info });
      return res.redirect(
        `${process.env.APP_BASE_URL || 'http://localhost:3000'}/auth-error?error=authentication_failed`
      );
    }
    req.login(user, (loginErr) => {
      if (loginErr) {
        logger.error('Session login error', { error: loginErr.message, stack: loginErr.stack });
        return res.redirect(
          `${process.env.APP_BASE_URL || 'http://localhost:3000'}/auth-error?error=session_error`
        );
      }
      logger.info('OAuth login successful', { userId: user.id, username: user.username });
      res.redirect(`${process.env.APP_BASE_URL || 'http://localhost:3000'}/dashboard`);
    });
  })(req, res, next);
});

router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { access_token, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

router.post('/cli-key', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const crypto = require('crypto');
  const { query } = require('../models/database');
  const key = `wf_${crypto.randomBytes(24).toString('hex')}`;
  query('UPDATE users SET cli_api_key = $1 WHERE id = $2', [key, req.user.id])
    .then(() => res.json({ cli_api_key: key }))
    .catch(() => res.status(500).json({ error: 'Failed to generate key' }));
});

router.get('/cli-key', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { query } = require('../models/database');
  query('SELECT cli_api_key FROM users WHERE id = $1', [req.user.id])
    .then(r => res.json({ cli_api_key: r.rows[0]?.cli_api_key || null }))
    .catch(() => res.status(500).json({ error: 'Failed to fetch key' }));
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out' });
  });
});

router.get('/failure', (req, res) => {
  res.status(401).json({ error: 'GitHub authentication failed' });
});

module.exports = router;

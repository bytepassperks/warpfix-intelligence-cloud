const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/github', passport.authenticate('github', { scope: ['user:email', 'repo'] }));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/auth/failure' }),
  (req, res) => {
    res.redirect(`${process.env.APP_BASE_URL || 'http://localhost:3000'}/dashboard`);
  }
);

router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { access_token, ...safeUser } = req.user;
  res.json({ user: safeUser });
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

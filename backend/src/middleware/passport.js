const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const { query } = require('../models/database');
const { logger } = require('../utils/logger');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.API_BASE_URL || 'http://localhost:4000'}/auth/github/callback`,
      scope: ['user:email', 'repo'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || null;
        const result = await query(
          `INSERT INTO users (github_id, username, email, avatar_url, access_token)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (github_id) DO UPDATE SET
             username = EXCLUDED.username,
             email = EXCLUDED.email,
             avatar_url = EXCLUDED.avatar_url,
             access_token = EXCLUDED.access_token,
             updated_at = NOW()
           RETURNING *`,
          [profile.id, profile.username, email, profile._json.avatar_url, accessToken]
        );
        done(null, result.rows[0]);
      } catch (err) {
        logger.error('GitHub OAuth error', { error: err.message });
        done(err, null);
      }
    }
  ));
} else {
  logger.warn('GitHub OAuth not configured — GITHUB_CLIENT_ID/SECRET missing');
}

const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const { query } = require('../models/database');
const { logger } = require('../utils/logger');

const githubCallbackURL = `${process.env.API_BASE_URL || 'http://localhost:4000'}/auth/github/callback`;
const githubStrategyRegistered = Boolean(
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
);
const githubOAuthConfigured = githubStrategyRegistered;

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    logger.warn('Failed to deserialize user; treating request as unauthenticated', {
      userId: id,
      error: err.message,
      stack: err.stack,
    });
    done(null, false);
  }
});

if (githubStrategyRegistered) {
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: githubCallbackURL,
      scope: ['repo'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        logger.info('OAuth verify callback', { githubId: profile.id, username: profile.username });
        const email = profile.emails?.[0]?.value || profile._json?.email || null;
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
          [parseInt(profile.id, 10), profile.username, email, profile._json.avatar_url, accessToken]
        );
        logger.info('User upserted successfully', { userId: result.rows[0]?.id });
        done(null, result.rows[0]);
      } catch (err) {
        logger.error('GitHub OAuth verify error', { error: err.message, stack: err.stack, githubId: profile.id });
        done(err, null);
      }
    }
  ));
} else {
  const missing = [];
  if (!process.env.GITHUB_CLIENT_ID) missing.push('GITHUB_CLIENT_ID');
  if (!process.env.GITHUB_CLIENT_SECRET) missing.push('GITHUB_CLIENT_SECRET');
  logger.error('GitHub OAuth not configured', { missing });
}

module.exports = { githubStrategyRegistered, githubCallbackURL };

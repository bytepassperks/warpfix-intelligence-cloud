const { Pool } = require('pg');
const { logger } = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err.message });
});

async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text: text.substring(0, 80), duration, rows: result.rowCount });
    return result;
  } catch (err) {
    logger.error('Query error', { text: text.substring(0, 80), error: err.message });
    throw err;
  }
}

async function initDatabase() {
  try {
    await pool.query('SELECT NOW()');
    logger.info('Database connection established');
    await runMigrations();
  } catch (err) {
    logger.warn('Database not available, running in degraded mode', { error: err.message });
  }
}

async function runMigrations() {
  const migrations = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      github_id INTEGER UNIQUE NOT NULL,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      avatar_url TEXT,
      access_token TEXT,
      plan VARCHAR(50) DEFAULT 'free',
      repairs_used_this_month INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS repositories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      github_id INTEGER UNIQUE NOT NULL,
      owner VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      full_name VARCHAR(512) NOT NULL,
      default_branch VARCHAR(255) DEFAULT 'main',
      language VARCHAR(100),
      installation_id VARCHAR(255),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS installations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      installation_id INTEGER UNIQUE NOT NULL,
      account_login VARCHAR(255) NOT NULL,
      account_type VARCHAR(50) NOT NULL,
      target_type VARCHAR(50),
      permissions JSONB,
      events JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS failures (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
      workflow_run_id BIGINT,
      job_name VARCHAR(255),
      error_message TEXT,
      stack_trace TEXT,
      log_url TEXT,
      failure_type VARCHAR(100),
      branch VARCHAR(255),
      commit_sha VARCHAR(40),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS fingerprints (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      hash VARCHAR(64) UNIQUE NOT NULL,
      error_pattern TEXT NOT NULL,
      dependency_context JSONB,
      runtime_version VARCHAR(50),
      resolution_patch TEXT,
      resolution_confidence INTEGER,
      times_matched INTEGER DEFAULT 1,
      last_matched_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS repairs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      failure_id UUID REFERENCES failures(id) ON DELETE CASCADE,
      repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      fingerprint_id UUID REFERENCES fingerprints(id) ON DELETE SET NULL,
      patch_diff TEXT,
      patch_summary TEXT,
      confidence_score INTEGER,
      sandbox_passed BOOLEAN DEFAULT FALSE,
      pr_number INTEGER,
      pr_url TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      engine_used VARCHAR(100),
      duration_ms INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      dodo_subscription_id VARCHAR(255),
      plan VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      current_period_start TIMESTAMPTZ,
      current_period_end TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS dependency_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
      package_name VARCHAR(255) NOT NULL,
      current_version VARCHAR(50),
      breaking_version VARCHAR(50),
      severity VARCHAR(50),
      description TEXT,
      resolved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS telemetry_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      repository_id UUID REFERENCES repositories(id) ON DELETE SET NULL,
      metric_type VARCHAR(100) NOT NULL,
      metric_value JSONB NOT NULL,
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      pr_number INTEGER NOT NULL,
      pr_url TEXT,
      pr_title TEXT,
      review_data JSONB,
      inline_comments_count INTEGER DEFAULT 0,
      summary TEXT,
      risk_level VARCHAR(50),
      review_effort_level INTEGER,
      status VARCHAR(50) DEFAULT 'completed',
      duration_ms INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS review_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
      file_path TEXT NOT NULL,
      line_number INTEGER,
      severity VARCHAR(50) NOT NULL,
      category VARCHAR(100),
      comment TEXT NOT NULL,
      suggestion TEXT,
      verified BOOLEAN DEFAULT FALSE,
      github_comment_id BIGINT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS learnings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
      rule TEXT NOT NULL,
      category VARCHAR(100) DEFAULT 'general',
      context TEXT,
      source VARCHAR(100) DEFAULT 'manual',
      active BOOLEAN DEFAULT TRUE,
      times_applied INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS repo_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
      config_yaml TEXT,
      config_json JSONB,
      review_profile VARCHAR(50) DEFAULT 'assertive',
      auto_review BOOLEAN DEFAULT TRUE,
      auto_repair BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_failures_repository ON failures(repository_id);
    CREATE INDEX IF NOT EXISTS idx_failures_created ON failures(created_at);
    CREATE INDEX IF NOT EXISTS idx_repairs_repository ON repairs(repository_id);
    CREATE INDEX IF NOT EXISTS idx_repairs_user ON repairs(user_id);
    CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
    CREATE INDEX IF NOT EXISTS idx_fingerprints_hash ON fingerprints(hash);
    CREATE INDEX IF NOT EXISTS idx_telemetry_user ON telemetry_metrics(user_id);
    CREATE INDEX IF NOT EXISTS idx_telemetry_type ON telemetry_metrics(metric_type);
    CREATE INDEX IF NOT EXISTS idx_dependency_alerts_repo ON dependency_alerts(repository_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_repository ON reviews(repository_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_pr ON reviews(pr_number);
    CREATE INDEX IF NOT EXISTS idx_review_comments_review ON review_comments(review_id);
    CREATE INDEX IF NOT EXISTS idx_learnings_user ON learnings(user_id);
    CREATE INDEX IF NOT EXISTS idx_learnings_repo ON learnings(repository_id);
    CREATE INDEX IF NOT EXISTS idx_repo_configs_repo ON repo_configs(repository_id);
  `;

  try {
    await pool.query(migrations);

    // Add columns that may be missing from older schema
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE repositories ADD COLUMN IF NOT EXISTS installation_id VARCHAR(255);
        ALTER TABLE repositories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    logger.info('Database migrations completed successfully');
  } catch (err) {
    logger.error('Migration failed', { error: err.message });
  }
}

module.exports = { pool, query, initDatabase };

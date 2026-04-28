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
  } catch (err) {
    logger.warn('Database not available, running in degraded mode', { error: err.message });
  }
}

module.exports = { pool, query, initDatabase };

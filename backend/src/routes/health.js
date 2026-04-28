const express = require('express');
const { pool } = require('../models/database');
const router = express.Router();

router.get('/', async (req, res) => {
  const checks = { api: 'ok', database: 'unknown', redis: 'unknown' };

  try {
    await pool.query('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  try {
    const { getRedisClient } = require('../queue/redis');
    const redis = getRedisClient();
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'unavailable';
  }

  const allOk = checks.database === 'ok';
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'healthy' : 'degraded',
    checks,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

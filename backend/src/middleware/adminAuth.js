const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../models/database');
const { logger } = require('../utils/logger');

const JWT_SECRET = process.env.ADMIN_JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: ADMIN_JWT_SECRET not set — generating ephemeral secret. Set ADMIN_JWT_SECRET for persistent admin sessions.');
}
const ADMIN_SECRET = JWT_SECRET || require('crypto').randomBytes(32).toString('hex');
const JWT_EXPIRY = '24h';

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function generateToken(admin) {
  return jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    ADMIN_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ADMIN_SECRET);
    if (decoded.role !== 'super_admin' && decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient admin privileges' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    logger.warn('Invalid admin token', { error: err.message });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireSuperAdmin(req, res, next) {
  if (!req.admin || req.admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
}

module.exports = { hashPassword, verifyPassword, generateToken, requireAdmin, requireSuperAdmin };

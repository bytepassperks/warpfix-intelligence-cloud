const { query } = require('../models/database');
const { logger } = require('../utils/logger');

async function lookupFingerprint(hash) {
  try {
    const result = await query(
      'SELECT * FROM fingerprints WHERE hash = $1',
      [hash]
    );

    if (result.rows[0]) {
      await query(
        'UPDATE fingerprints SET times_matched = times_matched + 1, last_matched_at = NOW() WHERE hash = $1',
        [hash]
      );
      logger.info('Fingerprint match', { hash, times_matched: result.rows[0].times_matched + 1 });
      return result.rows[0];
    }

    return null;
  } catch (err) {
    logger.error('Fingerprint lookup error', { error: err.message });
    return null;
  }
}

async function storeFingerprint(fingerprint, resolutionPatch, confidence) {
  try {
    const result = await query(
      `INSERT INTO fingerprints (hash, error_pattern, resolution_patch, resolution_confidence)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (hash) DO UPDATE SET
         resolution_patch = CASE
           WHEN EXCLUDED.resolution_confidence > fingerprints.resolution_confidence
           THEN EXCLUDED.resolution_patch
           ELSE fingerprints.resolution_patch
         END,
         resolution_confidence = GREATEST(fingerprints.resolution_confidence, EXCLUDED.resolution_confidence),
         times_matched = fingerprints.times_matched + 1,
         last_matched_at = NOW()
       RETURNING id`,
      [fingerprint.hash, fingerprint.errorPattern, resolutionPatch, confidence]
    );
    return result.rows[0]?.id;
  } catch (err) {
    logger.error('Fingerprint store error', { error: err.message });
    return null;
  }
}

module.exports = { lookupFingerprint, storeFingerprint };

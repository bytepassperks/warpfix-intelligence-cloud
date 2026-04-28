const crypto = require('crypto');

function generateFingerprint(logData, classification) {
  const components = [
    classification.type,
    normalizeError(logData.errorMessage),
    logData.rootCause || '',
  ].join('::');

  const hash = crypto
    .createHash('sha256')
    .update(components)
    .digest('hex')
    .substring(0, 16);

  return {
    hash,
    errorPattern: normalizeError(logData.errorMessage),
    classificationType: classification.type,
    components,
  };
}

function normalizeError(errorMessage) {
  if (!errorMessage) return '';
  return errorMessage
    .replace(/at .*:\d+:\d+/g, 'at <location>')        // Remove file locations
    .replace(/\/[\w/.:-]+/g, '<path>')                    // Remove file paths
    .replace(/\b[0-9a-f]{7,40}\b/gi, '<hash>')           // Remove git hashes
    .replace(/\d+\.\d+\.\d+/g, '<version>')              // Remove version numbers
    .replace(/\d{4}-\d{2}-\d{2}T[\d:.Z]+/g, '<timestamp>') // Remove timestamps
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
}

module.exports = { generateFingerprint, normalizeError };

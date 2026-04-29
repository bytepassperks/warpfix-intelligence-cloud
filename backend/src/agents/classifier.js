const { logger } = require('../utils/logger');
const { callLLM } = require('../services/llm');

const ERROR_CATEGORIES = {
  BUILD: 'build_error',
  TEST: 'test_failure',
  LINT: 'lint_error',
  TYPE: 'type_error',
  DEPENDENCY: 'dependency_error',
  RUNTIME: 'runtime_error',
  CONFIG: 'config_error',
  PERMISSION: 'permission_error',
  NETWORK: 'network_error',
  UNKNOWN: 'unknown',
};

async function classifyError(logData) {
  logger.info('Classifying error');

  // Quick pattern matching first
  const quickClass = quickClassify(logData.errorMessage);
  if (quickClass.confidence > 0.8) {
    return quickClass;
  }

  // LLM-based classification for complex cases
  try {
    const result = await callLLM({
      system: `You are a CI failure classifier. Classify the error into one of these categories:
${Object.values(ERROR_CATEGORIES).join(', ')}.
Return JSON with: type, summary, severity (low/medium/high/critical), suggestedApproach.`,
      user: `Classify this error:\n\nError: ${logData.errorMessage}\n\nStack: ${logData.stackTrace?.substring(0, 2000)}\n\nRoot cause: ${logData.rootCause}`,
      maxTokens: 500,
    });

    const parsed = JSON.parse(result);
    return {
      type: parsed.type || ERROR_CATEGORIES.UNKNOWN,
      summary: parsed.summary || logData.errorMessage,
      severity: parsed.severity || 'medium',
      suggestedApproach: parsed.suggestedApproach || '',
      confidence: 0.85,
    };
  } catch {
    return quickClass;
  }
}

function quickClassify(errorMessage) {
  const msg = (errorMessage || '').toLowerCase();
  const patterns = [
    { regex: /cannot find module|module not found|no such file|enoent/i, type: ERROR_CATEGORIES.DEPENDENCY, severity: 'high' },
    { regex: /type\s?error|ts\d{4}|is not assignable/i, type: ERROR_CATEGORIES.TYPE, severity: 'medium' },
    { regex: /syntax\s?error|unexpected token/i, type: ERROR_CATEGORIES.BUILD, severity: 'high' },
    { regex: /test\s(failed|failure)|expect.*received|assert|promise.*pending.*resolved/i, type: ERROR_CATEGORIES.TEST, severity: 'medium' },
    { regex: /eslint|prettier|lint/i, type: ERROR_CATEGORIES.LINT, severity: 'low' },
    { regex: /eacces|permission denied|forbidden/i, type: ERROR_CATEGORIES.PERMISSION, severity: 'high' },
    { regex: /timeout|econnrefused|enotfound|fetch failed/i, type: ERROR_CATEGORIES.NETWORK, severity: 'medium' },
    { regex: /version.*mismatch|peer dep|incompatible/i, type: ERROR_CATEGORIES.DEPENDENCY, severity: 'high' },
    { regex: /segfault|out of memory|heap|stack overflow/i, type: ERROR_CATEGORIES.RUNTIME, severity: 'critical' },
  ];

  for (const { regex, type, severity } of patterns) {
    if (regex.test(msg)) {
      return {
        type,
        summary: cleanSummary(errorMessage, type),
        severity,
        suggestedApproach: '',
        confidence: 0.9,
      };
    }
  }

  return {
    type: ERROR_CATEGORIES.UNKNOWN,
    summary: cleanSummary(errorMessage, ERROR_CATEGORIES.UNKNOWN),
    severity: 'medium',
    suggestedApproach: '',
    confidence: 0.3,
  };
}

function cleanSummary(errorMessage, type) {
  if (!errorMessage) return `${type} detected`;
  // Strip timestamp prefixes (e.g. "2026-04-29T02:01:02.8238731Z")
  let cleaned = errorMessage.replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z\s*/g, '').trim();
  // Strip ANSI escape codes
  cleaned = cleaned.replace(/\x1b\[[0-9;]*m/g, '');
  // Take first meaningful line
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 10);
  const summary = lines[0] || cleaned;
  return summary.substring(0, 200);
}

module.exports = { classifyError, ERROR_CATEGORIES };

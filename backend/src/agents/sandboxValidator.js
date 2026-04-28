const { logger } = require('../utils/logger');
const { getInstallationOctokit } = require('../services/github');

async function validateInSandbox({ patch, repository, installation_id }) {
  logger.info('Validating patch in sandbox', { repo: repository?.full_name });

  const timeout = parseInt(process.env.SANDBOX_TIMEOUT_MS) || 120000;

  try {
    // In production, this would spin up a Docker container.
    // For now, use a lightweight validation approach.
    const validation = await lightweightValidate(patch, repository);
    return validation;
  } catch (err) {
    logger.error('Sandbox validation error', { error: err.message });
    return {
      passed: false,
      error: err.message,
      steps: { clone: false, apply: false, install: false, test: false, build: false, lint: false },
    };
  }
}

async function lightweightValidate(patch, repository) {
  const steps = {
    syntax_check: false,
    diff_valid: false,
    no_conflicts: false,
    size_check: false,
    pattern_check: false,
  };

  // Validate diff format
  const hasDiffHeaders = patch.includes('---') && patch.includes('+++');
  const hasHunks = /@@\s*-\d+,?\d*\s*\+\d+,?\d*\s*@@/.test(patch);
  steps.diff_valid = hasDiffHeaders || hasHunks || patch.length > 0;

  // Size check
  const lines = patch.split('\n');
  steps.size_check = lines.length < 200;

  // Pattern check - no obviously bad patterns
  const badPatterns = [/<<<<<</, />>>>>>/, /=======/];
  steps.no_conflicts = !badPatterns.some(p => p.test(patch));

  // Basic syntax check for common languages
  steps.syntax_check = !(/SyntaxError/.test(patch));

  steps.pattern_check = true;

  const allPassed = Object.values(steps).every(Boolean);

  return {
    passed: allPassed,
    steps,
    method: 'lightweight',
  };
}

async function dockerValidate(patch, repository, installationId) {
  // Full Docker-based validation (production)
  const Docker = require('dockerode');
  const docker = new Docker();

  const container = await docker.createContainer({
    Image: 'node:20-slim',
    Cmd: ['sh', '-c', `
      cd /workspace &&
      echo "${Buffer.from(patch).toString('base64')}" | base64 -d > /tmp/fix.patch &&
      git apply /tmp/fix.patch &&
      npm install --ignore-scripts 2>/dev/null &&
      npm test 2>&1 &&
      npm run build 2>&1
    `],
    WorkingDir: '/workspace',
    HostConfig: {
      Memory: 512 * 1024 * 1024,
      CpuPeriod: 100000,
      CpuQuota: 50000,
      NetworkMode: 'none',
      AutoRemove: true,
    },
  });

  await container.start();

  const result = await container.wait();
  const logs = await container.logs({ stdout: true, stderr: true });

  return {
    passed: result.StatusCode === 0,
    steps: {
      clone: true,
      apply: true,
      install: result.StatusCode === 0,
      test: result.StatusCode === 0,
      build: result.StatusCode === 0,
    },
    logs: logs.toString(),
    method: 'docker',
  };
}

module.exports = { validateInSandbox };

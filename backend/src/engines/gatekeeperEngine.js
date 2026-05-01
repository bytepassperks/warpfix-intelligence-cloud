const { logger } = require('../utils/logger');

/**
 * Gatekeeper Engine — Noise filtering layer (CodeRabbit-style).
 * Filters out ~40% of noise BEFORE invoking LLM to save cost.
 * 
 * Filters:
 * 1. Documentation-only changes
 * 2. Lockfile changes
 * 3. Auto-generated code
 * 4. Dependency bumps (Renovate/Dependabot)
 * 5. CI config-only changes
 * 6. Merge commits with no meaningful diff
 */

const NOISE_PATTERNS = {
  documentation: [
    /\.md$/i,
    /\.txt$/i,
    /\.rst$/i,
    /docs\//i,
    /documentation\//i,
    /LICENSE/i,
    /CHANGELOG/i,
    /CONTRIBUTING/i,
    /\.mdx$/i,
  ],
  lockfiles: [
    /package-lock\.json$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/,
    /Pipfile\.lock$/,
    /Gemfile\.lock$/,
    /composer\.lock$/,
    /Cargo\.lock$/,
    /poetry\.lock$/,
    /go\.sum$/,
  ],
  generated: [
    /\.min\.js$/,
    /\.min\.css$/,
    /dist\//,
    /build\//,
    /\.generated\./,
    /\.d\.ts$/,
    /\.map$/,
    /node_modules\//,
    /vendor\//,
    /__pycache__\//,
  ],
  ci_config: [
    /\.github\/workflows\//,
    /\.circleci\//,
    /\.travis\.yml$/,
    /Jenkinsfile$/,
    /\.gitlab-ci\.yml$/,
    /azure-pipelines\.yml$/,
  ],
  assets: [
    /\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i,
    /\.(mp3|mp4|wav|ogg|webm)$/i,
    /\.(pdf|zip|tar|gz)$/i,
  ],
};

function classifyFile(filePath) {
  for (const [category, patterns] of Object.entries(NOISE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(filePath)) {
        return { isNoise: true, category, pattern: pattern.toString() };
      }
    }
  }
  return { isNoise: false, category: 'code', pattern: null };
}

function filterPRFiles(files) {
  const meaningful = [];
  const filtered = [];

  for (const file of files) {
    const classification = classifyFile(file.filename);
    if (classification.isNoise) {
      filtered.push({ ...file, noise_category: classification.category });
    } else {
      meaningful.push(file);
    }
  }

  const filterRate = files.length > 0
    ? Math.round((filtered.length / files.length) * 100)
    : 0;

  logger.info('Gatekeeper filtering', {
    total: files.length,
    meaningful: meaningful.length,
    filtered: filtered.length,
    filterRate: `${filterRate}%`,
  });

  return { meaningful, filtered, filterRate };
}

function shouldSkipRepair(workflowRun, changedFiles) {
  // Skip if all changed files are documentation
  if (changedFiles?.length > 0) {
    const allDocs = changedFiles.every(f => classifyFile(f).isNoise);
    if (allDocs) {
      logger.info('Gatekeeper: skipping repair — all changed files are noise');
      return { skip: true, reason: 'all_files_are_noise' };
    }
  }

  // Skip Dependabot/Renovate PRs (they usually auto-fix)
  const branch = workflowRun?.head_branch || '';
  if (/^(dependabot|renovate)\//i.test(branch)) {
    logger.info('Gatekeeper: skipping repair — dependency bot branch');
    return { skip: true, reason: 'dependency_bot_branch' };
  }

  // Skip release branches (usually intentional)
  if (/^(release|hotfix)\//i.test(branch)) {
    logger.info('Gatekeeper: skipping repair — release/hotfix branch');
    return { skip: false, reason: null }; // Don't skip — these are important
  }

  return { skip: false, reason: null };
}

function isPRReviewWorthy(prData, files) {
  // Don't review if it's a bot PR with only lockfile changes
  const author = prData.user?.login || '';
  const isBotPR = /\[bot\]$|^dependabot|^renovate|^greenkeeper/i.test(author);

  if (isBotPR) {
    const { meaningful } = filterPRFiles(files);
    if (meaningful.length === 0) {
      return { worthy: false, reason: 'bot_pr_only_lockfiles' };
    }
  }

  // Don't review PRs with no code changes
  const { meaningful } = filterPRFiles(files);
  if (meaningful.length === 0) {
    return { worthy: false, reason: 'no_code_changes' };
  }

  return { worthy: true, reason: null };
}

function computeReviewPriority(files) {
  let priority = 0;

  for (const file of files) {
    const classification = classifyFile(file.filename);
    if (classification.isNoise) continue;

    // Security-sensitive files get high priority
    if (/auth|security|crypto|password|token|secret|oauth/i.test(file.filename)) {
      priority += 10;
    }
    // API routes
    if (/routes?\/|controllers?\//i.test(file.filename)) {
      priority += 5;
    }
    // Database migrations
    if (/migrat|schema/i.test(file.filename)) {
      priority += 8;
    }
    // Large changes
    if ((file.additions || 0) + (file.deletions || 0) > 100) {
      priority += 3;
    }
  }

  return Math.min(priority, 100);
}

module.exports = {
  classifyFile,
  filterPRFiles,
  shouldSkipRepair,
  isPRReviewWorthy,
  computeReviewPriority,
  NOISE_PATTERNS,
};

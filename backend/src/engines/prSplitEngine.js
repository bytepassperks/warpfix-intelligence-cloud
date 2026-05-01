const { logger } = require('../utils/logger');

/**
 * PR Splitting Suggestions + Cross-PR Merge Conflict Prediction
 * 
 * NO COMPETITOR OFFERS PR SPLITTING ADVICE.
 * 
 * - Detects oversized PRs and suggests logical split points
 * - Predicts merge conflicts between open PRs
 * - Groups related file changes into suggested sub-PRs
 */

const SIZE_THRESHOLDS = {
  small: { files: 5, lines: 100 },
  medium: { files: 15, lines: 500 },
  large: { files: 30, lines: 1000 },
  critical: { files: 50, lines: 3000 },
};

function analyzePRSize(files) {
  const totalFiles = files.length;
  const totalAdditions = files.reduce((sum, f) => sum + (f.additions || 0), 0);
  const totalDeletions = files.reduce((sum, f) => sum + (f.deletions || 0), 0);
  const totalChanges = totalAdditions + totalDeletions;

  let size = 'small';
  if (totalFiles > SIZE_THRESHOLDS.critical.files || totalChanges > SIZE_THRESHOLDS.critical.lines) {
    size = 'critical';
  } else if (totalFiles > SIZE_THRESHOLDS.large.files || totalChanges > SIZE_THRESHOLDS.large.lines) {
    size = 'large';
  } else if (totalFiles > SIZE_THRESHOLDS.medium.files || totalChanges > SIZE_THRESHOLDS.medium.lines) {
    size = 'medium';
  }

  return {
    size,
    total_files: totalFiles,
    total_additions: totalAdditions,
    total_deletions: totalDeletions,
    total_changes: totalChanges,
    needs_splitting: size === 'large' || size === 'critical',
  };
}

function suggestSplits(files) {
  const groups = {};

  for (const file of files) {
    const category = categorizeFile(file.filename);
    if (!groups[category]) groups[category] = [];
    groups[category].push(file);
  }

  const suggestions = [];
  for (const [category, categoryFiles] of Object.entries(groups)) {
    if (categoryFiles.length > 0) {
      const additions = categoryFiles.reduce((s, f) => s + (f.additions || 0), 0);
      const deletions = categoryFiles.reduce((s, f) => s + (f.deletions || 0), 0);
      suggestions.push({
        suggested_pr_name: `[Split] ${category}`,
        category,
        files: categoryFiles.map(f => f.filename),
        file_count: categoryFiles.length,
        total_changes: additions + deletions,
      });
    }
  }

  return suggestions.sort((a, b) => b.file_count - a.file_count);
}

function categorizeFile(filename) {
  if (/test|spec|__tests__/i.test(filename)) return 'Tests';
  if (/\.(md|txt|rst|mdx)$/i.test(filename)) return 'Documentation';
  if (/\.github\/|\.circleci|Jenkinsfile|\.gitlab-ci/i.test(filename)) return 'CI/CD Configuration';
  if (/migrat|schema/i.test(filename)) return 'Database Migrations';
  if (/routes?\/|controllers?\//i.test(filename)) return 'API Routes';
  if (/models?\/|entities?\//i.test(filename)) return 'Data Models';
  if (/middleware|interceptor/i.test(filename)) return 'Middleware';
  if (/components?\/|pages?\//i.test(filename)) return 'UI Components';
  if (/styles?\/|\.css$|\.scss$/i.test(filename)) return 'Styles';
  if (/utils?\/|helpers?\/|lib\//i.test(filename)) return 'Utilities';
  if (/config|\.env|\.yaml$|\.yml$/i.test(filename)) return 'Configuration';
  if (/package\.json|Cargo\.toml|requirements/i.test(filename)) return 'Dependencies';
  return 'Core Logic';
}

function predictMergeConflicts(currentPR, openPRs) {
  const conflicts = [];

  const currentFiles = new Set(currentPR.files?.map(f => f.filename) || []);

  for (const openPR of openPRs) {
    if (openPR.number === currentPR.number) continue;

    const overlappingFiles = (openPR.files || [])
      .filter(f => currentFiles.has(f.filename))
      .map(f => f.filename);

    if (overlappingFiles.length > 0) {
      conflicts.push({
        pr_number: openPR.number,
        pr_title: openPR.title,
        pr_author: openPR.user?.login,
        overlapping_files: overlappingFiles,
        conflict_probability: Math.min(overlappingFiles.length * 25, 95),
        recommendation: overlappingFiles.length > 3
          ? 'HIGH — Coordinate with PR author before merging'
          : 'MODERATE — Review overlapping files carefully',
      });
    }
  }

  return conflicts.sort((a, b) => b.conflict_probability - a.conflict_probability);
}

function formatSplitSuggestions(analysis, suggestions) {
  if (!analysis.needs_splitting) return null;

  const sizeIcon = { small: '🟢', medium: '🟡', large: '🟠', critical: '🔴' }[analysis.size];

  let report = `### PR Size Analysis\n\n`;
  report += `${sizeIcon} **${analysis.size.toUpperCase()}** — ${analysis.total_files} files, +${analysis.total_additions}/-${analysis.total_deletions}\n\n`;

  if (suggestions.length > 1) {
    report += `**Suggested Split:**\n`;
    report += `| Sub-PR | Files | Changes |\n|--------|-------|---------|\n`;
    for (const s of suggestions) {
      report += `| ${s.suggested_pr_name} | ${s.file_count} | ${s.total_changes} |\n`;
    }
    report += `\nSplitting this PR would make each part easier to review and reduces merge conflict risk.\n`;
  }

  return report;
}

function formatConflictPredictions(conflicts) {
  if (conflicts.length === 0) return null;

  let report = `### Merge Conflict Prediction\n\n`;
  for (const c of conflicts) {
    const icon = c.conflict_probability > 50 ? '🔴' : '🟡';
    report += `${icon} **PR #${c.pr_number}** (${c.pr_author}): ${c.pr_title}\n`;
    report += `- Overlapping files: ${c.overlapping_files.map(f => `\`${f}\``).join(', ')}\n`;
    report += `- Conflict probability: ${c.conflict_probability}%\n`;
    report += `- ${c.recommendation}\n\n`;
  }

  return report;
}

module.exports = {
  analyzePRSize,
  suggestSplits,
  predictMergeConflicts,
  formatSplitSuggestions,
  formatConflictPredictions,
};

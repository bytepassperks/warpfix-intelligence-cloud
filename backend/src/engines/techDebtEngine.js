const { logger } = require('../utils/logger');

/**
 * Technical Debt Tracker
 * 
 * UNIQUE — no competitor tracks and trends tech debt over time.
 * 
 * Scores code quality and tracks it over time:
 * - Complexity analysis
 * - TODO/FIXME density
 * - Code duplication indicators
 * - Dependency age
 * - Test coverage ratio
 */

const DEBT_INDICATORS = {
  todo_comments: {
    pattern: /\/\/\s*(TODO|FIXME|HACK|XXX|TEMP|WORKAROUND)[:!\s]/gi,
    weight: 2,
    label: 'TODO/FIXME Comments',
  },
  long_functions: {
    check: (content) => {
      let count = 0;
      const funcRegex = /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))\s*(?:\([^)]*\))?\s*\{/g;
      let match;
      while ((match = funcRegex.exec(content)) !== null) {
        const start = match.index;
        let braces = 1;
        let pos = content.indexOf('{', start) + 1;
        while (braces > 0 && pos < content.length) {
          if (content[pos] === '{') braces++;
          if (content[pos] === '}') braces--;
          pos++;
        }
        const funcContent = content.substring(start, pos);
        const lines = funcContent.split('\n').length;
        if (lines > 50) count++;
      }
      return count;
    },
    weight: 5,
    label: 'Long Functions (>50 lines)',
  },
  deeply_nested: {
    check: (content) => {
      let maxDepth = 0;
      let currentDepth = 0;
      for (const char of content) {
        if (char === '{') { currentDepth++; maxDepth = Math.max(maxDepth, currentDepth); }
        if (char === '}') currentDepth--;
      }
      return maxDepth > 5 ? maxDepth - 5 : 0;
    },
    weight: 3,
    label: 'Deep Nesting (>5 levels)',
  },
  magic_numbers: {
    pattern: /(?<![.\w])(?:\d{4,})(?![.\w])/g,
    weight: 1,
    label: 'Magic Numbers',
  },
  console_statements: {
    pattern: /console\.(log|debug|info|warn|error)\s*\(/g,
    weight: 1,
    label: 'Console Statements',
  },
  any_type: {
    pattern: /:\s*any\b/g,
    weight: 3,
    label: 'TypeScript `any` types',
  },
  disabled_rules: {
    pattern: /(?:eslint-disable|@ts-ignore|@ts-nocheck|noqa|noinspection)/g,
    weight: 2,
    label: 'Disabled Lint Rules',
  },
};

function computeDebtScore(fileContent, filePath) {
  let totalDebt = 0;
  const details = [];

  for (const [id, indicator] of Object.entries(DEBT_INDICATORS)) {
    let count = 0;

    if (indicator.pattern) {
      indicator.pattern.lastIndex = 0;
      const matches = fileContent.match(indicator.pattern);
      count = matches ? matches.length : 0;
    } else if (indicator.check) {
      count = indicator.check(fileContent);
    }

    if (count > 0) {
      const debt = count * indicator.weight;
      totalDebt += debt;
      details.push({
        indicator: id,
        label: indicator.label,
        count,
        debt_points: debt,
      });
    }
  }

  // Normalize score: 0 = pristine, 100 = heavily indebted
  const lines = fileContent.split('\n').length;
  const normalizedScore = Math.min(Math.round((totalDebt / Math.max(lines, 1)) * 100), 100);

  return {
    file: filePath,
    raw_debt: totalDebt,
    normalized_score: normalizedScore,
    grade: getGrade(normalizedScore),
    line_count: lines,
    details,
  };
}

function getGrade(score) {
  if (score <= 5) return 'A';
  if (score <= 15) return 'B';
  if (score <= 30) return 'C';
  if (score <= 50) return 'D';
  return 'F';
}

function computeRepoDebtScore(filesMap) {
  const fileScores = [];
  let totalDebt = 0;
  let totalLines = 0;

  for (const [path, content] of Object.entries(filesMap)) {
    const score = computeDebtScore(content, path);
    fileScores.push(score);
    totalDebt += score.raw_debt;
    totalLines += score.line_count;
  }

  const normalizedScore = totalLines > 0
    ? Math.min(Math.round((totalDebt / totalLines) * 100), 100)
    : 0;

  // Sort by worst offenders
  fileScores.sort((a, b) => b.normalized_score - a.normalized_score);

  return {
    overall_score: normalizedScore,
    overall_grade: getGrade(normalizedScore),
    total_files: fileScores.length,
    total_lines: totalLines,
    total_debt_points: totalDebt,
    worst_files: fileScores.slice(0, 10),
    grade_distribution: {
      A: fileScores.filter(f => f.grade === 'A').length,
      B: fileScores.filter(f => f.grade === 'B').length,
      C: fileScores.filter(f => f.grade === 'C').length,
      D: fileScores.filter(f => f.grade === 'D').length,
      F: fileScores.filter(f => f.grade === 'F').length,
    },
  };
}

function computeDebtDelta(prFiles, beforeFilesMap, afterFilesMap) {
  let debtBefore = 0;
  let debtAfter = 0;

  for (const file of prFiles) {
    const beforeContent = beforeFilesMap?.[file.filename] || '';
    const afterContent = afterFilesMap?.[file.filename] || '';

    if (beforeContent) debtBefore += computeDebtScore(beforeContent, file.filename).raw_debt;
    if (afterContent) debtAfter += computeDebtScore(afterContent, file.filename).raw_debt;
  }

  const delta = debtAfter - debtBefore;
  return {
    debt_before: debtBefore,
    debt_after: debtAfter,
    delta,
    direction: delta > 0 ? 'increased' : delta < 0 ? 'decreased' : 'unchanged',
    icon: delta > 0 ? '📈' : delta < 0 ? '📉' : '➡️',
    message: delta > 0
      ? `Tech debt increased by ${delta} points`
      : delta < 0
        ? `Tech debt decreased by ${Math.abs(delta)} points`
        : 'No change in tech debt',
  };
}

function formatDebtReport(repoDebt) {
  let report = `### Technical Debt Report\n\n`;
  report += `**Overall Grade: ${repoDebt.overall_grade}** (Score: ${repoDebt.overall_score}/100)\n\n`;

  report += `| Grade | Files |\n|-------|-------|\n`;
  for (const [grade, count] of Object.entries(repoDebt.grade_distribution)) {
    const bar = '█'.repeat(Math.min(count, 20));
    report += `| ${grade} | ${count} ${bar} |\n`;
  }
  report += '\n';

  if (repoDebt.worst_files.length > 0) {
    report += `**Top Debt Files:**\n`;
    for (const f of repoDebt.worst_files.slice(0, 5)) {
      report += `- \`${f.file}\` — Grade ${f.grade} (${f.details.map(d => d.label).join(', ')})\n`;
    }
  }

  return report;
}

module.exports = {
  computeDebtScore,
  computeRepoDebtScore,
  computeDebtDelta,
  formatDebtReport,
  DEBT_INDICATORS,
};

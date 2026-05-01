const { logger } = require('../utils/logger');
const { callLLM } = require('../services/llm');

/**
 * Auto-Generated Release Notes + Commit Message Intelligence
 * 
 * UNIQUE FEATURE — no competitor auto-generates release notes from PR history.
 * 
 * - Aggregates PR summaries into changelog entries
 * - Generates conventional commit messages from diffs
 * - Categories changes (feat, fix, chore, docs, perf, refactor)
 * - Produces markdown release notes
 */

function categorizeCommit(title, files) {
  const titleLower = title.toLowerCase();

  if (/\bfix\b|bug|patch|hotfix|repair/i.test(titleLower)) return 'fix';
  if (/\bfeat\b|feature|add|new|implement/i.test(titleLower)) return 'feat';
  if (/\bdocs?\b|readme|changelog|documentation/i.test(titleLower)) return 'docs';
  if (/\bperf\b|performance|optimi[sz]e|speed|fast/i.test(titleLower)) return 'perf';
  if (/\brefactor\b|clean|reorgani[sz]e|restructure/i.test(titleLower)) return 'refactor';
  if (/\btest\b|spec|coverage/i.test(titleLower)) return 'test';
  if (/\bci\b|pipeline|workflow|deploy/i.test(titleLower)) return 'ci';
  if (/\bstyle\b|format|lint|prettier/i.test(titleLower)) return 'style';
  if (/\bdep\b|dependency|upgrade|bump|update/i.test(titleLower)) return 'deps';

  // Categorize by files if title doesn't give clear signal
  const hasTests = files?.some(f => /test|spec/i.test(f));
  const hasDocs = files?.some(f => /\.md$|docs?\//i.test(f));
  const hasCI = files?.some(f => /\.github|ci|pipeline/i.test(f));

  if (hasDocs && files?.length === 1) return 'docs';
  if (hasCI && files?.length === 1) return 'ci';
  if (hasTests && files?.length === 1) return 'test';

  return 'chore';
}

async function generateCommitMessage(diff, context) {
  try {
    const result = await callLLM({
      system: 'Generate a conventional commit message. Output ONLY the commit message, nothing else. Format: type(scope): description',
      user: `Generate a conventional commit message for this diff:

Context: ${context || 'Code change'}

Diff (first 2000 chars):
${diff?.substring(0, 2000) || 'No diff available'}

Rules:
- Use conventional commits: feat|fix|docs|perf|refactor|test|ci|chore
- Add scope in parentheses if clear (e.g., feat(auth): ...)
- Keep under 72 characters
- Use imperative mood ("add" not "added")`,
      maxTokens: 100,
    });

    return result.trim().split('\n')[0];
  } catch (err) {
    logger.error('Commit message generation failed', { error: err.message });
    return null;
  }
}

function generateReleaseNotes(prs, version) {
  const categories = {
    feat: { label: 'Features', icon: '🚀', items: [] },
    fix: { label: 'Bug Fixes', icon: '🐛', items: [] },
    perf: { label: 'Performance', icon: '⚡', items: [] },
    refactor: { label: 'Refactoring', icon: '♻️', items: [] },
    docs: { label: 'Documentation', icon: '📚', items: [] },
    test: { label: 'Tests', icon: '🧪', items: [] },
    ci: { label: 'CI/CD', icon: '🔧', items: [] },
    deps: { label: 'Dependencies', icon: '📦', items: [] },
    style: { label: 'Style', icon: '💅', items: [] },
    chore: { label: 'Chores', icon: '🔨', items: [] },
  };

  for (const pr of prs) {
    const category = categorizeCommit(pr.title, pr.files?.map(f => f.filename));
    if (!categories[category]) categories[category] = { label: category, icon: '📋', items: [] };
    categories[category].items.push({
      title: pr.title.replace(/^\[WarpFix\]\s*/, ''),
      number: pr.number,
      author: pr.user?.login,
      labels: pr.labels?.map(l => l.name) || [],
    });
  }

  let notes = `# Release ${version || 'Unreleased'}\n\n`;
  notes += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;

  // Stats
  const totalPRs = prs.length;
  const contributors = [...new Set(prs.map(p => p.user?.login).filter(Boolean))];
  notes += `> ${totalPRs} pull requests from ${contributors.length} contributors\n\n`;

  for (const [, cat] of Object.entries(categories)) {
    if (cat.items.length === 0) continue;
    notes += `## ${cat.icon} ${cat.label}\n\n`;
    for (const item of cat.items) {
      notes += `- ${item.title} (#${item.number}) — @${item.author}\n`;
    }
    notes += '\n';
  }

  if (contributors.length > 0) {
    notes += `## Contributors\n\n`;
    notes += contributors.map(c => `- @${c}`).join('\n') + '\n';
  }

  return notes;
}

async function generateReleaseNotesWithLLM(prs) {
  const prSummaries = prs.map(pr =>
    `- #${pr.number}: ${pr.title} (by @${pr.user?.login})`
  ).join('\n');

  try {
    const result = await callLLM({
      system: 'Generate professional release notes in markdown format. Be concise but comprehensive.',
      user: `Generate release notes for these merged PRs:

${prSummaries}

Include:
1. A brief executive summary (2-3 sentences)
2. Categorized changes (Features, Fixes, Improvements)
3. Breaking changes (if any)
4. Migration notes (if needed)`,
      maxTokens: 2000,
    });

    return result;
  } catch (err) {
    logger.error('Release notes LLM generation failed', { error: err.message });
    return null;
  }
}

module.exports = {
  categorizeCommit,
  generateCommitMessage,
  generateReleaseNotes,
  generateReleaseNotesWithLLM,
};

const { logger } = require('../utils/logger');
const { callLLM } = require('../services/llm');

/**
 * Inline Review Agent — generates line-by-line review comments with severity.
 * Severity levels: critical, warning, nitpick, praise
 * Matches CodeRabbit's inline comment system.
 */

const SEVERITY_LABELS = {
  critical: { emoji: '🚨', label: 'Critical', priority: 1 },
  warning: { emoji: '⚠️', label: 'Warning', priority: 2 },
  nitpick: { emoji: '💅', label: 'Nitpick', priority: 3 },
  praise: { emoji: '✨', label: 'Praise', priority: 4 },
};

async function generateInlineComments({ files, prData, repoConfig, reviewProfile, learnings }) {
  const profile = reviewProfile || 'assertive';
  const learningsContext = learnings?.length
    ? `\n\nPrevious learnings from this repo:\n${learnings.map(l => `- ${l.rule}`).join('\n')}`
    : '';

  const pathInstructions = repoConfig?.path_instructions || [];
  let pathRulesContext = '';
  if (pathInstructions.length) {
    pathRulesContext = '\n\nPath-specific review rules:\n' +
      pathInstructions.map(pi => `- ${pi.glob}: ${pi.instruction}`).join('\n');
  }

  const fileDiffs = files
    .filter(f => f.patch)
    .map(f => `### ${f.filename} (${f.status}: +${f.additions}/-${f.deletions})\n\`\`\`diff\n${f.patch.substring(0, 4000)}\n\`\`\``)
    .join('\n\n');

  const strictness = profile === 'chill'
    ? 'Only flag critical and warning-level issues. Skip nitpicks entirely.'
    : 'Flag all issues: critical bugs, warnings, and nitpicks. Also add praise for good patterns.';

  const prompt = `Review the following code changes and generate inline comments.

## PR: ${prData.title}
${fileDiffs}
${learningsContext}
${pathRulesContext}

Generate a JSON array of inline review comments. Each comment must have:
{
  "file": "path/to/file",
  "line": <line number in the NEW file where the comment applies>,
  "severity": "critical|warning|nitpick|praise",
  "comment": "Clear explanation of the issue or praise",
  "suggestion": "Optional code suggestion to fix the issue (or null)",
  "category": "bug|security|performance|style|logic|documentation|testing"
}

Rules:
- ${strictness}
- Each comment should be actionable and specific
- Include code suggestions when possible (using \`\`\`suggestion blocks)
- Flag: null pointer risks, race conditions, security issues, performance problems, missing error handling
- Do NOT flag formatting if a formatter is configured
- Maximum 20 comments per review
- Output ONLY a JSON array`;

  const result = await callLLM({
    system: 'You are an expert code reviewer. Output ONLY a valid JSON array of review comments.',
    user: prompt,
    maxTokens: 6000,
  });

  try {
    const arrayMatch = result.match(/\[[\s\S]*\]/);
    if (!arrayMatch) return [];
    const comments = JSON.parse(arrayMatch[0]);
    return comments.filter(c => c.file && c.line && c.severity && c.comment);
  } catch (err) {
    logger.error('Failed to parse inline comments', { error: err.message });
    return [];
  }
}

function formatInlineComment(comment) {
  const sev = SEVERITY_LABELS[comment.severity] || SEVERITY_LABELS.warning;
  const categoryBadge = comment.category ? ` \`${comment.category}\`` : '';
  let body = `${sev.emoji} **${sev.label}**${categoryBadge}\n\n`;
  body += comment.comment + '\n';

  if (comment.suggestion) {
    body += `\n\`\`\`suggestion\n${comment.suggestion}\n\`\`\`\n`;
  }

  body += `\n<sub>🤖 WarpFix</sub>`;
  return body;
}

async function postInlineComments(octokit, owner, repo, prNumber, commitSha, comments) {
  const posted = [];
  for (const comment of comments.slice(0, 20)) {
    try {
      const body = formatInlineComment(comment);
      await octokit.request('POST /repos/{owner}/{repo}/pulls/{pull_number}/comments', {
        owner, repo,
        pull_number: prNumber,
        body,
        commit_id: commitSha,
        path: comment.file,
        line: comment.line,
        side: 'RIGHT',
      });
      posted.push(comment);
    } catch (err) {
      logger.warn('Failed to post inline comment', {
        file: comment.file, line: comment.line, error: err.message,
      });
    }
  }
  return posted;
}

module.exports = { generateInlineComments, formatInlineComment, postInlineComments, SEVERITY_LABELS };

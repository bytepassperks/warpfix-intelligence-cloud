const { logger } = require('../utils/logger');
const { callLLM } = require('../services/llm');

/**
 * PR Review Agent — generates CodeRabbit-level PR reviews:
 * - Auto-generated PR summary
 * - File change walkthrough table
 * - Mermaid sequence diagrams
 * - Estimated review effort
 * - Suggested labels & reviewers
 * - Risk analysis
 */

async function generatePRReview({ prData, files, repoConfig, reviewProfile }) {
  const profile = reviewProfile || 'assertive'; // 'chill' or 'assertive'
  const strictness = profile === 'chill'
    ? 'Be lenient. Only flag critical issues. Ignore style nitpicks.'
    : 'Be thorough. Flag all issues including style, naming, and potential bugs.';

  const filesSummary = files.map(f => ({
    filename: f.filename,
    status: f.status,
    additions: f.additions,
    deletions: f.deletions,
    patch: f.patch?.substring(0, 3000),
  }));

  const prompt = `Analyze this pull request and generate a comprehensive review.

## PR Details
- **Title:** ${prData.title}
- **Author:** ${prData.user?.login}
- **Base:** ${prData.base?.ref} ← **Head:** ${prData.head?.ref}
- **Description:** ${prData.body?.substring(0, 2000) || 'No description'}

## Changed Files (${files.length} files)
${filesSummary.map(f => `- ${f.filename} (${f.status}: +${f.additions}/-${f.deletions})`).join('\n')}

## Diffs
${filesSummary.map(f => `### ${f.filename}\n\`\`\`diff\n${f.patch || 'binary'}\n\`\`\``).join('\n\n')}

Generate a JSON response with this EXACT structure:
{
  "summary": "2-3 sentence summary of what this PR does",
  "walkthrough": "Detailed walkthrough of changes in paragraph form",
  "file_changes": [
    {"file": "path/to/file", "change_summary": "Brief description of change", "impact": "high|medium|low"}
  ],
  "sequence_diagram": "Mermaid sequenceDiagram code showing the flow of changes (or null if not applicable)",
  "review_effort": {"level": 1-5, "label": "Minimal|Small|Moderate|Large|Critical", "estimated_minutes": number},
  "risk_analysis": {"level": "low|medium|high|critical", "factors": ["list of risk factors"]},
  "suggested_labels": ["list of labels"],
  "suggested_reviewers_criteria": ["e.g. 'someone familiar with auth module'"],
  "key_observations": ["important things reviewer should know"]
}`;

  const result = await callLLM({
    system: `You are an expert code reviewer. ${strictness} Output ONLY valid JSON.`,
    user: prompt,
    maxTokens: 4000,
  });

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in LLM response');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    logger.error('Failed to parse review response', { error: err.message });
    return {
      summary: 'Review generation failed — could not parse LLM response.',
      walkthrough: result.substring(0, 500),
      file_changes: filesSummary.map(f => ({
        file: f.filename, change_summary: `${f.status}: +${f.additions}/-${f.deletions}`, impact: 'medium',
      })),
      sequence_diagram: null,
      review_effort: { level: 3, label: 'Moderate', estimated_minutes: 20 },
      risk_analysis: { level: 'medium', factors: ['Auto-detection failed'] },
      suggested_labels: [],
      suggested_reviewers_criteria: [],
      key_observations: [],
    };
  }
}

function formatReviewComment(review, prData) {
  let comment = `## WarpFix PR Review\n\n`;
  comment += `### Summary\n${review.summary}\n\n`;
  comment += `### Walkthrough\n${review.walkthrough}\n\n`;

  // File changes table
  comment += `### File Changes\n`;
  comment += `| File | Change | Impact |\n|------|--------|--------|\n`;
  for (const fc of review.file_changes || []) {
    const icon = fc.impact === 'high' ? '🔴' : fc.impact === 'medium' ? '🟡' : '🟢';
    comment += `| \`${fc.file}\` | ${fc.change_summary} | ${icon} ${fc.impact} |\n`;
  }
  comment += '\n';

  // Sequence diagram
  if (review.sequence_diagram) {
    comment += `### Sequence Diagram\n\`\`\`mermaid\n${review.sequence_diagram}\n\`\`\`\n\n`;
  }

  // Review effort
  const effort = review.review_effort || {};
  comment += `### Review Effort\n`;
  comment += `**${effort.level}/5** (${effort.label}) — ~${effort.estimated_minutes} minutes\n\n`;

  // Risk analysis
  const risk = review.risk_analysis || {};
  const riskIcon = { low: '🟢', medium: '🟡', high: '🟠', critical: '🔴' }[risk.level] || '⚪';
  comment += `### Risk Analysis\n${riskIcon} **${risk.level?.toUpperCase()}**\n`;
  if (risk.factors?.length) {
    comment += risk.factors.map(f => `- ${f}`).join('\n') + '\n';
  }
  comment += '\n';

  // Suggested labels
  if (review.suggested_labels?.length) {
    comment += `### Suggested Labels\n${review.suggested_labels.map(l => `\`${l}\``).join(', ')}\n\n`;
  }

  // Key observations
  if (review.key_observations?.length) {
    comment += `### Key Observations\n`;
    comment += review.key_observations.map(o => `- ${o}`).join('\n') + '\n\n';
  }

  comment += `---\n*Reviewed by [WarpFix Intelligence Cloud](https://warpfix.dev) — AI-Powered Code Review + CI Repair*`;

  return comment;
}

module.exports = { generatePRReview, formatReviewComment };

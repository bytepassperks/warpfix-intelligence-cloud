const { logger } = require('../utils/logger');
const { callLLM } = require('../services/llm');

/**
 * Verification Agent — validates LLM-generated review findings.
 * Reduces false positives by double-checking each finding.
 * CodeRabbit uses a similar second-pass verification step.
 */

async function verifyFindings(findings, fileContents) {
  if (!findings || findings.length === 0) return [];

  const findingsText = findings.map((f, i) =>
    `Finding #${i + 1}:\n- File: ${f.file}\n- Line: ${f.line}\n- Severity: ${f.severity}\n- Comment: ${f.comment}\n- Category: ${f.category}`
  ).join('\n\n');

  const contextText = Object.entries(fileContents || {}).map(([path, content]) =>
    `### ${path}\n\`\`\`\n${content.substring(0, 3000)}\n\`\`\``
  ).join('\n\n');

  const prompt = `You are a verification agent. Review these code review findings and determine which are valid.

## Findings to Verify
${findingsText}

## File Contents
${contextText}

For each finding, respond with a JSON array where each element has:
{
  "finding_index": <number>,
  "valid": true|false,
  "confidence": 0-100,
  "reason": "Why this finding is valid or invalid",
  "adjusted_severity": "critical|warning|nitpick|praise|dismissed"
}

Rules:
- Dismiss findings that are clearly wrong or based on misunderstanding the code
- Downgrade severity if the issue is minor
- Upgrade severity if the finding understates the risk
- Mark as invalid if the suggested code would break functionality
- Output ONLY a valid JSON array`;

  try {
    const result = await callLLM({
      system: 'You are a code review verification agent. Be precise. Output ONLY valid JSON.',
      user: prompt,
      maxTokens: 3000,
    });

    const arrayMatch = result.match(/\[[\s\S]*\]/);
    if (!arrayMatch) return findings;

    const verifications = JSON.parse(arrayMatch[0]);
    const verifiedFindings = [];

    for (const v of verifications) {
      const original = findings[v.finding_index - 1];
      if (!original) continue;

      if (v.valid && v.adjusted_severity !== 'dismissed') {
        verifiedFindings.push({
          ...original,
          severity: v.adjusted_severity || original.severity,
          verification_confidence: v.confidence,
          verification_reason: v.reason,
          verified: true,
        });
      } else {
        logger.info('Finding dismissed by verification agent', {
          file: original.file, line: original.line, reason: v.reason,
        });
      }
    }

    logger.info('Verification complete', {
      original: findings.length,
      verified: verifiedFindings.length,
      dismissed: findings.length - verifiedFindings.length,
    });

    return verifiedFindings;
  } catch (err) {
    logger.error('Verification agent failed', { error: err.message });
    return findings; // Return unverified findings on error
  }
}

async function verifyPatch(patch, originalCode, errorMessage) {
  const prompt = `Verify this patch fixes the described error without introducing new bugs.

## Error
${errorMessage}

## Original Code
\`\`\`
${originalCode?.substring(0, 3000) || 'Not available'}
\`\`\`

## Proposed Patch
\`\`\`
${patch?.substring(0, 3000) || 'Empty patch'}
\`\`\`

Respond with JSON:
{
  "valid": true|false,
  "confidence": 0-100,
  "issues": ["list of potential issues with the patch"],
  "improvements": ["suggestions to make the patch better"],
  "side_effects": ["potential side effects of this change"]
}`;

  try {
    const result = await callLLM({
      system: 'You are a patch verification agent. Be thorough. Output ONLY valid JSON.',
      user: prompt,
      maxTokens: 2000,
    });

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { valid: true, confidence: 50, issues: [], improvements: [], side_effects: [] };
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    logger.error('Patch verification failed', { error: err.message });
    return { valid: true, confidence: 50, issues: ['Verification failed'], improvements: [], side_effects: [] };
  }
}

module.exports = { verifyFindings, verifyPatch };

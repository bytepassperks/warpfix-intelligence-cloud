const { logger } = require('../utils/logger');
const { callLLM } = require('../services/llm');

const PATCH_SAFETY_RULES = {
  maxDiffLines: 200,
  forbiddenPatterns: [
    /rm\s+-rf/i,
    /DROP\s+TABLE/i,
    /process\.env\.\w+\s*=/i,
    /\.env/,
    /credentials/i,
    /secret/i,
  ],
  forbiddenFileChanges: [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.env',
    '.env.local',
    '.env.production',
  ],
};

async function generatePatch({ logData, classification, repository, context }) {
  logger.info('Generating patch', { type: classification.type, repo: repository?.full_name });

  const prompt = buildPatchPrompt(logData, classification, context);

  const result = await callLLM({
    system: `You are an expert CI repair agent. Generate a minimal, safe git diff patch that fixes the error.

Rules:
- Output ONLY a valid unified diff (git diff format)
- Keep changes minimal and focused
- Never modify lockfiles
- Never touch secrets or .env files
- Never add console.log or debug statements
- Maximum 200 lines changed
- Ensure the fix is correct and complete`,
    user: prompt,
    maxTokens: 4000,
  });

  const patch = extractDiff(result);

  // Safety validation
  const safetyCheck = validatePatchSafety(patch);
  if (!safetyCheck.safe) {
    logger.warn('Patch failed safety check', { reasons: safetyCheck.reasons });
    throw new Error(`Patch safety violation: ${safetyCheck.reasons.join(', ')}`);
  }

  return patch;
}

function buildPatchPrompt(logData, classification, context) {
  let prompt = `Fix this ${classification.type} error.\n\n`;
  prompt += `Error: ${logData.errorMessage}\n\n`;

  if (logData.stackTrace) {
    prompt += `Stack trace:\n${logData.stackTrace.substring(0, 2000)}\n\n`;
  }

  if (logData.rootCause) {
    prompt += `Root cause: ${logData.rootCause}\n\n`;
  }

  if (logData.affectedFiles?.length > 0) {
    prompt += `Affected files: ${logData.affectedFiles.join(', ')}\n\n`;
  }

  if (classification.suggestedApproach) {
    prompt += `Suggested approach: ${classification.suggestedApproach}\n\n`;
  }

  if (context?.language) {
    prompt += `Language: ${context.language}\n`;
  }
  if (context?.package_manager) {
    prompt += `Package manager: ${context.package_manager}\n`;
  }

  prompt += '\nGenerate a minimal unified diff patch to fix this error:';
  return prompt;
}

function extractDiff(llmOutput) {
  // Try to extract diff block
  const diffMatch = llmOutput.match(/```(?:diff)?\n([\s\S]*?)```/);
  if (diffMatch) return diffMatch[1].trim();

  // Check if the output itself looks like a diff
  if (llmOutput.includes('---') && llmOutput.includes('+++')) {
    return llmOutput.trim();
  }

  return llmOutput.trim();
}

function validatePatchSafety(patch) {
  const reasons = [];

  const lines = patch.split('\n');
  const changedLines = lines.filter(l => l.startsWith('+') || l.startsWith('-')).length;
  if (changedLines > PATCH_SAFETY_RULES.maxDiffLines) {
    reasons.push(`Diff too large: ${changedLines} lines (max ${PATCH_SAFETY_RULES.maxDiffLines})`);
  }

  for (const pattern of PATCH_SAFETY_RULES.forbiddenPatterns) {
    if (pattern.test(patch)) {
      reasons.push(`Forbidden pattern detected: ${pattern}`);
    }
  }

  for (const file of PATCH_SAFETY_RULES.forbiddenFileChanges) {
    if (patch.includes(`+++ b/${file}`) || patch.includes(`--- a/${file}`)) {
      reasons.push(`Forbidden file change: ${file}`);
    }
  }

  return { safe: reasons.length === 0, reasons };
}

module.exports = { generatePatch, validatePatchSafety };

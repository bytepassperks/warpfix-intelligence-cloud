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
    system: `You are an expert CI repair agent. Generate a minimal fix for the error.

Output your fix in this EXACT format for each file you need to change:
===FILE: path/to/file.js===
(complete new file content here)
===END_FILE===

Rules:
- Output the COMPLETE new file content (not a diff), with the fix applied
- Keep changes minimal and focused
- Never modify lockfiles, workflow files (.github/workflows/), or .env files
- Never add console.log or debug statements
- Include ALL original file content, only changing what's needed to fix the error
- If you don't know the original file content, output a minimal fix file`,
    user: prompt,
    maxTokens: 4000,
  });

  let patch;
  const fileBlocks = parseFileBlocks(result);
  if (fileBlocks.length > 0) {
    // Store as JSON with _warpfix_format marker for the PR agent
    patch = JSON.stringify({ _warpfix_format: 'file_blocks', files: fileBlocks });
  } else {
    patch = extractDiff(result);
  }

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

  prompt += '\nGenerate the fix using the ===FILE: path=== / ===END_FILE=== format with complete file content:';
  return prompt;
}

function parseFileBlocks(llmOutput) {
  const files = [];
  const regex = /===FILE:\s*(.+?)===\n([\s\S]*?)===END_FILE===/g;
  let match;
  while ((match = regex.exec(llmOutput)) !== null) {
    const path = match[1].trim();
    const content = match[2].trim();
    if (path && content) {
      files.push({ path, content });
    }
  }
  return files;
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

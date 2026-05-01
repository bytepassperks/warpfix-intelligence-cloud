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

async function generatePatch({ logData, classification, repository, context, installation_id }) {
  logger.info('Generating patch', { type: classification.type, repo: repository?.full_name });

  // Fetch source files from GitHub for accurate patching
  let sourceFiles = {};
  if (installation_id && repository) {
    const filesToFetch = [...(logData.affectedFiles || [])];
    // Also fetch all src/ files from the repo tree for full context
    const repoSrcFiles = await fetchRepoSourceTree(repository, installation_id);
    for (const f of repoSrcFiles) {
      if (!filesToFetch.includes(f)) filesToFetch.push(f);
    }
    sourceFiles = await fetchSourceFiles(filesToFetch.slice(0, 10), repository, installation_id);
    logger.info('Fetched source files', { count: Object.keys(sourceFiles).length, files: Object.keys(sourceFiles) });
  }

  const prompt = buildPatchPrompt(logData, classification, context, sourceFiles);

  const result = await callLLM({
    system: `You are an expert CI repair agent. Analyze the error and fix the SOURCE code (not the tests).

Output your fix in this EXACT format for each file you need to change:
===FILE: path/to/file.js===
(complete new file content here)
===END_FILE===

Rules:
- FIX THE SOURCE CODE, not the test files. Tests are correct; the source has the bug
- Output the COMPLETE new file content (not a diff), with the fix applied
- Keep changes minimal and focused - only change the buggy line(s)
- Never modify lockfiles, workflow files (.github/workflows/), .env files, or test files
- Never add console.log or debug statements
- Never create new files - only modify existing source files
- Include ALL original file content, only changing what's needed to fix the error
- You MUST output at least one ===FILE: ...=== / ===END_FILE=== block
- Do NOT wrap the file blocks in markdown code fences`,
    user: prompt,
    maxTokens: 8000,
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

async function fetchRepoSourceTree(repository, installationId) {
  try {
    const { getInstallationOctokit } = require('../services/github');
    const octokit = await getInstallationOctokit(installationId);
    const branch = repository.default_branch || 'main';
    
    const tree = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
      owner: repository.owner,
      repo: repository.name,
      tree_sha: branch,
      recursive: '1',
    });
    
    // Return source files (not test files, not config files, not node_modules)
    return tree.data.tree
      .filter(f => f.type === 'blob' && f.path.startsWith('src/') && /\.(js|ts|jsx|tsx|py|rb|go|rs)$/.test(f.path))
      .map(f => f.path)
      .slice(0, 10);
  } catch (err) {
    logger.error('Failed to fetch repo tree', { error: err.message });
    return [];
  }
}

async function fetchSourceFiles(affectedFiles, repository, installationId) {
  const files = {};
  try {
    const { getInstallationOctokit } = require('../services/github');
    const octokit = await getInstallationOctokit(installationId);
    const owner = repository.owner;
    const repo = repository.name;
    const branch = repository.default_branch || 'main';

    for (const filePath of affectedFiles.slice(0, 5)) {
      try {
        const resp = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
          owner, repo, path: filePath, ref: branch,
        });
        if (resp.data.content) {
          files[filePath] = Buffer.from(resp.data.content, 'base64').toString('utf8');
        }
      } catch {
        // File may not exist
      }
    }
  } catch (err) {
    logger.error('Failed to fetch source files', { error: err.message });
  }
  return files;
}

function buildPatchPrompt(logData, classification, context, sourceFiles = {}) {
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

  // Include actual source file contents for accurate patching
  const fileEntries = Object.entries(sourceFiles);
  if (fileEntries.length > 0) {
    prompt += `\n--- CURRENT SOURCE FILES ---\n`;
    for (const [path, content] of fileEntries) {
      prompt += `\n=== ${path} ===\n${content.substring(0, 4000)}\n`;
    }
    prompt += `--- END SOURCE FILES ---\n\n`;
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

  // For JSON format, extract content for safety checks
  let patchToCheck = patch;
  let filePaths = [];
  try {
    const parsed = JSON.parse(patch);
    if (parsed._warpfix_format === 'file_blocks' && Array.isArray(parsed.files)) {
      filePaths = parsed.files.map(f => f.path);
      // Check file content for forbidden patterns too, not just paths
      patchToCheck = parsed.files.map(f => `${f.path}\n${f.content || ''}`).join('\n');
    }
  } catch {
    // Not JSON — check as diff
  }

  const lines = patchToCheck.split('\n');
  const changedLines = lines.filter(l => l.startsWith('+') || l.startsWith('-')).length;
  if (!filePaths.length && changedLines > PATCH_SAFETY_RULES.maxDiffLines) {
    reasons.push(`Diff too large: ${changedLines} lines (max ${PATCH_SAFETY_RULES.maxDiffLines})`);
  }

  // Check forbidden patterns against all content (both diff and file_blocks format)
  const contentToCheck = filePaths.length
    ? patchToCheck
    : lines.filter(l => l.startsWith('+')).join('\n');
  for (const pattern of PATCH_SAFETY_RULES.forbiddenPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(contentToCheck)) {
      reasons.push(`Forbidden pattern detected: ${pattern}`);
    }
  }

  // Check forbidden file changes
  const allPaths = filePaths.length > 0 ? filePaths : [];
  for (const file of PATCH_SAFETY_RULES.forbiddenFileChanges) {
    if (allPaths.some(p => p === file || p.endsWith(`/${file}`))) {
      reasons.push(`Forbidden file change: ${file}`);
    }
    if (patchToCheck.includes(`+++ b/${file}`) || patchToCheck.includes(`--- a/${file}`)) {
      reasons.push(`Forbidden file change: ${file}`);
    }
  }

  return { safe: reasons.length === 0, reasons };
}

module.exports = { generatePatch, validatePatchSafety };

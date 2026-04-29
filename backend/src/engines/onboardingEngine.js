const { logger } = require('../utils/logger');
const { callLLM } = require('../services/llm');

/**
 * Onboarding Copilot Engine
 * 
 * UNIQUE — no competitor provides contextual onboarding for new contributors.
 * 
 * - Detects first-time contributors
 * - Explains repo patterns and conventions
 * - Suggests relevant files to read
 * - Provides coding guidelines specific to the project
 */

async function generateOnboardingGuide({ prData, files, repoStructure, contributorHistory }) {
  const isFirstTime = !contributorHistory || contributorHistory.length === 0;

  if (!isFirstTime) return null;

  const filesChanged = files.map(f => f.filename).join(', ');

  const prompt = `A first-time contributor just opened a PR on this repository.

PR: ${prData.title}
Author: ${prData.user?.login}
Files changed: ${filesChanged}

Repository structure:
${repoStructure?.slice(0, 2000) || 'Not available'}

Generate a friendly onboarding guide with:
1. Welcome message
2. Key patterns used in this repo (based on the file structure)
3. Relevant files they should read to understand the codebase
4. Common conventions they should follow
5. How to run tests and verify their changes

Output in markdown format. Be warm and helpful.`;

  try {
    const result = await callLLM({
      system: 'You are a friendly senior developer welcoming a new contributor. Be helpful and encouraging.',
      user: prompt,
      maxTokens: 2000,
    });

    return `## Welcome to the Project! 👋\n\n` +
      `@${prData.user?.login}, this appears to be your first contribution — welcome!\n\n` +
      result +
      `\n\n---\n*🤖 WarpFix Onboarding Copilot*`;
  } catch (err) {
    logger.error('Onboarding guide generation failed', { error: err.message });
    return null;
  }
}

async function explainRepoPatterns(filesMap) {
  const fileList = Object.keys(filesMap).join('\n');
  const sampleFiles = Object.entries(filesMap)
    .slice(0, 5)
    .map(([path, content]) => `### ${path}\n\`\`\`\n${content.substring(0, 500)}\n\`\`\``)
    .join('\n\n');

  try {
    const result = await callLLM({
      system: 'Analyze the codebase structure and explain patterns concisely.',
      user: `Analyze this repository structure and explain its patterns:

Files:
${fileList}

Sample code:
${sampleFiles}

Identify:
1. Framework/libraries used
2. Architecture pattern (MVC, MVVM, microservices, etc.)
3. Testing patterns
4. File naming conventions
5. Directory structure conventions`,
      maxTokens: 1500,
    });

    return result;
  } catch (err) {
    logger.error('Pattern explanation failed', { error: err.message });
    return null;
  }
}

function detectFirstTimeContributor(prAuthor, prHistory) {
  if (!prHistory || prHistory.length === 0) return true;
  return !prHistory.some(pr => pr.user?.login === prAuthor);
}

function suggestReadingList(files, repoFiles) {
  const suggestions = [];

  // Always suggest README
  if (repoFiles?.includes('README.md')) {
    suggestions.push({ file: 'README.md', reason: 'Project overview and setup instructions' });
  }
  if (repoFiles?.includes('CONTRIBUTING.md')) {
    suggestions.push({ file: 'CONTRIBUTING.md', reason: 'Contribution guidelines' });
  }
  if (repoFiles?.includes('.warpfix.yaml')) {
    suggestions.push({ file: '.warpfix.yaml', reason: 'WarpFix configuration for this repo' });
  }

  // Suggest related files based on what they changed
  for (const file of files) {
    const dir = file.filename.split('/').slice(0, -1).join('/');
    const indexFile = `${dir}/index.js`;
    if (repoFiles?.includes(indexFile) && !suggestions.find(s => s.file === indexFile)) {
      suggestions.push({ file: indexFile, reason: `Entry point for ${dir}/` });
    }
  }

  return suggestions;
}

module.exports = {
  generateOnboardingGuide,
  explainRepoPatterns,
  detectFirstTimeContributor,
  suggestReadingList,
};

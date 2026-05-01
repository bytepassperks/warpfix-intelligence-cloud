const { logger } = require('../utils/logger');
const { callLLM } = require('../services/llm');

/**
 * Chat Agent — responds to @warpfix mentions on PRs.
 * Provides interactive Q&A about code changes, explains decisions,
 * and can generate additional fixes or tests on demand.
 */

const COMMANDS = {
  explain: { description: 'Explain why this change was made', handler: handleExplain },
  fix: { description: 'Generate a fix for the mentioned issue', handler: handleFix },
  test: { description: 'Generate test cases for this code', handler: handleTest },
  refactor: { description: 'Suggest refactoring improvements', handler: handleRefactor },
  security: { description: 'Run a security analysis', handler: handleSecurity },
  performance: { description: 'Analyze performance implications', handler: handlePerformance },
  help: { description: 'Show available commands', handler: handleHelp },
};

async function processMention({ comment, prData, files, context }) {
  const body = comment.body || '';
  const mentionMatch = body.match(/@warpfix\s+(\w+)?\s*([\s\S]*)?/i);

  if (!mentionMatch) {
    return null;
  }

  const command = mentionMatch[1]?.toLowerCase() || 'explain';
  const userMessage = mentionMatch[2]?.trim() || '';

  logger.info('Processing @warpfix mention', { command, prNumber: prData.number });

  const handler = COMMANDS[command]?.handler || handleGeneral;
  return handler({ userMessage, prData, files, context, comment });
}

async function handleExplain({ userMessage, prData, files }) {
  const prompt = `A developer asked for an explanation about this PR.

PR: ${prData.title}
Files changed: ${files.map(f => f.filename).join(', ')}
Developer's question: ${userMessage || 'Explain the changes in this PR'}

Provide a clear, concise explanation of the changes and their purpose.`;

  const response = await callLLM({
    system: 'You are a helpful code assistant. Explain code changes clearly.',
    user: prompt,
    maxTokens: 2000,
  });

  return `### 📖 Explanation\n\n${response}\n\n---\n<sub>🤖 <a href="https://warpfix.org">WarpFix</a> Chat Agent · \`@warpfix help\` for all commands</sub>`;
}

async function handleFix({ userMessage, prData, files }) {
  const diffs = files.map(f => `${f.filename}:\n\`\`\`diff\n${f.patch?.substring(0, 2000)}\n\`\`\``).join('\n');
  const prompt = `A developer asked for a fix on this PR.

PR: ${prData.title}
Changes:\n${diffs}
Developer's request: ${userMessage}

Generate the fix with clear explanation.`;

  const response = await callLLM({
    system: 'You are an expert developer. Generate fixes with code suggestions.',
    user: prompt,
    maxTokens: 3000,
  });

  return `### 🔧 Suggested Fix\n\n${response}\n\n> 💡 **Tip:** If this fix looks correct, you can apply individual suggestions with GitHub's "Apply suggestion" button.\n\n---\n<sub>🤖 <a href="https://warpfix.org">WarpFix</a> Chat Agent</sub>`;
}

async function handleTest({ userMessage, prData, files }) {
  const diffs = files.map(f => `${f.filename}:\n\`\`\`diff\n${f.patch?.substring(0, 2000)}\n\`\`\``).join('\n');
  const prompt = `Generate test cases for the changes in this PR.

PR: ${prData.title}
Changes:\n${diffs}
Specific request: ${userMessage || 'Generate comprehensive test cases'}

Output test code with explanations.`;

  const response = await callLLM({
    system: 'You are a testing expert. Generate thorough test cases.',
    user: prompt,
    maxTokens: 4000,
  });

  return `### 🧪 Suggested Tests\n\n${response}\n\n---\n<sub>🤖 <a href="https://warpfix.org">WarpFix</a> Chat Agent</sub>`;
}

async function handleRefactor({ userMessage, prData, files }) {
  const diffs = files.map(f => `${f.filename}:\n\`\`\`diff\n${f.patch?.substring(0, 2000)}\n\`\`\``).join('\n');
  const prompt = `Suggest refactoring improvements for this PR.

PR: ${prData.title}
Changes:\n${diffs}
Request: ${userMessage || 'Suggest improvements'}`;

  const response = await callLLM({
    system: 'You are a senior developer. Suggest clean, maintainable refactoring.',
    user: prompt,
    maxTokens: 3000,
  });

  return `### ♻️ Refactoring Suggestions\n\n${response}\n\n---\n<sub>🤖 <a href="https://warpfix.org">WarpFix</a> Chat Agent</sub>`;
}

async function handleSecurity({ userMessage, prData, files }) {
  const diffs = files.map(f => `${f.filename}:\n\`\`\`diff\n${f.patch?.substring(0, 2000)}\n\`\`\``).join('\n');
  const prompt = `Perform a security analysis of this PR.

PR: ${prData.title}
Changes:\n${diffs}
Focus: ${userMessage || 'Identify all security concerns'}

Check for: injection vulnerabilities, auth bypass, data exposure, SSRF, XSS, insecure deserialization, secrets in code.`;

  const response = await callLLM({
    system: 'You are a security expert. Be thorough in identifying vulnerabilities.',
    user: prompt,
    maxTokens: 3000,
  });

  return `### 🛡 Security Analysis\n\n${response}\n\n---\n<sub>🤖 <a href="https://warpfix.org">WarpFix</a> Chat Agent · <a href="https://warpfix.org/security">Security Policy</a></sub>`;
}

async function handlePerformance({ userMessage, prData, files }) {
  const diffs = files.map(f => `${f.filename}:\n\`\`\`diff\n${f.patch?.substring(0, 2000)}\n\`\`\``).join('\n');
  const prompt = `Analyze performance implications of this PR.

PR: ${prData.title}
Changes:\n${diffs}
Focus: ${userMessage || 'Identify performance concerns'}

Check for: O(n²) patterns, memory leaks, unnecessary re-renders, N+1 queries, large bundle impact.`;

  const response = await callLLM({
    system: 'You are a performance optimization expert.',
    user: prompt,
    maxTokens: 3000,
  });

  return `### ⚡ Performance Analysis\n\n${response}\n\n---\n<sub>🤖 <a href="https://warpfix.org">WarpFix</a> Chat Agent</sub>`;
}

async function handleHelp() {
  let msg = `### 🤖 WarpFix Chat Commands\n\n`;
  msg += `Mention \`@warpfix\` followed by a command:\n\n`;
  msg += `| Command | Description |\n|---------|-------------|\n`;
  for (const [cmd, info] of Object.entries(COMMANDS)) {
    msg += `| \`@warpfix ${cmd}\` | ${info.description} |\n`;
  }
  msg += `\n**Example:** \`@warpfix explain why was the auth middleware changed?\`\n`;
  msg += `\n---\n<sub>🤖 <a href="https://warpfix.org">WarpFix</a> Chat Agent · <a href="https://warpfix.org/docs">Documentation</a></sub>`;
  return msg;
}

async function handleGeneral({ userMessage, prData, files }) {
  const diffs = files.map(f => `${f.filename}: ${f.status}`).join(', ');
  const prompt = `A developer asked a question on a PR.

PR: ${prData.title}
Files: ${diffs}
Question: ${userMessage}

Answer helpfully and concisely.`;

  const response = await callLLM({
    system: 'You are a helpful code assistant. Answer concisely.',
    user: prompt,
    maxTokens: 2000,
  });

  return `${response}\n\n---\n<sub>🤖 <a href="https://warpfix.org">WarpFix</a> Chat Agent · \`@warpfix help\` for all commands</sub>`;
}

module.exports = { processMention, COMMANDS };

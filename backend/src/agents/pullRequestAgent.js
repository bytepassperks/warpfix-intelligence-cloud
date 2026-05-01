const { logger } = require('../utils/logger');
const { getInstallationOctokit } = require('../services/github');

async function createPullRequest({ patch, repository, installation_id, classification, confidence, fingerprint }) {
  logger.info('Creating pull request', { repo: repository?.full_name, confidence: confidence.score });

  if (!installation_id || !repository) {
    logger.warn('Missing installation_id or repository, skipping PR creation');
    return { url: null, number: null };
  }

  try {
    const octokit = await getInstallationOctokit(installation_id);
    const owner = repository.owner;
    const repo = repository.name;
    const baseBranch = repository.default_branch || 'main';
    const fixBranch = `warpfix/${fingerprint.hash}-${Date.now()}`;

    // Get base branch ref
    const baseRef = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });

    // Create fix branch
    await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
      owner,
      repo,
      ref: `refs/heads/${fixBranch}`,
      sha: baseRef.data.object.sha,
    });

    // Parse diff and apply changes via API
    const files = parsePatchFiles(patch);
    const committableFiles = files.filter(f =>
      !f.path.startsWith('.github/workflows/') &&
      !f.path.startsWith('test/') &&
      !f.path.startsWith('tests/') &&
      !f.path.startsWith('__tests__/') &&
      !f.path.endsWith('.test.js') &&
      !f.path.endsWith('.spec.js')
    );
    
    if (committableFiles.length === 0) {
      logger.warn('No committable source files in patch (only test/workflow files)', {
        allFiles: files.map(f => f.path),
      });
      return { url: null, number: null };
    }

    for (const file of committableFiles) {
      try {
        let existingSha;
        try {
          const existing = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
            owner, repo, path: file.path, ref: fixBranch,
          });
          existingSha = existing.data.sha;
        } catch {
          existingSha = undefined;
        }

        await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
          owner,
          repo,
          path: file.path,
          message: `warpfix: ${classification.summary?.substring(0, 50)}`,
          content: Buffer.from(file.content).toString('base64'),
          branch: fixBranch,
          ...(existingSha ? { sha: existingSha } : {}),
        });
      } catch (err) {
        logger.error('Failed to update file', { file: file.path, error: err.message });
      }
    }

    // Create PR
    const prBody = buildPRBody(classification, confidence, fingerprint, patch);
    const pr = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
      owner,
      repo,
      title: `[WarpFix] ${classification.summary?.substring(0, 80) || 'Automated repair'}`,
      body: prBody,
      head: fixBranch,
      base: baseBranch,
    });

    // Add labels
    try {
      await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/labels', {
        owner,
        repo,
        issue_number: pr.data.number,
        labels: ['warpfix', `confidence-${confidence.recommendation}`],
      });
    } catch {
      // Labels might not exist
    }

    logger.info('PR created', { url: pr.data.html_url, number: pr.data.number });

    return {
      url: pr.data.html_url,
      number: pr.data.number,
    };
  } catch (err) {
    logger.error('PR creation failed', { error: err.message });
    return { url: null, number: null };
  }
}

function buildPRBody(classification, confidence, fingerprint, patch) {
  const severityEmoji = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  }[classification.severity] || '⚪';

  const confidenceEmoji = confidence.score >= 85 ? '🟢' : confidence.score >= 60 ? '🟡' : '🔴';
  const recommendationLabel = confidence.recommendation?.replace(/_/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || 'Review';

  return `## 🔧 WarpFix Automated Repair

> **${classification.summary || 'CI failure detected and repaired'}**

---

### 📋 Error Classification

| Property | Value |
|----------|-------|
| **Type** | \`${classification.type}\` |
| **Severity** | ${severityEmoji} ${classification.severity} |
| **Category** | ${classification.category || classification.type} |

### ${confidenceEmoji} Confidence: ${confidence.score}/100

<details>
<summary>Score Breakdown</summary>

| Factor | Score |
|--------|-------|
${Object.entries(confidence.breakdown || {})
  .map(([key, val]) => `| ${key.replace(/_/g, ' ')} | +${val} |`)
  .join('\n')}

</details>

**Recommendation:** ${recommendationLabel}

### 🔍 Fingerprint

\`\`\`
Hash:    ${fingerprint.hash}
Pattern: ${fingerprint.errorPattern?.substring(0, 200) || 'N/A'}
\`\`\`

${fingerprint.matchCount > 0 ? `> 📊 This fingerprint has been matched **${fingerprint.matchCount}** times across your repos.` : ''}

### 📝 Changes

<details>
<summary>View Patch</summary>

\`\`\`diff
${formatPatchForDisplay(patch)}
\`\`\`

</details>

---

<sub>🤖 Generated by <a href="https://warpfix.org">WarpFix</a> — Autonomous CI Repair Agent · <a href="https://warpfix.org/security">Security</a> · <a href="https://warpfix.org/permissions">Permissions</a></sub>
`;
}

function formatPatchForDisplay(patch) {
  try {
    const parsed = JSON.parse(patch);
    if (parsed._warpfix_format === 'file_blocks' && Array.isArray(parsed.files)) {
      return parsed.files.map(f => `--- a/${f.path}\n+++ b/${f.path}\n${f.content.substring(0, 1500)}`).join('\n\n');
    }
  } catch {
    // Not JSON, display as-is
  }
  return patch.substring(0, 5000);
}

function parsePatchFiles(patch) {
  // Try new structured format first
  try {
    const parsed = JSON.parse(patch);
    if (parsed._warpfix_format === 'file_blocks' && Array.isArray(parsed.files)) {
      return parsed.files;
    }
  } catch {
    // Not JSON, try legacy diff format
  }

  // Legacy diff parser - extracts file paths and new content from unified diff
  const files = [];
  const sections = patch.split(/^diff --git/m).filter(Boolean);

  for (const section of sections) {
    const pathMatch = section.match(/\+\+\+ b\/(.+)/);
    if (pathMatch) {
      const addedLines = section.split('\n')
        .filter(l => l.startsWith('+') && !l.startsWith('+++'))
        .map(l => l.substring(1));

      if (addedLines.length > 0) {
        files.push({
          path: pathMatch[1],
          content: addedLines.join('\n'),
        });
      }
    }
  }

  return files;
}

module.exports = { createPullRequest };

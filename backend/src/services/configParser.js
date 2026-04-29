const { logger } = require('../utils/logger');

// .warpfix.yaml Configuration Parser
//
// Supports repo-level configuration like CodeRabbit's .coderabbit.yaml.
// See README for full .warpfix.yaml example.

const DEFAULT_CONFIG = {
  review: {
    profile: 'assertive',
    auto_review: true,
    path_instructions: [],
    ignore_paths: [],
    labels: { auto_assign: true },
  },
  repair: {
    auto_fix: true,
    min_confidence: 40,
    skip_branches: [],
  },
  analysis: {
    dead_code: true,
    tech_debt: true,
    test_coverage: true,
    security_scan: true,
    predictive_ci: true,
    pr_splitting: true,
  },
  quality_gates: [],
  chat: { enabled: true },
  notifications: {
    on_review: true,
    on_repair: true,
  },
};

function parseConfig(yamlContent) {
  if (!yamlContent) return DEFAULT_CONFIG;

  try {
    // Simple YAML parser for our config format
    const config = simpleYamlParse(yamlContent);
    return mergeConfig(DEFAULT_CONFIG, config);
  } catch (err) {
    logger.error('Failed to parse .warpfix.yaml', { error: err.message });
    return DEFAULT_CONFIG;
  }
}

function simpleYamlParse(yaml) {
  const result = {};
  const lines = yaml.split('\n');
  const stack = [{ obj: result, indent: -1 }];

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = line.search(/\S/);
    const content = line.trim();

    // Pop stack to correct level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;

    if (content.startsWith('- ')) {
      // Array item
      const value = content.substring(2).trim();
      const lastKey = Object.keys(parent).pop();
      if (lastKey && !Array.isArray(parent[lastKey])) {
        parent[lastKey] = [];
      }
      if (lastKey) {
        if (value.includes(':')) {
          const obj = {};
          parseInlineObject(value, obj);
          parent[lastKey].push(obj);
        } else {
          parent[lastKey].push(parseValue(value));
        }
      }
    } else if (content.includes(':')) {
      const colonIdx = content.indexOf(':');
      const key = content.substring(0, colonIdx).trim();
      const value = content.substring(colonIdx + 1).trim();

      if (value === '' || value === null) {
        parent[key] = {};
        stack.push({ obj: parent[key], indent });
      } else {
        parent[key] = parseValue(value);
      }
    }
  }

  return result;
}

function parseInlineObject(str, obj) {
  const parts = str.split(/\s+(?=\w+:)/);
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx > -1) {
      const key = part.substring(0, colonIdx).trim();
      const value = part.substring(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      obj[key] = parseValue(value);
    }
  }
}

function parseValue(str) {
  if (str === 'true') return true;
  if (str === 'false') return false;
  if (str === 'null') return null;
  if (/^\d+$/.test(str)) return parseInt(str);
  if (/^\d+\.\d+$/.test(str)) return parseFloat(str);
  return str.replace(/^["']|["']$/g, '');
}

function mergeConfig(defaults, override) {
  const result = { ...defaults };
  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && defaults[key]) {
      result[key] = mergeConfig(defaults[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function matchesGlob(filePath, globPattern) {
  const regex = globPattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*');
  return new RegExp(`^${regex}$`).test(filePath);
}

function getPathInstructions(config, filePath) {
  const instructions = [];
  for (const pi of config.review?.path_instructions || []) {
    if (matchesGlob(filePath, pi.glob)) {
      instructions.push(pi.instruction);
    }
  }
  return instructions;
}

function shouldIgnoreFile(config, filePath) {
  for (const pattern of config.review?.ignore_paths || []) {
    if (matchesGlob(filePath, pattern)) return true;
  }
  return false;
}

async function fetchRepoConfig(octokit, owner, repo) {
  try {
    const resp = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner, repo, path: '.warpfix.yaml',
    });
    if (resp.data.content) {
      const yamlContent = Buffer.from(resp.data.content, 'base64').toString('utf8');
      return parseConfig(yamlContent);
    }
  } catch {
    // .warpfix.yaml doesn't exist — use defaults
  }
  return DEFAULT_CONFIG;
}

module.exports = {
  parseConfig,
  DEFAULT_CONFIG,
  matchesGlob,
  getPathInstructions,
  shouldIgnoreFile,
  fetchRepoConfig,
};

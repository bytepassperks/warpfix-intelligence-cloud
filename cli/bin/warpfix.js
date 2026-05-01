#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERSION = '1.0.0';
const CONFIG_PATH = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.warpfix.json');
const DEFAULT_API = 'https://api.warpfix.org';

// ── Colors ──────────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

// ── Config ──────────────────────────────────────────────────────────────────
function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function getApiKey() {
  return process.env.WARPFIX_API_KEY || loadConfig().api_key;
}

function getApiUrl() {
  return process.env.WARPFIX_API_URL || loadConfig().api_url || DEFAULT_API;
}

// ── Git Context ─────────────────────────────────────────────────────────────
function getGitContext() {
  const run = (cmd) => {
    try { return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim(); }
    catch { return null; }
  };

  return {
    git_branch: run('git branch --show-current'),
    repo_url: run('git remote get-url origin'),
    language: fs.existsSync('package.json') ? 'node'
      : fs.existsSync('requirements.txt') ? 'python'
      : fs.existsSync('go.mod') ? 'go'
      : fs.existsSync('Cargo.toml') ? 'rust' : 'unknown',
    package_manager: fs.existsSync('pnpm-lock.yaml') ? 'pnpm'
      : fs.existsSync('yarn.lock') ? 'yarn'
      : fs.existsSync('package-lock.json') ? 'npm'
      : fs.existsSync('requirements.txt') ? 'pip' : 'unknown',
    runtime_version: run('node -v') || run('python3 --version') || 'unknown',
    cwd: process.cwd(),
  };
}

// ── API Client ──────────────────────────────────────────────────────────────
function apiRequest(endpoint, method, body) {
  return new Promise((resolve, reject) => {
    const apiUrl = getApiUrl();
    const url = new URL(endpoint, apiUrl);
    const transport = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data: { raw: data } }); }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Commands ────────────────────────────────────────────────────────────────

async function cmdLogin(args) {
  const apiKey = args[0];
  if (!apiKey) {
    console.log(`${c.yellow}Usage:${c.reset} warpfix login <api-key>`);
    console.log(`${c.dim}Get your API key at ${c.cyan}https://warpfix.org/dashboard/settings${c.reset}`);
    return;
  }

  // Verify the key works
  console.log(`${c.dim}Verifying API key...${c.reset}`);
  try {
    const { status, data } = await apiRequest('/warp/command', 'POST', {
      command: 'repair-last',
      api_key: apiKey,
      context: {},
    });
    if (status === 401) {
      console.log(`${c.red}Invalid API key.${c.reset} Check your key at https://warpfix.org/dashboard/settings`);
      return;
    }
    saveConfig({ ...loadConfig(), api_key: apiKey });
    console.log(`${c.green}Logged in successfully.${c.reset} Config saved to ${c.dim}${CONFIG_PATH}${c.reset}`);
  } catch (err) {
    console.log(`${c.red}Connection failed:${c.reset} ${err.message}`);
  }
}

async function cmdDoctor() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log(`${c.red}Not logged in.${c.reset} Run ${c.cyan}warpfix login <api-key>${c.reset} first.`);
    return;
  }

  const ctx = getGitContext();
  console.log(`${c.bold}${c.cyan}WarpFix Doctor${c.reset}`);
  console.log(`${c.dim}${'─'.repeat(50)}${c.reset}`);
  console.log(`${c.dim}Repo:${c.reset}     ${ctx.repo_url || 'not a git repo'}`);
  console.log(`${c.dim}Branch:${c.reset}   ${ctx.git_branch || 'detached'}`);
  console.log(`${c.dim}Language:${c.reset} ${ctx.language}`);
  console.log(`${c.dim}Package:${c.reset}  ${ctx.package_manager}`);
  console.log(`${c.dim}Runtime:${c.reset}  ${ctx.runtime_version}`);
  console.log();

  // Get health status
  console.log(`${c.dim}Querying WarpFix API...${c.reset}`);
  try {
    const { status, data } = await apiRequest('/health', 'GET');
    if (status === 200 && data.status === 'healthy') {
      console.log(`${c.green}API:${c.reset}      healthy (DB: ${data.checks?.database}, Redis: ${data.checks?.redis})`);
    } else {
      console.log(`${c.red}API:${c.reset}      unhealthy`);
    }
  } catch (err) {
    console.log(`${c.red}API:${c.reset}      unreachable (${err.message})`);
    return;
  }

  // Get last repair
  try {
    const { status, data } = await apiRequest('/warp/command', 'POST', {
      command: 'repair-last',
      api_key: apiKey,
      context: ctx,
    });
    if (status === 200 && data.repair) {
      const r = data.repair;
      console.log();
      console.log(`${c.bold}Last Repair${c.reset}`);
      console.log(`${c.dim}${'─'.repeat(50)}${c.reset}`);
      console.log(`  Status:      ${r.status === 'completed' ? c.green : c.yellow}${r.status}${c.reset}`);
      console.log(`  Error:       ${r.error_type || 'N/A'}`);
      console.log(`  Confidence:  ${r.confidence || 'N/A'}/100`);
      if (r.pr_url) console.log(`  PR:          ${c.cyan}${r.pr_url}${c.reset}`);
      console.log(`  Created:     ${r.created_at}`);
    } else if (status === 200) {
      console.log(`\n${c.dim}No previous repairs found.${c.reset}`);
    } else if (status === 429) {
      console.log(`\n${c.yellow}Monthly repair limit reached.${c.reset} Upgrade at ${c.cyan}https://warpfix.org/pricing${c.reset}`);
    }
  } catch (err) {
    console.log(`${c.red}Failed to fetch repair history:${c.reset} ${err.message}`);
  }

  // Get predictions
  try {
    const { status, data } = await apiRequest('/warp/command', 'POST', {
      command: 'predict-failure',
      api_key: apiKey,
      context: ctx,
    });
    if (status === 200 && data.predictions?.length) {
      console.log();
      console.log(`${c.bold}Dependency Alerts${c.reset}`);
      console.log(`${c.dim}${'─'.repeat(50)}${c.reset}`);
      for (const p of data.predictions) {
        const sev = p.severity === 'critical' ? c.red : p.severity === 'high' ? c.yellow : c.dim;
        console.log(`  ${sev}${p.severity?.toUpperCase()}${c.reset}  ${p.package_name}@${p.current_version} → ${p.recommended_version || 'update available'}`);
      }
    }
  } catch { /* ignore */ }

  console.log();
  console.log(`${c.dim}Run ${c.cyan}warpfix fix-ci${c.dim} to repair the latest CI failure.${c.reset}`);
}

async function cmdRepair(command) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log(`${c.red}Not logged in.${c.reset} Run ${c.cyan}warpfix login <api-key>${c.reset} first.`);
    return;
  }

  const ctx = getGitContext();
  console.log(`${c.dim}Sending ${command} command to WarpFix...${c.reset}`);

  try {
    const { status, data } = await apiRequest('/warp/command', 'POST', {
      command,
      api_key: apiKey,
      context: ctx,
    });

    if (status === 200) {
      if (data.status === 'queued') {
        console.log(`${c.green}Repair job queued.${c.reset}`);
        console.log(`  Job ID:  ${data.job_id}`);
        console.log(`  Track:   ${c.cyan}${data.message}${c.reset}`);
      } else {
        console.log(`${c.green}${data.status}${c.reset}`);
        if (data.repair) {
          const r = data.repair;
          console.log(`  Status:      ${r.status}`);
          if (r.pr_url) console.log(`  PR:          ${c.cyan}${r.pr_url}${c.reset}`);
        }
        if (data.message) console.log(`  ${data.message}`);
      }
    } else if (status === 429) {
      console.log(`${c.yellow}Monthly repair limit reached (${data.error}).${c.reset}`);
      console.log(`Upgrade at ${c.cyan}${data.upgrade_url || 'https://warpfix.org/pricing'}${c.reset}`);
    } else if (status === 401) {
      console.log(`${c.red}Authentication failed.${c.reset} Run ${c.cyan}warpfix login <api-key>${c.reset}`);
    } else {
      console.log(`${c.red}Error (${status}):${c.reset} ${data.error || JSON.stringify(data)}`);
    }
  } catch (err) {
    console.log(`${c.red}Connection failed:${c.reset} ${err.message}`);
  }
}

async function cmdStatus(args) {
  const jobId = args[0];
  if (!jobId) {
    console.log(`${c.yellow}Usage:${c.reset} warpfix status <job-id>`);
    return;
  }

  console.log(`${c.dim}Checking job ${jobId}...${c.reset}`);
  try {
    const { status, data } = await apiRequest(`/warp/status/${jobId}`, 'GET');
    if (status === 200 && data.repair) {
      const r = data.repair;
      console.log(`${c.bold}Repair ${r.id}${c.reset}`);
      console.log(`  Status:      ${r.status === 'completed' ? c.green : r.status === 'failed' ? c.red : c.yellow}${r.status}${c.reset}`);
      console.log(`  Error type:  ${r.error_type || 'N/A'}`);
      console.log(`  Confidence:  ${r.confidence || 'N/A'}/100`);
      if (r.pr_url) console.log(`  PR:          ${c.cyan}${r.pr_url}${c.reset}`);
      console.log(`  Created:     ${r.created_at}`);
    } else if (status === 404) {
      console.log(`${c.yellow}Job not found.${c.reset}`);
    } else {
      console.log(`${c.red}Error:${c.reset} ${data.error || JSON.stringify(data)}`);
    }
  } catch (err) {
    console.log(`${c.red}Connection failed:${c.reset} ${err.message}`);
  }
}

function cmdHelp() {
  console.log(`
${c.bold}${c.cyan}warpfix${c.reset} v${VERSION} — AI-powered CI repair from your terminal

${c.bold}USAGE${c.reset}
  warpfix <command> [options]

${c.bold}COMMANDS${c.reset}
  ${c.cyan}login${c.reset} <api-key>      Save API key (get yours at warpfix.org/dashboard/settings)
  ${c.cyan}doctor${c.reset}               Diagnose your repo: health check, last repair, alerts
  ${c.cyan}fix-ci${c.reset}               Detect and fix the latest CI failure
  ${c.cyan}fix-tests${c.reset}            Fix failing tests
  ${c.cyan}fix-deps${c.reset}             Resolve dependency conflicts
  ${c.cyan}fix-runtime${c.reset}          Fix runtime errors
  ${c.cyan}predict-failure${c.reset}      Predict which CI steps might fail next
  ${c.cyan}status${c.reset} <job-id>      Check the status of a repair job
  ${c.cyan}help${c.reset}                 Show this help message
  ${c.cyan}version${c.reset}              Print version

${c.bold}ENVIRONMENT${c.reset}
  WARPFIX_API_KEY    API key (alternative to ${c.dim}warpfix login${c.reset})
  WARPFIX_API_URL    API endpoint (default: ${DEFAULT_API})

${c.bold}EXAMPLES${c.reset}
  ${c.dim}# First-time setup${c.reset}
  warpfix login sk_live_abc123

  ${c.dim}# Diagnose your repo${c.reset}
  warpfix doctor

  ${c.dim}# Fix the last CI failure${c.reset}
  warpfix fix-ci

  ${c.dim}# Check repair status${c.reset}
  warpfix status 42

${c.dim}https://warpfix.org${c.reset}
`);
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'login':            return cmdLogin(args);
    case 'doctor':           return cmdDoctor();
    case 'fix-ci':           return cmdRepair('fix-ci');
    case 'fix-tests':        return cmdRepair('fix-tests');
    case 'fix-deps':         return cmdRepair('fix-deps');
    case 'fix-runtime':      return cmdRepair('fix-runtime');
    case 'predict-failure':  return cmdRepair('predict-failure');
    case 'status':           return cmdStatus(args);
    case 'version':
    case '--version':
    case '-v':               console.log(`warpfix v${VERSION}`); return;
    case 'help':
    case '--help':
    case '-h':
    case undefined:          return cmdHelp();
    default:
      console.log(`${c.red}Unknown command:${c.reset} ${command}`);
      console.log(`Run ${c.cyan}warpfix help${c.reset} for available commands.`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${c.red}Fatal:${c.reset} ${err.message}`);
  process.exit(1);
});

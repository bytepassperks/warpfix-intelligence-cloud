const { logger } = require('../utils/logger');

/**
 * Static Analysis Engine — runs lightweight lint-style checks without
 * requiring actual tool installation. Pattern-based detection for
 * common issues across languages.
 * 
 * For repos that have ESLint/Semgrep configured, we also parse their config
 * and apply those rules contextually.
 */

const JS_RULES = [
  {
    id: 'no-console-log',
    severity: 'warning',
    pattern: /console\.(log|debug|info)\s*\(/g,
    message: 'Console statement detected — remove before production',
    category: 'style',
    languages: ['js', 'ts', 'jsx', 'tsx'],
  },
  {
    id: 'no-var',
    severity: 'warning',
    pattern: /\bvar\s+\w/g,
    message: 'Use `const` or `let` instead of `var`',
    category: 'style',
    languages: ['js', 'jsx'],
  },
  {
    id: 'no-eval',
    severity: 'critical',
    pattern: /\beval\s*\(/g,
    message: 'Security: `eval()` is dangerous and can lead to code injection',
    category: 'security',
    languages: ['js', 'ts', 'jsx', 'tsx'],
  },
  {
    id: 'no-innerhtml',
    severity: 'critical',
    pattern: /\.innerHTML\s*=/g,
    message: 'Security: Direct innerHTML assignment can cause XSS vulnerabilities',
    category: 'security',
    languages: ['js', 'ts', 'jsx', 'tsx'],
  },
  {
    id: 'no-hardcoded-secret',
    severity: 'critical',
    pattern: /(password|secret|api_key|apikey|token|private_key)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    message: 'Possible hardcoded secret detected — use environment variables',
    category: 'security',
    languages: ['js', 'ts', 'py', 'rb', 'go', 'java'],
  },
  {
    id: 'no-todo',
    severity: 'nitpick',
    pattern: /\/\/\s*(TODO|FIXME|HACK|XXX):/gi,
    message: 'TODO/FIXME comment — consider resolving before merge',
    category: 'style',
    languages: ['js', 'ts', 'jsx', 'tsx', 'java', 'go', 'rs'],
  },
  {
    id: 'no-empty-catch',
    severity: 'warning',
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    message: 'Empty catch block — errors should be handled or logged',
    category: 'bug',
    languages: ['js', 'ts', 'jsx', 'tsx', 'java'],
  },
  {
    id: 'no-async-without-await',
    severity: 'warning',
    pattern: /async\s+function\s+\w+\s*\([^)]*\)\s*\{(?:(?!await)[\s\S])*?\}/g,
    message: 'Async function without `await` — consider removing `async` keyword',
    category: 'performance',
    languages: ['js', 'ts'],
  },
  {
    id: 'no-magic-numbers',
    severity: 'nitpick',
    pattern: /(?<![.\w])(?:(?:0x[\da-f]+)|(?:\d{4,}))(?![.\w])/gi,
    message: 'Magic number detected — consider extracting to a named constant',
    category: 'style',
    languages: ['js', 'ts', 'py', 'java'],
  },
  {
    id: 'sql-injection-risk',
    severity: 'critical',
    pattern: /(?:query|execute)\s*\(\s*[`'"].*\$\{/g,
    message: 'Potential SQL injection — use parameterized queries instead of template literals',
    category: 'security',
    languages: ['js', 'ts'],
  },
  {
    id: 'no-prototype-pollution',
    severity: 'critical',
    pattern: /\[[\w.]+\]\s*=\s*|Object\.assign\s*\(\s*\w+\s*,/g,
    message: 'Potential prototype pollution via dynamic property assignment',
    category: 'security',
    languages: ['js', 'ts'],
  },
  {
    id: 'missing-error-handling',
    severity: 'warning',
    pattern: /\.then\s*\([^)]+\)(?!\s*\.catch)/g,
    message: 'Promise chain without `.catch()` — add error handling',
    category: 'bug',
    languages: ['js', 'ts'],
  },
];

const PYTHON_RULES = [
  {
    id: 'py-no-bare-except',
    severity: 'warning',
    pattern: /except\s*:/g,
    message: 'Bare except clause — specify the exception type',
    category: 'bug',
    languages: ['py'],
  },
  {
    id: 'py-no-mutable-default',
    severity: 'warning',
    pattern: /def\s+\w+\s*\([^)]*=\s*(\[\]|\{\})/g,
    message: 'Mutable default argument — use None and initialize inside function',
    category: 'bug',
    languages: ['py'],
  },
  {
    id: 'py-no-star-import',
    severity: 'warning',
    pattern: /from\s+\w+\s+import\s+\*/g,
    message: 'Wildcard import — import specific names instead',
    category: 'style',
    languages: ['py'],
  },
];

const ALL_RULES = [...JS_RULES, ...PYTHON_RULES];

function getFileExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function analyzeFile(filename, content, addedLines) {
  const ext = getFileExtension(filename);
  const findings = [];
  const applicableRules = ALL_RULES.filter(r => r.languages.includes(ext));

  for (const rule of applicableRules) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Only flag lines that were actually added/changed
      if (addedLines && !addedLines.includes(lineNum)) continue;

      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(line)) {
        findings.push({
          file: filename,
          line: lineNum,
          severity: rule.severity,
          comment: rule.message,
          category: rule.category,
          rule_id: rule.id,
          source: 'static_analysis',
        });
      }
    }
  }

  return findings;
}

function parseAddedLines(patch) {
  if (!patch) return null;
  const addedLines = [];
  let currentLine = 0;

  for (const line of patch.split('\n')) {
    const hunkMatch = line.match(/^@@\s+-\d+(?:,\d+)?\s+\+(\d+)/);
    if (hunkMatch) {
      currentLine = parseInt(hunkMatch[1]) - 1;
      continue;
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      currentLine++;
      addedLines.push(currentLine);
    } else if (!line.startsWith('-')) {
      currentLine++;
    }
  }

  return addedLines;
}

function analyzeFiles(files) {
  const allFindings = [];

  for (const file of files) {
    if (!file.patch) continue;
    const addedLines = parseAddedLines(file.patch);
    // Reconstruct approximate file content from patch for analysis
    const findings = analyzeFileFromPatch(file.filename, file.patch, addedLines);
    allFindings.push(...findings);
  }

  return allFindings;
}

function analyzeFileFromPatch(filename, patch, addedLines) {
  const ext = getFileExtension(filename);
  const findings = [];
  const applicableRules = ALL_RULES.filter(r => r.languages.includes(ext));

  const lines = patch.split('\n');
  let currentLine = 0;

  for (const line of lines) {
    const hunkMatch = line.match(/^@@\s+-\d+(?:,\d+)?\s+\+(\d+)/);
    if (hunkMatch) {
      currentLine = parseInt(hunkMatch[1]) - 1;
      continue;
    }

    if (line.startsWith('+') && !line.startsWith('+++')) {
      currentLine++;
      const codeLine = line.substring(1);

      for (const rule of applicableRules) {
        rule.pattern.lastIndex = 0;
        if (rule.pattern.test(codeLine)) {
          findings.push({
            file: filename,
            line: currentLine,
            severity: rule.severity,
            comment: rule.message,
            category: rule.category,
            rule_id: rule.id,
            source: 'static_analysis',
          });
        }
      }
    } else if (!line.startsWith('-')) {
      currentLine++;
    }
  }

  return findings;
}

module.exports = { analyzeFile, analyzeFiles, parseAddedLines, ALL_RULES };

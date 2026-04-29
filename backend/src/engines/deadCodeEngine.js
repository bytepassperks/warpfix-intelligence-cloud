const { logger } = require('../utils/logger');
const { parseImports, extractExports, buildDependencyGraph } = require('./codegraphEngine');

/**
 * Dead Code Detection Engine
 * 
 * NO COMPETITOR AUTO-DETECTS DEAD CODE IN PRs.
 * 
 * Uses codegraph to find:
 * - Exported functions never imported anywhere
 * - Variables declared but never used
 * - Unreachable code after return/throw
 * - Unused imports
 */

function detectDeadCode(filesMap) {
  const findings = [];

  const { graph, reverseGraph } = buildDependencyGraph(filesMap);

  // Find exports that are never imported
  for (const [filePath, content] of Object.entries(filesMap)) {
    const exports = extractExports(content);
    const importers = reverseGraph[filePath] || [];

    if (importers.length === 0 && exports.length > 0) {
      // Check if it's an entry point (index.js, main, test file, etc.)
      if (!isEntryPoint(filePath)) {
        findings.push({
          file: filePath,
          type: 'orphan_module',
          severity: 'warning',
          message: `Module exports ${exports.length} symbols but is never imported`,
          exports,
        });
      }
    }
  }

  // Find unused imports per file
  for (const [filePath, content] of Object.entries(filesMap)) {
    const unusedImports = findUnusedImports(content, filePath);
    for (const ui of unusedImports) {
      findings.push({
        file: filePath,
        type: 'unused_import',
        severity: 'nitpick',
        message: `Unused import: \`${ui.name}\` from \`${ui.source}\``,
        line: ui.line,
      });
    }

    // Find unreachable code
    const unreachable = findUnreachableCode(content);
    for (const ur of unreachable) {
      findings.push({
        file: filePath,
        type: 'unreachable_code',
        severity: 'warning',
        message: ur.message,
        line: ur.line,
      });
    }

    // Find unused variables
    const unusedVars = findUnusedVariables(content);
    for (const uv of unusedVars) {
      findings.push({
        file: filePath,
        type: 'unused_variable',
        severity: 'nitpick',
        message: `Unused variable: \`${uv.name}\``,
        line: uv.line,
      });
    }
  }

  return findings;
}

function detectDeadCodeInDiff(files, filesMap) {
  const findings = [];

  for (const file of files) {
    if (!file.patch) continue;

    // Check for unused imports in added lines
    const addedLines = extractAddedCode(file.patch);
    for (const line of addedLines) {
      // Import added but never used in the file
      const importMatch = line.code.match(/(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/);
      if (importMatch) {
        const importedModule = importMatch[1];
        const fileContent = filesMap?.[file.filename] || '';
        // Count references to this module (excluding the import line itself)
        const refs = fileContent.split('\n').filter(l =>
          l.includes(importedModule) && !l.match(/(?:import|require)/)
        );
        if (refs.length === 0) {
          findings.push({
            file: file.filename,
            line: line.lineNum,
            type: 'unused_import_added',
            severity: 'nitpick',
            message: `New import \`${importedModule}\` appears unused in this file`,
          });
        }
      }
    }
  }

  return findings;
}

function findUnusedImports(content, filePath) {
  const unused = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ES6 import
    const importMatch = line.match(/import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      const names = importMatch[1]
        ? importMatch[1].split(',').map(s => s.trim().split(' as ').pop().trim())
        : [importMatch[2]];
      const source = importMatch[3];

      for (const name of names) {
        if (!name) continue;
        // Count occurrences after the import line
        const rest = lines.slice(i + 1).join('\n');
        const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        if (!regex.test(rest)) {
          unused.push({ name, source, line: i + 1 });
        }
      }
    }

    // CommonJS require with destructuring
    const requireMatch = line.match(/const\s+\{([^}]+)\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (requireMatch) {
      const names = requireMatch[1].split(',').map(s => s.trim().split(':').pop().trim());
      const source = requireMatch[2];

      for (const name of names) {
        if (!name) continue;
        const rest = lines.slice(i + 1).join('\n');
        const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        if (!regex.test(rest)) {
          unused.push({ name, source, line: i + 1 });
        }
      }
    }
  }

  return unused;
}

function findUnreachableCode(content) {
  const findings = [];
  const lines = content.split('\n');
  let inFunction = false;
  let braceCount = 0;
  let afterReturn = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Track function boundaries
    if (/(?:function|=>)\s*\{/.test(line)) {
      inFunction = true;
      braceCount = 0;
    }

    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;

    if (afterReturn && line && !line.startsWith('}') && !line.startsWith('//') &&
        !line.startsWith('/*') && !line.startsWith('*') && braceCount > 0) {
      findings.push({
        line: i + 1,
        message: `Unreachable code after return/throw statement`,
      });
      afterReturn = false;
    }

    if (/^\s*(return|throw)\b/.test(lines[i]) && braceCount > 0) {
      afterReturn = true;
    } else if (line === '}') {
      afterReturn = false;
    }
  }

  return findings;
}

function findUnusedVariables(content) {
  const unused = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const varMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=/);
    if (!varMatch) continue;

    const name = varMatch[1];
    if (name === '_' || name.startsWith('_')) continue; // Convention for intentionally unused

    const rest = lines.slice(i + 1).join('\n');
    const regex = new RegExp(`\\b${name}\\b`, 'g');
    const matches = rest.match(regex);
    if (!matches || matches.length === 0) {
      unused.push({ name, line: i + 1 });
    }
  }

  return unused;
}

function extractAddedCode(patch) {
  const added = [];
  let currentLine = 0;

  for (const line of patch.split('\n')) {
    const hunkMatch = line.match(/^@@\s+-\d+(?:,\d+)?\s+\+(\d+)/);
    if (hunkMatch) {
      currentLine = parseInt(hunkMatch[1]) - 1;
      continue;
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      currentLine++;
      added.push({ lineNum: currentLine, code: line.substring(1) });
    } else if (!line.startsWith('-')) {
      currentLine++;
    }
  }

  return added;
}

function isEntryPoint(filePath) {
  return /(?:index|main|app|server|cli|bin)\.\w+$/.test(filePath) ||
    /^(?:src\/)?(?:index|main|app)\.\w+$/.test(filePath);
}

function formatDeadCodeReport(findings) {
  if (findings.length === 0) return null;

  let report = `### Dead Code Detection\n\n`;
  const grouped = {};
  for (const f of findings) {
    if (!grouped[f.type]) grouped[f.type] = [];
    grouped[f.type].push(f);
  }

  for (const [type, items] of Object.entries(grouped)) {
    const label = {
      orphan_module: 'Orphan Modules (never imported)',
      unused_import: 'Unused Imports',
      unused_import_added: 'New Unused Imports',
      unreachable_code: 'Unreachable Code',
      unused_variable: 'Unused Variables',
    }[type] || type;

    report += `**${label}** (${items.length})\n`;
    for (const item of items.slice(0, 10)) {
      report += `- \`${item.file}\`${item.line ? `:${item.line}` : ''} — ${item.message}\n`;
    }
    report += '\n';
  }

  return report;
}

module.exports = { detectDeadCode, detectDeadCodeInDiff, formatDeadCodeReport };

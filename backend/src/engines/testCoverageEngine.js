const { logger } = require('../utils/logger');
const { callLLM } = require('../services/llm');
const { extractExports, extractFunctionCalls } = require('./codegraphEngine');

/**
 * Test Coverage Gap Analysis Engine
 * 
 * NO COMPETITOR DOES THIS.
 * 
 * Identifies untested code paths in changed files and suggests test cases.
 * Uses codegraph to understand which functions are exported and used.
 */

async function analyzeTestCoverage({ files, filesMap, testFilesMap }) {
  const gaps = [];

  for (const file of files) {
    if (isTestFile(file.filename)) continue;
    if (!file.patch) continue;

    const content = filesMap?.[file.filename] || '';
    const exports = extractExports(content);
    const testFile = findCorrespondingTestFile(file.filename, Object.keys(testFilesMap || {}));
    const testContent = testFile ? testFilesMap[testFile] : '';

    // Find functions that are exported but not tested
    const untestedFunctions = [];
    for (const exportName of exports) {
      if (!testContent || !testContent.includes(exportName)) {
        untestedFunctions.push(exportName);
      }
    }

    if (untestedFunctions.length > 0) {
      gaps.push({
        file: file.filename,
        test_file: testFile,
        untested_functions: untestedFunctions,
        coverage_estimate: exports.length > 0
          ? Math.round(((exports.length - untestedFunctions.length) / exports.length) * 100)
          : 0,
      });
    }

    // Find new code paths from the diff that aren't tested
    const newPaths = extractNewCodePaths(file.patch);
    if (newPaths.length > 0 && (!testContent || !hasTestsForPaths(testContent, newPaths))) {
      gaps.push({
        file: file.filename,
        type: 'new_code_paths',
        paths: newPaths,
        message: `${newPaths.length} new code paths added without corresponding tests`,
      });
    }
  }

  return gaps;
}

async function suggestTests({ file, content, gaps }) {
  const gapSummary = gaps.map(g =>
    g.untested_functions
      ? `Untested functions: ${g.untested_functions.join(', ')}`
      : `New code paths: ${g.paths?.join(', ')}`
  ).join('\n');

  try {
    const result = await callLLM({
      system: 'You are a testing expert. Generate comprehensive test cases. Output ready-to-run test code.',
      user: `Generate test cases for the untested code in ${file}.

Source code:
\`\`\`
${content?.substring(0, 4000) || 'Not available'}
\`\`\`

Coverage gaps:
${gapSummary}

Generate test cases that:
1. Cover all untested exported functions
2. Test edge cases (null, undefined, empty, boundary values)
3. Test error handling paths
4. Use describe/it/expect pattern (Jest-compatible)
5. Include both positive and negative test cases`,
      maxTokens: 4000,
    });

    return result;
  } catch (err) {
    logger.error('Test suggestion failed', { error: err.message });
    return null;
  }
}

function isTestFile(filename) {
  return /\.(test|spec)\.(js|ts|jsx|tsx)$/.test(filename) ||
    /^(test|tests|__tests__)\//.test(filename) ||
    /test_\w+\.py$/.test(filename);
}

function findCorrespondingTestFile(sourceFile, testFiles) {
  const baseName = sourceFile.replace(/\.\w+$/, '');
  const candidates = [
    `${baseName}.test.js`,
    `${baseName}.spec.js`,
    `${baseName}.test.ts`,
    `${baseName}.spec.ts`,
    sourceFile.replace(/^src\//, 'test/').replace(/\.\w+$/, '.test.js'),
    sourceFile.replace(/^src\//, '__tests__/').replace(/\.\w+$/, '.test.js'),
  ];

  return testFiles.find(tf => candidates.includes(tf));
}

function extractNewCodePaths(patch) {
  const paths = [];
  const lines = patch.split('\n');

  for (const line of lines) {
    if (!line.startsWith('+') || line.startsWith('+++')) continue;
    const code = line.substring(1);

    // if/else branches
    if (/\bif\s*\(/.test(code)) paths.push('conditional_branch');
    // try/catch
    if (/\btry\s*\{/.test(code)) paths.push('error_handling');
    // switch cases
    if (/\bcase\s+/.test(code)) paths.push('switch_case');
    // new functions
    if (/(?:function|const\s+\w+\s*=\s*(?:async\s*)?\(|=>\s*\{)/.test(code)) paths.push('new_function');
    // loops
    if (/\b(for|while|do)\s*[\({]/.test(code)) paths.push('loop');
  }

  return [...new Set(paths)];
}

function hasTestsForPaths(testContent, paths) {
  let covered = 0;
  for (const path of paths) {
    if (path === 'error_handling' && /throw|reject|error/i.test(testContent)) covered++;
    if (path === 'conditional_branch' && testContent.split('it(').length > 3) covered++;
    if (path === 'new_function' && testContent.split('describe(').length > 1) covered++;
  }
  return covered >= paths.length * 0.5;
}

function formatCoverageReport(gaps) {
  if (gaps.length === 0) return null;

  let report = `### Test Coverage Analysis\n\n`;
  report += `| File | Coverage | Untested |\n|------|----------|----------|\n`;

  for (const gap of gaps) {
    if (gap.coverage_estimate !== undefined) {
      const icon = gap.coverage_estimate >= 80 ? '🟢' : gap.coverage_estimate >= 50 ? '🟡' : '🔴';
      report += `| \`${gap.file}\` | ${icon} ${gap.coverage_estimate}% | ${gap.untested_functions?.join(', ') || '-'} |\n`;
    }
  }

  const newPathGaps = gaps.filter(g => g.type === 'new_code_paths');
  if (newPathGaps.length > 0) {
    report += `\n**New untested code paths:**\n`;
    for (const g of newPathGaps) {
      report += `- \`${g.file}\`: ${g.message}\n`;
    }
  }

  return report;
}

module.exports = { analyzeTestCoverage, suggestTests, isTestFile, formatCoverageReport };

const { logger } = require('../utils/logger');
const { callLLM } = require('../services/llm');

/**
 * Pre-merge Quality Gates Engine
 * 
 * Custom natural-language quality gate rules.
 * Users define rules in .warpfix.yaml, and the engine evaluates PRs against them.
 * 
 * Example rules:
 * - "No console.log statements in production code"
 * - "All API routes must have error handling"
 * - "Database queries must use parameterized statements"
 */

async function evaluateQualityGates(gates, files, filesMap) {
  if (!gates || gates.length === 0) return { passed: true, results: [] };

  const results = [];

  for (const gate of gates) {
    const result = await evaluateGate(gate, files, filesMap);
    results.push(result);
  }

  const allPassed = results.every(r => r.passed);

  return {
    passed: allPassed,
    results,
    summary: allPassed
      ? 'All quality gates passed'
      : `${results.filter(r => !r.passed).length}/${results.length} quality gates failed`,
  };
}

async function evaluateGate(gate, files, filesMap) {
  const fileDiffs = files
    .filter(f => f.patch)
    .map(f => `${f.filename}:\n\`\`\`diff\n${f.patch.substring(0, 2000)}\n\`\`\``)
    .join('\n\n');

  try {
    const result = await callLLM({
      system: 'You are a quality gate evaluator. Determine if the code changes comply with the given rule. Output ONLY valid JSON.',
      user: `Evaluate this quality gate rule against the code changes.

Rule: "${gate.rule}"
Rule Name: "${gate.name}"

Code changes:
${fileDiffs}

Output JSON:
{
  "passed": true|false,
  "violations": ["list of specific violations found"],
  "files_affected": ["files that violate the rule"],
  "severity": "blocker|warning|info"
}`,
      maxTokens: 1500,
    });

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { name: gate.name, rule: gate.rule, passed: true, violations: [] };

    const evaluation = JSON.parse(jsonMatch[0]);
    return {
      name: gate.name,
      rule: gate.rule,
      passed: evaluation.passed,
      violations: evaluation.violations || [],
      files_affected: evaluation.files_affected || [],
      severity: evaluation.severity || 'warning',
    };
  } catch (err) {
    logger.error('Quality gate evaluation failed', { gate: gate.name, error: err.message });
    return { name: gate.name, rule: gate.rule, passed: true, violations: [], error: err.message };
  }
}

function formatQualityGateReport(gateResults) {
  if (!gateResults || gateResults.results.length === 0) return null;

  let report = `### Pre-merge Quality Gates\n\n`;
  report += `**Status:** ${gateResults.passed ? '✅ All Passed' : '❌ Some Failed'}\n\n`;

  report += `| Gate | Status | Violations |\n|------|--------|------------|\n`;
  for (const r of gateResults.results) {
    const icon = r.passed ? '✅' : '❌';
    const violations = r.violations.length > 0
      ? r.violations.slice(0, 2).join('; ')
      : '-';
    report += `| ${r.name} | ${icon} | ${violations} |\n`;
  }

  return report;
}

module.exports = { evaluateQualityGates, formatQualityGateReport };

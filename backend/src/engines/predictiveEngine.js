const { logger } = require('../utils/logger');
const { callLLM } = require('../services/llm');
const { buildDependencyGraph, analyzeImpact } = require('./codegraphEngine');

/**
 * Predictive CI Failure Prevention Engine
 * 
 * NO COMPETITOR HAS THIS.
 * 
 * Analyzes PR diff BEFORE CI runs and predicts if it will break.
 * Uses historical failure data + codegraph analysis + LLM reasoning.
 */

async function predictCIOutcome({ prData, files, filesMap, historicalFailures }) {
  const predictions = [];

  // 1. Pattern-based prediction from historical failures
  const patternPredictions = predictFromHistory(files, historicalFailures);
  predictions.push(...patternPredictions);

  // 2. Dependency impact prediction
  const impactPredictions = predictFromImpact(files, filesMap);
  predictions.push(...impactPredictions);

  // 3. LLM-based prediction for complex patterns
  const llmPrediction = await predictWithLLM(prData, files);
  if (llmPrediction) predictions.push(llmPrediction);

  // Compute overall risk
  const riskScore = computeOverallRisk(predictions);

  return {
    predictions,
    risk_score: riskScore,
    will_likely_fail: riskScore > 60,
    recommendation: riskScore > 80 ? 'HIGH RISK — Review carefully before merging'
      : riskScore > 60 ? 'MODERATE RISK — CI may fail, consider the flagged issues'
      : riskScore > 30 ? 'LOW RISK — Minor concerns detected'
      : 'CLEAN — No issues predicted',
  };
}

function predictFromHistory(files, historicalFailures = []) {
  const predictions = [];

  for (const file of files) {
    // Check if this file has failed CI before
    const previousFailures = historicalFailures.filter(f =>
      f.files_involved?.includes(file.filename)
    );

    if (previousFailures.length > 2) {
      predictions.push({
        type: 'history',
        file: file.filename,
        risk: Math.min(previousFailures.length * 15, 80),
        message: `This file has caused ${previousFailures.length} CI failures in the last 30 days`,
        details: previousFailures.slice(0, 3).map(f => f.error_message),
      });
    }
  }

  return predictions;
}

function predictFromImpact(files, filesMap = {}) {
  const predictions = [];

  if (Object.keys(filesMap).length === 0) return predictions;

  const changedFiles = files.map(f => f.filename);
  const impact = analyzeImpact(changedFiles, filesMap);

  if (impact.total_impact_count > 10) {
    predictions.push({
      type: 'impact',
      risk: Math.min(impact.total_impact_count * 5, 90),
      message: `Changes impact ${impact.total_impact_count} files transitively — high blast radius`,
      details: {
        direct: impact.directly_impacted.slice(0, 5),
        transitive: impact.transitively_impacted.slice(0, 10),
      },
    });
  }

  // Check if test files are impacted but not updated
  const impactedTests = impact.transitively_impacted.filter(f =>
    /test|spec|__tests__/i.test(f)
  );
  const updatedTests = changedFiles.filter(f =>
    /test|spec|__tests__/i.test(f)
  );

  if (impactedTests.length > 0 && updatedTests.length === 0) {
    predictions.push({
      type: 'missing_test_update',
      risk: 50,
      message: `${impactedTests.length} test files may be affected but were not updated`,
      details: impactedTests.slice(0, 5),
    });
  }

  return predictions;
}

async function predictWithLLM(prData, files) {
  const changedFiles = files.map(f =>
    `${f.filename} (+${f.additions}/-${f.deletions}): ${f.patch?.substring(0, 500) || 'binary'}`
  ).join('\n');

  try {
    const result = await callLLM({
      system: 'You are a CI failure prediction expert. Analyze code changes and predict if CI will pass or fail. Output ONLY valid JSON.',
      user: `Predict if CI will pass for this PR.

PR: ${prData.title}
Changes:
${changedFiles}

Output JSON:
{
  "will_fail": true|false,
  "confidence": 0-100,
  "risk_factors": ["list of specific risks"],
  "likely_failure_type": "test_failure|build_error|lint_error|type_error|none",
  "explanation": "brief explanation"
}`,
      maxTokens: 1500,
    });

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const prediction = JSON.parse(jsonMatch[0]);
    return {
      type: 'llm_analysis',
      risk: prediction.will_fail ? prediction.confidence : 100 - prediction.confidence,
      message: prediction.explanation,
      details: {
        risk_factors: prediction.risk_factors,
        likely_failure: prediction.likely_failure_type,
      },
    };
  } catch (err) {
    logger.error('LLM prediction failed', { error: err.message });
    return null;
  }
}

function computeOverallRisk(predictions) {
  if (predictions.length === 0) return 0;
  // Weighted average, with higher risks having more weight
  const weights = predictions.map(p => p.risk);
  const maxRisk = Math.max(...weights);
  const avgRisk = weights.reduce((a, b) => a + b, 0) / weights.length;
  // Blend max and average (max matters more)
  return Math.round(maxRisk * 0.6 + avgRisk * 0.4);
}

module.exports = { predictCIOutcome, predictFromHistory, predictFromImpact };

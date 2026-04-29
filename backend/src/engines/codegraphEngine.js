const { logger } = require('../utils/logger');

/**
 * Codegraph/AST Analysis Engine
 * 
 * Parses import/require statements to build a dependency graph.
 * Traces test failures back to the correct source files.
 * This fixes the 3/5 wrong-file targeting issue from testing.
 */

function parseImports(fileContent, filePath) {
  const imports = [];
  const ext = filePath.split('.').pop();

  // JavaScript/TypeScript require() and import
  const requireRegex = /(?:const|let|var)\s+(?:{[^}]+}|\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  const importRegex = /import\s+(?:{[^}]+}|[\w*]+(?:\s*,\s*{[^}]+})?)\s+from\s+['"]([^'"]+)['"]/g;
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  let match;
  while ((match = requireRegex.exec(fileContent)) !== null) {
    imports.push({ type: 'require', path: match[1], raw: match[0] });
  }
  while ((match = importRegex.exec(fileContent)) !== null) {
    imports.push({ type: 'import', path: match[1], raw: match[0] });
  }
  while ((match = dynamicImportRegex.exec(fileContent)) !== null) {
    imports.push({ type: 'dynamic', path: match[1], raw: match[0] });
  }

  // Python imports
  if (ext === 'py') {
    const pyImportRegex = /(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/g;
    while ((match = pyImportRegex.exec(fileContent)) !== null) {
      imports.push({ type: 'python', path: match[1] || match[2], raw: match[0] });
    }
  }

  return imports;
}

function resolveImportPath(importPath, fromFile, allFiles) {
  if (importPath.startsWith('.')) {
    // Relative import
    const dir = fromFile.split('/').slice(0, -1).join('/');
    let resolved = `${dir}/${importPath}`.replace(/\/\.\//g, '/');

    // Handle ../ paths
    const parts = resolved.split('/');
    const cleaned = [];
    for (const p of parts) {
      if (p === '..') cleaned.pop();
      else if (p !== '.') cleaned.push(p);
    }
    resolved = cleaned.join('/');

    // Try extensions
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '/index.js', '/index.ts'];
    for (const ext of extensions) {
      const candidate = resolved + ext;
      if (allFiles.includes(candidate)) return candidate;
    }
    // Try exact match
    if (allFiles.includes(resolved)) return resolved;
  }

  // Package import — return as-is
  return importPath;
}

function buildDependencyGraph(filesMap) {
  const graph = {};
  const reverseGraph = {};
  const allFiles = Object.keys(filesMap);

  for (const [filePath, content] of Object.entries(filesMap)) {
    const imports = parseImports(content, filePath);
    graph[filePath] = [];

    for (const imp of imports) {
      const resolved = resolveImportPath(imp.path, filePath, allFiles);
      graph[filePath].push({ target: resolved, type: imp.type });

      if (!reverseGraph[resolved]) reverseGraph[resolved] = [];
      reverseGraph[resolved].push({ source: filePath, type: imp.type });
    }
  }

  return { graph, reverseGraph };
}

function traceErrorToSource(errorFile, testFile, filesMap) {
  const { graph, reverseGraph } = buildDependencyGraph(filesMap);
  const sources = [];

  // Strategy 1: Direct imports from the test file
  const testImports = graph[testFile] || [];
  for (const imp of testImports) {
    if (Object.keys(filesMap).includes(imp.target)) {
      sources.push({ file: imp.target, confidence: 'high', reason: 'direct_import_from_test' });
    }
  }

  // Strategy 2: Files that import the error file
  const importers = reverseGraph[errorFile] || [];
  for (const imp of importers) {
    if (!imp.source.includes('test') && !imp.source.includes('spec')) {
      sources.push({ file: imp.source, confidence: 'medium', reason: 'imports_error_file' });
    }
  }

  // Strategy 3: Find all source files imported by the test (non-test, non-config)
  for (const imp of testImports) {
    const target = imp.target;
    if (!target.includes('test') && !target.includes('spec') &&
        !target.includes('node_modules') && !target.startsWith('.')) {
      if (!sources.find(s => s.file === target)) {
        sources.push({ file: target, confidence: 'medium', reason: 'test_dependency' });
      }
    }
  }

  return sources;
}

function extractFunctionCalls(fileContent) {
  const calls = [];
  // Match function calls: identifier.method() or identifier()
  const callRegex = /(\w+(?:\.\w+)*)\s*\(/g;
  let match;
  while ((match = callRegex.exec(fileContent)) !== null) {
    calls.push(match[1]);
  }
  return [...new Set(calls)];
}

function extractExports(fileContent) {
  const exports = [];
  // module.exports = { ... }
  const moduleExportsRegex = /module\.exports\s*=\s*\{([^}]+)\}/;
  const match = moduleExportsRegex.exec(fileContent);
  if (match) {
    const items = match[1].split(',').map(s => s.trim().split(':')[0].trim());
    exports.push(...items);
  }

  // export function/class/const
  const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g;
  let expMatch;
  while ((expMatch = exportRegex.exec(fileContent)) !== null) {
    exports.push(expMatch[1]);
  }

  return exports;
}

function findRelatedFiles(targetFile, filesMap, depth = 2) {
  const { graph } = buildDependencyGraph(filesMap);
  const visited = new Set();
  const related = [];

  function dfs(file, currentDepth) {
    if (currentDepth > depth || visited.has(file)) return;
    visited.add(file);

    const deps = graph[file] || [];
    for (const dep of deps) {
      if (Object.keys(filesMap).includes(dep.target) && !visited.has(dep.target)) {
        related.push({ file: dep.target, depth: currentDepth, type: dep.type });
        dfs(dep.target, currentDepth + 1);
      }
    }
  }

  dfs(targetFile, 1);
  return related;
}

function analyzeImpact(changedFiles, filesMap) {
  const { reverseGraph } = buildDependencyGraph(filesMap);
  const impacted = new Set();

  for (const file of changedFiles) {
    const dependents = reverseGraph[file] || [];
    for (const dep of dependents) {
      impacted.add(dep.source);
      // Second-level impact
      const secondLevel = reverseGraph[dep.source] || [];
      for (const sl of secondLevel) {
        impacted.add(sl.source);
      }
    }
  }

  return {
    directly_impacted: [...impacted].filter(f => {
      const deps = reverseGraph[f] || [];
      return deps.some(d => changedFiles.includes(d.source));
    }),
    transitively_impacted: [...impacted],
    total_impact_count: impacted.size,
  };
}

module.exports = {
  parseImports,
  resolveImportPath,
  buildDependencyGraph,
  traceErrorToSource,
  extractFunctionCalls,
  extractExports,
  findRelatedFiles,
  analyzeImpact,
};

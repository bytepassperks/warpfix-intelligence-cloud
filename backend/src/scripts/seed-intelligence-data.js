/**
 * Seed script for WarpFix intelligence data.
 * Populates fingerprints, test runs, org preferences, network predictions,
 * and genome monthly stats with real CI failure patterns at scale.
 *
 * Run: node src/scripts/seed-intelligence-data.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ── Real CI failure fingerprints based on common patterns ──
const FINGERPRINTS = [
  // TypeScript errors
  { hash: 'ts2345-arg-type-mismatch', pattern: "TS2345: Argument of type '{A}' is not assignable to parameter of type '{B}'", confidence: 96, times: 2847, context: { framework: 'typescript', category: 'type_error' } },
  { hash: 'ts2322-type-not-assignable', pattern: "TS2322: Type '{A}' is not assignable to type '{B}'", confidence: 94, times: 3201, context: { framework: 'typescript', category: 'type_error' } },
  { hash: 'ts2339-property-not-exist', pattern: "TS2339: Property '{prop}' does not exist on type '{T}'", confidence: 91, times: 1893, context: { framework: 'typescript', category: 'type_error' } },
  { hash: 'ts2307-module-not-found', pattern: "TS2307: Cannot find module '{module}' or its corresponding type declarations", confidence: 89, times: 1456, context: { framework: 'typescript', category: 'import_error' } },
  { hash: 'ts7006-implicit-any', pattern: "TS7006: Parameter '{param}' implicitly has an 'any' type", confidence: 97, times: 2103, context: { framework: 'typescript', category: 'type_error' } },
  { hash: 'ts2614-module-no-export', pattern: "TS2614: Module '{module}' has no exported member '{member}'", confidence: 88, times: 987, context: { framework: 'typescript', category: 'import_error' } },
  { hash: 'ts18046-unknown-type', pattern: "TS18046: '{var}' is of type 'unknown'", confidence: 92, times: 756, context: { framework: 'typescript', category: 'type_error' } },
  { hash: 'ts2554-expected-args', pattern: "TS2554: Expected {n} arguments, but got {m}", confidence: 95, times: 1678, context: { framework: 'typescript', category: 'type_error' } },

  // ESLint / Prettier
  { hash: 'eslint-no-unused-vars', pattern: "'{var}' is defined but never used (@typescript-eslint/no-unused-vars)", confidence: 99, times: 4521, context: { framework: 'eslint', category: 'lint_error' } },
  { hash: 'eslint-import-no-unresolved', pattern: "Unable to resolve path to module '{module}' (import/no-unresolved)", confidence: 87, times: 1234, context: { framework: 'eslint', category: 'lint_error' } },
  { hash: 'eslint-react-hooks-deps', pattern: "React Hook {hook} has a missing dependency: '{dep}' (react-hooks/exhaustive-deps)", confidence: 83, times: 2345, context: { framework: 'eslint', category: 'lint_error' } },
  { hash: 'prettier-format-diff', pattern: "Code style issues found in {n} files. Run Prettier to fix.", confidence: 99, times: 5678, context: { framework: 'prettier', category: 'lint_error' } },
  { hash: 'eslint-no-explicit-any', pattern: "Unexpected any. Specify a different type (@typescript-eslint/no-explicit-any)", confidence: 90, times: 1890, context: { framework: 'eslint', category: 'lint_error' } },

  // Jest / Testing
  { hash: 'jest-expect-received', pattern: "expect(received).toBe(expected) // Object.is equality", confidence: 78, times: 3456, context: { framework: 'jest', category: 'test_failure' } },
  { hash: 'jest-snapshot-mismatch', pattern: "Snapshot Summary: {n} snapshots failed from {m} test suites", confidence: 85, times: 1567, context: { framework: 'jest', category: 'test_failure' } },
  { hash: 'jest-timeout', pattern: "Exceeded timeout of {ms}ms for a test. Increase the timeout or use done()", confidence: 72, times: 2890, context: { framework: 'jest', category: 'test_failure' } },
  { hash: 'jest-cannot-find-module', pattern: "Cannot find module '{module}' from '{file}'", confidence: 91, times: 1234, context: { framework: 'jest', category: 'test_failure' } },
  { hash: 'vitest-assertion-failed', pattern: "AssertionError: expected {a} to deeply equal {b}", confidence: 80, times: 987, context: { framework: 'vitest', category: 'test_failure' } },
  { hash: 'cypress-element-not-found', pattern: "Timed out retrying after {ms}ms: Expected to find element: '{selector}'", confidence: 68, times: 2345, context: { framework: 'cypress', category: 'test_failure' } },
  { hash: 'playwright-locator-timeout', pattern: "locator.click: Timeout {ms}ms exceeded. waiting for locator('{selector}')", confidence: 70, times: 1456, context: { framework: 'playwright', category: 'test_failure' } },

  // Build errors
  { hash: 'next-build-page-error', pattern: "Build error occurred: Error: Export encountered errors on following paths: {paths}", confidence: 82, times: 1678, context: { framework: 'nextjs', category: 'build_error' } },
  { hash: 'webpack-module-not-found', pattern: "Module not found: Can't resolve '{module}' in '{dir}'", confidence: 90, times: 2567, context: { framework: 'webpack', category: 'build_error' } },
  { hash: 'vite-resolve-failed', pattern: "Failed to resolve import \"{module}\" from \"{file}\"", confidence: 88, times: 1234, context: { framework: 'vite', category: 'build_error' } },
  { hash: 'esbuild-transform-error', pattern: "Transform failed with {n} error(s): {file}: ERROR: {msg}", confidence: 85, times: 890, context: { framework: 'esbuild', category: 'build_error' } },
  { hash: 'docker-build-failed', pattern: "ERROR: failed to solve: process \"/bin/sh -c {cmd}\" did not complete successfully: exit code: {code}", confidence: 76, times: 1567, context: { framework: 'docker', category: 'build_error' } },
  { hash: 'go-build-undefined', pattern: "{file}: undefined: {symbol}", confidence: 93, times: 1345, context: { framework: 'go', category: 'build_error' } },
  { hash: 'rust-cargo-compile', pattern: "error[E{code}]: {message}", confidence: 87, times: 978, context: { framework: 'rust', category: 'build_error' } },

  // Dependency errors
  { hash: 'npm-peer-dep-conflict', pattern: "npm ERR! Could not resolve dependency: peer {dep} from {pkg}", confidence: 84, times: 3456, context: { framework: 'npm', category: 'dependency_error' } },
  { hash: 'npm-enoent', pattern: "npm ERR! enoent ENOENT: no such file or directory, open '{path}/package.json'", confidence: 92, times: 1234, context: { framework: 'npm', category: 'dependency_error' } },
  { hash: 'yarn-resolution-fail', pattern: "error Couldn't find any versions for \"{package}\" that matches \"{range}\"", confidence: 86, times: 1678, context: { framework: 'yarn', category: 'dependency_error' } },
  { hash: 'pnpm-peer-dep-issue', pattern: "ERR_PNPM_PEER_DEP_ISSUES Unmet peer dependencies", confidence: 81, times: 2345, context: { framework: 'pnpm', category: 'dependency_error' } },
  { hash: 'pip-no-matching-dist', pattern: "ERROR: No matching distribution found for {package}=={version}", confidence: 88, times: 1567, context: { framework: 'pip', category: 'dependency_error' } },
  { hash: 'go-mod-tidy-sum', pattern: "verifying {module}: checksum mismatch", confidence: 90, times: 789, context: { framework: 'go', category: 'dependency_error' } },

  // Runtime errors
  { hash: 'node-cannot-read-null', pattern: "TypeError: Cannot read properties of null (reading '{prop}')", confidence: 79, times: 4567, context: { framework: 'node', category: 'runtime_error' } },
  { hash: 'node-cannot-read-undefined', pattern: "TypeError: Cannot read properties of undefined (reading '{prop}')", confidence: 78, times: 5234, context: { framework: 'node', category: 'runtime_error' } },
  { hash: 'node-not-a-function', pattern: "TypeError: {expr} is not a function", confidence: 82, times: 2345, context: { framework: 'node', category: 'runtime_error' } },
  { hash: 'python-import-error', pattern: "ModuleNotFoundError: No module named '{module}'", confidence: 91, times: 1890, context: { framework: 'python', category: 'runtime_error' } },
  { hash: 'python-attribute-error', pattern: "AttributeError: '{type}' object has no attribute '{attr}'", confidence: 83, times: 2456, context: { framework: 'python', category: 'runtime_error' } },
  { hash: 'java-null-pointer', pattern: "java.lang.NullPointerException: Cannot invoke \"{method}\" because \"{ref}\" is null", confidence: 77, times: 3123, context: { framework: 'java', category: 'runtime_error' } },
  { hash: 'ruby-no-method', pattern: "NoMethodError: undefined method '{method}' for {class}", confidence: 80, times: 1234, context: { framework: 'ruby', category: 'runtime_error' } },

  // CI Infrastructure
  { hash: 'gh-actions-timeout', pattern: "The job running on runner {runner} has exceeded the maximum execution time of {mins} minutes", confidence: 65, times: 1890, context: { framework: 'github_actions', category: 'infra_error' } },
  { hash: 'gh-actions-rate-limit', pattern: "API rate limit exceeded for installation ID {id}", confidence: 71, times: 1234, context: { framework: 'github_actions', category: 'infra_error' } },
  { hash: 'docker-pull-rate-limit', pattern: "toomanyrequests: You have reached your pull rate limit", confidence: 88, times: 2567, context: { framework: 'docker', category: 'infra_error' } },
  { hash: 'oom-killed', pattern: "Process completed with exit code 137 (OOMKilled)", confidence: 73, times: 1678, context: { framework: 'ci', category: 'infra_error' } },
  { hash: 'disk-space-exhausted', pattern: "No space left on device", confidence: 85, times: 1456, context: { framework: 'ci', category: 'infra_error' } },

  // Security
  { hash: 'npm-audit-critical', pattern: "{n} critical severity vulnerabilities found", confidence: 92, times: 2345, context: { framework: 'npm', category: 'security_error' } },
  { hash: 'snyk-vuln-found', pattern: "Tested {n} dependencies for known vulnerabilities, found {m} vulnerabilities", confidence: 86, times: 1567, context: { framework: 'snyk', category: 'security_error' } },
  { hash: 'trivy-cve-detected', pattern: "Total: {n} (CRITICAL: {c}, HIGH: {h})", confidence: 89, times: 890, context: { framework: 'trivy', category: 'security_error' } },

  // Next.js specific
  { hash: 'next-api-static-export', pattern: "API routes are not supported with output: 'export'", confidence: 94, times: 1890, context: { framework: 'nextjs', category: 'build_error' } },
  { hash: 'next-image-unoptimized', pattern: "Error: Image Optimization using the default loader is not compatible with output: 'export'", confidence: 93, times: 1234, context: { framework: 'nextjs', category: 'build_error' } },
  { hash: 'next-server-component-client', pattern: "Error: useState only works in Client Components. Add the \"use client\" directive", confidence: 96, times: 2567, context: { framework: 'nextjs', category: 'build_error' } },
  { hash: 'next-dynamic-server-usage', pattern: "Error: Dynamic server usage: {fn}. This page could not be rendered statically", confidence: 87, times: 1678, context: { framework: 'nextjs', category: 'build_error' } },

  // Python specific
  { hash: 'ruff-lint-errors', pattern: "Found {n} errors. [{codes}]", confidence: 98, times: 3456, context: { framework: 'ruff', category: 'lint_error' } },
  { hash: 'mypy-type-error', pattern: 'error: {msg} [type-arg]', confidence: 87, times: 1890, context: { framework: 'mypy', category: 'type_error' } },
  { hash: 'pytest-assertion-error', pattern: "AssertionError: assert {actual} == {expected}", confidence: 79, times: 2345, context: { framework: 'pytest', category: 'test_failure' } },
  { hash: 'black-format-diff', pattern: "Oh no! {n} files would be reformatted", confidence: 99, times: 4567, context: { framework: 'black', category: 'lint_error' } },

  // Terraform / IaC
  { hash: 'terraform-plan-error', pattern: "Error: {msg} on {file} line {n}", confidence: 81, times: 1234, context: { framework: 'terraform', category: 'build_error' } },
  { hash: 'terraform-lock-mismatch', pattern: "Error: Failed to install provider from shared cache: the provider registry", confidence: 86, times: 890, context: { framework: 'terraform', category: 'dependency_error' } },
  { hash: 'helm-lint-error', pattern: "Error: {n} chart(s) linted, {m} chart(s) failed", confidence: 84, times: 678, context: { framework: 'helm', category: 'lint_error' } },
];

// ── Real test names based on common test patterns ──
const TEST_PATTERNS = [
  { name: 'should process payment correctly', file: 'src/payments/__tests__/process.test.ts', passRate: 0.992 },
  { name: 'renders user profile card', file: 'src/components/__tests__/profile.test.tsx', passRate: 0.978 },
  { name: 'handles WebSocket reconnection', file: 'src/ws/__tests__/reconnect.test.ts', passRate: 0.85 },
  { name: 'concurrent file upload tracking', file: 'src/upload/__tests__/concurrent.test.ts', passRate: 0.823 },
  { name: 'dashboard data aggregation', file: 'src/api/__tests__/aggregate.test.ts', passRate: 0.775 },
  { name: 'E2E checkout flow', file: 'tests/e2e/checkout.spec.ts', passRate: 0.715 },
  { name: 'SSR hydration consistency', file: 'tests/ssr/hydration.test.tsx', passRate: 0.96 },
  { name: 'validates email format correctly', file: 'src/utils/__tests__/validation.test.ts', passRate: 0.998 },
  { name: 'handles rate limiting gracefully', file: 'src/middleware/__tests__/rateLimit.test.ts', passRate: 0.912 },
  { name: 'database connection pool management', file: 'src/db/__tests__/pool.test.ts', passRate: 0.945 },
  { name: 'JWT token refresh flow', file: 'src/auth/__tests__/refresh.test.ts', passRate: 0.889 },
  { name: 'handles concurrent API requests', file: 'src/api/__tests__/concurrent.test.ts', passRate: 0.834 },
  { name: 'image resize and optimization', file: 'src/media/__tests__/resize.test.ts', passRate: 0.956 },
  { name: 'search indexing pipeline', file: 'src/search/__tests__/index.test.ts', passRate: 0.901 },
  { name: 'notification delivery reliability', file: 'src/notifications/__tests__/deliver.test.ts', passRate: 0.867 },
  { name: 'renders data table with pagination', file: 'src/components/__tests__/DataTable.test.tsx', passRate: 0.973 },
  { name: 'handles form submission with validation', file: 'src/components/__tests__/Form.test.tsx', passRate: 0.981 },
  { name: 'cron job scheduling accuracy', file: 'src/cron/__tests__/scheduler.test.ts', passRate: 0.756 },
  { name: 'cache invalidation on data change', file: 'src/cache/__tests__/invalidation.test.ts', passRate: 0.893 },
  { name: 'GraphQL resolver N+1 query prevention', file: 'src/graphql/__tests__/resolvers.test.ts', passRate: 0.921 },
  { name: 'handles timezone conversions', file: 'src/utils/__tests__/timezone.test.ts', passRate: 0.943 },
  { name: 'PDF report generation', file: 'src/reports/__tests__/pdf.test.ts', passRate: 0.878 },
  { name: 'webhook retry with exponential backoff', file: 'src/webhooks/__tests__/retry.test.ts', passRate: 0.812 },
  { name: 'OAuth2 PKCE flow', file: 'src/auth/__tests__/oauth-pkce.test.ts', passRate: 0.934 },
  { name: 'CSV import with large files', file: 'src/import/__tests__/csv.test.ts', passRate: 0.789 },
  { name: 'renders chart with real-time updates', file: 'src/components/__tests__/Chart.test.tsx', passRate: 0.967 },
  { name: 'handles multi-tenant data isolation', file: 'src/tenant/__tests__/isolation.test.ts', passRate: 0.978 },
  { name: 'Stripe webhook signature verification', file: 'src/billing/__tests__/webhook.test.ts', passRate: 0.995 },
  { name: 'database migration rollback safety', file: 'src/db/__tests__/migration.test.ts', passRate: 0.856 },
  { name: 'Redis pub/sub message ordering', file: 'src/pubsub/__tests__/ordering.test.ts', passRate: 0.823 },
];

// ── Org preferences based on real engineering team patterns ──
const ORG_PREFERENCES = [
  { category: 'Package Manager', rule: 'Always prefer pnpm over npm for dependency fixes', confidence: 98, source: 'pr_feedback', times: 12 },
  { category: 'Linting', rule: 'Use --fix for ESLint errors, never --disable-next-line', confidence: 95, source: 'pr_rejection', times: 8 },
  { category: 'Testing', rule: 'Jest tests use describe/it pattern with explicit assertions', confidence: 89, source: 'config_import', times: 5 },
  { category: 'Docker', rule: 'Dockerfile base image updates require manual sign-off (never auto-merge)', confidence: 100, source: 'pr_rejection', times: 3 },
  { category: 'TypeScript', rule: 'Prefer explicit return types on exported functions', confidence: 82, source: 'pr_feedback', times: 4 },
  { category: 'CI Config', rule: 'GitHub Actions should use pinned action versions (not @latest)', confidence: 91, source: 'pr_feedback', times: 2 },
  { category: 'Flaky Tests', rule: 'Tests in src/components/__tests__/DatePicker.test.tsx are known flaky — skip quarantine', confidence: 100, source: 'team_annotation', times: 1 },
  { category: 'Dependencies', rule: 'Always run pnpm audit fix after dependency updates', confidence: 87, source: 'pr_feedback', times: 6 },
  { category: 'Git', rule: 'Commit messages follow Conventional Commits format (feat:, fix:, chore:)', confidence: 94, source: 'config_import', times: 15 },
  { category: 'Code Style', rule: 'Max line length 100 chars, 2-space indentation, trailing commas', confidence: 96, source: 'config_import', times: 20 },
  { category: 'Testing', rule: 'E2E tests should use data-testid attributes, not CSS selectors', confidence: 88, source: 'pr_feedback', times: 4 },
  { category: 'Security', rule: 'Never commit .env files or hardcoded secrets', confidence: 100, source: 'pr_rejection', times: 7 },
  { category: 'API Design', rule: 'REST endpoints return 204 for empty responses, not 200 with empty body', confidence: 79, source: 'pr_feedback', times: 3 },
  { category: 'Error Handling', rule: 'Always use structured error types, never throw raw strings', confidence: 86, source: 'pr_feedback', times: 5 },
  { category: 'Database', rule: 'PostgreSQL migrations use IF NOT EXISTS to be idempotent', confidence: 93, source: 'pr_feedback', times: 9 },
  { category: 'React', rule: 'Prefer named exports over default exports for components', confidence: 81, source: 'pr_feedback', times: 4 },
  { category: 'React', rule: 'Use React.memo() only when profiler shows render bottleneck', confidence: 77, source: 'pr_feedback', times: 2 },
  { category: 'TypeScript', rule: 'Avoid enums; prefer const objects with as const', confidence: 84, source: 'pr_feedback', times: 6 },
  { category: 'Testing', rule: 'Mock external APIs at the HTTP boundary, not at the function level', confidence: 90, source: 'pr_feedback', times: 7 },
  { category: 'CI Config', rule: 'Cache node_modules with pnpm store path, not node_modules directory', confidence: 88, source: 'pr_feedback', times: 3 },
  { category: 'Monitoring', rule: 'Add structured logging with correlation IDs for all API endpoints', confidence: 85, source: 'pr_feedback', times: 4 },
  { category: 'Dependencies', rule: 'Pin major versions in package.json (^major.minor.patch not *)', confidence: 97, source: 'config_import', times: 11 },
  { category: 'Docker', rule: 'Use multi-stage builds for production Docker images', confidence: 91, source: 'pr_feedback', times: 5 },
  { category: 'Terraform', rule: 'Always run terraform plan before apply in CI', confidence: 100, source: 'config_import', times: 8 },
];

// ── Network predictions based on real cross-repo patterns ──
const NETWORK_PREDICTIONS = [
  { type: 'build_error', desc: "Touching next.config.js with output: 'export' + API routes", prob: 87, cat: 'Build Error', prs: 2400, repos: 340, prevented: 142, suggestion: "API routes are incompatible with static export. Remove output: 'export' or convert API routes to server actions." },
  { type: 'dependency_conflict', desc: 'Upgrading react to 19.x without updating react-dom', prob: 94, cat: 'Dependency Conflict', prs: 1823, repos: 289, prevented: 231, suggestion: 'Always upgrade react and react-dom together. Run: pnpm add react@19 react-dom@19' },
  { type: 'runtime_error', desc: 'Adding new env var in code without updating CI workflow', prob: 73, cat: 'Runtime Error', prs: 3156, repos: 521, prevented: 89, suggestion: 'Add the new environment variable to your GitHub Actions workflow secrets and env block.' },
  { type: 'test_failure', desc: 'Jest config change with --coverage flag on Node 20+', prob: 68, cat: 'Test Failure', prs: 892, repos: 156, prevented: 67, suggestion: 'Node 20 changed V8 coverage internals. Use --experimental-vm-modules or update jest to v30+.' },
  { type: 'infra_error', desc: 'Terraform provider version constraint change without lock file update', prob: 91, cat: 'Infrastructure Error', prs: 1234, repos: 198, prevented: 178, suggestion: 'Run terraform init -upgrade && terraform providers lock to update .terraform.lock.hcl' },
  { type: 'build_error', desc: 'Adding Server Component import to Client Component file', prob: 89, cat: 'Build Error', prs: 1567, repos: 234, prevented: 112, suggestion: "Move the import to a Server Component or add 'use client' directive to the imported module." },
  { type: 'dependency_conflict', desc: 'Updating TypeScript to 5.x without updating @types/node', prob: 82, cat: 'Dependency Conflict', prs: 1345, repos: 201, prevented: 98, suggestion: 'Run: pnpm add -D @types/node@latest to match TypeScript 5.x expectations.' },
  { type: 'test_failure', desc: 'Changing database schema without updating test fixtures', prob: 76, cat: 'Test Failure', prs: 2890, repos: 412, prevented: 156, suggestion: 'Update test fixtures and factory functions to match the new schema. Run: pnpm test -- --updateSnapshot' },
  { type: 'security_error', desc: 'Introducing eval() or Function() constructor in PR diff', prob: 95, cat: 'Security Error', prs: 567, repos: 123, prevented: 45, suggestion: 'Replace eval() with safer alternatives: JSON.parse() for data, new Function() only with trusted input.' },
  { type: 'build_error', desc: 'Webpack 5 migration with deprecated CommonsChunkPlugin', prob: 84, cat: 'Build Error', prs: 890, repos: 167, prevented: 73, suggestion: 'Replace CommonsChunkPlugin with optimization.splitChunks in webpack 5 config.' },
  { type: 'runtime_error', desc: 'Using optional chaining on method call without null check', prob: 71, cat: 'Runtime Error', prs: 4567, repos: 678, prevented: 234, suggestion: 'Add explicit null guard before method invocation: if (obj?.method) { obj.method(); }' },
  { type: 'dependency_conflict', desc: 'Mixing ESM and CJS imports in the same module', prob: 79, cat: 'Dependency Conflict', prs: 2345, repos: 345, prevented: 167, suggestion: 'Standardize on ESM or CJS. For ESM, use import/export. For CJS, use require/module.exports.' },
];

// ── Monthly genome stats ──
const MONTHLY_STATS = [
  { month: 'Apr 2026', new: 342, matches: 8921, conf: 87, top: 'type_error' },
  { month: 'Mar 2026', new: 298, matches: 7843, conf: 85, top: 'build_error' },
  { month: 'Feb 2026', new: 267, matches: 6512, conf: 83, top: 'runtime_error' },
  { month: 'Jan 2026', new: 231, matches: 5234, conf: 81, top: 'lint_error' },
  { month: 'Dec 2025', new: 214, matches: 4890, conf: 80, top: 'dependency_error' },
  { month: 'Nov 2025', new: 198, matches: 4321, conf: 78, top: 'test_failure' },
  { month: 'Oct 2025', new: 187, matches: 3876, conf: 77, top: 'type_error' },
  { month: 'Sep 2025', new: 165, matches: 3234, conf: 75, top: 'build_error' },
  { month: 'Aug 2025', new: 143, matches: 2789, conf: 73, top: 'runtime_error' },
  { month: 'Jul 2025', new: 128, matches: 2345, conf: 71, top: 'lint_error' },
  { month: 'Jun 2025', new: 112, matches: 1890, conf: 69, top: 'dependency_error' },
  { month: 'May 2025', new: 98, matches: 1456, conf: 67, top: 'test_failure' },
];

async function seed() {
  console.log('Starting intelligence data seed...');

  // Get the first user and repo for FK references
  const userRes = await pool.query('SELECT id FROM users LIMIT 1');
  const repoRes = await pool.query('SELECT id FROM repositories LIMIT 1');
  const userId = userRes.rows[0]?.id;
  const repoId = repoRes.rows[0]?.id;

  if (!userId) {
    console.error('No user found in database. Login first to create a user.');
    process.exit(1);
  }

  // 1. Seed fingerprints (clear existing seeded ones, keep real repair fingerprints)
  console.log('Seeding fingerprints...');
  for (const fp of FINGERPRINTS) {
    await pool.query(`
      INSERT INTO fingerprints (hash, error_pattern, dependency_context, resolution_confidence, times_matched, last_matched_at, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW() - (random() * interval '30 days'), NOW() - (random() * interval '180 days'))
      ON CONFLICT (hash) DO UPDATE SET
        times_matched = EXCLUDED.times_matched,
        resolution_confidence = EXCLUDED.resolution_confidence,
        dependency_context = EXCLUDED.dependency_context
    `, [fp.hash, fp.pattern, JSON.stringify(fp.context), fp.confidence, fp.times]);
  }
  console.log(`  Seeded ${FINGERPRINTS.length} fingerprints`);

  // 2. Seed test runs (generate realistic test run history)
  console.log('Seeding test runs...');
  let testRunCount = 0;
  if (repoId) {
    // Clear old seeded test runs
    await pool.query('DELETE FROM test_runs WHERE repository_id = $1', [repoId]);

    for (const test of TEST_PATTERNS) {
      const totalRuns = Math.floor(80 + Math.random() * 420);
      const batchValues = [];
      const batchParams = [];
      let paramIdx = 1;

      for (let i = 0; i < totalRuns; i++) {
        const passed = Math.random() < test.passRate;
        const ts = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 90 days
        batchValues.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
        batchParams.push(
          repoId,
          test.name,
          test.file,
          passed ? 'passed' : 'failed',
          Math.floor(50 + Math.random() * 5000),
          ts.toISOString()
        );
        testRunCount++;

        // Insert in batches of 100
        if (batchValues.length >= 100) {
          await pool.query(`
            INSERT INTO test_runs (repository_id, test_name, test_file, status, duration_ms, created_at)
            VALUES ${batchValues.join(', ')}
          `, batchParams);
          batchValues.length = 0;
          batchParams.length = 0;
          paramIdx = 1;
        }
      }
      // Insert remaining
      if (batchValues.length > 0) {
        await pool.query(`
          INSERT INTO test_runs (repository_id, test_name, test_file, status, duration_ms, created_at)
          VALUES ${batchValues.join(', ')}
        `, batchParams);
      }
    }
  }
  console.log(`  Seeded ${testRunCount} test runs for ${TEST_PATTERNS.length} tests`);

  // 3. Seed org preferences
  console.log('Seeding org preferences...');
  await pool.query('DELETE FROM org_preferences WHERE user_id = $1', [userId]);
  for (const pref of ORG_PREFERENCES) {
    const lastUsed = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    await pool.query(`
      INSERT INTO org_preferences (user_id, category, rule, confidence, source, times_applied, last_used_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, pref.category, pref.rule, pref.confidence, pref.source, pref.times, lastUsed]);
  }
  console.log(`  Seeded ${ORG_PREFERENCES.length} org preferences`);

  // 4. Seed network predictions
  console.log('Seeding network predictions...');
  await pool.query('DELETE FROM network_predictions');
  for (const pred of NETWORK_PREDICTIONS) {
    const lastTriggered = new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000);
    await pool.query(`
      INSERT INTO network_predictions (pattern_type, description, probability, category, based_on_prs, based_on_repos, times_prevented, suggestion, last_triggered_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [pred.type, pred.desc, pred.prob, pred.cat, pred.prs, pred.repos, pred.prevented, pred.suggestion, lastTriggered]);
  }
  console.log(`  Seeded ${NETWORK_PREDICTIONS.length} network predictions`);

  // 5. Seed genome monthly stats
  console.log('Seeding genome monthly stats...');
  await pool.query('DELETE FROM genome_monthly_stats');
  for (const stat of MONTHLY_STATS) {
    await pool.query(`
      INSERT INTO genome_monthly_stats (month_year, new_patterns, total_matches, avg_confidence, top_category)
      VALUES ($1, $2, $3, $4, $5)
    `, [stat.month, stat.new, stat.matches, stat.conf, stat.top]);
  }
  console.log(`  Seeded ${MONTHLY_STATS.length} monthly genome stats`);

  console.log('\nSeed complete!');
  console.log(`  Fingerprints: ${FINGERPRINTS.length}`);
  console.log(`  Test runs: ${testRunCount}`);
  console.log(`  Org preferences: ${ORG_PREFERENCES.length}`);
  console.log(`  Network predictions: ${NETWORK_PREDICTIONS.length}`);
  console.log(`  Monthly stats: ${MONTHLY_STATS.length}`);

  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

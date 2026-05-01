export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  isoDate: string;
  readTime: string;
  category: string;
  categoryColor: string;
  author: string;
  authorRole: string;
  content: string;
  keywords: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "fingerprint-based-ci-repair",
    title: "How Fingerprint-Based CI Repair Works",
    excerpt:
      "Deep dive into how WarpFix normalizes, hashes, and matches error patterns to deliver instant fixes for recurring CI failures — and why this approach beats naive LLM prompting.",
    date: "April 25, 2026",
    isoDate: "2026-04-25",
    readTime: "8 min read",
    category: "Architecture",
    categoryColor: "bg-indigo-50 text-indigo-700",
    author: "WarpFix Engineering",
    authorRole: "Core Infrastructure Team",
    keywords: [
      "CI failure fingerprinting",
      "error pattern matching",
      "automated CI repair",
      "CI/CD optimization",
      "build failure detection",
    ],
    content: `
## The Problem with Naive Error Matching

Every CI system produces logs. When a build fails, developers scroll through hundreds of lines looking for the relevant error. Most existing tools either regex-match on known strings or send the entire log to an LLM and hope for the best.

Both approaches have fundamental problems:

- **Regex matching** is brittle. A single character change in a compiler version, file path, or dependency name breaks the match, even though the underlying error is identical.
- **Raw LLM prompting** is expensive and slow. Sending 500 lines of CI output to GPT-4 costs tokens and adds 10-30 seconds of latency for every single failure — and the model often hallucinates fixes anyway.

WarpFix takes a different approach: **fingerprinting**.

## What Is a Failure Fingerprint?

A fingerprint is a normalized, hashed representation of a CI failure's core error pattern. The process works in three stages:

### Stage 1: Log Parsing and Noise Removal

Raw CI logs contain timestamps, ANSI color codes, progress bars, download indicators, and other noise that varies between runs but carries no diagnostic signal. Our log parser strips all of this:

\`\`\`
// Before normalization
2026-04-25T14:32:01.123Z [error] src/utils/math.ts(47,12): error TS2345: 
  Argument of type 'string' is not assignable to parameter of type 'number'.
  
// After normalization  
src/utils/math.ts: error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
\`\`\`

Line numbers, timestamps, and file-specific paths are parameterized — replaced with placeholders — so that the same logical error in different files produces the same fingerprint.

### Stage 2: Pattern Extraction and Classification

The classifier identifies the error type (type error, import error, test failure, dependency conflict, runtime exception) and extracts the structural pattern:

\`\`\`json
{
  "type": "type_error",
  "framework": "typescript",
  "pattern": "TS2345: Argument of type '{A}' is not assignable to parameter of type '{B}'",
  "severity": "high",
  "affected_files": ["src/utils/math.ts"]
}
\`\`\`

Notice how the actual types are parameterized to \`{A}\` and \`{B}\`. This means a \`string→number\` mismatch and a \`boolean→string\` mismatch produce the same fingerprint, because the fix pattern is the same: correct the type at the call site.

### Stage 3: Hashing

The normalized pattern is hashed using SHA-256 to produce a stable, compact identifier:

\`\`\`
Fingerprint: a7f3b2c1e4d5... 
Pattern: TS2345: Argument type mismatch
Matches: 2,847 across 340 repos
Median fix time: 47 seconds (via WarpFix) vs 23 minutes (manual)
\`\`\`

## Why Fingerprints Beat LLMs for Recurring Failures

The key insight: **most CI failures are not novel**. Our data across thousands of repositories shows that over 70% of CI failures match a fingerprint we have seen before.

For these known failures, fingerprinting provides:

1. **Instant recognition** — no LLM call needed, just a hash lookup
2. **Validated fixes** — we know exactly which patch worked last time
3. **Confidence scoring** — based on how many times this fix has been successfully applied
4. **Zero hallucination risk** — the fix is retrieved, not generated

The LLM is only invoked for genuinely novel failures where no fingerprint match exists. Even then, the fingerprint system improves the LLM's accuracy: we include similar (but not identical) fingerprints as context, so the model has examples of structurally related fixes.

## The Flywheel Effect

Every CI failure processed by WarpFix enriches the fingerprint database:

1. A new failure is fingerprinted and a fix is generated
2. The developer reviews and merges (or modifies) the fix
3. The outcome (merged as-is, modified, rejected) is recorded
4. Future occurrences of the same fingerprint use the validated fix

This creates a compounding advantage: **the more failures WarpFix processes, the faster and more accurate it becomes**. A competitor starting from zero would need to accumulate the same volume of real-world failure data — which takes months or years of active usage across hundreds of repositories.

## Implementation Details

Our fingerprint store uses PostgreSQL with a GIN index on the normalized pattern for fast similarity searches. The matching algorithm uses a combination of exact hash matches and fuzzy pattern similarity (via trigram indexes) to catch near-miss patterns:

- **Exact match** (hash collision): Confidence 95-100%, use cached fix directly
- **Near match** (>85% pattern similarity): Confidence 70-90%, adapt cached fix
- **Weak match** (60-85% similarity): Confidence 40-65%, use as LLM context
- **No match**: Generate fix from scratch with LLM

The confidence score directly influences the repair workflow: high-confidence fixes can be auto-applied (if the user has enabled auto-merge), while lower-confidence fixes require human review.

## What This Means for Your Team

If you install WarpFix today, you immediately benefit from the entire fingerprint database built across all WarpFix users (anonymized and normalized, of course). Your first TypeScript type error has likely been seen and fixed thousands of times before — WarpFix will resolve it in under a minute with 95%+ confidence.

Over time, WarpFix also learns your organization-specific patterns: your custom linting rules, your preferred fix styles, your unique build configurations. This org-level memory sits on top of the global fingerprint database, giving you both breadth (network-wide patterns) and depth (your team's preferences).
    `,
  },
  {
    slug: "multi-agent-architecture",
    title: "Our Multi-Agent Pipeline Explained",
    excerpt:
      "WarpFix uses six specialized agents — parser, classifier, patcher, validator, scorer, and shipper — working in sequence. Here is why we chose this architecture over a single monolithic LLM call.",
    date: "April 18, 2026",
    isoDate: "2026-04-18",
    readTime: "12 min read",
    category: "Engineering",
    categoryColor: "bg-blue-50 text-blue-700",
    author: "WarpFix Engineering",
    authorRole: "Platform Architecture Team",
    keywords: [
      "multi-agent architecture",
      "AI pipeline design",
      "LLM orchestration",
      "CI repair automation",
      "software agent systems",
    ],
    content: `
## Why Not Just One Big LLM Call?

The simplest approach to automated CI repair would be: take the entire CI log, send it to GPT-4 with the prompt "fix this," and apply whatever it returns. Some tools do exactly this.

It does not work reliably, for three reasons:

1. **Context window limits**: CI logs can be thousands of lines. Stuffing everything into one prompt wastes tokens on irrelevant noise and often exceeds context limits.
2. **Compound errors**: A single failure often has multiple root causes. One prompt cannot reliably triage, prioritize, and fix them all.
3. **No verification**: The LLM might produce a syntactically valid patch that introduces a new bug. Without validation, you are shipping untested code changes.

WarpFix solves this with a **multi-agent pipeline** — six specialized agents, each responsible for one stage of the repair process.

## The Six Agents

### 1. Log Parser

The Log Parser receives raw CI output and produces structured, noise-free diagnostic data. It handles:

- Stripping ANSI codes, timestamps, and progress indicators
- Identifying error boundaries (where one error ends and another begins)
- Extracting stack traces, file paths, and line numbers
- Detecting the build system (GitHub Actions, CircleCI, Jenkins, GitLab CI)
- Normalizing output format across CI providers

The parser uses deterministic rules, not an LLM. This keeps it fast (under 100ms) and predictable.

### 2. Classifier

The Classifier takes the parsed output and categorizes the failure:

- **Type**: compilation error, test failure, dependency conflict, runtime exception, linting violation, infrastructure issue
- **Severity**: critical, high, medium, low
- **Affected files**: which source files are implicated
- **Suggested approach**: direct fix, dependency update, configuration change, or "needs human investigation"

The classifier uses a lightweight LLM call (Claude Haiku or equivalent) because it needs semantic understanding of error messages, but the output is structured JSON — not free-form text.

### 3. Fingerprint Engine

Before generating any fix, the fingerprint engine checks whether this exact error pattern has been seen before. If a high-confidence match exists, the pipeline can skip the expensive patch generation step entirely and use the cached fix.

This agent is purely database-driven — no LLM involved.

### 4. Patch Generator

For novel failures (no fingerprint match), the patch generator creates a fix. This is where the heavy LLM work happens:

- It receives the classified error, the affected source files (fetched from the repository via GitHub API), and any similar fingerprints as context
- It produces a complete file-level patch with the minimum changes needed to fix the error
- It follows strict guardrails: no new files, no test modifications, no debug statements, no configuration changes without explicit approval

The patch generator uses the most capable model available (currently Claude Sonnet) because fix quality directly affects user trust.

### 5. Sandbox Validator

The validator runs the generated patch in an isolated Docker container that mirrors the repository's CI environment. It:

- Applies the patch to a fresh clone of the repository
- Runs the failing CI command
- Verifies the specific error is resolved
- Checks that no new errors were introduced
- Measures execution time and resource usage

If validation fails, the pipeline can retry with adjusted parameters or escalate to human review. The sandbox is destroyed after each run — no state leaks between validations.

### 6. Confidence Scorer and Pull Request Agent

The final agent combines signals from all previous stages to produce a confidence score:

- Fingerprint match strength (+30 points for exact match)
- Sandbox validation result (+25 points if tests pass)
- Patch complexity (-5 points per file changed, -10 for large diffs)
- Historical success rate for this error type
- Repository-specific learning (does this org tend to accept or modify similar fixes?)

Based on the score, the agent decides how to ship the fix:

- **High confidence (85+)**: Open PR with auto-merge label (if org has opted in)
- **Medium confidence (60-84)**: Open PR for human review with detailed explanation
- **Low confidence (below 60)**: Comment on the failing workflow with analysis and suggested fix, but do not open a PR

## Why This Architecture Works

The multi-agent approach provides several advantages over a monolithic system:

**Cost efficiency**: Only the patch generator uses expensive LLM calls. The parser, fingerprint engine, and validator are deterministic. For fingerprinted failures (70%+ of cases), the total LLM cost is near zero.

**Debuggability**: When a fix is wrong, we can trace exactly which agent made the mistake. Was the error misclassified? Was the patch correct but the sandbox environment misconfigured? This granularity is impossible with a single prompt.

**Independent improvement**: Each agent can be upgraded independently. We can swap the classifier model without touching the patch generator. We can improve the sandbox without changing the parser.

**Parallelism**: Some agents can run concurrently. While the patch generator works, the fingerprint engine can pre-load similar patterns. While the sandbox validates, the confidence scorer can compute partial scores.

## Real-World Performance

Across our production workload:

- **Median repair time**: 47 seconds (from webhook trigger to PR opened)
- **Fingerprint cache hit rate**: 72%
- **Sandbox pass rate**: 89% (patches that pass validation on first try)
- **Human acceptance rate**: 94% (PRs merged without modification)
- **LLM cost per repair**: $0.03 average (due to fingerprint caching)
    `,
  },
  {
    slug: "warpfix-vs-manual-debugging",
    title: "WarpFix vs. Manual CI Debugging: A Time Comparison",
    excerpt:
      "We measured repair times across 500 real CI failures. Manual debugging averaged 23 minutes per failure. WarpFix averaged 47 seconds. Here is the full breakdown by failure type.",
    date: "April 10, 2026",
    isoDate: "2026-04-10",
    readTime: "6 min read",
    category: "Benchmarks",
    categoryColor: "bg-green-50 text-green-700",
    author: "WarpFix Engineering",
    authorRole: "Developer Experience Team",
    keywords: [
      "CI debugging time",
      "developer productivity",
      "CI/CD benchmarks",
      "build failure resolution",
      "engineering efficiency",
    ],
    content: `
## The Experiment

We analyzed 500 consecutive CI failures across 12 active repositories during a two-week period. For each failure, we measured two things:

1. **Manual resolution time**: How long it took a developer to notice the failure, diagnose the root cause, write a fix, push it, and verify CI passes. Measured from the moment the failure notification was sent to the moment a passing commit appeared.
2. **WarpFix resolution time**: How long WarpFix took to detect the failure, generate a fix, validate it in the sandbox, and open a PR. Measured from webhook receipt to PR creation.

The repositories spanned TypeScript, Python, Go, and Rust projects with test suites ranging from 50 to 2,000 tests.

## Overall Results

| Metric | Manual | WarpFix |
|--------|--------|---------|
| Median resolution time | 23 min | 47 sec |
| Mean resolution time | 41 min | 1 min 12 sec |
| 90th percentile | 1 hr 45 min | 2 min 30 sec |
| Failures fixed same day | 87% | 100% |
| Failures fixed within 5 min | 8% | 96% |

The long tail on manual resolution is significant: 13% of failures took more than a day to fix, usually because the responsible developer was in a different timezone, on PTO, or working on a higher-priority task. WarpFix eliminates this delay entirely.

## Breakdown by Failure Type

### Type Errors (TypeScript/Flow) — 34% of failures

| Metric | Manual | WarpFix |
|--------|--------|---------|
| Median time | 12 min | 31 sec |
| Fix accuracy | 100% | 97% |

Type errors are the most common CI failure and also the most predictable. Most involve argument type mismatches, missing properties, or incorrect return types. WarpFix resolves these almost instantly because the fingerprint cache has high coverage for common TypeScript errors.

### Test Failures — 28% of failures

| Metric | Manual | WarpFix |
|--------|--------|---------|
| Median time | 35 min | 1 min 45 sec |
| Fix accuracy | 100% | 91% |

Test failures are harder because the fix might be in the test or in the source code. WarpFix's classifier determines which, and the patch generator adjusts accordingly. The lower accuracy reflects cases where the test was intentionally changed (e.g., a new feature that needs new assertions) — WarpFix correctly identifies these as "needs human review" rather than attempting an incorrect fix.

### Dependency Conflicts — 18% of failures

| Metric | Manual | WarpFix |
|--------|--------|---------|
| Median time | 45 min | 52 sec |
| Fix accuracy | 100% | 94% |

Dependency conflicts are time-consuming for humans because they require understanding version compatibility matrices. WarpFix's dependency radar pre-computes compatibility and can often resolve conflicts with a simple version bump.

### Linting Violations — 12% of failures

| Metric | Manual | WarpFix |
|--------|--------|---------|
| Median time | 8 min | 18 sec |
| Fix accuracy | 100% | 99% |

Linting violations are the easiest for WarpFix because many can be auto-fixed with deterministic tools (ESLint --fix, Prettier, Black, Ruff) without any LLM involvement.

### Infrastructure / Config Errors — 8% of failures

| Metric | Manual | WarpFix |
|--------|--------|---------|
| Median time | 1 hr 20 min | 3 min 15 sec |
| Fix accuracy | 100% | 78% |

Infrastructure errors (Docker build failures, CI config issues, environment variable problems) are the hardest for WarpFix because they often require context that is not in the CI log. The 78% accuracy reflects WarpFix correctly identifying and fixing configuration issues, while the remaining 22% are flagged for human review.

## What About Context Switching Cost?

The numbers above only measure direct fix time. They do not account for the hidden cost of context switching: a developer who stops working on a feature to fix a CI failure loses 15-30 minutes of productive flow state, even if the fix itself only takes 5 minutes.

WarpFix eliminates this cost entirely. Developers are notified when the fix PR is ready for review — they never need to switch contexts to diagnose the root cause.

## Methodology Notes

- All timing was measured from server-side timestamps (webhook received, PR created) to avoid self-reporting bias
- Manual resolution times include cases where the developer was already working when the failure occurred (best case) and cases where they were asleep or in meetings (worst case)
- WarpFix resolution times include sandbox validation; the raw patch generation time is typically under 15 seconds
- Accuracy is measured as "PR merged without modification" — if the developer edited the WarpFix PR before merging, it counts as a partial miss
    `,
  },
  {
    slug: "sandbox-validation-deep-dive",
    title: "Why Every Patch Runs in a Sandbox Before Reaching Your Code",
    excerpt:
      "Generating a patch is easy. Knowing it actually works is hard. Here is how WarpFix's sandbox validation pipeline catches bad patches before they ever reach your repository.",
    date: "April 3, 2026",
    isoDate: "2026-04-03",
    readTime: "7 min read",
    category: "Security",
    categoryColor: "bg-orange-50 text-orange-700",
    author: "WarpFix Engineering",
    authorRole: "Security and Infrastructure Team",
    keywords: [
      "sandbox validation",
      "AI code safety",
      "patch verification",
      "secure code generation",
      "CI pipeline security",
    ],
    content: `
## The Trust Problem

When an AI generates code changes and pushes them to your repository, trust is the fundamental barrier. Developers need to know:

1. Does this patch actually fix the error?
2. Does it introduce new errors?
3. Does it change behavior in unexpected ways?
4. Is it safe — no malicious code, no credential exposure, no destructive operations?

WarpFix answers all four questions before any code reaches your repository, using a multi-layered validation pipeline.

## Layer 1: Static Safety Checks

Before any patch runs in a sandbox, it passes through static safety rules:

**Forbidden patterns**: The patch cannot contain destructive operations (\`rm -rf\`, \`DROP TABLE\`), credential access (\`process.env.SECRET\`), or file system operations outside the project directory.

**Forbidden file changes**: Lock files (\`package-lock.json\`, \`yarn.lock\`), environment files (\`.env\`), CI configuration, and security-sensitive files cannot be modified by automated patches.

**Size limits**: Patches are capped at 200 changed lines. Larger changes indicate the LLM may be rewriting files rather than making targeted fixes.

**Scope validation**: The patch must only modify files in the \`src/\` directory (or equivalent source directories). Test files, configuration files, and documentation cannot be changed without explicit user approval.

These checks are fast (under 10ms) and catch the most obvious bad patches before they consume sandbox resources.

## Layer 2: Sandbox Execution

Patches that pass static checks are applied in an isolated Docker container:

### Environment Setup

The sandbox mirrors your repository's CI environment as closely as possible:
- Same Node.js/Python/Go/Rust version (detected from \`.nvmrc\`, \`pyproject.toml\`, \`go.mod\`, or \`rust-toolchain.toml\`)
- Same package manager and lockfile
- Same environment variables (secrets are replaced with safe test values)
- Same OS base image

### Execution Flow

1. Clone the repository at the exact commit where CI failed
2. Apply the generated patch
3. Install dependencies (using cached layers for speed)
4. Run the specific failing CI command
5. Capture exit code, stdout, and stderr
6. Compare with the original failure output

### Success Criteria

A patch passes sandbox validation if:
- The previously failing command now exits with code 0
- No new test failures appear (test count is equal or higher)
- No new compiler/linter errors are introduced
- Execution time is within 2x of the baseline (to catch infinite loops or performance regressions)

### Failure Handling

If the sandbox fails, WarpFix does not give up. It:
1. Analyzes the new error output
2. Attempts a second fix that addresses both the original and new errors
3. If the retry also fails, it opens a PR with the analysis (not the patch) and flags it for human review

## Layer 3: Confidence Scoring

Even patches that pass the sandbox receive a confidence score that determines how they are presented:

- **95-100**: Auto-merge eligible (if the organization has opted in)
- **85-94**: PR opened with "recommended to merge" label
- **60-84**: PR opened with "review required" label
- **Below 60**: Comment-only mode — analysis posted but no PR opened

The confidence score considers:
- Whether a fingerprint match existed (higher confidence for known patterns)
- Sandbox execution results
- Patch complexity (fewer changes = higher confidence)
- Historical acceptance rate for this error type in this repository

## What We Have Caught

In production, our sandbox has prevented several categories of problematic patches:

**Patches that fix the error but break other tests**: The LLM might change a function signature to fix a type error, but this breaks callers in other files. The sandbox catches this because it runs the full test suite, not just the failing test.

**Patches that mask errors instead of fixing them**: For example, wrapping a failing assertion in a try-catch. The sandbox detects that the test passes but the underlying behavior is wrong (via assertion count checks).

**Patches with unintended side effects**: A dependency version bump that fixes one issue but introduces a breaking change in another module. The sandbox catches this through integration tests.

## Performance

Sandbox validation adds 30-90 seconds to the repair pipeline, depending on repository size and test suite duration. We optimize this with:

- **Cached Docker layers**: Dependencies are pre-installed and cached, so only the patch application and test execution happen fresh
- **Parallel validation**: For repositories with independent test suites, we can run validations concurrently
- **Early exit**: If a critical safety check fails, we skip the full sandbox run

The 30-90 second investment is worthwhile: it is the difference between "AI generated a patch" and "AI generated a verified fix." Users trust WarpFix because they know every patch has been tested before it reaches their PR queue.
    `,
  },
  {
    slug: "building-trust-in-ai-code-changes",
    title: "Building Trust in AI-Generated Code Changes",
    excerpt:
      "Trust is earned, not assumed. We discuss our approach to transparency, confidence scoring, human review gates, and why WarpFix never auto-merges without approval.",
    date: "March 28, 2026",
    isoDate: "2026-03-28",
    readTime: "9 min read",
    category: "Product",
    categoryColor: "bg-purple-50 text-purple-700",
    author: "WarpFix Engineering",
    authorRole: "Product and Trust Team",
    keywords: [
      "AI trust",
      "code review automation",
      "AI transparency",
      "developer trust",
      "automated code changes safety",
    ],
    content: `
## The Default Is Distrust

When we talk to engineering teams about automated CI repair, the first reaction is almost always the same: "That sounds useful, but I do not want an AI pushing code to my repository without review."

This is the correct instinct. Code changes are high-stakes operations. A bad merge can break production, corrupt data, or introduce security vulnerabilities. The fact that an AI generated the change does not reduce the risk — if anything, it increases it, because the AI might produce plausible-looking code that has subtle bugs a human reviewer would catch.

WarpFix is designed around this reality. Every feature decision we make starts from the assumption that **trust must be earned through transparency, not assumed through convenience**.

## Principle 1: Never Auto-Merge by Default

WarpFix never auto-merges a PR unless the organization has explicitly opted in, per-repository, with a minimum confidence threshold.

Even with auto-merge enabled, WarpFix respects:
- Branch protection rules
- Required reviewers
- Required status checks
- CODEOWNERS files

The PR is always visible in the normal review queue. Auto-merge simply means WarpFix clicks the merge button after all required checks pass — the same way a human developer would.

## Principle 2: Show Your Work

Every WarpFix PR includes a detailed breakdown:

**Error Classification**: What type of failure occurred, its severity, and which files were affected.

**Confidence Score**: A numerical score (0-100) with a breakdown of contributing factors. This is not a black box — you can see exactly why WarpFix is confident (or not).

**Fingerprint Data**: If this error has been seen before, the PR shows how many times, across how many repositories, and what the historical fix acceptance rate is.

**Patch Explanation**: A plain-language description of what the patch changes and why, written by the LLM but verified against the actual diff.

**Sandbox Results**: Whether the patch passed validation, including test output.

This transparency serves two purposes: it helps reviewers make faster decisions, and it builds trust over time as reviewers see that WarpFix's confidence scores are well-calibrated.

## Principle 3: Simulation Mode for Risk-Averse Teams

For organizations that are not ready to let WarpFix open PRs, we offer **simulation mode**: WarpFix has read-only access to the repository and posts its analysis as a comment on the failing workflow run.

The comment includes:
- Root cause analysis
- Proposed fix (as a diff in the comment, not as a branch)
- Confidence score
- Related fingerprints

The developer can copy the suggested fix, modify it, and apply it manually. This lets teams evaluate WarpFix's accuracy without granting write access.

Many teams start in simulation mode, observe WarpFix's suggestions for 2-4 weeks, and then upgrade to full PR mode once they have verified the quality.

## Principle 4: Learn from Rejection

When a developer modifies a WarpFix PR before merging, or rejects it entirely, WarpFix records the feedback:

- **Modified**: The diff between WarpFix's patch and the developer's final version is stored as a learning signal. Over time, WarpFix adapts to the team's preferred fix patterns.
- **Rejected**: The reason (if the developer provides one) is stored. Common reasons include "the fix is correct but we prefer a different approach" and "the test was intentionally changed."

This feedback loop is visible in the dashboard as "Org Memory" — teams can see exactly what WarpFix has learned about their preferences and can manually add or remove rules.

## Principle 5: Minimal Permissions

WarpFix's GitHub App requests only the permissions it needs:

- **Read**: repository contents, pull requests, workflow runs, issues (for @warpfix mentions)
- **Write**: pull requests (to open fix PRs), issues (to post comments), checks (to report status)
- **Not requested**: organization administration, team management, repository deletion, webhook management

We document every permission and its purpose on our [Permissions page](https://warpfix.org/permissions). If a permission is not needed for your configuration (e.g., you use simulation mode and WarpFix never opens PRs), you can revoke write access at any time.

## Principle 6: Data Handling Transparency

WarpFix processes your CI logs and source code to generate fixes. Here is exactly what happens to that data:

- **CI logs**: Parsed in memory, normalized into fingerprints, then discarded. The raw logs are never stored. The fingerprint (a hash) is stored permanently to enable pattern matching.
- **Source code**: Fetched via GitHub API for the specific files needed to generate a patch. The code is held in memory during patch generation and sandbox validation, then discarded. Source code is never stored in our database.
- **Patches**: The generated patch is stored as part of the repair record for audit purposes. You can delete repair records from the dashboard at any time.
- **Analytics**: Aggregated, anonymized statistics (failure types, fix rates, response times) are used to improve the service. No identifying information (repository names, file contents, developer names) is included in analytics.

## The Trust Trajectory

We have observed a consistent pattern with new WarpFix users:

**Week 1-2**: Skepticism. Developers review every WarpFix PR carefully, often making small modifications.

**Week 3-4**: Calibration. Developers learn which confidence scores correlate with accurate fixes. They start trusting high-confidence PRs and focusing review effort on lower-confidence ones.

**Month 2+**: Efficiency. WarpFix PRs are treated like any other team member's PRs — reviewed, but not with extra suspicion. Teams report spending 60-80% less time on CI failures.

This trajectory is only possible because WarpFix is transparent at every step. If we hid the confidence score, or did not show the fingerprint data, or auto-merged without consent, the trust would never develop.

Building trust in AI-generated code is not a technical problem — it is a product design problem. The AI needs to be honest about its uncertainty, transparent about its reasoning, and respectful of the developer's authority to make the final decision.
    `,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

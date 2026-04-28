# WarpFix Intelligence Cloud - Demo Video Script

## Scene 1: Terminal Command Execution (0:00 - 0:10)
- Show Warp terminal
- Type: `/fix-ci`
- WarpFix begins detecting failure

## Scene 2: CI Failure Detection (0:10 - 0:20)
- Show webhook event received
- Log parsing animation
- Error message extracted: `Cannot find module "@/lib/auth"`

## Scene 3: Patch Generation (0:20 - 0:35)
- Show multi-agent pipeline status
- Classification: `dependency_error`
- Fingerprint check: `a3f8c2d1 - matched 12 times`
- Cached patch reused

## Scene 4: Sandbox Validation (0:35 - 0:50)
- Show sandbox spinning up
- Steps: Clone → Apply → Install → Test → Build → Lint
- All checks pass with green indicators

## Scene 5: PR Creation (0:50 - 1:05)
- PR opened automatically
- Show PR title: `[WarpFix] Fix missing auth module import`
- Show confidence score: `94/100`
- Show labels: `warpfix`, `confidence-auto_merge`
- Show PR body with error classification, patch diff, fingerprint info

## Scene 6: Dashboard Visualization (1:05 - 1:30)
- Navigate to WarpFix dashboard
- Show repair history table
- Show stability score: `76/100`
- Show CI failure trend chart
- Show telemetry event log
- Show billing/usage panel

## Closing (1:30 - 1:40)
- Text: "WarpFix Intelligence Cloud"
- Subtitle: "Your CI Never Stays Broken"
- CTA: "Get started at warpfix.dev"

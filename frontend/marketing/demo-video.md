# WarpFix Demo Video Storyboard

## Overview
- **Duration:** 90 seconds
- **Style:** Terminal-first, dark terminal on light UI, fast-paced
- **Music:** Lo-fi electronic, subtle

---

## Scenes

### Scene 1: Terminal Command (0:00 – 0:12)
- Open Warp terminal, dark background
- Type `/fix-ci` with cursor animation
- Show: "Detecting latest CI failure..." with progress indicators
- **Voiceover:** "Your CI just broke. Type one command."

### Scene 2: Repair Pipeline (0:12 – 0:30)
- Split view: terminal left, pipeline visualization right
- Show each stage lighting up:
  1. Log parsing → error extracted
  2. Classification → `dependency_error` with confidence
  3. Fingerprint check → "Match found: a3f8c2d1 (47 times)"
  4. Patch generation → diff preview appears
- **Voiceover:** "WarpFix parses logs, classifies errors, checks its memory, and generates a fix."

### Scene 3: Patch Preview (0:30 – 0:42)
- Zoom into split-screen patch viewer
- Left panel: error summary, classification badge, confidence score
- Right panel: diff with green/red highlighting
- Show merge recommendation badge: "Safe to auto-merge"
- **Voiceover:** "Every patch comes with a confidence score and merge recommendation."

### Scene 4: Sandbox Validation (0:42 – 0:52)
- Animated container spinning up
- Show test suite running inside sandbox
- Green checkmarks appearing: "Build passed", "Tests passed", "Lint passed"
- **Voiceover:** "Patches are validated in isolated sandboxes before any PR is opened."

### Scene 5: Confidence Scoring (0:52 – 1:00)
- Confidence meter animating from 0 to 94
- Breakdown appearing: Sandbox +50, Fingerprint +25, Classification +15, Patch quality +4
- **Voiceover:** "A transparent confidence score tells you exactly why this fix is trustworthy."

### Scene 6: Analytics Dashboard (1:00 – 1:20)
- Transition to WarpFix dashboard (light theme)
- Show: Stats cards (total repairs, success rate, fingerprints)
- Zoom into recent repairs table
- Switch to analytics tab: quality distribution, time saved
- **Voiceover:** "Track every repair. See trends. Measure time saved."

### Scene 7: CTA (1:20 – 1:30)
- Full-screen: "Your CI pipeline fixes itself."
- Animated terminal prompt: `$ /fix-ci`
- Button: "Install WarpFix — Free" with GitHub icon
- **Voiceover:** "Install WarpFix in under a minute. Your next CI failure fixes itself."

---

## Production Notes
- Screenshots captured via `scripts/capture-screenshots.js`
- Terminal recordings via Warp's built-in recording
- Dashboard footage from live production at warpfix-frontend.onrender.com
- All animations use Framer Motion (already in codebase)

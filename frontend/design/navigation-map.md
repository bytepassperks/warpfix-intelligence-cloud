# WarpFix — Information Architecture & Navigation Map

## Top Navigation Bar (persistent)
```
[Logo: WarpFix]  [Search (Cmd+K)]  [Docs]  [Changelog]  [?Help]  [Notifications]  [User Avatar]
```

## Sidebar Navigation (dashboard)
```
OVERVIEW
  ├── Dashboard          (home icon)
  ├── Repositories       (folder icon)

ACTIVITY
  ├── Repairs            (wrench icon)
  ├── Reviews            (message-square icon)

INSIGHTS
  ├── Analytics          (bar-chart icon)
  │   └── Quality, Time Saved, Trends, Predictions (tabs within page)
  ├── Security           (shield icon)
  ├── Dependency Radar   (radar icon — new, replaces "stability")

CONFIGURE
  ├── Settings           (settings icon)
  ├── Billing            (credit-card icon)
```

## Page Hierarchy (8 primary routes)

### /dashboard (Overview)
- Top metric row: Repairs (total + trend), Success Rate, Fingerprints Reused, Confidence Avg
- Recent repairs timeline (center)
- Alerts sidebar (dependency drift, low-confidence repairs)

### /dashboard/repositories (NEW)
- Card grid of connected repos
- Each card: repo name, last repair, success rate, status
- Empty state: "Connect your first repository"

### /dashboard/repairs
- Filterable table: status, confidence, type, repo, date
- Click row → Patch viewer panel (Phase 11)

### /dashboard/reviews
- PR review list with risk level, effort, inline comment count
- Click row → Review detail with inline comments

### /dashboard/analytics (CONSOLIDATED — was 6 separate pages)
- Tab bar: Quality | Time Saved | Trends | Predictions
- Each tab has its own chart + metric cards

### /dashboard/security
- Vulnerability stats + unresolved alerts table
- OWASP coverage visualization

### /dashboard/dependency-radar (renamed from stability)
- Dependency health overview
- Alert timeline
- Package risk scores

### /dashboard/settings
- Review profile (assertive/chill)
- Automation toggles
- .warpfix.yaml editor
- Integrations

### /dashboard/billing
- Current plan + usage
- Upgrade flow
- Invoice history

## Landing Page Sections
```
1. Hero (terminal-native CTA + animated /fix-ci demo)
2. Problem → Solution (before/after split)
3. How It Works (3-step pipeline animation)
4. Feature Grid (6 key features with icons)
5. Fingerprint Intelligence (animated visualization)
6. Sandbox Pipeline (step-by-step visual)
7. Social Proof (logos + testimonials placeholder)
8. Pricing (3 tiers)
9. FAQ
10. Final CTA (Install extension)
11. Footer
```

## Removed Pages (consolidated)
- /dashboard/knowledge → merged into Settings
- /dashboard/learnings → merged into Settings
- /dashboard/tech-debt → merged into Analytics > Quality tab
- /dashboard/time-saved → merged into Analytics tab
- /dashboard/trends → merged into Analytics tab
- /dashboard/predictions → merged into Analytics tab
- /dashboard/telemetry → removed (internal metric, not user-facing)

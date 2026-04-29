# Competitor Design Pattern Analysis

## Sources Studied
- **Linear** (linear.app) — Issue tracking, best-in-class developer dashboard
- **Vercel** (vercel.com) — Deployment platform, clean information density
- **Cursor** (cursor.com) — AI code editor, terminal-native branding
- **CodeRabbit** (coderabbit.ai) — PR review tool, direct competitor
- **Framer** (framer.com) — Design tool, motion-heavy landing page
- **Notion** (notion.so) — Knowledge tool, excellent empty states

---

## Spacing System

| Tool | Base Unit | Scale |
|------|-----------|-------|
| Linear | 4px | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80 |
| Vercel | 4px | 4, 8, 12, 16, 24, 32, 48, 64, 96 |
| Cursor | 4px | 4, 8, 12, 16, 24, 32, 48 |

**Pattern**: 4px base, geometric progression, max ~96px for section padding.

## Typography Scale

| Level | Linear | Vercel | Pattern |
|-------|--------|--------|---------|
| Display (hero) | 56px/600 | 64px/700 | Large, tight tracking (-0.02em) |
| H1 | 32px/600 | 36px/600 | Bold but not heavy |
| H2 | 24px/600 | 24px/600 | Section headers |
| H3 | 18px/500 | 20px/500 | Card titles |
| Body | 14px/400 | 14px/400 | Standard readable |
| Caption | 12px/400 | 12px/400 | Metadata, timestamps |
| Code | 13px/mono | 13px/mono | Slightly smaller than body |

**Pattern**: Inter or Geist Sans. Body at 14px, not 16px. Tight letter-spacing on headings. Line-height 1.5 for body, 1.2 for headings.

## Hover Interactions

| Tool | Card Hover | Button Hover | Nav Hover |
|------|-----------|--------------|-----------|
| Linear | Subtle bg shift + border brighten | Slight darken + scale(1.01) | Background highlight |
| Vercel | Border color change + subtle shadow | Background transition | Underline animation |
| Cursor | Glow effect + border brighten | Scale + glow | Background + text color |
| CodeRabbit | Shadow lift + border | Darken | Background highlight |

**Pattern**: Never just color change. Always combine: background shift + border/shadow + optional scale. Transitions 150-200ms ease-out.

## Panel / Card Structure

### Linear Cards
- 1px border, subtle (rgba(255,255,255,0.06))
- Background: slightly elevated from page (not same as page bg)
- Border-radius: 8px (consistent)
- Padding: 16px or 20px
- No drop shadow in dark mode, subtle shadow in light

### Vercel Cards
- Clean border, single pixel
- White background in light mode, subtle gray in dark
- Border-radius: 12px
- Padding: 24px
- Hover: border color shifts to foreground/20

### CodeRabbit Cards
- Thicker visual presence
- Colored left border for severity indicators
- Status dots inline

**Pattern**: 8-12px radius. 16-24px padding. 1px borders that brighten on hover. Background 2-4% lighter than page.

## Sidebar Structure

### Linear Sidebar
- Width: 240px
- Logo + workspace selector top
- Grouped sections with tiny uppercase labels (11px)
- Icons (20px) + labels for every item
- Active: colored background pill + bold text
- Collapse to icon-only rail (52px)
- Keyboard shortcut hints on hover

### Vercel Sidebar
- Project selector dropdown
- Minimal sections (Deployments, Analytics, Settings)
- Active: left border indicator (2px blue)
- Team/org switcher

**Pattern**: Always icons + labels. Active state uses background highlight + left accent or bold text. Collapsible. Max 8-10 visible items, rest behind disclosure.

## Navigation Hierarchy

### Linear
```
Top: Workspace selector + search (Cmd+K) + notifications + user
Side: Inbox → My Issues → Views → Team Issues → Projects → Settings
```

### Vercel
```
Top: Logo + project selector + search + deploy button + user
Side: Overview → Deployments → Analytics → Logs → Storage → Settings
```

**Pattern**: Top bar for global context (user, search, actions). Sidebar for section nav. Max 2 levels deep.

## Empty States

### Linear Empty State
- Centered illustration (custom, not stock)
- Primary heading: "No issues yet"
- Subtitle: "Create your first issue to get started"
- Single primary CTA button
- Subtle background pattern

### Notion Empty State
- Minimal illustration or icon
- Action-oriented copy
- Inline tutorial steps
- Template suggestions

**Pattern**: Always centered. Custom illustration or icon (not emoji). Heading + description + CTA. Optional tutorial steps.

## Loading States / Skeleton Loaders

### Linear
- Pulsing gray rectangles matching content shape
- Text skeletons are narrow bars
- Card skeletons preserve card border/radius
- 3-5 skeleton items typical

### Vercel
- Shimmer effect (left-to-right gradient animation)
- Preserves exact layout dimensions
- Even button skeletons maintain shape

**Pattern**: Shape-preserving skeletons with subtle pulse or shimmer. Never spinners for content areas. Spinners only for actions (button loading).

## Microinteractions

### Framer (best-in-class)
- Page transitions: cross-fade with slight vertical shift
- Cards: hover lifts with shadow increase
- Buttons: press scales down to 0.97
- Sidebar: width animates on collapse
- Numbers: count-up animation on page load
- Charts: progressive draw animation
- Toasts: slide in from bottom-right with spring physics

### Linear
- Sidebar collapse: 200ms width transition
- Issue status change: color morph
- Drag reorder: smooth position transition
- Modal: fade + scale from 0.95

**Pattern**: Spring physics over linear easing. 150-250ms duration. Scale for press, translate for reveal, opacity for enter/exit.

## Color Patterns

### Light Mode (Linear)
- Background: #fff
- Surface: #fafafa
- Border: #e5e5e5
- Text primary: #171717
- Text secondary: #737373
- Accent: #5e6ad2 (indigo)

### Light Mode (Vercel)
- Background: #fff
- Surface: #fafafa
- Border: #eaeaea
- Text primary: #000
- Text secondary: #666
- Accent: #0070f3 (blue)

**Pattern**: White/off-white background. Single accent color (indigo or blue). Text is near-black, not pure black. Borders are light gray, barely there.

## Key Takeaways for WarpFix Redesign

1. **Switch to light-first design** — dark mode as secondary
2. **Adopt 4px spacing grid** with defined scale
3. **Typography at 14px body** with tight heading tracking
4. **Icons on every nav item** (Lucide is correct choice)
5. **Collapsible sidebar** with icon-only rail
6. **Top nav bar** with user, search, notifications
7. **Skeleton loaders everywhere** — no spinners, no flash of empty
8. **Framer Motion** for all transitions (already in user requirements)
9. **Empty states with illustrations** and clear CTAs
10. **Card hover = border brighten + subtle shadow**
11. **Active nav = background pill + icon color + font-weight change**
12. **Max 8 primary nav items** — collapse analytics into submenus

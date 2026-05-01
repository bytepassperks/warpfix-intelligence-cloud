# WarpFix Design System — Tokens

## Spacing Scale (4px base)
```
--space-0:  0px
--space-1:  4px    (0.25rem)
--space-2:  8px    (0.5rem)
--space-3:  12px   (0.75rem)
--space-4:  16px   (1rem)
--space-5:  20px   (1.25rem)
--space-6:  24px   (1.5rem)
--space-8:  32px   (2rem)
--space-10: 40px   (2.5rem)
--space-12: 48px   (3rem)
--space-16: 64px   (4rem)
--space-20: 80px   (5rem)
--space-24: 96px   (6rem)
```

## Typography Scale
```
--text-xs:     12px / 1.5 / 400     (captions, timestamps)
--text-sm:     13px / 1.5 / 400     (secondary body, table cells)
--text-base:   14px / 1.6 / 400     (primary body)
--text-lg:     16px / 1.5 / 500     (card titles, emphasis)
--text-xl:     20px / 1.3 / 600     (section headers)
--text-2xl:    24px / 1.2 / 600     (page titles)
--text-3xl:    32px / 1.1 / 700     (landing section headers)
--text-4xl:    40px / 1.1 / 700     (landing hero subhead)
--text-display: 56px / 1.05 / 700   (landing hero)
```
Letter-spacing: -0.02em for text-2xl and above. 0 for body.

## Color Palette (Light Mode Primary)
```
Background:
  --bg-primary:    #ffffff
  --bg-secondary:  #f9fafb    (surfaces, cards)
  --bg-tertiary:   #f3f4f6    (hover states, code blocks)
  --bg-inverse:    #0f172a    (terminal, code)

Text:
  --text-primary:   #111827
  --text-secondary: #6b7280
  --text-tertiary:  #9ca3af
  --text-inverse:   #f9fafb

Border:
  --border-default: #e5e7eb
  --border-hover:   #d1d5db
  --border-active:  #6366f1    (focus rings)

Brand:
  --brand-primary:  #6366f1    (indigo-500)
  --brand-hover:    #4f46e5    (indigo-600)
  --brand-muted:    #eef2ff    (indigo-50)
  --brand-subtle:   #e0e7ff    (indigo-100)

Status:
  --status-success:     #10b981
  --status-success-bg:  #ecfdf5
  --status-warning:     #f59e0b
  --status-warning-bg:  #fffbeb
  --status-error:       #ef4444
  --status-error-bg:    #fef2f2
  --status-info:        #3b82f6
  --status-info-bg:     #eff6ff
```

## Border Radius Scale
```
--radius-sm:   4px    (badges, small elements)
--radius-md:   8px    (cards, panels)
--radius-lg:   12px   (modals, large cards)
--radius-xl:   16px   (hero elements)
--radius-full: 9999px (pills, avatars)
```

## Shadow System
```
--shadow-xs:   0 1px 2px rgba(0,0,0,0.05)
--shadow-sm:   0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
--shadow-md:   0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)
--shadow-lg:   0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)
--shadow-xl:   0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)
```

## Motion System
```
--duration-fast:    100ms
--duration-normal:  200ms
--duration-slow:    300ms
--duration-slower:  500ms

--ease-default:     cubic-bezier(0.4, 0, 0.2, 1)
--ease-in:          cubic-bezier(0.4, 0, 1, 1)
--ease-out:         cubic-bezier(0, 0, 0.2, 1)
--ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1)
```

## Grid Rules
```
Max content width:  1200px (landing), 100% (dashboard)
Dashboard sidebar:  256px (expanded), 52px (collapsed)
Dashboard main:     1fr (fills remaining)
Card grid:          repeat(auto-fill, minmax(280px, 1fr))
Metric row:         4 columns on desktop, 2 on tablet, 1 on mobile
Gutter:             16px (cards), 24px (sections)
```

# Rule: JARVIS Dark Design System
# Loads when: building UI components, styling, Tailwind, tokens, animations

## Design Language
JARVIS Dark is a dark-mode-only, data-dense, terminal-adjacent aesthetic.
- Dark navy backgrounds, cyan primary accent, monospace data type
- Everything feels like a mission control dashboard — precise, alive, informative
- Motion is functional, not decorative — every animation communicates state

## Color Tokens (CSS Custom Properties)

Never use raw hex values in components. Always use CSS custom properties:

```css
/* Backgrounds */
--color-bg-base: #050D1A;          /* Page background */
--color-bg-panel: #0A1628;         /* Cards, sidebars, modals */
--color-bg-panel-hover: #0D1F3C;   /* Panel hover state */
--color-bg-overlay: rgba(5,13,26,0.9); /* Modal overlays */

/* Brand — Cyan */
--color-cyan-primary: #00D4FF;     /* Primary actions, links, highlights */
--color-cyan-hover: #00BFEA;       /* Hover state */
--color-cyan-muted: rgba(0,212,255,0.15); /* Subtle backgrounds */

/* Status */
--color-status-success: #00FF88;   /* Online, booked, won */
--color-status-warning: #FFB800;   /* At-risk, warning */
--color-status-error: #FF4444;     /* Error, offline, lost */
--color-status-standby: #6B7A99;   /* Inactive, pending */

/* Text */
--color-text-primary: #E8F4FD;     /* Primary text */
--color-text-muted: #6B7A99;       /* Secondary text, labels */
--color-text-disabled: #3D4F6E;    /* Disabled states */

/* Borders */
--color-border-glow: rgba(0,212,255,0.3); /* Focused inputs, active cards */
--color-border-strong: #1E3A5F;    /* Panel borders */
--color-border-subtle: rgba(30,58,95,0.5); /* Dividers */
```

## Typography

Three font families — never mix contexts:

| Font | Variable | Use for |
|------|---------|---------|
| Orbitron | `font-display` | Headings, labels, badges, nav items, button text |
| Share Tech Mono | `font-mono` | Metrics, percentages, IDs, timestamps, table data |
| Inter | `font-body` | Descriptions, prose, alerts, help text |

```tsx
// ✅ correct usage
<h1 className="font-display text-2xl text-[--color-cyan-primary]">LEADS</h1>
<span className="font-mono text-sm text-[--color-text-primary]">47.3%</span>
<p className="font-body text-base text-[--color-text-muted]">No leads yet</p>
```

## Tailwind Config Extension

```ts
// packages/config/tailwind-preset.ts
import type { Config } from 'tailwindcss'

export const tailwindPreset: Config = {
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--color-bg-base)',
        'bg-panel': 'var(--color-bg-panel)',
        'cyan': 'var(--color-cyan-primary)',
        'success': 'var(--color-status-success)',
        'warning': 'var(--color-status-warning)',
        'error': 'var(--color-status-error)',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'panel': 'var(--glow-panel)',
        'panel-hover': 'var(--glow-panel-hover)',
        'success': 'var(--glow-success)',
        'alert': 'var(--glow-alert)',
      },
    },
  },
}
```

## Component Library (packages/ui)

Always use shared components before creating new ones. Available:

| Component | Use for |
|-----------|---------|
| `Button` | All clickable actions |
| `Input` | Text inputs |
| `Card` | Panel containers |
| `Badge` | Status labels, stage tags |
| `Modal` | Overlay dialogs |
| `Toast` | Notifications |
| `DataTable` | Sortable, filterable data lists |
| `Sparkline` | 7-day trend mini-chart |
| `ProgressBar` | Onboarding steps, loading |
| `StepIndicator` | Wizard step progress |
| `Tabs` | Section navigation |
| `Sidebar` | App navigation |
| `StatusDot` | Online/offline/warning indicators |
| `Skeleton` | Loading placeholders |
| `EmptyState` | Zero-data states |
| `AlertBanner` | Page-level warnings |

### Component Contract Rules
- All components accept `data-testid` prop (Playwright selectors)
- All components handle loading, error, and empty states explicitly
- No inline styles — Tailwind only
- No hardcoded colors — CSS custom properties only
- Components export their prop types

### Status Dot Pattern
```tsx
// StatusDot colors map to semantic meaning — never override
<StatusDot status="online" />     // green — active, live
<StatusDot status="processing" /> // cyan pulse — in progress
<StatusDot status="at-risk" />    // amber — warning
<StatusDot status="offline" />    // red — error, inactive
<StatusDot status="standby" />    // gray — pending, paused
```

## Animation Rules

```ts
// Duration constants (milliseconds)
const duration = {
  instant:  50,   // state flips (toggle, checkbox)
  flash:   100,   // micro-interactions (button press)
  fast:    200,   // transitions (hover, focus)
  standard: 300,  // panel open/close (DEFAULT)
  moderate: 500,  // page transitions
  scan:   1500,   // boot sequence scan line
}

// Ambient animations are CSS-only, never JS
// Interactive animations use Framer Motion
```

```tsx
// Panel enter (Framer Motion)
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
>
```

**Rules:**
- Ambient effects (shimmer, pulse, scan) → CSS `@keyframes` only
- Interactive transitions (modals, slide-overs, dropdowns) → Framer Motion
- Never animate layout properties — use `opacity` + `transform` only
- Respect `prefers-reduced-motion` — wrap all animations

## Layout & Spacing

```ts
// Spacing scale — use these aliases in Tailwind
--panel-padding: 24px;   // p-6
--section-gap:   16px;   // gap-4
--content-gap:   12px;   // gap-3
```

Z-index layers:
```ts
const zIndex = {
  base:     0,
  raised:   10,
  panel:    20,
  overlay:  30,
  modal:    40,
  toast:    50,
  tooltip:  60,
  skiplink: 70,
}
```

## Platform Badge Colors

```tsx
// Platform-specific brand colors
const platformColors = {
  meta:    '#00D4FF',  // cyan (matches RainMachine brand)
  google:  '#FFB800',  // amber
  organic: '#00FF88',  // green
}
```

## Empty State Template

Every data view must have an empty state:
```tsx
<EmptyState
  icon={<Users className="h-12 w-12" />}
  title="No leads yet"
  description="Leads will appear here once your campaigns are live."
  action={<Button variant="ghost">View campaigns</Button>}
/>
```

Rules:
- Never show a blank white/dark area — always render EmptyState
- EmptyState must not throw JS errors when data is null/undefined
- Include a next-action CTA where possible

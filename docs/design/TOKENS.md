# MIRD Design Tokens
## Make It Rain Digital | Sigma Protocol Step 6

> Complete token reference for MIRD JARVIS Dark. This is the single source of truth for all design values. Tokens are structured for CSS custom properties, JSON consumption (design tools), and platform export.

---

## Token Architecture

Tokens follow a 3-tier system:

| Tier | Description | Example |
|------|-------------|---------|
| **Primitive** | Raw values — hex, px, ms | `#00D4FF`, `4px`, `200ms` |
| **Semantic** | Named by intent | `--color-text-primary`, `--glow-panel` |
| **Component** | Component-scoped overrides | `--btn-primary-bg`, `--nav-active-color` |

All tokens documented here are **Semantic** tokens built from primitives.

---

## Color Tokens

### Background

| Token | Value | Use |
|-------|-------|-----|
| `--color-bg-base` | `#050D1A` | Page / app background |
| `--color-bg-panel` | `#0A1628` | Card, sidebar, panel surface |
| `--color-bg-panel-hover` | `#0D1E35` | Elevated surface, hover state |
| `--color-bg-overlay` | `rgba(10,22,40,0.85)` | Modal / drawer backdrop |
| `--color-bg-overlay-deep` | `rgba(5,13,26,0.95)` | Deep overlay (full-screen modal) |

### Cyan / Brand

| Token | Value | Use |
|-------|-------|-----|
| `--color-cyan-primary` | `#00D4FF` | Primary interactive, brand accent |
| `--color-cyan-primary-hover` | `#1ADCFF` | Hover state |
| `--color-cyan-primary-active` | `#00B8E0` | Active/pressed state |
| `--color-cyan-muted` | `#7ECFDF` | Labels, secondary text, muted icons |
| `--color-cyan-deep` | `#0A4F6E` | Disabled states, deep fills |
| `--color-cyan-dim` | `rgba(0,212,255,0.20)` | Default border |
| `--color-cyan-dim-soft` | `rgba(0,212,255,0.08)` | Subtle borders, sidebar bg |
| `--color-cyan-dim-trace` | `rgba(0,212,255,0.04)` | Input fill, alt row bg |

### Status

| Token | Value | Use |
|-------|-------|-----|
| `--color-status-success` | `#00FF88` | Online, positive, closed |
| `--color-status-success-glow` | `rgba(0,255,136,0.40)` | Glow rings for success |
| `--color-status-warning` | `#FFB800` | At risk, elevated CPL |
| `--color-status-warning-glow` | `rgba(255,184,0,0.30)` | Glow rings for warning |
| `--color-status-alert` | `#FF6B35` | Critical, offline agents |
| `--color-status-alert-text` | `#FF7D52` | Inline alert text (higher contrast) |
| `--color-status-alert-glow` | `rgba(255,107,53,0.30)` | Glow rings for alert |
| `--color-status-error` | `#FF3333` | Hard errors, auth failures |
| `--color-status-error-glow` | `rgba(255,51,51,0.30)` | Glow rings for error |
| `--color-status-standby` | `#2A4A5A` | Inactive, disabled states |

### Text

| Token | Value | Use |
|-------|-------|-----|
| `--color-text-primary` | `#E8F4F8` | Primary content text |
| `--color-text-muted` | `#7ECFDF` | Labels, metadata, secondary |
| `--color-text-disabled` | `#2A4A5A` | Placeholder, inactive |
| `--color-text-inverse` | `#050D1A` | Text on cyan buttons |

### Border

| Token | Value | Use |
|-------|-------|-----|
| `--color-border-glow` | `rgba(0,212,255,0.20)` | Default panel border |
| `--color-border-strong` | `rgba(0,212,255,0.40)` | Hover, active border |
| `--color-border-subtle` | `rgba(0,212,255,0.08)` | Table row dividers |
| `--color-border-trace` | `rgba(0,212,255,0.04)` | Barely-there separators |
| `--color-border-alert` | `rgba(255,107,53,0.40)` | Error/critical borders |
| `--color-border-success` | `rgba(0,255,136,0.40)` | Success state borders |
| `--color-border-warning` | `rgba(255,184,0,0.40)` | Warning state borders |

### Platform / Badge

| Token | Value | Platform |
|-------|-------|---------|
| `--color-platform-meta` | `#00D4FF` | Meta Ads |
| `--color-platform-google` | `#FFB800` | Google Ads |
| `--color-platform-organic` | `#00FF88` | Organic / Direct |

### Chart

| Token | Value | Element |
|-------|-------|---------|
| `--color-chart-line` | `#00D4FF` | Chart lines |
| `--color-chart-fill` | `rgba(0,212,255,0.15)` | Area fill under line |
| `--color-chart-grid` | `rgba(0,212,255,0.06)` | Horizontal grid lines |
| `--color-chart-axis` | `#7ECFDF` | Axis labels |
| `--color-health-high` | `#00FF88` | Progress ring — healthy |
| `--color-health-medium` | `#FFB800` | Progress ring — at risk |
| `--color-health-low` | `#FF6B35` | Progress ring — critical |

---

## Typography Tokens

### Font Families

| Token | Value | Role |
|-------|-------|------|
| `--font-display` | `'Orbitron', sans-serif` | Labels, headings, nav, badges, buttons |
| `--font-data` | `'Share Tech Mono', monospace` | Metrics, timestamps, IDs, table data |
| `--font-body` | `'Inter', sans-serif` | Prose, descriptions, alert detail |

### Font Size Scale

| Token | Value | Use |
|-------|-------|-----|
| `--text-display-xl` | `32px` | Page-level display headings |
| `--text-h1` | `24px` | Section titles |
| `--text-h2` | `18px` | Panel titles |
| `--text-h3` | `14px` | Sub-section titles |
| `--text-label` | `11px` | Uppercase labels everywhere |
| `--text-metric-xl` | `48px` | Hero KPI values |
| `--text-metric-lg` | `32px` | Standard KPI values |
| `--text-metric-md` | `24px` | Secondary metrics |
| `--text-metric-sm` | `16px` | Inline metrics |
| `--text-mono-sm` | `13px` | Table data, timestamps |
| `--text-mono-xs` | `11px` | IDs, metadata |
| `--text-body` | `15px` | Readable prose |
| `--text-body-sm` | `13px` | Dense prose |

### Letter Spacing Scale

| Token | Value | Use |
|-------|-------|-----|
| `--tracking-tight` | `0.04em` | Orbitron H2 |
| `--tracking-normal` | `0.06em` | Orbitron H1, H3 |
| `--tracking-wide` | `0.08em` | Orbitron H1 display |
| `--tracking-wider` | `0.10em` | Orbitron labels, buttons, nav |
| `--tracking-widest` | `0.12em` | Smallest Orbitron labels |

---

## Spacing Tokens

### Base Scale

| Token | Value | Semantic Name |
|-------|-------|--------------|
| `--space-1` | `4px` | Micro / icon padding |
| `--space-2` | `8px` | Tight / badge padding |
| `--space-3` | `12px` | Content rows / table cells |
| `--space-4` | `16px` | Section gaps |
| `--space-5` | `20px` | Panel grid gap |
| `--space-6` | `24px` | Panel internal padding |
| `--space-8` | `32px` | Section separators |
| `--space-10` | `40px` | Large section gaps |
| `--space-12` | `48px` | Page top/bottom padding |
| `--space-16` | `64px` | Major structural spacing |
| `--space-20` | `80px` | Hero spacing |
| `--space-24` | `96px` | Maximum spacing |

### Semantic Aliases

| Alias | Resolves To | Value |
|-------|------------|-------|
| `--panel-padding` | `--space-6` | `24px` |
| `--panel-gap` | `--space-5` | `20px` |
| `--section-gap` | `--space-4` | `16px` |
| `--content-gap` | `--space-3` | `12px` |
| `--inline-gap` | `--space-2` | `8px` |

---

## Border Radius Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sharp` | `2px` | Badges, small chips |
| `--radius-default` | `4px` | Panels, buttons, inputs (primary) |
| `--radius-soft` | `8px` | Notifications, tooltips |
| `--radius-full` | `9999px` | Pill badges, avatar circles |

---

## Shadow / Glow Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--glow-panel` | `0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.10), inset 0 0 40px rgba(0,212,255,0.02)` | Default panel card |
| `--glow-panel-hover` | `0 0 30px rgba(0,212,255,0.12), inset 0 1px 0 rgba(0,212,255,0.15)` | Hovered panel |
| `--glow-success` | `0 0 12px rgba(0,255,136,0.30)` | Success metric |
| `--glow-alert` | `0 0 12px rgba(255,107,53,0.30)` | Alert element |
| `--glow-warning` | `0 0 12px rgba(255,184,0,0.20)` | Warning element |
| `--glow-interactive` | `0 0 20px rgba(0,212,255,0.30)` | Hovered button |
| `--glow-focus` | `0 0 0 3px rgba(0,212,255,0.15)` | Focus ring |
| `--glow-status-online` | `0 0 6px #00FF88, 0 0 12px rgba(0,255,136,0.40)` | Online status dot |
| `--glow-status-proc` | `0 0 6px #00D4FF, 0 0 12px rgba(0,212,255,0.40)` | Processing status dot |
| `--glow-status-alert` | `0 0 4px #FF6B35` | At-risk status dot |

---

## Animation Tokens

### Duration

| Token | Value | Use |
|-------|-------|-----|
| `--dur-instant` | `50ms` | Tap feedback |
| `--dur-flash` | `100ms` | Fastest transitions |
| `--dur-fast` | `200ms` | Hover, focus |
| `--dur-standard` | `300ms` | State changes |
| `--dur-moderate` | `500ms` | Page entrances |
| `--dur-scan` | `1500ms` | Scan-line sweep |
| `--dur-boot` | `1200ms` | Counter animation |
| `--dur-draw` | `1000ms` | Progress ring |
| `--dur-pulse` | `2000ms` | Status dot breath |
| `--dur-glow` | `3000ms` | Ambient glow cycle |
| `--dur-shimmer` | `1800ms` | Skeleton shimmer |

### Easing

| Token | Value | Use |
|-------|-------|-----|
| `--ease-standard` | `cubic-bezier(0.25,0.46,0.45,0.94)` | Most transitions |
| `--ease-decelerate` | `cubic-bezier(0.00,0.00,0.20,1.00)` | Elements entering |
| `--ease-accelerate` | `cubic-bezier(0.40,0.00,1.00,1.00)` | Elements leaving |
| `--ease-spring` | `cubic-bezier(0.34,1.56,0.64,1.00)` | Panel pop-in |
| `--ease-linear` | `linear` | Scan lines, bars |

---

## Z-Index Tokens

| Token | Value | Context |
|-------|-------|---------|
| `--z-base` | `0` | Normal flow |
| `--z-raised` | `10` | Hovered elements |
| `--z-panel` | `20` | Side panels, sticky bars |
| `--z-overlay` | `30` | Modal backdrops |
| `--z-modal` | `40` | Modal dialogs |
| `--z-toast` | `50` | Notifications |
| `--z-tooltip` | `60` | Tooltips |
| `--z-skiplink` | `70` | Skip nav link |

---

## Icon Size Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--icon-xs` | `14px` | Inline text, badge icons |
| `--icon-sm` | `16px` | Table cells, metadata |
| `--icon-md` | `20px` | Standard UI (nav icons) |
| `--icon-lg` | `24px` | Section headers |
| `--icon-xl` | `32px` | Empty states |
| `--icon-2xl` | `48px` | Decorative |

---

## JSON Token Export

For design tool import (Figma, Tokens Studio):

```json
{
  "color": {
    "bg": {
      "base":       { "value": "#050D1A",              "type": "color" },
      "panel":      { "value": "#0A1628",              "type": "color" },
      "panelHover": { "value": "#0D1E35",              "type": "color" }
    },
    "cyan": {
      "primary":    { "value": "#00D4FF",              "type": "color" },
      "muted":      { "value": "#7ECFDF",              "type": "color" },
      "deep":       { "value": "#0A4F6E",              "type": "color" }
    },
    "status": {
      "success":    { "value": "#00FF88",              "type": "color" },
      "warning":    { "value": "#FFB800",              "type": "color" },
      "alert":      { "value": "#FF6B35",              "type": "color" },
      "error":      { "value": "#FF3333",              "type": "color" }
    },
    "text": {
      "primary":    { "value": "#E8F4F8",              "type": "color" },
      "muted":      { "value": "#7ECFDF",              "type": "color" },
      "disabled":   { "value": "#2A4A5A",              "type": "color" }
    }
  },
  "spacing": {
    "1":  { "value": "4px",  "type": "spacing" },
    "2":  { "value": "8px",  "type": "spacing" },
    "3":  { "value": "12px", "type": "spacing" },
    "4":  { "value": "16px", "type": "spacing" },
    "5":  { "value": "20px", "type": "spacing" },
    "6":  { "value": "24px", "type": "spacing" },
    "8":  { "value": "32px", "type": "spacing" }
  },
  "borderRadius": {
    "sharp":   { "value": "2px",    "type": "borderRadius" },
    "default": { "value": "4px",    "type": "borderRadius" },
    "soft":    { "value": "8px",    "type": "borderRadius" },
    "full":    { "value": "9999px", "type": "borderRadius" }
  },
  "fontFamily": {
    "display": { "value": "'Orbitron', sans-serif",       "type": "fontFamily" },
    "data":    { "value": "'Share Tech Mono', monospace", "type": "fontFamily" },
    "body":    { "value": "'Inter', sans-serif",          "type": "fontFamily" }
  }
}
```

---

*MIRD Design Tokens | Sigma Protocol Step 6*
*See also: [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) | [COMPONENTS.md](./COMPONENTS.md) | [MOTION.md](./MOTION.md) | [ICONS.md](./ICONS.md)*

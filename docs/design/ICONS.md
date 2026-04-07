# MIRD Icon System
## Make It Rain Digital | Sigma Protocol Step 6

> The icon system for MIRD JARVIS Dark. All icons reinforce the HUD aesthetic — precise, stroke-based, technically drawn.

---

## Icon Library: Lucide Icons

### Why Lucide

| Criterion | Lucide | Why it fits |
|-----------|--------|------------|
| Style | Stroke-based | Matches HUD wireframe aesthetic |
| Grid | 24×24px | Consistent optical sizing |
| Stroke | 2px default | Crisp at all MIRD sizes |
| License | MIT | Commercial use approved |
| Formats | SVG, React, Vue | Covers all build targets |
| Completeness | 1,000+ icons | Covers all MIRD needs |

**Stroke weight rule:** Default 2px for all primary icons. Reduce to 1.5px for muted/secondary contexts (sidebar icons in inactive state).

**Install:**
```bash
# React
npm install lucide-react

# Vanilla (individual SVG files)
https://lucide.dev/icons/{icon-name}
```

---

## Size Scale

```
--icon-xs:   14px   Inline within text, badge indicators
--icon-sm:   16px   Table cell icons, timestamp metadata
--icon-md:   20px   Standard UI icons (navigation, toolbar)
--icon-lg:   24px   Section header icons, primary navigation
--icon-xl:   32px   Empty state icons, feature icons
--icon-2xl:  48px   Large decorative icons
```

**Minimum size rule:** Never render below 14px. Lucide at 14px is at the lower readability limit.

---

## Color Usage

| Context | Token | Value |
|---------|-------|-------|
| Active / primary action | `--color-cyan-primary` | `#00D4FF` |
| Muted / inactive state | `--color-text-muted` | `#7ECFDF` |
| Alert / critical | `--color-status-alert` | `#FF6B35` |
| Success / online | `--color-status-success` | `#00FF88` |
| Warning | `--color-status-warning` | `#FFB800` |
| Empty state decorative | `--color-text-disabled` | `#2A4A5A` |
| Inverse (on cyan) | `--color-text-inverse` | `#050D1A` |

**Rule:** Icons always inherit `currentColor`. Set color on the parent element, not the SVG.

```css
.nav-icon       { color: var(--color-text-muted); }
.nav-item.active .nav-icon { color: var(--color-cyan-primary); }
```

---

## Complete Icon Mapping

### Navigation

| UI Element | Lucide Icon Name | Size | Notes |
|------------|-----------------|------|-------|
| Dashboard / Home | `layout-dashboard` | 20px | Primary nav |
| Leads | `users` | 20px | Primary nav |
| Campaigns | `megaphone` | 20px | Primary nav |
| Analytics | `bar-chart-2` | 20px | Primary nav |
| Claude AI | `bot` | 20px | Primary nav |
| Pipeline | `git-branch` | 20px | Primary nav |
| Reports | `file-text` | 20px | Primary nav |
| Agents | `cpu` | 20px | Primary nav |
| Finance | `dollar-sign` | 20px | Primary nav |
| Integrations | `plug` | 20px | Utility nav |
| Settings | `settings` | 20px | Utility nav |
| Help | `help-circle` | 20px | Utility nav |
| Logout | `log-out` | 20px | User area |

### Dashboard Actions

| UI Element | Lucide Icon | Size |
|------------|------------|------|
| Expand/collapse sidebar | `chevron-left` / `chevron-right` | 20px |
| Filter | `sliders-horizontal` | 16px |
| Search | `search` | 16px |
| Export data | `download` | 16px |
| Refresh / sync | `refresh-cw` | 16px |
| Add / create | `plus` | 16px |
| More options | `more-horizontal` | 16px |
| Close / dismiss | `x` | 16px |
| Edit | `pencil` | 14px |
| Delete | `trash-2` | 14px |
| View detail | `arrow-right` | 14px |
| External link | `external-link` | 14px |
| Copy | `copy` | 14px |
| Check / confirm | `check` | 14px |

### Sort & Table

| UI Element | Lucide Icon | Size |
|------------|------------|------|
| Sort ascending | `chevron-up` | 12px |
| Sort descending | `chevron-down` | 12px |
| Sort (unsorted) | `chevrons-up-down` | 12px |
| Column filter | `filter` | 12px |
| Drag handle | `grip-vertical` | 14px |

### Status & Health

| UI Element | Lucide Icon | Size | Color |
|------------|------------|------|-------|
| Online / success | `wifi` | 16px | `--color-status-success` |
| Offline | `wifi-off` | 16px | `--color-status-error` |
| Warning / at risk | `alert-triangle` | 16px | `--color-status-warning` |
| Critical / error | `alert-circle` | 16px | `--color-status-alert` |
| Processing | `loader-2` | 16px | `--color-cyan-primary` (spin) |
| Info | `info` | 16px | `--color-text-muted` |

### Lead & CRM

| UI Element | Lucide Icon | Size |
|------------|------------|------|
| New lead | `user-plus` | 16px |
| Lead assigned | `user-check` | 16px |
| Appointment | `calendar-check` | 16px |
| Phone call | `phone` | 16px |
| AI call | `phone-call` | 16px |
| Email | `mail` | 16px |
| Notes | `sticky-note` | 16px |
| Stage advance | `arrow-right-circle` | 14px |

### Finance & Analytics

| UI Element | Lucide Icon | Size |
|------------|------------|------|
| Revenue | `trending-up` | 20px |
| Cost / spend | `trending-down` | 20px |
| CPL (cost per lead) | `target` | 16px |
| MRR | `bar-chart` | 16px |
| Transaction | `credit-card` | 16px |
| Invoice | `receipt` | 16px |

### Alerts & Notifications

| UI Element | Lucide Icon | Size |
|------------|------------|------|
| Alert bell | `bell` | 20px |
| Alert active | `bell-ring` | 20px |
| Dismiss alert | `bell-off` | 16px |
| Critical alert | `siren` | 16px |

### AI & Agents

| UI Element | Lucide Icon | Size |
|------------|------------|------|
| AI agent | `bot` | 20px |
| Agent running | `cpu` | 16px |
| AI response | `sparkles` | 16px |
| Send message | `send` | 16px |
| Processing query | `loader-2` | 16px |
| Knowledge base | `database` | 16px |

### Integrations

| Integration | Lucide Icon | Size |
|-------------|------------|------|
| Meta Ads | `megaphone` | 16px |
| Google Ads | `search` | 16px |
| CRM | `users` | 16px |
| Webhook | `webhook` | 16px |
| API | `code-2` | 16px |
| Connected | `link` | 16px |
| Disconnected | `link-2-off` | 16px |

---

## Custom Icons Required

These four icons are not available in Lucide and must be created as custom SVGs.

### 1. MIRD RainMachine Logomark

**Concept:** Intersection of rain (falling drops) and signal (radiating waves) — the name "RainMachine" made visual.

**Spec:**
```
viewBox: 0 0 32 32
Style: stroke-based, geometric
Colors: #00D4FF (primary) + #7ECFDF (secondary accent)

Composition:
- Three concentric arc-segments (top half) = signal/radar
- Three short vertical strokes below center = rain
- No fill — pure stroke composition
```

**SVG Template:**
```svg
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Signal arcs -->
  <path d="M8 14 A10 10 0 0 1 24 14" stroke="#00D4FF" stroke-width="2" stroke-linecap="round"/>
  <path d="M5 11 A14 14 0 0 1 27 11" stroke="#7ECFDF" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
  <path d="M2 8  A18 18 0 0 1 30 8"  stroke="#7ECFDF" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
  <!-- Center dot (source point) -->
  <circle cx="16" cy="14" r="2" fill="#00D4FF"/>
  <!-- Rain drops -->
  <line x1="11" y1="20" x2="10" y2="26" stroke="#00D4FF" stroke-width="2" stroke-linecap="round"/>
  <line x1="16" y1="20" x2="15" y2="26" stroke="#00D4FF" stroke-width="2" stroke-linecap="round"/>
  <line x1="21" y1="20" x2="20" y2="26" stroke="#00D4FF" stroke-width="2" stroke-linecap="round"/>
</svg>
```

**Usage:** Sidebar top (32px), Auth screens (48px), Browser favicon.

---

### 2. JARVIS Scan Diamond

**Concept:** A geometric crosshair / targeting diamond — the JARVIS empty-state and loading indicator.

**Spec:**
```
viewBox: 0 0 32 32
Style: geometric, thin stroke
Color: currentColor (muted in empty states, cyan in active states)

Composition:
- Outer diamond (rotated square)
- Inner smaller diamond
- Four corner tick marks
- Center dot
```

**SVG Template:**
```svg
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Outer diamond -->
  <path d="M16 2 L30 16 L16 30 L2 16 Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Inner diamond -->
  <path d="M16 8 L24 16 L16 24 L8 16 Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
  <!-- Corner ticks -->
  <line x1="16" y1="2" x2="16" y2="5"   stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="30" y1="16" x2="27" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="16" y1="30" x2="16" y2="27" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="2" y1="16"  x2="5" y2="16"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Center dot -->
  <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
</svg>
```

**Usage:** Empty states (32px, `--color-text-disabled`), Loading panels (24px, `--color-text-muted` + slow rotation).

---

### 3. AI Neural Indicator

**Concept:** Abstract neural network node — communicates "AI-generated" or "Claude-powered."

**Spec:**
```
viewBox: 0 0 24 24
Style: minimal nodes + connecting lines
Color: currentColor

Composition:
- 5 nodes (circles) arranged in a cluster pattern
- Connecting lines between nodes
- Center node slightly larger
```

**SVG Template:**
```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Connecting lines -->
  <line x1="12" y1="12" x2="5"  y2="6"  stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
  <line x1="12" y1="12" x2="19" y2="6"  stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
  <line x1="12" y1="12" x2="5"  y2="18" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
  <line x1="12" y1="12" x2="19" y2="18" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
  <line x1="5"  y1="6"  x2="19" y2="6"  stroke="currentColor" stroke-width="1" opacity="0.3"/>
  <line x1="5"  y1="18" x2="19" y2="18" stroke="currentColor" stroke-width="1" opacity="0.3"/>
  <!-- Outer nodes -->
  <circle cx="5"  cy="6"  r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
  <circle cx="19" cy="6"  r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
  <circle cx="5"  cy="18" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
  <circle cx="19" cy="18" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
  <!-- Center node -->
  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
  <circle cx="12" cy="12" r="1" fill="currentColor"/>
</svg>
```

**Usage:** Claude AI panel header (20px), AI-generated report attribution (14px), Onboarding AI explanation (24px).

---

### 4. Department Icons (×4)

One geometric icon per autonomous MIRD department. All share the same design rules:

**Spec for all department icons:**
```
viewBox: 0 0 24 24
Style: geometric, 2px stroke
Color: currentColor
Grid: Fits within 20×20 optical area (2px padding each side)
```

#### Department 1 — Marketing/Ads
```svg
<!-- Broadcast / megaphone abstract -->
<svg viewBox="0 0 24 24" fill="none">
  <path d="M3 9 L15 5 L15 19 L3 15 Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
  <line x1="15" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <line x1="17" y1="8"  x2="20" y2="6"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="17" y1="16" x2="20" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="3" y1="15" x2="3" y2="19"   stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Department 2 — Sales/Lead Management
```svg
<!-- Funnel / pipeline abstract -->
<svg viewBox="0 0 24 24" fill="none">
  <path d="M3 4 L21 4 L14 12 L14 20 L10 18 L10 12 Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
</svg>
```

#### Department 3 — Finance/Revenue
```svg
<!-- Rising bar graph with upward trend -->
<svg viewBox="0 0 24 24" fill="none">
  <line x1="3" y1="20" x2="21" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <rect x="5"  y="14" width="3" height="6" stroke="currentColor" stroke-width="1.5" rx="1"/>
  <rect x="10" y="10" width="3" height="10" stroke="currentColor" stroke-width="1.5" rx="1"/>
  <rect x="15" y="5"  width="3" height="15" stroke="currentColor" stroke-width="1.5" rx="1"/>
  <polyline points="5,12 10,8 16,5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
</svg>
```

#### Department 4 — Operations/AI Agents
```svg
<!-- Circuit board / system architecture -->
<svg viewBox="0 0 24 24" fill="none">
  <rect x="8" y="8" width="8" height="8" stroke="currentColor" stroke-width="2" rx="1"/>
  <line x1="12" y1="2"  x2="12" y2="8"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="12" y1="16" x2="12" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="2"  y1="12" x2="8"  y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="16" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="12" cy="2"  r="1.5" fill="currentColor"/>
  <circle cx="12" cy="22" r="1.5" fill="currentColor"/>
  <circle cx="2"  cy="12" r="1.5" fill="currentColor"/>
  <circle cx="22" cy="12" r="1.5" fill="currentColor"/>
</svg>
```

---

## Icon Usage Rules

### Do
- Use `currentColor` for all SVG stroke and fill values
- Set icon color on the parent element
- Maintain consistent stroke weight per context (2px primary, 1.5px muted)
- Use semantic icon names — the icon must match its meaning
- Include `aria-hidden="true"` on decorative icons
- Include `aria-label` or adjacent visible text for meaningful icons

### Don't
- Mix icon libraries (Lucide only, plus MIRD custom set)
- Use filled icons (stroke only, matching JARVIS HUD aesthetic)
- Apply drop shadows to icons (glow via `filter: drop-shadow()` only, and only for status contexts)
- Reduce below 14px
- Use icons as the sole indicator of state (always pair with text or color)

### Icon-Only Buttons
```html
<!-- Always include accessible label -->
<button class="btn-icon" aria-label="Refresh data">
  <svg class="icon" aria-hidden="true"><!-- refresh-cw icon --></svg>
</button>
```

```css
.btn-icon {
  width:         44px;    /* minimum touch target */
  height:        44px;
  display:       flex;
  align-items:   center;
  justify-content: center;
  background:    transparent;
  border:        none;
  color:         var(--color-text-muted);
  cursor:        pointer;
  border-radius: var(--radius-default);
  transition:    color var(--dur-fast), background var(--dur-fast);
}

.btn-icon:hover {
  color:       var(--color-cyan-primary);
  background:  var(--color-cyan-dim-trace);
}
```

---

## Spinning Loader Icon

For `processing` states where a Lucide `loader-2` icon is used:

```css
.icon-spin {
  animation: icon-rotate 1s linear infinite;
}

@keyframes icon-rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

```css
@media (prefers-reduced-motion: reduce) {
  .icon-spin { animation: none; }
}
```

---

## Icon Component (React)

```tsx
import { LucideIcon } from 'lucide-react';

interface IconProps {
  icon: LucideIcon;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'muted' | 'success' | 'warning' | 'alert' | 'disabled';
  spin?: boolean;
  label?: string; // aria-label for icon-only usage
}

const sizeMap = { xs: 14, sm: 16, md: 20, lg: 24, xl: 32 };

export function Icon({ icon: IconComponent, size = 'md', color = 'muted', spin, label }: IconProps) {
  return (
    <IconComponent
      size={sizeMap[size]}
      className={`icon icon--${color} ${spin ? 'icon-spin' : ''}`}
      aria-hidden={!label}
      aria-label={label}
    />
  );
}
```

```css
.icon--primary   { color: var(--color-cyan-primary); }
.icon--muted     { color: var(--color-text-muted); }
.icon--success   { color: var(--color-status-success); }
.icon--warning   { color: var(--color-status-warning); }
.icon--alert     { color: var(--color-status-alert); }
.icon--disabled  { color: var(--color-text-disabled); }
```

---

*MIRD Icon System | Sigma Protocol Step 6*
*See also: [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) | [TOKENS.md](./TOKENS.md) | [COMPONENTS.md](./COMPONENTS.md) | [MOTION.md](./MOTION.md)*

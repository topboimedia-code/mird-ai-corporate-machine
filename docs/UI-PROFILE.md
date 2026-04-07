# UI-PROFILE.md
# Make It Rain Digital — Complete UI Profile & Design System
# Version 1.0 | March 2026

---

## PART 1: DESIGN SYSTEM NARRATIVE

### The JARVIS Philosophy

MIRD operates at the intersection of real estate and artificial intelligence. The design system must communicate two things simultaneously: **technological authority** and **operational clarity**. It must feel like a military-grade information system — not a startup dashboard, not a SaaS product, not a real estate CRM.

The reference is specific: the JARVIS heads-up display from Iron Man. That UI communicates that the operator (Tony Stark) is not fighting chaos — he is commanding it. He sees everything. The system processes for him. He acts, not reacts.

This is the emotional contract the MIRD design system must fulfill. When Marcus opens RainMachine, when Shomari reviews his CEO dashboard, they should feel the same thing Tony Stark feels when the HUD snaps into place: *I am in command. My system is running.*

### Design Pillars

**1. Precision over personality**
Every element is exact. Numbers don't round casually. Timestamps include seconds. Labels are uppercase. Nothing is approximate or informal. The system is precise because real operations require precision.

**2. Data as live intelligence, not static report**
Nothing on a screen feels "printed." Metrics glow. Status indicators breathe. When data updates, it ticks. The user is reading a live feed, not a PDF. This aesthetic is achieved through animation, typography choice (Share Tech Mono for all data), and color (cyan for live, amber for warnings, orange for alerts).

**3. Hierarchy through light, not just size**
In a dark interface, brightness = importance. The most critical number on a panel is the brightest. Supporting labels are muted. Warnings glow amber. Alerts pulse orange. The eye is guided not just by scale but by luminance.

**4. The machine works for you**
Empty states are rare. When they occur, they communicate standby, not absence. The system is always active, always monitoring, even when there is nothing to display. "AWAITING INCOMING SIGNALS" is not an error — it is a mode.

**5. Trust through detail**
Shomari is a technical founder. Marcus is becoming a serious operator. Both trust systems that show their work — timestamps, agent IDs, data sources, last-sync times. The design never hides the machinery. It showcases it.

---

## PART 2: COMPONENT CATALOG

### 2.1 Panel Card

**Purpose:** Primary content container for all dashboard sections.
**Variants:** Default | Loading | Error | Empty | Highlighted (elevated glow)

**Visual description:**
A rectangular container with sharp corners (border-radius: 4px), a dark navy interior that feels like depth rather than flatness, a fine cyan border that glows subtly, and a soft inner glow at the top edge suggesting a holographic light source above. The panel header has a bottom rule in the same cyan at reduced opacity.

**Token application:**
```css
background:   var(--color-bg-panel)          /* #0A1628 */
border:       1px solid var(--color-border-glow)  /* rgba(0,212,255,0.2) */
box-shadow:   0 0 20px rgba(0,212,255,0.08),
              inset 0 1px 0 rgba(0,212,255,0.1),
              inset 0 0 40px rgba(0,212,255,0.02)
border-radius: 4px
padding:       var(--space-6) /* 24px */
```

**Header row:**
```css
display: flex; align-items: center; justify-content: space-between;
padding-bottom: var(--space-4);
border-bottom: 1px solid rgba(0,212,255,0.1);
margin-bottom: var(--space-4);
```

**Hover state:**
```css
border-color: rgba(0,212,255,0.4);
box-shadow:   0 0 30px rgba(0,212,255,0.12),
              inset 0 1px 0 rgba(0,212,255,0.15);
transition:   border-color 200ms, box-shadow 200ms;
```

**Loading state:**
- Content area opacity: 0.3
- Scan line animation plays once across full panel height
- Shimmer bars in place of content

**Error state:**
- border-color: rgba(255,107,53,0.4)
- Header status badge changes to "[!] SIGNAL LOST" in orange

**Empty state:**
- Centered content: icon + title + optional body text
- Icon: 32px, muted cyan (#7ECFDF)
- Title: Orbitron 13px, #7ECFDF
- Body: Inter 13px, #2A4A5A (very muted — emptiness is peaceful, not alarming)

---

### 2.2 Metric Readout

**Purpose:** Display a single KPI value with label and optional trend delta.
**Variants:** XL (hero) | LG (standard) | MD (compact) | SM (inline)

**Visual description:**
A vertical stack: all-caps label in small Orbitron above, the number in large Share Tech Mono below (this is the star of the composition), then a subtle delta indicator below the number showing directional change. The number feels like it was transmitted from a live system — Share Tech Mono gives it that terminal-display quality.

**Token application (XL variant):**
```css
.metric-label {
  font: 400 11px/1.4 'Orbitron', sans-serif;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted); /* #7ECFDF */
}

.metric-value {
  font: 400 48px/1.0 'Share Tech Mono', monospace;
  color: var(--color-text-primary); /* #E8F4F8 */
  margin: var(--space-2) 0;
}

.metric-delta {
  font: 400 13px/1.0 'Share Tech Mono', monospace;
  /* color set dynamically: positive=#00FF88, negative=#FF6B35, neutral=#7ECFDF */
}

.metric-delta-period {
  font: 400 10px/1.4 'Orbitron', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-left: var(--space-2);
}
```

**Boot-up animation:** JavaScript counter from 0 to final value, 1200ms, cubic-bezier(0.25,0.46,0.45,0.94). For monetary values: count in integers then format with $ prefix and decimal precision at completion. For percentages: count in tenths.

---

### 2.3 Status Indicator

**Purpose:** Communicate live system state in compact form.
**Variants:** ONLINE | PROCESSING | AT RISK | OFFLINE | STANDBY

**Visual description:**
A dot (8px circle) paired with an all-caps text label. In ONLINE state, the dot pulses — it breathes in and out with a 2s cycle, its glow expanding and contracting. The pulse is gentle, not frantic. PROCESSING uses a faster cyan pulse (1.2s). OFFLINE and AT RISK are static (no pulse — they communicate a stopped or degraded state by their stillness).

**States:**
```css
/* ONLINE */
.status-dot.online {
  background: #00FF88;
  box-shadow: 0 0 6px #00FF88;
  animation: system-pulse 2s ease-in-out infinite;
}

/* PROCESSING */
.status-dot.processing {
  background: #00D4FF;
  box-shadow: 0 0 6px #00D4FF;
  animation: system-pulse 1.2s ease-in-out infinite;
}

/* AT RISK */
.status-dot.at-risk {
  background: #FF6B35;
  box-shadow: 0 0 4px #FF6B35;
  animation: alert-flash 0.8s ease-in-out 3; /* flashes 3 times then goes static */
}

/* OFFLINE */
.status-dot.offline {
  background: #FF3333;
  box-shadow: none;
  animation: none;
}

/* STANDBY */
.status-dot.standby {
  background: #2A4A5A;
  box-shadow: none;
  animation: system-pulse 4s ease-in-out infinite; /* very slow, barely visible */
}
```

---

### 2.4 Lead Card

**Purpose:** Represent a single lead in list/table views.
**Variants:** Row (table) | Card (grid view) | Compact (mobile)

**Visual description:**
In table row form: a single horizontal stripe with subtle alternating backgrounds, the lead's initials in a small avatar circle (border: 1px solid rgba(0,212,255,0.3), background: rgba(0,212,255,0.08)), name in Orbitron, organization in Inter below, then stage badge, source badge, AI call status, and timestamp reading from left to right. The active row state brightens the entire row with a left-side vertical accent bar in cyan.

**Stage badge styling:**
```css
.badge-stage {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 2px;
  font: 400 10px/1.4 'Orbitron', sans-serif;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.badge-stage.new        { background: rgba(0,212,255,0.12); border: 1px solid rgba(0,212,255,0.4); color: #00D4FF; }
.badge-stage.contacted  { background: rgba(255,184,0,0.12); border: 1px solid rgba(255,184,0,0.4); color: #FFB800; }
.badge-stage.appt-set   { background: rgba(0,255,136,0.12); border: 1px solid rgba(0,255,136,0.4); color: #00FF88; }
.badge-stage.closed     { background: rgba(0,255,136,0.2); border: 1px solid rgba(0,255,136,0.6); color: #00FF88; }
.badge-stage.lost       { background: rgba(255,107,53,0.08); border: 1px solid rgba(255,107,53,0.2); color: #FF7D52; }
```

---

### 2.5 Progress Ring

**Purpose:** Display percentage metrics as circular progress indicators.
**Sizes:** LG (40px radius, 3px stroke) | MD (28px radius, 2.5px stroke) | SM (20px radius, 2px stroke)

**Visual description:**
An SVG circle with a track ring and a progress arc. The track is barely visible (dark cyan at 10% opacity). The progress arc uses rounded stroke caps and a color that corresponds to the metric health (green/amber/orange). The center displays the value in Share Tech Mono. On mount, the arc animates from 0 to its value over 1000ms, drawing the circle as if the data is being received.

```css
/* SVG implementation base */
.progress-ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-ring__track {
  stroke: rgba(0,212,255,0.1);
  fill: none;
  stroke-width: 3;
}

.progress-ring__fill {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: center;
  transition: stroke-dashoffset 1000ms cubic-bezier(0.25,0.46,0.45,0.94);
}

/* Color by value */
.progress-ring__fill.health-high   { stroke: #00FF88; filter: drop-shadow(0 0 4px #00FF88); }
.progress-ring__fill.health-medium { stroke: #FFB800; filter: drop-shadow(0 0 4px #FFB800); }
.progress-ring__fill.health-low    { stroke: #FF6B35; filter: drop-shadow(0 0 4px #FF6B35); }
```

---

### 2.6 Navigation Sidebar

**Purpose:** Primary navigation for RainMachine Dashboard.
**States:** Expanded (240px) | Collapsed (64px)

**Visual description:**
A tall vertical panel on the left edge of the screen. At the top, the MIRD logomark — a stylized rain/signal icon — followed by "RAINMACHINE" in Orbitron. Navigation items below are icon + label pairs, with the active item sporting a 2px left border in cyan that glows slightly. A thin horizontal rule near the bottom separates utility items (settings) from primary nav. At the very bottom, the user's avatar, name, and logout link. The sidebar has a right border that matches the panel card border style — the whole interface feels like interconnected panels.

**Collapsed behavior:**
- Width animates from 240px to 64px over 200ms
- Labels fade out (opacity: 0, pointer-events: none)
- Icons remain centered
- Tooltips appear on hover with nav item name
- Toggle button: `chevron-left` icon at bottom of sidebar

---

### 2.7 Navigation Tab Bar (Mobile)

**Purpose:** Bottom navigation for RainMachine Dashboard on mobile.
**Visible only:** <768px viewport width

**Visual description:**
Fixed to the bottom of the screen. Same background as sidebar but horizontal. Five icon slots with labels below each (11px Orbitron). Active tab has a top accent line in cyan. Safe area inset applied for notched phones.

```css
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(10, 22, 40, 0.98);
  border-top: 1px solid rgba(0,212,255,0.15);
  display: flex;
  padding-bottom: env(safe-area-inset-bottom);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

---

### 2.8 Data Table

**Purpose:** Display tabular data (leads, campaigns, agents, finance).

**Visual description:**
The table sits in a panel card. The header row has slightly higher brightness text (primary not muted). Each data row is cleanly separated with a 1px rule in rgba(0,212,255,0.06) — barely visible, just structural. Alternating rows at rgba(0,212,255,0.02) — the effect is subtle. The active/hovered row glows: background rgba(0,212,255,0.06), left border 2px cyan.

**Sort icon:** Small up/down chevron in muted cyan. Active sort direction: bright cyan with glow.

```css
.data-table th {
  font: 400 11px/1.4 'Orbitron', sans-serif;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid rgba(0,212,255,0.15);
  text-align: left;
}

.data-table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid rgba(0,212,255,0.06);
  font: 400 13px/1.5 'Share Tech Mono', monospace;
  color: var(--color-text-primary);
}

.data-table tr:hover td {
  background: rgba(0,212,255,0.04);
  border-left: 2px solid #00D4FF; /* applied to first td in row */
}
```

---

### 2.9 Alert Item

**Purpose:** Display actionable alerts in the CEO dashboard alert tray.
**Severity variants:** CRITICAL | WARNING | INFORMATIONAL

**Visual description:**
A panel-within-a-panel. Left border is a 3px solid vertical rule in the severity color (orange for critical, amber for warning, cyan for info). The alert category in Orbitron 10px, the detail text in Inter 14px, the source attribution in Share Tech Mono 11px muted. An [INVESTIGATE →] link in the bottom right.

```css
.alert-item {
  border-left: 3px solid #FF6B35;  /* critical */
  background: rgba(255,107,53,0.04);
  padding: var(--space-3) var(--space-4);
  border-radius: 0 4px 4px 0;
}

.alert-item.warning {
  border-left-color: #FFB800;
  background: rgba(255,184,0,0.04);
}

.alert-item.info {
  border-left-color: #00D4FF;
  background: rgba(0,212,255,0.04);
}
```

---

### 2.10 Input Field

**Purpose:** Form data entry across onboarding portal and settings.

**Visual description:**
Minimal and structured. The label sits above the field in Orbitron uppercase, 11px, letter-spaced. The input itself has a subtle dark fill, a cyan border at low opacity, and on focus: the border brightens to full cyan and a soft outer glow appears — as if the field is energizing to accept input. This focus state is the single most important micro-interaction in the onboarding portal: it makes data entry feel active and purposeful.

```css
.input-field {
  background: rgba(0,212,255,0.04);
  border: 1px solid rgba(0,212,255,0.2);
  border-radius: 4px;
  padding: var(--space-3) var(--space-4);
  font: 400 15px/1.5 'Inter', sans-serif;
  color: var(--color-text-primary);
  width: 100%;
  transition: border-color 200ms, box-shadow 200ms;
}

.input-field:focus {
  outline: none;
  border-color: #00D4FF;
  box-shadow: 0 0 0 3px rgba(0,212,255,0.15);
}

.input-field::placeholder {
  color: #2A4A5A;
}

.input-field.error {
  border-color: rgba(255,107,53,0.6);
  box-shadow: 0 0 0 3px rgba(255,107,53,0.1);
}
```

---

### 2.11 Button

**Purpose:** Primary and secondary CTAs.
**Variants:** Primary | Secondary | Ghost | Destructive | Icon-only

**Primary button:**
```css
.btn-primary {
  background: #00D4FF;
  color: #050D1A;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font: 600 13px/1.0 'Orbitron', sans-serif;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 200ms, box-shadow 200ms;
}

.btn-primary:hover {
  background: #1ADCFF;
  box-shadow: 0 0 20px rgba(0,212,255,0.3);
}

.btn-primary:active {
  background: #00B8E0;
  box-shadow: none;
}

.btn-primary:disabled {
  background: #0A4F6E;
  color: #2A4A5A;
  cursor: not-allowed;
  box-shadow: none;
}
```

**Secondary button:**
```css
.btn-secondary {
  background: transparent;
  color: #00D4FF;
  border: 1px solid rgba(0,212,255,0.4);
  border-radius: 4px;
  padding: 11px 24px; /* 1px less to account for border */
  font: 600 13px/1.0 'Orbitron', sans-serif;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.btn-secondary:hover {
  border-color: #00D4FF;
  background: rgba(0,212,255,0.08);
  box-shadow: 0 0 12px rgba(0,212,255,0.15);
}
```

**Ghost / link button:**
```css
.btn-ghost {
  background: transparent;
  color: #00D4FF;
  border: none;
  padding: var(--space-2) 0;
  font: 400 11px/1.4 'Orbitron', sans-serif;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
}

.btn-ghost::after {
  content: ' →';
}

.btn-ghost:hover {
  color: #1ADCFF;
  text-shadow: 0 0 8px rgba(0,212,255,0.5);
}
```

---

### 2.12 Tooltip

**Purpose:** Supplementary information on hover for truncated data or icon buttons.

```css
.tooltip {
  position: absolute;
  background: #0D1E35;
  border: 1px solid rgba(0,212,255,0.3);
  border-radius: 4px;
  padding: var(--space-2) var(--space-3);
  font: 400 12px/1.5 'Inter', sans-serif;
  color: var(--color-text-primary);
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  pointer-events: none;
  opacity: 0;
  transition: opacity 150ms;
  z-index: 100;
}
```

---

### 2.13 Chart Components

**Line Chart (MRR Trend, CPL Trend):**
- Library recommendation: Recharts or Chart.js (custom theme)
- Line color: #00D4FF
- Fill (area under line): linear-gradient from rgba(0,212,255,0.15) to transparent
- Grid lines: rgba(0,212,255,0.06), horizontal only
- Axis labels: Share Tech Mono 11px, #7ECFDF
- Hover crosshair: 1px dashed rgba(0,212,255,0.4)
- Tooltip: custom styled as per tooltip component above

**Sparkline (7-day mini trend):**
- Height: 28px (inline within metric areas)
- No axis, no labels — pure trend line
- Color: same as parent metric health color

**Bar Chart (Lead source breakdown):**
- Horizontal bars
- Bar colors: Meta #00D4FF, Google #FFB800, Organic #00FF88
- Background track: rgba(0,212,255,0.06)
- Bar radius: 2px (slight rounding on right end)
- Label: source name left-aligned in Orbitron 11px, value right-aligned in Share Tech Mono 12px

**Funnel (Pipeline stages):**
- Horizontal segments proportional to count at each stage
- Each segment: different opacity of cyan (leftmost 100%, rightmost ~30%)
- Count displayed centered in each segment in Share Tech Mono
- Hover: segment brightens + tooltip with full stage details

---

## PART 3: SPACING SYSTEM

Base unit: **4px** (--space-1)

```
--space-1:   4px    /* micro spacing, icon padding */
--space-2:   8px    /* tight spacing, badge padding */
--space-3:   12px   /* standard row padding, table cell */
--space-4:   16px   /* standard gap, section spacing */
--space-5:   20px   /* panel gap */
--space-6:   24px   /* panel internal padding */
--space-8:   32px   /* section separation */
--space-10:  40px   /* large section gap */
--space-12:  48px   /* page section padding */
--space-16:  64px   /* major section spacing */
--space-20:  80px   /* page top padding */
--space-24:  96px   /* hero spacing */
```

**Layout grid:**
- Desktop 1440px: 12-column, 24px gutters, 32px margins
- Desktop 1024px: 12-column, 20px gutters, 24px margins
- Tablet 768px: 8-column, 16px gutters, 20px margins
- Mobile 375px: 4-column, 16px gutters, 16px margins

Dashboard panel layout:
- 4-quadrant grid: 2 columns × 2 rows, gap: 20px (--space-5)
- Each panel: col-span-1 (50% minus half gap each)
- Claude AI panel: col-span-2 (full width)

---

## PART 4: SHADOW AND GLOW SYSTEM

MIRD uses glow instead of traditional drop shadows. Glow communicates light emission from the UI itself — the panels are glowing, not casting shadows.

```css
/* Panel glow (default) */
--glow-panel:        0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1)

/* Panel glow (hover/active) */
--glow-panel-hover:  0 0 30px rgba(0,212,255,0.12), inset 0 1px 0 rgba(0,212,255,0.15)

/* Metric glow (high value, success state) */
--glow-success:      0 0 12px rgba(0,255,136,0.3)

/* Alert glow */
--glow-alert:        0 0 12px rgba(255,107,53,0.3)

/* Warning glow */
--glow-warning:      0 0 12px rgba(255,184,0,0.2)

/* Interactive element glow (buttons, inputs) */
--glow-interactive:  0 0 20px rgba(0,212,255,0.3)

/* Focus ring glow */
--glow-focus:        0 0 0 3px rgba(0,212,255,0.15)

/* Ambient panel glow animation */
--glow-ambient: 3s ease-in-out infinite alternate
  0 0 15px rgba(0,212,255,0.06) to 0 0 25px rgba(0,212,255,0.1)
```

---

## PART 5: ANIMATION TIMING LIBRARY

All animations follow JARVIS principles: purposeful (communicates system state), not decorative (not animated for its own sake), and respectful of reduced-motion preferences.

```css
/* ── DURATIONS ── */
--dur-instant:     50ms   /* immediate response feedback */
--dur-flash:       100ms  /* fastest intentional transition */
--dur-fast:        200ms  /* standard hover/focus transitions */
--dur-standard:    300ms  /* panel state changes */
--dur-moderate:    500ms  /* page element entrances */
--dur-scan:        1500ms /* data scan-line across panel */
--dur-boot:        1200ms /* number counter boot-up */
--dur-draw:        1000ms /* progress ring draw */
--dur-pulse:       2000ms /* status dot breathing cycle */
--dur-glow-pulse:  3000ms /* ambient card border glow */

/* ── EASINGS ── */
--ease-standard:   cubic-bezier(0.25, 0.46, 0.45, 0.94)  /* most transitions */
--ease-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1)        /* elements entering */
--ease-accelerate: cubic-bezier(0.4, 0.0, 1, 1)          /* elements leaving */
--ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1)     /* panel pop-in */
--ease-linear:     linear                                  /* scan lines, loading bars */

/* ── NAMED ANIMATIONS ── */

/* Status dot breathing */
@keyframes system-pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 6px currentColor, 0 0 12px rgba(currentColor, 0.4);
  }
  50% {
    opacity: 0.4;
    box-shadow: 0 0 2px currentColor;
  }
}

/* Alert attention flash — 3 blinks then holds */
@keyframes alert-flash {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

/* Panel scan-line on data load */
@keyframes scan-line {
  0%   { top: -2px; opacity: 1; }
  90%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

/* Shimmer for skeleton loading */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.shimmer-bar {
  background: linear-gradient(90deg,
    rgba(0,212,255,0.04) 25%,
    rgba(0,212,255,0.1) 50%,
    rgba(0,212,255,0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

/* Panel entrance */
@keyframes panel-enter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Ambient background glow pulse */
@keyframes ambient-glow {
  0%, 100% { box-shadow: 0 0 15px rgba(0,212,255,0.06); }
  50%       { box-shadow: 0 0 25px rgba(0,212,255,0.10); }
}

/* Onboarding completion fill */
@keyframes progress-fill {
  from { width: 0%; }
  to   { width: 100%; }
}
```

---

## PART 6: ICON SYSTEM

**Recommendation:** Lucide Icons (MIT license, consistent 24px grid, stroke-based, scales cleanly)

Reasons for Lucide:
- Stroke-based icons work with the JARVIS aesthetic (they feel like wireframe/HUD elements)
- Consistent 24px grid, 2px stroke weight
- Comprehensive set covering all MIRD needs
- React and vanilla SVG versions available
- Stroke weight can be reduced to 1.5px for muted/secondary contexts

**Custom icons needed (not in Lucide):**
1. MIRD RainMachine logomark — custom SVG (stylized rain/signal intersection)
2. JARVIS scan diamond — geometric crosshair for empty states
3. AI/neural indicator — for Claude AI panel headers and report attributions
4. Department icons (4 custom icons, one per autonomous department) — geometric, consistent stroke weight

**Icon sizing system:**
```
--icon-xs:   14px  /* inline in text, badge icons */
--icon-sm:   16px  /* table cell icons, metadata */
--icon-md:   20px  /* standard UI icons */
--icon-lg:   24px  /* navigation icons, section headers */
--icon-xl:   32px  /* empty state icons */
--icon-2xl:  48px  /* large decorative icons */
```

**Icon color usage:**
- Active/primary: #00D4FF
- Muted/secondary: #7ECFDF
- Alert: #FF6B35
- Success: #00FF88
- Warning: #FFB800
- Decorative (empty states): #2A4A5A

---

## PART 7: DESIGN TOKEN REFERENCE

### Color Tokens
```
color.bg.base             #050D1A
color.bg.panel            #0A1628
color.bg.panel.hover      #0D1E35
color.bg.overlay          rgba(10,22,40,0.85)

color.cyan.primary        #00D4FF
color.cyan.muted          #7ECFDF
color.cyan.deep           #0A4F6E
color.cyan.dim            rgba(0,212,255,0.2)

color.status.success      #00FF88
color.status.warning      #FFB800
color.status.alert        #FF6B35
color.status.alert.text   #FF7D52    /* accessible version for inline text */
color.status.error        #FF3333

color.text.primary        #E8F4F8
color.text.muted          #7ECFDF
color.text.disabled       #2A4A5A

color.border.glow         rgba(0,212,255,0.2)
color.border.subtle       rgba(0,212,255,0.08)
color.border.strong       rgba(0,212,255,0.4)
```

### Typography Tokens
```
font.family.display    'Orbitron', sans-serif
font.family.data       'Share Tech Mono', monospace
font.family.body       'Inter', sans-serif

font.size.display      32px
font.size.h1           24px
font.size.h2           18px
font.size.h3           14px
font.size.label        11px
font.size.metric.xl    48px
font.size.metric.lg    32px
font.size.metric.md    24px
font.size.metric.sm    16px
font.size.mono.sm      13px
font.size.mono.xs      11px
font.size.body         15px
font.size.body.sm      13px

font.weight.regular    400
font.weight.medium     500
font.weight.semibold   600
font.weight.bold       700
font.weight.black      900

letter.spacing.tight   0.04em
letter.spacing.normal  0.06em
letter.spacing.wide    0.08em
letter.spacing.wider   0.1em
letter.spacing.widest  0.12em
```

### Spacing Tokens (see Part 3 above)

### Border Radius Tokens
```
radius.sharp    2px   /* badges, small elements */
radius.default  4px   /* panels, buttons, inputs */
radius.soft     8px   /* notifications, tooltips */
radius.full     9999px /* pills, avatars */
```

### Z-Index Scale
```
z.base        0
z.raised      10     /* hovered elements */
z.panel       20     /* side panels, drawers */
z.overlay     30     /* modal overlays */
z.modal       40     /* modal dialogs */
z.toast       50     /* notifications */
z.tooltip     60     /* tooltips */
z.skiplink    70     /* skip nav link */
```

---

## PART 8: GRID & LAYOUT PATTERNS

### Dashboard Layout Pattern (Desktop)
```css
.dashboard-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 52px 1fr;
  height: 100vh;
  overflow: hidden;
}

.dashboard-sidebar   { grid-column: 1; grid-row: 1 / 3; }
.dashboard-header    { grid-column: 2; grid-row: 1; }
.dashboard-main      { grid-column: 2; grid-row: 2; overflow-y: auto; }
```

### 4-Panel Grid
```css
.panel-grid-4 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: var(--space-5); /* 20px */
}

.panel-grid-4 .panel-full-width {
  grid-column: 1 / -1;
}
```

### CEO Dashboard Layout
```css
.ceo-layout {
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  gap: var(--space-5);
  padding: var(--space-6);
  max-width: 1440px;
  margin: 0 auto;
}
```

### Onboarding Portal Layout
```css
.onboarding-layout {
  min-height: 100vh;
  background: var(--color-bg-base);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-12) var(--space-6);
}

.onboarding-wizard {
  width: 100%;
  max-width: 720px;
}
```

---

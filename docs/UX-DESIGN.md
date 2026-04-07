# UX-DESIGN.md
# Make It Rain Digital — Complete UX Specification
# Version 1.0 | March 2026

---

## PART 1: DESIGN PHILOSOPHY

### 1.1 Emotional Design Framework

The MIRD design system is built on a single governing principle: **every user should feel like an operator, not a subscriber.** The difference is psychological. A subscriber consumes a service. An operator commands a system.

This distinction drives every micro-decision — from the font choice (Orbitron feels like a military HUD, not a SaaS dashboard) to empty states (never "No data yet," always "AWAITING SIGNAL — SYSTEM STANDING BY") to hover states (interactive elements glow, not just highlight, because glowing implies energy, not just affordance).

**Three emotional targets:**

1. **Marcus (RainMachine):** Confidence and control. The feeling of Tony Stark reviewing his suit's diagnostics before a mission. He opens the dashboard, the system reports its status to him. He is in command.

2. **Shomari (CEO Dashboard):** Trust and velocity. He completes his loop in 30 minutes because the machine has done the work. Every metric is where it should be or an alert has already surfaced. He spends no time searching — the system presents.

3. **New Client (Onboarding):** Certainty and momentum. They just signed a contract. They're giving MIRD access to their ad accounts — an act of trust. Every step should feel deliberate, secure, and progressively validating. By Step 5, they should feel the machine spinning up around them.

### 1.2 JARVIS Aesthetic Implementation Guide

The JARVIS HUD aesthetic is achieved through five design primitives applied consistently:

**Primitive 1: The Holographic Panel**
Every content container is a panel, not a card. Panels feel like projected holograms — they have depth through glow, not shadow.

```css
.panel {
  background: rgba(10, 22, 40, 0.85);
  border: 1px solid rgba(0, 212, 255, 0.2);
  box-shadow:
    0 0 20px rgba(0, 212, 255, 0.08),
    inset 0 1px 0 rgba(0, 212, 255, 0.1),
    inset 0 0 40px rgba(0, 212, 255, 0.02);
  border-radius: 4px; /* Sharp, not rounded — this is a terminal, not a consumer app */
}
```

**Primitive 2: The Geometric Grid Background**
The page background is never flat. A subtle grid implies a coordinate system — a mission control floor.

```css
body {
  background-color: #050D1A;
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 39px,
      rgba(0, 212, 255, 0.03) 39px,
      rgba(0, 212, 255, 0.03) 40px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 39px,
      rgba(0, 212, 255, 0.03) 39px,
      rgba(0, 212, 255, 0.03) 40px
    );
}
```

**Primitive 3: Live Pulse Indicators**
Any live system status uses a breathing pulse dot. This is the heartbeat of the UI.

```css
.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00FF88;
  box-shadow: 0 0 6px #00FF88;
  animation: system-pulse 2s ease-in-out infinite;
}

@keyframes system-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px #00FF88, 0 0 12px rgba(0, 255, 136, 0.4); }
  50% { opacity: 0.4; box-shadow: 0 0 2px #00FF88; }
}
```

**Primitive 4: Boot-Up Number Counters**
All metric numbers animate from 0 to their final value on page load. Duration: 1200ms, easing: cubic-bezier(0.25, 0.46, 0.45, 0.94). This makes data feel like a live readout, not a static page.

**Primitive 5: Scanning Line Animations**
On data loads and panel refreshes, a horizontal scan line sweeps across the panel.

```css
.scanning::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 212, 255, 0.8),
    transparent
  );
  animation: scan-line 1.5s ease-in-out;
}

@keyframes scan-line {
  0% { top: 0%; opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
```

---

## PART 2: COLOR SYSTEM

```
--color-bg-base:        #050D1A  /* page background */
--color-bg-panel:       #0A1628  /* panel/card background */
--color-bg-panel-hover: #0D1E35  /* panel hover state */
--color-bg-overlay:     rgba(10, 22, 40, 0.85) /* translucent panel */

--color-cyan-primary:   #00D4FF  /* primary glow, links, active states */
--color-cyan-muted:     #7ECFDF  /* secondary text, muted labels */
--color-cyan-deep:      #0A4F6E  /* borders, inactive elements */
--color-cyan-dim:       rgba(0, 212, 255, 0.2) /* very subtle tints */

--color-alert:          #FF6B35  /* critical alerts, arc reactor orange */
--color-success:        #00FF88  /* system online, success states */
--color-warning:        #FFB800  /* warnings, at-risk indicators */

--color-text-primary:   #E8F4F8  /* primary body text */
--color-text-muted:     #7ECFDF  /* muted/secondary text */
--color-text-disabled:  #2A4A5A  /* disabled states */

--color-border-glow:    rgba(0, 212, 255, 0.2)
--color-border-subtle:  rgba(0, 212, 255, 0.08)
```

---

## PART 3: TYPOGRAPHY

### Typeface Roles

```
Font 1: Orbitron (Google Fonts, weights: 400, 600, 700, 900)
  Use for: Navigation labels, panel titles, metric labels, all-caps section headers,
           system status text, button labels
  Letter-spacing: 0.08em to 0.12em (wider tracking for the terminal aesthetic)
  Always uppercase for headings and labels

Font 2: Share Tech Mono (Google Fonts, weight: 400)
  Use for: All numerical readouts, timestamps, IDs, percentages, currency values,
           status codes, data table cells, any value that "ticks" or updates live
  This font is the "data voice" of the system

Font 3: Inter (Google Fonts, weights: 400, 500)
  Use for: Claude AI report prose, descriptions, help text, onboarding body copy,
           any paragraph-length text
  This is the "human voice" — it contrasts with the machine fonts deliberately
```

### Type Scale

```css
--text-display:   font: 900 32px/1.1 'Orbitron'; letter-spacing: 0.1em;   /* Page titles */
--text-heading-1: font: 700 24px/1.2 'Orbitron'; letter-spacing: 0.08em;  /* Panel titles */
--text-heading-2: font: 600 18px/1.3 'Orbitron'; letter-spacing: 0.06em;  /* Section headers */
--text-heading-3: font: 600 14px/1.4 'Orbitron'; letter-spacing: 0.08em;  /* Sub-labels */
--text-label:     font: 400 11px/1.4 'Orbitron'; letter-spacing: 0.12em;  /* All-caps labels */
--text-metric-xl: font: 400 48px/1.0 'Share Tech Mono';                    /* Hero numbers */
--text-metric-lg: font: 400 32px/1.0 'Share Tech Mono';                    /* Large metrics */
--text-metric-md: font: 400 24px/1.0 'Share Tech Mono';                    /* Standard metrics */
--text-metric-sm: font: 400 16px/1.0 'Share Tech Mono';                    /* Inline metrics */
--text-mono-sm:   font: 400 13px/1.5 'Share Tech Mono';                    /* Table data */
--text-mono-xs:   font: 400 11px/1.4 'Share Tech Mono';                    /* Timestamps, IDs */
--text-body:      font: 400 15px/1.6 'Inter';                              /* Prose */
--text-body-sm:   font: 400 13px/1.5 'Inter';                              /* Small body */
```

---

## PART 4: ANIMATION SPECIFICATIONS

```css
/* Timing tokens */
--duration-instant:   100ms
--duration-fast:      200ms
--duration-standard:  300ms
--duration-slow:      500ms
--duration-boot:      1200ms  /* number counter boot-up */
--duration-scan:      1500ms  /* panel scan line */
--duration-pulse:     2000ms  /* status pulse loop */

/* Easing tokens */
--ease-sharp:    cubic-bezier(0.25, 0.46, 0.45, 0.94)  /* standard interactions */
--ease-boot:     cubic-bezier(0.25, 0.46, 0.45, 0.94)  /* number countup */
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1)     /* panel entrance */
--ease-out:      cubic-bezier(0.0, 0.0, 0.2, 1)        /* exit animations */

/* Named animations */
system-pulse:    2s ease-in-out infinite       /* status dot breathing */
scan-line:       1.5s ease-in-out once         /* panel data load */
boot-counter:    1.2s cubic-bezier(0.25,0.46,0.45,0.94) once   /* 0 → value */
panel-entrance:  0.4s cubic-bezier(0.34,1.56,0.64,1)   /* panel slide-in from below */
glow-pulse:      3s ease-in-out infinite       /* ambient card border glow */
alert-flash:     0.8s ease-in-out 3            /* alert state indicator */
data-tick:       0.15s ease-out                /* single value update */
```

---

## PART 5: SPACING SYSTEM

Base unit: 4px

```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
--space-24: 96px
```

Panel internal padding: 24px (--space-6)
Section gap: 16px (--space-4)
Panel gap: 20px (--space-5)

---

## PART 6: RESPONSIVE BREAKPOINTS

```css
/* Primary — desktop dashboard experience */
@media (min-width: 1440px) { /* wide desktop — 4-column grid */ }

/* Standard desktop */
@media (max-width: 1439px) and (min-width: 1024px) { /* 2-column or 4-column grid */ }

/* Tablet */
@media (max-width: 1023px) and (min-width: 768px) {
  /* 2-column grid, panels stack gracefully */
  /* Navigation collapses to icon rail */
}

/* Mobile */
@media (max-width: 767px) and (min-width: 375px) {
  /* Single column */
  /* Bottom tab navigation replaces sidebar */
  /* Metric panels become horizontal scroll cards */
  /* Panels show top 2 metrics only, expand on tap */
}
```

RainMachine Dashboard: Desktop-first, mobile responsive (Marcus uses mobile 60% of the time)
CEO Dashboard: Desktop only (1024px minimum enforced)
Client Onboarding Portal: Mobile-first (clients complete on any device)

---

## PART 7: COMPONENT LIBRARY

### 7.1 Panel Card

The core container. Used for every data section.

```
Structure:
  ┌──────────────────────────────────────┐  ← panel border (rgba(0,212,255,0.2))
  │ ◆ PANEL TITLE         [●] LIVE       │  ← panel header (24px padding)
  │────────────────────────────────────── │  ← divider line (rgba(0,212,255,0.1))
  │                                      │
  │  [content area]                      │
  │                                      │
  └──────────────────────────────────────┘

States:
  default:   border-color rgba(0,212,255,0.2), no glow
  hover:     border-color rgba(0,212,255,0.4), box-shadow 0 0 30px rgba(0,212,255,0.12)
  loading:   scan-line animation plays across panel, content opacity 0.3
  error:     border-color rgba(255,107,53,0.4), header shows [!] SYSTEM FAULT
  empty:     content area shows empty state component
```

### 7.2 Metric Readout

Used for all KPI numbers.

```
Structure (large):
  [LABEL IN ORBITRON 11px]
  [VALUE in Share Tech Mono 48px]
  [△ DELTA in Share Tech Mono 13px] [vs last period in Orbitron 10px]

Delta colors:
  positive: #00FF88 with ▲ prefix
  negative: #FF6B35 with ▼ prefix
  neutral:  #7ECFDF with — prefix

Animation: Value counts from 0 to final value over 1200ms on mount.
```

### 7.3 Status Indicator

```
ONLINE:      ● pulse-dot green (#00FF88) + "ONLINE" in Orbitron 11px
PROCESSING:  ● pulse-dot cyan (#00D4FF) + "PROCESSING"
AT RISK:     ● static dot orange (#FF6B35) + "AT RISK"
OFFLINE:     ● static dot red (#FF3333) + "SYSTEM FAULT"
STANDBY:     ● dim pulse dot muted (#7ECFDF) + "STANDBY"
```

### 7.4 Lead Card

Used in lead list views.

```
┌────────────────────────────────────────┐
│ [INITIALS AVATAR] JOHN MARTINEZ        │  ← name in Orbitron 13px
│                   Metro Realty Group   │  ← org in Inter 12px muted
│                                        │
│ [STAGE BADGE]  [$CPL]  [AI CALL ICON] │  ← metadata row
│ Last contact: 2026-03-28 09:41:33     │  ← timestamp in Share Tech Mono 11px
└────────────────────────────────────────┘

Stage badge colors:
  NEW LEAD:         background rgba(0,212,255,0.15), border cyan
  CONTACTED:        background rgba(255,184,0,0.15), border amber
  APPOINTMENT SET:  background rgba(0,255,136,0.15), border green
  CLOSED:           background rgba(0,255,136,0.25), border green bright
  LOST:             background rgba(255,107,53,0.1), border orange dim
```

### 7.5 Agent Activity Card

Used in CEO dashboard agent log.

```
┌────────────────────────────────────────────┐
│ DEPT 2 · AD OPERATIONS AGENT               │
│ Last run: 2026-03-29 07:15:00 UTC          │
│ ────────────────────────────────────────── │
│ Actions completed: 12                      │
│ Alerts raised:     1                       │
│ Next run:          2026-03-29 13:15:00 UTC │
│                                            │
│ [VIEW FULL LOG →]                          │
└────────────────────────────────────────────┘
```

### 7.6 Client Health Card

Used in CEO dashboard client grid.

```
┌─────────────────────────────┐
│ MARCUS JOHNSON              │  ← client name Orbitron 13px
│ Johnson Realty Group        │  ← org Inter 12px
│                             │
│ ██████████░░░░  68%         │  ← health score bar (color: score-based)
│ CPL: $24.50  ROAS: 3.2x    │
│ [● HEALTHY]                 │  ← or [● AT RISK] [● CRITICAL]
└─────────────────────────────┘

Health score colors:
  80-100: #00FF88 green
  60-79:  #FFB800 amber
  0-59:   #FF6B35 orange alert
```

### 7.7 Progress Ring

Used for percentage metrics (conversion rate, campaign health, show rate).

```
SVG circle component:
  outer-radius: varies by size (lg: 40px, md: 28px, sm: 20px)
  stroke-width: 3px
  track-color: rgba(0,212,255,0.1)
  fill-color: based on value (green 80+, amber 60-79, orange <60)
  stroke-linecap: round
  animation: stroke-dashoffset from full to value over 1000ms on mount
  center-label: value in Share Tech Mono, font size proportional to ring size
```

### 7.8 Navigation Sidebar

```
Width: 240px (expanded), 64px (collapsed)
Background: rgba(10, 22, 40, 0.95)
Border-right: 1px solid rgba(0, 212, 255, 0.15)
Top: MIRD logo + "RAINMACHINE" wordmark in Orbitron

Nav items:
  Icon (24px) + Label in Orbitron 11px letter-spacing 0.1em
  Active: left border 2px #00D4FF, background rgba(0,212,255,0.08), text #00D4FF
  Hover:  background rgba(0,212,255,0.05), text #E8F4F8, transition 200ms

  Items:
  [⌂]  DASHBOARD
  [◎]  LEADS
  [◈]  AGENTS
  [▣]  CAMPAIGNS
  [✦]  AI REPORTS
  [⚙]  SETTINGS

Bottom: User avatar + name + logout icon
```

### 7.9 Claude AI Chat Input

```
┌────────────────────────────────────────────────────────┐
│ ✦ Ask RainMachine AI                             [SEND]│
└────────────────────────────────────────────────────────┘

Placeholder rotates between:
  "Ask about your CPL this week..."
  "What drove the appointment spike on Tuesday?"
  "Compare my agents' close rates..."
  "Why did my Meta spend efficiency drop?"

Focus state: border-color #00D4FF, box-shadow 0 0 15px rgba(0,212,255,0.2)
```

### 7.10 Alert/Notification Tray

Used in CEO dashboard.

```
Header: "⚠ ESCALATIONS REQUIRING ACTION" in Orbitron + count badge

Alert item:
  ┌──────────────────────────────────────────────┐
  │ [!] CLIENT AT RISK                           │  ← category in Orbitron
  │ Johnson Realty — CPL up 47% week-over-week   │  ← detail in Inter
  │ Flagged by: Ad Operations Agent · 07:15 UTC  │  ← source in Share Tech Mono 11px
  │ [INVESTIGATE →]                              │
  └──────────────────────────────────────────────┘
```

---

## PART 8: EMPTY STATES

Empty states maintain the JARVIS voice — the system is aware, standing by, not absent.

```
No leads:
  Icon: scanning crosshair SVG in dim cyan
  Title: "AWAITING INCOMING SIGNALS"
  Body: "Lead acquisition pipeline is active. New contacts will appear here as they enter the system."
  CTA: none (passive state)

No campaigns:
  Title: "NO ACTIVE CAMPAIGNS DETECTED"
  Body: "Connect your Meta or Google Ads account to begin campaign monitoring."
  CTA: [CONNECT AD ACCOUNT →]

No Claude AI reports:
  Title: "INTELLIGENCE REPORTS INITIALIZING"
  Body: "Your first weekly report will generate after your campaigns have been live for 7 days."

No agent activity:
  Title: "AGENT STANDBY — AWAITING FIRST RUN"
  Body: "Department agents execute on schedule. First activity log will appear after initialization."

Empty lead pipeline stage:
  Icon: dotted pipe section
  Title: "NO LEADS AT THIS STAGE"
  (no body text — keep it minimal in list views)
```

---

## PART 9: LOADING STATES

```
Full page load:
  - Background grid appears first (instant)
  - MIRD logo pulses in center (300ms)
  - "INITIALIZING RAINMACHINE SYSTEM..." text in Orbitron types in character-by-character
  - Panels enter staggered (each delayed by 80ms from previous)
  - Numbers boot up (1200ms after panel enters)

Panel refresh (data polling):
  - Scan line animation plays across panel (1500ms)
  - Metric values tick to new values (150ms per value)
  - Pulse dot flashes cyan during update

Skeleton state (panel loading content):
  - Panel structure visible with correct height
  - Content areas replaced by shimmer bars
  - Shimmer: linear-gradient sweep right, rgba(0,212,255,0.05) to rgba(0,212,255,0.12) to rgba(0,212,255,0.05)
  - Shimmer animation: 1.8s ease-in-out infinite
```

---

## PART 10: ERROR STATES

```
Data fetch error:
  Panel border-color changes to rgba(255,107,53,0.4)
  Header shows: "● SIGNAL LOST" in orange
  Content: "Data feed interrupted. Attempting reconnection..."
  Retry CTA: [↻ RECONNECT]

Auth error:
  Full screen: "SESSION EXPIRED — REINITIALIZING AUTHENTICATION"
  Auto-redirects to login after 3 seconds

Partial data (some metrics unavailable):
  Individual metric readout shows "--" in Share Tech Mono
  Tooltip on hover: "Data unavailable for this period"
  Does not block rest of panel
```

---

## PART 11: SCREEN SPECIFICATIONS — RAINMACHINE DASHBOARD

### Screen 1: Main Dashboard (Home)

**Layout: Desktop 1440px**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [NAV SIDEBAR 240px] │ [MAIN CONTENT AREA]                                    │
│                     │                                                         │
│  ◉ MIRD             │  ┌────────────────────────────────────────────────┐   │
│                     │  │ ● RAINMACHINE SYSTEM — ONLINE    WK 13 · 2026  │   │
│  [⌂] DASHBOARD      │  │  MARCUS JOHNSON · JOHNSON REALTY                │   │
│  [◎] LEADS          │  └────────────────────────────────────────────────┘   │
│  [◈] AGENTS         │                                                         │
│  [▣] CAMPAIGNS      │  [PANEL 1: LEAD ACQUISITION] [PANEL 2: PIPELINE]       │
│  [✦] AI REPORTS     │                                                         │
│  [⚙] SETTINGS       │  [PANEL 3: AGENT PERFORMANCE] [PANEL 4: CAMPAIGNS]     │
│                     │                                                         │
│  ─────────────────  │  ┌────────────────────────────────────────────────┐   │
│  [AVATAR]           │  │ ✦ CLAUDE AI INTELLIGENCE                        │   │
│  Marcus Johnson     │  │ [Weekly summary prose] [Chat input]             │   │
│  [→ LOGOUT]         │  └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**System Status Header**
- Background: rgba(0, 212, 255, 0.04), border-bottom 1px solid rgba(0,212,255,0.15)
- Left: ● pulse-dot green + "RAINMACHINE SYSTEM — ONLINE" in Orbitron 13px
- Center: User name + team in Orbitron 11px muted
- Right: Week number + date in Share Tech Mono 13px
- Height: 52px

**Panel 1: Lead Acquisition (top-left)**
Title: "LEAD ACQUISITION"
Metrics row:
- LEADS THIS WEEK: [number] — Share Tech Mono 48px, boot-up animation
- AI CALL SUCCESS RATE: [%] — progress ring, 40px radius
- COST PER LEAD: [$X.XX] — Share Tech Mono 32px

Source breakdown: horizontal bar chart (3 bars max: Meta, Google, Organic)
Bar colors: Meta = #00D4FF, Google = #FFB800, Organic = #00FF88

**Panel 2: Pipeline**
Title: "LEAD PIPELINE"
Funnel visualization: horizontal segments representing pipeline stages
Stages: NEW → CONTACTED → APPT SET → SHOW → CLOSED
Each segment: count in Share Tech Mono, percentage of total

Key metrics below funnel:
- APPOINTMENTS BOOKED: [n] this week
- SHOW RATE: [%] with progress ring
- CLOSE RATE: [%] with progress ring

**Panel 3: Agent Performance**
Title: "AGENT PERFORMANCE"
Top 3 agents: ranked list with mini progress bars
  [RANK] [NAME] [LEADS] [CONVERSIONS] [RATE%]
Each row: alternating background rgba(0,212,255,0.03)
View all link: "VIEW ALL AGENTS →" in Orbitron 10px cyan

**Panel 4: Campaign Intelligence**
Title: "CAMPAIGN INTELLIGENCE"
Platform tabs: [META ADS] [GOOGLE ADS] — active tab has cyan underline
Per platform:
- SPEND: [$X,XXX] large
- CPL: [$XX.XX]
- ROAS: [X.Xx]
- CTR: [X.XX%]
Mini trend sparkline for spend: last 7 days, line in cyan

**Claude AI Intelligence Panel (full width, bottom)**
Left half: Latest weekly report summary in Inter 15px, titled "WEEKLY INTELLIGENCE BRIEF — WK 13"
Right half: Chat interface
- Message history (last 3 exchanges visible, scrollable)
- Input: "Ask RainMachine AI..."
- Send button: [TRANSMIT] in Orbitron

**Mobile Layout (375px)**
- Nav collapses to bottom tab bar (5 icons)
- System header compresses to 44px
- Panels stack vertically, full width
- Each panel shows only top 2 metrics, "[EXPAND]" to see full panel
- Claude AI panel: chat-first, summary behind a toggle

**Loading State:** Each panel enters with 80ms stagger, scan line plays, numbers boot up.
**Empty State:** "SYSTEM ONLINE — AWAITING FIRST DATA SYNC" with pulsing MIRD logo.

---

### Screen 2: Leads View

**URL:** /dashboard/leads

**Layout:**
```
[HEADER ROW]
  ← LEAD ACQUISITION INTELLIGENCE    [142 ACTIVE LEADS]    [+ EXPORT]

[FILTER BAR]
  [ALL STAGES ▾] [ALL SOURCES ▾] [THIS WEEK ▾] [AI CALLED ▾]  [🔍 SEARCH]

[LEADS TABLE / CARD LIST — TOGGLE VIEW]

[PAGINATION]  SHOWING 1-25 OF 142 LEADS   [← PREV] [NEXT →]
```

**Filter Bar:**
Background: rgba(10,22,40,0.8), border 1px solid rgba(0,212,255,0.1)
Filter pills: Orbitron 11px, letter-spacing 0.08em
Active filter: cyan background fill, dark text

**Lead Table Columns:**
| STATUS | NAME | SOURCE | STAGE | AI CALL | CPL | LAST ACTIVITY | |
- STATUS: pulse dot (active=green, inactive=dim)
- NAME: Orbitron 13px + org in Inter 11px muted below
- SOURCE: [META] [GOOGLE] [ORGANIC] badge
- STAGE: stage badge with color coding
- AI CALL: [✓ CONNECTED] [✗ NO ANSWER] [⟳ PENDING] in Share Tech Mono 11px
- CPL: $ value in Share Tech Mono
- LAST ACTIVITY: relative time in Share Tech Mono 11px ("2h ago")
- Actions column: [→] expands to lead detail side panel

**Lead Detail Side Panel:**
Slides in from right (400px width) on row click.
```
┌─────────────────────────────────────────────────────┐
│ [✕]  LEAD INTELLIGENCE — JOHN MARTINEZ              │
│ ──────────────────────────────────────────────────  │
│ Metro Realty Group  |  Metro Phoenix Area           │
│                                                      │
│ STAGE: [APPOINTMENT SET]   SOURCE: META ADS          │
│ LEAD ID: RM-2024-004821                              │
│ ENTERED SYSTEM: 2026-03-25 14:22:18 UTC              │
│                                                      │
│ ── TIMELINE ──                                       │
│ ● Lead created          2026-03-25 14:22             │
│ ● AI call initiated     2026-03-25 14:23             │
│ ● Connected - 4:12      2026-03-25 14:24             │
│ ● Appointment set       2026-03-25 14:26             │
│ ● Reminder sent         2026-03-28 09:00             │
│                                                      │
│ ── AI CALL TRANSCRIPT SUMMARY ──                     │
│ [Inter prose — Claude summary of call]               │
│                                                      │
│ ── ASSIGNED AGENT ──                                 │
│ Sarah Chen  |  [REASSIGN →]                         │
└─────────────────────────────────────────────────────┘
```

**Empty State:** "NO LEADS MATCH CURRENT FILTERS" with reset button.
**Loading:** Table rows shimmer, count badge shows "—".

---

### Screen 3: Agent Performance

**URL:** /dashboard/agents

**Layout:**
Top: Summary bar — TOTAL AGENTS: [n] | AVG CONVERSION RATE: [%] | BEST PERFORMER: [NAME]

Main content: 2-column grid of Agent Performance Panels

**Agent Performance Panel:**
```
┌───────────────────────────────────────────────┐
│ SARAH CHEN                    [● ACTIVE]       │
│ Agent ID: RM-A-0012                            │
│ ─────────────────────────────────────────────  │
│ LEADS ASSIGNED    CONTACTED    CONVERTED       │
│      [24]            [19]          [8]          │
│                                                │
│ CONVERSION RATE                                │
│ [◉ 33% ring — green]                          │
│                                                │
│ COST EFFICIENCY: $21.40 avg CPL                │
│ TOP SOURCE: Meta Ads (62%)                     │
│                                                │
│ LEAD DISTRIBUTION ──────────────────────────  │
│ New:       ████░░░░░░  8                       │
│ Contacted: ██████░░░░  11                      │
│ Appt Set:  ███░░░░░░░  5                       │
│                                                │
│ [VIEW FULL PROFILE →]                          │
└───────────────────────────────────────────────┘
```

**Lead Routing View** (toggle at top right):
Visual flow diagram showing lead distribution across agents.
Leads enter left as a stream, route to agent columns based on routing rules.
Each routing rule displayed as a horizontal connector with label.

**Mobile:** Single column, panels tap to expand. Conversion rings scale to 56px radius.

---

### Screen 4: Campaign Intelligence

**URL:** /dashboard/campaigns

**Layout:**
```
[PLATFORM SWITCHER: [META ADS] [GOOGLE ADS] [ALL PLATFORMS]]

[PERFORMANCE OVERVIEW PANEL — full width]
  TOTAL SPEND | AVG CPL | AVG ROAS | TOTAL LEADS | BEST PERFORMING CAMPAIGN

[CAMPAIGN TABLE]
[CREATIVE PERFORMANCE PANEL]
```

**Performance Overview Panel:**
5 metric readouts across the full width panel.
Trend sparklines beneath each metric (7-day, 28px height).

**Campaign Table:**
| CAMPAIGN NAME | PLATFORM | STATUS | SPEND | CPL | ROAS | LEADS | CTR | HEALTH |
- HEALTH column: mini progress ring 20px + score
- Status: [● ACTIVE] [● PAUSED] [● LEARNING] [● ISSUE]
- Row click: expands to campaign detail below table (accordion)

**Creative Performance Panel:**
Grid of creative thumbnails (3 per row)
Each creative:
- Thumbnail image (placeholder: cyan wireframe icon)
- [AD ID in Share Tech Mono] below
- CTR | LEADS | SPEND metrics in 3-column micro layout
- Top performers: green border glow
- Underperformers: orange border glow

**Mobile:** Platform switcher becomes horizontal scroll. Table becomes swipeable cards.

---

### Screen 5: Claude AI Reports

**URL:** /dashboard/reports

**Layout: 2-column (60/40 split)**

**Left: Report History**
```
INTELLIGENCE ARCHIVE

[SEARCH REPORTS ■■■■■■■■■■■■■■]

Week 13 · Mar 23-29, 2026              [● CURRENT]
  "Strong CPL improvement. Sarah Chen..."
  [READ FULL REPORT →]

Week 12 · Mar 16-22, 2026
  "Appointment show rate dropped 8%..."
  [READ FULL REPORT →]

[Load older reports]
```

**Right: Active Report / Chat**

When viewing a report:
```
┌────────────────────────────────────────────────────────────┐
│ INTELLIGENCE BRIEF — WEEK 13                               │
│ Generated: 2026-03-29 06:00:00 UTC  |  RAINMACHINE AI v2   │
│ ──────────────────────────────────────────────────────────  │
│                                                             │
│ [Inter 15px prose — full Claude-generated report]          │
│                                                             │
│ This week your team generated 47 new leads at an average   │
│ CPL of $21.40, a 12% improvement from last week's $24.30.  │
│ ...                                                         │
│                                                             │
│ ── ASK A FOLLOW-UP ──────────────────────────────────────  │
│ [Chat history]                                             │
│ [■■■ CHAT INPUT — Ask about this report... ■■■] [SEND]     │
└────────────────────────────────────────────────────────────┘
```

Chat messages:
- User message: right-aligned, background rgba(0,212,255,0.1), border cyan
- AI response: left-aligned, standard panel style, "✦ RAINMACHINE AI" label above

**Loading state for AI response:** Three dots pulse animation + "PROCESSING QUERY..."
**Empty state (no reports yet):** "INTELLIGENCE REPORTS INITIALIZING — FIRST REPORT GENERATES AFTER 7 DAYS LIVE"

---

### Screen 6: Settings

**URL:** /dashboard/settings

**Layout: Tab navigation across top**
Tabs: [TEAM] [LEAD ROUTING] [NOTIFICATIONS] [INTEGRATIONS] [ACCOUNT]

**Team Tab:**
Table of team members:
| AVATAR | NAME | ROLE | STATUS | LEADS (30d) | LAST ACTIVE | [ACTIONS] |
Add team member button: [+ ADD AGENT] — opens modal

**Lead Routing Tab:**
Visual rule builder:
```
IF source = [META ADS ▾] AND budget_tier = [PREMIUM ▾]
  THEN assign to [SARAH CHEN ▾] with [ROUND ROBIN ▾]
  [+ ADD CONDITION] [DELETE RULE]
```
Rules styled as panel rows with drag handles (⠿) on left.

**Notifications Tab:**
Toggle rows:
```
[●] Weekly AI Report ready              Email + SMS
[●] New lead assigned to your account  SMS
[○] Agent performance alerts            —
[●] Campaign CPL spike (>20%)          Email
```
Toggles: custom styled, on=cyan, off=muted border

**Integrations Tab:**
Connected platform status cards:
```
[META BUSINESS MANAGER]   [● CONNECTED]    Last sync: 2026-03-29 07:00
[GOOGLE ADS]              [● CONNECTED]    Last sync: 2026-03-29 07:00
[GOOGLE MY BUSINESS]      [● CONNECTED]    Last sync: 2026-03-29 07:01
[CRM INTEGRATION]         [○ NOT CONNECTED] [CONNECT →]
```

---

## PART 12: SCREEN SPECIFICATIONS — CEO DASHBOARD

### Screen 1: Command Center (Home)

**URL:** /ceo

**Access:** Shomari's internal login only. No public access. No mobile fallback — desktop required.

**Layout: Full bleed, dense information**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ MIRD COMMAND CENTER    SAT 2026-03-29    07:31:44 UTC    [● ALL SYSTEMS GO]  │
├──────────────────────────────────────────────────────────────────────────────┤
│ [MRR: $47,200] [MRR GROWTH: +8.4%] [ACTIVE CLIENTS: 18] [CHURN: 0.0%]      │
│ ══════ NORTH STAR BAR — always visible, sticky at top ══════                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ⚠ ALERT TRAY: 2 items requiring attention                                   │
│  [!] Johnson Realty — CPL +47% WoW     [INVESTIGATE →]                      │
│  [!] New client onboarding stalled at Step 3  [REVIEW →]                    │
│                                                                              │
├─────────────────────────────┬────────────────────────────────────────────────┤
│ DEPT 1: GROWTH &            │ DEPT 2: AD OPERATIONS & AI DELIVERY            │
│ CLIENT ACQUISITION          │                                                 │
│                             │  ACTIVE CAMPAIGNS:     [47]                    │
│  CALLS BOOKED THIS WEEK: 8  │  CLIENT CPL HEALTH:    ████████░░ 82%          │
│  DBR PIPELINE VALUE: $24K   │  CLIENTS AT RISK:      [2] [VIEW]              │
│  OUTBOUND SENT:      [124]  │  AVG ROAS:             [3.4x]                  │
│  CLOSE RATE:         [22%]  │  CAMPAIGNS LIVE:       [✓] 47 ACTIVE           │
│                             │                                                 │
│  [VIEW DEPT 1 DETAIL →]     │  [VIEW DEPT 2 DETAIL →]                        │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ DEPT 3: PRODUCT &           │ DEPT 4: FINANCE &                              │
│ AUTOMATION                  │ BUSINESS INTELLIGENCE                          │
│                             │                                                 │
│  ONBOARDING QUEUE:  [3]     │  [MRR TREND CHART — 12mo sparkline]           │
│  AVG TIME-TO-LIVE: 4.2 days │  MRR:    $47,200  ▲8.4%                       │
│  N8N UPTIME:       99.7%    │  LTV:CAC [4.8:1]                               │
│  ACTIVE WORKFLOWS: [47]     │  90-DAY FORECAST: $51,400                      │
│  AUTOMATION ERRORS: [0]     │  CHURN RISK (90d): [LOW]                       │
│                             │                                                 │
│  [VIEW DEPT 3 DETAIL →]     │  [VIEW DEPT 4 DETAIL →]                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ CLIENT HEALTH GRID                                              [VIEW ALL →]  │
│                                                                               │
│  [CLIENT CARD] [CLIENT CARD] [CLIENT CARD] [CLIENT CARD] [CLIENT CARD]       │
│  [CLIENT CARD] [CLIENT CARD] [CLIENT CARD] [CLIENT CARD] [CLIENT CARD]       │
└──────────────────────────────────────────────────────────────────────────────┘
```

**North Star Bar:**
Sticky below main header. Always visible even when scrolling.
Background: rgba(0, 212, 255, 0.06), border-bottom 1px solid rgba(0,212,255,0.2)
4 metrics equally spaced, each with current value, delta, and micro-trend line.

**Alert Tray:**
Collapsible. When 0 alerts: "NO ESCALATIONS — ALL SYSTEMS NOMINAL" in green.
When alerts exist: orange border left-rule, alert item rows.
Alert dismissal: swipe right or [DISMISS] button, logs dismissal timestamp.

**Department Panels (2x2 grid):**
Each panel: 50% width, consistent height.
Panel title row: dept number + dept name + last-updated timestamp.
"VIEW DEPT X DETAIL →" link in lower right of each panel.

**Client Health Grid:**
5-column grid of client health cards.
Sorted: AT RISK first (orange), then AMBER, then HEALTHY.
"VIEW ALL CLIENTS →" expands to full client list page.

**Live Clock:**
Header timestamp updates every second. Share Tech Mono 14px.

---

### Screen 2: Client Detail (CEO View)

**URL:** /ceo/clients/[client-id]

**Layout:**
```
← COMMAND CENTER    MARCUS JOHNSON — JOHNSON REALTY GROUP
                    Client since: 2025-08-14  |  MRR: $2,200  |  [● HEALTHY]

[TAB ROW: OVERVIEW | CAMPAIGNS | LEADS | TIMELINE | FINANCIALS]
```

**Overview Tab:**
Left column (60%): Campaign performance metrics, CPL trend chart (30-day line chart), pipeline funnel
Right column (40%): Quick stats, next scheduled report date, notes field

**Campaigns Tab:**
Same campaign table as RainMachine Campaign Intelligence screen, read-only for Shomari.

**Leads Tab:**
Same lead table as RainMachine Leads screen, read-only.

**Timeline Tab:**
Chronological log:
```
2026-03-29  07:15  AI: Ad Operations Agent flagged CPL spike
2026-03-28  14:00  AUTO: Weekly report generated and delivered
2026-03-25  09:30  HUMAN: Shomari reviewed account, no action
2026-03-22  06:00  AUTO: Weekly report generated and delivered
```

**Financials Tab:**
Invoice history, MRR value, contract tier, renewal date.

---

### Screen 3: Agent Activity Log

**URL:** /ceo/agents

**Layout:**
Header: "AUTONOMOUS DEPARTMENT ACTIVITY LOG — 2026-03-29"

4 expandable sections, one per department:

```
▼ DEPT 2: AD OPERATIONS AGENT                    Last run: 07:15 UTC [● ACTIVE]

  07:15:22 UTC  Scanned 47 active campaigns
  07:15:31 UTC  Detected CPL anomaly: Johnson Realty +47% WoW
  07:15:32 UTC  Escalation created: ALERT-2026-0329-002
  07:16:01 UTC  Completed routine health check — 46 campaigns nominal
  07:16:04 UTC  Next scheduled run: 13:15 UTC

  [VIEW FULL LOG] [DOWNLOAD LOG]
```

Log entries: Share Tech Mono 12px
Timestamps: Share Tech Mono 11px muted
Action types color coded:
- Routine: text primary
- Alert raised: #FF6B35
- Success: #00FF88
- Error: #FF3333

---

### Screen 4: Financial Intelligence

**URL:** /ceo/finance

**Layout:**
```
[MRR TREND — 12-month line chart, full width]
[MRR: current] [GROWTH %] [CHURN RATE] [LTV] [CAC] [LTV:CAC ratio]

[TWO COLUMNS]
Left: P&L per client table
Right: 90-day forecast + scenario modeling
```

**MRR Trend Chart:**
Line chart, cyan line on dark background.
Projection period (future months): dashed line, muted cyan.
Chart axis: Share Tech Mono 11px
Hover tooltip: dark panel, exact values in Share Tech Mono.

**P&L Per Client Table:**
| CLIENT | MRR | AD SPEND | LABOR EST | GROSS MARGIN | HEALTH SCORE |
Row click: expands inline to show 6-month history.
Color row background: margin <30% = rgba(255,107,53,0.05) warning tint.

**90-Day Forecast Panel:**
3 scenario columns: CONSERVATIVE | BASE | OPTIMISTIC
Each: MRR projection, new clients needed, churn tolerance.

---

## PART 13: SCREEN SPECIFICATIONS — CLIENT ONBOARDING PORTAL

### Overall Onboarding Structure

**URL:** /onboarding/[token]

The portal is accessed via a unique URL sent to the client after contract signing. The token is single-use and expires in 7 days.

**Outer layout:**
```
[MIRD LOGO — centered, above portal]
[STEP PROGRESS BAR — 5 steps, horizontal]
[MAIN WIZARD PANEL — centered, max-width 720px]
[BOTTOM: step navigation buttons]
```

Progress bar: 5 numbered circles connected by lines.
Active step: filled cyan circle, glowing.
Completed step: filled green circle with checkmark.
Upcoming step: dim border circle.

The wizard panel is the largest, most prominent element. Background: #0A1628. Border: 1px solid rgba(0,212,255,0.3). Generous padding: 48px.

---

### Step 1: Welcome + Contract Confirmation

**Title:** "SYSTEM INITIALIZATION"
**Subtitle (Orbitron 11px muted):** "STEP 1 OF 5 — IDENTITY VERIFICATION"

Content:
```
Welcome, [CLIENT FIRST NAME].

Your RainMachine system is ready to be built. This 20-minute
setup connects your advertising accounts so our AI can begin
driving leads to your business.

Here's what you'll complete:
  ✓ Confirm your contract details
  ✓ Enter your business information
  ✓ Connect Meta Ads (guided)
  ✓ Connect Google Ads & GMB (guided)
  ✓ Upload creative assets

CONTRACT CONFIRMATION
───────────────────────────────────────────────
  Client:    Johnson Realty Group
  Package:   RainMachine Pro
  Start date: 2026-04-01
  Monthly:   $2,200/month

  [■ I confirm these details are correct]  ← required checkbox

  AUTHORIZED BY: [INPUT — their full name]
  DATE: [auto-filled — today's date]
───────────────────────────────────────────────
```

CTA button: [BEGIN SETUP →] — disabled until checkbox + name filled.
Button style: full width, background #00D4FF, text #050D1A, Orbitron 13px.

**Micro-copy beneath button:**
"Your information is encrypted and secure. MIRD will never share your data."

---

### Step 2: Business Information

**Title:** "MISSION PARAMETERS"
**Subtitle:** "STEP 2 OF 5 — TARGETING INTELLIGENCE"

Form fields (all styled with cyan-glow focus states):
```
BUSINESS NAME *
  [Johnson Realty Group                        ]

PRIMARY MARKETS * (comma separated)
  [Metro Phoenix, Scottsdale, Tempe            ]

TARGET AUDIENCE *
  [First-time homebuyers, Move-up buyers, 30-50, income $80K+]

AVERAGE TRANSACTION VALUE *
  [$350,000                                    ]

CURRENT MONTHLY AD SPEND
  [$2,500/month                                ]

MAIN GOAL (select one)
  ○ Generate buyer leads
  ○ Generate seller leads
  ○ Both buyers and sellers
  ● Both buyers and sellers  ← active selection

ANYTHING ELSE WE SHOULD KNOW?
  [Large textarea — optional]
```

Field labels: Orbitron 11px uppercase, letter-spacing 0.1em.
Input fields: background rgba(0,212,255,0.05), border 1px solid rgba(0,212,255,0.2), focus: border #00D4FF + box-shadow 0 0 0 3px rgba(0,212,255,0.15).
Validation: inline, appears below field on blur. Error: orange text, error border.

---

### Step 3: Meta Ads Connection

**Title:** "META ADS INTEGRATION"
**Subtitle:** "STEP 3 OF 5 — PLATFORM ACCESS"

```
CONNECT YOUR META BUSINESS MANAGER

To run ads for you, we need System User access to your Meta Business Manager.
This is standard practice and gives us the minimum permissions needed.

FOLLOW THESE STEPS:

  STEP 3A  ─────────────────────────────────────────────────────
  Open Meta Business Manager
  [→ OPEN META BUSINESS MANAGER] (opens new tab)
  Go to: Settings → Users → System Users

  STEP 3B  ─────────────────────────────────────────────────────
  Add MIRD as a System User
  System User Name: mird-operations
  Role: Admin

  STEP 3C  ─────────────────────────────────────────────────────
  Generate and paste your System User Token:
  [■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■]  [VERIFY →]

  STATUS: ○ NOT VERIFIED
```

After clicking VERIFY:
- Scanning animation on the token input
- Status changes to: [● VERIFYING...] → [● META ADS CONNECTED — SYSTEM USER ACTIVE]

If verification fails: "[!] TOKEN NOT RECOGNIZED — Check permissions and try again"

Help section below (collapsed by default):
"Having trouble? [WATCH 2-MINUTE WALKTHROUGH VIDEO]" (placeholder link)
"Need help? [CONTACT SUPPORT]"

---

### Step 4: Google Ads + Google My Business

**Title:** "GOOGLE INTEGRATION"
**Subtitle:** "STEP 4 OF 5 — SEARCH INTELLIGENCE"

Two subsections:

**Google Ads:**
```
YOUR GOOGLE ADS CUSTOMER ID
[XXX-XXX-XXXX                ]   [WHERE IS THIS? ▾]

Send manager account invitation to:
  ads@makeitrain.digital

  [→ OPEN GOOGLE ADS]

  STATUS: ○ INVITATION NOT YET ACCEPTED
  [CHECK STATUS]
```

**Google My Business:**
```
YOUR GOOGLE BUSINESS PROFILE

Search for your business:
[Johnson Realty Group, Phoenix         ] [SEARCH]

[SEARCH RESULT: Johnson Realty Group]
[4.8 ★  Metro Phoenix  |  Real Estate Agency]
[● SELECT THIS BUSINESS]

  Once selected, invite reviews@makeitrain.digital as Manager
  [→ OPEN GOOGLE BUSINESS PROFILE]

  STATUS: ○ NOT YET INVITED
  [CHECK STATUS]
```

Both sections have independent status indicators. Step can only be completed when at least Google Ads is verified.

---

### Step 5: Creative Assets + Launch Preferences

**Title:** "LAUNCH CONFIGURATION"
**Subtitle:** "STEP 5 OF 5 — ASSET UPLOAD"

```
CREATIVE ASSETS

Upload your existing photos, logos, and videos. Our team will
build your first ad creatives from these assets.

  LOGO FILES *
  [DRAG AND DROP — or click to upload]
  Accepted: PNG, SVG, AI  |  Max: 10MB

  PROPERTY PHOTOS
  [DRAG AND DROP — or click to upload]
  Accepted: JPG, PNG  |  Max: 50MB total  |  Up to 30 photos

  VIDEOS (if any)
  [DRAG AND DROP — or click to upload]
  Accepted: MP4, MOV  |  Max: 500MB

LAUNCH PREFERENCES

  TARGET LAUNCH DATE
  [April 1, 2026   [calendar]]   (7 days from today minimum)

  ANYTHING SPECIFIC FOR YOUR FIRST CAMPAIGN?
  [Textarea]

  NOTIFICATION PREFERENCE
  ○ Email me when campaigns go live
  ● Text me when campaigns go live
  ● Both

  SMS NUMBER: [+1 (602) 555-0142]
```

Drop zones: dashed border rgba(0,212,255,0.3), background rgba(0,212,255,0.03).
On file hover: border solid, background rgba(0,212,255,0.08).
Uploaded files show as list below drop zone with file name, size, remove button.

---

### Completion Screen

**URL:** /onboarding/complete

**Full screen experience:**
```
[Full page — dark background, geometric grid visible]

[Animated MIRD logo — expands from center, glows]

RAINMACHINE INITIALIZING

████████████████████████████ 100%

YOUR SYSTEM IS BEING BUILT.

We've received everything we need. Your first campaigns will
launch by [TARGET DATE]. You'll receive a text confirmation
the moment they go live.

WHAT HAPPENS NEXT:

  ◉ 2026-03-30 AM  Our team reviews your assets (today)
  ◉ 2026-03-30 PM  Campaign structure built in Meta & Google
  ◉ 2026-03-31     Campaigns enter review and approval
  ◎ 2026-04-01     RAINMACHINE GOES LIVE

ADD TO CALENDAR:
  [+ LAUNCH DATE — ADD TO GOOGLE CALENDAR]

Questions? [support@makeitrain.digital]
```

The progress bar animation: fills from 0% to 100% over 3 seconds with scanning effect.
Logo glow: ambient pulse animation 3s ease-in-out infinite.
Countdown items animate in with 200ms stagger.

---

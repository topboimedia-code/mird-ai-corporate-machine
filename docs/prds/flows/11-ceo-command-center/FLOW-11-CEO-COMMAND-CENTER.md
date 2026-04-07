# Flow PRD: CEO Command Center

**Flow ID:** FLOW-11
**App:** CEO Dashboard
**Platform:** Web (Desktop-first, 1440px optimized)
**Date:** 2026-03-30
**Status:** Ready for Wireframe
**Screens:** 4

---

## 1. Flow Metadata

| Field | Value |
|---|---|
| Flow ID | FLOW-11 |
| Flow Name | CEO Command Center |
| App | CEO Dashboard |
| Platform | Web — Desktop-first (1440px optimized, 1024px min) |
| Auth Level | CEO / Owner only |
| Entry Point | Successful CEO authentication (FLOW-10) |
| Primary Exit | Department drill-down flows (FLOW-13), Client Detail (FLOW-12) |
| Priority | P0 — Core CEO experience |
| Screens | 4 |
| Last Updated | 2026-03-30 |

### Screens in this Flow

| Screen ID | Screen Name | Priority | Visual Complexity | Interaction Complexity |
|---|---|---|---|---|
| ceo-command-center-main | MIRD Command Center | P0 | Complex | Complex |
| ceo-command-center-alert-detail | Alert Investigation | P0 | Medium | Simple |
| ceo-command-center-alert-dismiss-modal | Dismiss Alert | P1 | Simple | Simple |
| ceo-clients-list | All Clients | P1 | Complex | Simple |

---

## 1A. UI Profile Compliance

### JARVIS Dark Design System — CEO Command Center Checklist

| Rule | Applies | Implementation |
|---|---|---|
| NO sidebar — full-width layout | YES | CEO has header + north star bar only. No left nav. Max-width 1440px centered. |
| CEO Header 52px sticky | YES | bg rgba(10,22,40,0.98), border-bottom rgba(0,212,255,0.1), blur(12px) |
| North Star Bar 48px sticky top 52px | YES | 4 agency metrics: MRR, Leads, Avg CPL, Active Clients |
| Orbitron for ALL labels/headings | YES | All section titles, card labels, column headers |
| Share Tech Mono for ALL data/metrics | YES | All numeric values, timestamps, metric displays |
| Inter for body text | YES | Alert descriptions, detail paragraphs, notes |
| Panel Card spec | YES | bg #0A1628, border rgba(0,212,255,0.2), radius 4px, padding 24px |
| BANNED: emoji icons | ENFORCED | Lucide React icons only |
| BANNED: pulsating decorative circles | ENFORCED | Status dots only, functional use |
| BANNED: soft gradients | ENFORCED | Only area-chart fill gradient (data visualization) |
| BANNED: radius > 8px on panels | ENFORCED | Max 8px (soft), default 4px, sharp 2px |
| Alert Item spec | YES | CRITICAL/WARNING/INFO with correct border colors |
| Client Health Card spec | YES | Bottom progress bar, 3-col mini grid, health color |
| Status Dot spec | YES | ONLINE #00FF88, PROCESSING #00D4FF, AT RISK #FF6B35 |
| Data Table spec | YES | Orbitron 11px headers, STM 13px cells, hover state |
| Primary Button spec | YES | bg #00D4FF text #050D1A Orbitron 600 13px UPPERCASE |
| Ghost Button spec | YES | transparent text #00D4FF Orbitron 11px UPPERCASE with → |

---

## 2. CMO Context

The CEO Command Center is Shomari's operational nerve center — the single screen that tells him the health of his entire agency in one glance. This is the JARVIS HUD moment: when the screen loads, Shomari should feel "I see everything. I am in command."

**Who uses this:** Shomari Williams (MIRD CEO / Owner). This is not a team screen — it is a personal command interface built for the owner's situational awareness.

**What decisions are made here:**
- Which clients need immediate attention (CPL above threshold, no appointments booked)
- Which departments are falling behind (ad ops, growth, product, finance)
- Whether to intervene in an alert or delegate
- Which client to deep-dive on (click to client detail)

**Frequency of use:** Multiple times daily. Morning check-in, end-of-day review, on-demand during client calls.

**Emotional design goal:** Confidence and control. The layout moves top-to-bottom: agency health (north star) → active problems (alerts) → operational heartbeat (departments) → client roster health. Everything Shomari needs to know flows in priority order.

**Empty states matter:** If no alerts exist, show "NO ESCALATIONS — ALL SYSTEMS NOMINAL" — this is a positive signal, not a void.

---

## 3. User Journey

```
[CEO Login Success]
        │
        ▼
┌─────────────────────────────────┐
│   ceo-command-center-main       │  ◄─── Primary screen
│   The JARVIS HUD                │
│   - Header + North Star bar     │
│   - Alert Tray (expanded)       │
│   - Department Grid             │
│   - Client Health Grid          │
└────────────┬────────────────────┘
             │
    ┌─────────┼────────────────────────────────┐
    │         │                                │
    ▼         ▼                                ▼
[Alert     [Dept Card                    [Client Card /
INVESTIGATE →]  DRILL DOWN →]            VIEW ALL →]
    │         │                                │
    ▼         ▼                                ▼
┌──────────┐ ┌─────────────────┐    ┌──────────────────┐
│ alert-   │ │ FLOW-13 screens │    │ ceo-clients-list │
│ detail   │ │ (dept drill-    │    │ All clients table│
│          │ │  downs)         │    └────────┬─────────┘
└────┬─────┘ └─────────────────┘             │
     │                                       ▼
     │                              [client row click]
     │                                       │
     │                                       ▼
     │                             ┌──────────────────────┐
     │                             │ FLOW-12              │
     │                             │ ceo-clients-detail-  │
     │                             │ overview             │
     │                             └──────────────────────┘
     │
     ├─[DISMISS WITH NOTE]──►
     │                        ┌──────────────────────────┐
     │                        │ alert-dismiss-modal      │
     │                        │ (modal overlay)          │
     │                        └────────┬─────────────────┘
     │                                 │
     │                        [CONFIRM DISMISS]
     │                                 │
     └──────────────[BACK] ◄───────────┘
                                       │
                              ▼ returns to
                        ceo-command-center-main
                        (alert removed from tray)
```

---

## 4. Screen Specifications

---

### SCREEN 1: `ceo-command-center-main`

**Name:** MIRD Command Center
**Priority:** P0
**Visual Complexity:** Complex
**Interaction Complexity:** Complex

#### 4.1.1 Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  [◈ MIRD]  CEO COMMAND CENTER                [●] ALL SYSTEMS NOMINAL  03-30-2026 │  ← 52px
│                                               14:22:07                [SJ] Logout ›│    sticky
├──────────────────────────────────────────────────────────────────────────────────┤
│  MRR $142,000  ▲2.1%  │  LEADS 1,892  ▲14%  │  AVG CPL $44.20  ▼$3.10  │  ACTIVE CLIENTS 12  │  ← 48px
├──────────────────────────────────────────────────────────────────────────────────┤
│  [24px padding all sides — max-width 1440px centered]                             │
│                                                                                    │
│  ┌─ ACTIVE ESCALATIONS  [2] ──────────────────────────────────────── [− COLLAPSE]─┐│
│  │                                                                                 ││
│  │  ┌─[!]──────────────────────────────────────────────────── 2h ago ────────────┐││
│  │  │  CRITICAL          AD OPERATIONS                                            │││
│  │  │  Client "Summit Roofing" — CPL exceeded threshold ($89 vs $60 target)       │││
│  │  │  SOURCE: META-CAMPAIGN-204                              [INVESTIGATE →]      │││
│  │  └───────────────────────────────────────────────────────────────────────────┘││
│  │                                                                                 ││
│  │  ┌─[!]──────────────────────────────────────────────────── 5h ago ────────────┐││
│  │  │  WARNING           GROWTH & ACQUISITION                                     │││
│  │  │  DBR outreach sequence stalled — 0 responses in 72 hours                   │││
│  │  │  SOURCE: SEQUENCE-OUTREACH-07                           [INVESTIGATE →]      │││
│  │  └───────────────────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                    │
│  DEPARTMENT GRID                                                                   │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│  │ DEPT 1             │  │ DEPT 2             │  │ DEPT 3             │  │ DEPT 4             │
│  │ GROWTH &           │  │ AD OPERATIONS      │  │ PRODUCT &          │  │ FINANCIAL          │
│  │ ACQUISITION        │  │                    │  │ AUTOMATION         │  │ INTELLIGENCE       │
│  │                    │  │                    │  │                    │  │                    │
│  │  [●] ONLINE        │  │  [●] PROCESSING    │  │  [●] ONLINE        │  │  [●] ONLINE        │
│  │                    │  │                    │  │                    │  │                    │
│  │  CALLS BOOKED      │  │  ACTIVE CAMPS      │  │  ONBOARDING        │  │  MRR               │
│  │  12                │  │  34                │  │  3                 │  │  $142,000          │
│  │                    │  │                    │  │                    │  │                    │
│  │  DBR PIPELINE      │  │  LEADS MTD         │  │  N8N UPTIME        │  │  MARGIN            │
│  │  $48,000           │  │  1,892             │  │  99.8%             │  │  61.4%             │
│  │                    │  │                    │  │                    │  │                    │
│  │  CLOSE RATE        │  │  AVG CPL           │  │  OPEN WORKFLOWS    │  │  FORECAST          │
│  │  28%               │  │  $44.20            │  │  7                 │  │  $158,000          │
│  │                    │  │                    │  │                    │  │                    │
│  │  DRILL DOWN →      │  │  DRILL DOWN →      │  │  DRILL DOWN →      │  │  DRILL DOWN →      │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘  └────────────────────┘
│                                                                                    │
│  ALL CLIENTS  [12]                                                  VIEW ALL →    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Summit       │  │ Evergreen    │  │ Peak Dental  │  │ BlueLine     │          │
│  │ Roofing      │  │ HVAC         │  │              │  │ Plumbing     │          │
│  │ Home Services│  │ Home Services│  │ Healthcare   │  │ Home Services│          │
│  │              │  │              │  │              │  │              │          │
│  │ CPL  $89     │  │ CPL  $41     │  │ CPL  $52     │  │ CPL  $38     │          │
│  │ LDS  142     │  │ LDS  208     │  │ LDS  87      │  │ LDS  195     │          │
│  │ APT  11      │  │ APT  24      │  │ APT  9       │  │ APT  21      │          │
│  │ [AT RISK]    │  │ [HEALTHY]    │  │ [MONITOR]    │  │ [HEALTHY]    │          │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤          │
│  │░░░░░░░░░░░   │  │████████████  │  │████████░░░   │  │████████████  │          │
│  │  (red bar)   │  │  (green bar) │  │  (amber bar) │  │  (green bar) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘          │
│  [+ 8 more clients visible on scroll / grid wraps to next row]                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.1.2 Component Specifications

**CEO HEADER (52px sticky)**
```
Container:
  height: 52px
  position: sticky
  top: 0
  z-index: 30
  background: rgba(10, 22, 40, 0.98)
  border-bottom: 1px solid rgba(0, 212, 255, 0.1)
  backdrop-filter: blur(12px)
  padding: 0 24px
  display: flex
  align-items: center
  justify-content: space-between

Left Group:
  [MIRD Logo mark — geometric diamond shape, cyan #00D4FF, 24x24px SVG]
  "CEO COMMAND CENTER"
    font: Orbitron 14px 600
    color: #E8F4F8
    letter-spacing: 0.12em
    text-transform: uppercase
    margin-left: 12px

Right Group (gap: 24px):
  Status Indicator:
    [●] dot — 8px, color #00FF88, box-shadow: 0 0 6px #00FF88
    animation: pulse 2s infinite (ONLINE)
    "ALL SYSTEMS NOMINAL"
      font: Orbitron 10px 400
      color: #00FF88
      letter-spacing: 0.1em
      margin-left: 6px

  DateTime:
    Date: STM 12px #7ECFDF — "03-30-2026"
    Time: STM 14px #E8F4F8 — "14:22:07" (live clock, ticks every second)
    display: flex flex-col items-end

  User Avatar + Name:
    [SJ] — 32x32 circle, bg #0A4F6E, border 1px solid rgba(0,212,255,0.4)
    font: Orbitron 12px 600 #00D4FF
    "Shomari J." — Inter 13px #7ECFDF margin-left 8px

  Logout:
    "LOGOUT" — Ghost button, Orbitron 11px #7ECFDF
    ::after content: '→'
    hover: color #00D4FF
```

**NORTH STAR BAR (48px sticky)**
```
Container:
  height: 48px
  position: sticky
  top: 52px
  z-index: 20
  background: rgba(10, 22, 40, 0.98)
  border-bottom: 1px solid rgba(0, 212, 255, 0.1)
  backdrop-filter: blur(12px)
  padding: 0 24px
  display: flex
  align-items: center

4 Metric Groups (flex row, space-between or gap: 48px):
  Each group layout:
    label: STM 11px #7ECFDF uppercase — "TOTAL MRR" / "LEADS THIS MONTH" / "AVG CPL" / "ACTIVE CLIENTS"
    value: STM 18px #E8F4F8 — "$142,000" / "1,892" / "$44.20" / "12"
    delta: STM 11px — "▲ $2,940 (2.1%)" positive=#00FF88, negative=#FF6B35
    display: flex flex-col

Dividers between groups:
  1px solid rgba(0, 212, 255, 0.1), height 28px, self-aligned center
```

**MAIN CONTENT AREA**
```
Container:
  padding: 24px
  max-width: 1440px
  margin: 0 auto
  display: flex
  flex-direction: column
  gap: 24px
```

**SECTION 1: ALERT TRAY**
```
Section Container:
  background: #0A1628
  border: 1px solid rgba(0, 212, 255, 0.2)
  border-radius: 4px
  padding: 20px 24px
  box-shadow: 0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1)

Section Header:
  display: flex
  justify-content: space-between
  align-items: center
  border-bottom: 1px solid rgba(0,212,255,0.1)
  padding-bottom: 16px
  margin-bottom: 16px

  Title:
    "ACTIVE ESCALATIONS"
    font: Orbitron 14px 600
    color: #E8F4F8
    letter-spacing: 0.08em
    text-transform: uppercase

  Alert Count Badge:
    "2" — STM 12px #050D1A
    background: #FF6B35
    border-radius: 2px
    padding: 2px 8px
    margin-left: 12px

  Collapse Toggle:
    "[ − ]" or "[ + ]"
    Orbitron 11px #7ECFDF
    cursor: pointer
    hover: color #00D4FF
    transitions: 200ms

CRITICAL Alert Item:
  border-left: 3px solid #FF6B35
  background: rgba(255, 107, 53, 0.04)
  border-radius: 0 4px 4px 0
  padding: 12px 16px
  margin-bottom: 8px
  display: flex
  flex-direction: column
  gap: 4px
  position: relative

  Category Label:
    "CRITICAL" — Orbitron 10px #FF7D52 letter-spacing 0.12em uppercase
    + separator "  ·  "
    + department: Orbitron 10px #7ECFDF uppercase — "AD OPERATIONS"

  Detail Text:
    Inter 14px #E8F4F8
    "Client 'Summit Roofing' — CPL exceeded threshold ($89 vs $60 target)"

  Source:
    STM 11px #7ECFDF
    "SOURCE: META-CAMPAIGN-204"

  Timestamp:
    STM 11px #7ECFDF
    position: absolute top 12px right 16px
    "2h ago"

  CTA:
    "[INVESTIGATE →]"
    Ghost button — Orbitron 11px #00D4FF
    position: absolute bottom 12px right 16px
    hover: color #1ADCFF

WARNING Alert Item:
  Same structure with:
  border-left: 3px solid #FFB800
  background: rgba(255, 184, 0, 0.04)
  Category: "WARNING" — color #FFB800

INFO Alert Item:
  border-left: 3px solid #00D4FF
  background: rgba(0, 212, 255, 0.04)
  Category: "INFO" — color #00D4FF

EMPTY STATE (no alerts):
  padding: 24px
  text-align: center
  "NO ESCALATIONS — ALL SYSTEMS NOMINAL"
  font: Orbitron 11px #00FF88
  letter-spacing: 0.12em
```

**SECTION 2: DEPARTMENT GRID**
```
Section Header:
  "DEPARTMENT GRID"
  Orbitron 14px 600 #E8F4F8 uppercase letter-spacing 0.08em
  margin-bottom: 16px

Grid Layout:
  display: grid
  grid-template-columns: repeat(4, 1fr)
  gap: 16px

Department Card (each of 4):
  background: #0A1628
  border: 1px solid rgba(0, 212, 255, 0.2)
  border-radius: 4px
  padding: 20px
  box-shadow: 0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1)
  transition: border-color 200ms, box-shadow 200ms
  cursor: pointer

  hover:
    border-color: rgba(0, 212, 255, 0.4)
    box-shadow: 0 0 30px rgba(0,212,255,0.12)
    background: #0D1E35

  Dept Number Label:
    "DEPT 1" — Orbitron 10px #7ECFDF letter-spacing 0.12em uppercase
    margin-bottom: 4px

  Dept Name:
    "GROWTH & ACQUISITION"
    Orbitron 14px 600 #E8F4F8 uppercase letter-spacing 0.08em
    margin-bottom: 16px

  Status Row:
    display: flex align-items: center gap: 8px
    Status dot (8px) + color per dept status
    Status text: STM 12px #7ECFDF uppercase — "ONLINE" / "PROCESSING"
    margin-bottom: 16px

  Metrics Block (3 metrics stacked):
    Each metric:
      Label: Orbitron 11px #7ECFDF uppercase letter-spacing 0.12em
      Value: STM 20px #E8F4F8
      margin-bottom: 12px

  Divider: border-top 1px solid rgba(0,212,255,0.1) margin-top auto

  "DRILL DOWN →"
    Ghost button
    font: Orbitron 11px
    color: #00D4FF
    margin-top: 16px
    display: block

DEPT 1 — GROWTH & ACQUISITION metrics:
  CALLS BOOKED TODAY: 12
  DBR PIPELINE: $48,000
  CLOSE RATE: 28%
  Status: ONLINE #00FF88

DEPT 2 — AD OPERATIONS metrics:
  ACTIVE CAMPAIGNS: 34
  TOTAL LEADS MTD: 1,892
  AVG CPL: $44.20
  Status: PROCESSING #00D4FF

DEPT 3 — PRODUCT & AUTOMATION metrics:
  ONBOARDING QUEUE: 3
  N8N UPTIME: 99.8%
  OPEN WORKFLOWS: 7
  Status: ONLINE #00FF88

DEPT 4 — FINANCIAL INTELLIGENCE metrics:
  MRR: $142,000
  MARGIN: 61.4%
  FORECAST: $158,000
  Status: ONLINE #00FF88
```

**SECTION 3: CLIENT HEALTH GRID**
```
Section Header Row:
  display: flex justify-content: space-between align-items: center
  margin-bottom: 16px

  Title:
    "ALL CLIENTS"
    Orbitron 14px 600 #E8F4F8 uppercase letter-spacing 0.08em
    + badge: "[12]" — STM 12px #7ECFDF bg rgba(0,212,255,0.08) rounded-2px px-6 ml-12

  "VIEW ALL →"
    Ghost button Orbitron 11px #00D4FF
    links to ceo-clients-list

Grid:
  display: grid
  grid-template-columns: repeat(4, 1fr)   [1440px]
  grid-template-columns: repeat(3, 1fr)   [1024px]
  gap: 12px

CLIENT HEALTH CARD (each client):
  position: relative
  background: #0A1628
  border: 1px solid rgba(0, 212, 255, 0.2)
  border-radius: 4px
  padding: 16px
  overflow: hidden
  cursor: pointer
  transition: border 200ms, box-shadow 200ms

  hover:
    border-color: rgba(0, 212, 255, 0.4)
    box-shadow: 0 0 30px rgba(0,212,255,0.12)

  Client Name:
    Orbitron 13px 600 #E8F4F8 uppercase letter-spacing 0.08em

  Business Type:
    Inter 12px #7ECFDF
    margin-top: 2px margin-bottom: 12px

  Metrics Row (3-col mini grid):
    display: grid grid-template-columns: repeat(3, 1fr)

    Each metric cell:
      Label: Orbitron 10px #7ECFDF uppercase letter-spacing 0.1em
      Value: STM 14px #E8F4F8
      margin-bottom: 8px

    Labels: "CPL" | "LEADS" | "APPTS"

  Status Badge:
    margin-top: 8px
    "HEALTHY" — bg rgba(0,255,136,0.08) color #00FF88 border rgba(0,255,136,0.2)
    "MONITOR" — bg rgba(255,184,0,0.08) color #FFB800 border rgba(255,184,0,0.2)
    "AT RISK" — bg rgba(255,107,53,0.08) color #FF7D52 border rgba(255,107,53,0.2)
    font: Orbitron 9px uppercase letter-spacing 0.1em
    border: 1px solid [color]
    border-radius: 2px
    padding: 2px 8px
    display: inline-block

  Health Progress Bar (bottom):
    position: absolute bottom 0 left 0 right 0
    height: 4px
    background: rgba(0,212,255,0.08) (track)

    Fill:
      HEALTHY (>70): #00FF88, width proportional to health score
      MONITOR (40-70): #FFB800
      AT RISK (<40): #FF6B35
      transition: width 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94)
```

#### 4.1.3 Animations

```
PAGE ENTRY SEQUENCE:
  1. Header fades in: 0ms delay, 300ms fade
  2. North Star bar: 100ms delay, 400ms fade + slide-up 4px
  3. Alert Tray: 200ms delay, 400ms fade + slide-up 8px
  4. Dept cards: staggered 80ms each (cards 1-4 at 320ms, 400ms, 480ms, 560ms)
  5. Client cards: staggered 40ms each, begin after dept cards at 640ms

NORTH STAR METRICS boot-counter:
  Each value counts up from 0 to final value
  Duration: 1200ms
  Easing: cubic-bezier(0.25, 0.46, 0.45, 0.94)
  Numbers use comma formatting throughout count
  Stagger: 80ms between each metric

DEPT CARD STATUS DOT:
  ONLINE: #00FF88, pulse animation 2s infinite
    @keyframes pulse-online: 0%/100% box-shadow 0 0 0 0 rgba(0,255,136,0.4), 50% box-shadow 0 0 0 4px rgba(0,255,136,0)
  PROCESSING: #00D4FF, faster pulse 1.2s
  AT RISK: #FF6B35, flash 3 times then settle

CLIENT HEALTH BAR fill:
  On enter: width animates from 0% to final value
  Duration: 800ms delay 400ms
  Easing: cubic-bezier(0.25, 0.46, 0.45, 0.94)

ALERT TRAY collapse/expand:
  max-height transition: 400ms ease-in-out
  opacity transition: 200ms

DATA REFRESH TICK:
  When metric values update (real-time): 150ms ease-out number transition
  STM values flash briefly to #1ADCFF then settle to #E8F4F8

SCAN LINE (entry, once):
  Horizontal line sweeps down full page height
  Duration: 1.5s
  Color: rgba(0,212,255,0.06)
  Fires once on initial load, not on navigations
```

#### 4.1.4 Interactive States

| Element | Default | Hover | Active | Focused | Disabled |
|---|---|---|---|---|---|
| Alert [INVESTIGATE →] | #00D4FF | #1ADCFF + underline | scale(0.98) | outline 1px #00D4FF | n/a |
| Alert Tray [− COLLAPSE] | #7ECFDF | #00D4FF | scale(0.97) | outline 1px | n/a |
| Dept Card | border rgba(0,212,255,0.2) | border rgba(0,212,255,0.4) bg #0D1E35 | scale(0.99) | outline 1px #00D4FF | opacity 0.5 |
| DRILL DOWN → | #00D4FF | #1ADCFF | scale(0.98) | outline | n/a |
| Client Health Card | border rgba(0,212,255,0.2) | border rgba(0,212,255,0.4) | scale(0.99) | outline | n/a |
| VIEW ALL → | #00D4FF | #1ADCFF | scale(0.98) | outline | n/a |
| Logout | #7ECFDF | #FF6B35 | scale(0.97) | outline | n/a |

#### 4.1.5 Data Requirements

```
NORTH STAR BAR:
  Source: Agency-wide aggregation
  - totalMRR: number (sum of all active client MRR)
  - totalMRRDelta: { value: number, percent: number, direction: 'up'|'down' }
  - totalLeadsMTD: number
  - totalLeadsDelta: { value: number, percent: number, direction: 'up'|'down' }
  - avgClientCPL: number
  - avgCPLDelta: { value: number, direction: 'up'|'down' }
  - activeClientCount: number
  Refresh: every 60 seconds (polling) or real-time via WebSocket

ALERT TRAY:
  Source: alerts collection, filtered: status='active', resolved=false
  Alert fields:
    - id: string
    - severity: 'CRITICAL' | 'WARNING' | 'INFO'
    - department: string
    - title: string
    - detail: string
    - source: string (system ID)
    - timestamp: ISO date → display as relative "2h ago"
  Max displayed: 10 (with "VIEW ALL ALERTS →" at bottom if >10)
  Sort: severity desc, timestamp desc

DEPARTMENT GRID:
  Source: 4 department status endpoints
  Each dept: { status, metric1, metric2, metric3 }
  GROWTH: { callsBookedToday, dbrPipelineValue, closeRate }
  ADOPS: { activeCampaigns, totalLeadsMTD, avgCPL }
  PRODUCT: { onboardingQueue, n8nUptime, openWorkflows }
  FINANCE: { mrr, margin, forecast }

CLIENT HEALTH GRID:
  Source: clients collection, all active
  Each client:
    - id, name, businessType
    - healthScore: number (0-100)
    - healthStatus: 'HEALTHY' | 'MONITOR' | 'AT_RISK'
    - metrics: { cpl, leadsMTD, appointmentsMTD }
  Show: top 8 by most recently updated (rest via VIEW ALL →)
  Sort: healthStatus (AT_RISK first), then name
```

---

### SCREEN 2: `ceo-command-center-alert-detail`

**Name:** Alert Investigation
**Priority:** P0
**Visual Complexity:** Medium
**Interaction Complexity:** Simple

#### 4.2.1 Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  [◈ MIRD]  CEO COMMAND CENTER                [●] ALL SYSTEMS NOMINAL  [SJ]  Logout ›│  52px
├──────────────────────────────────────────────────────────────────────────────────┤
│  MRR $142,000  │  LEADS 1,892  │  AVG CPL $44.20  │  ACTIVE CLIENTS 12          │  48px
├──────────────────────────────────────────────────────────────────────────────────┤
│  ← BACK TO COMMAND CENTER                                                         │
│                                                                                    │
│  ┌─ ALERT INVESTIGATION ───────────────────────────────────────────────────────┐  │
│  │                                                                               │  │
│  │  [CRITICAL]  AD OPERATIONS                              14:10:22  03-30-2026  │  │
│  │                                                                               │  │
│  │  CLIENT "SUMMIT ROOFING" — CPL EXCEEDED THRESHOLD                            │  │
│  │  ─────────────────────────────────────────────────────────────────────────   │  │
│  │                                                                               │  │
│  │  Meta campaign #204 for Summit Roofing has been generating leads at an        │  │
│  │  average CPL of $89.40 over the past 48 hours. This exceeds the configured   │  │
│  │  threshold of $60.00 by 49%. The AI ad optimization agent has attempted 3    │  │
│  │  bid adjustments without recovery. Manual review may be required.             │  │
│  │                                                                               │  │
│  │  WHAT TRIGGERED THIS                                                          │  │
│  │  ┌───────────────────────────────────────────────────────────────────────┐   │  │
│  │  │  METRIC              CURRENT VALUE    THRESHOLD    STATUS             │   │  │
│  │  │  ─────────────────   ─────────────    ─────────    ──────────         │   │  │
│  │  │  Avg CPL (48h)       $89.40           $60.00       EXCEEDED ↑49%      │   │  │
│  │  │  Daily Lead Volume   8.2              15.0 target  BELOW TARGET ↓     │   │  │
│  │  │  Campaign Spend/Day  $732             $500 budget  OVER BUDGET ↑46%   │   │  │
│  │  └───────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                               │  │
│  │  AGENT ACTIONS TAKEN                                                          │  │
│  │  ┌───────────────────────────────────────────────────────────────────────┐   │  │
│  │  │  10:14  Bid reduced 15% on all ad sets                    AUTO        │   │  │
│  │  │  11:30  Audience overlap flagged, low-performing excluded  AUTO        │   │  │
│  │  │  13:05  Secondary creative rotation paused                AUTO        │   │  │
│  │  └───────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                               │  │
│  │  ┌─────────────────────────────────────────┐  DISMISS WITH NOTE →            │  │
│  │  │  MARK AS RESOLVED                       │                                  │  │
│  │  └─────────────────────────────────────────┘                                  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 Component Specifications

**Back Navigation:**
```
"← BACK TO COMMAND CENTER"
  Orbitron 11px #7ECFDF uppercase
  hover: color #00D4FF
  margin-bottom: 24px
  display: flex align-items: center gap: 8px
  [ChevronLeft icon Lucide 14px]
```

**Alert Header Card:**
```
Panel card (full design system spec)
padding: 24px

Severity + Department Row:
  display: flex align-items: center gap: 12px

  CRITICAL Badge:
    bg rgba(255,107,53,0.12)
    border: 1px solid rgba(255,107,53,0.4)
    color: #FF7D52
    Orbitron 11px uppercase letter-spacing 0.12em
    padding: 4px 12px radius 2px

  Department:
    Orbitron 11px #7ECFDF uppercase letter-spacing 0.1em

  Timestamp:
    STM 12px #7ECFDF
    margin-left: auto

Alert Title:
  Orbitron 20px 700 #E8F4F8 uppercase letter-spacing 0.06em
  margin: 16px 0

Divider: 1px solid rgba(0,212,255,0.1)

Alert Body:
  Inter 15px #E8F4F8 line-height 1.6
  margin: 16px 0
```

**"WHAT TRIGGERED THIS" Section:**
```
Section Label:
  Orbitron 12px 600 #7ECFDF uppercase letter-spacing 0.12em
  margin-bottom: 12px

Data Table:
  header row: Orbitron 11px #7ECFDF padding 12px 16px border-bottom rgba(0,212,255,0.15)
  Columns: METRIC | CURRENT VALUE | THRESHOLD | STATUS
  data cells: STM 13px #E8F4F8 padding 12px 16px
  Status cell coloring:
    EXCEEDED: #FF7D52
    BELOW TARGET: #FFB800
    ON TARGET: #00FF88
  Row hover: bg rgba(0,212,255,0.04)
  first-td border-left 2px solid #00D4FF
```

**"AGENT ACTIONS TAKEN" Section:**
```
Section Label: Orbitron 12px 600 #7ECFDF uppercase margin-bottom 12px

Action Log:
  bg rgba(0,212,255,0.04)
  border: 1px solid rgba(0,212,255,0.1)
  border-radius: 4px
  padding: 16px

  Each row:
    timestamp: STM 11px #7ECFDF width 48px
    description: Inter 13px #E8F4F8
    source badge: "AUTO" | "MANUAL" — Orbitron 9px letter-spacing 0.1em
      AUTO: color #7ECFDF bg rgba(0,212,255,0.08) border rgba(0,212,255,0.2)
      MANUAL: color #FFB800 bg rgba(255,184,0,0.08)
    padding: 8px 0 border-bottom rgba(0,212,255,0.06)
    last row: no border
```

**Action Buttons:**
```
"MARK AS RESOLVED" — Primary button
  bg #00D4FF text #050D1A Orbitron 600 13px uppercase
  padding 12px 24px radius 4px
  hover: bg #1ADCFF box-shadow 0 0 20px rgba(0,212,255,0.3)

"DISMISS WITH NOTE →" — Ghost button
  Orbitron 11px #00D4FF uppercase
  ::after content: '→'
  margin-left: 24px
  triggers: alert-dismiss-modal
```

#### 4.2.3 Animations

```
Page entry: panel slides up 8px + fades in 400ms spring
"WHAT TRIGGERED THIS" table rows stagger in: 80ms each after panel enter
Status badges flash once on entry (highlight → normal, 300ms)
```

#### 4.2.4 Interactive States

| Element | Default | Hover | Loading/Processing |
|---|---|---|---|
| MARK AS RESOLVED | bg #00D4FF | bg #1ADCFF + glow | bg #0A4F6E text #2A4A5A + spinner |
| DISMISS WITH NOTE | transparent #00D4FF | color #1ADCFF | n/a |
| Back navigation | #7ECFDF | #00D4FF | n/a |

**Post-Resolve state:**
- "MARK AS RESOLVED" transitions to disabled + STM text "RESOLVED" in green
- Alert removed from tray on return to main
- Toast notification: "ALERT MARKED RESOLVED" #00FF88

#### 4.2.5 Data Requirements

```
Alert fields (full detail):
  - id, severity, department
  - title, fullDescription
  - timestamp (ISO)
  - sourceSystem: string (e.g., "META-CAMPAIGN-204")
  - triggerData: Array<{ metric, currentValue, threshold, unit, status }>
  - agentActions: Array<{ time, description, source: 'AUTO'|'MANUAL' }>
  - status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED'
  - resolvedAt?: ISO
  - resolvedBy?: string
```

---

### SCREEN 3: `ceo-command-center-alert-dismiss-modal`

**Name:** Dismiss Alert
**Priority:** P1
**Visual Complexity:** Simple
**Interaction Complexity:** Simple

#### 4.3.1 Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  [Background: alert-detail page, dimmed with rgba(5,13,26,0.85) overlay]          │
│                                                                                    │
│              ┌──────────────────────────────────────────────┐                     │
│              │  DISMISS ALERT                         [✕]   │                     │
│              │  ─────────────────────────────────────────   │                     │
│              │                                              │                     │
│              │  [WARNING]  AD OPERATIONS                    │                     │
│              │  Summit Roofing — CPL Exceeded Threshold     │                     │
│              │                                              │                     │
│              │  DISMISSAL NOTE  *required                   │                     │
│              │  ┌──────────────────────────────────────┐   │                     │
│              │  │                                      │   │                     │
│              │  │  Why are you dismissing this alert?  │   │                     │
│              │  │  (e.g., already handled, client aware│   │                     │
│              │  │  etc.)                               │   │                     │
│              │  │                                      │   │                     │
│              │  └──────────────────────────────────────┘   │                     │
│              │  Min 10 characters                           │                     │
│              │                                              │                     │
│              │  ┌────────────────────┐  CANCEL             │                     │
│              │  │  CONFIRM DISMISS   │                     │                     │
│              │  └────────────────────┘                     │                     │
│              └──────────────────────────────────────────────┘                     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.3.2 Component Specifications

**Modal Overlay:**
```
position: fixed
inset: 0
background: rgba(5, 13, 26, 0.85)
backdrop-filter: blur(4px)
z-index: 50
display: flex align-items: center justify-content: center
```

**Modal Panel:**
```
background: #0A1628
border: 1px solid rgba(0, 212, 255, 0.3)
border-radius: 4px
padding: 24px
max-width: 400px
width: 100%
box-shadow: 0 0 40px rgba(0,212,255,0.15)

entry animation: scale(0.96)→scale(1) + fade 250ms spring
```

**Modal Header:**
```
display: flex justify-content: space-between align-items: center
margin-bottom: 16px

Title:
  "DISMISS ALERT"
  Orbitron 16px 600 #E8F4F8 uppercase letter-spacing 0.08em

Close [✕]:
  Lucide X icon 16px #7ECFDF
  hover: color #FF6B35
  cursor: pointer
```

**Alert Summary:**
```
Severity badge + department + 1-line title
Same badge styling as alert detail
background: rgba(0,212,255,0.04)
border: 1px solid rgba(0,212,255,0.1)
border-radius: 4px padding: 12px
margin-bottom: 20px
Inter 14px #E8F4F8
```

**Dismissal Note Textarea:**
```
Label:
  "DISMISSAL NOTE" — Orbitron 11px #7ECFDF uppercase letter-spacing 0.12em
  + " *required" — Inter 11px #FF7D52
  margin-bottom: 8px

Textarea:
  background: rgba(0,212,255,0.04)
  border: 1px solid rgba(0,212,255,0.2)
  border-radius: 4px
  padding: 12px
  width: 100%
  min-height: 100px
  color: #E8F4F8
  font: Inter 14px
  placeholder color: #2A4A5A

  focus:
    border-color: rgba(0,212,255,0.5)
    box-shadow: 0 0 0 2px rgba(0,212,255,0.1)
    outline: none

  error (empty on submit):
    border-color: #FF3333
    shake animation: 3 cycles 200ms

Helper text:
  STM 11px #7ECFDF — "MIN 10 CHARACTERS"
  error: color #FF3333 — "NOTE REQUIRED TO DISMISS"
```

**Action Buttons:**
```
"CONFIRM DISMISS" — Primary button
  bg #00D4FF text #050D1A
  DISABLED state until textarea has ≥10 chars:
    bg #0A4F6E text #2A4A5A cursor not-allowed

"CANCEL" — Secondary button
  transparent border rgba(0,212,255,0.4) text #00D4FF
  hover: border #00D4FF bg rgba(0,212,255,0.08)
  closes modal, returns to alert-detail
```

#### 4.3.3 Animations

```
Modal entry: scale(0.96)→(1) + opacity 0→1, 250ms spring cubic-bezier(0.34, 1.56, 0.64, 1)
Modal exit: scale(1)→(0.96) + opacity 1→0, 200ms ease-in
Overlay: opacity 0→1, 200ms

Error shake (empty submit):
  @keyframes shake: 0%/100% translateX(0), 25% translateX(-4px), 75% translateX(4px)
  duration: 300ms 3 iterations

CONFIRM DISMISS button:
  On submit: brief pulse glow, then 300ms loading state, then modal closes
```

#### 4.3.4 Interactive States

| Element | Default | Filled (>=10 chars) | Error | Loading |
|---|---|---|---|---|
| CONFIRM DISMISS | disabled (muted) | active #00D4FF | n/a | spinner + "DISMISSING..." |
| Textarea | border dim | border #00D4FF focus | border #FF3333 | readonly |
| CANCEL | secondary style | secondary style | secondary style | disabled |

#### 4.3.5 Data Requirements

```
Dismiss action payload:
  - alertId: string
  - dismissalNote: string (min 10 chars, required)
  - dismissedBy: string (current user ID)
  - dismissedAt: ISO timestamp

On success:
  - alert.status → 'DISMISSED'
  - alert.dismissedNote saved
  - Reload alert tray (alert removed)
  - Toast: "ALERT DISMISSED" color #7ECFDF
```

---

### SCREEN 4: `ceo-clients-list`

**Name:** All Clients
**Priority:** P1
**Visual Complexity:** Complex
**Interaction Complexity:** Simple

#### 4.4.1 Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  [◈ MIRD]  CEO COMMAND CENTER                [●] ALL SYSTEMS NOMINAL  [SJ]  Logout ›│
├──────────────────────────────────────────────────────────────────────────────────┤
│  MRR $142,000  │  LEADS 1,892  │  AVG CPL $44.20  │  ACTIVE CLIENTS 12          │
├──────────────────────────────────────────────────────────────────────────────────┤
│  ← BACK TO COMMAND CENTER                                                         │
│                                                                                    │
│  ALL CLIENTS  [12]                                                                │
│                                                                                    │
│  SORT BY: [NAME ▼]  [HEALTH SCORE]  [CPL]  [MRR]  [LAST ALERT]                  │
│                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────┐│
│  │  CLIENT              HEALTH     STATUS     MRR        CPL    LEADS  APPTS  DAYS│
│  │  ──────────────────  ─────────  ─────────  ─────────  ─────  ─────  ─────  ───│
│  │  [!] Summit Roofing  ░░░░░░░░░  AT RISK    $11,500    $89    142    11     187 │
│  │       Home Services  ←3px red                                                  │
│  │  ─────────────────────────────────────────────────────────────────────────── │
│  │  Evergreen HVAC      █████████  HEALTHY    $12,200    $41    208    24     203 │
│  │       Home Services  ←3px green                                                │
│  │  ─────────────────────────────────────────────────────────────────────────── │
│  │  Peak Dental         ████████░  MONITOR    $9,800     $52    87     9      94  │
│  │       Healthcare     ←3px amber                                                │
│  │  ─────────────────────────────────────────────────────────────────────────── │
│  │  BlueLine Plumbing   █████████  HEALTHY    $10,500    $38    195    21     312 │
│  │  [... 8 more rows ...]                                                         │
│  └──────────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.4.2 Component Specifications

**Page Header:**
```
display: flex align-items: center gap: 12px margin-bottom: 24px

"ALL CLIENTS" — Orbitron 24px 700 #E8F4F8 uppercase letter-spacing 0.08em
Count Badge: "[12]" — STM 14px #7ECFDF bg rgba(0,212,255,0.08) border rgba(0,212,255,0.2) border-radius 2px padding 4px 10px
```

**Sort Controls:**
```
"SORT BY:" — Orbitron 11px #7ECFDF uppercase letter-spacing 0.12em margin-right 8px

Sort options (button group):
  Each: Orbitron 11px uppercase
  Active: bg rgba(0,212,255,0.1) border rgba(0,212,255,0.4) color #00D4FF
  Inactive: transparent border rgba(0,212,255,0.15) color #7ECFDF
  hover: border rgba(0,212,255,0.3) color #E8F4F8
  Options: NAME | HEALTH SCORE | CPL | MRR | LAST ALERT

Arrow indicator (current sort direction):
  STM 10px appended — "▲" ASC or "▼" DESC
  click same: toggle direction
  click different: switch + reset to DESC

margin-bottom: 20px
```

**Clients Table:**
```
Panel card styles apply to outer container

Table:
  width: 100%
  border-collapse: collapse

Header Row:
  bg rgba(0,212,255,0.04)
  th: Orbitron 11px #7ECFDF uppercase letter-spacing 0.12em
      padding 12px 16px
      border-bottom 2px solid rgba(0,212,255,0.15)
  Columns: CLIENT | HEALTH | STATUS | MRR | CPL | LEADS MTD | APPTS MTD | DAYS ACTIVE

Data Rows:
  cursor: pointer
  transition: background 150ms

  Default: bg transparent
  hover: bg rgba(0,212,255,0.04)
  first td: border-left 3px solid [health color]

  CLIENT cell:
    display: flex flex-direction: column
    Name: Orbitron 13px #E8F4F8 uppercase
    Business type: Inter 12px #7ECFDF margin-top 2px
    padding 12px 16px

  HEALTH cell:
    Mini health bar: 80px wide 4px height
    bg rgba(0,212,255,0.08) track
    fill: health color, width = healthScore%
    Score: STM 12px #E8F4F8 margin-left 8px
    display: flex align-items: center

  STATUS badge cell:
    Same badge styling as client health card
    "HEALTHY" | "MONITOR" | "AT RISK"

  Numeric cells (MRR, CPL, LEADS, APPTS, DAYS):
    STM 13px #E8F4F8

  CPL cell:
    Color logic:
      < threshold: #00FF88
      within 20% of threshold: #FFB800
      > threshold: #FF7D52

  Row click: navigate to ceo-clients-detail-overview for that client

  Border between rows: 1px solid rgba(0,212,255,0.06)
```

**Alert Row (AT RISK client):**
```
Row has: border-left 3px solid #FF6B35
Small [AlertTriangle] Lucide icon 12px #FF7D52 appears before client name
background: rgba(255,107,53,0.02) on default (very subtle)
hover: rgba(255,107,53,0.04)
```

#### 4.4.3 Animations

```
Table entry:
  Panel card: slide-up 8px + fade 400ms
  Rows stagger in: 30ms per row, starting after panel (420ms)
  Health bars animate width from 0 on entry

Sort interaction:
  On sort change: rows fade out 150ms, re-sort, fade in 200ms
  Active sort button: brief pulse #00D4FF→transparent on select
```

#### 4.4.4 Interactive States

| Element | Default | Hover | Active Sort | No Clients |
|---|---|---|---|---|
| Sort button | muted border | brighter border | active bg+border | n/a |
| Table row | transparent | dim cyan bg | n/a | empty state shown |
| CPL value | health color | highlight | n/a | — |

**Empty state (no clients):**
```
centered in table area
"NO ACTIVE CLIENTS"
Orbitron 14px #7ECFDF uppercase
Inter 13px #2A4A5A "No clients are currently active in the system."
```

#### 4.4.5 Data Requirements

```
Clients list:
  Source: clients collection, filter: status='active'
  Each client:
    - id, name, businessType
    - healthScore: number 0-100
    - healthStatus: 'HEALTHY' | 'MONITOR' | 'AT_RISK'
    - mrr: number
    - cpl: number (avg last 30 days)
    - cplThreshold: number
    - leadsMTD: number
    - appointmentsMTD: number
    - daysActive: number (since contract start)
    - lastAlertAt: ISO | null
  Sort: default by healthStatus ASC (AT_RISK first), then healthScore ASC
  Pagination: 50 per page (or infinite scroll with virtual list)
```

---

## 5. Stack Integration

### Data Sources
```
Agency KPIs (North Star):
  Endpoint: GET /api/v1/agency/metrics/summary
  Polling: 60s interval
  Fallback: last cached values with [STALE] indicator

Alerts:
  Endpoint: GET /api/v1/alerts?status=active&severity=CRITICAL,WARNING,INFO
  Sorted: severity desc, createdAt desc
  PATCH /api/v1/alerts/:id/resolve — mark resolved
  PATCH /api/v1/alerts/:id/dismiss — body: { note: string }
  Real-time: WebSocket channel "alerts:ceo"

Department Status:
  GET /api/v1/departments/growth/status
  GET /api/v1/departments/adops/status
  GET /api/v1/departments/product/status
  GET /api/v1/departments/finance/status
  Polling: 120s

Clients:
  GET /api/v1/clients?status=active
  Query params: sortBy, sortDir, page, limit
```

### Component Architecture
```
CeoLayout (shared wrapper)
  └── CeoHeader
  └── NorthStarBar
  └── [page content]

ceo-command-center-main:
  └── AlertTray
      └── AlertItem (x N)
  └── DepartmentGrid
      └── DeptCard (x 4)
  └── ClientHealthGrid
      └── ClientHealthCard (x N)

ceo-command-center-alert-detail:
  └── AlertDetailPanel
      └── TriggerDataTable
      └── AgentActionLog

ceo-command-center-alert-dismiss-modal:
  └── Modal (portal)
      └── DismissForm

ceo-clients-list:
  └── SortControls
  └── ClientsTable
      └── ClientRow (x N)
```

### Navigation & Routing
```
/ceo                          → ceo-command-center-main
/ceo/alerts/:alertId          → ceo-command-center-alert-detail
/ceo/clients                  → ceo-clients-list
/ceo/clients/:clientId        → ceo-clients-detail-overview (FLOW-12)
/ceo/departments/growth       → ceo-dept-growth-main (FLOW-13)
/ceo/departments/adops        → ceo-dept-adops-main (FLOW-13)
/ceo/departments/product      → ceo-dept-product-main (FLOW-13)
/ceo/departments/finance      → ceo-dept-finance-main (FLOW-13)

Modal: alert dismiss renders as URL-preserving overlay
  Query param: ?dismiss=alertId triggers modal
```

### State Management
```
Global CEO store:
  - northStarMetrics: { mrr, leads, avgCpl, activeClients } + deltas
  - alerts: Alert[]
  - departmentStatuses: Record<DeptId, DeptStatus>
  - clientHealthSummaries: ClientSummary[]

Alert actions:
  - resolveAlert(id)
  - dismissAlert(id, note)
  - markAlertInvestigating(id) — local UI state only

Polling manager:
  - northStar: 60s
  - alerts: 30s (more aggressive, surfacing critical info)
  - departments: 120s
  - clients: 180s
```

### Permissions
```
Route guard: requireRole('CEO')
If authenticated but not CEO → redirect to /dashboard (RainMachine)
If unauthenticated → redirect to /login
Session timeout: 8h idle warning at 7h45m, force logout at 8h
```

# Flow PRD: RainMachine Main Dashboard
**Flow ID:** F-03 | **App:** RainMachine Dashboard | **Platform:** Web — desktop-first | **Date:** 2026-03-30 | **Status:** Ready for Implementation | **Screens:** 4

---

## 1. Flow Metadata

| Property | Value |
|---|---|
| **Entry Points** | Auth success redirect, back-nav from any sub-page, sidebar DASHBOARD item click |
| **Exit Points** | Any sidebar nav item (Leads, Agents, Campaigns, Reports, Settings) |
| **Primary User** | Marcus (client operator / business owner) |
| **Dependencies** | RainMachine API (leads, agents, campaigns), Claude AI API (query panel), WebSocket for live data ticks |
| **URL Prefix** | `/dashboard` |
| **Auth Required** | Yes — JWT session |

---

## 1A. UI Profile Compliance

- All panel cards: `bg #0A1628`, `border 1px solid rgba(0,212,255,0.2)`, `border-radius 4px`. No radius above 8px on any element.
- All headings and labels: Orbitron font, UPPERCASE, letter-spaced. No exceptions.
- All metric values: Share Tech Mono. No Inter for numeric data.
- No emoji icons anywhere. Use Lucide React icons only.
- No pulsating decorative circles. Status dots use `STATUS DOT` spec only.
- No soft gradient backgrounds. `bg-base: #050D1A` behind everything.
- The CLAUDE AI PANEL is a product feature panel, not a decorative element — it must feel like a live terminal input, not a chat widget.
- Scan-line animation plays once on data load. It does not loop.
- Boot counter animation (metrics counting from 0) runs once on page enter. Does not replay unless page refreshes.

---

## 2. CMO Context

The dashboard is Marcus's morning ritual. He opens RainMachine and within 2 seconds needs to feel: "I know exactly what happened overnight, what's working, and what needs my attention today." Every panel answers one question:

| Panel | Question It Answers |
|---|---|
| TODAY'S INTELLIGENCE | "What did my system produce today?" |
| LEAD PIPELINE | "Where are leads stuck right now?" |
| AGENT STATUS | "Is my team performing and online?" |
| CAMPAIGN PERFORMANCE | "Am I spending money the right way?" |
| CLAUDE AI PANEL | "What do I need to know that I'm not seeing?" |

**Friction eliminated:**
| Old Friction | RainMachine Solution |
|---|---|
| Checking Meta Ads Manager + CRM + phone logs separately | All on one screen, live |
| Not knowing if AI dialer is running | AGENT STATUS shows processing dots |
| Gut-feel close rate decisions | Real-time metric with delta vs prior period |
| Waiting for weekly reports | Claude AI panel surfaces anomalies on demand |

---

## 3. User Journey

```
[Auth Success]
      │
      ▼
┌─────────────────────┐
│ rm-dashboard-home-  │  Data fetch in flight
│ loading             │  Shimmer panels, scan-line
│ (~1.5s)             │  "SYNCHRONIZING DATA FEEDS..."
└─────────────────────┘
      │
      ├─── fetch success ──────────────────────────────────────────────────────────────┐
      │                                                                                 │
      ├─── fetch failure (partial) ──────────────────┐                                 │
      │                                               ▼                                 ▼
      │                                 ┌─────────────────────┐           ┌─────────────────────┐
      │                                 │ rm-dashboard-home-  │           │ rm-dashboard-home-  │
      │                                 │ error               │           │ main                │
      │                                 │ (partial/full fail) │           │ (fully loaded)      │
      │                                 └─────────────────────┘           └─────────────────────┘
      │                                        │ retry success →                  │
      │                                        └──────────────────────────────────┘
      │
      └─── no data (new client) ─────────────────────────────────────────────────────────────────┐
                                                                                                   ▼
                                                                                    ┌─────────────────────┐
                                                                                    │ rm-dashboard-home-  │
                                                                                    │ empty               │
                                                                                    │ (pre-launch)        │
                                                                                    └─────────────────────┘

From rm-dashboard-home-main:
  Sidebar LEADS → /leads (F-04)
  Sidebar AGENTS → /agents (F-05)
  Sidebar CAMPAIGNS → /campaigns (F-06)
  Sidebar REPORTS → /reports (F-07)
  Sidebar SETTINGS → /settings (F-08)
```

---

## 4. Screen Specifications

---

### 4.1 Screen: `rm-dashboard-home-main`
**Title:** Dashboard Home — Fully Loaded
**Priority:** P0 | **Complexity:** High | **Emotional Target:** "I am in command"

#### 4.1.1 ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [◈ RAINMACHINE]   RainMachine AI                      [● ONLINE]  MON MAR 30 2026  09:41:22  [MJ ▾] │  ← Header 52px
├────────────┬─────────────────────────────────────────────────────────────────────────────────────────┤
│            │  RAINMACHINE / DASHBOARD                                                                 │  ← Breadcrumb bar 40px
│ ◈ DASH     ├─────────────────────────────────────────────────────────────────────────────────────────┤
│ [active]   │                                                                                          │
│            │  ┌──────────────────────────────────────────┐  ┌──────────────────────────────────────┐ │
│ ◈ LEADS    │  │ TODAY'S INTELLIGENCE                     │  │ LEAD PIPELINE                        │ │
│            │  │ ─────────────────────────────────────    │  │ ──────────────────────────────────── │ │
│ ◈ AGENTS   │  │  ┌──────────┐  ┌──────────┐             │  │                                      │ │
│            │  │  │LEADS     │  │CPL       │             │  │  [NEW]        ████████████  47        │ │
│ ◈ CAMPAIGNS│  │  │TODAY     │  │          │             │  │  [CONTACTED]  ████████      31        │ │
│            │  │  │  23      │  │  $47.82  │             │  │  [APPT SET]   █████          18        │ │
│ ◈ REPORTS  │  │  │ +4 ▲     │  │ -$3.11 ▼ │             │  │  [CLOSED]     ███            9         │ │
│            │  │  └──────────┘  └──────────┘             │  │  [LOST]       ██             5         │ │
│ ─────────  │  │  ┌──────────┐  ┌──────────┐             │  │                                      │ │
│ ◈ SETTINGS │  │  │APPTS SET │  │CLOSE RATE│             │  │  PIPELINE TOTAL: 110 LEADS           │ │
│            │  │  │          │  │          │             │  │  CONVERSION RATE: 8.2%               │ │
│            │  │  │  8       │  │  38.5%   │             │  └──────────────────────────────────────┘ │
│            │  │  │ +2 ▲     │  │ +1.2% ▲  │             │                                           │
│            │  │  └──────────┘  └──────────┘             │  ┌──────────────────────────────────────┐ │
│            │  └──────────────────────────────────────────┘  │ CAMPAIGN PERFORMANCE                 │ │
│            │                                                 │ ──────────────────────────────────── │ │
│            │  ┌──────────────────────────────────────────┐  │ META ADS            GOOGLE ADS       │ │
│            │  │ AGENT STATUS                             │  │                                      │ │
│            │  │ ─────────────────────────────────────    │  │ Spend  ▁▂▄▅▆▇█▆     ▁▁▂▃▅▆▇█        │ │
│            │  │ ┌─────────────────┐ ┌─────────────────┐  │  │ CPL    ─────────    ─────────        │ │
│            │  │ │[●] SARAH K.     │ │[●] JAMES T.     │  │  │                                      │ │
│            │  │ │ Senior Agent    │ │ Junior Agent    │  │  │ Spend: $1,240   Spend: $680          │ │
│            │  │ │ 12 leads today  │ │ 8 leads today   │  │  │ CPL: $43.20     CPL: $56.40          │ │
│            │  │ │ ████████░░ 80%  │ │ ██████░░░░ 60%  │  │  │ Leads: 29       Leads: 12            │ │
│            │  │ └─────────────────┘ └─────────────────┘  │  │                                      │ │
│            │  │ ┌─────────────────┐ ┌─────────────────┐  │  │ ORGANIC         TOTAL SPEND          │ │
│            │  │ │[●] MIKE R.      │ │[◌] DIANA P.     │  │  │ ▁▂▂▃▄▄▅▆        $1,920/day          │ │
│            │  │ │ Agent           │ │ STANDBY         │  │  │ Leads: 6         ▲ +12% vs yesterday │ │
│            │  │ │ 3 leads today   │ │ 0 leads today   │  │  └──────────────────────────────────────┘ │
│            │  │ │ ███░░░░░░░ 30%  │ │ ──────────      │  │                                           │
│            │  │ └─────────────────┘ └─────────────────┘  │                                           │
│            │  └──────────────────────────────────────────┘                                           │
│            │                                                                                          │
│            │  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│            │  │ CLAUDE AI — INTELLIGENCE PANEL                                                     │ │
│            │  │ ───────────────────────────────────────────────────────────────────────────────── │ │
│            │  │  ┌─────────────────────────────────┐  ┌──────────────────────────────────────┐   │ │
│            │  │  │ QUICK REPORT: CPL TREND          │  │ QUICK REPORT: TOP PERFORMER          │   │ │
│            │  │  │ Meta CPL down 6.4% this week.   │  │ Sarah K. closed 3 leads today.       │   │ │
│            │  │  │ Google holding flat. Organic up  │  │ 80% of daily target hit by 9:41am.   │   │ │
│            │  │  │ 18% — review ad creative soon.  │  └──────────────────────────────────────┘   │ │
│            │  │  └─────────────────────────────────┘                                              │ │
│            │  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │ │
│            │  │  │  Ask about your CPL this week...                              [TRANSMIT →]  │  │ │
│            │  │  └─────────────────────────────────────────────────────────────────────────────┘  │ │
│            │  └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────┴─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.1.2 Layout Structure

```
Shell:
  <body> bg: #050D1A, min-height: 100vh
  <header> height: 52px, bg: rgba(10,22,40,0.95), border-bottom: 1px solid rgba(0,212,255,0.15), backdrop-filter: blur(8px), position: sticky, top: 0, z-index: 30
  <sidebar> width: 240px, bg: rgba(10,22,40,0.95), border-right: 1px solid rgba(0,212,255,0.15), position: fixed, height: 100vh - 52px, overflow-y: auto
  <main> margin-left: 240px, padding-top: 52px, min-height: 100vh, overflow-y: auto

Content Layout:
  Breadcrumb bar: height 40px, border-bottom: 1px solid rgba(0,212,255,0.08), padding: 0 24px
  Content area: padding: 24px, display: grid, gap: 16px
  Row 1: grid-template-columns: 1fr 1fr, gap: 16px (TODAY'S INTELLIGENCE | LEAD PIPELINE)
  Row 2: grid-template-columns: 1fr 1fr, gap: 16px (AGENT STATUS | CAMPAIGN PERFORMANCE)
  Row 3: full-width (CLAUDE AI PANEL)
```

#### 4.1.3 Header Component

```
Height: 52px | bg: rgba(10,22,40,0.95) | border-bottom: 1px solid rgba(0,212,255,0.15)
padding: 0 24px | display: flex, align-items: center, justify-content: space-between

LEFT:
  Logo mark: svg 28px × 28px, fill: #00D4FF
  Logo text: "RAINMACHINE" | Orbitron 13px 600 0.12em UPPERCASE | color: #E8F4F8
  gap: 10px between logo and text

CENTER (or right-of-logo):
  (empty on dashboard — breadcrumb is in sub-bar below)

RIGHT:
  System status group:
    StatusDot: 8px circle, color: #00FF88, glow: 0 0 6px #00FF88, animation: pulse 2s ease-in-out infinite
    Label: "ONLINE" | Orbitron 10px 400 0.12em UPPERCASE | color: #00FF88
    gap: 6px
  Separator: 1px solid rgba(0,212,255,0.15), height: 20px, margin: 0 16px
  Date/time:
    Date: "MON MAR 30 2026" | STM 12px | color: #7ECFDF
    Time: "09:41:22" | STM 12px | color: #00D4FF — updates every second via setInterval
    gap: 8px
  Separator: 1px solid rgba(0,212,255,0.15), height: 20px, margin: 0 16px
  User avatar:
    Circle 32px, bg: rgba(0,212,255,0.12), border: 1px solid rgba(0,212,255,0.4)
    Initials: "MJ" | Orbitron 11px 600 | color: #00D4FF
    Chevron: Lucide ChevronDown 14px, color: #7ECFDF, margin-left: 6px
    hover: bg rgba(0,212,255,0.18), cursor: pointer
    click: opens user dropdown (out of scope for F-03)
```

#### 4.1.4 Sidebar Navigation Component

```
Width: 240px | bg: rgba(10,22,40,0.95) | border-right: 1px solid rgba(0,212,255,0.15)
padding-top: 24px | position: fixed | top: 52px | height: calc(100vh - 52px)

Logo section:
  Collapsed toggle button: Lucide PanelLeftClose 16px | color: #7ECFDF | position: top-right of sidebar
  padding: 0 16px 24px 20px

Nav items (ordered):
  1. DASHBOARD  — Lucide LayoutDashboard 16px — route: /dashboard — ACTIVE state (this screen)
  2. LEADS      — Lucide Users 16px            — route: /leads
  3. AGENTS     — Lucide Headset 16px          — route: /agents
  4. CAMPAIGNS  — Lucide Megaphone 16px        — route: /campaigns
  5. REPORTS    — Lucide BarChart2 16px        — route: /reports
  Divider: 1px solid rgba(0,212,255,0.08), margin: 8px 16px
  6. SETTINGS   — Lucide Settings 16px         — route: /settings

Nav item anatomy:
  display: flex, align-items: center, gap: 12px
  padding: 12px 20px | radius: 4px | margin-bottom: 2px
  label: Orbitron 11px 400 0.1em UPPERCASE

  DEFAULT state:
    bg: transparent | color: #7ECFDF | icon: #7ECFDF
    hover: bg rgba(0,212,255,0.05), color: #E8F4F8, icon: #E8F4F8

  ACTIVE state:
    bg: rgba(0,212,255,0.08)
    border-left: 2px solid #00D4FF
    color: #00D4FF | icon: #00D4FF
    padding-left: 18px (offset for 2px left border)
```

#### 4.1.5 Panel: TODAY'S INTELLIGENCE

```
Panel card spec: bg #0A1628, border 1px solid rgba(0,212,255,0.2), radius 4px, padding 24px
shadow: 0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1), inset 0 0 40px rgba(0,212,255,0.02)

Header:
  "TODAY'S INTELLIGENCE" | Orbitron 11px 400 0.12em UPPERCASE | color: #7ECFDF
  border-bottom: 1px solid rgba(0,212,255,0.1) | padding-bottom: 16px | margin-bottom: 16px
  Right side: live indicator — StatusDot 6px #00FF88 pulse + "LIVE" Orbitron 10px #00FF88

Content: 2×2 grid of metric readouts, gap: 12px

Metric Readout — LEADS TODAY:
  label: "LEADS TODAY" | Orbitron 11px 0.12em UPPERCASE | color: #7ECFDF
  value: "23" | STM 32px | color: #E8F4F8 | boot-animation: 0→23, 1200ms cubic-bezier(0.25,0.46,0.45,0.94)
  delta: "+4" | STM 13px | color: #00FF88 | Lucide TrendingUp 12px inline before text
  sub-label: "vs yesterday" | Inter 12px | color: #2A4A5A

Metric Readout — CPL:
  label: "COST PER LEAD" | Orbitron 11px | color: #7ECFDF
  value: "$47.82" | STM 32px | color: #E8F4F8 | boot-animation
  delta: "-$3.11" | STM 13px | color: #00FF88 (CPL decrease = positive) | Lucide TrendingDown 12px
  sub-label: "vs yesterday" | Inter 12px | color: #2A4A5A

Metric Readout — APPOINTMENTS SET:
  label: "APPTS SET" | Orbitron 11px | color: #7ECFDF
  value: "8" | STM 32px | color: #E8F4F8 | boot-animation
  delta: "+2" | STM 13px | color: #00FF88 | Lucide TrendingUp 12px
  sub-label: "vs yesterday" | Inter 12px | color: #2A4A5A

Metric Readout — CLOSE RATE:
  label: "CLOSE RATE" | Orbitron 11px | color: #7ECFDF
  value: "38.5%" | STM 32px | color: #E8F4F8 | boot-animation
  delta: "+1.2%" | STM 13px | color: #00FF88 | Lucide TrendingUp 12px
  sub-label: "30-day rolling" | Inter 12px | color: #2A4A5A

Each metric sub-card:
  bg: rgba(0,212,255,0.04) | border: 1px solid rgba(0,212,255,0.08) | radius: 4px | padding: 16px
  hover: border-color rgba(0,212,255,0.2), bg rgba(0,212,255,0.06)
  Animation: panel-enter — slide-up 8px, fade-in, 400ms spring, stagger 80ms per card
```

#### 4.1.6 Panel: LEAD PIPELINE

```
Panel card spec: same as above

Header:
  "LEAD PIPELINE" | Orbitron 11px 0.12em UPPERCASE | color: #7ECFDF
  Right: "VIEW ALL →" | Ghost button | Orbitron 11px #00D4FF | click → /leads

Content: Horizontal funnel bar chart with stage rows

Each stage row anatomy:
  display: flex, align-items: center, gap: 12px, padding: 8px 0
  border-bottom: 1px solid rgba(0,212,255,0.04)

  Stage badge (left, 90px fixed width):
    Uses LEAD STAGE BADGES spec exactly
    NEW:        bg rgba(0,212,255,0.12)  border rgba(0,212,255,0.4)  text #00D4FF
    CONTACTED:  bg rgba(255,184,0,0.12) border rgba(255,184,0,0.4)  text #FFB800
    APPT SET:   bg rgba(0,255,136,0.12) border rgba(0,255,136,0.4)  text #00FF88
    CLOSED:     bg rgba(0,255,136,0.2)  border rgba(0,255,136,0.6)  text #00FF88
    LOST:       bg rgba(255,107,53,0.08) border rgba(255,107,53,0.2) text #FF7D52
    Orbitron 10px UPPERCASE 0.1em | padding: 3px 10px | radius: 2px

  Funnel bar (flex-1):
    Track: bg rgba(0,212,255,0.06), height: 8px, radius: 2px
    Fill: animated width 0→percentage, 1000ms cubic-bezier(0.25,0.46,0.45,0.94)
    Fill colors: NEW=#00D4FF, CONTACTED=#FFB800, APPT SET=#00FF88, CLOSED=#00FF88 (brighter), LOST=#FF7D52
    Filter: drop-shadow(0 0 3px [fill-color])

  Count (right, 40px, text-align: right):
    STM 16px | color: #E8F4F8

Funnel data (proportional bars — NEW is 100% width reference):
  NEW:       47 leads — bar 100%
  CONTACTED: 31 leads — bar 66%
  APPT SET:  18 leads — bar 38%
  CLOSED:     9 leads — bar 19%
  LOST:       5 leads — bar 11%

Footer section:
  border-top: 1px solid rgba(0,212,255,0.1) | padding-top: 12px | margin-top: 12px
  "PIPELINE TOTAL: 110 LEADS" | STM 13px | color: #7ECFDF | left
  "CONVERSION RATE: 8.2%" | STM 13px | color: #00FF88 | right
```

#### 4.1.7 Panel: AGENT STATUS

```
Panel card spec: same as above

Header:
  "AGENT STATUS" | Orbitron 11px 0.12em UPPERCASE | color: #7ECFDF
  Right: "MANAGE AGENTS →" | Ghost button → /agents

Content: 2-column grid of agent cards, gap: 12px

Agent Card anatomy (4 agents shown):
  bg: rgba(0,212,255,0.04) | border: 1px solid rgba(0,212,255,0.08) | radius: 4px | padding: 16px
  hover: border-color rgba(0,212,255,0.2)

  Top row:
    StatusDot 8px (left) — states:
      ONLINE (active agent): #00FF88, glow 0 0 6px #00FF88, pulse 2s
      PROCESSING (AI calling): #00D4FF, glow 1.2s pulse
      STANDBY (no active leads): #2A4A5A, no animation
    Agent name: Orbitron 12px 600 | color: #E8F4F8 | margin-left: 8px
    Lucide MoreHorizontal 14px right side | color: #2A4A5A | hover: #7ECFDF

  Sub-label row:
    Role label: "Senior Agent" / "Agent" / "Junior Agent" | Inter 12px | color: #7ECFDF

  Metric row:
    Leads today count: STM 16px #E8F4F8
    "LEADS TODAY" label: Orbitron 10px #2A4A5A, margin-left: 4px

  Performance bar:
    Track: bg rgba(0,212,255,0.08), height: 4px, radius: 2px, margin-top: 8px
    Fill: animated width, color depends on percentage:
      ≥70%: #00FF88 with glow
      40-69%: #FFB800
      <40%: #FF6B35
    Animation: width 0→target, 1000ms cubic-bezier(0.25,0.46,0.45,0.94), delay: 400ms after panel enter
    Percentage label: STM 11px, color matches bar, margin-top: 4px, text-align: right

Agent data (sample):
  SARAH K.   | ONLINE     | Senior Agent | 12 leads | 80%  | #00FF88
  JAMES T.   | PROCESSING | Agent        |  8 leads | 60%  | #FFB800
  MIKE R.    | ONLINE     | Agent        |  3 leads | 30%  | #FF6B35
  DIANA P.   | STANDBY    | Agent        |  0 leads |  0%  | #2A4A5A
```

#### 4.1.8 Panel: CAMPAIGN PERFORMANCE

```
Panel card spec: same as above

Header:
  "CAMPAIGN PERFORMANCE" | Orbitron 11px 0.12em UPPERCASE | color: #7ECFDF
  Right: "VIEW CAMPAIGNS →" | Ghost button → /campaigns

Content: 2-column layout (META ADS | GOOGLE ADS) + organic row + total spend footer

Sub-label row:
  "META ADS" | Orbitron 11px UPPERCASE | color: #00D4FF | left column header
  "GOOGLE ADS" | Orbitron 11px UPPERCASE | color: #FFB800 | right column header

Each channel section:
  Sparkline chart (Recharts ResponsiveContainer height 60px):
    Line chart for Spend over 7 days
    Line: META=#00D4FF, GOOGLE=#FFB800, ORGANIC=#00FF88
    Area fill: linear-gradient(rgba([channel-color],0.15) → transparent)
    Grid: horizontal only, rgba(0,212,255,0.06)
    Axis labels: STM 11px #7ECFDF
    No tooltip on hover (sparkline, minimal UI)

  Metric row below chart:
    "SPEND" label: Orbitron 10px #7ECFDF
    Value: STM 14px #E8F4F8 — e.g., "$1,240"
    "CPL" label: Orbitron 10px #7ECFDF
    Value: STM 14px — CPL color: good(<$50)=#00FF88, warn($50-$80)=#FFB800, bad(>$80)=#FF6B35
    "LEADS" label: Orbitron 10px #7ECFDF
    Value: STM 14px #E8F4F8

Divider: 1px solid rgba(0,212,255,0.08), margin: 12px 0

Organic row:
  "ORGANIC" | Orbitron 11px UPPERCASE | color: #00FF88
  Sparkline (smaller, height 40px) | Line: #00FF88
  "LEADS: 6" | STM 13px | color: #E8F4F8

Footer:
  border-top: 1px solid rgba(0,212,255,0.1), padding-top: 12px
  "TOTAL SPEND" | Orbitron 10px UPPERCASE | color: #7ECFDF
  "$1,920 / DAY" | STM 20px | color: #E8F4F8
  Delta: "+12% vs yesterday" | STM 13px | color: #00FF88 | Lucide TrendingUp 12px
```

#### 4.1.9 Panel: CLAUDE AI INTELLIGENCE PANEL

```
Panel card spec: same as above, but full-width (grid column: 1 / -1)

Header:
  Lucide Bot 16px | color: #00D4FF
  "CLAUDE AI — INTELLIGENCE PANEL" | Orbitron 11px 0.12em UPPERCASE | color: #7ECFDF
  Right: StatusDot 6px #00FF88 + "CONNECTED" | Orbitron 10px #00FF88

Quick Report Cards row:
  display: flex, gap: 16px, flex-wrap: wrap, margin-bottom: 16px

  Quick Report Card anatomy:
    bg: rgba(0,212,255,0.04) | border: 1px solid rgba(0,212,255,0.08) | radius: 4px | padding: 16px
    width: ~280px | flex: 0 0 auto

    Header: "QUICK REPORT: [TOPIC]" | Orbitron 10px 0.12em UPPERCASE | color: #00D4FF
    Body: 2-3 sentence summary | Inter 14px | color: #E8F4F8 | line-height: 1.6
    Footer: timestamp "UPDATED 09:40" | STM 11px | color: #2A4A5A

  Sample cards (render 2–3):
    Card 1 — "QUICK REPORT: CPL TREND"
      "Meta CPL down 6.4% this week. Google holding flat. Organic up 18% — review ad creative soon."
    Card 2 — "QUICK REPORT: TOP PERFORMER"
      "Sarah K. closed 3 leads today, 80% of daily target hit by 9:41am. Pacing to best week of Q1."
    Card 3 — (optional, overflow hidden with fade) "QUICK REPORT: PIPELINE ALERT"
      "11 leads in CONTACTED stage untouched for 48h+. AI dialer queued — 4 call attempts pending."

AI Chat Input row:
  display: flex, align-items: center, gap: 12px

  Input field:
    bg: rgba(0,212,255,0.04) | border: 1px solid rgba(0,212,255,0.2) | radius: 4px | padding: 12px 16px
    flex: 1 | Inter 15px #E8F4F8 | placeholder: "Ask about your CPL this week..." | color: #2A4A5A
    focus: border #00D4FF, shadow 0 0 0 3px rgba(0,212,255,0.15)

  Send button:
    "TRANSMIT" | Primary button | bg #00D4FF | text #050D1A | Orbitron 600 13px UPPERCASE 0.1em
    padding: 12px 24px | radius: 4px
    hover: bg #1ADCFF, shadow 0 0 20px rgba(0,212,255,0.3)
    Lucide Send 14px icon inline, margin-left: 8px

  Processing state (after submit):
    Input disabled | placeholder: "PROCESSING QUERY..." | color: #00D4FF
    Button: spinner (Lucide Loader2 spin animation) replacing icon | text: "TRANSMITTING..."
    AI response renders as new Quick Report Card (slides in from left, panel-enter animation)
```

#### 4.1.10 Animations Summary

| Animation | Target | Timing | Trigger |
|---|---|---|---|
| `panel-enter` | All 5 panels | slide-up 8px + fade-in, 400ms spring, stagger 80ms | Page mount |
| `boot-counter` | All 4 metric values | count 0→value, 1200ms cubic-bezier(0.25,0.46,0.45,0.94) | Panel visible |
| Funnel bar draw | Pipeline bars | width 0→target, 1000ms, stagger 100ms per row | Panel visible |
| Agent perf bar draw | Performance bars | width 0→target, 1000ms, delay 400ms | Panel visible |
| `system-pulse` | Status dot (header) | breathing opacity/glow 2s ease-in-out infinite | Always |
| Live clock | Header time | updates every 1s | Always |
| `data-tick` | Metric values on WS update | single flash 150ms ease-out, glow pulse #00D4FF | WS message received |

#### 4.1.11 Data Requirements

```
Endpoint: GET /api/dashboard/summary
Response shape:
  {
    metrics: {
      leadsToday: number,
      leadsTodayDelta: number,       // vs yesterday absolute
      cpl: number,                   // dollars
      cplDelta: number,              // negative = improved
      apptsSet: number,
      apptsSetDelta: number,
      closeRate: number,             // 0-100
      closeRateDelta: number
    },
    pipeline: {
      new: number,
      contacted: number,
      apptSet: number,
      closed: number,
      lost: number,
      total: number,
      conversionRate: number
    },
    agents: [
      {
        id: string,
        name: string,
        role: string,
        status: "ONLINE" | "PROCESSING" | "STANDBY" | "OFFLINE",
        leadsToday: number,
        dailyTarget: number,
        performancePercent: number
      }
    ],
    campaigns: {
      meta: { spend: number, cpl: number, leads: number, sparkline: number[] },
      google: { spend: number, cpl: number, leads: number, sparkline: number[] },
      organic: { leads: number, sparkline: number[] },
      totalSpend: number,
      totalSpendDelta: number
    },
    aiPanel: {
      quickReports: [
        { topic: string, body: string, updatedAt: string }
      ]
    }
  }

WebSocket: ws://[host]/ws/dashboard
  Events:
    { type: "METRIC_UPDATE", field: string, value: number } — triggers data-tick animation
    { type: "AGENT_STATUS_CHANGE", agentId: string, status: string }
    { type: "NEW_LEAD", count: number }

Claude AI endpoint: POST /api/ai/query
  Body: { question: string, context: "dashboard" }
  Response: { answer: string, topic: string, updatedAt: string }
  Streaming: optional — render tokens as they arrive in the new Quick Report Card
```

---

### 4.2 Screen: `rm-dashboard-home-loading`
**Title:** Dashboard Loading State
**Priority:** P0 | **Complexity:** Simple | **Duration:** ~1.5s

#### 4.2.1 ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [◈ RAINMACHINE]   RainMachine AI          [◉ PROCESSING]  MON MAR 30 2026  09:41:22  [MJ ▾]        │  ← Header
├────────────┬─────────────────────────────────────────────────────────────────────────────────────────┤
│            │  RAINMACHINE / DASHBOARD                                                                 │  ← Breadcrumb
│ ◈ DASH     │  SYNCHRONIZING DATA FEEDS...                                                            │  ← status bar
│ [active]   ├─────────────────────────────────────────────────────────────────────────────────────────┤
│            │                                                                                          │
│ ◈ LEADS    │  ┌──────────────────────────────────────────┐  ┌──────────────────────────────────────┐ │
│            │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ ◈ AGENTS   │  │                                          │  │                                      │ │
│            │  │  ┌──────────┐  ┌──────────┐             │  │  ░░░░░░░░░░░░░░░░░  ░░              │ │
│ ◈ CAMPAIGNS│  │  │░░░░░░░░░░│  │░░░░░░░░░░│             │  │  ░░░░░░░░░░░░░░     ░░              │ │
│            │  │  │          │  │          │             │  │  ░░░░░░░░░░░        ░░              │ │
│ ◈ REPORTS  │  │  │░░░░░░░░░░│  │░░░░░░░░░░│             │  │  ░░░░░░░░░          ░░              │ │
│            │  │  └──────────┘  └──────────┘             │  └──────────────────────────────────────┘ │
│ ─────────  │  │  ┌──────────┐  ┌──────────┐             │                                           │
│ ◈ SETTINGS │  │  │░░░░░░░░░░│  │░░░░░░░░░░│             │  ┌──────────────────────────────────────┐ │
│            │  │  │          │  │          │             │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│            │  │  │░░░░░░░░░░│  │░░░░░░░░░░│             │  │                                      │ │
│            │  │  └──────────┘  └──────────┘             │  │  ░░░░░░░░░░░░  ░░░░░░░░░░░░         │ │
│            │  └──────────────────────────────────────────┘  │                                      │ │
│            │                                                 │  ░░░░░░░░░░░░  ░░░░░░░░░░░░         │ │
│            │  ┌──────────────────────────────────────────┐  │                                      │ │
│            │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░       │ │
│            │  │                                          │  └──────────────────────────────────────┘ │
│            │  │  ░░░░░░░░░░░░░░  ░░░░░░░░░░░░░░░        │                                           │
│            │  │  ░░░░░░░░░░░░░░  ░░░░░░░░░░░░░░░        │                                           │
│            │  └──────────────────────────────────────────┘                                           │
│            │                                                                                          │
│            │  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│            │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│            │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                                                   │ │
│            │  └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────┴─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 Component Specs

**Header changes from main:**
- Status dot: color #00D4FF, animation: pulse 1.2s (PROCESSING state)
- Status label: "SYNCHRONIZING..." | Orbitron 10px | color: #00D4FF
- Clock: still live (time continues)

**Status sub-bar (below breadcrumb):**
- height: 32px | bg: rgba(0,212,255,0.04) | border-bottom: 1px solid rgba(0,212,255,0.08)
- padding: 0 24px | display: flex | align-items: center | gap: 12px
- Lucide RefreshCw 12px | color: #00D4FF | animation: spin 1s linear infinite
- "SYNCHRONIZING DATA FEEDS..." | Orbitron 11px 0.12em UPPERCASE | color: #00D4FF

**Skeleton shimmer:**
```
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}

Shimmer element:
  background: linear-gradient(
    90deg,
    rgba(0,212,255,0.04) 25%,
    rgba(0,212,255,0.12) 50%,
    rgba(0,212,255,0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
  border-radius: 2px;
```

**Skeleton elements per panel:**
- Panel headers: shimmer bar, height 12px, width 60%, radius 2px
- Metric cards: shimmer block, height 72px, full width, radius 4px
- Pipeline bars: shimmer bar, height 8px, varying widths (100%, 66%, 38%, 19%, 11%)
- Agent cards: shimmer block, height 88px, radius 4px
- Chart areas: shimmer block, height 60px, full width
- AI panel: 2 shimmer blocks (card shapes) + shimmer input bar

**Scan-line animation (once per panel on load):**
```
@keyframes scanLine {
  0%   { top: 0%; opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

.scan-overlay::after {
  content: '';
  position: absolute;
  left: 0; right: 0; height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0,212,255,0.6),
    transparent
  );
  animation: scanLine 1.5s ease-in-out forwards;
  pointer-events: none;
}
Each panel card gets position: relative and this overlay on mount.
Animation plays once, then overlay removed from DOM.
```

**Transition to main:**
- When all data resolves: panels fade-out skeleton, panel-enter animation triggers for real content
- Stagger: 80ms per panel in grid order (TL, TR, BL, BR, bottom-full)

---

### 4.3 Screen: `rm-dashboard-home-empty`
**Title:** Dashboard Empty State — Pre-Launch
**Priority:** P1 | **Complexity:** Simple

#### 4.3.1 ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [◈ RAINMACHINE]   RainMachine AI                      [● ONLINE]  MON MAR 30 2026  09:41:22  [MJ ▾] │
├────────────┬─────────────────────────────────────────────────────────────────────────────────────────┤
│            │  RAINMACHINE / DASHBOARD                                                                 │
│ ◈ DASH     ├─────────────────────────────────────────────────────────────────────────────────────────┤
│ [active]   │                                                                                          │
│            │  ┌──────────────────────────────────────────┐  ┌──────────────────────────────────────┐ │
│ ◈ LEADS    │  │ TODAY'S INTELLIGENCE                     │  │ LEAD PIPELINE                        │ │
│            │  │ ─────────────────────────────────────    │  │ ──────────────────────────────────── │ │
│ ◈ AGENTS   │  │                                          │  │                                      │ │
│            │  │     ◈ (scan icon, 24px muted)            │  │     ◈ (scan icon, 24px muted)        │ │
│ ◈ CAMPAIGNS│  │                                          │  │                                      │ │
│            │  │  AWAITING FIRST SIGNAL                   │  │  NO PIPELINE DATA YET                │ │
│ ◈ REPORTS  │  │  No leads recorded yet.                  │  │  Leads will appear here once        │ │
│            │  │                                          │  │  your campaigns are active.          │ │
│ ─────────  │  └──────────────────────────────────────────┘  └──────────────────────────────────────┘ │
│ ◈ SETTINGS │                                                                                          │
│            │  ┌──────────────────────────────────────────┐  ┌──────────────────────────────────────┐ │
│            │  │ AGENT STATUS                             │  │ CAMPAIGN PERFORMANCE                 │ │
│            │  │ ─────────────────────────────────────    │  │ ──────────────────────────────────── │ │
│            │  │                                          │  │                                      │ │
│            │  │     ◈ (scan icon, 24px muted)            │  │     ◈ (scan icon, 24px muted)        │ │
│            │  │                                          │  │                                      │ │
│            │  │  NO AGENTS CONFIGURED                    │  │  NO CAMPAIGN DATA                    │ │
│            │  │  Add agents in the Agents module.        │  │  Connect campaigns to see spend.     │ │
│            │  │                                          │  │                                      │ │
│            │  └──────────────────────────────────────────┘  └──────────────────────────────────────┘ │
│            │                                                                                          │
│            │  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│            │  │                                                                                    │ │
│            │  │                    [◈ MIRD LOGOMARK — 48px muted cyan]                            │ │
│            │  │                                                                                    │ │
│            │  │              RAINMACHINE SYSTEM — ONLINE                                          │ │
│            │  │              [● ONLINE dot]                                                       │ │
│            │  │                                                                                    │ │
│            │  │    AWAITING FIRST SIGNAL. YOUR SYSTEM IS ACTIVE AND MONITORING.                   │ │
│            │  │    Leads will appear here as they are captured from your campaigns.               │ │
│            │  │                                                                                    │ │
│            │  │    [CONFIGURE CAMPAIGNS →]        [MANAGE AGENTS →]                               │ │
│            │  │                                                                                    │ │
│            │  └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────┴─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.3.2 Component Specs

**Panel empty states (4 panels):**
Each panel maintains its card shell, header label, and border — but inner content is replaced:

```
Empty state anatomy (centered within panel):
  display: flex | flex-direction: column | align-items: center | justify-content: center
  min-height: 160px | gap: 12px | padding: 24px

  Icon: Lucide ScanLine 24px | color: rgba(0,212,255,0.2) | no animation
    (DO NOT use pulsating decorative circles)

  Heading: Orbitron 11px 0.12em UPPERCASE | color: #2A4A5A
    "AWAITING FIRST SIGNAL" / "NO PIPELINE DATA YET" / etc.

  Body: Inter 13px | color: #2A4A5A | text-align: center | max-width: 220px
    Contextual message per panel
```

**Center AI panel empty state (full-width):**
```
min-height: 200px | display: flex | flex-direction: column | align-items: center | justify-content: center

Logo mark: SVG 48px × 48px | color: rgba(0,212,255,0.15)
  (MIRD diamond/hexagon logomark, no animation)

Status line:
  "RAINMACHINE SYSTEM — ONLINE" | Orbitron 13px 600 0.08em UPPERCASE | color: #7ECFDF
  StatusDot 8px #00FF88 pulse | positioned left of text | gap 8px

Body text:
  "AWAITING FIRST SIGNAL. YOUR SYSTEM IS ACTIVE AND MONITORING."
  Orbitron 12px | color: #00D4FF | text-align: center | letter-spacing: 0.06em

Sub text:
  "Leads will appear here as they are captured from your campaigns."
  Inter 14px | color: #7ECFDF | text-align: center | max-width: 480px | margin-top: 8px

CTA row (gap 16px, margin-top 24px):
  "CONFIGURE CAMPAIGNS →" | Secondary button | border rgba(0,212,255,0.4) | text #00D4FF → /campaigns
  "MANAGE AGENTS →" | Ghost button | text #00D4FF → /agents
```

**No shimmer in empty state** — these are static, permanent states until first data arrives.

---

### 4.4 Screen: `rm-dashboard-home-error`
**Title:** Dashboard Signal Lost — Error State
**Priority:** P0 | **Complexity:** Medium

#### 4.4.1 ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [◈ RAINMACHINE]   RainMachine AI                    [! AT RISK]  MON MAR 30 2026  09:41:22  [MJ ▾]  │
├────────────┬─────────────────────────────────────────────────────────────────────────────────────────┤
│            │  RAINMACHINE / DASHBOARD                                                                 │
│ ◈ DASH     ├─────────────────────────────────────────────────────────────────────────────────────────┤
│ [active]   │                                                                                          │
│            │  ┌─────────────── TOAST ──────────────────────────────────────────────────────────────┐ │
│ ◈ LEADS    │  │ [!] SIGNAL LOST — RETRYING IN 12s                              [RETRY NOW] [×]    │ │
│            │  └────────────────────────────────────────────────────────────────────────────────────┘ │
│ ◈ AGENTS   │                                                                                          │
│            │  ┌──────── ERROR PANEL ─────────────────────┐  ┌──────────────────────────────────────┐ │
│ ◈ CAMPAIGNS│  │ TODAY'S INTELLIGENCE  [! SIGNAL LOST]    │  │ LEAD PIPELINE                        │ │
│            │  │ ─────────────────────────────────────    │  │ (DATA LOADED — shows normally)       │ │
│ ◈ REPORTS  │  │                                          │  │  [NEW]        ████████████  47       │ │
│            │  │     [!] (AlertTriangle icon 24px)        │  │  [CONTACTED]  ████████      31       │ │
│ ─────────  │  │                                          │  │  ...etc                              │ │
│ ◈ SETTINGS │  │  [!] SIGNAL LOST                         │  └──────────────────────────────────────┘ │
│            │  │  Unable to fetch today's metrics.        │                                           │
│            │  │  Last updated: 09:38:40                  │  ┌──────────────────────────────────────┐ │
│            │  │                                          │  │ AGENT STATUS                         │ │
│            │  │  [RETRY →]                               │  │ (DATA LOADED — shows normally)       │ │
│            │  │                                          │  └──────────────────────────────────────┘ │
│            │  └──────────────────────────────────────────┘                                           │
│            │                                                                                          │
│            │  ┌──── ERROR PANEL ────────────────────────────────────────────────────────────────────┐│
│            │  │ CAMPAIGN PERFORMANCE  [! SIGNAL LOST]                                              ││
│            │  │ ─────────────────────────────────────────────────────────────────────────────────  ││
│            │  │  [!]  SIGNAL LOST — Unable to fetch campaign data.  Last: 09:38:40   [RETRY →]    ││
│            │  └────────────────────────────────────────────────────────────────────────────────────┘│
│            │                                                                                          │
│            │  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│            │  │ CLAUDE AI — INTELLIGENCE PANEL  (shows with cached data if available)              │ │
│            │  └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────┴─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.4.2 Component Specs

**Header changes:**
- Status dot: color #FF6B35, animation: flash×3 then hold (AT RISK state)
- Status label: "AT RISK" | Orbitron 10px | color: #FF6B35
- Lucide AlertTriangle 12px before label

**Toast notification:**
```
Position: fixed | top: 60px | left: 240px + 24px | right: 24px | z-index: 50
bg: #0A1628 | border: 1px solid rgba(255,107,53,0.6) | radius: 4px | padding: 12px 16px
display: flex | align-items: center | gap: 12px
Animation: slide-down from -8px, fade-in, 300ms ease-out | auto-dismiss: never (manual close or retry)

Content:
  Lucide AlertTriangle 16px | color: #FF6B35
  "SIGNAL LOST — RETRYING IN " | Orbitron 11px UPPERCASE | color: #FF7D52
  Countdown: STM 11px #FF7D52 — live countdown from 30s (auto-retry interval)
  "RETRY NOW" | Secondary button, border rgba(255,107,53,0.6), text #FF7D52 | margin-left: auto
    hover: bg rgba(255,107,53,0.08) | click: triggers immediate retry
  [X] close: Lucide X 14px | color: #7ECFDF | hover: #E8F4F8 | click: dismiss toast
```

**Error Panel (affected panels):**
```
Panel border override: 1px solid rgba(255,107,53,0.4)
Panel shadow override: 0 0 20px rgba(255,107,53,0.06)

Panel header changes:
  After "TODAY'S INTELLIGENCE": add error badge
    bg: rgba(255,107,53,0.08) | border: 1px solid rgba(255,107,53,0.3) | radius: 2px
    padding: 3px 8px | Orbitron 10px UPPERCASE | color: #FF7D52
    Lucide AlertTriangle 10px inline | "[!] SIGNAL LOST"

Error body (replaces normal content):
  display: flex | flex-direction: column | align-items: center | justify-content: center
  min-height: 160px | gap: 12px

  Icon: Lucide WifiOff 24px | color: rgba(255,107,53,0.4)
  Heading: "[!] SIGNAL LOST" | Orbitron 11px UPPERCASE | color: #FF7D52
  Body: "Unable to fetch [panel-name] data." | Inter 13px | color: #7ECFDF
  Timestamp: "Last updated: [timestamp]" | STM 11px | color: #2A4A5A
  Retry button: "RETRY →" | Ghost button text #FF7D52 | Orbitron 11px UPPERCASE
    click: triggers single-panel data refetch
    loading: Lucide Loader2 spin, "RETRYING..."
    success: panel transitions to main state with panel-enter animation
    fail: toast updates retry countdown, panel stays in error
```

**Graceful degradation — working panels:**
- Panels that successfully loaded show normal data with zero error styling
- No visual interference between failed and successful panels
- If all panels fail: show all panels in error state + toast

**Retry mechanics:**
- Auto-retry: every 30s (countdown shown in toast)
- Manual retry: "RETRY NOW" button in toast (full dashboard refetch)
- Per-panel retry: individual retry button in each error panel
- On retry success: panel-enter animation on newly loaded panels

---

## 5. Stack Integration

```
Framework:    Next.js 14 App Router | TypeScript strict
Styling:      Tailwind CSS (extend theme with JARVIS token values) + CSS custom properties
Fonts:        Google Fonts — Orbitron, Share Tech Mono, Inter (via next/font)
Icons:        lucide-react ^0.344 — import individual icons, no barrel imports
Charts:       recharts ^2.12 — Line, Area, ResponsiveContainer, XAxis, YAxis, Tooltip disabled
Animation:    CSS keyframes (shimmer, scanLine, pulse) | Tailwind transition utilities for hover
              framer-motion optional for panel-enter spring — or CSS @keyframes slide-up
Live data:    native WebSocket API via custom useWebSocket hook | SWR or React Query for REST
State:        Zustand store: { dashboardData, agentStatuses, loadingState, errorPanels }
Skeleton:     Custom ShimmerBlock component — renders bg-gradient shimmer div
Clock:        useEffect + setInterval(1000) → local Date object, formatted with date-fns
Boot counter: useCountUp(target, 1200, easingFn) custom hook — requestAnimationFrame loop

Component tree:
  DashboardShell
    ├── AppHeader
    │   ├── LogoMark
    │   ├── SystemStatus (dot + label + live clock)
    │   └── UserAvatar (dropdown trigger)
    ├── SidebarNav
    │   └── NavItem[] (with active state)
    └── DashboardMainContent
        ├── BreadcrumbBar
        ├── StatusSubBar (loading state only)
        ├── ToastNotification (error state only)
        ├── DashboardGrid
        │   ├── PanelTodaysIntelligence (or skeleton / empty / error variant)
        │   ├── PanelLeadPipeline (or skeleton / empty / error variant)
        │   ├── PanelAgentStatus (or skeleton / empty / error variant)
        │   ├── PanelCampaignPerformance (or skeleton / empty / error variant)
        │   └── PanelClaudeAI (or skeleton / empty / error variant)
        └── ScanLineOverlay (loading state only, unmounts after 1.5s)

Responsive:
  This is desktop-first. Min supported width: 1280px.
  Sidebar collapses to 64px at <1440px via toggle only (not auto).
  No mobile layouts in this flow.

Key CSS custom properties (define in :root or globals.css):
  --color-bg-base: #050D1A;
  --color-bg-panel: #0A1628;
  --color-cyan-primary: #00D4FF;
  --color-cyan-muted: #7ECFDF;
  --color-success: #00FF88;
  --color-warning: #FFB800;
  --color-alert: #FF6B35;
  --color-text-primary: #E8F4F8;
  --border-glow: rgba(0,212,255,0.2);
  --border-strong: rgba(0,212,255,0.4);
  --shadow-panel: 0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1), inset 0 0 40px rgba(0,212,255,0.02);
```

# Flow PRD: RainMachine Agent Management

**File:** `05-rm-agents/FLOW-05-RM-AGENTS.md`
**Flow ID:** FLOW-05
**Version:** 1.0
**Date:** 2026-03-30
**Status:** READY FOR WIREFRAME
**Author:** MIRD AI Corporate Machine — Sigma Protocol Step 5

---

## 1. Flow Metadata

| Property | Value |
|---|---|
| Flow Name | RainMachine Agent Management |
| Flow ID | FLOW-05 |
| URL Prefix | `/agents` |
| Primary User | Marcus (Operator/Owner) |
| User Goal | Review agent team performance, understand lead routing, drill into individual agent metrics |
| Entry Points | Sidebar navigation: AGENTS item |
| Exit Points | agents-routing-view, agents-detail-main, settings-team-main |
| Screen Count | 5 |
| Complexity | Medium–Complex |
| Auth Required | Yes — RainMachine operator session |

---

## 1A. UI Profile Compliance

| Rule | Status |
|---|---|
| No emoji icons | ENFORCED — Lucide React only |
| No pulsating decorative circles | ENFORCED |
| No soft gradients as backgrounds | ENFORCED — flat #050D1A base |
| No border-radius > 8px on panels | ENFORCED — all panels radius 4px |
| Font stack: Orbitron / Share Tech Mono / Inter | ENFORCED |
| JARVIS Dark token values only | ENFORCED |
| Status dots per spec | ENFORCED |
| Progress rings SVG per spec | ENFORCED |

---

## 2. CMO Context

Marcus runs a team of sales agents handling inbound leads from Meta and Google ad campaigns. The Agents section is his team management command center — not HR software, but an operational intelligence panel. He wants to see at a glance who is performing, who is lagging, how leads are being distributed, and whether his routing logic is correct.

Key operator questions this flow answers:
- "Are my agents keeping up with lead volume?"
- "Who has the best close rate this week?"
- "Is my routing logic routing Meta leads to the right people?"
- "What's Agent 2's history over the last 30 days?"

The visual language must communicate "operational control" — these are assets being managed, not employees being reviewed. The data is live intelligence.

---

## 3. User Journey

```
[Sidebar: AGENTS]
        |
        v
[rm-agents-main] ──── 0 agents ────> [rm-agents-empty]
        |                                    |
        | click "ROUTING CONFIGURATION →"    | click "ADD FIRST AGENT →"
        v                                    v
[rm-agents-routing-view]           [settings-team-main]
        |
        | click "EDIT ROUTING RULES →"
        v
[settings-routing]

[rm-agents-main]
        |
        | click Agent Panel Card
        v
[rm-agents-detail-main]
        |
        | click "ASSIGNED LEADS" tab
        v
[rm-agents-detail-leads-tab]
        |
        | click lead row
        v
[leads-detail-panel] (slide from right — defined in FLOW-04)
```

---

## 4. Screen Specifications

---

### 4.1 Screen: `rm-agents-main`

**Screen ID:** rm-agents-main
**Priority:** P0
**Route:** `/agents`
**Complexity:** Complex
**Load Complexity:** Medium
**Emotion Target:**
- 0–2s: "I can see my full team at a glance"
- 2–10s: "I can see who's winning and who's lagging"
- 10s+: "I want to click into the agent who's underperforming"

---

#### ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ bg: #050D1A                                                                                 │
│                                                                                             │
│ ┌──────────┐ ┌─────────────────────────────────────────────────────────────────────────┐   │
│ │ SIDEBAR  │ │ HEADER                                                                  │   │
│ │ 240px    │ │ bg #0A1628 border-bottom rgba(0,212,255,0.1) h-56px                     │   │
│ │          │ │  [≡] RAINMACHINE            [Marcus Johnson ▾]  [●] SYSTEM ONLINE       │   │
│ │ [logo]   │ └─────────────────────────────────────────────────────────────────────────┘   │
│ │          │                                                                               │
│ │ OVERVIEW │ ┌─────────────────────────────────────────────────────────────────────────┐   │
│ │ LEADS    │ │ AGENT COMMAND CENTER         [ROUTING CONFIGURATION →]                  │   │
│ │ AGENTS ◄ │ │ Orbitron 18px #E8F4F8        Ghost link, Orbitron 11px #00D4FF          │   │
│ │ CAMPAIGNS│ │ active: bg rgba(0,212,255,   ────────────────────────────────────────   │   │
│ │ REPORTS  │ │ 0.08) border-left 2px        LAST UPDATED: 09:42:17                     │   │
│ │ SETTINGS │ │ solid #00D4FF                STM 11px #7ECFDF                           │   │
│ │          │ └─────────────────────────────────────────────────────────────────────────┘   │
│ └──────────┘                                                                               │
│             ┌─────────────────────────────────────────────────────────────────────────┐   │
│             │ SUMMARY METRICS ROW  (3 cards, equal width, gap 16px)                   │   │
│             │                                                                         │   │
│             │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐            │   │
│             │ │ TOTAL AGENTS    │ │ AVG LEADS TODAY │ │ TEAM CLOSE RATE │            │   │
│             │ │ Orb 11px muted  │ │ Orb 11px muted  │ │ Orb 11px muted  │            │   │
│             │ │                 │ │                 │ │                 │            │   │
│             │ │     6           │ │      8.3        │ │     24.7%       │            │   │
│             │ │  STM 32px       │ │   STM 32px      │ │   STM 32px      │            │   │
│             │ │                 │ │                 │ │                 │            │   │
│             │ │ +1 vs yesterday │ │ ▲ +1.2          │ │ ▲ +2.1%        │            │   │
│             │ │ STM 13px #00FF88│ │ STM 13px success│ │ STM 13px success│            │   │
│             │ └─────────────────┘ └─────────────────┘ └─────────────────┘            │   │
│             └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                             │
│             ┌─────────────────────────────────────────────────────────────────────────┐   │
│             │ AGENT GRID (2 columns, gap 16px)                                        │   │
│             │                                                                         │   │
│             │ ┌──────────────────────────────┐  ┌──────────────────────────────┐      │   │
│             │ │ AGENT PANEL CARD             │  │ AGENT PANEL CARD             │      │   │
│             │ │ bg #0A1628 border radius 4px │  │ bg #0A1628 border radius 4px │      │   │
│             │ │                              │  │                              │      │   │
│             │ │ ┌──┐  JAMES CARTER  ● ONLINE │  │ ┌──┐  DIANA FLORES  ● ONLINE │      │   │
│             │ │ │JC│  Orb 14px      8px dot  │  │ │DF│  Orb 14px      8px dot  │      │   │
│             │ │ └──┘  [CLOSER] role tag      │  │ └──┘  [SETTER] role tag      │      │   │
│             │ │      Orb 10px cyan-dim bg    │  │      Orb 10px cyan-dim bg    │      │   │
│             │ │ ─────────────────────────── │  │ ─────────────────────────── │      │   │
│             │ │                              │  │                              │      │   │
│             │ │  LEADS TODAY  APPTS SET      │  │  LEADS TODAY  APPTS SET      │      │   │
│             │ │  12           4              │  │  9            3              │      │   │
│             │ │  STM 24px     STM 24px       │  │  STM 24px     STM 24px       │      │   │
│             │ │                              │  │                              │      │   │
│             │ │  CLOSE RATE   ○ ring MD      │  │  CLOSE RATE   ○ ring MD      │      │   │
│             │ │  33.3%        r=28 success   │  │  22.2%        r=28 medium    │      │   │
│             │ │  STM 24px                    │  │  STM 24px                    │      │   │
│             │ │                              │  │                              │      │   │
│             │ │  7-DAY SPARKLINE (28px tall) │  │  7-DAY SPARKLINE (28px tall) │      │   │
│             │ │  ╱╲  ╱╲ ╱                   │  │   ╲ ╱╲  ╱                   │      │   │
│             │ │                              │  │                              │      │   │
│             │ │  [VIEW PROFILE →]  [ROUTING: ROUND ROBIN]  │  │  [VIEW PROFILE →]  [ROUTING: DIRECT]   │      │   │
│             │ │  Ghost link        badge rgba(0,212,255,    │  │  Ghost link        badge              │      │   │
│             │ │  Orb 11px          0.12) STM 11px           │  │                                      │      │   │
│             │ └──────────────────────────────┘  └──────────────────────────────┘      │   │
│             │                                                                         │   │
│             │ ┌──────────────────────────────┐  ┌──────────────────────────────┐      │   │
│             │ │ AGENT PANEL CARD             │  │ AGENT PANEL CARD             │      │   │
│             │ │ ┌──┐  TROY BANKS  ● OFFLINE  │  │ ┌──┐  KEISHA MOORE ● STANDBY │      │   │
│             │ │ │TB│  Orb 14px    8px #FF3333│  │ │KM│  Orb 14px    8px #2A4A5A│      │   │
│             │ │ └──┘  [CLOSER] role tag      │  │ └──┘  [SETTER] role tag      │      │   │
│             │ │  LEADS: 0  APPTS: 0          │  │  LEADS: 5  APPTS: 1          │      │   │
│             │ │  CLOSE RATE: 0%  ring low    │  │  CLOSE RATE: 20%  ring low   │      │   │
│             │ │  sparkline (flat)            │  │  sparkline                   │      │   │
│             │ │  [VIEW PROFILE →]  [OFFLINE] │  │  [VIEW PROFILE →]  [STANDBY] │      │   │
│             │ └──────────────────────────────┘  └──────────────────────────────┘      │   │
│             └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Component Specs

**Page Header Row**
- Title: "AGENT COMMAND CENTER" — Orbitron 18px 600 #E8F4F8 uppercase
- Ghost link: "ROUTING CONFIGURATION →" — Orbitron 11px 400 #00D4FF, positioned top-right of header row
  - ::after content: '→', hover: text #1ADCFF
- Timestamp: "LAST UPDATED: HH:MM:SS" — STM 11px #7ECFDF
- Divider below: `border-bottom: 1px solid rgba(0,212,255,0.1)` padding-bottom 16px

**Summary Metrics Row**
- 3 cards, flex row, gap 16px, margin-bottom 24px
- Each card:
  - bg: #0A1628
  - border: 1px solid rgba(0,212,255,0.2)
  - border-radius: 4px
  - padding: 24px
  - shadow: `0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1)`
  - Label: Orbitron 11px 400 #7ECFDF uppercase letter-spacing 0.12em
  - Value: STM 32px #E8F4F8 (boot-counter animation: 0→value 1200ms on load)
  - Delta: STM 13px — positive: #00FF88, negative: #FF6B35, neutral: #7ECFDF
  - Delta prefix: ▲ for positive, ▼ for negative

**Agent Panel Card**
- bg: #0A1628
- border: 1px solid rgba(0,212,255,0.2)
- border-radius: 4px
- padding: 24px
- shadow: `0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1)`
- hover: border rgba(0,212,255,0.4), shadow `0 0 30px rgba(0,212,255,0.12)`, cursor pointer
- transition: border 150ms ease-out, box-shadow 150ms ease-out

**Agent Avatar Circle**
- width: 40px, height: 40px, border-radius: 50%
- bg: rgba(0,212,255,0.12)
- border: 1px solid rgba(0,212,255,0.4)
- Initials: Orbitron 14px 600 #00D4FF, centered
- float left, margin-right 12px

**Agent Name**
- Orbitron 14px 600 #E8F4F8 uppercase
- Positioned inline with avatar

**Status Dot**
- width 8px, height 8px, border-radius 50%, display inline-block, margin-left 8px, vertical-align middle
- ONLINE: background #00FF88, box-shadow: `0 0 6px #00FF88`, animation: `statusPulse 2s ease-in-out infinite`
- PROCESSING: background #00D4FF, animation: `statusPulse 1.2s ease-in-out infinite`
- STANDBY: background #2A4A5A, animation: `statusPulse 4s ease-in-out infinite`
- OFFLINE: background #FF3333, no animation
- AT RISK: background #FF6B35, animation: `statusFlash 0.5s ease-in-out 3`

**Role Tag Badge**
- Orbitron 10px 400 uppercase letter-spacing 0.1em
- Padding: 2px 8px, border-radius: 2px
- CLOSER: bg rgba(0,212,255,0.12) border 1px solid rgba(0,212,255,0.4) text #00D4FF
- SETTER: bg rgba(0,255,136,0.1) border 1px solid rgba(0,255,136,0.3) text #00FF88
- MANAGER: bg rgba(255,184,0,0.1) border 1px solid rgba(255,184,0,0.3) text #FFB800

**Card Divider**
- `border-bottom: 1px solid rgba(0,212,255,0.1)` margin 12px 0

**Agent Metrics (within card)**
- Flex row, gap 24px, margin-bottom 16px
- Each metric sub-block:
  - Label: Orbitron 11px 400 #7ECFDF uppercase, display block
  - Value: STM 24px #E8F4F8

**Progress Ring — CLOSE RATE (MD)**
- SVG: viewBox 0 0 80 80, r=28, stroke-width=2.5
- Center text: STM 14px #E8F4F8 (the percentage)
- Track: stroke rgba(0,212,255,0.1)
- Fill color:
  - >= 30%: #00FF88 with `filter: drop-shadow(0 0 4px #00FF88)`
  - >= 15%: #FFB800 with `filter: drop-shadow(0 0 4px #FFB800)`
  - < 15%: #FF6B35 with `filter: drop-shadow(0 0 4px #FF6B35)`
- stroke-linecap: round
- Animation: stroke-dashoffset draw 1000ms cubic-bezier(0.25,0.46,0.45,0.94) on mount

**Sparkline (7-day)**
- SVG, height 28px, width 100%, no axes
- Stroke: #00D4FF, stroke-width: 1.5
- Fill: area below line rgba(0,212,255,0.15) fading to transparent
- No labels, trend only
- margin-bottom: 16px

**Action Row (bottom of card)**
- Flex row, align-items center, justify-content space-between
- "VIEW PROFILE →": Orbitron 11px 400 #00D4FF, ::after '→', hover text #1ADCFF
- Routing badge:
  - bg rgba(0,212,255,0.08), border 1px solid rgba(0,212,255,0.2), border-radius 2px
  - padding 2px 8px
  - STM 11px #7ECFDF uppercase
  - OFFLINE state: STM 11px #FF3333, border rgba(255,51,51,0.3), bg rgba(255,51,51,0.08)
  - STANDBY state: STM 11px #2A4A5A, border rgba(42,74,90,0.5)

**Agent Grid Layout**
- CSS Grid: `grid-template-columns: 1fr 1fr`, gap 16px

---

#### Animation Spec

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Page enter | panel-enter: slide-up 8px + fade | 400ms | spring, stagger 80ms per card |
| Summary metric values | boot-counter: 0→value | 1200ms | linear |
| Progress rings | stroke-dashoffset draw | 1000ms | cubic-bezier(0.25,0.46,0.45,0.94) |
| Scan line on load | scan-line sweep | 1.5s | once |
| Status dots | per spec above | varies | |
| Card hover | border + shadow transition | 150ms | ease-out |
| Sparklines | draw path left-to-right | 800ms | ease-out, 200ms delay after page enter |

---

#### Interactive States

| Element | Default | Hover | Active/Clicked | Disabled |
|---|---|---|---|---|
| Agent Panel Card | border rgba(0,212,255,0.2) | border rgba(0,212,255,0.4), shadow stronger | bg rgba(0,212,255,0.04) | n/a |
| "VIEW PROFILE →" link | text #00D4FF | text #1ADCFF | text #00D4FF | n/a |
| "ROUTING CONFIGURATION →" | text #00D4FF | text #1ADCFF | n/a | n/a |
| Routing badge | as spec | no change | n/a | n/a |

---

#### Data Requirements

```typescript
interface AgentSummaryMetrics {
  totalAgents: number;
  avgLeadsToday: number;
  avgLeadsDelta: number; // vs yesterday
  teamCloseRate: number; // percentage
  teamCloseRateDelta: number;
  lastUpdated: string; // ISO timestamp
}

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  initials: string; // computed
  role: 'CLOSER' | 'SETTER' | 'MANAGER';
  status: 'ONLINE' | 'OFFLINE' | 'STANDBY' | 'AT_RISK' | 'PROCESSING';
  routingRule: string; // e.g. "ROUND ROBIN", "DIRECT", "AFTER HOURS"
  leadsToday: number;
  appointmentsSet: number;
  closeRate: number; // 0-100
  sparklineData: number[]; // 7 values, leads per day
}

// API: GET /api/agents
// Response: { metrics: AgentSummaryMetrics, agents: Agent[] }
// Polling: every 60s for status updates
```

---

### 4.2 Screen: `rm-agents-routing-view`

**Screen ID:** rm-agents-routing-view
**Priority:** P1
**Route:** `/agents/routing`
**Complexity:** Complex
**Load Complexity:** Medium
**Emotion Target:**
- 0–2s: "I can see how leads flow to my team"
- 2–10s: "I understand which rules are active"
- 10s+: "I want to edit the after-hours rule"

---

#### ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ bg: #050D1A                                                                                 │
│                                                                                             │
│ ┌──────────┐ ┌─────────────────────────────────────────────────────────────────────────┐   │
│ │ SIDEBAR  │ │ HEADER                                                                  │   │
│ │ (same)   │ │  [≡] RAINMACHINE            [Marcus Johnson ▾]  [●] SYSTEM ONLINE       │   │
│ │ AGENTS ◄ │ └─────────────────────────────────────────────────────────────────────────┘   │
│ │          │                                                                               │
│ │          │ ┌─────────────────────────────────────────────────────────────────────────┐   │
│ │          │ │ BREADCRUMB                            [EDIT ROUTING RULES →] btn primary│   │
│ │          │ │ AGENTS / ROUTING CONFIGURATION        bg #00D4FF text #050D1A           │   │
│ │          │ │ Orb 11px #7ECFDF / Orb 11px #E8F4F8  Orb 600 13px UPPERCASE            │   │
│ │          │ │ ─────────────────────────────────────────────────────────────────────── │   │
│ │          │ │ ROUTING CONFIGURATION                                                   │   │
│ │          │ │ Orbitron 18px #E8F4F8                                                   │   │
│ └──────────┘ └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                             │
│             ┌─────────────────────────────────────────────────────────────────────────┐   │
│             │ ROUTING DIAGRAM PANEL                                                   │   │
│             │ bg #0A1628 border radius 4px padding 24px                               │   │
│             │                                                                         │   │
│             │  SOURCE NODES (left column)                                             │   │
│             │                                                                         │   │
│             │  ┌─────────────┐                                                        │   │
│             │  │  META ADS   │──────────────┐                                         │   │
│             │  │ bg META badge│              │                                         │   │
│             │  │ TrendingUp   │              │                                         │   │
│             │  │ icon 16px    │              ▼                                         │   │
│             │  └─────────────┘   ┌──────────────────────┐                             │   │
│             │                    │  ROUTING ENGINE       │                             │   │
│             │  ┌─────────────┐   │  Orb 11px #7ECFDF    │                             │   │
│             │  │ GOOGLE ADS  │──►│  ACTIVE RULES: 4      │                             │   │
│             │  │ bg GOOGLE   │   │  border solid cyan    │                             │   │
│             │  │ badge        │   │  radius 4px          │                             │   │
│             │  └─────────────┘   └──────────────────────┘                             │   │
│             │                              │                                           │   │
│             │  ┌─────────────┐             │ Routes to:                               │   │
│             │  │  ORGANIC    │─────────────┘                                           │   │
│             │  │ #00FF88 bg  │         │           │           │           │           │   │
│             │  │ organic badge│        ▼           ▼           ▼           ▼           │   │
│             │  └─────────────┘                                                        │   │
│             │                                                                         │   │
│             │  AGENT DESTINATION NODES (right column)                                 │   │
│             │                                                                         │   │
│             │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│             │  │ JAMES CARTER │  │ DIANA FLORES │  │  TROY BANKS  │  │ VOICEMAIL  │  │   │
│             │  │ ● ONLINE     │  │ ● ONLINE     │  │ ● OFFLINE    │  │  QUEUE     │  │   │
│             │  │              │  │              │  │              │  │            │  │   │
│             │  │ Orb 12px     │  │ Orb 12px     │  │ Orb 12px     │  │ Orb 12px   │  │   │
│             │  │ TODAY: 12    │  │ TODAY: 9     │  │ TODAY: 0     │  │ IN QUEUE:3 │  │   │
│             │  │ STM 13px     │  │ STM 13px     │  │ STM 13px     │  │ STM 13px   │  │   │
│             │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │   │
│             │                                                                         │   │
│             │  ROUTING RULES TABLE (below diagram)                                    │   │
│             │  ──────────────────────────────────────────────────────────             │   │
│             │  RULE            SOURCE     CONDITION          DESTINATION   PRIORITY   │   │
│             │  Orb 11px cols                                                          │   │
│             │  ────────────────────────────────────────────────────────────           │   │
│             │  META HOURS      META ADS   MON-FRI 8AM-5PM    James Carter    1        │   │
│             │  STM 13px                                                               │   │
│             │  AFTER HOURS     ALL        5PM-8AM / WKND     Voicemail Queue 2        │   │
│             │  ROUND ROBIN     ALL        Default            All Agents       3        │   │
│             │  GOOGLE DEFAULT  GOOGLE ADS Default            Diana Flores     4        │   │
│             │                                                                         │   │
│             └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Component Specs

**Breadcrumb**
- "AGENTS" — Orbitron 11px 400 #7ECFDF uppercase, clickable (→ /agents), hover text #00D4FF
- "/" separator — Orbitron 11px #2A4A5A
- "ROUTING CONFIGURATION" — Orbitron 11px 400 #E8F4F8 uppercase (current, non-link)
- margin-bottom: 8px

**"EDIT ROUTING RULES →" Button (Primary)**
- bg: #00D4FF, text: #050D1A
- Orbitron 600 13px uppercase letter-spacing 0.1em
- padding: 12px 24px, border-radius: 4px
- hover: bg #1ADCFF, box-shadow: `0 0 20px rgba(0,212,255,0.3)`
- float: right (or flex justify-between on header row)
- onClick: navigate to `/settings/routing`

**Source Node Cards (left)**
- bg: platform-appropriate
  - META: bg rgba(0,212,255,0.12), border 1px solid rgba(0,212,255,0.4), text #00D4FF
  - GOOGLE: bg rgba(255,184,0,0.12), border 1px solid rgba(255,184,0,0.4), text #FFB800
  - ORGANIC: bg rgba(0,255,136,0.1), border 1px solid rgba(0,255,136,0.3), text #00FF88
- width: 120px, padding: 12px 16px, border-radius: 4px
- Icon (TrendingUp from Lucide): 16px, color matches text
- Label: Orbitron 12px 600 uppercase

**Routing Engine Center Box**
- bg: #0A1628, border: 1px solid rgba(0,212,255,0.4), border-radius: 4px
- padding: 16px 20px
- Label: "ROUTING ENGINE" — Orbitron 11px #7ECFDF uppercase
- Sub-label: "ACTIVE RULES: 4" — STM 13px #00D4FF
- box-shadow: `0 0 16px rgba(0,212,255,0.12)`

**Connector Arrows**
- SVG lines connecting source → engine → agents
- stroke: rgba(0,212,255,0.5), stroke-width: 1.5
- Arrow head: filled #00D4FF, 6px
- Rule label on arrow: Orbitron 11px #7ECFDF, bg #050D1A padding 2px 6px (so label sits over line cleanly)

**Agent Destination Nodes**
- bg: #0A1628, border: 1px solid rgba(0,212,255,0.2), border-radius: 4px
- padding: 12px 16px, width: ~140px
- Name: Orbitron 12px 600 #E8F4F8 uppercase
- Status dot: 8px per spec
- "TODAY: X" — STM 13px #7ECFDF

**Voicemail Queue Node**
- Same card style but border rgba(255,184,0,0.3) bg rgba(255,184,0,0.06)
- "IN QUEUE: X" — STM 13px #FFB800
- Voicemail icon (Lucide VoicemailIcon) 14px #FFB800

**Routing Rules Table**
- `border-top: 1px solid rgba(0,212,255,0.1)` margin-top 24px
- Header row: Orbitron 11px #7ECFDF uppercase, padding 12px 16px, border-bottom rgba(0,212,255,0.15)
- Data rows: STM 13px #E8F4F8, padding 12px 16px, border-bottom rgba(0,212,255,0.06)
- Row hover: bg rgba(0,212,255,0.04), first-td border-left 2px solid #00D4FF
- Columns: RULE | SOURCE | CONDITION | DESTINATION | PRIORITY

---

#### Animation Spec

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Page enter | panel-enter slide-up + fade | 400ms | spring |
| Connector arrows | draw from source → engine → agent | 800ms stagger 100ms | ease-out |
| Source node enter | fade + scale from 0.95 | 300ms stagger 80ms | ease-out |
| Agent node enter | fade + scale from 0.95 | 300ms stagger 120ms (after engine) | ease-out |
| Rule table rows | slide-up + fade stagger | 80ms per row | ease-out |

---

#### Interactive States

| Element | Default | Hover | Click |
|---|---|---|---|
| "AGENTS" breadcrumb | text #7ECFDF | text #00D4FF underline | navigate /agents |
| "EDIT ROUTING RULES →" | bg #00D4FF | bg #1ADCFF + glow | navigate /settings/routing |
| Rule table row | default | bg rgba(0,212,255,0.04), border-left 2px #00D4FF | n/a (read-only) |
| Agent destination node | default | border rgba(0,212,255,0.4) | navigate to agent detail |

---

#### Data Requirements

```typescript
interface RoutingRule {
  id: string;
  name: string;
  source: 'META_ADS' | 'GOOGLE_ADS' | 'ORGANIC' | 'ALL';
  condition: string; // human-readable, e.g. "MON-FRI 8AM-5PM"
  conditionType: 'TIME_WINDOW' | 'ALWAYS' | 'AFTER_HOURS' | 'SOURCE_MATCH';
  destinationType: 'AGENT' | 'ROUND_ROBIN' | 'VOICEMAIL_QUEUE';
  destinationAgentId?: string;
  destinationLabel: string;
  priority: number;
  isActive: boolean;
}

interface RoutingConfig {
  rules: RoutingRule[];
  agents: Pick<Agent, 'id' | 'firstName' | 'lastName' | 'status' | 'leadsToday'>[];
  voicemailQueueCount: number;
}

// API: GET /api/agents/routing
// Response: RoutingConfig
```

---

### 4.3 Screen: `rm-agents-detail-main`

**Screen ID:** rm-agents-detail-main
**Priority:** P1
**Route:** `/agents/:agentId`
**Complexity:** Complex
**Load Complexity:** Medium
**Emotion Target:**
- 0–2s: "I know exactly who this is and their current status"
- 2–10s: "I can see their 30-day trend"
- 10s+: "I want to review their recent assigned leads"

---

#### ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ bg: #050D1A                                                                                 │
│                                                                                             │
│ ┌──────────┐ ┌─────────────────────────────────────────────────────────────────────────┐   │
│ │ SIDEBAR  │ │ HEADER                                                                  │   │
│ │ AGENTS ◄ │ │  [≡] RAINMACHINE            [Marcus Johnson ▾]  [●] SYSTEM ONLINE       │   │
│ │          │ └─────────────────────────────────────────────────────────────────────────┘   │
│ │          │                                                                               │
│ │          │  AGENTS / JAMES CARTER    (breadcrumb)                                       │
│ │          │  Orb 11px muted / Orb 11px primary                                          │
│ │          │                                                                               │
│ │          │ ┌─────────────────────────────────────────────────────────────────────────┐   │
│ │          │ │ AGENT HEADER CARD                              [EDIT AGENT →]           │   │
│ │          │ │ bg #0A1628 border radius 4px padding 24px      Secondary btn            │   │
│ │          │ │                                                                         │   │
│ │          │ │  ┌────┐  JAMES CARTER          ● ONLINE                                 │   │
│ │          │ │  │ JC │  Orbitron 20px #E8F4F8  8px dot #00FF88                         │   │
│ │          │ │  │    │  [CLOSER]  role tag                                             │   │
│ │          │ │  └────┘  ONLINE SINCE 07:34:22  STM 11px #7ECFDF                        │   │
│ │          │ │  64px circle                                                            │   │
│ │          │ │  border 1px solid rgba(0,212,255,0.4)                                   │   │
│ │          │ └─────────────────────────────────────────────────────────────────────────┘   │
│ │          │                                                                               │
│ │          │ ┌─────────────────────────────────────────────────────────────────────────┐   │
│ │          │ │ KEY METRICS ROW (4 cards)                                               │   │
│ │          │ │                                                                         │   │
│ │          │ │ ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐ ┌─────────────┐  │   │
│ │          │ │ │ LEADS ASSIGNED│ │ APPTS SET  │ │   CLOSE RATE     │ │  AVG RESP   │  │   │
│ │          │ │ │ TODAY / WEEK│ │ TODAY / WEEK│ │                  │ │    TIME     │  │   │
│ │          │ │ │  12 / 48   │ │  4 / 19    │ │   SVG ring LG    │ │   4m 12s    │  │   │
│ │          │ │ │ STM 24px   │ │ STM 24px   │ │   r=40 stroke=3  │ │  STM 32px   │  │   │
│ │          │ │ │ /MONTH:184 │ │ /MONTH:62  │ │   33.3%          │ │             │  │   │
│ │          │ │ │ STM 13px   │ │ STM 13px   │ │   #00FF88 glow   │ │  ▼ +0.5m   │  │   │
│ │          │ │ │ muted      │ │ muted      │ │                  │ │  STM 13px  │  │   │
│ │          │ │ └─────────────┘ └─────────────┘ └──────────────────┘ └─────────────┘  │   │
│ │          │ └─────────────────────────────────────────────────────────────────────────┘   │
│ │          │                                                                               │
│ │          │ ┌─────────────────────────────────────────────────────────────────────────┐   │
│ │          │ │ 30-DAY PERFORMANCE CHART                                                │   │
│ │          │ │ bg #0A1628 border radius 4px padding 24px                               │   │
│ │          │ │                                                                         │   │
│ │          │ │ PERFORMANCE — LAST 30 DAYS   [LEADS ——] [APPOINTMENTS ----]             │   │
│ │          │ │ Orb 13px #E8F4F8             Legend: STM 11px                           │   │
│ │          │ │                                                                         │   │
│ │          │ │  8 ┤                    ╭────╮                                          │   │
│ │          │ │  6 ┤         ╭──────────╯    ╰────╮                                    │   │
│ │          │ │  4 ┤   ╭─────╯                    ╰────── (leads line #00D4FF)         │   │
│ │          │ │  2 ┤───╯                                                               │   │
│ │          │ │  0 ┼───────────────────────────────────────────────────                │   │
│ │          │ │     Mar 1              Mar 15              Mar 30                       │   │
│ │          │ │     STM 11px #7ECFDF axis labels                                        │   │
│ │          │ └─────────────────────────────────────────────────────────────────────────┘   │
│ │          │                                                                               │
│ │          │ ┌─────────────────────────────────────────────────────────────────────────┐   │
│ │          │ │ TABS                                                                    │   │
│ │          │ │ [ASSIGNED LEADS]  [PERFORMANCE HISTORY]                                 │   │
│ │          │ │  active: border-bottom 2px #00D4FF text #00D4FF                        │   │
│ │          │ │  inactive: text #7ECFDF, hover text #E8F4F8                            │   │
│ │          │ │  Orbitron 12px uppercase                                               │   │
│ │          │ │                                                                         │   │
│ │          │ │  [Tab content — see rm-agents-detail-leads-tab]                        │   │
│ │          │ └─────────────────────────────────────────────────────────────────────────┘   │
│ └──────────┘                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Component Specs

**Breadcrumb**
- Same pattern as routing-view: "AGENTS" (link) / "JAMES CARTER" (current)

**Agent Header Card**
- Full-width panel card (standard panel spec)
- Flex row layout: avatar (left) + info block (flex-grow) + edit button (right)
- Avatar circle: 64px diameter, border-radius 50%, bg rgba(0,212,255,0.12), border 1px solid rgba(0,212,255,0.4)
  - Initials: Orbitron 20px 600 #00D4FF centered
- Name: Orbitron 20px 600 #E8F4F8 uppercase
- Status dot: 8px, inline after name
- Role tag: same badge spec as agent panel card
- "ONLINE SINCE HH:MM:SS" — STM 11px #7ECFDF, display block below name
  - If OFFLINE: "LAST SEEN HH:MM DD MMM" in STM 11px #FF3333
- "EDIT AGENT →" button (secondary): transparent, border rgba(0,212,255,0.4), text #00D4FF, Orbitron 600 13px, padding 12px 24px, radius 4px

**Key Metrics Row (4 cards)**
- 4-column grid, gap 16px
- "LEADS ASSIGNED" card — shows today/week as "12 / 48" STM 24px, with "/MONTH: 184" STM 13px #7ECFDF below
- "APPOINTMENTS SET" card — same pattern
- "CLOSE RATE" card — contains Progress Ring LG (r=40, stroke=3), value STM 20px centered in ring
- "AVG RESPONSE TIME" card — "4m 12s" STM 32px, delta below

**30-Day Performance Chart**
- Panel card, full width
- Chart library: Recharts or equivalent
- Two lines: Leads (#00D4FF solid), Appointments (#00FF88 dashed)
- Area fill under Leads line: rgba(0,212,255,0.15) → transparent
- Grid lines: horizontal only, rgba(0,212,255,0.06)
- Axis labels: STM 11px #7ECFDF
- Legend row: Orbitron 11px #7ECFDF uppercase with color swatch squares (4px)
- Chart height: 200px
- Animate lines drawing left-to-right on mount: 1200ms ease-out

**Tabs Component**
- Tab bar: `border-bottom: 1px solid rgba(0,212,255,0.1)`
- Each tab item: Orbitron 12px uppercase, padding 12px 20px
- Active: `border-bottom: 2px solid #00D4FF`, color #00D4FF
- Inactive: color #7ECFDF
- Hover: color #E8F4F8
- Transition: color 150ms ease-out

---

#### Animation Spec

| Element | Animation | Duration |
|---|---|---|
| Header card enter | slide-up 8px + fade | 400ms |
| Metric cards | stagger slide-up 80ms | 400ms each |
| Progress ring | draw stroke | 1000ms cubic-bezier |
| Performance chart | draw lines left-to-right | 1200ms ease-out |
| Tab switch | content fade-in | 200ms ease-out |

---

#### Interactive States

| Element | Default | Hover | Click |
|---|---|---|---|
| Breadcrumb "AGENTS" | #7ECFDF | #00D4FF | navigate /agents |
| "EDIT AGENT →" button | transparent border #00D4FF text #00D4FF | border #00D4FF bg rgba(0,212,255,0.08) | navigate /settings/agents/:id |
| ASSIGNED LEADS tab | #7ECFDF | #E8F4F8 | activate tab |
| PERFORMANCE HISTORY tab | #7ECFDF | #E8F4F8 | activate tab |

---

#### Data Requirements

```typescript
interface AgentDetail extends Agent {
  onlineSince?: string; // ISO timestamp if ONLINE
  lastSeen?: string; // ISO timestamp if OFFLINE
  leadsWeek: number;
  leadsMonth: number;
  appointmentsToday: number;
  appointmentsWeek: number;
  appointmentsMonth: number;
  avgResponseTimeSeconds: number;
  avgResponseTimeDelta: number; // seconds vs last period
  performanceHistory: {
    date: string; // YYYY-MM-DD
    leads: number;
    appointments: number;
  }[]; // 30 entries
}

// API: GET /api/agents/:agentId
// Response: AgentDetail
```

---

### 4.4 Screen: `rm-agents-detail-leads-tab`

**Screen ID:** rm-agents-detail-leads-tab
**Priority:** P1
**Route:** `/agents/:agentId` (tab state = leads)
**Complexity:** Medium
**Load Complexity:** Simple
**Emotion Target:**
- 0–2s: "I see this agent's assigned leads"
- 2–10s: "I can filter by stage or date"
- 10s+: "I click a lead to drill in"

---

#### ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  [continues inside rm-agents-detail-main tab area]                                         │
│                                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ TABS: [ASSIGNED LEADS ◄active]  [PERFORMANCE HISTORY]                               │ │
│  │                                                                                       │ │
│  │  FILTER ROW                                                                          │ │
│  │  [STAGE: ALL ▾]  [DATE RANGE: LAST 7 DAYS ▾]   showing 24 leads                     │ │
│  │  dropdown        dropdown                        STM 13px #7ECFDF                    │ │
│  │                                                                                       │ │
│  │  LEADS TABLE                                                                         │ │
│  │  ──────────────────────────────────────────────────────────────────────────────────  │ │
│  │  LEAD NAME        STAGE           CONTACT DATE    SOURCE      ACTION                 │ │
│  │  Orb 11px col     Orb 11px col    Orb 11px col    Orb 11px    Orb 11px               │ │
│  │  ──────────────────────────────────────────────────────────────────────────────────  │ │
│  │  Jennifer Walsh   NEW LEAD        Mar 30, 09:41   META ADS    VIEW →                 │ │
│  │  STM 13px         status badge    STM 13px        platform    ghost                  │ │
│  │                                                   badge       link                   │ │
│  │  Carlos Reyes     CONTACTED       Mar 29, 14:22   GOOGLE ADS  VIEW →                 │ │
│  │                                                                                       │ │
│  │  Maya Thompson    APPOINTMENT SET Mar 28, 11:05   META ADS    VIEW →                 │ │
│  │                                                                                       │ │
│  │  Andre Williams   CLOSED          Mar 27, 16:33   ORGANIC     VIEW →                 │ │
│  │                                                                                       │ │
│  │  [... more rows ...]                                                                 │ │
│  │                                                                                       │ │
│  │  PAGINATION: ← 1 2 3 → showing 1–10 of 24                                           │ │
│  │  STM 13px                                                                            │ │
│  └───────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                             │
│  [leads-detail-panel slides in from right on row click — defined in FLOW-04]              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Component Specs

**Filter Row**
- Flex row, gap 12px, align-items center, margin-bottom 16px
- Stage dropdown: bg #0A1628, border 1px solid rgba(0,212,255,0.2), border-radius 4px, padding 8px 12px
  - STM 13px #E8F4F8, chevron-down icon 14px #7ECFDF
  - Options: ALL / NEW LEAD / CONTACTED / APPOINTMENT SET / CLOSED / LOST
  - Dropdown menu: bg #0D1E35, border rgba(0,212,255,0.2), radius 4px
  - Option hover: bg rgba(0,212,255,0.08)
- Date Range dropdown: same style
  - Options: TODAY / LAST 7 DAYS / LAST 30 DAYS / THIS MONTH / CUSTOM
- "showing X leads" — STM 13px #7ECFDF, margin-left auto

**Leads Table**
- Full-width, bg transparent (sits inside tab content area)
- Header row: Orbitron 11px #7ECFDF uppercase, padding 12px 16px, border-bottom 1px solid rgba(0,212,255,0.15)
- Data rows: STM 13px #E8F4F8, padding 12px 16px, border-bottom 1px solid rgba(0,212,255,0.06)
- Row hover: bg rgba(0,212,255,0.04), cursor pointer
- Row hover: first-td border-left 2px solid #00D4FF
- Columns:
  - LEAD NAME: STM 13px #E8F4F8
  - STAGE: status badge (see below)
  - CONTACT DATE: STM 13px #7ECFDF
  - SOURCE: platform badge (META/GOOGLE/ORGANIC)
  - ACTION: "VIEW →" ghost link Orbitron 11px #00D4FF

**Stage Badges**
- NEW LEAD: bg rgba(0,212,255,0.12) border rgba(0,212,255,0.4) text #00D4FF
- CONTACTED: bg rgba(255,184,0,0.1) border rgba(255,184,0,0.3) text #FFB800
- APPOINTMENT SET: bg rgba(0,255,136,0.1) border rgba(0,255,136,0.3) text #00FF88
- CLOSED: bg rgba(0,255,136,0.15) border rgba(0,255,136,0.4) text #00FF88
- LOST: bg rgba(255,51,51,0.1) border rgba(255,51,51,0.3) text #FF3333
- All badges: Orbitron 10px uppercase, padding 2px 8px, border-radius 2px

**Platform Badges**
- META: per spec
- GOOGLE: per spec
- ORGANIC: bg rgba(0,255,136,0.1) border rgba(0,255,136,0.3) text #00FF88

**Pagination**
- Flex row, gap 8px, margin-top 16px, align-items center
- Current page number: STM 13px #00D4FF
- Other page numbers: STM 13px #7ECFDF, hover #E8F4F8
- Prev/Next arrows: ChevronLeft / ChevronRight Lucide 16px #7ECFDF, hover #00D4FF, disabled #2A4A5A
- "showing X–Y of Z" — STM 13px #7ECFDF, margin-left auto

---

#### Animation Spec

| Element | Animation | Duration |
|---|---|---|
| Tab content enter | fade-in | 200ms ease-out |
| Table rows | stagger slide-up 40ms per row | 300ms |
| Lead detail panel | slide-in from right 300px | 300ms spring |
| Filter change | table rows fade + reload | 150ms |

---

#### Interactive States

| Element | Default | Hover | Click |
|---|---|---|---|
| Table row | default | bg rgba(0,212,255,0.04), border-left 2px #00D4FF | open leads-detail-panel |
| "VIEW →" link | text #00D4FF | text #1ADCFF | open leads-detail-panel |
| Stage dropdown | border rgba(0,212,255,0.2) | border rgba(0,212,255,0.4) | open dropdown |
| Pagination numbers | #7ECFDF | #E8F4F8 | change page |

---

#### Data Requirements

```typescript
interface AgentLeadsQuery {
  agentId: string;
  stage?: 'NEW_LEAD' | 'CONTACTED' | 'APPOINTMENT_SET' | 'CLOSED' | 'LOST';
  dateRange?: 'TODAY' | 'LAST_7' | 'LAST_30' | 'THIS_MONTH';
  page: number;
  pageSize: number; // default 10
}

interface AgentLeadsResponse {
  leads: Lead[]; // Lead type from FLOW-04
  total: number;
  page: number;
  pageSize: number;
}

// API: GET /api/agents/:agentId/leads?stage=&dateRange=&page=&pageSize=
```

---

### 4.5 Screen: `rm-agents-empty`

**Screen ID:** rm-agents-empty
**Priority:** P1
**Route:** `/agents` (when agents.length === 0)
**Complexity:** Simple
**Load Complexity:** Simple
**Emotion Target:**
- 0–2s: "No agents yet — I need to add my team"
- 2–10s: "Clear path to get started"

---

#### ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ bg: #050D1A                                                                                 │
│                                                                                             │
│ ┌──────────┐ ┌─────────────────────────────────────────────────────────────────────────┐   │
│ │ SIDEBAR  │ │ HEADER                                                                  │   │
│ │ AGENTS ◄ │ │  [≡] RAINMACHINE            [Marcus Johnson ▾]  [●] SYSTEM ONLINE       │   │
│ │          │ └─────────────────────────────────────────────────────────────────────────┘   │
│ │          │                                                                               │
│ │          │ ┌─────────────────────────────────────────────────────────────────────────┐   │
│ │          │ │                                                                         │   │
│ │          │ │                                                                         │   │
│ │          │ │                                                                         │   │
│ │          │ │                          [Users icon]                                   │   │
│ │          │ │                          Lucide Users 32px                              │   │
│ │          │ │                          color #7ECFDF                                  │   │
│ │          │ │                                                                         │   │
│ │          │ │                    NO AGENTS CONFIGURED                                 │   │
│ │          │ │                    Orbitron 13px 600 #7ECFDF uppercase                  │   │
│ │          │ │                    letter-spacing 0.12em                                │   │
│ │          │ │                                                                         │   │
│ │          │ │        Add your sales team to begin routing leads and                   │   │
│ │          │ │        tracking performance. Each agent will receive                    │   │
│ │          │ │        their own dashboard and lead queue.                              │   │
│ │          │ │        Inter 15px #7ECFDF max-width 400px centered                      │   │
│ │          │ │                                                                         │   │
│ │          │ │                ┌──────────────────────────┐                             │   │
│ │          │ │                │  ADD FIRST AGENT →        │                            │   │
│ │          │ │                │  Primary button           │                            │   │
│ │          │ │                │  bg #00D4FF text #050D1A  │                            │   │
│ │          │ │                └──────────────────────────┘                             │   │
│ │          │ │                                                                         │   │
│ │          │ │                                                                         │   │
│ │          │ └─────────────────────────────────────────────────────────────────────────┘   │
│ └──────────┘                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Component Specs

**Empty State Container**
- Full content area: display flex, flex-direction column, align-items center, justify-content center
- min-height: calc(100vh - 56px - 80px) (subtracting header + page header)
- padding: 80px 24px

**Users Icon**
- Lucide `Users` component
- size: 32px, color: #7ECFDF
- margin-bottom: 20px

**Heading**
- "NO AGENTS CONFIGURED"
- Orbitron 13px 600 #7ECFDF uppercase letter-spacing 0.12em
- margin-bottom: 12px

**Body Text**
- Inter 15px #7ECFDF
- max-width: 400px, text-align: center, line-height: 1.6
- margin-bottom: 32px

**CTA Button**
- "ADD FIRST AGENT →" — Primary button spec
- bg: #00D4FF, text: #050D1A
- Orbitron 600 13px uppercase letter-spacing 0.1em
- padding: 12px 24px, border-radius: 4px
- hover: bg #1ADCFF, box-shadow: `0 0 20px rgba(0,212,255,0.3)`
- onClick: navigate to `/settings/team`

---

#### Animation Spec

| Element | Animation | Duration |
|---|---|---|
| Icon | fade-in + scale from 0.8 | 400ms ease-out |
| Heading | fade-in slide-up 8px | 400ms 100ms delay |
| Body text | fade-in | 300ms 200ms delay |
| CTA button | fade-in slide-up 8px | 400ms 300ms delay |

---

#### Interactive States

| Element | Default | Hover | Click |
|---|---|---|---|
| "ADD FIRST AGENT →" | bg #00D4FF | bg #1ADCFF + glow | navigate /settings/team |

---

#### Data Requirements

```typescript
// This screen renders when:
// GET /api/agents returns { agents: [] }
// No additional data requirements
// CTA links to /settings/team (settings flow, FLOW-08)
```

---

## 5. Stack Integration

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 App Router | Routes under `/agents/*` |
| Auth | Clerk | Operator session required |
| State | Zustand | agentStore: agents[], routingConfig, selectedAgentId |
| API | tRPC or REST | GET /api/agents, /api/agents/:id, /api/agents/:id/leads, /api/agents/routing |
| Charts | Recharts | Line chart (agent performance), sparklines (custom SVG) |
| Progress Rings | Custom SVG component | ProgressRing.tsx with LG/MD/SM size props |
| Icons | Lucide React | Users, ChevronRight, ChevronLeft, TrendingUp, Voicemail |
| Routing Diagram | Custom SVG or React Flow lite | Static SVG preferred for performance |
| Real-time | Polling every 60s | Status dots update; use React Query refetchInterval |
| Fonts | Google Fonts | Orbitron 400/600, Share Tech Mono 400, Inter 400/500 |

**Component Tree (agents section)**
```
AgentsLayout
├── AgentsSummaryMetrics
├── AgentGrid
│   └── AgentPanelCard (× n)
│       ├── AgentAvatar
│       ├── StatusDot
│       ├── RoleBadge
│       ├── AgentMetrics
│       ├── ProgressRing (MD)
│       ├── Sparkline
│       └── RoutingBadge
├── AgentRoutingView
│   ├── RoutingDiagram (SVG)
│   └── RoutingRulesTable
├── AgentDetailPage
│   ├── AgentHeaderCard
│   ├── AgentKeyMetrics
│   ├── ProgressRing (LG)
│   ├── PerformanceChart
│   └── AgentDetailTabs
│       ├── AssignedLeadsTab
│       └── PerformanceHistoryTab
└── AgentsEmptyState
```

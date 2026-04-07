# Flow PRD: RainMachine Lead Management
**Flow ID:** F-04 | **App:** RainMachine Dashboard | **Platform:** Web — desktop-first | **Date:** 2026-03-30 | **Status:** Ready for Implementation | **Screens:** 8

---

## 1. Flow Metadata

| Property | Value |
|---|---|
| **Entry Points** | Sidebar LEADS nav item, dashboard pipeline "VIEW ALL →" link |
| **Exit Points** | Any sidebar nav item, browser back, breadcrumb navigation |
| **Primary User** | Marcus (client operator / business owner) |
| **Dependencies** | RainMachine API (leads, agents, call logs, appointments), Claude AI API (call summaries), RainMachine AI Dialer (call status), WebSocket for live lead arrivals |
| **URL Prefix** | `/leads` |
| **Auth Required** | Yes — JWT session |

---

## 1A. UI Profile Compliance

- All table headers: Orbitron 11px UPPERCASE — never Inter or STM for labels.
- All table cell data values: Share Tech Mono 13px.
- Stage badges: use LEAD STAGE BADGES spec exactly — no custom colors or radius changes.
- Side detail panel: 400px fixed right, translate-x animation, dark overlay behind — no modal.
- Reassign modal: centered overlay (not side panel), z-index 40.
- No emoji icons. Lucide React only for all icons.
- Filter bar dropdowns: JARVIS INPUT FIELD spec. No native browser selects styled inline.
- "No leads" copy: exact string "AWAITING INCOMING SIGNALS" — not paraphrased.
- Lead avatar circles: Orbitron initials, not photos (no images unless provided by API).
- Row click opens side panel — NOT a new page navigation (on main list).
- "VIEW FULL PROFILE →" from the side panel navigates to full-page view.

---

## 2. CMO Context

Marcus uses the Leads view every morning and throughout the day to triage, inspect, and act. The goal is zero friction between "I see a lead" and "I know everything about that lead and what to do next."

**Core jobs-to-be-done:**

| Job | How RainMachine Does It |
|---|---|
| "Show me all leads and their status at a glance" | Scannable table with stage badges, agent column, last contact timestamp |
| "Tell me what the AI said on that call" | AI Intelligence Summary in side panel — no hunting through call logs |
| "Who's handling this lead and are they on it?" | Agent column + status dot in detail panel |
| "This lead should go to a different agent" | Reassign modal accessible from side panel in 2 clicks |
| "Did this lead show up for their appointment?" | Appointment status in panel and full-page tab |
| "What happened on every call attempt?" | Call History tab in full profile |

**Friction eliminated:**

| Old Friction | RainMachine Solution |
|---|---|
| Logging into CRM + dialer separately | All lead data + AI call logs in one view |
| Reading 10-minute call transcripts | Claude AI summary: 3 sentences, key outcomes |
| Manually reassigning leads in spreadsheets | Reassign modal with agent status dots |
| Not knowing if appointment reminders fired | Reminder log in appointment tab |
| Losing leads in filter noise | Filtered empty state with active-filter tags and CLEAR ALL |

---

## 3. User Journey

```
[Sidebar: LEADS]
      │
      ▼
┌──────────────────────┐
│  rm-leads-main       │ ─── no leads ──────────────────────────► rm-leads-empty
│  Lead list table     │                                           (auto-refresh on 1st lead)
│  /leads              │ ─── filter with no results ─────────────► rm-leads-filtered-empty
└──────────────────────┘                                           (CLEAR ALL → back to main)
      │
      │ row click
      ▼
┌──────────────────────┐
│ rm-leads-detail-panel│ ◄── X close ── (back to main with panel closed)
│ 400px side panel     │
│ (overlays table)     │ ─── reassign → ─────────────────────────► rm-leads-reassign-modal
└──────────────────────┘                                           (confirm/cancel → back to panel)
      │
      │ "VIEW FULL PROFILE →"
      ▼
┌──────────────────────┐
│ rm-leads-detail-full │ ─── [OVERVIEW tab]     (default)
│ /leads/[id]          │ ─── [CALL HISTORY tab] ─────────────────► rm-leads-detail-call-history
│ Full profile page    │ ─── [APPOINTMENT tab]  ─────────────────► rm-leads-detail-appointment
└──────────────────────┘ ─── [NOTES tab]        (in scope: layout only, no separate screen)
      │                  ─── reassign → ─────────────────────────► rm-leads-reassign-modal
      │
      │ back arrow / breadcrumb
      ▼
  rm-leads-main
```

---

## 4. Screen Specifications

---

### 4.1 Screen: `rm-leads-main`
**Title:** Lead Acquisition Intelligence
**Priority:** P0 | **Complexity:** High | **URL:** `/leads`

#### 4.1.1 ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [◈ RAINMACHINE]   RainMachine AI                      [● ONLINE]  MON MAR 30 2026  09:41:22  [MJ ▾] │
├────────────┬─────────────────────────────────────────────────────────────────────────────────────────┤
│            │  RAINMACHINE / LEADS                                                    [⊞ TABLE] [≡ CARD]│
│ ◈ DASH     ├─────────────────────────────────────────────────────────────────────────────────────────┤
│            │                                                                                          │
│ ◈ LEADS    │  ┌─ FILTER BAR ─────────────────────────────────────────────────────────────────────┐   │
│ [active]   │  │  [Stage ▾]  [Source ▾]  [Agent ▾]  [Date Range ▾]  [🔍 Search leads...]  [CLEAR] │   │
│            │  └──────────────────────────────────────────────────────────────────────────────────┘   │
│ ◈ AGENTS   │                                                                                          │
│            │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    [EXPORT →]   │
│ ◈ CAMPAIGNS│  │ TOTAL LEADS  │  │ NEW TODAY    │  │ AVG CPL      │                                  │
│            │  │   1,247      │  │  +23  ▲+4    │  │  $47.82      │                                  │
│ ◈ REPORTS  │  │  all time    │  │  today       │  │  30-day avg  │                                  │
│            │  └──────────────┘  └──────────────┘  └──────────────┘                                  │
│ ─────────  │                                                                                          │
│ ◈ SETTINGS │  ┌─ LEADS TABLE ────────────────────────────────────────────────────────────────────┐   │
│            │  │ LEAD               │ STAGE      │ SOURCE    │ AGENT    │ LAST CONTACT │ AI CALL  │ ○ │
│            │  ├────────────────────┼────────────┼───────────┼──────────┼──────────────┼──────────┤   │
│            │  │ [JS] John Smith    │ [NEW]      │ Meta      │ Sarah K. │ 2h ago       │ ANSWERED │ … │
│            │  │      Apex Roofing  │            │           │          │ 09:12        │ 1 call   │   │
│            │  ├────────────────────┼────────────┼───────────┼──────────┼──────────────┼──────────┤   │
│            │  │ [MT] Maria Torres  │ [CONTACTED]│ Google    │ James T. │ 5h ago       │ VOICEMAIL│ … │
│            │  │      Torres HVAC   │            │           │          │ 06:30        │ 2 calls  │   │
│            │  ├────────────────────┼────────────┼───────────┼──────────┼──────────────┼──────────┤   │
│            │  │ [RB] Robert Burns  │ [APPT SET] │ Organic   │ Sarah K. │ 1d ago       │ ANSWERED │ … │
│            │  │      Burns Windows │            │           │          │ Yesterday    │ 3 calls  │   │
│            │  ├────────────────────┼────────────┼───────────┼──────────┼──────────────┼──────────┤   │
│            │  │ [AJ] Angela James  │ [CLOSED]   │ Meta      │ Mike R.  │ 3d ago       │ ANSWERED │ … │
│            │  │      AJ Plumbing   │            │           │          │ Mar 27       │ 2 calls  │   │
│            │  ├────────────────────┼────────────┼───────────┼──────────┼──────────────┼──────────┤   │
│            │  │ [DL] David Lee     │ [LOST]     │ Google    │ James T. │ 4d ago       │ NO ANSWR │ … │
│            │  │      Lee Electric  │            │           │          │ Mar 26       │ 4 calls  │   │
│            │  ├────────────────────┴────────────┴───────────┴──────────┴──────────────┴──────────┤   │
│            │  │  ... more rows ...                                                                 │   │
│            │  ├────────────────────────────────────────────────────────────────────────────────────┤   │
│            │  │  Showing 1-25 of 1,247  |  [← PREV]  1  2  3  ...  50  [NEXT →]                  │   │
│            │  └────────────────────────────────────────────────────────────────────────────────────┘   │
└────────────┴─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.1.2 Filter Bar

```
Container:
  bg: rgba(0,212,255,0.04) | border: 1px solid rgba(0,212,255,0.1) | radius: 4px
  padding: 12px 16px | display: flex | align-items: center | gap: 12px | flex-wrap: wrap
  margin-bottom: 16px

Filter Dropdowns (Stage, Source, Agent, Date Range):
  Trigger button style:
    bg: rgba(0,212,255,0.04) | border: 1px solid rgba(0,212,255,0.2) | radius: 4px
    padding: 8px 12px | display: flex | align-items: center | gap: 8px
    Orbitron 11px UPPERCASE 0.1em | color: #7ECFDF
    Lucide ChevronDown 12px | color: #7ECFDF
    hover: border rgba(0,212,255,0.4), color #E8F4F8
    active/open: border #00D4FF, color #00D4FF, shadow 0 0 0 3px rgba(0,212,255,0.15)

  Dropdown panel:
    position: absolute | bg: #0A1628 | border: 1px solid rgba(0,212,255,0.4)
    radius: 4px | padding: 8px 0 | z-index: 20 | min-width: 180px
    shadow: 0 8px 32px rgba(0,0,0,0.6)
    Animation: fade-in + slide-down 4px, 150ms ease-out

  Dropdown options:
    padding: 10px 16px | Inter 14px | color: #E8F4F8
    hover: bg rgba(0,212,255,0.08), color #00D4FF
    selected: color #00D4FF | Lucide Check 12px right-aligned
    Orbitron 10px label for group headers if needed

  Stage options: ALL / NEW / CONTACTED / APPT SET / CLOSED / LOST
    — render with stage badge colors, not plain text
  Source options: ALL / META / GOOGLE / ORGANIC / REFERRAL / OTHER
  Agent options: ALL / [agent name with status dot] per agent
  Date options: TODAY / LAST 7 DAYS / LAST 30 DAYS / THIS MONTH / CUSTOM

Search input:
  flex: 1 | min-width: 200px
  bg: rgba(0,212,255,0.04) | border: 1px solid rgba(0,212,255,0.2) | radius: 4px
  padding: 8px 12px | Inter 14px | color: #E8F4F8 | placeholder: "Search leads..." | color: #2A4A5A
  Lucide Search 14px left | color: #2A4A5A
  focus: border #00D4FF, shadow 0 0 0 3px rgba(0,212,255,0.15), icon color #00D4FF
  Debounce: 300ms on input before firing filter

CLEAR FILTERS link:
  Orbitron 11px UPPERCASE | color: #00D4FF | margin-left: auto
  ::after content '→' | hover: color #1ADCFF
  Only visible when any filter is active (JS conditional)
  click: reset all filters to defaults, refetch
```

#### 4.1.3 Summary Metrics Row

```
3-card row, display: flex, gap: 12px, margin-bottom: 16px

Each metric card:
  bg: rgba(0,212,255,0.04) | border: 1px solid rgba(0,212,255,0.08) | radius: 4px
  padding: 16px 20px | min-width: 160px

  label: Orbitron 10px 0.12em UPPERCASE | color: #7ECFDF | margin-bottom: 4px
  value: STM 28px | color: #E8F4F8
  sub-text: Inter 12px | color: #2A4A5A

TOTAL LEADS:
  label: "TOTAL LEADS"
  value: "1,247"
  sub: "all time"

NEW TODAY:
  label: "NEW TODAY"
  value: "23"
  delta: "+4 ▲" inline | STM 13px #00FF88 | Lucide TrendingUp 12px
  sub: "today"

AVG CPL:
  label: "AVG CPL"
  value: "$47.82"
  sub: "30-day avg"

EXPORT button (right-aligned, outside metric cards):
  position: absolute right 24px / flex margin-left: auto
  "EXPORT →" | Ghost button | Orbitron 11px UPPERCASE | color: #00D4FF
  Lucide Download 14px icon
  hover: color #1ADCFF
  click: triggers CSV export of current filtered view
```

#### 4.1.4 View Toggle

```
[⊞ TABLE] [≡ CARD] toggle group — top right of breadcrumb area
  bg: rgba(0,212,255,0.04) | border: 1px solid rgba(0,212,255,0.2) | radius: 4px
  Each button: padding 6px 12px | Lucide icon 14px

  Active tab: bg rgba(0,212,255,0.12), border-color rgba(0,212,255,0.4), icon #00D4FF
  Inactive tab: bg transparent, icon #7ECFDF | hover: icon #E8F4F8

  Default: TABLE view
  Card view: renders same data as 3-column card grid (card anatomy mirrors detail panel but compact)
  State persisted in localStorage key: "rm_leads_view_mode"
```

#### 4.1.5 Data Table

```
Container:
  bg: #0A1628 | border: 1px solid rgba(0,212,255,0.2) | radius: 4px
  overflow: hidden | width: 100%

Table header row:
  bg: rgba(0,212,255,0.04) | border-bottom: 1px solid rgba(0,212,255,0.15)

  Column headers (Orbitron 11px UPPERCASE 0.1em, #7ECFDF, padding 12px 16px):
    LEAD       — flex-direction col: avatar+name+org | min-width: 220px
    STAGE      — 110px
    SOURCE     — 90px
    AGENT      — 120px
    LAST CONTACT — 130px
    AI CALL    — 110px
    [actions]  — 40px (⋯ icon column)

  Sortable columns: LEAD (alpha), STAGE, LAST CONTACT, AI CALL count
    Sort indicator: Lucide ArrowUp/ArrowDown 12px inline | #00D4FF when active sort

Table rows:
  border-bottom: 1px solid rgba(0,212,255,0.06)
  padding: 12px 16px per cell | STM 13px | color: #E8F4F8

  Row default: bg transparent
  Row alt (even): bg rgba(0,212,255,0.02)
  Row hover: bg rgba(0,212,255,0.04), first-td: border-left 2px solid #00D4FF
  Row cursor: pointer (full row clickable → opens side panel)

LEAD cell (combined):
  display: flex | align-items: center | gap: 12px
  Avatar circle: 32px, bg rgba(0,212,255,0.1), border 1px solid rgba(0,212,255,0.3), radius: 50%
    Initials: Orbitron 11px 600 | color: #00D4FF
  Name: STM 13px #E8F4F8 (bold weight)
  Org: Inter 12px #7ECFDF (below name, second line)

STAGE cell:
  Renders LEAD STAGE BADGE exactly per spec
  Orbitron 10px UPPERCASE 0.1em | padding 3px 10px | radius 2px

SOURCE cell:
  bg: rgba(0,212,255,0.06) | border: 1px solid rgba(0,212,255,0.15) | radius: 2px
  padding: 2px 8px | Orbitron 10px UPPERCASE | color: #7ECFDF
  Source-specific colors:
    META: color #00D4FF | bg rgba(0,212,255,0.08)
    GOOGLE: color #FFB800 | bg rgba(255,184,0,0.08)
    ORGANIC: color #00FF88 | bg rgba(0,255,136,0.08)

AGENT cell:
  StatusDot 6px inline (agent status) | margin-right 6px
  Agent name: STM 13px #E8F4F8

LAST CONTACT cell:
  Relative time: "2h ago" / "1d ago" / "3d ago" | STM 13px #7ECFDF
  Absolute time: "09:12" / "Yesterday" | STM 11px #2A4A5A (second line)
  If >7 days: color: #FF7D52 (stale warning)

AI CALL cell:
  Outcome badge + call count:
    ANSWERED:  bg rgba(0,255,136,0.08) border rgba(0,255,136,0.3) text #00FF88 | Lucide Phone 10px
    VOICEMAIL: bg rgba(0,212,255,0.08) border rgba(0,212,255,0.2) text #7ECFDF  | Lucide Voicemail 10px
    NO ANSWER: bg rgba(255,107,53,0.08) border rgba(255,107,53,0.2) text #FF7D52 | Lucide PhoneMissed 10px
    CALLBACK:  bg rgba(255,184,0,0.08) border rgba(255,184,0,0.3) text #FFB800  | Lucide PhoneCall 10px
    Orbitron 10px UPPERCASE 0.1em | padding 2px 8px | radius 2px
  Call count: "N calls" | STM 11px #2A4A5A | second line

Actions cell (⋯):
  Lucide MoreHorizontal 16px | color: #2A4A5A | hover: #7ECFDF
  click: context menu (positioned relative to cell):
    "VIEW DETAILS"    | Inter 14px | → opens side panel
    "VIEW FULL PROFILE" | → navigates to full profile
    "REASSIGN AGENT"  | → opens reassign modal
    "MARK AS LOST"    | → confirmation inline
    Divider + "DELETE LEAD" | color #FF7D52

Pagination:
  border-top: 1px solid rgba(0,212,255,0.1) | padding: 12px 16px
  display: flex | align-items: center | justify-content: space-between
  Left: "Showing 1–25 of 1,247" | Inter 13px | color: #7ECFDF
  Right: pagination controls
    [← PREV] | [1] [2] [3] [...] [50] | [NEXT →]
    Page numbers: Orbitron 11px | inactive: #2A4A5A | active: #00D4FF, border 1px solid rgba(0,212,255,0.4)
    PREV/NEXT: Ghost button style
    Page size selector: "25 per page ▾" | Orbitron 11px | color: #7ECFDF
```

---

### 4.2 Screen: `rm-leads-detail-panel`
**Title:** Lead Intelligence Panel
**Priority:** P0 | **Complexity:** High | **Type:** Fixed right overlay panel

#### 4.2.1 ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [◈ RAINMACHINE]   RainMachine AI                      [● ONLINE]  MON MAR 30 2026  09:41:22  [MJ ▾] │
├────────────┬────────────────────────────────────────────────────────────────┬────────────────────────┤
│            │  RAINMACHINE / LEADS                         [⊞][≡]            │  ← side panel trigger  │
│ ◈ DASH     ├────────────────────────────────────────────────────────────────┤                        │
│            │                                                                 │  [←] LEAD DETAILS   [X]│
│ ◈ LEADS    │  [lead table — dimmed, pointer-events:none while panel open]   │  ─────────────────────  │
│ [active]   │                                                                 │                        │
│            │  Row highlight: selected row maintains                         │  ┌──────────────────┐  │
│ ◈ AGENTS   │  bg rgba(0,212,255,0.06),                                      │  │ [JS]             │  │
│            │  border-left 2px solid #00D4FF                                 │  │ John Smith       │  │
│ ◈ CAMPAIGNS│                                                                 │  │ Apex Roofing     │  │
│            │                                                                 │  │ [NEW] [Meta]     │  │
│ ◈ REPORTS  │                                                                 │  └──────────────────┘  │
│            │                                                                 │                        │
│ ─────────  │                                                                 │  AI INTELLIGENCE       │
│ ◈ SETTINGS │                                                                 │  ─────────────────     │
│            │                                                                 │  "Lead expressed strong │
│            │                                                                 │  interest in 3-unit     │
│            │                                                                 │  installation. Budget   │
│            │                                                                 │  confirmed at $8k. Call │
│            │                                                                 │  back requested Fri AM."│
│            │                                                                 │                        │
│            │                                                                 │  CONTACT TIMELINE      │
│            │                                                                 │  ─────────────────     │
│            │                                                                 │  ● 09:12 ANSWERED      │
│            │                                                                 │  │  Duration: 4m 22s   │
│            │                                                                 │  ● 08:30 NO ANSWER     │
│            │                                                                 │  │  Attempt 1          │
│            │                                                                 │  ○ Lead created 08:15  │
│            │                                                                 │                        │
│            │                                                                 │  ASSIGNED AGENT        │
│            │                                                                 │  ─────────────────     │
│            │                                                                 │  [●] Sarah K.          │
│            │                                                                 │  Senior Agent          │
│            │                                                                 │  REASSIGN →            │
│            │                                                                 │                        │
│            │                                                                 │  APPOINTMENT           │
│            │                                                                 │  ─────────────────     │
│            │                                                                 │  NO APPOINTMENT SET    │
│            │                                                                 │  AI WILL CALL FRIDAY   │
│            │                                                                 │                        │
│            │                                                                 │  ─────────────────     │
│            │                                                                 │  [VIEW FULL PROFILE →] │
│            │                                                                 │  ─────────────────     │
└────────────┴────────────────────────────────────────────────────────────────┴────────────────────────┘
              ← main content dim overlay (rgba 0,0,0,0.3) ────────────────────►
```

#### 4.2.2 Panel Anatomy

```
Container:
  position: fixed | right: 0 | top: 52px (below header) | width: 400px
  height: calc(100vh - 52px) | overflow-y: auto
  bg: #0A1628 | border-left: 1px solid rgba(0,212,255,0.2)
  z-index: 30

Animation:
  enter: transform translateX(100%) → translateX(0), 300ms cubic-bezier(0.25,0.46,0.45,0.94)
  exit: transform translateX(0) → translateX(100%), 250ms ease-in
  Simultaneously: overlay behind fades in from opacity 0 → 0.3 on same timing

Overlay behind panel:
  position: fixed | inset: 52px 400px 0 240px (fills main content behind panel)
  bg: rgba(0,0,0,0.3) | z-index: 29
  click: closes panel (same as [X])
```

#### 4.2.3 Panel Header

```
padding: 20px 20px 16px
display: flex | align-items: center | justify-content: space-between
border-bottom: 1px solid rgba(0,212,255,0.1)

Left:
  Lucide ChevronLeft 16px | color: #7ECFDF | cursor: pointer | hover: color #E8F4F8
  "LEAD DETAILS" | Orbitron 11px 0.12em UPPERCASE | color: #7ECFDF | margin-left: 8px

Right:
  Lucide X 16px | color: #7ECFDF | cursor: pointer | hover: color #E8F4F8 | padding: 4px
```

#### 4.2.4 Lead Header Section

```
padding: 20px 20px 16px
border-bottom: 1px solid rgba(0,212,255,0.08)

Avatar:
  Circle 48px | bg: rgba(0,212,255,0.1) | border: 1px solid rgba(0,212,255,0.3) | radius: 50%
  Initials: Orbitron 16px 600 | color: #00D4FF

Name:
  Orbitron 16px 600 0.04em | color: #E8F4F8 | margin-top: 12px

Organization:
  Inter 14px | color: #7ECFDF | margin-top: 4px

Badge row (gap 8px, margin-top 10px):
  Stage badge (LEAD STAGE BADGE spec)
  Source badge (SOURCE badge spec from table)
  Lead ID: "ID: #4821" | STM 11px | color: #2A4A5A
```

#### 4.2.5 Section: AI INTELLIGENCE SUMMARY

```
padding: 20px | border-bottom: 1px solid rgba(0,212,255,0.08)

Section header:
  display: flex | align-items: center | gap: 8px | margin-bottom: 12px
  Lucide Bot 14px | color: #00D4FF
  "AI INTELLIGENCE SUMMARY" | Orbitron 11px 0.12em UPPERCASE | color: #7ECFDF

Summary body:
  bg: rgba(0,212,255,0.04) | border: 1px solid rgba(0,212,255,0.08) | radius: 4px | padding: 14px
  Inter 14px | color: #E8F4F8 | line-height: 1.65
  Generated by Claude from call transcripts

  If no calls yet:
    Orbitron 11px | color: #2A4A5A | text-align: center
    "NO CALLS RECORDED YET"
    Inter 13px #2A4A5A "AI will generate summary after first call attempt."
```

#### 4.2.6 Section: CONTACT TIMELINE

```
padding: 20px | border-bottom: 1px solid rgba(0,212,255,0.08)

Section header:
  "CONTACT TIMELINE" | Orbitron 11px 0.12em UPPERCASE | color: #7ECFDF | margin-bottom: 12px

Timeline list (max 5 entries shown, "VIEW ALL →" if more):
  Each timeline item:
    display: flex | gap: 12px

    Left: vertical timeline track
      Line: 1px solid rgba(0,212,255,0.15) | width: 1px | stretch between dots
      Dot: 8px circle, positioned on line
        ANSWERED: bg #00FF88, glow 0 0 4px #00FF88
        VOICEMAIL: bg #7ECFDF
        NO ANSWER: bg #FF7D52
        LEAD CREATED: bg rgba(0,212,255,0.4), border 1px solid #00D4FF

    Right: content
      Top row:
        Time: STM 12px #7ECFDF (relative + absolute)
        Outcome badge (small): Orbitron 9px UPPERCASE, appropriate color, padding 2px 6px
      Body:
        If ANSWERED: "Duration: 4m 22s" | STM 12px | color: #E8F4F8
        If VOICEMAIL: "Voicemail left" | Inter 12px | color: #7ECFDF
        If NO ANSWER: "No answer — attempt [N]" | Inter 12px | color: #7ECFDF
        If LEAD CREATED: "Lead captured from [source]" | Inter 12px | color: #7ECFDF

"VIEW ALL →" link (if >5 events):
  Ghost button | Orbitron 10px UPPERCASE | color: #00D4FF | margin-top: 8px
  → navigates to full profile Call History tab
```

#### 4.2.7 Section: ASSIGNED AGENT

```
padding: 20px | border-bottom: 1px solid rgba(0,212,255,0.08)

Section header:
  "ASSIGNED AGENT" | Orbitron 11px 0.12em UPPERCASE | color: #7ECFDF | margin-bottom: 12px

Agent row:
  display: flex | align-items: center | gap: 12px
  StatusDot 8px (appropriate agent status color + animation)
  Agent name: Orbitron 13px 600 | color: #E8F4F8
  Role: Inter 12px | color: #7ECFDF | margin-left: 4px

"REASSIGN →" link:
  Ghost button | Orbitron 11px UPPERCASE | color: #00D4FF | margin-top: 10px
  hover: color #1ADCFF
  click: → opens rm-leads-reassign-modal (keeping panel open underneath)
```

#### 4.2.8 Section: APPOINTMENT

```
padding: 20px | border-bottom: 1px solid rgba(0,212,255,0.08)

Section header:
  "APPOINTMENT" | Orbitron 11px 0.12em UPPERCASE | color: #7ECFDF | margin-bottom: 12px

State A — Appointment set:
  bg: rgba(0,255,136,0.04) | border: 1px solid rgba(0,255,136,0.15) | radius: 4px | padding: 14px
  Lucide Calendar 14px | color: #00FF88 | top-right
  Date: STM 16px | color: #E8F4F8 | e.g. "FRI APR 04 2026"
  Time: STM 14px | color: #00D4FF | e.g. "10:00 AM"
  Status badge: CONFIRMED/PENDING/SHOW/NO-SHOW (badge spec)
  "VIEW DETAILS →" | Ghost link | Orbitron 10px | color: #00D4FF
    click → opens rm-leads-detail-appointment

State B — No appointment:
  Orbitron 11px UPPERCASE | color: #2A4A5A | "NO APPOINTMENT SET"
  Inter 13px | color: #2A4A5A | "AI will schedule automatically."
  StatusDot 6px #00D4FF pulse + "AI WILL CALL FRIDAY AM" | STM 12px #00D4FF
```

#### 4.2.9 Panel Footer

```
padding: 20px | position: sticky | bottom: 0 | bg: #0A1628
border-top: 1px solid rgba(0,212,255,0.15)

"VIEW FULL PROFILE →" | Primary button | full-width
  bg: #00D4FF | text: #050D1A | Orbitron 600 13px UPPERCASE 0.1em
  padding: 12px | radius: 4px | text-align: center
  hover: bg #1ADCFF, shadow 0 0 20px rgba(0,212,255,0.3)
  Lucide ArrowRight 14px inline right
  click: → navigates to /leads/[id] (full profile page)
```

---

### 4.3 Screen: `rm-leads-detail-full`
**Title:** Lead Full Profile
**Priority:** P1 | **Complexity:** High | **URL:** `/leads/[id]`

#### 4.3.1 ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [◈ RAINMACHINE]   RainMachine AI                      [● ONLINE]  MON MAR 30 2026  09:41:22  [MJ ▾] │
├────────────┬─────────────────────────────────────────────────────────────────────────────────────────┤
│            │  [←] RAINMACHINE / LEADS / JOHN SMITH                                                   │
│ ◈ DASH     ├─────────────────────────────────────────────────────────────────────────────────────────┤
│            │                                                                                          │
│ ◈ LEADS    │  ┌── LEAD HEADER ────────────────────────────────────────────────────────────────────┐  │
│ [active]   │  │  [JS] John Smith  |  Apex Roofing LLC  |  [NEW]  [Meta]  |  ID: #4821            │  │
│            │  └───────────────────────────────────────────────────────────────────────────────────┘  │
│ ◈ AGENTS   │                                                                                          │
│            │  ┌── LEFT CONTENT (60%) ────────────────────┐  ┌── RIGHT SIDEBAR (40%) ──────────────┐  │
│ ◈ CAMPAIGNS│  │                                          │  │                                      │  │
│            │  │  [OVERVIEW] [CALL HISTORY] [APPOINTMENT] │  │  QUICK STATS                        │  │
│ ◈ REPORTS  │  │  [NOTES]    (tab nav)                    │  │  ─────────────────                  │  │
│            │  │  ──────────────────────────────────────   │  │  Total Calls:    5                  │  │
│ ─────────  │  │                                          │  │  Last Contact:   2h ago              │  │
│ ◈ SETTINGS │  │  (OVERVIEW TAB — default)               │  │  Stage:          [NEW]               │  │
│            │  │                                          │  │  Source:         Meta Ads            │  │
│            │  │  AI INTELLIGENCE SUMMARY                │  │  Created:        Mar 30 09:10        │  │
│            │  │  ──────────────────────────────          │  │                                      │  │
│            │  │  [Bot icon] Claude AI summary paragraph  │  │  ASSIGNED AGENT                     │  │
│            │  │  text goes here — Inter 14px, 3-4 lines  │  │  ─────────────────                  │  │
│            │  │  of context about this lead's intent     │  │  [●] Sarah K.                       │  │
│            │  │                                          │  │  Senior Agent                       │  │
│            │  │  CONTACT TIMELINE                        │  │  [REASSIGN AGENT →]                 │  │
│            │  │  ──────────────────────────────          │  │                                      │  │
│            │  │  ● 09:12  ANSWERED  4m 22s               │  │  QUICK ACTIONS                      │  │
│            │  │  │                                        │  │  ─────────────────                  │  │
│            │  │  ● 08:30  NO ANSWER                      │  │  [SCHEDULE APPT →]                  │  │
│            │  │  │                                        │  │  [MARK AS CLOSED →]                 │  │
│            │  │  ○ 08:15  Lead captured — Meta Ads       │  │  [MARK AS LOST →]                   │  │
│            │  │                                          │  │  [FORCE DIAL NOW →]                  │  │
│            │  │  CONTACT INFO                            │  └──────────────────────────────────────┘  │
│            │  │  ──────────────────────────────          │                                            │
│            │  │  Phone:   (555) 123-4567                 │                                            │
│            │  │  Email:   jsmith@apexroofing.com         │                                            │
│            │  │  Source:  Meta Ads — Ad Set: Q1 Roofers  │                                            │
│            │  │  UTM:     utm_campaign=q1_roofing_2026   │                                            │
│            │  └──────────────────────────────────────────┘                                            │
└────────────┴─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.3.2 Component Specs

**Breadcrumb back nav:**
```
display: flex | align-items: center | gap: 8px | padding: 0 24px | height: 40px
border-bottom: 1px solid rgba(0,212,255,0.08)

[←] back:
  Lucide ArrowLeft 16px | color: #7ECFDF
  hover: color #E8F4F8 | cursor: pointer | click: history.back() or → /leads

Breadcrumb trail:
  "RAINMACHINE" | Orbitron 11px | color: #2A4A5A
  " / " | #2A4A5A
  "LEADS" | Orbitron 11px | color: #2A4A5A | hover: #7ECFDF, cursor: pointer → /leads
  " / " | #2A4A5A
  "JOHN SMITH" | Orbitron 11px | color: #00D4FF (current page — not clickable)
```

**Lead Header Banner:**
```
bg: #0A1628 | border: 1px solid rgba(0,212,255,0.2) | radius: 4px | padding: 20px 24px
display: flex | align-items: center | gap: 16px | margin-bottom: 20px

Avatar: 48px circle | bg rgba(0,212,255,0.1) | border 1px solid rgba(0,212,255,0.3)
  Initials: Orbitron 16px 600 | color: #00D4FF

Content:
  Name: Orbitron 18px 600 0.04em | color: #E8F4F8
  Org: Inter 14px | color: #7ECFDF | margin-top: 2px
  Badge row: stage badge + source badge + "ID: #4821" STM 11px #2A4A5A
```

**2-column layout:**
```
display: grid | grid-template-columns: 1fr 0.65fr | gap: 20px | align-items: start
```

**Tab navigation:**
```
display: flex | gap: 0 | border-bottom: 1px solid rgba(0,212,255,0.1) | margin-bottom: 20px

Tab button:
  padding: 10px 20px | Orbitron 11px 0.1em UPPERCASE
  border-bottom: 2px solid transparent | margin-bottom: -1px

  DEFAULT: color #7ECFDF | border-bottom-color transparent
    hover: color #E8F4F8

  ACTIVE: color #00D4FF | border-bottom: 2px solid #00D4FF

Tabs: OVERVIEW | CALL HISTORY | APPOINTMENT | NOTES
```

**Right sidebar — Quick Stats card:**
```
Panel card spec (bg #0A1628, border glow, radius 4px, padding 24px)
Each stat row:
  display: flex | justify-content: space-between | padding: 8px 0
  border-bottom: 1px solid rgba(0,212,255,0.06)
  label: Orbitron 10px UPPERCASE | color: #7ECFDF
  value: STM 13px | color: #E8F4F8
```

**Right sidebar — Quick Actions:**
```
Panel card spec, margin-top 16px

Each action button: full-width, Secondary style, text-align left, margin-bottom 8px
  Lucide icon 14px inline | gap 8px
  Actions:
    Lucide CalendarPlus  "SCHEDULE APPT →"
    Lucide CheckCircle   "MARK AS CLOSED →"
    Lucide XCircle       "MARK AS LOST →"    — color: text #FF7D52, border rgba(255,107,53,0.3) on hover
    Lucide PhoneCall     "FORCE DIAL NOW →"
```

---

### 4.4 Screen: `rm-leads-detail-call-history`
**Title:** Lead Call History Tab
**Priority:** P1 | **Complexity:** Medium | **URL:** `/leads/[id]` (CALL HISTORY tab active)

#### 4.4.1 ASCII Wireframe (tab content only — shell same as 4.3)

```
│  [OVERVIEW] [CALL HISTORY*] [APPOINTMENT] [NOTES]         ← CALL HISTORY tab active
│  ──────────────────────────────────────────────────────
│
│  ┌── CALL HISTORY TABLE ──────────────────────────────────────────────────────────────────────────┐
│  │ DATE / TIME     │ DURATION  │ OUTCOME      │ AI SUMMARY                │ TRANSCRIPT            │
│  ├─────────────────┼───────────┼──────────────┼───────────────────────────┼───────────────────────┤
│  │ MAR 30  09:12   │ 4m 22s    │ [ANSWERED]   │ Lead confirmed interest... │ [VIEW →]              │
│  │                 │           │              │ (expandable snippet)        │                       │
│  ├─────────────────┼───────────┼──────────────┼───────────────────────────┼───────────────────────┤
│  │ MAR 30  08:30   │ 0m 00s    │ [NO ANSWER]  │ —                          │ —                     │
│  ├─────────────────┼───────────┼──────────────┼───────────────────────────┼───────────────────────┤
│  │ MAR 30  08:15   │ 0m 32s    │ [VOICEMAIL]  │ Voicemail left. Script:... │ [VIEW →]              │
│  ├─────────────────┼───────────┼──────────────┼───────────────────────────┼───────────────────────┤
│  │ MAR 29  16:45   │ 0m 00s    │ [NO ANSWER]  │ —                          │ —                     │
│  └─────────────────┴───────────┴──────────────┴───────────────────────────┴───────────────────────┘
│
│  ▼ EXPANDED ROW (ANSWERED — MAR 30 09:12) ────────────────────────────────────────────────────────
│  │  AI SUMMARY (full):
│  │  "Lead expressed strong interest in 3-unit HVAC installation. Confirmed budget range $8k-$12k.
│  │   Decision maker on the call. Requested callback Friday morning. Ask about financing options."
│  │  ── Transcript excerpt:
│  │  AI:   "Are you looking to replace your existing units or is this a new installation?"
│  │  Lead: "It's a replacement — we have three units, all original 2004 equipment."
│  │  AI:   "Got it. Our technician can assess all three. What's your timeline?"
│  │  [VIEW FULL TRANSCRIPT →]
│  └───────────────────────────────────────────────────────────────────────────────────────────────────
```

#### 4.4.2 Component Specs

**Call History Table:**
```
bg: #0A1628 | border: 1px solid rgba(0,212,255,0.2) | radius: 4px | overflow: hidden

Column headers (Orbitron 11px UPPERCASE 0.1em, #7ECFDF, padding 12px 16px):
  DATE / TIME    — 150px
  DURATION       — 90px
  OUTCOME        — 130px
  AI SUMMARY     — flex-1
  TRANSCRIPT     — 100px

Table rows:
  border-bottom: 1px solid rgba(0,212,255,0.06) | STM 13px | color: #E8F4F8
  hover: bg rgba(0,212,255,0.04), cursor: pointer (click to expand)
  expanded row: border-left 2px solid #00D4FF, bg rgba(0,212,255,0.04)

DATE/TIME cell:
  Date: STM 13px #E8F4F8 uppercase (e.g. "MAR 30")
  Time: STM 12px #7ECFDF (second line)

DURATION cell:
  STM 13px | #E8F4F8
  If 0m 00s (no answer/voicemail): color #2A4A5A

OUTCOME badges:
  ANSWERED:  bg rgba(0,255,136,0.12) border rgba(0,255,136,0.4)  text #00FF88 | Lucide Phone 10px
  VOICEMAIL: bg rgba(0,212,255,0.08) border rgba(0,212,255,0.2)  text #7ECFDF | Lucide Voicemail 10px
  NO ANSWER: bg rgba(255,107,53,0.08) border rgba(255,107,53,0.2) text #FF7D52 | Lucide PhoneMissed 10px
  CALLBACK:  bg rgba(255,184,0,0.08) border rgba(255,184,0,0.3)  text #FFB800 | Lucide PhoneCall 10px
  Orbitron 10px UPPERCASE 0.1em | padding 3px 10px | radius 2px

AI SUMMARY cell:
  If no calls: "—" | #2A4A5A
  If available: Inter 13px | color: #7ECFDF | truncated to 1 line with ellipsis
  Expands inline on row click

TRANSCRIPT cell:
  "VIEW →" | Ghost button | Orbitron 10px UPPERCASE | color: #00D4FF
  If no transcript: "—" | #2A4A5A
  click: opens transcript in modal (out of scope for this PRD — placeholder handler)
```

**Expanded row:**
```
display: table-row (or CSS grid child spanning all columns)
bg: rgba(0,212,255,0.02) | border-top: 1px solid rgba(0,212,255,0.08)
padding: 16px 20px 20px | border-left: 3px solid #00D4FF

AI Summary full:
  Section label: "AI SUMMARY" | Orbitron 10px UPPERCASE | color: #7ECFDF | margin-bottom: 8px
  body: Inter 14px | color: #E8F4F8 | line-height: 1.65
  bg: rgba(0,212,255,0.04) | border: 1px solid rgba(0,212,255,0.08) | radius: 4px | padding: 14px

Transcript excerpt (if available):
  Section label: "TRANSCRIPT EXCERPT" | Orbitron 10px UPPERCASE | color: #7ECFDF | margin: 12px 0 8px
  bg: rgba(0,0,0,0.3) | border: 1px solid rgba(0,212,255,0.06) | radius: 4px | padding: 14px
  font-family: Share Tech Mono | font-size: 13px | line-height: 1.6
  Speaker labels: "AI:" color #00D4FF | "LEAD:" color #E8F4F8
  Gradient fade at bottom with "VIEW FULL TRANSCRIPT →" ghost link

Animation:
  Expand: max-height 0 → content height, 250ms ease-out
  Collapse: reverse, 200ms ease-in
```

---

### 4.5 Screen: `rm-leads-detail-appointment`
**Title:** Lead Appointment Detail Tab
**Priority:** P1 | **Complexity:** Medium | **URL:** `/leads/[id]` (APPOINTMENT tab active)

#### 4.5.1 ASCII Wireframe (tab content only)

```
│  [OVERVIEW] [CALL HISTORY] [APPOINTMENT*] [NOTES]    ← APPOINTMENT tab active
│  ─────────────────────────────────────────────────
│
│  ┌─ APPOINTMENT CARD ──────────────────────────────────────────────────────────────────────────┐
│  │                         [CONFIRMED]                                                         │
│  │                                                                                             │
│  │         FRI APR 04 2026                                                                     │
│  │         10:00 AM                                                                            │
│  │                                                                                             │
│  │  Type:     In-Person / Phone / Video                                                        │
│  │  Location: 123 Main St, Atlanta GA (or "Phone Call" / "Zoom")                              │
│  │  Agent:    [●] Sarah K.                                                                     │
│  │  Notes:    "Client prefers morning call. Financing Q likely."                               │
│  │                                                                                             │
│  │  [MARK SHOW ✓]    [MARK NO-SHOW ✗]                                                         │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘
│
│  ┌─ REMINDER LOG ──────────────────────────────────────────────────────────────────────────────┐
│  │  REMINDER LOG                                                                               │
│  │  ──────────────────────────────────────                                                     │
│  │  ● MAR 31  09:00    SMS      "Reminder: appt Apr 4 10am..."  [DELIVERED]                   │
│  │  ● APR 02  09:00    EMAIL    "Your appointment is coming up" [DELIVERED]                   │
│  │  ● APR 03  18:00    SMS      "See you tomorrow at 10am"      [PENDING]                     │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.5.2 Component Specs

**Appointment Card:**
```
Panel card spec | padding: 32px | text-align: center (for date block) | margin-bottom: 20px

Status badge (top right of card, absolute positioned):
  CONFIRMED:  bg rgba(0,255,136,0.12) border rgba(0,255,136,0.4)  text #00FF88
  PENDING:    bg rgba(255,184,0,0.12) border rgba(255,184,0,0.4)  text #FFB800
  SHOW:       bg rgba(0,255,136,0.2)  border rgba(0,255,136,0.6)  text #00FF88
  NO-SHOW:    bg rgba(255,107,53,0.08) border rgba(255,107,53,0.4) text #FF7D52
  Orbitron 10px UPPERCASE 0.1em | padding 4px 12px | radius 2px

Date display (centered):
  Day+Date: STM 32px | color: #E8F4F8 — e.g. "FRI APR 04 2026"
  Time: STM 24px | color: #00D4FF — e.g. "10:00 AM"
  margin-bottom: 24px

Info grid (left-aligned, below date block):
  display: grid | grid-template-columns: 100px 1fr | row-gap: 10px | text-align: left
  label: Orbitron 10px UPPERCASE | color: #7ECFDF
  value: Inter 14px | color: #E8F4F8

CTA row (margin-top: 24px, display: flex, gap: 12px):
  "MARK SHOW" button:
    Secondary button | border rgba(0,255,136,0.4) | text #00FF88
    Lucide CheckCircle 14px | hover: bg rgba(0,255,136,0.08)
    Visible only when status is CONFIRMED or PENDING
    click: confirmation inline (changes status → SHOW, disables button)

  "MARK NO-SHOW" button:
    Secondary button | border rgba(255,107,53,0.3) | text #FF7D52
    Lucide XCircle 14px | hover: bg rgba(255,107,53,0.06)
    Visible only when status is CONFIRMED or PENDING
    click: confirmation inline (changes status → NO-SHOW, disables button)

  If status already SHOW or NO-SHOW: buttons hidden, show "STATUS RECORDED [timestamp]" STM 12px #7ECFDF
```

**Appointment empty state:**
```
If no appointment set:
  min-height: 160px | display: flex | flex-direction: column | align-items: center | justify-content: center
  Lucide CalendarOff 24px | color: rgba(0,212,255,0.2)
  "NO APPOINTMENT SET" | Orbitron 11px UPPERCASE | color: #2A4A5A | margin-top: 12px
  Inter 13px | color: #2A4A5A | "AI will schedule upon next positive contact."
  "SCHEDULE MANUALLY →" | Ghost button | Orbitron 11px | color: #00D4FF | margin-top: 16px
```

**Reminder Log:**
```
Panel card spec | margin-top: 16px

Header: "REMINDER LOG" | Orbitron 11px 0.12em UPPERCASE | color: #7ECFDF

Each reminder row:
  display: flex | align-items: center | gap: 12px | padding: 10px 0
  border-bottom: 1px solid rgba(0,212,255,0.06)

  Dot: 8px circle
    DELIVERED: #00FF88, glow 0 0 4px #00FF88
    PENDING:   #FFB800, pulse animation
    FAILED:    #FF3333

  Date/time: STM 12px #7ECFDF — e.g. "MAR 31  09:00"
  Channel badge: "SMS" / "EMAIL" | Orbitron 9px UPPERCASE | color: #7ECFDF
    bg rgba(0,212,255,0.06) | border rgba(0,212,255,0.12) | padding 2px 6px | radius 2px
  Message preview: Inter 13px | color: #E8F4F8 | flex-1 | truncated
  Status badge (right):
    DELIVERED: "DELIVERED" | Orbitron 9px | color: #00FF88
    PENDING:   "PENDING"   | Orbitron 9px | color: #FFB800
    FAILED:    "FAILED"    | Orbitron 9px | color: #FF3333
```

---

### 4.6 Screen: `rm-leads-empty`
**Title:** Leads Empty State
**Priority:** P1 | **Complexity:** Simple | **URL:** `/leads` (zero leads)

#### 4.6.1 ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [◈ RAINMACHINE]   RainMachine AI                      [● ONLINE]  MON MAR 30 2026  09:41:22  [MJ ▾] │
├────────────┬─────────────────────────────────────────────────────────────────────────────────────────┤
│            │  RAINMACHINE / LEADS                                                                     │
│ ◈ DASH     ├─────────────────────────────────────────────────────────────────────────────────────────┤
│            │                                                                                          │
│ ◈ LEADS    │                                                                                          │
│ [active]   │                                                                                          │
│            │                                                                                          │
│ ◈ AGENTS   │                         ◈  (ScanLine icon 32px muted cyan)                              │
│            │                                                                                          │
│ ◈ CAMPAIGNS│                    AWAITING INCOMING SIGNALS                                            │
│            │                                                                                          │
│ ◈ REPORTS  │        Your AI system is active and monitoring. Leads will appear                       │
│            │        here as they are captured from your campaigns.                                   │
│ ─────────  │                                                                                          │
│ ◈ SETTINGS │                     [●] SYSTEM STATUS: MONITORING                                       │
│            │                                                                                          │
│            │               [CONFIGURE CAMPAIGNS →]    [CHECK SYSTEM STATUS →]                        │
│            │                                                                                          │
└────────────┴─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.6.2 Component Specs

```
Container:
  Full content area (margin-left: 240px, padding-top: 52px + breadcrumb)
  display: flex | align-items: center | justify-content: center
  min-height: calc(100vh - 52px - 40px) | flex-direction: column | gap: 16px

Icon:
  Lucide ScanLine 32px | color: rgba(0,212,255,0.2) | display: block | margin-bottom: 8px
  DO NOT animate — static display

Heading:
  "AWAITING INCOMING SIGNALS" — EXACT STRING (from copy bank)
  Orbitron 13px 400 0.12em UPPERCASE | color: #7ECFDF | text-align: center

Body:
  "Your AI system is active and monitoring. Leads will appear here as they are captured from your campaigns."
  Inter 15px | color: #2A4A5A | text-align: center | max-width: 440px | line-height: 1.6

Status line:
  display: flex | align-items: center | gap: 8px | margin-top: 4px
  StatusDot 8px #00FF88 pulse 2s
  "SYSTEM STATUS: MONITORING" | Orbitron 11px 0.1em UPPERCASE | color: #00FF88

CTA row:
  display: flex | gap: 16px | margin-top: 24px
  "CONFIGURE CAMPAIGNS →" | Secondary button → /campaigns
  "CHECK SYSTEM STATUS →" | Ghost button → /settings/system

Auto-refresh:
  Poll GET /api/leads/count every 30s
  On count > 0: navigate to /leads (reloads full leads-main)
  No visible countdown — silent background poll
```

---

### 4.7 Screen: `rm-leads-filtered-empty`
**Title:** Leads Filtered Empty State
**Priority:** P2 | **Complexity:** Simple | **URL:** `/leads` (filters active, no matches)

#### 4.7.1 ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [◈ RAINMACHINE]   RainMachine AI                      [● ONLINE]  MON MAR 30 2026  09:41:22  [MJ ▾] │
├────────────┬─────────────────────────────────────────────────────────────────────────────────────────┤
│            │  RAINMACHINE / LEADS                                                                     │
│ ◈ LEADS    ├─────────────────────────────────────────────────────────────────────────────────────────┤
│ [active]   │                                                                                          │
│            │  ┌─ FILTER BAR (active filters shown as tags) ───────────────────────────────────────┐  │
│            │  │  [Stage: CLOSED ×]  [Agent: Diana P. ×]  [Date: Last 7 Days ×]  [CLEAR ALL →]    │  │
│            │  └───────────────────────────────────────────────────────────────────────────────────┘  │
│            │                                                                                          │
│            │                    ◈  (Filter icon 24px muted cyan)                                     │
│            │                                                                                          │
│            │              NO LEADS MATCH THE ACTIVE FILTERS                                          │
│            │                                                                                          │
│            │         Try adjusting or clearing your filters to see more leads.                       │
│            │                                                                                          │
│            │                       [CLEAR ALL FILTERS →]                                             │
│            │                                                                                          │
└────────────┴─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.7.2 Component Specs

**Active filter tags:**
```
Filter bar remains visible at top
Active filters shown as dismissible tags:

Tag anatomy:
  bg: rgba(0,212,255,0.08) | border: 1px solid rgba(0,212,255,0.3) | radius: 2px
  padding: 4px 10px 4px 10px | display: flex | align-items: center | gap: 8px
  "Stage: CLOSED" | Orbitron 10px UPPERCASE | color: #00D4FF
  [×] Lucide X 10px | color: #7ECFDF | hover: color #FF6B35 | click: removes this filter only

"CLEAR ALL →" tag:
  Ghost button style | Orbitron 11px | color: #00D4FF | margin-left: auto
  click: resets all filters, refetches, → returns leads-main if results exist
```

**Empty state center:**
```
Container: full content area, centered flex, flex-direction: column, gap: 16px

Icon: Lucide FilterX 24px | color: rgba(0,212,255,0.2)

Heading: "NO LEADS MATCH THE ACTIVE FILTERS" | Orbitron 13px 0.1em UPPERCASE | color: #7ECFDF | text-align: center

Body: "Try adjusting or clearing your filters to see more leads." | Inter 14px | color: #2A4A5A | text-align: center

CTA: "CLEAR ALL FILTERS →" | Ghost button | Orbitron 11px | color: #00D4FF | margin-top: 12px
  click: clear all filters, navigate to /leads (fresh load)
```

---

### 4.8 Screen: `rm-leads-reassign-modal`
**Title:** Reassign Lead Modal
**Priority:** P2 | **Complexity:** Medium | **Type:** Modal overlay

#### 4.8.1 ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [◈ RAINMACHINE]   ...header (visible behind overlay)...                                              │
├────────────┬─────────────────────────────────────────────────────────────────────────────────────────┤
│            │                                                                                          │
│  (sidebar) │      ░░░░░░░░░░░░░░░░░░░░░░░░░ OVERLAY rgba(0,0,0,0.6) ░░░░░░░░░░░░░░░░░░░░░░░░░       │
│            │                                                                                          │
│            │              ┌─────────────────────────────────────────────────────┐                   │
│            │              │  REASSIGN LEAD                                   [X] │                   │
│            │              │  ───────────────────────────────────────────────    │                   │
│            │              │                                                      │                   │
│            │              │  [JS] John Smith  |  Apex Roofing                   │                   │
│            │              │  Currently: [●] Sarah K. — Senior Agent             │                   │
│            │              │                                                      │                   │
│            │              │  SELECT NEW AGENT                                    │                   │
│            │              │  ┌──────────────────────────────────────────────┐   │                   │
│            │              │  │ Agent Name ▾                                 │   │                   │
│            │              │  └──────────────────────────────────────────────┘   │                   │
│            │              │                                                      │                   │
│            │              │  ┌── Agent Dropdown (open) ──────────────────────┐  │                   │
│            │              │  │  [●] Sarah K.     Senior Agent    ONLINE      │  │                   │
│            │              │  │  [●] James T.     Agent           PROCESSING  │  │                   │
│            │              │  │  [●] Mike R.      Agent           ONLINE      │  │                   │
│            │              │  │  [◌] Diana P.     Agent           STANDBY     │  │                   │
│            │              │  └─────────────────────────────────────────────────┘ │                   │
│            │              │                                                      │                   │
│            │              │  REASON FOR REASSIGNMENT (OPTIONAL)                  │                   │
│            │              │  ┌──────────────────────────────────────────────┐   │                   │
│            │              │  │                                              │   │                   │
│            │              │  │  (textarea — add context...)                 │   │                   │
│            │              │  └──────────────────────────────────────────────┘   │                   │
│            │              │                                                      │                   │
│            │              │  [CONFIRM REASSIGNMENT]   [CANCEL]                   │                   │
│            │              │                                                      │                   │
│            │              └─────────────────────────────────────────────────────┘                   │
│            │                                                                                          │
└────────────┴─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.8.2 Component Specs

**Modal overlay:**
```
position: fixed | inset: 0 | bg: rgba(0,0,0,0.6) | z-index: 40
display: flex | align-items: center | justify-content: center
Animation: fade-in opacity 0→0.6, 200ms ease-out
click outside modal: closes modal (cancel)
```

**Modal container:**
```
bg: #0A1628 | border: 1px solid rgba(0,212,255,0.4) | radius: 4px
padding: 32px | width: 520px | max-width: calc(100vw - 48px)
shadow: 0 0 60px rgba(0,0,0,0.8), 0 0 30px rgba(0,212,255,0.08)
Animation: scale 0.95→1.0 + fade-in, 250ms cubic-bezier(0.34,1.56,0.64,1) (spring)
```

**Modal header:**
```
display: flex | justify-content: space-between | align-items: center | margin-bottom: 24px

Title: "REASSIGN LEAD" | Orbitron 18px 600 0.06em UPPERCASE | color: #E8F4F8
[X] button: Lucide X 16px | color: #7ECFDF | hover: color #E8F4F8 | padding: 4px
```

**Lead summary block:**
```
bg: rgba(0,212,255,0.04) | border: 1px solid rgba(0,212,255,0.08) | radius: 4px | padding: 14px
display: flex | align-items: center | gap: 12px | margin-bottom: 24px

Avatar: 36px circle | initials: Orbitron 12px | color: #00D4FF | bg rgba(0,212,255,0.1)
Name: Orbitron 13px 600 | color: #E8F4F8
Org: Inter 13px | color: #7ECFDF

Current agent line (second row):
  "Currently:" | Inter 13px | color: #2A4A5A
  StatusDot 6px (agent status) | margin: 0 6px
  Agent name: STM 13px | color: #7ECFDF
  "—" | #2A4A5A
  Role: Inter 13px | color: #2A4A5A
```

**Agent select input:**
```
Label: "SELECT NEW AGENT" | Orbitron 11px 0.12em UPPERCASE | color: #7ECFDF | margin-bottom: 8px

Trigger (closed state):
  Uses INPUT FIELD spec: bg rgba(0,212,255,0.04), border rgba(0,212,255,0.2), radius 4px, padding 12px 16px
  display: flex | justify-content: space-between | align-items: center
  Placeholder: "Select an agent..." | Inter 15px | color: #2A4A5A
  Lucide ChevronDown 14px | color: #7ECFDF
  focus/open: border #00D4FF, shadow 0 0 0 3px rgba(0,212,255,0.15)

Dropdown panel (open state):
  position: absolute | bg: #0A1628 | border: 1px solid rgba(0,212,255,0.4)
  radius: 4px | padding: 8px 0 | z-index: 50 | width: 100%
  shadow: 0 8px 32px rgba(0,0,0,0.6)

Agent option:
  padding: 12px 16px | display: flex | align-items: center | gap: 12px
  hover: bg rgba(0,212,255,0.08)
  selected: bg rgba(0,212,255,0.12), Lucide Check 12px right

  StatusDot 8px (correct color per agent status)
  Agent name: Orbitron 13px | color: #E8F4F8
  Role: Inter 13px | color: #7ECFDF | margin-left: 4px
  Status label: Orbitron 10px UPPERCASE | color: per status | margin-left: auto
    ONLINE: #00FF88 | PROCESSING: #00D4FF | STANDBY: #2A4A5A
```

**Reason textarea:**
```
Label: "REASON FOR REASSIGNMENT" + "(OPTIONAL)" Orbitron 10px #2A4A5A
  | Orbitron 11px 0.12em UPPERCASE | color: #7ECFDF | margin-bottom: 8px | margin-top: 20px

Textarea:
  INPUT FIELD spec | min-height: 80px | resize: vertical (max 160px)
  placeholder: "Add context for this reassignment..."
  Inter 15px | color: #E8F4F8 | placeholder color: #2A4A5A
  focus: border #00D4FF, shadow 0 0 0 3px rgba(0,212,255,0.15)
```

**CTA row:**
```
display: flex | gap: 12px | margin-top: 24px | justify-content: flex-end

"CANCEL" | Secondary button | border rgba(0,212,255,0.4) | text #00D4FF
  hover: border #00D4FF, bg rgba(0,212,255,0.08)
  click: close modal, no changes

"CONFIRM REASSIGNMENT" | Primary button | bg #00D4FF | text #050D1A | Orbitron 600 13px UPPERCASE
  hover: bg #1ADCFF, shadow 0 0 20px rgba(0,212,255,0.3)
  disabled: no agent selected — bg #0A4F6E, text #2A4A5A, cursor: not-allowed
  loading state (after click, API in flight):
    Lucide Loader2 spin 16px | "REASSIGNING..." | cursor: not-allowed
  success: modal closes, toast: "LEAD REASSIGNED TO [AGENT NAME]" | #00FF88 | 3s auto-dismiss
  error: toast: "[!] REASSIGNMENT FAILED — RETRY" | #FF7D52
```

**Keyboard behavior:**
```
ESC key: closes modal (same as CANCEL)
Enter key: if CONFIRM REASSIGNMENT is enabled → submits
Tab: cycles through interactive elements in order
```

---

## 5. Stack Integration

```
Framework:     Next.js 14 App Router | TypeScript strict
Styling:       Tailwind CSS (JARVIS token values in tailwind.config.ts) + CSS custom properties
Fonts:         Google Fonts — Orbitron, Share Tech Mono, Inter (next/font)
Icons:         lucide-react ^0.344 — individual imports only
State:         Zustand store: { leads, filters, selectedLead, panelOpen, modalOpen, loading, errors }
Data fetching: React Query (TanStack) — leads list with filter params, lead detail, agents list
WebSocket:     useWebSocket hook — listens for NEW_LEAD events → optimistic prepend to list + data-tick flash
Filter state:  URL search params sync (useSearchParams) — filters survive page refresh, shareable URLs
Animations:    CSS transitions for panel slide, modal scale-spring | CSS keyframes for shimmer/scan
Side panel:    CSS transform translateX + position:fixed | framer-motion AnimatePresence optional

URL params (filter state persisted in URL):
  /leads?stage=NEW&source=META&agent=sarah-k&dateRange=last7days&q=smith&page=2

API endpoints:
  GET  /api/leads                    — paginated list, accepts filter query params
  GET  /api/leads/[id]               — lead detail
  GET  /api/leads/[id]/calls         — call history
  GET  /api/leads/[id]/appointment   — appointment detail
  POST /api/leads/[id]/reassign      — { agentId, reason? }
  POST /api/leads/[id]/appointment/outcome — { outcome: "SHOW"|"NO-SHOW" }
  GET  /api/leads/count              — for empty state polling { count: number }

Lead list response shape:
  {
    leads: [
      {
        id: string,
        name: string,
        initials: string,
        org: string,
        stage: "NEW"|"CONTACTED"|"APPT_SET"|"CLOSED"|"LOST",
        source: "META"|"GOOGLE"|"ORGANIC"|"REFERRAL"|"OTHER",
        agent: { id: string, name: string, status: string },
        lastContact: { relative: string, absolute: string, isStale: boolean },
        aiCall: { outcome: string|null, count: number },
      }
    ],
    total: number,
    page: number,
    pageSize: number,
    metrics: { totalLeads: number, newToday: number, newTodayDelta: number, avgCpl: number }
  }

Lead detail response shape:
  {
    id, name, initials, org, phone, email, stage, source, utmParams,
    createdAt: string,
    agent: { id, name, role, status },
    aiSummary: string | null,
    timeline: [{ type, timestamp, outcome, duration, callId }],
    appointment: {
      date: string | null, time: string | null, type: string,
      location: string | null, status: string | null, agentName: string,
      reminders: [{ channel, scheduledAt, status, preview }]
    } | null,
    calls: [
      { id, date, time, duration, outcome, aiSummary, transcriptAvailable }
    ]
  }

Component tree:
  LeadsLayout (shared shell)
    ├── AppHeader
    ├── SidebarNav (LEADS active)
    └── <outlet>
        ├── LeadsMain              (/leads)
        │   ├── FilterBar
        │   ├── SummaryMetricsRow
        │   ├── ViewToggle
        │   ├── LeadsTable (or LeadsCardGrid)
        │   │   └── LeadRow[] (hover + click handlers)
        │   ├── Pagination
        │   ├── LeadDetailPanel (fixed, conditionally rendered)
        │   └── ReassignModal (portal, conditionally rendered)
        ├── LeadsEmpty             (/leads — zero leads)
        ├── LeadsFilteredEmpty     (/leads — filters active, no results)
        └── LeadDetailFull         (/leads/[id])
            ├── BreadcrumbNav
            ├── LeadHeaderBanner
            ├── TabNav (OVERVIEW | CALL HISTORY | APPOINTMENT | NOTES)
            ├── LeadOverviewTab
            ├── LeadCallHistoryTab
            ├── LeadAppointmentTab
            ├── LeadNotesTab
            └── LeadDetailSidebar
                ├── QuickStatsCard
                ├── AssignedAgentCard
                └── QuickActionsCard

Responsive:
  Desktop-first. Min width: 1280px.
  Side panel (400px) reduces available table width — table columns hide gracefully:
    <1440px: hide SOURCE column (visible in panel)
    <1360px: hide AI CALL column (visible in panel)
  No mobile layouts in this flow.

Performance:
  Leads list: virtual scroll if >500 rows — react-virtual or @tanstack/react-virtual
  Lead detail: prefetch on row hover (300ms delay) → near-instant panel open
  Images/avatars: initials only (no <img> tags) — zero image loading
  Filter debounce: 300ms on search input, immediate on dropdown selects
```

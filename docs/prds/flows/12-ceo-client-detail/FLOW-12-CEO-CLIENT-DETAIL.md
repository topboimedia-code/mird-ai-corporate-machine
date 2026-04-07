# Flow PRD: CEO Dashboard — Client Detail

**Flow ID:** F-12-CEO-CLIENT-DETAIL
**App:** CEO Dashboard (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 5 screens | P0: 1 | P1: 4 | P2: 0

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | Client row click on `ceo-command-center-main` or `ceo-clients-list` |
| **Exit Points** | Back to Command Center, tab navigation within client detail |
| **Primary User** | Shomari — reviewing a specific client's full operational picture |
| **Dependencies** | Client data API, campaign data API (read-only), lead data API, financial data API |
| **URL Prefix** | `/clients/[clientId]` |

---

## 1A. UI Profile Compliance

**Profile:** MIRD JARVIS Dark v1.0
**Layout note:** CEO Dashboard uses full-width layout (no sidebar). All screens here use the CEO layout pattern: `padding: 24px`, `max-width: 1440px`, header with back navigation.

---

## 2. CMO Context

**Conversion stake:** Client detail is how Shomari identifies at-risk clients before they churn, and high-performing clients before he can upsell. It's his account management intelligence layer.

---

## 3. User Journey

```
Command Center / Client List
              │
              │ click client row
              ▼
    ┌──────────────────────────────────────────────────────────┐
    │  ceo-clients-detail-overview  [tab: OVERVIEW]            │
    │  CPL trend chart, pipeline funnel, notes                  │
    └──────────────────────────────────────────────────────────┘
              │
              │ tab switch
              ├──→ [ceo-clients-detail-campaigns]  — Campaign data
              ├──→ [ceo-clients-detail-leads]       — Lead list
              ├──→ [ceo-clients-detail-timeline]    — Activity log
              └──→ [ceo-clients-detail-financials]  — P&L, invoices
```

---

## 4. Screen Specifications

---

### Screen 1: Client Detail — Overview

**Screen ID:** `ceo-clients-detail-overview`
**Priority:** P0 | **Route:** `/clients/[clientId]`
**Complexity:** Complex | **Animation:** Medium

**Emotion Target:**
- 0–2s: "I can see this client's health at a glance. CPL trend, pipeline, recent notes."
- 2–10s: "I know if they're scaling, stalling, or at risk. I know what to say on the next call."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  HEADER  52px  border-bottom rgba(0,212,255,0.1)                             │
│  [←] COMMAND CENTER    Marcus Leads Group — MIRD CLIENT                      │
│  Ghost btn Orb 11px    Orb 18px 600 #E8F4F8                                 │
│  [●] ACTIVE  STM 13px #00FF88                                                │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  TAB BAR  border-bottom rgba(0,212,255,0.1)                           │   │
│  │  [OVERVIEW▼] [CAMPAIGNS] [LEADS] [TIMELINE] [FINANCIALS]              │   │
│  │  active: border-bottom 2px #00D4FF, text #00D4FF                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  padding: 24px  max-width: 1440px                                            │
│                                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │ AVG CPL    │ │ LEADS MTD  │ │ APPTS MTD  │ │ CLOSE RATE │ │ MRR       │ │
│  │ Orb 11px   │ │ Orb 11px   │ │ Orb 11px   │ │ Orb 11px   │ │ Orb 11px  │ │
│  │ $47        │ │ 47         │ │ 12         │ │ 26%        │ │ $4,200    │ │
│  │ STM 24px   │ │ STM 24px   │ │ STM 24px   │ │ STM 24px   │ │ STM 24px  │ │
│  │ ▲ vs 30d   │ │ ▲ vs 30d   │ │ ▼ vs 30d   │ │ = neutral  │ │ static    │ │
│  │ Panel card │ │ Panel card │ │ Panel card │ │ Panel card │ │ Panel card│ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └───────────┘ │
│                                              gap: 16px  mb:20px             │
│  ┌─────────────────────────────────────────────────┐ ┌────────────────────┐ │
│  │  CPL TREND (30 DAYS)  Panel card                │ │ PIPELINE FUNNEL    │ │
│  │  Recharts LineChart  100% w  180px h            │ │ Panel card         │ │
│  │  line: #00D4FF  fill gradient                   │ │                    │ │
│  │  grid: rgba(0,212,255,0.06)                     │ │ NEW   ▓▓▓▓▓▓  47   │ │
│  └─────────────────────────────────────────────────┘ │ CONT  ▓▓▓▓   31   │ │
│                                                       │ APPT  ▓▓▓    12   │ │
│  ┌─────────────────────────────────────────────────┐ │ CLOSE ▓▓     3    │ │
│  │  CLIENT NOTES  Panel card                       │ │ STM 13px values    │ │
│  │  Orb 11px label  STM 13px #E8F4F8 notes content │ └────────────────────┘ │
│  │  [+ ADD NOTE]  ghost btn bottom                 │                        │
│  └─────────────────────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Header back link | Ghost button, Lucide `ArrowLeft` 14px, Orbitron 11px `#00D4FF` |
| Client name | Orbitron 18px 600 `#E8F4F8` |
| Client status | Status indicator: dot + "ACTIVE" Share Tech Mono 13px `#00FF88` |
| Tab bar | Same pattern as campaigns platform switcher; Orbitron 13px tabs |
| KPI row | 5-col grid, gap 16px, each a mini panel card |
| KPI values | Share Tech Mono 24px, boot-counter on mount |
| CPL trend chart | Recharts `LineChart`, 180px height, JARVIS theme |
| Pipeline funnel | Horizontal bar segments, proportional widths, Share Tech Mono values |
| Funnel bars | `bg: rgba(0,212,255,0.15→0.06)` — decreasing opacity left to right |
| Notes panel | Panel card, note entries in Share Tech Mono 13px, `+ADD NOTE` ghost button |

**Animation Spec:**
- `panel-enter`: KPI cards stagger 60ms apart, then chart panels enter.
- `boot-counter`: All KPI values count on mount.
- `chart-draw`: Line draws left to right on mount, 800ms.
- `tab-switch`: Content area fades out 150ms then new tab content fades in 150ms.

---

### Screen 2: Client Detail — Campaigns

**Screen ID:** `ceo-clients-detail-campaigns`
**Priority:** P1 | **Route:** `/clients/[clientId]/campaigns`
**Complexity:** Complex | **Animation:** Simple

**Wireframe:**
```
[Same header + tab bar as Overview — CAMPAIGNS tab active]

┌──────────────────────────────────────────────────────────────────────────┐
│  padding: 24px                                                           │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  ACTIVE CAMPAIGNS  Panel card                                      │ │
│  │                                                                    │ │
│  │  PLATFORM  CAMPAIGN        STATUS  SPEND    CPL   LEADS  30D TREND │ │
│  │  Orb 11px ────────────────────────────────────────────────────────│ │
│  │                                                                    │ │
│  │  [Meta]  MIRD Seller Leads  ACTIVE  $6,200  $44   141    [spark]  │ │
│  │  STM     STM 13px           badge   STM     STM   STM    28px h   │ │
│  │  ──────────────────────────────────────────────────────────────── │ │
│  │  [Google] Google Search     ACTIVE  $2,800  $58    48    [spark]  │ │
│  │  ──────────────────────────────────────────────────────────────── │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  NOTE: CEO view is READ-ONLY. No edit/pause/resume controls.            │ │
│  Orbitron 11px #2A4A5A  italic  mt:8px                                  │ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Platform badge Meta | `bg: rgba(0,212,255,0.12)`, `color: #00D4FF`, Orbitron 10px |
| Platform badge Google | `bg: rgba(255,184,0,0.12)`, `color: #FFB800`, Orbitron 10px |
| Sparkline | 28px height, no axes, trend line color = metric health color |
| Read-only notice | Orbitron 11px `#2A4A5A` — CEO doesn't control campaigns |

---

### Screen 3: Client Detail — Leads

**Screen ID:** `ceo-clients-detail-leads`
**Priority:** P1 | **Route:** `/clients/[clientId]/leads`
**Complexity:** Medium | **Animation:** Simple

**Wireframe:**
```
[Same header + tab bar — LEADS tab active]

┌──────────────────────────────────────────────────────────────────────────┐
│  padding: 24px                                                           │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  RECENT LEADS  Panel card                                        │  │
│  │                                                                  │  │
│  │  NAME           STAGE    SOURCE   AI CALL    ASSIGNED  DATE      │  │
│  │  Orb 11px ──────────────────────────────────────────────────── │  │
│  │                                                                  │  │
│  │  [Avatar] James T.  [NEW]  Meta  COMPLETED  Marcus R.  Mar 30  │  │
│  │  STM 13px                  badge  badge       STM        STM    │  │
│  │  ──────────────────────────────────────────────────────────────  │  │
│  │  [Avatar] Sarah M.  [APPT] Google COMPLETED  Marcus R.  Mar 29  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Lead table | Standard data table styles |
| Lead avatar | 28px circle, initials, `bg: rgba(0,212,255,0.08)`, `border: 1px solid rgba(0,212,255,0.3)`, Orbitron 10px |
| Stage badges | Standard lead stage badge tokens |
| AI call badge COMPLETED | `bg: rgba(0,255,136,0.12)`, `color: #00FF88`, Orbitron 10px |
| AI call badge PENDING | `bg: rgba(255,184,0,0.12)`, `color: #FFB800` |

---

### Screen 4: Client Detail — Timeline

**Screen ID:** `ceo-clients-detail-timeline`
**Priority:** P1 | **Route:** `/clients/[clientId]/timeline`
**Complexity:** Medium | **Animation:** Simple

**Wireframe:**
```
[Same header + tab bar — TIMELINE tab active]

┌──────────────────────────────────────────────────────────────────────────┐
│  padding: 24px                                                           │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ACTIVITY TIMELINE  Panel card                                   │  │
│  │                                                                  │  │
│  │  MAR 30, 2026                                                    │  │
│  │  Orbitron 11px #7ECFDF  mb:12px                                  │  │
│  │                                                                  │  │
│  │  ●─────────────────────────────────────────────────────────     │  │
│  │  │  14:22  NEW LEAD — James Thompson                            │  │
│  │  │  STM 11px #2A4A5A    Orbitron 13px #E8F4F8                   │  │
│  │  │  Source: Meta Ads  Agent: Marcus Rodriguez                   │  │
│  │  │  Inter 13px #7ECFDF                                          │  │
│  │  │                                                              │  │
│  │  ●─────────────────────────────────────────────────────────     │  │
│  │  │  12:07  AI CALL COMPLETED — Sarah Martinez                   │  │
│  │  │  Duration: 4m 32s  Outcome: Appointment Set                  │  │
│  │  │                                                              │  │
│  │  ●─────────────────────────────────────────────────────────     │  │
│  │  │  09:15  WEEKLY REPORT GENERATED                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Date group header | Orbitron 11px `#7ECFDF` uppercase, `margin-bottom: 12px`, `margin-top: 24px` |
| Timeline connector | `border-left: 1px solid rgba(0,212,255,0.2)`, `margin-left: 8px` |
| Timeline dot | 8px circle `#00D4FF`, `box-shadow: 0 0 4px rgba(0,212,255,0.4)` |
| Timestamp | Share Tech Mono 11px `#2A4A5A` |
| Event title | Orbitron 13px 600 `#E8F4F8` |
| Event detail | Inter 13px `#7ECFDF` |

---

### Screen 5: Client Detail — Financials

**Screen ID:** `ceo-clients-detail-financials`
**Priority:** P1 | **Route:** `/clients/[clientId]/financials`
**Complexity:** Medium | **Animation:** Simple

**Wireframe:**
```
[Same header + tab bar — FINANCIALS tab active]

┌──────────────────────────────────────────────────────────────────────────┐
│  padding: 24px                                                           │
│                                                                          │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐ │
│  │ MRR      │ │ CONTRACT END │ │ TOTAL BILLED  │ │ MARGIN             │ │
│  │ $4,200   │ │ DEC 31, 2026 │ │ $16,800 YTD  │ │ 68%                │ │
│  │ STM 24px │ │ STM 18px     │ │ STM 24px     │ │ STM 24px           │ │
│  └──────────┘ └──────────────┘ └──────────────┘ └────────────────────┘ │
│                                              mb:20px                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  INVOICE HISTORY  Panel card                                     │  │
│  │                                                                  │  │
│  │  INVOICE #   DATE        AMOUNT   STATUS                         │  │
│  │  Orb 11px ──────────────────────────────────────────────────    │  │
│  │  INV-2026-03  Mar 1 2026  $4,200  [PAID]                        │  │
│  │  INV-2026-02  Feb 1 2026  $4,200  [PAID]                        │  │
│  │  INV-2026-01  Jan 1 2026  $4,200  [PAID]                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| MRR / billing KPI cards | Panel card, Share Tech Mono values |
| Invoice status PAID | `bg: rgba(0,255,136,0.12)`, `color: #00FF88`, Orbitron 10px badge |
| Invoice status OVERDUE | `bg: rgba(255,107,53,0.12)`, `color: #FF7D52` |
| Invoice status PENDING | `bg: rgba(255,184,0,0.12)`, `color: #FFB800` |

---

## 5. Stack Integration

### Key Patterns

**Tab state in URL:**
```typescript
// URL: /clients/[id]?tab=campaigns
const searchParams = useSearchParams()
const activeTab = searchParams.get('tab') ?? 'overview'
```

**Read-only data fetching:**
```typescript
// CEO client detail is read-only — use GET only, no mutations
const { data: client } = useQuery({
  queryKey: ['ceo', 'client', clientId],
  queryFn: () => fetchClientDetail(clientId)
})
```

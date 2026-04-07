# Flow PRD: CEO Dashboard — Department Drill-Down

**Flow ID:** F-13-CEO-DEPT-DRILLDOWN
**App:** CEO Dashboard (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 8 screens | P0: 0 | P1: 5 | P2: 3

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | Department panel click on `ceo-command-center-main` |
| **Exit Points** | Back to Command Center, sub-detail pages within each dept |
| **Primary User** | Shomari — drilling into department-level operational health |
| **Dependencies** | Growth: call data, DBR pipeline / AdOps: campaign API / Product: n8n API, onboarding data / Finance: billing API |
| **URL Prefix** | `/departments/[deptId]` |

---

## 1A. UI Profile Compliance

**Profile:** MIRD JARVIS Dark v1.0
**Layout:** Full-width CEO layout, no sidebar. Each department has a unique set of KPIs and data panels but shares the same structural template.

---

## 2. Department Map

| Dept # | ID | Name | Key Data |
|--------|-----|------|---------|
| 1 | `growth` | Growth & Acquisition | Calls booked, DBR pipeline, outbound metrics, close rate |
| 2 | `adops` | Ad Operations | Cross-client CPL, Meta/Google health, AI call volume |
| 3 | `product` | Product & Automation | Onboarding queue, n8n workflow health, feature delivery |
| 4 | `finance` | Financial Intelligence | MRR, P&L, 90-day forecast, margin by client |

---

## 3. Screen Specifications

---

### Screen 1: Dept 1 — Growth & Acquisition

**Screen ID:** `ceo-dept-growth-main`
**Priority:** P1 | **Route:** `/departments/growth`
**Complexity:** Complex | **Animation:** Medium

**Emotion Target:**
- 0–2s: "I can see how many calls got booked this week and where the DBR pipeline stands."
- 2–10s: "I know if the outbound numbers are on track and which reps are closing."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  HEADER  [←] COMMAND CENTER    DEPT 1 — GROWTH & ACQUISITION                │
│          Ghost btn              Orb 18px 600 #E8F4F8                         │
│                                                                              │
│  padding: 24px  max-width: 1440px                                            │
│                                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │ CALLS      │ │ DBR APPTS  │ │ OUTBOUND   │ │ CLOSE RATE │ │ PIPELINE  │ │
│  │ BOOKED WTD │ │ SET WTD    │ │ DIALS WTD  │ │ MTD        │ │ VALUE     │ │
│  │ 24         │ │ 7          │ │ 183        │ │ 28%        │ │ $186K     │ │
│  │ STM 32px   │ │ STM 32px   │ │ STM 32px   │ │ STM 32px   │ │ STM 32px  │ │
│  │ ▲+18% WoW  │ │ ▲+3 WoW    │ │ ▼-12% WoW  │ │ = neutral  │ │ ▲+$22K    │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └───────────┘ │
│                                              gap: 16px  mb: 20px            │
│  ┌─────────────────────────────────────────┐ ┌──────────────────────────┐  │
│  │  CALLS BOOKED — 30 DAY TREND            │ │  DBR PIPELINE            │  │
│  │  Recharts LineChart  h:180px            │ │  Panel card              │  │
│  └─────────────────────────────────────────┘ │                          │  │
│                                              │  PROSPECT NAME  STAGE    │  │
│  ┌─────────────────────────────────────────┐ │  STM 13px       badge    │  │
│  │  PROSPECT TABLE                         │ │  Johnson Rlty   PROPOSAL │  │
│  │  Full list of DBR prospects with stage  │ │  Green RE Grp   DEMO     │  │
│  │  Name, stage, last touch, value, owner  │ │  [VIEW ALL] ghost btn    │  │
│  └─────────────────────────────────────────┘ └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:** Standard CEO dashboard panel grid, KPI row at 5-col, charts in Recharts JARVIS theme, prospect table in data-table style. KPIs boot-counter on mount.

---

### Screen 2: Prospect Detail

**Screen ID:** `ceo-dept-growth-prospect-detail`
**Priority:** P2 | **Route:** `/departments/growth/prospects/[id]`
**Complexity:** Medium | **Animation:** Simple

**Wireframe:**
```
[Full-width CEO layout]

┌──────────────────────────────────────────────────────────────────────────┐
│  HEADER  [←] GROWTH & ACQUISITION    PROSPECT: Johnson Realty Group      │
│                                                                          │
│  padding: 24px                                                           │
│                                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐ ┌──────────┐ │
│  │ STAGE        │ │ DEAL VALUE   │ │ LAST ACTIVITY      │ │ OWNER    │ │
│  │ PROPOSAL     │ │ $48,000/yr   │ │ Mar 28, 2026       │ │ Shomari  │ │
│  │ STM 18px     │ │ STM 18px     │ │ STM 13px           │ │ STM 13px │ │
│  │ #00D4FF badge│ │ #00FF88      │ │ #7ECFDF            │ │ #E8F4F8  │ │
│  └──────────────┘ └──────────────┘ └────────────────────┘ └──────────┘ │
│                                              mb:20px                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ACTIVITY TIMELINE  Panel card  (same as client timeline)        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:** KPI cards with stage badge (custom stage colors), deal value in `#00FF88`, activity timeline same as client detail timeline.

---

### Screen 3: Dept 2 — Ad Operations

**Screen ID:** `ceo-dept-adops-main`
**Priority:** P1 | **Route:** `/departments/adops`
**Complexity:** Complex | **Animation:** Medium

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  HEADER  [←] COMMAND CENTER    DEPT 2 — AD OPERATIONS                       │
│                                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │ AVG CPL    │ │ TOTAL AD   │ │ AI CALLS   │ │ APPT RATE  │ │ ACTIVE    │ │
│  │ ALL CLIENTS│ │ SPEND MTD  │ │ THIS WEEK  │ │ THIS WEEK  │ │ CAMPAIGNS │ │
│  │ $51        │ │ $28,400    │ │ 312        │ │ 18%        │ │ 14        │ │
│  │ STM 32px   │ │ STM 32px   │ │ STM 32px   │ │ STM 32px   │ │ STM 32px  │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └───────────┘ │
│                                              gap: 16px  mb: 20px            │
│  ┌───────────────────────────────────────┐ ┌────────────────────────────┐  │
│  │  CROSS-CLIENT CPL TABLE               │ │  AI CALL VOLUME TREND      │  │
│  │  Panel card                           │ │  Recharts  h:180px         │  │
│  │                                       │ └────────────────────────────┘  │
│  │  CLIENT       CPL    LEADS  HEALTH    │                                 │
│  │  Orb 11px ─────────────────────────  │ ┌────────────────────────────┐  │
│  │  Marcus LG    $47    141    [●] GOOD  │ │  PLATFORM HEALTH           │  │
│  │  Lopez RE     $58     67    [●] FAIR  │ │  META   [●] ONLINE  12 act │  │
│  │  Brown Rlty   $71     34    [!] RISK  │ │  GOOGLE [●] ONLINE   8 act │  │
│  └───────────────────────────────────────┘ └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**
- Cross-client CPL table: data-table style with client health indicator (progress ring SM or status dot)
- Health: GOOD = `#00FF88`, FAIR = `#FFB800`, RISK = `#FF6B35`
- Platform health panel: Status indicators (dot + label) per platform

---

### Screen 4: Dept 3 — Product & Automation

**Screen ID:** `ceo-dept-product-main`
**Priority:** P1 | **Route:** `/departments/product`
**Complexity:** Complex | **Animation:** Medium

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  HEADER  [←] COMMAND CENTER    DEPT 3 — PRODUCT & AUTOMATION                │
│                                                                              │
│  ┌────────────────┐ ┌────────────────┐ ┌───────────────┐ ┌───────────────┐ │
│  │ ONBOARDING     │ │ N8N UPTIME     │ │ WORKFLOWS     │ │ ACTIVE        │ │
│  │ QUEUE          │ │ 30D            │ │ HEALTHY       │ │ CLIENTS       │ │
│  │ 2 pending      │ │ 99.7%          │ │ 18 / 22       │ │ 8             │ │
│  │ STM 32px       │ │ STM 32px grn   │ │ STM 24px      │ │ STM 32px      │ │
│  └────────────────┘ └────────────────┘ └───────────────┘ └───────────────┘ │
│                                              gap: 16px  mb: 20px            │
│  ┌───────────────────────────────────────┐ ┌────────────────────────────┐  │
│  │  ONBOARDING QUEUE  Panel card         │ │  WORKFLOW HEALTH OVERVIEW  │  │
│  │                                       │ │  Panel card                │  │
│  │  CLIENT        STEP    DAYS ACTIVE    │ │  [see Screen 5 for detail] │  │
│  │  Orb 11px ───────────────────────    │ │                            │  │
│  │  New Client A  Step 3  Day 4          │ │  n8n ONLINE   [●] #00FF88  │  │
│  │  New Client B  Step 1  Day 1          │ │  18 workflows OK           │  │
│  │  [VIEW DETAIL] ghost btn              │ │  4 workflows WARNING       │  │
│  └───────────────────────────────────────┘ └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Screen 5: Client Onboarding Status

**Screen ID:** `ceo-dept-product-onboarding-detail`
**Priority:** P1 | **Route:** `/departments/product/onboarding/[clientId]`
**Complexity:** Medium | **Animation:** Simple

**Wireframe:**
```
[Full-width CEO layout]

┌──────────────────────────────────────────────────────────────────────────┐
│  HEADER  [←] PRODUCT & AUTOMATION    ONBOARDING: New Client Alpha       │
│                                                                          │
│  padding: 24px                                                           │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ONBOARDING PROGRESS  Panel card                                 │  │
│  │                                                                  │  │
│  │  ●─────●─────●─────○─────○                                      │  │
│  │  S1    S2    S3    S4    S5                                      │  │
│  │  done  done  done  pend  pend                                    │  │
│  │  Step indicator: same as onboarding portal steps                 │  │
│  │  completed: #00FF88  active: #00D4FF  upcoming: #2A4A5A         │  │
│  │                                                                  │  │
│  │  CURRENT: STEP 3 — META ADS INTEGRATION                         │  │
│  │  Orbitron 13px 600 #00D4FF  mb:8px                               │  │
│  │  Client has not completed Meta token submission.                 │  │
│  │  Inter 14px #7ECFDF                                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  STEP HISTORY  Panel card                                        │  │
│  │  Timeline of completed steps with timestamps                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Screen 6: Workflow Health Monitor

**Screen ID:** `ceo-dept-product-workflow-health`
**Priority:** P2 | **Route:** `/departments/product/workflows`
**Complexity:** Complex | **Animation:** Simple

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  HEADER  [←] PRODUCT & AUTOMATION    N8N WORKFLOW HEALTH                 │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  WORKFLOW STATUS BOARD  Panel card                               │  │
│  │                                                                  │  │
│  │  WORKFLOW NAME              LAST RUN       RUNS 7D  STATUS       │  │
│  │  Orb 11px ───────────────────────────────────────────────────   │  │
│  │  Lead Intake → RainMachine  5 min ago      1,247    [●] ONLINE  │  │
│  │  CPL Calc Daily             2 hrs ago        7      [●] ONLINE  │  │
│  │  Weekly Report Gen          Sun 00:00         1      [●] ONLINE  │  │
│  │  Meta Webhook               3 hrs ago        89     [!] WARNING │  │
│  │  Google Sync                1 hr ago         24     [●] ONLINE  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**
- Status indicators: ONLINE `#00FF88` pulse, WARNING `#FFB800` static, ERROR `#FF6B35` static
- Last run: Share Tech Mono 13px `#7ECFDF`
- Run count: Share Tech Mono 13px `#E8F4F8`

---

### Screen 7: Dept 4 — Financial Intelligence

**Screen ID:** `ceo-dept-finance-main`
**Priority:** P1 | **Route:** `/departments/finance`
**Complexity:** Complex | **Animation:** Medium

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  HEADER  [←] COMMAND CENTER    DEPT 4 — FINANCIAL INTELLIGENCE              │
│                                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │ MRR        │ │ NET MARGIN │ │ COGS MTD   │ │ 90D FCST   │ │ CHURN     │ │
│  │ $33,600    │ │ 62%        │ │ $12,768    │ │ $100,800   │ │ 0 clients │ │
│  │ STM 32px   │ │ STM 32px   │ │ STM 32px   │ │ STM 32px   │ │ STM 32px  │ │
│  │ ▲ +$4,200  │ │ ▲ +4pt     │ │ ▼ -$400    │ │ projected  │ │ #00FF88   │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └───────────┘ │
│                                                                              │
│  ┌──────────────────────────────────┐ ┌────────────────────────────────┐   │
│  │  MRR TREND (12 MONTHS)           │ │  P&L TABLE (CURRENT QUARTER)   │   │
│  │  Recharts AreaChart  h:200px     │ │  Panel card                    │   │
│  │  line: #00FF88 (MRR = success)   │ │                                │   │
│  │                                  │ │  REVENUE    $33,600   STM 13px │   │
│  └──────────────────────────────────┘ │  COGS       -$12,768           │   │
│                                       │  GROSS MARGIN $20,832          │   │
│  ┌──────────────────────────────────┐ │  NET MARGIN    62%             │   │
│  │  CLIENT P&L GRID                 │ │                                │   │
│  │  Inline expandable per client    │ │  [VIEW CLIENT P&L] ghost btn   │   │
│  │  (see Screen 8)                  │ └────────────────────────────────┘   │
│  └──────────────────────────────────┘                                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**
- MRR line color `#00FF88` (green = money = success) — exception to the default cyan line
- P&L positive values: `#00FF88`, negative values: `#FF6B35`
- Gross margin / net margin: Share Tech Mono 13px with color-coded values

---

### Screen 8: Client P&L Detail

**Screen ID:** `ceo-dept-finance-client-pl-detail`
**Priority:** P2 | **Route:** `/departments/finance` (inline accordion)
**Complexity:** Medium | **Animation:** Simple

**Wireframe:**
```
[Within CLIENT P&L GRID, row expanded:]

┌──────────────────────────────────────────────────────────────────────────┐
│  [●] Marcus Leads Group      $4,200 MRR    68% margin    ▲ EXPANDING ▼  │
│  ─────────────────────────────────────────────────────────────────────  │
│  ACCORDION BODY  bg: rgba(0,212,255,0.02)  padding: 16px                 │
│                                                                          │
│  6-MONTH P&L HISTORY                                                     │
│  Orbitron 11px #7ECFDF  mb:8px                                           │
│                                                                          │
│  MONTH     REVENUE   COGS    MARGIN  MARGIN %                            │
│  Oct 2025  $4,200    $1,344  $2,856  68%                                │
│  Nov 2025  $4,200    $1,386  $2,814  67%                                │
│  Dec 2025  $4,200    $1,302  $2,898  69%                                │
│  Jan 2026  $4,200    $1,260  $2,940  70%                                │
│  Feb 2026  $4,200    $1,428  $2,772  66%                                │
│  Mar 2026  $4,200    $1,344  $2,856  68%                                │
│  All: STM 13px, margin% colored by health                               │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**
- Same accordion pattern as campaigns
- Margin % coloring: ≥65% = `#00FF88`, 50–64% = `#FFB800`, <50% = `#FF6B35`

---

## 5. Stack Integration

### Key Patterns

**Department routing:**
```typescript
// /departments/[deptId]/page.tsx
const DEPT_CONFIGS = {
  growth: { title: 'GROWTH & ACQUISITION', component: GrowthDept },
  adops: { title: 'AD OPERATIONS', component: AdOpsDept },
  product: { title: 'PRODUCT & AUTOMATION', component: ProductDept },
  finance: { title: 'FINANCIAL INTELLIGENCE', component: FinanceDept },
}
```

**Read-only CEO data policy:**
```typescript
// All CEO dashboard queries are GET-only
// No mutation hooks in CEO dashboard components
// Data refresh: useQuery with staleTime: 5 * 60 * 1000 (5 min)
```

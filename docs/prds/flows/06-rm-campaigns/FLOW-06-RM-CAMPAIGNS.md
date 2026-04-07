# Flow PRD: RainMachine Campaign Intelligence

**Flow ID:** F-06-RM-CAMPAIGNS
**App:** RainMachine (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first, responsive to 768px+ tablet
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 5 screens | P0: 2 | P1: 2 | P2: 1

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | Sidebar nav "CAMPAIGNS", direct URL `/campaigns` |
| **Exit Points** | Sidebar nav to any other section, creative modal overlay (stays on campaigns), lead detail slide-in |
| **Primary User** | Marcus Johnson — reviewing ad performance across Meta and Google platforms |
| **Dependencies** | Meta Ads API integration, Google Ads API integration, campaign data sync (n8n), `rm-settings-integrations` (must be connected first) |
| **URL Prefix** | `/campaigns` |

---

## 1A. UI Profile Compliance

**Profile:** MIRD JARVIS Dark v1.0
**Guardrails:**
- No emojis as icons — Lucide React only
- No decorative pulsating circles
- Platform colors: Meta = `#00D4FF`, Google = `#FFB800`, Organic = `#00FF88`
- Charts use Recharts with custom JARVIS Dark theme
- Data values always in Share Tech Mono — they are live intelligence, not static text
- Empty/error states feel like system standby, not consumer app errors

---

## 2. CMO Context

**Conversion stake:** The Campaigns screen is where ad spend efficiency is monitored. Marcus needs to know instantly if his Meta or Google campaigns are generating quality leads at target CPL. Every dollar of mis-spent ad budget is a direct revenue leak.

**Friction elimination:**

| Friction | Solution |
|----------|----------|
| Switching between Meta and Google requires navigating away | Platform switcher tabs at top of Campaigns — single click, no page reload |
| Campaign performance tables have too many columns to scan | Accordion rows — summary visible, drill-down on click reveals charts and ad set detail |
| Creative performance is invisible in table view | Creative thumbnail grid in accordion, click opens full Creative Performance Detail modal |
| Platform API failure creates confusion about data freshness | Distinct `rm-campaigns-platform-error` screen per platform with last-sync timestamp and reconnect CTA |
| Zero campaigns state looks like a broken page | Branded empty state with integration CTA guides user to Settings → Integrations |

---

## 3. User Journey

```
Sidebar → CAMPAIGNS
              │
              ▼
    ┌─────────────────────────┐
    │  rm-campaigns-main      │  No data? → [rm-campaigns-empty]
    │  Platform tabs: Meta/   │  API error? → [rm-campaigns-platform-error]
    │  Google + summary KPIs  │
    └─────────────────────────┘
              │
              │ click campaign row
              ▼
    ┌─────────────────────────┐
    │ rm-campaigns-detail-    │
    │ accordion               │  inline expand — no navigation
    │ 30-day charts, ad sets, │
    │ creative thumbnails     │
    └─────────────────────────┘
              │
              │ click creative thumbnail
              ▼
    ┌─────────────────────────┐
    │ rm-campaigns-creative-  │
    │ detail-modal            │  overlay — campaign table still visible behind
    └─────────────────────────┘
```

---

## 4. Screen Specifications

---

### Screen 1: Campaign Intelligence — Main

**Screen ID:** `rm-campaigns-main`
**Priority:** P0 | **Route:** `/campaigns`
**Complexity:** Complex | **Animation:** Medium

**Emotion Target:**
- 0–2s: "I can see exactly where my ad money is going. This is the command center for my spend."
- 2–10s: "Meta vs Google — I can switch with one click. The numbers are live. I can trust this."
- 10s+: "I know which campaigns are performing and which aren't. I can act on this."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ #050D1A  grid-pattern bg (cyan 3% opacity)                                   │
│                                                                              │
│ ┌────────────┐ ┌──────────────────────────────────────────────────────────┐ │
│ │  SIDEBAR   │ │  HEADER  52px  border-bottom rgba(0,212,255,0.1)         │ │
│ │  240px     │ │  CAMPAIGN INTELLIGENCE      [●] SYNCED 14:32:07          │ │
│ │            │ └──────────────────────────────────────────────────────────┘ │
│ │ [Dashboard]│                                                              │
│ │ [Leads]    │ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Agents]   │ │  padding: 24px                                           │ │
│ │ ▶[Campaigns│ │                                                           │ │
│ │ [Reports]  │ │  ┌─────────────────────────────────────────────────────┐ │ │
│ │ [Settings] │ │  │  PLATFORM SWITCHER TAB BAR                          │ │ │
│ │            │ │  │  ┌─────────────┐  ┌──────────────┐                  │ │ │
│ │            │ │  │  │  META ADS   │  │  GOOGLE ADS  │                  │ │ │
│ │            │ │  │  │  active tab │  │  inactive    │                  │ │ │
│ │            │ │  │  │  border-bot │  │              │                  │ │ │
│ │            │ │  │  │  2px #00D4FF│  │  border-bot  │                  │ │ │
│ │            │ │  │  │  #00D4FF txt│  │  transparent │                  │ │ │
│ │            │ │  │  └─────────────┘  └──────────────┘                  │ │ │
│ │            │ │  │  border-bottom: 1px solid rgba(0,212,255,0.1)       │ │ │
│ │            │ │  └─────────────────────────────────────────────────────┘ │ │
│ │            │ │                                              gap: 20px    │ │
│ │            │ │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │ │
│ │            │ │  │ TOTAL SPEND  │ │  AVG. CPL    │ │  TOTAL LEADS     │ │ │
│ │            │ │  │ Orb 11px mute│ │  Orb 11px    │ │  Orb 11px muted  │ │ │
│ │            │ │  │ $14,200      │ │  $47.33      │ │  300             │ │ │
│ │            │ │  │ STM 32px pri │ │  STM 32px    │ │  STM 32px primary│ │ │
│ │            │ │  │ ▲ +12% 30d   │ │  ▼ -8% 30d   │ │  ▲ +22% 30d      │ │ │
│ │            │ │  │ STM 13px grn │ │  STM 13px grn│ │  STM 13px green  │ │ │
│ │            │ │  │ Panel card   │ │  Panel card  │ │  Panel card      │ │ │
│ │            │ │  └──────────────┘ └──────────────┘ └──────────────────┘ │ │
│ │            │ │                                              gap: 20px    │ │
│ │            │ │  ┌─────────────────────────────────────────────────────┐ │ │
│ │            │ │  │  CAMPAIGN TABLE  Panel card                         │ │ │
│ │            │ │  │                                                      │ │ │
│ │            │ │  │  CAMPAIGN NAME    STATUS   SPEND    CPL    LEADS    │ │ │
│ │            │ │  │  Orb 11px muted ──────────────────────────────────  │ │ │
│ │            │ │  │                                                      │ │ │
│ │            │ │  │  [●] MIRD Seller... ACTIVE  $6,200  $44  141 ▼      │ │ │
│ │            │ │  │  STM 13px primary  badge    STM     STM  STM        │ │ │
│ │            │ │  │  ─────────────────────────────────────────────────  │ │ │
│ │            │ │  │  [●] MIRD Buyer... ACTIVE  $4,800  $53   91 ▼      │ │ │
│ │            │ │  │  ─────────────────────────────────────────────────  │ │ │
│ │            │ │  │  [○] Retargeting  PAUSED   $3,200  $49   65 ▼      │ │ │
│ │            │ │  │  ─────────────────────────────────────────────────  │ │ │
│ │            │ │  └─────────────────────────────────────────────────────┘ │ │
│ │            │ └──────────────────────────────────────────────────────────┘ │
│ └────────────┘                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Page layout | Sidebar 240px + main content 1fr, header 52px |
| Platform switcher | Flex row, `border-bottom: 1px solid rgba(0,212,255,0.1)`, tab font Orbitron 13px 600 uppercase |
| Active tab | `border-bottom: 2px solid #00D4FF`, `color: #00D4FF`, `padding-bottom: 12px` |
| Inactive tab | `color: #7ECFDF`, hover `color: #E8F4F8`, transition 200ms |
| KPI summary cards | Panel card specs — 3-col grid, gap 20px |
| KPI label | Orbitron 11px `#7ECFDF` uppercase letter-spacing 0.12em |
| KPI value | Share Tech Mono 32px `#E8F4F8`, boot-counter animation on mount 1200ms |
| KPI delta positive | Share Tech Mono 13px `#00FF88` with `▲` prefix |
| KPI delta negative | Share Tech Mono 13px `#FF6B35` with `▼` prefix |
| Campaign table | Panel card, data-table styles |
| Table header | Orbitron 11px `#7ECFDF` uppercase, `border-bottom: 1px solid rgba(0,212,255,0.15)` |
| Table cell | Share Tech Mono 13px `#E8F4F8`, `padding: 12px 16px` |
| Row hover | `bg: rgba(0,212,255,0.04)`, left `border-left: 2px solid #00D4FF` on first td |
| Status badge ACTIVE | `bg: rgba(0,255,136,0.12)`, `border: 1px solid rgba(0,255,136,0.4)`, `color: #00FF88`, Orbitron 10px |
| Status badge PAUSED | `bg: rgba(255,184,0,0.12)`, `border: 1px solid rgba(255,184,0,0.4)`, `color: #FFB800` |
| Campaign status dot | 8px circle, ACTIVE = `#00FF88` pulse, PAUSED = `#FFB800` static |
| Expand chevron | Lucide `ChevronDown` 16px `#7ECFDF`, rotates 180° on expand 200ms |
| Header sync badge | Share Tech Mono 11px `#7ECFDF`, status dot `#00FF88` |
| Tab Meta platform color | `#00D4FF` |
| Tab Google platform color | `#FFB800` |

**Animation Spec:**
- `panel-enter`: KPI cards stagger in (0ms, 80ms, 160ms), 400ms spring ease. Campaign table enters at 300ms.
- `boot-counter`: KPI spend/CPL/leads count from 0 on mount, 1200ms.
- `tab-switch`: Platform content cross-fades 200ms. No slide — data tables don't slide, they switch.
- `row-hover`: Row bg and left border transition 100ms ease-out.
- `scan-line`: On platform tab switch, single scan-line sweeps table to signal data refresh.

**Interactive States:**
- **Default:** Meta tab active, campaigns listed with status indicators.
- **Tab switch:** Google Ads tab — table repopulates with Google campaign data, KPIs update, scan-line plays.
- **Row hover:** Row brightens, left cyan accent bar appears.
- **Row click:** Accordion expands (see Screen 2). Chevron rotates 180°.
- **Loading:** Table shows shimmer skeleton rows (3 rows), KPI cards show shimmer bars.
- **Error (API):** Navigates to `rm-campaigns-platform-error`.

**Data Requirements:**
- Campaign list: id, name, platform, status, spend_30d, cpl_30d, leads_30d, trend_delta
- KPI aggregates: total_spend, avg_cpl, total_leads, vs_prior_30d
- Last sync timestamp

---

### Screen 2: Campaign Detail Row — Accordion

**Screen ID:** `rm-campaigns-detail-accordion`
**Priority:** P1 | **Route:** `/campaigns` (inline accordion, no route change)
**Complexity:** Complex | **Animation:** Medium

**Emotion Target:**
- 0–2s: "The row opened and showed me exactly what I needed — no new page, no loading."
- 2–10s: "I can see the 30-day trend, the ad set breakdown, and my creatives all in one view."
- 10s+: "I know exactly which ad set is dragging my CPL up. I can act on this."

**Wireframe:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  CAMPAIGN TABLE  (parent panel card — campaign row expanded)            │
│                                                                         │
│  [●] MIRD Seller Leads — Q1 2026    ACTIVE  $6,200  $44  141  ▲        │
│  STM 13px primary                   badge   STM     STM  STM  chevron  │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  ACCORDION BODY  bg: rgba(0,212,255,0.02)  border-top: 1px solid  │  │
│  │  rgba(0,212,255,0.08)  padding: 20px 16px                        │  │
│  │                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │  30-DAY PERFORMANCE                                         │  │  │
│  │  │  Orbitron 11px #7ECFDF  mb:12px                            │  │  │
│  │  │                                                             │  │  │
│  │  │  [RECHARTS LINE CHART — 100% width, 140px height]           │  │  │
│  │  │  Line: #00D4FF  Fill: rgba(0,212,255,0.15)→transparent      │  │  │
│  │  │  Grid: rgba(0,212,255,0.06) horizontal only                 │  │  │
│  │  │  Axis labels: STM 11px #7ECFDF                              │  │  │
│  │  │  Hover crosshair: 1px dashed rgba(0,212,255,0.4)            │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                              mb:20px               │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │  AD SET BREAKDOWN  Orbitron 11px #7ECFDF  mb:8px            │  │  │
│  │  │                                                             │  │  │
│  │  │  AD SET NAME        SPEND    CPL    LEADS   STATUS          │  │  │
│  │  │  Orb 11px muted ─────────────────────────────────────────  │  │  │
│  │  │  Seller Leads 35-55  $3,100  $38    82      ACTIVE          │  │  │
│  │  │  Seller Leads 55+    $2,100  $52    40      ACTIVE          │  │  │
│  │  │  Broad Retarget      $1,000  $63    16      PAUSED          │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                              mb:20px               │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │  CREATIVES  Orbitron 11px #7ECFDF  mb:12px                  │  │  │
│  │  │                                                             │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │  │  │
│  │  │  │ [thumb]  │ │ [thumb]  │ │ [thumb]  │ │ [thumb]  │       │  │  │
│  │  │  │ 100×80px │ │ 100×80px │ │ 100×80px │ │ +2 more  │       │  │  │
│  │  │  │ border   │ │ border   │ │ border   │ │ bg panel │       │  │  │
│  │  │  │ rgba cyan│ │ rgba cyan│ │ rgba cyan│ │ STM 14px │       │  │  │
│  │  │  │ 0.2      │ │ 0.2 hover│ │ 0.2      │ │ #7ECFDF  │       │  │  │
│  │  │  │ r:4px    │ │ .4+glow  │ │ r:4px    │ │          │       │  │  │
│  │  │  │          │ │          │ │          │ │          │       │  │  │
│  │  │  │ CPL $41  │ │ CPL $38  │ │ CPL $54  │ │          │       │  │  │
│  │  │  │ STM 11px │ │ STM 11px │ │ STM 11px │ │          │       │  │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [●] MIRD Buyer Leads — Q1 2026   ACTIVE  $4,800  $53  91  ▼          │
│  ─────────────────────────────────────────────────────────────────────  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Accordion body bg | `rgba(0,212,255,0.02)` |
| Accordion body border-top | `1px solid rgba(0,212,255,0.08)` |
| Accordion body padding | `20px 16px` |
| Section label | Orbitron 11px `#7ECFDF` uppercase, `margin-bottom: 12px` |
| Line chart | Recharts `LineChart`, line `#00D4FF` strokeWidth 2, area fill `rgba(0,212,255,0.15)` → transparent, grid lines `rgba(0,212,255,0.06)`, axis Share Tech Mono 11px `#7ECFDF` |
| Chart tooltip | Custom: `bg: #0D1E35`, `border: 1px solid rgba(0,212,255,0.3)`, `border-radius: 4px`, Share Tech Mono |
| Ad set sub-table | Same data-table styles as parent, slightly smaller |
| Creative thumbnail | `100×80px`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, `object-fit: cover` |
| Creative thumbnail hover | `border-color: rgba(0,212,255,0.4)`, `box-shadow: 0 0 12px rgba(0,212,255,0.15)` |
| Creative CPL label | Share Tech Mono 11px `#7ECFDF`, below thumbnail |
| "+N more" tile | Panel card bg, Share Tech Mono 14px `#7ECFDF` centered, same dimensions |
| Accordion animation | `max-height: 0 → content-height`, 300ms `cubic-bezier(0.0, 0.0, 0.2, 1)` |

**Animation Spec:**
- `accordion-expand`: `max-height` from 0 to full height, 300ms ease-out. Content fades in at 150ms (staggered after container).
- `chart-draw`: Line chart animates from left on accordion open, 600ms.
- `creative-thumb-enter`: Thumbnails stagger in 60ms apart, fade + slight scale from 0.96 → 1.

**Interactive States:**
- **Collapsed:** Row shows summary stats only, chevron points down.
- **Expanded:** Accordion body slides open. Only one row can be open at a time (opening a new row closes the previous).
- **Creative hover:** Thumbnail border brightens, soft cyan glow appears.
- **Creative click:** Opens `rm-campaigns-creative-detail-modal`.

**Data Requirements:**
- Campaign detail: 30-day daily spend/leads array, ad_sets[], creatives[]
- Creative: thumbnail_url, cpl, impressions, clicks, ctr

---

### Screen 3: Creative Performance Detail — Modal

**Screen ID:** `rm-campaigns-creative-detail-modal`
**Priority:** P2 | **Route:** `/campaigns` (modal overlay)
**Complexity:** Medium | **Animation:** Simple

**Emotion Target:**
- 0–2s: "I can see the actual creative and all its numbers. Instant context."
- 2–10s: "I can compare its metrics and decide if I want to kill it or scale it."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  OVERLAY: rgba(5,13,26,0.85)  backdrop-blur: 4px  z-index: 40           │
│                                                                          │
│    ┌────────────────────────────────────────────────────────────────┐   │
│    │  PANEL  bg:#0A1628  border: 1px solid rgba(0,212,255,0.3)      │   │
│    │  border-radius: 4px  max-width: 560px  padding: 32px           │   │
│    │  shadow: 0 0 40px rgba(0,212,255,0.12)                         │   │
│    │                                                                  │   │
│    │  CREATIVE PERFORMANCE DETAIL        [✕ Lucide X 20px #7ECFDF]  │   │
│    │  Orbitron 18px 600 #E8F4F8          hover: #E8F4F8              │   │
│    │  ─────────────────────────────────────────────────────────────  │   │
│    │  border-bottom: 1px solid rgba(0,212,255,0.1)  mb:24px          │   │
│    │                                                                  │   │
│    │  ┌──────────────────────────────────────────────────────────┐   │   │
│    │  │  CREATIVE PREVIEW                                        │   │   │
│    │  │  [ad creative image — full width, max 320px height]      │   │   │
│    │  │  border: 1px solid rgba(0,212,255,0.2)  r:4px            │   │   │
│    │  └──────────────────────────────────────────────────────────┘   │   │
│    │                                              mb:24px              │   │
│    │  ┌────────────────┐ ┌────────────────┐ ┌─────────────────────┐  │   │
│    │  │  CPL           │ │  CTR           │ │  IMPRESSIONS        │  │   │
│    │  │  Orb 11px mute │ │  Orb 11px mute │ │  Orb 11px muted     │  │   │
│    │  │  $38.00        │ │  2.4%          │ │  12,400             │  │   │
│    │  │  STM 24px pri  │ │  STM 24px pri  │ │  STM 24px primary   │  │   │
│    │  └────────────────┘ └────────────────┘ └─────────────────────┘  │   │
│    │                                              mb:24px              │   │
│    │  ┌────────────────┐ ┌────────────────┐ ┌─────────────────────┐  │   │
│    │  │  CLICKS        │ │  SPEND         │ │  LEADS              │  │   │
│    │  │  Orb 11px mute │ │  Orb 11px mute │ │  Orb 11px muted     │  │   │
│    │  │  298           │ │  $1,140        │ │  30                 │  │   │
│    │  │  STM 24px pri  │ │  STM 24px pri  │ │  STM 24px primary   │  │   │
│    │  └────────────────┘ └────────────────┘ └─────────────────────┘  │   │
│    │                                              mb:24px              │   │
│    │  CAMPAIGN           MIRD Seller Leads — Q1 2026                  │   │
│    │  Orb 11px muted     STM 13px #E8F4F8                             │   │
│    │  AD SET             Seller Leads 35–55                            │   │
│    │  Orb 11px muted     STM 13px #E8F4F8                             │   │
│    │  STATUS             [ACTIVE badge]                                │   │
│    │                                                                   │   │
│    └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Overlay | `rgba(5,13,26,0.85)`, `backdrop-filter: blur(4px)`, `z-index: 40` |
| Modal panel | `bg: #0A1628`, `border: 1px solid rgba(0,212,255,0.3)`, `border-radius: 4px`, `max-width: 560px`, `padding: 32px`, `shadow: 0 0 40px rgba(0,212,255,0.12)` |
| Close icon | Lucide `X`, 20px, `#7ECFDF`, hover `#E8F4F8`, top-right of header |
| Creative image | Full-width, max-height 320px, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, `object-fit: cover` |
| Metric mini-cards | 3-col grid, no border — inline metric readout only |
| Metric label | Orbitron 11px `#7ECFDF` |
| Metric value | Share Tech Mono 24px `#E8F4F8`, boot-counter on open |
| Meta row labels | Orbitron 11px `#7ECFDF` uppercase, `min-width: 120px` |
| Meta row values | Share Tech Mono 13px `#E8F4F8` |

**Animation Spec:**
- `modal-enter`: Overlay fades in 200ms. Panel scales from 0.96 → 1 + fades in, 300ms spring ease.
- `modal-exit`: Reverse, 200ms ease-out.
- `boot-counter`: Metric values count on open.
- `ESC key`: Closes modal with exit animation.

**Interactive States:**
- **Open:** Full-screen overlay, panel centered.
- **Close:** Click overlay, click X, or press Esc.

**Data Requirements:**
- Creative: id, thumbnail_url, cpl, ctr, impressions, clicks, spend, leads, campaign_name, ad_set_name, status

---

### Screen 4: Campaigns — Empty State

**Screen ID:** `rm-campaigns-empty`
**Priority:** P1 | **Route:** `/campaigns`
**Complexity:** Simple | **Animation:** Medium

**Emotion Target:**
- 0–2s: "The system is ready. My campaigns just haven't been connected yet."
- 10s+: "I know exactly where to go to fix this."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Sidebar + Header — standard layout]                                    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  PANEL CARD  centered  max-width: 480px  padding: 48px             │ │
│  │  margin: 80px auto                                                  │ │
│  │                                                                    │ │
│  │          [Lucide BarChart2 — 48px  #2A4A5A]                        │ │
│  │                          mb:20px                                   │ │
│  │                                                                    │ │
│  │    NO ACTIVE CAMPAIGNS DETECTED                                    │ │
│  │    Orbitron 14px 600 #7ECFDF uppercase 0.08em  centered  mb:12px   │ │
│  │                                                                    │ │
│  │    Connect your Meta Ads and Google Ads accounts                   │ │
│  │    to begin monitoring campaign performance.                        │ │
│  │    Inter 14px #2A4A5A  centered  mb:32px                           │ │
│  │                                                                    │ │
│  │    ┌────────────────────────────────────────────────────────────┐  │ │
│  │    │          CONNECT PLATFORMS  →                              │  │ │
│  │    │  Primary button — routes to /settings/integrations         │  │ │
│  │    └────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Empty panel | Panel card, `max-width: 480px`, `padding: 48px`, `margin: 80px auto` |
| Icon | Lucide `BarChart2`, 48px, `#2A4A5A`, centered, `margin-bottom: 20px` |
| Heading | Orbitron 14px 600 `#7ECFDF` uppercase letter-spacing 0.08em, centered |
| Body copy | Inter 14px `#2A4A5A`, centered, `margin-bottom: 32px` |
| CTA button | Primary button, full-width, routes to `/settings/integrations` |

**Animation Spec:**
- `panel-enter`: Panel slides up + fades in 400ms spring. Icon appears at 200ms with subtle scale 0.8 → 1.
- `ambient-glow`: Panel border breathes slowly 3s alternate.

**Interactive States:**
- Single state — CTA navigates to Settings → Integrations.

---

### Screen 5: Campaigns — Platform Signal Lost

**Screen ID:** `rm-campaigns-platform-error`
**Priority:** P0 | **Route:** `/campaigns`
**Complexity:** Medium | **Animation:** Simple

**Emotion Target:**
- 0–2s: "The system is telling me which platform lost signal. It's not a mystery."
- 2–10s: "I can see the last-synced data. I know what to do — reconnect."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Sidebar + Header — standard layout]                                    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  padding: 24px                                                      │ │
│  │                                                                    │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │  PLATFORM ALERT CARD  panel card                             │ │ │
│  │  │  border: 1px solid rgba(255,107,53,0.4)                      │ │ │
│  │  │  shadow: 0 0 20px rgba(255,107,53,0.08)                      │ │ │
│  │  │                                                              │ │ │
│  │  │  [!] SIGNAL LOST           [Lucide AlertTriangle 20px]       │ │ │
│  │  │  Orbitron 11px #FF7D52     right-aligned  #FF7D52            │ │ │
│  │  │  border-bottom rgba(255,107,53,0.2)  mb:16px                 │ │ │
│  │  │                                                              │ │ │
│  │  │  META ADS API CONNECTION FAILED                              │ │ │
│  │  │  Orbitron 18px 600 #E8F4F8  mb:8px                          │ │ │
│  │  │                                                              │ │ │
│  │  │  Unable to retrieve campaign data from Meta Ads.             │ │ │
│  │  │  Inter 14px #7ECFDF  mb:16px                                 │ │ │
│  │  │                                                              │ │ │
│  │  │  LAST SUCCESSFUL SYNC                                        │ │ │
│  │  │  Orbitron 11px #7ECFDF  mb:4px                               │ │ │
│  │  │  2026-03-30 at 06:14:22                                      │ │ │
│  │  │  STM 13px #E8F4F8  mb:24px                                   │ │ │
│  │  │                                                              │ │ │
│  │  │  ┌─────────────────────────────────────────────────────────┐ │ │ │
│  │  │  │  RECONNECT META ADS  →  [Secondary button]              │ │ │ │
│  │  │  └─────────────────────────────────────────────────────────┘ │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  │                                              mt:20px               │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │  STALE DATA NOTICE  panel card (muted)                       │ │ │
│  │  │  border: 1px solid rgba(0,212,255,0.1)                       │ │ │
│  │  │                                                              │ │ │
│  │  │  Showing last available data from 2026-03-30 06:14:22        │ │ │
│  │  │  Inter 13px #7ECFDF  opacity: 0.7                            │ │ │
│  │  │                                                              │ │ │
│  │  │  [Stale campaign table — same format but with opacity:0.5]   │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Error panel border | `1px solid rgba(255,107,53,0.4)` |
| Error panel shadow | `0 0 20px rgba(255,107,53,0.08)` |
| Error header badge | Orbitron 11px `#FF7D52` uppercase, `[!]` prefix |
| Error icon | Lucide `AlertTriangle`, 20px, `#FF7D52` |
| Error heading | Orbitron 18px 600 `#E8F4F8` |
| Error body | Inter 14px `#7ECFDF` |
| Last sync label | Orbitron 11px `#7ECFDF` |
| Last sync value | Share Tech Mono 13px `#E8F4F8` |
| Reconnect CTA | Secondary button, routes to `/settings/integrations` |
| Stale data notice | Panel card, `border: 1px solid rgba(0,212,255,0.1)`, body `opacity: 0.5` |
| Stale data label | Inter 13px `#7ECFDF` italic, `opacity: 0.7` |

**Animation Spec:**
- `alert-panel-enter`: Alert card enters with panel-enter animation but uses alert border color.
- No pulsating — error state is static (system is waiting for action, not churning).

**Interactive States:**
- **Meta error:** Shows Meta-specific error copy. CTA routes to Meta reconnect in Settings.
- **Google error:** Same layout, Google-specific copy. CTA routes to Google reconnect.
- **Both platforms error:** Two error cards stacked (Meta then Google). Single "RECONNECT ALL PLATFORMS" CTA below.
- **Reconnect CTA:** Routes to `/settings/integrations`.

**Data Requirements:**
- Error: platform_name, last_sync_timestamp, error_code
- Stale data: last known campaign list (displayed at reduced opacity)

---

## 5. Stack Integration

### Libraries for This Flow

| Library | Version | Purpose | Install |
|---------|---------|---------|---------|
| recharts | latest | Line chart, custom themed | `npm i recharts` |
| lucide-react | latest | All icons | `npm i lucide-react` |
| @tanstack/react-query | latest | Campaign data fetching + cache | `npm i @tanstack/react-query` |
| framer-motion | latest | Accordion expand, modal, panel-enter | `npm i framer-motion` |
| clsx | latest | Conditional class names | `npm i clsx` |

### Key Patterns

**Accordion (single open at a time):**
```typescript
const [openCampaignId, setOpenCampaignId] = useState<string | null>(null)

const toggle = (id: string) => {
  setOpenCampaignId(prev => prev === id ? null : id)
}
```

**Platform tab switching:**
```typescript
const [activePlatform, setActivePlatform] = useState<'meta' | 'google'>('meta')

const { data, isLoading } = useQuery({
  queryKey: ['campaigns', activePlatform],
  queryFn: () => fetchCampaigns(activePlatform)
})
```

**Recharts custom theme:**
```typescript
const chartTheme = {
  stroke: '#00D4FF',
  fill: 'url(#campaignGradient)',
  grid: 'rgba(0,212,255,0.06)',
  axis: '#7ECFDF',
  tooltip: { bg: '#0D1E35', border: 'rgba(0,212,255,0.3)' }
}
```

**Modal with keyboard dismiss:**
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}, [onClose])
```

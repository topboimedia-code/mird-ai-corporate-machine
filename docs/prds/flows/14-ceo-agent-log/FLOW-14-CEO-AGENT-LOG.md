# Flow PRD: CEO Dashboard — Autonomous Department Activity Log

**Flow ID:** F-14-CEO-AGENT-LOG
**App:** CEO Dashboard (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 3 screens | P0: 0 | P1: 1 | P2: 2

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | Navigation link "AGENT LOG", command center agent section |
| **Exit Points** | Back to Command Center, dept drill-down pages |
| **Primary User** | Shomari — reviewing what the 4 autonomous department agents did today |
| **Dependencies** | Agent activity API, log storage (daily batched entries per dept) |
| **URL Prefix** | `/agent-log` |

---

## 1A. UI Profile Compliance

**Profile:** MIRD JARVIS Dark v1.0
**Copy tone:** Agent logs read like system activity records — precise timestamps, action verbs, outcome labels. Not conversational — operational.

---

## 2. Screen Specifications

---

### Screen 1: Autonomous Department Activity Log — Main

**Screen ID:** `ceo-agents-log-main`
**Priority:** P1 | **Route:** `/agent-log`
**Complexity:** Complex | **Animation:** Simple

**Emotion Target:**
- 0–2s: "I can see what each of my four autonomous agents did today."
- 2–10s: "Each department's log is its own panel. I can expand any of them."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  HEADER  52px                                                                │
│  AUTONOMOUS DEPARTMENT ACTIVITY LOG        [Calendar] TODAY — MAR 30, 2026  │
│  Orb 18px 600 #E8F4F8                      Lucide 16px  STM 13px #7ECFDF    │
│                                                                              │
│  padding: 24px  max-width: 1440px                                            │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  DEPT 1 — GROWTH & ACQUISITION AGENT  Panel card  mb:16px              │ │
│  │  header: border-bottom rgba(0,212,255,0.1)                              │ │
│  │                                                                        │ │
│  │  [●] DEPT 1 AGENT — ACTIVE   LAST RUN: 14:22:07    [VIEW FULL LOG →]  │ │
│  │  Orb 11px #00D4FF  STM 13px muted    ghost btn                        │ │
│  │                                                                        │ │
│  │  ● 14:22  Processed 3 new leads from Meta Ads webhook                  │ │
│  │  ● 11:45  Generated weekly intelligence brief for Marcus LG             │ │
│  │  ● 09:30  Sent appointment reminder — James Thompson → Mar 31           │ │
│  │  ● 08:00  Daily lead routing sync completed — 0 errors                  │ │
│  │           [+ 12 more entries]  ghost btn                               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  DEPT 2 — AD OPERATIONS AGENT  Panel card  mb:16px                     │ │
│  │  [●] DEPT 2 AGENT — ACTIVE   LAST RUN: 13:55:21    [VIEW FULL LOG →]  │ │
│  │                                                                        │ │
│  │  ● 13:55  Meta CPL alert check — all clients within threshold          │ │
│  │  ● 10:00  Synced Google Ads spend for 8 client accounts                 │ │
│  │  ● 08:30  Daily campaign health report compiled                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  DEPT 3 — PRODUCT & AUTOMATION AGENT  Panel card  mb:16px              │ │
│  │  [●] DEPT 3 AGENT — ACTIVE   LAST RUN: 12:00:00    [VIEW FULL LOG →]  │ │
│  │                                                                        │ │
│  │  ● 12:00  n8n workflow health check — 18/22 workflows nominal           │ │
│  │  ● 09:00  Onboarding status update — Client Alpha: Step 3 pending      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  DEPT 4 — FINANCIAL INTELLIGENCE AGENT  Panel card                     │ │
│  │  [●] DEPT 4 AGENT — ACTIVE   LAST RUN: 00:01:00    [VIEW FULL LOG →]  │ │
│  │                                                                        │ │
│  │  ● 00:01  Monthly billing reconciliation completed — 0 discrepancies   │ │
│  │  ● 00:00  MRR snapshot recorded — $33,600                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Panel card per dept | Standard panel card |
| Agent status indicator | Status dot 8px `#00FF88` + Orbitron 11px "DEPT N AGENT — ACTIVE" |
| Last run | Share Tech Mono 13px `#7ECFDF` |
| View full log | Ghost button, right-aligned |
| Log entry bullet | 6px circle `rgba(0,212,255,0.4)` |
| Log timestamp | Share Tech Mono 11px `#2A4A5A` |
| Log entry text | Inter 13px `#E8F4F8` |
| Show more | Ghost button "+ N more entries", Orbitron 11px |

**Animation Spec:**
- `panel-enter`: Four dept panels stagger in 80ms apart.
- No continuous animations — this is a log, not a live dashboard.

---

### Screen 2: Department Agent Full Log

**Screen ID:** `ceo-agents-log-dept-detail`
**Priority:** P2 | **Route:** `/agent-log/[deptId]`
**Complexity:** Medium | **Animation:** Simple

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  HEADER  [←] AGENT LOG    DEPT 1 — GROWTH & ACQUISITION AGENT            │
│                           FULL ACTIVITY LOG — MAR 30, 2026               │
│                                                                          │
│  padding: 24px                                                           │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  FULL LOG  Panel card  overflow-y: auto  max-height: 80vh        │  │
│  │                                                                  │  │
│  │  ● 14:22:07  Processed 3 new leads from Meta Ads webhook         │  │
│  │              Lead IDs: #1042, #1043, #1044  Routed to: Marcus R  │  │
│  │              STM 11px #2A4A5A detail line                        │  │
│  │                                                                  │  │
│  │  ● 13:01:44  AI call attempted — Lead #1038 (James Thompson)     │  │
│  │              Outcome: No answer  Next retry: +2hrs               │  │
│  │                                                                  │  │
│  │  ● 11:45:00  Weekly intelligence brief generated                  │  │
│  │              Client: Marcus Leads Group  Words: 847               │  │
│  │                                                                  │  │
│  │  [... all entries for the day ...]                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**
- Same entry format as main log, but with full detail sub-lines (Share Tech Mono 11px `#2A4A5A`)
- Log entries in reverse chronological order (newest first)
- Full timestamps (HH:MM:SS) in Share Tech Mono 11px `#2A4A5A`

---

### Screen 3: Agent Log History

**Screen ID:** `ceo-agents-log-historical`
**Priority:** P2 | **Route:** `/agent-log/history`
**Complexity:** Medium | **Animation:** Simple

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  HEADER  [←] AGENT LOG    HISTORICAL LOG ARCHIVE                         │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  DATE PICKER  Panel card  padding: 16px                            │ │
│  │                                                                    │ │
│  │  SELECT DATE   [Date input — JARVIS input field style, type=date]  │ │
│  │  Orb 11px      bg rgba(0,212,255,0.04) border rgba cyan 0.2       │ │
│  │                                        [VIEW LOG →] Primary btn    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  [Selected date log renders below — same format as dept-detail]          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**
- Date input: JARVIS input field, `type="date"`, custom styled to override browser defaults
- Date picker submit: Primary button "VIEW LOG"
- Results: 4 dept panels for selected date, same format as main log

---

## 5. Stack Integration

**Date filtering:**
```typescript
const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

const { data: logs } = useQuery({
  queryKey: ['agent-logs', selectedDate],
  queryFn: () => fetchAgentLogs(selectedDate)
})
```

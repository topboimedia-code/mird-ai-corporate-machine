# Flow PRD: RainMachine AI Reports

**Flow ID:** F-07-RM-REPORTS
**App:** RainMachine (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 6 screens | P0: 4 | P1: 2 | P2: 0

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | Sidebar nav "REPORTS", direct URL `/reports` |
| **Exit Points** | Sidebar to any other section (report stays open as persistent session) |
| **Primary User** | Marcus Johnson — reviewing weekly AI intelligence and querying Claude |
| **Dependencies** | Claude AI API, report generation pipeline (n8n), at least 7 days of operational data |
| **URL Prefix** | `/reports` |

---

## 1A. UI Profile Compliance

**Profile:** MIRD JARVIS Dark v1.0
**Guardrails:**
- AI report prose renders in Inter 15px (body) — this is the exception to Orbitron/STM dominance; the report is meant to be read, not scanned
- User query input uses full JARVIS input field treatment
- AI response rendering area: dark bg, cyan code highlights, no white-box markdown styling
- Processing state: "PROCESSING QUERY…" in Orbitron — not a spinner, not a loading bar — a terminal label
- No emojis as icons — Lucide React only

---

## 2. CMO Context

**Conversion stake:** The AI Reports flow is the highest-leverage surface in RainMachine. It's where Marcus transforms raw data into decisions. A slow, confusing, or ugly AI interface makes the intelligence useless.

**Friction elimination:**

| Friction | Solution |
|----------|----------|
| Marcus doesn't know what to ask the AI | Pre-built query suggestions shown below the input as ghost chip buttons |
| Long AI responses feel like walls of text | Structured report rendering with section headers, inline metrics, and bold callouts |
| Waiting for AI feels like a black hole | "PROCESSING QUERY…" state with timestamp showing elapsed time |
| New client has no 7-day data yet | `rm-reports-empty` state with countdown to first report date |
| Query fails with no explanation | `rm-reports-chat-error` with specific error message and retry CTA |

---

## 3. User Journey

```
Sidebar → REPORTS
              │
              ├── No 7-day data yet ──→ [rm-reports-empty]
              │
              ▼
    ┌─────────────────────────┐
    │  rm-reports-main        │
    │  60% report list left   │
    │  40% active report right│
    └─────────────────────────┘
              │
              │ select report from list
              ▼
    ┌─────────────────────────┐
    │ rm-reports-report-view  │
    │ Full report + chat panel│
    └─────────────────────────┘
              │
              │ user submits query
              ▼
    ┌─────────────────────────┐
    │ rm-reports-chat-        │
    │ processing              │  error? → [rm-reports-chat-error]
    └─────────────────────────┘
              │ response arrives
              ▼
    ┌─────────────────────────┐
    │ rm-reports-chat-active  │
    └─────────────────────────┘
```

---

## 4. Screen Specifications

---

### Screen 1: Intelligence Archive — Main

**Screen ID:** `rm-reports-main`
**Priority:** P0 | **Route:** `/reports`
**Complexity:** Complex | **Animation:** Simple

**Emotion Target:**
- 0–2s: "I'm looking at my intelligence archive. My weekly briefs are here."
- 2–10s: "I can see every report by date. The active one is already open on the right."
- 10s+: "I click a report and start reading. I can ask Claude questions inline."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar 240px]  [Header 52px: INTELLIGENCE ARCHIVE]                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  padding: 24px  height: calc(100vh - 52px)  overflow: hidden           │ │
│  │                                                                        │ │
│  │  ┌──────────────────────────┐  ┌─────────────────────────────────────┐ │ │
│  │  │  REPORT LIST  60% width  │  │  ACTIVE REPORT  40% width           │ │ │
│  │  │  Panel card  h:100%      │  │  Panel card  h:100%  overflow-y:auto│ │ │
│  │  │  overflow-y: auto        │  │                                     │ │ │
│  │  │                          │  │  [Report content — see Screen 2]    │ │ │
│  │  │  REPORT HISTORY          │  │                                     │ │ │
│  │  │  Orb 11px #7ECFDF  mb:16 │  │                                     │ │ │
│  │  │                          │  │                                     │ │ │
│  │  │  ┌──────────────────────┐│  │                                     │ │ │
│  │  │  │ ACTIVE               ││  │                                     │ │ │
│  │  │  │ border-left:2px cyan ││  │                                     │ │ │
│  │  │  │ bg: rgba(0,212,255,  ││  │                                     │ │ │
│  │  │  │       0.08)          ││  │                                     │ │ │
│  │  │  │ padding: 12px 16px   ││  │                                     │ │ │
│  │  │  │                      ││  │                                     │ │ │
│  │  │  │ WEEKLY INTELLIGENCE  ││  │                                     │ │ │
│  │  │  │ BRIEF                ││  │                                     │ │ │
│  │  │  │ Orb 13px #00D4FF     ││  │                                     │ │ │
│  │  │  │                      ││  │                                     │ │ │
│  │  │  │ MAR 24 – MAR 30 2026 ││  │                                     │ │ │
│  │  │  │ STM 11px #7ECFDF     ││  │                                     │ │ │
│  │  │  └──────────────────────┘│  │                                     │ │ │
│  │  │                          │  │                                     │ │ │
│  │  │  ┌──────────────────────┐│  │                                     │ │ │
│  │  │  │ WEEKLY INTELLIGENCE  ││  │                                     │ │ │
│  │  │  │ BRIEF                ││  │                                     │ │ │
│  │  │  │ Orb 13px #E8F4F8     ││  │                                     │ │ │
│  │  │  │ MAR 17 – MAR 23 2026 ││  │                                     │ │ │
│  │  │  │ STM 11px #7ECFDF     ││  │                                     │ │ │
│  │  │  └──────────────────────┘│  │                                     │ │ │
│  │  │  (more reports below...) │  │                                     │ │ │
│  │  └──────────────────────────┘  └─────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Layout | Two-column: 60% list, 40% active report, `gap: 20px`, `height: calc(100vh - 52px - 48px)` |
| Both panels | Panel card with `overflow-y: auto`, `height: 100%` |
| Section label | Orbitron 11px `#7ECFDF` uppercase, `margin-bottom: 16px` |
| Active report item | `border-left: 2px solid #00D4FF`, `bg: rgba(0,212,255,0.08)`, `padding: 12px 16px` |
| Active report title | Orbitron 13px `#00D4FF` uppercase |
| Active report date | Share Tech Mono 11px `#7ECFDF` |
| Inactive report item | `padding: 12px 16px`, `border-left: 2px solid transparent` |
| Inactive report title | Orbitron 13px `#E8F4F8` |
| Item hover | `border-left-color: rgba(0,212,255,0.4)`, `bg: rgba(0,212,255,0.04)` |
| Divider between items | `1px solid rgba(0,212,255,0.06)` |

**Animation Spec:**
- `panel-enter`: Both panels slide up 8px on route mount, 400ms spring, 80ms stagger.
- `report-select`: Clicking a report item — left panel active state transitions 200ms; right panel content fades in/out 200ms.

**Interactive States:**
- **Default:** Most recent report selected and displayed in right panel.
- **Report click:** Left item activates, right panel shows selected report content.
- **Empty:** If no reports, right panel shows empty state message.

**Data Requirements:**
- Report list: id, title, date_range_start, date_range_end, created_at

---

### Screen 2: Weekly Intelligence Brief — Report View

**Screen ID:** `rm-reports-report-view`
**Priority:** P0 | **Route:** `/reports` (right panel or full-page on mobile)
**Complexity:** Complex | **Animation:** Simple

**Emotion Target:**
- 0–2s: "This reads like a briefing from a senior analyst. The data is in here."
- 2–10s: "I can see my key metrics, the trend analysis, and specific call-outs from Claude."
- 10s+: "I know what happened this week and what to do next. I can ask a follow-up."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  REPORT PANEL (right 40%)  overflow-y: auto  padding: 24px           │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  HEADER                                                      │   │
│  │  WEEKLY INTELLIGENCE BRIEF                                   │   │
│  │  Orbitron 18px 600 #E8F4F8  mb:4px                          │   │
│  │  MAR 24 – MAR 30, 2026                                       │   │
│  │  STM 13px #7ECFDF  mb:4px                                   │   │
│  │  [AI icon 14px #7ECFDF]  Generated by Claude AI              │   │
│  │  Inter 12px #2A4A5A  mb:20px                                 │   │
│  │  border-bottom: 1px solid rgba(0,212,255,0.1)  pb:20px       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  EXECUTIVE SUMMARY                                           │   │
│  │  Orbitron 13px 600 #00D4FF  uppercase  mb:12px               │   │
│  │                                                              │   │
│  │  This week, RainMachine processed 47 new leads...            │   │
│  │  Inter 15px #E8F4F8  line-height 1.7  mb:20px               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  KEY METRICS THIS WEEK                                       │   │
│  │  Orbitron 13px 600 #00D4FF  uppercase  mb:12px               │   │
│  │                                                              │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │   │
│  │  │ NEW LEADS   │ │ APPTS SET   │ │ AVG. RESPONSE TIME  │    │   │
│  │  │ Orb 11px mt │ │ Orb 11px mt │ │ Orb 11px muted      │    │   │
│  │  │ 47          │ │ 12          │ │ 4.2 MIN             │    │   │
│  │  │ STM 24px pri│ │ STM 24px   │ │ STM 24px primary    │    │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  PERFORMANCE ANALYSIS                                        │   │
│  │  Orbitron 13px 600 #00D4FF  uppercase  mb:12px               │   │
│  │                                                              │   │
│  │  Lead volume increased 18% vs. the prior week...             │   │
│  │  Inter 15px #E8F4F8  line-height 1.7  mb:12px               │   │
│  │                                                              │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │  CALLOUT  bg: rgba(0,212,255,0.04)                     │  │   │
│  │  │  border-left: 3px solid #00D4FF  padding: 12px 16px    │  │   │
│  │  │  r: 0 4px 4px 0                                        │  │   │
│  │  │  Marcus Rodriguez had the highest close rate this week  │  │   │
│  │  │  at 38%. Recommend assigning premium leads to him.      │  │   │
│  │  │  Inter 14px #E8F4F8  line-height 1.6                   │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [Additional sections: CAMPAIGN PERFORMANCE, RECOMMENDATIONS...]     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  CHAT PANEL                                                  │   │
│  │  border-top: 1px solid rgba(0,212,255,0.1)  pt:20px          │   │
│  │                                                              │   │
│  │  [Chat history — see rm-reports-chat-active]                 │   │
│  │                                                              │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │  [Input: Ask about your CPL this week...]  [TRANSMIT]  │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Report header | `border-bottom: 1px solid rgba(0,212,255,0.1)`, `padding-bottom: 20px` |
| Report title | Orbitron 18px 600 `#E8F4F8` |
| Date range | Share Tech Mono 13px `#7ECFDF` |
| AI attribution | Inter 12px `#2A4A5A`, AI icon 14px `#7ECFDF` |
| Section heading | Orbitron 13px 600 `#00D4FF` uppercase, `margin-bottom: 12px` |
| Body prose | Inter 15px `#E8F4F8` line-height 1.7 — this is the one place Inter dominates |
| Inline metric mini-cards | 3-col grid, metric readout MD size (24px STM) |
| Callout block | `bg: rgba(0,212,255,0.04)`, `border-left: 3px solid #00D4FF`, `padding: 12px 16px`, `border-radius: 0 4px 4px 0` |
| Chat divider | `border-top: 1px solid rgba(0,212,255,0.1)`, `padding-top: 20px` |
| Suggestion chips | Small secondary-style tags: Orbitron 10px, `border: 1px solid rgba(0,212,255,0.3)`, `padding: 4px 10px`, `border-radius: 2px`, hover brightens |

**Animation Spec:**
- `report-content-enter`: Sections stagger in 100ms apart, each fading up 6px, 300ms ease-out.
- `metric-boot`: Inline metric values count from 0 on render.

**Interactive States:**
- **Default:** Report prose visible, chat panel collapsed at bottom.
- **Chat expanded:** User clicks input — chat panel expands up, report scrolls up.
- **Suggestion chip click:** Populates query input with chip text.

**Data Requirements:**
- Report: id, title, date_range, generated_at, sections[] (each: heading, body, metrics[], callouts[])

---

### Screen 3: AI Report Chat — Active

**Screen ID:** `rm-reports-chat-active`
**Priority:** P0 | **Route:** `/reports` (inline in report panel)
**Complexity:** Complex | **Animation:** Medium

**Emotion Target:**
- 0–2s: "I asked a question. There's an answer. It's specific to my data."
- 2–10s: "I can see the conversation history. I can ask follow-ups."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  CHAT PANEL  border-top: 1px solid rgba(0,212,255,0.1)               │
│  flex-column  height: 400px                                          │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  CHAT HISTORY  overflow-y: auto  flex: 1  padding: 16px        │ │
│  │                                                                │ │
│  │  [USER]                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  Why did my CPL spike on Wednesday?                      │  │ │
│  │  │  Inter 14px #E8F4F8                                      │  │ │
│  │  │  bg: rgba(0,212,255,0.08)  border-radius: 4px 4px 0 4px  │  │ │
│  │  │  padding: 10px 14px  max-width: 80%  align: right        │  │ │
│  │  │  STM 10px #7ECFDF  mt:4px  "14:22:31"  right-aligned     │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │  [CLAUDE AI]                                                   │ │
│  │  [AI icon 14px #00D4FF]  CLAUDE AI                            │ │
│  │  Orbitron 10px #7ECFDF  mb:6px                                │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  Your CPL rose from $44 to $61 on Wednesday due to...    │  │ │
│  │  │  Inter 14px #E8F4F8  line-height 1.6                     │  │ │
│  │  │  bg: rgba(0,212,255,0.04)  border: 1px solid rgba(0,212, │  │ │
│  │  │  255,0.1)  border-radius: 4px 4px 4px 0  padding:10px 14p│  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  QUERY INPUT ROW  padding: 12px 16px                           │ │
│  │  border-top: 1px solid rgba(0,212,255,0.08)                    │ │
│  │                                                                │ │
│  │  ┌───────────────────────────────────────────┐ ┌───────────┐  │ │
│  │  │  Ask about your CPL this week...           │ │ TRANSMIT  │  │ │
│  │  │  JARVIS input field, h:44px, flex: 1       │ │ Primary   │  │ │
│  │  └───────────────────────────────────────────┘ └───────────┘  │ │
│  │                                                                │ │
│  │  What drove the appointment spike on Tuesday?  Compare agents │ │
│  │  [Suggestion chips — Orb 10px, secondary style, gap: 8px]     │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Chat history area | `flex: 1`, `overflow-y: auto`, `padding: 16px`, `display: flex`, `flex-direction: column`, `gap: 12px` |
| User message bubble | `bg: rgba(0,212,255,0.08)`, `border-radius: 4px 4px 0 4px`, `padding: 10px 14px`, `max-width: 80%`, `align-self: flex-end`, Inter 14px `#E8F4F8` |
| User timestamp | Share Tech Mono 10px `#7ECFDF`, `margin-top: 4px`, right-aligned |
| AI attribution label | Orbitron 10px `#7ECFDF`, AI icon 14px `#00D4FF` inline left |
| AI message bubble | `bg: rgba(0,212,255,0.04)`, `border: 1px solid rgba(0,212,255,0.1)`, `border-radius: 4px 4px 4px 0`, `padding: 10px 14px`, Inter 14px `#E8F4F8` line-height 1.6 |
| Query input | JARVIS input field, `height: 44px`, `flex: 1` |
| Send button | Primary button, `height: 44px`, label "TRANSMIT" |
| Suggestion chips | `border: 1px solid rgba(0,212,255,0.3)`, Orbitron 10px `#00D4FF`, `padding: 4px 10px`, `border-radius: 2px`, hover `border-color: #00D4FF` |

**Animation Spec:**
- `message-enter`: New messages slide up from below + fade in, 300ms ease-out.
- `auto-scroll`: Chat scrolls to bottom on new message, 200ms smooth.
- `chip-hover`: Border brightens 200ms.
- `send-loading`: Button shows "TRANSMITTING…" while waiting (disabled state).

**Interactive States:**
- **Default:** Chat history visible, input focused.
- **Send:** Button shows "TRANSMITTING…", input cleared. Navigates to `rm-reports-chat-processing`.
- **Response received:** New AI message slides in. Navigates back to `rm-reports-chat-active`.
- **Suggestion chip click:** Populates input field, doesn't auto-submit.

**Data Requirements:**
- Chat history: message_id, role (user/assistant), content, timestamp
- Input: query string
- Output: Claude response

---

### Screen 4: AI Processing Query

**Screen ID:** `rm-reports-chat-processing`
**Priority:** P0 | **Route:** `/reports` (inline in chat panel)
**Complexity:** Simple | **Animation:** Medium

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  CHAT PANEL — PROCESSING STATE                                        │
│                                                                      │
│  [Previous chat history visible above — opacity: 0.5]               │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  [AI icon 14px #00D4FF]  CLAUDE AI                            │ │
│  │  Orbitron 10px #7ECFDF  mb:6px                                │ │
│  │                                                               │ │
│  │  PROCESSING QUERY...                                          │ │
│  │  Orbitron 13px #7ECFDF  letter-spacing 0.12em                │ │
│  │  ── three dots cycling: . .. ... repeat, 600ms interval       │ │
│  │                                                               │ │
│  │  00:04                                                        │ │
│  │  STM 11px #2A4A5A  elapsed seconds counter                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  [Input field — disabled, greyed]  [TRANSMIT — disabled]     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Processing label | Orbitron 13px `#7ECFDF` uppercase, letter-spacing 0.12em |
| Dot animation | CSS: cycles "." → ".." → "..." → " " every 600ms using `animation-delay` |
| Elapsed timer | Share Tech Mono 11px `#2A4A5A`, `MM:SS` format, counts up from submission |
| Input disabled | Opacity 0.4, `cursor: not-allowed` |
| Send button disabled | `bg: #0A4F6E`, `color: #2A4A5A` |
| Prior history | `opacity: 0.5` while processing |

**Animation Spec:**
- `processing-dots`: Three-dot cycle every 600ms, pure CSS `@keyframes`.
- `elapsed-counter`: JavaScript `setInterval` counting up every second.

**Interactive States:**
- **Single state:** Processing. Input and send are disabled. No user actions except navigate away.
- **On response:** Transitions to `rm-reports-chat-active` with new message.
- **On error:** Transitions to `rm-reports-chat-error`.

---

### Screen 5: AI Response Error

**Screen ID:** `rm-reports-chat-error`
**Priority:** P1 | **Route:** `/reports` (inline in chat panel)
**Complexity:** Simple | **Animation:** Simple

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  CHAT PANEL — ERROR STATE                                             │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  [AI icon 14px #FF7D52]  CLAUDE AI                             │ │
│  │  Orbitron 10px #7ECFDF  mb:6px                                 │ │
│  │                                                                │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  bg: rgba(255,107,53,0.04)                               │  │ │
│  │  │  border: 1px solid rgba(255,107,53,0.2)                  │  │ │
│  │  │  border-radius: 4px  padding: 10px 14px                  │  │ │
│  │  │                                                          │  │ │
│  │  │  QUERY FAILED                                            │  │ │
│  │  │  Orbitron 13px #FF7D52  mb:4px                           │  │ │
│  │  │                                                          │  │ │
│  │  │  Unable to process your query. Please try again.         │  │ │
│  │  │  Inter 13px #7ECFDF                                      │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │  RETRY QUERY  →                                               │ │
│  │  Ghost button, Orbitron 11px #00D4FF                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  [Input field — re-enabled with prior query pre-populated]   │   │
│  │  [TRANSMIT — re-enabled]                                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Error bubble | `bg: rgba(255,107,53,0.04)`, `border: 1px solid rgba(255,107,53,0.2)`, `border-radius: 4px`, `padding: 10px 14px` |
| Error heading | Orbitron 13px `#FF7D52` uppercase |
| Error body | Inter 13px `#7ECFDF` |
| AI icon on error | 14px `#FF7D52` (overrides default cyan) |
| Retry CTA | Ghost button, Orbitron 11px `#00D4FF`, re-submits the prior query |
| Input on error | Re-enabled with prior query pre-populated for easy retry |

**Interactive States:**
- **Retry:** Re-submits query, transitions back to `rm-reports-chat-processing`.
- **Modify and retry:** User can edit the input before re-transmitting.

---

### Screen 6: Intelligence Reports Initializing — Empty State

**Screen ID:** `rm-reports-empty`
**Priority:** P1 | **Route:** `/reports`
**Complexity:** Simple | **Animation:** Medium

**Emotion Target:**
- 0–2s: "My first report isn't ready yet. The system is telling me exactly when it will be."
- 10s+: "I know what I'm waiting for. The system is working."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Sidebar + Header — standard]                                           │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  PANEL CARD  max-width: 520px  centered  padding: 48px             │ │
│  │  margin: 80px auto                                                  │ │
│  │                                                                    │ │
│  │          [Lucide BrainCircuit — 48px  #2A4A5A]                     │ │
│  │                          mb:20px                                   │ │
│  │                                                                    │ │
│  │    INTELLIGENCE REPORTS INITIALIZING                               │ │
│  │    Orbitron 14px 600 #7ECFDF uppercase 0.08em  centered  mb:12px   │ │
│  │                                                                    │ │
│  │    Your first weekly intelligence brief will be generated          │ │
│  │    after 7 days of operational data.                               │ │
│  │    Inter 14px #2A4A5A  centered  mb:32px                           │ │
│  │                                                                    │ │
│  │    FIRST REPORT ESTIMATED                                          │ │
│  │    Orbitron 11px #7ECFDF  centered  mb:4px                         │ │
│  │    APR 6, 2026                                                     │ │
│  │    Share Tech Mono 24px #00D4FF  centered  mb:8px                  │ │
│  │    6 DAYS REMAINING                                                │ │
│  │    Orbitron 11px #7ECFDF  centered                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Empty panel | Panel card, `max-width: 520px`, `padding: 48px`, `margin: 80px auto` |
| Icon | Lucide `BrainCircuit`, 48px, `#2A4A5A` |
| Heading | Orbitron 14px 600 `#7ECFDF` uppercase |
| Body | Inter 14px `#2A4A5A` |
| Date label | Orbitron 11px `#7ECFDF` uppercase |
| Date value | Share Tech Mono 24px `#00D4FF` (this is the one bright element — it's a countdown target) |
| Days remaining | Orbitron 11px `#7ECFDF` |

**Animation Spec:**
- `panel-enter`: Standard panel-enter 400ms spring.
- `date-glow`: The estimated date value has slow ambient glow pulse 3s (it's the focal point).

---

## 5. Stack Integration

### Libraries for This Flow

| Library | Version | Purpose | Install |
|---------|---------|---------|---------|
| @anthropic-ai/sdk | latest | Claude API integration | `npm i @anthropic-ai/sdk` |
| @tanstack/react-query | latest | Report data fetching | `npm i @tanstack/react-query` |
| framer-motion | latest | Message animations | `npm i framer-motion` |
| react-markdown | latest | Render Claude report prose as formatted markdown | `npm i react-markdown` |
| lucide-react | latest | All icons | `npm i lucide-react` |

### Key Patterns

**Streaming Claude response:**
```typescript
// Use Server-Sent Events or tRPC subscription for streaming
// Display partial response as it streams in character-by-character
const streamResponse = async (query: string) => {
  const stream = await anthropic.messages.stream({
    model: 'claude-opus-4-6',
    messages: [{ role: 'user', content: buildPrompt(reportData, query) }]
  })
  for await (const chunk of stream) {
    appendToMessage(chunk.delta?.text ?? '')
  }
}
```

**Processing dots animation (CSS):**
```css
@keyframes processing-dots {
  0%   { content: '.'; }
  33%  { content: '..'; }
  66%  { content: '...'; }
  100% { content: ''; }
}
```

**Auto-scroll to latest message:**
```typescript
const bottomRef = useRef<HTMLDivElement>(null)
useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [messages])
```

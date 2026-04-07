# Flow PRD: RainMachine First-Time Setup (Onboarding)

**Flow ID:** F-02-RM-ONBOARDING
**App:** RainMachine (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first, responsive to 768px+ tablet and 375px mobile
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 5 screens | P0: 0 | P1: 5 | P2: 0

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | `/auth/login` — first login detection (no `onboardingComplete` flag on user record) |
| **Exit Points** | `/dashboard` — only after full wizard completion or `rm-onboard-setup-complete` auto-advance |
| **Primary User** | Marcus Johnson — real estate team leader, first-time setup |
| **Dependencies** | Authenticated session (JWT), Auth Flow (F-01) must complete first, Agent management API, Routing rules API, Notification preferences API |
| **URL Prefix** | `/onboarding` |

---

## 1A. UI Profile Compliance

**Profile:** MIRD JARVIS Dark v1.0
**Guardrails:**
- Max 3 accent colors per screen (cyan primary, status color, background)
- No emojis as icons — Lucide React only
- No decorative pulsating circles
- Motion is purposeful — communicates system state, not decoration
- All uppercase labels via Orbitron
- All data/metrics via Share Tech Mono
- Boot/completion sequences use scan lines and sequential reveals — not confetti or particle explosions

---

## 2. CMO Context

**Conversion stake:** Onboarding completion directly determines whether Marcus activates RainMachine as his daily operating system. An incomplete setup = a dormant product = churn within 30 days. Every drop-off point before "Setup Complete" is a lost operator.

**Drop-off risk:**
- **Welcome Splash:** Unlikely. Single CTA, no friction.
- **Team Setup:** Most likely drop-off — adding agents requires looking up contact info. "SKIP FOR NOW" must be clearly available but not tempting.
- **Routing Config:** High friction — routing logic is unfamiliar to most realtors. Default state must be usable out of the box.
- **Notifications:** Low friction — toggles are easy. Users will fly through this.
- **Setup Complete:** Zero drop-off risk. Auto-advance handles inaction.

**Friction elimination:**

| Friction | Solution |
|----------|----------|
| Team setup requires knowing all agent details upfront | "SKIP FOR NOW" on all wizard steps — they can add agents from Settings after |
| Routing config is confusing for non-technical users | Default rule pre-set to round-robin; advanced rules are optional add-ons |
| Users don't understand why this wizard exists | Welcome splash explains the system is ready for configuration in first-person JARVIS voice |
| Completion screen feels anticlimactic | JARVIS boot sequence with each module illuminating one-by-one — system coming online |
| Wizard progress is unclear | Step indicator at top of every wizard screen with exact position (STEP 1 OF 3, etc.) |
| Back navigation breaks things | All steps save their data before advancing — back navigation restores saved state |

---

## 3. User Journey

```
First Login Detection (auth flow sets onboardingComplete: false)
              │
              ▼
    [rm-onboard-welcome-splash]
              │
         CTA click: "BEGIN SYSTEM SETUP →"
              │
              ▼
    [rm-onboard-team-setup-main] ←─── back
              │                          │
         continue                        │
              │                          │
              ▼                          │
    [rm-onboard-routing-config] ─────────┘
              │                ←─── back
         continue                         │
              │                           │
              ▼                           │
    [rm-onboard-notifications-setup] ─────┘
              │
         "COMPLETE SETUP →"
              │
              ▼
    [rm-onboard-setup-complete]
              │
    auto-advance (5s) OR CTA click
              │
              ▼
    [dashboard-home-main] — /dashboard
```

---

## 4. Screen Specifications

---

### Screen 1: Welcome to RainMachine

**Screen ID:** `rm-onboard-welcome-splash`
**Priority:** P1 | **Route:** `/onboarding/welcome`
**Complexity:** Simple | **Animation:** Complex

**Emotion Target:**
- 0–2s: "Something significant is happening. This isn't a generic app loading screen."
- 2–10s: "This system was built for me. It knows my name. It's addressing me directly."
- 10s+: "I feel ready. I want to press that button and begin."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────┐
│  #050D1A — full viewport                                          │
│  background-image: grid pattern + slow ambient scan lines         │
│  (cyan 3% opacity repeating-linear-gradient, 40px pitch)         │
│                                                                    │
│                                                                    │
│                    ┌────────────────────┐                         │
│                    │  [MIRD LOGOMARK]   │                         │
│                    │  SVG draws in via  │                         │
│                    │  stroke-dashoffset │                         │
│                    │  64px × 64px       │                         │
│                    │  #00D4FF           │                         │
│                    └────────────────────┘                         │
│                    centered  mb:32px                              │
│                                                                    │
│                                                                    │
│               RAINMACHINE ACTIVATED                               │
│               Orbitron 32px 700 #E8F4F8                           │
│               letter-spacing: 0.1em  uppercase                    │
│               text-align: center  mb:16px                         │
│               reveals via clip-path wipe left→right               │
│                                                                    │
│          ─────────────────────────────────────────────           │
│          width: 120px  border: 1px solid rgba(0,212,255,0.3)     │
│          centered  mb:24px  fades in at 600ms                    │
│                                                                    │
│     GOOD MORNING, MARCUS. YOUR SYSTEM IS READY                   │
│     FOR CONFIGURATION.                                            │
│     Inter 16px #7ECFDF  text-align:center                        │
│     max-width: 420px  centered  mb:48px                          │
│     reveals word-by-word, 40ms stagger per word                   │
│                                                                    │
│                                                                    │
│          ┌────────────────────────────────────┐                   │
│          │      BEGIN SYSTEM SETUP  →         │                   │
│          │  Button Primary                    │                   │
│          │  bg: #00D4FF  text: #050D1A        │                   │
│          │  Orbitron 600 13px uppercase        │                   │
│          │  padding: 16px 48px  h:52px        │                   │
│          │  border-radius: 4px                │                   │
│          └────────────────────────────────────┘                   │
│          centered  fades in at 1400ms                             │
│                                                                    │
│                                                                    │
│  [●] SYSTEM INITIALIZING...                                       │
│  Share Tech Mono 13px #7ECFDF  bottom-center  mb:32px            │
│  status dot: #00D4FF PROCESSING  1.2s fast pulse                  │
│  → changes to [●] RAINMACHINE SYSTEM — ONLINE after boot seq.    │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Page background | `#050D1A` full viewport |
| Background grid | `repeating-linear-gradient` cyan 3% opacity, 40px pitch — same as auth screens |
| Ambient scan lines | 2 pseudo-elements, `position: absolute`, cyan 2% opacity, animate slowly downward at different speeds (8s and 13s) — creates depth |
| MIRD logomark | SVG 64×64px, `#00D4FF`, stroke-draw animation on mount |
| Heading "RAINMACHINE ACTIVATED" | Orbitron 32px 700 `#E8F4F8` letter-spacing 0.1em uppercase, centered |
| Divider line | `width: 120px`, `border-top: 1px solid rgba(0,212,255,0.3)`, centered, fades in |
| Greeting copy | Inter 16px `#7ECFDF`, centered, `max-width: 420px`, word-by-word reveal |
| CTA button | Button Primary, `padding: 16px 48px`, `height: 52px` — larger than auth screens |
| CTA hover | `bg: #1ADCFF`, `box-shadow: 0 0 30px rgba(0,212,255,0.4)` |
| Status dot (boot) | 8px `#00D4FF` PROCESSING, 1.2s fast pulse |
| Status dot (complete) | 8px `#00FF88` ONLINE, 2s standard pulse — changes after boot sequence completes |
| Status label | Share Tech Mono 13px `#7ECFDF`, bottom-center, `margin-bottom: 32px` |

**Animation Spec (boot sequence — plays on mount, total ~1600ms):**

This is a choreographed JARVIS boot sequence. Each element has a precise entry time:

| Time | Event |
|------|-------|
| 0ms | Page fades from full `#050D1A` black to grid-visible background |
| 100ms | MIRD logomark SVG stroke-draws in over 600ms (stroke-dashoffset 1 → 0) |
| 400ms | Logomark glow fades in: `box-shadow: 0 0 40px rgba(0,212,255,0.2)` |
| 700ms | Scan line sweeps horizontally over logo, 800ms, plays once |
| 800ms | "RAINMACHINE ACTIVATED" clips in left-to-right via `clip-path: inset(0 100% 0 0)` → `inset(0 0% 0 0)`, 500ms |
| 1100ms | Divider fades in, 300ms |
| 1200ms | Greeting text reveals word by word, 40ms per word stagger |
| 1400ms | Status dot changes from PROCESSING (blue) to ONLINE (green) with color transition |
| 1450ms | Status label changes from "SYSTEM INITIALIZING..." to "RAINMACHINE SYSTEM — ONLINE" |
| 1500ms | CTA button fades and slides up into view, 300ms `cubic-bezier(0.34,1.56,0.64,1)` |

- `ambient-scan-line-1`: Slow downward sweep, 8s linear infinite, opacity 2% — subtle background texture
- `ambient-scan-line-2`: Slow downward sweep, 13s linear infinite (offset by 4s), opacity 1.5% — creates depth

**Interactive States:**

- **Pre-animation (0–1500ms):** CTA is not yet visible. No interaction possible.
- **Post-animation (1500ms+):** Full UI visible, CTA active, hover states active.
- **CTA hover:** Glow ramps up, button brightens.
- **CTA click:** Button flashes `#00FF88` for 200ms, then page fades out with `opacity: 0` over 400ms, routes to `/onboarding/team-setup`.

**Data Requirements:**
- Inputs: None
- Outputs: None — this is a presentation screen
- API calls: None
- First-name personalization: `user.firstName` from Zustand `authStore` — "GOOD MORNING, [FIRST NAME]."
- Time-of-day greeting: "GOOD MORNING" / "GOOD AFTERNOON" / "GOOD EVENING" based on `new Date().getHours()`. Share Tech Mono clock in top-right corner optional.
- Onboarding guard: Middleware or page-level check — if `user.onboardingComplete === true`, redirect to `/dashboard` immediately.

---

### Screen 2: Team Setup — Add Agents

**Screen ID:** `rm-onboard-team-setup-main`
**Priority:** P1 | **Route:** `/onboarding/team-setup`
**Complexity:** Medium | **Animation:** Simple

**Emotion Target:**
- 0–2s: "Step 1 of 3. This is manageable. I see exactly what I need to do."
- 2–10s: "Adding agents is just filling in a row. It's like a spreadsheet but cleaner."
- 10s+: "I can skip this and come back. There's no pressure. But I want to do it right."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────┐
│  #050D1A background + grid overlay                                │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  MIRD AI  [logo 24px]     SYSTEM CONFIGURATION — STEP 1   │  │
│  │  header: 52px  bg: rgba(10,22,40,0.95)                     │  │
│  │  border-bottom: 1px solid rgba(0,212,255,0.1)              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  STEP INDICATOR — centered below header                    │  │
│  │  ┌──────────────┐  ───  ┌──────────────┐  ───  ┌────────┐ │  │
│  │  │ TEAM SETUP   │       │   ROUTING    │       │ NOTIF. │ │  │
│  │  │  [ACTIVE]    │       │  [inactive]  │       │[inact] │ │  │
│  │  │ Orbitron 11px│       │ Orbitron 11px│       │        │ │  │
│  │  │ #00D4FF      │       │ #2A4A5A      │       │#2A4A5A │ │  │
│  │  │ border-bottom│       │              │       │        │ │  │
│  │  │ 2px #00D4FF  │       │              │       │        │ │  │
│  │  └──────────────┘       └──────────────┘       └────────┘ │  │
│  │  connector: 1px solid rgba(0,212,255,0.2)  width:40px     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  TEAM SETUP                                                │  │
│  │  Orbitron 24px 700 #E8F4F8  mb:4px                        │  │
│  │  ADD YOUR AGENTS TO RAINMACHINE. THEY WILL RECEIVE A      │  │
│  │  WELCOME EMAIL WITH LOGIN INSTRUCTIONS.                    │  │
│  │  Inter 13px #7ECFDF  mb:24px                              │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  AGENT ROSTER — 1 AGENT CONFIGURED                   │ │  │
│  │  │  Orbitron 11px #7ECFDF uppercase  panel header       │ │  │
│  │  │  ──────────────────────────────────────────────────  │ │  │
│  │  │                                                       │ │  │
│  │  │  FULL NAME          EMAIL              ROLE  [×]     │ │  │
│  │  │  ───────────────────────────────────────────────     │ │  │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────┐  [×] │ │  │
│  │  │  │ Sarah Chen   │  │ sarah@...    │  │ AGENT│       │ │  │
│  │  │  └──────────────┘  └──────────────┘  └──────┘       │ │  │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────┐  [×] │ │  │
│  │  │  │ [placeholder]│  │[placeholder] │  │ AGENT│       │ │  │
│  │  │  └──────────────┘  └──────────────┘  └──────┘       │ │  │
│  │  │                                                       │ │  │
│  │  │  [+ ADD AGENT]  Ghost button  Orbitron 11px #00D4FF  │ │  │
│  │  │  ::before content: '+ '  padding: 12px 0             │ │  │
│  │  │                                                       │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  mb:32px                                                   │  │
│  │                                                            │  │
│  │  ┌─── AGENT LIMIT NOTICE ──────────────────────────────┐  │  │
│  │  │  [Info 14px #7ECFDF]  YOU CAN ADD UP TO 20 AGENTS.  │  │  │
│  │  │  ADDITIONAL AGENTS CAN BE CONFIGURED IN SETTINGS.   │  │  │
│  │  │  bg: rgba(0,212,255,0.04)  border: rgba(0,212,255,  │  │  │
│  │  │  0.1)  r:4px  padding:12px 16px  Inter 13px #7ECFDF │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  mb:32px                                                   │  │
│  │                                                            │  │
│  │  [SKIP FOR NOW  →]              [ CONTINUE  → ]          │  │
│  │  Ghost link left                Button Primary right      │  │
│  │  Orbitron 11px #7ECFDF          Orbitron 600 13px         │  │
│  │                                 padding: 12px 32px        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Page background | `#050D1A` + grid overlay |
| Top header | `height: 52px`, `bg: rgba(10,22,40,0.95)`, `border-bottom: 1px solid rgba(0,212,255,0.1)`, MIRD logo + step label |
| Step indicator container | `padding: 20px 0`, centered, `display: flex`, `align-items: center`, `gap: 0` |
| Step — active | Orbitron 11px `#00D4FF` uppercase, `border-bottom: 2px solid #00D4FF`, `padding-bottom: 4px` |
| Step — inactive | Orbitron 11px `#2A4A5A` uppercase |
| Step — completed | Orbitron 11px `#7ECFDF` uppercase, `border-bottom: 2px solid rgba(0,212,255,0.4)`, Lucide `Check` 12px inline |
| Step connector | `width: 40px`, `height: 1px`, `bg: rgba(0,212,255,0.2)` |
| Main panel | `#0A1628`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, `padding: 32px`, panel shadow |
| Panel heading | Orbitron 24px 700 `#E8F4F8` |
| Panel sub-copy | Inter 13px `#7ECFDF`, `margin-bottom: 24px` |
| Agent roster panel | Nested panel card, `padding: 24px`, panel styles |
| Roster header label | Orbitron 11px `#7ECFDF` uppercase, `border-bottom: 1px solid rgba(0,212,255,0.1)`, `padding-bottom: 16px`, `margin-bottom: 16px` |
| Roster column headers | Orbitron 11px `#2A4A5A` uppercase, `padding-bottom: 8px`, `border-bottom: 1px solid rgba(0,212,255,0.08)` |
| Agent input row | `display: grid`, `grid-template-columns: 1fr 1fr 140px 32px`, `gap: 12px`, `align-items: center`, `margin-bottom: 12px` |
| Agent name input | Input Field styles — `bg: rgba(0,212,255,0.04)`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, `height: 40px`, `padding: 8px 12px`, Inter 14px `#E8F4F8` |
| Agent email input | Same as name input |
| Agent role dropdown | Same input styles, `appearance: none`, `background-image: chevron-down icon`, Lucide `ChevronDown` 14px right-aligned, options: AGENT / TEAM LEAD |
| Remove row button | Lucide `X`, 16px, `#2A4A5A`, hover `#FF6B35`, `cursor: pointer`, transition 150ms |
| Add Agent button | Ghost style, `::before content: '+ '`, Orbitron 11px `#00D4FF` uppercase, `padding: 12px 0`, full-width trigger area |
| Info notice | `bg: rgba(0,212,255,0.04)`, `border: 1px solid rgba(0,212,255,0.1)`, `border-radius: 4px`, `padding: 12px 16px`, Inter 13px `#7ECFDF`, Lucide `Info` 14px `#7ECFDF` inline |
| Skip link | Ghost/Link, Orbitron 11px `#7ECFDF` (muted, not primary cyan — intentionally less prominent), `::after content: ' →'` |
| Continue button | Button Primary, `padding: 12px 32px` |
| Footer actions | `display: flex`, `justify-content: space-between`, `align-items: center` |

**Animation Spec:**
- `panel-enter`: Standard stagger — header, step indicator, main panel (200ms), roster section (280ms), info notice (360ms), footer actions (440ms).
- `agent-row-enter`: Each agent row animates in with `panel-enter` (slide up 4px + fade) over 200ms when added.
- `agent-row-exit`: Row animates out with slide down 4px + fade over 150ms when removed.
- `roster-count-update`: The "X AGENT(S) CONFIGURED" count in the roster header does a `data-tick` flash when count changes.

**Interactive States:**

- **Default (empty roster):** Single blank agent row with all three inputs empty. "AGENT ROSTER — 0 AGENTS CONFIGURED".
- **Filled row:** Name/email/phone inputs filled. Remove button (×) active.
- **Row validation on Continue:** All rows with ANY field filled require ALL fields to be valid (name non-empty, email valid format) before advancing. Empty-all rows are ignored.
- **Email duplicate detection:** If two rows have the same email, the second row's email input shows error border: "DUPLICATE EMAIL ADDRESS" below input in Share Tech Mono 12px `#FF6B35`.
- **Max agents reached (20):** "ADD AGENT" button becomes disabled and grayed out. Info notice changes to: "MAXIMUM ROSTER SIZE REACHED (20). ADDITIONAL AGENTS CAN BE ADDED IN SETTINGS."
- **Skip:** Saves empty state (or current partial state), advances to `/onboarding/routing-config`. No validation triggered.
- **Continue:** Validates all filled rows, then `POST /api/teams/{teamId}/agents/bulk` with agent array, then route to `/onboarding/routing-config`.
- **Loading (Continue clicked):** Button shows "SAVING..." with `Loader2` spinner.

**Data Requirements:**
- Inputs: `agents: Array<{ name: string, email: string, role: 'AGENT' | 'TEAM_LEAD' }>`
- Outputs: `{ agentsCreated: number, agents: Agent[] }` — returns created agent records
- API calls: `POST /api/teams/{teamId}/agents/bulk` — body `{ agents: [...] }` — response `{ success, agents }`
- State persistence: Save agent list to Zustand `onboardingStore` so back navigation restores inputs
- On skip: `PATCH /api/users/{userId}` with `{ onboardingTeamSetupSkipped: true }` to track skip analytics

---

### Screen 3: Lead Routing Setup

**Screen ID:** `rm-onboard-routing-config`
**Priority:** P1 | **Route:** `/onboarding/routing-config`
**Complexity:** Medium | **Animation:** Simple

**Emotion Target:**
- 0–2s: "Step 2 of 3. The system already has a working default — I don't have to configure everything."
- 2–10s: "I can see exactly how leads will flow. The visual rule builder is intuitive."
- 10s+: "I feel in control of my lead pipeline. I'm building the system that runs my business."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────┐
│  #050D1A background + grid overlay                                │
│  [Header + step indicator — same as Screen 2, step 2 active]     │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  LEAD ROUTING CONFIGURATION                                │  │
│  │  Orbitron 24px 700 #E8F4F8  mb:4px                        │  │
│  │  DEFINE HOW INCOMING LEADS ARE ASSIGNED TO YOUR AGENTS.   │  │
│  │  Inter 13px #7ECFDF  mb:24px                              │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  DEFAULT ROUTING RULE                                 │ │  │
│  │  │  Orbitron 11px #7ECFDF uppercase  panel header       │ │  │
│  │  │  ──────────────────────────────────────────────────  │ │  │
│  │  │                                                       │ │  │
│  │  │  ROUTE ALL LEADS TO:  [ROUND ROBIN (ALL AGENTS) ▼]  │ │  │
│  │  │  Orbitron 11px #7ECFDF           dropdown: same      │ │  │
│  │  │                                  input styles        │ │  │
│  │  │  ROUND ROBIN DISTRIBUTES LEADS EVENLY ACROSS ALL     │ │  │
│  │  │  AVAILABLE AGENTS. RECOMMENDED FOR MOST TEAMS.       │ │  │
│  │  │  Inter 12px #7ECFDF  mt:8px                          │ │  │
│  │  │                                                       │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  mb:24px                                                   │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  CONDITIONAL ROUTING RULES  (OPTIONAL)               │ │  │
│  │  │  Orbitron 11px #7ECFDF uppercase  panel header       │ │  │
│  │  │  ──────────────────────────────────────────────────  │ │  │
│  │  │                                                       │ │  │
│  │  │  RULE 1                                               │ │  │
│  │  │  WHEN [LEAD SOURCE  ▼]  IS [META ADS    ▼]            │ │  │
│  │  │  ASSIGN TO [SARAH CHEN              ▼]                │ │  │
│  │  │  dropdowns: input styles h:40px   [×] remove btn     │ │  │
│  │  │                                                       │ │  │
│  │  │  RULE 2                                               │ │  │
│  │  │  WHEN [TIME OF DAY  ▼]  IS [AFTER 6PM  ▼]            │ │  │
│  │  │  ASSIGN TO [ON-CALL AGENT            ▼]               │ │  │
│  │  │  [×] remove btn                                      │ │  │
│  │  │                                                       │ │  │
│  │  │  [+ ADD ROUTING RULE]                                 │ │  │
│  │  │  Ghost button  Orbitron 11px #00D4FF                  │ │  │
│  │  │                                                       │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  mb:16px                                                   │  │
│  │                                                            │  │
│  │  ┌─── ROUTING PRIORITY NOTE ───────────────────────────┐  │  │
│  │  │  [Info 14px #7ECFDF]  CONDITIONAL RULES ARE         │  │  │
│  │  │  EVALUATED IN ORDER. THE DEFAULT RULE APPLIES WHEN  │  │  │
│  │  │  NO CONDITIONAL RULES MATCH.                        │  │  │
│  │  │  Inter 12px #7ECFDF  bg:rgba(0,212,255,0.04)        │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  mb:32px                                                   │  │
│  │                                                            │  │
│  │  [← BACK]              [SKIP FOR NOW →]    [CONTINUE →]  │  │
│  │  Ghost link #7ECFDF    Ghost link #7ECFDF  Btn Primary    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Page / header / step indicator | Same as Screen 2, step 2 now active |
| Step 1 (TEAM SETUP) | Orbitron 11px `#7ECFDF`, `border-bottom: 2px solid rgba(0,212,255,0.4)`, Lucide `Check` 12px inline — COMPLETED state |
| Step 2 (ROUTING) | Orbitron 11px `#00D4FF`, `border-bottom: 2px solid #00D4FF` — ACTIVE |
| Main panel | Same panel card styles |
| Default rule panel | Nested panel card |
| Rule statement | `display: flex`, `align-items: center`, `gap: 12px`, `flex-wrap: wrap` |
| Rule label | Orbitron 11px `#7ECFDF` uppercase — "ROUTE ALL LEADS TO:" |
| Default route dropdown | Input Field styles, `height: 40px`, `min-width: 240px`, options: ROUND ROBIN (ALL AGENTS) / SPECIFIC AGENT / FIRST AVAILABLE |
| Default route helper text | Inter 12px `#7ECFDF`, `margin-top: 8px` |
| Conditional rules panel | Nested panel card |
| Rule row | `display: grid`, `grid-template-columns: auto 1fr auto 1fr auto 1fr 32px`, `gap: 8px`, `align-items: center`, `margin-bottom: 16px` |
| Rule connector labels | Orbitron 11px `#7ECFDF` uppercase — "WHEN" / "IS" / "ASSIGN TO" |
| Rule condition dropdown | Input Field styles, `height: 40px`, options for each position |
| Condition type options | LEAD SOURCE / TIME OF DAY / AGENT CAPACITY / GEOGRAPHIC AREA |
| Condition value options (LEAD SOURCE) | META ADS / GOOGLE ADS / ORGANIC / REFERRAL / DIRECT |
| Condition value options (TIME OF DAY) | BUSINESS HOURS (9AM-5PM) / AFTER 6PM / WEEKENDS |
| Assignment dropdown | Input Field styles, populated with agent names from team setup step (or empty if skipped) |
| Remove rule button | Lucide `X`, 16px, `#2A4A5A`, hover `#FF6B35`, transition 150ms |
| Add Rule button | Ghost link, Orbitron 11px `#00D4FF`, `::before '+ '` |
| Info notice | Same as Screen 2 info notice style |
| Back button | Ghost link, Orbitron 11px `#7ECFDF`, `::before '← '` |
| Skip link | Ghost link, Orbitron 11px `#7ECFDF` (muted) |
| Continue button | Button Primary |

**Animation Spec:**
- `panel-enter`: Standard stagger. Default rule panel enters at 200ms, conditional panel at 280ms, info notice at 360ms, footer at 440ms.
- `rule-row-enter`: New rule rows animate in with slide-up 4px + fade over 200ms when "ADD ROUTING RULE" is clicked.
- `rule-row-exit`: Rows animate out slide-down + fade over 150ms on remove.
- `step-complete-transition`: Step 1 indicator transitions to completed state (Lucide `Check` appears, color shifts to `#7ECFDF`) at 80ms after this screen mounts.

**Interactive States:**

- **Default:** Default rule pre-populated with ROUND ROBIN. Conditional rules section empty (no rules added yet).
- **Adding a rule:** Click "+ ADD ROUTING RULE" → new empty rule row animates in. All three dropdowns start at placeholder state (Select...).
- **Dropdown open:** Custom dropdown opens with JARVIS-styled option list: `bg: #0A1628`, `border: 1px solid rgba(0,212,255,0.3)`, each option: Inter 14px `#E8F4F8`, hover `bg: rgba(0,212,255,0.08)`.
- **Incomplete rule:** If user clicks Continue with a partially-filled conditional rule, show inline error below that rule: Orbitron 11px `#FF7D52` "RULE INCOMPLETE — FILL ALL FIELDS OR REMOVE".
- **Skip:** Saves default rule only, skips conditional rules, advances to `/onboarding/notifications`.
- **Back:** Saves current state to `onboardingStore`, routes to `/onboarding/team-setup`.
- **Continue loading:** "SAVING RULES..." with `Loader2`.

**Data Requirements:**
- Inputs: `defaultRule: { assignmentType: 'ROUND_ROBIN' | 'SPECIFIC_AGENT' | 'FIRST_AVAILABLE', agentId?: string }`, `conditionalRules: Array<{ conditionType, conditionValue, assignmentType, agentId? }>`
- Outputs: `{ rules: RoutingRule[] }`
- API calls: `POST /api/teams/{teamId}/routing-rules` — body `{ defaultRule, conditionalRules }` — response `{ success, rules }`
- Agent list for dropdowns: Loaded from `onboardingStore.agents` (populated in team setup step) OR `GET /api/teams/{teamId}/agents` if agents were saved but store was cleared
- State persistence: Save current rule config to `onboardingStore.routingRules`

---

### Screen 4: Notification Preferences

**Screen ID:** `rm-onboard-notifications-setup`
**Priority:** P1 | **Route:** `/onboarding/notifications`
**Complexity:** Simple | **Animation:** Simple

**Emotion Target:**
- 0–2s: "Step 3 of 3. Almost done. This is just toggle switches."
- 2–10s: "I can see exactly what I'll be notified about. Email and SMS — I'm in control."
- 10s+: "Everything I need is on. I'm ready to go live."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────┐
│  #050D1A background + grid overlay                                │
│  [Header + step indicator — step 3 active, steps 1+2 complete]   │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  NOTIFICATION PREFERENCES                                  │  │
│  │  Orbitron 24px 700 #E8F4F8  mb:4px                        │  │
│  │  CONFIGURE HOW RAINMACHINE ALERTS YOU AND YOUR TEAM.       │  │
│  │  Inter 13px #7ECFDF  mb:24px                              │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  ALERT CONFIGURATION                                  │ │  │
│  │  │  Orbitron 11px #7ECFDF uppercase  panel header       │ │  │
│  │  │  ──────────────────────────────────────────────────  │ │  │
│  │  │                                                       │ │  │
│  │  │       NOTIFICATION           EMAIL    SMS             │ │  │
│  │  │       COLUMN HEADERS         ──────   ──────          │ │  │
│  │  │       Orbitron 11px #2A4A5A                           │ │  │
│  │  │                                                       │ │  │
│  │  │  ┌───────────────────────────────────────────────┐   │ │  │
│  │  │  │ NEW LEAD ALERT                                 │   │ │  │
│  │  │  │ Orbitron 13px #E8F4F8  600                    │   │ │  │
│  │  │  │ Immediately when a new lead enters the system │   │ │  │
│  │  │  │ Inter 12px #7ECFDF                            │   │ │  │
│  │  │  │                            [●ON]    [●ON]     │   │ │  │
│  │  └────────────────────────────────────────────────   │   │ │  │
│  │  │  ┌───────────────────────────────────────────────┐   │ │  │
│  │  │  │ APPOINTMENT BOOKED                            │   │ │  │
│  │  │  │ When a lead schedules a showing or call       │   │ │  │
│  │  │  │                            [●ON]    [●ON]     │   │ │  │
│  │  │  └───────────────────────────────────────────────┘   │ │  │
│  │  │  ┌───────────────────────────────────────────────┐   │ │  │
│  │  │  │ LEAD STATUS CHANGE                            │   │ │  │
│  │  │  │ When a lead moves stages in the pipeline      │   │ │  │
│  │  │  │                            [●ON]    [○OFF]    │   │ │  │
│  │  │  └───────────────────────────────────────────────┘   │ │  │
│  │  │  ┌───────────────────────────────────────────────┐   │ │  │
│  │  │  │ DAILY SUMMARY                                 │   │ │  │
│  │  │  │ End-of-day pipeline activity digest           │   │ │  │
│  │  │  │                            [●ON]    [─ N/A]   │   │ │  │
│  │  │  └───────────────────────────────────────────────┘   │ │  │
│  │  │  ┌───────────────────────────────────────────────┐   │ │  │
│  │  │  │ WEEKLY REPORT                                 │   │ │  │
│  │  │  │ Monday morning performance report             │   │ │  │
│  │  │  │                            [●ON]    [─ N/A]   │   │ │  │
│  │  │  └───────────────────────────────────────────────┘   │ │  │
│  │  │                                                       │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  mb:24px                                                   │  │
│  │                                                            │  │
│  │  ┌─── SMS NOTICE ──────────────────────────────────────┐  │  │
│  │  │  [Smartphone 14px #7ECFDF]  SMS ALERTS WILL BE SENT │  │  │
│  │  │  TO YOUR REGISTERED MOBILE NUMBER. STANDARD         │  │  │
│  │  │  MESSAGE RATES MAY APPLY.                           │  │  │
│  │  │  Inter 12px #7ECFDF                                 │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  mb:32px                                                   │  │
│  │                                                            │  │
│  │  [← BACK]                           [COMPLETE SETUP →]  │  │
│  │  Ghost link #7ECFDF                  Button Primary       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Page / header / step indicator | Same as previous screens, steps 1+2 now in completed state |
| Step 3 (NOTIFICATIONS) | Orbitron 11px `#00D4FF`, `border-bottom: 2px solid #00D4FF` — ACTIVE |
| Main panel | Same panel card styles |
| Alert config panel | Nested panel card |
| Column header labels | Orbitron 11px `#2A4A5A` uppercase — "NOTIFICATION" / "EMAIL" / "SMS" |
| Notification row | `display: grid`, `grid-template-columns: 1fr 56px 56px`, `align-items: center`, `padding: 16px 0`, `border-bottom: 1px solid rgba(0,212,255,0.08)` (last row no border) |
| Row title | Orbitron 13px 600 `#E8F4F8` uppercase, `margin-bottom: 2px` |
| Row description | Inter 12px `#7ECFDF` |
| Toggle — ON | `width: 44px`, `height: 24px`, `bg: #00D4FF`, `border-radius: 9999px`, thumb: `width: 18px`, `height: 18px`, white, right-aligned. `box-shadow: 0 0 8px rgba(0,212,255,0.4)` |
| Toggle — OFF | Same size, `bg: rgba(0,212,255,0.12)`, `border: 1px solid rgba(0,212,255,0.2)`, thumb left-aligned |
| Toggle N/A | `width: 44px`, `height: 24px`, `bg: rgba(42,74,90,0.3)`, `border: 1px solid rgba(42,74,90,0.4)`, `border-radius: 9999px`, dash centered: `#2A4A5A`, not clickable |
| Toggle transition | `transition: background-color 200ms ease, box-shadow 200ms ease` + thumb slide `transform: translateX()` 200ms |
| SMS notice | `bg: rgba(0,212,255,0.04)`, `border: 1px solid rgba(0,212,255,0.1)`, `border-radius: 4px`, `padding: 12px 16px`, Lucide `Smartphone` 14px `#7ECFDF`, Inter 12px `#7ECFDF` |
| Back link | Ghost link, Orbitron 11px `#7ECFDF`, `::before '← '` |
| Complete Setup CTA | "COMPLETE SETUP →" — Button Primary, `padding: 12px 32px` |

**Animation Spec:**
- `panel-enter`: Standard stagger.
- `toggle-on-transition`: When toggled ON — thumb slides right, bg transitions from `rgba(0,212,255,0.12)` to `#00D4FF`, glow fades in. 200ms ease.
- `toggle-off-transition`: Reverse of above.
- `row-stagger`: Notification rows stagger in with 60ms delay each (5 rows = 300ms total stagger).

**Interactive States:**

- **Default:** All email toggles ON, New Lead and Appointment SMS toggles ON, Status Change SMS OFF. Daily Summary and Weekly Report SMS show N/A.
- **Toggle interaction:** Click toggles ON/OFF with animation. N/A toggles are non-interactive (`pointer-events: none`, `opacity: 0.5`).
- **All off edge case:** If user turns off ALL notifications, show advisory below panel: `AlertTriangle` 14px `#FFB800` + "AT LEAST ONE NOTIFICATION TYPE RECOMMENDED — YOU CAN UPDATE THIS IN SETTINGS." Orbitron 11px `#FFB800`. Does NOT block completion.
- **Back:** Saves current toggle state to `onboardingStore`, routes to `/onboarding/routing-config`.
- **Complete Setup:** Validates nothing (no required fields), calls API, routes to `/onboarding/complete`.
- **Loading:** "ACTIVATING SYSTEM..." in CTA with `Loader2`.

**Data Requirements:**
- Inputs: `notifications: { newLeadAlert: { email: boolean, sms: boolean }, appointmentBooked: { email: boolean, sms: boolean }, leadStatusChange: { email: boolean, sms: boolean }, dailySummary: { email: boolean }, weeklyReport: { email: boolean } }`
- Outputs: `{ success: boolean }`
- API calls: `PATCH /api/users/{userId}/notification-preferences` — body `{ notifications }` — response `{ success }`
- Second API call (after preferences saved): `PATCH /api/users/{userId}` — body `{ onboardingComplete: true }` — marks onboarding complete server-side
- State persistence: Save to `onboardingStore.notifications` for back navigation

---

### Screen 5: Setup Complete — System Online

**Screen ID:** `rm-onboard-setup-complete`
**Priority:** P1 | **Route:** `/onboarding/complete`
**Complexity:** Simple | **Animation:** Complex

**Emotion Target:**
- 0–2s: "Something significant just completed. The system is confirming it piece by piece."
- 2–10s: "Each module illuminating means my system is live. This feels real."
- 10s+: "I built something. It's running. I'm ready to open the command center."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────┐
│  #050D1A — full viewport                                          │
│  background-image: grid pattern + ambient scan lines             │
│                                                                    │
│                                                                    │
│                    [MIRD LOGOMARK 64px #00D4FF]                   │
│                    centered  mt: auto (vertically centered)       │
│                    glow: box-shadow 0 0 40px rgba(0,212,255,0.3) │
│                    mb:32px                                         │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  SYSTEM ACTIVATION SEQUENCE                              │    │
│  │  Orbitron 11px #7ECFDF uppercase  mb:24px  centered      │    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────────────────────┐  │    │
│  │  │  Module status list — 3 items                      │  │    │
│  │  │  appear sequentially during animation              │  │    │
│  │  │                                                     │  │    │
│  │  │  [CheckCircle 20px #00FF88]  TEAM CONFIGURED        │  │    │
│  │  │  glow: 0 0 8px #00FF88  illuminates at 0ms         │  │    │
│  │  │  Share Tech Mono 16px #E8F4F8                       │  │    │
│  │  │                                                     │  │    │
│  │  │  [CheckCircle 20px #00FF88]  ROUTING ACTIVE         │  │    │
│  │  │  illuminates at 400ms                               │  │    │
│  │  │                                                     │  │    │
│  │  │  [CheckCircle 20px #00FF88]  NOTIFICATIONS SET      │  │    │
│  │  │  illuminates at 800ms                               │  │    │
│  │  │                                                     │  │    │
│  │  └────────────────────────────────────────────────────┘  │    │
│  │  mb:32px                                                  │    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────────────────────┐  │    │
│  │  │  INITIALIZING RAINMACHINE...    [══════════════]   │  │    │
│  │  │  Orbitron 11px #7ECFDF          progress bar       │  │    │
│  │  │  display until 1200ms           fills 0→100%       │  │    │
│  │  │                                 bg: #00D4FF  h:4px  │  │    │
│  │  └────────────────────────────────────────────────────┘  │    │
│  │                                                          │    │
│  │  RAINMACHINE SYSTEM — ONLINE                            │    │
│  │  Orbitron 24px 700 #E8F4F8  letter-spacing 0.1em        │    │
│  │  fades in + builds letter by letter at 1600ms           │    │
│  │  centered  mb:8px                                        │    │
│  │                                                          │    │
│  │  [●] ONLINE     YOUR SYSTEM IS LIVE.                    │    │
│  │  Status dot 8px #00FF88 + Share Tech Mono 16px #00FF88  │    │
│  │  fades in at 1800ms  centered  mb:32px                  │    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────────────────────┐  │    │
│  │  │        OPEN COMMAND CENTER  →                      │  │    │
│  │  │  Button Primary                                    │  │    │
│  │  │  bg: #00D4FF  text: #050D1A                        │  │    │
│  │  │  Orbitron 600 13px uppercase                       │  │    │
│  │  │  padding: 16px 48px  h:52px                        │  │    │
│  │  │  fades in at 2000ms                                │  │    │
│  │  └────────────────────────────────────────────────────┘  │    │
│  │                                                          │    │
│  │  REDIRECTING TO DASHBOARD IN   5                        │    │
│  │  Orbitron 11px #7ECFDF + Share Tech Mono 32px #7ECFDF   │    │
│  │  fades in at 2200ms  auto-advances on countdown         │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Page background | `#050D1A` full viewport + grid + ambient scan lines |
| MIRD logomark | SVG 64×64px, `#00D4FF`, `box-shadow: 0 0 40px rgba(0,212,255,0.3)`, centered |
| "SYSTEM ACTIVATION SEQUENCE" label | Orbitron 11px `#7ECFDF` uppercase, centered, `margin-bottom: 24px` |
| Module status item | `display: flex`, `align-items: center`, `gap: 12px`, `margin-bottom: 12px` |
| Module icon — unlit | Lucide `Circle`, 20px, `#2A4A5A` — before illumination |
| Module icon — lit | Lucide `CheckCircle2`, 20px, `#00FF88`, `box-shadow: 0 0 8px rgba(0,255,136,0.5)` |
| Module text — unlit | Share Tech Mono 16px `#2A4A5A` — before illumination |
| Module text — lit | Share Tech Mono 16px `#E8F4F8` — after illumination |
| Progress bar container | `height: 4px`, `bg: rgba(0,212,255,0.1)`, `border-radius: 2px`, `width: 320px`, centered |
| Progress bar fill | `bg: #00D4FF`, `height: 4px`, `border-radius: 2px`, `box-shadow: 0 0 8px rgba(0,212,255,0.4)`, width animates 0 → 100% |
| Progress label | Orbitron 11px `#7ECFDF`, `margin-bottom: 8px` — "INITIALIZING RAINMACHINE..." |
| "RAINMACHINE SYSTEM — ONLINE" heading | Orbitron 24px 700 `#E8F4F8` letter-spacing 0.1em, centered, reveals after progress bar |
| ONLINE status | Status dot 8px `#00FF88` + Share Tech Mono 16px `#00FF88`, `box-shadow: 0 0 6px #00FF88`, inline flex, centered |
| "YOUR SYSTEM IS LIVE." text | Share Tech Mono 16px `#00FF88`, centered |
| CTA button | Button Primary, `padding: 16px 48px`, `height: 52px`, "OPEN COMMAND CENTER →" |
| Countdown | Orbitron 11px `#7ECFDF` + Share Tech Mono 32px `#7ECFDF` side by side, centered |

**Animation Spec (activation sequence — total ~2200ms):**

| Time | Event |
|------|-------|
| 0ms | Page fades from `#050D1A` to grid-visible background |
| 100ms | MIRD logomark fades in with glow, 400ms ease |
| 300ms | "SYSTEM ACTIVATION SEQUENCE" label fades in |
| 500ms | Module 1 "TEAM CONFIGURED" — Circle icon transitions to `CheckCircle2`, color transitions gray → green, glow appears. 300ms spring. |
| 900ms | Module 2 "ROUTING ACTIVE" — same illumination sequence |
| 1300ms | Module 3 "NOTIFICATIONS SET" — same illumination sequence |
| 1400ms | Progress bar container fades in. Fill animates from 0% to 100% over 800ms `cubic-bezier(0.25,0.46,0.45,0.94)`. Label "INITIALIZING RAINMACHINE..." visible. |
| 1600ms | "RAINMACHINE SYSTEM — ONLINE" heading clips in left→right, 400ms |
| 1800ms | Status dot (ONLINE green) + "YOUR SYSTEM IS LIVE." fades in, 300ms |
| 2000ms | CTA button slides up 8px + fades in, 400ms spring |
| 2200ms | Countdown "REDIRECTING TO DASHBOARD IN 5" fades in |
| 2200–7200ms | Countdown ticks 5 → 4 → 3 → 2 → 1 → 0 with `data-tick` flash each second |
| 7200ms | Page fades out, router pushes to `/dashboard` |

- `module-illuminate`: Icon and text color transition + glow appear, 300ms `cubic-bezier(0.34,1.56,0.64,1)` spring
- `progress-fill`: Width 0 → 100% over 800ms `cubic-bezier(0.25,0.46,0.45,0.94)`
- `heading-wipe`: `clip-path: inset(0 100% 0 0)` → `inset(0 0% 0 0)`, 400ms ease-out
- `status-pulse`: ONLINE dot animates `system-pulse 2s ease-in-out infinite` after appearing
- `data-tick`: Countdown number flashes `#1ADCFF` → `#7ECFDF` on each decrement, 150ms ease-out

**Interactive States:**

- **Animation playing (0–2200ms):** CTA not visible. No interaction possible. Page is purely presentational.
- **Post-animation (2200ms+):** CTA and countdown visible.
- **CTA hover:** `bg: #1ADCFF`, `box-shadow: 0 0 30px rgba(0,212,255,0.4)`.
- **CTA click:** Interrupt countdown. Page fades out over 400ms, router pushes to `/dashboard`.
- **Countdown complete:** Same fade-out and route to `/dashboard`.
- **No "skip" or "back":** This is a completion screen — no backward navigation. The onboarding is marked complete server-side before this screen renders.

**Data Requirements:**
- Inputs: None — all data was saved in previous steps
- Outputs: None
- API calls: None on this screen — `onboardingComplete: true` was set in Screen 4's API call
- Routing: On countdown complete OR CTA click → `router.push('/dashboard')`
- Dashboard initial load: First-time dashboard will show empty state patterns (no leads, no activity) — handled by F-03-RM-DASHBOARD
- Guard: If `user.onboardingComplete === false` for any reason and user tries to access `/dashboard`, middleware redirects back to `/onboarding/welcome`

---

## 5. Stack Integration

### Required Libraries

(All libraries are the same as Flow 01 — no additional installs required for this flow)

| Library | Purpose in This Flow |
|---------|---------------------|
| `react-hook-form` + `zod` | Agent add form validation in team setup |
| `framer-motion` | Welcome splash boot sequence, setup-complete activation sequence |
| `@tanstack/react-query` | API calls to save agents, routing rules, notification prefs |
| `zustand` | `onboardingStore` for wizard state persistence across steps |
| `lucide-react` | All icons — `CheckCircle2`, `Circle`, `X`, `Plus`, `Info`, `Smartphone`, etc. |
| `sonner` | Toast if API call fails silently (e.g., agent save fails) |

### Implementation Patterns

**Onboarding Store (Zustand):**
```typescript
// src/store/onboardingStore.ts
import { create } from 'zustand'

interface AgentInput {
  id: string   // local UUID for key tracking
  name: string
  email: string
  role: 'AGENT' | 'TEAM_LEAD'
}

interface RoutingRule {
  id: string
  conditionType: string
  conditionValue: string
  assignmentType: string
  agentId?: string
}

interface NotificationPreferences {
  newLeadAlert: { email: boolean; sms: boolean }
  appointmentBooked: { email: boolean; sms: boolean }
  leadStatusChange: { email: boolean; sms: boolean }
  dailySummary: { email: boolean }
  weeklyReport: { email: boolean }
}

interface OnboardingState {
  currentStep: 1 | 2 | 3
  agents: AgentInput[]
  defaultRoutingRule: string
  conditionalRules: RoutingRule[]
  notifications: NotificationPreferences
  setAgents: (agents: AgentInput[]) => void
  setRoutingRules: (defaultRule: string, conditionalRules: RoutingRule[]) => void
  setNotifications: (prefs: NotificationPreferences) => void
  setStep: (step: 1 | 2 | 3) => void
  reset: () => void
}

const defaultNotifications: NotificationPreferences = {
  newLeadAlert: { email: true, sms: true },
  appointmentBooked: { email: true, sms: true },
  leadStatusChange: { email: true, sms: false },
  dailySummary: { email: true },
  weeklyReport: { email: true },
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  agents: [],
  defaultRoutingRule: 'ROUND_ROBIN',
  conditionalRules: [],
  notifications: defaultNotifications,
  setAgents: (agents) => set({ agents }),
  setRoutingRules: (defaultRoutingRule, conditionalRules) =>
    set({ defaultRoutingRule, conditionalRules }),
  setNotifications: (notifications) => set({ notifications }),
  setStep: (currentStep) => set({ currentStep }),
  reset: () =>
    set({
      currentStep: 1,
      agents: [],
      defaultRoutingRule: 'ROUND_ROBIN',
      conditionalRules: [],
      notifications: defaultNotifications,
    }),
}))
```

**Onboarding Guard Middleware:**
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protected routes that require onboarding completion
  const dashboardRoutes = ['/dashboard', '/leads', '/agents', '/campaigns', '/reports']
  const onboardingRoutes = ['/onboarding']

  const token = request.cookies.get('auth_token')?.value
  const onboardingComplete = request.cookies.get('onboarding_complete')?.value

  if (!token && !pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (token && dashboardRoutes.some((r) => pathname.startsWith(r)) && onboardingComplete !== 'true') {
    return NextResponse.redirect(new URL('/onboarding/welcome', request.url))
  }

  if (token && onboardingComplete === 'true' && pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/leads/:path*'],
}
```

**Toggle Component:**
```typescript
// src/components/ui/ToggleSwitch.tsx
interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
}

// ON state:  bg #00D4FF, thumb right, box-shadow 0 0 8px rgba(0,212,255,0.4)
// OFF state: bg rgba(0,212,255,0.12), border rgba(0,212,255,0.2), thumb left
// N/A state: disabled prop, bg rgba(42,74,90,0.3), pointer-events none
// Transition: 200ms ease on all properties + thumb translateX
```

**Wizard Step Indicator:**
```typescript
// src/components/onboarding/WizardStepIndicator.tsx
// Steps: ['TEAM SETUP', 'ROUTING', 'NOTIFICATIONS']
// Each step has 3 states: 'pending' | 'active' | 'complete'
// pending: Orbitron 11px #2A4A5A
// active:  Orbitron 11px #00D4FF, border-bottom 2px solid #00D4FF
// complete: Orbitron 11px #7ECFDF, border-bottom 2px solid rgba(0,212,255,0.4), CheckCircle2 12px inline
// connector: 40px wide, 1px solid rgba(0,212,255,0.2)
```

**Boot Sequence Animation (Framer Motion):**
```typescript
// src/components/onboarding/SetupCompleteSequence.tsx
// Use Framer Motion variants for orchestrated stagger:

const moduleVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.4, duration: 0.3 }
  })
}

// Each module item uses custom delay via 'custom' prop
// Progress bar: animate={{ width: '100%' }} transition={{ delay: 1.4, duration: 0.8 }}
// Heading: animate={{ clipPath: 'inset(0 0% 0 0)' }} from 'inset(0 100% 0 0)'
// CTA: animate={{ opacity: 1, y: 0 }} from { opacity: 0, y: 8 } at delay 2.0s
```

**File structure for onboarding flow:**
```
src/
  app/
    onboarding/
      layout.tsx              ← shared header + step indicator wrapper
      welcome/
        page.tsx              ← rm-onboard-welcome-splash
      team-setup/
        page.tsx              ← rm-onboard-team-setup-main
      routing-config/
        page.tsx              ← rm-onboard-routing-config
      notifications/
        page.tsx              ← rm-onboard-notifications-setup
      complete/
        page.tsx              ← rm-onboard-setup-complete
  components/
    onboarding/
      WelcomeSplash.tsx
      WizardStepIndicator.tsx
      AgentRosterTable.tsx
      AgentInputRow.tsx
      RoutingRuleBuilder.tsx
      RoutingRuleRow.tsx
      NotificationToggleRow.tsx
      SetupCompleteSequence.tsx
    ui/
      ToggleSwitch.tsx
  store/
    onboardingStore.ts
```

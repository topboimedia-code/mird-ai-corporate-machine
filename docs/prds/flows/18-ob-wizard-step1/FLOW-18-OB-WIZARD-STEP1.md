# Flow PRD: Onboarding Portal — Wizard Step 1 (System Initialization)

**Flow ID:** F-18-OB-WIZARD-STEP1
**App:** Onboarding Portal (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 3 screens | P0: 1 | P1: 2 | P2: 0

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | `ob-access-token-validating` (success) |
| **Exit Points** | `ob-wizard-step2-main` (BEGIN SETUP click) |
| **Primary User** | New MIRD client completing onboarding |
| **Dependencies** | Client contract data (pre-populated from CRM), progress persistence API |
| **Purpose** | Welcome screen — confirm client details, review contract summary, begin setup |

---

## 1A. Wizard Layout (All Steps Share This)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  #050D1A  full viewport  grid pattern bg                                 │
│                                                                          │
│  [MIRD LOGOMARK 32px  #00D4FF]  MAKE IT RAIN DIGITAL                    │
│  centered top  Orbitron 14px 600 #7ECFDF  padding-top: 32px             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  WIZARD PANEL  max-width: 720px  centered  padding: 48px           │ │
│  │  Panel card                                                        │ │
│  │                                                                    │ │
│  │  STEP INDICATOR (horizontal, top of panel):                        │ │
│  │  ①─────②─────③─────④─────⑤                                        │ │
│  │  active  upcoming  upcoming  upcoming  upcoming                     │ │
│  │  36px circles  connector 2px                                       │ │
│  │                                                                    │ │
│  │  [Step content below]                                              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Step indicator tokens:**
- Active: `bg: #00D4FF`, `color: #050D1A`, `box-shadow: 0 0 16px rgba(0,212,255,0.4)`, Orbitron 14px
- Completed: `bg: #00FF88`, `color: #050D1A`
- Upcoming: `transparent`, `border: 1px solid rgba(0,212,255,0.2)`, `color: #2A4A5A`
- Connector active: `#00D4FF` | Connector upcoming: `rgba(0,212,255,0.2)`, `height: 2px`

---

## 4. Screen Specifications

---

### Screen 1: Step 1 — System Initialization

**Screen ID:** `ob-wizard-step1-main`
**Priority:** P0 | **Route:** `/setup/step-1`
**Complexity:** Medium | **Animation:** Complex

**Emotion Target:**
- 0–2s: "This is serious and professional. My information is already here — they know who I am."
- 2–10s: "This is confirming what we agreed on. I feel confident about clicking BEGIN SETUP."
- 10s+: "This is going to take me somewhere meaningful. I'm starting something real."

**Wireframe:**
```
[Wizard layout — Step 1 active in indicator]

│  SYSTEM INITIALIZATION                                                  │
│  Orbitron 18px 600 #E8F4F8  mb:4px                                      │
│  STEP 1 OF 5                                                            │
│  STM 11px #7ECFDF  mb:24px                                              │
│  border-bottom: 1px solid rgba(0,212,255,0.1)  pb:24px                  │
│                                                                         │
│  Welcome, [Client Business Name].                                       │
│  Inter 20px 500 #E8F4F8  mb:8px                                         │
│                                                                         │
│  Your RainMachine system is ready to be configured.                    │
│  Please confirm your details below, then begin setup.                  │
│  Inter 15px #7ECFDF  mb:32px                                            │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  CONTRACT SUMMARY  Panel card (nested, bg: rgba(0,212,255,0.02)) │  │
│  │  border: 1px solid rgba(0,212,255,0.1)  padding: 24px            │  │
│  │                                                                  │  │
│  │  CONTRACT SUMMARY  Orb 11px #7ECFDF  mb:12px                    │  │
│  │                                                                  │  │
│  │  BUSINESS NAME   Marcus Leads Group                             │  │
│  │  Orb 11px muted  STM 13px #E8F4F8                               │  │
│  │  PACKAGE         RainMachine Pro                                │  │
│  │  START DATE      April 1, 2026                                  │  │
│  │  ACCOUNT MANAGER Shomari Williams                               │  │
│  │  MRR             $4,200 / month                                 │  │
│  │                                                                  │  │
│  │  Details incorrect?  CONTACT SUPPORT  →  Ghost btn              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                              mb:32px                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  BEGIN SETUP  →                                                  │  │
│  │  Primary button  h:52px  w:100%  Orbitron 600 13px uppercase     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Step title | Orbitron 18px 600 `#E8F4F8` |
| Step label | Share Tech Mono 11px `#7ECFDF` — "STEP 1 OF 5" |
| Welcome greeting | Inter 20px 500 `#E8F4F8` — personalized with business name |
| Contract summary card | Nested panel: `bg: rgba(0,212,255,0.02)`, `border: 1px solid rgba(0,212,255,0.1)` |
| Contract row label | Orbitron 11px `#7ECFDF` uppercase, `min-width: 160px` |
| Contract row value | Share Tech Mono 13px `#E8F4F8` |
| Support link | Ghost button, Orbitron 11px, routes to `ob-wizard-step1-wrong-details` |
| CTA | "BEGIN SETUP", Primary button, `height: 52px`, `width: 100%` |

**Animation Spec:**
- `panel-enter`: Wizard panel slides up 8px + fade, 400ms spring.
- `scan-line`: Single sweep on mount (system is "booting").
- `step-indicator-enter`: Step circles stagger in 100ms apart with subtle scale 0.8→1.
- `contract-card-enter`: Contract card enters at 300ms with 200ms fade.
- `begin-btn-pulse`: BEGIN SETUP button has a subtle `ambient-glow` animation — 3s alternate, breathing border glow. Draws attention without being obnoxious.

---

### Screen 2: Step 1 — Contract Details Wrong

**Screen ID:** `ob-wizard-step1-wrong-details`
**Priority:** P1 | **Route:** `/setup/step-1` (state variant)

**Wireframe:**
```
[Below the contract summary card, instead of BEGIN SETUP:]

┌──────────────────────────────────────────────────────────────────────────┐
│  CONTACT PANEL  Panel card nested                                        │
│  border: 1px solid rgba(255,184,0,0.3)  padding: 24px                   │
│                                                                          │
│  DETAILS INCORRECT?  Orb 13px 600 #FFB800  mb:8px                       │
│                                                                          │
│  Contact your MIRD account manager to correct your contract details.    │
│  Inter 14px #7ECFDF  mb:16px                                             │
│                                                                          │
│  Shomari Williams — Account Manager                                      │
│  Orbitron 13px #E8F4F8  mb:4px                                           │
│  shomari@makeitrain.digital                                              │
│  STM 13px #00D4FF  (mailto link, hover glow)                            │
│  +1 (555) 000-0000                                                       │
│  STM 13px #7ECFDF                                                        │
│                                              mb:16px                    │
│  [←] BACK TO CONFIRMATION  Ghost btn                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Screen 3: Step 1 — Progress Restored

**Screen ID:** `ob-wizard-step1-progress-restored`
**Priority:** P1 | **Route:** `/setup/step-[n]` (returning user)

**Wireframe:**
```
[Banner at top of wizard panel, above step indicator]

┌──────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  PROGRESS RESTORED  bg: rgba(0,212,255,0.08)                     │  │
│  │  border: 1px solid rgba(0,212,255,0.2)  border-radius: 4px 4px 0 0│  │
│  │  padding: 12px 16px                                              │  │
│  │                                                                  │  │
│  │  [Lucide RotateCcw 14px #00D4FF]  PROGRESS RESTORED              │  │
│  │  Orbitron 11px #00D4FF  inline  mr:8px                           │  │
│  │  Your progress has been restored. Continue from where you left off│  │
│  │  Inter 13px #E8F4F8                                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [Step indicator — active step = wherever user left off]                 │
│  [Step content for that step]                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**
- Banner: `bg: rgba(0,212,255,0.08)`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px 4px 0 0` (connects seamlessly to panel above step indicator)
- Banner animates in from top with slide-down, 300ms ease-out
- Dismissible after 5 seconds (auto-fades) or on user click

# Flow PRD: Onboarding Portal — Portal Access

**Flow ID:** F-17-OB-PORTAL-ACCESS
**App:** Onboarding Portal (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first (mobile suggestion shown)
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 3 screens | P0: 2 | P1: 0 | P2: 1

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | Unique token URL sent to new client by email: `onboard.makeitrain.digital?token=[uuid]` |
| **Exit Points** | Valid token → `ob-wizard-step1-main` / Invalid → support contact |
| **Primary User** | New MIRD client (business owner / team member) completing onboarding |
| **Dependencies** | Token validation API, JWT or signed URL verification |
| **URL Prefix** | `/?token=[uuid]` |

---

## 1A. UI Profile Compliance

**Profile:** MIRD JARVIS Dark v1.0
**Onboarding layout:** Centered wizard layout, `max-width: 720px`, `padding: 48px`. No sidebar. No header nav. This is a focused flow — one task, one screen at a time.
**Step indicator:** Horizontal numbered indicator across top of wizard panel.

---

## 2. CMO Context

**Conversion stake:** The portal access moment is the client's first encounter with MIRD technology. If the token validation fails or feels broken, they call support instead of completing setup. The token validating animation must communicate "working intelligently," not "loading."

---

## 3. Screen Specifications

---

### Screen 1: Validating Access Link

**Screen ID:** `ob-access-token-validating`
**Priority:** P0 | **Route:** `/?token=[uuid]`
**Complexity:** Simple | **Animation:** Complex

**Emotion Target:**
- 0–2s: "Something is happening. This is scanning, not loading."
- 2–4s: "It's checking my access. The system is working."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  #050D1A  full viewport  grid pattern bg                                 │
│                                                                          │
│  [Centered vertically and horizontally]                                  │
│                                                                          │
│      [MIRD LOGOMARK — SVG 48px  #00D4FF]                                │
│      centered  mb:24px                                                   │
│                                                                          │
│      VALIDATING ACCESS LINK                                              │
│      Orbitron 14px 600 #E8F4F8  centered  mb:16px                        │
│                                                                          │
│      ┌────────────────────────────────────────────────────────────┐      │
│      │  PROGRESS BAR  w:320px  h:2px  centered                    │      │
│      │  bg: rgba(0,212,255,0.1)  r:1px                            │      │
│      │  fill: #00D4FF  animated from 0→100%  2.5s  ease-in-out   │      │
│      └────────────────────────────────────────────────────────────┘      │
│      mb:16px                                                             │
│                                                                          │
│      AUTHENTICATING CREDENTIALS...                                       │
│      Orbitron 11px #7ECFDF  centered  (cycling status messages)          │
│                                                                          │
│      ● Verifying token integrity                                         │
│      ● Checking expiry                                                   │
│      ● Loading client profile                                            │
│      STM 11px #2A4A5A  centered  (each appears sequentially)            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Logo | SVG MIRD logomark, 48px, `#00D4FF` |
| Heading | Orbitron 14px 600 `#E8F4F8` uppercase, centered |
| Progress bar track | `width: 320px`, `height: 2px`, `bg: rgba(0,212,255,0.1)`, `border-radius: 1px` |
| Progress bar fill | `bg: #00D4FF`, animated 0→85% over 2s (holds at 85% until token resolves) |
| Status label | Orbitron 11px `#7ECFDF` uppercase, cycling messages |
| Step sub-labels | Share Tech Mono 11px `#2A4A5A`, appear one by one at 600ms intervals |

**Animation Spec:**
- `progress-fill`: Bar fills to 85% in 2s ease-in-out, holds at 85%.
- `step-labels`: Each verification step appears sequentially — 0ms, 600ms, 1200ms — with fade-in 200ms.
- `progress-complete`: On token valid — bar fills to 100% in 200ms, then transitions to wizard step 1.
- `scan-line`: Single diagonal scan-line across full viewport, plays once at 500ms.

**States:**
- **Validating:** Animation plays, status messages appear.
- **Success:** Progress bar completes, transitions to `ob-wizard-step1-main`.
- **Failure:** Transitions to `ob-access-token-invalid`.

---

### Screen 2: Access Link Expired

**Screen ID:** `ob-access-token-invalid`
**Priority:** P0 | **Route:** `/?token=[uuid]` (invalid result)
**Complexity:** Simple | **Animation:** Simple

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  #050D1A  full viewport  grid pattern bg                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  PANEL CARD  max-width: 480px  centered  padding: 48px             │ │
│  │  border: 1px solid rgba(255,107,53,0.3)                            │ │
│  │  shadow: 0 0 20px rgba(255,107,53,0.08)                            │ │
│  │                                                                    │ │
│  │  [Lucide LinkOff — 48px  #FF7D52]  centered  mb:20px               │ │
│  │                                                                    │ │
│  │  ACCESS LINK EXPIRED                                               │ │
│  │  Orbitron 18px 600 #E8F4F8  centered  mb:8px                      │ │
│  │                                                                    │ │
│  │  This onboarding link has expired or is invalid.                  │ │
│  │  Inter 14px #7ECFDF  centered  mb:8px                              │ │
│  │                                                                    │ │
│  │  Contact your MIRD account manager to receive                     │ │
│  │  a new access link.                                                │ │
│  │  Inter 14px #7ECFDF  centered  mb:32px                             │ │
│  │                                                                    │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │       CONTACT SUPPORT  →                                   │   │ │
│  │  │  Primary button — opens support modal or mailto            │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  │                                                                    │ │
│  │  support@makeitrain.digital                                        │ │
│  │  STM 13px #7ECFDF  centered  (fallback contact)                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:** Alert-style panel (orange border/shadow), Lucide `LinkOff` icon, support email as fallback.

---

### Screen 3: Desktop Recommended

**Screen ID:** `ob-access-mobile-suggestion`
**Priority:** P2 | **Route:** `/?token=[uuid]` (mobile viewport detected)
**Complexity:** Simple | **Animation:** Simple

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  #050D1A  mobile viewport  [shown as interstitial before wizard]         │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  PANEL CARD  mx:16px  padding: 32px  centered                     │ │
│  │                                                                    │ │
│  │  [Lucide Monitor — 40px  #7ECFDF]  centered  mb:16px               │ │
│  │                                                                    │ │
│  │  DESKTOP RECOMMENDED                                               │ │
│  │  Orbitron 16px 600 #E8F4F8  centered  mb:8px                      │ │
│  │                                                                    │ │
│  │  For the best onboarding experience,                              │ │
│  │  complete setup on a desktop computer.                             │ │
│  │  Inter 14px #7ECFDF  centered  mb:24px                             │ │
│  │                                                                    │ │
│  │  ┌─────────────────────────────────────────────────────────────┐  │ │
│  │  │  CONTINUE ON DESKTOP  →   [Primary btn]                     │  │ │
│  │  └─────────────────────────────────────────────────────────────┘  │ │
│  │  CONTINUE ANYWAY  →  [Ghost btn — proceeds to wizard on mobile]   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Notes:** This is a soft suggestion — the "CONTINUE ANYWAY" ghost button lets mobile users proceed. Not a hard block. Mobile viewport = `< 768px`.

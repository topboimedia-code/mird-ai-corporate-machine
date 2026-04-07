# Flow PRD: CEO Dashboard Authentication

**Flow ID:** F-10-CEO-AUTH
**App:** CEO Dashboard (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first (CEO Dashboard is not mobile-optimized)
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 4 screens | P0: 4 | P1: 0 | P2: 0

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | Direct URL `ceo.makeitrain.digital/login`, session expiry redirect |
| **Exit Points** | `/command-center` (success), session expired loops back to login |
| **Primary User** | Shomari Williams — CEO, sole user of this dashboard |
| **Dependencies** | Auth API (separate from RainMachine auth), 2FA provider (TOTP), email delivery |
| **URL Prefix** | `/` (CEO Dashboard is a separate subdomain) |

---

## 1A. UI Profile Compliance

**Profile:** MIRD JARVIS Dark v1.0
**Differentiator from RainMachine auth:**
- CEO dashboard login feels more fortified — "CEO COMMAND ACCESS" not "OPERATOR AUTHENTICATION"
- 2FA step is unique to this dashboard — highest security tier
- Session expired is non-negotiable lockout — no "stay logged in" soft options
- Same token set, same animations, elevated copy tone

---

## 2. CMO Context

**Conversion stake:** This is a single-user, high-security dashboard. Friction here isn't lost sales — it's Shomari's time and trust in the system. Every extra second of auth friction is a tax on his daily operating rhythm.

**Friction elimination:**

| Friction | Solution |
|----------|----------|
| 2FA setup confusion | Clear "open your authenticator app" instruction with app name suggestions |
| Lockout counter anxiety | Show "X OF 5 ATTEMPTS REMAINING" before lockout, not after |
| Session expired mid-review | Branded, non-jarring interstitial — session data preserved on re-auth |

---

## 3. User Journey

```
Direct URL ceo.makeitrain.digital
              │
              ▼
    [ceo-auth-login-main] ──── failed ──→ [ceo-auth-login-error]
              │                                    │
              │ credentials valid                  │ retry
              ▼                                    ▼
    [ceo-auth-2fa-prompt]          or ← back to login
              │
              │ code valid
              ▼
    [ceo-command-center-main]

Session Expiry (any route)
              │
              ▼
    [ceo-auth-session-expired] ──→ [ceo-auth-login-main]
```

---

## 4. Screen Specifications

---

### Screen 1: CEO Dashboard Login

**Screen ID:** `ceo-auth-login-main`
**Priority:** P0 | **Route:** `/login`
**Complexity:** Medium | **Animation:** Medium

**Emotion Target:**
- 0–2s: "This is my command center. This screen confirms I'm the one who belongs here."
- 10s+: "Two steps: credentials, then 2FA. I know the flow. It's fast."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  #050D1A  full viewport  grid pattern bg                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  PANEL CARD  max-width: 440px  centered  padding: 48px             │ │
│  │                                                                    │ │
│  │  [MIRD LOGOMARK — SVG 40px  #00D4FF]  centered  mb:16px            │ │
│  │                                                                    │ │
│  │  MIRD COMMAND CENTER                                               │ │
│  │  Orbitron 24px 700 #E8F4F8  centered  letter-spacing 0.08em  mb:4px│ │
│  │                                                                    │ │
│  │  CEO ACCESS AUTHENTICATION                                         │ │
│  │  Orbitron 11px #7ECFDF  centered  letter-spacing 0.12em  mb:24px   │ │
│  │  border-bottom: 1px solid rgba(0,212,255,0.1)  pb:24px             │ │
│  │                                                                    │ │
│  │  EMAIL ADDRESS                                                     │ │
│  │  [Input field — standard JARVIS style]  mb:20px                    │ │
│  │                                                                    │ │
│  │  PASSWORD                                                          │ │
│  │  [Input field — password, Eye toggle]  mb:28px                     │ │
│  │                                                                    │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │       ACCESS COMMAND CENTER  →                             │   │ │
│  │  │  Primary button  h:48px  w:100%                            │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  MIRD COMMAND CENTER — SECURE ACCESS  [●]                                │
│  STM 11px #7ECFDF  centered  bottom fixed                                │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Panel | `max-width: 440px`, `padding: 48px`, panel card tokens |
| Logo | SVG MIRD logomark, 40px, `#00D4FF` |
| Title | Orbitron 24px 700 `#E8F4F8` — "MIRD COMMAND CENTER" (different from RainMachine) |
| Subtitle | Orbitron 11px `#7ECFDF` — "CEO ACCESS AUTHENTICATION" |
| Inputs | Standard JARVIS input field, `height: 48px` |
| CTA | "ACCESS COMMAND CENTER" — different label from RainMachine's "AUTHENTICATE" |
| Status bar | "MIRD COMMAND CENTER — SECURE ACCESS" |

**Animation Spec:**
- Identical to `rm-auth-login-main` — `panel-enter`, `scan-line`, `status-pulse`.
- CTA label difference is intentional — Shomari should feel the elevated access level.

**Interactive States:**
- **Default, Loading, Error:** Same as `rm-auth-login-main`.
- **Success:** Routes to `ceo-auth-2fa-prompt` (not directly to dashboard — 2FA required).

---

### Screen 2: Two-Factor Authentication

**Screen ID:** `ceo-auth-2fa-prompt`
**Priority:** P0 | **Route:** `/2fa`
**Complexity:** Medium | **Animation:** Simple

**Emotion Target:**
- 0–2s: "Second factor. Expected. I know the drill."
- 10s+: "6 digits, submit. I'm in."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  #050D1A  full viewport  grid pattern bg                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  PANEL CARD  max-width: 400px  centered  padding: 48px             │ │
│  │                                                                    │ │
│  │  [Lucide ShieldCheck — 40px  #00D4FF]  centered  mb:16px           │ │
│  │                                                                    │ │
│  │  TWO-FACTOR VERIFICATION                                           │ │
│  │  Orbitron 18px 600 #E8F4F8  centered  mb:8px                      │ │
│  │                                                                    │ │
│  │  Enter the 6-digit code from your authenticator app.              │ │
│  │  Inter 14px #7ECFDF  centered  mb:24px                             │ │
│  │  border-bottom: 1px solid rgba(0,212,255,0.1)  pb:24px             │ │
│  │                                                                    │ │
│  │  VERIFICATION CODE                                                 │ │
│  │  Orbitron 11px #7ECFDF  mb:8px                                    │ │
│  │                                                                    │ │
│  │  ┌──┐ ┌──┐ ┌──┐  ┌──┐ ┌──┐ ┌──┐                                  │ │
│  │  │  │ │  │ │  │  │  │ │  │ │  │                                  │ │
│  │  └──┘ └──┘ └──┘  └──┘ └──┘ └──┘                                  │ │
│  │  6 individual single-char inputs (OTP style)                      │ │
│  │  each: 48×56px  bg rgba(0,212,255,0.04)                           │ │
│  │  border rgba(0,212,255,0.2)  r:4px                                │ │
│  │  STM 24px #E8F4F8  centered                                       │ │
│  │  gap: 8px  center group, 4px gap between groups of 3              │ │
│  │                                      mb:28px                      │ │
│  │                                                                    │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │       VERIFY  →                                            │   │ │
│  │  │  Primary button  h:48px  w:100%  disabled until 6 digits   │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  │                                                                    │ │
│  │  [←] BACK TO LOGIN                                                │ │
│  │  Ghost button  Orbitron 11px  centered                            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Icon | Lucide `ShieldCheck`, 40px, `#00D4FF` |
| Heading | Orbitron 18px 600 `#E8F4F8` — "TWO-FACTOR VERIFICATION" |
| Body | Inter 14px `#7ECFDF` — instruction text |
| OTP input cells | 6 cells, each `48×56px`, `bg: rgba(0,212,255,0.04)`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, Share Tech Mono 24px `#E8F4F8` centered |
| Active OTP cell | `border-color: #00D4FF`, `box-shadow: 0 0 0 3px rgba(0,212,255,0.15)` |
| Group separator | `gap: 16px` between cell 3 and 4 (visual grouping) |
| CTA | Primary "VERIFY", disabled until all 6 digits entered |
| Back link | Ghost button, routes to `/login` |

**Animation Spec:**
- `cell-focus-advance`: Auto-advances focus to next cell on digit entry.
- `cell-fill`: Digit appears with 50ms ease-in pop.
- `cell-delete`: Backspace moves focus back to previous cell.
- `submit-on-complete`: Auto-submits when 6th digit is entered (no button click needed).
- `shake-on-error`: OTP inputs shake horizontally 4px × 3, 300ms on invalid code.

**Interactive States:**
- **Default:** All cells empty, first cell focused, CTA disabled.
- **Filling:** Focus auto-advances cell by cell.
- **Complete:** All 6 filled, CTA activates, auto-submits.
- **Loading:** Cells and CTA disabled while verifying.
- **Error:** Cells shake, clear, re-focus first cell. Error message below cells: "INVALID CODE — X ATTEMPTS REMAINING" in Share Tech Mono 13px `#FF7D52`.
- **Success:** Transition to command center.

**Data Requirements:**
- Input: 6-digit TOTP code
- Output: 2FA verification result, session token

---

### Screen 3: CEO Login Error

**Screen ID:** `ceo-auth-login-error`
**Priority:** P0 | **Route:** `/login` (error state overlay)
**Complexity:** Simple | **Animation:** Simple

**Wireframe:**
```
[Same as ceo-auth-login-main with added error state:]

│  EMAIL ADDRESS                                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  shomari@makeitrain.digital  [!]                               │    │
│  │  border: rgba(255,107,53,0.6)  error shadow                    │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  PASSWORD                                                               │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  ••••••••••  [!]                                               │    │
│  │  border: rgba(255,107,53,0.6)  error shadow                    │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  AUTHENTICATION FAILED — 3 OF 5 ATTEMPTS REMAINING              │  │
│  │  STM 13px #FF7D52  bg: rgba(255,107,53,0.04)                    │  │
│  │  border-left: 3px solid #FF6B35  padding: 10px 14px  r:0 4px 4p │  │
│  └──────────────────────────────────────────────────────────────────┘  │
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Error inputs | `border-color: rgba(255,107,53,0.6)`, `box-shadow: 0 0 0 3px rgba(255,107,53,0.1)` |
| Error message | Alert item style: `border-left: 3px solid #FF6B35`, `bg: rgba(255,107,53,0.04)`, Share Tech Mono 13px `#FF7D52` |
| Attempt count | Embedded in error message: "X OF 5 ATTEMPTS REMAINING" |
| At 5 attempts | Full lockout: "ACCOUNT LOCKED — CONTACT SUPPORT" — CTA changes to support email |

---

### Screen 4: CEO Session Expired

**Screen ID:** `ceo-auth-session-expired`
**Priority:** P0 | **Route:** `/session-expired`
**Complexity:** Simple | **Animation:** Medium

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  #050D1A  full viewport  grid pattern bg                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  PANEL CARD  max-width: 440px  centered  padding: 48px             │ │
│  │  border: 1px solid rgba(255,184,0,0.3)  (warning, not error)       │ │
│  │  shadow: 0 0 20px rgba(255,184,0,0.08)                             │ │
│  │                                                                    │ │
│  │  [Lucide Clock — 40px  #FFB800]  centered  mb:16px                 │ │
│  │                                                                    │ │
│  │  SESSION EXPIRED                                                   │ │
│  │  Orbitron 18px 600 #E8F4F8  centered  mb:8px                      │ │
│  │                                                                    │ │
│  │  SESSION EXPIRED — REINITIALIZING AUTHENTICATION                   │ │
│  │  STM 13px #FFB800  centered  mb:24px                              │ │
│  │                                                                    │ │
│  │  Your session has expired for security. Please                    │ │
│  │  authenticate again to resume.                                     │ │
│  │  Inter 14px #7ECFDF  centered  mb:32px                             │ │
│  │                                                                    │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │       REINITIALIZE SESSION  →                              │   │ │
│  │  │  Primary button — routes to /login                         │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Panel border | `1px solid rgba(255,184,0,0.3)` — amber/warning, not error |
| Panel shadow | `0 0 20px rgba(255,184,0,0.08)` |
| Icon | Lucide `Clock`, 40px, `#FFB800` |
| Status copy | Share Tech Mono 13px `#FFB800` — uses the copy bank verbatim: "SESSION EXPIRED — REINITIALIZING AUTHENTICATION" |
| CTA | "REINITIALIZE SESSION" — routes to `/login`, preserves the attempted URL in query param for post-auth redirect |

**Animation Spec:**
- `panel-enter`: Standard, but border/shadow uses amber palette.

---

## 5. Stack Integration

### Libraries for This Flow

| Library | Version | Purpose | Install |
|---------|---------|---------|---------|
| next-auth | latest | Session management, 2FA TOTP | `npm i next-auth` |
| @simplewebauthn/browser | latest | Optional future passkey support | — |
| lucide-react | latest | Icons | `npm i lucide-react` |

### Key Patterns

**OTP input auto-advance:**
```typescript
const handleOtpInput = (index: number, value: string) => {
  if (value.length === 1 && index < 5) {
    inputRefs[index + 1].current?.focus()
  }
  if (value === '' && index > 0) {
    inputRefs[index - 1].current?.focus()
  }
}
```

**Auto-submit on complete:**
```typescript
useEffect(() => {
  if (otp.every(v => v !== '')) {
    handleVerify(otp.join(''))
  }
}, [otp])
```

**Preserve redirect URL:**
```typescript
// On session expiry, store current URL
sessionStorage.setItem('post_auth_redirect', window.location.pathname)
// After login, read and redirect
const redirect = sessionStorage.getItem('post_auth_redirect') ?? '/command-center'
router.push(redirect)
```

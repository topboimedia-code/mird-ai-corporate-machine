# Flow PRD: RainMachine Authentication

**Flow ID:** F-01-RM-AUTH
**App:** RainMachine (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first, responsive to 768px+ tablet and 375px mobile
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 7 screens | P0: 7 | P1: 0 | P2: 0

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | Direct URL `/login`, session expiry redirect, logout redirect, password reset success redirect |
| **Exit Points** | `/dashboard` (authenticated), `/forgot-password` (password help), `/login` (session expired redirect) |
| **Primary User** | Marcus Johnson (team leader) and his real estate agents |
| **Dependencies** | Auth API endpoint, JWT token store, email delivery service (password reset) |
| **URL Prefix** | `/auth` |

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

---

## 2. CMO Context

**Conversion stake:** Auth is the gateway to the entire platform — every agent session, every lead touch, every dollar of pipeline value passes through this flow. Failed logins = lost productivity = lost deals.

**Drop-off risk:** Password reset abandonment (users who hit the forgot-password flow and never return). Session expired screens that disorient users and cause them to close the tab.

**Friction elimination:**

| Friction | Solution |
|----------|----------|
| User doesn't know how many attempts remain before lockout | Show "X OF 5 ATTEMPTS REMAINING" in Share Tech Mono on error screens |
| Password reset feels like it disappeared into a void | Masked email confirmation screen with explicit next-step instructions |
| Session expired feels like a crash or error | Branded interstitial with clear "REINITIALIZING AUTHENTICATION" language and single obvious CTA |
| Weak passwords getting set during reset | Real-time strength indicator with labeled levels: WEAK / FAIR / STRONG / SYSTEM-GRADE |
| Reset token expiry is confusing | Explicit token-expired state on reset form routes back to forgot-password with explanation |

---

## 3. User Journey

```
Direct URL / Logout Redirect / Session Expiry
              │
              ▼
    [rm-auth-login-main] ──── failed auth ──→ [rm-auth-login-error]
              │                                        │
              │ success                        retry ──┘
              ▼                                        │
    [dashboard-home]                         forgot ──→ [rm-auth-forgot-password-main]
                                                                │
                                                        submit email
                                                                │
                                                                ▼
                                              [rm-auth-forgot-password-confirmation]
                                                                │
                                                        user clicks email link
                                                                │
                                                                ▼
                                              [rm-auth-password-reset-form] ──── token expired ──→ [rm-auth-forgot-password-main]
                                                                │
                                                        password saved
                                                                │
                                                                ▼
                                              [rm-auth-password-reset-success]
                                                                │
                                                    auto-redirect (5s) or click
                                                                │
                                                                ▼
                                              [rm-auth-login-main]

Session Expiry (any authenticated route)
              │
              ▼
    [rm-auth-session-expired] ──── CTA ──→ [rm-auth-login-main]
```

---

## 4. Screen Specifications

---

### Screen 1: Login — Main

**Screen ID:** `rm-auth-login-main`
**Priority:** P0 | **Route:** `/auth/login`
**Complexity:** Medium | **Animation:** Medium

**Emotion Target:**
- 0–2s: "This is a serious, capable system. I'm in the right place."
- 2–10s: "This is fast and clean. My credentials go here, the system responds."
- 10s+: "I know what to do. There's no ambiguity. I type and I'm in."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────┐
│  #050D1A — full viewport, grid pattern overlay (cyan 3% opacity)  │
│                                                                    │
│                                                                    │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  #0A1628  border: 1px solid rgba(0,212,255,0.2)  r:4px   │    │
│   │  padding: 48px  max-width: 440px  centered               │    │
│   │                                                          │    │
│   │  ┌────────────────────────────────────────────────────┐  │    │
│   │  │  [MIRD LOGOMARK — SVG 40px × 40px, cyan #00D4FF]  │  │    │
│   │  └────────────────────────────────────────────────────┘  │    │
│   │                                                          │    │
│   │  RAINMACHINE                                             │    │
│   │  Orbitron 24px 700 #E8F4F8 letter-spacing 0.08em        │    │
│   │                                                          │    │
│   │  OPERATOR AUTHENTICATION                                 │    │
│   │  Orbitron 11px 400 #7ECFDF letter-spacing 0.12em        │    │
│   │                                                          │    │
│   │  ─────────────────────────────────────────────────────  │    │
│   │  border-bottom: 1px solid rgba(0,212,255,0.1)  mb:24px  │    │
│   │                                                          │    │
│   │  EMAIL ADDRESS                                           │    │
│   │  Orbitron 11px #7ECFDF uppercase  mb:8px                │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │  [Mail icon 16px #7ECFDF]  marcus@mird.com  [·] │    │    │
│   │  │  bg: rgba(0,212,255,0.04)  border: rgba(0,212,  │    │    │
│   │  │  255,0.2)  h:48px  padding: 12px 16px           │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                             mb:20px      │    │
│   │  PASSWORD                                                │    │
│   │  Orbitron 11px #7ECFDF uppercase  mb:8px                │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │  [Lock icon 16px #7ECFDF]  ············  [Eye]  │    │    │
│   │  │  same input styles as above                     │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                             mb:24px      │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │         AUTHENTICATE  →                         │    │    │
│   │  │  Button Primary: #00D4FF bg, #050D1A text       │    │    │
│   │  │  Orbitron 600 13px  h:48px  w:100%              │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                             mb:16px      │    │
│   │  FORGOT ACCESS CREDENTIALS  →                           │    │
│   │  Ghost/Link: Orbitron 11px #00D4FF  centered            │    │
│   │                                                          │    │
│   └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  RAINMACHINE SYSTEM — ONLINE                                       │
│  Share Tech Mono 13px #7ECFDF  centered bottom  mb:24px           │
│  [●] status dot 8px #00FF88 pulse  inline left of text            │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Page background | `#050D1A` full-screen |
| Background grid | `repeating-linear-gradient` cyan at 3% opacity, 40px pitch |
| Panel container | `#0A1628`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, `padding: 48px`, `max-width: 440px`, `margin: auto`, vertically centered |
| Panel shadow | `0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1), inset 0 0 40px rgba(0,212,255,0.02)` |
| Logo mark | SVG, 40×40px, `#00D4FF`, centered, `margin-bottom: 16px` |
| Heading "RAINMACHINE" | Orbitron 24px 700 `#E8F4F8` letter-spacing 0.08em uppercase |
| Sub-label "OPERATOR AUTHENTICATION" | Orbitron 11px 400 `#7ECFDF` letter-spacing 0.12em uppercase |
| Divider | `border-bottom: 1px solid rgba(0,212,255,0.1)`, `padding-bottom: 16px`, `margin-bottom: 24px` |
| Input label | Orbitron 11px `#7ECFDF` uppercase letter-spacing 0.12em, `margin-bottom: 8px` |
| Input field | `bg: rgba(0,212,255,0.04)`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, `height: 48px`, `padding: 12px 16px`, Inter 15px `#E8F4F8`, placeholder `#2A4A5A` |
| Input focus | `border-color: #00D4FF`, `box-shadow: 0 0 0 3px rgba(0,212,255,0.15)`, transition 200ms |
| Input leading icon | Lucide `Mail` / `Lock`, 16px, `#7ECFDF`, `padding-left: 44px` on input |
| Password toggle icon | Lucide `Eye` / `EyeOff`, 16px, `#7ECFDF`, absolute right `16px`, clickable |
| CTA button | `bg: #00D4FF`, `color: #050D1A`, Orbitron 600 13px uppercase letter-spacing 0.1em, `height: 48px`, `width: 100%`, `border-radius: 4px` |
| CTA hover | `bg: #1ADCFF`, `box-shadow: 0 0 20px rgba(0,212,255,0.3)` |
| CTA active | `bg: #00B8E0` |
| CTA disabled | `bg: #0A4F6E`, `color: #2A4A5A` |
| Ghost link | Orbitron 11px `#00D4FF` uppercase, `::after content: ' →'`, centered, `margin-top: 16px` |
| Ghost link hover | `color: #1ADCFF`, `text-shadow: 0 0 8px rgba(0,212,255,0.5)` |
| Status bar | Share Tech Mono 13px `#7ECFDF`, centered, `position: fixed bottom 24px`, status dot 8px `#00FF88` inline |
| Status dot | 8px circle `#00FF88`, `box-shadow: 0 0 6px #00FF88`, `animation: system-pulse 2s ease-in-out infinite` |

**Animation Spec:**
- `panel-enter`: On mount — panel slides up 8px and fades in over 400ms `cubic-bezier(0.34,1.56,0.64,1)`. Logo enters first (delay 0ms), heading (80ms), sub-label (160ms), divider (240ms), form fields (320ms staggered 80ms each), CTA button (480ms).
- `scan-line`: Single horizontal sweep across the panel on mount, 1.5s, plays once. Signals system initialization.
- `status-pulse`: Bottom status dot breathes at 2s ease-in-out infinite. Opacity 1 → 0.4 → 1, glow expands and contracts.
- `button-glow`: On CTA hover, shadow ramps up from 0 to `0 0 20px rgba(0,212,255,0.3)` over 200ms.
- `input-focus-transition`: Border and shadow transition 200ms ease-out on focus.

**Interactive States:**

- **Default:** Panel visible, fields empty, CTA in primary cyan, status dot pulsing ONLINE. Empty fields have placeholder text in `#2A4A5A`.
- **Typing:** Input border transitions to `rgba(0,212,255,0.4)` (strong) as user types. No validation triggered yet.
- **Loading/Submitting:** CTA text changes to "AUTHENTICATING..." (Share Tech Mono 13px), button bg dims to `#00B8E0`, Lucide `Loader2` icon spins inside button at 16px. Both inputs disabled (`opacity: 0.5`, `cursor: not-allowed`). Duration: until API response.
- **Error:** Routes to `rm-auth-login-error` screen (inline error state — see Screen 2).
- **Success:** CTA flashes to `#00FF88` for 300ms, then full-page fade-out over 400ms, then redirect to `/dashboard`.

**Data Requirements:**
- Inputs: `email: string`, `password: string`
- Outputs: `access_token: JWT`, `refresh_token: JWT`, `user: { id, firstName, lastName, role, teamId }`
- API calls: `POST /api/auth/login` — body `{ email, password }` — response `{ token, refreshToken, user }` or `{ error, attemptsRemaining }`
- Token storage: `access_token` in memory (Zustand), `refresh_token` in httpOnly cookie via `js-cookie`
- On success: store `user` in Zustand auth slice, redirect to `/dashboard`

---

### Screen 2: Login Error

**Screen ID:** `rm-auth-login-error`
**Priority:** P0 | **Route:** `/auth/login` (same route, error state)
**Complexity:** Simple | **Animation:** Simple

**Emotion Target:**
- 0–2s: "The system caught my error and is telling me precisely what happened."
- 2–10s: "I know how many attempts I have. I can try again or reset my password."
- 10s+: "The system is not punishing me — it's guiding me to the correct path."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────┐
│  #050D1A background + grid overlay                                │
│                                                                    │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  [same panel as screen 1, with error state applied]      │    │
│   │                                                          │    │
│   │  [MIRD LOGOMARK 40px]                                    │    │
│   │  RAINMACHINE  /  OPERATOR AUTHENTICATION                 │    │
│   │  ─────────────────────────────────────────────────────  │    │
│   │                                                          │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │  [AlertTriangle 16px #FF6B35]  AUTHENTICATION   │    │    │
│   │  │  FAILED — INVALID CREDENTIALS                   │    │    │
│   │  │  bg: rgba(255,107,53,0.08)                      │    │    │
│   │  │  border: 1px solid rgba(255,107,53,0.4)         │    │    │
│   │  │  border-radius: 4px  padding: 12px 16px         │    │    │
│   │  │  Orbitron 11px #FF7D52 uppercase  mb:20px       │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                                          │    │
│   │  EMAIL ADDRESS                                           │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │  [Mail 16px]  marcus@mird.com                   │    │    │
│   │  │  border: 1px solid rgba(255,107,53,0.6)  [!]    │    │    │
│   │  │  box-shadow: 0 0 0 3px rgba(255,107,53,0.1)     │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                                          │    │
│   │  PASSWORD                                                │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │  [Lock 16px]  ············  [Eye]  [!]          │    │    │
│   │  │  same error border treatment                    │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                                          │    │
│   │  2 OF 5 ATTEMPTS REMAINING                               │    │
│   │  Share Tech Mono 13px #FF7D52  text-align: right        │    │
│   │  mb:24px                                                 │    │
│   │                                                          │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │         RETRY AUTHENTICATION  →                 │    │    │
│   │  │  Button Primary (same styles, full width)       │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                             mb:16px      │    │
│   │  RESET ACCESS CREDENTIALS  →                            │    │
│   │  Ghost link  Orbitron 11px #00D4FF  centered            │    │
│   │                                                          │    │
│   └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  [●] RAINMACHINE SYSTEM — ONLINE                                   │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Page / panel / logo / heading | Same as Screen 1 |
| Error banner | `bg: rgba(255,107,53,0.08)`, `border: 1px solid rgba(255,107,53,0.4)`, `border-radius: 4px`, `padding: 12px 16px`, `margin-bottom: 20px` |
| Error banner icon | Lucide `AlertTriangle`, 16px, `#FF6B35`, inline-left |
| Error banner text | Orbitron 11px `#FF7D52` uppercase letter-spacing 0.1em |
| Error input border | `border: 1px solid rgba(255,107,53,0.6)` |
| Error input shadow | `box-shadow: 0 0 0 3px rgba(255,107,53,0.1)` |
| Error inline icon | Lucide `AlertCircle`, 16px, `#FF6B35`, absolute right `16px` inside input |
| Attempt counter | Share Tech Mono 13px `#FF7D52`, `text-align: right`, `margin-bottom: 24px` |
| Retry CTA | Same as Screen 1 primary button, full width |
| Reset link | Ghost/Link style, Orbitron 11px `#00D4FF`, centered |

**Animation Spec:**
- `alert-flash`: On error state entry — error banner flashes at 0.8s ease-in-out × 3 iterations then holds static. Signals the system caught the error.
- `error-border-transition`: Input borders animate from cyan to orange-alert over 300ms ease-out.
- `shake`: Panel performs a subtle horizontal shake (translateX: 0 → 6px → -6px → 4px → -4px → 0) over 400ms on error entry. Signals rejection.

**Interactive States:**

- **Default (error):** Error banner visible, both inputs have orange border treatment, attempt counter shown. Password field is cleared (security best practice), email retained.
- **Re-typing:** As user types in either field, error border reverts to `rgba(0,212,255,0.2)` default — error banner fades out over 200ms. System resets visually as user corrects.
- **Loading/Submitting:** Same as Screen 1 loading state.
- **5th attempt:** Attempt counter reads "1 OF 5 ATTEMPTS REMAINING" in `#FF3333`. After 5th failure, button changes to "ACCOUNT LOCKED — RESET REQUIRED", button bg changes to `#FF3333` (disabled state), ghost link changes to "RESET CREDENTIALS NOW →".
- **Success:** Same green flash + redirect as Screen 1.

**Data Requirements:**
- Inputs: `email: string`, `password: string` (re-submitted)
- Outputs: Same as Screen 1, plus `attemptsRemaining: number` from error response
- API calls: `POST /api/auth/login` — same as Screen 1
- State management: `attemptsRemaining` stored in component state (not persisted — server-enforced lockout)

---

### Screen 3: Forgot Password — Main

**Screen ID:** `rm-auth-forgot-password-main`
**Priority:** P0 | **Route:** `/auth/forgot-password`
**Complexity:** Simple | **Animation:** Simple

**Emotion Target:**
- 0–2s: "The system knows I need help. It's not making this complicated."
- 2–10s: "One field. One action. That's it."
- 10s+: "I'm confident the reset will arrive. The system is handling it."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────┐
│  #050D1A background + grid overlay                                │
│                                                                    │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  #0A1628  border cyan  padding:48px  max-width:440px     │    │
│   │                                                          │    │
│   │  [MIRD LOGOMARK 40px #00D4FF  centered]                  │    │
│   │                                                          │    │
│   │  ACCESS RECOVERY                                         │    │
│   │  Orbitron 24px 700 #E8F4F8  letter-spacing 0.08em       │    │
│   │                                                          │    │
│   │  CREDENTIAL RESET PROTOCOL                              │    │
│   │  Orbitron 11px #7ECFDF  uppercase  letter-spacing 0.12em│    │
│   │                                                          │    │
│   │  ─────────────────────────────────────────────────────  │    │
│   │  border-bottom: 1px solid rgba(0,212,255,0.1)  mb:24px  │    │
│   │                                                          │    │
│   │  ENTER YOUR REGISTERED EMAIL ADDRESS AND WE WILL        │    │
│   │  TRANSMIT RESET INSTRUCTIONS TO YOUR INBOX.             │    │
│   │  Inter 13px #7ECFDF  mb:24px                            │    │
│   │                                                          │    │
│   │  REGISTERED EMAIL ADDRESS                                │    │
│   │  Orbitron 11px #7ECFDF  uppercase  mb:8px               │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │  [Mail 16px #7ECFDF]  operator@rainmachine.io   │    │    │
│   │  │  input: rgba(0,212,255,0.04) border default     │    │    │
│   │  │  h:48px  Inter 15px #E8F4F8                     │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                             mb:24px      │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │      TRANSMIT RESET INSTRUCTIONS  →             │    │    │
│   │  │  Button Primary  full width  h:48px             │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                             mb:16px      │    │
│   │  ← RETURN TO LOGIN                                       │    │
│   │  Ghost link  Orbitron 11px #00D4FF  centered            │    │
│   │  ::before content: '← '                                 │    │
│   │                                                          │    │
│   └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  [●] RAINMACHINE SYSTEM — ONLINE                                   │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Page / panel base | Same as Screen 1 |
| Heading "ACCESS RECOVERY" | Orbitron 24px 700 `#E8F4F8` letter-spacing 0.08em uppercase |
| Sub-label "CREDENTIAL RESET PROTOCOL" | Orbitron 11px 400 `#7ECFDF` letter-spacing 0.12em uppercase |
| Instruction copy | Inter 13px `#7ECFDF`, `margin-bottom: 24px` |
| Email input label | Orbitron 11px `#7ECFDF` uppercase |
| Email input | Same styles as Screen 1 email input |
| CTA button | "TRANSMIT RESET INSTRUCTIONS →" — Button Primary, full width |
| Back link | Ghost/Link, Orbitron 11px `#00D4FF`, `::before content: '← '` instead of `::after '→'`, centered |

**Animation Spec:**
- `panel-enter`: Same stagger animation as Screen 1 — logo, heading, sub-label, divider, copy, input, CTA, back link (80ms stagger).
- `input-focus-transition`: Same 200ms border/shadow focus transition.
- `button-loading`: On submit, CTA text becomes "TRANSMITTING..." with `Loader2` spin icon.

**Interactive States:**

- **Default:** Single field, empty, placeholder `operator@rainmachine.io`.
- **Email validation:** On blur, if email is invalid format, show inline error below input: Orbitron 11px `#FF7D52` "INVALID EMAIL FORMAT — CHECK ADDRESS". Input gets error border treatment.
- **Loading/Submitting:** CTA shows "TRANSMITTING..." with spinner, button bg dims, input disabled.
- **Success:** Routes to `rm-auth-forgot-password-confirmation`.
- **API Error (rate limit):** Error banner appears above input: "RESET REQUEST LIMIT REACHED — TRY AGAIN IN 15 MINUTES" in alert treatment.

**Data Requirements:**
- Inputs: `email: string`
- Outputs: `{ success: boolean, message: string }` — API always returns success to prevent email enumeration
- API calls: `POST /api/auth/forgot-password` — body `{ email }` — response always 200 with success message regardless of whether email exists (security)
- Store submitted email in component state to pass to confirmation screen

---

### Screen 4: Forgot Password — Confirmation

**Screen ID:** `rm-auth-forgot-password-confirmation`
**Priority:** P0 | **Route:** `/auth/forgot-password/sent`
**Complexity:** Simple | **Animation:** Simple

**Emotion Target:**
- 0–2s: "The system acted. Instructions are on their way."
- 2–10s: "I know where to look (my inbox). The masked email tells me it's for the right account."
- 10s+: "I can go check my email now. No anxiety, no confusion."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────┐
│  #050D1A background + grid overlay                                │
│                                                                    │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  #0A1628  border cyan  padding:48px  max-width:440px     │    │
│   │                                                          │    │
│   │  ┌──────────────────────────────────────────────────┐   │    │
│   │  │  [CheckCircle 48px #00FF88  centered]            │   │    │
│   │  │  box-shadow: 0 0 24px rgba(0,255,136,0.2)        │   │    │
│   │  └──────────────────────────────────────────────────┘   │    │
│   │  mb:24px                                                 │    │
│   │                                                          │    │
│   │  INSTRUCTIONS TRANSMITTED                               │    │
│   │  Orbitron 24px 700 #E8F4F8  letter-spacing 0.08em       │    │
│   │                                                          │    │
│   │  RESET LINK DISPATCHED                                   │    │
│   │  Orbitron 11px #7ECFDF  uppercase  letter-spacing 0.12em│    │
│   │                                                          │    │
│   │  ─────────────────────────────────────────────────────  │    │
│   │  border-bottom: 1px solid rgba(0,212,255,0.1)  mb:24px  │    │
│   │                                                          │    │
│   │  RESET INSTRUCTIONS HAVE BEEN DISPATCHED TO:            │    │
│   │  Inter 13px #7ECFDF  mb:12px                            │    │
│   │                                                          │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │  j***@gmail.com                                  │    │    │
│   │  │  bg: rgba(0,212,255,0.04)                        │    │    │
│   │  │  border: 1px solid rgba(0,212,255,0.2)  r:4px    │    │    │
│   │  │  Share Tech Mono 16px #00D4FF                    │    │    │
│   │  │  padding:12px 16px  mb:20px  text-align:center   │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                                          │    │
│   │  IF THE EMAIL DOES NOT ARRIVE WITHIN 5 MINUTES,         │    │
│   │  CHECK YOUR SPAM FOLDER. THE RESET LINK EXPIRES IN      │    │
│   │  60 MINUTES.                                             │    │
│   │  Inter 13px #7ECFDF  mb:32px                            │    │
│   │                                                          │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │       ← RETURN TO LOGIN                         │    │    │
│   │  │  Button Secondary  full width  h:48px           │    │    │
│   │  │  border: 1px solid rgba(0,212,255,0.4)          │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                                          │    │
│   └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  [●] RAINMACHINE SYSTEM — ONLINE                                   │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Page / panel base | Same as previous screens |
| Success icon | Lucide `CheckCircle`, 48px, `#00FF88`, centered, `box-shadow: 0 0 24px rgba(0,255,136,0.2)` |
| Heading "INSTRUCTIONS TRANSMITTED" | Orbitron 24px 700 `#E8F4F8` |
| Sub-label "RESET LINK DISPATCHED" | Orbitron 11px `#7ECFDF` uppercase |
| Instruction copy | Inter 13px `#7ECFDF` |
| Masked email display | Share Tech Mono 16px `#00D4FF`, `bg: rgba(0,212,255,0.04)`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, `padding: 12px 16px`, `text-align: center` |
| Disclaimer copy | Inter 13px `#7ECFDF`, `margin-bottom: 32px` |
| Return to Login button | Button Secondary: `bg: transparent`, `border: 1px solid rgba(0,212,255,0.4)`, `color: #00D4FF`, Orbitron 600 13px, full width |

**Animation Spec:**
- `panel-enter`: Same stagger as other screens.
- `check-icon-enter`: `CheckCircle` icon scales from 0.5 → 1.0 with spring easing `cubic-bezier(0.34,1.56,0.64,1)` over 500ms, then glow fades in at 600ms. Plays once on mount.
- `masked-email-scan`: `scan-line` plays once over the masked email display block on mount, 1.5s. Signals system retrieved the address.

**Interactive States:**

- **Default:** Static confirmation. No loading states on this screen.
- **Return to Login:** Button Secondary hover: `border-color: #00D4FF`, `bg: rgba(0,212,255,0.08)`, `box-shadow: 0 0 12px rgba(0,212,255,0.15)`.

**Data Requirements:**
- Inputs: `maskedEmail: string` — passed from `rm-auth-forgot-password-main` via React state/router state (e.g., `j***@gmail.com`, masked server-side)
- Outputs: None
- API calls: None — this is a static confirmation screen
- Email masking logic: server handles masking in the `POST /api/auth/forgot-password` response: `{ maskedEmail: "j***@gmail.com" }`

---

### Screen 5: Password Reset Form

**Screen ID:** `rm-auth-password-reset-form`
**Priority:** P0 | **Route:** `/auth/reset-password?token=[JWT_TOKEN]`
**Complexity:** Medium | **Animation:** Simple

**Emotion Target:**
- 0–2s: "I'm in the right place. The system accepted my token and is ready."
- 2–10s: "The strength indicator is helping me, not judging me."
- 10s+: "I know my password is strong. I'm ready to set it and get back in."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────┐
│  #050D1A background + grid overlay                                │
│                                                                    │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  #0A1628  border cyan  padding:48px  max-width:440px     │    │
│   │                                                          │    │
│   │  [MIRD LOGOMARK 40px #00D4FF  centered]  mb:16px         │    │
│   │                                                          │    │
│   │  SET NEW CREDENTIALS                                     │    │
│   │  Orbitron 24px 700 #E8F4F8                               │    │
│   │                                                          │    │
│   │  SYSTEM ACCESS RESET                                     │    │
│   │  Orbitron 11px #7ECFDF  uppercase                       │    │
│   │  ─────────────────────────────────────────────────────  │    │
│   │                                                          │    │
│   │  NEW PASSWORD                                            │    │
│   │  Orbitron 11px #7ECFDF  uppercase  mb:8px               │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │  [Lock 16px #7ECFDF]  ············  [Eye]       │    │    │
│   │  │  input: default styles  h:48px                  │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │  mb:8px                                                  │    │
│   │                                                          │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │  STRENGTH: STRONG          ████████████░░░░░░░  │    │    │
│   │  │  [●●●●] 4 of 4 criteria    progress bar 4px h   │    │    │
│   │  │  Orbitron 11px  Share Tech Mono for level label │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                                          │    │
│   │  CRITERIA:                  ✓ 8+ CHARACTERS             │    │
│   │  [CheckCircle 12px #00FF88] ✓ UPPERCASE LETTER          │    │
│   │  [CheckCircle 12px #00FF88] ✓ NUMBER                    │    │
│   │  [Circle      12px #2A4A5A] ○ SPECIAL CHARACTER         │    │
│   │  Share Tech Mono 12px  per-row  mb:20px                 │    │
│   │                                                          │    │
│   │  CONFIRM NEW PASSWORD                                    │    │
│   │  Orbitron 11px #7ECFDF  uppercase  mb:8px               │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │  [Lock 16px #7ECFDF]  ············  [Eye]       │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                             mb:8px       │    │
│   │  ✓ PASSWORDS MATCH                                       │    │
│   │  [CheckCircle 12px #00FF88]  Share Tech Mono 12px        │    │
│   │                                             mb:24px      │    │
│   │                                                          │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │      ACTIVATE NEW CREDENTIALS  →                │    │    │
│   │  │  Button Primary  full width  h:48px             │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                                          │    │
│   └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  [●] RAINMACHINE SYSTEM — ONLINE                                   │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘

TOKEN EXPIRED STATE (replaces form content):
┌──────────────────────────────────────────────────────────────────┐
│   ┌─────────────────────────────────────────────────────────┐    │
│   │  [AlertOctagon 48px #FF6B35  centered]  mb:24px         │    │
│   │                                                          │    │
│   │  RESET LINK EXPIRED                                      │    │
│   │  Orbitron 24px 700 #E8F4F8                               │    │
│   │                                                          │    │
│   │  TOKEN INVALIDATED                                       │    │
│   │  Orbitron 11px #7ECFDF  uppercase                       │    │
│   │  ─────────────────────────────────────────────────────  │    │
│   │                                                          │    │
│   │  THIS RESET LINK HAS EXPIRED. RESET LINKS ARE           │    │
│   │  VALID FOR 60 MINUTES. PLEASE REQUEST A NEW LINK.       │    │
│   │  Inter 13px #7ECFDF  mb:32px                            │    │
│   │                                                          │    │
│   │  [ REQUEST NEW RESET LINK  → ]  Button Primary          │    │
│   │                                                          │    │
│   └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Page / panel base | Same as previous screens |
| Heading | Orbitron 24px 700 `#E8F4F8` |
| Password input | Same input styles, with Lucide `Lock` 16px and `Eye`/`EyeOff` toggle |
| Strength bar container | `height: 4px`, `border-radius: 2px`, `bg: rgba(0,212,255,0.08)`, `width: 100%`, `margin-bottom: 4px` |
| Strength bar fill — WEAK | `width: 25%`, `bg: #FF3333`, transition 300ms |
| Strength bar fill — FAIR | `width: 50%`, `bg: #FFB800`, transition 300ms |
| Strength bar fill — STRONG | `width: 75%`, `bg: #00D4FF`, transition 300ms |
| Strength bar fill — SYSTEM-GRADE | `width: 100%`, `bg: #00FF88`, transition 300ms |
| Strength label | Orbitron 11px, color matches bar color, uppercase, `float: left` |
| Criteria list | Share Tech Mono 12px, icon + text per row, `gap: 4px` between rows |
| Criteria met icon | Lucide `CheckCircle2`, 12px, `#00FF88` |
| Criteria unmet icon | Lucide `Circle`, 12px, `#2A4A5A` |
| Match confirmation | Share Tech Mono 12px `#00FF88`, `CheckCircle2` 12px inline |
| Mismatch error | Share Tech Mono 12px `#FF6B35`, `AlertCircle` 12px inline, text: "PASSWORDS DO NOT MATCH" |
| CTA button | "ACTIVATE NEW CREDENTIALS →" — Button Primary, full width |
| Token expired icon | Lucide `AlertOctagon`, 48px, `#FF6B35`, centered |
| Token expired CTA | "REQUEST NEW RESET LINK →" — Button Primary |

**Animation Spec:**
- `panel-enter`: Stagger animation on mount.
- `strength-bar-update`: Bar width and color transition 300ms ease-out on each keypress in password field.
- `criteria-check`: Each criteria row icon transitions from `Circle` (gray) to `CheckCircle2` (green) with a 150ms ease-out `data-tick` flash when the criterion is met.
- `match-check`: "PASSWORDS MATCH" confirmation fades in with 150ms ease-out when confirm field matches.

**Interactive States:**

- **Token valid (default):** Form displayed. Both inputs empty, strength bar at 0, all criteria unmet.
- **Typing in password:** Strength bar and criteria update in real-time on each keystroke.
- **Confirm field mismatch:** "PASSWORDS DO NOT MATCH" in `#FF6B35` below confirm input. Confirm input gets error border.
- **Confirm field matches:** "PASSWORDS MATCH" in `#00FF88` below confirm input. Confirm input gets `border-color: rgba(0,255,136,0.4)`.
- **CTA disabled:** When passwords don't match OR password is WEAK. `bg: #0A4F6E`, `color: #2A4A5A`.
- **CTA enabled:** When passwords match AND strength is FAIR or above.
- **Submitting:** "ACTIVATING..." with `Loader2` spinner in CTA, both inputs disabled.
- **Token expired:** Replace form content with expired state (no panel change, just content swap).

**Data Requirements:**
- Inputs: `newPassword: string`, `confirmPassword: string`, `token: string` (from URL query param)
- Outputs: `{ success: boolean }`
- API calls: `POST /api/auth/reset-password` — body `{ token, newPassword }` — response `{ success: true }` or `{ error: 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'PASSWORD_TOO_WEAK' }`
- Token validation: `GET /api/auth/validate-reset-token?token=[token]` on page mount — if invalid/expired, show expired state immediately

---

### Screen 6: Password Reset Success

**Screen ID:** `rm-auth-password-reset-success`
**Priority:** P0 | **Route:** `/auth/reset-password/success`
**Complexity:** Simple | **Animation:** Simple

**Emotion Target:**
- 0–2s: "Done. The system acknowledged my new credentials."
- 2–10s: "I can see the countdown. I know what's happening next."
- 10s+: "No action needed from me. The system is taking me where I need to go."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────┐
│  #050D1A background + grid overlay                                │
│                                                                    │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  #0A1628  border cyan  padding:48px  max-width:440px     │    │
│   │                                                          │    │
│   │  ┌──────────────────────────────────────────────────┐   │    │
│   │  │  [ShieldCheck 48px #00FF88  centered]            │   │    │
│   │  │  box-shadow: 0 0 24px rgba(0,255,136,0.25)       │   │    │
│   │  └──────────────────────────────────────────────────┘   │    │
│   │  mb:24px                                                 │    │
│   │                                                          │    │
│   │  CREDENTIALS UPDATED                                     │    │
│   │  Orbitron 24px 700 #E8F4F8  letter-spacing 0.08em       │    │
│   │                                                          │    │
│   │  SYSTEM ACCESS RESTORED                                  │    │
│   │  Orbitron 11px #7ECFDF  uppercase                       │    │
│   │  ─────────────────────────────────────────────────────  │    │
│   │                                                          │    │
│   │  YOUR CREDENTIALS HAVE BEEN UPDATED. YOU CAN NOW        │    │
│   │  LOG IN WITH YOUR NEW PASSWORD.                          │    │
│   │  Inter 13px #7ECFDF  mb:24px                            │    │
│   │                                                          │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │  REDIRECTING TO LOGIN IN                5       │    │    │
│   │  │  bg: rgba(0,212,255,0.04)                        │    │    │
│   │  │  border: 1px solid rgba(0,212,255,0.2)  r:4px    │    │    │
│   │  │  Orbitron 11px #7ECFDF left  +  Share Tech Mono  │    │    │
│   │  │  48px 700 #00D4FF right  padding:16px            │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │  mb:24px                                                 │    │
│   │                                                          │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │      ACCESS RAINMACHINE NOW  →                  │    │    │
│   │  │  Button Primary  full width  h:48px             │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                                          │    │
│   └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  [●] RAINMACHINE SYSTEM — ONLINE                                   │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Page / panel base | Same as previous screens |
| Success icon | Lucide `ShieldCheck`, 48px, `#00FF88`, `box-shadow: 0 0 24px rgba(0,255,136,0.25)`, centered, `margin-bottom: 24px` |
| Heading | Orbitron 24px 700 `#E8F4F8` |
| Sub-label | Orbitron 11px `#7ECFDF` uppercase |
| Body copy | Inter 13px `#7ECFDF`, `margin-bottom: 24px` |
| Countdown container | `bg: rgba(0,212,255,0.04)`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, `padding: 16px`, `display: flex`, `justify-content: space-between`, `align-items: center` |
| Countdown label | Orbitron 11px `#7ECFDF` uppercase, "REDIRECTING TO LOGIN IN" |
| Countdown number | Share Tech Mono 48px 700 `#00D4FF` — ticks down 5 → 4 → 3 → 2 → 1 |
| Countdown tick animation | `data-tick` flash on each number change — 150ms `#1ADCFF` → `#00D4FF` |
| CTA button | "ACCESS RAINMACHINE NOW →" — Button Primary, full width |

**Animation Spec:**
- `panel-enter`: Standard stagger on mount.
- `shield-enter`: `ShieldCheck` scales from 0.6 → 1.0 with spring `cubic-bezier(0.34,1.56,0.64,1)` over 500ms, glow fades in at 600ms.
- `boot-counter`: Countdown starts at 5 and ticks to 0 over 5 seconds. Each tick flashes the number from `#1ADCFF` to `#00D4FF` via `data-tick` (150ms ease-out). At 0, page fades out and redirects.
- `redirect-fade`: Full page fade-out over 400ms at countdown 0 before redirect.

**Interactive States:**

- **Default:** Countdown ticking. CTA visible.
- **CTA click:** Interrupt countdown, immediate full-page fade-out and redirect to `/auth/login`.
- **Countdown complete:** Same fade-out and redirect.

**Data Requirements:**
- Inputs: None — this is a success screen with no form
- Outputs: None
- API calls: None
- Routing: On timer complete OR CTA click → `router.push('/auth/login')`
- URL state: Password reset token is NOT valid at this URL — prevents re-use

---

### Screen 7: Session Expired

**Screen ID:** `rm-auth-session-expired`
**Priority:** P0 | **Route:** Overlay on any authenticated route — `/auth/session-expired` (or modal on current route)
**Complexity:** Simple | **Animation:** Medium

**Emotion Target:**
- 0–2s: "The system caught an expired session. This is a security feature, not an error."
- 2–10s: "One button. Reinitialize and get back to work."
- 10s+: "I understand what happened. The system is guiding me back in."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────┐
│  FULL VIEWPORT OVERLAY                                            │
│  bg: rgba(5,13,26,0.95) — semi-transparent over frozen app UI    │
│  backdrop-filter: blur(4px)                                       │
│                                                                    │
│                                                                    │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  #0A1628  border: 1px solid rgba(0,212,255,0.2)          │    │
│   │  max-width: 480px  centered  padding: 48px               │    │
│   │                                                          │    │
│   │  ┌──────────────────────────────────────────────────┐   │    │
│   │  │  [ShieldAlert 48px #FFB800  centered]            │   │    │
│   │  │  box-shadow: 0 0 20px rgba(255,184,0,0.2)        │   │    │
│   │  └──────────────────────────────────────────────────┘   │    │
│   │  mb:24px                                                 │    │
│   │                                                          │    │
│   │  SESSION TERMINATED                                      │    │
│   │  Orbitron 24px 700 #E8F4F8  letter-spacing 0.08em       │    │
│   │                                                          │    │
│   │  AUTHENTICATION REQUIRED                                 │    │
│   │  Orbitron 11px #7ECFDF  uppercase                       │    │
│   │  ─────────────────────────────────────────────────────  │    │
│   │                                                          │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │  [Terminal 14px #FFB800]                         │    │    │
│   │  │  SESSION EXPIRED — REINITIALIZING               │    │    │
│   │  │  AUTHENTICATION                                  │    │    │
│   │  │  bg: rgba(255,184,0,0.06)                        │    │    │
│   │  │  border: 1px solid rgba(255,184,0,0.3)  r:4px    │    │    │
│   │  │  Share Tech Mono 13px #FFB800                    │    │    │
│   │  │  padding: 12px 16px  mb:20px                     │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                                          │    │
│   │  YOUR SESSION TOKEN HAS EXPIRED. THIS IS A SECURITY     │    │
│   │  MEASURE. YOUR WORK HAS BEEN PRESERVED — LOG BACK IN    │    │
│   │  TO CONTINUE.                                            │    │
│   │  Inter 13px #7ECFDF  mb:32px                            │    │
│   │                                                          │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │      REINITIALIZE SESSION  →                    │    │    │
│   │  │  Button Primary  full width  h:48px             │    │    │
│   │  │  bg: #00D4FF  text: #050D1A                      │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │                                                          │    │
│   └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  [●] RAINMACHINE SYSTEM — STANDBY                                  │
│  Share Tech Mono 13px #7ECFDF  bottom-center                      │
│  status dot: #2A4A5A STANDBY  4s slow pulse                       │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Overlay background | `rgba(5,13,26,0.95)`, `backdrop-filter: blur(4px)`, `position: fixed`, `inset: 0`, `z-index: 9999` |
| Panel | `#0A1628`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, `max-width: 480px`, `padding: 48px`, centered via flexbox |
| Warning icon | Lucide `ShieldAlert`, 48px, `#FFB800`, centered, `box-shadow: 0 0 20px rgba(255,184,0,0.2)` |
| Heading | Orbitron 24px 700 `#E8F4F8` |
| Sub-label | Orbitron 11px `#7ECFDF` uppercase |
| System message block | `bg: rgba(255,184,0,0.06)`, `border: 1px solid rgba(255,184,0,0.3)`, `border-radius: 4px`, `padding: 12px 16px`, `margin-bottom: 20px` |
| System message icon | Lucide `Terminal`, 14px, `#FFB800`, inline left |
| System message text | Share Tech Mono 13px `#FFB800`, uppercase — exact copy: "SESSION EXPIRED — REINITIALIZING AUTHENTICATION" |
| Body copy | Inter 13px `#7ECFDF`, `margin-bottom: 32px` |
| CTA button | "REINITIALIZE SESSION →" — Button Primary, full width, `height: 48px` |
| Status dot | 8px `#2A4A5A` (STANDBY), `animation: system-pulse 4s ease-in-out infinite` — slow pulse to indicate dormant state, not failure |

**Animation Spec:**
- `overlay-enter`: Overlay background fades in from `opacity: 0` to `opacity: 1` over 300ms. Simultaneously the panel slides up 12px and fades in over 400ms `cubic-bezier(0.34,1.56,0.64,1)`.
- `alert-flash`: `ShieldAlert` icon flashes `alert-flash` (0.8s × 3 iterations) on entry, then holds static.
- `system-message-blink`: The cursor in the system message block (if rendered as terminal-style) blinks at 1s intervals. Optional implementation detail.
- `standby-pulse`: Status dot at bottom animates at 4s slow pulse — visually distinct from ONLINE state.

**Interactive States:**

- **Default:** Overlay blocking full screen. No interaction with the underlying page possible.
- **CTA hover:** `bg: #1ADCFF`, `box-shadow: 0 0 20px rgba(0,212,255,0.3)`.
- **CTA click:** Panel fades out over 200ms, overlay fades out over 300ms, then `router.push('/auth/login')`.
- **Keyboard ESC:** ESC key is disabled — cannot dismiss without re-authenticating (security). No-op on ESC press.

**Data Requirements:**
- Inputs: None
- Outputs: None — clears auth state from Zustand store and removes tokens
- Trigger: Auth interceptor in React Query or Axios detects 401 response and dispatches session-expired event to global state
- Implementation: Zustand `authStore.setSessionExpired(true)` triggers this overlay to render globally via `_app.tsx` or root layout
- On CTA: `authStore.clearSession()` then `router.push('/auth/login')`

---

## 5. Stack Integration

### Required Libraries

| Library | Version | Purpose | Install |
|---------|---------|---------|---------|
| `react-hook-form` | latest | Form state, validation, submission | `npm i react-hook-form` |
| `@hookform/resolvers` | latest | Zod schema integration with RHF | `npm i @hookform/resolvers` |
| `zod` | latest | Runtime type validation for all form schemas | `npm i zod` |
| `@tanstack/react-query` | latest | API calls, loading states, error handling | `npm i @tanstack/react-query` |
| `framer-motion` | latest | Panel entrance, overlay, icon animations | `npm i framer-motion` |
| `lucide-react` | latest | All icons (Mail, Lock, Eye, AlertTriangle, etc.) | `npm i lucide-react` |
| `zustand` | latest | Global auth state (session, user, expiry) | `npm i zustand` |
| `js-cookie` | latest | httpOnly refresh token storage | `npm i js-cookie` |
| `sonner` | latest | Toast notifications (auth success/failure) | `npm i sonner` |
| `clsx` | latest | Conditional class merging | `npm i clsx` |
| `tailwind-merge` | latest | Tailwind class deduplication | `npm i tailwind-merge` |

### Implementation Patterns

**Zod Schema — Login Form:**
```typescript
// src/lib/schemas/auth.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('INVALID EMAIL FORMAT'),
  password: z.string().min(1, 'PASSWORD REQUIRED'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('INVALID EMAIL FORMAT'),
})

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'MINIMUM 8 CHARACTERS REQUIRED')
      .regex(/[A-Z]/, 'UPPERCASE LETTER REQUIRED')
      .regex(/[0-9]/, 'NUMBER REQUIRED'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'PASSWORDS DO NOT MATCH',
    path: ['confirmPassword'],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
```

**Zustand Auth Store:**
```typescript
// src/store/authStore.ts
import { create } from 'zustand'

interface User {
  id: string
  firstName: string
  lastName: string
  role: 'TEAM_LEADER' | 'AGENT'
  teamId: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isSessionExpired: boolean
  setAuth: (user: User, token: string) => void
  setSessionExpired: (expired: boolean) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isSessionExpired: false,
  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true, isSessionExpired: false }),
  setSessionExpired: (isSessionExpired) => set({ isSessionExpired }),
  clearSession: () =>
    set({ user: null, accessToken: null, isAuthenticated: false, isSessionExpired: false }),
}))
```

**API Interceptor (401 handler):**
```typescript
// src/lib/api.ts
import { useAuthStore } from '@/store/authStore'

export const apiClient = {
  async fetch(url: string, options?: RequestInit) {
    const { accessToken } = useAuthStore.getState()
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options?.headers,
      },
    })
    if (res.status === 401) {
      useAuthStore.getState().setSessionExpired(true)
      throw new Error('SESSION_EXPIRED')
    }
    return res
  },
}
```

**Session Expired Overlay (Root Layout):**
```typescript
// src/app/layout.tsx — include SessionExpiredOverlay in root
import { SessionExpiredOverlay } from '@/components/auth/SessionExpiredOverlay'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SessionExpiredOverlay />
      </body>
    </html>
  )
}
```

**Password Strength Calculator:**
```typescript
// src/lib/passwordStrength.ts
export type StrengthLevel = 'WEAK' | 'FAIR' | 'STRONG' | 'SYSTEM-GRADE'

export interface PasswordStrength {
  level: StrengthLevel
  score: number // 0–4
  criteria: {
    minLength: boolean      // 8+ chars
    hasUppercase: boolean
    hasNumber: boolean
    hasSpecial: boolean
  }
}

export function calculateStrength(password: string): PasswordStrength {
  const criteria = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  }
  const score = Object.values(criteria).filter(Boolean).length
  const levels: StrengthLevel[] = ['WEAK', 'FAIR', 'STRONG', 'SYSTEM-GRADE']
  return { level: levels[Math.max(0, score - 1)] ?? 'WEAK', score, criteria }
}
```

---

## 5A. Project Setup

```bash
# Next.js 15 project bootstrap for MIRD AI Corporate Machine
npx create-next-app@latest mird-rainmachine --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd mird-rainmachine

# Core UI
npm install lucide-react clsx tailwind-merge

# Forms + Validation
npm install react-hook-form @hookform/resolvers zod

# Data Fetching
npm install @tanstack/react-query

# Animations
npm install framer-motion

# Charts
npm install recharts

# State
npm install zustand

# Notifications
npm install sonner

# Date utilities
npm install date-fns

# Auth (JWT handling)
npm install js-cookie
npm install -D @types/js-cookie
```

**Tailwind config additions needed:**
```javascript
// tailwind.config.ts — extend theme with JARVIS Dark tokens
theme: {
  extend: {
    colors: {
      'mird-base': '#050D1A',
      'mird-panel': '#0A1628',
      'mird-panel-hover': '#0D1E35',
      'mird-cyan': '#00D4FF',
      'mird-cyan-muted': '#7ECFDF',
      'mird-success': '#00FF88',
      'mird-warning': '#FFB800',
      'mird-alert': '#FF6B35',
      'mird-error': '#FF3333',
      'mird-text': '#E8F4F8',
      'mird-text-muted': '#7ECFDF',
      'mird-disabled': '#2A4A5A',
    },
    fontFamily: {
      'display': ['Orbitron', 'sans-serif'],
      'mono': ['Share Tech Mono', 'monospace'],
      'body': ['Inter', 'sans-serif'],
    },
    boxShadow: {
      'panel': '0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1)',
      'panel-hover': '0 0 30px rgba(0,212,255,0.12)',
      'glow-cyan': '0 0 20px rgba(0,212,255,0.3)',
      'glow-success': '0 0 12px rgba(0,255,136,0.3)',
      'glow-alert': '0 0 12px rgba(255,107,53,0.3)',
      'focus': '0 0 0 3px rgba(0,212,255,0.15)',
    }
  }
}
```

**Google Fonts to add to layout.tsx:**
```typescript
import { Orbitron, Inter } from 'next/font/google'
// Note: Share Tech Mono must be loaded via @import in globals.css
// @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
```

**globals.css additions:**
```css
/* JARVIS Dark base styles */
body {
  background-color: #050D1A;
  color: #E8F4F8;
  /* subtle grid pattern */
  background-image:
    repeating-linear-gradient(0deg, rgba(0,212,255,0.03) 0px, transparent 1px, transparent 40px),
    repeating-linear-gradient(90deg, rgba(0,212,255,0.03) 0px, transparent 1px, transparent 40px);
}

/* System pulse animation */
@keyframes system-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px currentColor; }
  50% { opacity: 0.4; box-shadow: 0 0 2px currentColor; }
}

/* Scan line */
@keyframes scan-line {
  0% { top: 0; opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

/* Shimmer skeleton */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Panel entrance */
@keyframes panel-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Alert flash */
@keyframes alert-flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Data tick (value update flash) */
@keyframes data-tick {
  0% { color: #1ADCFF; }
  100% { color: #00D4FF; }
}
```

**File structure for auth flow:**
```
src/
  app/
    auth/
      login/
        page.tsx               ← rm-auth-login-main + rm-auth-login-error (error state)
      forgot-password/
        page.tsx               ← rm-auth-forgot-password-main
        sent/
          page.tsx             ← rm-auth-forgot-password-confirmation
      reset-password/
        page.tsx               ← rm-auth-password-reset-form
        success/
          page.tsx             ← rm-auth-password-reset-success
      session-expired/
        page.tsx               ← rm-auth-session-expired (fallback route)
  components/
    auth/
      LoginForm.tsx
      ForgotPasswordForm.tsx
      ResetPasswordForm.tsx
      SessionExpiredOverlay.tsx
      PasswordStrengthBar.tsx
      StatusDot.tsx
    ui/
      PanelCard.tsx
      InputField.tsx
      ButtonPrimary.tsx
      ButtonSecondary.tsx
      ButtonGhost.tsx
  lib/
    schemas/
      auth.ts
    api.ts
    passwordStrength.ts
  store/
    authStore.ts
```

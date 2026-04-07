# Flow PRD: RainMachine Global Error States

**Flow ID:** F-09-RM-GLOBAL
**App:** RainMachine (MIRD AI Corporate Machine)
**Platform:** Web — all breakpoints
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 3 screens | P0: 0 | P1: 2 | P2: 1

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | Any invalid URL (404), server fault (500), planned maintenance window |
| **Exit Points** | Dashboard link on 404/500, maintenance auto-refreshes when system returns |
| **Primary User** | Marcus or any agent who hits an unexpected state |
| **Dependencies** | None — these screens must render with zero data dependencies |
| **URL Prefix** | `/404`, `/500`, `/maintenance` |

---

## 1A. UI Profile Compliance

**Profile:** MIRD JARVIS Dark v1.0
**Guardrails:**
- These screens have NO sidebar — full-viewport centered layout
- Error codes displayed in Share Tech Mono (large) — they're data, not labels
- Tone: system diagnostic, not consumer app apology ("SIGNAL LOST", not "Oops!")
- Animation: subtle only — no aggressive effects on error states

---

## 2. CMO Context

**Conversion stake:** Global errors are where users decide to leave or stay. A JARVIS-branded error screen with a clear path back keeps users in the system. A generic white error page kills trust.

---

## 3. Screen Specifications

---

### Screen 1: Page Not Found — 404

**Screen ID:** `rm-global-404`
**Priority:** P1 | **Route:** `/*` (catch-all)
**Complexity:** Simple | **Animation:** Simple

**Emotion Target:**
- 0–2s: "This is still a MIRD system screen. I'm not lost — the system caught me."
- 10s+: "I know where to go next."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  #050D1A  full viewport  grid pattern bg                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  PANEL CARD  max-width: 480px  centered  padding: 48px             │ │
│  │  margin: auto  vertical center                                      │ │
│  │                                                                    │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │  [Lucide Crosshair — 48px  #2A4A5A]  centered  mb:20px       │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  │                                                                    │ │
│  │  404                                                               │ │
│  │  Share Tech Mono 64px #7ECFDF  centered  mb:4px                   │ │
│  │  opacity:  0.4                                                     │ │
│  │                                                                    │ │
│  │  SIGNAL NOT FOUND                                                  │ │
│  │  Orbitron 18px 600 #E8F4F8  centered  uppercase  mb:8px            │ │
│  │                                                                    │ │
│  │  The requested route does not exist in this system.               │ │
│  │  Inter 14px #7ECFDF  centered  mb:32px                             │ │
│  │                                                                    │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │       RETURN TO DASHBOARD  →                               │   │ │
│  │  │  Primary button  routes to /dashboard                      │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  RAINMACHINE SYSTEM — ONLINE  [●]                                        │
│  STM 11px #7ECFDF  centered  bottom: 24px fixed                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Page | Full viewport, `bg: #050D1A`, grid pattern, centered flex |
| Panel card | `max-width: 480px`, `padding: 48px`, `margin: auto`, vertically centered |
| Icon | Lucide `Crosshair`, 48px, `#2A4A5A`, centered |
| 404 numeral | Share Tech Mono 64px `#7ECFDF` `opacity: 0.4`, centered — subtle, not a screaming red error |
| Heading | Orbitron 18px 600 `#E8F4F8` uppercase letter-spacing 0.06em |
| Body | Inter 14px `#7ECFDF` centered |
| CTA | Primary button, routes to `/dashboard` |
| Status bar | Share Tech Mono 11px `#7ECFDF`, status dot `#00FF88` pulse, `position: fixed bottom 24px` |

**Animation Spec:**
- `panel-enter`: Standard panel enter 400ms spring.
- No aggressive animations — this is a neutral, calm dead-end, not an alarm.

---

### Screen 2: System Fault — 500

**Screen ID:** `rm-global-500`
**Priority:** P1 | **Route:** `/500` (rendered on server error)
**Complexity:** Simple | **Animation:** Medium

**Emotion Target:**
- 0–2s: "Something broke server-side. The system knows. It's not my fault."
- 2–10s: "There's a countdown telling me when it will auto-retry."

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
│  │  [!] SYSTEM FAULT                  [Lucide AlertOctagon 20px]     │ │
│  │  Orbitron 11px #FF7D52             #FF7D52                         │ │
│  │  border-bottom rgba(255,107,53,0.2)  mb:20px                      │ │
│  │                                                                    │ │
│  │  500                                                               │ │
│  │  STM 64px rgba(255,107,53,0.3)  centered  mb:4px                  │ │
│  │                                                                    │ │
│  │  SERVER FAULT DETECTED                                             │ │
│  │  Orbitron 18px 600 #E8F4F8  centered  mb:8px                      │ │
│  │                                                                    │ │
│  │  A system error occurred. Auto-retrying in:                       │ │
│  │  Inter 14px #7ECFDF  centered  mb:12px                             │ │
│  │                                                                    │ │
│  │  00:30                                                             │ │
│  │  STM 32px #FF7D52  centered  mb:24px  (countdown)                 │ │
│  │                                                                    │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │       RETRY NOW  →      [Secondary button]                 │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  SYSTEM FAULT — CONTACT SUPPORT  [●]                                     │
│  STM 11px #FF7D52  centered  bottom: 24px fixed                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Panel border | `1px solid rgba(255,107,53,0.3)` |
| Panel shadow | `0 0 20px rgba(255,107,53,0.08)` |
| Error header badge | Orbitron 11px `#FF7D52` uppercase |
| Error icon | Lucide `AlertOctagon`, 20px, `#FF7D52` |
| 500 numeral | Share Tech Mono 64px `rgba(255,107,53,0.3)`, centered |
| Heading | Orbitron 18px 600 `#E8F4F8` |
| Countdown | Share Tech Mono 32px `#FF7D52`, centered, live countdown |
| Retry button | Secondary button — triggers page reload |
| Status bar | Share Tech Mono 11px `#FF7D52`, status dot `#FF3333` no-animation (system is down) |

**Animation Spec:**
- `panel-enter`: Standard.
- `countdown`: JavaScript `setInterval` counting down from 30 to 0, then auto-reloads page.
- No pulsating — error state is static. The countdown IS the animation.

**Interactive States:**
- **Countdown:** Auto-retries at 0. Secondary "RETRY NOW" button triggers immediate reload.
- **After retry success:** Normal page loads.
- **After retry fails:** Countdown resets and runs again.

---

### Screen 3: System Maintenance

**Screen ID:** `rm-global-maintenance`
**Priority:** P2 | **Route:** `/maintenance` (shown system-wide during planned downtime)
**Complexity:** Simple | **Animation:** Simple

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  #050D1A  full viewport  grid pattern bg                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  PANEL CARD  max-width: 480px  centered  padding: 48px             │ │
│  │                                                                    │ │
│  │  [Lucide Wrench — 48px  #2A4A5A]  centered  mb:20px                │ │
│  │                                                                    │ │
│  │  SYSTEM MAINTENANCE                                                │ │
│  │  Orbitron 18px 600 #E8F4F8  centered  mb:8px                      │ │
│  │                                                                    │ │
│  │  RainMachine is undergoing scheduled maintenance.                 │ │
│  │  Inter 14px #7ECFDF  centered  mb:20px                             │ │
│  │                                                                    │ │
│  │  ESTIMATED RETURN                                                  │ │
│  │  Orbitron 11px #7ECFDF  centered  mb:4px                           │ │
│  │  2026-03-30 at 16:00 EST                                           │ │
│  │  STM 18px #E8F4F8  centered                                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  RAINMACHINE SYSTEM — MAINTENANCE  [○]                                   │
│  STM 11px #FFB800  centered  bottom: 24px fixed                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Panel | Standard panel card |
| Icon | Lucide `Wrench`, 48px, `#2A4A5A` |
| Heading | Orbitron 18px 600 `#E8F4F8` |
| Body | Inter 14px `#7ECFDF` |
| Return label | Orbitron 11px `#7ECFDF` |
| Return time | Share Tech Mono 18px `#E8F4F8` |
| Status bar | Share Tech Mono 11px `#FFB800`, status dot `#FFB800` static (STANDBY, not error) |

**Data Requirements:**
- Maintenance end time: fetched from a static JSON config or env variable at build time

---

## 5. Stack Integration

### Key Patterns

**Auto-retry countdown (500 screen):**
```typescript
const [countdown, setCountdown] = useState(30)

useEffect(() => {
  const interval = setInterval(() => {
    setCountdown(prev => {
      if (prev <= 1) { window.location.reload(); return 0 }
      return prev - 1
    })
  }, 1000)
  return () => clearInterval(interval)
}, [])
```

**Next.js error pages:**
```
// app/not-found.tsx     → rm-global-404
// app/error.tsx         → rm-global-500
// middleware.ts         → redirect to /maintenance if MAINTENANCE_MODE=true
```

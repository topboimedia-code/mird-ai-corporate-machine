# Flow PRD: Onboarding Portal — Completion Sequence

**Flow ID:** F-23-OB-COMPLETION
**App:** Onboarding Portal (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 3 screens | P0: 2 | P1: 1 | P2: 0

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | `ob-wizard-step5-main` (LAUNCH RAINMACHINE) |
| **Exit Points** | RainMachine Dashboard (`app.makeitrain.digital`) |
| **Purpose** | Dramatic completion sequence — system initialization, what to expect next, access to dashboard |
| **Dependencies** | Provisioning job API (polling), RainMachine subdomain |

---

## 1A. UI Profile Note

This is the highest-stakes emotional moment in the entire product. The client has completed setup. "RAINMACHINE INITIALIZING" must feel like something real is happening — a machine spinning up, not a thank-you page. The completion screen is a full-viewport experience — no wizard panel, no step indicator. The aesthetic shifts from "guided wizard" to "command room."

---

## 4. Screen Specifications

---

### Screen 1: RainMachine Initializing

**Screen ID:** `ob-completion-initializing`
**Priority:** P0 | **Route:** `/setup/complete`
**Complexity:** Complex | **Animation:** Complex

**Emotion Target:**
- 0–3s: "Something is being built right now. This is real."
- 3–8s: "I can see the system spinning up. Each component going online."
- 8s+: "It's ready. I'm about to enter the dashboard."

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  #050D1A  full viewport  grid pattern bg  (no wizard panel)              │
│                                                                          │
│  [Centered vertically + horizontally]                                    │
│                                                                          │
│                                                                          │
│       ┌─────────────────────────────────────────────────────────────┐   │
│       │  [MIRD LOGOMARK — SVG 64px  #00D4FF]                        │   │
│       │  centered  mb:8px                                           │   │
│       │  box-shadow: 0 0 40px rgba(0,212,255,0.3)  (glow)           │   │
│       └─────────────────────────────────────────────────────────────┘   │
│       mb:24px                                                            │
│                                                                          │
│       RAINMACHINE INITIALIZING                                           │
│       Orbitron 22px 600 #E8F4F8  centered  mb:8px                        │
│                                                                          │
│       MARCUS LEADS GROUP                                                 │
│       Orbitron 14px #00D4FF  centered  mb:32px                           │
│       (client business name — personalized)                              │
│                                                                          │
│       ┌────────────────────────────────────────────────────────────┐     │
│       │  PROGRESS BAR  w:400px  h:3px  centered                    │     │
│       │  bg: rgba(0,212,255,0.1)  r:2px                            │     │
│       │  fill: #00D4FF  animated deterministic — polls job status  │     │
│       └────────────────────────────────────────────────────────────┘     │
│       mb:24px                                                            │
│                                                                          │
│       SYSTEM COMPONENTS ONLINE:                                          │
│       STM 11px #7ECFDF  centered  mb:12px                               │
│                                                                          │
│       ┌────────────────────────────────────────────────────────────┐     │
│       │  COMPONENT LOG  w:320px  centered                          │     │
│       │                                                            │     │
│       │  [✓] CRM Integration          ONLINE                       │     │
│       │  [✓] Meta Ads Connection      ONLINE                       │     │
│       │  [✓] Google Ads Link          ONLINE                       │     │
│       │  [✓] Lead Pipeline            ONLINE                       │     │
│       │  [⠿] AI Agent Configuration   CONFIGURING...               │     │
│       │  [○] Dashboard Access         PENDING                      │     │
│       │                                                            │     │
│       │  STM 11px  label #E8F4F8  status colored:                  │     │
│       │  ONLINE → #00FF88  CONFIGURING → #00D4FF (pulse)           │     │
│       │  PENDING → #2A4A5A                                         │     │
│       │  Items appear sequentially  600ms apart                    │     │
│       └────────────────────────────────────────────────────────────┘     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Logo | SVG MIRD logomark, 64px, `#00D4FF`, `box-shadow: 0 0 40px rgba(0,212,255,0.3)` |
| Logo animation | Breathing ambient glow — shadow pulses 3→40px, 2s alternate infinite |
| Heading | Orbitron 22px 600 `#E8F4F8` — largest text in the onboarding flow |
| Business name | Orbitron 14px `#00D4FF` — personalized |
| Progress bar | `width: 400px`, `height: 3px`, `border-radius: 2px` — polls provisioning job |
| Progress fill | Fills deterministically as job steps complete, then holds at 90% until dashboard ready |
| Component log | Share Tech Mono 11px, each line appears at 600ms stagger |
| ONLINE status | `#00FF88` — success green |
| CONFIGURING status | `#00D4FF` with `opacity-pulse` animation (0.6→1 1s alternate) |
| PENDING status | `#2A4A5A` — muted |
| Checkmark | Unicode ✓ or Lucide Check 12px, `#00FF88` |
| In-progress indicator | Unicode ⠿ (braille spinner char) or CSS spinner 12px `#00D4FF` |

**Animation:**
- `logo-glow-pulse`: `box-shadow` breathes 0 0 20px → 0 0 40px, 2s alternate infinite
- `scan-line`: Single sweep at 500ms — last scan-line in the flow
- `component-log-stagger`: Each row fades in 200ms at 600ms intervals
- `progress-complete`: Bar reaches 100%, then 500ms pause, then transition to Screen 2
- `status-configuring-pulse`: Active item opacity pulses 0.6→1 1s alternate

**States:**
- **Provisioning:** Progress bar fills, component log builds
- **Complete:** All items ONLINE, progress at 100%, auto-advance to Screen 2 after 800ms

---

### Screen 2: What Happens Next

**Screen ID:** `ob-completion-next-steps`
**Priority:** P0 | **Route:** `/setup/complete` (after initialization)
**Complexity:** Medium | **Animation:** Medium

**Emotion Target:**
- 0–2s: "My system is live. Now I see what happens next."
- 2–10s: "Three things will happen. The timeline makes it concrete."
- 10s+: "I'm confident. I'm clicking 'Enter Dashboard.'"

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  #050D1A  full viewport  grid pattern bg                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  PANEL CARD  max-width: 600px  centered  padding: 48px             │ │
│  │                                                                    │ │
│  │  [Lucide CheckCircle2 — 56px  #00FF88]  centered  mb:16px          │ │
│  │  box-shadow: 0 0 24px rgba(0,255,136,0.3)                         │ │
│  │                                                                    │ │
│  │  RAINMACHINE IS LIVE                                               │ │
│  │  Orbitron 22px 600 #E8F4F8  centered  mb:8px                      │ │
│  │                                                                    │ │
│  │  Marcus Leads Group — Setup complete.                              │ │
│  │  Inter 15px #7ECFDF  centered  mb:32px                             │ │
│  │                                                                    │ │
│  │  WHAT HAPPENS NEXT:                                                │ │
│  │  Orbitron 11px #7ECFDF  mb:16px                                   │ │
│  │                                                                    │ │
│  │  ┌─────────────────────────────────────────────────────────────┐  │ │
│  │  │  TIMELINE  vertical line left  (2px solid rgba cyan 0.2)    │  │ │
│  │  │                                                             │  │ │
│  │  │  [○ #00D4FF]  TODAY                                         │  │ │
│  │  │  STM 10px #7ECFDF  mb:4px                                   │  │ │
│  │  │  Your account manager reviews your setup and launches       │  │ │
│  │  │  your first campaigns.                                      │  │ │
│  │  │  Inter 13px #E8F4F8  mb:20px                                │  │ │
│  │  │                                                             │  │ │
│  │  │  [○ #7ECFDF]  WITHIN 15 MINUTES                            │  │ │
│  │  │  Meta Ads and Google Ads data begins syncing to your        │  │ │
│  │  │  RainMachine dashboard.                                     │  │ │
│  │  │  Inter 13px #E8F4F8  mb:20px                                │  │ │
│  │  │                                                             │  │ │
│  │  │  [○ #7ECFDF]  LAUNCH DATE: April 1, 2026                    │  │ │
│  │  │  (from step 5 selection — personalized)                     │  │ │
│  │  │  Your campaigns go live. RainMachine begins optimizing.     │  │ │
│  │  │  Inter 13px #E8F4F8                                         │  │ │
│  │  └─────────────────────────────────────────────────────────────┘  │ │
│  │                                              mb:32px              │ │
│  │                                                                    │ │
│  │  ┌─────────────────────────────────────────────────────────────┐  │ │
│  │  │  ENTER DASHBOARD  →                                         │  │ │
│  │  │  Primary button  h:56px  w:100%  Orbitron 600 14px          │  │ │
│  │  │  routes to: app.makeitrain.digital/dashboard                │  │ │
│  │  └─────────────────────────────────────────────────────────────┘  │ │
│  │                                                                    │ │
│  │  Questions? CONTACT YOUR ACCOUNT MANAGER  →  Ghost btn centered   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| CheckCircle2 icon | 56px `#00FF88`, `box-shadow: 0 0 24px rgba(0,255,136,0.3)` |
| Heading | Orbitron 22px 600 `#E8F4F8` |
| Subheading | Inter 15px `#7ECFDF`, includes business name |
| Timeline container | `border-left: 2px solid rgba(0,212,255,0.2)`, `padding-left: 20px` |
| Timeline node | 10px circle, `background: #00D4FF` (today) / `#7ECFDF` (future) |
| Timeline label | Share Tech Mono 10px `#7ECFDF` uppercase |
| Timeline body | Inter 13px `#E8F4F8` |
| Launch date | Personalized from step 5 selection |
| Enter Dashboard CTA | "ENTER DASHBOARD", Primary, `height: 56px` |
| Account manager link | Ghost button below CTA |

**Animation:**
- `panel-enter`: Panel slides up 8px + fade 400ms spring — same as wizard entry
- `check-icon-enter`: CheckCircle2 scales 0.5→1 with spring ease 500ms
- `timeline-stagger`: Each timeline item fades in 300ms at 400ms intervals

---

### Screen 3: Already Completed

**Screen ID:** `ob-completion-already-done`
**Priority:** P1 | **Route:** `/setup/complete` (returning user re-entry)
**Complexity:** Simple | **Animation:** Simple

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  #050D1A  full viewport  grid pattern bg                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  PANEL CARD  max-width: 480px  centered  padding: 48px             │ │
│  │                                                                    │ │
│  │  [Lucide LayoutDashboard — 40px  #00D4FF]  centered  mb:16px       │ │
│  │                                                                    │ │
│  │  SETUP ALREADY COMPLETE                                            │ │
│  │  Orbitron 16px 600 #E8F4F8  centered  mb:8px                      │ │
│  │                                                                    │ │
│  │  Your RainMachine system is already configured and live.          │ │
│  │  Inter 14px #7ECFDF  centered  mb:32px                             │ │
│  │                                                                    │ │
│  │  ┌─────────────────────────────────────────────────────────────┐  │ │
│  │  │  GO TO DASHBOARD  →                                         │  │ │
│  │  │  Primary button  h:52px  w:100%                             │  │ │
│  │  └─────────────────────────────────────────────────────────────┘  │ │
│  │                                                                    │ │
│  │  Need help? CONTACT SUPPORT  →  Ghost btn  centered               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**
- LayoutDashboard icon: `#00D4FF` — directs to the obvious next action
- Simple informational state — no drama, just redirect
- "GO TO DASHBOARD" routes to RainMachine dashboard

---

## 5. Stack Integration

**Provisioning job polling:**
```typescript
const { data: jobStatus } = useQuery({
  queryKey: ['provisioning-job', jobId],
  queryFn: () => fetch(`/api/onboarding/job/${jobId}`).then(r => r.json()),
  refetchInterval: 2000, // Poll every 2s
  enabled: !!jobId,
})

// Map job steps to component log entries
const componentSteps = [
  { key: 'crm', label: 'CRM Integration' },
  { key: 'meta', label: 'Meta Ads Connection' },
  { key: 'google_ads', label: 'Google Ads Link' },
  { key: 'pipeline', label: 'Lead Pipeline' },
  { key: 'ai_config', label: 'AI Agent Configuration' },
  { key: 'dashboard', label: 'Dashboard Access' },
]

// jobStatus.completedSteps: string[] → drive component log states
```

**Progress bar from job status:**
```typescript
// Map job step count to progress percentage
const progressPct = Math.min(
  (jobStatus?.completedSteps.length / componentSteps.length) * 100,
  90 // Hold at 90% until final step
)

// On all steps complete: fill to 100%, then transition to Screen 2 after 800ms
useEffect(() => {
  if (jobStatus?.status === 'complete') {
    setProgress(100)
    setTimeout(() => setView('next-steps'), 800)
  }
}, [jobStatus?.status])
```

**Dashboard redirect:**
```typescript
// After ENTER DASHBOARD click
const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'https://app.makeitrain.digital/dashboard'
window.location.href = dashboardUrl
```

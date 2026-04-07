# MOBILE-STATES.md
# MIRD JARVIS Dark — Mobile-Specific State Patterns
# Step 7 Output | Date: 2026-03-31

---

## Mobile Context

| App | Mobile Priority | Notes |
|-----|----------------|-------|
| RainMachine Dashboard | **P1** | Field agents use mobile for lead status, call logging |
| CEO Dashboard | **P2** | Primarily read-only on mobile; no mobile-first workflows |
| Onboarding Portal | **P3** | Screen 17.3 surfaces desktop recommendation; mobile-continue supported |

**Breakpoint activation:** `< 768px`

---

## E.1 Pull-to-Refresh

**Applies to:** RM Lead List, Dashboard, Campaigns, Reports Archive, Agent Overview · CEO Command Center, Client List, Agent Log

### Trigger & Threshold

| Parameter | Value |
|-----------|-------|
| Pull threshold | `80px` |
| Activation threshold | `60px` (visual snap point) |
| Max overscroll | `120px` |
| Haptic feedback | Light impact on activation threshold cross |
| Resistance curve | `pull_distance × 0.5` (logarithmic — harder to pull as distance increases) |

### Visual States

**State 1 — Pulling (< 60px)**
- `ChevronDown` `20px` `#7ECFDF` · `opacity: pull_distance / 60` (proportional fade-in)
- `PULL TO REFRESH` (Orbitron, `label`, `#7ECFDF`) · same opacity
- Purely positional — transforms with pull, no animation

**State 2 — Ready to Release (≥ 60px)**
- Icon swaps: `ChevronDown` → `RefreshCw` · `rotate(180deg)` · 200ms ease-out
- Label swaps: `RELEASE TO REFRESH` (Orbitron, `label`, `#00D4FF`)
- Background: `rgba(0,212,255,0.08)` on indicator bar
- Haptic: light impact

**State 3 — Refreshing (released)**
- Indicator locks at `60px` — does not snap closed
- `Loader2` spinning `#00D4FF` `0.8s linear infinite`
- `RETRIEVING DATA` (Orbitron, `label`, `#7ECFDF`)
- List content: `opacity: 0.6` (signals stale)

**State 4 — Complete**
- Success: `CheckCircle2` `#00FF88` · 600ms · then collapse `translateY(-60px)` 300ms ease-in · list → `opacity: 1`
- Error: `AlertTriangle` `#FF6B35` + `REFRESH FAILED` · 1.5s · then collapse · error toast fires

**Reduced-motion:** State changes occur; no animations. Haptic still fires. Pull threshold still applies.

**ARIA:** Visually hidden `aria-live="polite"` region at top of list. Announces:
- On trigger: `"Refreshing [content type]."`
- On success: `"[Content type] updated."`

### Implementation

```typescript
const THRESHOLD = 60;   // triggers refresh
const MAX_PULL = 120;   // hard cap
const RESISTANCE = 0.5; // logarithmic factor

// Visual pull distance
visualPull = Math.min(rawPull * RESISTANCE, MAX_PULL);

// State machine
rawPull < THRESHOLD  → 'pulling'
rawPull >= THRESHOLD → 'ready'
released && ready    → 'refreshing'
fetch resolves       → 'complete' | 'error'
```

---

## E.2 Infinite Scroll

**Applies to:** RM Lead List (primary), Reports Archive · CEO All Clients, Agent Log (historical)

### Trigger Spec

| Parameter | Value |
|-----------|-------|
| Trigger point | 80% scroll depth (`scrollTop + viewportH >= scrollH * 0.8`) |
| Page size | 25 items (leads, agents) · 10 items (reports, logs) |
| Intersection Observer threshold | `0.1` on sentinel element |
| Debounce | 500ms minimum between loads |

### Visual States

**LOADING MORE**
- 3 skeleton rows `h-[52px]` below last item · shimmer
- `LOADING MORE RECORDS` (Orbitron, `label`, `#7ECFDF`) above skeletons
- Enter: `opacity: 0→1` · 150ms ease-out

**END OF STREAM**
- Horizontal rule `rgba(0,212,255,0.08)` + centered label
- `END OF RECORDS` (Orbitron, `label`, `#2A4A5A`) — intentionally muted
- ARIA: `aria-label="All records loaded"`

**ERROR (mid-scroll)**
- Inline error bar (not full-page) — existing content stays interactive
- `CONNECTION FAILED` · `Could not load more records.` · `RETRY`
- ARIA: `aria-live="assertive"` · focus → retry button

### Scroll Position Preservation

**On back navigation (list → detail → back):**
- Position saved to `sessionStorage` on leave
- Restored before render on return (no visible jump)
- Stale > 5 min: scroll to top + refresh

**On tab switch within detail:**
- Each tab keeps independent scroll position in component state (not sessionStorage)

---

## E.3 App State Restoration

### Scroll Position Storage

| Surface | Storage | Lifetime |
|---------|---------|---------|
| Lead list | `sessionStorage['rm-leads-scroll']` | Session |
| Historical log | `sessionStorage['ceo-log-scroll']` | Session |
| Dashboard | Not stored — always top | — |
| Wizard steps | Not stored — steps are short | — |

### Form Data Preservation

**Wizard forms (Flows 18–22) — Critical path:**
- Auto-saves to `localStorage` every 30s and on input blur
- Key: `mird-ob-step-[N]-draft-[token]`
- On step load: draft exists → pre-populate + `PROGRESS RESTORED` banner (Screen 18.3)
- Draft cleared on successful step submit
- Draft TTL: 7 days (matches token expiry)

**Settings forms (RM / CEO):**
- No auto-save
- Unsaved changes → JARVIS confirmation modal on SPA route change
- `beforeunload` for browser navigation away

### Navigation Stack

**Wizard back button:** Goes to previous step (wizard manages own history; not browser history)

**App backgrounding/foregrounding:**
- `visibilitychange` event detected
- Foreground restore > 2 min: silent data refresh
- Foreground restore > 10 min: full skeleton refresh (stale assumed)
- Auth token: refresh attempted on foreground; session expiry → re-auth modal

---

## E.4 Network Quality Handling

### Connection Quality Detection

| Level | Detection | Bandwidth |
|-------|-----------|-----------|
| Fast | `effectiveType === '4g'` or `downlink > 5` | > 5 Mbps |
| Moderate | `effectiveType === '3g'` or `downlink 1–5` | 1–5 Mbps |
| Slow | `effectiveType === '2g'` or `downlink < 1` | < 1 Mbps |
| Offline | `onLine === false` or fetch timeout > 10s | 0 |

Detection: checked on page load + `navigator.connection` `change` event.

### Slow Connection State

**Visual indicator (smaller than SIGNAL LOST — `h-[36px]`):**
- `bg-[rgba(255,184,0,0.08)] border-b border-[rgba(255,184,0,0.20)]`
- `Signal` `14px` `#FFB800` + `SLOW CONNECTION DETECTED` (Orbitron, `label`, `#FFB800`)
- Right: `LOADING MAY BE SLOWER THAN USUAL` (Inter, `body-sm`, `#7ECFDF`)
- Auto-hides when connection improves · no dismiss
- ARIA: `role="status"` · `aria-live="polite"`

**Adaptations on slow connection:**

| Feature | Fast | Slow |
|---------|------|------|
| Image quality | Full resolution | Deferred / low-res |
| Chart rendering | Animated | Static SVG |
| Skeleton shimmer | Enabled | Disabled (static) |
| AI chat auto-suggest | Enabled | Disabled |
| Real-time agent ticker | Live polling | Paused, manual refresh |
| Prefetch on hover | Enabled | Disabled |

### Timeout & Retry Rules

| Request Type | Timeout | Auto-retry |
|-------------|---------|-----------|
| Page data fetch | 10s | Once (immediate) |
| Form submit | 15s | No — user retries manually |
| File upload | None (streaming) | No — user retries per file |
| External API (Meta, Google) | 20s | No — external system |
| Auth token refresh | 8s | Twice with 2s delay |

**Timeout copy:** `CONNECTION TIMED OUT` · `The server took too long to respond. Check your connection and try again.` · `RETRY`

### Mobile Input Adaptations

| Element | Desktop | Mobile |
|---------|---------|--------|
| Date picker | Custom JARVIS styled | Native `<input type="date">` |
| File upload | Drag-drop zone | Tap-to-select only |
| Slide-over panels | Right-side drawer | Full-screen bottom sheet (`border-radius: 8px 8px 0 0`) |
| Modals | `max-w-[480px]` centered | Full-width `margin: 16px` · `max-h: 90vh` internal scroll |
| Toast position | Bottom-right | Bottom-center, full width minus `32px` |
| Hover states | All enabled | Removed — `:active` states on touch |
| Tooltip triggers | Hover | Long-press (`500ms`) |

---

## E.5 Mobile State Summary

| Pattern | Apps | Trigger | Indicator | ARIA |
|---------|------|---------|-----------|------|
| Pull-to-refresh | RM, CEO | Pull ≥ 80px | `ChevronDown`→`RefreshCw`→spinner | `aria-live="polite"` |
| Infinite scroll | RM, CEO | 80% scroll depth | Skeleton rows + label | Sentinel `aria-label` |
| End of stream | RM, CEO | All pages loaded | Rule + `END OF RECORDS` label | `aria-label="All records loaded"` |
| Scroll restoration | RM, CEO | Back navigation | Silent | — |
| Form draft save | Wizard 1–5 | 30s + blur | `PROGRESS RESTORED` banner | `aria-live="polite"` |
| Unsaved changes guard | Settings | Route change | Confirmation modal | `role="alertdialog"` |
| Background restore | RM, CEO | > 2 min backgrounded | Silent refresh or skeleton | `aria-live="polite"` |
| Slow connection | RM, CEO | `effectiveType === '2g'` | `#FFB800` mini-banner | `role="status"` |
| Offline | RM, CEO | `onLine === false` | `SIGNAL LOST` banner | `role="alert"` |
| Reconnecting | RM, CEO | Network restored | `RE-ESTABLISHING SIGNAL` | `role="status"` |
| Timeout | All | > 10s fetch | SYSTEM ALERT + `RETRY` | `aria-live="assertive"` |

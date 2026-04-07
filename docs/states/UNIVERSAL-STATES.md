# UNIVERSAL-STATES.md
# MIRD JARVIS Dark — Universal State System
# Step 7 Output | Date: 2026-03-31

---

## 1. Universal State Model

Six base states cover every screen in every MIRD application. Four JARVIS-specific variants extend these for system conditions unique to MIRD.

### Base States

| # | State | JARVIS Label | User Emotion | Design Goal |
|---|-------|-------------|-------------|-------------|
| 1 | **Empty** | `STANDBY` | Curious, uncertain | **Inspire** — Convey the system is armed and ready |
| 2 | **Loading** | `PROCESSING` | Anticipation, slight anxiety | **Reassure** — Show the machine is working |
| 3 | **Populated** | `ACTIVE` | Productive, in control | **Empower** — Get out of the way |
| 4 | **Error** | `SYSTEM ALERT` | Frustrated, confused | **Calm + Recover** — Name the failure, give one recovery command |
| 5 | **Success** | `CONFIRMED` | Accomplished | **Acknowledge + Advance** — Mark the win, point to next operation |
| 6 | **Offline** | `SIGNAL LOST` | Anxious | **Comfort** — Show what still operates, promise reconnection |

### JARVIS-Specific Variants

| Variant | Parent State | Trigger | Visual Indicator |
|---------|-------------|---------|-----------------|
| `STANDBY` | Empty | No data exists; system initialized but unpopulated | Cyan ambient pulse on icon; "AWAITING [ENTITY] SIGNALS" |
| `PROCESSING` | Loading | External API call in progress (unknown duration) | Indeterminate shimmer bar; sequential label stagger |
| `INITIALIZING` | Loading | System boot / first-load scan-line | Full-viewport scan-line; Orbitron "INITIALIZING..." |
| `DEGRADED` | Partial/Error | Some data loaded, some API calls failed | Orange left-border alert banner over populated content |
| `RECONNECTING` | Offline→Loading | Network restored; re-fetching | "RE-ESTABLISHING SIGNAL..." shimmer bar |
| `MAINTENANCE` | Offline | Platform-level maintenance | Full-screen maintenance panel; no retry |
| `SESSION EXPIRED` | Error | Auth token lapsed | Full-page overlay; no partial content; redirect prompt |
| `ACCESS RESTRICTED` | Empty | Feature exists but user lacks permission | Lock icon + "CLEARANCE REQUIRED" + contact-admin CTA |

---

## 2. Token Mapping Per State

| State | Background | Border | Primary Color | Text Label | Icon |
|-------|-----------|--------|--------------|-----------|------|
| `STANDBY` | `#050D1A` | `rgba(0,212,255,0.20)` | `#00D4FF` (dim, pulsing) | `#7ECFDF` | `Radar` or context |
| `PROCESSING` | `#0A1628` | `rgba(0,212,255,0.20)` | `#00D4FF` (shimmer) | `#7ECFDF` | `Loader2` (spin) |
| `INITIALIZING` | `#050D1A` | none | `#00D4FF` (scan-line) | `#E8F4F8` | none (full-screen) |
| `ACTIVE` | `#050D1A` / `#0A1628` | `rgba(0,212,255,0.20)` | `#00D4FF` | `#E8F4F8` | Contextual |
| `SYSTEM ALERT` | `#050D1A` | `rgba(255,107,53,0.40)` | `#FF3333` / `#FF6B35` | `#FF7D52` | `AlertTriangle` |
| `DEGRADED` | `#050D1A` | `rgba(255,184,0,0.40)` (banner) | `#FFB800` | `#FFB800` | `AlertCircle` |
| `CONFIRMED` | `#050D1A` | `rgba(0,255,136,0.40)` | `#00FF88` | `#00FF88` | `CheckCircle2` |
| `SIGNAL LOST` | `#050D1A` | `rgba(255,107,53,0.40)` | `#FF6B35` | `#FF7D52` | `WifiOff` |
| `RECONNECTING` | `#0A1628` | `rgba(0,212,255,0.20)` | `#00D4FF` | `#7ECFDF` | `Loader2` |
| `MAINTENANCE` | `#050D1A` | `rgba(0,212,255,0.20)` | `#00D4FF` (dim) | `#7ECFDF` | `Construction` |
| `SESSION EXPIRED` | `#050D1A` | `rgba(255,51,51,0.40)` | `#FF3333` | `#FF7D52` | `Lock` |
| `ACCESS RESTRICTED` | `#050D1A` | `rgba(0,212,255,0.08)` | `#0A4F6E` | `#2A4A5A` | `ShieldOff` |

---

## 3. Per-App State Applicability

| State | RainMachine (01–09) | CEO Dashboard (10–16) | Onboarding Portal (17–24) |
|-------|--------------------|-----------------------|--------------------------|
| STANDBY | ✅ | ✅ | ✅ |
| PROCESSING | ✅ | ✅ | ✅ |
| INITIALIZING | ✅ | ✅ | ✅ |
| ACTIVE | ✅ | ✅ | ✅ |
| SYSTEM ALERT | ✅ | ✅ | ✅ |
| DEGRADED | ✅ | ✅ | ⚠️ Step 3/4 only |
| CONFIRMED | ✅ | ✅ | ✅ |
| SIGNAL LOST | ✅ | ✅ | ❌ |
| RECONNECTING | ✅ | ✅ | ❌ |
| MAINTENANCE | ✅ (Flow 09) | ❌ | ❌ |
| SESSION EXPIRED | ✅ (Flows 01, 09) | ✅ (Flows 10, 16) | ❌ |
| ACCESS RESTRICTED | ⚠️ Future gating | ✅ | ❌ |

---

## 4. Loading Pattern System

### 4.1 JARVIS Skeleton Screens

**When:** Any content page load > 300ms. Default for all list, table, dashboard, and detail pages.

**Spec:**
- Background: `#0A1628`
- Shimmer: `linear-gradient(90deg, #0A1628 25%, rgba(0,212,255,0.08) 50%, #0A1628 75%)` · `1.5s ease-in-out infinite`
- Animate only `transform` and `opacity` — never width/height
- Reduced-motion: static `#0A1628` block, no animation

**Skeleton dimensions per component:**

| Component | Fixed Dimensions | Skeleton Shape |
|-----------|-----------------|----------------|
| Metric card | `h-[120px] w-full` | Title `h-[12px] w-[60%]` + value `h-[40px] w-[80%]` |
| Table row | `h-[52px]` | 5 inline bars proportional to column widths, `h-[12px]` |
| Agent card | `h-[140px]` | Circle `w-[40px] h-[40px]` + title `h-[14px] w-[50%]` + 2 stat bars |
| Report card | `h-[80px]` | Title `h-[14px] w-[70%]` + subtitle `h-[11px] w-[40%]` + badge |
| Lead slide-over | `h-auto` | Header `h-[80px]` + 4 field rows `h-[20px]` + action row `h-[40px]` |
| Chart area | `h-[200px] w-full` | Single block |
| Wizard form | `h-auto` | 3 input rows `h-[48px] w-full` with label bars |
| Full-page detail | varies | Header `h-[100px]` + 3-column card grid |

**Transition out:** `opacity: 1→0` (150ms ease-out) → content stagger-reveals (`staggerChildren: 0.05s`, `opacity: 0→1` + `translateY: 8px→0`)

### 4.2 Scan-Line Initialization

**When:** First load only — RainMachine dashboard, CEO command center, Onboarding wizard step 1.

**Spec:**
- Line: `2px` height · `rgba(0,212,255,0.60)` · `box-shadow: 0 0 12px rgba(0,212,255,0.40)`
- Duration: 400ms · `ease-in-out` · top → bottom
- Label: `INITIALIZING [APP NAME]` (Orbitron, `#7ECFDF`, `label` scale) · centered during sweep
- After sweep: skeleton fades in immediately
- Reduced-motion: scan-line skipped; skeleton appears instantly

### 4.3 Indeterminate Shimmer Progress Bar

**When:** External API calls of unknown duration (Meta verify, Google Ads verify, GMB search, AI report, provisioning).

**Spec:**
- Container: `w-full h-[4px] bg-[rgba(0,212,255,0.08)] rounded-full`
- Fill: `w-[40%] h-full bg-[#00D4FF] rounded-full` · `translateX(-100%)→translateX(350%)` · `1.5s ease-in-out infinite`
- Sequential label stagger (Flows 17, 20, 21): labels fade in 600ms apart (`opacity: 0→1`, 200ms)
- Cancel link: `CANCEL` ghost always present below bar
- Reduced-motion: static bar at 50% width, no movement; labels still stagger
- ARIA: `role="progressbar"` · `aria-label="Loading"` · no `aria-valuenow` (indeterminate)

### 4.4 Deterministic Progress Bar

**When:** File uploads (Flow 22), provisioning steps (Flow 23), any operation where % is known.

**Spec:**
- Same container as 4.3
- Fill width: driven by `progress` value via `transform: scaleX()` (GPU-safe)
- Label: `[N]% COMPLETE` (Orbitron, `#7ECFDF`, `label`) · updates live
- Step labels (Flow 23): active = `#00D4FF` · completed = `#00FF88` · upcoming = `#2A4A5A`
- ARIA: `role="progressbar"` · `aria-valuenow="[N]"` · `aria-valuemin="0"` · `aria-valuemax="100"`
- Milestones announced at 25%, 50%, 75%, 100% via `aria-live="polite"` region

### 4.5 Button Loading State

**When:** Any form submit, save, or action button.

**Spec:**
- Button width locked at click (no resize)
- Label replaced with `Loader2` spin + optional muted text
- Spin: `rotate(360deg)` · `0.8s linear infinite`
- `aria-disabled="true"` on button · `aria-busy="true"` on form

### 4.6 Optimistic UI

**When:** Lead status updates, alert dismissals, toggle changes — low-failure-risk actions.

**Rules:**
- UI updates immediately; success toast fires simultaneously
- On API failure: revert UI state + `SYSTEM ALERT` toast with `UNDO` option
- Applies to: lead status dropdown, agent toggles, CEO alert dismiss, notification toggles

---

## 5. Error Handling Hierarchy

### Tier 1 — Inline Field Validation

**When:** Form field fails validation.
**Trigger:** On blur for format errors · on submit for required.

**Spec:**
- Field border: `rgba(255,51,51,0.60)`
- Error text: `#FF7D52` · Inter · `body-sm` · `AlertCircle` icon `12px` inline
- Animation: `x:[0,-6,6,-6,6,0]` · 250ms · 1 cycle only
- ARIA: `aria-invalid="true"` · `aria-describedby="[field-id]-error"` · error `<p>` has matching `id`

**Copy:** `[Field] is required.` / `[Field] must be a valid [type].`

### Tier 2 — Alert Banner

**When:** Network error on action, save failure, DEGRADED partial failure.
**Placement:** Below page heading, above primary content.

**Spec:**
- `w-full p-[16px] bg-[#0A1628] border-l-[4px] border-[#FF6B35] rounded-r-[4px]`
- `AlertTriangle` `20px` `#FF6B35` · Orbitron `heading-3` `#FF6B35` headline · Inter `body-sm` `#E8F4F8` body
- Enter: `translateY(-8px)→0` + `opacity: 0→1` · 200ms
- Exit: `opacity: 1→0` + `translateY(-4px)` · 150ms
- ARIA: `role="alert"` · `aria-live="assertive"` · focus moves to banner

### Tier 3 — Toast Notification

**When:** Success confirmations · non-critical errors.
**Placement:** Bottom-right · `z-index: 900` · max 3 stacked.

| Type | Border | Icon | Auto-dismiss | ARIA Role |
|------|--------|------|-------------|-----------|
| Success | `#00FF88` | `CheckCircle2` | 3s | `status` |
| Info | `#00D4FF` | `Info` | 3s | `status` |
| Warning | `#FFB800` | `AlertCircle` | 5s | `alert` |
| Error | `#FF6B35` | `AlertTriangle` | No | `alert` |

- Enter: `translateX(100%)→0` + `opacity: 0→1` · 300ms spring `{stiffness:350, damping:30}`
- Screen readers: auto-dismiss extended to 8s
- Reduced-motion: opacity fade only (no slide)

### Tier 4 — Critical Modal

**When:** Destructive confirmations · session expiry · full system failures.

**Spec:**
- `max-w-[480px] p-[32px] bg-[#0A1628] border border-[rgba(255,107,53,0.40)] rounded-[8px]`
- Backdrop: `rgba(10,22,40,0.85)` · `z-index: 1000`
- Entry: backdrop `opacity: 0→0.85` (200ms) + content `scale: 0.95→1` + `opacity: 0→1` (250ms)
- ARIA: `role="alertdialog"` · focus trap · initial focus on cancel (not destructive)

---

## 6. Empty State System

### Type 1 — STANDBY (System ready, no data)

- Icon: context-specific Lucide · `48px` · `#00D4FF` `opacity: 0.40` · ambient pulse `0.40→0.70→0.40` `2.5s` infinite
- Headline: Orbitron `heading-2` `#7ECFDF`
- Body: Inter `body` `#7ECFDF` · max 1 sentence
- Container: `padding: 64px 24px` centered
- Reduced-motion: no pulse, static at `opacity: 0.55`

### Type 2 — NO RESULTS (Search/filter zero results)

- Icon: `Search` · `40px` · `#7ECFDF` · static (user-controlled state)
- Copy: `NO MATCHING RECORDS` / `Adjust your search parameters or clear filters.` / `CLEAR FILTERS`

### Type 3 — FIRST-TIME (Onboarding empty)

- Icon at full `opacity: 1.0` (no pulse — active guidance)
- Description: Inter `body` `#E8F4F8` (brighter — instructional)
- Optional numbered step hints

### Type 4 — ACCESS RESTRICTED

- Icon: `ShieldOff` · `48px` · `#2A4A5A` · no glow, no pulse
- Headline: `CLEARANCE REQUIRED` · `#2A4A5A`
- Body: `#7ECFDF` (action path readable)
- CTA: `CONTACT YOUR ADMIN` ghost only

---

## 7. Offline Handling

### SIGNAL LOST Banner

- `w-full h-[48px] bg-[#0A1628] border-b border-[rgba(255,107,53,0.40)]`
- `WifiOff` `16px` `#FF6B35` + `SIGNAL LOST` (Orbitron, `label`, `#FF6B35`) + body (Inter, `body-sm`) + timestamp (Share Tech Mono, `#7ECFDF`)
- Enter: `translateY(-48px)→0` · 250ms ease-out
- Exit: `translateY(-48px)` · 200ms ease-in
- No dismiss — persists until network restored
- Offline behaviour: fetches suspended · cached data renders with `[CACHED DATA]` label · writes queue to `sessionStorage`
- ARIA: `role="alert"` · `aria-live="assertive"`

### RECONNECTING State

- Same container · `Loader2` spinning `#00D4FF` · `RE-ESTABLISHING SIGNAL` label
- Auto-dismisses on sync complete + `SIGNAL RESTORED` success toast
- Queued writes flush in order on reconnect
- ARIA: `role="status"` · `aria-live="polite"`

### Staleness Indicator

- `Clock` `12px` `#FFB800` + `mono-xs` timestamp `#FFB800` inline with section heading
- Appears when data > 5 min old
- Clicking triggers section refresh
- ARIA: `aria-label="Data last updated at [time]. Click to refresh."`

---

## 8. Toast System Reference

**Stack rules:**
- Max 3 visible; 4th arrival = oldest exits first
- `8px` gap between toasts · `translateY` transition on stack shuffle (200ms)
- `Esc` dismisses most recent · `Tab` into toast if it has a CTA
- Screen reader auto-dismiss: 8s (vs 3s visual)
- Mobile: bottom-center, full width minus `32px` margin
- Reduced-motion: `opacity` fade only (no `translateX`)

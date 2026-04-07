# FLOW-11-CEO-COMMAND-CENTER.md
# CEO Dashboard — Command Center States
# 4 screens | Step 7 Output | 2026-03-31

---

## Screen 11.1 — ceo-command-center

**Purpose:** Full business OS overview — all clients, all alerts, department health
**Layout:** `max-width: 1440px` · no sidebar · full-width

### INITIALIZING
- **Trigger:** First load
- **Visual:** Full-viewport scan-line · `LOADING COMMAND CENTER` (Orbitron, `#7ECFDF`)
- **ARIA:** `aria-live="polite"` → `"Loading command center."`

### PROCESSING
- **Visual:** Alert panel skeleton · KPI grid skeletons · client list skeleton · all `h-` matching loaded dimensions
- **ARIA:** `aria-busy="true"` on main region

### ACTIVE
- **Visual:** Alert feed (orange-bordered top) · KPI grid (metric cards) · client health grid · agent activity ticker
- **Interaction:** Alert row → 11.2 · Client row → 12.x · Dept card → 13.x
- **ARIA:** `aria-live="polite"` for alert ticker updates

### STANDBY (no alerts)
- **Visual:** Alert feed shows positive empty state · `ShieldCheck` icon `#00FF88`
- **Headline:** `ALL SYSTEMS NOMINAL` (Orbitron, `#00FF88`)
- **Body:** `No critical alerts across monitored accounts.` (Inter)
- **CTA:** None required

### DEGRADED
- **Trigger:** Some data unavailable
- **Visual:** Loaded sections render · failed section → `#FFB800` warning + `DATA UNAVAILABLE`
- **Banner:** `[Section] data could not be loaded.` · per-section `RETRY`
- **ARIA:** `aria-live="polite"`

### SYSTEM ALERT
- **Headline:** `CONNECTION FAILED` · `RETRY`
- **ARIA:** `aria-live="assertive"`

---

## Screen 11.2 — ceo-command-center-alert-detail

### PROCESSING
- **Trigger:** Alert row click
- **Visual:** Slide-over from right · skeleton
- **Copy:** `LOADING ALERT`
- **ARIA:** `role="dialog"` · `aria-busy="true"`

### ACTIVE
- **Visual:** Alert: type badge · client · affected metric · timestamp · recommended action · severity
- **Interaction:** `DISMISS` → 11.3 modal · `VIEW CLIENT` → 12.x
- **ARIA:** Focus trapped · initial focus on close button

### SYSTEM ALERT
- **Copy:** `LOAD FAILED` · `RETRY` or close
- **ARIA:** `aria-live="assertive"` inside dialog

---

## Screen 11.3 — ceo-command-center-dismiss-modal

### ACTIVE
- **Visual:** Confirmation modal · notes textarea (optional)
- **Heading:** `DISMISS ALERT` (Orbitron)
- **Body:** `Add a note about this dismissal (optional).` (Inter)
- **CTAs:** `CONFIRM DISMISS` primary · `CANCEL` ghost
- **ARIA:** `role="dialog"` · focus trap · initial focus on notes textarea

### PROCESSING
- **Copy:** Button → `DISMISSING...`
- **ARIA:** `aria-live="polite"`

### CONFIRMED
- **Trigger:** Dismissed
- **Visual:** Modal closes · alert slides out 250ms · toast fires
- **Toast:** `ALERT DISMISSED` · 3s
- **ARIA:** `aria-live="polite"`

---

## Screen 11.4 — ceo-command-center-all-clients

### PROCESSING
- **Visual:** Client list skeleton
- **Copy:** `LOADING CLIENTS`
- **ARIA:** `aria-busy="true"`

### ACTIVE
- **Visual:** Full client table: name · health badge · active campaigns · lead volume · revenue · last activity
- **Interaction:** Row click → 12.x · Sort · Filter
- **ARIA:** `role="grid"`

### STANDBY
- **Headline:** `NO CLIENTS IN SYSTEM` (Orbitron, `#7ECFDF`)
- **Body:** `Client accounts will appear here once onboarding is complete.` (Inter)

### SYSTEM ALERT
- **Headline:** `CONNECTION FAILED` · `RETRY`
- **ARIA:** `aria-live="assertive"`

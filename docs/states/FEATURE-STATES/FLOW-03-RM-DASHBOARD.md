# FLOW-03-RM-DASHBOARD.md
# RainMachine — Home Dashboard States
# 4 screens | Step 7 Output | 2026-03-31

---

## Screen 03.1 — rm-dashboard-home (+ 03.2, 03.3, 03.4)

**Purpose:** Live metrics overview — leads, campaigns, agent health
**Note:** PRD screens 03.2 (loading), 03.3 (empty), 03.4 (error) are state variants of the same page.

### INITIALIZING
- **Trigger:** First load / hard refresh
- **Visual:** Full-viewport scan-line 400ms · `INITIALIZING RAINMACHINE` centered (Orbitron, `#7ECFDF`)
- **ARIA:** `aria-live="polite"` → `"Loading dashboard."`

### PROCESSING (= Screen 03.2)
- **Trigger:** Data fetch after init
- **Visual:** 4 metric card skeletons `h-[120px]` · chart area skeleton `h-[200px]` · shimmer
- **Copy:** `LOADING DASHBOARD` (Orbitron, muted, top of page)
- **ARIA:** `aria-busy="true"` on main region

### ACTIVE (primary state)
- **Trigger:** Data loaded
- **Visual:** Metric cards with `metric-xl` Share Tech Mono values · chart stagger-animates in · agent status dots breathe
- **Interaction:** Metric cards clickable → drill-down · chart hover → tooltip
- **ARIA:** `aria-label` on each metric card: `aria-label="[Metric name]: [value]"`

### STANDBY (= Screen 03.3)
- **Trigger:** No campaign data; no leads in system
- **Visual:** Metric cards show `—` values · chart shows `AWAITING DATA` grid · `Activity` icon dim-pulse
- **Headline:** `SYSTEM STANDING BY` (Orbitron, `#7ECFDF`)
- **Body:** `No campaigns are currently running. Launch a campaign to begin receiving data.` (Inter)
- **CTA:** `GO TO CAMPAIGNS` primary
- **ARIA:** `aria-label` on empty chart area

### DEGRADED
- **Trigger:** Partial API failure (e.g., Meta down, Google up)
- **Visual:** Loaded cards display · failed cards show `#FFB800` warning icon + `DATA UNAVAILABLE` · orange alert banner top of page
- **Banner:** `PLATFORM DATA UNAVAILABLE` (Orbitron, `#FFB800`) · `[Platform] data could not be loaded. Other data is still showing.` · `RETRY` ghost
- **ARIA:** `aria-live="polite"` · banner `role="alert"`

### SYSTEM ALERT (= Screen 03.4)
- **Trigger:** Full fetch failure
- **Visual:** All metric cards → error state · `AlertTriangle` icons · red border on content area
- **Headline:** `CONNECTION FAILED` (Orbitron, `#FF6B35`)
- **Body:** `Unable to retrieve dashboard data. Check your connection and try again.` (Inter)
- **CTA:** `RETRY` primary
- **ARIA:** `aria-live="assertive"`

# FLOW-13-CEO-DEPT-DRILLDOWN.md
# CEO Dashboard — Department Drilldown States
# 8 screens | Step 7 Output | 2026-03-31

---

## Shared Department Page Pattern

All 6 department pages (13.1, 13.3–13.8) follow this pattern:

### PROCESSING
- **Trigger:** Dept card click from command center
- **Visual:** Full-page skeleton: metric row + chart + data table · all at fixed dimensions
- **Copy:** `LOADING [DEPT NAME]` (Orbitron, muted)
- **ARIA:** `aria-busy="true"`

### ACTIVE
- **Visual:** Dept-specific metrics · charts · data tables
- **Interaction:** Contextual (see per-dept below)

### DEGRADED
- **Visual:** Some panels loaded · failed panels → `#FFB800` warning + `DATA UNAVAILABLE`
- **Banner:** Per-section retry
- **ARIA:** `aria-live="polite"`

### SYSTEM ALERT
- **Headline:** `CONNECTION FAILED` · `RETRY`
- **ARIA:** `aria-live="assertive"`

---

## Screen 13.1 — ceo-dept-growth-acquisition

**ACTIVE content:** Lead volume metrics · platform breakdown · funnel chart · top campaigns · prospect table
**STANDBY:** `NO GROWTH DATA AVAILABLE`
**Interaction:** Prospect row → 13.2 slide-over

---

## Screen 13.2 — ceo-dept-prospect-detail

### PROCESSING
- **Trigger:** Prospect row click
- **Visual:** Slide-over skeleton
- **Copy:** `LOADING PROSPECT DETAIL`
- **ARIA:** `role="dialog"` · `aria-busy="true"`

### ACTIVE
- **Visual:** Prospect: contact · source · stage · agent · timeline entries
- **Interaction:** Stage update · assign action
- **ARIA:** Focus trapped

### SYSTEM ALERT
- **Copy:** `LOAD FAILED` · `RETRY` or close

---

## Screen 13.3 — ceo-dept-ad-ops

**ACTIVE content:** Platform performance breakdown · spend pacing · CPL trends · creative performance
**STANDBY:** `NO AD OPERATIONS DATA AVAILABLE`

---

## Screen 13.4 — ceo-dept-product-automation

**ACTIVE content:** Active workflows · automation health scores · trigger counts · error rates
**STANDBY:** `NO WORKFLOW DATA AVAILABLE`

---

## Screen 13.5 — ceo-dept-onboarding-status

**ACTIVE content:** Clients in onboarding · step completion rates · stuck clients · days since last activity
**STANDBY:** `NO CLIENTS IN ONBOARDING` · `All clients have completed setup.`

---

## Screen 13.6 — ceo-dept-workflow-health

**ACTIVE content:** Workflow status grid · health scores per workflow · anomaly log
**STANDBY (positive):**
- **Visual:** `CheckCircle2` icon `#00FF88` · no pulse (positive terminal state)
- **Headline:** `ALL WORKFLOWS OPERATIONAL` (Orbitron, `#00FF88`)
- **Body:** `No workflow anomalies detected.` (Inter)
- Note: This standby is a success state, not an absence state — use green tokens, not muted

---

## Screen 13.7 — ceo-dept-financial-intelligence

**ACTIVE content:** Revenue KPIs · client MRR · spend vs. revenue ratio · trend charts
**STANDBY:** `NO FINANCIAL DATA AVAILABLE`

---

## Screen 13.8 — ceo-dept-pl-detail

**ACTIVE content:** P&L table: revenue · COGS · gross margin · operating expenses · net · by period
**STANDBY:** `NO P&L DATA AVAILABLE FOR SELECTED PERIOD`
**Interaction:** Period selector → triggers PROCESSING → ACTIVE/STANDBY cycle

# FLOW-14-CEO-AGENT-LOG.md
# CEO Dashboard — Agent Activity Log States
# 3 screens | Step 7 Output | 2026-03-31

---

## Screen 14.1 — ceo-agent-log

### PROCESSING
- **Visual:** Log row skeletons
- **Copy:** `LOADING AGENT ACTIVITY`
- **ARIA:** `aria-busy="true"`

### ACTIVE
- **Visual:** Timestamped log: agent name · action type · entity affected · outcome badge · newest entry tick animation
- **Interaction:** Filter by agent/dept/type · `VIEW FULL LOG` → 14.2 · Date range → 14.3
- **ARIA:** `role="log"` · `aria-live="polite"` for live updates (polite — not urgent)

### STANDBY
- **Visual:** `Terminal` icon dim-pulse
- **Headline:** `NO AGENT ACTIVITY RECORDED` (Orbitron, `#7ECFDF`)
- **Body:** `Activity will appear here when agents begin processing leads.` (Inter)

### SYSTEM ALERT
- **Headline:** `CONNECTION FAILED` · `RETRY`
- **ARIA:** `aria-live="assertive"`

---

## Screen 14.2 — ceo-agent-dept-full-log

Same pattern as 14.1 scoped to a single department.
- **Loading copy:** `LOADING [DEPT] ACTIVITY`
- **STANDBY:** `NO ACTIVITY FOR THIS DEPARTMENT`

---

## Screen 14.3 — ceo-agent-historical-log

### ACTIVE (date range not selected)
- **Visual:** Date range picker prominent · log area empty
- **Copy:** `SELECT DATE RANGE TO LOAD HISTORICAL LOG` (Orbitron, `#7ECFDF`)
- **ARIA:** `aria-label` on date picker

### PROCESSING
- **Trigger:** Date range selected
- **Visual:** Log skeleton
- **Copy:** `LOADING HISTORICAL DATA`
- **ARIA:** `aria-busy="true"`

### ACTIVE (data loaded)
- **Visual:** Paginated historical log
- **Interaction:** Pagination · Export CSV
- **ARIA:** `role="log"`

### STANDBY (no results for range)
- **Headline:** `NO ACTIVITY IN SELECTED PERIOD` (Orbitron, `#7ECFDF`)
- **CTA:** `CLEAR DATE RANGE` ghost

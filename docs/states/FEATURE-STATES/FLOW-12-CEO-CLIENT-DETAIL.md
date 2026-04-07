# FLOW-12-CEO-CLIENT-DETAIL.md
# CEO Dashboard — Client Detail States
# 5 screens | Step 7 Output | 2026-03-31

All screens share a tab shell. Each tab has its own state cycle.
**ARIA:** Tabs `role="tablist"` · panels `role="tabpanel"` · active tab `aria-selected="true"`

---

## Screen 12.1 — ceo-client-overview (tab)

### PROCESSING
- **Visual:** Skeleton: header block + 4 metric cards + summary list
- **Copy:** `LOADING CLIENT OVERVIEW`
- **ARIA:** `aria-busy="true"`

### ACTIVE
- **Visual:** Client header: name · health badge · onboarding date · KPI cards · agent summary
- **Interaction:** Tab navigation · `VIEW ALERTS` link

### DEGRADED
- **Visual:** Loaded sections · failed sections → `#FFB800` warning icon
- **Banner:** Warning with per-section retry

### SYSTEM ALERT
- **Headline:** `CONNECTION FAILED` · `RETRY`
- **ARIA:** `aria-live="assertive"`

---

## Screen 12.2 — ceo-client-campaigns (tab)

### PROCESSING → `LOADING CAMPAIGN DATA`
### ACTIVE → Campaign table (same structure as Flow 06, scoped to client)
### STANDBY → `NO CAMPAIGNS ACTIVE FOR THIS CLIENT`
### SYSTEM ALERT → `CAMPAIGN DATA UNAVAILABLE`

---

## Screen 12.3 — ceo-client-leads (tab)

### PROCESSING → `LOADING LEAD DATA`
### ACTIVE → Lead list scoped to client (same structure as Flow 04)
### STANDBY → `NO LEADS IN SYSTEM FOR THIS CLIENT`
### SYSTEM ALERT → `LEAD DATA UNAVAILABLE`

---

## Screen 12.4 — ceo-client-timeline (tab)

### PROCESSING → `LOADING TIMELINE`
### ACTIVE
- **Visual:** Chronological activity entries: event type badge · description · timestamp · agent attribution
- **ARIA:** `role="list"` · entries `role="listitem"`

### STANDBY → `NO ACTIVITY RECORDED` · `Activity will appear here as client milestones occur.`
### SYSTEM ALERT → `TIMELINE UNAVAILABLE`

---

## Screen 12.5 — ceo-client-financials (tab)

### PROCESSING → `LOADING FINANCIAL DATA`
### ACTIVE
- **Visual:** Revenue metrics · invoice history · spend vs. revenue chart
- **ARIA:** Metric cards labelled · table `role="grid"`

### STANDBY → `NO FINANCIAL DATA AVAILABLE`
### SYSTEM ALERT → `FINANCIAL DATA UNAVAILABLE`

---

## Shared State Specs (all tabs)

| State | ARIA |
|-------|------|
| PROCESSING | `aria-busy="true"` on panel · polite announce `"Loading [tab name]."`  |
| STANDBY | `aria-label` on empty area |
| DEGRADED | `aria-live="polite"` banner |
| SYSTEM ALERT | `aria-live="assertive"` |

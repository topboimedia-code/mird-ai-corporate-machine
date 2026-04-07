# FLOW-04-RM-LEADS.md
# RainMachine — Lead Management States
# 8 screens | Step 7 Output | 2026-03-31

> Value tag: [TD↓] — Full lead context in slide-over; no page navigation needed

---

## Screen 04.1 — rm-leads-list

### PROCESSING
- **Trigger:** Page load / filter change
- **Visual:** 8 skeleton rows `h-[52px]` · shimmer
- **Copy:** `RETRIEVING LEAD DATA` (Orbitron, muted, above table)
- **ARIA:** `aria-busy="true"` on table

### ACTIVE
- **Visual:** Full table: Lead Name · Status badge · Platform badge · Agent · Date · Score · alternating `rgba(0,212,255,0.04)` rows · hover → `#0D1E35`
- **Interaction:** Row click → slide-over (04.2) · sort columns · filter bar
- **ARIA:** `role="grid"` · rows `role="row"` · status badges `aria-label`

### STANDBY — No leads
- **Visual:** `Radar` icon dim-pulse
- **Headline:** `NO ACTIVE LEADS IN SYSTEM` (Orbitron, `#7ECFDF`)
- **Body:** `Awaiting incoming signals from active campaigns.` (Inter)
- **CTA:** `VIEW CAMPAIGNS` primary
- **ARIA:** `aria-label` on empty area

### STANDBY — No results (search/filter)
- **Visual:** `Search` icon static
- **Headline:** `NO MATCHING RECORDS` (Orbitron, `#7ECFDF`)
- **Body:** `Adjust your search parameters or clear filters to see all records.` (Inter)
- **CTA:** `CLEAR FILTERS` primary · shows active filter summary above CTA
- **ARIA:** Focus → clear filters button

### SYSTEM ALERT
- **Headline:** `CONNECTION FAILED` (Orbitron, `#FF6B35`)
- **Body:** `Unable to retrieve lead data. Check your connection and try again.`
- **CTA:** `RETRY` primary
- **ARIA:** `aria-live="assertive"`

---

## Screen 04.2 — rm-leads-slideover

### PROCESSING
- **Trigger:** Row click
- **Visual:** Slide-over enters right (300ms spring) · skeleton content inside
- **Copy:** `LOADING LEAD PROFILE` (Orbitron, muted)
- **ARIA:** `role="dialog"` · `aria-label="Lead profile"` · `aria-busy="true"`

### ACTIVE
- **Visual:** Lead summary: name · contact · status badge · last activity · quick action buttons
- **Interaction:** Call/text CTAs · `VIEW FULL PROFILE` link · status dropdown
- **ARIA:** Focus trapped · initial focus on close button

### SYSTEM ALERT
- **Copy:** `LOAD FAILED` · `Could not load lead profile.` · `RETRY`
- **ARIA:** `aria-live="assertive"` inside dialog

---

## Screen 04.3 — rm-leads-profile

### PROCESSING
- **Trigger:** Navigation to `/leads/[id]`
- **Visual:** Full-page skeleton: header block + 3 column sections
- **Copy:** `LOADING LEAD PROFILE`
- **ARIA:** `aria-busy="true"`

### ACTIVE
- **Visual:** Full lead record: contact info · status history · campaign source · AI score · call log preview · appointment block
- **Interaction:** Status update dropdown · Call button · Edit fields
- **ARIA:** Heading hierarchy · all interactive elements labelled

### SYSTEM ALERT
- **Headline:** `LEAD NOT FOUND` / `CONNECTION FAILED`
- **CTA:** `BACK TO LEADS`
- **ARIA:** `aria-live="assertive"`

---

## Screen 04.4 — rm-leads-call-history

### PROCESSING
- **Visual:** Call history skeleton (shimmer rows)
- **ARIA:** `aria-busy="true"`

### ACTIVE
- **Visual:** Timestamped rows · duration · outcome badge · recording play button
- **ARIA:** `role="list"` · each call `role="listitem"` · play buttons `aria-label="Play call recording from [timestamp]"`

### STANDBY
- **Headline:** `NO CALLS LOGGED` (Orbitron, `#7ECFDF`)
- **Body:** `Call history will appear here after the first contact attempt.` (Inter)

### SYSTEM ALERT
- **Copy:** `CONNECTION FAILED` · `RETRY`

---

## Screen 04.5 — rm-leads-appointment

### ACTIVE (no appointment)
- **Visual:** Date/time picker + notes input
- **Heading:** `SCHEDULE APPOINTMENT`
- **ARIA:** Date/time inputs labelled

### ACTIVE (appointment set)
- **Visual:** Appointment card: date · time · `APPT SET` badge (green) · notes
- **Heading:** `APPOINTMENT SCHEDULED`
- **Interaction:** Edit · Cancel actions

### PROCESSING
- **Trigger:** Save click
- **Copy:** Button → `SAVING...`
- **ARIA:** `aria-live="polite"`

### CONFIRMED
- **Visual:** Toast: `LEAD UPDATED` · `Appointment saved.` · 3s auto-dismiss
- **ARIA:** `aria-live="polite"` toast

### SYSTEM ALERT (validation)
- **Copy:** `Date is required.` / `Time is required.`
- **ARIA:** `aria-describedby` · `aria-invalid="true"`

---

## Screens 04.6–04.8 — Additional Edges

| Screen | Maps To |
|--------|---------|
| 04.6 — rm-leads-empty-no-leads | STANDBY (no leads) in 04.1 |
| 04.7 — rm-leads-empty-no-results | STANDBY (no results) in 04.1 |
| 04.8 — Lead 404 | SYSTEM ALERT `LEAD NOT FOUND` in 04.3 |

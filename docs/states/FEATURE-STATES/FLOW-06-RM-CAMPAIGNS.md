# FLOW-06-RM-CAMPAIGNS.md
# RainMachine — Campaign Management States
# 5 screens | Step 7 Output | 2026-03-31

---

## Screen 06.1 — rm-campaigns-table

### PROCESSING
- **Visual:** Table skeleton rows `h-[52px]` · shimmer
- **Copy:** `LOADING CAMPAIGNS` (Orbitron, muted)
- **ARIA:** `aria-busy="true"`

### ACTIVE
- **Visual:** Campaign rows: name · platform badge (cyan=Meta, amber=Google) · status badge · spend · leads · CPL · sortable columns
- **Interaction:** Row click → accordion expand · platform filter
- **ARIA:** `role="grid"` · platform badges `aria-label="Source: [Platform]"`

### STANDBY (= Screen 06.4)
- **Visual:** `Zap` icon dim-pulse
- **Headline:** `NO ACTIVE CAMPAIGNS` (Orbitron, `#7ECFDF`)
- **Body:** `No campaigns are running. Connect your ad platforms in Settings to get started.` (Inter)
- **CTA:** `GO TO SETTINGS` primary
- **ARIA:** `aria-label` on empty area

### SYSTEM ALERT
- **Headline:** `CONNECTION FAILED` · `RETRY`
- **ARIA:** `aria-live="assertive"`

---

## Screen 06.2 — rm-campaigns-accordion-detail

### PROCESSING
- **Trigger:** Row expand click
- **Visual:** Accordion expands 250ms ease-out · skeleton inside
- **ARIA:** `aria-expanded="true"` on trigger · `aria-busy="true"` on panel

### ACTIVE
- **Visual:** Expanded panel: chart · metric breakdown · creative thumbnail · budget pacing bar
- **Interaction:** `VIEW CREATIVES` → modal (06.3) · `PAUSE` / `ACTIVATE` toggle
- **ARIA:** Panel `role="region"` with `aria-label`

### DEGRADED
- **Trigger:** Platform API partial failure
- **Visual:** Partial data shown · `#FFB800` warning icon on missing metrics
- **Copy:** `PLATFORM DATA UNAVAILABLE` · `[Platform] data could not be loaded.` · `RETRY` per-platform
- **ARIA:** `aria-live="polite"`

---

## Screen 06.3 — rm-campaigns-creative-modal

### PROCESSING
- **Trigger:** Modal open
- **Visual:** Backdrop fade 200ms · modal content skeleton
- **ARIA:** `role="dialog"` · `aria-busy="true"` · focus trap

### ACTIVE
- **Visual:** Creative cards: thumbnail · headline · body copy snippet · performance badge
- **Interaction:** Arrow nav between creatives
- **ARIA:** Focus on first creative · `aria-label` per card

### STANDBY
- **Headline:** `NO CREATIVES FOUND` (Orbitron, muted)
- **Body:** `Creative assets for this campaign are not available.` (Inter)
- **Interaction:** Close only

---

## Screen 06.4 — rm-campaigns-empty
Covered by STANDBY in 06.1.

---

## Screen 06.5 — rm-campaigns-platform-error

### DEGRADED (only state)
- **Visual:** Full-width orange-bordered alert banner above table · table renders with last cached data · staleness timestamp
- **Headline:** `PLATFORM DATA UNAVAILABLE` (Orbitron, `#FFB800`)
- **Body:** `Meta Ads data could not be loaded. Showing last known data from [timestamp].` (Inter)
- **CTA:** `RETRY` ghost
- **ARIA:** `aria-live="polite"` · banner `role="alert"`

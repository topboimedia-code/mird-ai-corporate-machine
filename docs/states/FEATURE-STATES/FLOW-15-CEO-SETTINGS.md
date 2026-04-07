# FLOW-15-CEO-SETTINGS.md
# CEO Dashboard — Settings States
# 3 screens | Step 7 Output | 2026-03-31

---

## Screen 15.1 — ceo-settings-hub

### PROCESSING
- **Visual:** Settings card skeletons
- **Copy:** `LOADING SETTINGS`
- **ARIA:** `aria-busy="true"`

### ACTIVE
- **Visual:** Setting category tiles: Alert Thresholds · Notification Prefs · Account · status badges per tile
- **Heading:** `COMMAND CENTER SETTINGS` (Orbitron)
- **Interaction:** Tile click → respective screen
- **ARIA:** `role="navigation"` on tile group

---

## Screen 15.2 — ceo-settings-alert-thresholds

### PROCESSING (load)
- **Visual:** Form skeleton
- **Copy:** `LOADING ALERT THRESHOLDS`
- **ARIA:** `aria-busy="true"`

### ACTIVE
- **Visual:** Threshold inputs per metric: CPL · lead volume · close rate · current/default values shown
- **Heading:** `ALERT THRESHOLDS` (Orbitron)
- **Body:** `Set the values that trigger critical alerts in your Command Center.` (Inter)
- **ARIA:** Inputs `type="number"` with `aria-label`

### SYSTEM ALERT (validation)
- **Copy:** `CPL Threshold must be a number greater than 0.` (and equivalent per field)
- **ARIA:** `aria-describedby` · `aria-invalid="true"`

### PROCESSING (save)
- **Copy:** Button → `SAVING...`
- **ARIA:** `aria-live="polite"`

### CONFIRMED
- **Toast:** `THRESHOLDS UPDATED` · 3s
- **ARIA:** `aria-live="polite"`

---

## Screen 15.3 — ceo-settings-notification-prefs
Same form/save/confirm pattern as RM Screen 08.5.
- **Heading:** `NOTIFICATION PREFERENCES`
- **Toast:** `PREFERENCES UPDATED` · 3s

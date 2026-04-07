# FLOW-08-RM-SETTINGS.md
# RainMachine — Settings States
# 9 screens | Step 7 Output | 2026-03-31

---

## Screen 08.1 — rm-settings-team

### PROCESSING
- **Visual:** Agent list skeleton
- **Copy:** `LOADING TEAM SETTINGS`
- **ARIA:** `aria-busy="true"`

### ACTIVE
- **Visual:** Agent table: name · email · status · routing weight · `ADD AGENT` primary button
- **Interaction:** Add → 08.2 modal · Edit row → 08.3 modal · Toggle active/inactive
- **ARIA:** `role="grid"`

### STANDBY
- **Headline:** `NO AGENTS CONFIGURED` · **Body:** `Add your first agent to begin routing.` · **CTA:** `ADD AGENT`

### CONFIRMED
- **Trigger:** Add/edit/delete complete
- **Visual:** Toast: `AGENT ADDED` / `AGENT UPDATED` / `AGENT REMOVED` · 3s
- **ARIA:** `aria-live="polite"`

---

## Screen 08.2 — rm-settings-add-agent-modal

### ACTIVE
- **Visual:** Modal: Name · email · phone · routing weight fields
- **Heading:** `ADD AGENT` (Orbitron)
- **ARIA:** `role="dialog"` · focus on first input · focus trap

### SYSTEM ALERT (validation)
- **Copy:** Field-level errors from voice library (Phase B)
- **ARIA:** `aria-describedby` · `aria-invalid="true"`

### PROCESSING
- **Copy:** Button → `SAVING...`
- **ARIA:** `aria-live="polite"`

### CONFIRMED
- **Trigger:** Saved
- **Visual:** Modal closes · toast fires
- **Copy:** `AGENT ADDED` · `[Name] is now active.` (3s toast)
- **ARIA:** `aria-live="polite"`

---

## Screen 08.3 — rm-settings-edit-agent-modal
Same state structure as 08.2 with pre-populated fields.
- **Success toast:** `AGENT UPDATED`

---

## Screen 08.4 — rm-settings-routing

### ACTIVE
- **Visual:** Routing method selector · agent weight sliders (if weighted)
- **Heading:** `LEAD ROUTING`
- **ARIA:** Sliders `role="slider"` · `aria-valuenow`

### PROCESSING
- **Copy:** Button → `SAVING...`

### CONFIRMED
- **Toast:** `SETTINGS UPDATED` · 3s

---

## Screen 08.5 — rm-settings-notifications
Same form/save/confirm pattern as Flow 02 Screen 02.4.

---

## Screen 08.6 — rm-settings-integrations

### ACTIVE
- **Visual:** Integration tiles: Meta Ads · Google Ads · GHL · status badge per tile (CONNECTED / DISCONNECTED / ERROR)
- **Heading:** `INTEGRATIONS`
- **ARIA:** Tiles `role="article"` with status `aria-label`

### PROCESSING
- **Trigger:** Connect/Reconnect click
- **Visual:** Tile → shimmer + `CONNECTING...`
- **ARIA:** `aria-live="polite"` per tile

### CONFIRMED
- **Visual:** Tile border → `rgba(0,255,136,0.40)` · `CheckCircle2` · `CONNECTED` badge
- **Toast:** `[PLATFORM] CONNECTED`
- **ARIA:** `aria-live="polite"`

### SYSTEM ALERT
- **Visual:** Tile border → `rgba(255,107,53,0.40)` · `AlertTriangle` · `ERROR` badge
- **Copy:** `[PLATFORM] CONNECTION FAILED` banner
- **CTA:** `RECONNECT` → 08.7
- **ARIA:** `aria-live="assertive"`

---

## Screens 08.7–08.8 — rm-settings-reconnect
Same as integration connect modal; states match 08.6 PROCESSING/CONFIRMED/SYSTEM ALERT.

---

## Screen 08.9 — rm-settings-account

### ACTIVE
- **Visual:** Profile fields: name · email · password change section · danger zone
- **Heading:** `ACCOUNT SETTINGS`
- **ARIA:** Sections `aria-labelledby`

### PROCESSING
- **Copy:** Section save button → `SAVING...`
- **ARIA:** `aria-live="polite"`

### CONFIRMED
- **Toast:** `SETTINGS UPDATED` · 3s

### SYSTEM ALERT (destructive confirm)
- **Trigger:** Delete account click
- **Visual:** Confirmation modal · warning icon · red border
- **Heading:** `CONFIRM ACCOUNT DELETION` (Orbitron, `#FF3333`)
- **Body:** `This action cannot be undone. All data will be permanently deleted.` (Inter)
- **CTAs:** `DELETE ACCOUNT` destructive · `CANCEL` ghost
- **ARIA:** `role="alertdialog"` · focus trap · initial focus on `CANCEL` · Esc = cancel

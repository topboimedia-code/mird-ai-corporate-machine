# FLOW-02-RM-ONBOARDING.md
# RainMachine — First-Time Onboarding States
# 5 screens | Step 7 Output | 2026-03-31

> Value tag: [TD↓] — First-time setup completes in ~3 minutes

---

## Screen 02.1 — rm-onboarding-welcome

**Purpose:** Orient new operator; set expectations for setup flow

### ACTIVE (only state)
- **Visual:** Scan-line entry · full-width card · step indicator (1 of 4)
- **Heading:** `WELCOME TO RAINMACHINE` (Orbitron, `display-xl`)
- **Body:** `Your lead routing system is ready to configure. This takes about 3 minutes.` (Inter)
- **CTAs:** `BEGIN SETUP` primary · `SKIP FOR NOW` ghost
- **ARIA:** `role="main"` · heading hierarchy set

---

## Screen 02.2 — rm-onboarding-team

**Purpose:** Configure business and team identity

### ACTIVE
- **Visual:** Form: business name + team name inputs · step indicator 2 of 4
- **Heading:** `TEAM CONFIGURATION` (Orbitron)
- **Labels:** `BUSINESS NAME` · `TEAM NAME` (Orbitron, `label`)

### SYSTEM ALERT (validation)
- **Trigger:** Submit with empty required fields
- **Copy:** `Business Name is required.` · `Team Name is required.` (Inter, `#FF7D52`)
- **ARIA:** `aria-describedby` per field · `aria-invalid="true"` per field

### PROCESSING
- **Trigger:** NEXT click after valid input
- **Copy:** Button → `SAVING...`
- **ARIA:** `aria-live="polite"` → `"Saving team configuration."`

### SUCCESS (auto-advance)
- Auto-advances to Step 3; no persistent success state

---

## Screen 02.3 — rm-onboarding-routing

**Purpose:** Configure lead distribution method

### ACTIVE
- **Visual:** Routing method toggle (Round Robin / Priority) · agent selector · step indicator 3 of 4
- **Heading:** `LEAD ROUTING` (Orbitron)
- **Body:** `Choose how incoming leads are distributed to your agents.` (Inter, muted)
- **Interaction:** Toggle: color swap 200ms + label update
- **ARIA:** Toggle `role="radiogroup"` with `aria-checked`

### STANDBY (no agents)
- **Trigger:** No agents configured yet
- **Visual:** Agent list empty · `Radar` icon dim-pulse
- **Headline:** `NO AGENTS CONFIGURED` (Orbitron, `#7ECFDF`)
- **Body:** `Add agents in Settings to enable routing.` (Inter)
- **CTA:** `SKIP FOR NOW` ghost · routing saves default (round robin)
- **ARIA:** `aria-label` on empty area

### PROCESSING
- **Trigger:** NEXT click
- **Copy:** Button → `SAVING...`
- **ARIA:** `aria-live="polite"`

---

## Screen 02.4 — rm-onboarding-notifications

**Purpose:** Set how team receives lead alerts

### ACTIVE
- **Visual:** Toggle list: New Lead · Appointment Set · Status Change · email/SMS inputs · step indicator 4 of 4
- **Heading:** `NOTIFICATION PREFERENCES` (Orbitron)
- **Body:** `Set how your team gets alerted for key events.` (Inter)
- **ARIA:** Each toggle `aria-label`

### SYSTEM ALERT (validation)
- **Copy:** `Phone must be a valid US number.` · `Email must be a valid email address.`
- **ARIA:** `aria-describedby` · `aria-invalid="true"`

### PROCESSING
- **Trigger:** FINISH SETUP click
- **Copy:** Button → `SAVING...`
- **ARIA:** `aria-live="polite"`

---

## Screen 02.5 — rm-onboarding-complete

**Purpose:** Confirm setup is done; send to dashboard

### CONFIRMED (only state)
- **Visual:** `CheckCircle2` `48px` `#00FF88` · spring bounce entry · `rgba(0,255,136,0.40)` border · scan-line sweep out
- **Headline:** `SETUP COMPLETE` (Orbitron, `#00FF88`)
- **Body:** `RainMachine is configured. Your dashboard is ready.` (Inter)
- **CTA:** `GO TO DASHBOARD` primary
- **ARIA:** `aria-live="polite"` → `"Setup complete."` · focus on CTA

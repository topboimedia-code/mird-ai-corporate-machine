# FLOW-23-OB-COMPLETION.md
# Onboarding Portal — Completion States
# 3 screens | Step 7 Output | 2026-03-31

---

## Screen 23.1 — ob-completion-initializing

**Purpose:** Provision RainMachine system after wizard complete
**Trigger:** Step 5 COMPLETE SETUP submit success

### INITIALIZING (only state)
- **Visual:** Full-screen · scan-line pulse · deterministic progress bar with named step labels below
- **Heading:** `INITIALIZING RAINMACHINE` (Orbitron, `display-xl`)
- **Step labels (animate through sequentially):**
  1. `PROVISIONING SYSTEM`
  2. `CONFIGURING ROUTING`
  3. `ACTIVATING CAMPAIGNS`
  4. `SYSTEM ONLINE`
- **Step label styles:** Active = `#00D4FF` · Completed = `#00FF88` + `CheckCircle` micro-icon · Upcoming = `#2A4A5A`
- **Duration estimate:** `~60 seconds` (Inter, `#7ECFDF`) below progress bar
- **Interaction:** None — fully automated; no cancel
- **ARIA:**
  - `role="progressbar"` · `aria-valuenow` · `aria-valuemin="0"` · `aria-valuemax="100"` · `aria-label="System initialization progress"`
  - `aria-live="polite"` announces each step label as it activates
  - Milestones at 25/50/75/100% announced

---

## Screen 23.2 — ob-completion-next-steps

**Purpose:** Celebrate completion; orient operator to next actions
**Trigger:** Initialization completes (Screen 23.1 reaches 100%)

### CONFIRMED (only state)
- **Visual:** Full-screen · `CheckCircle2` `64px` `#00FF88` spring bounces in (`{stiffness:400, damping:15}`) · `rgba(0,255,136,0.40)` border on card · 3 "what happens next" informational cards below
- **Heading:** `SYSTEM INITIALIZED` (Orbitron, `display-xl`, `#00FF88`)
- **Body:** `RainMachine is now active. Your team will begin receiving leads shortly.` (Inter)
- **What Happens Next cards:**
  1. `YOUR TEAM WILL RECEIVE LEADS` — agent routing is live
  2. `CAMPAIGNS ARE SYNCING` — ad platform data flowing in
  3. `YOUR DASHBOARD IS READY` — check RainMachine anytime
- **CTA:** `GO TO DASHBOARD` primary → `app.makeitrain.digital/dashboard`
- **ARIA:** `aria-live="polite"` → `"System initialized. RainMachine is now active."` · focus on CTA

---

## Screen 23.3 — ob-completion-already-complete

**Purpose:** Handle returning to wizard after setup is already done
**Trigger:** Token with completed onboarding flag detected

### ACTIVE (only state)
- **Visual:** Informational card · cyan border (not error) · `CheckCircle2` `#00D4FF`
- **Headline:** `SETUP ALREADY COMPLETE` (Orbitron, `#00D4FF`)
- **Body:** `Your RainMachine system has already been initialized.` (Inter)
- **CTA:** `GO TO DASHBOARD` primary
- **ARIA:** `role="main"` · `aria-live="polite"` announces on load

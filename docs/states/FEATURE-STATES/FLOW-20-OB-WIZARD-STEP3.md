# FLOW-20-OB-WIZARD-STEP3.md
# Onboarding Portal — Wizard Step 3: Meta Ads Connection
# 6 screens | Step 7 Output | 2026-03-31

> Value tag: [TD↓] — Token paste → verified in < 5 seconds vs. OAuth redirect loop

---

## Screen 20.1 — ob-wizard-step3-main (Meta Token Input)

**Step indicator:** Step 3 of 5 active

### ACTIVE
- **Visual:** Token input field (monospace) · help icon · step indicator 3 of 5
- **Heading:** `META ADS CONNECTION` (Orbitron, `heading-1`)
- **Body:** `Paste your Meta Business API token below.` (Inter)
- **CTAs:** `CONNECT` primary · `SAVE & CONTINUE LATER` ghost
- **ARIA:** Input `aria-label="Meta Business API token"`

### SYSTEM ALERT (inline validation)
- **Copy:** `Meta token is required.` / `Meta token format is invalid.`
- **ARIA:** `aria-describedby` · `aria-invalid="true"`

---

## Screen 20.2 — ob-wizard-step3-verifying

**Trigger:** CONNECT click with token entered

### PROCESSING (only state)
- **Visual:** Token input area replaced by verification display · indeterminate shimmer bar
- **Sequential labels stagger (600ms apart):**
  1. `CONNECTING TO META` (Orbitron, `#7ECFDF`)
  2. `VERIFYING TOKEN` (Orbitron, `#7ECFDF`)
  3. `CHECKING PERMISSIONS` (Orbitron, `#7ECFDF`)
- **Interaction:** `CANCEL` link below bar
- **ARIA:** `aria-live="polite"` announces each label · `role="progressbar"` on bar (indeterminate)

---

## Screen 20.3 — ob-wizard-step3-connected

**Trigger:** Verification success

### CONFIRMED (only state)
- **Visual:** Compact success panel replaces token input · `CheckCircle2` `32px` `#00FF88` bounces in (spring `{stiffness:400, damping:15}`) · `rgba(0,255,136,0.40)` border
- **Headline:** `META CONNECTED` (Orbitron, `#00FF88`)
- **Body:** `Connection verified. Ready to sync.` (Inter)
- **CTA:** `CONTINUE` primary → step 4
- **ARIA:** `aria-live="polite"` → `"Meta connected. Connection verified."` · focus on CONTINUE

---

## Screen 20.4 — ob-wizard-step3-error

**Trigger:** Verification failure (bad token, permissions error, API timeout)

### SYSTEM ALERT (only state)
- **Visual:** Alert banner · token input re-enabled · input field shake once
- **Headline:** `META CONNECTION FAILED` (Orbitron, `#FF6B35`)
- **Body:** `Could not verify your Meta Business token. Check the token and try again.` (Inter)
- **CTAs:** `TRY AGAIN` primary · `GET HELP` ghost → 20.5
- **ARIA:** `aria-live="assertive"` · focus → banner

---

## Screen 20.5 — ob-wizard-step3-help

**Trigger:** Help icon click / GET HELP button

### ACTIVE (only state)
- **Visual:** Expandable help section (drawer or in-page expansion) · numbered steps with instructions · video link
- **Heading:** `HOW TO GET YOUR META TOKEN` (Orbitron)
- **Body:** Step-by-step instructions (Inter) · video link opens new tab
- **ARIA:** `aria-expanded` on trigger · section `role="region"` · `aria-label`

---

## Screen 20.6 — ob-wizard-step3-save-later

**Trigger:** SAVE & CONTINUE LATER click

### PROCESSING → CONFIRMED → ACTIVE (save then partial state)
- **Processing:** Button → `SAVING...`
- **Confirmed:** Toast: `PROGRESS SAVED` · `Step saved. Return to your setup link to complete this step.` · 5s
- **Active (post-save):** Step 3 indicator shows incomplete (hollow dot, not red error) · wizard can close
- **ARIA:** `aria-live="polite"` · progress indicator `aria-label="Step 3 of 5, saved but incomplete"`

# FLOW-19-OB-WIZARD-STEP2.md
# Onboarding Portal — Wizard Step 2: Mission Parameters
# 4 screens | Step 7 Output | 2026-03-31

---

## Screen 19.1 — ob-wizard-step2-main

**Purpose:** Capture business targets and campaign parameters
**Step indicator:** Step 2 of 5 active

### ACTIVE
- **Visual:** Form: service area · target audience · monthly ad budget (range slider) · primary goal (select) · step indicator 2 of 5
- **Heading:** `MISSION PARAMETERS` (Orbitron, `heading-1`)
- **Body:** `Tell us about your business targets.` (Inter)
- **ARIA:** Range slider `role="slider"` with `aria-valuenow` · all inputs labelled

### SYSTEM ALERT (= Screen 19.2)
- **Trigger:** Form submit with invalid/empty fields
- **Visual:** Alert banner above form + inline errors per field
- **Banner:** `SETUP INCOMPLETE` (Orbitron, `#FF6B35`) · `Complete all required fields before continuing.`
- **Copy:** Field errors from Phase B library
- **ARIA:** `aria-live="assertive"` → `"[N] error(s) found. [First error]."` · `aria-invalid="true"` per field

### PROCESSING (= Screen 19.3)
- **Trigger:** NEXT click with valid fields
- **Copy:** Button → `SAVING PROGRESS`
- **Visual:** Button width locked · `Loader2` spin
- **ARIA:** `aria-live="polite"` → `"Saving. Please wait."`

### CONFIRMED (auto-advance)
- **Trigger:** Save successful
- **Visual:** Brief `PROGRESS SAVED` toast · then step transition animation → step 3
- **ARIA:** `aria-live="polite"` → `"Progress saved. Loading step 3 of 5."`

---

## Screen 19.4 — ob-wizard-step2-save-failed

**Trigger:** Network failure during save

### SYSTEM ALERT (only new state here)
- **Visual:** Alert banner above form · form data preserved (not cleared)
- **Headline:** `SAVE FAILED` (Orbitron, `#FF6B35`)
- **Body:** `Your progress could not be saved. Check your connection and try again.` (Inter)
- **CTA:** `RETRY` primary
- **ARIA:** `aria-live="assertive"` · focus → banner

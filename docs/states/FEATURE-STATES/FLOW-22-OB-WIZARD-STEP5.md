# FLOW-22-OB-WIZARD-STEP5.md
# Onboarding Portal — Wizard Step 5: Launch Configuration
# 4 screens | Step 7 Output | 2026-03-31

---

## Screen 22.1 — ob-wizard-step5-main (File Uploads + Launch Config)

**Purpose:** Upload brand assets · set launch date · configure notifications
**Step indicator:** Step 5 of 5 active

### ACTIVE
- **Visual:** Three upload zones (logo · creative assets · brand guidelines) · launch date picker · notification toggles
- **Heading:** `LAUNCH CONFIGURATION` (Orbitron, `heading-1`)
- **Upload zone labels:** `LOGO` · `CREATIVE ASSETS` · `BRAND GUIDELINES` (Orbitron, `label`)
- **CTA:** `COMPLETE SETUP` primary
- **ARIA:** Upload zones `role="button"` `tabindex="0"` · `aria-label="Upload [type]. Press Enter or Space to browse, or drag and drop."`

---

## Screen 22.2 — ob-wizard-step5-uploading (PROCESSING state)

**Trigger:** File drop or file picker selection

### PROCESSING (per upload zone)
- **Visual:** Upload zone: progress bar (deterministic %) · filename label · `UPLOADING FILES` label
- **Copy:** `[N]% complete` updating live
- **Interaction:** Cancel upload per file (X on zone)
- **ARIA:** `aria-busy="true"` on zone · `aria-live="polite"` announces at 25/50/75/100% · `role="progressbar"` with `aria-valuenow`

### CONFIRMED (per upload zone)
- **Trigger:** Upload complete
- **Visual:** Zone → `CheckCircle2` `#00FF88` + filename + green border
- **Copy:** Inline: `[N] file(s) uploaded successfully.`
- **Interaction:** Remove / replace available
- **ARIA:** `aria-live="polite"` → `"[Filename] uploaded successfully."`

---

## Screen 22.3 — ob-wizard-step5-upload-error (SYSTEM ALERT state)

**Trigger:** Upload network failure or file size/type rejection

### SYSTEM ALERT (per upload zone)
- **Visual:** Zone → red border + `AlertTriangle` icon
- **Headline:** `UPLOAD FAILED` (Orbitron, `#FF6B35`, inline on zone)
- **Body:** `[filename] could not be uploaded. File must be under [limit]. Try a smaller file.` (Inter)
- **CTA:** `RETRY UPLOAD` inline button
- **ARIA:** `aria-live="assertive"` → `"Upload failed for [filename]. [Reason]."` · focus → retry button

---

## Screen 22.4 — ob-wizard-step5-validation-error (SYSTEM ALERT on submit)

**Trigger:** COMPLETE SETUP clicked with required fields/uploads missing

### SYSTEM ALERT (form level)
- **Visual:** Alert banner above form + inline errors on missing zones/fields
- **Headline:** `SETUP INCOMPLETE` (Orbitron, `#FF6B35`)
- **Body:** `Complete all required fields and uploads before finishing.` (Inter)
- **ARIA:** `aria-live="assertive"` → `"[N] error(s) found. [First error]."` · focus → first error

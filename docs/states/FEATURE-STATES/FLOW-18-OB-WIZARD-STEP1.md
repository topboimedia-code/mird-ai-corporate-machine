# FLOW-18-OB-WIZARD-STEP1.md
# Onboarding Portal — Wizard Step 1: System Initialization
# 3 screens | Step 7 Output | 2026-03-31

> Wizard shell: `max-width: 720px` centered · `padding: 48px` · 5-step horizontal indicator · no sidebar

---

## Screen 18.1 — ob-wizard-step1-main

**Purpose:** Confirm operator/business identity; begin initialization
**Step indicator:** Step 1 of 5 active

### INITIALIZING
- **Trigger:** Step 1 page load
- **Visual:** Scan-line sweep on card (400ms) · step indicator animates in
- **Copy:** `SYSTEM INITIALIZATION` (Orbitron, `heading-1`) · `WELCOME, [BUSINESS NAME]` (Orbitron, `heading-2`, `#00D4FF`)
- **ARIA:** `aria-live="polite"` → `"Step 1 of 5. System initialization."` · `"System initializing."`

### ACTIVE
- **Trigger:** After scan-line completes
- **Visual:** Company details form: business name · contact name · phone · email
- **Body:** `Confirm your details below to begin setup.` (Inter)
- **CTA:** `CONFIRM DETAILS` primary
- **ARIA:** Standard form labelling

### SYSTEM ALERT (validation)
- **Trigger:** Submit with empty or invalid fields
- **Copy:** Field-level errors (Phase B library)
- **ARIA:** `aria-describedby` · `aria-invalid="true"` · `aria-live="assertive"` → `"[N] error(s) found."`

### PROCESSING
- **Trigger:** CONFIRM DETAILS click with valid fields
- **Copy:** Button → `SAVING...`
- **ARIA:** `aria-live="polite"` → `"Saving. Please wait."`

---

## Screen 18.2 — ob-wizard-step1-wrong-details

**Trigger:** User clicks "Wrong details?" link

### ACTIVE (only state)
- **Visual:** Expanded contact info section or card update
- **Headline:** `NOT YOUR DETAILS?` (Orbitron, `#FFB800`)
- **Body:** `If the information shown is incorrect, contact your account manager before continuing.` (Inter)
- **CTAs:** `CONTACT SUPPORT` primary → Flow 24 · `BACK` ghost
- **ARIA:** `aria-live="polite"` on expansion

---

## Screen 18.3 — ob-wizard-step1-progress-restored

**Trigger:** Token with existing prior progress detected on load

### ACTIVE (banner only — overlays 18.1)
- **Visual:** `PROGRESS RESTORED` banner (Orbitron, `#00FF88`, green left-border) at top of wizard card · auto-dismisses 5s
- **Body:** `Welcome back. Your previous progress has been loaded.` (Inter)
- **Interaction:** Auto-dismiss; user can skip to last completed step
- **ARIA:** `aria-live="polite"` → `"Progress restored. Your previous progress has been loaded."`

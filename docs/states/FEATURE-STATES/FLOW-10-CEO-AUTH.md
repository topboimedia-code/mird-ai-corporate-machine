# FLOW-10-CEO-AUTH.md
# CEO Dashboard — Authentication States
# 4 screens | Step 7 Output | 2026-03-31

> Value tag: [ES↓] — 6-digit OTP only; no app install required

---

## Screen 10.1 — ceo-auth-login

Same state structure as rm-auth-login (01.1). CEO-specific overrides:

- **Layout:** Full-width no-sidebar · `max-width: 480px` centered card
- **Heading:** `CEO COMMAND ACCESS` (Orbitron, display-xl)
- **On success:** → `/command-center`

States: ACTIVE · PROCESSING · SYSTEM ALERT · SUCCESS
→ See FLOW-01-RM-AUTH.md for full specs; apply copy overrides above.

---

## Screen 10.2 — ceo-auth-2fa

**Purpose:** 6-digit OTP verification after password entry

### ACTIVE
- **Visual:** 6-digit OTP input (monospace, large) · 60s countdown timer · `VERIFY` button · `Resend Code` ghost (active after 60s)
- **Heading:** `TWO-FACTOR AUTHENTICATION` (Orbitron)
- **Body:** `Enter the 6-digit code from your authenticator app.` (Inter)
- **Interaction:** Auto-submit on 6th digit · paste detection
- **ARIA:** Input `aria-label="One-time password, 6 digits"` · countdown `aria-live="polite"`

### PROCESSING
- **Trigger:** VERIFY click / auto-submit
- **Copy:** Button → `VERIFYING CREDENTIALS`
- **ARIA:** `aria-live="polite"` → `"Verifying credentials."`

### SYSTEM ALERT
- **Trigger:** Wrong OTP
- **Visual:** Input shake · border red
- **Headline:** `VERIFICATION FAILED` (Orbitron, `#FF6B35`)
- **Body:** `The code you entered is incorrect. Check your authenticator app.` (Inter)
- **ARIA:** `aria-live="assertive"` · re-focus input

### SUCCESS
- **Trigger:** OTP correct
- **Visual:** Scan-line sweep → redirect
- **ARIA:** `aria-live="polite"` → `"Verification successful. Loading command center."`

---

## Screen 10.3 — ceo-auth-login-error
Covered by SYSTEM ALERT in 10.1.

---

## Screen 10.4 — ceo-auth-session-expired

### SYSTEM ALERT (only state)
- **Visual:** Full-page overlay · `Lock` icon `#FF3333` · `rgba(255,51,51,0.40)` border
- **Headline:** `CEO SESSION EXPIRED` (Orbitron, `#FF6B35`)
- **Body:** `Command Center access has timed out. Log in again to continue.` (Inter)
- **CTA:** `LOG IN` primary
- **ARIA:** `aria-live="assertive"` · focus trap · initial focus on `LOG IN`

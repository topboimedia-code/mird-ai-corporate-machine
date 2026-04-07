# FLOW-01-RM-AUTH.md
# RainMachine — Authentication States
# 7 screens | Step 7 Output | 2026-03-31

> Token reference: UNIVERSAL-STATES.md | Voice: ACCESSIBILITY-STATES.md F.4

---

## Screen 01.1 — rm-auth-login

**Purpose:** Primary auth entry for RM operators
**Entry:** Direct `/login` · session expiry redirect
**Exit:** `/dashboard` (success) · `/forgot-password` · error (retry)

### ACTIVE (default)
- **Visual:** `#050D1A` bg · `#0A1628` card · scan-line entry 400ms · cyan input borders
- **Heading:** `OPERATOR LOGIN` (Orbitron)
- **Fields:** `Email` · `Password` (JARVIS input style)
- **CTA:** `LOG IN` primary button
- **Interaction:** Focus → border `rgba(0,212,255,0.40)` + glow · button scale 0.98 on press
- **ARIA:** `role="main"` · inputs `aria-label` · form `aria-describedby`

### PROCESSING
- **Trigger:** LOG IN click
- **Visual:** Button width locked · `Loader2` spin replaces label · inputs disabled
- **Copy:** Button → `VERIFYING CREDENTIALS` (Orbitron, muted)
- **ARIA:** `aria-live="polite"` → `"Verifying credentials."` · button `aria-disabled="true"`

### SYSTEM ALERT
- **Trigger:** Wrong credentials / server error
- **Visual:** Card border → `rgba(255,107,53,0.40)` · alert banner slides in below heading 200ms · inputs shake `x:[0,-8,8,-8,8,0]` 300ms · button resets
- **Headline:** `AUTHENTICATION FAILED` (Orbitron, `#FF6B35`)
- **Body:** `The credentials you entered are incorrect. Try again.` (Inter)
- **ARIA:** `aria-live="assertive"` · focus → banner · password field re-focused

### SUCCESS (auto-transition)
- **Trigger:** Valid credentials
- **Visual:** Scan-line sweep 300ms → redirect (no persistent state)
- **ARIA:** `aria-live="polite"` → `"Login successful. Loading dashboard."`

---

## Screen 01.2 — rm-auth-forgot-password

**Purpose:** Initiate email-based password reset

### ACTIVE
- **Visual:** Same card · single email input
- **Heading:** `FORGOT PASSWORD` (Orbitron)
- **Body:** `Enter your operator email address.` (Inter)
- **CTA:** `SEND RESET LINK` primary · `BACK TO LOGIN` ghost

### PROCESSING
- **Trigger:** Button click
- **Copy:** Button → `SENDING...`
- **ARIA:** `aria-live="polite"` → `"Sending reset link."`

### SYSTEM ALERT (invalid email)
- **Visual:** Inline error below input · red border
- **Copy:** `Email must be a valid email address.` (Inter, `#FF7D52`)
- **ARIA:** `aria-describedby` → error id · `aria-invalid="true"`

### SUCCESS
- **Trigger:** Valid email submitted
- **Visual:** Card swaps to confirmation panel (fade 200ms) · `CheckCircle2` `#00FF88`
- **Headline:** `RESET LINK SENT` (Orbitron, `#00FF88`)
- **Body:** `Check your email for a password reset link.` (Inter)
- **CTA:** `BACK TO LOGIN` ghost
- **ARIA:** `aria-live="polite"` announces success

---

## Screen 01.3 — rm-auth-reset-password

**Purpose:** Set new password via reset token link
**Entry:** `/reset-password?token=[uuid]`

### PROCESSING (token validation)
- **Trigger:** Page load
- **Visual:** Skeleton card shimmer
- **Copy:** `VERIFYING RESET TOKEN` (Orbitron, muted)
- **ARIA:** `aria-live="polite"` → `"Verifying reset token."`

### ACTIVE (token valid)
- **Visual:** New password + confirm password inputs
- **Copy:** `RESET PASSWORD` heading · `Password must be at least 8 characters.` hint (Inter, muted)
- **CTA:** `UPDATE PASSWORD` primary

### SYSTEM ALERT — Token invalid
- **Visual:** Full card error · `AlertTriangle` icon
- **Headline:** `RESET LINK EXPIRED` (Orbitron, `#FF6B35`)
- **Body:** `This reset link is no longer valid. Request a new one.` (Inter)
- **CTA:** `REQUEST NEW LINK` primary
- **ARIA:** `aria-live="assertive"`

### SYSTEM ALERT — Mismatch
- **Visual:** Inline error on Confirm field
- **Copy:** `Passwords do not match.` (Inter, `#FF7D52`)
- **ARIA:** `aria-describedby` error

### SUCCESS
- **Visual:** Card → confirmation · `CheckCircle2`
- **Headline:** `PASSWORD UPDATED` (Orbitron, `#00FF88`)
- **Body:** `Your password has been changed. Log in with your new credentials.` (Inter)
- **CTA:** `LOG IN` primary
- **ARIA:** `aria-live="polite"`

---

## Screen 01.4 — rm-auth-session-expired

**Purpose:** Inform operator session has lapsed
**Entry:** Token expiry on any authenticated route

### SYSTEM ALERT (only state)
- **Visual:** Full-page overlay `rgba(5,13,26,0.95)` · `Lock` icon `#FF3333` · centered card · `rgba(255,51,51,0.40)` border
- **Headline:** `SESSION EXPIRED` (Orbitron, `#FF6B35`)
- **Body:** `Your session has timed out. Log in again to continue.` (Inter)
- **CTA:** `LOG IN` primary
- **ARIA:** `aria-live="assertive"` · focus trap in card · initial focus on `LOG IN`

---

## Screens 01.5–01.7 — Auth Edge States

Additional token expiry, forced logout, and admin-revoked access states all use the `rm-auth-session-expired` pattern with context-adjusted copy.

| Scenario | Headline | Body |
|---------|---------|------|
| Token expired on reset | `RESET LINK EXPIRED` | `This reset link is no longer valid.` |
| Admin revoked access | `ACCESS REVOKED` | `Your account access has been removed. Contact your admin.` |
| Forced logout | `SESSION ENDED` | `You have been logged out. Log in to continue.` |

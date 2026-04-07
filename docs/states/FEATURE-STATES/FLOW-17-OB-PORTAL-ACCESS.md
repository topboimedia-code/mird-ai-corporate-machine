# FLOW-17-OB-PORTAL-ACCESS.md
# Onboarding Portal — Portal Access States
# 3 screens | Step 7 Output | 2026-03-31

> Entry point for entire onboarding wizard. Token-based; no traditional auth.

---

## Screen 17.1 — ob-access-token-validating

**Entry:** URL load with `?token=[uuid]`

### PROCESSING (entry state)
- **Visual:** Full-screen centered · sequential label stagger (600ms apart):
  1. `VALIDATING TOKEN` (Orbitron, `#7ECFDF`) — fades in
  2. `VERIFYING ACCESS` (Orbitron, `#7ECFDF`) — fades in 600ms later
  3. `LOADING SYSTEM` (Orbitron, `#7ECFDF`) — fades in 600ms later
- **Below labels:** Indeterminate shimmer progress bar `#00D4FF`
- **Interaction:** None — auto-advances on success
- **ARIA:** `aria-live="polite"` announces each label as it appears (50ms delay injection rule)

### SUCCESS (auto-transition)
- **Trigger:** Token valid
- **Visual:** Final label → `✓ ACCESS GRANTED` (`#00FF88`) · 600ms pause · transition to wizard step 1
- **ARIA:** `aria-live="polite"` → `"Access granted. Loading setup."`

---

## Screen 17.2 — ob-access-token-invalid

**Trigger:** Token validation fails (expired, tampered, already used)

### SYSTEM ALERT (only state)
- **Visual:** Full-screen · `Lock` icon `#FF3333` · `rgba(255,51,51,0.40)` border · centered card
- **Headline:** `ACCESS DENIED` (Orbitron, `#FF6B35`)
- **Body:** `This setup link is invalid or has expired. Contact your account manager to get a new link.` (Inter)
- **CTA:** `CONTACT SUPPORT` primary → Flow 24
- **ARIA:** `role="main"` · `aria-live="assertive"` · focus on CTA

---

## Screen 17.3 — ob-access-mobile-suggestion

**Trigger:** Mobile viewport detected (`< 768px`) on wizard entry

### ACTIVE (only state)
- **Visual:** Warning banner pattern · `#FFB800` border · optional desktop illustration
- **Headline:** `DESKTOP RECOMMENDED` (Orbitron, `#FFB800`)
- **Body:** `This setup wizard is designed for desktop use. You can continue on mobile, but some steps may require scrolling.` (Inter)
- **CTAs:** `CONTINUE ON MOBILE` primary · `CONTACT SUPPORT` ghost
- **ARIA:** `role="banner"` for suggestion · appropriate `aria-label`

> After any CTA click: this screen dismisses and wizard proceeds to token validation (17.1) or support (24.1).

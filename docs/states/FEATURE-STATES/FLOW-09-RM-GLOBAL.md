# FLOW-09-RM-GLOBAL.md
# RainMachine — Global Error & System States
# 3 screens | Step 7 Output | 2026-03-31

---

## Screen 09.1 — rm-global-404

### SYSTEM ALERT (only state)
- **Visual:** Full-page · `404` in `metric-xl` Share Tech Mono `#00D4FF` · `Construction` icon
- **Headline:** `SECTOR NOT FOUND` (Orbitron, `display-xl`)
- **Body:** `The page you're looking for doesn't exist or has moved.` (Inter)
- **CTA:** `RETURN TO DASHBOARD` primary
- **ARIA:** `role="main"` · `aria-live="assertive"`

---

## Screen 09.2 — rm-global-500

### SYSTEM ALERT + auto-retry (only state)
- **Visual:** `500` in `metric-xl` `#00D4FF` · `AlertTriangle` icon · countdown timer showing auto-retry seconds
- **Headline:** `SYSTEM ERROR` (Orbitron)
- **Body:** `A server error occurred. Our team has been notified. Retrying in [N]s.` (Inter)
- **CTAs:** `RETRY NOW` primary · `RETURN TO DASHBOARD` ghost
- **Auto-retry:** 15s countdown then auto-triggers
- **ARIA:** `aria-live="polite"` countdown updates every 5s

---

## Screen 09.3 — rm-global-maintenance

### MAINTENANCE (only state)
- **Visual:** Full-page · `Construction` icon dim-pulsing `#7ECFDF` · no retry button
- **Headline:** `SYSTEM MAINTENANCE` (Orbitron, `#7ECFDF`)
- **Body:** `RainMachine is undergoing scheduled maintenance. [ETA if known, else: "We'll be back shortly."]` (Inter)
- **Interaction:** None — read-only state; no user actions
- **ARIA:** `role="main"` · status announced once on load

# FLOW-16-CEO-GLOBAL.md
# CEO Dashboard — Global Error State
# 1 screen | Step 7 Output | 2026-03-31

---

## Screen 16.1 — ceo-global-404

### SYSTEM ALERT (only state)
- **Visual:** `404` in `metric-xl` Share Tech Mono `#00D4FF` · `ShieldOff` icon · full-page
- **Headline:** `SECTOR NOT FOUND` (Orbitron, `display-xl`)
- **Body:** `This sector of the command center does not exist.` (Inter)
- **CTA:** `RETURN TO COMMAND CENTER` primary → `/command-center`
- **ARIA:** `role="main"` · `aria-live="assertive"` on load

> Note: CEO Dashboard does not have a maintenance screen (Flow 09 covers RM only).
> CEO errors beyond 404 are handled by the command center SYSTEM ALERT state (Flow 11).

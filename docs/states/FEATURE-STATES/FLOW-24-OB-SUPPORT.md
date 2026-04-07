# FLOW-24-OB-SUPPORT.md
# Onboarding Portal — Support States
# 2 screens | Step 7 Output | 2026-03-31

---

## Screen 24.1 — ob-support-contact-modal

**Purpose:** Allow operator to reach MIRD support during setup
**Entry:** Any `CONTACT SUPPORT` CTA in the wizard (Flows 17–23)

### ACTIVE
- **Visual:** Modal · subject select + message textarea + pre-filled email
- **Heading:** `CONTACT SUPPORT` (Orbitron)
- **Body:** `Describe your issue and we'll respond within 1 business day.` (Inter)
- **CTAs:** `SEND MESSAGE` primary · `CANCEL` ghost
- **ARIA:** `role="dialog"` · `aria-labelledby` heading · focus trap · initial focus on subject select

### SYSTEM ALERT (validation)
- **Copy:** `Message is required.` (Inter, `#FF7D52`)
- **ARIA:** `aria-describedby` · `aria-invalid="true"`

### PROCESSING
- **Trigger:** SEND MESSAGE click
- **Copy:** Button → `SENDING...`
- **ARIA:** `aria-live="polite"` → `"Sending message. Please wait."`

### CONFIRMED
- **Trigger:** Message sent
- **Visual:** Modal content → success state · `CheckCircle2` `#00FF88`
- **Headline:** `MESSAGE SENT` (Orbitron, `#00FF88`)
- **Body:** `We'll get back to you within 1 business day.` (Inter)
- **CTA:** `CLOSE` ghost
- **ARIA:** `aria-live="polite"` → `"Message sent."` · focus on CLOSE

---

## Screen 24.2 — ob-support-walkthrough

**Purpose:** Self-service help — video walkthrough and FAQ

### ACTIVE (only state)
- **Visual:** Two sections:
  - Section A: `VIDEO WALKTHROUGH` — embedded video player
  - Section B: `FREQUENTLY ASKED QUESTIONS` — accordion FAQ
- **Heading:** `SETUP GUIDE` (Orbitron, `heading-1`)
- **ARIA:**
  - Video `aria-label="Onboarding setup video walkthrough"`
  - Accordion triggers: `role="button"` `aria-expanded="false|true"` `aria-controls="[panel-id]"`
  - Accordion panels: `role="region"` `aria-labelledby="[trigger-id]"`
  - `Enter` / `Space` toggles each FAQ item

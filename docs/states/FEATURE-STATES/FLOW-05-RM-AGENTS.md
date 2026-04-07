# FLOW-05-RM-AGENTS.md
# RainMachine — Agent Management States
# 5 screens | Step 7 Output | 2026-03-31

---

## Screen 05.1 — rm-agents-overview

### PROCESSING
- **Visual:** Agent card skeletons `h-[140px]` · shimmer
- **Copy:** `LOADING AGENTS` (Orbitron, muted)
- **ARIA:** `aria-busy="true"`

### ACTIVE
- **Visual:** Agent cards: name · avatar placeholder · status dot (green/orange/red · breathing) · lead count · acceptance rate
- **Interaction:** Card click → 05.3 detail
- **ARIA:** Cards `role="article"` · `aria-label="[Name], [status]"`

### STANDBY (= Screen 05.5)
- **Visual:** `Users` icon dim-pulse
- **Headline:** `NO AGENTS CONFIGURED` (Orbitron, `#7ECFDF`)
- **Body:** `Add your first agent to begin routing incoming leads.` (Inter)
- **CTA:** `ADD AGENT` primary → opens add agent modal (Flow 08)
- **ARIA:** `aria-label` on empty area

### SYSTEM ALERT
- **Headline:** `CONNECTION FAILED` · **Body:** `Unable to load agents.` · **CTA:** `RETRY`
- **ARIA:** `aria-live="assertive"`

---

## Screen 05.2 — rm-agents-routing-diagram

### PROCESSING
- **Visual:** Diagram skeleton (shimmer boxes)
- **ARIA:** `aria-busy="true"`

### ACTIVE
- **Visual:** Visual routing tree: lead source → routing rule → agent nodes with cyan connector lines
- **Interaction:** Agent nodes clickable → detail
- **ARIA:** Diagram `role="img"` · `aria-label` describing full routing config

### STANDBY
- **Headline:** `ROUTING NOT CONFIGURED` (Orbitron, `#7ECFDF`)
- **Body:** `Configure routing in Settings.`
- **CTA:** `GO TO SETTINGS`

---

## Screen 05.3 — rm-agents-detail

### PROCESSING
- **Visual:** Full-page skeleton
- **Copy:** `LOADING AGENT PROFILE`
- **ARIA:** `aria-busy="true"`

### ACTIVE
- **Visual:** Agent stats: leads assigned · contacted % · appt rate · close rate · status indicator · routing rule badge
- **Interaction:** Edit button · status toggle

### SYSTEM ALERT
- **Headline:** `AGENT NOT FOUND` / `CONNECTION FAILED`
- **CTA:** `BACK TO AGENTS`
- **ARIA:** `aria-live="assertive"`

---

## Screen 05.4 — rm-agents-leads-tab

### PROCESSING
- **Visual:** List skeleton rows
- **ARIA:** `aria-busy="true"`

### ACTIVE
- **Visual:** Lead list scoped to this agent (same structure as 04.1)
- **Interaction:** Row click → slide-over (04.2)

### STANDBY
- **Headline:** `NO LEADS ASSIGNED` (Orbitron, `#7ECFDF`)
- **Body:** `This agent has not been assigned any leads yet.` (Inter)

---

## Screen 05.5 — rm-agents-empty
Covered by STANDBY state in Screen 05.1.

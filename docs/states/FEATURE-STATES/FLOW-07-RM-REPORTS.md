# FLOW-07-RM-REPORTS.md
# RainMachine — Reports & AI Chat States
# 6 screens | Step 7 Output | 2026-03-31

> Value tag: [TD↓][ES↓] — Natural language query replaces manual filter/export workflow

---

## Screen 07.1 — rm-reports-archive

### PROCESSING
- **Visual:** Report card skeletons `h-[80px]` · shimmer
- **Copy:** `LOADING REPORTS` (Orbitron, muted)
- **ARIA:** `aria-busy="true"`

### ACTIVE
- **Visual:** Report cards: title · date range · type badge · status badge (READY / PROCESSING / FAILED)
- **Interaction:** Card click → 07.2 · Generate new report CTA
- **ARIA:** Cards `role="article"`

### STANDBY (= Screen 07.6)
- **Visual:** `FileText` icon dim-pulse
- **Headline:** `NO REPORTS GENERATED` (Orbitron, `#7ECFDF`)
- **Body:** `Reports are created automatically when a campaign completes a full cycle.` (Inter)
- **CTA:** `VIEW CAMPAIGNS` primary

### SYSTEM ALERT
- **Headline:** `CONNECTION FAILED` · `RETRY`
- **ARIA:** `aria-live="assertive"`

---

## Screen 07.2 — rm-reports-view

### PROCESSING
- **Trigger:** Report card click
- **Visual:** Full-page skeleton
- **Copy:** `LOADING REPORT`
- **ARIA:** `aria-busy="true"`

### ACTIVE
- **Visual:** Executive summary · KPI table · charts · AI insight block
- **Interaction:** Download PDF · Share · Open AI chat (07.3)
- **ARIA:** Heading hierarchy · table `role="grid"`

### SYSTEM ALERT
- **Headline:** `REPORT UNAVAILABLE`
- **Body:** `This report could not be loaded.`
- **CTA:** `BACK TO REPORTS`
- **ARIA:** `aria-live="assertive"`

---

## Screen 07.3 — rm-reports-ai-chat

### ACTIVE (no messages)
- **Visual:** Chat panel · input focused · `Sparkles` icon · prompt suggestion chips
- **Heading:** `ASK ABOUT THIS REPORT` (Orbitron, muted)
- **Body:** Example prompts (Inter)
- **ARIA:** Chat `role="region"` · input `aria-label="Ask a question about this report"`

### PROCESSING (= Screen 07.5)
- **Trigger:** Message sent
- **Visual:** User message renders · AI response: `Loader2` + `ANALYZING DATA` (Orbitron, muted)
- **Interaction:** Input disabled while processing
- **ARIA:** `aria-live="polite"` → `"Analyzing data."`

### ACTIVE (response received)
- **Visual:** AI message appears (block reveal) · input re-enabled
- **ARIA:** `aria-live="polite"` announces response

### SYSTEM ALERT (= Screen 07.5)
- **Trigger:** AI error
- **Visual:** Error inline in chat
- **Copy:** `ANALYSIS FAILED` (inline, `#FF6B35`) · `The AI could not process your query. Try rephrasing.` · `RETRY` chip
- **ARIA:** `aria-live="assertive"` inside chat region

---

## Screen 07.4 — rm-reports-processing

### PROCESSING (only state)
- **Visual:** Progress bar (deterministic if % known, indeterminate if not) · status label
- **Headline:** `GENERATING REPORT` (Orbitron, `#7ECFDF`)
- **Body:** `This may take 15–30 seconds.` (Inter)
- **Interaction:** Cancel link aborts generation
- **ARIA:** `aria-live="polite"` with % updates · `role="progressbar"`

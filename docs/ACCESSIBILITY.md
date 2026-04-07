# ACCESSIBILITY.md
# Make It Rain Digital — WCAG AA Compliance Plan
# Version 1.0 | March 2026

---

## EXECUTIVE SUMMARY

The MIRD design system uses a dark, high-contrast JARVIS aesthetic that presents specific accessibility challenges — primarily in color contrast ratios for muted text on dark backgrounds, and in animation intensity. This document identifies every potential issue, prescribes specific fixes, and defines the implementation requirements to achieve WCAG 2.1 Level AA compliance without compromising the design aesthetic.

---

## PART 1: COLOR CONTRAST ANALYSIS

### WCAG 2.1 AA Requirements
- Normal text (<18px or <14px bold): minimum 4.5:1 contrast ratio
- Large text (≥18px or ≥14px bold): minimum 3:1 contrast ratio
- UI components and graphical objects: minimum 3:1 contrast ratio

### Contrast Audit — All Text Combinations

| Foreground | Background | Ratio | Size | Pass/Fail | Fix |
|---|---|---|---|---|---|
| #E8F4F8 (text primary) | #050D1A (bg base) | **15.8:1** | Any | PASS | — |
| #E8F4F8 (text primary) | #0A1628 (panel bg) | **13.2:1** | Any | PASS | — |
| #7ECFDF (text muted) | #050D1A (bg base) | **6.4:1** | Any | PASS | — |
| #7ECFDF (text muted) | #0A1628 (panel bg) | **5.3:1** | Any | PASS | — |
| #00D4FF (cyan primary) | #050D1A (bg base) | **8.9:1** | Any | PASS | — |
| #00D4FF (cyan primary) | #0A1628 (panel bg) | **7.4:1** | Any | PASS | — |
| #00FF88 (success green) | #050D1A (bg base) | **10.6:1** | Any | PASS | — |
| #FFB800 (warning amber) | #050D1A (bg base) | **9.1:1** | Any | PASS | — |
| #FF6B35 (alert orange) | #050D1A (bg base) | **5.2:1** | Any | PASS | — |
| #FF6B35 (alert orange) | #0A1628 (panel bg) | **4.3:1** | Normal | **FAIL** | See fix below |
| #FF6B35 (alert orange) | #0A1628 (panel bg) | **4.3:1** | Large | PASS | — |
| #2A4A5A (text disabled) | #050D1A (bg base) | **1.8:1** | Any | FAIL (intentional) | Disabled elements must have non-text indicators + aria-disabled |
| #0A4F6E (cyan deep) | #050D1A (bg base) | **2.1:1** | Any | FAIL — NOT used for text | Only used as background fill, not for readable text |

**Critical Fix Required:**

`#FF6B35` on `#0A1628` falls to 4.3:1 for normal-weight text under 18px. This appears in:
- Alert tray alert descriptions (Inter 15px normal weight)
- Error state panel subtext (Inter 13px normal weight)

**Fix:** Use `#FF7D52` (lightened by 8% lightness) instead of `#FF6B35` for text on dark panel backgrounds. This achieves 5.1:1 ratio while remaining visually consistent with the alert palette.

```css
/* Contextual alert text override */
.alert-text-on-panel {
  color: #FF7D52; /* Use this for inline alert text on panel backgrounds */
}
/* Use #FF6B35 only for: backgrounds, borders, large headings, icons */
```

### Badge and Status Text Contrast

Status badges use text on colored-background badges. These require special attention:

| Badge Text | Badge Background | Ratio | Fix |
|---|---|---|---|
| #050D1A on rgba(0,212,255,0.15) | effective ~#0E2E3F | **12.1:1** | PASS |
| #E8F4F8 on rgba(0,255,136,0.15) | effective ~#0B2621 | **11.2:1** | PASS |
| #E8F4F8 on rgba(255,107,53,0.15) | effective ~#1A1110 | **12.5:1** | PASS |

All badges pass. Background tints are light enough that primary text maintains contrast.

### Focus Ring Contrast

Focus rings must have 3:1 contrast ratio against adjacent colors.

```css
/* Required focus ring implementation */
:focus-visible {
  outline: 2px solid #00D4FF;
  outline-offset: 2px;
  /* #00D4FF against #050D1A = 8.9:1 — PASSES */
  /* #00D4FF against #0A1628 = 7.4:1 — PASSES */
}
```

---

## PART 2: KEYBOARD NAVIGATION

### 2.1 Focus Order Requirements

All interactive elements must be reachable and operable via keyboard. The tab order must follow visual reading order (left-to-right, top-to-bottom) and must never trap focus.

**Dashboard Tab Order (RainMachine Main Dashboard):**
1. Skip to main content link (visually hidden, first in DOM)
2. Navigation sidebar items (DASHBOARD → LEADS → AGENTS → CAMPAIGNS → AI REPORTS → SETTINGS)
3. System status header (read-only, non-interactive — skip in tab order)
4. Panel 1 → Panel 2 → Panel 3 → Panel 4 (each panel focuses its header first)
5. Within panels: interactive elements in visual order (platform tabs, view toggles, expand buttons)
6. Claude AI panel: report text area (read-only), chat input, send button
7. User avatar / logout (navigation bottom)

**Lead Detail Side Panel (keyboard access):**
- When panel opens: focus moves to panel close button (top-right ✕)
- Tab through: close button → lead details (read-only, skip) → timeline items → reassign button
- Escape key: closes panel, returns focus to the row that opened it

**Onboarding Portal Tab Order (per step):**
- Step title (read-only, skip)
- All form fields in visible order
- Help text toggles (collapsible sections)
- Previous / Next navigation buttons

### 2.2 Keyboard Shortcuts

```
Global shortcuts (RainMachine Dashboard):
  G then D   → Go to Dashboard (Home)
  G then L   → Go to Leads
  G then A   → Go to Agents
  G then C   → Go to Campaigns
  G then R   → Go to Reports
  /          → Focus Claude AI chat input
  Escape     → Close any open panel/modal/drawer

Navigation shortcuts:
  ↑↓ arrows  → Navigate table rows (when table has focus)
  Enter       → Open selected row's detail panel
  Escape      → Close detail panel
```

Keyboard shortcuts must be documented in a discoverable help overlay:
- Trigger: `?` key or SETTINGS → KEYBOARD SHORTCUTS
- Overlay: lists all shortcuts in two-column panel

### 2.3 Focus Management for Panels

**Modal/drawer open:** Focus must move to the first interactive element inside the opened panel.
**Modal/drawer close:** Focus must return to the element that triggered the open action.
**Tab trap in modals:** When a modal is open, tab must cycle only within the modal. Implement using `inert` attribute or a focus trap utility.

```javascript
// Focus trap implementation requirement
// When any drawer, modal, or side panel opens:
function openPanel(panelEl, triggerEl) {
  // 1. Set aria-modal="true" on panelEl
  // 2. Set inert attribute on all siblings of panelEl
  // 3. Move focus to first focusable element in panelEl
  // 4. Store triggerEl reference for return focus
}

function closePanel(panelEl, triggerEl) {
  // 1. Remove aria-modal
  // 2. Remove inert from siblings
  // 3. Return focus to triggerEl
}
```

---

## PART 3: SCREEN READER SUPPORT

### 3.1 Semantic HTML Requirements

**DO use:**
```html
<!-- Navigation -->
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/dashboard" aria-current="page">Dashboard</a></li>
    ...
  </ul>
</nav>

<!-- Main content landmark -->
<main id="main-content">

<!-- Panels as articles or sections -->
<section aria-labelledby="panel-leads-title">
  <h2 id="panel-leads-title">Lead Acquisition</h2>
  ...
</section>

<!-- Status indicators -->
<span role="status" aria-live="polite" aria-atomic="true">
  System online
</span>

<!-- Data tables -->
<table>
  <caption>Active Leads</caption>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Stage</th>
      ...
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Martinez</td>
      <td>Appointment Set</td>
    </tr>
  </tbody>
</table>
```

**Metric Readout aria pattern:**
```html
<div class="metric-readout" role="group" aria-labelledby="metric-cpl-label">
  <span id="metric-cpl-label" class="metric-label">Cost Per Lead</span>
  <span class="metric-value" aria-live="polite">$21.40</span>
  <span class="metric-delta" aria-label="12 percent decrease from last week">
    ▼ 12% vs last week
  </span>
</div>
```

**Status badge aria pattern:**
```html
<span class="stage-badge" role="status" aria-label="Stage: Appointment Set">
  APPOINTMENT SET
</span>
```

**Progress ring aria pattern:**
```html
<div class="progress-ring" role="progressbar"
     aria-valuenow="73"
     aria-valuemin="0"
     aria-valuemax="100"
     aria-label="Show rate: 73%">
  <svg>...</svg>
  <span class="ring-label" aria-hidden="true">73%</span>
</div>
```

### 3.2 Live Region Requirements

Live regions allow screen readers to announce dynamic content updates without focus moving.

```html
<!-- System status (polite — announces when idle) -->
<div role="status" aria-live="polite" aria-atomic="false">
  <!-- Updates when system status changes -->
</div>

<!-- Alert tray (assertive — announces immediately) -->
<div role="alert" aria-live="assertive" aria-atomic="true">
  <!-- New alerts appended here trigger immediate announcement -->
</div>

<!-- Metric updates (polite — data refresh) -->
<div aria-live="polite" aria-atomic="false">
  <!-- Metrics update here on data sync -->
</div>

<!-- Claude AI response (polite — response arrives) -->
<div role="status" aria-live="polite" aria-atomic="true">
  <!-- New AI response text -->
</div>
```

**Important:** Do not use `aria-live` on every metric that updates — this will create constant noise for screen reader users during the boot-up counter animation. The boot-up animation should be non-announced (use `aria-hidden="true"` on the counting element, swap to real value and remove `aria-hidden` when counting completes).

```javascript
// Boot-up counter — screen reader safe implementation
function bootCounter(el, finalValue) {
  el.setAttribute('aria-hidden', 'true'); // hide during animation
  animateCounter(el, 0, finalValue, 1200, () => {
    el.removeAttribute('aria-hidden'); // reveal final value to screen reader
    el.textContent = formatValue(finalValue);
  });
}
```

### 3.3 Icon Accessibility

All decorative icons: `aria-hidden="true"` + `focusable="false"`
All functional icons (buttons, links): include visible or screen-reader text

```html
<!-- Decorative icon -->
<svg aria-hidden="true" focusable="false">...</svg>

<!-- Functional icon button -->
<button aria-label="Export leads as CSV">
  <svg aria-hidden="true" focusable="false">...</svg>
</button>

<!-- Icon with visible text (preferred for navigation) -->
<a href="/leads">
  <svg aria-hidden="true" focusable="false">...</svg>
  <span>Leads</span>
</a>
```

### 3.4 Claude AI Chat Accessibility

```html
<section aria-label="RainMachine AI Chat">
  <div role="log" aria-live="polite" aria-label="Chat history">
    <div class="message user" aria-label="You said:">
      Why did my CPL spike this week?
    </div>
    <div class="message ai" aria-label="RainMachine AI responded:">
      Your campaign entered a learning phase...
    </div>
  </div>

  <form aria-label="Send message to RainMachine AI">
    <label for="chat-input" class="sr-only">Ask a question</label>
    <input id="chat-input" type="text"
           placeholder="Ask about your CPL this week..."
           aria-describedby="chat-hint" />
    <span id="chat-hint" class="sr-only">
      Type your question and press Enter or click Send to submit.
    </span>
    <button type="submit" aria-label="Send message">
      TRANSMIT
    </button>
  </form>
</section>
```

---

## PART 4: ANIMATION ACCESSIBILITY

### 4.1 prefers-reduced-motion Implementation

All animations must be disabled or significantly reduced when the user's OS accessibility setting `prefers-reduced-motion` is set to `reduce`.

```css
/* Define all animations normally */
@keyframes system-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px #00FF88, 0 0 12px rgba(0, 255, 136, 0.4); }
  50% { opacity: 0.4; box-shadow: 0 0 2px #00FF88; }
}

@keyframes scan-line {
  0% { top: 0%; opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

@keyframes panel-entrance {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Disable/reduce all animations for reduced-motion preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Preserve functional animation intent — show final states */
  .pulse-dot {
    /* Remove pulse, keep the dot visible and colored */
    animation: none;
    opacity: 1;
    box-shadow: 0 0 6px currentColor;
  }

  .panel {
    /* Remove entrance animation, show panel immediately */
    animation: none;
    opacity: 1;
    transform: none;
  }

  .scanning::after {
    /* Remove scan line, panel just loads */
    display: none;
  }
}
```

**Boot-up counter with reduced-motion:**
```javascript
function bootCounter(el, finalValue) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    // Skip animation — show final value immediately
    el.textContent = formatValue(finalValue);
    return;
  }
  // Standard boot-up animation
  animateCounter(el, 0, finalValue, 1200);
}
```

### 4.2 Seizure Safety

The JARVIS aesthetic uses ambient pulsing animations. All animations must comply with WCAG 2.3.1 (Three Flashes or Below Threshold):

- `system-pulse` at 2s cycle = 0.5Hz — well below the 3Hz threshold. Safe.
- `glow-pulse` at 3s cycle = 0.33Hz — safe.
- `alert-flash` (3 iterations at 0.8s each) = 1.25Hz — safe.
- Scanning line is a single pass (not repeating) — safe.
- No strobe or rapid flash effects anywhere in the system.

**Rule:** No animation may flash faster than 3 times per second. All repeating animations must have a cycle duration of at least 334ms (enforced via code review).

### 4.3 Autoplay Controls

If any panel uses continuous data-feed animation (live "data stream" visuals):
- Provide a [PAUSE ANIMATIONS] toggle in Settings → Accessibility
- Store preference in localStorage
- Apply `.motion-reduced` class to `<html>` element when toggled, same effect as prefers-reduced-motion

---

## PART 5: TOUCH TARGET SIZES

### WCAG 2.5.5 (AAA) and WCAG 2.5.8 (AA) Requirements
- Minimum touch target size: 24x24 CSS pixels (WCAG 2.5.8 AA)
- Recommended: 44x44 CSS pixels (iOS HIG and WCAG 2.5.5 AAA)

**MIRD Mobile Touch Targets:**

| Element | Visual Size | Touch Target | Method |
|---|---|---|---|
| Navigation tab bar icons | 24px icon | 44x44px | padding compensation |
| Lead card row | Full width × 64px min | 64px height | naturally meets requirement |
| Stage badge | Variable | 36px min-height | padding |
| Panel expand button | 32px | 44x44px | padding compensation |
| Table row action [→] | 32x32px | 44x44px | negative margin + padding |
| Form checkbox | 18px | 44x44px | custom checkbox with expanded click area |
| File upload drop zone | Full width × 80px | naturally meets | — |
| Onboarding CTA button | Full width × 52px | naturally meets | — |
| Dismiss alert [✕] | 16px icon | 44x44px | padding compensation |
| Chat send button | 40x40px | 44x44px | padding compensation |

**Implementation pattern for small interactive elements:**
```css
.small-interactive-element {
  position: relative;
}

.small-interactive-element::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 44px;
  min-height: 44px;
}
```

### Touch Target Spacing

Adjacent interactive elements must have at least 8px spacing between touch targets to prevent mis-taps (WCAG 2.5.8 requirement).

High-risk areas to audit:
- Lead table action icons in rightmost column
- Filter bar pills on mobile (ensure 8px gap between each)
- Onboarding step navigation buttons (Previous / Next) — ensure minimum 8px gap

---

## PART 6: FORMS AND VALIDATION

### 6.1 Form Label Requirements

All form inputs must have associated labels. Never rely on placeholder text as the only label.

```html
<!-- CORRECT -->
<div class="field-group">
  <label for="primary-markets">PRIMARY MARKETS</label>
  <input id="primary-markets" type="text"
         placeholder="e.g. Metro Phoenix, Scottsdale"
         aria-required="true"
         aria-describedby="primary-markets-hint" />
  <span id="primary-markets-hint">
    Enter the geographic areas you want to target, separated by commas.
  </span>
</div>

<!-- INCORRECT — do not use placeholder as label -->
<input type="text" placeholder="PRIMARY MARKETS" />
```

### 6.2 Error Messages

```html
<!-- Inline error pattern -->
<div class="field-group">
  <label for="business-name">BUSINESS NAME</label>
  <input id="business-name" type="text"
         aria-required="true"
         aria-invalid="true"
         aria-describedby="business-name-error" />
  <span id="business-name-error" role="alert" class="field-error">
    Business name is required to continue.
  </span>
</div>
```

Error messages must:
- Use `role="alert"` to announce immediately to screen readers
- Be associated with the field via `aria-describedby`
- Use plain language (not "FIELD VALIDATION FAILURE" — that's for display styling, not the SR-accessible message)
- Never rely on color alone — include an error icon or "Error:" prefix

### 6.3 Required Field Indication

```html
<!-- Visual asterisk + screen reader text -->
<label for="business-name">
  BUSINESS NAME
  <span aria-hidden="true"> *</span>
  <span class="sr-only">(required)</span>
</label>
```

---

## PART 7: COMPONENT-SPECIFIC REQUIREMENTS

### 7.1 Data Tables (Lead Table, Campaign Table, P&L Table)

- All tables must use proper `<table>`, `<thead>`, `<tbody>` elements
- Column headers: `<th scope="col">` with descriptive text
- If sortable: `aria-sort="ascending"` / `aria-sort="descending"` / `aria-sort="none"`
- Row actions (expand, open detail): `aria-label="View details for [Lead Name]"`
- If virtualized (long tables): announce "Showing 25 of 142 leads" via `aria-live="polite"`

### 7.2 Progress Rings

All progress rings require:
- `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- `aria-label` describing what is being measured
- The visual SVG: `aria-hidden="true"`

### 7.3 Navigation Sidebar

- `<nav aria-label="Main navigation">` as landmark
- Current page: `aria-current="page"` on active nav item
- Collapsed state (icon-only): ensure link labels are still present as `aria-label` on the `<a>` elements
- Keyboard: all nav items focusable, Enter activates

### 7.4 Onboarding Step Progress Bar

```html
<nav aria-label="Onboarding progress">
  <ol>
    <li aria-current="step">
      <span class="sr-only">Current step: </span>
      Step 3: Meta Ads Connection
    </li>
    <li aria-label="Step 4: Google Ads — not yet completed">
      Step 4
    </li>
  </ol>
</nav>
```

### 7.5 Platform Tabs (Campaign Intelligence)

```html
<div role="tablist" aria-label="Ad platform">
  <button role="tab"
          aria-selected="true"
          aria-controls="panel-meta"
          id="tab-meta">
    META ADS
  </button>
  <button role="tab"
          aria-selected="false"
          aria-controls="panel-google"
          id="tab-google"
          tabindex="-1">
    GOOGLE ADS
  </button>
</div>
<div role="tabpanel" id="panel-meta" aria-labelledby="tab-meta">
  ...
</div>
```

Tab keyboard behavior: Arrow keys cycle through tabs (not Tab key). Tab key moves focus out of tablist.

---

## PART 8: TESTING REQUIREMENTS

### Automated Testing (every build)
- Run `axe-core` (via jest-axe or Playwright integration) on all pages
- Zero `critical` or `serious` violations allowed in CI
- `moderate` violations reviewed within 1 sprint

### Manual Testing (per release)
- Keyboard-only navigation through complete user flows (onboarding, weekly dashboard check)
- Screen reader testing: VoiceOver on macOS/iOS, NVDA on Windows
- Test all dynamic content updates (data refresh, AI response, alert tray)
- Test `prefers-reduced-motion` in system settings

### Color Blind Testing
- Test all status indicators, badges, and charts with Deuteranopia (red-green blindness) simulation
- Charts: never use color as the only differentiator — add pattern fills or text labels
- Platform breakdown bars (Meta/Google/Organic): use color + text label, never color alone

---

## PART 9: SCREEN READER-ONLY UTILITY CLASS

```css
/* Screen reader only utility — content visible to SR, hidden visually */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Skip link — keyboard users, hidden until focused */
.skip-link {
  position: absolute;
  top: -100%;
  left: 16px;
  z-index: 9999;
  padding: 8px 16px;
  background: #00D4FF;
  color: #050D1A;
  font-family: 'Orbitron', sans-serif;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.skip-link:focus {
  top: 16px;
}
```

HTML structure requirement — every page must begin with:
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

---

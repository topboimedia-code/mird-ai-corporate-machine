# ACCESSIBILITY-STATES.md
# MIRD JARVIS Dark — Accessibility State Management
# Step 7 Output | Date: 2026-03-31
# Target: WCAG AA minimum · AAA on critical paths (auth, wizard, lead management)

---

## F.1 Focus Management

### F.1.1 Universal Focus Indicator

```css
:focus-visible {
  outline: 2px solid #00D4FF;
  outline-offset: 2px;
  border-radius: 4px;
}

/* FORBIDDEN — never suppress focus */
/* :focus { outline: none; } */
```

| Pair | Contrast | WCAG |
|------|---------|------|
| `#00D4FF` on `#050D1A` | 7.8:1 | ✅ AAA |
| `#00D4FF` on `#0A1628` | 6.9:1 | ✅ AA+ |
| `#050D1A` on `#00D4FF` (button) | 7.8:1 | ✅ AAA |

### F.1.2 Focus Preservation During State Changes

| Transition | Focus Rule |
|-----------|------------|
| ACTIVE → PROCESSING (submit) | Stays on submit button (now disabled + spinner) |
| PROCESSING → ACTIVE (data loaded) | Stays where it was; if element gone → move to page `<h1>` |
| PROCESSING → SYSTEM ALERT | Moves to error banner or first inline error field |
| SYSTEM ALERT → PROCESSING (retry) | Moves to retry button |
| PROCESSING → CONFIRMED | Moves to: next element if workflow continues · close button if modal · first interactive if page |
| Modal opens | Traps in modal; first focus = first interactive element |
| Modal closes | Returns to element that triggered modal |
| Slide-over opens | Traps in panel; first focus = close button |
| Slide-over closes | Returns to triggering row |
| Tab switch | First interactive element in new tab panel |
| Toast appears | Focus does NOT move (announced via `aria-live`) |
| SIGNAL LOST banner | Focus does NOT move (announced via `role="alert"`) |
| Infinite scroll loads | Focus stays at current scroll position |
| Pull-to-refresh completes | Focus stays at scroll position (no jump to top) |

### F.1.3 Focus Trap Implementation

Applies to: all modals, slide-over panels, mobile bottom sheets.

```typescript
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// On open:
// 1. Save reference to triggering element
// 2. Get all focusable elements within container
// 3. Focus first element
// 4. Tab: cycle forward, wrap last→first
// 5. Shift+Tab: cycle backward, wrap first→last
// 6. Esc: close, restore focus to trigger

// On close:
// 1. Restore focus to saved trigger
// 2. If trigger not in DOM: focus nearest parent in DOM
```

### F.1.4 Initial Page Focus

| Page | Initial Focus |
|------|--------------|
| Login (01.1, 10.1) | Email input |
| Forgot password (01.2) | Email input |
| Reset password (01.3) | New password input |
| Session expired (01.4, 10.4) | `LOG IN` button |
| Dashboard (03.1, 11.1) | Page `<h1>` (skip-link target) |
| Lead list (04.1) | Search input · else first data row |
| Wizard steps (18–22) | First input in step form |
| Completion screen (23.2) | `GO TO DASHBOARD` button |
| 404 / 500 / Maintenance | Primary recovery CTA |
| Any modal open | First interactive element (not close X unless only element) |

---

## F.2 Skip Navigation

```html
<!-- First element in <body> -->
<a href="#main-content" class="skip-link">
  Skip to main content
</a>
```

```css
.skip-link {
  position: absolute;
  transform: translateY(-100%);
  background: #00D4FF;
  color: #050D1A;
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 8px 16px;
  z-index: 9999;
  transition: transform 0.15s ease-out;
}
.skip-link:focus {
  transform: translateY(0);
}
```

**Second skip link** when alert banner is active: `Skip to alert` → `#alert-banner`

---

## F.3 ARIA Live Regions

### F.3.1 Architecture

Two permanent DOM nodes in every app shell:

```html
<div
  id="aria-polite"
  role="status"
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
></div>

<div
  id="aria-assertive"
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  class="sr-only"
></div>
```

**Injection rule:** Clear → wait 50ms → set content. Forces re-announcement of identical messages.

```css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}
```

### F.3.2 Announcement Matrix

| Transition | Region | Announcement |
|-----------|--------|-------------|
| Any → PROCESSING (page load) | polite | `"Loading [page name]."` |
| Any → PROCESSING (action) | polite | `"[Action] in progress. Please wait."` |
| PROCESSING → ACTIVE | polite | `"[Content] loaded. [Count if applicable]."` |
| PROCESSING → STANDBY | polite | `"[Content] loaded. No [items] found."` |
| PROCESSING → SYSTEM ALERT | assertive | `"Error: [Headline]. [Recovery instruction]."` |
| PROCESSING → CONFIRMED | polite | `"[Success headline]."` |
| ACTIVE → SIGNAL LOST | assertive | `"Connection lost. Displaying last known data."` |
| SIGNAL LOST → RECONNECTING | polite | `"Reconnecting to the network."` |
| RECONNECTING → ACTIVE | polite | `"Connection restored. Data is current."` |
| Modal opens | polite | `"[Modal title] dialog opened."` |
| Modal closes | polite | `"[Modal title] dialog closed."` |
| Toast (success) | polite | `"[Label]. [Body text]."` |
| Toast (error) | assertive | `"Error: [Label]. [Body text]."` |
| Toast (warning) | polite | `"Warning: [Label]. [Body text]."` |
| Form validation | assertive | `"[N] error(s) found. [First error message]."` |
| Infinite scroll loads | polite | `"Loading more [content type]."` |
| Infinite scroll complete | polite | `"All [content type] loaded."` |
| Pull-to-refresh trigger | polite | `"Refreshing [content type]."` |
| Pull-to-refresh complete | polite | `"[Content type] updated."` |
| File upload progress | polite | `"Uploading [filename]. [N]% complete."` (at 25/50/75/100%) |
| File upload complete | polite | `"[Filename] uploaded successfully."` |
| File upload failed | assertive | `"Upload failed for [filename]. [Error reason]."` |
| Optimistic update | polite | `"[Item] [action]."` |
| Optimistic revert | assertive | `"[Action] failed. Change reverted."` |
| Scan-line init | polite | `"Loading [app name]."` |
| Wizard step advance | polite | `"Step [N] of 5. [Step name]."` |
| Sequential label stagger | polite | Each label announced as it appears |
| Progress bar milestones | polite | `"[N]% complete."` at 25/50/75; `"Complete."` at 100 |
| Countdown (500 auto-retry) | polite | Every 5s: `"Retrying in [N] seconds."` |

### F.3.3 Dynamic Content Live Settings

| Element | `aria-live` | `aria-atomic` | Notes |
|---------|------------|--------------|-------|
| CEO agent activity ticker | `polite` | `false` | Per new entry |
| Lead count badge in nav | `polite` | `true` | On data refresh |
| Real-time metric cards | `off` | — | Too noisy; user reads on demand |
| Session expiry countdown | `polite` | `true` | Every 30s |
| Pull-to-refresh indicator | `polite` | `true` | State changes only |

---

## F.4 Screen Reader Specifications

### F.4.1 Visual Element → Text Equivalents

| Visual | Screen Reader Equivalent |
|--------|------------------------|
| Status dot (green, pulsing) | `aria-label="Status: Online"` |
| Lead stage badge `NEW` | `aria-label="Lead stage: New"` |
| Platform badge (cyan Meta) | `aria-label="Source: Meta Ads"` |
| Health score bar | `aria-label="Health score: [N]/100, High/Medium/Low"` |
| Shimmer skeleton | `aria-busy="true"` on container |
| Scan-line sweep | polite announce: `"Initializing [app]"` |
| Indeterminate shimmer bar | `role="progressbar"` no `aria-valuenow` · `aria-label="Loading"` |
| Deterministic progress bar | `role="progressbar"` + `aria-valuenow/min/max` |
| Green border (connected) | `aria-label="Status: Connected"` |
| Red border (error) | `aria-label="Status: Connection error"` |
| `CheckCircle2` icon | `aria-hidden="true"` + adjacent sr-only `"Confirmed"` |
| Toast slide-in | `role="status"` or `role="alert"` + `aria-live` |
| Ambient glow pulse | Icon `aria-hidden="true"` · headline carries full meaning |
| Orange left-border banner | `role="alert"` + `aria-labelledby` heading |
| Shake animation on error | `aria-invalid="true"` + `aria-describedby` (shake is supplementary) |

### F.4.2 Orbitron Uppercase Rule

**Problem:** Screen readers may spell out uppercase text letter-by-letter.

**Solution:** Render DOM text in lowercase · CSS handles visual uppercase.

```html
<!-- WRONG -->
<h2 class="orbitron">LEAD ROUTING</h2>

<!-- CORRECT -->
<h2 class="orbitron" style="text-transform: uppercase">Lead Routing</h2>

<!-- React -->
<h2 className="font-orbitron uppercase">Lead Routing</h2>
```

**Status code exception:** `NEW`, `LOST`, `CLOSED` — use `aria-label` to ensure word pronunciation:
```html
<span aria-label="Lead stage: New" className="badge uppercase">New</span>
```

### F.4.3 Metric Value Labeling

| Value | `aria-label` |
|-------|-------------|
| `$24,891` | `aria-label="Total revenue: $24,891"` |
| `4.2%` | `aria-label="Conversion rate: 4.2 percent"` |
| `127` | `aria-label="Active leads: 127"` |
| `08:23:14` | `aria-label="Last sync: 8:23 AM"` |
| `--` | `aria-label="No data available"` |

### F.4.4 Icon-Only Buttons

All icon-only buttons require `aria-label`. No exceptions.

| Button | `aria-label` |
|--------|-------------|
| Close slide-over | `"Close [content type] panel"` |
| Close modal | `"Close [modal name] dialog"` |
| Close toast | `"Dismiss notification"` |
| Play recording | `"Play call recording from [timestamp]"` |
| Sort column | `"Sort by [column name], currently [asc/desc/unsorted]"` |
| Filter toggle | `"Toggle filters"` |
| Edit row | `"Edit [item name]"` |
| Delete row | `"Delete [item name]"` |
| Retry | `"Retry [last action]"` |
| Refresh section | `"Refresh [section name]"` |

---

## F.5 Keyboard Navigation

### F.5.1 Tab Order Rules

1. Tab order follows visual reading order (left-to-right, top-to-bottom)
2. No `tabindex > 0` — never force order with positive tabindex
3. Skip navigation always first in DOM
4. Sidebar nav before main content in DOM (CSS handles visual layout)

**RainMachine:** Skip link → Logo → Nav items → User menu → Main content
**CEO Dashboard:** Skip link → Logo → Top nav → User menu → Main content
**Wizard:** Skip link → Step indicator (read-only) → Form fields → Back → Continue

### F.5.2 Keyboard Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| `Esc` | Open modal/slide-over | Close, restore focus |
| `Esc` | Toast present | Dismiss most recent |
| `Enter` / `Space` | Focused button | Activate |
| `Enter` | Focused table row | Open detail |
| `↑` / `↓` | Focused table row | Previous/next row |
| `Space` | Toggle/checkbox | Toggle |
| `↑` / `↓` | Open select | Navigate options |
| `Enter` | Select option focused | Select |
| `Esc` | Open select | Close, no change |

### F.5.3 Component Keyboard Specs

**Lead Status Dropdown:**
```
Click/Enter → aria-expanded="true"
↑/↓ → aria-activedescendant updates
Enter → selects, closes, polite announcement
Esc → closes, no change, focus returns to trigger
```

**Wizard Step Indicator:**
```
role="list"
Steps: role="listitem"
Active: aria-current="step"
Completed: aria-label="Step [N]: [Name], completed"
Upcoming: aria-label="Step [N]: [Name], not yet completed"
Not focusable — display only
```

**File Upload Zone:**
```
role="button" tabindex="0"
aria-label="Upload [type]. Press Enter or Space to browse, or drag and drop."
Enter/Space → opens file picker
File selected → announces "[filename] selected."
Uploading → aria-busy="true"
```

**Accordion:**
```
Trigger: role="button" aria-expanded="false|true" aria-controls="[panel-id]"
Panel: role="region" aria-labelledby="[trigger-id]"
Enter/Space → toggles
```

**OTP Input (CEO 2FA):**
```
type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code"
aria-label="One-time password, 6 digits"
Paste → auto-fills all 6 digits
aria-live="polite" → "[N] digits entered. [6-N] remaining."
```

---

## F.6 Reduced Motion

### F.6.1 CSS Detection

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### F.6.2 React Hook

```typescript
const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
};
```

### F.6.3 Animation Fallback Map

| Animation | Normal | Reduced-Motion Fallback |
|-----------|--------|------------------------|
| Scan-line init | 400ms sweep | Instant appear (`opacity: 0→1`, 0ms) |
| Skeleton shimmer | Gradient animation | Static `#0A1628` block |
| Indeterminate shimmer | Translate loop | Static bar at 50%, no movement |
| Content stagger | `staggerChildren: 0.05s` | All children appear simultaneously |
| SYSTEM ALERT shake | `x:[0,-8,8,-8,8,0]` 250ms | Instant border color change only |
| CONFIRMED bounce | Spring scale + bounce | Icon at full size instantly |
| Success border pulse | 1 pulse cycle | Static `rgba(0,255,136,0.40)` border |
| Ambient icon pulse | Continuous opacity loop | Static at `opacity: 0.55` |
| Modal entry | `scale: 0.95→1` 250ms | `opacity: 0→1` only, 0ms |
| Slide-over entry | `translateX(100%→0)` 300ms | `opacity: 0→1` only |
| Toast entry | `translateX(100%→0)` spring | `opacity: 0→1` 150ms |
| Pull-to-refresh | Position-tracking animation | Static indicator, no position animation |
| Status dot pulse | Opacity loop | Static dot |
| Agent activity ticker | Auto-scroll | Static list, manual scroll |
| Number roll | Count-up animation | Instant value swap |
| Progress bar fill | Smooth `scaleX` | Instant width jump |
| Wizard step transition | `translateX` slide | `opacity` cross-fade 150ms |

---

## F.7 Color Contrast — State Colors

| State | Foreground | Background | Ratio | WCAG |
|-------|-----------|-----------|-------|------|
| Error text | `#FF7D52` | `#0A1628` | 4.6:1 | ✅ AA |
| Error headline | `#FF6B35` | `#0A1628` | 4.3:1 | ✅ AA |
| Warning text | `#FFB800` | `#050D1A` | 5.8:1 | ✅ AA |
| Success text | `#00FF88` | `#050D1A` | 8.9:1 | ✅ AAA |
| Muted (loading/standby) | `#7ECFDF` | `#050D1A` | 5.1:1 | ✅ AA |
| Disabled text | `#2A4A5A` | `#050D1A` | 2.6:1 | ⚠️ Decorative only |
| Focus ring | `#00D4FF` | `#050D1A` | 7.8:1 | ✅ AAA |
| Offline banner text | `#FF7D52` | `#0A1628` | 4.6:1 | ✅ AA |

**`#2A4A5A` rule:** Used only for non-interactive decorative elements. Never sole indicator of state for interactive elements. All disabled interactive elements also use `aria-disabled="true"`.

---

## F.8 Testing Requirements

### Automated Tests (per stateful component)

| Test | Assertion | Threshold |
|------|-----------|-----------|
| Skeleton CLS | `abs(skeletonH - contentH) / contentH` | < 5% |
| Reduced motion | No `animation-duration > 0.01ms` · state changes still occur | Zero violations |
| Error animation brevity | Time from error trigger → error state stable | < 500ms |
| Focus preservation | `document.activeElement` before/after transition | Same or documented move |

### Manual Tests

- `axe-core` scan on every state (empty, loading, populated, error, success) — zero critical violations
- Screen reader end-to-end: auth flow, lead status update, wizard completion, modal open/close
- Keyboard-only: complete full wizard without mouse

### Test Utilities

```typescript
// Mock prefers-reduced-motion
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation(query => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
});

// Verify axe on all states
import { axe } from 'jest-axe';
it('has no accessibility violations in error state', async () => {
  const { container } = render(<ComponentInErrorState />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

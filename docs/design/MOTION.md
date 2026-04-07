# MIRD Motion & Animation System
## Make It Rain Digital | Sigma Protocol Step 6

> The animation system for MIRD JARVIS Dark. Every motion is purposeful — it communicates system state, guides attention, or confirms an action. Nothing animates for decoration.

---

## Core Principles

### 1. Purpose Over Decoration
Every animation answers: "What is this communicating?"
- **System state**: Status pulses tell you the system is alive
- **Data reception**: Scan lines tell you data just arrived
- **User confirmation**: Boot counters tell you the numbers are real
- **Attention guidance**: Glow pulses draw the eye to critical information

If an animation doesn't communicate one of these, it doesn't belong.

### 2. The JARVIS Vocabulary
Four motion categories define the MIRD language:

| Category | Description | Examples |
|----------|-------------|---------|
| **Pulse** | Breathing, alive, continuous | Status dots, ambient glow |
| **Scan** | Horizontal sweep, data received | Panel load scan-line |
| **Boot** | Count-up from zero, initialization | Metric counters, progress rings |
| **Enter** | Appear with intent, slide from anchor | Panel mount, modal open |

### 3. GPU-Accelerated Only
All animations use only:
- `transform` (translate, scale, rotate)
- `opacity`
- `filter` (drop-shadow, blur)

Never animate: `width`, `height`, `top`, `left`, `margin`, `padding`, `background-color` (use `opacity` overlay instead).

### 4. Respect `prefers-reduced-motion`
Every animation has a static fallback. Users who have opted out of motion see:
- Status dots at full opacity (no pulse)
- Panels appear instantly (no slide-in)
- Metrics show final values immediately (no boot counter)
- All transitions complete in 0.01ms

---

## Duration Reference

```
--dur-instant:   50ms    Tap feedback, button press confirmation
--dur-flash:    100ms    Fastest intentional transition
--dur-fast:     200ms    Hover states, focus ring appearance
--dur-standard: 300ms    Panel state changes, expand/collapse
--dur-moderate: 500ms    Page element entrances, route transitions
--dur-scan:    1500ms    Data scan-line sweeps panel
--dur-boot:    1200ms    Metric boot counter (0 → value)
--dur-draw:    1000ms    Progress ring arc draws
--dur-pulse:   2000ms    Status dot breathing cycle (ONLINE)
--dur-glow:    3000ms    Ambient panel border glow cycle
--dur-shimmer: 1800ms    Skeleton loading shimmer loop
```

---

## Easing Reference

```
--ease-standard:   cubic-bezier(0.25, 0.46, 0.45, 0.94)
  → Most transitions. Smooth out, natural feel.

--ease-decelerate: cubic-bezier(0.00, 0.00, 0.20, 1.00)
  → Elements entering the screen. Fast start, soft landing.

--ease-accelerate: cubic-bezier(0.40, 0.00, 1.00, 1.00)
  → Elements leaving. Accelerate off-screen.

--ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1.00)
  → Panel pop-in, modal open. Slight overshoot for life.

--ease-linear:     linear
  → Scan lines, loading bars. Mechanical, even pace.
```

---

## Complete @keyframes Library

### `system-pulse` — Status Dot Heartbeat
```css
@keyframes system-pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 6px currentColor, 0 0 12px color-mix(in srgb, currentColor 40%, transparent);
  }
  50% {
    opacity: 0.4;
    box-shadow: 0 0 2px currentColor;
  }
}
```

**Usage by state:**

| State | Duration | Iteration |
|-------|----------|-----------|
| ONLINE | `2s ease-in-out infinite` | Forever |
| PROCESSING | `1.2s ease-in-out infinite` | Forever (faster urgency) |
| STANDBY | `4s ease-in-out infinite` | Forever (barely perceptible) |

---

### `alert-flash` — Critical Attention Signal
```css
@keyframes alert-flash {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
```

**Usage:** `alert-flash 0.8s ease-in-out 3`
Fires exactly 3 times then holds at full opacity. Communicates "this just changed" without permanent distraction.

---

### `scan-line` — Data Load Sweep
```css
@keyframes scan-line {
  0%   { top: -2px; opacity: 1; }
  90%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

.panel-scan-line {
  position:   absolute;
  left:       0; right: 0;
  height:     2px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(0,212,255,0.4) 30%,
    rgba(0,212,255,0.8) 50%,
    rgba(0,212,255,0.4) 70%,
    transparent 100%
  );
  animation: scan-line var(--dur-scan) var(--ease-linear) 1;
  pointer-events: none;
}
```

**Usage:** Fires once on data load. Parent panel has `position: relative; overflow: hidden`.

---

### `shimmer` — Skeleton Loading
```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

.shimmer-bar {
  background: linear-gradient(90deg,
    rgba(0,212,255,0.04) 25%,
    rgba(0,212,255,0.10) 50%,
    rgba(0,212,255,0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer var(--dur-shimmer) ease-in-out infinite;
}
```

**Shimmer bar heights:** Title bar = 14px, Content line = 12px, Wide bar = full width, Half bar = 60% width.

---

### `panel-enter` — Dashboard Panel Mount
```css
@keyframes panel-enter {
  from {
    opacity:   0;
    transform: translateY(8px);
  }
  to {
    opacity:   1;
    transform: translateY(0);
  }
}
```

**Usage:** `panel-enter 400ms cubic-bezier(0.34,1.56,0.64,1) 1 both`

**Stagger pattern** (dashboard load):
```css
.panel-grid .panel-card:nth-child(1) { animation-delay:   0ms; }
.panel-grid .panel-card:nth-child(2) { animation-delay:  80ms; }
.panel-grid .panel-card:nth-child(3) { animation-delay: 160ms; }
.panel-grid .panel-card:nth-child(4) { animation-delay: 240ms; }
.panel-grid .panel-card:nth-child(5) { animation-delay: 320ms; }
```

---

### `ambient-glow` — Panel Border Breathing
```css
@keyframes ambient-glow {
  0%, 100% { box-shadow: 0 0 15px rgba(0,212,255,0.06), inset 0 1px 0 rgba(0,212,255,0.08); }
  50%       { box-shadow: 0 0 25px rgba(0,212,255,0.10), inset 0 1px 0 rgba(0,212,255,0.12); }
}
```

**Usage:** `ambient-glow var(--dur-glow) ease-in-out infinite alternate`

Apply only to **highlighted** panel variant — not all panels (too much visual noise).

---

### `data-tick` — Live Metric Update
```css
@keyframes data-tick {
  0%   { transform: translateY(-4px); opacity: 0; }
  100% { transform: translateY(0);    opacity: 1; }
}
```

**Usage:** `data-tick 150ms ease-out 1` — fires when a metric value refreshes from real data.

---

### `modal-enter` / `modal-exit`
```css
@keyframes modal-enter {
  from { opacity: 0; transform: scale(0.96) translateY(-8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes modal-exit {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to   { opacity: 0; transform: scale(0.96) translateY(-8px); }
}

@keyframes overlay-enter {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

---

### `slide-in-right` — Detail Panel
```css
@keyframes slide-in-right {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

@keyframes slide-out-right {
  from { transform: translateX(0); }
  to   { transform: translateX(100%); }
}
```

**Usage:** Side detail panels (lead detail, campaign detail).

---

### `toast-enter` / `toast-exit`
```css
@keyframes toast-enter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes toast-exit {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-8px); }
}
```

---

## JavaScript Animation Patterns

### Boot Counter
Counts from 0 to final value on page load. Applied to all `metric-xl` and `metric-lg` values.

```javascript
function bootCounter(element, finalValue, options = {}) {
  const {
    format = 'number',  // 'number' | 'currency' | 'percent' | 'compact'
    duration = 1200,
    delay = 0
  } = options;

  const easeOut = t => 1 - Math.pow(1 - t, 3);
  let startTime = null;

  function formatValue(val, complete) {
    switch (format) {
      case 'currency':
        return complete
          ? '$' + finalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })
          : '$' + Math.floor(val).toLocaleString();
      case 'percent':
        return (val * 100 / finalValue).toFixed(1) + '%';
      case 'compact':
        if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
        return Math.floor(val).toString();
      default:
        return Math.floor(val).toLocaleString();
    }
  }

  setTimeout(() => {
    function tick(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = Math.min((timestamp - startTime) / duration, 1);
      const current = easeOut(elapsed) * finalValue;
      element.textContent = formatValue(current, elapsed === 1);
      if (elapsed < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, delay);
}

// Usage
bootCounter(document.querySelector('.metric-mrr'), 47250, { format: 'currency' });
bootCounter(document.querySelector('.metric-leads'), 47, { format: 'number', delay: 80 });
bootCounter(document.querySelector('.metric-rate'), 73, { format: 'percent', delay: 160 });
```

---

### Progress Ring Draw
Initializes SVG ring with `stroke-dasharray` then transitions to target value.

```javascript
function initProgressRing(ringElement, percent) {
  const circle = ringElement.querySelector('.progress-ring__fill');
  const radius = parseFloat(circle.getAttribute('r'));
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = circumference; // start at 0 fill

  // Force browser to register initial state
  circle.getBoundingClientRect();

  // Apply transition and target
  circle.style.transition = `stroke-dashoffset var(--dur-draw) var(--ease-standard)`;
  circle.style.strokeDashoffset = offset;
}

// Intersection Observer — draw when ring enters viewport
const ringObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const percent = parseInt(entry.target.dataset.percent);
      initProgressRing(entry.target, percent);
      ringObserver.unobserve(entry.target);
    }
  });
});

document.querySelectorAll('.progress-ring').forEach(ring => ringObserver.observe(ring));
```

---

### Panel Stagger Controller
Orchestrates panel entrance on route/page load.

```javascript
function stagePanels(containerSelector) {
  const panels = document.querySelectorAll(`${containerSelector} .panel-card`);
  panels.forEach((panel, i) => {
    panel.style.animationDelay = `${i * 80}ms`;
    panel.classList.add('panel-animate');
  });
}

// In CSS:
// .panel-animate { animation: panel-enter 400ms cubic-bezier(0.34,1.56,0.64,1) both; }
```

---

## Animation Quality Matrix

| Animation | Purpose | Duration | Easing | Iteration | Stagger |
|-----------|---------|----------|--------|-----------|---------|
| system-pulse (online) | System alive | 2s | ease-in-out | infinite | — |
| system-pulse (processing) | Active state | 1.2s | ease-in-out | infinite | — |
| system-pulse (standby) | Dormant state | 4s | ease-in-out | infinite | — |
| alert-flash | State change alert | 0.8s | ease-in-out | 3× | — |
| scan-line | Data received | 1.5s | linear | 1 | — |
| shimmer | Loading skeleton | 1.8s | ease-in-out | infinite | — |
| panel-enter | Page mount | 400ms | spring | 1 | 80ms |
| ambient-glow | Highlight pulse | 3s | ease-in-out | infinite | — |
| data-tick | Live data update | 150ms | ease-out | 1 | — |
| boot-counter | Metric boot | 1200ms | ease-out | 1 | 80ms |
| progress-draw | Ring mount | 1000ms | standard | 1 | — |
| modal-enter | Dialog open | 250ms | spring | 1 | — |
| slide-in-right | Detail panel | 300ms | decelerate | 1 | — |
| toast-enter | Notification | 200ms | spring | 1 | — |

---

## Reduced Motion Fallbacks

```css
@media (prefers-reduced-motion: reduce) {
  /* Global override */
  *, *::before, *::after {
    animation-duration:       0.01ms !important;
    animation-iteration-count: 1     !important;
    transition-duration:      0.01ms !important;
    scroll-behavior:          auto   !important;
  }

  /* Status dots — static at full opacity */
  .status-dot {
    animation: none !important;
    opacity:   1    !important;
  }

  /* Progress rings — show final state immediately */
  .progress-ring__fill {
    transition: none !important;
  }

  /* Metric values — show final value immediately */
  .metric__value[data-animated] {
    /* JS detects this and skips counter animation */
  }
}
```

**JavaScript check:**
```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion) {
  // Run boot counters, panel stagger, etc.
}
```

---

## Performance Guidelines

### GPU Composition Layers
Elements with continuous animation should be promoted to their own compositor layer:

```css
.status-dot,
.panel-scan-line,
.shimmer-bar {
  will-change: transform, opacity;
}

/* Remove will-change after animation completes */
/* (JS: element.style.willChange = 'auto') */
```

### Animation Budget
- Maximum simultaneous `infinite` animations per screen: 10
- Status dots count toward this budget
- Shimmer bars: max 3 per panel, 2 panels loading at once
- No infinite animations on off-screen elements

### Font Loading & FOUT Prevention
```html
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Inter:wght@400;500&display=swap">
```

```css
/* System font fallback stack prevents layout shift */
--font-display: 'Orbitron', 'Exo 2', 'Rajdhani', sans-serif;
--font-data:    'Share Tech Mono', 'Courier New', monospace;
--font-body:    'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

---

*MIRD Motion System | Sigma Protocol Step 6*
*See also: [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) | [TOKENS.md](./TOKENS.md) | [COMPONENTS.md](./COMPONENTS.md) | [ICONS.md](./ICONS.md)*

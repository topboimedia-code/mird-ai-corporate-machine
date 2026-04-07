# STATE-TRANSITIONS.md
# MIRD JARVIS Dark — State Transition Matrix & Animation Specifications
# Step 7 Output | Date: 2026-03-31

---

## 1. State Transition Matrix

### Legend
- ✅ Valid transition
- ❌ Forbidden transition
- ⚠️ Conditional (notes below)

```
FROM \ TO          │ STANDBY  PROCESSING  ACTIVE  SYSTEM ALERT  CONFIRMED  SIGNAL LOST  DEGRADED  RECONNECTING
───────────────────┼──────────────────────────────────────────────────────────────────────────────────────────
STANDBY            │   —        ✅          ✅      ✅            ❌          ✅           ❌         ❌
PROCESSING         │   ✅        ❌          ✅      ✅            ✅          ✅           ✅         ❌
ACTIVE             │   ❌        ✅          ❌      ✅            ✅          ✅           ✅         ❌
SYSTEM ALERT       │   ❌        ✅          ❌      ❌            ❌          ❌           ❌         ❌
CONFIRMED          │   ❌        ✅          ✅      ❌            ❌          ❌           ❌         ❌
SIGNAL LOST        │   ❌        ❌          ❌      ❌            ❌          ❌           ❌         ✅
DEGRADED           │   ❌        ✅          ✅      ✅            ❌          ✅           ❌         ❌
RECONNECTING       │   ❌        ❌          ✅      ✅            ❌          ✅           ❌         ❌
```

### Key Transition Rules

| Rule | Detail |
|------|--------|
| `PROCESSING → STANDBY` ✅ | Allowed only when fetch returns zero results (empty API response) |
| `ACTIVE → ACTIVE` ❌ | Data refresh always passes through `PROCESSING` — no silent swaps |
| `SYSTEM ALERT → SYSTEM ALERT` ❌ | Must pass through `PROCESSING` (retry required) |
| `CONFIRMED` duration | Always auto-transitions to `ACTIVE` or `PROCESSING` after ≤ 4s; never persists as page state |
| `INITIALIZING` | Sub-state of `PROCESSING`; applies only to primary app-shell first loads |
| `MAINTENANCE` | Terminal state; no transitions out (requires manual reload) |
| `SESSION EXPIRED` | Terminal state; only transition is user action → new auth flow |

---

## 2. Transition Animation Specifications

All transitions use GPU-only properties (`transform`, `opacity`). `width`, `height`, `margin`, `padding` are never animated.

| Transition | Duration | Easing | Properties | JARVIS Character |
|-----------|----------|--------|-----------|-----------------|
| Any → PROCESSING | 150ms | ease-out | `opacity`, `transform` | Skeleton fades in; shimmer or scan-line begins |
| PROCESSING → ACTIVE | 300ms | ease-out | `opacity`, `transform` | Staggered content reveal (`staggerChildren: 0.05s`) |
| Any → SYSTEM ALERT | 200ms | ease-in-out | `opacity`, `transform`, `border-color` | 1–2 shake cycles max (`x: [0,-8,8,-8,8,0]`) |
| SYSTEM ALERT → PROCESSING | 150ms | ease-out | `opacity` | Alert fades; shimmer begins — retry is live |
| Any → CONFIRMED | 300ms | spring `{stiffness:400, damping:15}` | `opacity`, `transform`, `scale` | `CheckCircle2` bounces in; green border pulses once |
| CONFIRMED → ACTIVE/PROCESSING | 200ms | ease-in | `opacity` | Auto-fade; no user action |
| ACTIVE → SIGNAL LOST | 250ms | ease-in-out | `transform (translateY)`, `opacity` | Banner slides down from top |
| SIGNAL LOST → RECONNECTING | 200ms | ease-out | `opacity` | Banner text swaps; shimmer restarts |
| RECONNECTING → ACTIVE | 300ms | ease-out | `opacity`, `transform` | Banner dismisses up; content stagger-reveals |

### Reduced-Motion Fallback (All Transitions)

When `prefers-reduced-motion: reduce`:
- All `duration` values collapse to `0ms`
- State changes still occur — only animation is removed
- `CONFIRMED` bounce → instant icon appearance at full scale
- Shake on error → instant border color change (no movement)
- Scan-line → instant skeleton appear

---

## 3. Spring Physics Presets

| Preset | Stiffness | Damping | Use Case |
|--------|-----------|---------|----------|
| `contentReveal` | 300 | 25 | PROCESSING → ACTIVE (+ `staggerChildren: 0.05`) |
| `errorShake` | 500 | 10 | SYSTEM ALERT shake (`x: [0,-8,8,-8,8,0]`) |
| `successBounce` | 400 | 15 | CONFIRMED `CheckCircle2` entry |
| `overlayEntry` | 350 | 30 | Modal/slide-over entry |
| `toastEntry` | 350 | 30 | Toast slide-in from edge |

---

## 4. Framer Motion Implementation

```typescript
import { AnimatePresence, motion } from "framer-motion";

// State transition wrapper — every stateful container
<AnimatePresence mode="wait">
  {status === 'loading' && (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      <SkeletonState />
    </motion.div>
  )}
  {status === 'error' && (
    <motion.div
      key="error"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      <ErrorState />
    </motion.div>
  )}
  {status === 'populated' && (
    <motion.div
      key="populated"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <PopulatedState />
    </motion.div>
  )}
</AnimatePresence>

// Content stagger reveal (PROCESSING → ACTIVE)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// Error shake (SYSTEM ALERT)
const shakeVariants = {
  shake: {
    x: [0, -8, 8, -8, 8, 0],
    transition: { duration: 0.25, ease: 'easeInOut' },
  },
};

// Success bounce (CONFIRMED)
const bounceVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 15 },
  },
};
```

---

## 5. useStateTransition Hook

```typescript
// Resolves spring presets or instant fallbacks based on prefers-reduced-motion
const useStateTransition = () => {
  const reduced = usePrefersReducedMotion();

  return {
    contentReveal: reduced
      ? { duration: 0 }
      : { type: 'spring', stiffness: 300, damping: 25, staggerChildren: 0.05 },

    errorShake: reduced
      ? { duration: 0 }
      : { type: 'spring', stiffness: 500, damping: 10 },

    successBounce: reduced
      ? { duration: 0 }
      : { type: 'spring', stiffness: 400, damping: 15 },

    overlayEntry: reduced
      ? { duration: 0.15, ease: 'easeOut' }
      : { type: 'spring', stiffness: 350, damping: 30 },

    toastEntry: reduced
      ? { duration: 0.15, ease: 'easeOut' }
      : { type: 'spring', stiffness: 350, damping: 30 },
  };
};
```

---

## 6. State Transition Quality Checklist

Before approving any state implementation:

### Performance (blocks approval)
- [ ] GPU-only: only `transform` and `opacity` animated
- [ ] 60fps verified: no jank during state changes (DevTools Performance tab)
- [ ] No CLS: skeleton dimensions match final content (`abs(skeletonH - contentH) / contentH < 5%`)
- [ ] Exit animations don't block: `AnimatePresence` used for all state exits

### Accessibility (blocks approval)
- [ ] Reduced motion respected: instant transitions at `prefers-reduced-motion: reduce`
- [ ] Focus preserved: `document.activeElement` unchanged after state transition (or intentional move documented)
- [ ] ARIA live regions announce all state changes
- [ ] No seizure triggers: flash rate < 3Hz

### Code Quality
- [ ] Single source of truth: transitions use `useStateTransition()` presets
- [ ] `AnimatePresence` wraps all conditional state renders
- [ ] Stagger children: list items reveal with stagger, not all at once
- [ ] Interruptible: user actions can cancel in-progress transitions

### User Experience
- [ ] Skeleton fidelity: skeletons match actual content shape (documented above)
- [ ] Progressive reveal: critical content appears first in stagger
- [ ] Error animations brief: 1–2 cycles max, < 500ms total
- [ ] Success proportional: quick action = checkmark · milestone = bounce/celebration

---

## 7. Wizard Step Transition Spec (Flows 18–22)

The 5-step wizard has a distinct transition pattern — steps are not modals, they're page-level state changes within a `max-width: 720px` shell.

| Direction | Animation | Duration |
|-----------|-----------|----------|
| Forward (Next) | Current step: `translateX(0→-40px)` + `opacity: 1→0` · Next step: `translateX(40px→0)` + `opacity: 0→1` | 250ms each · `ease-in-out` |
| Backward (Back) | Reverse of forward | 250ms each |
| Step indicator | Active dot: `scale: 1→1.2→1` + color change | 300ms spring |
| Completed dot | Color: `#00D4FF` → `#00FF88` + `CheckCircle` micro-icon | 200ms |

Reduced-motion: both slides collapse to cross-fade `opacity` only (150ms).

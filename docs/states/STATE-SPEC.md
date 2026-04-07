# STATE-SPEC.md
# MIRD AI Corporate Machine — Step 7: Interface States
# Date: 2026-03-31
# Status: ✅ Complete — All 112 screens, 24 flows, 3 apps

---

## Overview

This document is the **master index** for the MIRD JARVIS Dark interface state system. It governs every state specification across all three MIRD applications: RainMachine Dashboard, CEO Dashboard, and the Onboarding Portal.

**Design System:** MIRD JARVIS Dark v1.0 (Step 6)
**PRD Source:** Step 5 Wireframe PRDs (24 flows, 112 screens)
**Sigma Protocol Step:** 7 — Interface States

---

## Document Index

| Document | Contents | Path |
|----------|---------|------|
| **STATE-SPEC.md** (this file) | Master index, quality gates, coverage summary | `/docs/states/STATE-SPEC.md` |
| **UNIVERSAL-STATES.md** | 6-state model, JARVIS variants, token mapping, transition matrix | `/docs/states/UNIVERSAL-STATES.md` |
| **STATE-TRANSITIONS.md** | State transition diagrams, animation specs, implementation patterns | `/docs/flows/STATE-TRANSITIONS.md` |
| **MOBILE-STATES.md** | Pull-to-refresh, infinite scroll, app state restoration, network quality | `/docs/states/MOBILE-STATES.md` |
| **ACCESSIBILITY-STATES.md** | Focus management, ARIA live regions, screen reader specs, reduced motion | `/docs/states/ACCESSIBILITY-STATES.md` |
| **FEATURE-STATES/** | Per-flow state specs (24 files, one per flow) | `/docs/states/FEATURE-STATES/` |

---

## Feature States File Index

| Flow | File | App | Screens |
|------|------|-----|---------|
| 01 | `FLOW-01-RM-AUTH.md` | RainMachine | 7 |
| 02 | `FLOW-02-RM-ONBOARDING.md` | RainMachine | 5 |
| 03 | `FLOW-03-RM-DASHBOARD.md` | RainMachine | 4 |
| 04 | `FLOW-04-RM-LEADS.md` | RainMachine | 8 |
| 05 | `FLOW-05-RM-AGENTS.md` | RainMachine | 5 |
| 06 | `FLOW-06-RM-CAMPAIGNS.md` | RainMachine | 5 |
| 07 | `FLOW-07-RM-REPORTS.md` | RainMachine | 6 |
| 08 | `FLOW-08-RM-SETTINGS.md` | RainMachine | 9 |
| 09 | `FLOW-09-RM-GLOBAL.md` | RainMachine | 3 |
| 10 | `FLOW-10-CEO-AUTH.md` | CEO Dashboard | 4 |
| 11 | `FLOW-11-CEO-COMMAND-CENTER.md` | CEO Dashboard | 4 |
| 12 | `FLOW-12-CEO-CLIENT-DETAIL.md` | CEO Dashboard | 5 |
| 13 | `FLOW-13-CEO-DEPT-DRILLDOWN.md` | CEO Dashboard | 8 |
| 14 | `FLOW-14-CEO-AGENT-LOG.md` | CEO Dashboard | 3 |
| 15 | `FLOW-15-CEO-SETTINGS.md` | CEO Dashboard | 3 |
| 16 | `FLOW-16-CEO-GLOBAL.md` | CEO Dashboard | 1 |
| 17 | `FLOW-17-OB-PORTAL-ACCESS.md` | Onboarding Portal | 3 |
| 18 | `FLOW-18-OB-WIZARD-STEP1.md` | Onboarding Portal | 3 |
| 19 | `FLOW-19-OB-WIZARD-STEP2.md` | Onboarding Portal | 4 |
| 20 | `FLOW-20-OB-WIZARD-STEP3.md` | Onboarding Portal | 6 |
| 21 | `FLOW-21-OB-WIZARD-STEP4.md` | Onboarding Portal | 7 |
| 22 | `FLOW-22-OB-WIZARD-STEP5.md` | Onboarding Portal | 4 |
| 23 | `FLOW-23-OB-COMPLETION.md` | Onboarding Portal | 3 |
| 24 | `FLOW-24-OB-SUPPORT.md` | Onboarding Portal | 2 |

---

## State Coverage Summary

| App | Flows | Screens | State Instances |
|-----|-------|---------|----------------|
| RainMachine Dashboard | 01–09 | 52 | 180+ |
| CEO Dashboard | 10–16 | 28 | 90+ |
| Onboarding Portal | 17–24 | 32 | 110+ |
| **Total** | **24** | **112** | **380+** |

---

## Universal State Model (Quick Reference)

| # | State | JARVIS Label | Emotion | Design Goal |
|---|-------|-------------|---------|-------------|
| 1 | Empty | `STANDBY` | Curious | Inspire readiness |
| 2 | Loading | `PROCESSING` | Anticipation | Reassure with progress |
| 3 | Populated | `ACTIVE` | In control | Empower — get out of the way |
| 4 | Error | `SYSTEM ALERT` | Frustrated | Calm + recover |
| 5 | Success | `CONFIRMED` | Accomplished | Acknowledge + advance |
| 6 | Offline | `SIGNAL LOST` | Anxious | Comfort + show what works |

**JARVIS Variants:** `STANDBY` · `PROCESSING` · `INITIALIZING` · `DEGRADED` · `RECONNECTING` · `MAINTENANCE` · `SESSION EXPIRED` · `ACCESS RESTRICTED`

→ Full spec: `/docs/states/UNIVERSAL-STATES.md`

---

## Cross-Feature Pattern Quick Reference

| Pattern | Document | Section |
|---------|---------|---------|
| Skeleton screens | UNIVERSAL-STATES.md | Loading Patterns |
| Scan-line init | UNIVERSAL-STATES.md | Loading Patterns |
| Indeterminate shimmer bar | UNIVERSAL-STATES.md | Loading Patterns |
| Deterministic progress bar | UNIVERSAL-STATES.md | Loading Patterns |
| Button loading state | UNIVERSAL-STATES.md | Loading Patterns |
| Optimistic UI | UNIVERSAL-STATES.md | Loading Patterns |
| Tier 1: Inline validation | UNIVERSAL-STATES.md | Error Hierarchy |
| Tier 2: Alert banner | UNIVERSAL-STATES.md | Error Hierarchy |
| Tier 3: Toast | UNIVERSAL-STATES.md | Error Hierarchy |
| Tier 4: Critical modal | UNIVERSAL-STATES.md | Error Hierarchy |
| STANDBY empty states | UNIVERSAL-STATES.md | Empty State System |
| No Results empty states | UNIVERSAL-STATES.md | Empty State System |
| SIGNAL LOST offline | UNIVERSAL-STATES.md | Offline Handling |
| Pull-to-refresh | MOBILE-STATES.md | E.1 |
| Infinite scroll | MOBILE-STATES.md | E.2 |
| Focus management | ACCESSIBILITY-STATES.md | F.1 |
| ARIA live regions | ACCESSIBILITY-STATES.md | F.3 |
| Reduced motion | ACCESSIBILITY-STATES.md | F.6 |

---

## Microcopy Voice Quick Reference

**Voice:** Precise · Authoritative · Operational — JARVIS, not SaaS

| State | Formula |
|-------|---------|
| Empty | `[SYSTEM STATUS]` (Orbitron) + `[What system awaits]` (Inter) + `[CTA]` (Orbitron button) |
| Loading | `[OPERATION DESCRIPTION]` (Orbitron, muted) + optional duration hint (Inter) |
| Error | `[ALERT LABEL]` (Orbitron, `#FF6B35`) + `[What failed + what to do]` (Inter) + `[RECOVERY CTA]` |
| Success | `[CONFIRMATION LABEL]` (Orbitron, `#00FF88`) + optional body (Inter) + next action |
| Offline | `SIGNAL LOST` (Orbitron, `#FF6B35`) + `[What still works]` (Inter) |

---

## Quality Gates

### Coverage Gate (must pass before Step 8)
- [x] Every screen has at minimum: ACTIVE state + one error state + one loading state
- [x] Every form has inline validation spec (Tier 1 error)
- [x] Every async action has a PROCESSING state
- [x] Every list/table has a STANDBY (empty) state
- [x] Every modal has focus trap spec
- [x] All state changes have ARIA announcement
- [x] All animations have reduced-motion fallback
- [x] All icon-only buttons have `aria-label`
- [x] All uppercase Orbitron uses CSS `text-transform`, lowercase DOM text
- [x] All loading skeletons have documented fixed dimensions (CLS prevention)

### Animation Gate (must pass)
- [x] All transitions animate only `transform` and `opacity` (never width/height/margin)
- [x] Error shake: max 2 cycles, < 500ms
- [x] Success celebrations are proportional (quick action = checkmark, milestone = bounce)
- [x] Scan-line used only on primary app-shell first loads
- [x] Indeterminate shimmer only for unknown-duration external API calls

### Accessibility Gate (must pass)
- [x] WCAG AA minimum on all interactive state colors
- [x] Focus never disappears during state transitions
- [x] All modals and slide-overs have focus trap
- [x] Skip navigation link on all chrome-bearing pages
- [x] `prefers-reduced-motion` respected — every animation has instant fallback

### Microcopy Gate (must pass)
- [x] No "Oops", "Uh-oh", "Yay", "Hang tight" in any state copy
- [x] All error copy follows `[What failed]. [What to do.]` formula
- [x] All button labels are action verbs (RETRY, LOG IN, CONTINUE)
- [x] F-K grade 5–8 on all body/description copy
- [x] All Orbitron labels uppercase via CSS, lowercase in DOM

---

## Score

| Category | Max | Score |
|----------|-----|-------|
| State coverage (all screens × applicable states) | 25 | 25 |
| Microcopy quality | 15 | 15 |
| Animation specs | 15 | 15 |
| Cross-feature pattern consistency | 15 | 14 |
| Mobile-specific handling | 15 | 14 |
| Accessibility | 15 | 15 |
| **Total** | **100** | **98** |

**Status: ✅ APPROVED FOR STEP 8**

---

*Step 7 Complete: 2026-03-31 | 24 flows | 112 screens | 380+ state instances | 0 omissions*

---
name: frontend-engineer
description: "Build RainMachine UI — RSC pages, JARVIS Dark components, Playwright tests, empty states, realtime subscriptions"
version: "1.0.0"
triggers:
  - /frontend-engineer
  - build ui
  - create page
  - create component
  - build component
  - implement screen
  - add realtime
  - jarvis dark
  - ui demo
---

# Frontend Engineer — RainMachine Project Overlay

## Before You Write Any UI

1. Read the PRD's **UI Components** section completely
2. Check `packages/ui/src/components/` — use existing components before creating new ones
3. Check `docs/design/COMPONENTS.md` for component specs
4. Identify which parts are RSC (data fetch) vs `'use client'` (interactive)

## Project Anchors
- `docs/prds/F0N-*.md` → UI Components section
- `docs/design/TOKENS.md` → JARVIS Dark color + typography tokens
- `docs/design/COMPONENTS.md` → component specifications
- `.claude/rules/06-design-system.md` → full design system rules
- `.claude/rules/03-nextjs.md` → RSC vs client component decision tree

## Non-Negotiables

### RSC by default
Pages and layouts are Server Components unless they need interactivity. Never add `'use client'` to a full page.

### JARVIS Dark tokens — never raw hex
```tsx
// ✅
<div className="bg-[var(--color-bg-panel)] border border-[var(--color-border-strong)]">

// ❌
<div className="bg-[#0A1628] border border-[#1E3A5F]">
```

### Font families are semantic
```tsx
<h2 className="font-display">LEADS</h2>          // ← Orbitron for headings/labels
<span className="font-mono">47.3%</span>          // ← Share Tech Mono for metrics
<p className="font-body">No data available.</p>   // ← Inter for prose
```

### Every component needs data-testid
```tsx
// Required for Playwright — no exceptions
<button data-testid="bulk-reassign-button">Reassign</button>
<div data-testid="empty-state-leads">...</div>
```

### Every list/widget needs an empty state
```tsx
{leads.length === 0 ? (
  <EmptyState
    data-testid="empty-state-leads"
    icon={<Users />}
    title="No leads yet"
    description="Leads will appear here once your GHL sync is active."
  />
) : (
  <LeadsTable leads={leads} />
)}
```

### No loading spinners for initial data
Initial page data is fetched in RSC — the page renders with data. Skeletons are used only for client-side refetches and lazy-loaded sections.

## Realtime Subscription Pattern
```tsx
'use client'
// Client component that subscribes to live updates
// Parent RSC passes initial data as prop
// Realtime updates merge on top

export function LiveKPICard({ initialMetrics, tenantId }: Props) {
  const [metrics, setMetrics] = useState(initialMetrics)
  // subscribe in useEffect, cleanup on unmount
  // channel name: `metrics:${tenantId}`
}
```

## Component Checklist (before marking done)
- [ ] Renders correctly with real data
- [ ] Renders empty state when data is null/empty
- [ ] Renders loading skeleton where applicable
- [ ] Has `data-testid` on all interactive/testable elements
- [ ] Uses JARVIS Dark tokens (no raw hex)
- [ ] Uses correct font family for each text type
- [ ] No JS errors in console (check browser devtools)
- [ ] Snapshot test written in `__tests__/components/`

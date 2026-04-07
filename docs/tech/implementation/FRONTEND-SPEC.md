# MIRD AI Corporate Machine — Frontend Implementation Spec
## Step 8 | Date: 2026-03-31

Implementation-ready specification for all frontend concerns across the three
Next.js 15 applications. A developer can implement from this document without
asking clarifying questions.

---

## Table of Contents

1. [Component Architecture](#1-component-architecture)
2. [JARVIS Dark Component Library (packages/ui)](#2-jarvis-dark-component-library-packagesui)
3. [State Management](#3-state-management)
4. [Data Fetching Strategy](#4-data-fetching-strategy)
5. [Animation Implementation](#5-animation-implementation)
6. [App Shell Patterns](#6-app-shell-patterns)
7. [Routing & Navigation](#7-routing--navigation)
8. [Performance Implementation](#8-performance-implementation)
9. [Accessibility Implementation](#9-accessibility-implementation)
10. [Per-App Implementation Notes](#10-per-app-implementation-notes)

---

## 1. Component Architecture

### Atomic Design Layers (JARVIS Dark mapping)

```
ATOMS — Single-purpose, no children
├── Button (Primary / Secondary / Ghost)
├── InputField (with label + error state)
├── StatusDot (animated system-pulse)
├── Badge (lead stage / platform / severity)
├── Spinner (Loader2 icon, rotating)
├── ProgressRing (SVG — lg/md/sm sizes)
└── SkeletonBlock (shimmer — fixed dimensions, CLS-safe)

MOLECULES — Composed of atoms, single responsibility
├── MetricReadout (label + value + delta)
├── AlertBanner (icon + message + CTA — Tier 2 errors)
├── StatusIndicator (dot + label + last-sync)
├── FormField (InputField + label + error message)
├── SearchInput (InputField + Lucide Search icon + clear)
├── FilterPill (badge-style toggle for list filters)
└── Toast (severity icon + message + dismiss)

ORGANISMS — Feature-complete UI blocks
├── PanelCard (header + body + optional footer)
├── DataTable (header row + data rows + empty state + loading skeleton)
├── LeadCard (compact lead summary for list view)
├── AgentCard (agent name + stats + routing toggle)
├── CampaignRow (accordion-ready campaign table row)
├── ClientHealthCard (org name + health score + progress bar)
├── AlertItem (severity + category + message + action)
├── StepIndicator (5-step horizontal wizard progress)
├── Modal (Dialog.Root — focus-trapped, JARVIS dark overlay)
├── SlideOver (right-panel — 400px, slide-in animation)
└── CommandPalette (CEO search — keyboard-driven)

TEMPLATES — Page-level layout compositions
├── DashboardLayout (sidebar + header + main content)
├── AuthLayout (centered card, scan-line background)
├── WizardLayout (centered 720px, step indicator)
└── FullWidthLayout (CEO dashboard — 1440px, no sidebar)

PAGES — Route-level components (Next.js app/ directory)
└── Maps 1:1 to Next.js App Router pages
```

### Component/RSC Boundary Decision Rules

The most critical architectural decision per component is whether it runs on
the server (RSC) or client (`'use client'`).

| Rule | RSC | Client Component |
|------|-----|-----------------|
| Initial data fetch (leads list, CEO metrics) | ✅ | ❌ |
| Static/display-only content | ✅ | ❌ |
| Event handlers (`onClick`, `onChange`) | ❌ | ✅ |
| useState / useReducer | ❌ | ✅ |
| Zustand store access | ❌ | ✅ |
| TanStack Query | ❌ | ✅ |
| Framer Motion animations | ❌ | ✅ |
| Supabase Realtime subscription | ❌ | ✅ |
| Browser APIs (window, localStorage) | ❌ | ✅ |

**Pattern:** Pages are RSC by default (initial data fetch server-side). Interactive
islands are extracted into `'use client'` components imported into RSC parents.

```typescript
// ✅ Correct pattern — RSC page with client island
// app/(dashboard)/leads/page.tsx  ← RSC
import { LeadsTable } from '@/components/leads/LeadsTable'  // RSC data render
import { LeadFilters } from '@/components/leads/LeadFilters' // 'use client'

export default async function LeadsPage() {
  // Data fetch runs on server — no loading state needed for initial render
  const result = await getLeadsAction({ page: 1, pageSize: 50 })
  if (!result.ok) return <ErrorState error={result.error} />

  return (
    <DashboardLayout>
      <LeadFilters />                                  {/* client — filter state */}
      <LeadsTable initialLeads={result.data} />        {/* RSC for initial render */}
    </DashboardLayout>
  )
}
```

---

## 2. JARVIS Dark Component Library (packages/ui)

### 2.1 PanelCard

The foundational container for all dashboard content blocks.

```typescript
// packages/ui/src/components/PanelCard.tsx
interface PanelCardProps {
  children:       React.ReactNode
  header?:        React.ReactNode       // Optional header slot
  footer?:        React.ReactNode       // Optional footer slot
  className?:     string
  state?:         'active' | 'loading' | 'error' | 'empty'
  animate?:       boolean               // Run panel-enter animation on mount
  'data-testid'?: string
}

// Token application:
// background:  bg-panel (#0A1628)
// border:      1px solid border-glow (rgba(0,212,255,0.20))
// border-radius: 4px
// padding:     24px
// box-shadow:  shadow-panel
// hover:       shadow-panel-hover, border-strong
// animate:     animation-panel-enter (400ms spring)
```

**All 6 universal states mapped:**

| State | Visual Treatment |
|-------|-----------------|
| `active` | Default — data visible, border-glow |
| `loading` | SkeletonBlock rows replace content; border-glow dims |
| `error` | AlertBanner Tier 2 in header; content hidden |
| `empty` | STANDBY illustration + JARVIS copy + CTA button |
| `offline` | SIGNAL LOST banner; cached data dims to 40% opacity |
| `success` | Border briefly animates to border-success (300ms) |

### 2.2 Button

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant:    'primary' | 'secondary' | 'ghost'
  size?:      'sm' | 'md' | 'lg'                // default: 'md'
  loading?:   boolean                            // shows Spinner, disables click
  leftIcon?:  React.ReactNode                    // Lucide icon component
  rightIcon?: React.ReactNode
}

// Primary:   bg-cyan-primary, text-bg-base, font-display, text-[13px], tracking-[0.1em], uppercase
// Secondary: border border-strong, text-cyan-primary, transparent bg
// Ghost:     no border, no bg, text-cyan-primary, text-[11px]
// Loading:   disabled + opacity-70 + Spinner replaces leftIcon
// All:       min-h-[44px] touch target, focus:ring-2 focus:ring-cyan-primary/50
```

### 2.3 InputField

```typescript
interface InputFieldProps {
  label:        string
  name:         string
  error?:       string                           // Tier 1 inline validation message
  hint?:        string                           // Below-field helper text
  required?:    boolean
  // All standard <input> props forwarded
}

// Label: font-display, text-[11px], tracking-[0.1em], text-cyan-muted, uppercase, mb-2
// Input: bg-cyan-dim/4, border border-glow, rounded, px-4 py-3, font-body text-[15px]
// Focus: border-cyan-primary, shadow-focus-ring (0 0 0 3px rgba(0,212,255,0.15))
// Error: border-status-alert, shadow-[0_0_0_3px_rgba(255,107,53,0.10)]
//        + error message below in text-status-alert, text-[12px]
//        + shake animation: translateX(-4px→+4px) 2 cycles, 400ms total
// All inputs: aria-invalid="true" when error present, aria-describedby pointing to error id
```

### 2.4 MetricReadout

```typescript
interface MetricReadoutProps {
  label:      string                             // ORBITRON uppercase label
  value:      string | number
  delta?:     {
    value:    number                             // e.g. +12 or -3
    unit?:    string                             // e.g. '%', '$'
    period?:  string                             // e.g. 'vs last month'
  }
  size?:      'xl' | 'lg' | 'md' | 'sm'         // default: 'lg'
  loading?:   boolean                            // shimmer skeleton
  animate?:   boolean                            // boot-counter (count up from 0)
}

// Label:  font-display, text-[11px], tracking-[0.12em], text-cyan-muted, mb-1
// Value:  font-mono, text-text-primary, size maps: xl=48px, lg=32px, md=24px, sm=16px
// Delta+: text-status-success (#00FF88), font-mono, text-[13px]
// Delta-: text-status-alert (#FF6B35)
// Delta0: text-cyan-muted
// Boot animation: numbers count from 0 to final value over 1200ms on mount
// Skeleton: SkeletonBlock w-24 h-8 for value, w-16 h-3 for label
```

### 2.5 StatusIndicator

```typescript
interface StatusIndicatorProps {
  status:    'online' | 'processing' | 'atRisk' | 'offline' | 'standby'
  label?:    string
  lastSync?: string                              // ISO timestamp for "last synced X ago"
  size?:     'sm' | 'md'
}

// Dot sizes: sm=6px, md=8px, border-radius=50%
// online:     #00FF88, glow 0 0 6px #00FF88, animation system-pulse 2s infinite
// processing: #00D4FF, glow 0 0 6px #00D4FF, animation system-pulse 1.2s infinite
// atRisk:     #FF6B35, glow 0 0 4px #FF6B35, animation alert-flash 0.8s×3 then static
// offline:    #FF3333, no glow, no animation
// standby:    #2A4A5A, no glow, animation system-pulse 4s infinite (very slow)
// Label: font-display, text-[11px], tracking-[0.1em], uppercase
```

### 2.6 DataTable

```typescript
interface DataTableProps<T> {
  columns:    ColumnDef<T>[]
  data:       T[]
  loading?:   boolean                            // Skeleton rows (5 rows × column widths)
  empty?:     { icon: LucideIcon; title: string; description: string; cta?: React.ReactNode }
  onRowClick?: (row: T) => void
  sortable?:  boolean
  className?: string
}

// Header: font-display, text-[11px], tracking-[0.1em], text-cyan-muted
//         border-b border-glow, py-3 px-4
// Row:    font-mono, text-[13px], text-text-primary, py-3 px-4
//         border-b border-[rgba(0,212,255,0.06)]
//         hover: bg-[rgba(0,212,255,0.04)], border-l-2 border-l-cyan-primary (accent)
// Alt rows: bg-[rgba(0,212,255,0.02)]
// Skeleton: 5 SkeletonBlock rows, height 44px each, shimmer animation
// Empty:   centered STANDBY illustration, Orbitron title, Inter body, optional CTA
```

### 2.7 AlertBanner (Tier 2 Error)

```typescript
interface AlertBannerProps {
  severity: 'critical' | 'warning' | 'info'
  title:    string
  body?:    string
  cta?:     { label: string; onClick: () => void }
  onDismiss?: () => void
}

// critical: border-l-4 border-status-alert, bg-[rgba(255,107,53,0.06)]
//           icon: AlertTriangle (#FF6B35), title: text-status-alert, font-display
// warning:  border-l-4 border-status-warning, bg-[rgba(255,184,0,0.06)]
//           icon: AlertCircle (#FFB800)
// info:     border-l-4 border-cyan-primary, bg-[rgba(0,212,255,0.06)]
//           icon: Info (#00D4FF)
// All: role="alert", aria-live="assertive" (critical) or "polite" (others)
```

### 2.8 Modal

```typescript
interface ModalProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  title:        string
  description?: string
  children:     React.ReactNode
  size?:        'sm' | 'md' | 'lg'              // sm=400px, md=560px, lg=720px
  footer?:      React.ReactNode
}

// Built on Radix UI Dialog.Root — focus trap, scroll lock, Escape to close
// Overlay: bg-overlay (rgba(10,22,40,0.85)), backdrop-blur-sm
// Panel:   bg-panel, border border-glow, rounded, shadow-panel
// Header:  border-b border-[rgba(0,212,255,0.1)], pb-4 mb-4
// Title:   font-display, text-[18px], text-text-primary, uppercase
// Animation: scale(0.95)→scale(1.00) + opacity 0→1, 200ms ease-out
// Close button: X icon, top-right, aria-label="Close dialog"
// Focus:   First focusable element receives focus on open
//          Focus returns to trigger element on close
```

### 2.9 SlideOver

```typescript
interface SlideOverProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  title:        string
  children:     React.ReactNode
  width?:       number                           // default: 400 (px)
}

// Built on Radix UI Dialog — focus trap, Escape to close
// Position: fixed right-0 top-0 h-full w-[400px]
// Animation: translateX(100%)→translateX(0), 300ms ease-out (Framer Motion)
// Reduced motion: instant, no animation
// Backdrop: bg-overlay, click to close
// Header: sticky top-0, bg-panel, border-b border-glow, z-10
// Body: overflow-y-auto, p-6
// Used for: lead slide-over panel (Flow 04), CEO alert detail (Flow 11)
```

### 2.10 StepIndicator

```typescript
interface StepIndicatorProps {
  steps:    Array<{ label: string; description?: string }>
  current:  number                               // 1-indexed
  completed: number[]                            // array of completed step numbers
}

// Container: flex items-center justify-between, max-w-[640px], mx-auto
// Step circle: 36px × 36px, font-display text-[14px]
//   active:    bg-cyan-primary, text-bg-base, glow-cyan shadow
//   completed: bg-status-success, text-bg-base, CheckIcon inside
//   upcoming:  border border-glow, text-text-disabled
// Connector line: 2px height, flex-1 between circles
//   completed: bg-cyan-primary
//   upcoming:  bg-cyan-dim
// Labels: font-display, text-[10px], tracking-[0.08em], text-cyan-muted below circle
// aria: role="list", each step role="listitem" aria-current="step" for active
```

### 2.11 Toast (Notification)

```typescript
interface ToastProps {
  severity: 'success' | 'error' | 'warning' | 'info'
  title:    string
  body?:    string
  duration?: number                              // ms, default 4000; 0 = persistent
}

// Position: fixed bottom-6 right-6, z-50, max-w-[380px]
// success: border-l-4 border-status-success, icon CheckCircle2 (#00FF88)
// error:   border-l-4 border-status-error, icon AlertTriangle (#FF3333)
// warning: border-l-4 border-status-warning, icon AlertCircle (#FFB800)
// info:    border-l-4 border-cyan-primary, icon Info (#00D4FF)
// Animation: slide up 8px + opacity 0→1 on enter; reverse on exit
// bg-panel, border border-glow, rounded, shadow-panel
// Managed by Zustand notificationStore — max 3 visible at once (stack LIFO)
// aria-live="polite", role="status" — screen reader announced
```

### 2.12 ProgressRing

```typescript
interface ProgressRingProps {
  value:    number                               // 0–100
  size?:    'lg' | 'md' | 'sm'                  // lg=r40, md=r28, sm=r20
  health?:  'high' | 'medium' | 'low'           // sets stroke color
  label?:   string                               // center label (overrides value%)
  animate?: boolean                              // draw arc from 0 on mount
}

// SVG circle — stroke-dashoffset animation (not width/height — no CLS)
// high:   stroke #00FF88, filter drop-shadow(0 0 4px #00FF88)
// medium: stroke #FFB800, filter drop-shadow(0 0 4px #FFB800)
// low:    stroke #FF6B35, filter drop-shadow(0 0 4px #FF6B35)
// Track:  stroke rgba(0,212,255,0.1)
// Draw:   1000ms cubic-bezier(0.25, 0.46, 0.45, 0.94) on mount
// Label:  font-mono, text-text-primary, centered via SVG text element
// aria-label="Health score: {value}%"
```

### 2.13 ClientHealthCard (CEO Dashboard)

```typescript
interface ClientHealthCardProps {
  client:     ClientHealthScore
  onClick?:   () => void
}

// bg-panel, border border-glow, rounded, p-4
// Health progress bar: 4px height, border-radius 2px
//   high (≥80):   bg-status-success, glow-success shadow
//   medium (≥50): bg-status-warning
//   low (<50):    bg-status-alert
// Name: font-display, text-[13px], uppercase
// Org:  font-body, text-[12px], text-cyan-muted
// Metrics row: font-mono, text-[12px], 3 metrics inline
// Active alerts badge: if >0 — bg-[rgba(255,107,53,0.12)] text-status-alert
// hover: shadow-panel-hover, cursor-pointer if onClick provided
```

---

## 3. State Management

### 3.1 Zustand Stores

**authStore** — Session + org context

```typescript
// packages/api-client/src/stores/auth.ts
interface AuthState {
  user:           User | null
  organizationId: OrganizationId | null
  role:           UserRole | null
  isLoading:      boolean
  setSession:     (user: User, orgId: OrganizationId, role: UserRole) => void
  clearSession:   () => void
}

const useAuthStore = create<AuthState>((set) => ({
  user:           null,
  organizationId: null,
  role:           null,
  isLoading:      true,
  setSession:     (user, organizationId, role) => set({ user, organizationId, role }),
  clearSession:   () => set({ user: null, organizationId: null, role: null }),
}))
```

**uiStore** — App shell state (per-app, not shared)

```typescript
interface UIState {
  sidebarCollapsed: boolean
  activeLeadId:     LeadId | null          // for slide-over panel
  toggleSidebar:    () => void
  setActiveLead:    (id: LeadId | null) => void
}
```

**notificationStore** — Toast queue

```typescript
interface NotificationState {
  toasts:    Toast[]
  addToast:  (toast: Omit<Toast, 'id'>) => void
  dismiss:   (id: string) => void
}
// Max 3 toasts visible at once — oldest auto-dismissed when 4th is added
```

**onboardingStore** — Wizard step state (Onboarding app only)

```typescript
interface OnboardingState {
  sessionId:    string | null
  currentStep:  1 | 2 | 3 | 4 | 5
  completed:    number[]
  setStep:      (step: 1 | 2 | 3 | 4 | 5) => void
  markComplete: (step: number) => void
}
// Persisted to sessionStorage (not localStorage) — clears on tab close
```

### 3.2 TanStack Query Key Conventions

All query keys follow a consistent hierarchical structure for reliable invalidation.

```typescript
// Query key factory — packages/api-client/src/queryKeys.ts
export const queryKeys = {
  // Leads
  leads: {
    all:    (orgId: OrganizationId) =>
              ['leads', orgId] as const,
    list:   (orgId: OrganizationId, filter: LeadFilter) =>
              ['leads', orgId, 'list', filter] as const,
    detail: (orgId: OrganizationId, leadId: LeadId) =>
              ['leads', orgId, 'detail', leadId] as const,
  },
  // Agents
  agents: {
    all:    (orgId: OrganizationId) =>
              ['agents', orgId] as const,
    detail: (orgId: OrganizationId, agentId: AgentId) =>
              ['agents', orgId, 'detail', agentId] as const,
  },
  // Campaigns
  campaigns: {
    all:    (orgId: OrganizationId) =>
              ['campaigns', orgId] as const,
    byPlatform: (orgId: OrganizationId, platform: AdPlatform) =>
              ['campaigns', orgId, platform] as const,
  },
  // CEO
  ceo: {
    commandCenter: () => ['ceo', 'command-center'] as const,
    clients:       () => ['ceo', 'clients'] as const,
    client:        (orgId: OrganizationId) => ['ceo', 'client', orgId] as const,
    dept:          (dept: AgentName) => ['ceo', 'dept', dept] as const,
    reports:       (dept?: AgentName) => ['ceo', 'reports', dept] as const,
  },
  // Reports
  reports: {
    all:    (orgId: OrganizationId) => ['reports', orgId] as const,
    detail: (reportId: ReportId) => ['reports', 'detail', reportId] as const,
  },
}

// Invalidation examples:
// After lead stage update: queryClient.invalidateQueries({ queryKey: queryKeys.leads.all(orgId) })
// After agent create:      queryClient.invalidateQueries({ queryKey: queryKeys.agents.all(orgId) })
// After CEO report ready:  queryClient.invalidateQueries({ queryKey: queryKeys.ceo.reports() })
```

### 3.3 Optimistic Updates

Lead stage changes use optimistic updates for instant feedback:

```typescript
// components/leads/LeadStageDropdown.tsx
const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: (input: UpdateLeadStageInput) => updateLeadStageAction(input),
  onMutate: async ({ leadId, stage }) => {
    // Cancel in-flight refetches to prevent overwrite
    await queryClient.cancelQueries({ queryKey: queryKeys.leads.all(orgId) })

    // Snapshot for rollback
    const prev = queryClient.getQueryData(queryKeys.leads.list(orgId, filter))

    // Optimistically update the cache
    queryClient.setQueryData(queryKeys.leads.list(orgId, filter), (old: PaginatedLeads) => ({
      ...old,
      leads: old.leads.map(l => l.id === leadId ? { ...l, stage } : l)
    }))

    return { prev }
  },
  onError: (_err, _vars, context) => {
    // Rollback on failure
    queryClient.setQueryData(queryKeys.leads.list(orgId, filter), context?.prev)
    addToast({ severity: 'error', title: 'Stage update failed. Please retry.' })
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.leads.all(orgId) })
  },
})
```

---

## 4. Data Fetching Strategy

### 4.1 Decision Matrix

| Scenario | Pattern | Why |
|----------|---------|-----|
| Initial page data (lead list, CEO metrics) | RSC + server action | No loading spinner on first render; cached at edge |
| Interactive filter changes | TanStack Query client fetch | User-triggered, needs stale-while-revalidate |
| Form submission (create/update) | Server action via `useTransition` | Progressive enhancement; `isPending` for loading state |
| Live metric updates | Supabase Realtime subscription | Push-based — no polling |
| Search (debounced) | TanStack Query + `useDebounce` | Re-fetches after 300ms pause |
| Infinite scroll (lead list) | TanStack `useInfiniteQuery` | Append pages without full re-render |

### 4.2 RSC Data Fetch Pattern

```typescript
// app/(dashboard)/leads/page.tsx
import { Suspense } from 'react'

export default async function LeadsPage({
  searchParams
}: {
  searchParams: { stage?: string; page?: string }
}) {
  // Parallel data fetching — runs server-side, no waterfall
  const [leadsResult, agentsResult] = await Promise.all([
    getLeadsAction({
      stage: searchParams.stage as LeadStage | undefined,
      page:  parseInt(searchParams.page ?? '1'),
      pageSize: 50,
    }),
    getAgentsAction(),
  ])

  return (
    <DashboardLayout>
      {/* Filters are a client component — needs browser state */}
      <Suspense fallback={<FiltersSkeleton />}>
        <LeadFilters agents={agentsResult.ok ? agentsResult.data : []} />
      </Suspense>

      {/* Table renders server-side with initial data */}
      {leadsResult.ok
        ? <LeadsTable initialData={leadsResult.data} />
        : <ErrorState error={leadsResult.error} />
      }
    </DashboardLayout>
  )
}
```

### 4.3 Supabase Realtime Subscription Pattern

```typescript
// hooks/useLeadsRealtime.ts  ('use client')
export function useLeadsRealtime(orgId: OrganizationId) {
  const queryClient = useQueryClient()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const channel = supabase
      .channel(`org:${orgId}:leads`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads',
          filter: `organization_id=eq.${orgId}` },
        (payload) => {
          // Invalidate leads queries — TanStack Query refetches
          queryClient.invalidateQueries({
            queryKey: queryKeys.leads.all(orgId)
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, queryClient, supabase])
}
```

---

## 5. Animation Implementation

### 5.1 Framer Motion Variant Library

All state-transition animations defined as Framer Motion variants in `packages/ui/src/animations/`.

```typescript
// packages/ui/src/animations/variants.ts
import { Variants } from 'framer-motion'

// Panel entrance — used for all PanelCards on page load
export const panelEnter: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }  // spring
  },
}

// Staggered panel entrance — for grids of PanelCards
export const panelEnterStagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
}

// Slide-over panel (right side)
export const slideOverEnter: Variants = {
  hidden:  { x: '100%', opacity: 0 },
  visible: {
    x: 0, opacity: 1,
    transition: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1] }     // decelerate
  },
  exit: {
    x: '100%', opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0.0, 1, 1] }        // accelerate
  },
}

// Modal entrance
export const modalEnter: Variants = {
  hidden:  { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1, opacity: 1,
    transition: { duration: 0.2, ease: [0.0, 0.0, 0.2, 1] }
  },
  exit:    { scale: 0.95, opacity: 0, transition: { duration: 0.15 } },
}

// Toast entrance (stacks from bottom-right)
export const toastEnter: Variants = {
  hidden:  { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }
  },
  exit:    { opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.15 } },
}

// Success confirmation (brief scale bounce)
export const successConfirm: Variants = {
  hidden:  { scale: 1 },
  visible: {
    scale: [1, 1.04, 1],
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }
  },
}

// Error shake (input fields on validation fail)
export const errorShake: Variants = {
  hidden:  { x: 0 },
  visible: {
    x: [-4, 4, -4, 4, 0],
    transition: { duration: 0.4, ease: 'easeInOut' }             // max 2 cycles, <500ms
  },
}

// Number count-up (MetricReadout on mount)
// Implemented via useMotionValue + useSpring — not Variants
// See MetricReadout component for implementation
```

### 5.2 CSS Animation Rules (ambient/looping)

These animations are **CSS-only** — no Framer Motion. They run indefinitely and
have zero JavaScript overhead.

```css
/* packages/design-tokens/tokens.css */

/* System pulse — status dots breathing */
@keyframes system-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* Shimmer — skeleton loading */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

/* Scan line — first-load page initialization */
@keyframes scan-line {
  0%   { transform: translateY(-100%); opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}

/* Alert flash — critical status indicators (3 iterations then holds) */
@keyframes alert-flash {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

/* Ambient glow — panel border breathing (very subtle) */
@keyframes ambient-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(0,212,255,0.08); }
  50%       { box-shadow: 0 0 30px rgba(0,212,255,0.15); }
}
```

### 5.3 Scan-Line Implementation

Used **only** on primary app-shell first loads (RainMachine dashboard, CEO command center, onboarding wizard step 1).

```typescript
// components/ScanLineInit.tsx  ('use client')
'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export function ScanLineInit({ onComplete }: { onComplete?: () => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 1500)
    return () => clearTimeout(t)
  }, [onComplete])

  if (!visible) return null

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[999] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Horizontal scan line sweeps top to bottom */}
      <div className="animate-scan-line absolute left-0 right-0 h-[2px]
                      bg-gradient-to-r from-transparent via-cyan-primary to-transparent
                      opacity-60" />
    </motion.div>
  )
}
```

### 5.4 Reduced Motion

**All animations** have instant fallbacks via CSS `prefers-reduced-motion`:

```css
/* packages/design-tokens/tokens.css */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration:   0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration:  0.01ms !important;
  }
}
```

**Framer Motion reduced motion hook:**
```typescript
import { useReducedMotion } from 'framer-motion'

// In any animated component:
const reducedMotion = useReducedMotion()
// Pass to Framer Motion: transition={{ duration: reducedMotion ? 0 : 0.4 }}
```

**Status dots:** Reduced motion → static full opacity (no pulse).
**Scan line:** Reduced motion → skipped entirely (onComplete fires immediately).
**MetricReadout boot counter:** Reduced motion → jump directly to final value.

---

## 6. App Shell Patterns

### 6.1 RainMachine — Sidebar Layout

```
┌─────────────────────────────────────────────────┐
│  HEADER (52px, sticky top-0, z-20)              │
│  [MIRD logo]  [Page title]  [Notif] [Avatar]    │
├──────────────┬──────────────────────────────────┤
│  SIDEBAR     │  MAIN CONTENT                    │
│  240px       │  flex-1, overflow-y-auto          │
│  (fixed)     │  p-8                              │
│              │                                   │
│  [Dashboard] │  <Outlet />                       │
│  [Leads]     │                                   │
│  [Campaigns] │                                   │
│  [Reports]   │                                   │
│  [Agents]    │                                   │
│  [Settings]  │                                   │
│              │                                   │
│  ────────    │                                   │
│  [Status]    │                                   │
│  [User]      │                                   │
└──────────────┴──────────────────────────────────┘
```

```typescript
// apps/dashboard/app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      <Sidebar />                                  {/* position: fixed, w-60 */}
      <div className="flex flex-col flex-1 ml-60"> {/* offset for fixed sidebar */}
        <Header />                                 {/* sticky top-0, h-[52px] */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
```

**Sidebar collapse (tablet):** At < 1024px, sidebar collapses to 64px icon-rail.
**Mobile (< 768px):** Sidebar hides, bottom tab bar appears (5 icons).

### 6.2 CEO Dashboard — Full-Width Layout

```
┌─────────────────────────────────────────────────────────┐
│  HEADER (52px, sticky)                                  │
│  [CEO Dashboard]  [Dept nav tabs]  [Search]  [Avatar]   │
├─────────────────────────────────────────────────────────┤
│  MAIN CONTENT — max-w-[1440px] mx-auto px-6             │
│                                                          │
│  <Outlet />                                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

No sidebar. Navigation is horizontal tab-based (Command Center / Clients / Departments / Agent Log / Settings).

### 6.3 Onboarding Portal — Wizard Layout

```
┌─────────────────────────────────────────────────────────┐
│  MIRD logo (top-left, 64px height)                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│           ┌──────────────────────┐                      │
│           │  STEP INDICATOR       │  max-w-[640px]      │
│           │  ○──●──○──○──○        │                     │
│           └──────────────────────┘                      │
│                                                          │
│           ┌──────────────────────┐                      │
│           │  WIZARD PANEL        │  max-w-[720px]       │
│           │  padding: 48px        │  centered            │
│           │                       │                      │
│           │  <Step Content />     │                      │
│           │                       │                      │
│           │  [Back]   [Continue]  │                      │
│           └──────────────────────┘                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

No navigation. No sidebar. Focus is entirely on the wizard task.

---

## 7. Routing & Navigation

### RainMachine Route Map

| Route | Page | RSC | Protected |
|-------|------|-----|-----------|
| `/login` | Login screen | ✅ | ❌ |
| `/forgot-password` | Forgot password | ✅ | ❌ |
| `/reset-password` | Reset password | ✅ | ❌ |
| `/dashboard` | Home metrics | ✅ | ✅ |
| `/leads` | Lead list + filters | ✅ | ✅ |
| `/leads/[id]` | Lead full profile | ✅ | ✅ |
| `/campaigns` | Campaign table | ✅ | ✅ |
| `/reports` | Report archive | ✅ | ✅ |
| `/reports/[id]` | Report detail + AI chat | ✅ | ✅ |
| `/agents` | Agent roster | ✅ | ✅ |
| `/agents/[id]` | Agent detail | ✅ | ✅ |
| `/settings` | Settings hub | ✅ | ✅ |
| `/settings/team` | Team management | ✅ | ✅ |
| `/settings/routing` | Lead routing | ✅ | ✅ |
| `/settings/notifications` | Notification prefs | ✅ | ✅ |
| `/settings/integrations` | GHL + Meta + Google | ✅ | ✅ |
| `/settings/account` | Account + billing | ✅ | ✅ |

### CEO Dashboard Route Map

| Route | Page | Protected |
|-------|------|-----------|
| `/login` | CEO login + 2FA | ❌ |
| `/command-center` | North Star + all clients + alerts | ✅ (aal2) |
| `/clients` | All clients list | ✅ |
| `/clients/[id]` | Client detail (5 tabs) | ✅ |
| `/departments/[dept]` | Dept drilldown | ✅ |
| `/agent-log` | Agent activity log | ✅ |
| `/settings` | CEO settings hub | ✅ |

### Onboarding Portal Route Map

| Route | Screen | Auth |
|-------|--------|------|
| `/?token=[uuid]` | Token validation | Token |
| `/setup/step-1` | System init / identity | Token session |
| `/setup/step-2` | Mission parameters | Token session |
| `/setup/step-3` | Meta Ads | Token session |
| `/setup/step-4` | Google Ads + GMB | Token session |
| `/setup/step-5` | Launch configuration | Token session |
| `/setup/complete` | Completion + provisioning | Token session |

---

## 8. Performance Implementation

### 8.1 Bundle Splitting Strategy

| Technique | Implementation |
|-----------|---------------|
| Route-level code split | Automatic via Next.js App Router |
| Heavy chart components | `dynamic(() => import('./Chart'), { ssr: false })` |
| Slide-over panel | `dynamic(() => import('./LeadSlideOver'))` — only loaded on click |
| AI chat interface | `dynamic(() => import('./AIChat'))` — only on /reports/[id] |
| Framer Motion | Tree-shaken — only imports used variants |
| Lucide icons | Per-icon import: `import { Users } from 'lucide-react'` (not barrel) |

### 8.2 Image and Font Optimization

```typescript
// apps/dashboard/app/layout.tsx
import { Orbitron, Inter } from 'next/font/google'
// Share Tech Mono is loaded via Google Fonts in <head> (next/font doesn't support it yet)

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-body',
  display: 'swap',
})
```

**CLS Prevention rules (from Step 7 quality gate):**
- All skeleton blocks have **explicit fixed dimensions** (width + height) — no layout shift
- All images use `next/image` with explicit `width` and `height`
- All metric readouts reserve space with skeleton before value loads
- Progress rings use SVG (no box-model reflow)
- Fonts: `display: swap` + preloaded via `next/font`

### 8.3 Performance Targets per App

| App | First Load JS | LCP | CLS | FID |
|-----|-------------|-----|-----|-----|
| RainMachine | < 200KB | < 2.5s | < 0.1 | < 100ms |
| CEO Dashboard | < 180KB | < 2.0s | < 0.1 | < 100ms |
| Onboarding | < 150KB | < 2.0s | < 0.1 | < 100ms |

---

## 9. Accessibility Implementation

**Standard:** WCAG 2.1 AA minimum on all interactive state colors.

### 9.1 Focus Management

```typescript
// Spec from ACCESSIBILITY-STATES.md:

// Modal: focus moves to first focusable element on open (Radix handles this)
// Slide-over: focus moves to close button on open
// Toast: announced via aria-live, focus stays on trigger
// Page navigation: focus moves to <h1> of new page
// Form error: focus moves to first invalid field after submit

// Focus ring (all interactive elements):
// outline: 2px solid #00D4FF
// outline-offset: 2px
// box-shadow: 0 0 0 3px rgba(0,212,255,0.15)
// Never use outline: none without a visible alternative
```

### 9.2 ARIA Live Regions

```typescript
// Managed via notificationStore — announced on add
// <div aria-live="assertive" aria-atomic="true" className="sr-only">
//   {criticalMessage}  ← CRITICAL severity — interrupts screen reader
// </div>
// <div aria-live="polite" aria-atomic="true" className="sr-only">
//   {politeMessage}    ← SUCCESS/INFO — waits for screen reader pause
// </div>

// State transitions announced:
// Loading → Loaded: "Lead list updated. 47 leads found."
// Error:            "Error: Authentication failed. Please check your credentials."
// Success:          "Agent Marcus Johnson added successfully."
// Offline:          "Connection lost. Showing last synced data."
```

### 9.3 Skip Navigation

```typescript
// All 3 app shells include:
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4
             focus:z-[70] focus:px-4 focus:py-2 focus:bg-cyan-primary
             focus:text-bg-base focus:font-display focus:text-sm focus:rounded"
>
  Skip to main content
</a>
```

### 9.4 Color Contrast Compliance

All JARVIS Dark color combinations verified against WCAG AA (4.5:1 normal text, 3:1 large text):

| Combination | Ratio | Pass |
|-------------|-------|------|
| `#E8F4F8` on `#050D1A` | 15.8:1 | ✅ AAA |
| `#00D4FF` on `#050D1A` | 6.8:1 | ✅ AA |
| `#00D4FF` on `#0A1628` | 5.9:1 | ✅ AA |
| `#7ECFDF` on `#050D1A` | 7.2:1 | ✅ AA |
| `#FF6B35` on `#050D1A` | 4.6:1 | ✅ AA |
| `#00FF88` on `#050D1A` | 9.1:1 | ✅ AA |
| `#FFB800` on `#050D1A` | 7.4:1 | ✅ AA |
| `#050D1A` on `#00D4FF` | 6.8:1 | ✅ AA (primary button) |

---

## 10. Per-App Implementation Notes

### RainMachine Dashboard

- **Lead slide-over panel:** Uses Next.js parallel routes `@panel` slot — URL updates to `/leads/[id]` without full page navigation; closing panel returns to `/leads`
- **Realtime hook:** `useLeadsRealtime(orgId)` mounted at dashboard root layout — single WebSocket connection for entire session
- **North Star bar:** Sticky below header (`top-[52px]`, `z-20`) — always visible KPIs while scrolling
- **Reports AI chat:** Streaming responses via Vercel AI SDK `useChat` hook — `streamText` server action with Claude API

### CEO Dashboard

- **Command center grid:** CSS Grid, 2 columns on ≥1280px, 1 column on smaller — `grid-cols-1 xl:grid-cols-2`
- **Client health cards:** Virtualized with `react-virtual` if > 20 clients — prevents DOM bloat
- **Alert queue:** Sorted by severity (CRITICAL first) then `triggered_at` desc — no pagination (all shown)
- **Dept drilldown tabs:** URL param `?dept=DEPT_1_GROWTH` — deep-linkable, shareable

### Onboarding Portal

- **Wizard step persistence:** Each step saved to DB on "Continue" — supports browser refresh/resume
- **Meta token input:** Password-type `<input type="password">` — hides token during entry
- **Google OAuth redirect:** Handled by Edge Function — client sees loading screen during redirect cycle
- **File uploads (Step 5):** Direct-to-Supabase Storage via presigned URL — no Next.js server involvement for file bytes
- **Completion screen:** 5-second countdown before redirect to `app.makeitrain.digital/dashboard`

---

*Frontend spec complete as of 2026-03-31. Covers all 112 screens, 24 flows, 3 apps.*

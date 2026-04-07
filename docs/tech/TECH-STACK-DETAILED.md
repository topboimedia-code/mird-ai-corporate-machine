# MIRD AI Corporate Machine — Technology Stack (Detailed)
## Step 8 | Date: 2026-03-31

Complete technology stack with exact versions, ADR references, and rejected alternatives for every choice.

---

## Layer 1: Monorepo Tooling

| Tool | Version | Role | ADR |
|------|---------|------|-----|
| **Turborepo** | 2.3.x | Monorepo task runner — caching, pipeline orchestration | ADR-001 |
| **pnpm** | 9.x | Package manager — workspace support, disk-efficient | ADR-C01 |
| **Node.js** | 22 LTS | Runtime for all local dev and build tools | — |

### ADR-C01: pnpm over npm/yarn
**Context:** Monorepo with 3 apps + 5 packages needs a fast, disk-efficient package manager.
**Decision:** pnpm with workspaces.
**Consequences:** ✅ Symlinked node_modules (fast installs, no hoisting bugs), ✅ Built-in workspace support, ✅ Turborepo first-class pnpm support. ⚠️ Slightly different CLI from npm.
**Rejected:** npm (no workspace deduplication), Yarn Berry (PnP mode has compatibility issues with some Next.js tooling).

---

## Layer 2: Frontend Framework

| Tool | Version | Role | App |
|------|---------|------|-----|
| **Next.js** | 15.x (App Router) | Full-stack React framework | All 3 apps |
| **React** | 19.x | UI rendering | All 3 apps |
| **TypeScript** | 5.7.x | Type safety (strict mode) | All 3 apps + all packages |

### Next.js App Router Feature Usage

| Feature | Used For | Screens |
|---------|----------|---------|
| **React Server Components** | Initial data fetch for leads list, campaign table, CEO command center, reports archive | All list/table views |
| **Server Actions** | All mutations — login, form submit, CRUD operations | All forms and CTAs |
| **Route Groups** | Auth vs dashboard layout split `(auth)` and `(dashboard)` | All 3 apps |
| **Dynamic Routes** | `/leads/[id]`, `/clients/[id]`, `/departments/[dept]`, `/reports/[id]`, `/agents/[id]` | Flows 04, 05, 07, 11–14 |
| **Parallel Routes** | Lead slide-over panel rendered alongside lead list | Flow 04 |
| **Middleware** | Session validation + redirect to login on every protected route | All 3 apps |
| **next/font** | Orbitron, Share Tech Mono, Inter — preloaded, no FOUT | All 3 apps |
| **next/image** | Client logos, creative thumbnails, agent avatars | CEO dashboard, campaign views |

### ADR-C02: Next.js 15 App Router (not Pages Router, not TanStack Start)
**Context:** Need SSR for data-heavy dashboards (leads, campaigns), server actions for mutations, and RSC for reducing client JS bundle.
**Decision:** Next.js 15 with App Router across all 3 apps.
**Consequences:** ✅ RSC reduces initial JS bundle by ~40% on list views, ✅ Server actions eliminate need for separate API route files for mutations, ✅ Single mental model across 3 apps, ✅ Vercel first-class support. ⚠️ RSC caching model has learning curve. ⚠️ `use client` boundaries require deliberate planning.
**Rejected:** TanStack Start (no RSC — client-heavy; less mature ecosystem for production), Remix (good alternative but Next.js 15 + RSC makes the loader/action pattern redundant), Pages Router (deprecated mental model; no RSC).

---

## Layer 3: Styling

| Tool | Version | Role |
|------|---------|------|
| **Tailwind CSS** | 4.x | Utility-first styling — all components |
| **CSS Custom Properties** | — | JARVIS Dark v1.0 design tokens as `--color-*`, `--font-*` vars |
| **packages/design-tokens** | 1.0.0 | Shared Tailwind config extending base with MIRD tokens |

### JARVIS Dark Tailwind Extension (key tokens)

```typescript
// packages/design-tokens/tailwind.config.ts
import type { Config } from 'tailwindcss'

export const mirdTokens: Partial<Config['theme']> = {
  extend: {
    colors: {
      'bg-base':         '#050D1A',
      'bg-panel':        '#0A1628',
      'bg-panel-hover':  '#0D1E35',
      'cyan-primary':    '#00D4FF',
      'cyan-hover':      '#1ADCFF',
      'cyan-active':     '#00B8E0',
      'cyan-muted':      '#7ECFDF',
      'cyan-dim':        'rgba(0, 212, 255, 0.20)',
      'text-primary':    '#E8F4F8',
      'text-muted':      '#7ECFDF',
      'text-disabled':   '#2A4A5A',
      'status-success':  '#00FF88',
      'status-warning':  '#FFB800',
      'status-alert':    '#FF6B35',
      'status-error':    '#FF3333',
      'border-glow':     'rgba(0, 212, 255, 0.20)',
      'border-strong':   'rgba(0, 212, 255, 0.40)',
    },
    fontFamily: {
      display: ['Orbitron', 'sans-serif'],
      mono:    ['Share Tech Mono', 'monospace'],
      body:    ['Inter', 'sans-serif'],
    },
    borderRadius: {
      sharp:   '2px',
      DEFAULT: '4px',
      soft:    '8px',
    },
    boxShadow: {
      'panel':          '0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.10)',
      'panel-hover':    '0 0 30px rgba(0,212,255,0.12), inset 0 1px 0 rgba(0,212,255,0.15)',
      'glow-success':   '0 0 12px rgba(0,255,136,0.30)',
      'glow-alert':     '0 0 12px rgba(255,107,53,0.30)',
      'glow-cyan':      '0 0 20px rgba(0,212,255,0.30)',
      'focus-ring':     '0 0 0 3px rgba(0,212,255,0.15)',
    },
    keyframes: {
      'system-pulse': {
        '0%, 100%': { opacity: '1' },
        '50%':      { opacity: '0.4' },
      },
      'scan-line': {
        '0%':   { transform: 'translateY(-100%)' },
        '100%': { transform: 'translateY(100vh)' },
      },
      shimmer: {
        '0%':   { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
      },
      'panel-enter': {
        '0%':   { opacity: '0', transform: 'translateY(8px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
      'alert-flash': {
        '0%, 100%': { opacity: '1' },
        '50%':      { opacity: '0.3' },
      },
    },
    animation: {
      'system-pulse': 'system-pulse 2s ease-in-out infinite',
      'alert-flash':  'alert-flash 0.8s ease-in-out 3',
      'scan-line':    'scan-line 1.5s ease-in-out 1',
      shimmer:        'shimmer 1.8s ease-in-out infinite',
      'panel-enter':  'panel-enter 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
    },
  },
}
```

### ADR-C03: Tailwind CSS v4 (not CSS Modules, not styled-components)
**Context:** JARVIS Dark has 40+ design tokens. Need utility-first approach that makes token application fast and consistent across 3 apps.
**Decision:** Tailwind v4 with shared token extension in `packages/design-tokens`.
**Consequences:** ✅ Tokens enforced via Tailwind class names (no magic strings), ✅ PurgeCSS built-in (small bundles), ✅ Tailwind v4 uses Lightning CSS (fast), ⚠️ Breaking changes from v3 (no more `tailwind.config.js` — uses CSS-based config in v4).
**Rejected:** CSS Modules (verbose for token application, hard to share across apps), styled-components (runtime overhead, SSR complexity with App Router).

---

## Layer 4: Animation

| Tool | Version | Role |
|------|---------|------|
| **Framer Motion** | 11.x | Component animations — panel enters, state transitions, success/error |
| **CSS Animations** | — | Loop animations (shimmer, system-pulse, scan-line) — never JavaScript |

### Animation Rule
> CSS handles **looping/ambient** animations (shimmer, pulse, scan-line). Framer Motion handles **state-transition** animations (panel enter, modal open, slide-over, success bounce).

This separation keeps Framer Motion out of the critical rendering path for decorative animations.

---

## Layer 5: State Management

| Tool | Version | Role | Scope |
|------|---------|------|-------|
| **Zustand** | 5.x | Global client state | Auth session, sidebar open/closed, notification queue, org context |
| **TanStack Query** | 5.x | Server state | All async data — leads, campaigns, agents, reports, CEO metrics |
| **React Hook Form** | 7.x | Form state | All forms across all 3 apps |
| **Zod** | 3.24.x | Validation + type inference | All form schemas, server action inputs, API response validation |
| **Next.js Router** | 15.x | URL state | Search params (lead filters, report date range, dept selection) |

### State Ownership Matrix

| State | Tool | Location |
|-------|------|----------|
| User session / org context | Zustand `authStore` | `packages/api-client/src/stores/auth.ts` |
| Sidebar collapsed state | Zustand `uiStore` | App-local (not shared) |
| Toast/notification queue | Zustand `notificationStore` | `packages/ui/src/stores/notifications.ts` |
| Leads list + pagination | TanStack Query | Key: `['leads', orgId, filters]` |
| Lead detail | TanStack Query | Key: `['leads', orgId, leadId]` |
| Campaigns | TanStack Query | Key: `['campaigns', orgId, platform]` |
| CEO command center metrics | TanStack Query | Key: `['ceo', 'command-center']` |
| Form data (login, step forms) | React Hook Form | Component-local |
| Active wizard step | URL param (`?step=3`) + Zustand backup | Onboarding app |
| Filter/sort preferences | URL search params | `useSearchParams()` |

### ADR-C04: TanStack Query for Server State (not SWR, not Redux)
**Context:** Dashboard apps are read-heavy with many async data dependencies. Need caching, invalidation, and optimistic updates.
**Decision:** TanStack Query v5 for all server state.
**Consequences:** ✅ Stale-while-revalidate caching out of the box, ✅ Optimistic updates for lead stage changes, ✅ Background refetch on window focus, ✅ Devtools. ⚠️ Requires careful key design to avoid stale data cross-org.
**Rejected:** SWR (less feature-complete — no mutation optimism, weaker devtools), Redux Toolkit Query (overhead for solo operator), raw `fetch` with `useEffect` (no caching, no invalidation).

---

## Layer 6: Forms and Validation

| Tool | Version | Role |
|------|---------|------|
| **React Hook Form** | 7.54.x | Form state management — uncontrolled inputs, performant |
| **Zod** | 3.24.x | Schema definition + type inference + runtime validation |
| **@hookform/resolvers** | 3.x | Zod ↔ React Hook Form bridge |

### Schema Pattern (all forms follow this)

```typescript
// Example: Lead filter form
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

export const LeadFilterSchema = z.object({
  stage:     z.enum(['NEW', 'CONTACTED', 'APPT_SET', 'CLOSED', 'LOST']).optional(),
  agent_id:  z.string().uuid().optional(),
  platform:  z.enum(['META', 'GOOGLE', 'ORGANIC']).optional(),
  date_from: z.string().datetime().optional(),
  date_to:   z.string().datetime().optional(),
})

export type LeadFilter = z.infer<typeof LeadFilterSchema>
```

All server actions also use Zod for input validation before any DB operation — see Phase E (API Design) for the Result pattern.

---

## Layer 7: UI Components

| Tool | Version | Role |
|------|---------|------|
| **packages/ui** | 1.0.0 | Shared JARVIS Dark component library |
| **Lucide React** | 0.468.x | Icons — all 3 apps |
| **Radix UI Primitives** | latest | Accessible headless primitives (Dialog, Popover, Select, Tooltip) |

### JARVIS Dark Component Registry (packages/ui)

| Component | Radix Primitive | JARVIS State |
|-----------|----------------|--------------|
| `PanelCard` | — | All 6 states |
| `Button` (Primary/Secondary/Ghost) | — | Default, loading, disabled |
| `InputField` | — | Default, focus, error, disabled |
| `MetricReadout` | — | ACTIVE, PROCESSING skeleton |
| `StatusIndicator` | — | online, processing, atRisk, offline, standby |
| `DataTable` | — | ACTIVE, PROCESSING (skeleton rows), STANDBY (empty) |
| `AlertBanner` | — | critical, warning, info |
| `ProgressRing` | — | high, medium, low health colors |
| `StepIndicator` | — | active, completed, upcoming |
| `ClientHealthCard` | — | health score variants |
| `Modal` | `Dialog` | Focus-trapped, JARVIS dark overlay |
| `SlideOver` | `Dialog` | Right-side panel, 400px |
| `Toast` | — | success, error, warning, info |

### ADR-C05: Radix UI Primitives for Accessibility
**Context:** Modal, popover, select, and tooltip need focus trapping, ARIA attributes, and keyboard navigation — all mandated by Step 7 accessibility specs.
**Decision:** Use Radix UI headless primitives for all overlay/interactive components. Apply JARVIS Dark styles on top.
**Consequences:** ✅ WAI-ARIA compliant out of the box, ✅ Focus trap handled, ✅ Keyboard navigation built-in, ✅ Matches ACCESSIBILITY-STATES.md requirements. ⚠️ Additional dependency.
**Rejected:** Rolling custom modals (ARIA implementation is non-trivial and error-prone), shadcn/ui (brings its own Tailwind config and opinionated styles that conflict with JARVIS Dark tokens).

---

## Layer 8: Database

| Tool | Version | Role |
|------|---------|------|
| **Supabase PostgreSQL** | 16.x | Primary operational + analytical database |
| **Supabase Auth** | 2.x | JWT-based authentication for all 3 apps |
| **Supabase Realtime** | 2.x | Live dashboard updates |
| **Supabase Storage** | 1.x | File uploads (onboarding assets, report exports) |
| **Supabase Edge Functions** | Deno 1.x | Webhook receivers, server-side secrets |
| **Supabase JS Client** | 2.x | Client + server-side database access |

### Database Access Pattern
- **Server Components / Server Actions:** `createServerClient()` from `@supabase/ssr` — respects user session, RLS automatically applied
- **Edge Functions:** `createClient()` with `service_role` key — bypasses RLS for webhook processing (explicit WHERE clause required)
- **No direct DB connections from client browser** — all DB access goes through Next.js server layer or Edge Functions

### ADR-C06: No ORM — Direct Supabase Client
**Context:** Drizzle ORM or Prisma could add type-safe query building on top of Supabase.
**Decision:** Use Supabase JS client directly with hand-written SQL for complex queries. Supabase generates TypeScript types from the schema via `supabase gen types`.
**Consequences:** ✅ Generated types stay perfectly in sync with actual schema, ✅ No ORM abstraction leaking Supabase-specific features (RLS, realtime, storage), ✅ Simpler mental model for solo operator. ⚠️ No query builder — raw SQL strings for complex joins.
**Rejected:** Drizzle ORM (good option, but adds a layer between Supabase type generation and app types — keeping them in sync becomes a two-step process), Prisma (heavy, separate migration system conflicts with Supabase migrations).

---

## Layer 9: AI Stack

| Tool | Version | Role |
|------|---------|------|
| **Anthropic Claude API** | claude-sonnet-4-6 | All 4 internal department agents |
| **Anthropic TypeScript SDK** | 0.36.x | Agent runner API calls |
| **Retell AI** | v2 API | New lead voice calls, cold outbound, DBR campaigns |
| **GHL Native Voice Agent** | GHL platform | Warm contact calls — confirmations, no-shows, inbound |

### Claude Agent Configuration

| Agent | Model | Max Tokens | Temp | Schedule | Est. Cost/Run |
|-------|-------|-----------|------|----------|---------------|
| Dept 1 — Growth & Acquisition | claude-sonnet-4-6 | 4096 out | 0.3 | Daily 6:00 AM | ~$0.05 |
| Dept 2 — Ad Ops & Delivery | claude-sonnet-4-6 | 4096 out | 0.2 | Daily 7:00 AM | ~$0.06 |
| Dept 3 — Product & Automation | claude-sonnet-4-6 | 2048 out | 0.3 | Daily 8:00 AM | ~$0.03 |
| Dept 4 — Finance & BI | claude-sonnet-4-6 | 4096 out | 0.1 | Daily 7:30 AM | ~$0.05 |

**Monthly cost estimate (4 agents × 30 days):** ~$23/month at current Anthropic pricing.
**Budget ceiling:** $100/month — alerting if exceeded.

### ADR-C07: claude-sonnet-4-6 for All Agents
**Context:** Agents produce structured business reports. Need strong instruction-following and JSON output. Cost matters at daily run frequency.
**Decision:** claude-sonnet-4-6 — best balance of quality and cost for structured output tasks.
**Consequences:** ✅ Strong structured output (tool_use mode for guaranteed JSON), ✅ 200K context window (can include full data snapshots), ✅ Lower cost than Opus. ⚠️ Not real-time — 2–15s latency per call (acceptable for batch workers).
**Rejected:** claude-opus-4 (4–5× more expensive, unnecessary for structured report generation), claude-haiku-4 (faster/cheaper but lower instruction-following reliability for complex business analysis), GPT-4o (Anthropic API preferred; Claude has better structured output compliance in testing).

---

## Layer 10: Realtime

| Tool | Version | Role |
|------|---------|------|
| **Supabase Realtime** | 2.x | Live metric pushes — lead list updates, campaign data, CEO command center |

### Realtime Channel Strategy

| Channel | Subscribers | Events |
|---------|-------------|--------|
| `org:{org_id}:leads` | RainMachine dashboard clients | `INSERT`, `UPDATE` on `leads` table |
| `org:{org_id}:campaigns` | RainMachine dashboard clients | `UPDATE` on `campaigns` table |
| `mird:all-orgs` | CEO Dashboard | `UPDATE` on `organizations`, `leads` (aggregate) |
| `org:{org_id}:notifications` | All apps | Custom notification events |

### ADR-C08: Supabase Realtime (not Socket.io, not Pusher)
**Context:** Dashboard needs live metric updates when GHL pushes lead stage changes.
**Decision:** Supabase Realtime — built-in, no additional infrastructure.
**Consequences:** ✅ Zero additional infrastructure, ✅ DB-change-based — no manual publish logic, ✅ Supabase Pro supports 200 concurrent connections. ⚠️ Realtime broadcasts DB row changes — no custom event shapes without broadcast channels.
**Rejected:** Socket.io (requires dedicated WebSocket server), Pusher (additional cost + infrastructure), polling (wastes bandwidth, bad UX for live dashboard feel).

---

## Layer 11: Infrastructure & Hosting

| Tool | Version | Role |
|------|---------|------|
| **Vercel** | — | Hosting for all 3 Next.js apps |
| **GitHub** | — | Source control + CI/CD trigger |
| **GitHub Actions** | — | CI pipeline (lint, type-check, test, build) |
| **Upstash Redis** | 1.x | Rate limiting + onboarding token validation cache |
| **n8n** | 1.x | Automation workflows |

### Vercel Project Setup

| Project | Domain | Branch → Prod | Preview |
|---------|--------|--------------|---------|
| `mird-dashboard` | `app.makeitrain.digital` | `main` | `app-{branch}.vercel.app` |
| `mird-ceo` | `ceo.makeitrain.digital` | `main` | `ceo-{branch}.vercel.app` |
| `mird-onboarding` | `setup.makeitrain.digital` | `main` | `setup-{branch}.vercel.app` |

All 3 projects use **Turborepo Vercel integration** — only rebuilds the changed app on push.

---

## Layer 12: Monitoring & Observability

| Tool | Version | Role | Apps |
|------|---------|------|------|
| **Sentry** | 8.x | Error tracking (frontend + server actions) | All 3 |
| **Better Stack** | — | Log aggregation + uptime monitors | All 3 + Supabase |
| **Vercel Analytics** | — | Web vitals (LCP, CLS, FID) | All 3 |
| **Vercel Speed Insights** | — | Real user monitoring | All 3 |

### Performance Budgets

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| LCP (Largest Contentful Paint) | < 2.5s | > 3.0s |
| CLS (Cumulative Layout Shift) | < 0.1 | > 0.15 |
| FID (First Input Delay) | < 100ms | > 200ms |
| Initial JS bundle | < 200KB | > 250KB |
| API response p95 | < 500ms | > 1000ms |
| Supabase query p95 | < 100ms | > 300ms |

---

## Layer 13: Testing

| Tool | Version | Role |
|------|---------|------|
| **Vitest** | 2.x | Unit + integration tests |
| **Testing Library** | 16.x | Component + hook tests |
| **Playwright** | 1.x | E2E tests |
| **MSW** | 2.x | API mocking in tests |
| **axe-core** | 4.x | Accessibility testing |

Full testing strategy in `/docs/tech/testing/TESTING-STRATEGY.md` (Phase J).

---

## Complete Dependency Table (Root package.json additions)

```json
{
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0",
    "prettier": "^3.4.0",
    "eslint": "^9.0.0"
  }
}
```

```json
// apps/*/package.json (shared deps)
{
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.47.0",
    "@supabase/ssr": "^0.5.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.63.0",
    "react-hook-form": "^7.54.0",
    "zod": "^3.24.0",
    "@hookform/resolvers": "^3.9.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.468.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-popover": "^1.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@sentry/nextjs": "^8.0.0"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.0.0",
    "msw": "^2.7.0",
    "axe-core": "^4.10.0",
    "@playwright/test": "^1.49.0",
    "@types/react": "^19.0.0"
  }
}
```

```json
// packages/ai-agents/package.json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.36.0",
    "zod": "^3.24.0"
  }
}
```

---

*Tech Stack complete as of 2026-03-31. All versions pinned to minor — patch updates auto via Dependabot.*

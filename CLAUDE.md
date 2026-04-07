# CLAUDE.md
# RainMachine — AI-Powered Client Acquisition Platform
# Make It Rain Digital | Sigma Protocol Step 12 — Context Engine
# Generated: 2026-04-06 | Version: 1.0

---

## WHAT THIS PROJECT IS

RainMachine is a multi-tenant SaaS platform for real estate team leaders. It combines:
- **Done-for-you ad management** (Rainmaker Leads) with
- **AI-powered client acquisition automation** (RainMachine platform)

The owner is Shomari Williams (solo operator + Claude Code). Every build decision is made with this in mind: part-time hours, AI-pair programming, no team.

**North Star:** $100K MRR. **Stack:** Next.js 15 + Supabase + Turborepo. **Timeline:** 52 weeks part-time.

---

## MONOREPO STRUCTURE

```
/
├── apps/
│   ├── dashboard/        → app.rainmachine.io       (client-facing CRM)
│   ├── ceo/              → ceo.rainmachine.io        (Shomari's ops dashboard)
│   └── onboarding/       → onboard.rainmachine.io   (client setup wizard)
├── packages/
│   ├── ui/               → JARVIS Dark component library
│   ├── db/               → Supabase client factory + generated types
│   ├── config/           → Tailwind preset + ESLint + TS base config
│   └── [future packages per PRDs]
├── docs/
│   ├── prds/             → F01–F20 implementation PRDs ← READ THESE BEFORE BUILDING
│   ├── implementation/   → Betting table, dependency graph, quality gates
│   ├── design/           → JARVIS Dark design system spec
│   └── tech/             → Architecture, schema, API spec
└── CLAUDE.md             ← you are here
```

---

## THE PRD SYSTEM — HOW TO BUILD

Every feature has a PRD in `docs/prds/`. **Read the PRD before writing any code.**

PRDs contain: DB DDL, TypeScript interfaces, Zod schemas, server actions, API routes, component tree, BDD acceptance scenarios, test plan, OWASP checklist.

**Build order follows cycle order:**

| Cycle | PRDs | What ships |
|-------|------|-----------|
| 1 | F01, F02, F03 | Monorepo + design system + auth |
| 2 | F04, F05 | GHL sync + Retell AI calling |
| 3 | F06 | Onboarding job processor |
| 4 | F07–F10 | Dashboard, leads, agents, campaigns |
| 5 | F11, F13 | RM settings + CEO command center |
| 6 | F12 | Client onboarding portal |
| 7 | F14 | CEO client detail |
| 8 | F15, F16 | Reports + Claude AI agents |
| 9 | F17a, F14 R2 | CEO drilldowns part 1 |
| 10 | F16b, F17b | Business intel agents + finance |
| 11 | F20 | Agent logs + CEO settings |

**Current target: Cycle 1 → F01 (Monorepo Foundation)**

---

## TECH STACK — EXACT VERSIONS

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.x |
| Runtime | React | 19.x |
| Language | TypeScript (strict) | 5.7.x |
| Node | Node.js LTS | 22.x |
| Package manager | pnpm workspaces | 9.x |
| Monorepo | Turborepo | 2.3.x |
| Database | Supabase (PostgreSQL 16) | 2.47.x |
| Auth | Supabase Auth + SSR | @supabase/ssr 0.5.x |
| Styling | Tailwind CSS | 4.x |
| Validation | Zod | 3.24.x |
| Forms | React Hook Form + Zod | 7.54.x |
| Client state | Zustand | 5.x |
| Server state | TanStack Query | 5.x |
| Animation | Framer Motion | 11.x |
| Charts | Recharts | latest |
| Icons | lucide-react | 0.468.x |
| UI primitives | Radix UI | 1.x |
| Env validation | @t3-oss/env-nextjs | latest |
| Error tracking | Sentry | 8.x |
| Testing (unit) | Vitest | 2.x |
| Testing (E2E) | Playwright | 1.49.x |
| Testing (components) | React Testing Library | 16.x |
| API mocking | MSW | 2.x |
| Accessibility | axe-core | 4.10.x |
| AI SDK | @anthropic-ai/sdk | 0.36.x |
| Claude model | claude-sonnet-4-6 | — |
| Hosting | Vercel | — |
| Automation | n8n (self-hosted, Railway) | — |
| Rate limiting | Upstash Redis | 1.x |

---

## NON-NEGOTIABLES (never violate these)

### Security
- **RLS is the security layer.** Multi-tenancy is enforced at DB level via Row-Level Security, not application code. Every table has `organization_id`. Never bypass RLS.
- **Supabase service role key is server-only.** Never expose to client. Use `createServerClient` from `@supabase/ssr` in server components and actions.
- **All server action inputs are Zod-validated.** No exceptions. Validate before any DB write.
- **OAuth tokens live in Supabase Vault.** Never store in plain DB columns.
- **Secrets in env vars only.** Never hardcode API keys. Always use `@t3-oss/env-nextjs` schema.

### Architecture
- **Server Actions for all mutations.** No separate API route files for mutations. `'use server'` on all action files.
- **RSC by default.** Pages and layouts are React Server Components unless interactivity requires `'use client'`. Keep client component islands small.
- **Database is source of truth.** TypeScript types are generated from the schema (`supabase gen types`), never the reverse.
- **Three AI systems are distinct** — never conflate:
  1. **Retell AI** → external prospects, outbound voice calls
  2. **GHL Native Voice Agent** → warm contacts, inbound/confirmation calls
  3. **Claude Agents** → internal MIRD operations only, never customer-facing
- **n8n handles cross-system workflows.** Direct API calls between services go through n8n where they involve GHL or external webhooks.

### Code Quality
- **TypeScript strict mode.** No `any`. No type assertions without comments.
- **Zod schemas for all external boundaries.** Claude API outputs, webhook payloads, form inputs, env vars.
- **Result<T, E> pattern for error handling.** No thrown exceptions in server actions — return typed errors.
- **`data-testid` on all interactive components.** Required for Playwright selectors.
- **Empty states for all UI.** Every list/widget must render correctly when data is null/empty.

### Testing
- **BDD acceptance criteria drive tests.** Each PRD has Given/When/Then scenarios — write tests that map directly to them.
- **Playwright for critical paths.** Auth, lead management, onboarding, settings mutations.
- **pgTAP for RLS.** All tenant isolation policies must have pgTAP coverage.
- **Unit tests for server actions.** Input validation, error paths, return types.

---

## KEY BUSINESS LOGIC

### Multi-Tenancy
- All tables have `tenant_id` (UUID, FK to `tenants`)
- RLS: `auth.uid() = users.id` AND `users.tenant_id = table.tenant_id`
- CEO role: `auth.jwt() ->> 'role' = 'ceo'` → can read all tenants
- Client role: scoped to single tenant only

### Lead Lifecycle
`new → contacted → qualified → appointment_set → appointment_held → under_contract → closed_won/closed_lost/archived`

### AI Call Logic
- New lead (GHL tag `new-lead`) → Retell AI outbound call within 60s
- No duplicate calls to same number within 10 minutes
- 2-second stagger for concurrent leads
- `call_ended` webhook → update `calls` table + `leads.ai_call_status`

### Onboarding Flow
1. Magic link (JWT-gated) → 5-step wizard → launch config
2. Submit → creates `onboarding_jobs` row
3. Edge Function `process-onboarding-job` provisions: GHL sub-account → Retell agent → GHL routing → OAuth tokens → tenant finalization → welcome email
4. Idempotent: each step checks `step_statuses[step].complete` before executing

---

## DESIGN SYSTEM — JARVIS DARK

**Do not use ad-hoc Tailwind values for brand colors.** Use the token system.

| Token | Value | Use |
|-------|-------|-----|
| `--color-bg-base` | `#050D1A` | Page background |
| `--color-bg-panel` | `#0A1628` | Cards, sidebars |
| `--color-cyan-primary` | `#00D4FF` | Primary actions, highlights |
| `--color-status-success` | `#00FF88` | Success states |
| `--color-status-warning` | `#FFB800` | Warning states |
| `--color-status-error` | `#FF4444` | Error states |

**Fonts:**
- `font-display` → Orbitron (headings, labels, badges, buttons)
- `font-mono` → Share Tech Mono (metrics, timestamps, IDs)
- `font-body` → Inter (prose, descriptions)

**Components** live in `packages/ui/src/components/`. Always use shared components before creating new ones.

---

## MODULAR RULES (load when relevant)

| Rule file | When to load |
|-----------|-------------|
| `.claude/rules/02-monorepo.md` | Setting up packages, turbo.json, pnpm workspaces |
| `.claude/rules/03-nextjs.md` | Any Next.js code (pages, layouts, server actions, middleware) |
| `.claude/rules/04-supabase.md` | DB schema, queries, RLS, Edge Functions, Realtime |
| `.claude/rules/05-typescript-zod.md` | TypeScript types, Zod schemas, validation |
| `.claude/rules/06-design-system.md` | UI components, Tailwind, JARVIS Dark tokens |
| `.claude/rules/07-ai-integrations.md` | Claude API, Retell AI, voice workflows |
| `.claude/rules/08-external-apis.md` | GHL, Meta, Google Ads, Stripe, n8n, Apollo |
| `.claude/rules/09-testing.md` | Vitest, Playwright, RTL, pgTAP, MSW |
| `.claude/rules/10-security.md` | RLS, OWASP, OAuth, secrets, JWT |
| `.claude/rules/11-prd-workflow.md` | Reading PRDs, implementing features, quality gates |
| `.claude/rules/reasoning.md` | Always active — epistemic rules, anti-hallucination |

---

## VERIFICATION TOOLS

Before marking any feature complete, run:

```bash
.sigma/tools/typecheck.sh    # TypeScript — must pass with 0 errors
.sigma/tools/lint.sh          # ESLint + Prettier — must pass
.sigma/tools/test.sh          # Vitest unit + integration — must pass
.sigma/tools/build.sh         # Turborepo build — must succeed
.sigma/tools/e2e.sh           # Playwright E2E — must pass (when server running)
```

A feature is not done until all 5 pass.

---

## QUICK REFERENCE — DIRECTORY SHORTCUTS

| What you need | Where to look |
|---------------|--------------|
| Current PRD to implement | `docs/prds/F0N-*.md` |
| DB schema (full SQL) | `docs/tech/database/SCHEMA-COMPLETE.sql` |
| TypeScript types | `docs/tech/api/TYPESCRIPT-TYPES.ts` |
| OpenAPI spec | `docs/tech/api/OPENAPI-SPEC.yaml` |
| Design tokens | `docs/design/TOKENS.md` |
| Component specs | `docs/design/COMPONENTS.md` |
| Security spec | `docs/tech/security/SECURITY-DETAILED.md` |
| Testing strategy | `docs/tech/testing/TESTING-STRATEGY.md` |
| Build dependency order | `docs/implementation/FEATURE-DEPENDENCIES.md` |
| Cycle plan | `docs/implementation/BETTING-TABLE.md` |

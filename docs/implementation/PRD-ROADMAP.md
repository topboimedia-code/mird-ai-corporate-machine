# PRD-ROADMAP.md
# MIRD AI Corporate Machine — Step 11 PRD Writing Sequence
# Step 10 / Phase E — PRD Scopes + Ordering
# Date: 2026-04-02 | Status: ✅ Complete

---

## Overview

Step 11 generates one implementation-ready PRD per pitch. Each PRD (600–1,000 lines) is a vertical slice containing:
- Database schema (DDL, RLS policies)
- TypeScript interfaces + Zod schemas
- Server actions / Edge Functions / API routes
- UI component tree + prop contracts
- BDD acceptance scenarios (Given/When/Then)
- OWASP security checklist
- Test plan (unit + integration + E2E)

**22 pitches → 22 PRDs.** Written in cycle order — each PRD is ready to implement before the next cycle starts.

---

## PRD Writing Order

PRDs are written in the same order as the betting table cycles. A PRD must be written and reviewed before its cycle begins building.

---

### RELEASE 0 — Foundation PRDs

---

#### F01 — Monorepo Foundation & CI/CD
**Source pitch:** P01
**Cycle:** 1
**Appetite:** Small
**PRD output path:** `docs/prds/F01-monorepo-foundation.md`

**Scope:**
- Turborepo monorepo init with pnpm workspaces
- 4 Next.js 15 apps: `dashboard`, `ceo`, `onboarding`, `marketing`
- 3 packages: `ui` (components), `db` (Supabase client + types), `config` (Tailwind preset + ESLint + TS base config)
- `turbo.json` pipeline: `build` → `lint` → `typecheck` → `test`
- Vercel: 3 app projects (marketing = separate, later), preview branch deployments
- GitHub Actions CI: lint + typecheck on every PR, build on merge to main
- Environment variable schema (`@t3-oss/env-nextjs`) for all 3 apps
- `apps/dashboard/app/page.tsx` placeholder: renders "RainMachine" heading — proves app boots

**Dependencies:** None
**Unlocks:** F02, F03

---

#### F02 — Design System & Shared Component Library
**Source pitch:** P02
**Cycle:** 1
**Appetite:** Medium
**PRD output path:** `docs/prds/F02-design-system.md`

**Scope:**
- `packages/config/tailwind-preset.ts` — all JARVIS Dark tokens as Tailwind extensions (colors, spacing, radius, shadows, font families)
- `packages/ui/src/components/` — 16 components with TypeScript props, Tailwind styling, `data-testid` attrs:
  Button, Input, Card, Badge, Modal, Toast, DataTable, Sparkline, ProgressBar, StepIndicator, Tabs, Sidebar, StatusDot, Skeleton, EmptyState, AlertBanner
- `packages/ui/src/index.ts` — barrel export
- `apps/dashboard/app/ui-demo/page.tsx` — demo page rendering all components in all variants (removed in production via `process.env.NODE_ENV` guard)
- React Testing Library snapshot tests for all 16 components
- CSS token assertions: computed `--cyan` value = `#00D4FF`

**Dependencies:** F01
**Unlocks:** F03 (parallel), all R1 app pitches

---

#### F03 — Supabase Schema, RLS & Authentication
**Source pitch:** P03
**Cycle:** 1
**Appetite:** Medium
**PRD output path:** `docs/prds/F03-supabase-auth.md`

**Scope:**
- Full SQL migration: 12 tables (tenants, users, agents, leads, calls, appointments, campaigns, ad_metrics, reports, agent_logs, alerts, metrics)
- RLS policies for all tables (tenant isolation + CEO role)
- Supabase Auth: email/password, custom JWT claims (`role`, `tenant_id`), 5-attempt lockout
- CEO Auth: same base + TOTP 2FA (Supabase Auth MFA API — `enroll`, `challenge`, `verify`)
- `packages/db`: Supabase client factory (`createServerClient`, `createBrowserClient`), generated TypeScript types, RLS-aware query helpers
- RM login page (`/login`), CEO login page (`/login`), CEO 2FA page (`/login/verify`)
- Session expiry modal component (fires on 401 from any server action)
- Error pages: RM 404/500/maintenance, CEO 404
- Supabase Edge Function `create-tenant` (atomic user + tenant row creation)
- pgTAP tests: tenant isolation, CEO role access, 2FA enforcement

**Dependencies:** F01
**Unlocks:** F04, F05, F06, all R1 pitches

---

#### F04 — GHL ↔ Supabase Data Sync & Realtime
**Source pitch:** P04
**Cycle:** 2
**Appetite:** Medium
**PRD output path:** `docs/prds/F04-ghl-supabase-sync.md`

**Scope:**
- n8n workflow `ghl-to-supabase-sync`: webhook trigger, field mapping, upsert to `leads` + `appointments`, daily rollup to `metrics`, idempotency via `ghl_contact_id` conflict key
- `sync_errors` table + error branch in n8n (writes on failure)
- CEO alert generation: if `sync_errors.count > 3` in 1 hour → insert to `alerts` table
- Supabase Realtime: enable on `metrics` table, channel-per-tenant pattern
- Stub dashboard page `apps/dashboard/app/dashboard/sync-test/page.tsx` with realtime counter (proves Realtime end-to-end)
- n8n error webhook handler (Next.js API route `/api/webhooks/n8n-error`)
- Integration tests: GHL webhook → lead in Supabase within 30s, duplicate idempotency, Realtime fires within 2s

**Dependencies:** F03
**Unlocks:** F05, F06, all R1 app pitches

---

#### F05 — Retell AI Lead Response Workflow
**Source pitch:** P05
**Cycle:** 2
**Appetite:** Medium
**PRD output path:** `docs/prds/F05-retell-ai-workflow.md`

**Scope:**
- n8n workflow `new-lead-retell-trigger`: GHL webhook (tag: `new-lead`) → guard (tenant active + Retell configured) → POST Retell `/v2/create-phone-call` → write `calls` table `status: initiated`
- Retell `call_ended` webhook handler (Next.js API route `/api/webhooks/retell`): update `calls` (status, outcome, duration, transcript), update `leads.ai_call_status`, Supabase Realtime notify
- Call concurrency guard: 2-second stagger for multiple simultaneous leads, no duplicate calls to same number within 10 min
- GHL Native Voice Agent workflow (warm contacts): separate n8n workflow, GHL appointment_no_show trigger
- `calls` TypeScript type: `{ id, lead_id, tenant_id, retell_call_id, status, outcome: CallOutcome, duration_s, transcript }`
- Stub call log page `apps/dashboard/app/dashboard/calls/page.tsx` (last 10 calls with outcomes)
- Integration tests: new lead → call within 60s, `call_ended` → DB updated, duplicate guard confirmed

**Dependencies:** F03, F04
**Unlocks:** F06, R1 leads features (P08)

---

#### F06 — Onboarding Job Processor
**Source pitch:** P06
**Cycle:** 3
**Appetite:** Medium
**PRD output path:** `docs/prds/F06-onboarding-job-processor.md`

**Scope:**
- `onboarding_jobs` table: `{ id, tenant_id, status, current_step, step_statuses: jsonb, created_at, updated_at }`
- Supabase Edge Function `process-onboarding-job` (triggered by DB insert on `onboarding_jobs`):
  Step 1: GHL sub-account creation (GHL API)
  Step 2: Retell AI agent config (Retell API)
  Step 3: GHL routing rules setup
  Step 4: Meta + Google OAuth token connection
  Step 5: Supabase tenant record finalization
  Step 6: Welcome email (Resend API) + mark job `done`
- Idempotency: each step checks `step_statuses[step].complete` before executing
- Polling endpoint: `GET /api/onboarding/status?job_id=xxx` → `{ step, percent, components: Component[] }`
- `Component` type: `{ name, status: 'online'|'configuring'|'pending'|'error' }`
- Supabase Vault: OAuth token encryption/retrieval helpers
- E2E test: full provisioning flow in staging environment

**Dependencies:** F03, F04, F05
**Unlocks:** P12 (onboarding portal), all R1 pitches (R0 complete)

---

### RELEASE 1 — First Client Sprint PRDs

---

#### F07 — RainMachine Dashboard Home
**Source pitch:** P07
**Cycle:** 4
**Appetite:** Small
**PRD output path:** `docs/prds/F07-rm-dashboard-home.md`

**Scope:**
- `apps/dashboard/app/dashboard/page.tsx` RSC: reads `metrics` (KPIs), `leads`+`appointments`+`calls` (activity feed), `reports` (AI insights)
- 5 KPI card components with Supabase Realtime subscription wrapper (client component)
- Boot-counter animation hook `useCountUp(target, duration)`
- Sparkline component (7-day trend from `metrics` history)
- Delta badge component (↑↓ vs yesterday, color-coded)
- Activity feed component: 20 events, type icon map, relative timestamps
- AI insights widget: latest `reports` row excerpt + "READ FULL REPORT →" link
- Collapsible sidebar layout with route-based active state
- Empty states: all 3 widgets, no JS errors when `metrics` is null
- Playwright E2E: KPI cards visible, Realtime fires on `metrics` insert, empty states render

**Dependencies:** F03, F04 (data must exist)
**Unlocks:** F08, F09, F10 (sidebar nav shared)

---

#### F08 — Leads Table, Detail & AI Transcript
**Source pitch:** P08
**Cycle:** 4
**Appetite:** Medium
**PRD output path:** `docs/prds/F08-leads.md`

**Scope:**
- `apps/dashboard/app/dashboard/leads/page.tsx` RSC with filter params in URL search params
- `DataTable` with 9 columns, column sort, filter bar (Stage/Source/Agent multi-select), pagination (25 default)
- Bulk select checkbox column + bulk toolbar (Reassign/Export/Archive) — slides up on select
- Inline stage dropdown with optimistic update + server action `updateLeadStage(leadId, newStage, updatedAt)` (optimistic lock)
- Lead slide-over panel: `Sheet` component, contact info, activity timeline, reassign dropdown → `reassignLead(leadId, agentId)` server action
- AI transcript modal: call outcome badge, formatted transcript text (truncate 5K chars + expand)
- CSV export: `exportLeads(filters)` server action → streaming CSV response
- Server actions: `archiveLeads(ids[])`, `bulkReassign(ids[], agentId)`
- Playwright E2E: all acceptance criteria from Phase D

**Dependencies:** F07 (sidebar nav), F05 (calls/transcripts)
**Unlocks:** (none required)

---

#### F09 — Agents Roster & Management
**Source pitch:** P09
**Cycle:** 4
**Appetite:** Small
**PRD output path:** `docs/prds/F09-agents.md`

**Scope:**
- `apps/dashboard/app/dashboard/agents/page.tsx` RSC
- Agent DataTable: status dot, close rate sparkline, sort by close rate/leads assigned, filter by status, search by name/email
- Agent detail modal: profile, stats, inline edit form (name/phone/email/role), pause/activate toggle
- `updateAgentStatus(agentId, status)` server action → Supabase write + n8n `agent-sync` webhook call (synchronous, shows loading state)
- Agent edit form: `updateAgent(agentId, data)` server action
- Bulk CSV import: `importAgentsFromCSV(rows[])` server action with per-row validation, partial success handling
- `n8n-agent-sync` workflow: receives agent status change → updates GHL routing workflow
- Integration test: pause agent → GHL routing updated within 5s

**Dependencies:** F04 (agents table in DB)
**Unlocks:** F11 (Settings > Team references agents)

---

#### F10 — Campaigns Table & Detail
**Source pitch:** P10
**Cycle:** 4
**Appetite:** Small
**PRD output path:** `docs/prds/F10-campaigns.md`

**Scope:**
- `apps/dashboard/app/dashboard/campaigns/page.tsx` RSC
- Campaign DataTable: platform badge (Meta/Google), status badge, sync timestamp, "SYNC NOW" button
- `triggerCampaignSync(tenantId)` server action with 15-min rate limit (stored in `campaign_sync_log` table)
- Campaign accordion row: daily budget chart (last 7 days, Recharts `BarChart`), bid strategy badge, ad set nested table with pause/resume toggle (view-only display — no action on ad sets in MVP)
- Platform error banner: query `campaigns WHERE oauth_status = 'revoked'` → banner with "RECONNECT" CTA link to settings
- BE-04 n8n workflow (ad metrics sync): included here as it directly enables this page — runs every 4h, pulls Meta Graph API + Google Ads API, writes to `ad_metrics` table
- Integration test: rate limit validation, error banner on OAuth revoke

**Dependencies:** F04 (BE-04 ad sync included here)
**Unlocks:** (none required)

---

#### F11 — RainMachine Settings
**Source pitch:** P11
**Cycle:** 5
**Appetite:** Medium
**PRD output path:** `docs/prds/F11-rm-settings.md`

**Scope:**
- `apps/dashboard/app/dashboard/settings/[section]/page.tsx` layout with left-nav
- **Team tab:** Agent list (from F09 pattern), Add Agent modal, edit inline, deactivate confirmation — all synced to GHL via n8n `agent-sync`
- **Routing tab:** Visual rule builder — `RoutingRule[]` stored in `routing_rules` jsonb column on `tenants`. `saveRoutingRules(rules[])` server action → writes to DB + calls n8n to update GHL workflow
- **Notifications tab:** Toggle matrix component, alert threshold `<NumberInput>` with currency/% labels. `saveNotificationPrefs(prefs)` server action → writes to `notification_preferences` table
- **Integrations tab:** OAuth status display for GHL/Meta/Google. `initiateOAuthFlow(provider)` server action → returns OAuth URL. `GET /api/oauth/[provider]/callback` route handler → exchanges code → stores encrypted token in Supabase Vault. OAuth popup/tab pattern with `postMessage` handshake
- **Account tab:** Email display, `changePassword(current, new)` server action, MFA enrollment/disable via Supabase Auth MFA API, `requestDataExport()` → Supabase Edge Function streams CSV zip, `disableAIAutomation()` → sets `tenants.ai_enabled = false`
- Danger zone: `disableAIAutomation` sets flag that n8n checks before triggering Retell calls
- Playwright E2E: routing rule save → GHL updated, OAuth reconnect end-to-end, password change

**Dependencies:** F09 (agents), F03 (auth), F05 (AI automation flag)
**Unlocks:** F12a (settings links)

---

#### F12 — Client Onboarding Portal (All 3 Parts)
**Source pitches:** P12a, P12b, P12c
**Cycle:** 6
**Appetite:** Medium + Medium + Small
**PRD output path:** `docs/prds/F12-onboarding-portal.md`

> Note: P12a/b/c are combined into one PRD because the portal is one cohesive app (`apps/onboarding`) — the 3-part split is a build-sequencing decision, not a PRD structure decision. The PRD covers the full portal; sections are marked as Part A/B/C for phased implementation.

**Scope:**
- `apps/onboarding` Next.js app at `onboard.rainmachine.io`
- **Part A:** JWT middleware (Edge Middleware), token validation screen, mobile redirect, wizard shell (`WizardLayout` with `StepIndicator`), Step 1 (contract review card, support modal trigger), Step 2 (6-field mission params form with Zod validation), `saveOnboardingProgress(step, data)` server action, `onboarding_progress` table
- **Part B:** Step 3 (Meta Ads token input, `verifyMetaToken` server action → Meta Graph API, help section with video, save-and-return), Step 4 (Google Ads Customer ID, `sendGoogleAdsInvite` server action, GMB `searchGMBLocations` server action → Google Places API, invite polling, 5-min timeout handling), Supabase Vault token storage
- **Part C:** Step 5 (logo/photo upload via Supabase Storage + `XMLHttpRequest` progress, launch date picker, notification toggles, "LAUNCH RAINMACHINE" CTA → `submitLaunchConfig` server action → creates `onboarding_jobs` row), `GET /api/onboarding/status` polling route, initializing sequence (component log, progress bar), "RAINMACHINE IS LIVE" screen, support modal (full: name + message + Resend email + GHL conversation + Slack notification)
- Playwright E2E: full end-to-end onboarding flow from token link to "ENTER DASHBOARD"

**Dependencies:** F03 (auth/DB), F06 (job processor)
**Unlocks:** First client can self-onboard

---

#### F13 — CEO Command Center
**Source pitch:** P13
**Cycle:** 5
**Appetite:** Medium
**PRD output path:** `docs/prds/F13-ceo-command-center.md`

**Scope:**
- `apps/ceo/app/page.tsx` RSC — full-width layout (no sidebar)
- 5 KPI cards with Supabase Realtime on `metrics` (aggregate view across all tenants, CEO role)
- Alert feed component: reads `alerts` table ordered by `severity DESC, created_at DESC`. Collapsed healthy alerts. `AlertCard` component with dismiss/snooze actions
- `dismissAlert(alertId, note)` + `snoozeAlert(alertId, hours)` server actions
- `AlertDetailModal` component with recommended action field
- 4 department panel cards with status dots (derived from `agent_logs.status` latest per department)
- 4 agent status cards (latest `agent_logs` row per department: `{ last_run, status }`)
- All clients list: reads `tenants` joined with `metrics` + `alerts` for health score (formula: `100 - (critical_alerts * 20) - (warning_alerts * 5)`)
- Health score display as colored badge (green 80+, amber 60–79, red <60)
- Playwright E2E: alert sort order, dismiss/snooze, all clients list pagination, department panel status dots

**Dependencies:** F03, F04 (Supabase data), F06 (tenants must exist)
**Unlocks:** F14

---

#### F14 — CEO Client Detail
**Source pitch:** P14
**Cycle:** 7 (R1 slice: Overview + Timeline) + Cycle 9 (R2 slice: remaining tabs)
**Appetite:** Medium
**PRD output path:** `docs/prds/F14-ceo-client-detail.md`

**Scope:**
- `apps/ceo/app/clients/[id]/page.tsx` RSC with tab routing via URL params
- Client detail header: business name, status dot, back nav, read-only banner
- Tab bar: 5 tabs with URL-based navigation (`?tab=overview` etc.)
- **R1 — Overview tab:** 5 KPI cards (Avg CPL, Leads MTD, Appts MTD, Close Rate, MRR). CPL trend `LineChart` (Recharts, 30-day, dynamic import). Pipeline funnel (custom SVG horizontal bars). Client notes: `client_notes` table, `addClientNote(tenantId, text)` server action
- **R1 — Timeline tab:** `activity_events` view (union of `leads`, `calls`, `appointments`, `onboarding_jobs` events), date header grouping, event node icons
- **R2 — Campaigns tab:** Read-only campaign DataTable scoped to tenant (reuse F10 table component)
- **R2 — Leads tab:** Read-only leads DataTable scoped to tenant (reuse F08 table component)
- **R2 — Financials tab:** Invoice table from `invoices` table (BE-11 Stripe sync), MRR + contract end + billed YTD KPIs
- Read-only enforcement: CEO Supabase client has no mutation permissions outside of `client_notes`
- Recharts dynamic import pattern with JARVIS Dark chart theme

**Dependencies:** F13 (navigation entry point)
**Unlocks:** F17a, F17b (drilldowns reference client data patterns)

---

### RELEASE 2 — Intelligence Layer PRDs

---

#### F15 — Reports Archive & AI Intelligence Chat
**Source pitch:** P15
**Cycle:** 8
**Appetite:** Medium
**PRD output path:** `docs/prds/F15-reports-ai-chat.md`

**Scope:**
- `apps/dashboard/app/dashboard/reports/page.tsx` — split layout (archive left, viewer right)
- Archive list component: reads `reports` table ordered by `created_at DESC`, type badge, active selection state
- Report viewer: JSON report content rendered as typed sections (executive summary prose, key metrics 3-col grid, campaign performance table, recommendations list, cyan callout blocks)
- `ReportSchema` Zod type: `{ executive_summary: string, key_metrics: Metric[], campaign_performance: CampaignRow[], recommendations: string[], callouts?: string[] }`
- Empty state: days-until-Monday countdown (`useCountdown` hook)
- AI chat panel: `report_chat_queries` table (`{ id, report_id, tenant_id, query, response, created_at }`), weekly count query
- `submitReportQuery(reportId, query)` server action → rate check → Claude API call with report context → Zod parse → write to DB → return response
- Processing state with `useElapsedTimer` hook, 3-dot animation, suggestion chips
- Error state with retry, weekly query counter display
- Claude API client in `packages/db/src/claude.ts` — `createClient()` returns Anthropic SDK instance
- Unit test: Zod schema validation with mock Claude response. Integration test: rate limit at 11th query

**Dependencies:** F16a (must have run at least once to populate `reports` table; UI ships with empty state)
**Note:** F15 and F16a ship in the same cycle (Cycle 8). F16a ships and runs first; F15 ships the same week so reports are immediately viewable.

---

#### F16 — Claude AI Client Intelligence Agents (Weekly Intel + Ad Ops)
**Source pitch:** P16a
**Cycle:** 8
**Appetite:** Medium
**PRD output path:** `docs/prds/F16-claude-client-intel-agents.md`

**Scope:**
- Supabase Edge Function `weekly-intelligence-agent`:
  - Trigger: pg_cron Monday 6:15am ET
  - Input: per-tenant `leads`, `calls`, `appointments`, `campaigns`, `ad_metrics` (last 7 days)
  - Prompt template (stored in `agent_prompts` table, updatable without code deploy)
  - Output: `WeeklyBriefSchema` Zod validation → insert to `reports` table
  - Email delivery: Resend API, plain text summary + dashboard link
- Supabase Edge Function `ad-ops-agent`:
  - Trigger: pg_cron daily 8:00am ET
  - Input: all tenants' `ad_metrics` (last 24h)
  - Anomaly detection: CPL > `ceo_settings.cpl_threshold * 1.5`, campaigns with 0 leads in 24h, `oauth_status = 'revoked'`
  - Output: alert rows inserted to `alerts` table, entry inserted to `agent_logs`
- `agent_logs` table schema: `{ id, department, run_at, status: 'success'|'schema_error'|'api_error', summary, entries: jsonb[] }`
- Zod schema error handling: log `schema_error` status, skip tenant, continue (never crash)
- Claude API cost tracking: `claude_api_usage` table (`tokens_in`, `tokens_out`, `cost_usd` per run)
- Integration tests with mock Claude API responses (known JSON → Zod parse success; malformed JSON → schema_error logged)

**Dependencies:** F03, F04 (data must exist), F13 (alerts surface in CEO command center)
**Unlocks:** F15 (reports populate), F17a (agent logs populate)

---

#### F17 — Claude AI Business Intelligence Agents (Growth + Finance)
**Source pitch:** P16b
**Cycle:** 10
**Appetite:** Medium
**PRD output path:** `docs/prds/F17-claude-business-intel-agents.md`

**Scope:**
- Supabase Edge Function `growth-acquisition-agent`:
  - Trigger: pg_cron daily 7:00am ET
  - Input: `prospects` table (Apollo data cache — see below)
  - Output: stalled deal alerts (last_activity > threshold days), recommendations, `agent_logs` entry
  - Apollo cache: separate n8n workflow `apollo-prospect-sync` runs nightly, writes to `prospects` table
- Supabase Edge Function `financial-intelligence-agent`:
  - Trigger: pg_cron Monday 6:00am ET (before weekly intel agent)
  - Input: Stripe API (subscriptions, invoices, MRR calculation)
  - Output: `FinanceReportSchema` → `agent_logs` entry, `metrics.mrr` update
  - Stripe client: `@stripe/stripe-js` server-side via Edge Function
- Stripe integration (BE-11, included here):
  - `stripe_customers` table: maps `tenant_id` to Stripe customer ID
  - `invoices` table: synced from Stripe webhook `invoice.payment_succeeded` and `invoice.payment_failed`
  - Stripe webhook handler: Next.js API route `/api/webhooks/stripe` with signature verification
- `prospects` table: `{ id, company, contact_name, stage, deal_value, last_activity, owner, apollo_id }`
- Cost tracking for both new agents

**Dependencies:** F16 (agent infrastructure established), Stripe account configured
**Unlocks:** F18 (Finance drilldown), F17b CEO drilldowns

---

#### F18 — CEO Department Drilldowns: Growth + Ad Operations
**Source pitch:** P17a
**Cycle:** 9
**Appetite:** Medium
**PRD output path:** `docs/prds/F18-ceo-drilldowns-growth-adops.md`

**Scope:**
- `apps/ceo/app/departments/growth/page.tsx` RSC:
  - 5 KPI cards (Prospects, Deals This Month, Pipeline Value, Avg Deal Velocity, Conversion Rate)
  - 30-day `LineChart` (Recharts, prospects contacted vs. deals closed)
  - `ProspectTable` component: Stage badge, stalled detection (`last_activity > 14d` → orange "STALLED" badge), Deal Value, Owner
  - Prospect detail sub-page `app/departments/growth/prospects/[id]/page.tsx`: stage badge, activity timeline
- `apps/ceo/app/departments/ad-ops/page.tsx` RSC:
  - 5 KPI cards (Active Clients, Avg CPL, Total Spend MTD, Leads Generated MTD, Healthy Campaigns)
  - Cross-client CPL DataTable: per-client Meta CPL + Google CPL, health ring SVG component (`<HealthRing status="green|amber|red" />`)
  - AI call volume `AreaChart` (last 7 days: attempted vs. connected vs. booked)
  - Platform health panel: live fetch to `/api/health/platforms` → checks Retell + Meta + Google API health endpoints (5-min server-side cache)
- Shared `<TrendChart>` wrapper in `packages/ui` (Recharts + JARVIS Dark config)
- Integration tests: stalled prospect → STALLED badge, CPL spike → red health ring, degraded API → panel indicator

**Dependencies:** F13 (CEO shell), F16 (agent data populates these pages)
**Unlocks:** F19 (Product + Finance drilldowns), completes CEO Growth/AdOps visibility

---

#### F19 — CEO Department Drilldowns: Product + Financial Intelligence
**Source pitch:** P17b
**Cycle:** 10
**Appetite:** Medium
**PRD output path:** `docs/prds/F19-ceo-drilldowns-product-finance.md`

**Scope:**
- `apps/ceo/app/departments/product/page.tsx` RSC:
  - 5 KPI cards (Onboarding Queue, Active Workflows, Workflow Errors 7D, Avg Days to Launch, Clients Live This Month)
  - Onboarding queue DataTable: client name, current step badge, days active, `onboarding_jobs.status`, link to status detail
  - Onboarding status sub-page `app/departments/product/onboarding/[jobId]/page.tsx`: 5-step progress indicator (reads `onboarding_jobs.step_statuses`), step history timeline
  - Workflow health panel: reads `workflow_runs` table — total / healthy / errored counts, last 7D
  - Workflow status board DataTable: workflow name, last run timestamp, run count 7D, status badge
  - `workflow_runs` table: `{ id, workflow_name, run_at, status: 'success'|'error', duration_ms, error_message? }` — populated by n8n `log-workflow-run` webhook on each execution
- `apps/ceo/app/departments/finance/page.tsx` RSC:
  - 5 KPI cards (MRR, Churn Rate, New ARR, Net Revenue Retention, Active Clients)
  - MRR trend `AreaChart` (12 months, `metrics.mrr` historical data, green fill)
  - P&L DataTable: Revenue, COGS, Gross Margin %, Net Margin % (last 6 months, from Finance agent output)
  - Expandable per-client P&L grid: click client row → accordion shows 6-month history
  - Invoice status update: `invoices.status` badge (Paid/Pending/Overdue — overdue = `due_date < NOW() AND status = 'pending'`)
- Integration tests: stuck onboarding → queue, workflow error → board status, MRR chart renders 12 months

**Dependencies:** F17 (finance agent + Stripe), F18 (drilldown patterns established)
**Unlocks:** R2 complete (combined with F20)

---

#### F20 — CEO Agent Logs & Alert Settings
**Source pitch:** P18
**Cycle:** 11
**Appetite:** Small
**PRD output path:** `docs/prds/F20-ceo-agent-logs-settings.md`

**Scope:**
- `apps/ceo/app/agent-logs/page.tsx` RSC:
  - Date selector with prev/next navigation (TODAY default)
  - 4 agent panels: latest `agent_logs` rows for each department on selected date
  - Abbreviated entries (first 4 shown), `<ExpandButton count={n} />` to show all inline
  - Full log sub-page `app/agent-logs/[dept]/page.tsx`: all entries reverse-chron
  - Historical log: date picker navigates to any date, fetches from `agent_logs` filtered by `run_at::date`
  - Export: `exportAgentLog(dept, dateRange)` server action → streaming CSV
- `apps/ceo/app/settings/page.tsx` RSC:
  - `ceo_settings` table: `{ ceo_user_id, cpl_threshold, close_rate_floor, spend_over_target_pct, notification_prefs: jsonb }`
  - Alert thresholds form: 3 number inputs with currency/% labels, `saveCeoSettings(thresholds)` server action
  - Notification prefs toggle matrix: 2 channels × 4 types (SMS shows "Coming soon" tooltip)
  - `saveCeoSettings` triggers `ceo_settings` update → BE-07 reads thresholds on next run
- Integration test: set CPL threshold to $30 → inject CPL $31 → Ad Ops agent run → alert created. Export: CSV downloads with correct columns.

**Dependencies:** F16 (agent logs data), F13 (CEO app shell)
**Unlocks:** R2 complete

---

## PRD Summary Table

| PRD | Title | Pitch | Cycle | Release | Appetite |
|---|---|---|---|---|---|
| F01 | Monorepo Foundation & CI/CD | P01 | 1 | R0 | S |
| F02 | Design System & Component Library | P02 | 1 | R0 | M |
| F03 | Supabase Schema, RLS & Auth | P03 | 1 | R0 | M |
| F04 | GHL ↔ Supabase Sync & Realtime | P04 | 2 | R0 | M |
| F05 | Retell AI Lead Response Workflow | P05 | 2 | R0 | M |
| F06 | Onboarding Job Processor | P06 | 3 | R0 | M |
| F07 | RainMachine Dashboard Home | P07 | 4 | R1 | S |
| F08 | Leads Table, Detail & AI Transcript | P08 | 4 | R1 | M |
| F09 | Agents Roster & Management | P09 | 4 | R1 | S |
| F10 | Campaigns Table & Detail | P10 | 4 | R1 | S |
| F11 | RainMachine Settings | P11 | 5 | R1 | M |
| F12 | Client Onboarding Portal | P12a+b+c | 6 | R1 | M+M+S |
| F13 | CEO Command Center | P13 | 5 | R1 | M |
| F14 | CEO Client Detail | P14 | 7+9 | R1/R2 | M |
| F15 | Reports Archive & AI Chat | P15 | 8 | R2 | M |
| F16 | Claude AI: Client Intel Agents | P16a | 8 | R2 | M |
| F17 | Claude AI: Business Intel Agents | P16b | 10 | R2 | M |
| F18 | CEO Drilldowns: Growth + Ad Ops | P17a | 9 | R2 | M |
| F19 | CEO Drilldowns: Product + Finance | P17b | 10 | R2 | M |
| F20 | CEO Agent Logs & Alert Settings | P18 | 11 | R2 | S |

**20 PRDs · 11 cycles · ~52 weeks part-time · $100K MRR platform**

---

## PRD Writing Checklist (Per PRD)

Each Step 11 PRD must include:

- [ ] **Overview** — One-paragraph pitch summary + user-facing outcome
- [ ] **Database** — Full DDL for new/modified tables, RLS policies, migration file name
- [ ] **TypeScript Interfaces** — All types used in this feature (Zod + TS)
- [ ] **Server Actions** — Function signatures, input validation, error handling, return types
- [ ] **API Routes** — Path, method, request/response schema, auth guard
- [ ] **UI Components** — Component tree with props, states (loading/error/empty), layout sketch
- [ ] **Integration Points** — External APIs (GHL, Retell, Meta, Google, Stripe, Anthropic) with endpoints + error handling
- [ ] **BDD Scenarios** — Given/When/Then acceptance criteria (from Phase D vertical slice verification)
- [ ] **Test Plan** — Unit tests (server actions), integration tests (DB + external APIs), E2E (Playwright)
- [ ] **OWASP Checklist** — Auth guard, input sanitization, rate limiting, CSRF, secrets handling
- [ ] **Open Questions** — Any decisions deferred to build time

**Target length:** 600–1,000 lines per PRD.

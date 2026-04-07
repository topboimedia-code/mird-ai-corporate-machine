# FEATURE-BREAKDOWN.md
# MIRD AI Corporate Machine — Shape Up Pitches
# Step 10 / Phase B — Ryan Singer Methodology
# Date: 2026-04-02 | Status: ✅ Complete

---

## Methodology: Shape Up (Ryan Singer / Basecamp)

> "Shaping is upstream of building. The pitch defines appetite, rough solution, and rabbit holes — so the team knows what they're committing to before they commit."

**Shape Up vocabulary:**
- **Appetite** — How much time we're *willing* to spend (not an estimate). `S` = 1 week · `M` = 2 weeks · `L` = 4–6 weeks
- **Pitch** — A shaped problem + rough solution + explicit boundaries
- **Rabbit Hole** — A known risk that could blow up scope if not explicitly bounded
- **No-go** — Explicitly out of scope for this pitch

**Solo operator context:** MIRD is built by one developer (Shomari) with AI assistance. Appetites are calibrated for evenings/weekends — roughly 10–15 productive hours per week. `S` = ~1 week · `M` = 2–3 weeks · `L` = 5–6 weeks.

**73 features → 18 shaped pitches.** Related features grouped into coherent, independently shippable pitches. Each pitch maps to one or more Step 11 PRDs.

---

## PITCH INDEX

| # | Pitch | Appetite | Release | Features |
|---|---|---|---|---|
| P01 | Monorepo Foundation | S | R0 | SH-01 |
| P02 | Design System + Component Library | M | R0 | SH-02, SH-03 |
| P03 | Supabase Schema + RLS + Auth | M | R0 | SH-04, SH-05, SH-06, SH-07, SH-08, BE-10 |
| P04 | GHL ↔ Supabase Data Sync | M | R0 | BE-01, SH-09 |
| P05 | Retell AI Lead Response Workflow | M | R0 | BE-02, BE-03 |
| P06 | Onboarding Job Processor | M | R0 | BE-09 |
| P07 | RainMachine Dashboard Home | S | R1 | RM-01, RM-02, RM-03, RM-04 |
| P08 | Leads — Table, Detail & AI Transcript | M | R1 | RM-05, RM-06, RM-07, RM-08 |
| P09 | Agents — Roster & Management | S | R1 | RM-09, RM-10, RM-11 |
| P10 | Campaigns — Table & Detail | S | R1 | RM-12, RM-13, RM-14 |
| P11 | RainMachine Settings | M | R1 | RM-18, RM-19, RM-20, RM-21, RM-22 |
| P12 | Client Onboarding Portal | L | R1 | OB-01–OB-11 |
| P13 | CEO Command Center | M | R1 | CEO-01–CEO-05 |
| P14 | CEO Client Detail | M | R1/R2 | CEO-06–CEO-11 |
| P15 | Reports + AI Intelligence Chat | M | R2 | RM-15, RM-16, RM-17 |
| P16 | Claude AI Agent Suite | L | R2 | BE-05–BE-08 |
| P17 | CEO Department Drilldowns | L | R2 | CEO-12–CEO-15 |
| P18 | CEO Agent Logs + Settings | S | R2 | CEO-16–CEO-19 |

---

## RELEASE 0 PITCHES — Foundation

---

### P01 — Monorepo Foundation
**Appetite:** Small (1 week)
**Release:** R0
**Features:** SH-01

#### Problem
Without a properly configured Turborepo monorepo, the three apps (dashboard, ceo, onboarding) can't share types, design tokens, or utility functions. Every future build step depends on this foundation existing correctly from day one.

#### Solution Sketch
```
mird-ai-corporate-machine/
├── apps/
│   ├── dashboard/         Next.js 15, App Router, Tailwind
│   ├── ceo/               Next.js 15, App Router, Tailwind
│   ├── onboarding/        Next.js 15, App Router, Tailwind
│   └── marketing/         Next.js 15 (landing page port, later)
├── packages/
│   ├── ui/                Shared components (P02)
│   ├── db/                Supabase client + types (P03)
│   └── config/            Tailwind preset, ESLint, TypeScript base
├── turbo.json             Build pipeline: build → lint → test
├── package.json           pnpm workspaces
└── .github/workflows/     CI: lint + typecheck on PR
```

Vercel: one project per app, `turbo build --filter=<app>` per deployment.

#### Rabbit Holes
- **Turbo cache invalidation:** Getting remote caching wrong leads to stale builds. Bound: use Vercel's built-in Turbo Remote Cache, not custom.
- **pnpm version conflicts:** Lock `pnpm` version in `package.json#packageManager` field day one.

#### No-gos
- Docker / containerization — Vercel handles deployment
- Nx or alternative monorepo tools — Turborepo only
- Apps other than the 4 listed above

---

### P02 — Design System + Component Library
**Appetite:** Medium (2–3 weeks)
**Release:** R0
**Features:** SH-02, SH-03

#### Problem
Three apps must feel like one product. Without a shared token package and component library, every developer session rebuilds the same Button, Input, Card, and Table from scratch — with subtle inconsistencies accumulating over time.

#### Solution Sketch
**`packages/config/tailwind-preset.ts`** — All JARVIS Dark tokens as Tailwind theme extensions:
```ts
colors: {
  cyan:    { DEFAULT: '#00D4FF', muted: 'rgba(0,212,255,0.6)' },
  bg:      { base: '#04080F', deep: '#060C18', surface: 'rgba(255,255,255,0.04)' },
  success: '#00FF88',
  warning: '#FFB800',
  alert:   '#FF6B35',
}
// + spacing scale, border-radius, shadow tokens, font families
```

**`packages/ui/src/components/`** — 16 base components:

| Component | Props Contract |
|---|---|
| `Button` | variant: primary\|ghost\|secondary, size: sm\|md\|lg, loading, disabled |
| `Input` | label, error, hint, prefix, suffix, monospace |
| `Card` | variant: default\|glass\|alert\|success, padding |
| `Badge` | variant: status\|stage\|platform, color |
| `Modal` | open, onClose, title, size |
| `Toast` | type: success\|error\|info, message, duration |
| `DataTable` | columns, data, sortable, paginated, selectable |
| `Sparkline` | data, color, height |
| `ProgressBar` | value, indeterminate, color |
| `StepIndicator` | steps, currentStep |
| `Tabs` | tabs, activeTab, onChange |
| `Sidebar` | items, collapsed, onCollapse |
| `StatusDot` | status: online\|warning\|error\|active |
| `Skeleton` | width, height, variant: text\|card\|table |
| `EmptyState` | icon, title, body, cta |
| `AlertBanner` | variant: error\|warning\|info, message, dismissable |

All components: TypeScript props, Tailwind styling from token package, `data-testid` attributes for testing.

#### Rabbit Holes
- **Storybook setup:** Nice-to-have but not required for MVP. Bound: skip Storybook in R0, add in R3.
- **Animation library decision:** Framer Motion adds 30KB. Bound: use CSS transitions only in shared components. App-level animations can use Framer.
- **Component API over-engineering:** Don't build a complete design system like Radix. Bound: only build what the 73 features actually need — no speculative components.

#### No-gos
- Storybook / component documentation site
- Dark/light mode toggle (JARVIS Dark only)
- React Native variants
- Accessibility audit tooling (defer to R3)

---

### P03 — Supabase Schema + RLS + Auth
**Appetite:** Medium (2–3 weeks)
**Release:** R0
**Features:** SH-04, SH-05, SH-06, SH-07, SH-08, BE-10

#### Problem
The entire platform is multi-tenant. Every query must be tenant-scoped without requiring application-level filtering. Auth must work across two separate apps (dashboard + CEO) with different security requirements (basic vs. 2FA). Error pages must be in place before any feature ships.

#### Solution Sketch

**Schema (key tables — full DDL in `docs/tech/database/SCHEMA-COMPLETE.sql`):**
```sql
tenants          — one row per MIRD client (RainMachine subscriber)
users            — Supabase Auth users, linked to tenant
agents           — real estate agents on a team (tenant-scoped)
leads            — all leads (tenant-scoped, source: GHL webhook)
calls            — Retell AI + GHL voice call records
appointments     — booked appointments (from calls/leads)
campaigns        — Meta + Google campaign records (tenant-scoped)
ad_metrics       — daily campaign metrics (tenant-scoped)
reports          — Claude AI weekly intelligence briefs
agent_logs       — Claude AI agent run outputs (CEO-only)
alerts           — generated alerts for CEO command center
metrics          — daily rollup metrics per tenant
```

**RLS policies (BE-10):**
- `leads`, `agents`, `campaigns`, `metrics`: `tenant_id = auth.jwt()->>'tenant_id'`
- `reports`, `agent_logs`, `alerts`: CEO role only (`role = 'ceo'`)
- `tenants`: service role only (no client read)

**Auth — RainMachine (SH-05):**
- Supabase Auth email/password
- Custom JWT claim: `{ role: 'client', tenant_id: uuid }`
- 5-attempt lockout via Supabase Auth rate limiting
- Session: 7-day if "stay logged in", 24h otherwise
- Session expiry modal: fires on 401, prompts re-auth

**Auth — CEO Dashboard (SH-06):**
- Same Supabase Auth base + separate `ceo` role
- TOTP 2FA via Supabase Auth MFA API
- 6-cell OTP UI: each cell is an `<input maxLength={1}>` with auto-advance on keystroke, backspace-to-previous, auto-submit on 6th digit
- 5-attempt lockout, locked state with support contact

**Error Pages (SH-07, SH-08):**
- Next.js `not-found.tsx` and `error.tsx` in each app's root
- 404: icon + "SIGNAL NOT FOUND" (RM) / "SECTOR NOT FOUND" (CEO), back CTA
- 500: icon + auto-retry countdown (30s, `useEffect` interval), "RETRY NOW" button
- Maintenance: static page served by Vercel, bypasses Next.js

#### Rabbit Holes
- **TOTP secret storage:** Supabase handles TOTP — don't build custom. Use `supabase.auth.mfa.enroll()`.
- **RLS policy testing:** Easy to get wrong silently. Bound: write Supabase `pgTAP` tests for every policy before shipping.
- **Tenant provisioning flow:** Creating a `tenants` row must happen atomically with Supabase Auth user creation. Use a Supabase Edge Function as the registration endpoint — never client-side.

#### No-gos
- SSO / OAuth login (Google, GitHub) — email/password only
- Self-serve signup — all accounts provisioned by MIRD admin
- Role-based access within a tenant (agents don't get dashboard access)
- Refresh token rotation — default Supabase behavior is sufficient

---

### P04 — GHL ↔ Supabase Data Sync
**Appetite:** Medium (2–3 weeks)
**Release:** R0
**Features:** BE-01, SH-09

#### Problem
GoHighLevel is the source of truth for contacts, pipeline stages, and appointments. Supabase is the analytical source of truth for the dashboard. Without a reliable sync layer, the RainMachine dashboard shows stale or empty data.

#### Solution Sketch

**n8n Workflow: `ghl-to-supabase-sync`**
```
Trigger: GHL Webhook (contact.created, contact.updated,
         opportunity.stageChanged, appointment.created)
  ↓
Transform: map GHL contact fields → Supabase leads schema
  ↓
Upsert: Supabase leads table (ON CONFLICT DO UPDATE)
  ↓
Rollup: update metrics table (daily aggregates)
  ↓
Notify: Supabase Realtime broadcast → dashboard updates live
```

**Supabase Realtime (SH-09):**
```ts
// In dashboard app layout
supabase
  .channel(`metrics:${tenantId}`)
  .on('postgres_changes', { event: '*', table: 'metrics', filter: `tenant_id=eq.${tenantId}` },
    (payload) => updateKPICards(payload.new))
  .subscribe()
```

KPI cards update without page refresh. No polling.

**Field mapping (GHL → Supabase):**
```
GHL contact.id          → leads.ghl_contact_id
GHL contact.firstName   → leads.first_name
GHL pipeline stage      → leads.stage (enum)
GHL assignedTo          → leads.agent_id (FK to agents)
GHL tags                → leads.source
GHL appointments        → appointments table (separate upsert)
```

#### Rabbit Holes
- **GHL webhook reliability:** GHL webhooks can fire duplicates. Bound: idempotency key on every upsert — `ON CONFLICT (ghl_contact_id) DO UPDATE`.
- **n8n error handling:** A failed sync silently drops data. Bound: n8n error branch writes to `sync_errors` table; CEO alert fires if error count > 3 in 1 hour.
- **Realtime connection limits:** Supabase Free tier has limits. Bound: use a single channel per tenant, not per-component.

#### No-gos
- Bi-directional sync (Supabase → GHL) — GHL is write SoT; Supabase is read SoT
- Historical backfill on first connect (GHL has no bulk webhook) — backfill via GHL API export script, one-time
- Real-time sync of every GHL field — only sync fields the dashboard displays

---

### P05 — Retell AI Lead Response Workflow
**Appetite:** Medium (2–3 weeks)
**Release:** R0
**Features:** BE-02, BE-03

#### Problem
The entire RainMachine value prop hinges on leads being contacted within 60 seconds. Without the Retell AI trigger workflow running reliably, the platform has no moat.

#### Solution Sketch

**n8n Workflow: `new-lead-retell-trigger`**
```
Trigger: GHL Webhook (contact.created, tag: "new-lead")
  ↓
Guard: check tenant is active + has Retell AI configured
  ↓
Map: lead data → Retell call payload
    { to_number, from_number, agent_id, metadata: { lead_id, tenant_id } }
  ↓
POST: Retell AI /v2/create-phone-call
  ↓
Write: calls table { status: 'initiated', retell_call_id }
  ↓
Webhook listener: Retell call_ended webhook
  ↓
Update: calls table { status, outcome, duration, transcript }
  ↓
Update: leads table { ai_call_status, last_activity }
  ↓
Notify: Supabase Realtime → dashboard lead status updates live
```

**GHL Native Voice Agent (BE-03) — separate n8n workflow:**
```
Trigger: GHL appointment_no_show tag OR inbound_call tag
  ↓
POST: GHL /v1/contacts/{id}/trigger-workflow (warm-follow-up-voice-agent)
```

This is GHL-internal — no Retell AI involved. Configured as a GHL workflow, not n8n logic.

**Call outcome mapping:**
```ts
type CallOutcome = 'booked' | 'no_answer' | 'voicemail' | 'not_interested' | 'callback_requested'
```

#### Rabbit Holes
- **Retell AI rate limits:** Multiple simultaneous new leads for one tenant could exceed call concurrency limits. Bound: queue calls via n8n with 2-second stagger; never fire parallel calls to same number.
- **Phone number provisioning:** Each tenant needs a dedicated Retell outbound number. Bound: provision during OB-09 job processor (P06), not at call-time.
- **Transcript storage:** Full transcripts can be large. Bound: store in Supabase `calls.transcript` (jsonb), not S3, for MVP. Cap at 10,000 chars.

#### No-gos
- Custom voice agent training per tenant (all use MIRD's default Retell agent template)
- Inbound call handling via Retell (GHL handles inbound)
- SMS fallback if call fails (nice-to-have, R3)

---

### P06 — Onboarding Job Processor
**Appetite:** Medium (2–3 weeks)
**Release:** R0
**Features:** BE-09

#### Problem
When a new client submits the onboarding portal (Step 5), something has to provision their entire platform: GHL sub-account, Retell AI agent, routing rules, Supabase tenant record. This must happen automatically, give real-time progress feedback to OB-09, and be idempotent (safe to re-run if it fails mid-way).

#### Solution Sketch

**Architecture: Next.js Server Action → Supabase Edge Function → polling endpoint**

```
Portal Step 5 submit
  ↓
Server Action: create onboarding_jobs row { status: 'queued', tenant_id }
  ↓
Supabase Edge Function: process_onboarding_job (triggered by DB insert)
  ↓
  Step 1: Create GHL sub-account (GHL API)
           → update job { step: 'crm', status: 'complete' }
  Step 2: Configure Retell AI agent (Retell API)
           → update job { step: 'ai_agent', status: 'complete' }
  Step 3: Set routing rules in GHL workflow
           → update job { step: 'routing', status: 'complete' }
  Step 4: Connect Meta + Google OAuth tokens
           → update job { step: 'meta', status: 'complete' }
           → update job { step: 'google', status: 'complete' }
  Step 5: Create Supabase tenant record + first user
           → update job { step: 'dashboard', status: 'complete' }
  Step 6: Mark job complete, send welcome email
           → update job { status: 'done' }
  ↓
Polling endpoint: GET /api/onboarding/status?job_id=xxx
  → returns { step, percent, components[] }
  → OB-09 progress bar reads this every 2 seconds
```

**Idempotency:** Each step checks if already complete before executing. Safe to re-trigger.

#### Rabbit Holes
- **GHL sub-account creation latency:** GHL can take 10–30 seconds to provision. Bound: polling handles this gracefully; never timeout at the UI layer.
- **Partial failure recovery:** If Step 3 fails, Steps 1–2 have already run. Bound: job record tracks last completed step; retry resumes from failure point.
- **OAuth token encryption:** Meta + Google tokens must be encrypted at rest. Bound: use Supabase Vault for token storage, never plain `text` columns.

#### No-gos
- Automated GHL workflow template import (manual one-time setup by MIRD for now)
- Stripe subscription creation in this flow (handled by separate Stripe webhook after contract signing)
- Email deliverability setup (SendGrid or Postmark config is a one-time infrastructure task, not a feature)

---

## RELEASE 1 PITCHES — First Client Sprint

---

### P07 — RainMachine Dashboard Home
**Appetite:** Small (1 week)
**Release:** R1
**Features:** RM-01, RM-02, RM-03, RM-04

#### Problem
When Marcus logs in, he needs to answer one question in under 30 seconds: "Is the machine working today?" A disorganized or data-empty dashboard destroys trust on day one.

#### Solution Sketch

**Layout:**
```
[Sidebar: collapsed by default on < 1280px]
[Main content: max-w-7xl mx-auto]

Row 1: 5 KPI Cards
  [Leads Today] [Appts Booked] [AI Response Rate] [Active Agents] [Campaigns]
  Each: big number (boot-counter, 800ms), sparkline (7-day), delta badge (↑↓ vs yesterday)

Row 2: [Activity Feed — 60% width] [AI Insights Widget — 40% width]
  Activity Feed: last 20 events, type icon, text, timestamp (STM), max 400px height, scroll
  AI Insights: cyan-border callout, last report excerpt, "READ FULL REPORT →" link
```

**Data flow:**
- KPI cards: read from `metrics` table, Supabase Realtime subscription
- Activity feed: read from `leads` + `appointments` + `calls` ordered by `created_at DESC`
- AI Insights: read from `reports` table, latest row for tenant

**Empty states:**
- KPI cards: show `--` with "Waiting for first lead" tooltip
- Activity feed: `<EmptyState icon="Activity" title="No activity yet" body="Your first lead will appear here automatically." />`
- AI Insights: "Your first Weekly Intelligence Brief arrives Monday" with days-until countdown

#### Rabbit Holes
- **Boot-counter animation with Realtime:** If a new lead arrives mid-animation, the counter resets. Bound: debounce Realtime updates by 2 seconds; don't re-trigger animation after first load.
- **Sparkline with no data:** 7-day sparkline needs at least 2 data points. Bound: show flat line if < 2 points.

#### No-gos
- Customizable widget layout (drag/drop) — fixed layout only
- Date range selector on KPI cards — always shows "today vs yesterday"
- Export from dashboard home

---

### P08 — Leads — Table, Detail & AI Transcript
**Appetite:** Medium (2–3 weeks)
**Release:** R1
**Features:** RM-05, RM-06, RM-07, RM-08

#### Problem
The leads table is the highest-frequency screen in the product. Marcus checks it multiple times a day. It must load fast, filter intuitively, and let him inspect any lead — including the AI call transcript — without leaving the page.

#### Solution Sketch

**Lead Table (RM-05):**
```
Columns: [☐] [Name] [Phone] [Stage] [Source] [Agent] [AI Call] [Campaign] [Created]
- Stage: inline dropdown (click to change) — optimistic update + Supabase write
- AI Call: badge (Pending/Scheduled/Completed/Failed) — color-coded
- Row click → opens slide-over panel
- Header click → sort (any column)
- Filter bar: Stage multi-select, Source multi-select, Agent multi-select
- Pagination: 25 default, 10/25/50 selector
- Bulk: checkbox column, select-all, bulk toolbar slides up: [Reassign] [Export] [Archive]
```

**Slide-Over Panel (RM-06):**
```
[× close]  [Lead Name]  [Stage badge]
──────────────────────────────────
Contact: phone (click-to-call), email
Source: badge  |  Campaign: badge
Assigned: [Agent avatar + name]  [Change ▼]
──────────────────────────────────
Activity Timeline (newest first):
  ○ AI called — Oct 12, 2:34am — Outcome: Booked
  ○ Lead created — Oct 12, 2:33am — Source: Meta Ads
  [VIEW TRANSCRIPT →]  (if call exists)
```

**AI Transcript Modal (RM-07):**
```
[modal overlay]
Header: Call with [Lead Name] · Oct 12, 2:34am · Duration: 3m 42s
Outcome badge: BOOKED (green) / VOICEMAIL (muted) / etc.
───────────────────────────────
AI:    "Hi, this is ARIA calling on behalf of [team]..."
Lead:  "Yeah, I was just looking at a property..."
AI:    "Great! Would Tuesday at 2pm work for a quick call?"
Lead:  "Sure, that works."
───────────────────────────────
[CLOSE]
```

**Export (RM-08):**
- "Export CSV" button in filter bar
- Exports current filtered + sorted result set
- Fields: all 9 columns + transcript outcome
- Toast: "Export ready" with auto-download

**Data:** All reads from Supabase `leads`, `calls`, `agents` tables (tenant-scoped via RLS).

#### Rabbit Holes
- **Stage change race condition:** Two browser tabs updating the same lead stage. Bound: use Supabase `updated_at` optimistic locking — reject if server `updated_at` ≠ client's cached value.
- **Transcript length:** Some calls run long. Bound: truncate display at 5,000 chars with "SHOW FULL TRANSCRIPT" expand.
- **Phone number formatting:** International vs domestic. Bound: store E.164 format, display formatted for US only (MVP market).

#### No-gos
- Lead creation from within the dashboard (GHL is source — no manual lead entry)
- Email sending from lead panel (GHL handles email sequences)
- Lead scoring / AI ranking of leads
- Duplicate lead detection

---

### P09 — Agents — Roster & Management
**Appetite:** Small (1 week)
**Release:** R1
**Features:** RM-09, RM-10, RM-11

#### Problem
Marcus needs to see which agents are active, how they're performing, and make changes (add/remove/pause) without a support ticket to MIRD.

#### Solution Sketch

**Agent Table (RM-09):**
```
[Name + avatar initials] [Status dot] [Leads Assigned] [Booked This Week] [Close Rate] [Sparkline] [⋮ Actions]
Status: Online (green) / Offline (muted) / Inactive (red)
Actions menu: View Detail, Edit, Pause/Activate
Filter: Status dropdown  |  Search: name/email  |  Sort: Close Rate, Leads Assigned
```

**Agent Detail Modal (RM-10):**
```
[Photo placeholder — initials] [Name] [Role badge] [Status toggle]
──────────────────────────────────────
Contact: [phone] [email]
Stats: Leads Assigned: 14  |  Booked This Week: 3  |  Close Rate: 21%
──────────────────────────────────────
[Edit inline] → name, phone, email, role (dropdown: Agent / Senior Agent / Team Lead)
[PAUSE AGENT] → confirms, removes from active routing
[ACTIVATE AGENT] → re-adds to routing pool
```

**Bulk Import (RM-11):**
- "Import CSV" button, template download link
- Column mapping: Name (required), Phone (required), Email (required), Role (optional)
- Row-level validation errors shown in preview table
- "Import N agents" confirm button
- On success: toast + table refreshes

**Data:** `agents` table (tenant-scoped). Routing rule updates sync to GHL via n8n `agent-sync` workflow.

#### Rabbit Holes
- **Routing rule sync on pause:** Pausing an agent must remove them from active GHL routing instantly. Bound: Server Action calls n8n webhook synchronously on agent status change; show loading state.
- **Agent photo uploads:** Nice-to-have. Bound: initials avatar only in MVP. Photo upload in R3.

#### No-gos
- Agent performance rankings / leaderboards (R2 feature)
- Agent chat / messaging within dashboard
- Agent-facing portal (agents use GHL)

---

### P10 — Campaigns — Table & Detail
**Appetite:** Small (1 week)
**Release:** R1
**Features:** RM-12, RM-13, RM-14

#### Problem
Marcus is paying for ads. He needs to see whether they're working — CPL, spend, leads — without logging into Meta or Google Ads Manager. When something breaks (OAuth revoked, campaign paused), he needs to know immediately.

#### Solution Sketch

**Campaign Table (RM-12):**
```
[Platform badge] [Name] [Status] [Budget] [Spend MTD] [CPL] [Leads] [Performance]
Platform badge: Meta (blue) / Google (multicolor)
Status: Active (green) / Paused (amber) / Error (red)
Performance: up/down indicator vs. last period
Sync: "Last synced 4 hours ago" | "SYNC NOW" ghost button
```

**Campaign Accordion (RM-13):**
- Click row → expand in-place (no drawer)
- Expanded: daily budget breakdown chart (last 7 days), bid strategy badge, audience summary (text), ad set list
- Ad set list: Name, Status, Impressions, Clicks, CPL, [Pause/Resume toggle]

**Platform Errors (RM-14):**
- Banner above table: "Meta Ads connection lost — reconnect to resume campaigns"
- "RECONNECT" CTA → navigates to Settings > Integrations (RM-21)
- Per-row error icon if individual campaign has an issue

**Data:** `campaigns` + `ad_metrics` tables (populated by BE-04 — Meta/Google Ads sync, runs every 4 hours).

#### Rabbit Holes
- **SYNC NOW rate limiting:** User might spam "Sync Now." Bound: debounce to once per 15 minutes, show "Synced just now" for 15 min after trigger.
- **Campaign name length:** Campaign names from Meta can be very long. Bound: truncate at 48 chars in table, full name in accordion.

#### No-gos
- Campaign creation / editing from within RainMachine (MIRD manages campaigns — clients view only)
- Budget change controls (view-only in MVP)
- Creative previews (file download / render is too complex for MVP)

---

### P11 — RainMachine Settings
**Appetite:** Medium (2–3 weeks)
**Release:** R1
**Features:** RM-18, RM-19, RM-20, RM-21, RM-22

#### Problem
Every setting change — adding an agent, updating a routing rule, reconnecting an OAuth token — currently requires a support ticket to MIRD. This is unsustainable at scale and damages trust.

#### Solution Sketch

**Settings shell:** Left nav (5 sections) + content area.

```
Settings
├── Team          (RM-18)
├── Routing       (RM-19)
├── Notifications (RM-20)
├── Integrations  (RM-21)
└── Account       (RM-22)
```

**Team (RM-18):** Agent list with Add Agent modal (name, phone, email, role), Edit inline, Deactivate button with confirmation. Changes sync to GHL via n8n.

**Routing (RM-19):** Visual rule builder.
```
IF  [Lead Type ▼]  [is ▼]  [Buyer]
THEN assign to  [Agent ▼]
─────────────────────────────────
[+ Add Rule]
Priority order: drag to reorder
[SAVE RULES] → writes to GHL workflow via n8n
```

**Notifications (RM-20):** Toggle matrix (Email + SMS rows × notification type columns). Alert threshold inputs (CPL > $____, Appt Rate < ___%). Number inputs with currency/percentage suffixes.

**Integrations (RM-21):**
```
GoHighLevel    [● Connected]  [Reconnect]
Meta Ads       [● Connected]  [Reconnect]  [Disconnect]
Google Ads     [● Connected]  [Reconnect]  [Disconnect]
```
OAuth flows open in popup window (avoid page navigation). On success: popup sends `postMessage`, parent updates status.

**Account (RM-22):**
- Email display (read-only, contact support to change)
- Password change: current + new + confirm, 8-char minimum
- MFA: "Enable Two-Factor Authentication" — Supabase Auth MFA flow
- Danger zone: "Disable AI Automation" (pauses Retell triggers), "Request Account Deletion" (emails MIRD support, doesn't auto-delete)
- Data export: exports all leads + campaigns as CSV zip

#### Rabbit Holes
- **OAuth popup blocking:** Browser popup blockers may block the OAuth window. Bound: open OAuth in new tab instead of popup if `window.open` returns null; detect and show "pop-up blocked" banner.
- **Routing rule conflict detection:** Two rules could match the same lead type. Bound: warn user if conflict detected ("Rules 2 and 4 overlap for Buyer leads") — don't block save, just warn.
- **Data export size:** Large tenants could have 10,000+ leads. Bound: generate export server-side as a Supabase Edge Function, stream as download. Never in-browser.

#### No-gos
- White-label / custom domain settings
- Billing management (Stripe portal link in R2)
- Sub-user accounts (team leader only, no agent logins)
- Email template customization

---

### P12 — Client Onboarding Portal
**Appetite:** Large (5–6 weeks)
**Release:** R1
**Features:** OB-01 through OB-11

#### Problem
A new MIRD client just signed. Currently, getting them live requires 3–5 back-and-forth emails, a screen share to connect ad accounts, and manual GHL provisioning by Shomari. This is a 3–7 day process that should be self-serve and take < 2 hours of client time.

#### Solution Sketch

**App: `apps/onboarding`** — standalone Next.js app at `onboard.rainmachine.io`.

**Token-gated entry (OB-01, OB-02):**
- URL: `/onboard?token=<jwt>`
- JWT contains: `tenant_id`, `client_email`, `exp` (7-day expiry)
- Middleware validates token on every request
- Mobile: show desktop recommendation, soft block with "continue anyway"

**Wizard Shell (OB-03):**
- 5-step horizontal indicator, persists to `onboarding_progress` table
- Each step: Back (disabled on Step 1) + Save & Continue
- Auto-save on each field blur (debounced 500ms)
- "Progress restored" banner if returning to incomplete wizard

**Step 1 — System Init (OB-04):**
- Contract summary (read from `tenants` table, pre-populated)
- Fields: Business Name, Package, Start Date, Account Manager, MRR
- "Contact Support" → OB-11 support modal
- "Begin Setup" → advances to Step 2

**Step 2 — Mission Parameters (OB-05):**
- 6-field form with real-time validation (Zod schema, client-side)
- Save to `tenants.mission_params` (jsonb)

**Step 3 — Meta Ads (OB-06):**
- Guide user to Meta Business Suite → generate token
- Token input (monospace) + Verify button
- Server Action: POST to Meta Graph API `/me?access_token=` to validate
- Store encrypted token in Supabase Vault
- Help section: video embed + FAQ accordion

**Step 4 — Google (OB-07):**
- Google Ads: Customer ID input → Server Action sends manager invite via Google Ads API → poll for invite acceptance (check every 30s, timeout 5 min)
- GMB: text search → Google Places API → select business
- Both sections independent; "Continue" enabled if at least one connected

**Step 5 — Launch Config (OB-08):**
- Logo upload: Supabase Storage, 5MB max, accept image/*
- Photos: optional, max 5, Supabase Storage
- Launch date: date picker, min = today + 3 business days
- 3 notification toggles
- "LAUNCH RAINMACHINE" → triggers BE-09 job processor

**Completion (OB-09, OB-10):**
- Polls `onboarding_jobs` every 2 seconds
- Component log animates as each step completes (stagger 600ms per item)
- On 100%: transition to "RAINMACHINE IS LIVE" screen
- CTA: "ENTER DASHBOARD" → redirect to `app.rainmachine.io`

**Support (OB-11):**
- Accessible from every step via floating "?" button
- Modal: name (pre-populated), message textarea, Send
- On send: Server Action → creates GHL conversation + sends Slack notification to Shomari
- Video walkthrough: embedded YouTube (unlisted), full 5-step walkthrough

#### Rabbit Holes
- **Google Ads manager invite:** Google can take 24–48 hours to process an invite. Bound: after 5-min polling timeout, show "Invite sent — we'll email you when accepted" and advance wizard. Store pending invite reference in DB.
- **Supabase Storage upload with progress:** Native `fetch` doesn't give upload progress. Bound: use `XMLHttpRequest` for logo upload only (shows progress bar). Photos use standard `fetch` (no progress bar needed for optional field).
- **Token expiry mid-session:** Client starts onboarding but their 7-day token expires. Bound: check token expiry on every step save; if expired, show "Session expired — request a new link" with support email.

#### No-gos
- Self-service onboarding without a signed contract (token is issued manually by MIRD)
- Multi-language support
- Onboarding portal accessible from within the RainMachine dashboard
- Real-time co-browsing with account manager

---

### P13 — CEO Command Center
**Appetite:** Medium (2–3 weeks)
**Release:** R1
**Features:** CEO-01 through CEO-05

#### Problem
Shomari needs a single view that tells him — in under 30 seconds — which clients need attention, what the business metrics are, and whether the AI agents are running. Without this, the "30-minute CEO loop" is impossible.

#### Solution Sketch

**App: `apps/ceo`** — standalone Next.js app at `ceo.rainmachine.io`.

**Layout:** Full-width (no sidebar), 1440px max-width, dense data grid.

**Command Center page (`/`):**
```
Row 1: 5 KPI Cards (Supabase Realtime)
  [MRR: $12,450] [Leads This Month: 847] [Close Rate: 18%] [Appt Rate: 31%] [Churn: 0]
  vs last period: ↑↑↓↑↓

Row 2: Alert Feed (60% width) | Dept Panels (40% width)
  Alert Feed:
    [🔴 CRITICAL] Austin, TX — CPL spiked to $87 (↑156%) — 2h ago  [View] [Dismiss]
    [🟡 WARNING] Denver, CO — No leads in 24h — check campaign status   [View] [Dismiss]
    [🟢 HEALTHY] Charlotte, NC — 12 appts booked this week
  Dept Panels (4 cards):
    [Growth & Acquisition ●] [Ad Operations ●] [Product & Automation ●] [Financial Intel ●]

Row 3: Agent Status Cards (4 Claude AI agents)
  [Growth Agent — last run 6:02am — IDLE] [Ad Ops Agent — running — ACTIVE]
  [Finance Agent — last run 6:00am — IDLE] [Product Agent — last run 6:04am — IDLE]

Row 4: All Clients Table
  [Name] [Tier] [MRR] [Health ●] [Last Activity] [Status] [→]
  Sort, filter by tier/status, click → client detail
```

**Alert Detail Modal:**
- What happened: "[CPL] for [Austin, TX team] rose to [$87] — 156% above threshold [$34]"
- Recommended action: (Claude-generated) "Review Meta targeting — likely audience fatigue or creative burnout"
- [DISMISS] [SNOOZE 24H] [VIEW CLIENT] actions

#### Rabbit Holes
- **Alert volume at scale:** With 100 clients, the alert feed could have 50+ items. Bound: collapse "healthy" alerts by default; only show critical + warning expanded.
- **KPI card MRR source:** MRR comes from Stripe, not GHL. Bound: BE-11 Stripe sync must ship in R1 (or KPI card shows "Coming soon" stub).

#### No-gos
- Client management (create/edit/delete tenants) — handled in Supabase dashboard for now
- Manual alert creation
- CEO app accessible on mobile (desktop-only, deliberate)

---

### P14 — CEO Client Detail
**Appetite:** Medium (2–3 weeks)
**Release:** R1 (shell + Overview tab) → R2 (remaining tabs)
**Features:** CEO-06 through CEO-11

#### Problem
When an alert fires for a client, Shomari needs to drill in and see the full picture — campaigns, leads, timeline, financials — in one place, without switching between GHL and Supabase dashboards.

#### Solution Sketch

**Client Detail (`/clients/[id]`):**
```
Header: [← All Clients]  [Austin Realty Group]  [● ACTIVE · since Jan 2026]  [READ-ONLY notice]

Tab bar: [Overview] [Campaigns] [Leads] [Timeline] [Financials]
```

**Overview (R1):**
- 5 KPI cards: Avg CPL, Leads MTD, Appts MTD, Close Rate, MRR
- CPL trend LineChart (30 days, Recharts)
- Pipeline funnel (5 stages, horizontal proportional bars)
- Client notes panel: free-text notes (CEO-only), "+ Add Note" button

**Campaigns tab (R2):** Read-only version of RM-12 scoped to this client.

**Leads tab (R2):** Read-only version of RM-05 scoped to this client.

**Timeline tab (R1):** Activity timeline with date headers and event nodes — shows onboarding steps, campaign events, lead milestones, AI agent outputs in chronological order.

**Financials tab (R2):**
- KPIs: MRR, Contract End Date, Total Billed YTD, Gross Margin %
- Invoice table: Invoice #, Date, Amount, Status (Paid/Pending/Overdue)
- Data from BE-11 Stripe integration

#### Rabbit Holes
- **Recharts bundle size:** Recharts adds ~150KB. Bound: dynamic import (`next/dynamic`) with `ssr: false` on chart components.
- **Read-only enforcement:** CEO should not accidentally trigger client-side mutations. Bound: all data fetching in CEO app uses separate Supabase client with `readonly` service role; no mutations available.

#### No-gos
- CEO editing client data directly (support tickets / GHL for edits)
- Real-time updates in client detail (polling on page focus is sufficient)

---

## RELEASE 2 PITCHES — Intelligence Layer

---

### P15 — Reports + AI Intelligence Chat
**Appetite:** Medium (2–3 weeks)
**Release:** R2
**Features:** RM-15, RM-16, RM-17

#### Problem
Marcus pays for RainMachine partly because of the weekly AI intelligence reports. If he can only access them as PDF email attachments and can't ask follow-up questions, the product feels less intelligent than the pitch promised.

#### Solution Sketch

**Reports Archive (RM-15):**
- Left panel: report list (date, type badge: "Weekly Brief" / "Monthly Review")
- Right panel: selected report rendered in-app
- Empty state: countdown to first report Monday
- No PDF download required for MVP (render in-app only)

**Report Viewer (RM-16):** Markdown-like rendering:
```
## Executive Summary
[prose paragraph]

## Key Metrics
[3-column grid of inline metric mini-cards]
  [Leads: 142 ↑18%]  [Appts: 31 ↑12%]  [CPL: $34 ↓8%]

## Campaign Performance
[table: Campaign | Spend | CPL | Leads | Trend]

> [cyan callout block] "Your best performing campaign this week was..."

## Recommendations
1. [recommendation text]
2. [recommendation text]
```

**AI Report Chat (RM-17):**
- Fixed bottom panel (collapsible)
- Query input + suggestion chips: ["What drove CPL down?", "Which agent performed best?", "Compare to last month"]
- "TRANSMIT" CTA
- Processing: "PROCESSING QUERY... 4.2s elapsed" + 3-dot animation
- Response: chat bubble, AI-generated prose
- Error: "Query failed — [RETRY QUERY]"
- Context: chat sends report content + tenant metrics as context window to Claude API

#### Rabbit Holes
- **Claude API cost per chat query:** Each query sends full report (~2,000 tokens) as context. Bound: limit chat to 10 queries per report per week. Show counter "7 queries remaining this week."
- **Report rendering from raw Claude output:** Claude outputs markdown-ish text. Bound: define strict output schema for reports (JSON with typed sections) — don't try to parse free-form markdown.

#### No-gos
- Report generation triggered by client (CEO/cron only)
- PDF download / email delivery from within dashboard (email stays in BE-05 workflow)
- Chat history persistence across sessions

---

### P16 — Claude AI Agent Suite
**Appetite:** Large (5–6 weeks)
**Release:** R2
**Features:** BE-05 through BE-08

#### Problem
The 30-minute CEO loop and the weekly intelligence reports both depend on Claude AI agents running on schedule, reading real data, and producing structured outputs. Without the agents, the CEO dashboard is just charts; the RM reports archive is empty.

#### Solution Sketch

**Infrastructure: Supabase Edge Function + cron (via `pg_cron`)**

Each agent is a Supabase Edge Function invoked by `pg_cron`. All agents:
1. Read their data from Supabase (aggregated by BE-01, BE-04)
2. Call Claude API (`claude-sonnet-4-5` → `claude-sonnet-4-6` when available)
3. Write structured output to `reports` or `agent_logs` tables
4. Generate `alerts` rows for anomalies

**BE-05 — Weekly Intelligence Agent** (runs Monday 6:00am ET):
```
Input: tenant's last 7 days of leads, appointments, calls, campaigns
Prompt: "You are a performance analyst for a real estate team leader...
         Generate a Weekly Intelligence Brief with these sections:
         executive_summary, key_metrics[], campaign_performance[], recommendations[]
         Return JSON matching the ReportSchema."
Output: { type: 'weekly_brief', content: ReportSchema, tenant_id }
→ INSERT into reports table
→ Send email via Resend API (plain text summary + "read in dashboard" CTA)
```

**BE-06 — Growth & Acquisition Agent** (runs daily 7:00am ET):
```
Input: Apollo prospect data (via Apollo API), outreach sequence stats
Prompt: "Review the prospect pipeline. Flag stalled deals. Recommend next actions."
Output: { prospects_reviewed, flags[], recommended_actions[] }
→ INSERT into agent_logs (department: 'growth')
→ Generate alerts for stalled deals > 14 days
```

**BE-07 — Ad Operations Agent** (runs daily 8:00am ET):
```
Input: all clients' campaign metrics for past 24h (from ad_metrics table)
Prompt: "Identify anomalies: CPL spikes > 50% vs 7-day avg, campaigns paused,
         OAuth errors, zero leads in 24h for active campaigns."
Output: { anomalies[], alerts[] }
→ INSERT into alerts table (type, severity, client_id, details)
→ INSERT into agent_logs (department: 'ad_ops')
```

**BE-08 — Financial Intelligence Agent** (runs Monday 6:00am ET, before BE-05):
```
Input: Stripe invoices + subscription data for all tenants
Prompt: "Calculate MRR, churn, new ARR, expansion revenue. Generate P&L summary."
Output: { mrr, churn_rate, new_arr, p_and_l_summary }
→ INSERT into agent_logs (department: 'finance')
→ UPDATE metrics table (mrr column)
```

**Cost guardrail:** Each agent run is bounded by input token limits. Weekly Intelligence Agent: max 4,000 tokens input per tenant. At 100 tenants: ~400K tokens/week ≈ $2/week at Sonnet pricing.

#### Rabbit Holes
- **Claude output schema validation:** Claude can hallucinate field names. Bound: parse all outputs through Zod schemas; if invalid, log error to `agent_logs` with `status: 'schema_error'` and skip (don't crash).
- **Cron timing collisions:** BE-05 and BE-08 both run Monday 6am. Bound: BE-08 runs at 6:00am, BE-05 at 6:15am — 15-minute buffer.
- **Apollo API rate limits:** Growth agent reads from Apollo, which has strict rate limits. Bound: cache Apollo data in `prospects` table (BE-06 reads from cache, separate n8n workflow refreshes Apollo data daily).

#### No-gos
- Real-time / on-demand agent runs (cron only)
- Customer-facing AI agents (these are internal to Shomari only)
- Multi-model fallback (Claude only — no OpenAI fallback)
- Agent memory / conversation history across runs

---

### P17 — CEO Department Drilldowns
**Appetite:** Large (5–6 weeks)
**Release:** R2
**Features:** CEO-12 through CEO-15

#### Problem
The four department cards on the command center are only useful if clicking them reveals actionable detail. Without drilldowns, the CEO dashboard is a traffic light with no explanation for why the light is red.

#### Solution Sketch

**Four drilldown pages (`/departments/[dept]`):**

**Growth & Acquisition (`/departments/growth`):**
```
KPI row: Prospects in Pipeline | Deals This Month | Pipeline Value | Avg Deal Velocity
30-day LineChart: prospects contacted vs. deals closed
Prospect table: Name | Company | Stage | Deal Value | Last Activity | Owner | [View →]
Prospect detail sub-page: stage badge, activity timeline, deal notes
```

**Ad Operations (`/departments/ad-ops`):**
```
KPI row: Active Clients | Avg CPL (all) | Total Spend MTD | Leads Generated MTD
Cross-client CPL table: Client | Meta CPL | Google CPL | Health ring (green/amber/red)
AI call volume AreaChart: calls attempted vs. connected vs. booked (7-day)
Platform health panel: [Meta API ● Online] [Google API ● Online] [Retell API ● Online]
```

**Product & Automation (`/departments/product`):**
```
KPI row: Onboarding Queue | Active Workflows | Workflow Errors | Avg Days to Launch
Onboarding queue table: Client | Step | Days Active | Status | [View Status →]
Onboarding status sub-page: 5-step indicator + current step detail + step history
Workflow health panel: n8n health (API call) — total / healthy / errored count
Workflow status board: Workflow Name | Last Run | Runs (7D) | Status badge
```

**Financial Intelligence (`/departments/finance`):**
```
KPI row: MRR | Churn Rate | New ARR | Net Revenue Retention
MRR trend AreaChart: 12 months (green line, green area fill)
P&L table: Revenue | COGS | Gross Margin | Net Margin (last 6 months)
Expandable per-client P&L: click client row → 6-month history grid
Data source: BE-08 output + Stripe invoices (BE-11)
```

#### Rabbit Holes
- **n8n health API:** n8n exposes a `/healthz` endpoint but it only confirms n8n is running, not individual workflow health. Bound: track workflow run status in `workflow_runs` Supabase table (n8n writes on each execution via webhook); dashboard reads from there.
- **Recharts in 4 pages:** Four pages × 2–3 charts each = lots of chart code. Bound: create a `<TrendChart>` wrapper component in `packages/ui` that encapsulates Recharts config with JARVIS Dark styling. Reuse across all 4 pages.

#### No-gos
- Action-taking from department drilldowns (view-only in all 4 drilldowns)
- Apollo CRM integration (Growth dept reads from `prospects` Supabase table, populated by separate n8n workflow)
- Real-time updates in department pages (refresh on focus)

---

### P18 — CEO Agent Logs + Settings
**Appetite:** Small (1 week)
**Release:** R2
**Features:** CEO-16, CEO-17, CEO-18, CEO-19

#### Problem
Without agent logs, Shomari can't verify the AI agents ran or debug why an alert was generated. Without threshold settings, the alert feed becomes noise or misses real issues.

#### Solution Sketch

**Agent Log (`/agent-logs`):**
```
Header: [AGENT ACTIVITY LOG]  Date selector: [← OCT 12, 2026 →]  [TODAY]

4 panels (one per agent):
  [Growth & Acquisition — last run 7:02am — ● IDLE]
  - 7:02am  Reviewed 47 prospects. 3 flagged for follow-up (Austin Realty, Denver Homes, ...)
  - 7:02am  Generated 1 alert: "Austin Realty deal stalled 18 days"
  [+ 4 more entries]  ← expands inline

Full log view (`/agent-logs/[dept]`): all entries for selected dept, reverse-chron, all fields
Historical log: date picker → fetch log for that date → same layout
Export: "Export CSV" → downloads all entries for selected date range
```

**CEO Settings (`/settings`):**
```
Alert Thresholds:
  CPL Upper Bound:    [$____/lead]  (default: $50)
  Close Rate Floor:   [____%]       (default: 10%)
  Spend Over Target:  [____%]       (default: 20%)
  [SAVE THRESHOLDS]

Notification Preferences:
  Channel      Critical  Warning  Weekly Summary  Agent Activity
  ─────────────────────────────────────────────────────────
  Email        [●]       [●]      [●]             [○]
  SMS          [●]       [○]      [○]             [○]
  [SAVE PREFERENCES]
```

Thresholds stored in `ceo_settings` table. BE-07 Ad Ops agent reads thresholds when generating alerts.

#### Rabbit Holes
- **SMS notifications:** Requires Twilio or similar. Bound: SMS toggles visible in UI but show "Coming soon" tooltip; email notifications only for MVP.

#### No-gos
- Per-client threshold overrides (global thresholds only)
- Notification scheduling (e.g., "don't notify between 10pm–7am")
- Slack notifications (R3 enhancement)

---

## Shape Up Summary

| Pitch | Appetite | Release | Features Covered | PRD Count (Step 11) |
|---|---|---|---|---|
| P01 Monorepo Foundation | S | R0 | SH-01 | 1 |
| P02 Design System | M | R0 | SH-02, SH-03 | 1 |
| P03 Supabase + Auth | M | R0 | SH-04–08, BE-10 | 1 |
| P04 GHL ↔ Supabase Sync | M | R0 | BE-01, SH-09 | 1 |
| P05 Retell AI Workflow | M | R0 | BE-02, BE-03 | 1 |
| P06 Onboarding Job Processor | M | R0 | BE-09 | 1 |
| P07 RM Dashboard Home | S | R1 | RM-01–04 | 1 |
| P08 Leads Table + Detail | M | R1 | RM-05–08 | 1 |
| P09 Agents Roster | S | R1 | RM-09–11 | 1 |
| P10 Campaigns Table | S | R1 | RM-12–14 | 1 |
| P11 RM Settings | M | R1 | RM-18–22 | 1 |
| P12 Onboarding Portal | L | R1 | OB-01–11 | 2 |
| P13 CEO Command Center | M | R1 | CEO-01–05 | 1 |
| P14 CEO Client Detail | M | R1/R2 | CEO-06–11 | 1 |
| P15 Reports + AI Chat | M | R2 | RM-15–17 | 1 |
| P16 Claude AI Agent Suite | L | R2 | BE-05–08 | 2 |
| P17 CEO Dept Drilldowns | L | R2 | CEO-12–15 | 2 |
| P18 CEO Agent Logs + Settings | S | R2 | CEO-16–19 | 1 |
| **Total** | | | **73 features** | **20 PRDs** |

**Appetite distribution:**
- Small (≤1 week): 5 pitches
- Medium (2–3 weeks): 9 pitches
- Large (5–6 weeks): 4 pitches

**Total R0 appetite:** ~10–13 weeks (foundation layer — largely backend)
**Total R1 appetite:** ~14–18 weeks (first client live)
**Total R2 appetite:** ~17–21 weeks (full intelligence layer)

With 10–15 productive hours/week: R0 → ~10 weeks, R1 → ~14 weeks, R2 → ~18 weeks (from R1 complete).

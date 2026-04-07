# RABBIT-HOLES.md
# MIRD AI Corporate Machine — Technical Risk Register
# Step 10 / Phase F
# Date: 2026-04-02 | Status: ✅ Complete

---

## Methodology

> "Rabbit holes are the parts of a shaped pitch where the work could expand unboundedly if you don't explicitly bound it. The job of the shaper is to find them in advance and call them out — so the builder doesn't disappear into one."

This register consolidates all rabbit holes from FEATURE-BREAKDOWN.md into a single risk table, adds severity ratings, assigns mitigations, and flags any that require architectural decisions before building begins.

**Severity:**
- 🔴 **High** — Could derail a cycle or block a release gate
- 🟡 **Medium** — Adds meaningful scope if not bounded; manageable with guardrails
- 🟢 **Low** — Worth noting but unlikely to cause real delay

**Status:**
- `BOUNDED` — Explicit constraint defined in pitch; builder knows exactly what to do
- `DECISION NEEDED` — Requires an architectural or product decision before building starts
- `MONITOR` — Low probability; watch for it during build

---

## RELEASE 0 — Foundation Rabbit Holes

| # | PRD | Risk | Severity | Mitigation | Status |
|---|---|---|---|---|---|
| RH-01 | F01 | **pnpm version conflicts across developer environments** — Different Node/pnpm versions produce lockfile drift, breaking `turbo build` | 🟡 | Lock `packageManager` field in root `package.json` to exact pnpm version. CI enforces with `corepack enable`. `.nvmrc` pins Node version. | BOUNDED |
| RH-02 | F01 | **Turbo remote cache configuration** — Misconfigured remote cache causes stale builds that silently ship old code | 🟡 | Use Vercel's built-in Turbo Remote Cache (free, zero config). Do not configure custom remote cache. | BOUNDED |
| RH-03 | F02 | **Component API over-engineering** — Building a "complete" design system with infinite variants instead of what the 20 PRDs actually need | 🔴 | Strict rule: only build components with confirmed consumers in F03–F20. No speculative components. Review against PRD-ROADMAP.md before adding any new component. | BOUNDED |
| RH-04 | F02 | **Framer Motion bundle size** — Adding animation library inflates bundle by 30–60KB across all 3 apps | 🟢 | CSS transitions only in `packages/ui`. App-level animations (scan-line, glow pulse) use CSS keyframes in-component. Framer Motion not installed in any package. | BOUNDED |
| RH-05 | F03 | **RLS policy silent failures** — An incorrectly written RLS policy returns empty results instead of an error, silently hiding data bugs | 🔴 | Every RLS policy has a corresponding pgTAP test verifying: (a) correct data returned for authorized role, (b) empty set (not error) returned for unauthorized role. Zero RLS policies ship without tests. | BOUNDED |
| RH-06 | F03 | **TOTP secret storage** — Building a custom TOTP implementation instead of using Supabase's built-in MFA API | 🟡 | Use only `supabase.auth.mfa.enroll()`, `.challenge()`, `.verify()`. No custom TOTP library. No secret storage in app DB — Supabase Auth manages it. | BOUNDED |
| RH-07 | F03 | **Atomic tenant + user creation** — Race condition if user creation succeeds but tenant row creation fails, leaving orphaned auth users | 🔴 | All tenant provisioning goes through `create-tenant` Supabase Edge Function (single atomic operation). Client-side registration does not exist — accounts are admin-provisioned only. | BOUNDED |
| RH-08 | F04 | **GHL webhook duplicate delivery** — GHL can fire the same webhook 2–3 times for a single event (known GHL behavior) | 🔴 | Idempotency key on every Supabase upsert: `ON CONFLICT (ghl_contact_id) DO UPDATE`. n8n workflow logs dedup key. Tested with duplicate webhook replay in CI. | BOUNDED |
| RH-09 | F04 | **Supabase Realtime connection limits** — Free/Pro tier limits concurrent Realtime channels; 100 clients × multiple subscriptions = limit exceeded | 🟡 | One channel per tenant (`metrics:${tenantId}`), not per-component. CEO app uses one aggregate channel. Never subscribe in child components — only in layout-level client components. | BOUNDED |
| RH-10 | F04 | **Historical GHL data backfill** — GHL has no bulk webhook replay; first sync is always "from now" | 🟡 | One-time backfill script (GHL Contacts API pagination) run manually before going live with each client. Not part of the automated sync workflow. Script documented in `docs/ops/GHL-BACKFILL.md`. | DECISION NEEDED — write backfill script before first client onboards |
| RH-11 | F05 | **Retell AI call concurrency per tenant** — Multiple simultaneous new leads hitting the same Retell number could exceed call concurrency limits | 🔴 | n8n queue with 2-second stagger between calls for the same tenant. Never fire parallel outbound calls to the same `to_number` within 10 minutes. Guard checked in n8n before Retell API call. | BOUNDED |
| RH-12 | F05 | **Retell AI call transcript size** — Long calls generate 20,000+ character transcripts exceeding Postgres column limits or index performance | 🟡 | Store in `calls.transcript` as `TEXT` (no length limit). Cap display in UI at 5,000 chars with "SHOW FULL TRANSCRIPT" expand. No indexing on transcript column. | BOUNDED |
| RH-13 | F05 | **Retell phone number provisioning** — Each tenant needs a dedicated outbound number, which requires Retell provisioning per client | 🟡 | Phone number provisioned in F06 (Onboarding Job Processor), Step 2. Not provisioned at call-time. If provisioning fails, job processor marks `step: 'ai_agent', status: 'error'` and halts with actionable error message. | BOUNDED |
| RH-14 | F06 | **GHL sub-account creation latency** — GHL can take 30–90 seconds to provision a new sub-account | 🟡 | Job processor polls GHL for sub-account readiness (max 3 min, 10-second intervals). Timeout error returns actionable message to Shomari (Slack notification). UI progress bar holds at step 1 during polling. | BOUNDED |
| RH-15 | F06 | **Partial provisioning failure recovery** — If Step 4 of 6 fails, Steps 1–3 have already executed; naive retry re-runs all steps | 🔴 | `onboarding_jobs.step_statuses` jsonb tracks each step's completion. On retry, each step checks `step_statuses[step].complete` before executing. Verified with failure injection tests. | BOUNDED |
| RH-16 | F06 | **OAuth token expiry during provisioning** — Meta/Google tokens expire if not used within the job's processing window | 🟢 | Tokens written to Supabase Vault at collection time (Steps 3–4 of onboarding wizard). Job processor reads from Vault — token is already stored before provisioning begins. | BOUNDED |

---

## RELEASE 1 — First Client Sprint Rabbit Holes

| # | PRD | Risk | Severity | Mitigation | Status |
|---|---|---|---|---|---|
| RH-17 | F08 | **Lead stage update race condition** — Two browser tabs or two users (team leader + assistant) update the same lead stage simultaneously | 🟡 | Optimistic locking: `updateLeadStage(leadId, newStage, clientUpdatedAt)` server action rejects if `leads.updated_at ≠ clientUpdatedAt`. Client shows "Updated by someone else" toast and re-fetches. | BOUNDED |
| RH-18 | F08 | **Lead table performance at 10,000+ rows** — Full table scan on unindexed columns causes slow filter queries as client grows | 🟡 | Indexes on `leads(tenant_id, stage)`, `leads(tenant_id, agent_id)`, `leads(tenant_id, created_at DESC)`. Pagination enforced at server level (max 50 rows per page, no "load all"). | BOUNDED |
| RH-19 | F08 | **CSV export memory** — Exporting 10,000+ leads in-memory in a server action could OOM the Vercel function | 🟡 | Use Supabase Edge Function for export (streaming response, not buffered). Client downloads via generated signed URL, not direct server action response. Max export: 50,000 rows with warning. | BOUNDED |
| RH-20 | F09 | **Agent sync GHL race condition** — Pause agent in RM → n8n webhook updates GHL → GHL webhook fires back → n8n tries to sync back to RM | 🟡 | n8n `agent-sync` workflow includes origin flag: `{ source: 'rainmachine' }`. GHL-to-Supabase sync workflow checks `source` flag and skips if `source = 'rainmachine'`. Prevents sync loop. | BOUNDED |
| RH-21 | F11 | **OAuth popup blocking** — Browser popup blockers prevent the Meta/Google OAuth window from opening | 🟡 | `window.open()` returns `null` if blocked. Client code detects null → falls back to `window.open(url, '_blank')` (new tab). If new tab also fails, show banner: "Pop-ups are blocked — allow pop-ups for this site and try again." | BOUNDED |
| RH-22 | F11 | **Routing rule conflict detection** — Two rules can match the same lead type, creating ambiguous routing | 🟡 | Server-side conflict detection in `saveRoutingRules`: check for overlapping `lead_type + territory` combinations. Return warning (not error): "Rules 2 and 4 overlap for Buyer leads in Austin — Rule 2 will take priority." Never block save. | BOUNDED |
| RH-23 | F11 | **Data export zip generation** — A client with 10,000+ leads + 100 campaigns + 50 reports cannot have a zip generated in-memory in a Vercel function (10s timeout) | 🟡 | `requestDataExport()` enqueues an async Supabase Edge Function job. Edge Function generates the zip to Supabase Storage. Client receives a signed download URL via email when ready (Resend). No synchronous zip generation. | BOUNDED |
| RH-24 | F12 | **Google Ads manager invite 24–48h delay** — Google can take up to 48 hours to process a manager access invite | 🔴 | After 5-minute polling timeout: wizard shows "Invite sent — we'll complete setup when you accept" and **advances without blocking**. `onboarding_progress.step4_invite_pending = true`. Job processor handles pending invite at launch time (re-checks before configuring Google Ads). | BOUNDED |
| RH-25 | F12 | **Supabase Storage upload progress** — Native `fetch` does not expose upload progress events needed for the file progress bar | 🟡 | Logo upload uses `XMLHttpRequest` (supports `progress` event) wrapped in a custom `useUpload` hook. Photos use standard `fetch` (optional field — no progress bar needed). Explicitly documented in F12 PRD. | BOUNDED |
| RH-26 | F12 | **Onboarding token expiry mid-session** — Client starts wizard on day 1, returns on day 8 — token has expired (7-day TTL) | 🟡 | Edge Middleware checks token expiry on every request. If expired: show "Your session expired — request a new link" with `support@rainmachine.io` mailto. `onboarding_progress` is preserved (token is separate from progress). New token resumes at correct step. | BOUNDED |
| RH-27 | F12 | **GHL sub-account template drift** — MIRD's GHL template sub-account gets manually modified, causing new client provisioning to behave differently than expected | 🟡 | GHL template sub-account is version-controlled: `docs/ops/GHL-TEMPLATE-CHANGELOG.md` tracks every change. Onboarding E2E test runs against a fresh clone weekly (GitHub Actions scheduled job). | DECISION NEEDED — create GHL template changelog doc |
| RH-28 | F13 | **Alert volume at 100+ clients** — With 100 clients, the alert feed could have 50+ simultaneous alerts, making it unusable | 🟡 | Healthy alerts collapsed by default (only count shown: "42 healthy"). Critical (max 10 shown, "SHOW MORE" expands) + Warning (max 10 shown). Alerts auto-archive after 7 days. CEO settings allow alert sensitivity tuning (F20). | BOUNDED |
| RH-29 | F14 | **Recharts bundle size in CEO app** — Recharts adds ~150KB; multiple chart-heavy pages in CEO app inflate the bundle | 🟡 | All Recharts components use `next/dynamic` with `{ ssr: false }`. Shared `<TrendChart>` wrapper in `packages/ui` dynamically imports Recharts once — not per-chart. Bundle analyzer run before each R1 deploy. | BOUNDED |

---

## RELEASE 2 — Intelligence Layer Rabbit Holes

| # | PRD | Risk | Severity | Mitigation | Status |
|---|---|---|---|---|---|
| RH-30 | F15 | **Claude API chat cost at scale** — At 100 clients × 10 queries/week × ~2,000 token context = 2M tokens/week ≈ $10/week (acceptable), but one verbose client could skew cost significantly | 🟡 | Hard limit: 10 queries per tenant per week (enforced server-side via `report_chat_queries` count). Report context truncated to 2,000 tokens max (summary, not full text). Usage logged in `claude_api_usage` table for monitoring. | BOUNDED |
| RH-31 | F15 | **Report rendering from Claude JSON** — Claude output format changes between model versions, breaking the typed report renderer | 🔴 | Report content stored as validated `ReportSchema` JSON (Zod-parsed before storage). Renderer consumes typed JSON, not raw Claude output. If future Claude version changes output format, only the prompt needs updating — renderer is untouched. | BOUNDED |
| RH-32 | F16 | **Claude output schema validation failure** — Claude returns valid JSON but with wrong field names or missing required fields | 🔴 | Zod parse in Edge Function. On `ZodError`: log `agent_logs.status = 'schema_error'` with raw output stored for debugging. Skip the tenant, continue to next. Never crash the agent run. Alert Shomari via Slack if schema error rate > 10% in one run. | BOUNDED |
| RH-33 | F16 | **pg_cron timing collisions** — Multiple agents scheduled at overlapping times could create DB lock contention | 🟡 | Staggered schedule: Finance agent 6:00am → Weekly Intel 6:15am → Growth agent 7:00am → Ad Ops agent 8:00am. 15-minute minimum gap between agents. Each agent uses its own DB connection (Supabase Edge Function = isolated execution). | BOUNDED |
| RH-34 | F16 | **Agent "runaway" on large tenant count** — Weekly Intel agent at 100 tenants × 4,000 tokens = 400K tokens per run = ~$2/week. At 1,000 tenants, this becomes $20/week (still fine, but track it). | 🟢 | `claude_api_usage` table tracks per-run cost. CEO dashboard (F20) shows weekly AI spend. If cost exceeds $50/week, alert Shomari. Scale pricing model before reaching this threshold. | MONITOR |
| RH-35 | F17 | **Apollo API rate limits** — Apollo's API rate-limits to 50 requests/minute; syncing 500 prospects takes 10+ minutes | 🟡 | Apollo cache strategy: n8n `apollo-prospect-sync` workflow runs nightly (not on-demand), respects rate limits with built-in throttle. `prospects` table is always a cached snapshot — never live Apollo queries from the dashboard. | BOUNDED |
| RH-36 | F17 | **Stripe webhook reliability** — Stripe webhooks can fail to deliver if Vercel function is cold; missed invoice events create data gaps | 🟡 | Stripe webhook handler: idempotency key (`stripe_event_id`) prevents duplicate processing. Nightly reconciliation job: Supabase Edge Function compares `invoices` table against Stripe API, backfills any gaps. | BOUNDED |
| RH-37 | F17 | **Stripe test vs. live mode** — Developer builds against Stripe test mode but production uses live mode; webhook signatures differ | 🟡 | Two Stripe webhook endpoints: one for test (`/api/webhooks/stripe/test`), one for live (`/api/webhooks/stripe`). Environment variable `STRIPE_WEBHOOK_SECRET` set per Vercel environment (preview vs. production). | BOUNDED |
| RH-38 | F18 | **n8n workflow health detection** — n8n's `/healthz` only confirms the instance is running, not individual workflow health | 🟡 | n8n executes a "log-this-run" webhook step at the end of every workflow. This step writes to `workflow_runs` table. Dashboard reads from `workflow_runs` — if a workflow hasn't run in > expected interval, status = DEGRADED. `healthz` is not used. | BOUNDED |
| RH-39 | F18 | **Platform health endpoint caching** — Fetching Retell + Meta + Google health endpoints on every CEO page load adds 3 external API calls per request | 🟡 | Platform health endpoint (`/api/health/platforms`) caches responses server-side for 5 minutes (`next: { revalidate: 300 }`). CEO page reads from this cached endpoint — not directly from external APIs. | BOUNDED |
| RH-40 | F19 | **Per-client P&L grid performance** — Expanding P&L for all 100 clients simultaneously would fetch 600 rows at once | 🟢 | Per-client P&L is lazy-loaded: expansion click triggers a fetcher for that client's 6-month data only. Not preloaded. Maximum 3 clients can be expanded simultaneously (collapse others on expand). | BOUNDED |

---

## Architectural Decision Record (ADR) Requirements

Three rabbit holes require explicit architectural decisions before their cycle begins:

| ADR | Decision Required | Triggered By | Deadline |
|---|---|---|---|
| **ADR-GHL-BACKFILL** | Define the GHL historical backfill script approach (pagination strategy, field mapping, error recovery) and document in `docs/ops/GHL-BACKFILL.md` | RH-10 | Before first client onboards (end of Cycle 3) |
| **ADR-GHL-TEMPLATE** | Create `docs/ops/GHL-TEMPLATE-CHANGELOG.md` and define the versioning process for the GHL sub-account template | RH-27 | Before F12 ships (end of Cycle 6) |
| **ADR-STRIPE-WEBHOOKS** | Confirm Stripe test vs. live webhook endpoint separation strategy and environment variable naming convention | RH-37 | Before F17 starts (Cycle 10) |

---

## Rabbit Hole Summary

| Severity | Count | All Bounded? |
|---|---|---|
| 🔴 High | 9 | ✅ Yes |
| 🟡 Medium | 27 | ✅ Yes (3 require ADRs) |
| 🟢 Low | 4 | ✅ Monitor only |
| **Total** | **40** | **All mitigated** |

**No unbounded rabbit holes remain.** Every risk has an explicit constraint that a builder can follow without judgment calls.

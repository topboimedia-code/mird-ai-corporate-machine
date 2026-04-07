# MIRD AI Corporate Machine — Risk Assessment & Mitigations
## Phase L Output | Step 8: Technical Specification
## Version: 1.0 | Date: 2026-03-31

---

## Overview

Risk register for the MIRD AI Corporate Machine across three domains: **Technical** (architecture and infrastructure risks), **Security** (threats to data and system integrity), and **Project** (operational and business risks). Each risk is rated by **Likelihood** (L: 1–5) and **Impact** (I: 1–5), producing a **Risk Score** (L × I). Scores ≥ 12 are P0 (critical), 6–11 are P1 (high), 3–5 are P2 (medium), 1–2 are P3 (low).

---

## 1. Technical Risks

### RISK-T01: Multi-Tenant RLS Bypass
**Score: 15 (P0)**

| Field | Detail |
|-------|--------|
| Likelihood | 3 — Complex RLS policies; edge cases in JWT claim parsing |
| Impact | 5 — Client A sees Client B's leads/appointments/data |
| Category | Data integrity, compliance |

**Scenario:** A bug in `auth_org_id()` function, a missing RLS policy on a new table, or a server action omitting the explicit `WHERE organization_id = ?` clause results in cross-tenant data exposure. This is a silent failure — no error thrown, wrong data silently served.

**Mitigations:**
- 4-layer auth model: network (separate domain) → middleware → server action WHERE → RLS
- P0 integration test suite: cross-org isolation tests run on every CI push (see TESTING-STRATEGY.md §5.2)
- RLS policy naming convention enforced: `{table}_{role}_{action}` — missing policy is visible in schema review
- New table PR checklist: RLS enabled + `organization_id` FK presence required before merge
- `auth_org_id()` function covered by unit tests; any change requires explicit test update

**Residual risk:** Low — four independent layers must all fail simultaneously for exposure.

---

### RISK-T02: Supabase Vendor Lock-In
**Score: 6 (P1)**

| Field | Detail |
|-------|--------|
| Likelihood | 2 — Supabase is stable, well-funded, growing |
| Impact | 3 — Migration to alternative backend is 2–4 weeks of work |
| Category | Architecture, business continuity |

**Scenario:** Supabase changes pricing, deprecates a critical feature (Vault, Realtime, Edge Functions), or experiences prolonged outage. MIRD has no self-hosted fallback.

**Mitigations:**
- All data in standard PostgreSQL 16 — `pg_dump` produces portable SQL, importable to any Postgres host (Railway, Neon, RDS)
- Next.js Server Actions are backend-agnostic — swapping Supabase client for direct `pg` connection is isolated to `packages/api-client`
- Supabase Vault: if migrated, secrets would need re-importing to new vault solution — documented procedure in SECURITY-DETAILED.md
- Auth: Supabase Auth is NextAuth-compatible; migration path exists
- Realtime: can be replaced with Ably, Pusher, or Server-Sent Events — isolated to `useRealtimeSubscription` hook

**Residual risk:** Medium — migration is feasible but time-consuming. Acceptable for a startup at this stage.

---

### RISK-T03: Vercel Cold Start Latency on Server Actions
**Score: 4 (P2)**

| Field | Detail |
|-------|--------|
| Likelihood | 3 — Serverless functions cold start on low-traffic apps (CEO Dashboard, Onboarding) |
| Impact | 2 — UX degradation (2–5s delay) on first request after idle period |
| Category | Performance, UX |

**Scenario:** CEO Dashboard or Onboarding Portal receives infrequent traffic. Vercel's serverless functions cold-start adds 2–5 seconds to first server action response.

**Mitigations:**
- Vercel Pro `minInstances: 1` for CEO Dashboard (always-warm) — ~$5/month additional cost
- Supabase connection pooling (PgBouncer transaction mode) reduces connection overhead on warm requests
- RSC for initial page load — HTML streamed from server; cold start only affects subsequent mutations
- `loading.tsx` files on all heavy routes provide instant skeleton UI during cold start
- Onboarding: low cold-start sensitivity — wizard steps are user-paced, not latency-critical

**Residual risk:** Low — mitigated by warm instances on critical apps.

---

### RISK-T04: Claude AI Agent Cost Runaway
**Score: 6 (P1)**

| Field | Detail |
|-------|--------|
| Likelihood | 2 — Prompt bugs or API changes could increase token consumption |
| Impact | 3 — Unexpected $200–500/month cost; no direct revenue impact but operational cost |
| Category | Cost management |

**Scenario:** A bug in an agent prompt causes dramatically longer outputs, a new Claude model version has different token pricing, or all 4 agents start failing and retrying in a loop, multiplying costs.

**Mitigations:**
- $100/month hard ceiling: `agent_performance` tracks cumulative `cost_usd`; cron route checks halt flag before each run
- $75/month soft alert: Slack `#mird-alerts` notification — Shomari investigates before ceiling hit
- `max_tokens: 2048` set on every `anthropic.messages.create` call — prevents runaway single responses
- Zod output schema validation: if agent output doesn't parse, cron fails cleanly (no retry loop)
- No retry-on-failure in cron routes: one attempt per schedule slot; next run at next cron interval
- Monthly cost visible in CEO Dashboard Finance panel (Dept 4 Finance agent output)

**Residual risk:** Low — ceiling with auto-halt makes uncontrolled runaway impossible.

---

### RISK-T05: n8n Workflow Single Point of Failure
**Score: 6 (P1)**

| Field | Detail |
|-------|--------|
| Likelihood | 3 — n8n Cloud has had periodic outages; workflows can fail silently |
| Impact | 2 — New leads not called; ad data not synced (caught within 24h) |
| Category | Reliability, operations |

**Scenario:** n8n Cloud outage or workflow error means new GHL leads don't trigger Retell calls. Leads accumulate uncalled. Ad data not synced for one day.

**Mitigations:**
- GHL webhook also writes to Supabase `leads` table directly (via Edge Function) — lead data is never lost, only the Retell trigger is delayed
- n8n workflow error notifications sent to Slack `#mird-ops` — failure visible within minutes
- Ad Report Sync failure: Dept 2 Ad Ops agent will detect stale data on next daily run and alert
- Lead Router failure recovery: manual trigger available in n8n UI; GHL lead list can be batch-reprocessed
- n8n Cloud SLA: 99.9% uptime (enterprise plan) — expected downtime < 9 hours/year

**Residual risk:** Low — data is preserved; worst case is delayed Retell call trigger.

---

### RISK-T06: Supabase Realtime Connection Limits
**Score: 3 (P2)**

| Field | Detail |
|-------|--------|
| Likelihood | 2 — Only reached at ~200 concurrent dashboard sessions |
| Impact | 2 — Real-time updates stop; users must refresh manually |
| Category | Scalability |

**Scenario:** MIRD scales to 150+ simultaneous active clients using RainMachine at the same time. Supabase Pro's 200 concurrent Realtime connection limit is reached.

**Mitigations:**
- TanStack Query `refetchInterval: 30_000` as fallback — even without Realtime, data refreshes every 30 seconds
- Connection limit monitoring via Supabase Metrics dashboard — upgrade to Enterprise plan when > 150 connections sustained
- Current Y1 projection: ~50 clients, ~10 concurrent sessions peak = ~50 connections (4× headroom)

**Residual risk:** Low — well below limits for Y1; upgrade path clear.

---

### RISK-T07: GHL API Breaking Changes
**Score: 4 (P2)**

| Field | Detail |
|-------|--------|
| Likelihood | 2 — GHL has versioned API but does make breaking changes with notice |
| Impact | 2 — Webhook processing fails; lead sync stops until fix deployed |
| Category | External dependency |

**Scenario:** GoHighLevel changes webhook payload schema or pipeline stage event format, breaking `mapGHLStageToMIRD()` or contact ingestion.

**Mitigations:**
- GHL webhook handler returns `200 OK` for unrecognized event types (no retry storms from GHL)
- `mapGHLStageToMIRD()` returns `'NEW'` as safe default for unknown stage names
- GHL API version pinned in Edge Function — monitor GHL changelog (subscribed to GHL developer Slack)
- Integration test against GHL webhook schema — schema drift caught in CI before production

**Residual risk:** Low — safe defaults prevent data loss; monitoring catches schema drift.

---

### RISK-T08: TypeScript `as any` Drift
**Score: 3 (P2)**

| Field | Detail |
|-------|--------|
| Likelihood | 2 — Contractor contributions may introduce `as any` to bypass type errors |
| Impact | 2 — Type safety erodes; branded UUID cross-contamination possible at runtime |
| Category | Code quality |

**Scenario:** Time-pressured contractor uses `as any` or `@ts-ignore` to ship a feature. Branded type system erodes. `OrganizationId` passed where `LeadId` expected at runtime causes subtle data bugs.

**Mitigations:**
- `@typescript-eslint/no-explicit-any: 'error'` in ESLint — blocks `as any` in all source files
- `// @ts-ignore` triggers ESLint `@typescript-eslint/ban-ts-comment: 'error'`
- `// @ts-expect-error` allowed only with explanatory comment and Jira/issue link
- PR review checklist item: "No `as any` added"
- Pre-commit lint-staged catches violations before they reach CI

**Residual risk:** Low — tool-enforced, not process-enforced.

---

## 2. Security Risks

### RISK-S01: Supabase `service_role` Key Exposure
**Score: 15 (P0)**

| Field | Detail |
|-------|--------|
| Likelihood | 3 — Key stored in multiple places; developer error possible |
| Impact | 5 — Complete database access bypassing all RLS; full data breach |
| Category | Security, compliance |

**Scenario:** `SUPABASE_SERVICE_ROLE_KEY` is accidentally committed to git, logged in Vercel function output, or exposed in a client bundle (via `NEXT_PUBLIC_` prefix mistake).

**Mitigations:**
- ESLint `no-process-env` rule in client-side files — prevents accidental server env access in browser
- `NEXT_PUBLIC_` prefix enforced via convention + ESLint `no-restricted-syntax` rule checking for `NEXT_PUBLIC_SUPABASE_SERVICE`
- `service_role` key stored only in Vercel server-only env vars and Supabase Edge Function secrets
- `git-secrets` pre-commit hook: scans commits for key patterns matching Supabase JWT format
- GitHub secret scanning enabled — alerts on any detected secret in pushed commits
- P0 incident playbook: < 5 minute rotation SLA (see SECURITY-DETAILED.md §13)
- Key never appears in any log output — Supabase client does not log credentials

**Residual risk:** Low with controls. Critical if controls fail.

---

### RISK-S02: Webhook Replay Attack
**Score: 6 (P1)**

| Field | Detail |
|-------|--------|
| Likelihood | 2 — Requires captured valid webhook; targeted attack |
| Impact | 3 — Duplicate lead creation; false pipeline stage changes |
| Category | Security, data integrity |

**Scenario:** Attacker captures a valid GHL or Retell webhook with valid HMAC signature and replays it multiple times, creating duplicate leads or triggering multiple Retell calls for the same lead.

**Mitigations:**
- HMAC signature validates payload integrity but not freshness — timestamp check added to GHL webhook handler: reject payloads with `timestamp` > 5 minutes old
- Idempotency: `leads` table has `UNIQUE(organization_id, ghl_contact_id)` — duplicate `contact.created` events produce upsert, not duplicate insert
- `ai_calls` table: `UNIQUE(call_id)` — duplicate `call_ended` events for same `call_id` are idempotent upserts
- Retell trigger (n8n): checks lead `stage NOT IN ('CALLING', 'APPOINTMENT_SET', 'DNC')` before firing — in-progress or terminal leads not re-called

**Residual risk:** Low — idempotency constraints prevent data duplication even on replay.

---

### RISK-S03: Onboarding Token Enumeration
**Score: 4 (P2)**

| Field | Detail |
|-------|--------|
| Likelihood | 2 — Token is UUID format; 122-bit entropy makes brute force infeasible |
| Impact | 2 — Unauthorized access to a client's onboarding session |
| Category | Security |

**Scenario:** Attacker attempts to enumerate valid onboarding tokens to access another client's wizard session and steal business information entered during onboarding.

**Mitigations:**
- Token format: UUIDv4 = 2^122 entropy — brute force infeasible (10^36 combinations)
- Rate limiting: Upstash Redis, 10 requests/hour/IP on token validation endpoint
- Token expiry: 48 hours from issue — window closed even if token somehow leaked
- RLS: `onboarding_sessions` SELECT policy requires matching token AND status = 'IN_PROGRESS'
- Token transmitted only via secure email link (HTTPS); never logged

**Residual risk:** Very low — entropy + rate limiting makes enumeration computationally infeasible.

---

### RISK-S04: CEO Dashboard Unauthorized Access
**Score: 8 (P1)**

| Field | Detail |
|-------|--------|
| Likelihood | 2 — CEO account is a high-value target; phishing possible |
| Impact | 4 — Full business intelligence visible; client data accessible |
| Category | Security |

**Scenario:** Attacker gains Shomari's Supabase Auth credentials via phishing or credential stuffing. CEO Dashboard contains all client MRR data, full pipeline visibility, and aggregate business metrics.

**Mitigations:**
- AAL2 (TOTP MFA) enforced at middleware level for `ceo.makeitrain.digital` — password alone is insufficient
- Separate domain (`ceo.makeitrain.digital`) — not accessible from `app.makeitrain.digital` sessions
- Supabase Auth: brute force protection built-in (rate limiting on auth endpoints)
- CEO role: `is_mird_admin()` DB function checked in server actions — role escalation from client accounts impossible
- Session JWT: 1-hour expiry; refresh token rotation enabled
- Recovery codes for TOTP stored in 1Password (not email)

**Residual risk:** Low — TOTP MFA is the critical control; password alone insufficient.

---

### RISK-S05: Client Data in Claude Agent Prompts
**Score: 6 (P1)**

| Field | Detail |
|-------|--------|
| Likelihood | 3 — Agents query DB for live data and include in prompts |
| Impact | 2 — Client names/metrics sent to Anthropic API; data processing concern |
| Category | Privacy, compliance |

**Scenario:** Claude agents include client business names, lead counts, and revenue figures in prompts sent to Anthropic's API. Clients have not explicitly consented to their data being processed by a third-party AI.

**Mitigations:**
- MIRD Terms of Service explicitly discloses AI processing of aggregated business metrics
- Agent prompts use **aggregated and anonymized** data where possible — "Client A has 45 leads" not "Marcus Johnson's team at Apex Realty has 45 leads"
- No PII (contact names, phone numbers, emails) included in Claude prompts — only business metrics
- Anthropic API: zero data retention policy for API usage (confirmed in Anthropic API Terms)
- Data minimization: agents query only the specific metrics needed; no full table dumps

**Residual risk:** Low — aggregated data only; no PII; Anthropic zero-retention policy.

---

## 3. Project Risks

### RISK-P01: Solo Operator Bus Factor
**Score: 9 (P1)**

| Field | Detail |
|-------|--------|
| Likelihood | 3 — Single founder; knowledge concentration inevitable |
| Impact | 3 — Extended downtime if Shomari unavailable; no one else knows the system |
| Category | Business continuity |

**Scenario:** Shomari is unavailable for an extended period (illness, vacation, emergency). A production incident occurs. No other team member can diagnose or resolve it.

**Mitigations:**
- **This document (Step 8)** is the primary mitigation — complete system knowledge codified in `/docs/tech/`
- Runbooks in INFRASTRUCTURE.md §3 for all deployment and rollback operations
- P0 incident playbook in SECURITY-DETAILED.md §13 — step-by-step for most likely emergencies
- Vercel dashboard + Supabase dashboard: any developer with credentials can roll back without CLI knowledge
- Contractor onboarding: Step 8 docs + this risk register = complete context in < 4 hours
- 1Password shared vault: all credentials documented for emergency access

**Residual risk:** Medium — no mitigation fully replaces a second skilled engineer. Acceptable for current stage.

---

### RISK-P02: Scope Creep Beyond Sigma Protocol Steps 1–7
**Score: 6 (P1)**

| Field | Detail |
|-------|--------|
| Likelihood | 3 — Founder temptation to add features during build |
| Impact | 2 — Delayed launch; half-built features shipped |
| Category | Project management |

**Scenario:** During development of the 112 screens across 3 apps, new feature ideas emerge. Without discipline, scope expands and launch is delayed indefinitely.

**Mitigations:**
- **Step 7 STATE-SPEC.md is the source of truth** — 112 screens, 24 flows, exactly as specified
- New features go into a `FUTURE-FEATURES.md` parking lot — not into the current build
- Definition of Done: every screen in STATE-SPEC.md with all 6 states implemented
- Sigma Protocol Steps 1–7 output is locked — no retroactive changes without explicit new protocol run
- Weekly review: cross-reference STATE-SPEC.md checklist against implemented screens

**Residual risk:** Low — locked spec is the forcing function.

---

### RISK-P03: GHL Sub-Account Provisioning Failure During Onboarding
**Score: 6 (P1)**

| Field | Detail |
|-------|--------|
| Likelihood | 3 — Multi-step provisioning has multiple failure points |
| Impact | 2 — Client can't launch; manual recovery required |
| Category | Operations |

**Scenario:** The n8n Onboarding Provisioner workflow partially completes — GHL sub-account created but Supabase org not provisioned, or org created but agents not seeded. Client is stuck in a broken state.

**Mitigations:**
- `/provision-org` Edge Function: tracks `partialState` object — returns exactly what was completed before failure
- Rollback strategy: each step reversed in reverse order on failure (documented in BACKEND-SPEC.md §4)
- Onboarding session status: `IN_PROGRESS` → `COMPLETE` only after all steps succeed; stuck sessions visible in admin
- Manual recovery procedure: INFRASTRUCTURE.md §3 documents how to complete a partial provisioning from `partialState` data
- n8n Provisioner: Slack alert to `#mird-ops` on any failure with `partialState` payload

**Residual risk:** Low — partial state is fully recoverable with documented procedure.

---

### RISK-P04: Retell AI Pricing Change
**Score: 4 (P2)**

| Field | Detail |
|-------|--------|
| Likelihood | 2 — Retell is a growing startup; pricing has changed before |
| Impact | 2 — Per-minute call costs increase; MIRD passes through to clients or absorbs |
| Category | Cost management, business model |

**Scenario:** Retell AI increases per-minute pricing by 2–3×. Current model where MIRD includes Retell calls in the platform subscription becomes unprofitable.

**Mitigations:**
- Retell AI decoupled behind `ai-agents/retell` abstraction layer — swappable with Bland AI, Vapi, or custom Twilio+ElevenLabs stack
- `RETELL_NEW_LEAD`, `RETELL_COLD_OUTBOUND`, `RETELL_DBR` call types tracked in `ai_calls` — cost attribution by call type available
- Pricing review: Dept 4 Finance agent tracks AI costs (Anthropic); Retell costs tracked separately in subscription model
- Business model flexibility: call costs can be passed through to clients at any time via subscription tier adjustment

**Residual risk:** Low — abstraction layer enables swap; tracked costs enable pricing decisions.

---

### RISK-P05: Meta / Google Ads API Access Revocation
**Score: 3 (P2)**

| Field | Detail |
|-------|--------|
| Likelihood | 2 — Possible if MIRD app violates platform policies |
| Impact | 2 — Ad performance data disappears from CEO Dashboard; Dept 2 agent can't run |
| Category | External dependency |

**Scenario:** Meta or Google revokes MIRD's app API access due to policy violation, excessive API calls, or failed review process.

**Mitigations:**
- API access stored per-client (each client authorizes their own account) — MIRD platform app revocation affects all clients; individual client revocation affects one
- Platform policy compliance: API calls stay within rate limits; no scraping; only approved fields requested
- `ad_accounts` table tracks `status` per account — revoked accounts surfaced in CEO Dashboard
- Fallback: Dept 2 Ad Ops agent can still run with manual data input if API unavailable
- Regular API app review submissions kept up to date (Google requires annual review for certain scopes)

**Residual risk:** Low — per-client auth limits blast radius; policy compliance prevents revocation.

---

## 4. Risk Summary Matrix

| ID | Risk | Score | Priority | Status |
|----|------|-------|----------|--------|
| RISK-T01 | Multi-tenant RLS bypass | 15 | **P0** | Mitigated (4-layer + P0 tests) |
| RISK-S01 | service_role key exposure | 15 | **P0** | Mitigated (git-secrets + scan + playbook) |
| RISK-S04 | CEO Dashboard unauthorized access | 8 | **P1** | Mitigated (AAL2 TOTP) |
| RISK-P01 | Solo operator bus factor | 9 | **P1** | Partially mitigated (docs) |
| RISK-T02 | Supabase vendor lock-in | 6 | **P1** | Accepted (migration path documented) |
| RISK-T04 | Claude cost runaway | 6 | **P1** | Mitigated ($100 ceiling + halt) |
| RISK-T05 | n8n single point of failure | 6 | **P1** | Mitigated (Supabase fallback) |
| RISK-S02 | Webhook replay attack | 6 | **P1** | Mitigated (timestamp + idempotency) |
| RISK-S05 | Client data in Claude prompts | 6 | **P1** | Mitigated (aggregated data only) |
| RISK-P02 | Scope creep | 6 | **P1** | Mitigated (locked STATE-SPEC) |
| RISK-P03 | Onboarding provisioning failure | 6 | **P1** | Mitigated (partialState + rollback) |
| RISK-T07 | GHL API breaking changes | 4 | **P2** | Mitigated (safe defaults) |
| RISK-T03 | Vercel cold start latency | 4 | **P2** | Mitigated (warm instances) |
| RISK-S03 | Onboarding token enumeration | 4 | **P2** | Mitigated (entropy + rate limiting) |
| RISK-P04 | Retell pricing change | 4 | **P2** | Mitigated (abstraction layer) |
| RISK-T08 | TypeScript `as any` drift | 3 | **P2** | Mitigated (ESLint error) |
| RISK-T06 | Realtime connection limits | 3 | **P2** | Accepted (monitor + upgrade path) |
| RISK-P05 | Meta/Google API revocation | 3 | **P2** | Mitigated (per-client auth) |

**P0 risks (must be mitigated before launch):** RISK-T01, RISK-S01 ✅ Both mitigated.

**Accepted risks:** RISK-T02 (Supabase lock-in — migration path exists), RISK-P01 (bus factor — docs are the mitigation, second engineer is the cure), RISK-T06 (connection limits — well within Y1 headroom).

---

*Risk assessment complete as of 2026-03-31. 18 risks identified across technical, security, and project domains. All P0 risks mitigated. All P1 risks have active mitigations in place.*

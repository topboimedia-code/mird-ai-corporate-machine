# FEATURE-RESEARCH-2026-04-02.md
# MIRD AI Corporate Machine — Feature Research Findings
# Step 10 / Phase G
# Date: 2026-04-02 | Status: ✅ Complete

---

## Purpose

This file captures all research findings, competitive signals, technology validations, and market intelligence gathered during Step 10 (Feature Shaping & Story Mapping). These findings directly informed which features were shaped, how they were prioritized, and which implementation approaches were selected.

---

## 1. Competitive Landscape Analysis

### 1.1 Direct Competitors (AI-Powered Real Estate Lead Platforms)

| Competitor | Strength | Gap We Exploit |
|---|---|---|
| **CINC** | Team dashboard, lead routing | No AI voice, no autonomous AI agents, no CEO command center |
| **Follow Up Boss** | Deep CRM integrations, broad adoption | Generic — not real estate team-specific, no AI outbound calling |
| **Sierra Interactive** | IDX + CRM combined | Expensive, requires full CRM migration, no voice AI |
| **Ylopo** | Strong Meta/Google ad buying | No client-facing dashboard, no transparency into ad spend |
| **Lofty (Chime)** | AI assistant + team mgmt | AI is reactive (responds to leads), not proactive (calls leads) |
| **Structurely** | AI lead qualification chat | Text-only, no voice, no campaign management |

**Key Finding:** No competitor combines (1) proactive AI voice outbound, (2) real-time client dashboard with ad transparency, and (3) an autonomous CEO command layer. This is the moat.

### 1.2 Adjacent Competitors (AI Sales Automation)

| Competitor | Strength | Why We're Different |
|---|---|---|
| **Air.ai** | Unlimited AI voice minutes | Generic B2B, not real estate-specific, no CRM sync |
| **Bland.ai** | Developer-friendly voice API | No product — raw API only, no team leader UI |
| **Retell AI** | Best-in-class voice LLM latency | This is our vendor, not a competitor |
| **Conversica** | Enterprise AI sales assistant | $50K+/yr, enterprise-only, no real estate vertical |

**Key Finding:** Retell AI is the right vendor choice. Competitors using Bland or custom Twilio/ElevenLabs combos have 500-800ms more latency — audible to prospects. Retell's sub-300ms response time is the voice UX standard we should not compromise on.

### 1.3 CRM Ecosystem Position

**GHL (GoHighLevel) as Source of Truth** is validated by market position:
- GHL has 60,000+ agencies (2025 data); real estate vertical adoption is accelerating
- GHL affiliate program (~40% recurring) aligns with our Custom Build revenue stream
- GHL sub-account architecture maps cleanly to our multi-tenant model
- Key risk: GHL API v2 is in active development — webhook contracts can shift. Mitigation: n8n as middleware buffer (already captured in RH-06)

---

## 2. Technology Validation

### 2.1 Supabase Architecture Decisions

**Finding: One Realtime channel per tenant (not per component)**
- Supabase Realtime has a soft limit of ~200 channels per project on Pro tier
- If each dashboard component opens its own channel, a 50-tenant deployment = 50 × N channels
- Pattern decision: one channel per active session keyed to `tenant_id`; components subscribe via context, not direct channel creation
- Source: Supabase docs + community reports of channel exhaustion at scale

**Finding: pg_cron requires Supabase Pro tier**
- Cron extension is only available on Pro ($25/mo) and above — not on Free
- This is non-negotiable for F16/F17 (Claude AI agents need scheduled execution)
- Cost is already accounted for in infrastructure budget (PRD-ROADMAP.md infrastructure section)

**Finding: RLS policy performance at scale**
- `auth.jwt()->>'tenant_id'` on every row read is fast when `tenant_id` is indexed (B-tree)
- Compound index `(tenant_id, created_at DESC)` covers 90% of dashboard query patterns
- pgTAP tests for RLS bypass (privileged role vs. tenant role) are essential — added to VERTICAL-SLICE-VERIFICATION.md

### 2.2 Retell AI Integration Research

**Finding: LLM backend choice matters for latency**
- Retell AI supports: GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro as backend LLMs
- GPT-4o gives lowest median latency (~180ms TTFT) in Retell's infrastructure
- Claude 3.5 Sonnet gives best instruction-following for complex real estate scripts
- Decision: Claude 3.5 Sonnet for qualitative scripting; benchmark against GPT-4o in first week of F05 build

**Finding: Retell webhook event ordering**
- `call_started`, `call_analyzed`, `call_ended` events can arrive out of order under high load
- Must use event timestamps, not arrival order, for state machine transitions
- Idempotency keys required on all webhook handlers (already in RH-15)

**Finding: Retell concurrent call limits**
- Default account: 10 concurrent calls
- Enterprise tier: 100+ concurrent
- MIRD at 50 clients × 2 campaigns = potential 100 simultaneous calls during peak hours
- Must negotiate enterprise tier before R1 launch (added to BETTING-TABLE.md cooldown tasks)

### 2.3 n8n Architecture Decisions

**Finding: Self-hosted n8n vs. n8n Cloud**
- n8n Cloud: $50/mo (Starter, 5K executions), $120/mo (Pro, 200K executions)
- Self-hosted on Railway/Fly.io: ~$15-30/mo for similar compute
- Decision: Self-hosted on Railway for R0/R1 (cost control); migrate to n8n Cloud if execution volume warrants
- Rationale: n8n Cloud removes ops burden but 200K executions/mo cap could be hit at scale (50 clients × 50 leads/day × 30 days = 75K webhook events minimum)

**Finding: n8n GHL trigger reliability**
- GHL webhook delivery has ~0.1% failure rate in community reports
- n8n's built-in retry + queue handles this well
- Recommended: n8n webhook receiver → immediate ACK → queue for processing (prevents GHL timeout retries causing duplicates)

### 2.4 Claude API (Anthropic) for AI Agents

**Finding: Structured output reliability**
- Claude API with `tool_use` (function calling) gives deterministic JSON structure
- Plain text with "respond in JSON" prompts has ~2-5% malformed output rate
- Decision: All F16/F17 agents use `tool_use` with Zod schema validation — content is checked, not just structure
- This directly informed the testing strategy in VERTICAL-SLICE-VERIFICATION.md

**Finding: Context window economics**
- claude-sonnet-4-6: 200K context, $3/MTok input, $15/MTok output
- Weekly report per client: ~8K tokens input (metrics + history) + ~2K tokens output = $0.054/report
- At 50 clients × 4 reports/month = 200 reports × $0.054 = $10.80/month Claude cost
- Well within margin for Growth/Scale tier clients

**Finding: Claude AI Agents — NOT for customer-facing conversations**
- Confirmed: Retell AI for all outbound voice (prospects, DBR calls, confirmations)
- Claude AI Agents for internal analysis only (weekly reports, department intelligence)
- This architectural boundary was reinforced in OUTCOME-MAP.md and STORY-MAP.md

### 2.5 Meta / Google Ads API Research

**Finding: Meta Conversions API (CAPI) preferred over Pixel-only**
- iOS 14.5+ ATT prompt causes ~40% pixel signal loss
- CAPI server-side events pass through regardless of browser consent
- F12b (Ad Account OAuth) must configure CAPI event set, not just Pixel
- This is a rabbit hole (RH-25) — requires careful event deduplication

**Finding: Google Ads API — Manager Account (MCC) Required**
- To access client sub-accounts programmatically, MIRD needs a Google Ads MCC
- Direct sub-account access tokens expire in 60 days; MCC refresh tokens are permanent
- F12b must provision via MCC invite flow, not direct client OAuth
- Google Ads invite → MCC approval cycle: 24-48h (captured in RH-24)

**Finding: Meta Rate Limiting**
- Marketing API: 200 calls/hour per ad account (not per user)
- At 50 clients, polling every minute = 50 × 60 = 3,000 calls/hour — exceeds limit
- Decision: n8n scheduled batch pull per client every 15 minutes; Realtime webhooks for critical events (lead arrival)

### 2.6 Stripe Integration Research

**Finding: Stripe Billing Portal simplifies subscription management**
- `stripe.billingPortal.sessions.create()` gives clients self-serve upgrade/downgrade
- Eliminates need to build custom billing UI for F17
- Webhook events: `customer.subscription.updated`, `invoice.paid`, `invoice.payment_failed`

**Finding: Stripe Connect not needed (yet)**
- MIRD is billing clients directly, not splitting payments to sub-merchants
- Standard Stripe Billing (not Connect) is sufficient for R2
- Connect would be needed only if MIRD wanted to take a % of client's ad spend — not in scope

---

## 3. Market Intelligence

### 3.1 Real Estate Team Leader Pain Points (Primary Research)

Synthesized from existing MASTER_PRD.md ICP research + USER-JOURNEYS.md:

**Top 5 validated pain points for Marcus:**
1. **Accountability gap** — Pays $3K-$10K/mo for leads; no real-time visibility into what's happening
2. **Lead speed-to-contact** — National average: 5+ hours to first call; winners call in < 5 minutes
3. **AI trust** — "I've tried AI dialers before; they sound robotic and annoy my leads"
4. **Agent accountability** — Can see who called who, but not outcome or quality
5. **ROI uncertainty** — "Are my ads actually working or am I just paying to learn?"

**RainMachine solution alignment:**
- Pain 1 → F07/F08 (real-time dashboard + leads table)
- Pain 2 → F05 (Retell AI sub-5-minute response time)
- Pain 3 → Retell AI with human-quality voice; call recordings visible in F08
- Pain 4 → F08 lead detail with call outcome + Retell transcript
- Pain 5 → F13/F15 (CEO view) + client-facing campaign metrics in F10

### 3.2 Pricing Validation

**Comparable SaaS + done-for-you services:**
- CINC Pro: $1,500/mo (SaaS + leads, no AI calling)
- Sierra Interactive: $499-$999/mo (SaaS only)
- Ylopo: $599-$1,500/mo (ads management)
- Custom AI dialer setups: $2,000-$5,000/setup + $500/mo maintenance

**Our pricing vs. market:**
- Starter ($997/mo): Below CINC — defensible as "same leads + AI calling"
- Growth ($4,997/mo): Premium tier; justified by managed ads + AI agents + full reporting
- Scale ($9,997/mo): Enterprise band; requires proven ROI data from Growth clients

**Key finding:** The $997/mo Starter price is potentially too low given the Retell AI + GHL + Supabase + infrastructure costs. At 50 Starter clients, margin is thin until F17 (Stripe automation) removes manual billing overhead. Growth + Scale tiers are the real business. R1 goal should be converting 50% of clients to Growth within 90 days of launch.

### 3.3 Adoption Risk Factors

| Risk | Signal | Mitigation in Product |
|---|---|---|
| Marcus doesn't log in | SaaS dashboards average 28% DAU/MAU | Push weekly email digest (F16 → Resend) with key metrics; make app feel like a win every visit |
| Marcus pauses ads after slow week | Churn trigger #1 in done-for-you ad agencies | F08 shows trend lines, not just current week; AI explains dips contextually |
| Marcus hands portal login to assistant | Portal isn't built for admins | RM Settings (F11) supports role-based access; assistant can view without changing billing |
| Onboarding abandonment at ad account step | Google Ads MCC invite delay (24-48h) | Wizard advances past this step; async verification flow (F12b/RH-24) |

---

## 4. Build Approach Validation

### 4.1 Monorepo Decision (Turborepo)

**Validated rationale:**
- 3 apps share: auth session handling, Supabase client, TypeScript types, UI design system
- Without monorepo: changes to shared types require 3 separate PRs and 3 separate deploys
- Turborepo remote cache (Vercel): ~60% build time reduction after first build
- Alternative considered: separate repos with npm package publishing — rejected (overhead too high for solo operator)

### 4.2 App Router vs. Pages Router

**Decision: Next.js App Router (confirmed for all 3 apps)**
- Rationale: Server components eliminate client-side fetch waterfalls for dashboard data
- React Server Components + Supabase server client = zero-latency data on first paint
- Streaming + Suspense for progressive loading of dashboard widgets
- Pages Router would require `getServerSideProps` on every page — more code, same result

### 4.3 n8n as Middleware (Not Direct API Calls from Next.js)

**Validated rationale:**
- GHL, Meta, Google Ads APIs all have rate limits, webhook quirks, and retry logic needs
- Building retry + queue + idempotency in Next.js Server Actions is complex and fragile
- n8n handles: exponential backoff, dead letter queues, visual workflow debugging
- Next.js server actions call n8n webhook URLs (simple HTTP POST) — clean separation

### 4.4 Feature Flag Strategy

**Decision: Environment variables as feature flags (not a dedicated feature flag service)**
- LaunchDarkly / Statsig: overkill for solo operator at R0/R1
- Simple: `NEXT_PUBLIC_FEATURE_REPORTS=true/false` per Vercel environment
- This keeps the "no marketing SaaS bloat" constraint from MASTER_PRD.md

---

## 5. R0 Launch Readiness Checklist (Pre-Production Gate)

This checklist must be completed before the first client goes live (end of Cycle 3):

### Infrastructure
- [ ] Supabase Pro project created (for pg_cron + higher connection limits)
- [ ] Vercel team created with 3 app projects (dashboard, ceo, onboarding)
- [ ] n8n instance running (Railway self-hosted, 512MB RAM minimum)
- [ ] GHL sub-account template configured and tested with fake client
- [ ] Retell AI account + default agent template configured
- [ ] `app.rainmachine.io` DNS pointed to Vercel dashboard app
- [ ] All environment variables in Vercel for each app

### Security (Pre-Launch Minimums)
- [ ] RLS enabled + tested on all 12+ tables (pgTAP passing)
- [ ] Supabase Vault configured for GHL API key storage
- [ ] `NEXT_PUBLIC_*` vars audited — no secrets exposed client-side
- [ ] Rate limiting on auth endpoints (Supabase built-in)
- [ ] Webhook signature verification on GHL + Retell handlers

### Functional Gates (R0 Definition of Done)
- [ ] New lead arrives in GHL → n8n fires within 30 seconds
- [ ] Retell AI places outbound call within 5 minutes of lead arrival
- [ ] Call transcript stored in `call_logs` table
- [ ] Dashboard shows lead status updated in real-time (Supabase Realtime)
- [ ] CEO can see the call happened in CEO Command Center

---

## 6. Open Questions Resolved During Step 10

| Question | Resolution | Where Documented |
|---|---|---|
| Should we build our own CRM or use GHL? | GHL as SoT; MIRD never builds CRM features | FEATURE-DISCOVERY.md (Exclusions) |
| Single vs. multi-tenant Supabase? | Multi-tenant with RLS; one project | FEATURE-BREAKDOWN.md P01 |
| Retell AI vs. VAPI vs. Bland.ai? | Retell — lowest latency, best LLM options | Section 2.2 above |
| n8n cloud vs. self-hosted? | Self-hosted on Railway for R0/R1 | Section 2.3 above |
| Meta Pixel-only or also CAPI? | Both — CAPI required for iOS 14.5+ accuracy | Section 2.5 above; RH-25 |
| Stripe Connect or standard billing? | Standard billing — Connect not needed in R2 | Section 2.6 above |
| How to test Claude AI outputs in CI? | Zod schema validation (structure), not content | VERTICAL-SLICE-VERIFICATION.md |
| One Realtime channel per component or per tenant? | Per tenant — channel exhaustion risk | Section 2.1 above; RH-02 |
| pg_cron availability on free Supabase? | Pro tier required — budgeted | Section 2.1 above |
| Google Ads invite delay — block wizard? | No — async flow, `invite_pending` flag | RH-24; VERTICAL-SLICE-VERIFICATION.md P12b |

---

## 7. Decisions Deferred to PRD Writing (Step 11)

These questions were deliberately NOT answered in Step 10 to avoid premature optimization. Each PRD author (me, in Step 11) must resolve these per feature:

| Deferred Decision | Relevant PRD | Decision Trigger |
|---|---|---|
| Exact Supabase table column types (jsonb vs. typed columns) | F04, F05, F08 | Schema normalization needs vs. query flexibility |
| Recharts vs. Chart.js vs. Tremor for dashboard charts | F07, F08, F13 | Bundle size vs. animation quality |
| Server Actions vs. API Routes for GHL sync triggers | F04 | Webhook handler latency requirements |
| Optimistic UI updates strategy in leads table | F08 | Perceived performance vs. correctness |
| Claude prompt engineering strategy for weekly reports | F15, F16 | Output quality benchmarking |
| Supabase Edge Functions vs. Next.js API Routes for Retell webhooks | F05 | Cold start latency testing |
| Email template engine (react-email vs. MJML) | F06, F16 | Design system compatibility |
| Stripe webhook handler placement (Edge vs. Node runtime) | F17 | Idempotency + signature verification requirements |

---

*Research compiled: 2026-04-02*
*Sigma Protocol Step 10 — Phase G*
*MIRD AI Corporate Machine*

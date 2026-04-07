# ARCHITECTURE.md — Make It Rain Digital (MIRD)
## RainMachine Platform — Technical Architecture

**Version:** 1.0
**Date:** 2026-03-29
**Author:** Principal Architect
**Status:** Production Blueprint

---

## Table of Contents

1. [System Overview & Design Philosophy](#1-system-overview--design-philosophy)
2. [Bounded Contexts](#2-bounded-contexts)
3. [Component Diagram](#3-component-diagram)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [Technology Stack with Rationale](#5-technology-stack-with-rationale)
6. [Integration Architecture](#6-integration-architecture)
7. [Architecture Decision Records (ADRs)](#7-architecture-decision-records-adrs)
8. [Phase Roadmap](#8-phase-roadmap)

---

## 1. System Overview & Design Philosophy

### What MIRD Builds

Make It Rain Digital is an AI-powered client acquisition company serving real estate team leaders and insurance agency owners. The platform has two products:

- **RainMachine** — AI-powered CRM platform (client-facing dashboard layered on GHL)
- **Rainmaker Leads** — Done-for-you ad management (Meta + Google Ads, managed by MIRD)

### The Three AI Systems (Critical Separation)

This architecture strictly separates three AI systems that must never be conflated:

| System | Facing | Trigger | Purpose |
|--------|--------|---------|---------|
| **Retell AI** | Customer-facing | New leads, cold outbound, DBR campaigns | Voice calls to prospects |
| **GHL Native Voice Agent** | Customer-facing | Warm contacts: confirmations, no-shows, inbound | Voice calls to existing contacts |
| **Claude AI Agents** | Internal ONLY | Scheduled cron / CEO loop | Business operations, reporting, monitoring |

### Design Philosophy

**1. Simplicity over cleverness.** This is a solo-operator business. Every architecture decision must be executable by one person with AI assistance. Avoid distributed systems complexity that requires a DevOps team.

**2. GHL as the source of truth for contacts.** GHL owns the contact record, pipeline stage, and appointment data. Every other system reads from or writes back to GHL. Never duplicate contact state outside GHL without a clear sync strategy.

**3. Supabase as the analytical and operational database.** GHL has poor query capabilities for reporting. Supabase holds the data warehouse layer: metrics, aggregates, AI outputs, and multi-tenant state that GHL can't model.

**4. n8n as the automation backbone.** GHL automations handle simple triggers. n8n handles complex multi-step workflows that cross system boundaries (GHL → Retell AI → Supabase → Slack).

**5. Claude agents are scheduled workers, not real-time handlers.** They run on cron, read aggregated data, generate structured outputs, and surface results in the CEO dashboard. They are not in the hot path of any customer-facing interaction.

**6. Multi-tenancy from day one.** Every table row is scoped to an `organization_id`. RLS policies enforce this at the database level. No application-level tenant filtering can be trusted alone.

**7. Build & Release is a cloning operation.** A Build & Release client receives the entire MIRD stack deployed as isolated instances. The architecture must support this from the start by externalizing all configuration.

---

## 2. Bounded Contexts

The system is divided into three bounded contexts. Each context owns its data and exposes interfaces to the others. Cross-context communication is always explicit — no shared mutable state between contexts.

### Context 1: MIRD Operations

**Owner:** Shomari (MIRD admin)
**Responsibility:** Running the MIRD business itself — client acquisition, ad operations, product delivery, finance

**Components:**
- CEO Dashboard (`apps/ceo-dashboard`) — North Star metrics, Claude agent outputs, escalation queue
- Claude AI Department Agents (`packages/ai-agents`) — 4 agents running scheduled operations
- Apollo prospecting integration (Dept 1)
- Ad performance monitoring (Dept 2)
- GHL buildout automation (Dept 3)
- Finance/MRR tracking (Dept 4)
- MIRD's own GHL agency account

**Data it owns:**
- `subscriptions` table (MRR, churn, plan changes)
- `organizations` table (all MIRD clients)
- `agent_performance` table (AI agent run logs)
- `reports` table (generated reports from Claude agents)

### Context 2: RainMachine Platform

**Owner:** MIRD (operator), Client (tenant)
**Responsibility:** Delivering the CRM dashboard product to clients — lead tracking, pipeline visibility, agent management, AI call summaries

**Components:**
- RainMachine Dashboard (`apps/dashboard`) — client-facing Next.js app
- GHL sub-account per client (pipeline, contacts, automations)
- GHL Native Voice Agent (warm contact calls)
- Client Onboarding Portal (`apps/onboarding`)

**Data it owns:**
- `leads` table (contact records synced from GHL)
- `appointments` table (booked/confirmed/no-show state)
- `ai_calls` table (Retell AI + GHL Voice call records)
- `agents` table (client's agent roster)
- `ghl_accounts` table (sub-account credentials and config)

### Context 3: Rainmaker Leads

**Owner:** MIRD (operator), Client (beneficiary)
**Responsibility:** Running paid advertising for clients — Meta, Google, creative performance, CPL reporting

**Components:**
- Meta Marketing API integration (`packages/meta-client`)
- Google Ads API integration (`packages/google-ads-client`)
- Ad performance reports (surfaced in CEO dashboard and client dashboard)
- Retell AI (new lead → immediate voice call)

**Data it owns:**
- `campaigns` table (Meta + Google campaign metadata)
- `ad_accounts` table (client's Meta BM + Google Ads accounts)
- `dbr_campaigns` table (Database Reactivation campaign state)

---

## 3. Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          MAKE IT RAIN DIGITAL — SYSTEM ARCHITECTURE             │
└─────────────────────────────────────────────────────────────────────────────────┘

 ┌──────────────────────────────────────────────────────────────────────────────┐
 │  EXTERNAL USERS                                                              │
 │                                                                              │
 │  [Prospect/Lead]    [Client: Marcus]    [Client's Agents]    [Shomari/MIRD]  │
 └───────┬─────────────────┬──────────────────┬──────────────────────┬──────────┘
         │                 │                  │                      │
         ▼                 ▼                  ▼                      ▼
 ┌───────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐
 │  META ADS /   │  │  RAINMACHINE │  │  RAINMACHINE │  │   CEO DASHBOARD      │
 │  GOOGLE ADS   │  │  DASHBOARD   │  │  DASHBOARD   │  │   (ceo-dashboard)    │
 │  (lead form)  │  │  (dashboard) │  │  (agent view)│  │   Next.js 15         │
 └───────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘
         │                 │                  │                      │
         │          ┌──────▼──────────────────▼──────┐              │
         │          │         SUPABASE                │              │
         │          │   PostgreSQL + RLS + Auth        │◄─────────────┘
         │          │   Edge Functions (webhooks)      │
         │          └───────────────┬─────────────────┘
         │                          │
         ▼                          │
 ┌───────────────────────────────── │ ──────────────────────────────────────────┐
 │  GoHighLevel (GHL)               │                                           │
 │  ┌─────────────────────────────┐ │  ┌──────────────────────────────────────┐ │
 │  │  MIRD Agency Account        │ │  │  Client Sub-Account (per client)     │ │
 │  │  - Master pipelines         │ │  │  - Contacts & pipeline               │ │
 │  │  - Automations              │ │  │  - Custom values                     │ │
 │  │  - GHL Native Voice Agent   │◄┘  │  - Calendars & appointments          │ │
 │  │  - Webhooks → n8n           │    │  - GHL Native Voice Agent (warm)     │ │
 │  └─────────────┬───────────────┘    └──────────────────────────────────────┘ │
 └────────────────│──────────────────────────────────────────────────────────────┘
                  │
                  ▼
 ┌────────────────────────────────────────────────────────────────────────────────┐
 │  n8n AUTOMATION LAYER                                                          │
 │  ┌─────────────────┐  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐  │
 │  │  Lead Router    │  │  Retell AI     │  │  Ad Report   │  │  Onboarding  │  │
 │  │  Workflow       │  │  Trigger WF    │  │  Sync WF     │  │  Provisioner │  │
 │  └────────┬────────┘  └───────┬────────┘  └──────┬───────┘  └──────┬───────┘  │
 └───────────│───────────────────│──────────────────│─────────────────│───────────┘
             │                   │                  │                 │
             ▼                   ▼                  ▼                 ▼
 ┌───────────────────┐  ┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐
 │   RETELL AI       │  │  META ADS API  │  │ GOOGLE ADS API   │  │  SLACK           │
 │   Voice System    │  │  System User   │  │  OAuth + refresh │  │  Webhook alerts  │
 │   - New leads     │  │  token (fixed) │  │  token           │  │  #mird-alerts    │
 │   - Cold outbound │  │  Insights API  │  │  Reports API     │  │  #ceo-loop       │
 │   - DBR calls     │  └────────────────┘  └──────────────────┘  └──────────────────┘
 └───────────────────┘

 ┌────────────────────────────────────────────────────────────────────────────────┐
 │  CLAUDE AI DEPARTMENT AGENTS  (internal, scheduled, never customer-facing)    │
 │                                                                                │
 │  ┌────────────────────┐  ┌────────────────────┐                               │
 │  │  DEPT 1            │  │  DEPT 2            │                               │
 │  │  Growth & Client   │  │  Ad Ops & Delivery │                               │
 │  │  Acquisition       │  │                    │                               │
 │  │  - Apollo prospect │  │  - CPL monitoring  │                               │
 │  │  - Outbound seqs   │  │  - Campaign health │                               │
 │  │  - Sales pipeline  │  │  - Creative perf   │                               │
 │  └────────────────────┘  └────────────────────┘                               │
 │  ┌────────────────────┐  ┌────────────────────┐                               │
 │  │  DEPT 3            │  │  DEPT 4            │                               │
 │  │  Product &         │  │  Finance & BI      │                               │
 │  │  Automation        │  │                    │                               │
 │  │  - GHL buildouts   │  │  - MRR tracking    │                               │
 │  │  - n8n workflows   │  │  - Churn alerts    │                               │
 │  │  - Retell configs  │  │  - P&L             │                               │
 │  │  - Onboarding      │  │  - North Star KPIs │                               │
 │  └────────────────────┘  └────────────────────┘                               │
 └────────────────────────────────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────────────────────────────────┐
 │  CLIENT ONBOARDING PORTAL  (apps/onboarding)                                  │
 │  - Meta BM access capture                                                      │
 │  - Google Ads account access                                                   │
 │  - Google My Business access                                                   │
 │  - Business info, ICP details, creative assets                                 │
 │  - Triggers n8n provisioning workflow                                          │
 └────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Flow Diagrams

### Flow 1: New Lead → AI Call → Appointment Booked

```
1. LEAD CAPTURE
   Meta Ads / Google Ads
         │
         │  Lead form submission
         ▼
   GHL (contact created, pipeline stage: "New Lead")
         │
         │  GHL Webhook: contact.created
         ▼
   n8n: Lead Router Workflow
         │
         ├── Write lead to Supabase (leads table, status: 'new')
         │
         ├── Qualify: Is this a new or existing contact?
         │     ├── NEW → Route to Retell AI
         │     └── WARM (existing contact) → Route to GHL Native Voice Agent
         │

2. RETELL AI CALL (new leads only)
   Retell AI: Outbound call initiated
         │
         │  [Live call — Retell AI handles entirely]
         │  Outcome: voicemail | no_answer | interested | not_interested | callback
         ▼
   Retell AI Webhook: call.ended
         │
         ▼
   Supabase Edge Function: /webhooks/retell
         │
         ├── Upsert ai_calls record (transcript, outcome, duration, sentiment)
         ├── Update leads.status in Supabase
         └── Trigger n8n: Post-Call Router
               │
               ├── outcome=interested → GHL: update contact tag, move pipeline stage
               │                     → GHL: send appointment booking SMS/email
               ├── outcome=voicemail → schedule follow-up (day 2, day 5)
               └── outcome=not_interested → GHL: tag DNC, archive

3. APPOINTMENT BOOKING
   Prospect books via GHL calendar link
         │
         │  GHL Webhook: appointment.created
         ▼
   n8n: Appointment Confirmation Workflow
         │
         ├── Write to Supabase appointments table (status: 'scheduled')
         ├── GHL Native Voice Agent: Confirmation call (24hr before)
         └── Slack: notify #mird-alerts if high-value appointment

4. APPOINTMENT CONFIRMED
   GHL Native Voice Agent: Reminder call (2hr before)
         │
         │  Call outcome: confirmed | no_show | reschedule
         ▼
   n8n: Update appointment status
         │
         ├── Supabase: appointments.status = 'confirmed' | 'no_show'
         └── If no_show → GHL Native Voice Agent: re-engagement sequence
```

### Flow 2: Client Onboarding

```
1. SALE CLOSED
   GHL pipeline: deal moves to "Closed Won"
         │
         │  GHL Webhook: opportunity.status_changed
         ▼
   n8n: New Client Trigger Workflow
         │
         └── Create organization record in Supabase
             └── Generate onboarding portal invite link
                 └── Send email: "Your RainMachine setup starts here"

2. ONBOARDING PORTAL (apps/onboarding)
   Client fills out:
   ├── Business info (name, address, ICP description, logo)
   ├── Meta Business Manager → grants MIRD System User access
   ├── Google Ads → grants MIRD MCC access, captures Customer ID
   ├── Google My Business → grants access, captures Location ID
   ├── Creative assets (logos, photos, headshots)
   └── Target markets / geographic focus
         │
         │  Form submit → POST /api/onboarding/submit
         ▼
   Supabase: organizations updated, ad_accounts created
         │
         ▼
   n8n: Provisioning Workflow
         │
         ├── GHL API: Create sub-account for client
         ├── GHL API: Configure pipeline, tags, calendars from MIRD template
         ├── GHL API: Send client sub-account access email
         ├── Retell AI API: Create agent for this client (from template)
         ├── Supabase: ghl_accounts.provisioned = true
         └── Slack: #mird-ops "New client provisioned: [Name]"

3. BUILD & RELEASE (additional steps)
   If subscription.plan = 'build_and_release':
         │
         ├── Vercel: Deploy new dashboard instance (env vars scoped to client)
         ├── Supabase: New RLS scope for client's org
         ├── n8n: Clone all MIRD workflows, update webhook URLs
         ├── GHL: Stand up client's own agency account (not sub-account)
         └── Claude Agents: Deploy client-scoped agent instances
```

### Flow 3: CEO Loop Data Aggregation (30-Minute Loop)

```
SCHEDULE: Morning 7AM, Midday 12PM, Evening 6PM (cron)

n8n: CEO Loop Aggregator Workflow
         │
         ├── [Parallel fetch]
         │     ├── GHL API: Today's leads by sub-account
         │     ├── GHL API: Today's appointments (confirmed/no-show)
         │     ├── Supabase: ai_calls today (Retell + GHL voice)
         │     ├── Meta API: Last 7 days spend + CPL (full window, single call)
         │     ├── Google Ads API: Last 7 days spend + CPL
         │     ├── Supabase: subscriptions (MRR, any changes last 24hr)
         │     └── Supabase: agent_performance (last 3 agent runs, any errors)
         │
         ▼
   Claude Dept 4 Agent: Analyze aggregated data
         │
         │  Prompt: "Here is today's data snapshot. Generate North Star summary.
         │           Flag: any CPL spikes >20%, any no-show rate >40%,
         │           any automation failures, any churn risk signals."
         ▼
   Structured JSON output:
   {
     north_star: { mrr, leads_today, calls_today, appt_booked, appt_rate },
     flags: [ { severity, category, message, recommended_action } ],
     ad_summary: { total_spend, blended_cpl, top_campaign, underperformer },
     wins: [ string ],
     priorities: [ string ]
   }
         │
         ▼
   Supabase: Insert reports row (type: 'ceo_loop', period: 'morning|midday|evening')
         │
         ├── CEO Dashboard: Reads latest report, renders North Star UI
         └── Slack: #ceo-loop → formatted summary message
```

---

## 5. Technology Stack with Rationale

### Frontend

| Technology | Rationale |
|------------|-----------|
| **Next.js 15 (App Router)** | Server Components reduce client JS bundle. Streaming supports real-time AI output rendering. File-based routing maps cleanly to the 3 apps. Vercel deployment is zero-config. |
| **Tailwind CSS** | Utility-first, no CSS file sprawl. Consistent design tokens across 3 apps via `packages/shared`. |
| **shadcn/ui** | Accessible component primitives that are copy-owned (not a dependency). Avoids version lock. |

### Backend / Database

| Technology | Rationale |
|------------|-----------|
| **Supabase (PostgreSQL + RLS)** | Row-Level Security enforces multi-tenancy at the DB layer — not just in application code. Real-time subscriptions enable live dashboard updates. Built-in auth with JWT. Edge Functions handle webhooks without a dedicated server. |
| **Supabase Edge Functions** | Webhook receivers (GHL, Retell AI) need low-latency response. Edge Functions are globally distributed and respond in <50ms before handing off to n8n or the DB. |

### Automation

| Technology | Rationale |
|------------|-----------|
| **n8n (self-hosted on Railway)** | GHL's native automations lack cross-system capabilities. n8n provides visual workflow editor, error handling, retry logic, and webhook chaining. Self-hosted on Railway avoids per-execution pricing at scale. All workflow JSON is version-controlled in `n8n/workflows/`. |

### AI

| Technology | Rationale |
|------------|-----------|
| **Claude API (claude-sonnet-4-5)** | Internal agents only. Structured output mode (`tool_use`) ensures JSON responses that can be stored and rendered. Long context handles full ad account data + call transcripts in a single prompt. |
| **Retell AI** | Purpose-built for outbound voice AI. Handles ASR, TTS, conversation management, and call recordings. Webhook-based outcome reporting integrates cleanly with n8n. |

### CRM & Voice

| Technology | Rationale |
|------------|-----------|
| **GoHighLevel (GHL) API v2** | GHL is the CRM layer — contacts, pipelines, appointments, automations, and the Native Voice Agent. API v2 provides stable REST endpoints. Sub-account model maps directly to MIRD's multi-tenant client structure. |

### Advertising

| Technology | Rationale |
|------------|-----------|
| **Meta Marketing API** | System Users provide non-expiring tokens — eliminates the 60-day OAuth re-auth problem. Ad Insights API supports the "full window as single call" pattern required by the Fruit Salad Rule. |
| **Google Ads API** | OAuth with refresh token stored in Supabase. MCC (Manager) account provides access to all client accounts from a single credential. |

### Infrastructure

| Technology | Rationale |
|------------|-----------|
| **Vercel** | Zero-config Next.js deployment. Preview deployments per branch. Environment variables per project. Free tier covers initial scale. |
| **Slack** | Webhook alerts for n8n errors, Claude agent outputs, client flags. #ceo-loop and #mird-alerts channels are the notification surface. |

---

## 6. Integration Architecture

### GHL ↔ n8n

GHL webhooks fire on contact, appointment, and opportunity events. All GHL webhooks point to n8n webhook URLs (not directly to Supabase — n8n handles routing logic first).

```
GHL Event → n8n Webhook URL → n8n Workflow:
  contact.created          → Lead Router
  appointment.created      → Appointment Confirmation
  appointment.status       → Appointment Outcome Handler
  opportunity.status       → Deal Stage Handler (Closed Won → provisioning)
  form.submitted           → Intake Router
```

### n8n ↔ Retell AI

n8n calls the Retell AI REST API to initiate outbound calls:

```
POST https://api.retellai.com/v2/create-phone-call
{
  "from_number": "+1MIRD_NUMBER",
  "to_number": "{{lead.phone}}",
  "agent_id": "{{retell_agent_id_for_client}}",
  "metadata": {
    "lead_id": "{{supabase_lead_id}}",
    "org_id": "{{organization_id}}",
    "ghl_contact_id": "{{ghl_contact_id}}"
  }
}
```

Retell AI fires `call.ended` webhook → Supabase Edge Function `/webhooks/retell` → n8n Post-Call Router.

### n8n ↔ Supabase

n8n uses the Supabase REST API (via HTTP Request nodes) with a service role key. All writes to Supabase from n8n use the service role (bypasses RLS — intentional for automation layer).

### n8n ↔ Meta API

n8n runs the Meta Ads sync workflow on schedule (every 6 hours). Uses the Meta Marketing API with System User access token stored in n8n credentials (not in Supabase). The Fruit Salad Rule is enforced in the n8n workflow:

```
// CORRECT — single API call for full date window
GET /act_{ad_account_id}/insights
  ?fields=spend,impressions,clicks,actions,cost_per_action_type
  &time_range={"since":"2026-03-01","until":"2026-03-29"}
  &level=campaign

// WRONG — never do this
for each day in date_range:
  GET /insights?date_preset=today  // creates Fruit Salad problem
```

### Claude Agents ↔ Everything

Claude agents are scheduled via n8n cron triggers. They receive a data payload assembled by n8n (not raw API access), generate structured JSON output, and n8n writes the output to Supabase and posts to Slack.

```
n8n Cron → Assemble data payload → HTTP POST to /api/agents/run
  → packages/ai-agents/[dept]/run.ts
  → Claude API (structured output)
  → Response: { report: {...}, flags: [...], actions: [...] }
  → n8n: Write to Supabase reports table
  → n8n: Post to Slack #ceo-loop
```

### GHL ↔ RainMachine Dashboard (Phase 1)

Phase 1: The RainMachine Dashboard is embedded inside GHL as a custom menu link pointing to the Vercel-hosted Next.js app. GHL passes a JWT or sub-account identifier in the URL. The dashboard reads from Supabase (not directly from GHL) for performance and flexibility.

---

## 7. Architecture Decision Records (ADRs)

### ADR-001: Supabase Edge Functions for Webhook Receivers

**Status:** Accepted
**Context:** Webhook receivers from GHL and Retell AI need to respond in <5 seconds (both platforms timeout quickly). They need to verify HMAC signatures and persist events atomically.
**Decision:** Use Supabase Edge Functions (Deno runtime, globally distributed) as the first receiver. They verify signatures, write to `webhooks_log`, and trigger n8n asynchronously via HTTP call.
**Consequences:** No server to manage. Cold start risk is low (Edge Functions warm quickly). n8n processes asynchronously — webhook ACK is decoupled from processing.

### ADR-002: n8n Self-Hosted on Railway (not GHL Automations)

**Status:** Accepted
**Context:** GHL automations are limited to GHL-internal actions. Cross-system flows (GHL → Retell AI → Supabase → Slack) require an external orchestrator.
**Decision:** Self-host n8n on Railway. All workflow JSON is exported and version-controlled in `n8n/workflows/`.
**Consequences:** Railway has reliable uptime. n8n provides visual debugging, retry logic, and error alerting to Slack. Cost: ~$10-20/mo on Railway Hobby plan.
**Rejected alternative:** Zapier/Make.com — per-task pricing becomes expensive at scale; n8n workflows are portable for Build & Release cloning.

### ADR-003: GHL Sub-Accounts (not Separate GHL Instances) for Managed Clients

**Status:** Accepted
**Context:** MIRD needs to manage Meta/Google ads and GHL pipelines for multiple clients simultaneously from a single operator view.
**Decision:** MIRD creates one GHL agency account. Each client gets a sub-account. MIRD admin can access all sub-accounts. Clients only see their sub-account.
**Consequences:** Efficient for management. Build & Release clients who want their own stack get a separate GHL agency account (not a sub-account).

### ADR-004: Meta System Users (Non-Expiring Tokens, No OAuth)

**Status:** Accepted
**Context:** Meta OAuth tokens expire in 60 days. Manual refresh creates operational risk — ads stop reporting when tokens expire.
**Decision:** Use Meta Business Manager System Users with non-expiring access tokens. MIRD's System User is added to each client's Business Manager with Analyst access. Token is stored in n8n credentials store, never in Supabase.
**Consequences:** No token refresh required. System User must be added during client onboarding — captured in the Onboarding Portal flow.

### ADR-005: Fruit Salad Rule for Meta Reporting

**Status:** Accepted
**Context:** Meta's unique metric deduplication (unique clicks, unique reach, unique link clicks) does not work when you aggregate daily API responses. Summing daily uniques overstates the true metric.
**Decision:** All Meta Insights API calls query the full reporting window as a single API call (`time_range` with `since` and `until`). Never loop over days and sum unique metrics.
**Consequences:** Slightly larger API response per call. No daily caching of unique metrics — always query full window. Enforced in `packages/meta-client/src/insights.ts` with a lint comment block.

### ADR-006: Claude Agents Run Scheduled, Not Real-Time

**Status:** Accepted
**Context:** Real-time AI analysis on every event would create unbounded API costs and latency in customer-facing flows.
**Decision:** Claude agents run on cron (6AM, 12PM, 6PM). They process batched data from Supabase. Outputs surface in CEO dashboard and Slack.
**Consequences:** Analysis lags real-time by up to 6 hours. Acceptable for the business model (Shomari reviews in 30-min CEO loops, not second-by-second). Emergency Slack alerts for critical thresholds (CPL spike >50%, automation failure) are handled by simple n8n threshold checks, not Claude.

### ADR-007: Monorepo with Turborepo

**Status:** Accepted
**Context:** 3 Next.js apps + 5 shared packages need coordinated builds, shared types, and consistent dependency management.
**Decision:** Turborepo monorepo. Shared types in `packages/shared`. Each app has its own `package.json` and Vercel project.
**Consequences:** Single `turbo build` command builds all apps. Type changes in `packages/shared` propagate to all consumers at build time. Build & Release clients get a fork of the entire monorepo.

---

## 8. Phase Roadmap

### Phase 1: GHL-Embedded Dashboard (Months 1-3)

**Goal:** Ship a working product to paying clients fast. Leverage existing GHL infrastructure.

**What gets built:**
- `apps/dashboard` — Next.js 15, deployed to Vercel, embedded in GHL via custom menu link
- Supabase schema (all tables, RLS, enums)
- GHL API wrapper (`packages/ghl-client`)
- n8n core workflows: Lead Router, Retell AI Trigger, Appointment Handler
- Retell AI full buildout (agents, phone numbers, post-call webhooks)
- Client Onboarding Portal (`apps/onboarding`) — basic version
- Claude Dept 4 Agent (Finance/BI) — North Star dashboard feeds CEO view
- CEO Dashboard (`apps/ceo-dashboard`) — read-only, North Star metrics

**Architecture state:** GHL is primary. Supabase is a reporting/analytics layer. Dashboard is embedded iframe.

**Milestone:** First paid client onboarded end-to-end through the portal, live in dashboard.

### Phase 2: Standalone Dashboard (Months 4-6)

**Goal:** RainMachine becomes a standalone product, not dependent on GHL UI for navigation.

**What gets built:**
- `apps/dashboard` — Full standalone auth (Supabase Auth), custom login, branded URL
- Agent seat management (invite agents, assign leads)
- All 4 Claude AI Department Agents operational
- Full onboarding portal with asset upload (Supabase Storage)
- n8n workflow library complete (all workflows documented and version-controlled)
- Meta + Google Ads reporting in client dashboard (not just CEO view)
- DBR campaign management UI

**Architecture state:** Supabase is now primary for auth and data. GHL is a backend sync target. RainMachine Dashboard stands alone.

**Milestone:** Client can log in to RainMachine without needing GHL access. 5+ clients on platform.

### Phase 3: Proprietary Infrastructure (Months 7-12)

**Goal:** MIRD owns the full stack. Build & Release is a productized offering.

**What gets built:**
- Build & Release provisioning automation (one-click stack clone)
- Client's own GHL agency account setup (automated via GHL API)
- Custom voice AI fine-tuning for each Build & Release client
- White-label RainMachine (client's own domain, their own branding)
- Advanced Claude agent capabilities (creative generation, A/B test recommendations)
- RainMachine mobile companion (PWA or React Native — TBD)
- API for third-party integrations (Zapier, webhooks for client's own tools)

**Architecture state:** MIRD operates as a platform. Build & Release clients are independent operators running their own MIRD-style stack.

**Milestone:** First Build & Release client fully provisioned and operational. 10+ managed clients on RainMachine.

# MCP-REQUIREMENTS.md
# MIRD AI Corporate Machine — Tools & Integrations Per Feature
# Step 10 / Phase F
# Date: 2026-04-02 | Status: ✅ Complete

---

## Overview

This document maps every external tool, API, SDK, and MCP server required by each PRD. It serves as the integration checklist — before a cycle begins, all listed tools must be configured and their credentials must be in Vercel's environment variables.

**Tool types:**
- `API` — External REST/GraphQL API (requires key/OAuth)
- `SDK` — NPM package integration
- `MCP` — Model Context Protocol server (Claude Code integration)
- `INFRA` — Infrastructure service (requires account + configuration)
- `INTERNAL` — Internal to the MIRD stack (n8n, Supabase, etc.)

---

## Master Tools Inventory

| Tool | Type | Purpose | Used In |
|---|---|---|---|
| **Supabase** | INFRA | Database, Auth, Realtime, Storage, Edge Functions, Vault | F01–F20 |
| **Vercel** | INFRA | Hosting + deployment for all 3 Next.js apps | F01–F20 |
| **n8n** | INFRA | Workflow automation (GHL↔Supabase, Retell AI, agent sync) | F04, F05, F09, F16, F17 |
| **GoHighLevel (GHL)** | API | Contact SoT, pipeline, appointments, voice agent (warm) | F04, F05, F06, F09, F11, F12 |
| **Retell AI** | API | Outbound AI voice calls (new leads, cold outbound) | F05, F06 |
| **Meta Graph API** | API | Campaign metrics sync, OAuth token verification | F10, F12b |
| **Google Ads API** | API | Campaign metrics sync, manager invite | F10, F12b |
| **Google Places API** | API | GMB business search in onboarding wizard | F12b |
| **Anthropic Claude API** | API/SDK | Weekly Intelligence, Ad Ops, Growth, Finance agents + report chat | F15, F16, F17 |
| **Stripe** | API/SDK | Subscription billing, invoice sync | F17 |
| **Apollo.io API** | API | Prospect data cache for Growth agent | F17 |
| **Resend** | API | Transactional email (welcome, weekly reports, data exports) | F06, F16 |
| **Supabase Vault** | INTERNAL | Encrypted storage for OAuth tokens + API keys | F06, F11, F12b |
| **Recharts** | SDK | Chart rendering in CEO app + RM reports | F10, F14, F15, F18, F19 |
| **Zod** | SDK | Runtime schema validation for all server actions + Claude outputs | F03–F20 |
| **`@t3-oss/env-nextjs`** | SDK | Type-safe environment variable validation | F01 |
| **Playwright** | SDK | E2E testing across all 3 apps | F03, F07, F08, F11, F12, F13 |
| **pgTAP** | INFRA | Supabase RLS policy testing | F03 |

---

## Per-PRD MCP & Tool Requirements

---

### F01 — Monorepo Foundation

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Vercel | INFRA | Deploy 3 app projects | Vercel team + 3 project IDs |
| GitHub Actions | INFRA | CI pipeline (lint, typecheck, build) | `VERCEL_TOKEN` in GitHub secrets |
| `@t3-oss/env-nextjs` | SDK | Env var validation | Installed via pnpm |
| pnpm | SDK | Package manager | `corepack enable` in CI |

**MCP servers needed for building F01:**
- None — pure scaffolding work

---

### F02 — Design System

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Tailwind CSS v4 | SDK | Token-based styling | Installed in `packages/config` |
| React Testing Library | SDK | Component snapshot tests | Installed in `packages/ui` |
| `@testing-library/jest-dom` | SDK | DOM assertions | Installed with RTL |

**MCP servers needed:**
- None

---

### F03 — Supabase Schema + Auth

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Supabase | INFRA | DB, Auth, RLS, Edge Functions | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Supabase CLI | SDK | Migrations, type generation | `npx supabase db push` |
| pgTAP | INFRA | RLS policy tests (runs in Supabase) | Enabled via `supabase test db` |
| Playwright | SDK | Auth E2E tests | `PLAYWRIGHT_BASE_URL` per app |

**MCP servers needed:**
- None during build; Supabase MCP useful for inspecting schema during dev

---

### F04 — GHL ↔ Supabase Sync

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| GoHighLevel API | API | Webhook source (contacts, pipeline, appointments) | `GHL_API_KEY`, `GHL_LOCATION_ID` per tenant |
| n8n | INFRA | Workflow execution | n8n instance URL + API key |
| Supabase | INTERNAL | Upsert target, Realtime broadcast | (from F03) |

**n8n Workflows to build:**
- `ghl-to-supabase-sync` — GHL webhook → Supabase upsert
- `sync-error-alert` — error branch → `sync_errors` insert + CEO alert

**Environment variables (Vercel):**
```
GHL_WEBHOOK_SECRET=<ghl_webhook_signing_secret>
N8N_BASE_URL=<n8n_instance_url>
N8N_API_KEY=<n8n_api_key>
```

---

### F05 — Retell AI Lead Response

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Retell AI API | API | Outbound call creation, webhook receiver | `RETELL_API_KEY`, `RETELL_WEBHOOK_SECRET` |
| GoHighLevel API | API | Source of new leads (webhook) + warm contact workflow trigger | (from F04) |
| n8n | INTERNAL | Workflow orchestration | (from F04) |

**n8n Workflows to build:**
- `new-lead-retell-trigger` — GHL contact.created → Retell call
- `retell-webhook-processor` — Retell call_ended → Supabase update (or Next.js API route)
- `ghl-warm-voice-agent` — GHL no-show trigger → GHL native voice workflow

**Next.js API routes:**
- `POST /api/webhooks/retell` — receives Retell call_ended events
- `POST /api/webhooks/ghl` — receives GHL contact events (shared with F04)

**Environment variables:**
```
RETELL_API_KEY=<retell_api_key>
RETELL_WEBHOOK_SECRET=<retell_webhook_signing_secret>
RETELL_DEFAULT_AGENT_ID=<retell_agent_template_id>
```

---

### F06 — Onboarding Job Processor

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| GoHighLevel API | API | Sub-account creation, workflow configuration | `GHL_AGENCY_API_KEY` (agency-level, not location-level) |
| Retell AI API | API | Agent provisioning per tenant | (from F05) |
| Supabase Vault | INTERNAL | OAuth token encryption/storage | Vault key configured in Supabase dashboard |
| Resend | API | Welcome email delivery | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| Supabase Edge Functions | INFRA | Job processor execution | Deployed via `supabase functions deploy` |

**Environment variables:**
```
GHL_AGENCY_API_KEY=<ghl_agency_level_key>
RESEND_API_KEY=<resend_api_key>
RESEND_FROM_EMAIL=hello@rainmachine.io
ONBOARDING_JWT_SECRET=<jwt_signing_secret_for_portal_tokens>
```

---

### F07 — RM Dashboard Home

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Supabase | INTERNAL | `metrics` table read + Realtime subscription | (from F03) |
| Supabase Realtime | INTERNAL | Live KPI updates | Enabled on `metrics` table in F04 |

No new credentials needed — F07 consumes data populated by F04/F05.

---

### F08 — Leads Table + Detail

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Supabase | INTERNAL | `leads`, `calls`, `agents` CRUD | (from F03) |

No new external tools. All data from F04/F05 pipelines.

---

### F09 — Agents Roster

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| GoHighLevel API | API | Routing rule update on agent status change | (from F04) |
| n8n | INTERNAL | `agent-sync` webhook trigger | `N8N_AGENT_SYNC_WEBHOOK_URL` |

**n8n Workflows to build:**
- `agent-sync` — receives agent status change from RM → updates GHL routing

---

### F10 — Campaigns Table

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Meta Graph API | API | Campaign metrics sync (per tenant) | `META_APP_ID`, `META_APP_SECRET` (for OAuth); per-tenant access tokens stored in Vault |
| Google Ads API | API | Campaign metrics sync (per tenant) | `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`; per-tenant tokens in Vault |
| n8n | INTERNAL | `ad-metrics-sync` workflow (runs every 4h) | Workflow deployed in F04 setup |
| Recharts | SDK | Campaign performance bar chart (last 7 days) | `recharts` installed in `apps/dashboard` |

**n8n Workflows to build:**
- `ad-metrics-sync` — scheduled every 4h: Meta Graph API + Google Ads API → `ad_metrics` upsert

**Environment variables:**
```
META_APP_ID=<meta_app_id>
META_APP_SECRET=<meta_app_secret>
GOOGLE_ADS_DEVELOPER_TOKEN=<google_ads_dev_token>
GOOGLE_CLIENT_ID=<google_oauth_client_id>
GOOGLE_CLIENT_SECRET=<google_oauth_client_secret>
GOOGLE_REDIRECT_URI=https://app.rainmachine.io/api/oauth/google/callback
```

---

### F11 — RainMachine Settings

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Meta Graph API | API | OAuth reconnect flow | (from F10) |
| Google Ads API | API | OAuth reconnect flow | (from F10) |
| GoHighLevel API | API | Routing rule sync, agent sync | (from F04) |
| Supabase Vault | INTERNAL | OAuth token storage/retrieval | (from F06) |

**Next.js API routes:**
- `GET /api/oauth/meta/callback` — OAuth callback, exchanges code, stores token
- `GET /api/oauth/google/callback` — OAuth callback, exchanges code, stores token

---

### F12 — Onboarding Portal

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Meta Graph API | API | Token verification (`/me?access_token=`) | (from F10) |
| Google Ads API | API | Manager invite send + invite status poll | (from F10) |
| Google Places API | API | GMB business name search | `GOOGLE_PLACES_API_KEY` |
| Supabase Storage | INTERNAL | Logo + photo file uploads | Storage bucket: `onboarding-assets` (public read, authenticated write) |
| Supabase Vault | INTERNAL | Encrypt Meta/Google tokens at collection | (from F06) |
| GoHighLevel API | API | Job processor called via F06 | (from F06) |

**Environment variables (new):**
```
GOOGLE_PLACES_API_KEY=<google_places_api_key>
ONBOARDING_PORTAL_URL=https://onboard.rainmachine.io
```

---

### F13 — CEO Command Center

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Supabase | INTERNAL | `alerts`, `metrics`, `tenants`, `agent_logs` reads | CEO role service key |
| Supabase Realtime | INTERNAL | Aggregate metrics live update | CEO aggregate channel |

**Note:** CEO Supabase client uses a separate client config with `role: 'ceo'` claim. This client is never exposed to browser — server-only.

---

### F14 — CEO Client Detail

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Supabase | INTERNAL | Multi-table reads (tenants, leads, campaigns, invoices) | (from F13) |
| Recharts | SDK | CPL trend LineChart, pipeline funnel | (from F10) |

---

### F15 — Reports + AI Chat

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Anthropic Claude API | API/SDK | Report chat queries | `ANTHROPIC_API_KEY` |
| `@anthropic-ai/sdk` | SDK | Claude API client | Installed in `packages/db` |
| Supabase | INTERNAL | `reports`, `report_chat_queries` reads/writes | (from F03) |

**Environment variables:**
```
ANTHROPIC_API_KEY=<anthropic_api_key>
CLAUDE_MODEL=claude-sonnet-4-5
```

**MCP servers useful during F15 build:**
- `mcp__claude_api` / Anthropic SDK — for testing prompt construction and response parsing

---

### F16 — Claude AI: Client Intelligence Agents

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Anthropic Claude API | API/SDK | Weekly Intel + Ad Ops agent prompts | (from F15) |
| Resend | API | Weekly report email delivery | (from F06) |
| Supabase Edge Functions | INFRA | Agent execution (pg_cron triggered) | `supabase functions deploy weekly-intelligence-agent` |
| pg_cron | INFRA | Scheduled agent execution | Enabled in Supabase dashboard (Pro tier) |

**Supabase Edge Functions to deploy:**
- `weekly-intelligence-agent` (pg_cron: Monday 6:15am ET)
- `ad-ops-agent` (pg_cron: daily 8:00am ET)

**pg_cron configuration (run in Supabase SQL editor):**
```sql
SELECT cron.schedule('weekly-intelligence-agent', '15 6 * * 1',
  'SELECT net.http_post(''<supabase_functions_url>/weekly-intelligence-agent'', ''{}'', ''application/json'')');

SELECT cron.schedule('ad-ops-agent', '0 8 * * *',
  'SELECT net.http_post(''<supabase_functions_url>/ad-ops-agent'', ''{}'', ''application/json'')');
```

**Note:** pg_cron requires Supabase Pro tier ($25/month). Confirm tier before Cycle 8.

---

### F17 — Claude AI: Business Intelligence Agents

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Anthropic Claude API | API/SDK | Growth + Finance agent prompts | (from F15) |
| Stripe | API/SDK | Subscription + invoice data | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| `stripe` npm package | SDK | Stripe API client | Installed in `apps/ceo` + Edge Function |
| Apollo.io API | API | Prospect data sync (via n8n cache) | `APOLLO_API_KEY` |
| Supabase Edge Functions | INFRA | Agent execution | `supabase functions deploy growth-acquisition-agent`, `finance-intelligence-agent` |

**Next.js API routes:**
- `POST /api/webhooks/stripe` — invoice events handler (signature verification required)

**n8n Workflows to build:**
- `apollo-prospect-sync` — nightly Apollo API → `prospects` table upsert

**Environment variables:**
```
STRIPE_SECRET_KEY=<stripe_secret_key>
STRIPE_WEBHOOK_SECRET=<stripe_webhook_endpoint_secret>
STRIPE_PUBLISHABLE_KEY=<stripe_publishable_key>
APOLLO_API_KEY=<apollo_api_key>
```

**pg_cron additions:**
```sql
SELECT cron.schedule('finance-intelligence-agent', '0 6 * * 1', ...);
SELECT cron.schedule('growth-acquisition-agent', '0 7 * * *', ...);
```

---

### F18 — CEO Drilldowns: Growth + Ad Ops

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Retell AI API | API | Platform health check endpoint | (from F05) |
| Meta Graph API | API | Platform health check | (from F10) |
| Google Ads API | API | Platform health check | (from F10) |
| Recharts | SDK | Trend charts (LineChart, AreaChart) | (from F10) |

**Next.js API route:**
- `GET /api/health/platforms` — server-side health check (5-min revalidate)

---

### F19 — CEO Drilldowns: Product + Finance

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Stripe | API | Invoice history, MRR calculation | (from F17) |
| Recharts | SDK | MRR AreaChart (12 months) | (from F10) |
| n8n | INTERNAL | `workflow_runs` table populated by n8n webhook | n8n webhook step added to all existing workflows |

**n8n change required:** Add a final step to every n8n workflow that POSTs to `/api/webhooks/workflow-run` with `{ workflow_name, status, duration_ms }` — this populates `workflow_runs` table without requiring n8n API access from the dashboard.

---

### F20 — CEO Agent Logs + Settings

| Tool | Type | Usage | Credential/Config Needed |
|---|---|---|---|
| Supabase | INTERNAL | `agent_logs`, `ceo_settings` reads/writes | (from F03) |

No new external tools. All data from F16/F17 agents.

---

## Credentials Checklist (Pre-Build)

Organized by when they're needed:

### Before Cycle 1
- [ ] Supabase project created, URL + keys in Vercel env
- [ ] Vercel team created, 3 app projects initialized
- [ ] GitHub Actions CI configured with `VERCEL_TOKEN`
- [ ] `rainmachine.io`, `app.rainmachine.io`, `ceo.rainmachine.io`, `onboard.rainmachine.io` DNS pointed to Vercel

### Before Cycle 2
- [ ] GHL Agency API key (for sub-account creation)
- [ ] GHL Location API key (for webhook + contact management)
- [ ] GHL webhook signing secret
- [ ] n8n instance running (n8n Cloud or self-hosted on Fly.io/Railway)
- [ ] n8n API key

### Before Cycle 2 (Retell)
- [ ] Retell AI account created
- [ ] Default outbound agent template configured in Retell
- [ ] Retell API key + webhook secret
- [ ] Retell outbound phone number (Twilio provisioned via Retell)

### Before Cycle 4 (Ads sync)
- [ ] Meta Developer App created, `META_APP_ID` + `META_APP_SECRET`
- [ ] Google Cloud Project with Ads API + Places API enabled
- [ ] `GOOGLE_ADS_DEVELOPER_TOKEN` (requires Google Ads Manager account)
- [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (OAuth 2.0 credentials)

### Before Cycle 6 (Onboarding portal)
- [ ] `GOOGLE_PLACES_API_KEY` (restricted to Places API)
- [ ] Supabase Storage bucket `onboarding-assets` created
- [ ] `ONBOARDING_JWT_SECRET` for portal magic link tokens

### Before Cycle 8 (Intelligence agents)
- [ ] Anthropic API key (`ANTHROPIC_API_KEY`)
- [ ] Supabase Pro tier activated (required for pg_cron)
- [ ] Resend account verified, `RESEND_API_KEY` set, `rainmachine.io` domain verified in Resend

### Before Cycle 10 (Business Intel)
- [ ] Stripe account (live mode) — `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- [ ] Apollo.io API key — `APOLLO_API_KEY`

---

## Claude Code MCP Servers — Recommended for Build Sessions

These MCP servers accelerate development of specific PRDs when available in the Claude Code session:

| MCP Server | Useful For | PRDs |
|---|---|---|
| **Supabase MCP** | Inspect schema, test RLS policies, view table data during dev | F03, F04, F08, F13, F16 |
| **n8n MCP** (if available) | Inspect workflow runs, debug webhook payloads | F04, F05, F09, F16 |
| **Stripe MCP** | Test invoice sync, inspect subscription data | F17, F19 |
| **GitHub MCP** | PR creation, branch management during CI setup | F01 |
| **Vercel MCP** | Inspect deployment logs, environment variables | F01, F06, F12 |

**Note:** MCP servers are development accelerators — not build requirements. Every PRD can be built without them using the Bash + Read + Edit + Write tools in Claude Code.

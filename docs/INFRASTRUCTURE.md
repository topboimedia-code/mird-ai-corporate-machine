# INFRASTRUCTURE.md — Make It Rain Digital (MIRD)
## RainMachine Platform — Infrastructure & Deployment

**Version:** 1.0
**Date:** 2026-03-29
**Operator:** Solo (Shomari Williams) with AI assistance

---

## Table of Contents

1. [Vercel Deployment Configuration](#1-vercel-deployment-configuration)
2. [Environment Variables — Complete Reference](#2-environment-variables--complete-reference)
3. [n8n Hosting](#3-n8n-hosting)
4. [Supabase Project Setup](#4-supabase-project-setup)
5. [GHL Account Structure](#5-ghl-account-structure)
6. [CI/CD Approach](#6-cicd-approach)
7. [Monitoring and Alerting](#7-monitoring-and-alerting)
8. [Build & Release Infrastructure Cloning](#8-build--release-infrastructure-cloning)

---

## 1. Vercel Deployment Configuration

### Projects

The monorepo deploys as three separate Vercel projects, each linked to the same GitHub repo with different root directories.

| Vercel Project | Root Directory | Domain | Purpose |
|----------------|----------------|--------|---------|
| `mird-rainmachine-dashboard` | `apps/dashboard` | `dashboard.rainmachine.io` | Client-facing RainMachine |
| `mird-ceo-dashboard` | `apps/ceo-dashboard` | `ceo.rainmachine.io` | MIRD internal CEO view |
| `mird-onboarding` | `apps/onboarding` | `onboarding.rainmachine.io` | Client onboarding portal |

### `vercel.json` (root monorepo)

```json
{
  "buildCommand": "turbo run build",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

### Per-App `vercel.json`

```json
// apps/dashboard/vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/ghl-embed/:path*",
      "destination": "/:path*",
      "has": [{ "type": "header", "key": "x-ghl-location" }]
    }
  ]
}
```

**Note on `X-Frame-Options`:** Set to `SAMEORIGIN` not `DENY` — Phase 1 requires embedding inside GHL iframe. In Phase 2 (standalone), change to `DENY`.

### GHL Embedding Configuration (Phase 1)

GHL embeds the dashboard via a Custom Menu Link:
- URL: `https://dashboard.rainmachine.io?ghl_location={{location_id}}&token={{jwt_token}}`
- The dashboard detects the `ghl_location` query param and enters GHL-embedded mode
- In embedded mode: nav is hidden, GHL's sidebar is the primary navigation

```typescript
// apps/dashboard/app/layout.tsx
const isGHLEmbed = searchParams.get('ghl_location') !== null

return (
  <html>
    <body>
      {!isGHLEmbed && <Sidebar />}
      {children}
    </body>
  </html>
)
```

### Vercel Project Settings

**For each project:**
- **Framework preset:** Next.js
- **Node.js version:** 20.x
- **Build & Output Settings:** Default (Next.js auto-detected)
- **Environment Variables:** Set per environment (Production, Preview, Development)
- **Preview deployments:** Enabled for all branches — but CEO dashboard preview is team-only (not public URL)
- **Deployment Protection:** CEO dashboard + onboarding: add Vercel Password Protection or Vercel Access (Phase 1)
- **Analytics:** Vercel Web Analytics enabled (privacy-first, no cookie consent required)
- **Edge Middleware:** Enabled (middleware.ts runs at the edge)

---

## 2. Environment Variables — Complete Reference

### Shared Variables (all 3 apps)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=[JWT secret from Supabase dashboard]

# App URLs (for cross-app redirects and CORS)
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.rainmachine.io
NEXT_PUBLIC_CEO_DASHBOARD_URL=https://ceo.rainmachine.io
NEXT_PUBLIC_ONBOARDING_URL=https://onboarding.rainmachine.io
```

### `apps/dashboard` — Additional Variables

```bash
# GHL
GHL_AGENCY_API_KEY=[Agency-level GHL API key]
GHL_AGENCY_LOCATION_ID=[MIRD agency GHL location ID]

# Retell AI
RETELL_API_KEY=key_...

# n8n
N8N_API_KEY=[n8n API key]
N8N_WEBHOOK_BASE_URL=https://n8n.mird-automation.com

# Webhook secrets
WEBHOOK_SECRET_GHL=[32+ char random string]
WEBHOOK_SECRET_RETELL=[32+ char random string]

# Internal service calls
INTERNAL_SERVICE_KEY=[64-char random hex — for n8n→API calls]
```

### `apps/ceo-dashboard` — Additional Variables

```bash
# All shared vars, plus:
ANTHROPIC_API_KEY=sk-ant-api03-...

# GHL
GHL_AGENCY_API_KEY=[same as dashboard]

# Meta
META_APP_ID=[Meta app ID]
META_APP_SECRET=[Meta app secret]
META_SYSTEM_USER_ID=[MIRD System User ID]

# Google
GOOGLE_CLIENT_ID=[OAuth 2.0 client ID]
GOOGLE_CLIENT_SECRET=[OAuth 2.0 client secret]
GOOGLE_ADS_DEVELOPER_TOKEN=[Google Ads developer token]
GOOGLE_ADS_MCC_CUSTOMER_ID=987-654-3210

# Slack
SLACK_WEBHOOK_URL_CEO_LOOP=https://hooks.slack.com/services/T.../B.../...
SLACK_WEBHOOK_URL_MIRD_ALERTS=https://hooks.slack.com/services/T.../B.../...
SLACK_WEBHOOK_URL_MIRD_OPS=https://hooks.slack.com/services/T.../B.../...

# n8n
N8N_API_KEY=[same as dashboard]
N8N_WEBHOOK_BASE_URL=https://n8n.mird-automation.com
```

### `apps/onboarding` — Additional Variables

```bash
# Supabase Storage
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=onboarding-assets

# Email (for sending onboarding invite + provisioning notifications)
RESEND_API_KEY=re_...
FROM_EMAIL=onboarding@rainmachine.io

# Internal
INTERNAL_SERVICE_KEY=[same as dashboard]
```

### Supabase Edge Functions Variables

Set in Supabase Dashboard → Edge Functions → Secrets:

```bash
SUPABASE_SERVICE_ROLE_KEY=[service role key]
WEBHOOK_SECRET_GHL=[same as app]
WEBHOOK_SECRET_RETELL=[same as app]
META_APP_SECRET=[same as ceo-dashboard]
N8N_WEBHOOK_BASE_URL=https://n8n.mird-automation.com
N8N_API_KEY=[same as apps]
SLACK_WEBHOOK_URL_MIRD_ALERTS=[same as ceo-dashboard]
```

### n8n Environment Variables

Set in n8n's credential store and `.env` on Railway:

```bash
# n8n core
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=[strong password]
N8N_HOST=n8n.mird-automation.com
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.mird-automation.com/
N8N_ENCRYPTION_KEY=[32-char random string]

# Database (n8n's own)
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=[Railway postgres host]
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n_user
DB_POSTGRESDB_PASSWORD=[strong password]

# Credentials stored in n8n UI (not .env):
# - Supabase service role key
# - Meta System User token
# - Google Ads credentials
# - GHL agency API key
# - Retell AI API key
# - Slack webhook URLs
# - Anthropic API key
```

### Environment Variable Naming Convention

```
NEXT_PUBLIC_*     → Browser-safe, included in client bundle
*_KEY             → Secret — never NEXT_PUBLIC_
*_SECRET          → Secret — never NEXT_PUBLIC_
*_TOKEN           → Secret — never NEXT_PUBLIC_
*_URL             → Can be NEXT_PUBLIC_ if the URL itself is not sensitive
*_ID              → Usually NEXT_PUBLIC_ safe (IDs are not secrets)
```

---

## 3. n8n Hosting

### Recommendation: Self-Hosted on Railway

**Decision:** Self-host n8n on Railway (not n8n Cloud).

**Rationale:**
1. n8n Cloud charges per workflow execution — at scale with 12+ clients, each getting real-time lead routing, this becomes expensive ($50-200+/mo vs ~$10-20/mo on Railway)
2. Self-hosted n8n stores credentials encrypted locally — no third-party has access to MIRD's Meta tokens, GHL keys, or Anthropic key
3. All workflow JSON is exported and version-controlled in `n8n/workflows/` — self-hosted makes this the source of truth, not n8n Cloud
4. Railway provides: automatic deploys from Docker, persistent storage, Railway Postgres for n8n's own state database, custom domains, and SSL

### Railway Setup

**Service:** n8n
**Docker image:** `docker.n8n.io/n8nio/n8n:latest` (pin to specific version in production)
**Resources:** Starter plan → upgrade to Pro when execution count requires it

```yaml
# railway.toml (n8n service)
[build]
  dockerfilePath = "Dockerfile.n8n"  # or use the public n8n image directly

[deploy]
  restartPolicyType = "ON_FAILURE"
  restartPolicyMaxRetries = 3

[[services]]
  name = "n8n"
  [services.env]
    N8N_HOST = "${{RAILWAY_STATIC_URL}}"
    WEBHOOK_URL = "https://n8n.mird-automation.com/"
```

**Persistent volume:** Mount `/home/node/.n8n` to Railway's persistent volume — this stores n8n's encrypted credentials and workflow data between deploys.

**Custom domain:** `n8n.mird-automation.com` → Railway service URL via CNAME

### n8n High Availability (Phase 2+)

Phase 1: Single n8n instance on Railway. Acceptable for a solo operator — downtime affects automation delivery but not customer-facing voice calls (Retell AI is independent).

Phase 2: Railway Pro → configure n8n in queue mode with a Redis instance for job queuing. This allows multiple n8n worker instances to process workflows in parallel.

### Workflow Version Control

```
n8n/
└── workflows/
    ├── lead-router.json
    ├── retell-post-call-router.json
    ├── appointment-confirmation.json
    ├── appointment-outcome-handler.json
    ├── deal-stage-handler.json
    ├── ceo-loop-aggregator.json
    ├── meta-ads-sync.json
    ├── google-ads-sync.json
    ├── client-provisioning.json
    └── agent-dept1-trigger.json
    └── agent-dept2-trigger.json
    └── agent-dept3-trigger.json
    └── agent-dept4-trigger.json
```

**Export workflow from n8n:**
```bash
# Via n8n CLI (in Railway shell)
n8n export:workflow --all --output=/workflows/

# Or via n8n API
GET /api/v1/workflows
```

**Import on fresh deploy:**
```bash
n8n import:workflow --separate --input=/workflows/
```

---

## 4. Supabase Project Setup

### Project Configuration

**Region:** `us-east-1` (Virginia) — closest to majority of US real estate clients
**Plan:** Pro ($25/mo) — required for:
- 8GB database storage (vs 500MB free)
- No pausing on inactivity
- Point-in-time recovery (daily backups)
- Advanced RLS and custom claims

### Supabase CLI Setup

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Initialize local dev
supabase init

# Link to remote project
supabase link --project-ref [project-ref]

# Start local dev environment
supabase start  # Spins up local Postgres, Auth, Storage, Edge Functions

# Apply migrations
supabase db push
```

### Migration Strategy

```
supabase/
└── migrations/
    ├── 20260101000000_initial_schema.sql        # All tables, enums, indexes
    ├── 20260101000001_rls_policies.sql           # All RLS policies
    ├── 20260101000002_auth_hooks.sql             # JWT custom claims hook
    ├── 20260115000000_add_dbr_campaigns.sql      # Example incremental migration
    └── 20260201000000_add_campaign_metrics.sql
```

**Migration naming:** `YYYYMMDDHHMMSS_description.sql`

**Deploy migrations:**
```bash
# CI/CD (GitHub Actions)
supabase db push --linked

# Manual (emergency)
supabase db push --linked --db-url postgresql://[connection-string]
```

### Edge Functions Deployment

```bash
# Deploy all edge functions
supabase functions deploy webhooks-ghl
supabase functions deploy webhooks-retell
supabase functions deploy webhooks-meta

# Set secrets
supabase secrets set WEBHOOK_SECRET_GHL=...
supabase secrets set WEBHOOK_SECRET_RETELL=...
supabase secrets set META_APP_SECRET=...
```

### Supabase Storage Buckets

```sql
-- Create storage bucket for onboarding assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'onboarding-assets',
  'onboarding-assets',
  false,  -- Private bucket — access via signed URLs
  10485760,  -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf']
);

-- RLS for storage bucket
CREATE POLICY "mird_admin_full_access" ON storage.objects
  FOR ALL USING (
    bucket_id = 'onboarding-assets'
    AND auth.is_mird_admin()
  );

-- Service role access (for n8n/Edge Functions)
-- Service role bypasses storage RLS automatically
```

### Database Backups

Supabase Pro includes daily point-in-time recovery (PITR) for 7 days.

Additionally, set up weekly pg_dump export to Supabase Storage:

```bash
# n8n workflow: weekly-db-backup (every Sunday 2AM)
# Uses Supabase connection pooler + pg_dump
# Stores encrypted .sql.gz in 'backups' Supabase Storage bucket
# Retains last 4 weekly backups
```

---

## 5. GHL Account Structure

### Hierarchy

```
MIRD GoHighLevel Agency Account
├── MIRD Internal Location (MIRD's own CRM — not a client)
├── Client: Marcus Realty Group (Sub-Account)
│   ├── Pipeline: RainMachine Pipeline
│   ├── Calendar: Discovery Call
│   ├── Automations: MIRD Standard Suite
│   ├── GHL Native Voice Agent: Warm Contact Agent
│   └── Custom Values: retell_agent_id, org_id, plan_tier
├── Client: Johnson Insurance Group (Sub-Account)
│   └── ...
└── Client N: ...
```

### MIRD Agency Account Settings

- **Agency API Key:** Used by n8n and server-side code to manage all sub-accounts
- **Snapshot:** MIRD creates a "RainMachine Standard" snapshot that encodes:
  - Pipeline stages
  - Tags library (meta-lead, google-lead, warm, hot, DNC, buyer, seller)
  - Automations (SMS sequences, email templates)
  - Calendar configuration
  - Custom fields (UTM fields, lead source, ICP match score)
  - GHL Native Voice Agent template

### Per-Client Sub-Account Custom Values

Each sub-account has GHL Custom Values set during provisioning:

```
custom_values:
  mird_org_id: "{supabase org uuid}"
  mird_plan: "growth"
  retell_agent_id: "{retell agent id for this client}"
  rainmachine_dashboard_url: "https://dashboard.rainmachine.io"
  n8n_lead_router_webhook: "https://n8n.mird-automation.com/webhook/lead-router"
```

### Sub-Account Limits

GHL agency plans have sub-account limits. Monitor via:
- `GET /agency/sub-accounts/count`
- Slack alert when approaching 90% of plan limit

### Build & Release — Separate GHL Agency Accounts

B&R clients get their **own GHL agency account**, not a sub-account of MIRD. MIRD provisions it:

1. GHL: Create new agency account (separate billing — client pays GHL directly)
2. MIRD is added as a sub-admin during setup, then removed after handoff
3. Client gets full agency owner access
4. The B&R GHL account has its own snapshot applied

---

## 6. CI/CD Approach

### GitHub Actions Workflows

```
.github/
└── workflows/
    ├── ci.yml              # PR checks: lint, typecheck, test
    ├── deploy-dashboard.yml
    ├── deploy-ceo.yml
    ├── deploy-onboarding.yml
    └── deploy-supabase.yml
```

### CI Pipeline (`ci.yml`)

Runs on every PR and push to `main`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm turbo typecheck

      - name: Lint
        run: pnpm turbo lint

      - name: Build
        run: pnpm turbo build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

### Deployment Pipeline (`deploy-dashboard.yml`)

```yaml
name: Deploy Dashboard

on:
  push:
    branches: [main]
    paths:
      - 'apps/dashboard/**'
      - 'packages/**'
      - 'pnpm-lock.yaml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_DASHBOARD }}
          vercel-args: '--prod'
          working-directory: apps/dashboard
```

### Supabase Migration Deployment (`deploy-supabase.yml`)

```yaml
name: Deploy Supabase Migrations

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1

      - name: Run migrations
        run: supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
```

### Branch Strategy

```
main          → Production deployments (auto-deploy on push)
develop       → Preview deployments (Vercel preview URLs)
feature/*     → Preview deployments (Vercel preview URLs)
```

**Protection rules on `main`:**
- Require PR with 1 approval (or: for solo operator, require CI to pass before merge)
- Require status checks: CI (typecheck + lint + build)
- No direct pushes

---

## 7. Monitoring and Alerting

### Slack Channels

| Channel | Purpose | Alerting Source |
|---------|---------|----------------|
| `#ceo-loop` | CEO loop reports (3x/day), agent run summaries | n8n, Claude agents |
| `#mird-alerts` | Critical errors, automation failures, CPL spikes | n8n, Vercel, Supabase |
| `#mird-ops` | Client provisioning events, onboarding completions | n8n |

### n8n Error Alerting

Every n8n workflow has an error handler node:

```javascript
// n8n: Error Handler Node (on every workflow)
// Workflow: "Error → Slack Notification"

const workflowName = $workflow.name;
const error = $execution.error;
const executionId = $execution.id;
const timestamp = new Date().toISOString();

// POST to Slack
{
  "text": `*n8n Workflow Error*\n*Workflow:* ${workflowName}\n*Error:* ${error.message}\n*Execution ID:* ${executionId}\n*Time:* ${timestamp}\n*Action:* <https://n8n.mird-automation.com/execution/${executionId}|View in n8n>`
}
```

All workflows post to `#mird-alerts` on failure.

### Claude Agent Health Checks

Dept 4 (Finance/BI) agent includes a health check for the other 3 departments:

```typescript
// In agent-dept4 run:
// Check last run time for all departments
const checks = await supabase
  .from('agent_performance')
  .select('department, status, completed_at')
  .in('department', ['dept1_growth', 'dept2_ad_ops', 'dept3_product'])
  .order('created_at', { ascending: false })
  .limit(1)

for (const check of checks) {
  const hoursSinceLastRun = differenceInHours(new Date(), new Date(check.completed_at))
  if (hoursSinceLastRun > 8 || check.status === 'failed') {
    // Add to flags array in report
    flags.push({
      severity: 'warning',
      category: 'agent_health',
      message: `${check.department} last run was ${hoursSinceLastRun}h ago with status: ${check.status}`,
      recommended_action: `Check n8n for failed workflow executions`
    })
  }
}
```

### Vercel Deployment Monitoring

- Vercel email notifications: enabled for failed deployments
- Slack integration: Vercel → Slack app connected to `#mird-alerts`
- Alert on: build failure, deployment failure, function timeout

### Supabase Monitoring

- Supabase dashboard: Database CPU, memory, connections
- Alerts: Set up via Supabase → Alerts → Email alerts for:
  - Database storage > 70%
  - Error rate > 1% on Edge Functions
  - Auth error rate spike

### Uptime Monitoring (Phase 2)

- Better Uptime or Uptime Robot (free tier) for:
  - `https://dashboard.rainmachine.io/api/health` — 5 min interval
  - `https://n8n.mird-automation.com/healthz` — 5 min interval
  - Alerts to `#mird-alerts` Slack on downtime

### Key Metrics to Watch

| Metric | Threshold for Alert | Source |
|--------|--------------------|----|
| Meta CPL spike | >20% vs 7-day average | n8n + Claude Dept 2 |
| Google CPL spike | >20% vs 7-day average | n8n + Claude Dept 2 |
| No-show rate | >40% in a 7-day window | Supabase query |
| Lead router failures | >0 consecutive failures | n8n error handler |
| Retell call error rate | >5% calls with outcome=error | Supabase query |
| MRR drop | Any subscription canceled | Supabase trigger → n8n → Slack |
| Agent run failure | 2+ consecutive failures | Dept 4 health check |

---

## 8. Build & Release Infrastructure Cloning

Build & Release clients receive a complete, isolated MIRD stack. This section defines the provisioning procedure.

### B&R Stack Components (per client)

| Component | Setup Method | Notes |
|-----------|-------------|-------|
| Supabase project | New project, fresh database | Same schema via migration |
| Vercel (dashboard) | New Vercel project | Fork of monorepo or deploy from same repo with new env vars |
| Vercel (ceo-dashboard) | New Vercel project | |
| n8n instance | New Railway service | Clone workflow exports, update all webhook URLs |
| GHL agency account | New GHL agency account | Apply MIRD snapshot |
| Retell AI account | New Retell account | Clone agent configurations |
| Custom domain | DNS setup for client | e.g. `dashboard.jonesinsurance.com` |

### B&R Provisioning Runbook

**Estimated time: 3-4 hours (mostly configuration, not building)**

**Step 1: Supabase (30 min)**
```bash
# Create new project in Supabase (separate from MIRD's project)
# Set region based on client's primary market
# Run all migrations
supabase db push --db-url postgresql://[new-project-connection-string]

# Set Supabase Auth configuration
# - JWT expiry: 28800
# - Site URL: https://dashboard.[client-domain].com
# - Redirect URLs: https://dashboard.[client-domain].com/auth/callback

# Create first user (B&R admin)
supabase auth admin createUser --email [client-email] --password [temp-password]
```

**Step 2: Vercel (30 min)**
```bash
# Option A: Deploy from MIRD monorepo with client-specific env vars
vercel --cwd apps/dashboard deploy --prod \
  -e NEXT_PUBLIC_SUPABASE_URL=[client-supabase-url] \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=[client-anon-key] \
  -e SUPABASE_SERVICE_ROLE_KEY=[client-service-role] \
  # ... all other env vars scoped to client

# Option B: Fork monorepo → client's GitHub org → deploy from client's repo
# Recommended for B&R — client owns their codebase

# Add custom domain in Vercel dashboard
# Update DNS: CNAME dashboard.[client-domain].com → cname.vercel-dns.com
```

**Step 3: n8n (45 min)**
```bash
# 1. Create new Railway service (new n8n instance)
# 2. Deploy n8n Docker image
# 3. Import all workflow JSONs from n8n/workflows/
n8n import:workflow --separate --input=./n8n/workflows/

# 4. Update all workflow variables:
#    - Supabase URL → client's Supabase URL
#    - Webhook base URL → client's n8n URL
#    - GHL location ID → client's GHL location ID
#    - Retell agent IDs → client's Retell agent IDs

# 5. Create all n8n credentials:
#    - Supabase (service role)
#    - GHL API key
#    - Retell API key
#    - Slack webhooks
#    - Anthropic API key
#    - Meta credentials (client's own)
#    - Google Ads credentials (client's own)
```

**Step 4: GHL (45 min)**
```bash
# 1. Create new GHL agency account (separate from MIRD's)
# 2. Apply MIRD standard snapshot to create pipeline, automations, templates
# 3. Create first sub-account for client's primary market
# 4. Set Custom Values with n8n webhook URLs
# 5. Configure GHL Native Voice Agent
# 6. Send agency owner access to client
```

**Step 5: Retell AI (30 min)**
```bash
# 1. Create new Retell AI account (or new project under MIRD's account)
# 2. Create agents from MIRD templates:
#    - New Lead Agent (outbound)
#    - DBR Campaign Agent (outbound)
# 3. Assign phone number
# 4. Configure webhook URL → client's n8n instance
# 5. Store agent IDs in client's Supabase
```

**Step 6: Claude Agents (30 min)**
```bash
# The Claude agents in packages/ai-agents/ are stateless —
# they run via n8n and read/write to Supabase.
# No separate deployment needed — they run in n8n via HTTP Request
# to the client's Vercel deployment.
# Each department agent is configured via n8n credentials:
# - Anthropic API key (client's own or MIRD's, depending on contract)
# - Supabase service role for client's project
```

**Step 7: DNS and Custom Domains (30 min)**
```
dashboard.[client-domain].com → Vercel
ceo.[client-domain].com       → Vercel
onboarding.[client-domain].com → Vercel
n8n.[client-domain].com       → Railway
```

### B&R Configuration Store

MIRD maintains a `build_release_config` JSONB field on the `organizations` table for each B&R client, documenting all deployed infrastructure:

```json
{
  "supabase": {
    "project_ref": "abc123xyz",
    "project_url": "https://abc123xyz.supabase.co",
    "region": "us-east-1"
  },
  "vercel": {
    "dashboard_project_id": "prj_abc123",
    "ceo_project_id": "prj_def456",
    "onboarding_project_id": "prj_ghi789",
    "team_id": "team_xyz"
  },
  "n8n": {
    "railway_service_id": "srv_abc123",
    "base_url": "https://n8n.jonesinsurance.com"
  },
  "ghl": {
    "agency_id": "ghl_agency_abc123",
    "primary_location_id": "loc_xyz789"
  },
  "retell": {
    "account_id": "retell_acc_abc",
    "new_lead_agent_id": "agent_abc123",
    "dbr_agent_id": "agent_def456",
    "phone_number": "+14045550001"
  },
  "domains": {
    "dashboard": "dashboard.jonesinsurance.com",
    "ceo": "ceo.jonesinsurance.com",
    "n8n": "n8n.jonesinsurance.com"
  },
  "provisioned_at": "2026-03-29T10:00:00Z",
  "provisioned_by": "shomari@makeitraindigital.com",
  "handoff_completed": false
}
```

### B&R Handoff Checklist

- [ ] Supabase: migrations applied, admin user created, MFA required
- [ ] Vercel: all 3 apps deployed and accessible on custom domain
- [ ] n8n: all 12 workflows imported and active, credentials configured
- [ ] GHL: agency account created, snapshot applied, client has owner access
- [ ] Retell AI: agents created, phone number assigned, webhooks pointing to client n8n
- [ ] Claude agents: test run executed, output visible in CEO dashboard
- [ ] DNS: all domains resolving correctly with HTTPS
- [ ] Test end-to-end: submit test lead → Retell call → appointment booked → shows in dashboard → CEO loop runs → Slack notification
- [ ] Handoff documentation delivered to client
- [ ] MIRD access removed (or retained per support contract)
- [ ] `build_release_config.handoff_completed` = true

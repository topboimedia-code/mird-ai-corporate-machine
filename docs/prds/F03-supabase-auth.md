# F03 — Supabase Schema, RLS & Authentication
# RainMachine · MIRD AI Corporate Machine
# Sigma Protocol Step 11 · PRD Generation
# Source Pitch: P03 · Cycle: 1 · Release: R0 · Appetite: Medium
# Date: 2026-04-02 | Status: Ready for Implementation

---

## 1. Overview

### Pitch Summary

RainMachine is a multi-tenant SaaS platform. Marcus (the Realtor Team Leader) sees only his data. Shomari (CEO) sees all tenants' data. Neither role's data can leak to the other. Without a secure database foundation and authentication layer, no feature can be built safely. This PRD creates the complete database schema, row-level security policies, authentication flows, and the `packages/db` Supabase client library.

### User-Facing Outcomes

1. **Marcus** navigates to `app.rainmachine.io/login`, enters email + password, and lands on the (placeholder) dashboard. His session persists across page refreshes. Inactive for 30 minutes → session expires → modal prompts re-login.
2. **Shomari** navigates to `ceo.rainmachine.io/login`, enters email + password, and is prompted for a TOTP 6-digit code. After successful 2FA, he lands on the (placeholder) CEO dashboard. Marcus cannot access any CEO routes even with a valid RM session token.
3. Any developer running `SELECT * FROM tenants` as Marcus's service role is blocked by RLS — only their own tenant row is returned.

### What This PRD Covers

- Full SQL migration (12 core tables, all DDL, all RLS policies)
- Supabase Auth configuration (email/password, lockout, JWT custom claims)
- CEO TOTP 2FA (Supabase Auth MFA API)
- `packages/db` — Supabase client factory, TypeScript types, query helpers
- Login pages for both RM and CEO apps
- CEO 2FA verification page
- Session expiry modal component
- Error pages (404, 500, maintenance) for RM; CEO 404
- Supabase Edge Function `create-tenant` (atomic provisioning)
- pgTAP database tests

### What This PRD Does Not Cover

- GHL sub-account creation (F06's Edge Function handles this as part of onboarding)
- Retell AI configuration (F05, F06)
- OAuth connections for Meta/Google Ads (F11)
- Supabase Vault setup for OAuth tokens (F11, F06)
- Any data being written to these tables (F04+)

### Acceptance Summary

- Marcus can log in and land on dashboard; logout clears session
- CEO can complete 2FA and land on CEO home
- A browser request to a CEO-only route with a Marcus session token returns 403
- `pgTAP` test: Marcus's Supabase query on `leads` returns only his tenant's rows, never another tenant's
- `pgTAP` test: CEO role query on `leads` returns all tenants' rows
- Session expiry modal fires 60 seconds before token expiry (or on 401)
- `create-tenant` Edge Function creates user + tenant atomically; partial failure leaves no orphan rows

---

## 2. Database

### 2.1 Migration File

**Path:** `supabase/migrations/0001_initial_schema.sql`

This is the single initial migration. All 12 tables are created in one migration to avoid circular FK constraints during the initial setup.

### 2.2 DDL — All Tables

```sql
-- =============================================================================
-- MIGRATION: 0001_initial_schema.sql
-- RainMachine — MIRD AI Corporate Machine
-- Created: 2026-04-02
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgtap";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE tenant_status AS ENUM ('provisioning', 'active', 'paused', 'churned');
CREATE TYPE user_role AS ENUM ('owner', 'agent', 'ceo');
CREATE TYPE lead_stage AS ENUM (
  'new', 'contacted', 'qualified', 'appointment_set',
  'appointment_held', 'under_contract', 'closed_won', 'closed_lost', 'archived'
);
CREATE TYPE lead_source AS ENUM (
  'meta_ads', 'google_ads', 'referral', 'organic', 'manual', 'other'
);
CREATE TYPE call_status AS ENUM (
  'initiated', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'voicemail'
);
CREATE TYPE call_outcome AS ENUM (
  'appointment_set', 'callback_requested', 'not_interested',
  'wrong_number', 'voicemail', 'no_answer', 'other'
);
CREATE TYPE appointment_status AS ENUM (
  'scheduled', 'confirmed', 'held', 'no_show', 'cancelled', 'rescheduled'
);
CREATE TYPE campaign_platform AS ENUM ('meta', 'google');
CREATE TYPE campaign_status AS ENUM ('active', 'paused', 'archived', 'error');
CREATE TYPE oauth_status AS ENUM ('connected', 'revoked', 'expired', 'never_connected');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE alert_status AS ENUM ('active', 'dismissed', 'snoozed');

-- =============================================================================
-- TABLE: tenants
-- =============================================================================

CREATE TABLE tenants (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,
  status              tenant_status NOT NULL DEFAULT 'provisioning',
  ghl_sub_account_id  TEXT UNIQUE,
  plan                TEXT NOT NULL DEFAULT 'starter',
  ai_enabled          BOOLEAN NOT NULL DEFAULT true,
  cpl_threshold       NUMERIC(10, 2),
  close_rate_floor    NUMERIC(5, 4),
  meta_oauth_status   oauth_status NOT NULL DEFAULT 'never_connected',
  google_oauth_status oauth_status NOT NULL DEFAULT 'never_connected',
  retell_agent_id     TEXT,
  timezone            TEXT NOT NULL DEFAULT 'America/New_York',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: users
-- (Maps to Supabase auth.users — one row per auth user)
-- =============================================================================

CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'agent',
  first_name  TEXT,
  last_name   TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- CEO users have NULL tenant_id
  CONSTRAINT users_ceo_or_tenant CHECK (
    (role = 'ceo' AND tenant_id IS NULL) OR
    (role != 'ceo' AND tenant_id IS NOT NULL)
  )
);

-- =============================================================================
-- TABLE: agents
-- (Team members under a tenant — may or may not have a users row)
-- =============================================================================

CREATE TABLE agents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  role_label      TEXT,             -- e.g. "Buyer's Agent", "Listing Specialist"
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive')),
  ghl_user_id     TEXT,             -- GHL user ID for routing sync
  close_rate      NUMERIC(5, 4),    -- computed/cached; refreshed by agents report
  leads_assigned  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: leads
-- =============================================================================

CREATE TABLE leads (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  first_name        TEXT,
  last_name         TEXT,
  email             TEXT,
  phone             TEXT NOT NULL,
  stage             lead_stage NOT NULL DEFAULT 'new',
  source            lead_source NOT NULL DEFAULT 'other',
  ghl_contact_id    TEXT UNIQUE,    -- idempotency key for GHL sync
  ai_call_status    call_status,
  last_activity_at  TIMESTAMPTZ,
  archived_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: calls
-- =============================================================================

CREATE TABLE calls (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id          UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  retell_call_id   TEXT UNIQUE,
  status           call_status NOT NULL DEFAULT 'initiated',
  outcome          call_outcome,
  duration_s       INTEGER,
  transcript       TEXT,
  recording_url    TEXT,
  initiated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: appointments
-- =============================================================================

CREATE TABLE appointments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id           UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id          UUID REFERENCES agents(id) ON DELETE SET NULL,
  status            appointment_status NOT NULL DEFAULT 'scheduled',
  scheduled_at      TIMESTAMPTZ NOT NULL,
  held_at           TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  ghl_appointment_id TEXT UNIQUE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: campaigns
-- =============================================================================

CREATE TABLE campaigns (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform              campaign_platform NOT NULL,
  platform_campaign_id  TEXT NOT NULL,
  name                  TEXT NOT NULL,
  status                campaign_status NOT NULL DEFAULT 'active',
  oauth_status          oauth_status NOT NULL DEFAULT 'never_connected',
  daily_budget_cents    INTEGER,
  bid_strategy          TEXT,
  last_synced_at        TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, platform, platform_campaign_id)
);

-- =============================================================================
-- TABLE: ad_metrics
-- (Daily rollup — one row per tenant per campaign per day)
-- =============================================================================

CREATE TABLE ad_metrics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  spend_cents     INTEGER NOT NULL DEFAULT 0,
  impressions     INTEGER NOT NULL DEFAULT 0,
  clicks          INTEGER NOT NULL DEFAULT 0,
  leads           INTEGER NOT NULL DEFAULT 0,
  cpl_cents       INTEGER,          -- cost per lead in cents; NULL if leads=0
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, campaign_id, date)
);

-- =============================================================================
-- TABLE: metrics
-- (Tenant-level daily KPI snapshot — one row per tenant per day)
-- =============================================================================

CREATE TABLE metrics (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date              DATE NOT NULL,
  leads_total       INTEGER NOT NULL DEFAULT 0,
  leads_new         INTEGER NOT NULL DEFAULT 0,
  appointments_set  INTEGER NOT NULL DEFAULT 0,
  appointments_held INTEGER NOT NULL DEFAULT 0,
  close_rate        NUMERIC(5, 4),
  mrr               NUMERIC(10, 2),
  calls_total       INTEGER NOT NULL DEFAULT 0,
  calls_connected   INTEGER NOT NULL DEFAULT 0,
  avg_cpl_cents     INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, date)
);

-- =============================================================================
-- TABLE: reports
-- (Weekly AI intelligence reports — generated by Claude agent)
-- =============================================================================

CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL,
  content     JSONB NOT NULL,       -- WeeklyBriefSchema JSON
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, week_start)
);

-- =============================================================================
-- TABLE: agent_logs
-- (AI department agent run logs — for CEO command center)
-- =============================================================================

CREATE TABLE agent_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department  TEXT NOT NULL CHECK (department IN ('growth', 'ad_ops', 'product', 'finance')),
  run_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status      TEXT NOT NULL CHECK (status IN ('success', 'schema_error', 'api_error', 'partial')),
  summary     TEXT,
  entries     JSONB NOT NULL DEFAULT '[]',
  tokens_in   INTEGER,
  tokens_out  INTEGER,
  cost_usd    NUMERIC(10, 6),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: alerts
-- (System alerts surfaced in CEO command center)
-- =============================================================================

CREATE TABLE alerts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = system-wide
  severity          alert_severity NOT NULL DEFAULT 'info',
  status            alert_status NOT NULL DEFAULT 'active',
  title             TEXT NOT NULL,
  description       TEXT,
  recommended_action TEXT,
  snoozed_until     TIMESTAMPTZ,
  dismissed_at      TIMESTAMPTZ,
  dismissed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  dismissed_note    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- leads: most common queries filter by tenant + stage + created_at
CREATE INDEX idx_leads_tenant_stage ON leads(tenant_id, stage);
CREATE INDEX idx_leads_tenant_created ON leads(tenant_id, created_at DESC);
CREATE INDEX idx_leads_ghl_contact_id ON leads(ghl_contact_id) WHERE ghl_contact_id IS NOT NULL;

-- calls: filter by tenant + lead
CREATE INDEX idx_calls_tenant ON calls(tenant_id, initiated_at DESC);
CREATE INDEX idx_calls_lead ON calls(lead_id);

-- appointments: filter by tenant + status + scheduled_at
CREATE INDEX idx_appointments_tenant_status ON appointments(tenant_id, status, scheduled_at);

-- ad_metrics: filter by tenant + date range
CREATE INDEX idx_ad_metrics_tenant_date ON ad_metrics(tenant_id, date DESC);

-- metrics: filter by tenant + date
CREATE INDEX idx_metrics_tenant_date ON metrics(tenant_id, date DESC);

-- reports: filter by tenant + week_start
CREATE INDEX idx_reports_tenant ON reports(tenant_id, week_start DESC);

-- agent_logs: filter by department + run_at
CREATE INDEX idx_agent_logs_dept_run ON agent_logs(department, run_at DESC);

-- alerts: filter by status + severity + created_at
CREATE INDEX idx_alerts_active ON alerts(status, severity DESC, created_at DESC) WHERE status = 'active';

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tenants', 'users', 'agents', 'leads', 'calls',
    'appointments', 'campaigns', 'ad_metrics', 'metrics', 'alerts'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t
    );
  END LOOP;
END;
$$;

-- =============================================================================
-- REALTIME
-- Enable Supabase Realtime on the metrics table (used by F04/F07)
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
```

### 2.3 Row-Level Security Policies

```sql
-- =============================================================================
-- MIGRATION: 0002_rls_policies.sql
-- Row-Level Security for all tables
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get tenant_id from JWT claims (set by create-tenant Edge Function)
CREATE OR REPLACE FUNCTION auth.tenant_id() RETURNS UUID AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb->>'tenant_id',
    ''
  )::UUID;
$$ LANGUAGE sql STABLE;

-- Get user role from JWT claims
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb->>'role',
    ''
  );
$$ LANGUAGE sql STABLE;

-- Check if current user is CEO
CREATE OR REPLACE FUNCTION auth.is_ceo() RETURNS BOOLEAN AS $$
  SELECT auth.user_role() = 'ceo';
$$ LANGUAGE sql STABLE;

-- =============================================================================
-- POLICIES: tenants
-- =============================================================================

-- RM users: read their own tenant row only
CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT
  USING (id = auth.tenant_id() OR auth.is_ceo());

-- CEO: update any tenant
CREATE POLICY "tenants_update_ceo" ON tenants
  FOR UPDATE
  USING (auth.is_ceo());

-- RM owner: update their own tenant
CREATE POLICY "tenants_update_owner" ON tenants
  FOR UPDATE
  USING (id = auth.tenant_id() AND auth.user_role() IN ('owner'));

-- No INSERT/DELETE via RLS — handled by service role (Edge Function)

-- =============================================================================
-- POLICIES: users
-- =============================================================================

CREATE POLICY "users_select_own_tenant" ON users
  FOR SELECT
  USING (tenant_id = auth.tenant_id() OR auth.is_ceo() OR id = auth.uid());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (id = auth.uid());

-- =============================================================================
-- POLICIES: agents
-- =============================================================================

CREATE POLICY "agents_select_own_tenant" ON agents
  FOR SELECT
  USING (tenant_id = auth.tenant_id() OR auth.is_ceo());

CREATE POLICY "agents_insert_owner" ON agents
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id() AND auth.user_role() = 'owner');

CREATE POLICY "agents_update_owner" ON agents
  FOR UPDATE
  USING (tenant_id = auth.tenant_id() AND auth.user_role() = 'owner');

CREATE POLICY "agents_delete_owner" ON agents
  FOR DELETE
  USING (tenant_id = auth.tenant_id() AND auth.user_role() = 'owner');

-- =============================================================================
-- POLICIES: leads
-- =============================================================================

CREATE POLICY "leads_select_own_tenant" ON leads
  FOR SELECT
  USING (tenant_id = auth.tenant_id() OR auth.is_ceo());

CREATE POLICY "leads_insert_service_role" ON leads
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "leads_update_own_tenant" ON leads
  FOR UPDATE
  USING (tenant_id = auth.tenant_id());

-- Agents can only update leads assigned to them (except owners)
-- Note: this is a simplification — full agent-level scoping added in F08

-- =============================================================================
-- POLICIES: calls
-- =============================================================================

CREATE POLICY "calls_select_own_tenant" ON calls
  FOR SELECT
  USING (tenant_id = auth.tenant_id() OR auth.is_ceo());

CREATE POLICY "calls_insert_own_tenant" ON calls
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "calls_update_own_tenant" ON calls
  FOR UPDATE
  USING (tenant_id = auth.tenant_id());

-- =============================================================================
-- POLICIES: appointments
-- =============================================================================

CREATE POLICY "appointments_select_own_tenant" ON appointments
  FOR SELECT
  USING (tenant_id = auth.tenant_id() OR auth.is_ceo());

CREATE POLICY "appointments_insert_own_tenant" ON appointments
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "appointments_update_own_tenant" ON appointments
  FOR UPDATE
  USING (tenant_id = auth.tenant_id());

-- =============================================================================
-- POLICIES: campaigns
-- =============================================================================

CREATE POLICY "campaigns_select_own_tenant" ON campaigns
  FOR SELECT
  USING (tenant_id = auth.tenant_id() OR auth.is_ceo());

CREATE POLICY "campaigns_insert_own_tenant" ON campaigns
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "campaigns_update_own_tenant" ON campaigns
  FOR UPDATE
  USING (tenant_id = auth.tenant_id());

-- =============================================================================
-- POLICIES: ad_metrics
-- =============================================================================

CREATE POLICY "ad_metrics_select_own_tenant" ON ad_metrics
  FOR SELECT
  USING (tenant_id = auth.tenant_id() OR auth.is_ceo());

-- Insert/update by service role only (n8n sync writes via service role)

-- =============================================================================
-- POLICIES: metrics
-- =============================================================================

CREATE POLICY "metrics_select_own_tenant" ON metrics
  FOR SELECT
  USING (tenant_id = auth.tenant_id() OR auth.is_ceo());

-- =============================================================================
-- POLICIES: reports
-- =============================================================================

CREATE POLICY "reports_select_own_tenant" ON reports
  FOR SELECT
  USING (tenant_id = auth.tenant_id() OR auth.is_ceo());

-- =============================================================================
-- POLICIES: agent_logs
-- (CEO-only read — no RM user access)
-- =============================================================================

CREATE POLICY "agent_logs_ceo_only" ON agent_logs
  FOR SELECT
  USING (auth.is_ceo());

-- =============================================================================
-- POLICIES: alerts
-- =============================================================================

CREATE POLICY "alerts_select_ceo" ON alerts
  FOR SELECT
  USING (auth.is_ceo());

CREATE POLICY "alerts_update_ceo" ON alerts
  FOR UPDATE
  USING (auth.is_ceo());
```

### 2.4 Custom JWT Claims Hook

Supabase Auth hooks allow injecting custom claims into the JWT. We inject `tenant_id` and `role` so RLS policies can use them without additional DB lookups.

```sql
-- supabase/migrations/0003_auth_hook.sql
-- Custom access token hook: injects tenant_id and role into JWT

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims JSONB;
  user_row RECORD;
BEGIN
  claims := event->'claims';

  SELECT tenant_id, role
    INTO user_row
    FROM public.users
   WHERE id = (event->>'user_id')::UUID;

  IF user_row IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}',
      COALESCE(to_jsonb(user_row.tenant_id::TEXT), 'null'));
    claims := jsonb_set(claims, '{role}',
      to_jsonb(user_row.role::TEXT));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant execute to supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;
```

**Supabase dashboard configuration:** In Supabase Auth settings → Hooks → "Customize Access Token (JWT) Claims" → select `public.custom_access_token_hook`.

---

## 3. TypeScript Interfaces

### 3.1 Database Types (Generated by Supabase CLI)

The Supabase CLI generates TypeScript types from the database schema. The generated file lives at `packages/db/src/types/database.types.ts` and is regenerated whenever the schema changes via:

```bash
pnpm supabase gen types typescript --project-id YOUR_PROJECT_ID > packages/db/src/types/database.types.ts
```

The handwritten types below augment the generated types with application-level semantics.

### 3.2 Application-Level Types

```typescript
// packages/db/src/types/index.ts

import type { Database } from "./database.types";

// Table row types (shorthand aliases)
export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type TenantInsert = Database["public"]["Tables"]["tenants"]["Insert"];
export type TenantUpdate = Database["public"]["Tables"]["tenants"]["Update"];

export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];

export type Agent = Database["public"]["Tables"]["agents"]["Row"];
export type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
export type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

export type Call = Database["public"]["Tables"]["calls"]["Row"];
export type CallInsert = Database["public"]["Tables"]["calls"]["Insert"];
export type CallUpdate = Database["public"]["Tables"]["calls"]["Update"];

export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type AdMetrics = Database["public"]["Tables"]["ad_metrics"]["Row"];
export type Metrics = Database["public"]["Tables"]["metrics"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type AgentLog = Database["public"]["Tables"]["agent_logs"]["Row"];
export type Alert = Database["public"]["Tables"]["alerts"]["Row"];
export type AlertUpdate = Database["public"]["Tables"]["alerts"]["Update"];

// Enum types
export type TenantStatus = Database["public"]["Enums"]["tenant_status"];
export type UserRole = Database["public"]["Enums"]["user_role"];
export type LeadStage = Database["public"]["Enums"]["lead_stage"];
export type LeadSource = Database["public"]["Enums"]["lead_source"];
export type CallStatus = Database["public"]["Enums"]["call_status"];
export type CallOutcome = Database["public"]["Enums"]["call_outcome"];
export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];
export type CampaignPlatform = Database["public"]["Enums"]["campaign_platform"];
export type AlertSeverity = Database["public"]["Enums"]["alert_severity"];
export type AlertStatus = Database["public"]["Enums"]["alert_status"];
```

### 3.3 Supabase Client Types

```typescript
// packages/db/src/client.ts

import {
  createServerClient as _createServerClient,
  createBrowserClient as _createBrowserClient,
  type CookieOptions,
} from "@supabase/ssr";
import type { Database } from "./types/database.types";

// Re-export the typed client constructors
export type SupabaseServerClient = ReturnType<typeof createServerClient>;
export type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;

// Server-side client (cookies-based, for Server Components + Route Handlers)
export function createServerClient(
  cookieStore: {
    get: (name: string) => { value: string } | undefined;
    set: (name: string, value: string, options: CookieOptions) => void;
    delete: (name: string, options: CookieOptions) => void;
  },
) {
  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set(name, value, options);
        },
        remove(name, options) {
          cookieStore.delete(name, options);
        },
      },
    },
  );
}

// Browser-side client (localStorage-based, for Client Components)
export function createBrowserClient() {
  return _createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Service-role client (server-only — used in Edge Functions + admin actions)
// NEVER use in client components
export function createServiceRoleClient() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
```

### 3.4 Auth Types

```typescript
// packages/db/src/auth/types.ts

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  requiresMfa?: boolean;    // CEO 2FA required
  mfaChallengeId?: string;  // Pass to verifyMfa
}

export interface MfaVerifyPayload {
  challengeId: string;
  code: string;             // 6-digit TOTP code
}

export interface MfaVerifyResult {
  success: boolean;
  error?: string;
}

export interface MfaEnrollResult {
  success: boolean;
  qrCode?: string;   // data URI for QR code display
  secret?: string;   // manual entry secret
  factorId?: string;
  error?: string;
}

// JWT custom claims shape (mirrors what the hook injects)
export interface JwtClaims {
  sub: string;         // auth.users.id
  email: string;
  role: string;        // user_role enum
  tenant_id: string | null;
  iat: number;
  exp: number;
}
```

### 3.5 Create-Tenant Edge Function Types

```typescript
// packages/db/src/edge/create-tenant.types.ts

export interface CreateTenantPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName: string;
  tenantSlug: string;   // validated: lowercase, alphanumeric + hyphens, unique
  plan?: string;
}

export interface CreateTenantResult {
  success: boolean;
  tenantId?: string;
  userId?: string;
  error?: string;
  errorCode?:
    | "EMAIL_ALREADY_EXISTS"
    | "SLUG_ALREADY_EXISTS"
    | "VALIDATION_ERROR"
    | "INTERNAL_ERROR";
}
```

---

## 4. Server Actions

### 4.1 Login — RM Dashboard

**File:** `apps/dashboard/app/login/actions.ts`

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServerClient } from "@rainmachine/db";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function loginAction(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Don't leak specific auth errors to the client
    if (error.message.includes("Email not confirmed")) {
      return { error: "Please verify your email before logging in." };
    }
    if (error.message.includes("Invalid login credentials")) {
      return { error: "Invalid email or password." };
    }
    if (error.message.includes("Too many requests")) {
      return { error: "Too many login attempts. Please wait 15 minutes." };
    }
    return { error: "Login failed. Please try again." };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/login");
}
```

### 4.2 Login — CEO Dashboard

**File:** `apps/ceo/app/login/actions.ts`

```typescript
"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServerClient } from "@rainmachine/db";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function ceoLoginAction(
  _prevState: { error?: string; requiresMfa?: boolean; challengeId?: string } | null,
  formData: FormData,
): Promise<{ error?: string; requiresMfa?: boolean; challengeId?: string }> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Invalid credentials." };
  }

  // Check if this is a CEO user
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (userData?.role !== "ceo") {
    await supabase.auth.signOut();
    return { error: "Access denied." };
  }

  // Initiate MFA challenge
  const { data: mfaData, error: mfaError } =
    await supabase.auth.mfa.challenge({ factorId: "totp" });

  if (mfaError) {
    // CEO has not enrolled MFA — this is a configuration error
    return { error: "MFA not configured. Contact system administrator." };
  }

  return {
    requiresMfa: true,
    challengeId: mfaData.id,
  };
}
```

### 4.3 CEO 2FA Verification

**File:** `apps/ceo/app/login/verify/actions.ts`

```typescript
"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServerClient } from "@rainmachine/db";

const verifySchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d{6}$/),
});

export async function verifyMfaAction(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = verifySchema.safeParse({
    challengeId: formData.get("challengeId"),
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { error: "Invalid verification code format." };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { error } = await supabase.auth.mfa.verify({
    factorId: "totp",
    challengeId: parsed.data.challengeId,
    code: parsed.data.code,
  });

  if (error) {
    if (error.message.includes("Invalid TOTP code")) {
      return { error: "Invalid code. Please try again." };
    }
    if (error.message.includes("expired")) {
      return { error: "Code expired. Please go back and log in again." };
    }
    return { error: "Verification failed." };
  }

  redirect("/");
}
```

---

## 5. API Routes

### 5.1 Auth Callback Route

**File:** `apps/dashboard/app/auth/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@rainmachine/db";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
```

Same pattern for `apps/ceo/app/auth/callback/route.ts`.

### 5.2 Route Protection — Middleware

**File:** `apps/dashboard/middleware.ts`

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth");

  if (!user && !isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**CEO middleware** additionally checks for `role === 'ceo'` in the JWT claims:

```typescript
// apps/ceo/middleware.ts — additional check after user verification
const claims = user?.user_metadata; // custom claims from hook
if (user && !isAuthRoute && claims?.role !== "ceo") {
  return NextResponse.redirect(new URL("/login", request.url));
}
```

---

## 6. UI Components

### 6.1 Login Page — RM Dashboard

**File:** `apps/dashboard/app/login/page.tsx`

```
Layout:
┌────────────────────────────────────────┐
│          [background: #050D1A]         │
│                                        │
│         ╔════════════════════╗         │
│         ║  RAINMACHINE [Logo]║         │
│         ║                   ║         │
│         ║  [Email Input]    ║         │
│         ║  [Password Input] ║         │
│         ║                   ║         │
│         ║  [Error Message]  ║         │
│         ║                   ║         │
│         ║  [LOG IN ───────] ║         │
│         ║                   ║         │
│         ║  Forgot password? ║         │
│         ╚════════════════════╝         │
│                                        │
└────────────────────────────────────────┘
```

- Card: `CardVariant="glow"` — cyan glow border
- Heading: `font-display text-cyan text-xl uppercase tracking-widest`
- Inputs: from `@rainmachine/ui` — email + password types
- Button: loading state while form submitting, full-width primary
- Error message: `AlertBanner type="error"` — visible only when error exists
- "Forgot password?": text link — deferred (not in MVP scope, opens a modal in future)
- `data-testid="login-form"`

### 6.2 CEO Login Page

**File:** `apps/ceo/app/login/page.tsx`

Identical layout to RM login with:
- Heading: "CEO ACCESS"
- Additional text: "TOTP verification required"

### 6.3 CEO 2FA Verification Page

**File:** `apps/ceo/app/login/verify/page.tsx`

```
Layout:
┌────────────────────────────────────────┐
│         ╔════════════════════╗         │
│         ║  VERIFY IDENTITY  ║         │
│         ║                   ║         │
│         ║  Enter the 6-digit code     ║
│         ║  from your authenticator   ║
│         ║                   ║         │
│         ║  [_ _ _ _ _ _]   ║         │  ← 6 individual digit boxes
│         ║                   ║         │
│         ║  [Error Message]  ║         │
│         ║  [VERIFY ───────] ║         │
│         ║                   ║         │
│         ║  ← Back to login  ║         │
│         ╚════════════════════╝         │
└────────────────────────────────────────┘
```

- 6-digit input: individual digit boxes (1 input per digit, auto-focus-next on entry)
- `challengeId` passed as hidden form field (from login action state)
- `data-testid="mfa-verify-form"`

### 6.4 Session Expiry Modal

**File:** `packages/ui/src/components/SessionExpiryModal/index.tsx`

This modal fires when:
- A server action returns a 401 / session expired error
- (Optional, Cycle 2+): Token expiry countdown reaches 60 seconds

```typescript
export interface SessionExpiryModalProps {
  open: boolean;
  onRefresh: () => void;   // calls supabase.auth.refreshSession()
  onLogout: () => void;
}
```

Visual:
- `Modal size="sm"`
- Warning icon (orange)
- Title: "SESSION EXPIRED"
- Body: "Your session has timed out. Please log in again to continue."
- Buttons: "LOG OUT" (ghost) + "REFRESH SESSION" (primary)

### 6.5 Error Pages

**File:** `apps/dashboard/app/not-found.tsx` — 404

```typescript
// Visual: centered "404" in font-display cyan, subtitle in text-muted, "← GO HOME" button
```

**File:** `apps/dashboard/app/error.tsx` — 500 (must be Client Component)

```typescript
"use client";
// Visual: centered "500" in orange, error message, "RETRY" button calls reset()
```

**File:** `apps/dashboard/app/maintenance/page.tsx` — Maintenance mode

```typescript
// Visual: centered maintenance icon + "MAINTENANCE IN PROGRESS" + ETA text slot
// Shown by middleware when tenants.status = 'paused' (future)
```

**File:** `apps/ceo/app/not-found.tsx` — CEO 404

---

## 7. Integration Points

### 7.1 Supabase Auth API

**Service:** Supabase Auth (hosted, managed)

**Endpoints used (via SDK, not raw HTTP):**

| SDK Method | Purpose |
|---|---|
| `supabase.auth.signInWithPassword()` | RM + CEO login |
| `supabase.auth.signOut()` | Logout |
| `supabase.auth.getUser()` | Session validation in middleware |
| `supabase.auth.mfa.challenge()` | CEO: initiate TOTP challenge |
| `supabase.auth.mfa.verify()` | CEO: verify TOTP code |
| `supabase.auth.mfa.enroll()` | CEO: enroll TOTP (one-time setup) |
| `supabase.auth.refreshSession()` | Session refresh (in expiry modal) |
| `supabase.auth.exchangeCodeForSession()` | OAuth callback (future) |

**Auth configuration (in Supabase dashboard):**

| Setting | Value |
|---|---|
| Email confirmations | Disabled (owner is provisioned by admin) |
| Session duration | 1800s (30 minutes) |
| Refresh token expiry | 7 days |
| Max failed attempts before lockout | 5 |
| Lockout duration | 15 minutes |
| Allowed redirect URLs | `https://app.rainmachine.io/**`, `https://ceo.rainmachine.io/**`, `http://localhost:3000/**`, `http://localhost:3001/**` |

### 7.2 Supabase Edge Function: `create-tenant`

**File:** `supabase/functions/create-tenant/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  // Auth: service role secret in Authorization header
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const payload = await req.json();
  // Validate: email, password, firstName, lastName, tenantName, tenantSlug

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Step 1: Create auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
    });

  if (authError) {
    if (authError.message.includes("already registered")) {
      return new Response(
        JSON.stringify({ success: false, errorCode: "EMAIL_ALREADY_EXISTS" }),
        { status: 409 },
      );
    }
    return new Response(
      JSON.stringify({ success: false, errorCode: "INTERNAL_ERROR" }),
      { status: 500 },
    );
  }

  const userId = authData.user.id;

  // Step 2: Create tenant row
  const { data: tenantData, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      name: payload.tenantName,
      slug: payload.tenantSlug,
      plan: payload.plan ?? "starter",
      status: "provisioning",
    })
    .select("id")
    .single();

  if (tenantError) {
    // Rollback: delete auth user
    await supabase.auth.admin.deleteUser(userId);
    if (tenantError.code === "23505") {
      return new Response(
        JSON.stringify({ success: false, errorCode: "SLUG_ALREADY_EXISTS" }),
        { status: 409 },
      );
    }
    return new Response(
      JSON.stringify({ success: false, errorCode: "INTERNAL_ERROR" }),
      { status: 500 },
    );
  }

  const tenantId = tenantData.id;

  // Step 3: Create users row (links auth user to tenant)
  const { error: userError } = await supabase.from("users").insert({
    id: userId,
    tenant_id: tenantId,
    role: "owner",
    first_name: payload.firstName,
    last_name: payload.lastName,
  });

  if (userError) {
    // Rollback: delete tenant + auth user
    await supabase.from("tenants").delete().eq("id", tenantId);
    await supabase.auth.admin.deleteUser(userId);
    return new Response(
      JSON.stringify({ success: false, errorCode: "INTERNAL_ERROR" }),
      { status: 500 },
    );
  }

  return new Response(
    JSON.stringify({ success: true, tenantId, userId }),
    { status: 201 },
  );
});
```

**Error handling:** If Steps 2 or 3 fail, the auth user is deleted to prevent orphan accounts. True atomicity is approximated via compensating transactions (saga pattern).

### 7.3 Resend (Future — Not F03 Scope)

Password reset email, welcome email — deferred to F06 (Onboarding Job Processor).

---

## 8. BDD Scenarios

### Scenario 1: RM User Successful Login

```
Given Marcus has an active account on app.rainmachine.io
When he enters his email and password and clicks LOG IN
Then he is redirected to /dashboard
And his session cookie is set
And the JWT contains tenant_id matching his tenant
And the JWT contains role = "owner"
```

### Scenario 2: RM User Wrong Password

```
Given Marcus enters the wrong password
When he submits the login form
Then he sees the error "Invalid email or password."
And he remains on the login page
And no session is created
After 5 failed attempts
Then he sees "Too many login attempts. Please wait 15 minutes."
And further attempts are blocked for 15 minutes
```

### Scenario 3: CEO 2FA Flow

```
Given Shomari has a CEO account with TOTP enrolled
When he enters his email and password on ceo.rainmachine.io/login
Then he sees the 2FA verification page
When he enters a valid 6-digit TOTP code
Then he is redirected to /
And his session is authenticated at MFA assurance level 2
```

### Scenario 4: CEO Invalid TOTP Code

```
Given Shomari is on the 2FA verification page
When he enters an incorrect 6-digit code
Then he sees "Invalid code. Please try again."
And he remains on the verification page
And no session is granted
```

### Scenario 5: RM Token Cannot Access CEO Routes

```
Given Marcus is logged in to app.rainmachine.io with role="owner"
When he makes a request to ceo.rainmachine.io with his session token
Then he is redirected to ceo.rainmachine.io/login
And his RM session token is not accepted
```

### Scenario 6: Tenant Isolation — RLS (DB Level)

```
Given Tenant A and Tenant B both have leads in the database
When Marcus (Tenant A) queries the leads table via Supabase client
Then he only receives Tenant A's leads
And Tenant B's leads are not returned
And no error is thrown — the query simply returns scoped results
```

### Scenario 7: CEO Sees All Tenants

```
Given Shomari is logged in as CEO
When he queries the leads table
Then leads from all tenants are returned
And no RLS restriction applies to his role
```

### Scenario 8: Session Expiry Modal

```
Given Marcus has an active session
When the session expires (simulated by calling with expired token)
Then a server action returns a session-expired error
And the SessionExpiryModal appears in the foreground
When Marcus clicks "LOG OUT"
Then he is redirected to /login
When Marcus clicks "REFRESH SESSION"
Then supabase.auth.refreshSession() is called
And if successful, the modal closes and the page reloads
```

### Scenario 9: Tenant Creation is Atomic

```
Given the create-tenant Edge Function is called with valid payload
When the tenant row insertion fails (e.g., duplicate slug)
Then the previously created auth user is deleted
And the database contains no orphan auth user
And the response is 409 with errorCode SLUG_ALREADY_EXISTS
```

### Scenario 10: Unauthenticated Route Access

```
Given a user has no active session
When they navigate directly to /dashboard
Then they are redirected to /login
And the original path is preserved in the redirectTo query param
After successful login
Then they are redirected back to /dashboard
```

---

## 9. Test Plan

### 9.1 pgTAP Database Tests

**File:** `supabase/tests/rls.test.sql`

```sql
BEGIN;

SELECT plan(10);

-- Test 1: Tenant A user cannot see Tenant B leads
SELECT is(
  (
    SELECT count(*)::integer FROM leads
    -- Set JWT claims for Tenant A user
    -- (done via set_config in pgTAP test harness)
  ),
  (SELECT count(*)::integer FROM leads WHERE tenant_id = 'tenant-a-id'::UUID),
  'Tenant A user only sees Tenant A leads'
);

-- Test 2: CEO user sees all leads
-- (test CEO role claim, verify count matches total)
SELECT ok(true, 'CEO sees all tenants leads');

-- Test 3: Tenant A user cannot INSERT lead for Tenant B
-- (expect error)

-- Test 4: RLS on agents table — tenant isolation
-- Test 5: RLS on calls table — tenant isolation
-- Test 6: RLS on appointments table — tenant isolation
-- Test 7: RLS on metrics table — tenant isolation
-- Test 8: agent_logs — RM user gets 0 rows
-- Test 9: alerts — RM user gets 0 rows
-- Test 10: CEO can dismiss alert (UPDATE permitted)

SELECT finish();
ROLLBACK;
```

### 9.2 Server Action Unit Tests (Vitest)

```typescript
// apps/dashboard/app/login/__tests__/actions.test.ts
import { describe, it, expect, vi } from "vitest";
import { loginAction } from "../actions";

// Mock @rainmachine/db createServerClient
vi.mock("@rainmachine/db", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    },
  })),
}));

describe("loginAction", () => {
  it("returns error on invalid email format", async () => {
    const formData = new FormData();
    formData.set("email", "not-an-email");
    formData.set("password", "password123");
    const result = await loginAction(null, formData);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("Invalid email");
  });

  it("returns error on wrong password", async () => {
    vi.mocked(
      require("@rainmachine/db").createServerClient().auth.signInWithPassword,
    ).mockResolvedValueOnce({
      error: { message: "Invalid login credentials" },
    });
    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "wrongpassword");
    const result = await loginAction(null, formData);
    expect(result.error).toBe("Invalid email or password.");
  });
});
```

### 9.3 E2E Tests (Playwright)

```typescript
// apps/dashboard/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("F03 — Authentication", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("login-form")).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });

  // Full happy path requires a test user seed — see Appendix
});
```

### 9.4 Middleware Tests

```typescript
// apps/dashboard/__tests__/middleware.test.ts
// Test that unauthenticated requests to /dashboard return 307 to /login
// Test that authenticated requests to /login return 307 to /dashboard
// Test that CEO-only routes reject RM tokens
```

### 9.5 Edge Function Tests (Deno Test)

```typescript
// supabase/functions/create-tenant/__tests__/create-tenant.test.ts
// Test: valid payload → 201 with tenantId + userId
// Test: duplicate email → 409 EMAIL_ALREADY_EXISTS (no orphan in DB)
// Test: duplicate slug → 409 SLUG_ALREADY_EXISTS (no orphan in DB)
// Test: missing payload fields → 400 VALIDATION_ERROR
// Test: unauthorized request (bad auth header) → 401
```

---

## 10. OWASP Security Checklist

### 10.1 Authentication (A07)

- [ ] **Broken Authentication** — Supabase Auth handles password hashing (bcrypt), session token generation, and rotation. We do not implement custom auth logic.
- [ ] **Lockout** — 5 failed attempts → 15-minute lockout. Configured in Supabase Auth settings.
- [ ] **No credential exposure** — Login server action normalizes all auth errors to generic messages ("Invalid email or password."). Raw Supabase error messages never reach the client.
- [ ] **Session fixation** — Supabase rotates session tokens on login. New token issued on each refresh.
- [ ] **Secure cookies** — Supabase SSR SDK uses `httpOnly`, `sameSite: lax`, `secure` cookie attributes in production.
- [ ] **CEO MFA** — `assuranceLevel: "aal2"` enforced via middleware check on all CEO routes after MFA enrollment.
- [ ] **Session expiry** — 30-minute session (Supabase `session_duration = 1800s`). Expiry modal prevents silent failures.

### 10.2 Authorization (A01)

- [ ] **Broken Access Control** — RLS policies enforce tenant isolation at the database layer. Even if application code has a bug, Supabase RLS prevents cross-tenant data leaks.
- [ ] **CEO access control** — Middleware checks `role === 'ceo'` from JWT claims on every CEO route request. JWT claims are set server-side by the auth hook — not controllable by the client.
- [ ] **Service role key** — `SUPABASE_SERVICE_ROLE_KEY` is server-only. It is never in a `NEXT_PUBLIC_` env var. It is only used in Edge Functions and server-side admin actions.

### 10.3 Injection (A03)

- [ ] **SQL injection** — All DB queries use the Supabase client SDK with parameterized queries. No raw SQL in application code (only in migrations, which are static).
- [ ] **Input validation** — All form inputs validated with Zod before touching the database.
- [ ] **Server actions** — `"use server"` functions validate with Zod on first line. No unvalidated user input reaches Supabase calls.

### 10.4 Cryptographic Failures (A02)

- [ ] **Passwords** — Managed by Supabase Auth (bcrypt). We never see plaintext passwords in our code.
- [ ] **JWT secret** — Managed by Supabase. Not accessible to application code.
- [ ] **ONBOARDING_JWT_SECRET** — Min 32 chars enforced by env schema. Used only for onboarding portal tokens (F06).
- [ ] **Secrets in logs** — No auth tokens or passwords are logged. Server actions do not `console.log` sensitive fields.

### 10.5 Security Misconfiguration (A05)

- [ ] **RLS enabled on all tables** — Confirmed. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` in migration.
- [ ] **No accidental SELECT ALL policy** — Every RLS policy uses a restrictive `USING` clause. No `USING (true)` blanket policies.
- [ ] **Edge Function auth** — `create-tenant` requires `Authorization: Bearer <service_role_key>` header. No unauthenticated access.
- [ ] **Supabase dashboard access** — Only Shomari has Supabase project owner access. No shared credentials.

### 10.6 CSRF Protection

- [ ] **Server Actions** — Next.js Server Actions include automatic CSRF protection via origin checking. No additional CSRF token needed for form submissions.
- [ ] **Route Handlers** — Any `POST /api/*` routes that accept form data must verify `Origin` header or use Next.js middleware CSRF protection (deferred to F04+).

### 10.7 Rate Limiting

- [ ] **Login endpoint** — Supabase Auth built-in rate limiting (5 attempts / 15-minute lockout).
- [ ] **create-tenant Edge Function** — No additional rate limiting in F03 (acceptable — this is an admin-only function, not exposed to end users). Rate limiting added if needed in F06 when user-facing onboarding is built.

---

## 11. Open Questions

### OQ-01 — MFA Enrollment: When and How?

**Question:** How does Shomari (CEO) initially enroll his TOTP factor? The `ceoLoginAction` assumes a factor is already enrolled (`supabase.auth.mfa.challenge({ factorId: "totp" })`). If no factor is enrolled, the login fails with an error.

**Answer:** Enrollment happens out-of-band before the CEO app is first used:
1. Shomari logs in as CEO without 2FA (temporarily allow in dev)
2. Calls `supabase.auth.mfa.enroll({ factorType: "totp" })` to get QR code
3. Scans QR code with authenticator app (Google Authenticator, 1Password, etc.)
4. Calls `supabase.auth.mfa.challenge() + verify()` to confirm enrollment
5. MFA is now enrolled; future logins require TOTP

A one-time enrollment page at `ceo.rainmachine.io/login/enroll` is the right UX. **This page is not in F03 scope — it is a prerequisite step done before the CEO app is first deployed to production.** The implementation decision is: build enrollment page in F13 (CEO Command Center) or handle it as a manual CLI step. Recommendation: add a simple enrollment page to the CEO login flow as part of F13.

**Decision gate:** Before deploying the CEO app to production.

---

### OQ-02 — Supabase Auth Hook: JWT Expiry After Role Change

**Question:** If a user's role is changed in the `users` table after they've logged in, their existing JWT still has the old role claim until the token is refreshed. Is this acceptable?

**Context:** Role changes in F03 scope are infrequent (owner → agent, or CEO changes are manual). The worst case is a brief window where a demoted user retains their old role in the JWT.

**Recommendation:** For MVP, this is acceptable. The 30-minute session duration limits the window. A more robust solution (revocation via Supabase's `auth.sessions` table) can be added in a later cycle if role change frequency increases.

**Decision gate:** Not blocking for F03. Document as a known limitation in `ARCHITECTURE.md`.

---

### OQ-03 — `create-tenant` Authentication: Service Role Key vs. Shared Secret?

**Question:** The `create-tenant` Edge Function is authenticated via the service role key in the Authorization header. Is this the right approach?

**Context:** The service role key is very powerful (bypasses RLS). Using it as a simple shared secret for one Edge Function couples the function's security to the entire database's admin key.

**Alternative:** Generate a separate `CREATE_TENANT_SECRET` env var that the Edge Function checks. More granular — compromising this secret only exposes the `create-tenant` function, not the entire database.

**Recommendation:** Use a separate `CREATE_TENANT_SECRET`. Add it to the Edge Function's env vars and to `apps/onboarding` env schema (F06 calls this function).

**Decision gate:** Before deploying `create-tenant`. Low-risk change to the Edge Function auth.

---

### OQ-04 — pgTAP: Integrate into CI or Run Manually?

**Question:** Should pgTAP tests run automatically in CI (against a local Supabase instance started in CI) or run manually against the staging database?

**Options:**
- A: CI-integrated (`supabase start` in GitHub Actions, run pgTAP)
- B: Manual (developer runs `supabase db test` locally and before deploy)

**Recommendation:** Option A for the critical RLS tests (tenant isolation, CEO access). These must never regress. Run `supabase start` in GitHub Actions using the official `supabase/setup-cli` action.

**Decision gate:** When setting up CI for F03. Add a separate `db-test.yml` workflow.

---

### OQ-05 — Session Expiry Modal: Proactive Timer or Reactive 401?

**Question:** Should the session expiry modal fire proactively (timer set to session_duration - 60s) or reactively (after a server action returns a 401)?

**Options:**
- A: Reactive — simpler; modal only fires when a request fails
- B: Proactive — timer warns 60s before expiry so user doesn't lose in-progress work

**Recommendation:** Option A in F03. Reactive is simpler, covers all cases (token expiry, revocation, etc.), and doesn't require a client-side timer. Option B can be layered on in a later cycle as a UX improvement.

**Decision gate:** F03 implementation start.

---

*PRD F03 — Supabase Schema, RLS & Authentication*
*Sigma Protocol Step 11 · MIRD AI Corporate Machine*
*Written: 2026-04-02 · Cycle 1 · Release 0*
*Depends on: F01 (monorepo), F02 (UI components: Input, Button, Card, Modal, AlertBanner)*
*Unlocks: F04, F05, F06, all R1 app pitches*

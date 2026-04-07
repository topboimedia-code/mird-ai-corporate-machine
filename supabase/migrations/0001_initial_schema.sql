-- =============================================================================
-- MIGRATION: 0001_initial_schema.sql
-- RainMachine — MIRD AI Corporate Machine
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
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

-- TABLE: tenants
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

-- TABLE: users
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
  CONSTRAINT users_ceo_or_tenant CHECK (
    (role = 'ceo' AND tenant_id IS NULL) OR
    (role != 'ceo' AND tenant_id IS NOT NULL)
  )
);

-- TABLE: agents
CREATE TABLE agents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  role_label      TEXT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive')),
  ghl_user_id     TEXT,
  close_rate      NUMERIC(5, 4),
  leads_assigned  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: leads
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
  ghl_contact_id    TEXT UNIQUE,
  ai_call_status    call_status,
  last_activity_at  TIMESTAMPTZ,
  archived_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: calls
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

-- TABLE: appointments
CREATE TABLE appointments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id             UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id            UUID REFERENCES agents(id) ON DELETE SET NULL,
  status              appointment_status NOT NULL DEFAULT 'scheduled',
  scheduled_at        TIMESTAMPTZ NOT NULL,
  held_at             TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  ghl_appointment_id  TEXT UNIQUE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: campaigns
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

-- TABLE: ad_metrics
CREATE TABLE ad_metrics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  spend_cents     INTEGER NOT NULL DEFAULT 0,
  impressions     INTEGER NOT NULL DEFAULT 0,
  clicks          INTEGER NOT NULL DEFAULT 0,
  leads           INTEGER NOT NULL DEFAULT 0,
  cpl_cents       INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, campaign_id, date)
);

-- TABLE: metrics
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

-- TABLE: reports
CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL,
  content     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, week_start)
);

-- TABLE: agent_logs
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

-- TABLE: alerts
CREATE TABLE alerts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
  severity            alert_severity NOT NULL DEFAULT 'info',
  status              alert_status NOT NULL DEFAULT 'active',
  title               TEXT NOT NULL,
  description         TEXT,
  recommended_action  TEXT,
  snoozed_until       TIMESTAMPTZ,
  dismissed_at        TIMESTAMPTZ,
  dismissed_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  dismissed_note      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_leads_tenant_stage ON leads(tenant_id, stage);
CREATE INDEX idx_leads_tenant_created ON leads(tenant_id, created_at DESC);
CREATE INDEX idx_leads_ghl_contact_id ON leads(ghl_contact_id) WHERE ghl_contact_id IS NOT NULL;
CREATE INDEX idx_calls_tenant ON calls(tenant_id, initiated_at DESC);
CREATE INDEX idx_calls_lead ON calls(lead_id);
CREATE INDEX idx_appointments_tenant_status ON appointments(tenant_id, status, scheduled_at);
CREATE INDEX idx_ad_metrics_tenant_date ON ad_metrics(tenant_id, date DESC);
CREATE INDEX idx_metrics_tenant_date ON metrics(tenant_id, date DESC);
CREATE INDEX idx_reports_tenant ON reports(tenant_id, week_start DESC);
CREATE INDEX idx_agent_logs_dept_run ON agent_logs(department, run_at DESC);
CREATE INDEX idx_alerts_active ON alerts(status, severity DESC, created_at DESC) WHERE status = 'active';

-- UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

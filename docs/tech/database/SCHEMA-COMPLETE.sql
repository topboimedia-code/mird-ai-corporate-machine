-- =============================================================================
-- MIRD AI Corporate Machine — Complete Database Schema
-- Step 8: Technical Specification | Date: 2026-03-31
-- Database: Supabase PostgreSQL 16
-- Multi-tenant: every tenant row scoped to organization_id
-- RLS: Row-Level Security enforced on ALL tables
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- HELPER: updated_at trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- BOUNDED CONTEXT 1: MIRD OPERATIONS
-- Tables: organizations, users, subscriptions, reports, agent_performance
-- =============================================================================

-- -----------------------------------------------------------------------------
-- organizations — tenant root record, one row per MIRD client
-- -----------------------------------------------------------------------------
CREATE TABLE organizations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  slug                  TEXT UNIQUE NOT NULL,          -- URL-safe identifier
  owner_user_id         UUID,                          -- FK set after first user created
  plan                  TEXT NOT NULL DEFAULT 'starter'
                          CHECK (plan IN ('starter', 'growth', 'grand_slam')),
  status                TEXT NOT NULL DEFAULT 'onboarding'
                          CHECK (status IN ('onboarding', 'active', 'paused', 'churned')),
  ghl_sub_account_id    TEXT UNIQUE,                   -- Set during provisioning
  ghl_location_id       TEXT,
  timezone              TEXT NOT NULL DEFAULT 'America/Chicago',
  industry              TEXT,                          -- real_estate, insurance

  -- Metadata
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ                    -- Soft delete
);

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_organizations_status   ON organizations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_plan     ON organizations(plan)   WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- users — extends Supabase auth.users with org membership and role
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role              TEXT NOT NULL DEFAULT 'agent'
                      CHECK (role IN ('owner', 'manager', 'agent', 'mird_admin')),
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  avatar_url        TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  last_active_at    TIMESTAMPTZ,
  notification_prefs JSONB DEFAULT '{
    "email": true,
    "sms": false,
    "lead_assigned": true,
    "appt_booked": true,
    "campaign_alert": true
  }'::JSONB,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_users_org          ON users(organization_id);
CREATE INDEX idx_users_role         ON users(organization_id, role);
CREATE INDEX idx_users_email        ON users(email);

-- -----------------------------------------------------------------------------
-- subscriptions — MRR, plan billing state per org
-- -----------------------------------------------------------------------------
CREATE TABLE subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  plan                     TEXT NOT NULL CHECK (plan IN ('starter', 'growth', 'grand_slam')),
  status                   TEXT NOT NULL DEFAULT 'trialing'
                             CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'paused')),
  mrr                      NUMERIC(10,2) NOT NULL DEFAULT 0,
  billing_email            TEXT,
  stripe_customer_id       TEXT UNIQUE,
  stripe_subscription_id   TEXT UNIQUE,
  trial_ends_at            TIMESTAMPTZ,
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  cancelled_at             TIMESTAMPTZ,
  cancellation_reason      TEXT,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_mrr    ON subscriptions(mrr DESC);

-- -----------------------------------------------------------------------------
-- reports — Claude agent generated outputs (MIRD-level and org-level)
-- -----------------------------------------------------------------------------
CREATE TABLE reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID REFERENCES organizations(id) ON DELETE CASCADE,
                    -- NULL = MIRD-level report (all clients, internal only)

  report_type       TEXT NOT NULL
                      CHECK (report_type IN (
                        'DEPT_1_GROWTH', 'DEPT_2_AD_OPS',
                        'DEPT_3_PRODUCT', 'DEPT_4_FINANCE',
                        'WEEKLY_SUMMARY', 'CLIENT_HEALTH'
                      )),
  title             TEXT NOT NULL,
  summary           TEXT,                 -- One-paragraph plain text for dashboard card
  content           JSONB NOT NULL,       -- Full structured report from Claude
  alerts            JSONB DEFAULT '[]',   -- [{ severity, message, action_url }]
  recommendations   JSONB DEFAULT '[]',   -- [{ priority, title, body }]
  action_items      JSONB DEFAULT '[]',   -- [{ owner, task, due_date }]

  -- AI metadata
  model_used        TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  tokens_input      INTEGER,
  tokens_output     INTEGER,
  cost_usd          NUMERIC(8,6),
  generation_time_ms INTEGER,

  generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at           TIMESTAMPTZ,          -- When Shomari first viewed it

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_type        ON reports(report_type, generated_at DESC);
CREATE INDEX idx_reports_org         ON reports(organization_id, generated_at DESC);
CREATE INDEX idx_reports_generated   ON reports(generated_at DESC);

-- -----------------------------------------------------------------------------
-- agent_performance — Claude dept agent run logs
-- -----------------------------------------------------------------------------
CREATE TABLE agent_performance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name      TEXT NOT NULL
                    CHECK (agent_name IN (
                      'DEPT_1_GROWTH', 'DEPT_2_AD_OPS',
                      'DEPT_3_PRODUCT', 'DEPT_4_FINANCE'
                    )),
  status          TEXT NOT NULL
                    CHECK (status IN ('SUCCESS', 'FAILED', 'PARTIAL')),
  run_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_ms     INTEGER,
  tokens_input    INTEGER,
  tokens_output   INTEGER,
  cost_usd        NUMERIC(8,6),
  report_id       UUID REFERENCES reports(id),
  error_message   TEXT,
  error_stack     TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_perf_name   ON agent_performance(agent_name, run_at DESC);
CREATE INDEX idx_agent_perf_status ON agent_performance(status, run_at DESC);

-- =============================================================================
-- BOUNDED CONTEXT 2: RAINMACHINE PLATFORM
-- Tables: agents, ghl_accounts, leads, appointments, ai_calls, onboarding_sessions
-- =============================================================================

-- -----------------------------------------------------------------------------
-- agents — client's sales agent roster (may or may not have portal access)
-- -----------------------------------------------------------------------------
CREATE TABLE agents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES users(id),    -- NULL if no portal access
  full_name         TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  avatar_url        TEXT,
  status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'inactive', 'on_leave')),

  -- Lead routing config
  max_leads_per_day INTEGER NOT NULL DEFAULT 10,
  routing_weight    INTEGER NOT NULL DEFAULT 1
                      CHECK (routing_weight BETWEEN 1 AND 10),
  routing_enabled   BOOLEAN NOT NULL DEFAULT TRUE,

  -- Performance (denormalized for fast dashboard reads, refreshed nightly)
  leads_total        INTEGER NOT NULL DEFAULT 0,
  leads_this_month   INTEGER NOT NULL DEFAULT 0,
  appts_this_month   INTEGER NOT NULL DEFAULT 0,
  close_rate         NUMERIC(5,4),               -- 0.0000 to 1.0000

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_agents_org     ON agents(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_agents_status  ON agents(organization_id, status) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- ghl_accounts — GHL sub-account credentials per org
-- -----------------------------------------------------------------------------
CREATE TABLE ghl_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  sub_account_id      TEXT NOT NULL UNIQUE,
  location_id         TEXT NOT NULL,
  api_key_ref         TEXT,           -- Supabase Vault secret reference (never raw key)
  webhook_secret_ref  TEXT,           -- Vault reference
  is_connected        BOOLEAN NOT NULL DEFAULT FALSE,
  connected_at        TIMESTAMPTZ,
  last_synced_at      TIMESTAMPTZ,
  sync_error          TEXT,           -- Last sync error if any
  webhook_url         TEXT,           -- Registered GHL webhook URL

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER ghl_accounts_updated_at
  BEFORE UPDATE ON ghl_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -----------------------------------------------------------------------------
-- leads — contact records synced from GHL, one row per prospect
-- -----------------------------------------------------------------------------
CREATE TABLE leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ghl_contact_id      TEXT NOT NULL,
  assigned_agent_id   UUID REFERENCES agents(id),
  source_campaign_id  UUID,           -- FK to campaigns (set after campaigns table created)

  -- Contact info
  full_name           TEXT NOT NULL,
  email               TEXT,
  phone               TEXT NOT NULL,
  address             TEXT,
  city                TEXT,
  state               TEXT,
  zip                 TEXT,

  -- Lead classification
  stage               TEXT NOT NULL DEFAULT 'NEW'
                        CHECK (stage IN ('NEW', 'CONTACTED', 'APPT_SET', 'CLOSED', 'LOST')),
  platform            TEXT NOT NULL DEFAULT 'ORGANIC'
                        CHECK (platform IN ('META', 'GOOGLE', 'ORGANIC', 'REFERRAL')),
  lead_score          INTEGER CHECK (lead_score BETWEEN 0 AND 100),

  -- Real estate specific
  property_type       TEXT CHECK (property_type IN ('residential', 'commercial', 'land', 'multi_family')),
  budget_min          INTEGER,
  budget_max          INTEGER,
  timeline            TEXT CHECK (timeline IN ('30_days', '90_days', '6_months', '12_months_plus')),
  pre_approved        BOOLEAN,

  -- Notes and tags
  notes               TEXT,
  tags                TEXT[] DEFAULT '{}',

  -- GHL sync metadata
  ghl_pipeline_id     TEXT,
  ghl_stage_id        TEXT,
  last_ghl_sync_at    TIMESTAMPTZ,
  sync_error          TEXT,

  -- Computed stats (refreshed on realtime update)
  total_calls         INTEGER NOT NULL DEFAULT 0,
  total_appointments  INTEGER NOT NULL DEFAULT 0,
  days_in_pipeline    INTEGER GENERATED ALWAYS AS
                        (EXTRACT(DAY FROM NOW() - created_at)::INTEGER) STORED,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,

  UNIQUE(organization_id, ghl_contact_id)
);

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Core query indexes
CREATE INDEX idx_leads_org           ON leads(organization_id)              WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_stage         ON leads(organization_id, stage)        WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_agent         ON leads(organization_id, assigned_agent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_platform      ON leads(organization_id, platform)     WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_created       ON leads(organization_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_ghl           ON leads(organization_id, ghl_contact_id);
-- Full-text search on name/email/phone
CREATE INDEX idx_leads_search        ON leads USING GIN (
  to_tsvector('english', COALESCE(full_name,'') || ' ' || COALESCE(email,'') || ' ' || phone)
);

-- -----------------------------------------------------------------------------
-- appointments — booked from lead pipeline
-- -----------------------------------------------------------------------------
CREATE TABLE appointments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id               UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id              UUID REFERENCES agents(id),
  ghl_appointment_id    TEXT UNIQUE,
  status                TEXT NOT NULL DEFAULT 'BOOKED'
                          CHECK (status IN ('BOOKED','CONFIRMED','COMPLETED','NO_SHOW','CANCELLED')),
  scheduled_at          TIMESTAMPTZ NOT NULL,
  duration_minutes      INTEGER NOT NULL DEFAULT 30,
  meeting_type          TEXT CHECK (meeting_type IN ('in_person', 'phone', 'video')),
  location              TEXT,
  notes                 TEXT,
  confirmed_at          TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  no_show_at            TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_appts_org         ON appointments(organization_id);
CREATE INDEX idx_appts_lead        ON appointments(lead_id);
CREATE INDEX idx_appts_agent       ON appointments(organization_id, agent_id);
CREATE INDEX idx_appts_scheduled   ON appointments(organization_id, scheduled_at DESC);
CREATE INDEX idx_appts_status      ON appointments(organization_id, status);

-- -----------------------------------------------------------------------------
-- ai_calls — Retell AI + GHL Voice Agent call records
-- -----------------------------------------------------------------------------
CREATE TABLE ai_calls (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id           UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  call_type         TEXT NOT NULL
                      CHECK (call_type IN (
                        'RETELL_NEW_LEAD', 'RETELL_COLD_OUTBOUND',
                        'RETELL_DBR', 'GHL_WARM', 'GHL_CONFIRMATION', 'GHL_INBOUND'
                      )),
  retell_call_id    TEXT UNIQUE,      -- Retell AI call ID (NULL for GHL calls)
  ghl_call_id       TEXT UNIQUE,      -- GHL call ID (NULL for Retell calls)
  status            TEXT NOT NULL DEFAULT 'INITIATED'
                      CHECK (status IN (
                        'INITIATED', 'IN_PROGRESS', 'COMPLETED',
                        'FAILED', 'NO_ANSWER', 'VOICEMAIL', 'BUSY'
                      )),
  disposition       TEXT
                      CHECK (disposition IN (
                        'INTERESTED', 'NOT_INTERESTED', 'CALL_BACK',
                        'APPT_SET', 'WRONG_NUMBER', 'DNC', 'VOICEMAIL_LEFT'
                      )),
  duration_seconds  INTEGER,
  recording_url     TEXT,
  transcript        TEXT,
  summary           TEXT,             -- AI-generated call summary
  sentiment         TEXT CHECK (sentiment IN ('POSITIVE', 'NEUTRAL', 'NEGATIVE')),
  initiated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  connected_at      TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ,
  metadata          JSONB DEFAULT '{}',

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER ai_calls_updated_at
  BEFORE UPDATE ON ai_calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_calls_org        ON ai_calls(organization_id);
CREATE INDEX idx_calls_lead       ON ai_calls(lead_id);
CREATE INDEX idx_calls_type       ON ai_calls(organization_id, call_type);
CREATE INDEX idx_calls_status     ON ai_calls(organization_id, status);
CREATE INDEX idx_calls_initiated  ON ai_calls(organization_id, initiated_at DESC);

-- -----------------------------------------------------------------------------
-- onboarding_sessions — wizard state (token-based, no login required)
-- -----------------------------------------------------------------------------
CREATE TABLE onboarding_sessions (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id            UUID REFERENCES organizations(id),
                             -- NULL until provisioning complete
  token                      TEXT NOT NULL UNIQUE,
  client_email               TEXT NOT NULL,
  client_name                TEXT NOT NULL,
  client_company             TEXT,
  status                     TEXT NOT NULL DEFAULT 'PENDING'
                               CHECK (status IN (
                                 'PENDING', 'IN_PROGRESS', 'COMPLETE', 'EXPIRED', 'FAILED'
                               )),
  current_step               INTEGER NOT NULL DEFAULT 1
                               CHECK (current_step BETWEEN 1 AND 5),

  -- Step data blobs (stored as JSONB, validated in application layer)
  step1_data                 JSONB,   -- { full_name, company, phone, industry, team_size }
  step2_data                 JSONB,   -- { target_market, geo, budget, goals, timeline }
  step3_data                 JSONB,   -- { ad_account_id, account_name } (token stored in Vault)
  step4_data                 JSONB,   -- { customer_id, gmb_location_id, account_name }
  step5_data                 JSONB,   -- { launch_date, notify_email, notify_sms, assets[] }

  -- Verification flags
  meta_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  google_verified            BOOLEAN NOT NULL DEFAULT FALSE,

  -- Provisioning state
  provisioning_started_at    TIMESTAMPTZ,
  provisioning_completed_at  TIMESTAMPTZ,
  provisioning_error         TEXT,

  expires_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  completed_at               TIMESTAMPTZ,

  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER onboarding_sessions_updated_at
  BEFORE UPDATE ON onboarding_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_ob_token    ON onboarding_sessions(token);
CREATE INDEX idx_ob_email    ON onboarding_sessions(client_email);
CREATE INDEX idx_ob_status   ON onboarding_sessions(status);

-- =============================================================================
-- BOUNDED CONTEXT 3: RAINMAKER LEADS
-- Tables: ad_accounts, campaigns, dbr_campaigns
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ad_accounts — client's Meta BM + Google Ads account connections
-- -----------------------------------------------------------------------------
CREATE TABLE ad_accounts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform             TEXT NOT NULL CHECK (platform IN ('META', 'GOOGLE')),
  platform_account_id  TEXT NOT NULL,  -- Meta ad account ID or Google customer ID
  account_name         TEXT,
  currency             TEXT NOT NULL DEFAULT 'USD',

  -- Auth tokens (vault references — never raw tokens in DB)
  access_token_ref     TEXT,   -- Supabase Vault secret ID
  refresh_token_ref    TEXT,   -- Supabase Vault secret ID
  token_expires_at     TIMESTAMPTZ,

  -- Google only
  gmb_account_id       TEXT,
  gmb_location_id      TEXT,
  gmb_location_name    TEXT,

  is_connected         BOOLEAN NOT NULL DEFAULT FALSE,
  connected_at         TIMESTAMPTZ,
  last_synced_at       TIMESTAMPTZ,
  sync_error           TEXT,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ,

  UNIQUE(organization_id, platform)
);

CREATE TRIGGER ad_accounts_updated_at
  BEFORE UPDATE ON ad_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_ad_accounts_org      ON ad_accounts(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_ad_accounts_platform ON ad_accounts(platform)         WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- campaigns — Meta + Google campaign metadata + performance metrics
-- -----------------------------------------------------------------------------
CREATE TABLE campaigns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ad_account_id         UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  platform              TEXT NOT NULL CHECK (platform IN ('META', 'GOOGLE')),
  platform_campaign_id  TEXT NOT NULL,   -- Meta or Google campaign ID
  name                  TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'ACTIVE'
                          CHECK (status IN ('ACTIVE', 'PAUSED', 'DELETED', 'ENDED', 'ERROR')),
  objective             TEXT,            -- LEAD_GENERATION, BRAND_AWARENESS, etc.

  -- Budget
  budget_daily          NUMERIC(10,2),
  budget_lifetime       NUMERIC(10,2),

  -- Performance metrics (synced from platform APIs, updated daily/hourly)
  spend_total           NUMERIC(10,2) DEFAULT 0,
  spend_this_month      NUMERIC(10,2) DEFAULT 0,
  impressions           BIGINT DEFAULT 0,
  clicks                INTEGER DEFAULT 0,
  leads_count           INTEGER DEFAULT 0,
  cpl                   NUMERIC(10,2),  -- cost per lead (spend / leads_count)
  ctr                   NUMERIC(6,4),   -- click-through rate
  conversion_rate       NUMERIC(6,4),   -- leads / clicks

  -- Time bounds
  started_at            TIMESTAMPTZ,
  ended_at              TIMESTAMPTZ,
  last_synced_at        TIMESTAMPTZ,

  metadata              JSONB DEFAULT '{}',  -- Raw API snapshot for debugging

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(platform, platform_campaign_id)
);

-- Backfill leads FK now that campaigns exists
ALTER TABLE leads
  ADD CONSTRAINT fk_leads_campaign
  FOREIGN KEY (source_campaign_id) REFERENCES campaigns(id);

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_campaigns_org       ON campaigns(organization_id);
CREATE INDEX idx_campaigns_platform  ON campaigns(organization_id, platform);
CREATE INDEX idx_campaigns_status    ON campaigns(organization_id, status);
CREATE INDEX idx_campaigns_cpl       ON campaigns(organization_id, cpl ASC NULLS LAST);

-- -----------------------------------------------------------------------------
-- dbr_campaigns — Database Reactivation campaigns (AI-powered cold outreach)
-- -----------------------------------------------------------------------------
CREATE TABLE dbr_campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'DRAFT'
                        CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),

  -- Target criteria
  lead_stage_filter   TEXT[] DEFAULT '{"CONTACTED", "LOST"}',
  last_contact_days   INTEGER DEFAULT 90,  -- min days since last contact
  total_targets       INTEGER DEFAULT 0,

  -- Results
  calls_initiated     INTEGER DEFAULT 0,
  calls_completed     INTEGER DEFAULT 0,
  calls_no_answer     INTEGER DEFAULT 0,
  appointments_set    INTEGER DEFAULT 0,

  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER dbr_campaigns_updated_at
  BEFORE UPDATE ON dbr_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_dbr_org    ON dbr_campaigns(organization_id);
CREATE INDEX idx_dbr_status ON dbr_campaigns(organization_id, status);

-- =============================================================================
-- CROSS-CONTEXT: NOTIFICATIONS
-- =============================================================================

CREATE TABLE notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID REFERENCES organizations(id) ON DELETE CASCADE,
                   -- NULL = MIRD-wide (CEO only)
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
                   -- NULL = org-wide broadcast
  type             TEXT NOT NULL
                     CHECK (type IN (
                       'LEAD_ASSIGNED', 'LEAD_STAGE_CHANGED',
                       'APPT_BOOKED', 'APPT_NO_SHOW', 'APPT_CONFIRMED',
                       'CAMPAIGN_ALERT', 'AGENT_ALERT',
                       'SYSTEM_ALERT', 'CEO_REPORT_READY'
                     )),
  severity         TEXT NOT NULL DEFAULT 'INFO'
                     CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  title            TEXT NOT NULL,
  body             TEXT,
  action_url       TEXT,          -- Deep link to relevant screen
  metadata         JSONB DEFAULT '{}',
  read_at          TIMESTAMPTZ,
  dismissed_at     TIMESTAMPTZ,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_org    ON notifications(organization_id, created_at DESC)
                               WHERE dismissed_at IS NULL;
CREATE INDEX idx_notif_user   ON notifications(user_id, created_at DESC)
                               WHERE dismissed_at IS NULL;
CREATE INDEX idx_notif_unread ON notifications(organization_id)
                               WHERE read_at IS NULL AND dismissed_at IS NULL;

-- =============================================================================
-- ROW-LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on ALL tables
ALTER TABLE organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance   ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_accounts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_calls            ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_accounts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE dbr_campaigns       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;

-- Helper function: get the current user's organization_id
CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function: get the current user's role
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function: is current user a MIRD admin?
CREATE OR REPLACE FUNCTION is_mird_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'mird_admin')
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- RLS: organizations
-- -----------------------------------------------------------------------------
-- SELECT: own org only (or all if mird_admin)
CREATE POLICY "organizations: select own"
  ON organizations FOR SELECT
  USING (id = auth_org_id() OR is_mird_admin());

-- UPDATE: owner or mird_admin
CREATE POLICY "organizations: update own"
  ON organizations FOR UPDATE
  USING (id = auth_org_id() AND auth_role() IN ('owner', 'mird_admin'))
  WITH CHECK (id = auth_org_id() AND auth_role() IN ('owner', 'mird_admin'));

-- INSERT: mird_admin only (orgs created via provisioning, not self-service)
CREATE POLICY "organizations: insert mird_admin only"
  ON organizations FOR INSERT
  WITH CHECK (is_mird_admin());

-- -----------------------------------------------------------------------------
-- RLS: users
-- -----------------------------------------------------------------------------
CREATE POLICY "users: select own org"
  ON users FOR SELECT
  USING (organization_id = auth_org_id() OR is_mird_admin());

CREATE POLICY "users: update own record or owner"
  ON users FOR UPDATE
  USING (
    id = auth.uid()
    OR (organization_id = auth_org_id() AND auth_role() IN ('owner', 'manager'))
    OR is_mird_admin()
  )
  WITH CHECK (
    id = auth.uid()
    OR (organization_id = auth_org_id() AND auth_role() IN ('owner', 'manager'))
    OR is_mird_admin()
  );

CREATE POLICY "users: insert own org"
  ON users FOR INSERT
  WITH CHECK (
    organization_id = auth_org_id() AND auth_role() IN ('owner', 'manager')
    OR is_mird_admin()
  );

-- -----------------------------------------------------------------------------
-- RLS: subscriptions — owner and mird_admin only
-- -----------------------------------------------------------------------------
CREATE POLICY "subscriptions: owner or mird_admin"
  ON subscriptions FOR ALL
  USING (
    organization_id = auth_org_id() AND auth_role() IN ('owner')
    OR is_mird_admin()
  )
  WITH CHECK (is_mird_admin()); -- only mird_admin can write

-- -----------------------------------------------------------------------------
-- RLS: reports — mird_admin only for MIRD-level; org members for org reports
-- -----------------------------------------------------------------------------
CREATE POLICY "reports: mird_admin sees all"
  ON reports FOR SELECT
  USING (is_mird_admin());

CREATE POLICY "reports: org members see own org reports"
  ON reports FOR SELECT
  USING (organization_id = auth_org_id() AND NOT is_mird_admin());

CREATE POLICY "reports: insert by service role only"
  ON reports FOR INSERT
  WITH CHECK (is_mird_admin());

-- -----------------------------------------------------------------------------
-- RLS: agent_performance — mird_admin only (internal MIRD data)
-- -----------------------------------------------------------------------------
CREATE POLICY "agent_performance: mird_admin only"
  ON agent_performance FOR ALL
  USING (is_mird_admin())
  WITH CHECK (is_mird_admin());

-- -----------------------------------------------------------------------------
-- RLS: agents — org-scoped
-- -----------------------------------------------------------------------------
CREATE POLICY "agents: select own org"
  ON agents FOR SELECT
  USING (organization_id = auth_org_id() OR is_mird_admin());

CREATE POLICY "agents: write own org, owner/manager only"
  ON agents FOR INSERT
  WITH CHECK (
    organization_id = auth_org_id() AND auth_role() IN ('owner', 'manager')
    OR is_mird_admin()
  );

CREATE POLICY "agents: update own org, owner/manager only"
  ON agents FOR UPDATE
  USING (organization_id = auth_org_id() AND auth_role() IN ('owner', 'manager') OR is_mird_admin())
  WITH CHECK (organization_id = auth_org_id() AND auth_role() IN ('owner', 'manager') OR is_mird_admin());

-- -----------------------------------------------------------------------------
-- RLS: ghl_accounts — owner + mird_admin
-- -----------------------------------------------------------------------------
CREATE POLICY "ghl_accounts: owner or mird_admin"
  ON ghl_accounts FOR ALL
  USING (organization_id = auth_org_id() AND auth_role() IN ('owner') OR is_mird_admin())
  WITH CHECK (is_mird_admin()); -- provisioning writes via service role

-- -----------------------------------------------------------------------------
-- RLS: leads — all org members can select; owner/manager can write
-- -----------------------------------------------------------------------------
CREATE POLICY "leads: select own org"
  ON leads FOR SELECT
  USING (organization_id = auth_org_id() OR is_mird_admin());

CREATE POLICY "leads: write own org"
  ON leads FOR INSERT
  WITH CHECK (organization_id = auth_org_id() OR is_mird_admin());

CREATE POLICY "leads: update own org"
  ON leads FOR UPDATE
  USING (organization_id = auth_org_id() OR is_mird_admin())
  WITH CHECK (organization_id = auth_org_id() OR is_mird_admin());

-- -----------------------------------------------------------------------------
-- RLS: appointments — org-scoped
-- -----------------------------------------------------------------------------
CREATE POLICY "appointments: org-scoped all"
  ON appointments FOR ALL
  USING (organization_id = auth_org_id() OR is_mird_admin())
  WITH CHECK (organization_id = auth_org_id() OR is_mird_admin());

-- -----------------------------------------------------------------------------
-- RLS: ai_calls — org-scoped
-- -----------------------------------------------------------------------------
CREATE POLICY "ai_calls: org-scoped all"
  ON ai_calls FOR ALL
  USING (organization_id = auth_org_id() OR is_mird_admin())
  WITH CHECK (organization_id = auth_org_id() OR is_mird_admin());

-- -----------------------------------------------------------------------------
-- RLS: onboarding_sessions — special: token-based access (no session required)
-- Anon key allowed for token validation; service role for writes
-- -----------------------------------------------------------------------------
CREATE POLICY "onboarding_sessions: token-based read (anon)"
  ON onboarding_sessions FOR SELECT
  TO anon
  USING (expires_at > NOW() AND status NOT IN ('EXPIRED', 'FAILED'));

CREATE POLICY "onboarding_sessions: authenticated owner reads"
  ON onboarding_sessions FOR SELECT
  TO authenticated
  USING (organization_id = auth_org_id() OR is_mird_admin());

-- Writes always via service_role (Edge Functions) — no authenticated INSERT policy
-- This prevents client-side data tampering of onboarding state

-- -----------------------------------------------------------------------------
-- RLS: ad_accounts — owner + mird_admin
-- -----------------------------------------------------------------------------
CREATE POLICY "ad_accounts: owner or mird_admin"
  ON ad_accounts FOR SELECT
  USING (organization_id = auth_org_id() OR is_mird_admin());

CREATE POLICY "ad_accounts: write owner or mird_admin"
  ON ad_accounts FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() = 'owner' OR is_mird_admin());

CREATE POLICY "ad_accounts: update owner or mird_admin"
  ON ad_accounts FOR UPDATE
  USING (organization_id = auth_org_id() AND auth_role() = 'owner' OR is_mird_admin())
  WITH CHECK (organization_id = auth_org_id() AND auth_role() = 'owner' OR is_mird_admin());

-- -----------------------------------------------------------------------------
-- RLS: campaigns — all org members read; mird_admin writes (synced by system)
-- -----------------------------------------------------------------------------
CREATE POLICY "campaigns: org members read"
  ON campaigns FOR SELECT
  USING (organization_id = auth_org_id() OR is_mird_admin());

CREATE POLICY "campaigns: service role writes"
  ON campaigns FOR INSERT
  WITH CHECK (is_mird_admin());

CREATE POLICY "campaigns: service role updates"
  ON campaigns FOR UPDATE
  USING (is_mird_admin())
  WITH CHECK (is_mird_admin());

-- -----------------------------------------------------------------------------
-- RLS: dbr_campaigns — owner/manager write; all org members read
-- -----------------------------------------------------------------------------
CREATE POLICY "dbr_campaigns: org members read"
  ON dbr_campaigns FOR SELECT
  USING (organization_id = auth_org_id() OR is_mird_admin());

CREATE POLICY "dbr_campaigns: owner/manager write"
  ON dbr_campaigns FOR ALL
  USING (organization_id = auth_org_id() AND auth_role() IN ('owner','manager') OR is_mird_admin())
  WITH CHECK (organization_id = auth_org_id() AND auth_role() IN ('owner','manager') OR is_mird_admin());

-- -----------------------------------------------------------------------------
-- RLS: notifications — user sees own + org-wide; mird_admin sees all
-- -----------------------------------------------------------------------------
CREATE POLICY "notifications: user sees own"
  ON notifications FOR SELECT
  USING (
    user_id = auth.uid()
    OR (organization_id = auth_org_id() AND user_id IS NULL)
    OR (organization_id IS NULL AND is_mird_admin())
    OR is_mird_admin()
  );

CREATE POLICY "notifications: update own (mark read/dismissed)"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid() OR organization_id = auth_org_id())
  WITH CHECK (user_id = auth.uid() OR organization_id = auth_org_id());

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- MIRD internal organization (Shomari's own org for CEO dashboard)
INSERT INTO organizations (id, name, slug, plan, status)
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Make It Rain Digital',
    'mird-internal',
    'grand_slam',
    'active'
  )
  ON CONFLICT DO NOTHING;

-- =============================================================================
-- MIGRATION NOTES
-- =============================================================================
-- Version: 001_initial_schema
-- Applied: 2026-03-31
-- Author: MIRD Step 8 Technical Spec
--
-- Future migrations go in: supabase/migrations/
-- Naming convention: {timestamp}_{description}.sql
-- Example: 20260401120000_add_lead_score_index.sql
--
-- Run locally: supabase db push
-- Run against remote: supabase db push --linked
-- Generate types after migration: supabase gen types typescript --linked > packages/types/src/database.types.ts

# SCHEMA.md — Make It Rain Digital (MIRD)
## RainMachine Platform — Database Schema

**Version:** 1.0
**Date:** 2026-03-29
**Database:** PostgreSQL via Supabase
**Multi-tenancy:** Row-Level Security (RLS) on all tenant-scoped tables

---

## Table of Contents

1. [Enum Types](#1-enum-types)
2. [Core Tables](#2-core-tables)
3. [Lead & Contact Tables](#3-lead--contact-tables)
4. [Advertising Tables](#4-advertising-tables)
5. [AI & Voice Tables](#5-ai--voice-tables)
6. [Operations Tables](#6-operations-tables)
7. [RLS Policies](#7-rls-policies)
8. [Indexes](#8-indexes)
9. [Relationship Map](#9-relationship-map)

---

## 1. Enum Types

```sql
-- Organization plan / subscription tier
CREATE TYPE subscription_plan AS ENUM (
  'dbr',           -- $1,500 one-time Database Reactivation
  'starter',       -- $997/mo — RainMachine, up to 5 agents
  'growth',        -- $4,997/mo — RainMachine Pro + Rainmaker Leads (Meta + Google)
  'scale',         -- $9,997/mo — RainMachine Pro + Rainmaker Leads (all channels)
  'build_release'  -- $5K-$15K one-time + $500-$1K/mo (client owns full MIRD stack)
);

-- Subscription billing status
CREATE TYPE subscription_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'paused'
);

-- Lead lifecycle status
CREATE TYPE lead_status AS ENUM (
  'new',             -- Just created, not yet contacted
  'call_queued',     -- Queued for Retell AI outbound call
  'call_in_progress',
  'call_completed',
  'appointment_requested',
  'appointment_scheduled',
  'appointment_confirmed',
  'appointment_completed',
  'no_show',
  'closed_won',
  'closed_lost',
  'dnc',             -- Do Not Contact
  'archived'
);

-- Lead source channel
CREATE TYPE lead_source AS ENUM (
  'meta_ads',
  'google_ads',
  'google_lsa',       -- Local Service Ads
  'organic',
  'referral',
  'apollo',           -- MIRD outbound prospecting
  'dbr',              -- Database Reactivation campaign
  'manual',
  'other'
);

-- AI / voice call outcome
CREATE TYPE call_outcome AS ENUM (
  'interested',
  'not_interested',
  'callback_requested',
  'voicemail',
  'no_answer',
  'wrong_number',
  'do_not_call',
  'appointment_booked',
  'appointment_confirmed',
  'appointment_rescheduled',
  'no_show_acknowledged',
  'error'
);

-- Which AI system made the call
CREATE TYPE call_system AS ENUM (
  'retell_ai',
  'ghl_native_voice'
);

-- Call direction
CREATE TYPE call_direction AS ENUM (
  'outbound',
  'inbound'
);

-- Appointment status
CREATE TYPE appointment_status AS ENUM (
  'scheduled',
  'confirmed',
  'completed',
  'no_show',
  'canceled',
  'rescheduled'
);

-- Ad platform
CREATE TYPE ad_platform AS ENUM (
  'meta',
  'google',
  'google_lsa',
  'tiktok'
);

-- Campaign status
CREATE TYPE campaign_status AS ENUM (
  'active',
  'paused',
  'learning',
  'error',
  'archived'
);

-- Claude agent department
CREATE TYPE agent_department AS ENUM (
  'dept1_growth',
  'dept2_ad_ops',
  'dept3_product',
  'dept4_finance'
);

-- Claude agent run status
CREATE TYPE agent_run_status AS ENUM (
  'running',
  'completed',
  'failed',
  'partial'
);

-- CEO loop report period
CREATE TYPE report_period AS ENUM (
  'morning',
  'midday',
  'evening',
  'daily_summary',
  'weekly'
);

-- Report type
CREATE TYPE report_type AS ENUM (
  'ceo_loop',
  'ad_performance',
  'client_health',
  'mrr_summary',
  'agent_output',
  'onboarding_summary'
);

-- Webhook source
CREATE TYPE webhook_source AS ENUM (
  'ghl',
  'retell_ai',
  'meta',
  'google_ads',
  'stripe',
  'internal'
);

-- Webhook processing status
CREATE TYPE webhook_status AS ENUM (
  'received',
  'processing',
  'processed',
  'failed',
  'duplicate'
);

-- User role
CREATE TYPE user_role AS ENUM (
  'mird_admin',          -- Shomari / MIRD team
  'client_admin',        -- Team leader (Marcus persona)
  'agent',               -- Agent within a team
  'build_release_admin'  -- Build & Release client owner
);

-- Onboarding step status
CREATE TYPE onboarding_step_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'skipped',
  'failed'
);
```

---

## 2. Core Tables

### `organizations`

The root tenant table. Every client is an organization.

```sql
CREATE TABLE organizations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Identity
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,      -- URL-safe identifier, e.g. "marcus-realty-group"
  owner_name            TEXT NOT NULL,
  owner_email           TEXT NOT NULL,
  owner_phone           TEXT,
  website               TEXT,
  logo_url              TEXT,

  -- Business context
  industry              TEXT NOT NULL DEFAULT 'real_estate', -- 'real_estate' | 'insurance'
  team_size             INTEGER,                  -- Number of agents on team
  primary_market        TEXT,                     -- e.g. "Atlanta, GA"
  secondary_markets     TEXT[],                   -- Additional markets
  icp_description       TEXT,                     -- ICP written description from onboarding

  -- GHL
  ghl_location_id       TEXT UNIQUE,              -- GHL sub-account location ID
  ghl_provisioned       BOOLEAN NOT NULL DEFAULT false,
  ghl_provisioned_at    TIMESTAMPTZ,

  -- Plan / subscription
  subscription_plan     subscription_plan NOT NULL DEFAULT 'starter',
  subscription_status   subscription_status NOT NULL DEFAULT 'trialing',

  -- Build & Release flag
  is_build_release      BOOLEAN NOT NULL DEFAULT false,
  build_release_config  JSONB,                    -- Stack clone config (Vercel URLs, n8n instance, etc.)

  -- Onboarding
  onboarding_completed  BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,

  -- Meta
  is_active             BOOLEAN NOT NULL DEFAULT true,
  notes                 TEXT                      -- Internal MIRD notes
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_ghl_location_id ON organizations(ghl_location_id);
CREATE INDEX idx_organizations_subscription_plan ON organizations(subscription_plan);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);
```

### `user_profiles`

Extends Supabase Auth `auth.users`. One profile per auth user.

```sql
CREATE TABLE user_profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Identity
  full_name             TEXT NOT NULL,
  email                 TEXT NOT NULL,
  phone                 TEXT,
  avatar_url            TEXT,

  -- Role & org
  role                  user_role NOT NULL,
  organization_id       UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- GHL
  ghl_user_id           TEXT,                     -- GHL user ID in their sub-account
  ghl_location_id       TEXT,                     -- GHL sub-account they belong to

  -- State
  is_active             BOOLEAN NOT NULL DEFAULT true,
  last_login_at         TIMESTAMPTZ,
  onboarded             BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_user_profiles_organization_id ON user_profiles(organization_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
```

### `subscriptions`

One record per billing event / subscription state. Append-only log for MRR tracking.

```sql
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Billing
  plan                  subscription_plan NOT NULL,
  status                subscription_status NOT NULL,
  mrr_cents             INTEGER NOT NULL,          -- Monthly recurring revenue in cents
  one_time_amount_cents INTEGER DEFAULT 0,         -- For DBR or Build & Release one-time fees
  currency              TEXT NOT NULL DEFAULT 'usd',

  -- Period
  period_start          DATE NOT NULL,
  period_end            DATE,

  -- Change tracking
  previous_plan         subscription_plan,
  change_reason         TEXT,                      -- 'upgrade' | 'downgrade' | 'churn' | 'new'

  -- External billing (Stripe or manual)
  stripe_subscription_id TEXT,
  stripe_customer_id     TEXT,
  invoice_notes          TEXT
);

CREATE INDEX idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_start ON subscriptions(period_start);
```

---

## 3. Lead & Contact Tables

### `leads`

Synced from GHL contacts. Supabase is the query layer; GHL is the source of truth.

```sql
CREATE TABLE leads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Tenant
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- GHL sync
  ghl_contact_id        TEXT NOT NULL,             -- GHL contact ID
  ghl_location_id       TEXT NOT NULL,
  ghl_pipeline_id       TEXT,
  ghl_pipeline_stage_id TEXT,
  ghl_synced_at         TIMESTAMPTZ,

  -- Identity
  first_name            TEXT,
  last_name             TEXT,
  email                 TEXT,
  phone                 TEXT,
  full_name             TEXT GENERATED ALWAYS AS (
                          COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
                        ) STORED,

  -- Source
  source                lead_source NOT NULL DEFAULT 'other',
  source_campaign_id    UUID REFERENCES campaigns(id),
  source_ad_id          TEXT,                      -- Meta ad ID or Google ad ID
  source_form_id        TEXT,                      -- GHL form ID
  utm_source            TEXT,
  utm_medium            TEXT,
  utm_campaign          TEXT,
  utm_content           TEXT,

  -- Status
  status                lead_status NOT NULL DEFAULT 'new',
  assigned_agent_id     UUID REFERENCES user_profiles(id),

  -- Qualification
  is_qualified          BOOLEAN,
  qualification_notes   TEXT,
  estimated_deal_value  INTEGER,                   -- In cents

  -- Tags (synced from GHL)
  tags                  TEXT[],

  -- Metadata
  custom_fields         JSONB DEFAULT '{}',        -- GHL custom field values
  notes                 TEXT
);

CREATE UNIQUE INDEX idx_leads_ghl_contact_org
  ON leads(ghl_contact_id, organization_id);
CREATE INDEX idx_leads_organization_id ON leads(organization_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_assigned_agent_id ON leads(assigned_agent_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_source_campaign_id ON leads(source_campaign_id);
```

### `appointments`

```sql
CREATE TABLE appointments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Tenant
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Relations
  lead_id               UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_agent_id     UUID REFERENCES user_profiles(id),

  -- GHL sync
  ghl_appointment_id    TEXT UNIQUE,
  ghl_calendar_id       TEXT,
  ghl_location_id       TEXT NOT NULL,

  -- Scheduling
  scheduled_at          TIMESTAMPTZ NOT NULL,
  duration_minutes      INTEGER NOT NULL DEFAULT 30,
  timezone              TEXT NOT NULL DEFAULT 'America/New_York',

  -- Status
  status                appointment_status NOT NULL DEFAULT 'scheduled',
  confirmed_at          TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  canceled_at           TIMESTAMPTZ,
  cancellation_reason   TEXT,

  -- Outcome
  outcome_notes         TEXT,
  deal_value_cents      INTEGER,
  closed_won            BOOLEAN,

  -- Reminders
  reminder_sent_24h     BOOLEAN NOT NULL DEFAULT false,
  reminder_sent_2h      BOOLEAN NOT NULL DEFAULT false,
  reminder_call_id      UUID REFERENCES ai_calls(id)
);

CREATE INDEX idx_appointments_organization_id ON appointments(organization_id);
CREATE INDEX idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at DESC);
CREATE INDEX idx_appointments_assigned_agent_id ON appointments(assigned_agent_id);
```

### `agents`

Client's agent roster (not AI agents — these are the human agents on the real estate team).

```sql
CREATE TABLE agents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Tenant
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Auth link (nullable — agent may not have dashboard login)
  user_profile_id       UUID REFERENCES user_profiles(id),

  -- Identity
  full_name             TEXT NOT NULL,
  email                 TEXT,
  phone                 TEXT,

  -- GHL
  ghl_user_id           TEXT,

  -- Performance tracking
  leads_assigned        INTEGER NOT NULL DEFAULT 0,
  appointments_booked   INTEGER NOT NULL DEFAULT 0,
  deals_closed          INTEGER NOT NULL DEFAULT 0,

  -- State
  is_active             BOOLEAN NOT NULL DEFAULT true,
  seat_active           BOOLEAN NOT NULL DEFAULT true  -- Counts against plan seat limit
);

CREATE INDEX idx_agents_organization_id ON agents(organization_id);
CREATE INDEX idx_agents_user_profile_id ON agents(user_profile_id);
CREATE INDEX idx_agents_is_active ON agents(is_active);
```

---

## 4. Advertising Tables

### `ad_accounts`

Client's advertising accounts — one row per platform per client.

```sql
CREATE TABLE ad_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Tenant
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Platform
  platform              ad_platform NOT NULL,

  -- Meta fields
  meta_business_manager_id  TEXT,
  meta_ad_account_id        TEXT,              -- Format: act_XXXXXXXXX
  meta_pixel_id             TEXT,
  meta_system_user_token    TEXT,              -- Encrypted at rest — non-expiring System User token
  meta_access_granted       BOOLEAN NOT NULL DEFAULT false,

  -- Google fields
  google_ads_customer_id    TEXT,             -- Format: XXX-XXX-XXXX
  google_mcc_customer_id    TEXT,             -- MIRD's MCC account ID
  google_refresh_token      TEXT,             -- Encrypted at rest
  google_ads_access_granted BOOLEAN NOT NULL DEFAULT false,

  -- Google My Business
  gmb_account_id            TEXT,
  gmb_location_id           TEXT,
  gmb_access_granted        BOOLEAN NOT NULL DEFAULT false,

  -- State
  is_active             BOOLEAN NOT NULL DEFAULT true,
  last_synced_at        TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_ad_accounts_org_platform
  ON ad_accounts(organization_id, platform);
CREATE INDEX idx_ad_accounts_organization_id ON ad_accounts(organization_id);
```

### `campaigns`

Campaign metadata — synced from Meta / Google.

```sql
CREATE TABLE campaigns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Tenant
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ad_account_id         UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,

  -- Platform identity
  platform              ad_platform NOT NULL,
  platform_campaign_id  TEXT NOT NULL,          -- Meta campaign ID or Google campaign ID
  platform_adset_id     TEXT,                   -- Meta adset ID (null for Google)
  platform_ad_id        TEXT,                   -- Individual ad ID

  -- Metadata
  name                  TEXT NOT NULL,
  objective             TEXT,                   -- 'LEAD_GENERATION' | 'CONVERSIONS' etc.
  status                campaign_status NOT NULL DEFAULT 'active',

  -- Budget
  daily_budget_cents    INTEGER,
  lifetime_budget_cents INTEGER,

  -- Markets
  target_markets        TEXT[],

  -- State
  is_active             BOOLEAN NOT NULL DEFAULT true,
  last_synced_at        TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_campaigns_platform_id_org
  ON campaigns(platform_campaign_id, organization_id);
CREATE INDEX idx_campaigns_organization_id ON campaigns(organization_id);
CREATE INDEX idx_campaigns_ad_account_id ON campaigns(ad_account_id);
CREATE INDEX idx_campaigns_platform ON campaigns(platform);
CREATE INDEX idx_campaigns_status ON campaigns(status);
```

### `campaign_metrics`

Daily performance snapshots per campaign. Follows the Fruit Salad Rule — unique metrics are stored for the full window only (see `window_start` / `window_end`).

```sql
CREATE TABLE campaign_metrics (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Tenant
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id           UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Reporting window (ALWAYS full window — Fruit Salad Rule)
  window_start          DATE NOT NULL,
  window_end            DATE NOT NULL,
  window_type           TEXT NOT NULL DEFAULT 'custom', -- 'last_7d' | 'last_30d' | 'custom' | 'mtd'

  -- Spend
  spend_cents           INTEGER NOT NULL DEFAULT 0,
  impressions           INTEGER NOT NULL DEFAULT 0,
  clicks                INTEGER NOT NULL DEFAULT 0,
  reach                 INTEGER NOT NULL DEFAULT 0,   -- UNIQUE metric — only valid for full window

  -- Lead metrics
  leads                 INTEGER NOT NULL DEFAULT 0,
  cost_per_lead_cents   INTEGER,

  -- Engagement
  ctr                   NUMERIC(6,4),               -- Click-through rate
  cpm_cents             INTEGER,                    -- Cost per 1000 impressions
  cpc_cents             INTEGER,                    -- Cost per click

  -- Quality flags
  fruit_salad_safe      BOOLEAN NOT NULL DEFAULT true, -- false if unique metrics were summed incorrectly

  -- Raw response cache
  raw_response          JSONB                       -- Full API response cached for debugging
);

CREATE UNIQUE INDEX idx_campaign_metrics_campaign_window
  ON campaign_metrics(campaign_id, window_start, window_end, window_type);
CREATE INDEX idx_campaign_metrics_organization_id ON campaign_metrics(organization_id);
CREATE INDEX idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX idx_campaign_metrics_window_start ON campaign_metrics(window_start DESC);
```

### `dbr_campaigns`

Database Reactivation campaigns — one-time campaigns run against a client's dormant contact list.

```sql
CREATE TABLE dbr_campaigns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Tenant
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identity
  name                  TEXT NOT NULL,
  description           TEXT,

  -- State
  status                TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'active' | 'paused' | 'completed'
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,

  -- Contact list
  total_contacts        INTEGER NOT NULL DEFAULT 0,
  contacts_called       INTEGER NOT NULL DEFAULT 0,
  contacts_reached      INTEGER NOT NULL DEFAULT 0,
  appointments_booked   INTEGER NOT NULL DEFAULT 0,
  dnc_count             INTEGER NOT NULL DEFAULT 0,

  -- Retell AI config
  retell_agent_id       TEXT,                 -- Retell AI agent ID for this DBR campaign
  retell_batch_id       TEXT,                 -- Batch call ID from Retell

  -- Script
  call_script           TEXT,                 -- Call script / prompt for Retell agent
  max_call_attempts     INTEGER NOT NULL DEFAULT 3,

  -- GHL
  ghl_tag_filter        TEXT,                 -- GHL tag used to build contact list
  ghl_smart_list_id     TEXT
);

CREATE INDEX idx_dbr_campaigns_organization_id ON dbr_campaigns(organization_id);
CREATE INDEX idx_dbr_campaigns_status ON dbr_campaigns(status);
```

---

## 5. AI & Voice Tables

### `ai_calls`

Records every AI voice call — both Retell AI and GHL Native Voice Agent.

```sql
CREATE TABLE ai_calls (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Tenant
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Relations
  lead_id               UUID REFERENCES leads(id),
  appointment_id        UUID REFERENCES appointments(id),
  dbr_campaign_id       UUID REFERENCES dbr_campaigns(id),

  -- System
  call_system           call_system NOT NULL,
  direction             call_direction NOT NULL DEFAULT 'outbound',

  -- Platform IDs
  retell_call_id        TEXT UNIQUE,          -- Retell AI call ID
  ghl_call_id           TEXT UNIQUE,          -- GHL voice call ID

  -- Numbers
  from_number           TEXT,
  to_number             TEXT,

  -- Timing
  initiated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  connected_at          TIMESTAMPTZ,
  ended_at              TIMESTAMPTZ,
  duration_seconds      INTEGER,

  -- Outcome
  outcome               call_outcome,
  disposition_notes     TEXT,
  sentiment             TEXT,                 -- 'positive' | 'neutral' | 'negative'
  sentiment_score       NUMERIC(4,3),         -- -1.0 to 1.0

  -- Transcript & recording
  transcript            TEXT,
  transcript_json       JSONB,               -- Structured turn-by-turn transcript
  recording_url         TEXT,
  recording_expires_at  TIMESTAMPTZ,

  -- AI Analysis
  ai_summary            TEXT,               -- Claude-generated call summary
  ai_next_action        TEXT,               -- Claude-recommended next action
  key_topics            TEXT[],             -- Topics extracted from transcript

  -- GHL sync
  ghl_synced            BOOLEAN NOT NULL DEFAULT false,
  ghl_synced_at         TIMESTAMPTZ,

  -- Raw webhook payload
  raw_payload           JSONB
);

CREATE INDEX idx_ai_calls_organization_id ON ai_calls(organization_id);
CREATE INDEX idx_ai_calls_lead_id ON ai_calls(lead_id);
CREATE INDEX idx_ai_calls_call_system ON ai_calls(call_system);
CREATE INDEX idx_ai_calls_outcome ON ai_calls(outcome);
CREATE INDEX idx_ai_calls_initiated_at ON ai_calls(initiated_at DESC);
CREATE INDEX idx_ai_calls_dbr_campaign_id ON ai_calls(dbr_campaign_id);
```

---

## 6. Operations Tables

### `ghl_accounts`

GHL sub-account credentials and config per client.

```sql
CREATE TABLE ghl_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One-to-one with organization
  organization_id       UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,

  -- GHL identity
  location_id           TEXT NOT NULL UNIQUE,       -- GHL sub-account location ID
  account_name          TEXT NOT NULL,

  -- API access
  api_key               TEXT,                       -- GHL Private Integration API key (encrypted)
  oauth_access_token    TEXT,                       -- OAuth access token (encrypted)
  oauth_refresh_token   TEXT,                       -- OAuth refresh token (encrypted)
  oauth_expires_at      TIMESTAMPTZ,

  -- Configuration
  pipeline_id           TEXT,                       -- Default pipeline ID
  calendar_id           TEXT,                       -- Default calendar ID
  timezone              TEXT NOT NULL DEFAULT 'America/New_York',

  -- Retell AI
  retell_agent_id       TEXT,                       -- Retell agent for new leads
  retell_phone_number   TEXT,                       -- Retell outbound phone number

  -- GHL Native Voice Agent
  ghl_voice_agent_id    TEXT,

  -- Provisioning
  provisioned           BOOLEAN NOT NULL DEFAULT false,
  provisioned_at        TIMESTAMPTZ,
  template_applied      TEXT                        -- Template name used during provisioning
);

CREATE INDEX idx_ghl_accounts_organization_id ON ghl_accounts(organization_id);
CREATE INDEX idx_ghl_accounts_location_id ON ghl_accounts(location_id);
```

### `reports`

Output store for all Claude AI agent reports and CEO loop snapshots.

```sql
CREATE TABLE reports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Scope (null = MIRD-wide, non-null = client-specific)
  organization_id       UUID REFERENCES organizations(id),

  -- Classification
  report_type           report_type NOT NULL,
  report_period         report_period,
  agent_department      agent_department,

  -- Window
  period_start          TIMESTAMPTZ NOT NULL,
  period_end            TIMESTAMPTZ NOT NULL,

  -- Content
  title                 TEXT,
  summary               TEXT,                      -- Plain-text executive summary
  report_data           JSONB NOT NULL,            -- Full structured report (Claude output)
  flags                 JSONB DEFAULT '[]',        -- Array of { severity, category, message, action }
  recommendations       JSONB DEFAULT '[]',       -- Array of recommended actions
  wins                  TEXT[],
  priorities            TEXT[],

  -- Generation metadata
  generated_by          agent_department,
  model_used            TEXT DEFAULT 'claude-sonnet-4-5',
  prompt_tokens         INTEGER,
  completion_tokens     INTEGER,
  generation_duration_ms INTEGER,

  -- Delivery
  slack_posted          BOOLEAN NOT NULL DEFAULT false,
  slack_ts              TEXT,                      -- Slack message timestamp for threading
  viewed_by_admin       BOOLEAN NOT NULL DEFAULT false,
  viewed_at             TIMESTAMPTZ
);

CREATE INDEX idx_reports_organization_id ON reports(organization_id);
CREATE INDEX idx_reports_report_type ON reports(report_type);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_agent_department ON reports(agent_department);
CREATE INDEX idx_reports_period_start ON reports(period_start DESC);
```

### `agent_performance`

Log of Claude AI agent run executions.

```sql
CREATE TABLE agent_performance (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Which agent
  department            agent_department NOT NULL,
  run_trigger           TEXT NOT NULL,            -- 'cron_morning' | 'cron_midday' | 'manual' etc.

  -- Status
  status                agent_run_status NOT NULL DEFAULT 'running',
  started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at          TIMESTAMPTZ,
  duration_ms           INTEGER,

  -- Output
  report_id             UUID REFERENCES reports(id),
  output_summary        TEXT,
  error_message         TEXT,
  error_stack           TEXT,

  -- Cost tracking
  prompt_tokens         INTEGER,
  completion_tokens     INTEGER,
  estimated_cost_cents  INTEGER                   -- Rough cost estimate
);

CREATE INDEX idx_agent_performance_department ON agent_performance(department);
CREATE INDEX idx_agent_performance_status ON agent_performance(status);
CREATE INDEX idx_agent_performance_created_at ON agent_performance(created_at DESC);
```

### `webhooks_log`

Append-only log of all incoming webhook events. Used for debugging and replay.

```sql
CREATE TABLE webhooks_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Source
  source                webhook_source NOT NULL,
  event_type            TEXT NOT NULL,            -- e.g. 'contact.created', 'call.ended'
  source_event_id       TEXT,                     -- Deduplication key from the source

  -- Payload
  headers               JSONB NOT NULL DEFAULT '{}',
  payload               JSONB NOT NULL,

  -- Processing
  status                webhook_status NOT NULL DEFAULT 'received',
  processed_at          TIMESTAMPTZ,
  processing_duration_ms INTEGER,
  error_message         TEXT,
  n8n_execution_id      TEXT,                     -- n8n workflow execution ID for tracing

  -- Tenant (may be null if organization can't be determined at receive time)
  organization_id       UUID REFERENCES organizations(id),

  -- Deduplication
  is_duplicate          BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_webhooks_log_source ON webhooks_log(source);
CREATE INDEX idx_webhooks_log_event_type ON webhooks_log(event_type);
CREATE INDEX idx_webhooks_log_received_at ON webhooks_log(received_at DESC);
CREATE INDEX idx_webhooks_log_status ON webhooks_log(status);
CREATE INDEX idx_webhooks_log_source_event_id ON webhooks_log(source_event_id)
  WHERE source_event_id IS NOT NULL;

-- Partition or TTL: webhooks_log should be pruned after 90 days
-- Run cleanup function weekly:
-- DELETE FROM webhooks_log WHERE received_at < now() - interval '90 days';
```

### `onboarding_submissions`

Tracks client onboarding form state, step by step.

```sql
CREATE TABLE onboarding_submissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Tenant
  organization_id       UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,

  -- Token-based access (no auth required for portal)
  access_token          TEXT NOT NULL UNIQUE,     -- UUID-based, sent via email
  access_token_expires_at TIMESTAMPTZ NOT NULL,
  token_used_at         TIMESTAMPTZ,

  -- Steps
  step_business_info    onboarding_step_status NOT NULL DEFAULT 'pending',
  step_meta_access      onboarding_step_status NOT NULL DEFAULT 'pending',
  step_google_ads       onboarding_step_status NOT NULL DEFAULT 'pending',
  step_gmb              onboarding_step_status NOT NULL DEFAULT 'pending',
  step_creative_assets  onboarding_step_status NOT NULL DEFAULT 'pending',

  -- Submitted data
  business_info         JSONB DEFAULT '{}',
  meta_info             JSONB DEFAULT '{}',       -- BM ID, ad account IDs
  google_info           JSONB DEFAULT '{}',       -- Customer IDs
  gmb_info              JSONB DEFAULT '{}',
  creative_assets       JSONB DEFAULT '[]',       -- Array of { type, url, description }

  -- Completion
  submitted_at          TIMESTAMPTZ,
  provisioning_started  BOOLEAN NOT NULL DEFAULT false,
  provisioning_completed BOOLEAN NOT NULL DEFAULT false,
  provisioning_error    TEXT
);

CREATE INDEX idx_onboarding_submissions_organization_id ON onboarding_submissions(organization_id);
CREATE INDEX idx_onboarding_submissions_access_token ON onboarding_submissions(access_token);
```

---

## 7. RLS Policies

### Enable RLS on all tenant-scoped tables

```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dbr_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_submissions ENABLE ROW LEVEL SECURITY;
```

### Helper function: get current user's organization_id

```sql
CREATE OR REPLACE FUNCTION auth.current_org_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT organization_id
  FROM user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION auth.current_user_role()
RETURNS user_role
LANGUAGE sql STABLE
AS $$
  SELECT role
  FROM user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION auth.is_mird_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT auth.current_user_role() = 'mird_admin';
$$;
```

### `organizations` RLS

```sql
-- MIRD admins see all organizations
CREATE POLICY "mird_admin_all_orgs" ON organizations
  FOR ALL
  USING (auth.is_mird_admin());

-- Clients see only their own organization
CREATE POLICY "clients_own_org" ON organizations
  FOR SELECT
  USING (id = auth.current_org_id());
```

### `user_profiles` RLS

```sql
-- MIRD admins see all profiles
CREATE POLICY "mird_admin_all_profiles" ON user_profiles
  FOR ALL
  USING (auth.is_mird_admin());

-- Users see their own profile
CREATE POLICY "user_own_profile" ON user_profiles
  FOR SELECT
  USING (id = auth.uid());

-- Client admins see all profiles in their org
CREATE POLICY "client_admin_org_profiles" ON user_profiles
  FOR SELECT
  USING (
    auth.current_user_role() = 'client_admin'
    AND organization_id = auth.current_org_id()
  );

-- Client admins can update profiles in their org (not role changes)
CREATE POLICY "client_admin_update_org_profiles" ON user_profiles
  FOR UPDATE
  USING (
    auth.current_user_role() = 'client_admin'
    AND organization_id = auth.current_org_id()
  )
  WITH CHECK (
    organization_id = auth.current_org_id()
    -- Role cannot be changed via client admin — must be mird_admin
    AND role NOT IN ('mird_admin')
  );
```

### `leads` RLS

```sql
CREATE POLICY "mird_admin_all_leads" ON leads
  FOR ALL
  USING (auth.is_mird_admin());

CREATE POLICY "org_members_own_leads" ON leads
  FOR SELECT
  USING (organization_id = auth.current_org_id());

CREATE POLICY "client_admin_manage_leads" ON leads
  FOR ALL
  USING (
    auth.current_user_role() IN ('client_admin')
    AND organization_id = auth.current_org_id()
  );

-- Agents can only see leads assigned to them
CREATE POLICY "agents_assigned_leads" ON leads
  FOR SELECT
  USING (
    auth.current_user_role() = 'agent'
    AND organization_id = auth.current_org_id()
    AND assigned_agent_id = (
      SELECT id FROM agents WHERE user_profile_id = auth.uid() LIMIT 1
    )
  );
```

### `campaigns` and `campaign_metrics` RLS

```sql
CREATE POLICY "mird_admin_all_campaigns" ON campaigns
  FOR ALL
  USING (auth.is_mird_admin());

CREATE POLICY "org_members_own_campaigns" ON campaigns
  FOR SELECT
  USING (organization_id = auth.current_org_id());

CREATE POLICY "mird_admin_all_metrics" ON campaign_metrics
  FOR ALL
  USING (auth.is_mird_admin());

CREATE POLICY "org_members_own_metrics" ON campaign_metrics
  FOR SELECT
  USING (organization_id = auth.current_org_id());
```

### `reports` RLS

```sql
-- MIRD-wide reports (organization_id IS NULL) only visible to MIRD admin
CREATE POLICY "mird_admin_all_reports" ON reports
  FOR ALL
  USING (auth.is_mird_admin());

-- Client-specific reports visible to that org
CREATE POLICY "org_own_reports" ON reports
  FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND organization_id = auth.current_org_id()
  );
```

### `webhooks_log` RLS

```sql
-- Only MIRD admins can read webhook logs
CREATE POLICY "mird_admin_webhooks" ON webhooks_log
  FOR ALL
  USING (auth.is_mird_admin());
```

### `onboarding_submissions` RLS

```sql
-- MIRD admins full access
CREATE POLICY "mird_admin_onboarding" ON onboarding_submissions
  FOR ALL
  USING (auth.is_mird_admin());

-- Anonymous access for token-based onboarding portal
-- (handled at API level, not RLS — portal uses service role with token validation)
```

---

## 8. Indexes

All indexes are documented inline above with the table definitions. Summary of critical indexes for query performance:

| Table | Index | Purpose |
|-------|-------|---------|
| `leads` | `(ghl_contact_id, organization_id)` | GHL sync deduplication |
| `leads` | `(organization_id, status, created_at DESC)` | Dashboard lead list query |
| `campaigns` | `(platform_campaign_id, organization_id)` | Ad sync deduplication |
| `campaign_metrics` | `(campaign_id, window_start, window_end, window_type)` | Prevent duplicate metric windows |
| `ai_calls` | `(organization_id, call_system, initiated_at DESC)` | Dashboard call history |
| `reports` | `(organization_id, report_type, created_at DESC)` | CEO loop latest report |
| `webhooks_log` | `(source_event_id)` WHERE NOT NULL | Webhook deduplication |

---

## 9. Relationship Map

```
organizations (root tenant)
├── user_profiles (N) ──── auth.users (1)
├── subscriptions (N)
├── agents (N) ──────────── user_profiles (optional 1)
├── ad_accounts (N, 1 per platform)
│   └── campaigns (N)
│       └── campaign_metrics (N)
├── ghl_accounts (1)
├── onboarding_submissions (1)
├── dbr_campaigns (N)
│   └── ai_calls (N, via dbr_campaign_id)
├── leads (N)
│   ├── campaigns (N, via source_campaign_id)
│   ├── appointments (N)
│   │   └── ai_calls (N, via appointment_id)
│   └── ai_calls (N, via lead_id)
└── reports (N)
    └── agent_performance (1, via report_id)
```

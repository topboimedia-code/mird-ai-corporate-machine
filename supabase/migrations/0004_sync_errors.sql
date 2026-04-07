-- =============================================================================
-- MIGRATION: 0004_sync_errors.sql
-- F04 — GHL ↔ Supabase Sync: sync_errors + campaign_sync_log tables
-- =============================================================================

CREATE TYPE sync_error_type AS ENUM (
  'webhook_parse_error',
  'lead_upsert_error',
  'appointment_upsert_error',
  'metrics_rollup_error',
  'unknown'
);

CREATE TABLE sync_errors (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID REFERENCES tenants(id) ON DELETE CASCADE,
  error_type        sync_error_type NOT NULL DEFAULT 'unknown',
  workflow_name     TEXT NOT NULL,
  payload           JSONB,
  error_message     TEXT NOT NULL,
  n8n_execution_id  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_errors_tenant_created ON sync_errors(tenant_id, created_at DESC);
CREATE INDEX idx_sync_errors_recent ON sync_errors(created_at DESC)
  WHERE created_at > NOW() - INTERVAL '1 hour';

-- Scaffolded for F10 (Campaigns); upserted here because F04's daily rollup
-- triggers the need for it as a sync audit trail.
CREATE TABLE campaign_sync_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  triggered_by  TEXT NOT NULL CHECK (triggered_by IN ('scheduled', 'manual')),
  status        TEXT NOT NULL CHECK (status IN ('running', 'success', 'error')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  error_message TEXT
);

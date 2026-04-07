-- =============================================================================
-- MIGRATION: 0005_sync_rls.sql
-- F04 — RLS policies for sync_errors + campaign_sync_log
-- =============================================================================

ALTER TABLE sync_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sync_log ENABLE ROW LEVEL SECURITY;

-- sync_errors: CEO read only — RM users cannot see error details
CREATE POLICY "sync_errors_ceo_only" ON sync_errors
  FOR SELECT USING (auth.is_ceo());

-- No INSERT policy for authenticated role — only service role inserts
-- (n8n error webhook uses service role key)

-- campaign_sync_log: own tenant read + CEO read
CREATE POLICY "campaign_sync_log_tenant_select" ON campaign_sync_log
  FOR SELECT USING (tenant_id = auth.tenant_id() OR auth.is_ceo());

CREATE POLICY "campaign_sync_log_tenant_insert" ON campaign_sync_log
  FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());

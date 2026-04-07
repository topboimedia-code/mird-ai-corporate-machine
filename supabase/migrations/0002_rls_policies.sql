-- =============================================================================
-- MIGRATION: 0002_rls_policies.sql
-- RainMachine — Row Level Security Policies
-- =============================================================================

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

-- Helper functions
CREATE OR REPLACE FUNCTION auth.tenant_id() RETURNS UUID AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb->>'tenant_id',
    ''
  )::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb->>'role',
    ''
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.is_ceo() RETURNS BOOLEAN AS $$
  SELECT auth.user_role() = 'ceo';
$$ LANGUAGE sql STABLE;

-- tenants
CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT USING (id = auth.tenant_id() OR auth.is_ceo());
CREATE POLICY "tenants_update_ceo" ON tenants
  FOR UPDATE USING (auth.is_ceo());
CREATE POLICY "tenants_update_owner" ON tenants
  FOR UPDATE USING (id = auth.tenant_id() AND auth.user_role() IN ('owner'));

-- users
CREATE POLICY "users_select_own_tenant" ON users
  FOR SELECT USING (tenant_id = auth.tenant_id() OR auth.is_ceo() OR id = auth.uid());
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = auth.uid());

-- agents
CREATE POLICY "agents_select_own_tenant" ON agents
  FOR SELECT USING (tenant_id = auth.tenant_id() OR auth.is_ceo());
CREATE POLICY "agents_insert_owner" ON agents
  FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.user_role() = 'owner');
CREATE POLICY "agents_update_owner" ON agents
  FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.user_role() = 'owner');
CREATE POLICY "agents_delete_owner" ON agents
  FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.user_role() = 'owner');

-- leads
CREATE POLICY "leads_select_own_tenant" ON leads
  FOR SELECT USING (tenant_id = auth.tenant_id() OR auth.is_ceo());
CREATE POLICY "leads_insert_service_role" ON leads
  FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "leads_update_own_tenant" ON leads
  FOR UPDATE USING (tenant_id = auth.tenant_id());

-- calls
CREATE POLICY "calls_select_own_tenant" ON calls
  FOR SELECT USING (tenant_id = auth.tenant_id() OR auth.is_ceo());
CREATE POLICY "calls_insert_own_tenant" ON calls
  FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "calls_update_own_tenant" ON calls
  FOR UPDATE USING (tenant_id = auth.tenant_id());

-- appointments
CREATE POLICY "appointments_select_own_tenant" ON appointments
  FOR SELECT USING (tenant_id = auth.tenant_id() OR auth.is_ceo());
CREATE POLICY "appointments_insert_own_tenant" ON appointments
  FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "appointments_update_own_tenant" ON appointments
  FOR UPDATE USING (tenant_id = auth.tenant_id());

-- campaigns
CREATE POLICY "campaigns_select_own_tenant" ON campaigns
  FOR SELECT USING (tenant_id = auth.tenant_id() OR auth.is_ceo());
CREATE POLICY "campaigns_insert_own_tenant" ON campaigns
  FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "campaigns_update_own_tenant" ON campaigns
  FOR UPDATE USING (tenant_id = auth.tenant_id());

-- ad_metrics
CREATE POLICY "ad_metrics_select_own_tenant" ON ad_metrics
  FOR SELECT USING (tenant_id = auth.tenant_id() OR auth.is_ceo());

-- metrics
CREATE POLICY "metrics_select_own_tenant" ON metrics
  FOR SELECT USING (tenant_id = auth.tenant_id() OR auth.is_ceo());

-- reports
CREATE POLICY "reports_select_own_tenant" ON reports
  FOR SELECT USING (tenant_id = auth.tenant_id() OR auth.is_ceo());

-- agent_logs (CEO only)
CREATE POLICY "agent_logs_ceo_only" ON agent_logs
  FOR SELECT USING (auth.is_ceo());

-- alerts
CREATE POLICY "alerts_select_ceo" ON alerts
  FOR SELECT USING (auth.is_ceo());
CREATE POLICY "alerts_update_ceo" ON alerts
  FOR UPDATE USING (auth.is_ceo());

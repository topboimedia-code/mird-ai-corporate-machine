-- =============================================================================
-- MIGRATION: 0007_metrics_rollup.sql
-- F04 — upsert_daily_metrics RPC function
-- Called by n8n after every lead/appointment upsert + daily scheduled job.
-- =============================================================================

CREATE OR REPLACE FUNCTION upsert_daily_metrics(
  p_tenant_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS void AS $$
DECLARE
  v_leads_total       INTEGER;
  v_leads_new         INTEGER;
  v_appointments_set  INTEGER;
  v_appointments_held INTEGER;
  v_calls_total       INTEGER;
  v_calls_connected   INTEGER;
  v_close_rate        NUMERIC;
BEGIN
  -- Leads created on this date
  SELECT COUNT(*) INTO v_leads_total
    FROM leads
   WHERE tenant_id = p_tenant_id
     AND DATE(created_at) = p_date;

  SELECT COUNT(*) INTO v_leads_new
    FROM leads
   WHERE tenant_id = p_tenant_id
     AND DATE(created_at) = p_date
     AND stage = 'new';

  -- Appointments created on this date
  SELECT COUNT(*) INTO v_appointments_set
    FROM appointments
   WHERE tenant_id = p_tenant_id
     AND DATE(created_at) = p_date;

  -- Appointments held on this date
  SELECT COUNT(*) INTO v_appointments_held
    FROM appointments
   WHERE tenant_id = p_tenant_id
     AND status = 'held'
     AND DATE(held_at) = p_date;

  -- Calls initiated on this date
  SELECT COUNT(*) INTO v_calls_total
    FROM calls
   WHERE tenant_id = p_tenant_id
     AND DATE(initiated_at) = p_date;

  SELECT COUNT(*) INTO v_calls_connected
    FROM calls
   WHERE tenant_id = p_tenant_id
     AND DATE(initiated_at) = p_date
     AND status = 'completed';

  -- All-time close rate (closed_won / (closed_won + closed_lost))
  SELECT
    CASE
      WHEN (COUNT(*) FILTER (WHERE stage IN ('closed_won', 'closed_lost'))) = 0 THEN NULL
      ELSE COUNT(*) FILTER (WHERE stage = 'closed_won')::NUMERIC /
           COUNT(*) FILTER (WHERE stage IN ('closed_won', 'closed_lost'))
    END
    INTO v_close_rate
    FROM leads
   WHERE tenant_id = p_tenant_id;

  INSERT INTO metrics (
    tenant_id, date,
    leads_total, leads_new,
    appointments_set, appointments_held,
    calls_total, calls_connected,
    close_rate
  ) VALUES (
    p_tenant_id, p_date,
    v_leads_total, v_leads_new,
    v_appointments_set, v_appointments_held,
    v_calls_total, v_calls_connected,
    v_close_rate
  )
  ON CONFLICT (tenant_id, date) DO UPDATE SET
    leads_total       = EXCLUDED.leads_total,
    leads_new         = EXCLUDED.leads_new,
    appointments_set  = EXCLUDED.appointments_set,
    appointments_held = EXCLUDED.appointments_held,
    calls_total       = EXCLUDED.calls_total,
    calls_connected   = EXCLUDED.calls_connected,
    close_rate        = EXCLUDED.close_rate,
    updated_at        = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION upsert_daily_metrics TO service_role;

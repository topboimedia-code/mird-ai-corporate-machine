-- =============================================================================
-- MIGRATION: 0006_realtime.sql
-- F04 — Enable Realtime for sync_errors (CEO alert feed)
-- Note: metrics and alerts were added in 0001_initial_schema.sql
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE sync_errors;

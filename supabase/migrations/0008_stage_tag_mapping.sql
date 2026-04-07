-- =============================================================================
-- MIGRATION: 0008_stage_tag_mapping.sql
-- F04 OQ-04 — Add stage_tag_mapping JSONB column to tenants
-- n8n reads this during the GHL → Supabase sync to map contact tags to stages.
-- F11 (Settings) will add the UI to edit this per tenant.
-- =============================================================================

ALTER TABLE tenants
  ADD COLUMN stage_tag_mapping JSONB NOT NULL DEFAULT '{
    "appointment-set":   "appointment_set",
    "appointment-held":  "appointment_held",
    "qualified":         "qualified",
    "contacted":         "contacted",
    "under-contract":    "under_contract",
    "closed-won":        "closed_won",
    "closed-lost":       "closed_lost"
  }'::jsonb;

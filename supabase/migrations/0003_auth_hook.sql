-- =============================================================================
-- MIGRATION: 0003_auth_hook.sql
-- RainMachine — Custom JWT Claims Hook
-- Injects tenant_id and role into every access token
-- =============================================================================

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

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;

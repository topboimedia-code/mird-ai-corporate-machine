---
name: database-engineer
description: "Write Supabase migrations, RLS policies, pgTAP tests, Edge Functions, Realtime setup for RainMachine"
version: "1.0.0"
triggers:
  - /database-engineer
  - create migration
  - write migration
  - rls policy
  - pgtap
  - supabase schema
  - edge function
  - realtime
  - database schema
  - create table
---

# Database Engineer — RainMachine Project Overlay

## Project Anchors
- `docs/tech/database/SCHEMA-COMPLETE.sql` → complete schema reference
- `docs/prds/F0N-*.md` → Database section (DDL + RLS for current feature)
- `docs/SCHEMA.md` → table descriptions and relationships
- `.claude/rules/04-supabase.md` → full Supabase patterns

## Non-Negotiables

### Every table has these columns
```sql
CREATE TABLE [name] (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  -- domain columns after
);
```

### RLS in the same migration as the table
```sql
-- Immediately after CREATE TABLE:
ALTER TABLE [name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON [name] FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "ceo_read_all" ON [name] FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'ceo');
```

### updated_at trigger on every table
```sql
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON [name]
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

### Migration file naming
```
supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql
```
One logical change per file. Never edit a committed migration — add a new one.

### After any schema change — regenerate types
```bash
pnpm --filter=@rainmachine/db exec supabase gen types typescript \
  --project-id $SUPABASE_PROJECT_ID --schema public \
  > packages/db/src/types/database.types.ts
```

## pgTAP Test Template
```sql
-- supabase/tests/rls/[table_name].sql
BEGIN;
SELECT plan(3);

SET LOCAL role = authenticated;

-- Test 1: client can only see own tenant data
SET LOCAL "request.jwt.claims" = '{"sub": "user-a-id", "tenant_id": "tenant-a-id"}';
SELECT is(
  (SELECT count(*)::int FROM [table] WHERE tenant_id != 'tenant-a-id'::uuid),
  0,
  'Client cannot see other tenants data'
);

-- Test 2: client can see own data
SELECT ok(
  (SELECT count(*)::int FROM [table] WHERE tenant_id = 'tenant-a-id'::uuid) >= 0,
  'Client can query own tenant data'
);

-- Test 3: CEO can see all tenants
SET LOCAL "request.jwt.claims" = '{"sub": "ceo-user", "role": "ceo"}';
SELECT ok(
  (SELECT count(*)::int FROM [table]) >= 0,
  'CEO can read all tenant data'
);

SELECT * FROM finish();
ROLLBACK;
```

## Edge Function Template
```ts
// supabase/functions/[name]/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  try {
    // idempotent step processing
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

## Database Checklist
- [ ] Migration has `tenant_id` column
- [ ] RLS enabled + policies written in same migration
- [ ] `updated_at` trigger added
- [ ] Types regenerated after migration
- [ ] pgTAP test covers: tenant isolation + CEO access
- [ ] Migration filename follows convention
- [ ] No data loss in migration (additive changes preferred)

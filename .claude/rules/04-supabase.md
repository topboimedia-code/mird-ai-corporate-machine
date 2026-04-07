# Rule: Supabase
# Loads when: database schema, queries, RLS policies, Edge Functions, Realtime, Auth, Vault

## Client Factory — Always Use These

```ts
// packages/db/src/server.ts
import { createServerClient as _createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createServerClient() {
  const cookieStore = await cookies()
  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
}

// For admin operations (service role — server only, never client)
export function createAdminClient() {
  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [] } }
  )
}
```

**Rules:**
- `createServerClient()` → user-scoped, respects RLS. Use for all data fetching in RSC + server actions.
- `createAdminClient()` → bypasses RLS. Only in Edge Functions and admin provisioning flows. Never in user-facing server actions.
- Never use the Supabase client in `'use client'` components for mutations — use server actions instead.

## Multi-Tenancy RLS Pattern

Every table has `tenant_id UUID NOT NULL REFERENCES tenants(id)`.

```sql
-- Standard RLS for all client-facing tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON leads
  FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- CEO can read all tenants
CREATE POLICY "ceo_read_all" ON leads
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role') = 'ceo'
  );
```

**Never** add application-level tenant filtering as a substitute for RLS. RLS is the guarantee.

## Schema Conventions

```sql
-- All tables follow this pattern:
CREATE TABLE leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- domain columns...
);

-- Always add this trigger for updated_at:
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

## Type Generation

After any schema change:
```bash
pnpm --filter=@rainmachine/db exec supabase gen types typescript \
  --project-id $SUPABASE_PROJECT_ID \
  --schema public > src/types/database.types.ts
```

Types live at `packages/db/src/types/database.types.ts`. Import as:
```ts
import type { Database } from '@rainmachine/db'
import type { Tables } from '@rainmachine/db'
type Lead = Tables<'leads'>
```

## Realtime Pattern

```ts
// Client component subscribing to metrics updates
'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export function useRealtimeMetrics(tenantId: string) {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const channel = supabase
      .channel(`metrics:${tenantId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'metrics',
        filter: `tenant_id=eq.${tenantId}`,
      }, (payload) => setMetrics(payload.new as Metrics))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tenantId])

  return metrics
}
```

**Rules:**
- Channel name pattern: `{table}:{tenant_id}` — always scope to tenant
- Clean up channels on unmount (the return function)
- Only subscribe to tables that have Realtime enabled in Supabase dashboard

## Edge Functions

```ts
// supabase/functions/process-onboarding-job/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const body = await req.json()
    // ... idempotent step processing
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

**Rules:**
- Edge Functions use Deno runtime — no Node.js APIs
- Use service role key (never anon key) in Edge Functions
- Always return JSON with `Content-Type: application/json`
- Idempotency: check completion status before executing each step

## Supabase Vault (Encrypted Secrets)

```ts
// Storing OAuth token
const { data } = await supabase.rpc('vault.create_secret', {
  secret: accessToken,
  name: `meta_token_${tenantId}`,
})

// Retrieving OAuth token
const { data } = await supabase.rpc('vault.decrypted_secret', {
  secret_name: `meta_token_${tenantId}`,
})
```

Use Vault for: OAuth access tokens (Meta, Google), GHL API keys, any per-tenant credential.

## Migration Conventions

```
supabase/migrations/
├── 20260406000001_create_tenants.sql
├── 20260406000002_create_users.sql
├── 20260406000003_create_leads.sql
└── ...
```

- One logical change per migration file
- Filename: `YYYYMMDDHHMMSS_description.sql`
- Never edit committed migrations — add a new one
- Include RLS policies in the same migration as the table

## Auth Patterns

```ts
// CEO 2FA enforcement
const { data: { session } } = await supabase.auth.getSession()
if (session?.user.factors?.length === 0) {
  redirect('/login/verify') // force TOTP enrollment
}

// Custom JWT claims (set via Supabase Auth hook)
// auth.jwt() ->> 'role'      → 'ceo' | 'owner' | 'agent'
// auth.jwt() ->> 'tenant_id' → UUID string
```

## pgTAP Tests

All RLS policies must have pgTAP coverage:
```sql
-- supabase/tests/rls_leads.sql
BEGIN;
SELECT plan(3);

-- Test 1: client can only see own tenant's leads
SET LOCAL role = authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "user-a-id", "role": "owner"}';
SELECT is(
  (SELECT count(*) FROM leads WHERE tenant_id != 'tenant-a-id'),
  0::bigint,
  'Client cannot see other tenants leads'
);

ROLLBACK;
```

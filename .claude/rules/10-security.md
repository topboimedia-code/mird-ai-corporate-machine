# Rule: Security
# Loads when: auth, RLS policies, OAuth, secrets, OWASP concerns, JWT, rate limiting

## OWASP Top 10 Checklist (Run Mentally for Every Feature)

| # | Threat | Mitigation in RainMachine |
|---|--------|--------------------------|
| A01 | Broken Access Control | RLS enforces tenant isolation at DB level — not application code |
| A02 | Cryptographic Failures | OAuth tokens in Supabase Vault (AES-256). HTTPS only. No PII in logs. |
| A03 | Injection | Supabase client uses parameterized queries only. Never string-interpolate SQL. |
| A04 | Insecure Design | Multi-tenancy by design. CEO role separate from client role. |
| A05 | Security Misconfiguration | `@t3-oss/env-nextjs` fails build if secrets missing. No default credentials. |
| A06 | Vulnerable Components | `pnpm audit` in CI. Dependabot alerts enabled. |
| A07 | Auth Failures | 5-attempt lockout (Supabase Auth). TOTP 2FA for CEO. 30-min session expiry. |
| A08 | Data Integrity Failures | Stripe webhook signature verification. Webhook payload Zod validation. |
| A09 | Logging Failures | `agent_logs` + `sync_errors` tables. Sentry for server errors. No secrets in logs. |
| A10 | SSRF | No user-controlled URLs in server-side fetch. External API URLs are env vars. |

---

## Multi-Tenancy Security Rules

```sql
-- Rule 1: Every table has tenant_id
-- Rule 2: RLS is ALWAYS enabled on every table
-- Rule 3: Default deny — no SELECT unless policy explicitly allows it

-- WRONG: forgetting to enable RLS
CREATE TABLE reports (...);  -- RLS not enabled = global read access

-- CORRECT:
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ...
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_read" ON reports FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
```

**Never filter by tenant in application code as a substitute for RLS.** Application-level filtering can be bypassed. RLS cannot be bypassed via the client.

---

## Secrets Management

```ts
// ✅ correct — env var + @t3-oss/env-nextjs validation
const apiKey = env.ANTHROPIC_API_KEY

// ❌ wrong — hardcoded
const apiKey = 'sk-ant-...'

// ❌ wrong — using service role key in client component
'use client'
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY) // exposed!
```

**Server-only secrets never touch the client bundle:**
- `SUPABASE_SERVICE_ROLE_KEY` — server actions + Edge Functions only
- `ANTHROPIC_API_KEY` — Edge Functions only
- `RETELL_API_KEY` — n8n + Edge Functions only
- `GHL_API_KEY` — n8n + Edge Functions only
- `STRIPE_SECRET_KEY` — webhook handler + Edge Functions only

---

## Authentication Patterns

### Session Validation in Middleware
```ts
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const isAuthRoute = req.nextUrl.pathname.startsWith('/login')
  const isPublic = req.nextUrl.pathname.startsWith('/api/webhooks')

  if (!session && !isAuthRoute && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Session expiry — 30 min inactivity (Supabase Auth handles token refresh)
  return res
}
```

### CEO 2FA (TOTP)
```ts
// After password login, check TOTP factor
const { data: { user } } = await supabase.auth.getUser()
const factors = await supabase.auth.mfa.listFactors()
const totpFactor = factors.data?.totp?.[0]

if (!totpFactor || totpFactor.status !== 'verified') {
  redirect('/login/verify') // force enrollment
}
```

### Custom JWT Claims
Set via Supabase Auth hook (Database Webhook):
```sql
-- Supabase Auth Hook: Customize Access Token
CREATE OR REPLACE FUNCTION auth.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  user_role text;
  user_tenant_id uuid;
BEGIN
  SELECT role, tenant_id INTO user_role, user_tenant_id
  FROM public.users WHERE id = (event->>'user_id')::uuid;

  RETURN jsonb_set(
    jsonb_set(event, '{claims,role}', to_jsonb(user_role)),
    '{claims,tenant_id}', to_jsonb(user_tenant_id::text)
  );
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## Input Validation & Injection Prevention

```ts
// Server action — always Zod before DB
export async function importAgentsFromCSV(rows: unknown[]): Promise<Result<ImportResult>> {
  const AgentRowSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    role: z.enum(['owner', 'agent']),
  })

  const results = rows.map((row, i) => {
    const parsed = AgentRowSchema.safeParse(row)
    if (!parsed.success) return { row: i, error: parsed.error.message }
    return { row: i, data: parsed.data }
  })

  // Partial success — valid rows inserted, invalid rows reported
  const valid = results.filter(r => 'data' in r)
  const invalid = results.filter(r => 'error' in r)

  // Insert valid rows
  if (valid.length > 0) {
    await supabase.from('agents').insert(valid.map(r => r.data))
  }

  return ok({ inserted: valid.length, failed: invalid })
}
```

**Never use string interpolation in DB queries:**
```ts
// ❌ SQL injection risk
const { data } = await supabase.rpc('raw_query', {
  sql: `SELECT * FROM leads WHERE name = '${userInput}'`
})

// ✅ parameterized via Supabase client
const { data } = await supabase
  .from('leads')
  .select('*')
  .eq('name', userInput)  // safe — Supabase uses prepared statements
```

---

## Rate Limiting

```ts
// Using Upstash Redis for rate limiting
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '7d'), // 10 per week for report chat
})

export async function submitReportQuery(reportId: string, query: string) {
  const { success, remaining } = await ratelimit.limit(`report-chat:${tenantId}`)
  if (!success) {
    return err(`Weekly query limit reached. ${remaining} remaining. Resets Monday.`)
  }
  // proceed with Claude call
}
```

Rate limits:
- Report chat queries: 10/week per tenant
- Campaign sync trigger: 1 per 15 minutes per tenant
- Onboarding token: single-use (invalidated after Step 1)

---

## OAuth Security

```ts
// OAuth popup pattern — use postMessage, not redirect with tokens in URL
// apps/dashboard/app/api/oauth/[provider]/callback/route.ts
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  // Verify state to prevent CSRF
  const storedState = await redis.get(`oauth_state:${state}`)
  if (!storedState) return new Response('Invalid state', { status: 403 })

  // Exchange code for token
  const tokens = await exchangeCodeForTokens(code!)

  // Store encrypted in Vault — never in URL or cookie
  await vaultStore(`meta_token_${tenantId}`, tokens.access_token)

  // Close popup and notify parent via postMessage
  return new Response(
    `<script>window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider: 'meta' }, '*'); window.close();</script>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
```

---

## Webhook Security

```ts
// Verify all incoming webhooks before processing
// Retell AI — verify via shared secret header
export async function POST(req: Request) {
  const authHeader = req.headers.get('x-retell-signature')
  const expectedSig = crypto
    .createHmac('sha256', process.env.RETELL_WEBHOOK_SECRET!)
    .update(await req.text())
    .digest('hex')

  if (authHeader !== expectedSig) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // process...
}
```

All webhook handlers must verify authenticity before processing payload.

---

## Logging Rules

```ts
// ✅ safe logging
console.log(`Lead ${leadId} stage updated to ${newStage}`)

// ❌ never log
console.log(`User ${email} authenticated with password ${password}`)
console.log(`API key: ${apiKey}`)
console.log(`Token: ${accessToken}`)
console.log(JSON.stringify(supabaseClient)) // may contain keys
```

PII that must never appear in logs: email (truncate to domain), phone, name, address, API keys, tokens, passwords.

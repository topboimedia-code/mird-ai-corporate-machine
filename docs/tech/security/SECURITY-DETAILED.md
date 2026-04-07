# MIRD AI Corporate Machine — Security Architecture (Detailed)
## Step 8 | Date: 2026-03-31

Comprehensive security specification covering authentication, authorization,
data protection, OWASP Top 10, secret management, and compliance posture.

---

## Table of Contents

1. [Threat Model](#1-threat-model)
2. [Authentication Architecture](#2-authentication-architecture)
3. [Authorization — RBAC Matrix](#3-authorization--rbac-matrix)
4. [Data Security](#4-data-security)
5. [Secret Management](#5-secret-management)
6. [OWASP API Security Top 10 Mitigations](#6-owasp-api-security-top-10-mitigations)
7. [Webhook Security](#7-webhook-security)
8. [Onboarding Portal Security](#8-onboarding-portal-security)
9. [Ad Account Token Security](#9-ad-account-token-security)
10. [Claude Agent Security](#10-claude-agent-security)
11. [Security Headers](#11-security-headers)
12. [Compliance Posture](#12-compliance-posture)
13. [Incident Response](#13-incident-response)
14. [Security Testing](#14-security-testing)

---

## 1. Threat Model

### Assets to Protect (by sensitivity)

| Asset | Sensitivity | Why It Matters |
|-------|------------|----------------|
| Client OAuth tokens (Meta/Google) | **CRITICAL** | Full ad account access — could spend client budget |
| GHL API credentials | **CRITICAL** | Full CRM access — contacts, pipelines, automations |
| Lead PII (name, phone, email) | **HIGH** | Client data, regulatory exposure |
| CEO Dashboard data | **HIGH** | Competitive business intelligence |
| Subscription / MRR data | **HIGH** | Financial data |
| Onboarding tokens | **HIGH** | Single-use access for unauthenticated users |
| AI call transcripts | **MEDIUM** | PII in conversation form |
| Campaign performance metrics | **MEDIUM** | Client business data |
| Claude agent outputs / reports | **MEDIUM** | MIRD business intelligence |

### Primary Threat Actors

| Threat Actor | Attack Vectors | Motivation |
|-------------|----------------|-----------|
| **Unauthenticated external attacker** | Brute force login, token enumeration, webhook replay | Data exfiltration, account takeover |
| **Malicious client user** | Privilege escalation, cross-tenant data access | Competitor intel, free plan abuse |
| **Compromised third-party service** | GHL or Retell account compromise → webhook injection | False data injection |
| **Supply chain attack** | Malicious npm package | Code execution, data theft |
| **Insider threat** | Compromised Supabase service_role key | Full DB access |

### Security Perimeter

```
[Internet]
    │
    ├─ [Vercel Edge] ─── Next.js Middleware (session check, rate limit)
    │       │
    │       └─ [Next.js Server] ─── Server Actions (Zod validation, auth check, org scope)
    │               │
    │               └─ [Supabase] ─── RLS (organization_id isolation, role check)
    │                       │
    │                       └─ [PostgreSQL] ─── Data at rest (AES-256)
    │
    ├─ [Supabase Edge Functions] ─── HMAC verification → DB write (service_role, explicit WHERE)
    │
    └─ [n8n Internal] ─── service_role calls only → provision-org Edge Function
```

---

## 2. Authentication Architecture

### 2.1 RainMachine Dashboard — Email/Password Auth

**Provider:** Supabase Auth (built on GoTrue)
**Method:** Email + password → JWT session
**Token storage:** HttpOnly Secure cookie via `@supabase/ssr` cookie handler
**Session duration:** 1 hour access token + 7-day refresh token (auto-renewed)
**Token storage location:** Cookie only — never `localStorage`, never `sessionStorage`

```typescript
// apps/dashboard/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get:    (name) => cookieStore.get(name)?.value,
        set:    (name, value, options) => cookieStore.set({ name, value, ...options }),
        remove: (name, options) => cookieStore.set({ name, value: '', ...options }),
      },
    }
  )
}
```

**Session validation pattern (Next.js middleware):**

```typescript
// apps/dashboard/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  const supabase = createServerClient(/* ... */)

  // Refresh session — critical for keeping auth alive
  const { data: { session } } = await supabase.auth.getSession()

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                           request.nextUrl.pathname.startsWith('/leads') ||
                           request.nextUrl.pathname.startsWith('/campaigns')

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login?reason=session_expired', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|forgot-password|reset-password).*)'],
}
```

### 2.2 CEO Dashboard — Email/Password + TOTP 2FA

**Provider:** Supabase Auth MFA (TOTP — Time-based One-Time Password)
**2FA enforcement:** Required for ALL users of the CEO dashboard (the only user is Shomari)
**TOTP secret storage:** Supabase Auth internal (encrypted at rest, not accessible via API)
**Authenticator apps:** Google Authenticator, Authy, 1Password

**MFA enrollment flow (one-time setup):**
1. CEO logs in with email/password → partial session issued
2. Supabase Auth returns `aal1` (assurance level 1 — password only)
3. `ceoVerifyMFAAction` calls `supabase.auth.mfa.challengeAndVerify()`
4. Full session issued → `aal2` assurance level

**Session invalidation:** Any `aal1` session attempting to access CEO routes is rejected by middleware with redirect to 2FA screen.

```typescript
// CEO middleware — enforces aal2
const { data: { session } } = await supabase.auth.getSession()
const assuranceLevel = session?.user?.factors?.find(f => f.status === 'verified') ? 'aal2' : 'aal1'

if (isProtectedRoute && assuranceLevel !== 'aal2') {
  return NextResponse.redirect(new URL('/login/verify', request.url))
}
```

### 2.3 Onboarding Portal — Token-Based Access (No Login)

**No user account required.** Access is via a single-use UUID token in the URL.

**Token lifecycle:**
- Generated by MIRD admin during client intake → stored in `onboarding_sessions.token`
- Sent to client via email as `https://setup.makeitrain.digital/?token={uuid}`
- Valid for 30 days from creation
- Used status is tracked — completed sessions cannot be restarted via token
- Token is a UUIDv4 — 122 bits of entropy — not guessable

**Validation server action:**
```typescript
export async function validateTokenAction(
  token: string
): Promise<Result<ValidateTokenOutput, AppError>> {
  // Rate limit: 10 attempts per IP per hour (Upstash Redis)
  const limited = await rateLimiter.check(request, 'onboarding-token')
  if (!limited.ok) return Result.err({ code: 'RATE_LIMITED', message: 'Too many attempts.' })

  // Supabase anon client — RLS policy allows SELECT on valid, non-expired tokens
  const { data, error } = await supabase
    .from('onboarding_sessions')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .not('status', 'in', '("EXPIRED","FAILED","COMPLETE")')
    .single()

  if (error || !data) {
    return Result.err({ code: 'INVALID_TOKEN', message: 'This setup link is invalid or has expired.' })
  }

  return Result.ok({ session: mapSessionRow(data), resumeStep: data.current_step })
}
```

**Token security properties:**
- No brute-force risk — UUIDv4 has 2^122 possible values
- Rate-limited at 10 req/hour per IP as additional protection
- All wizard state writes go through Edge Functions with service_role (not anon key)
- Token never appears in JS bundles, query results beyond session ID, or logs

---

## 3. Authorization — RBAC Matrix

### Role Definitions

| Role | Who | Scope |
|------|-----|-------|
| `mird_admin` | Shomari only | All organizations — read/write everything |
| `owner` | Primary client contact (e.g., Marcus) | Their org only — full CRUD |
| `manager` | Team lead within client org | Their org — manage agents + leads, no billing |
| `agent` | Individual sales rep | Their org — read leads, update call notes |

### Permission Matrix

| Resource | mird_admin | owner | manager | agent |
|----------|-----------|-------|---------|-------|
| All organizations (read) | ✅ | ❌ | ❌ | ❌ |
| Own organization (read) | ✅ | ✅ | ✅ | ✅ |
| Own organization (update) | ✅ | ✅ | ❌ | ❌ |
| Leads (read) | ✅ | ✅ | ✅ | ✅ |
| Leads (update stage/notes) | ✅ | ✅ | ✅ | ✅ |
| Leads (assign) | ✅ | ✅ | ✅ | ❌ |
| Agents (read) | ✅ | ✅ | ✅ | ✅ |
| Agents (create/update) | ✅ | ✅ | ✅ | ❌ |
| Agents (delete) | ✅ | ✅ | ❌ | ❌ |
| Campaigns (read) | ✅ | ✅ | ✅ | ✅ |
| Campaigns (sync) | ✅ | ✅ | ❌ | ❌ |
| Reports (read) | ✅ | ✅ | ✅ | ❌ |
| Subscriptions (read) | ✅ | ✅ | ❌ | ❌ |
| Ad accounts (read) | ✅ | ✅ | ❌ | ❌ |
| Ad accounts (connect) | ✅ | ✅ | ❌ | ❌ |
| GHL settings | ✅ | ✅ | ❌ | ❌ |
| Agent performance logs | ✅ | ❌ | ❌ | ❌ |
| All-org CEO view | ✅ | ❌ | ❌ | ❌ |

### Authorization Implementation — Belt + Suspenders

Authorization is enforced at **two independent layers**. Either layer failing alone still protects the data.

**Layer 1 — RLS (database):**
```sql
-- Example: leads table
CREATE POLICY "leads: select own org"
  ON leads FOR SELECT
  USING (organization_id = auth_org_id() OR is_mird_admin());
```

**Layer 2 — Server action explicit check:**
```typescript
export async function getLeadsAction(filter: LeadFilter) {
  const session = await requireAuth()         // throws → Result.err if no session
  const orgId = session.organizationId        // comes from validated JWT

  // Explicit WHERE even though RLS would catch it — defense in depth
  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('organization_id', orgId)             // belt
    .eq('deleted_at', null)                   // ...and suspenders
    // RLS policy is the fallback if this is somehow bypassed
}
```

---

## 4. Data Security

### 4.1 Encryption at Rest

| Data | Encryption | Provider |
|------|-----------|---------|
| All database tables | AES-256 (transparent disk encryption) | Supabase (managed) |
| Supabase Storage files | AES-256 | Supabase Storage |
| Vault secrets (API tokens) | AES-256-GCM with KMS-managed keys | Supabase Vault |
| Vercel environment variables | AES-256 at rest | Vercel |

### 4.2 Encryption in Transit

- **All HTTP traffic:** TLS 1.2 minimum, TLS 1.3 preferred — enforced by Vercel and Supabase
- **HSTS:** `Strict-Transport-Security: max-age=31536000; includeSubDomains` on all 3 apps
- **Certificate management:** Automatic via Vercel (Let's Encrypt) for custom domains

### 4.3 PII Handling

PII in the MIRD system: lead names, phone numbers, email addresses, call transcripts, AI call summaries.

| PII Field | Location | Access Control | Retention |
|-----------|----------|---------------|-----------|
| Lead name/email/phone | `leads` table | RLS — org-scoped | Indefinite (client owns) |
| Call transcripts | `ai_calls.transcript` | RLS — org-scoped | 12 months then NULL'd |
| Call recordings | Retell AI storage + URL in DB | URL only in DB — Retell controls file | Per Retell policy |
| Onboarding contact info | `onboarding_sessions` | Service role only after completion | 90 days post-completion |

**Transcript retention job** (monthly cron):
```sql
UPDATE ai_calls
SET transcript = NULL, recording_url = NULL
WHERE created_at < NOW() - INTERVAL '12 months'
  AND transcript IS NOT NULL;
```

---

## 5. Secret Management

### 5.1 Secret Classification

| Secret | Classification | Storage | Access |
|--------|---------------|---------|--------|
| Supabase `anon` key | Public-safe | Vercel env (NEXT_PUBLIC_*) | Client + server |
| Supabase `service_role` key | **CRITICAL** | Vercel env (server-only) | Edge Functions + server only |
| Anthropic API key | **HIGH** | Vercel env (server-only) | AI agent runner only |
| Meta System User token (per client) | **CRITICAL** | Supabase Vault | Edge Functions only |
| Google OAuth refresh token (per client) | **CRITICAL** | Supabase Vault | Edge Functions only |
| GHL API key (per client) | **CRITICAL** | Supabase Vault | Edge Functions only |
| GHL webhook secret (per client) | **HIGH** | Supabase Vault | ghl-webhook Edge Function |
| Retell API key | **HIGH** | Vercel env (server-only) | n8n + Edge Functions |
| Upstash Redis URL + token | **MEDIUM** | Vercel env (server-only) | Rate limiter middleware |
| Sentry DSN (per app) | Low | Vercel env (NEXT_PUBLIC_*) | Client-safe |

### 5.2 Supabase Vault Pattern (Per-Client Secrets)

Ad account tokens and GHL credentials are stored in **Supabase Vault**, not the database.

```typescript
// supabase/functions/_shared/vault.ts

/**
 * Store a secret in Supabase Vault — returns the vault_secret_id (UUID reference)
 * Called during onboarding or reconnection flows
 */
export async function storeSecret(
  adminClient: SupabaseClient,
  name: string,
  secret: string
): Promise<string> {
  const { data, error } = await adminClient.rpc('vault.create_secret', {
    secret,
    name,
    description: `MIRD managed secret: ${name}`,
  })
  if (error) throw new Error(`Vault store failed: ${error.message}`)
  return data as string  // vault_secret_id UUID
}

/**
 * Read a secret from Vault — called only in Edge Functions
 * The vault_secret_id comes from ad_accounts.access_token_ref (a UUID, not the token)
 */
export async function readSecret(
  adminClient: SupabaseClient,
  vaultSecretId: string
): Promise<string> {
  const { data, error } = await adminClient
    .from('vault.decrypted_secrets')
    .select('decrypted_secret')
    .eq('id', vaultSecretId)
    .single()
  if (error || !data) throw new Error(`Vault read failed: ${error?.message}`)
  return data.decrypted_secret
}
```

**What goes in the DB vs Vault:**

```
ad_accounts table:
  access_token_ref  = "a1b2c3d4-..."  ← UUID reference (safe to store)
  refresh_token_ref = "e5f6g7h8-..."  ← UUID reference (safe to store)

Supabase Vault:
  id: "a1b2c3d4-..."  → decrypted_secret: "EAABx..." ← Meta access token (AES-256-GCM)
  id: "e5f6g7h8-..."  → decrypted_secret: "1//0d..." ← Google refresh token
```

### 5.3 Environment Variable Rules

```bash
# ✅ NEXT_PUBLIC_ prefix = safe for client bundle
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # anon key — public by design

# ✅ No prefix = server-only (never in client bundle)
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # NEVER expose to client
ANTHROPIC_API_KEY=sk-ant-...           # NEVER expose to client
RETELL_API_KEY=re_...                  # NEVER expose to client
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=AX...
GHL_WEBHOOK_VALIDATION_KEY=...         # For validating incoming GHL webhooks

# ❌ NEVER do this:
NEXT_PUBLIC_ANTHROPIC_API_KEY=...      # Would expose key in browser bundle
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE=...  # Full DB bypass — catastrophic
```

**Vercel environment variable scoping:**
- All server-only keys: `Environment: Production, Preview, Development` — NOT exposed to browser
- Audited quarterly — rotate immediately on any suspected compromise

---

## 6. OWASP API Security Top 10 Mitigations

### API1: Broken Object Level Authorization (BOLA)
**Risk:** User accesses another org's lead by guessing `leadId`.
**Mitigation:**
- RLS policy: `USING (organization_id = auth_org_id())` — DB rejects cross-org queries at the row level
- Server actions always include `organization_id` in WHERE clause (belt + suspenders)
- Branded TypeScript types (`LeadId`, `OrganizationId`) prevent accidental ID mix-ups at compile time
- **Test:** Integration test verifies that authenticated user of Org A cannot read Org B's leads even with a valid `leadId`

### API2: Broken Authentication
**Risk:** Session tokens stolen, brute-force login, weak password policy.
**Mitigation:**
- Supabase Auth manages JWT — no custom token implementation
- HttpOnly Secure cookies — XSS cannot steal tokens
- Rate limiting: 5 login attempts / 15 min per IP (Upstash Redis)
- CEO Dashboard requires TOTP 2FA — even compromised password is insufficient
- Password minimum: 12 chars (enforced by Supabase Auth policy)
- Session invalidation on logout — `supabase.auth.signOut()` revokes refresh token server-side

### API3: Broken Object Property Level Authorization
**Risk:** Client can update fields they shouldn't (e.g., set their own `role = 'mird_admin'`).
**Mitigation:**
- Server actions use Zod schemas that **only allow expected fields** — unknown fields are stripped
- `role` field is never in any client-facing update schema
- `organization_id` is always set server-side from session — never from client input
- RLS WITH CHECK clauses validate write attempts at the DB level

```typescript
// ✅ Schema strips organization_id and role — client cannot set these
const UpdateLeadSchema = z.object({
  leadId: z.string().uuid(),
  stage:  z.enum(['NEW', 'CONTACTED', 'APPT_SET', 'CLOSED', 'LOST']),
  notes:  z.string().max(5000).optional(),
})
// organization_id is ALWAYS sourced from session.organizationId — never input
```

### API4: Unrestricted Resource Consumption
**Risk:** Expensive report generation triggered in a loop; campaign sync hammered.
**Mitigation:**
- Rate limits on all expensive actions (campaign sync: 1 per 5 min per org)
- Claude agent runs are cron-only — no on-demand trigger from client
- Pagination enforced on all list queries (max 100 rows per page)
- Supabase connection pooling (PgBouncer) prevents connection exhaustion
- AI call transcript generation is async — no sync API latency risk

### API5: Broken Function Level Authorization
**Risk:** Agent user calls CEO-only `getCommandCenterAction`.
**Mitigation:**
- CEO Dashboard is a **separate Next.js app on a separate domain** (`ceo.makeitrain.digital`) — RainMachine users don't have accounts there
- Server actions check `session.role` for role-restricted operations
- `is_mird_admin()` RLS function is the final gate for all cross-org data access

```typescript
export async function getCommandCenterAction() {
  const session = await requireAuth()
  if (session.role !== 'mird_admin') {
    return Result.err({ code: 'ACCESS_RESTRICTED', message: 'Access restricted.' })
  }
  // Only reaches here if mird_admin — RLS provides second check
}
```

### API6: Unrestricted Access to Sensitive Business Flows
**Risk:** Attacker enumerates onboarding tokens; malicious provisioning trigger.
**Mitigation:**
- Onboarding token = UUIDv4 (122 bits entropy) — enumeration is computationally infeasible
- Token rate-limited: 10 attempts per IP per hour
- `provision-org` Edge Function requires Supabase `service_role` key — not accessible externally
- Wizard state writes go through service_role in Edge Functions — anon key cannot write step data
- Completed sessions reject re-use (status check on every token validation)

### API7: Server-Side Request Forgery (SSRF)
**Risk:** User-supplied URL triggers internal network requests.
**Mitigation:**
- No user-controlled URL parameters are fetched server-side
- Google OAuth callback URL is hardcoded in Edge Function — not client-supplied
- Meta token verification calls a fixed Meta Graph API endpoint — token is validated, not used as a URL
- Supabase Storage upload accepts file bytes — not URLs
- **Allowlist:** Any future external URL fetch will use an explicit allowlist of domains

### API8: Security Misconfiguration
**Risk:** Debug endpoints exposed, overly permissive CORS, sensitive data in error responses.
**Mitigation:**
- Supabase Edge Functions return generic error messages — stack traces never in response body
- Stack traces logged to Better Stack (server-side only) — not in HTTP responses
- CORS: Supabase Edge Functions configured to only accept from `*.makeitrain.digital` origins
- No debug routes or admin panels in production builds
- `NODE_ENV=production` enforced in all Vercel deployments
- Security headers set on all 3 Next.js apps (see Section 11)

### API9: Improper Inventory Management
**Risk:** Stale/forgotten endpoints or API versions exploited.
**Mitigation:**
- No versioned API — server actions are in the same codebase as the UI (no external consumers)
- Edge Functions are the only external-facing endpoints — 4 total, all documented in OpenAPI spec
- No legacy routes — monorepo makes it easy to audit all `supabase/functions/` directories
- Quarterly audit of all Supabase Edge Functions

### API10: Unsafe Consumption of APIs
**Risk:** Trusting GHL or Retell webhook payloads without validation.
**Mitigation:**
- **GHL webhooks:** HMAC-SHA256 signature verified against stored `webhook_secret_ref` before any processing
- **Retell webhooks:** Retell-Signature header verified before processing call data
- **All webhook inputs:** Zod-validated before touching the database — unknown fields rejected
- **Retell metadata:** `lead_id` and `organization_id` from metadata are verified against DB before update — not blindly trusted

```typescript
// supabase/functions/retell-webhook/index.ts (excerpt)
const verified = await verifyRetellSignature(req, process.env.RETELL_WEBHOOK_SECRET!)
if (!verified) return new Response(JSON.stringify({ ok: false, error: { code: 'INVALID_SIGNATURE' } }), { status: 401 })

const parsed = RetellCallEndedSchema.safeParse(payload)
if (!parsed.success) return new Response(/* 400 */)

// Verify the lead_id actually belongs to the org_id in the payload
const { data: lead } = await adminClient
  .from('leads')
  .select('id, organization_id')
  .eq('id', parsed.data.call.metadata.lead_id)
  .eq('organization_id', parsed.data.call.metadata.organization_id)
  .single()

if (!lead) return new Response(/* 404 */)
// Only now trust the payload and write to DB
```

---

## 7. Webhook Security

### GHL Webhook Signature Verification

```typescript
// supabase/functions/_shared/hmac.ts
export async function verifyGHLSignature(
  body: string,
  signature: string,     // X-GHL-Signature header: "sha256={hex}"
  secret: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  const expected = 'sha256=' + Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  return expected === signature   // constant-time comparison not needed (HMAC, not password)
}
```

### Replay Attack Prevention
- GHL webhooks include a timestamp — reject any event older than 5 minutes
- Retell webhooks include `call_id` — store in DB on first receipt, reject duplicate `call_id`
- Idempotency keys on all webhook database writes (upsert with unique constraint)

---

## 8. Onboarding Portal Security

### Token Security
- UUIDv4 — 122 bits entropy — brute force infeasible
- Rate-limited: 10 attempts/hour/IP (Upstash Redis)
- Expires in 30 days — short window limits exposure
- Single-use semantics — `COMPLETE` status blocks reuse

### Wizard State Security
- All wizard writes go through **service_role Edge Functions** — never anon key
- Step data validated by Zod schema in Edge Function before DB write
- `meta_verified` and `google_verified` flags set only by Edge Functions (not by client)
- OAuth state parameter = session ID = CSRF token for Google OAuth flow
- Meta token verified against Meta API before `meta_verified = true`
- Google tokens stored in Vault immediately — never transit through Next.js server

### Abuse Prevention
- One active session per client email — duplicate token creation blocked at admin level
- Provisioning idempotent — running `provision-org` twice returns 409 (not double-provision)

---

## 9. Ad Account Token Security

### Meta System User Token

```
Onboarding Step 3 flow:
  Client inputs token in browser
         ↓
  Next.js server action (verifyMetaTokenAction)
         ↓
  Calls Meta Graph API /me — verifies token validity + gets ad accounts
         ↓
  Sends verified token to Edge Function (server → server, HTTPS)
         ↓
  Edge Function calls Supabase Vault.create_secret()
         ↓
  Stores vault_secret_id in ad_accounts.access_token_ref
         ↓
  Token is gone from Next.js memory — never written to DB
```

**Token rotation:** Meta System User tokens do not expire. Security relies on Vault encryption + org-scoped access. If compromised: revoke in Meta Business Manager + delete Vault secret + flag org for re-onboarding.

### Google OAuth Refresh Token

```
Onboarding Step 4 flow:
  Client clicks "Connect Google Ads"
         ↓
  Server action generates Google OAuth URL with state=sessionId
         ↓
  Client redirected to Google consent screen
         ↓
  Google redirects to /functions/v1/google-oauth-callback?code=...&state=sessionId
         ↓
  Edge Function verifies state = valid session ID (CSRF check)
         ↓
  Edge Function exchanges code for { access_token, refresh_token } — server-side only
         ↓
  refresh_token → Vault.create_secret() → vault_secret_id stored in ad_accounts
         ↓
  access_token used immediately for GMB search, then discarded
```

**Token rotation:** Google access tokens expire in 1 hour. Refresh tokens are long-lived. Rotation flow:
- Edge Function reads refresh_token from Vault
- Calls Google token refresh endpoint
- Stores new access_token in Vault (overwrites old)
- Google refresh tokens can be revoked in Google Console

---

## 10. Claude Agent Security

### Agent Isolation
- Claude agents run in `packages/ai-agents` — a Node.js package, not a web server
- Triggered by cron — not callable via HTTP
- No user session — runs with a dedicated `CLAUDE_AGENT_SERVICE_KEY` Supabase key
- That key has a custom RLS role: can only SELECT from analytics views, INSERT into `reports` and `agent_performance`

### Prompt Injection Mitigation
- Agent prompts are constructed in code — no user-supplied text in the system prompt
- Data context (metrics, campaign data) injected as JSON in the user message — not concatenated into instructions
- Agent output validated by Zod schema before writing to DB — unexpected structures are rejected

### Cost Control
- `max_tokens` set per agent (2048–4096) — prevents runaway token usage
- Monthly budget tracked via `agent_performance.cost_usd` sum
- Automated alert at $75/month → agent runs halt at $100/month

---

## 11. Security Headers

Applied to all 3 Next.js apps via `next.config.ts`:

```typescript
// next.config.ts (shared config base)
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',           value: 'on' },
  { key: 'Strict-Transport-Security',         value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'X-Frame-Options',                   value: 'DENY' },
  { key: 'X-Content-Type-Options',            value: 'nosniff' },
  { key: 'Referrer-Policy',                   value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',                value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",                        // Next.js requires inline scripts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://sentry.io",
      "frame-ancestors 'none'",
    ].join('; ')
  },
]
```

---

## 12. Compliance Posture

### Data Privacy

| Requirement | Status | Implementation |
|-------------|--------|---------------|
| Client data isolation | ✅ Enforced | RLS org_id scoping on every table |
| PII minimization | ✅ Enforced | Only fields needed for CRM function are collected |
| Data retention limits | ⚠️ Planned | Transcript NULL'ing after 12 months (cron job) |
| Right to deletion | ⚠️ Manual | `deleted_at` soft delete + manual Vault secret deletion |
| Data export | ⚠️ Planned | CSV export from RainMachine leads table |

### GDPR Considerations
- Client data is owned by the client (MIRD is a data processor)
- Lead PII collected via ad forms — client is responsible for consent (MIRD provides tooling)
- No cross-org data sharing
- No marketing profiling of lead PII by MIRD

### SOC 2 Relevant Controls (not formally certified, but aligned)
- Access control via RBAC + MFA (CEO dashboard)
- Audit logging via Supabase logs + Better Stack
- Change management via GitHub PRs + CI gates
- Incident response documented in Section 13

---

## 13. Incident Response

### Severity Levels

| Severity | Definition | Response Time | Escalation |
|----------|-----------|--------------|-----------|
| P0 — Critical | Active data breach, service_role key compromised | Immediate | Rotate key, alert clients, disable affected org |
| P1 — High | Cross-org data access detected, ad account token exposed | < 1 hour | Revoke tokens, audit access logs |
| P2 — Medium | Auth bypass attempt, webhook replay detected | < 4 hours | Rate limit, investigate logs |
| P3 — Low | Failed auth spike, scan detected | < 24 hours | Monitor, no immediate action |

### P0 Playbook — service_role Key Compromise

1. **Immediately:** Rotate `SUPABASE_SERVICE_ROLE_KEY` in Supabase Dashboard → Vercel env vars
2. **Within 5 min:** Redeploy all 3 Vercel apps with new key
3. **Within 15 min:** Audit Supabase logs for queries made with old key in last 24h
4. **Within 30 min:** Assess what data was accessed; determine if client notification required
5. **Within 1 hour:** Document timeline and root cause

### P1 Playbook — Ad Account Token Exposed

1. Revoke token in Meta Business Manager / Google Console immediately
2. Delete Vault secret for the affected `ad_account_id`
3. Notify affected client — request new token connection via settings
4. Audit Edge Function logs for unauthorized token reads

---

## 14. Security Testing

### Automated (CI Pipeline)

| Check | Tool | Frequency |
|-------|------|-----------|
| Dependency vulnerabilities | `pnpm audit` + Dependabot | Every PR + weekly |
| TypeScript strict null checks | `tsc --strict` | Every PR |
| RLS policy integration tests | Vitest + Supabase local | Every PR |
| OWASP headers check | `next-safe` or manual Playwright | Every PR |
| Accessibility (WCAG) | axe-core in Vitest | Every PR |

### Manual (Quarterly)

| Check | Method |
|-------|--------|
| Cross-org data access test | Authenticated as Org A, attempt Org B resource IDs |
| Onboarding token enumeration test | Verify rate limit blocks after 10 attempts |
| Webhook signature bypass test | Send unsigned GHL payload — verify 401 |
| RLS policy audit | Review all policies against RBAC matrix |
| Environment variable audit | Verify no server-only vars exposed in client bundle |

---

*Security architecture current as of 2026-03-31. Review quarterly or after any major infrastructure change.*

# SECURITY.md — Make It Rain Digital (MIRD)
## RainMachine Platform — Security Architecture

**Version:** 1.0
**Date:** 2026-03-29
**Classification:** Internal — Principal Architect

---

## Table of Contents

1. [Threat Model](#1-threat-model)
2. [Authentication Strategy by User Type](#2-authentication-strategy-by-user-type)
3. [Meta System User Setup](#3-meta-system-user-setup)
4. [Google Ads OAuth with Refresh Token Handling](#4-google-ads-oauth-with-refresh-token-handling)
5. [Webhook Signature Verification](#5-webhook-signature-verification)
6. [Supabase RLS Policies](#6-supabase-rls-policies)
7. [API Key Management](#7-api-key-management)
8. [Data Isolation Between Clients](#8-data-isolation-between-clients)
9. [Secrets Management](#9-secrets-management)
10. [Security Checklist](#10-security-checklist)

---

## 1. Threat Model

### Assets to Protect

| Asset | Sensitivity | Why It Matters |
|-------|-------------|---------------|
| Client Meta ad account access (System User tokens) | Critical | Can spend client ad budget, view financial data |
| Client Google Ads access (OAuth refresh tokens) | Critical | Can view/modify client campaigns |
| Client contact database (leads, phones, emails) | High | PII — phone numbers and emails of real estate prospects |
| MIRD MRR and financial data | High | Competitive intelligence |
| GHL sub-account API keys | High | Can manipulate client CRM, send messages as client |
| Claude AI agent outputs | Medium | Business intelligence surfaced only to MIRD admin |
| Retell AI call recordings | High | PII — recorded phone conversations |
| Supabase service role key | Critical | Bypasses all RLS — full database access |
| n8n instance | High | Orchestrates all automation — compromise = full system access |

### Primary Threats

1. **Cross-tenant data leakage** — One client sees another client's leads, campaigns, or reports
2. **Compromised webhook endpoint** — Attacker injects fake GHL or Retell events to manipulate lead data
3. **Stolen ad account credentials** — Attacker uses Meta System User token or Google refresh token to access client accounts
4. **Compromised service role key** — Full database access bypass
5. **Agent seat abuse** — Unauthorized users accessing client dashboard without a valid seat
6. **Build & Release stack isolation failure** — B&R client's stack leaking data to MIRD internal data

### Out of Scope (Phase 1)

- SOC 2 compliance (deferred to Phase 3+)
- HIPAA (not applicable — real estate/insurance, not healthcare)
- PCI DSS (no direct card processing — Stripe handles it)

---

## 2. Authentication Strategy by User Type

### User Type Matrix

| User Type | Auth Method | Session | MFA Required | Notes |
|-----------|-------------|---------|--------------|-------|
| MIRD Admin (Shomari) | Supabase Auth (email/password) | JWT, 8h expiry | Yes — TOTP | Role: `mird_admin` |
| Client Admin (Team Leader) | Supabase Auth (email/password) | JWT, 8h expiry | Recommended | Role: `client_admin` |
| Agent | Supabase Auth (email/password) | JWT, 8h expiry | No | Role: `agent` |
| Build & Release Admin | Supabase Auth (email/password) | JWT, 8h expiry | Yes — TOTP | Role: `build_release_admin` |
| Onboarding Portal User | Token-based (no account required) | Token in URL, 7-day TTL | No | One-time use per org |
| n8n (internal automation) | Service role key | Permanent | N/A | Never exposed to browser |
| Supabase Edge Functions | Service role key | Permanent | N/A | Never exposed to browser |

### MIRD Admin Authentication

```
1. Login: POST /auth/v1/token (Supabase Auth)
   - Email + password
   - TOTP second factor (Supabase MFA)
2. Session: JWT stored in httpOnly cookie (Next.js middleware)
3. JWT claims include: { sub: user_id, role: 'mird_admin', org: null }
4. Server Components validate JWT on every request
5. RLS: is_mird_admin() = true → sees all data
```

**JWT token shape (custom claims via Supabase hook):**
```json
{
  "sub": "user-uuid",
  "email": "shomari@makeitraindigital.com",
  "role": "authenticated",
  "app_metadata": {
    "mird_role": "mird_admin",
    "organization_id": null
  },
  "iat": 1711699200,
  "exp": 1711728000
}
```

### Client Admin Authentication

```
1. MIRD creates account: Supabase Admin API inviteUserByEmail()
   - Sends magic link to client's email
2. Client sets password via magic link
3. Login: email + password via Supabase Auth
4. JWT claims: { mird_role: 'client_admin', organization_id: 'uuid' }
5. RLS: org_id in JWT must match row's organization_id
```

### Agent Authentication

```
1. Client Admin invites agent: POST /api/agents (creates auth.users record)
2. Agent receives magic link, sets password
3. JWT claims: { mird_role: 'agent', organization_id: 'uuid' }
4. RLS: agent sees only leads assigned to their agent record
```

### Build & Release Admin Authentication

```
1. Same as Client Admin flow
2. JWT claims: { mird_role: 'build_release_admin', organization_id: 'uuid' }
3. Additional scoping: build_release_config defines which external stack URLs they can access
4. TOTP required at account setup (enforced in signup flow)
```

### Supabase Custom JWT Claims Hook

The JWT is enriched with `mird_role` and `organization_id` via a Supabase Auth hook:

```sql
-- Supabase Auth hook: customize_access_token
CREATE OR REPLACE FUNCTION auth.customize_access_token(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  profile_row user_profiles%ROWTYPE;
BEGIN
  SELECT * INTO profile_row
  FROM user_profiles
  WHERE id = (event->>'user_id')::uuid;

  IF FOUND THEN
    event := jsonb_set(event, '{claims,app_metadata,mird_role}',
                       to_jsonb(profile_row.role::text));
    event := jsonb_set(event, '{claims,app_metadata,organization_id}',
                       COALESCE(to_jsonb(profile_row.organization_id::text), 'null'::jsonb));
  END IF;

  RETURN event;
END;
$$;
```

---

## 3. Meta System User Setup

### Why System Users (not OAuth)

Meta's standard OAuth tokens expire in 60 days. In a multi-client environment, managing 12+ token refreshes manually creates unacceptable operational risk — expired tokens = no reporting = client SLA breach.

Meta Business Manager System Users generate non-expiring access tokens when assigned the correct permissions. This is Meta's documented pattern for platform operators managing multiple clients.

### Setup Procedure (per client)

**Step 1: MIRD's System User (one-time setup)**

1. In MIRD's own Meta Business Manager:
   - Navigate to Business Settings → Users → System Users
   - Create: `MIRD Rainmaker System User` (Admin level)
   - Generate token with scopes: `ads_management`, `ads_read`, `business_management`, `leads_retrieval`
   - This token is stored in n8n credentials store under `meta_system_user_token_mird`
   - **Never stored in Supabase**

**Step 2: Client grants MIRD System User access**

During client onboarding portal:
1. Client opens their Meta Business Manager
2. Navigate to Business Settings → Partners → Add Partner
3. Enter MIRD's Business ID: `[MIRD_META_BUSINESS_ID]`
4. Client assigns MIRD partner access to:
   - Their Ad Account → Analyst (read campaigns, insights)
   - Their Pixel → Analyst (read pixel events for lead verification)
   - Their Page → Analyst (required for Lead Ads forms)

**Step 3: MIRD adds System User to client's asset**

1. Once partner access granted, MIRD admin (or n8n automation):
   ```
   POST /{business_id}/system_users
   {
     "name": "MIRD Rainmaker",
     "role": "ANALYST"
   }
   ```
2. Assign System User to client's ad account:
   ```
   POST /{ad_account_id}/assigned_users
   {
     "user": "{system_user_id}",
     "tasks": ["ANALYZE", "ADVERTISE", "CREATIVE"]
   }
   ```

**Step 4: Generate and store token**

```
POST /{system_user_id}/access_tokens
{
  "business_id": "{mird_business_id}",
  "appsecret_proof": "{hmac}",
  "scope": "ads_management,ads_read,leads_retrieval"
}
```

Store the resulting token encrypted in `ad_accounts.meta_system_user_token` using AES-256 encryption (key in Supabase Vault).

### Token Security

- Tokens are stored encrypted at rest (Supabase Vault / `pgsodium`)
- Tokens are never returned to the browser — only used in server-side n8n workflows and Edge Functions
- Token access in n8n: loaded from n8n credentials store by credential ID, never hardcoded in workflow JSON
- Token rotation: Meta System User tokens don't expire but should be rotated annually or on team change

---

## 4. Google Ads OAuth with Refresh Token Handling

### Architecture

MIRD uses a **Google Ads Manager Account (MCC)** to manage all client accounts from a single OAuth credential. Each client's Google Ads account is linked to MIRD's MCC.

```
MIRD MCC Account (987-654-3210)
├── Client 1: Marcus Realty (123-456-7890)  ← linked as managed account
├── Client 2: Johnson Insurance (234-567-8901)
└── Client N: ...
```

### OAuth Flow

**One-time MIRD OAuth setup:**

1. Create Google Cloud project for MIRD
2. Enable Google Ads API
3. Configure OAuth 2.0 consent screen (Internal — MIRD only)
4. Create OAuth 2.0 credentials (Client ID + Secret)
5. Run offline authorization to generate refresh token:
   ```bash
   # Using Google OAuth2 playground or gads CLI
   # Scope: https://www.googleapis.com/auth/adwords
   # Access type: offline
   # Prompt: consent (to force refresh token generation)
   ```
6. Store refresh token encrypted in Supabase Vault: `google_ads_refresh_token`

**Per-client access:**

Clients link their Google Ads account to MIRD's MCC:
1. Client navigates to Google Ads → Tools → Linked Accounts → Google Ads Manager
2. Enters MIRD's MCC ID: `987-654-3210`
3. Accepts the manager link request

MIRD admin confirms the link in MCC. No separate OAuth per client — MCC access token covers all managed accounts.

### Refresh Token Handling

Google OAuth refresh tokens can expire if:
- Unused for 6 months
- User revokes access
- Account password changes

**Refresh token rotation (automated):**

```typescript
// packages/google-ads-client/src/auth.ts
export async function getValidAccessToken(): Promise<string> {
  const stored = await supabase.rpc('get_decrypted_secret', {
    secret_name: 'google_ads_refresh_token'
  });

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ refresh_token: stored.data });

  const { credentials } = await oauth2Client.refreshAccessToken();

  // If a new refresh token was issued, store it
  if (credentials.refresh_token) {
    await supabase.rpc('update_encrypted_secret', {
      secret_name: 'google_ads_refresh_token',
      secret_value: credentials.refresh_token
    });
  }

  return credentials.access_token!;
}
```

n8n runs a health check daily (`GET /api/admin/integrations/google/verify`) and alerts Slack if the token is invalid.

---

## 5. Webhook Signature Verification

### GHL Webhook Verification

GHL signs webhooks with HMAC-SHA256 using a shared secret configured in the GHL integration settings.

```typescript
// supabase/functions/webhooks/ghl/index.ts
import { createHmac } from "https://deno.land/std/crypto/mod.ts";

export async function verifyGHLSignature(
  request: Request,
  body: string
): Promise<boolean> {
  const signature = request.headers.get("X-GHL-Signature");
  if (!signature) return false;

  const secret = Deno.env.get("WEBHOOK_SECRET_GHL")!;
  const expectedSig = createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  const receivedSig = signature.startsWith("sha256=")
    ? signature.slice(7)
    : signature;

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(
    new TextEncoder().encode(expectedSig),
    new TextEncoder().encode(receivedSig)
  );
}
```

**Timing-safe comparison:**
```typescript
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}
```

### Retell AI Webhook Verification

Retell AI uses HMAC-SHA256 with a webhook secret configured in the Retell dashboard.

```typescript
// supabase/functions/webhooks/retell/index.ts
export async function verifyRetellSignature(
  request: Request,
  body: string
): Promise<boolean> {
  const signature = request.headers.get("X-Retell-Signature");
  if (!signature) return false;

  const secret = Deno.env.get("WEBHOOK_SECRET_RETELL")!;
  const expected = createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return timingSafeEqual(
    new TextEncoder().encode(expected),
    new TextEncoder().encode(signature)
  );
}
```

### Meta Webhook Verification

Meta uses `X-Hub-Signature-256`:

```typescript
export async function verifyMetaSignature(
  request: Request,
  body: string
): Promise<boolean> {
  const signature = request.headers.get("X-Hub-Signature-256");
  if (!signature || !signature.startsWith("sha256=")) return false;

  const secret = Deno.env.get("META_APP_SECRET")!;
  const expected = "sha256=" + createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return timingSafeEqual(
    new TextEncoder().encode(expected),
    new TextEncoder().encode(signature)
  );
}
```

### Webhook Deduplication

All webhook handlers check for duplicate delivery before processing:

```typescript
// Check if we've seen this event_id before
const existing = await supabase
  .from("webhooks_log")
  .select("id")
  .eq("source_event_id", eventId)
  .single();

if (existing.data) {
  // Update status to 'duplicate', return 200 (acknowledge but don't reprocess)
  await supabase.from("webhooks_log").update({ is_duplicate: true }).eq("id", logId);
  return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
}
```

---

## 6. Supabase RLS Policies

Full RLS policy definitions are in `SCHEMA.md`. Key security properties enforced:

### Tenant Isolation Guarantee

Every data-bearing table has:
1. RLS enabled (`ALTER TABLE x ENABLE ROW LEVEL SECURITY`)
2. A DENY-by-default stance (no policy = no access)
3. An explicit policy for each role that needs access

**Test:** Running a query as a client_admin JWT for Organization A must return zero rows from Organization B's data — even with direct SQL access via the Supabase client.

### Service Role Usage

The Supabase service role key bypasses ALL RLS. It is used only in:
- Supabase Edge Functions (server-side, never in browser)
- n8n HTTP Request nodes (server-side, never in workflow UI storage)
- Next.js Server Actions and Route Handlers that process webhooks or internal operations

**Never:**
- In browser-side code
- In Next.js Client Components
- In environment variables prefixed `NEXT_PUBLIC_`
- Committed to version control

---

## 7. API Key Management

### Key Inventory

| Key | Where Stored | Access Pattern | Rotation |
|-----|-------------|----------------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env (server-only) | Server-side only | On team change |
| `SUPABASE_ANON_KEY` | Vercel env (`NEXT_PUBLIC_`) | Browser-safe | Never (public by design) |
| `ANTHROPIC_API_KEY` | Vercel env (server-only) | Server-side only | Quarterly |
| `META_APP_SECRET` | Vercel env (server-only) | Webhook verification only | On breach |
| `GOOGLE_CLIENT_SECRET` | Vercel env (server-only) | Token exchange only | Annually |
| `RETELL_API_KEY` | Vercel env (server-only) | n8n calls Retell | On breach |
| `WEBHOOK_SECRET_GHL` | Vercel env + Supabase Edge | Signature verification | Annually |
| `WEBHOOK_SECRET_RETELL` | Vercel env + Supabase Edge | Signature verification | Annually |
| Meta System User Tokens (per client) | Supabase Vault (encrypted) | n8n server-side | On client offboard |
| Google Ads Refresh Token | Supabase Vault (encrypted) | n8n server-side | Automatic on rotation |
| GHL API Keys (per client) | Supabase Vault (encrypted) | n8n server-side | On sub-account rekey |
| `N8N_WEBHOOK_BASE_URL` | Vercel env | Internal service call | N/A |
| `N8N_API_KEY` | Vercel env (server-only) | Trigger n8n workflows | Quarterly |

### Supabase Vault (pgsodium)

Sensitive per-client credentials (Meta tokens, Google tokens, GHL keys) are stored in Supabase using `pgsodium` encryption:

```sql
-- Store encrypted
SELECT vault.create_secret(
  'meta_token_org_uuid_123',
  'EAABxxx...',
  'Meta System User token for Marcus Realty Group'
);

-- Retrieve decrypted (only in server context with service role)
SELECT decrypted_secret
FROM vault.decrypted_secrets
WHERE name = 'meta_token_org_uuid_123';
```

The vault key is managed by Supabase infrastructure — MIRD does not hold the encryption key directly.

### Vercel Environment Variable Scoping

```
# BROWSER-SAFE (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# SERVER-ONLY (no NEXT_PUBLIC_ prefix — never sent to browser)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
GHL_AGENCY_API_KEY=...
META_APP_ID=...
META_APP_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RETELL_API_KEY=...
N8N_API_KEY=...
N8N_WEBHOOK_BASE_URL=https://n8n.mird.internal
WEBHOOK_SECRET_GHL=...
WEBHOOK_SECRET_RETELL=...
```

---

## 8. Data Isolation Between Clients

### Database Layer (Supabase RLS)

- Every tenant-scoped table row contains `organization_id`
- RLS policies enforce that `organization_id` matches the JWT's `app_metadata.organization_id`
- MIRD admin is the only role that can query across `organization_id` boundaries
- The service role (n8n, Edge Functions) bypasses RLS — but all service role operations are explicitly scoped to an `organization_id` in the query WHERE clause

### Application Layer (Next.js)

```typescript
// packages/shared/src/supabase-server.ts
// Always scope queries to current organization

export function createOrgScopedClient(orgId: string) {
  return supabase.from('leads').select('*').eq('organization_id', orgId);
  // RLS double-enforces this — belt AND suspenders
}
```

### GHL Sub-Account Isolation

Each client has a separate GHL sub-account (different `locationId`). API calls to GHL always specify the `locationId`:

```
GET /contacts/?locationId={client_ghl_location_id}
```

The MIRD agency account can access all sub-accounts, but all automations operate on a specific `locationId` per workflow execution. Cross-location access requires explicit MIRD admin action.

### Build & Release Client Isolation

B&R clients receive fully isolated infrastructure:
- Their own Supabase project (separate database, separate RLS, separate JWT secret)
- Their own Vercel deployment (separate environment variables)
- Their own n8n instance (no shared workflows)
- Their own GHL agency account (not sub-account of MIRD)
- Their own Retell AI account (separate API key)

There is zero shared infrastructure between a B&R client and MIRD's managed clients. They are operationally independent after handoff.

### Call Recording Isolation

Retell AI call recordings are stored in Retell's infrastructure, scoped to the agent_id. Each client's Retell agent belongs to a separate Retell account (or project within an account). Recording URLs are stored in `ai_calls.recording_url` and are accessible only via the Retell API with that client's credentials.

Recordings are never proxied through the RainMachine API to avoid storing them twice. Dashboard links point directly to the Retell-signed URL, which expires after 24 hours.

---

## 9. Secrets Management

### Never-Do List

- **Never** commit `.env.local` or any file containing real secrets to git
- **Never** use `NEXT_PUBLIC_` prefix for service keys, API keys, or tokens
- **Never** log secrets in console.log, error messages, or analytics
- **Never** return secrets in API responses (even partially — no `"token": "EAABxxx..."`")
- **Never** store Meta System User tokens or Google refresh tokens in plaintext database columns
- **Never** put n8n credentials in workflow JSON (use n8n credential store by ID only)

### Incident Response

If a secret is compromised:
1. Rotate immediately (Supabase dashboard / Vercel settings / provider console)
2. Update Vercel env vars and trigger redeploy
3. Update Supabase Edge Function env vars and redeploy functions
4. Update n8n credential store
5. Audit `webhooks_log` for unexpected events in the 24h window around compromise
6. Notify affected clients if their ad account credentials were involved

---

## 10. Security Checklist

### Pre-Launch

- [ ] All `NEXT_PUBLIC_` variables verified to contain only browser-safe values
- [ ] Supabase RLS enabled on all 14 tenant-scoped tables
- [ ] HMAC signature verification live on all 3 webhook endpoints (GHL, Retell, Meta)
- [ ] Meta System User tokens stored in Supabase Vault (pgsodium), not plaintext columns
- [ ] Google refresh token stored in Supabase Vault
- [ ] GHL API keys stored in Supabase Vault
- [ ] MIRD Admin MFA (TOTP) enforced in Supabase Auth settings
- [ ] Service role key confirmed absent from all git history
- [ ] n8n instance: authentication enabled, not publicly accessible without API key
- [ ] Vercel preview deployments scoped to team members only (not public)
- [ ] `robots.txt` blocking indexing on CEO dashboard and onboarding portal

### Per Client Onboarding

- [ ] Meta System User added to client BM with correct permissions
- [ ] Google Ads MCC link confirmed
- [ ] Client GHL sub-account `api_key` stored in Supabase Vault
- [ ] Onboarding token single-use and expired after submission
- [ ] RLS verified: client_admin JWT returns zero rows from other orgs

### Quarterly

- [ ] Rotate `ANTHROPIC_API_KEY`
- [ ] Rotate `N8N_API_KEY`
- [ ] Verify Google Ads refresh token still valid
- [ ] Review `agent_performance` logs for unexpected Claude API calls
- [ ] Audit `webhooks_log` for signature failures (may indicate probing)
- [ ] Review Vercel access log for unusual patterns on `/api/agents/run`

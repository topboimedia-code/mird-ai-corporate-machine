# AUTH.md — Make It Rain Digital (MIRD)
## RainMachine Platform — Authentication & Authorization

**Version:** 1.0
**Date:** 2026-03-29
**Auth Provider:** Supabase Auth (JWT-based)

---

## Table of Contents

1. [User Roles](#1-user-roles)
2. [Role Permissions Matrix](#2-role-permissions-matrix)
3. [Auth Flows by Role](#3-auth-flows-by-role)
4. [Session Management](#4-session-management)
5. [GHL Sub-Account Access Provisioning](#5-ghl-sub-account-access-provisioning)
6. [Agent Seat Provisioning and Access Control](#6-agent-seat-provisioning-and-access-control)
7. [Middleware and Route Protection](#7-middleware-and-route-protection)
8. [Password Policies and MFA](#8-password-policies-and-mfa)

---

## 1. User Roles

### Role Definitions

```typescript
// packages/shared/src/types/auth.ts

export type UserRole =
  | 'mird_admin'          // Shomari and MIRD team — full access to everything
  | 'client_admin'        // Team leader (Marcus persona) — full access to their org
  | 'agent'               // Individual agent — scoped to assigned leads
  | 'build_release_admin' // B&R client owner — full access to their isolated stack
```

### MIRD Admin (`mird_admin`)

- **Who:** Shomari + any future MIRD team members
- **What they see:** Everything — all clients, all reports, CEO dashboard, all financial data
- **What they can do:** Create/update/delete any resource across any organization. Access CEO dashboard. Trigger Claude agents manually. Manage client provisioning.
- **Seat cost:** Not counted against any plan seat limit
- **MFA:** Required (TOTP)
- **Access apps:** CEO Dashboard, all client RainMachine dashboards (impersonation), Onboarding Portal (admin view)

### Client Admin (`client_admin`)

- **Who:** The team leader (e.g., Marcus Johnson of Marcus Realty Group)
- **What they see:** All data within their organization only — leads, agents, campaigns, appointments, call recordings
- **What they can do:** Invite/manage agents, assign leads, view ad performance, see AI call summaries
- **What they cannot do:** See other clients' data, access CEO dashboard, change subscription plan, access raw webhook logs
- **Seat cost:** Counts as 1 seat (the team leader seat)
- **MFA:** Recommended, not enforced (Phase 1)
- **Access apps:** RainMachine Dashboard

### Agent (`agent`)

- **Who:** Individual real estate agents on the client's team
- **What they see:** Only leads assigned to them, their own appointments, their own performance metrics
- **What they can do:** View lead detail, view call summaries for assigned leads, update lead notes, mark appointments complete
- **What they cannot do:** See other agents' leads, see ad campaign data, see financials, invite other agents
- **Seat cost:** Counts as 1 seat against the plan limit (Starter: 5 seats, Growth/Scale: unlimited)
- **MFA:** Not required
- **Access apps:** RainMachine Dashboard (restricted view)

### Build & Release Admin (`build_release_admin`)

- **Who:** B&R client who has purchased the full MIRD stack for themselves
- **What they see:** Everything in their own isolated stack — equivalent to `mird_admin` for their own system
- **What they can do:** Full control of their own RainMachine instance, CEO dashboard, Claude agents, GHL, Retell
- **What they cannot do:** Access MIRD's internal systems, see MIRD's other clients, access MIRD's CEO dashboard
- **Seat cost:** Not applicable — they own their stack
- **MFA:** Required (TOTP) — they are administrators of their own platform
- **Access apps:** Their own CEO Dashboard, their own RainMachine Dashboard

---

## 2. Role Permissions Matrix

| Permission | mird_admin | client_admin | agent | build_release_admin |
|------------|:----------:|:------------:|:-----:|:-------------------:|
| View all organizations | ✅ | ❌ | ❌ | ❌ (own only) |
| Create organization | ✅ | ❌ | ❌ | ❌ |
| View own organization | ✅ | ✅ | ✅ | ✅ |
| Update organization | ✅ | Partial* | ❌ | ✅ (own) |
| View all leads in org | ✅ | ✅ | ❌ | ✅ (own) |
| View assigned leads only | ✅ | ✅ | ✅ | ✅ |
| Assign leads to agents | ✅ | ✅ | ❌ | ✅ |
| View ad campaign data | ✅ | ✅ | ❌ | ✅ |
| View call recordings | ✅ | ✅ | Own assignments only | ✅ |
| Invite agents | ✅ | ✅ | ❌ | ✅ |
| Deactivate agents | ✅ | ✅ | ❌ | ✅ |
| View Claude agent reports | ✅ | Org-scoped only | ❌ | ✅ (own) |
| Trigger Claude agents | ✅ | ❌ | ❌ | ✅ (own) |
| View CEO dashboard | ✅ | ❌ | ❌ | ✅ (own) |
| View MRR / financials | ✅ | ❌ | ❌ | ✅ (own) |
| View webhook logs | ✅ | ❌ | ❌ | ✅ (own) |
| Manage subscriptions | ✅ | ❌ | ❌ | ❌ |
| Access onboarding admin | ✅ | ❌ | ❌ | ❌ |
| Impersonate client | ✅ | ❌ | ❌ | ❌ |
| Provision GHL sub-account | ✅ | ❌ | ❌ | ✅ (own) |

*Partial: client_admin can update business info (name, website) but not subscription plan or GHL config.

---

## 3. Auth Flows by Role

### 3.1 MIRD Admin — Initial Setup

```
STEP 1: Supabase creates account (manual — Shomari only)
  → Supabase Dashboard: Authentication → Users → Invite User
  → Email: shomari@makeitraindigital.com
  → Role set to mird_admin in user_profiles via service role

STEP 2: Set password via magic link email

STEP 3: Set up TOTP MFA
  → Login → Prompted to configure MFA (enforced by Supabase Auth settings)
  → Scan QR code in authenticator app
  → Verify 6-digit code
  → Backup codes saved securely

STEP 4: Login flow thereafter
  → Email + password → TOTP → Session established
```

### 3.2 Client Admin — Invitation Flow

```
TRIGGER: MIRD closes a sale → creates org via POST /api/admin/organizations

STEP 1: Next.js Server Action calls Supabase Admin API
  supabase.auth.admin.inviteUserByEmail(owner_email, {
    data: {
      mird_role: 'client_admin',
      organization_id: org.id
    },
    redirectTo: 'https://dashboard.rainmachine.io/auth/callback'
  })

STEP 2: Client receives "You're invited to RainMachine" email
  → Clicks magic link → redirected to /auth/callback?token=...

STEP 3: /auth/callback route handler
  → Exchanges token for session
  → Redirects to /onboarding/set-password (first time only)

STEP 4: Client sets password
  → POST /auth/v1/user { password: "..." }
  → Redirected to dashboard

STEP 5: user_profiles row auto-created via Supabase trigger
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger AS $$
  BEGIN
    INSERT INTO user_profiles (id, email, full_name, role, organization_id)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', new.email),
      (new.raw_app_meta_data->>'mird_role')::user_role,
      (new.raw_app_meta_data->>'organization_id')::uuid
    );
    RETURN new;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3.3 Agent — Invitation Flow

```
TRIGGER: Client Admin invites an agent from the dashboard

STEP 1: Client Admin fills form: agent name, email, phone
  → POST /api/agents (client_admin auth required)

STEP 2: Server action:
  a. Creates Supabase auth user via admin API
     supabase.auth.admin.inviteUserByEmail(agent_email, {
       data: {
         mird_role: 'agent',
         organization_id: client_admin_org_id,
         full_name: agent_name
       },
       redirectTo: 'https://dashboard.rainmachine.io/auth/callback'
     })

  b. Creates agents table record
     INSERT INTO agents (organization_id, full_name, email, phone, seat_active)
     VALUES (org_id, name, email, phone, true)

  c. Checks seat limit before creating:
     SELECT COUNT(*) FROM agents
     WHERE organization_id = $1 AND seat_active = true
     -- If count >= plan_seat_limit, return 422 seat_limit_reached

STEP 3: Agent receives invitation email
  → Sets password → directed to agent view of dashboard

STEP 4: user_profiles.id linked to agents.user_profile_id
  → n8n workflow or trigger updates agents.user_profile_id after
    first login
```

### 3.4 Build & Release Admin — Provisioning Flow

```
TRIGGER: MIRD completes B&R build and is ready to hand off

STEP 1: MIRD creates user in the B&R client's Supabase project
  (B&R clients have their own isolated Supabase project)
  → Supabase Admin API on the B&R project
  → Role: build_release_admin

STEP 2: Same invitation flow as Client Admin but on the B&R stack

STEP 3: MFA (TOTP) required at first login
  → Enforced in B&R stack's Supabase Auth settings

STEP 4: Handoff documentation provided:
  - Dashboard URL (custom domain)
  - GHL agency account login
  - Retell AI account login
  - n8n instance URL
  - Emergency contact for MIRD support
```

### 3.5 Onboarding Portal — Token-Based Flow

The onboarding portal does not use Supabase Auth. It uses a single-use token to avoid requiring clients to create an account before they've been provisioned.

```
STEP 1: MIRD creates org via POST /api/admin/organizations
  → Server generates onboarding token (UUID)
  → Stores in onboarding_submissions.access_token (hashed)
  → Sets access_token_expires_at = now() + 7 days

STEP 2: Email sent to client with URL:
  https://onboarding.rainmachine.io/start?token=abc123token

STEP 3: Client visits URL
  → GET /api/onboarding/verify?token=abc123token
  → Server looks up token (unhashed), validates expiry
  → Returns org context (no auth session created)

STEP 4: Client completes all 5 steps
  → Each step: PUT /api/onboarding/steps/[step]?token=abc123token
  → Server validates token on every request (stateless)

STEP 5: Final submission
  → POST /api/onboarding/submit?token=abc123token
  → Token is consumed (token_used_at = now())
  → Cannot be reused

STEP 6: GHL access email sent separately by n8n provisioning workflow
  → This is not a RainMachine login — it's access to the GHL sub-account
  → RainMachine dashboard access arrives via the client_admin invitation email
    sent at the same time

NOTE: Token is stored hashed (SHA-256) in the database.
The plaintext token only exists in the URL sent to the client.
If the database is compromised, tokens cannot be reverse-engineered.
```

---

## 4. Session Management

### JWT Configuration

```typescript
// Supabase Auth Settings (configured in dashboard)
{
  jwt_expiry: 28800,          // 8 hours (28800 seconds)
  refresh_token_rotation: true,
  refresh_token_reuse_interval: 10,  // 10 seconds grace period for network issues
}
```

### Next.js Session Handling

Sessions are managed with Supabase's SSR package to ensure cookies are handled correctly in Next.js App Router.

```typescript
// packages/shared/src/supabase-server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### Session Refresh

Supabase handles automatic token refresh via the `@supabase/ssr` package. The access token (JWT) expires in 8 hours. The refresh token rotates on each use.

```typescript
// apps/dashboard/middleware.ts
// middleware.ts — runs on every request, refreshes session automatically
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) { response.cookies.set({ name, value, ...options }) },
        remove(name, options) { response.cookies.set({ name, value: '', ...options }) },
      },
    }
  )

  // Refresh session — this is critical for keeping the session alive
  const { data: { user } } = await supabase.auth.getUser()

  // Route protection
  if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|auth).*)'],
}
```

### Logout

```typescript
// Server action: /api/auth/logout
await supabase.auth.signOut()
// Clears all cookies, invalidates refresh token server-side
```

---

## 5. GHL Sub-Account Access Provisioning Flow

GHL sub-account access is provisioned by MIRD — clients do not self-register in GHL.

```
TRIGGER: n8n Provisioning Workflow (fires after onboarding submission)

STEP 1: Create GHL sub-account
  POST https://services.leadconnectorhq.com/locations/
  Authorization: Bearer {MIRD_GHL_AGENCY_API_KEY}
  {
    "name": "Marcus Realty Group",
    "address": "123 Peachtree St",
    "city": "Atlanta",
    "state": "GA",
    "country": "US",
    "timezone": "America/New_York",
    "settings": {
      "allowDuplicateContact": false,
      "allowDuplicateOpportunity": false
    }
  }
  → Response: { "id": "new_ghl_location_id" }

STEP 2: Apply MIRD pipeline template
  POST /locations/{location_id}/pipelines
  → Clones MIRD's "RainMachine Pipeline" template
  → Stages: New Lead → Contacted → Appointment Scheduled → Show → Closed

STEP 3: Configure GHL Calendar
  POST /locations/{location_id}/calendars
  → Creates "Discovery Call" calendar with 30-min slots

STEP 4: Set up GHL automations
  → Clone MIRD automation template (snapshot)
  → Apply to new sub-account

STEP 5: Create GHL user access for client
  POST /locations/{location_id}/users
  {
    "firstName": "Marcus",
    "lastName": "Johnson",
    "email": "marcus@example.com",
    "role": "admin",
    "locationIds": ["{location_id}"]
  }
  → GHL sends access email directly to client

STEP 6: Store in Supabase
  INSERT INTO ghl_accounts (organization_id, location_id, ...)
  UPDATE organizations SET ghl_provisioned = true, ghl_location_id = '{location_id}'

STEP 7: Slack alert
  → POST to #mird-ops: "GHL sub-account provisioned for Marcus Realty Group
    Location ID: {location_id}. Client access email sent."
```

### GHL User Roles

| GHL Role | Maps to MIRD Role | Access Level |
|----------|-------------------|--------------|
| Location Admin | client_admin | Full sub-account access |
| User | agent | Contact management only |
| MIRD Agency | mird_admin | All sub-accounts via agency view |

---

## 6. Agent Seat Provisioning and Access Control

### Seat Limit Enforcement

```typescript
// apps/dashboard/app/api/agents/route.ts

export async function POST(request: Request) {
  const session = await getServerSession() // must be client_admin
  const org = await getOrganization(session.user.organization_id)

  // Get plan seat limit
  const seatLimit = PLAN_SEAT_LIMITS[org.subscription_plan]
  // PLAN_SEAT_LIMITS = { starter: 5, growth: Infinity, scale: Infinity }

  // Count active seats
  const { count } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', org.id)
    .eq('seat_active', true)

  if (count !== null && count >= seatLimit) {
    return Response.json(
      { error: 'seat_limit_reached', message: `Your plan allows ${seatLimit} agent seats.` },
      { status: 422 }
    )
  }

  // Proceed with agent creation
  // ...
}
```

### Seat Deactivation

When an agent is deactivated (leaves the team):

```typescript
// Deactivate agent seat (does not delete — preserves historical data)
await supabase
  .from('agents')
  .update({ seat_active: false, is_active: false })
  .eq('id', agent_id)
  .eq('organization_id', current_org_id) // belt and suspenders

// Revoke Supabase auth access
await supabaseAdmin.auth.admin.updateUserById(agent.user_id, {
  ban_duration: 'none', // or: deleteUser() if permanent
  app_metadata: { mird_role: 'agent_inactive' }
})

// Reassign open leads
await supabase
  .from('leads')
  .update({ assigned_agent_id: null })
  .eq('assigned_agent_id', agent_id)
  .in('status', ['new', 'call_queued', 'appointment_requested'])
```

### Agent Access Scoping in Dashboard

When an agent logs in, the dashboard middleware reads their role and agent record:

```typescript
// apps/dashboard/app/(dashboard)/layout.tsx

const { data: { user } } = await supabase.auth.getUser()
const role = user?.app_metadata?.mird_role

if (role === 'agent') {
  // Get the agent record for this user
  const { data: agentRecord } = await supabase
    .from('agents')
    .select('id, organization_id, full_name')
    .eq('user_profile_id', user.id)
    .single()

  if (!agentRecord?.seat_active) {
    // Redirect to access-revoked page
    redirect('/auth/access-revoked')
  }

  // Pass agent context to all child components via layout context
  // All lead queries in agent view use .eq('assigned_agent_id', agentRecord.id)
}
```

### Agent View Navigation (Restricted)

```typescript
// packages/shared/src/nav-config.ts

export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  mird_admin: [
    { href: '/ceo', label: 'CEO Dashboard' },
    { href: '/clients', label: 'All Clients' },
    { href: '/reports', label: 'AI Reports' },
    { href: '/settings', label: 'Settings' },
  ],
  client_admin: [
    { href: '/dashboard', label: 'Overview' },
    { href: '/leads', label: 'Leads' },
    { href: '/appointments', label: 'Appointments' },
    { href: '/agents', label: 'My Team' },
    { href: '/campaigns', label: 'Ad Performance' },
    { href: '/settings', label: 'Settings' },
  ],
  agent: [
    { href: '/dashboard', label: 'My Overview' },
    { href: '/leads', label: 'My Leads' },
    { href: '/appointments', label: 'My Appointments' },
  ],
  build_release_admin: [
    // Same as mird_admin but scoped to their own stack
    { href: '/ceo', label: 'CEO Dashboard' },
    { href: '/leads', label: 'Leads' },
    { href: '/campaigns', label: 'Campaigns' },
    { href: '/reports', label: 'AI Reports' },
    { href: '/settings', label: 'Settings' },
  ],
}
```

---

## 7. Middleware and Route Protection

### Dashboard App Middleware

```typescript
// apps/dashboard/middleware.ts

const PUBLIC_ROUTES = ['/auth/login', '/auth/callback', '/auth/reset-password']
const MIRD_ONLY_ROUTES = ['/admin', '/ceo']
const CLIENT_ADMIN_ROUTES = ['/agents', '/campaigns', '/settings/billing']

export async function middleware(request: NextRequest) {
  // ... session refresh logic (see Session Management section)

  const user = await getUser(supabase)
  const role = user?.app_metadata?.mird_role as UserRole | undefined

  // Unauthenticated → login
  if (!user && !PUBLIC_ROUTES.includes(request.nextUrl.pathname)) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based route guards
  if (MIRD_ONLY_ROUTES.some(r => request.nextUrl.pathname.startsWith(r))) {
    if (role !== 'mird_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  if (CLIENT_ADMIN_ROUTES.some(r => request.nextUrl.pathname.startsWith(r))) {
    if (!['mird_admin', 'client_admin'].includes(role ?? '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}
```

---

## 8. Password Policies and MFA

### Password Policy (Supabase Auth settings)

```
Minimum length: 10 characters
Require uppercase: No (UX tradeoff for solo operator context)
Require number: No
Require special character: No
Password strength indicator: Enabled in UI
Prohibited: Common passwords (pwned passwords check — optional Phase 2)
```

### MFA Policy by Role

| Role | MFA Enforcement | Method |
|------|----------------|--------|
| mird_admin | Required | TOTP (Supabase MFA) |
| build_release_admin | Required | TOTP (Supabase MFA) |
| client_admin | Optional (Phase 1) → Required (Phase 2) | TOTP |
| agent | Not required | N/A |

### Enforcing MFA in Middleware

```typescript
// For mird_admin and build_release_admin routes:
const { data: { session } } = await supabase.auth.getSession()

if (['mird_admin', 'build_release_admin'].includes(role)) {
  const mfaLevel = session?.user?.factors?.find(f => f.status === 'verified')
  if (!mfaLevel) {
    // Redirect to MFA setup/challenge
    return NextResponse.redirect(new URL('/auth/mfa', request.url))
  }
}
```

### Account Recovery

```
Forgot password → supabase.auth.resetPasswordForEmail(email)
→ Email with 6-hour magic link
→ Redirect to /auth/reset-password
→ User sets new password

Lost TOTP device (mird_admin):
→ Shomari contacts Supabase support (no self-serve MFA reset for admin — by design)
→ Alternative: backup codes generated at MFA setup time
```

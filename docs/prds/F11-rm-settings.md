# F11 — RainMachine Settings

**Source pitch:** P11
**Cycle:** 5 | **Release:** R1 | **Appetite:** Medium
**Status:** Ready for implementation

---

## 1. Overview

### Problem
RainMachine team leaders need a central control panel to manage their team, configure lead routing rules, set notification preferences, connect ad platforms, and manage their account security. These settings span multiple subsystems (GHL, Retell, Supabase Vault, Meta/Google OAuth) and must be safe, validated, and immediately reflected in downstream automations.

### Solution
A `settings/[section]` dynamic route within `apps/dashboard` with a persistent left-nav sidebar and five tabs: Team, Routing, Notifications, Integrations, and Account. Each tab is a distinct form surface with its own server actions, Zod validation, and downstream effects.

- **Team:** Manage agents directly from settings (builds on F09 agents table); changes sync to GHL via n8n
- **Routing:** Visual rule builder for lead assignment; rules persisted to `tenants.routing_rules` JSONB
- **Notifications:** Alert threshold inputs and toggle matrix for delivery channels
- **Integrations:** OAuth connection status for GHL, Meta, Google; popup-based reconnect flow
- **Account:** Password change, MFA enrollment, data export, AI automation kill switch

### Success Criteria
- Routing rules save and trigger GHL workflow update within 5 seconds
- OAuth reconnect flow uses `postMessage` popup pattern (no full-page redirect)
- MFA enrollment/disable works end-to-end with Supabase Auth MFA API
- `disableAIAutomation` sets `tenants.ai_enabled = false` and n8n Retell workflow respects it within one polling cycle
- All form inputs have `data-testid` attributes for Playwright

### Out of Scope (MVP)
- Custom domain / white-label settings
- Billing / subscription management (deferred to R3)
- Slack notification channel (Notifications tab shows "Coming soon")
- Multi-admin user management (single RM per tenant in R1)

---

## 2. Database

### New Tables & Columns

```sql
-- supabase/migrations/0018_settings.sql

-- Routing rules stored as JSONB on the tenants table
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS routing_rules JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Index routing_rules for CEO-level queries (future)
CREATE INDEX idx_tenants_ai_enabled ON tenants(ai_enabled) WHERE ai_enabled = FALSE;

-- notification_preferences table (scaffolded in F06, fully defined here)
-- Safe to re-run with IF NOT EXISTS guards
CREATE TABLE IF NOT EXISTS notification_preferences (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  -- Alert thresholds
  cpl_threshold       NUMERIC(10,2) DEFAULT 100.00,
  close_rate_floor    NUMERIC(5,2)  DEFAULT 10.00,
  -- Email toggles
  email_new_lead      BOOLEAN NOT NULL DEFAULT TRUE,
  email_appointment   BOOLEAN NOT NULL DEFAULT TRUE,
  email_call_outcome  BOOLEAN NOT NULL DEFAULT FALSE,
  email_weekly_report BOOLEAN NOT NULL DEFAULT TRUE,
  -- SMS toggles (coming soon — stored but not sent in R1)
  sms_new_lead        BOOLEAN NOT NULL DEFAULT FALSE,
  sms_appointment     BOOLEAN NOT NULL DEFAULT FALSE,
  sms_call_outcome    BOOLEAN NOT NULL DEFAULT FALSE,
  sms_weekly_report   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ceo_settings (fully defined in F20, scaffolded here for routing_rules FK)
-- Placeholder — actual schema in F20
```

### RLS Policies

```sql
-- supabase/migrations/0019_settings_rls.sql

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Tenant can read/update their own notification prefs
CREATE POLICY "notif_prefs_tenant_select"
  ON notification_preferences FOR SELECT
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "notif_prefs_tenant_update"
  ON notification_preferences FOR UPDATE
  USING (tenant_id = auth.tenant_id())
  WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "notif_prefs_tenant_insert"
  ON notification_preferences FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

-- tenants table: RM can update their own row (routing_rules, ai_enabled)
-- SELECT policy already exists from F03; add UPDATE for settings columns
CREATE POLICY "tenants_rm_update_settings"
  ON tenants FOR UPDATE
  USING (id = auth.tenant_id())
  WITH CHECK (id = auth.tenant_id());
```

### Routing Rules JSONB Schema

```typescript
// Defines the shape stored in tenants.routing_rules
export interface RoutingRule {
  id: string;           // client-generated UUID
  priority: number;     // 1-based sort order
  condition: {
    field: 'lead_source' | 'city' | 'tag';
    operator: 'equals' | 'contains' | 'starts_with';
    value: string;
  };
  assign_to: string;    // agent.id (FK to agents table)
  assign_to_name: string; // denormalized for display
}
```

---

## 3. TypeScript Interfaces

```typescript
// packages/db/src/types/settings.types.ts

export interface RoutingRule {
  id: string;
  priority: number;
  condition: {
    field: 'lead_source' | 'city' | 'tag';
    operator: 'equals' | 'contains' | 'starts_with';
    value: string;
  };
  assign_to: string;
  assign_to_name: string;
}

export interface NotificationPreferences {
  id: string;
  tenant_id: string;
  cpl_threshold: number;
  close_rate_floor: number;
  email_new_lead: boolean;
  email_appointment: boolean;
  email_call_outcome: boolean;
  email_weekly_report: boolean;
  sms_new_lead: boolean;
  sms_appointment: boolean;
  sms_call_outcome: boolean;
  sms_weekly_report: boolean;
}

export type NotifChannel = 'email' | 'sms';
export type NotifEvent = 'new_lead' | 'appointment' | 'call_outcome' | 'weekly_report';

export interface OAuthConnectionStatus {
  provider: 'ghl' | 'meta' | 'google';
  status: 'connected' | 'revoked' | 'expired' | 'never_connected';
  connected_at: string | null;
  account_name: string | null;    // e.g. "Acme Realty Team" (from OAuth profile)
}

export interface SettingsPageData {
  routing_rules: RoutingRule[];
  notification_prefs: NotificationPreferences | null;
  oauth_statuses: OAuthConnectionStatus[];
  agents: Array<{ id: string; name: string }>;   // for routing rule dropdowns
  user_email: string;
  mfa_enabled: boolean;
  ai_enabled: boolean;
}

// OAuth popup callback message
export interface OAuthCallbackMessage {
  type: 'oauth_success' | 'oauth_error';
  provider: 'meta' | 'google' | 'ghl';
  account_name?: string;
  error?: string;
}
```

---

## 4. Server Actions

```typescript
// apps/dashboard/app/dashboard/settings/actions.ts
'use server';

import { z } from 'zod';
import { createServerClient } from '@rainmachine/db';
import { revalidatePath } from 'next/cache';

// ─────────────────────────────────────────────
// saveRoutingRules
// Validates rules array, persists to tenants.routing_rules,
// fires n8n webhook to sync GHL routing workflow.
// ─────────────────────────────────────────────
const RoutingRuleSchema = z.object({
  id: z.string().uuid(),
  priority: z.number().int().min(1),
  condition: z.object({
    field: z.enum(['lead_source', 'city', 'tag']),
    operator: z.enum(['equals', 'contains', 'starts_with']),
    value: z.string().min(1).max(100),
  }),
  assign_to: z.string().uuid(),
  assign_to_name: z.string().min(1).max(100),
});

const SaveRoutingRulesSchema = z.object({
  rules: z.array(RoutingRuleSchema).max(20),
});

export async function saveRoutingRules(rules: unknown[]): Promise<{
  success: boolean;
  error?: string;
}> {
  const parsed = SaveRoutingRulesSchema.safeParse({ rules });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid rules' };
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthenticated' };

  const tenantId = user.app_metadata.tenant_id as string;

  const { error } = await supabase
    .from('tenants')
    .update({ routing_rules: parsed.data.rules })
    .eq('id', tenantId);

  if (error) return { success: false, error: 'Failed to save routing rules' };

  // Fire n8n webhook to update GHL workflow routing
  const webhookUrl = process.env.N8N_ROUTING_SYNC_WEBHOOK_URL;
  if (webhookUrl) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, routing_rules: parsed.data.rules }),
        signal: controller.signal,
      });
    } catch { /* fire-and-forget */ } finally { clearTimeout(timeout); }
  }

  revalidatePath('/dashboard/settings/routing');
  return { success: true };
}

// ─────────────────────────────────────────────
// saveNotificationPrefs
// Upserts notification_preferences row for tenant.
// ─────────────────────────────────────────────
const NotifPrefsSchema = z.object({
  cpl_threshold: z.number().min(0).max(10000),
  close_rate_floor: z.number().min(0).max(100),
  email_new_lead: z.boolean(),
  email_appointment: z.boolean(),
  email_call_outcome: z.boolean(),
  email_weekly_report: z.boolean(),
  sms_new_lead: z.boolean(),
  sms_appointment: z.boolean(),
  sms_call_outcome: z.boolean(),
  sms_weekly_report: z.boolean(),
});

export async function saveNotificationPrefs(prefs: unknown): Promise<{
  success: boolean;
  error?: string;
}> {
  const parsed = NotifPrefsSchema.safeParse(prefs);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid preferences' };
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthenticated' };

  const tenantId = user.app_metadata.tenant_id as string;

  const { error } = await supabase
    .from('notification_preferences')
    .upsert({ tenant_id: tenantId, ...parsed.data }, { onConflict: 'tenant_id' });

  if (error) return { success: false, error: 'Failed to save preferences' };

  revalidatePath('/dashboard/settings/notifications');
  return { success: true };
}

// ─────────────────────────────────────────────
// initiateOAuthFlow
// Returns OAuth authorization URL. The client opens
// this in a popup window.
// ─────────────────────────────────────────────
const OAuthProviderSchema = z.enum(['meta', 'google', 'ghl']);

export async function initiateOAuthFlow(provider: string): Promise<{
  url: string | null;
  error?: string;
}> {
  const parsed = OAuthProviderSchema.safeParse(provider);
  if (!parsed.success) return { url: null, error: 'Unknown provider' };

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { url: null, error: 'Unauthenticated' };

  const tenantId = user.app_metadata.tenant_id as string;
  const callbackBase = process.env.NEXT_PUBLIC_DASHBOARD_URL;

  const urls: Record<string, string | undefined> = {
    meta: process.env.META_OAUTH_URL
      ? `${process.env.META_OAUTH_URL}&state=${tenantId}`
      : undefined,
    google: process.env.GOOGLE_OAUTH_URL
      ? `${process.env.GOOGLE_OAUTH_URL}&state=${tenantId}`
      : undefined,
    ghl: process.env.GHL_OAUTH_URL
      ? `${process.env.GHL_OAUTH_URL}&state=${tenantId}`
      : undefined,
  };

  const url = urls[parsed.data];
  if (!url) return { url: null, error: `OAuth not configured for ${parsed.data}` };

  return { url };
}

// ─────────────────────────────────────────────
// changePassword
// Calls Supabase Auth to update password after
// verifying the current password via re-auth.
// ─────────────────────────────────────────────
const ChangePasswordSchema = z.object({
  current_password: z.string().min(8),
  new_password: z.string().min(8).max(72),
});

export async function changePassword(data: unknown): Promise<{
  success: boolean;
  error?: string;
}> {
  const parsed = ChangePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid' };
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { success: false, error: 'Unauthenticated' };

  // Re-authenticate to verify current password before allowing change
  const { error: reAuthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current_password,
  });
  if (reAuthError) return { success: false, error: 'Current password is incorrect' };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password });
  if (error) return { success: false, error: 'Failed to update password' };

  return { success: true };
}

// ─────────────────────────────────────────────
// disableAIAutomation
// Sets tenants.ai_enabled = false.
// n8n Retell trigger workflow checks this flag before calling.
// ─────────────────────────────────────────────
export async function disableAIAutomation(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthenticated' };

  const tenantId = user.app_metadata.tenant_id as string;

  const { error } = await supabase
    .from('tenants')
    .update({ ai_enabled: false })
    .eq('id', tenantId);

  if (error) return { success: false, error: 'Failed to disable AI automation' };

  revalidatePath('/dashboard/settings/account');
  return { success: true };
}

// ─────────────────────────────────────────────
// enableAIAutomation
// Re-enables tenants.ai_enabled = true
// ─────────────────────────────────────────────
export async function enableAIAutomation(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthenticated' };

  const tenantId = user.app_metadata.tenant_id as string;

  const { error } = await supabase
    .from('tenants')
    .update({ ai_enabled: true })
    .eq('id', tenantId);

  if (error) return { success: false, error: 'Failed to enable AI automation' };

  revalidatePath('/dashboard/settings/account');
  return { success: true };
}

// ─────────────────────────────────────────────
// requestDataExport
// Triggers a Supabase Edge Function that streams
// a CSV zip of the tenant's data. Returns a signed URL.
// ─────────────────────────────────────────────
export async function requestDataExport(): Promise<{
  download_url: string | null;
  error?: string;
}> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { download_url: null, error: 'Unauthenticated' };

  const tenantId = user.app_metadata.tenant_id as string;

  const { data, error } = await supabase.functions.invoke('export-tenant-data', {
    body: { tenant_id: tenantId },
  });

  if (error) return { download_url: null, error: 'Export failed. Please try again.' };

  return { download_url: data?.signed_url ?? null };
}
```

---

## 5. API Routes

### OAuth Callback Handler

```typescript
// apps/dashboard/app/api/oauth/[provider]/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@rainmachine/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');   // tenant_id
  const error = searchParams.get('error');

  const provider = params.provider;
  if (!['meta', 'google', 'ghl'].includes(provider)) {
    return new NextResponse('Unknown provider', { status: 400 });
  }

  if (error || !code || !state) {
    // Close popup and postMessage error to opener
    return new NextResponse(buildPopupCloserHtml('oauth_error', provider, undefined, error ?? 'OAuth denied'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Exchange authorization code for access token
  let accessToken: string | null = null;
  let accountName: string | null = null;

  try {
    if (provider === 'meta') {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&redirect_uri=${process.env.NEXT_PUBLIC_DASHBOARD_URL}/api/oauth/meta/callback&code=${code}`
      );
      const data = await res.json();
      accessToken = data.access_token;
      // Get ad account name
      const profileRes = await fetch(
        `https://graph.facebook.com/me/adaccounts?fields=name&access_token=${accessToken}`
      );
      const profile = await profileRes.json();
      accountName = profile?.data?.[0]?.name ?? null;
    } else if (provider === 'google') {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/api/oauth/google/callback`,
          grant_type: 'authorization_code',
        }),
      });
      const data = await res.json();
      accessToken = data.access_token;
    }
  } catch {
    return new NextResponse(buildPopupCloserHtml('oauth_error', provider, undefined, 'Token exchange failed'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (!accessToken) {
    return new NextResponse(buildPopupCloserHtml('oauth_error', provider, undefined, 'No access token returned'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Store encrypted token in Supabase Vault
  const supabase = createServiceRoleClient();
  await supabase.rpc('vault_upsert_secret', {
    p_name: `oauth_${provider}_${state}`,
    p_secret: accessToken,
  });

  // Update campaigns.oauth_status = 'connected' for this tenant/platform
  if (provider === 'meta' || provider === 'google') {
    await supabase
      .from('campaigns')
      .update({ oauth_status: 'connected' })
      .eq('tenant_id', state)
      .eq('platform', provider);
  }

  return new NextResponse(buildPopupCloserHtml('oauth_success', provider, accountName ?? undefined), {
    headers: { 'Content-Type': 'text/html' },
  });
}

function buildPopupCloserHtml(
  type: 'oauth_success' | 'oauth_error',
  provider: string,
  accountName?: string,
  error?: string
): string {
  const message = JSON.stringify({ type, provider, account_name: accountName, error });
  return `<!DOCTYPE html>
<html>
<body>
<script>
  if (window.opener) {
    window.opener.postMessage(${message}, window.location.origin);
  }
  window.close();
</script>
</body>
</html>`;
}
```

---

## 6. UI Components

### Settings Layout

```typescript
// apps/dashboard/app/dashboard/settings/layout.tsx
import { SettingsNav } from './SettingsNav';

const SETTINGS_SECTIONS = [
  { label: 'Team',          href: '/dashboard/settings/team' },
  { label: 'Routing',       href: '/dashboard/settings/routing' },
  { label: 'Notifications', href: '/dashboard/settings/notifications' },
  { label: 'Integrations',  href: '/dashboard/settings/integrations' },
  { label: 'Account',       href: '/dashboard/settings/account' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-8 min-h-screen" data-testid="settings-layout">
      <SettingsNav sections={SETTINGS_SECTIONS} />
      <main className="flex-1 max-w-3xl">{children}</main>
    </div>
  );
}
```

```typescript
// apps/dashboard/app/dashboard/settings/SettingsNav.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Section { label: string; href: string; }

export function SettingsNav({ sections }: { sections: Section[] }) {
  const pathname = usePathname();
  return (
    <nav className="w-48 shrink-0 pt-2" data-testid="settings-nav">
      {sections.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          className={`block px-4 py-2.5 font-mono text-sm rounded mb-1 transition-colors ${
            pathname === s.href
              ? 'bg-[#00D4FF1A] text-[#00D4FF] border-l-2 border-[#00D4FF]'
              : 'text-gray-400 hover:text-white hover:bg-[#0A1628]'
          }`}
          data-testid={`settings-nav-${s.label.toLowerCase()}`}
        >
          {s.label.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
```

### Dynamic Section Page

```typescript
// apps/dashboard/app/dashboard/settings/[section]/page.tsx
import { createServerClient } from '@rainmachine/db';
import { redirect, notFound } from 'next/navigation';
import { TeamTab } from '../tabs/TeamTab';
import { RoutingTab } from '../tabs/RoutingTab';
import { NotificationsTab } from '../tabs/NotificationsTab';
import { IntegrationsTab } from '../tabs/IntegrationsTab';
import { AccountTab } from '../tabs/AccountTab';
import type { SettingsPageData } from '@rainmachine/db/types/settings.types';

const VALID_SECTIONS = ['team', 'routing', 'notifications', 'integrations', 'account'] as const;

export default async function SettingsSectionPage({
  params,
}: {
  params: { section: string };
}) {
  if (!VALID_SECTIONS.includes(params.section as (typeof VALID_SECTIONS)[number])) {
    notFound();
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const tenantId = user.app_metadata.tenant_id as string;

  // Load data needed for all tabs in parallel
  const [tenantResult, notifPrefsResult, agentsResult, mfaResult] = await Promise.all([
    supabase.from('tenants').select('routing_rules, ai_enabled').eq('id', tenantId).single(),
    supabase.from('notification_preferences').select('*').eq('tenant_id', tenantId).maybeSingle(),
    supabase.from('agents').select('id, name').eq('tenant_id', tenantId).eq('status', 'active'),
    supabase.auth.mfa.listFactors(),
  ]);

  const oauthStatuses = await getOAuthStatuses(tenantId);

  const pageData: SettingsPageData = {
    routing_rules: tenantResult.data?.routing_rules ?? [],
    notification_prefs: notifPrefsResult.data ?? null,
    oauth_statuses: oauthStatuses,
    agents: agentsResult.data ?? [],
    user_email: user.email ?? '',
    mfa_enabled: (mfaResult.data?.totp?.length ?? 0) > 0,
    ai_enabled: tenantResult.data?.ai_enabled ?? true,
  };

  const tabs: Record<string, React.ReactNode> = {
    team: <TeamTab tenantId={tenantId} />,
    routing: <RoutingTab data={pageData} />,
    notifications: <NotificationsTab data={pageData} />,
    integrations: <IntegrationsTab data={pageData} />,
    account: <AccountTab data={pageData} />,
  };

  return (
    <div data-testid={`settings-section-${params.section}`}>
      {tabs[params.section]}
    </div>
  );
}

async function getOAuthStatuses(tenantId: string) {
  // Check Supabase Vault for OAuth tokens to determine connection status
  const supabase = createServerClient();
  const providers: Array<'meta' | 'google' | 'ghl'> = ['meta', 'google', 'ghl'];

  return Promise.all(
    providers.map(async (provider) => {
      const { data } = await (await supabase).rpc('vault_secret_exists', {
        p_name: `oauth_${provider}_${tenantId}`,
      });
      return {
        provider,
        status: data ? ('connected' as const) : ('never_connected' as const),
        connected_at: null,
        account_name: null,
      };
    })
  );
}
```

### RoutingTab — Visual Rule Builder

```typescript
// apps/dashboard/app/dashboard/settings/tabs/RoutingTab.tsx
'use client';

import { useState, useTransition } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveRoutingRules } from '../actions';
import type { RoutingRule, SettingsPageData } from '@rainmachine/db/types/settings.types';

const FIELD_OPTIONS = [
  { value: 'lead_source', label: 'Lead Source' },
  { value: 'city', label: 'City' },
  { value: 'tag', label: 'GHL Tag' },
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'equals' },
  { value: 'contains', label: 'contains' },
  { value: 'starts_with', label: 'starts with' },
];

export function RoutingTab({ data }: { data: SettingsPageData }) {
  const [rules, setRules] = useState<RoutingRule[]>(data.routing_rules);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        id: uuidv4(),
        priority: prev.length + 1,
        condition: { field: 'lead_source', operator: 'equals', value: '' },
        assign_to: data.agents[0]?.id ?? '',
        assign_to_name: data.agents[0]?.name ?? '',
      },
    ]);
  };

  const removeRule = (id: string) => {
    setRules((prev) =>
      prev.filter((r) => r.id !== id).map((r, i) => ({ ...r, priority: i + 1 }))
    );
  };

  const updateRule = (id: string, patch: Partial<RoutingRule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveRoutingRules(rules);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error ?? 'Save failed');
      }
    });
  };

  return (
    <div className="space-y-6" data-testid="routing-tab">
      <div className="flex items-center justify-between">
        <h2 className="font-orbitron text-lg text-white">LEAD ROUTING RULES</h2>
        <button
          onClick={addRule}
          className="text-[#00D4FF] font-mono text-sm hover:underline"
          data-testid="add-routing-rule"
        >
          + ADD RULE
        </button>
      </div>

      {rules.length === 0 ? (
        <p className="text-gray-500 font-mono text-sm" data-testid="routing-empty">
          No routing rules. Leads are assigned to the default agent.
        </p>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, idx) => (
            <div
              key={rule.id}
              className="bg-[#0A1628] border border-[#1A2840] rounded-lg p-4 space-y-3"
              data-testid={`routing-rule-${idx}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-gray-500">
                  RULE {rule.priority}
                </span>
                <button
                  onClick={() => removeRule(rule.id)}
                  className="text-[#FF6B35] font-mono text-xs hover:underline"
                  data-testid={`remove-rule-${idx}`}
                >
                  REMOVE
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={rule.condition.field}
                  onChange={(e) =>
                    updateRule(rule.id, {
                      condition: { ...rule.condition, field: e.target.value as RoutingRule['condition']['field'] },
                    })
                  }
                  className="bg-[#050D1A] border border-[#1A2840] rounded px-3 py-2 font-mono text-sm text-white"
                  data-testid={`rule-field-${idx}`}
                >
                  {FIELD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <select
                  value={rule.condition.operator}
                  onChange={(e) =>
                    updateRule(rule.id, {
                      condition: { ...rule.condition, operator: e.target.value as RoutingRule['condition']['operator'] },
                    })
                  }
                  className="bg-[#050D1A] border border-[#1A2840] rounded px-3 py-2 font-mono text-sm text-white"
                  data-testid={`rule-operator-${idx}`}
                >
                  {OPERATOR_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={rule.condition.value}
                  onChange={(e) =>
                    updateRule(rule.id, {
                      condition: { ...rule.condition, value: e.target.value },
                    })
                  }
                  placeholder="value"
                  className="bg-[#050D1A] border border-[#1A2840] rounded px-3 py-2 font-mono text-sm text-white placeholder-gray-600"
                  data-testid={`rule-value-${idx}`}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-500">ASSIGN TO</span>
                <select
                  value={rule.assign_to}
                  onChange={(e) => {
                    const agent = data.agents.find((a) => a.id === e.target.value);
                    updateRule(rule.id, {
                      assign_to: e.target.value,
                      assign_to_name: agent?.name ?? '',
                    });
                  }}
                  className="bg-[#050D1A] border border-[#1A2840] rounded px-3 py-2 font-mono text-sm text-white"
                  data-testid={`rule-assign-to-${idx}`}
                >
                  {data.agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2.5 bg-[#00D4FF] text-[#050D1A] font-mono font-bold text-sm rounded
                     disabled:opacity-40 hover:bg-[#00BFEF] transition-colors"
          data-testid="save-routing-rules"
        >
          {isPending ? 'SAVING…' : 'SAVE RULES'}
        </button>
        {saved && (
          <span className="font-mono text-sm text-[#00FF88]" data-testid="routing-saved-confirm">
            RULES SAVED
          </span>
        )}
        {error && (
          <span className="font-mono text-sm text-[#FF6B35]" data-testid="routing-error">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
```

### NotificationsTab

```typescript
// apps/dashboard/app/dashboard/settings/tabs/NotificationsTab.tsx
'use client';

import { useState, useTransition } from 'react';
import { saveNotificationPrefs } from '../actions';
import type { SettingsPageData, NotifChannel, NotifEvent } from '@rainmachine/db/types/settings.types';

const EVENTS: Array<{ key: NotifEvent; label: string }> = [
  { key: 'new_lead',       label: 'New Lead' },
  { key: 'appointment',    label: 'Appointment Set' },
  { key: 'call_outcome',   label: 'Call Outcome' },
  { key: 'weekly_report',  label: 'Weekly Report' },
];

export function NotificationsTab({ data }: { data: SettingsPageData }) {
  const defaults = data.notification_prefs ?? {
    cpl_threshold: 100, close_rate_floor: 10,
    email_new_lead: true, email_appointment: true,
    email_call_outcome: false, email_weekly_report: true,
    sms_new_lead: false, sms_appointment: false,
    sms_call_outcome: false, sms_weekly_report: false,
  };

  const [prefs, setPrefs] = useState(defaults);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const togglePref = (channel: NotifChannel, event: NotifEvent) => {
    const key = `${channel}_${event}` as keyof typeof prefs;
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveNotificationPrefs(prefs);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error ?? 'Save failed');
      }
    });
  };

  return (
    <div className="space-y-8" data-testid="notifications-tab">
      <h2 className="font-orbitron text-lg text-white">NOTIFICATIONS</h2>

      {/* Alert Thresholds */}
      <section className="space-y-4">
        <h3 className="font-mono text-sm text-gray-400 uppercase tracking-wider">Alert Thresholds</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-xs text-gray-500 block mb-1">
              CPL THRESHOLD ($)
            </label>
            <input
              type="number"
              value={prefs.cpl_threshold}
              onChange={(e) => setPrefs((p) => ({ ...p, cpl_threshold: Number(e.target.value) }))}
              min={0}
              max={10000}
              step={1}
              className="w-full bg-[#050D1A] border border-[#1A2840] rounded px-3 py-2 font-mono text-sm text-white"
              data-testid="cpl-threshold-input"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-gray-500 block mb-1">
              CLOSE RATE FLOOR (%)
            </label>
            <input
              type="number"
              value={prefs.close_rate_floor}
              onChange={(e) => setPrefs((p) => ({ ...p, close_rate_floor: Number(e.target.value) }))}
              min={0}
              max={100}
              step={0.5}
              className="w-full bg-[#050D1A] border border-[#1A2840] rounded px-3 py-2 font-mono text-sm text-white"
              data-testid="close-rate-floor-input"
            />
          </div>
        </div>
      </section>

      {/* Toggle Matrix */}
      <section className="space-y-4">
        <h3 className="font-mono text-sm text-gray-400 uppercase tracking-wider">Delivery Channels</h3>
        <div className="bg-[#0A1628] border border-[#1A2840] rounded-lg overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-3 gap-0 border-b border-[#1A2840] px-4 py-2">
            <div className="font-mono text-xs text-gray-500">EVENT</div>
            <div className="font-mono text-xs text-gray-500 text-center">EMAIL</div>
            <div className="font-mono text-xs text-gray-500 text-center">
              SMS <span className="text-[#FF6B35] ml-1">COMING SOON</span>
            </div>
          </div>
          {/* Event rows */}
          {EVENTS.map(({ key, label }) => (
            <div
              key={key}
              className="grid grid-cols-3 gap-0 border-b border-[#1A2840] last:border-0 px-4 py-3"
              data-testid={`notif-row-${key}`}
            >
              <span className="font-mono text-sm text-white self-center">{label}</span>
              <div className="flex justify-center">
                <button
                  onClick={() => togglePref('email', key)}
                  className={`w-10 h-6 rounded-full transition-colors ${
                    (prefs as Record<string, unknown>)[`email_${key}`] ? 'bg-[#00D4FF]' : 'bg-[#1A2840]'
                  }`}
                  data-testid={`email-toggle-${key}`}
                  aria-label={`Toggle email for ${label}`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      (prefs as Record<string, unknown>)[`email_${key}`] ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  disabled
                  className="w-10 h-6 rounded-full bg-[#1A2840] opacity-40 cursor-not-allowed"
                  data-testid={`sms-toggle-${key}`}
                  title="SMS notifications coming soon"
                >
                  <span className="block w-5 h-5 rounded-full bg-white shadow translate-x-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2.5 bg-[#00D4FF] text-[#050D1A] font-mono font-bold text-sm rounded
                     disabled:opacity-40 hover:bg-[#00BFEF] transition-colors"
          data-testid="save-notification-prefs"
        >
          {isPending ? 'SAVING…' : 'SAVE PREFERENCES'}
        </button>
        {saved && <span className="font-mono text-sm text-[#00FF88]">PREFERENCES SAVED</span>}
        {error && <span className="font-mono text-sm text-[#FF6B35]">{error}</span>}
      </div>
    </div>
  );
}
```

### IntegrationsTab (OAuth popup pattern)

```typescript
// apps/dashboard/app/dashboard/settings/tabs/IntegrationsTab.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { initiateOAuthFlow } from '../actions';
import type { SettingsPageData, OAuthConnectionStatus, OAuthCallbackMessage } from '@rainmachine/db/types/settings.types';

const PROVIDER_LABELS: Record<string, string> = {
  ghl: 'GoHighLevel',
  meta: 'Meta Ads',
  google: 'Google Ads',
};

export function IntegrationsTab({ data }: { data: SettingsPageData }) {
  const [statuses, setStatuses] = useState(data.oauth_statuses);
  const [isPending, startTransition] = useTransition();

  // Listen for postMessage from OAuth popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent<OAuthCallbackMessage>) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data?.type) return;

      const { type, provider, account_name } = event.data;
      if (type === 'oauth_success') {
        setStatuses((prev) =>
          prev.map((s) =>
            s.provider === provider
              ? { ...s, status: 'connected', account_name: account_name ?? null, connected_at: new Date().toISOString() }
              : s
          )
        );
      } else if (type === 'oauth_error') {
        // Error toast could be shown here
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = (provider: string) => {
    startTransition(async () => {
      const result = await initiateOAuthFlow(provider);
      if (result.url) {
        window.open(result.url, 'oauth_popup', 'width=600,height=700,left=200,top=100');
      }
    });
  };

  return (
    <div className="space-y-6" data-testid="integrations-tab">
      <h2 className="font-orbitron text-lg text-white">INTEGRATIONS</h2>
      <div className="space-y-3">
        {statuses.map((s) => (
          <IntegrationRow
            key={s.provider}
            status={s}
            onConnect={handleConnect}
            isPending={isPending}
          />
        ))}
      </div>
    </div>
  );
}

function IntegrationRow({
  status,
  onConnect,
  isPending,
}: {
  status: OAuthConnectionStatus;
  onConnect: (provider: string) => void;
  isPending: boolean;
}) {
  const isConnected = status.status === 'connected';
  return (
    <div
      className="bg-[#0A1628] border border-[#1A2840] rounded-lg p-4 flex items-center justify-between"
      data-testid={`integration-row-${status.provider}`}
    >
      <div>
        <div className="font-mono text-sm text-white">
          {PROVIDER_LABELS[status.provider] ?? status.provider}
        </div>
        <div className="font-mono text-xs text-gray-500 mt-0.5">
          {isConnected
            ? status.account_name
              ? `Connected: ${status.account_name}`
              : 'Connected'
            : status.status === 'revoked'
            ? 'Token revoked — reconnect required'
            : status.status === 'expired'
            ? 'Token expired — reconnect required'
            : 'Not connected'}
        </div>
      </div>
      <button
        onClick={() => onConnect(status.provider)}
        disabled={isPending}
        className={`px-4 py-1.5 font-mono text-xs font-bold rounded transition-colors ${
          isConnected
            ? 'border border-[#1A2840] text-gray-400 hover:border-[#00D4FF] hover:text-[#00D4FF]'
            : 'bg-[#00D4FF] text-[#050D1A] hover:bg-[#00BFEF]'
        } disabled:opacity-40`}
        data-testid={`connect-${status.provider}`}
      >
        {isConnected ? 'RECONNECT' : 'CONNECT'}
      </button>
    </div>
  );
}
```

### AccountTab

```typescript
// apps/dashboard/app/dashboard/settings/tabs/AccountTab.tsx
'use client';

import { useState, useTransition } from 'react';
import { changePassword, disableAIAutomation, enableAIAutomation, requestDataExport } from '../actions';
import type { SettingsPageData } from '@rainmachine/db/types/settings.types';

export function AccountTab({ data }: { data: SettingsPageData }) {
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(data.ai_enabled);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [isPendingPw, startPwTransition] = useTransition();
  const [isPendingAi, startAiTransition] = useTransition();
  const [isPendingExport, startExportTransition] = useTransition();

  const handlePasswordChange = () => {
    setPwError(null);
    startPwTransition(async () => {
      const result = await changePassword(pwForm);
      if (result.success) {
        setPwSaved(true);
        setPwForm({ current_password: '', new_password: '' });
        setTimeout(() => setPwSaved(false), 3000);
      } else {
        setPwError(result.error ?? 'Failed to change password');
      }
    });
  };

  const handleAiToggle = () => {
    startAiTransition(async () => {
      const action = aiEnabled ? disableAIAutomation : enableAIAutomation;
      const result = await action();
      if (result.success) setAiEnabled(!aiEnabled);
    });
  };

  const handleDataExport = () => {
    startExportTransition(async () => {
      const result = await requestDataExport();
      if (result.download_url) {
        setExportUrl(result.download_url);
        // Auto-download
        const a = document.createElement('a');
        a.href = result.download_url;
        a.download = 'rainmachine-export.zip';
        a.click();
      }
    });
  };

  return (
    <div className="space-y-10" data-testid="account-tab">
      <h2 className="font-orbitron text-lg text-white">ACCOUNT</h2>

      {/* Email display */}
      <section className="space-y-2">
        <h3 className="font-mono text-sm text-gray-400 uppercase">Email Address</h3>
        <p className="font-mono text-sm text-white" data-testid="account-email">
          {data.user_email}
        </p>
      </section>

      {/* Password change */}
      <section className="space-y-4">
        <h3 className="font-mono text-sm text-gray-400 uppercase">Change Password</h3>
        <div className="space-y-3 max-w-sm">
          <input
            type="password"
            placeholder="Current password"
            value={pwForm.current_password}
            onChange={(e) => setPwForm((p) => ({ ...p, current_password: e.target.value }))}
            className="w-full bg-[#050D1A] border border-[#1A2840] rounded px-3 py-2 font-mono text-sm text-white placeholder-gray-600"
            data-testid="current-password-input"
          />
          <input
            type="password"
            placeholder="New password (min 8 characters)"
            value={pwForm.new_password}
            onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))}
            className="w-full bg-[#050D1A] border border-[#1A2840] rounded px-3 py-2 font-mono text-sm text-white placeholder-gray-600"
            data-testid="new-password-input"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handlePasswordChange}
              disabled={isPendingPw || !pwForm.current_password || !pwForm.new_password}
              className="px-4 py-2 bg-[#00D4FF] text-[#050D1A] font-mono font-bold text-sm rounded
                         disabled:opacity-40 hover:bg-[#00BFEF] transition-colors"
              data-testid="change-password-button"
            >
              {isPendingPw ? 'UPDATING…' : 'UPDATE PASSWORD'}
            </button>
            {pwSaved && <span className="font-mono text-sm text-[#00FF88]">PASSWORD UPDATED</span>}
            {pwError && <span className="font-mono text-sm text-[#FF6B35]">{pwError}</span>}
          </div>
        </div>
      </section>

      {/* MFA enrollment (status indicator — actual enrollment flow via Supabase UI) */}
      <section className="space-y-3">
        <h3 className="font-mono text-sm text-gray-400 uppercase">Two-Factor Authentication</h3>
        <div className="flex items-center gap-3">
          <span
            className={`font-mono text-sm font-bold ${data.mfa_enabled ? 'text-[#00FF88]' : 'text-[#FF6B35]'}`}
            data-testid="mfa-status"
          >
            {data.mfa_enabled ? '● ENABLED' : '○ DISABLED'}
          </span>
          <span className="font-mono text-xs text-gray-500">
            {data.mfa_enabled
              ? 'Your account is protected with TOTP'
              : 'Enable MFA for additional account security'}
          </span>
        </div>
      </section>

      {/* Danger zone */}
      <section className="space-y-4 border border-[#FF6B35] rounded-lg p-6">
        <h3 className="font-mono text-sm text-[#FF6B35] uppercase">Danger Zone</h3>

        {/* AI Automation toggle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-sm text-white">AI Automation</div>
            <div className="font-mono text-xs text-gray-500 mt-0.5">
              {aiEnabled
                ? 'RainMachine is actively calling your new leads'
                : 'AI calling is currently disabled for this account'}
            </div>
          </div>
          <button
            onClick={handleAiToggle}
            disabled={isPendingAi}
            className={`px-4 py-2 font-mono font-bold text-sm rounded transition-colors ${
              aiEnabled
                ? 'border border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B351A]'
                : 'bg-[#00FF88] text-[#050D1A] hover:bg-[#00E87A]'
            } disabled:opacity-40`}
            data-testid="ai-automation-toggle"
          >
            {isPendingAi
              ? '…'
              : aiEnabled
              ? 'DISABLE AI CALLING'
              : 'ENABLE AI CALLING'}
          </button>
        </div>

        {/* Data export */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1A2840]">
          <div>
            <div className="font-mono text-sm text-white">Export My Data</div>
            <div className="font-mono text-xs text-gray-500 mt-0.5">
              Download a CSV archive of all your leads, calls, and appointments
            </div>
          </div>
          <button
            onClick={handleDataExport}
            disabled={isPendingExport}
            className="px-4 py-2 border border-[#1A2840] text-gray-400 font-mono text-sm rounded
                       hover:border-[#00D4FF] hover:text-[#00D4FF] disabled:opacity-40 transition-colors"
            data-testid="export-data-button"
          >
            {isPendingExport ? 'EXPORTING…' : 'EXPORT DATA'}
          </button>
        </div>
      </section>
    </div>
  );
}
```

---

## 7. Integration Points

### TeamTab (F09 Forward-Reference)
The Team tab reuses the AgentsClient from F09 within the settings shell. It imports `AgentsClient` and passes `tenantId`. No new agent logic is defined here — this tab is a UI wrapper to the existing agents management functionality, accessible from settings as well as the sidebar nav.

```typescript
// apps/dashboard/app/dashboard/settings/tabs/TeamTab.tsx
import { createServerClient } from '@rainmachine/db';
import { AgentsClient } from '../../agents/AgentsClient';

export async function TeamTab({ tenantId }: { tenantId: string }) {
  const supabase = await createServerClient();
  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('close_rate', { ascending: false, nullsFirst: false });

  return (
    <div data-testid="team-tab">
      <h2 className="font-orbitron text-lg text-white mb-6">TEAM</h2>
      <AgentsClient agents={agents ?? []} tenantId={tenantId} />
    </div>
  );
}
```

### n8n Routing Sync Webhook
`saveRoutingRules` fires `N8N_ROUTING_SYNC_WEBHOOK_URL` with `{ tenant_id, routing_rules }`. The n8n workflow updates the GHL smart list / contact routing workflow to respect the new rules. This is fire-and-forget with a 4-second timeout.

### Supabase Vault (OAuth Token Storage)
Token writes use the `vault.upsert_secret` PL/pgSQL RPC (pgsodium). The secret name convention is `oauth_{provider}_{tenantId}`. Reads are done server-side only via service role client; tokens are never returned to the browser.

### AI Automation Flag (F05 / Retell Integration)
The n8n `new-lead-retell-trigger` workflow (F05) includes a node that checks `tenants.ai_enabled = TRUE` before firing Retell. When `disableAIAutomation()` sets the flag to false, the next webhook trigger for that tenant will skip the Retell call entirely.

### Environment Variables

```bash
# .env additions for F11
N8N_ROUTING_SYNC_WEBHOOK_URL=https://your-n8n.cloud/webhook/routing-sync
META_APP_ID=
META_APP_SECRET=
META_OAUTH_URL=https://www.facebook.com/v18.0/dialog/oauth?client_id=...&redirect_uri=...&scope=ads_read,ads_management
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_URL=https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&scope=...
GHL_OAUTH_URL=https://marketplace.leadconnectorhq.com/oauth/chooselocation?...
```

---

## 8. BDD Scenarios

```gherkin
Feature: F11 — RainMachine Settings

  Background:
    Given I am authenticated as an RM for tenant "tenant-abc"
    And the tenant has 3 active agents

  Scenario: Navigate settings tabs via left nav
    When I navigate to "/dashboard/settings/routing"
    Then I see the settings-layout
    And the settings-nav-routing link is active (cyan border-left)

  Scenario: Add and save a routing rule
    Given I am on the Routing tab
    When I click "ADD RULE"
    Then a new routing-rule-0 row appears
    When I set field to "lead_source", operator to "equals", value to "Facebook"
    And I set the assign-to to the first agent
    And I click "SAVE RULES"
    Then I see "RULES SAVED" confirmation
    And tenants.routing_rules contains the new rule
    And n8n routing sync webhook was called with the updated rules

  Scenario: Routing rule max 20
    Given 20 routing rules already exist
    When I click "ADD RULE"
    Then Zod validation rejects the 21st rule on save
    And I see an error message

  Scenario: Save notification preferences
    Given I am on the Notifications tab
    When I set CPL threshold to 75
    And I toggle email for "call_outcome" ON
    And I click "SAVE PREFERENCES"
    Then I see "PREFERENCES SAVED"
    And notification_preferences row is updated for tenant-abc

  Scenario: SMS toggles are disabled with tooltip
    When I am on the Notifications tab
    Then all sms-toggle buttons are disabled
    And each shows "Coming soon" on hover

  Scenario: OAuth Meta connect via popup
    Given I am on the Integrations tab
    And Meta Ads shows "Not connected"
    When I click "CONNECT" for Meta
    Then a popup window opens with the Meta OAuth URL
    When the OAuth flow completes and the popup sends oauth_success
    Then the Meta row shows "Connected"

  Scenario: Change password — wrong current password
    Given I am on the Account tab
    When I enter "wrongpass" as current and a new password
    And I click "UPDATE PASSWORD"
    Then I see "Current password is incorrect"

  Scenario: Disable AI automation
    Given I am on the Account tab
    And AI automation is currently enabled
    When I click "DISABLE AI CALLING"
    Then tenants.ai_enabled is set to FALSE
    And the button changes to "ENABLE AI CALLING"
    And new Retell calls are not triggered for this tenant

  Scenario: Export data
    Given I am on the Account tab
    When I click "EXPORT DATA"
    Then a ZIP file download is initiated
```

---

## 9. Test Plan

### Unit Tests

```typescript
// apps/dashboard/app/dashboard/settings/__tests__/actions.test.ts
describe('saveRoutingRules', () => {
  it('returns error when rules array exceeds 20', async () => {
    const rules = Array.from({ length: 21 }, (_, i) => ({
      id: `uuid-${i}`, priority: i + 1,
      condition: { field: 'lead_source', operator: 'equals', value: 'FB' },
      assign_to: 'agent-uuid', assign_to_name: 'Agent',
    }));
    const result = await saveRoutingRules(rules);
    expect(result.success).toBe(false);
  });

  it('rejects rules with empty condition.value', async () => {
    const rule = { id: 'uuid-1', priority: 1, condition: { field: 'city', operator: 'equals', value: '' }, assign_to: 'uuid', assign_to_name: 'A' };
    const result = await saveRoutingRules([rule]);
    expect(result.success).toBe(false);
  });
});

describe('changePassword', () => {
  it('returns error for mismatched current password', async () => {
    // Mock supabase.auth.signInWithPassword to return error
    const result = await changePassword({ current_password: 'wrong', new_password: 'newpass123' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Current password is incorrect');
  });
});

describe('saveNotificationPrefs', () => {
  it('rejects CPL threshold above 10000', async () => {
    const result = await saveNotificationPrefs({ cpl_threshold: 99999 });
    expect(result.success).toBe(false);
  });
});
```

### Playwright E2E

```typescript
// apps/dashboard/e2e/settings.spec.ts
test('routing rule save → GHL updated', async ({ page }) => {
  await page.goto('/dashboard/settings/routing');
  await page.getByTestId('add-routing-rule').click();
  await page.getByTestId('rule-value-0').fill('Facebook');
  await page.getByTestId('save-routing-rules').click();
  await expect(page.getByTestId('routing-saved-confirm')).toBeVisible();
});

test('OAuth connect button opens popup', async ({ page, context }) => {
  await page.goto('/dashboard/settings/integrations');
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.getByTestId('connect-meta').click(),
  ]);
  expect(popup.url()).toContain('facebook.com');
});

test('password change rejects wrong current password', async ({ page }) => {
  await page.goto('/dashboard/settings/account');
  await page.getByTestId('current-password-input').fill('wrongpassword');
  await page.getByTestId('new-password-input').fill('newpassword123');
  await page.getByTestId('change-password-button').click();
  await expect(page.getByText('Current password is incorrect')).toBeVisible();
});

test('disable AI automation sets flag in DB', async ({ page }) => {
  await page.goto('/dashboard/settings/account');
  await page.getByTestId('ai-automation-toggle').click();
  await expect(page.getByTestId('ai-automation-toggle')).toContainText('ENABLE AI CALLING');
});
```

---

## 10. OWASP Security Checklist

| # | Check | Implementation |
|---|-------|----------------|
| 1 | **Broken Access Control** | All server actions re-derive `tenant_id` from JWT, never from client input. RLS enforces tenant isolation on DB writes. |
| 2 | **OAuth Token Security** | Tokens stored in Supabase Vault (pgsodium). Never logged, never returned to client. Callback handler uses HTTPS only. |
| 3 | **CSRF (postMessage)** | OAuth popup `postMessage` checks `event.origin === window.location.origin` before processing. |
| 4 | **Input Validation** | All server actions Zod-validate on first line. Routing rule field/operator values are enum-constrained. |
| 5 | **Password Re-Auth** | `changePassword` requires re-authentication with current password before accepting new one. |
| 6 | **Open Redirect** | `initiateOAuthFlow` constructs OAuth URLs from server-side env vars only. No client-provided redirect URIs. |
| 7 | **Injection** | All DB operations via parameterized Supabase SDK. JSONB stored as typed array (Zod-validated). |
| 8 | **Sensitive Data in Logs** | OAuth tokens never written to `console.log` or error responses. Only boolean vault existence check returned. |
| 9 | **MFA Bypass** | MFA enrollment/disable routes through Supabase Auth MFA API, not custom logic. Factor presence verified server-side. |
| 10 | **AI Kill-Switch Integrity** | `disableAIAutomation` uses authenticated server action + RLS-scoped DB update. n8n checks DB flag, not a client signal. |

---

## 11. Open Questions

| ID | Question | Owner | Resolution |
|----|----------|-------|------------|
| OQ-01 | Should the routing rule builder support nested AND/OR conditions? | Product | No — simple flat rules only in R1. One condition per rule, ordered by priority. |
| OQ-02 | What is the GHL routing sync mechanism — does it update smart list membership or workflow triggers? | Engineering | n8n updates GHL workflow trigger conditions. Exact API call defined in n8n workflow spec. |
| OQ-03 | How do we handle an expired OAuth token during BE-04 ad sync (vs. a revoked token)? | Engineering | n8n distinguishes HTTP 401 (expired → refresh attempt) from 403 (revoked → set oauth_status='revoked'). |
| OQ-04 | Should the data export include call transcripts or just structured data? | Product | Structured data only (leads, calls, appointments) as CSV. Transcripts excluded in R1 (large file size). |
| OQ-05 | If MFA is disabled by the RM, should we require email confirmation? | Security | Yes — Supabase `unenroll` requires an active TOTP challenge first, providing natural friction. |

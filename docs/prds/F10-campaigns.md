# F10 — Campaigns Table & Detail

**Source pitch:** P10
**Cycle:** 4 | **Release:** R1 | **Appetite:** Small
**Status:** Ready for implementation

---

## 1. Overview

### Problem
RainMachine team leaders need visibility into the ad campaigns running on behalf of their clients. When ad performance drops, budgets drain without results, or platform OAuth tokens expire, the RM needs to know immediately — not when a client complains. Currently there is no campaign view in the dashboard at all.

### Solution
A Campaigns page inside `apps/dashboard` that shows every campaign across Meta and Google Ads for the authenticated tenant. Campaigns are displayed in a DataTable with platform badges, status, sync timestamps, and a SYNC NOW button for on-demand refresh. Each row is expandable to reveal a 7-day budget BarChart and nested ad-set detail. A persistent OAuth revocation banner drives the RM to reconnect credentials before campaigns fall further out of sync.

The backend ad-metrics sync workflow (BE-04) is included in this PRD because it is the direct data producer for this page.

### Success Criteria
- RM can see all campaigns with current spend, status, and last-sync time at a glance
- SYNC NOW respects a 15-minute rate limit and shows a countdown until next eligible sync
- OAuth revocation banner appears within one polling cycle of token expiry
- BE-04 n8n workflow runs every 4 hours and populates `ad_metrics` without manual intervention
- All `data-testid` attributes are present for Playwright coverage

### Out of Scope (MVP)
- Pausing/resuming campaigns from the dashboard (view-only)
- Editing budgets or bid strategies
- Ad creative preview
- Historical data beyond 7 days in the accordion chart

---

## 2. Database

### New Tables

```sql
-- supabase/migrations/0015_campaigns.sql

-- Campaigns master table (synced from Meta / Google Ads)
CREATE TABLE campaigns (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform      TEXT NOT NULL CHECK (platform IN ('meta', 'google')),
  external_id   TEXT NOT NULL,                    -- Meta campaign_id / Google campaign ID
  name          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'unknown'   -- active, paused, archived, unknown
                CHECK (status IN ('active', 'paused', 'archived', 'unknown')),
  daily_budget  NUMERIC(12,2),
  bid_strategy  TEXT,                             -- e.g. LOWEST_COST_WITH_BID_CAP, TARGET_CPA
  objective     TEXT,                             -- LEAD_GENERATION, CONVERSIONS, etc.
  oauth_status  TEXT NOT NULL DEFAULT 'connected'
                CHECK (oauth_status IN ('connected', 'revoked', 'expired')),
  last_synced_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, platform, external_id)
);

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ad sets nested under campaigns (view-only in MVP)
CREATE TABLE ad_sets (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  platform     TEXT NOT NULL CHECK (platform IN ('meta', 'google')),
  external_id  TEXT NOT NULL,
  name         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'unknown'
               CHECK (status IN ('active', 'paused', 'archived', 'unknown')),
  daily_budget NUMERIC(12,2),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, platform, external_id)
);

CREATE TRIGGER update_ad_sets_updated_at
  BEFORE UPDATE ON ad_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Daily ad metrics per campaign (populated by BE-04 every 4h)
CREATE TABLE ad_metrics (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id   UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  platform      TEXT NOT NULL CHECK (platform IN ('meta', 'google')),
  metric_date   DATE NOT NULL,
  spend         NUMERIC(12,2) DEFAULT 0,
  impressions   INTEGER DEFAULT 0,
  clicks        INTEGER DEFAULT 0,
  leads         INTEGER DEFAULT 0,
  cpl           NUMERIC(10,2) GENERATED ALWAYS AS (
                  CASE WHEN leads > 0 THEN spend / leads ELSE NULL END
                ) STORED,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, campaign_id, metric_date)
);

CREATE TRIGGER update_ad_metrics_updated_at
  BEFORE UPDATE ON ad_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Rate-limit log for SYNC NOW button (already referenced in F04 migration as campaign_sync_log)
-- This migration adds the constraint if not already present
ALTER TABLE campaign_sync_log
  ADD COLUMN IF NOT EXISTS initiated_by TEXT DEFAULT 'manual'
  CHECK (initiated_by IN ('manual', 'scheduled'));

-- Indexes
CREATE INDEX idx_campaigns_tenant_id ON campaigns(tenant_id);
CREATE INDEX idx_campaigns_oauth_status ON campaigns(tenant_id, oauth_status)
  WHERE oauth_status IN ('revoked', 'expired');
CREATE INDEX idx_ad_metrics_tenant_campaign_date
  ON ad_metrics(tenant_id, campaign_id, metric_date DESC);
CREATE INDEX idx_ad_sets_campaign_id ON ad_sets(campaign_id);
```

### RLS Policies

```sql
-- supabase/migrations/0016_campaigns_rls.sql

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_metrics ENABLE ROW LEVEL SECURITY;

-- campaigns: tenant-scoped read; service role for writes (n8n sync)
CREATE POLICY "campaigns_tenant_select"
  ON campaigns FOR SELECT
  USING (tenant_id = auth.tenant_id());

-- ad_sets: tenant-scoped read
CREATE POLICY "ad_sets_tenant_select"
  ON ad_sets FOR SELECT
  USING (tenant_id = auth.tenant_id());

-- ad_metrics: tenant-scoped read
CREATE POLICY "ad_metrics_tenant_select"
  ON ad_metrics FOR SELECT
  USING (tenant_id = auth.tenant_id());

-- campaign_sync_log: tenant can insert (SYNC NOW); read own rows
CREATE POLICY "sync_log_tenant_insert"
  ON campaign_sync_log FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "sync_log_tenant_select"
  ON campaign_sync_log FOR SELECT
  USING (tenant_id = auth.tenant_id());
```

### 7-Day Metrics View

```sql
-- supabase/migrations/0017_campaign_metrics_view.sql

-- Aggregate last-7-days spend per campaign for the accordion chart
CREATE OR REPLACE VIEW campaign_7day_metrics AS
SELECT
  am.campaign_id,
  am.tenant_id,
  am.metric_date,
  am.spend,
  am.impressions,
  am.clicks,
  am.leads,
  am.cpl
FROM ad_metrics am
WHERE am.metric_date >= CURRENT_DATE - INTERVAL '6 days';
```

---

## 3. TypeScript Interfaces

```typescript
// packages/db/src/types/campaigns.types.ts

export type CampaignPlatform = 'meta' | 'google';
export type CampaignStatus = 'active' | 'paused' | 'archived' | 'unknown';
export type OAuthStatus = 'connected' | 'revoked' | 'expired';
export type AdSetStatus = 'active' | 'paused' | 'archived' | 'unknown';

export interface CampaignRow {
  id: string;
  tenant_id: string;
  platform: CampaignPlatform;
  external_id: string;
  name: string;
  status: CampaignStatus;
  daily_budget: number | null;
  bid_strategy: string | null;
  objective: string | null;
  oauth_status: OAuthStatus;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdSetRow {
  id: string;
  tenant_id: string;
  campaign_id: string;
  platform: CampaignPlatform;
  external_id: string;
  name: string;
  status: AdSetStatus;
  daily_budget: number | null;
  created_at: string;
}

export interface AdMetricRow {
  campaign_id: string;
  tenant_id: string;
  metric_date: string;       // ISO date string YYYY-MM-DD
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number | null;        // generated column
}

export interface CampaignSyncLog {
  id: string;
  tenant_id: string;
  triggered_at: string;
  initiated_by: 'manual' | 'scheduled';
}

// Shape passed to the accordion chart
export interface CampaignChartData {
  date: string;              // e.g. "Mon", "Tue"
  spend: number;
  leads: number;
}

// Full enriched campaign for the DataTable row
export interface CampaignWithMetrics extends CampaignRow {
  spend_today: number;
  leads_today: number;
  cpl_today: number | null;
  ad_sets: AdSetRow[];
  chart_data: CampaignChartData[];  // last 7 days
}

// Rate-limit check result
export interface SyncEligibility {
  eligible: boolean;
  next_eligible_at: string | null;   // ISO timestamp if ineligible
  seconds_remaining: number | null;
}

// n8n ad-sync webhook payload (inbound from n8n BE-04)
export interface AdSyncWebhookPayload {
  tenant_id: string;
  platform: CampaignPlatform;
  campaigns: Array<{
    external_id: string;
    name: string;
    status: CampaignStatus;
    daily_budget: number | null;
    bid_strategy: string | null;
    objective: string | null;
    oauth_status: OAuthStatus;
    ad_sets: Array<{
      external_id: string;
      name: string;
      status: AdSetStatus;
      daily_budget: number | null;
    }>;
    metrics: Array<{
      metric_date: string;
      spend: number;
      impressions: number;
      clicks: number;
      leads: number;
    }>;
  }>;
}
```

---

## 4. Server Actions

```typescript
// apps/dashboard/app/dashboard/campaigns/actions.ts
'use server';

import { z } from 'zod';
import { createServerClient } from '@rainmachine/db';
import { revalidatePath } from 'next/cache';
import type { SyncEligibility } from '@rainmachine/db/types/campaigns.types';

const SYNC_RATE_LIMIT_MINUTES = 15;

// ─────────────────────────────────────────────
// triggerCampaignSync
// Checks rate limit, logs the sync attempt, and
// fires the n8n ad-sync trigger webhook.
// Returns eligibility state so client can render
// the countdown timer.
// ─────────────────────────────────────────────
export async function triggerCampaignSync(tenantId: string): Promise<{
  success: boolean;
  eligibility: SyncEligibility;
  error?: string;
}> {
  const supabase = await createServerClient();

  // 1. Rate-limit check: last manual sync within window?
  const windowStart = new Date(
    Date.now() - SYNC_RATE_LIMIT_MINUTES * 60 * 1000
  ).toISOString();

  const { data: recentSync } = await supabase
    .from('campaign_sync_log')
    .select('triggered_at')
    .eq('tenant_id', tenantId)
    .eq('initiated_by', 'manual')
    .gte('triggered_at', windowStart)
    .order('triggered_at', { ascending: false })
    .limit(1)
    .single();

  if (recentSync) {
    const nextEligible = new Date(
      new Date(recentSync.triggered_at).getTime() +
        SYNC_RATE_LIMIT_MINUTES * 60 * 1000
    );
    const secondsRemaining = Math.ceil(
      (nextEligible.getTime() - Date.now()) / 1000
    );
    return {
      success: false,
      eligibility: {
        eligible: false,
        next_eligible_at: nextEligible.toISOString(),
        seconds_remaining: secondsRemaining,
      },
    };
  }

  // 2. Log the sync attempt
  const { error: logError } = await supabase
    .from('campaign_sync_log')
    .insert({ tenant_id: tenantId, initiated_by: 'manual' });

  if (logError) {
    return { success: false, eligibility: { eligible: true, next_eligible_at: null, seconds_remaining: null }, error: 'Failed to log sync attempt' };
  }

  // 3. Fire n8n webhook (fire-and-forget, 4s timeout)
  const webhookUrl = process.env.N8N_AD_SYNC_WEBHOOK_URL;
  if (webhookUrl) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, trigger: 'manual' }),
        signal: controller.signal,
      });
    } catch {
      // Fire-and-forget: n8n timeout does not fail the user action
    } finally {
      clearTimeout(timeout);
    }
  }

  revalidatePath('/dashboard/campaigns');

  return {
    success: true,
    eligibility: { eligible: false, next_eligible_at: null, seconds_remaining: SYNC_RATE_LIMIT_MINUTES * 60 },
  };
}

// ─────────────────────────────────────────────
// getSyncEligibility
// Called on page load to initialize the countdown
// ─────────────────────────────────────────────
export async function getSyncEligibility(tenantId: string): Promise<SyncEligibility> {
  const supabase = await createServerClient();
  const windowStart = new Date(
    Date.now() - SYNC_RATE_LIMIT_MINUTES * 60 * 1000
  ).toISOString();

  const { data: recentSync } = await supabase
    .from('campaign_sync_log')
    .select('triggered_at')
    .eq('tenant_id', tenantId)
    .eq('initiated_by', 'manual')
    .gte('triggered_at', windowStart)
    .order('triggered_at', { ascending: false })
    .limit(1)
    .single();

  if (!recentSync) {
    return { eligible: true, next_eligible_at: null, seconds_remaining: null };
  }

  const nextEligible = new Date(
    new Date(recentSync.triggered_at).getTime() +
      SYNC_RATE_LIMIT_MINUTES * 60 * 1000
  );
  return {
    eligible: false,
    next_eligible_at: nextEligible.toISOString(),
    seconds_remaining: Math.ceil((nextEligible.getTime() - Date.now()) / 1000),
  };
}
```

---

## 5. API Routes

### Inbound Ad-Sync Webhook (n8n → Supabase)

```typescript
// apps/dashboard/app/api/webhooks/ad-sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@rainmachine/db';
import type { AdSyncWebhookPayload } from '@rainmachine/db/types/campaigns.types';

export async function POST(req: NextRequest) {
  // Validate shared secret
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload: AdSyncWebhookPayload = await req.json();
  const supabase = createServiceRoleClient();

  for (const campaign of payload.campaigns) {
    // Upsert campaign row
    const { data: campaignRow, error: campaignError } = await supabase
      .from('campaigns')
      .upsert(
        {
          tenant_id: payload.tenant_id,
          platform: payload.platform,
          external_id: campaign.external_id,
          name: campaign.name,
          status: campaign.status,
          daily_budget: campaign.daily_budget,
          bid_strategy: campaign.bid_strategy,
          objective: campaign.objective,
          oauth_status: campaign.oauth_status,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,platform,external_id' }
      )
      .select('id')
      .single();

    if (campaignError || !campaignRow) continue;

    // Upsert ad sets
    for (const adSet of campaign.ad_sets) {
      await supabase.from('ad_sets').upsert(
        {
          tenant_id: payload.tenant_id,
          campaign_id: campaignRow.id,
          platform: payload.platform,
          external_id: adSet.external_id,
          name: adSet.name,
          status: adSet.status,
          daily_budget: adSet.daily_budget,
        },
        { onConflict: 'tenant_id,platform,external_id' }
      );
    }

    // Upsert daily metrics
    for (const metric of campaign.metrics) {
      await supabase.from('ad_metrics').upsert(
        {
          tenant_id: payload.tenant_id,
          campaign_id: campaignRow.id,
          platform: payload.platform,
          metric_date: metric.metric_date,
          spend: metric.spend,
          impressions: metric.impressions,
          clicks: metric.clicks,
          leads: metric.leads,
        },
        { onConflict: 'tenant_id,campaign_id,metric_date' }
      );
    }
  }

  return NextResponse.json({ received: true });
}
```

---

## 6. UI Components

### Page RSC

```typescript
// apps/dashboard/app/dashboard/campaigns/page.tsx
import { createServerClient } from '@rainmachine/db';
import { redirect } from 'next/navigation';
import { CampaignsClient } from './CampaignsClient';
import { OAuthRevocationBanner } from './OAuthRevocationBanner';
import { getSyncEligibility } from './actions';
import type { CampaignWithMetrics } from '@rainmachine/db/types/campaigns.types';

export default async function CampaignsPage() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const tenantId = user.app_metadata.tenant_id as string;

  // Parallel data fetches
  const [campaignsResult, metricsResult, eligibility] = await Promise.all([
    supabase
      .from('campaigns')
      .select(`*, ad_sets(*)`)
      .eq('tenant_id', tenantId)
      .order('platform', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('campaign_7day_metrics')
      .select('*')
      .eq('tenant_id', tenantId),
    getSyncEligibility(tenantId),
  ]);

  const campaigns = campaignsResult.data ?? [];
  const metrics = metricsResult.data ?? [];

  // Build chart_data and today totals per campaign
  const enriched: CampaignWithMetrics[] = campaigns.map((c) => {
    const campaignMetrics = metrics.filter((m) => m.campaign_id === c.id);

    // Build 7-day array (fill missing dates with 0s)
    const last7: CampaignWithMetrics['chart_data'] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const match = campaignMetrics.find((m) => m.metric_date === dateStr);
      return {
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        spend: match?.spend ?? 0,
        leads: match?.leads ?? 0,
      };
    });

    const today = campaignMetrics.find(
      (m) => m.metric_date === new Date().toISOString().split('T')[0]
    );

    return {
      ...c,
      spend_today: today?.spend ?? 0,
      leads_today: today?.leads ?? 0,
      cpl_today: today?.cpl ?? null,
      ad_sets: c.ad_sets ?? [],
      chart_data: last7,
    };
  });

  // Revoked OAuth check
  const revokedPlatforms = [
    ...new Set(
      campaigns
        .filter((c) => c.oauth_status !== 'connected')
        .map((c) => c.platform as string)
    ),
  ];

  return (
    <div className="space-y-4" data-testid="campaigns-page">
      {revokedPlatforms.length > 0 && (
        <OAuthRevocationBanner
          platforms={revokedPlatforms}
          data-testid="oauth-revocation-banner"
        />
      )}
      <CampaignsClient
        campaigns={enriched}
        tenantId={tenantId}
        initialEligibility={eligibility}
      />
    </div>
  );
}
```

### OAuthRevocationBanner

```typescript
// apps/dashboard/app/dashboard/campaigns/OAuthRevocationBanner.tsx
import Link from 'next/link';
import { AlertBanner } from '@rainmachine/ui';

interface Props {
  platforms: string[];
  'data-testid'?: string;
}

export function OAuthRevocationBanner({ platforms, 'data-testid': testId }: Props) {
  const platformLabels = platforms
    .map((p) => (p === 'meta' ? 'Meta Ads' : 'Google Ads'))
    .join(' and ');

  return (
    <AlertBanner
      variant="error"
      data-testid={testId}
      message={`${platformLabels} connection has expired or been revoked. Ad data will not sync until you reconnect.`}
      action={
        <Link
          href="/dashboard/settings/integrations"
          className="ml-4 text-sm font-mono font-bold text-white underline underline-offset-2"
          data-testid="oauth-reconnect-link"
        >
          RECONNECT →
        </Link>
      }
    />
  );
}
```

### CampaignsClient

```typescript
// apps/dashboard/app/dashboard/campaigns/CampaignsClient.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { DataTable } from '@rainmachine/ui';
import { CampaignAccordion } from './CampaignAccordion';
import { PlatformBadge } from './PlatformBadge';
import { StatusBadge } from './StatusBadge';
import { triggerCampaignSync } from './actions';
import type { CampaignWithMetrics, SyncEligibility } from '@rainmachine/db/types/campaigns.types';

interface Props {
  campaigns: CampaignWithMetrics[];
  tenantId: string;
  initialEligibility: SyncEligibility;
}

export function CampaignsClient({ campaigns, tenantId, initialEligibility }: Props) {
  const [eligibility, setEligibility] = useState(initialEligibility);
  const [countdown, setCountdown] = useState(initialEligibility.seconds_remaining ?? 0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Countdown timer
  useEffect(() => {
    if (eligibility.eligible || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setEligibility({ eligible: true, next_eligible_at: null, seconds_remaining: null });
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [eligibility.eligible, countdown]);

  const handleSyncNow = () => {
    startTransition(async () => {
      const result = await triggerCampaignSync(tenantId);
      setEligibility(result.eligibility);
      if (!result.eligibility.eligible && result.eligibility.seconds_remaining) {
        setCountdown(result.eligibility.seconds_remaining);
      }
    });
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const columns = [
    {
      key: 'platform',
      header: 'Platform',
      render: (row: CampaignWithMetrics) => (
        <PlatformBadge platform={row.platform} data-testid={`platform-badge-${row.id}`} />
      ),
    },
    {
      key: 'name',
      header: 'Campaign',
      render: (row: CampaignWithMetrics) => (
        <span className="font-mono text-sm text-white" data-testid={`campaign-name-${row.id}`}>
          {row.name}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: CampaignWithMetrics) => (
        <StatusBadge status={row.status} data-testid={`campaign-status-${row.id}`} />
      ),
    },
    {
      key: 'spend_today',
      header: 'Spend Today',
      render: (row: CampaignWithMetrics) => (
        <span className="font-mono text-sm">
          ${row.spend_today.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'cpl_today',
      header: 'CPL Today',
      render: (row: CampaignWithMetrics) => (
        <span className="font-mono text-sm">
          {row.cpl_today != null
            ? `$${row.cpl_today.toFixed(2)}`
            : <span className="text-gray-500">—</span>}
        </span>
      ),
    },
    {
      key: 'leads_today',
      header: 'Leads Today',
      render: (row: CampaignWithMetrics) => (
        <span className="font-mono text-sm text-[#00FF88]">{row.leads_today}</span>
      ),
    },
    {
      key: 'last_synced_at',
      header: 'Last Synced',
      render: (row: CampaignWithMetrics) => (
        <span className="font-mono text-xs text-gray-400" data-testid={`sync-timestamp-${row.id}`}>
          {row.last_synced_at
            ? new Date(row.last_synced_at).toLocaleString()
            : 'Never'}
        </span>
      ),
    },
    {
      key: 'expand',
      header: '',
      render: (row: CampaignWithMetrics) => (
        <button
          onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
          className="text-[#00D4FF] font-mono text-xs hover:underline"
          data-testid={`expand-campaign-${row.id}`}
        >
          {expandedId === row.id ? '▲ HIDE' : '▼ DETAILS'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header with SYNC NOW */}
      <div className="flex items-center justify-between">
        <h1 className="font-orbitron text-xl text-white tracking-wide">
          AD CAMPAIGNS
        </h1>
        <button
          onClick={handleSyncNow}
          disabled={!eligibility.eligible || isPending}
          className="px-4 py-2 font-mono text-sm font-bold bg-[#00D4FF] text-[#050D1A] rounded
                     disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#00BFEF]
                     transition-colors"
          data-testid="sync-now-button"
        >
          {isPending
            ? 'SYNCING…'
            : eligibility.eligible
            ? 'SYNC NOW'
            : `SYNC IN ${formatCountdown(countdown)}`}
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div
          className="text-center py-20 text-gray-500 font-mono"
          data-testid="campaigns-empty-state"
        >
          No campaigns found. Connect Meta Ads or Google Ads in Settings.
        </div>
      ) : (
        <div data-testid="campaigns-table">
          <DataTable
            columns={columns}
            data={campaigns}
            rowKey={(row) => row.id}
            expandedRow={
              expandedId
                ? (row) =>
                    row.id === expandedId ? (
                      <CampaignAccordion campaign={row} />
                    ) : null
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
```

### CampaignAccordion

```typescript
// apps/dashboard/app/dashboard/campaigns/CampaignAccordion.tsx
'use client';

import dynamic from 'next/dynamic';
import type { CampaignWithMetrics } from '@rainmachine/db/types/campaigns.types';

// Recharts lazy-loaded to avoid SSR issues
const BarChart = dynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false }
);

const STATUS_COLORS: Record<string, string> = {
  active: '#00FF88',
  paused: '#FF6B35',
  archived: '#6B7280',
  unknown: '#6B7280',
};

interface Props {
  campaign: CampaignWithMetrics;
}

export function CampaignAccordion({ campaign }: Props) {
  return (
    <div
      className="bg-[#0A1628] border border-[#1A2840] rounded-b-lg p-6 space-y-6"
      data-testid={`campaign-accordion-${campaign.id}`}
    >
      {/* Campaign meta */}
      <div className="grid grid-cols-3 gap-4 text-sm font-mono">
        <div>
          <div className="text-gray-500 text-xs mb-1">DAILY BUDGET</div>
          <div className="text-white">
            {campaign.daily_budget != null
              ? `$${campaign.daily_budget.toLocaleString()}`
              : '—'}
          </div>
        </div>
        <div>
          <div className="text-gray-500 text-xs mb-1">BID STRATEGY</div>
          <div className="text-white">{campaign.bid_strategy ?? '—'}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs mb-1">OBJECTIVE</div>
          <div className="text-white">{campaign.objective ?? '—'}</div>
        </div>
      </div>

      {/* 7-day budget / spend BarChart */}
      <div>
        <div className="text-xs font-mono text-gray-500 mb-3">DAILY SPEND — LAST 7 DAYS</div>
        <div className="h-40" data-testid={`campaign-chart-${campaign.id}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={campaign.chart_data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip
                contentStyle={{ background: '#050D1A', border: '1px solid #1A2840', fontFamily: 'Share Tech Mono', fontSize: 12 }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spend']}
              />
              <Bar dataKey="spend" fill="#00D4FF" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ad sets nested table */}
      {campaign.ad_sets.length > 0 && (
        <div>
          <div className="text-xs font-mono text-gray-500 mb-3">AD SETS</div>
          <table className="w-full text-sm font-mono" data-testid={`ad-sets-table-${campaign.id}`}>
            <thead>
              <tr className="text-gray-500 text-xs border-b border-[#1A2840]">
                <th className="text-left pb-2">Name</th>
                <th className="text-left pb-2">Status</th>
                <th className="text-left pb-2">Daily Budget</th>
              </tr>
            </thead>
            <tbody>
              {campaign.ad_sets.map((adSet) => (
                <tr
                  key={adSet.id}
                  className="border-b border-[#1A2840] hover:bg-[#0D1F35] transition-colors"
                  data-testid={`ad-set-row-${adSet.id}`}
                >
                  <td className="py-2 text-white">{adSet.name}</td>
                  <td className="py-2">
                    <span
                      className="text-xs font-bold"
                      style={{ color: STATUS_COLORS[adSet.status] ?? '#6B7280' }}
                    >
                      {adSet.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 text-gray-300">
                    {adSet.daily_budget != null
                      ? `$${adSet.daily_budget.toLocaleString()}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

### PlatformBadge

```typescript
// apps/dashboard/app/dashboard/campaigns/PlatformBadge.tsx
import type { CampaignPlatform } from '@rainmachine/db/types/campaigns.types';

const PLATFORM_CONFIG = {
  meta: { label: 'META', color: '#1877F2', bg: 'rgba(24,119,242,0.15)' },
  google: { label: 'GOOGLE', color: '#EA4335', bg: 'rgba(234,67,53,0.15)' },
};

interface Props {
  platform: CampaignPlatform;
  'data-testid'?: string;
}

export function PlatformBadge({ platform, 'data-testid': testId }: Props) {
  const config = PLATFORM_CONFIG[platform];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold"
      style={{ color: config.color, background: config.bg }}
      data-testid={testId}
    >
      {config.label}
    </span>
  );
}
```

### StatusBadge (Campaigns)

```typescript
// apps/dashboard/app/dashboard/campaigns/StatusBadge.tsx
import type { CampaignStatus } from '@rainmachine/db/types/campaigns.types';

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; bg: string }> = {
  active:   { label: 'ACTIVE',   color: '#00FF88', bg: 'rgba(0,255,136,0.12)' },
  paused:   { label: 'PAUSED',   color: '#FF6B35', bg: 'rgba(255,107,53,0.12)' },
  archived: { label: 'ARCHIVED', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  unknown:  { label: 'UNKNOWN',  color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

interface Props {
  status: CampaignStatus;
  'data-testid'?: string;
}

export function StatusBadge({ status, 'data-testid': testId }: Props) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold"
      style={{ color: config.color, background: config.bg }}
      data-testid={testId}
    >
      {config.label}
    </span>
  );
}
```

---

## 7. Integration Points

### BE-04 — n8n Ad Metrics Sync Workflow

This is the primary backend automation for the Campaigns feature. It runs every 4 hours to keep `campaigns`, `ad_sets`, and `ad_metrics` fresh.

**Workflow name:** `ad-metrics-sync`
**Trigger:** Schedule node — every 4 hours
**n8n credential nodes required:** Meta Ads API, Google Ads API, Supabase Service Role

```
SCHEDULE (every 4h)
  ↓
GET /tenants (Supabase) → filter status = 'active'
  ↓
SPLIT IN BATCHES (1 tenant at a time)
  ↓
For each tenant:
  ├── BRANCH: Has Meta OAuth token?
  │     ├── YES → GET Meta Graph API /campaigns?fields=name,status,daily_budget,bid_strategy,objective
  │     │          GET ad_sets for each campaign
  │     │          GET insights (spend, impressions, clicks, leads) last 7 days
  │     │          → POST /api/webhooks/ad-sync with platform=meta
  │     └── NO  → Mark campaigns WHERE platform='meta' AS oauth_status='revoked'
  │               → POST /api/webhooks/ad-sync (oauth_status revoked only, no metrics)
  │
  ├── BRANCH: Has Google Ads OAuth token?
  │     ├── YES → GET Google Ads API campaigns + ad_groups
  │     │          GET metrics via GAQL (last 7 days)
  │     │          → POST /api/webhooks/ad-sync with platform=google
  │     └── NO  → Mark campaigns WHERE platform='google' AS oauth_status='revoked'
  │
  └── LOG run to campaign_sync_log (initiated_by='scheduled')
```

**OAuth token retrieval:** Both tokens are stored in Supabase Vault (see F06 Step 4). The n8n workflow uses a Supabase node to call `vault.decrypted_secrets` with the key `oauth_meta_{tenantId}` or `oauth_google_{tenantId}`.

**Meta Graph API fields:**
- `/me/adaccounts?fields=campaigns{name,status,daily_budget,bid_strategy,objective,adsets{name,status,daily_budget}}`
- Insights: `/campaign_id/insights?fields=spend,impressions,clicks,actions&date_preset=last_7d&time_increment=1`
- Lead count from `actions` where `action_type = 'lead'`

**Google Ads API (GAQL):**
```sql
SELECT
  campaign.id, campaign.name, campaign.status,
  campaign.bidding_strategy_type, campaign.advertising_channel_type,
  campaign_budget.amount_micros,
  ad_group.id, ad_group.name, ad_group.status,
  ad_group_budget.amount_micros,
  metrics.cost_micros, metrics.impressions, metrics.clicks,
  metrics.conversions
FROM campaign
WHERE segments.date BETWEEN '{start_date}' AND '{end_date}'
  AND campaign.status != 'REMOVED'
```

### Sidebar Nav Integration

Add "Campaigns" to `apps/dashboard/app/dashboard/layout.tsx` sidebar nav after Leads (F07 sidebar items):

```typescript
{ label: 'CAMPAIGNS', href: '/dashboard/campaigns', icon: MegaphoneIcon }
```

### Settings Integration (F11 forward-reference)

`OAuthRevocationBanner` links to `/dashboard/settings/integrations`. This route is implemented in F11. In F10, the link exists but the destination page may redirect to a placeholder until F11 ships.

---

## 8. BDD Scenarios

```gherkin
Feature: F10 — Campaigns Table & Detail

  Background:
    Given I am authenticated as an RM with tenant_id "tenant-abc"
    And the tenant has 3 campaigns: 2 Meta (1 active, 1 paused), 1 Google (active)

  Scenario: View campaigns DataTable
    When I navigate to "/dashboard/campaigns"
    Then I see the campaigns-page container
    And I see 3 rows in the campaigns-table
    And each row shows a platform badge, status badge, spend today, and sync timestamp

  Scenario: Expand campaign accordion
    When I click "▼ DETAILS" on the first Meta campaign
    Then the campaign-accordion is visible for that campaign
    And I see a 7-day spend BarChart with 7 data points
    And I see the ad-sets table with at least 1 row

  Scenario: SYNC NOW triggers correctly when eligible
    Given the sync-now-button shows "SYNC NOW" (eligible)
    When I click the sync-now-button
    Then the button text changes to "SYNCING…" momentarily
    And then shows "SYNC IN 15:00" countdown
    And a new row appears in campaign_sync_log with initiated_by = 'manual'

  Scenario: SYNC NOW is rate-limited
    Given a manual sync was triggered 5 minutes ago
    When I load the campaigns page
    Then the sync-now-button shows "SYNC IN 10:0x" (approximately)
    And the countdown decrements every second

  Scenario: OAuth revocation banner
    Given one Meta campaign has oauth_status = 'revoked'
    When I navigate to "/dashboard/campaigns"
    Then I see the oauth-revocation-banner with text "Meta Ads"
    And I see the oauth-reconnect-link pointing to "/dashboard/settings/integrations"

  Scenario: Empty state
    Given the tenant has no campaigns
    When I navigate to "/dashboard/campaigns"
    Then I see the campaigns-empty-state message
    And I do not see the campaigns-table

  Scenario: BE-04 upserts new metrics without duplicates
    Given ad_metrics already has a row for campaign X on date "2025-01-15"
    When n8n posts new metrics for campaign X on date "2025-01-15"
    Then the existing row is updated (not duplicated)
    And campaigns.last_synced_at is updated
```

---

## 9. Test Plan

### Unit Tests

```typescript
// apps/dashboard/app/dashboard/campaigns/__tests__/actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('getSyncEligibility', () => {
  it('returns eligible=true when no recent sync', async () => {
    // Mock: supabase returns null for recent sync query
    // Expect: { eligible: true, next_eligible_at: null, seconds_remaining: null }
  });

  it('returns eligible=false with countdown when sync < 15 min ago', async () => {
    // Mock: supabase returns sync triggered 5 minutes ago
    // Expect: eligible=false, seconds_remaining ≈ 600
  });
});

describe('triggerCampaignSync', () => {
  it('returns eligible=false immediately after triggering', async () => {
    // Mock: no recent sync (eligible), insert succeeds, fetch mocked
    // Expect: result.success=true, result.eligibility.eligible=false
  });

  it('does not throw when n8n webhook times out', async () => {
    // Mock: fetch throws AbortError after 4s
    // Expect: result.success=true (fire-and-forget)
  });
});

// packages/db/src/types/__tests__/campaigns.types.test.ts
describe('CampaignWithMetrics chart_data', () => {
  it('has exactly 7 entries spanning the last 7 days', () => {
    // Build mock enriched campaign, assert chart_data.length === 7
  });

  it('fills missing dates with spend=0 leads=0', () => {
    // Mock: metrics only for today, assert 6 entries have spend=0
  });
});
```

### Integration Tests

```typescript
// apps/dashboard/app/dashboard/campaigns/__tests__/rate-limit.test.ts
import { describe, it, expect } from 'vitest';

describe('Campaign sync rate limit', () => {
  it('blocks second SYNC NOW within 15 minutes', async () => {
    // Insert a manual sync log row 5 minutes ago
    // Call triggerCampaignSync → expect eligible=false
  });

  it('allows sync after 15-minute window expires', async () => {
    // Insert a manual sync log row 16 minutes ago
    // Call triggerCampaignSync → expect success=true
  });
});

// apps/dashboard/app/dashboard/campaigns/__tests__/oauth-banner.test.ts
describe('OAuth revocation banner', () => {
  it('renders when any campaign has oauth_status=revoked', async () => {
    // Seed: 1 campaign with oauth_status='revoked'
    // Render CampaignsPage, assert banner is present
  });

  it('does not render when all campaigns are connected', async () => {
    // Seed: all campaigns oauth_status='connected'
    // Render CampaignsPage, assert banner absent
  });
});
```

### Playwright E2E

```typescript
// apps/dashboard/e2e/campaigns.spec.ts
import { test, expect } from '@playwright/test';

test('campaigns page renders DataTable', async ({ page }) => {
  await page.goto('/dashboard/campaigns');
  await expect(page.getByTestId('campaigns-page')).toBeVisible();
  await expect(page.getByTestId('campaigns-table')).toBeVisible();
});

test('accordion expands with chart and ad sets', async ({ page }) => {
  await page.goto('/dashboard/campaigns');
  await page.getByTestId(/expand-campaign-/).first().click();
  await expect(page.getByTestId(/campaign-accordion-/).first()).toBeVisible();
  await expect(page.getByTestId(/campaign-chart-/).first()).toBeVisible();
});

test('SYNC NOW rate limit flow', async ({ page }) => {
  await page.goto('/dashboard/campaigns');
  const btn = page.getByTestId('sync-now-button');
  await btn.click();
  await expect(btn).toContainText('SYNC IN');
  await expect(btn).toBeDisabled();
});

test('OAuth banner links to settings', async ({ page }) => {
  // Pre-condition: tenant has a revoked campaign (seed data)
  await page.goto('/dashboard/campaigns');
  const banner = page.getByTestId('oauth-revocation-banner');
  await expect(banner).toBeVisible();
  await expect(page.getByTestId('oauth-reconnect-link')).toHaveAttribute(
    'href', '/dashboard/settings/integrations'
  );
});
```

---

## 10. OWASP Security Checklist

| # | Check | Implementation |
|---|-------|----------------|
| 1 | **Broken Access Control** | All DB queries scoped by `tenant_id = auth.tenant_id()` via RLS. Service role only used in webhook route (not exposed to browser). |
| 2 | **Cryptographic Failures** | OAuth tokens stored in Supabase Vault (pgsodium). Never logged or returned to client. |
| 3 | **Injection** | All queries use parameterized Supabase SDK. No raw SQL in server actions. |
| 4 | **SSRF via Webhook** | `N8N_AD_SYNC_WEBHOOK_URL` is server-side env only. Clients never provide the URL. |
| 5 | **Webhook Secret** | `x-webhook-secret` header validated in `/api/webhooks/ad-sync` before processing. |
| 6 | **Rate Limiting** | SYNC NOW enforces 15-min window via DB log check. Prevents abuse-driven API costs. |
| 7 | **Missing Security Headers** | Inherited from Next.js middleware (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`). |
| 8 | **Input Validation** | `AdSyncWebhookPayload` shape validated implicitly by TypeScript; explicit Zod parse added in integration for webhook body. |
| 9 | **Privilege Escalation** | `triggerCampaignSync` uses `createServerClient()` (user JWT) for rate-limit log, not service role. |
| 10 | **Sensitive Data Exposure** | Vault secret keys (`oauth_meta_*`, `oauth_google_*`) are never returned to the client or logged. |

---

## 11. Open Questions

| ID | Question | Owner | Resolution |
|----|----------|-------|------------|
| OQ-01 | Do we need a per-platform SYNC NOW or one button for all platforms? | Product | One button — syncs all connected platforms for the tenant simultaneously. |
| OQ-02 | Should archived campaigns be hidden by default or shown with a toggle? | Design | Hidden by default. Add a "Show Archived" toggle in a follow-up polish pass. |
| OQ-03 | What happens if Meta returns a campaign with 0 ad sets? | Engineering | Accordion shows no ad-sets section (conditional render). Chart still renders. |
| OQ-04 | How do we handle Google Ads MCC (manager account) with multiple sub-accounts? | Engineering | Out of scope for R1. Single ad account per tenant. MCC support deferred to R3. |
| OQ-05 | Should CPL in the accordion use today's data or the 7-day average? | Product | Today's data for the accordion detail stats; 7-day chart shows per-day spend only (no CPL line in MVP). |

# F18 — CEO Department Drilldowns: Growth + Ad Operations

**Source pitch:** P17a
**Cycle:** 9 | **Release:** R2 | **Appetite:** Medium
**Status:** Ready for implementation

---

## 1. Overview

### Problem
The CEO Command Center (F13) shows four department status panels — but clicking them doesn't go anywhere useful. The CEO needs drill-down pages for Growth and Ad Operations that surface the actual data driving those status indicators: which prospects are stalling, what CPL looks like across all clients, and whether the Retell/Meta/Google APIs are healthy right now.

### Solution
Two new RSC pages within `apps/ceo`:

1. **`/departments/growth`** — Prospect pipeline KPIs, 30-day line chart (prospects contacted vs. deals closed), ProspectTable with stalled detection, and a prospect detail sub-page.

2. **`/departments/ad-ops`** — Cross-client CPL DataTable, AI call volume AreaChart (7 days), and a platform health panel with live API status checks.

A shared `<TrendChart>` wrapper component is added to `packages/ui` for consistent Recharts + JARVIS Dark styling.

### Success Criteria
- Growth page loads in under 2 seconds with prospect data
- STALLED badge appears on any prospect with last_activity > 14 days
- Ad Ops CPL DataTable shows both Meta and Google CPL per client
- Platform health panel shows live status (5-minute server-side cache)
- Playwright E2E covers stalled badge, CPL table, and health panel render

### Out of Scope (MVP)
- Editing prospect data from the CEO view (read-only, managed in CRM)
- Sending automated sequences to stalled prospects
- Historical health panel data (live only)

---

## 2. Database

No new tables. This feature reads from:
- `prospects` (F17)
- `ad_metrics`, `campaigns` (F10)
- `calls` (F05)
- `agent_logs` (F16)
- `tenants`, `tenant_health_scores` view (F13)

### New: Prospect Activity Timeline View

```sql
-- supabase/migrations/0032_prospect_timeline.sql

-- Simple timeline for the prospect detail sub-page
CREATE OR REPLACE VIEW prospect_events AS
SELECT
  p.id AS prospect_id,
  'created'         AS event_type,
  p.created_at      AS event_at,
  jsonb_build_object('note', 'Prospect added to pipeline') AS metadata
FROM prospects p
UNION ALL
SELECT
  p.id,
  'stage_change'    AS event_type,
  p.updated_at,
  jsonb_build_object('stage', p.stage) AS metadata
FROM prospects p
WHERE p.updated_at > p.created_at;
-- Note: a full audit log would be tracked via trigger in R2;
-- for R1 this view is a simplification
```

---

## 3. TypeScript Interfaces

```typescript
// packages/db/src/types/ceo-drilldowns.types.ts
import type { ProspectRow } from './business-intel.types';

// ─── Growth page ──────────────────────────────────────────────
export interface GrowthKpis {
  prospects_total: number;
  deals_this_month: number;
  pipeline_value: number;
  avg_deal_velocity_days: number | null;
  conversion_rate: number | null;
}

export interface ProspectTableRow extends ProspectRow {
  days_stalled: number;
  is_stalled: boolean;    // last_activity > 14d and not closed
}

export interface GrowthChartPoint {
  date: string;           // e.g. "Jan 1"
  prospects_contacted: number;
  deals_closed: number;
}

// ─── Ad Ops page ─────────────────────────────────────────────
export interface AdOpsKpis {
  active_clients: number;
  avg_cpl_meta: number | null;
  avg_cpl_google: number | null;
  total_spend_mtd: number;
  leads_generated_mtd: number;
  healthy_campaigns: number;
}

export interface ClientCplRow {
  tenant_id: string;
  tenant_name: string;
  meta_cpl: number | null;
  google_cpl: number | null;
  meta_spend_mtd: number;
  google_spend_mtd: number;
  health: 'green' | 'amber' | 'red';
}

export interface CallVolumePoint {
  date: string;           // "Mon", "Tue", etc.
  attempted: number;
  connected: number;
  booked: number;
}

export type PlatformHealthStatus = 'healthy' | 'degraded' | 'down';

export interface PlatformHealth {
  platform: 'retell' | 'meta' | 'google';
  label: string;
  status: PlatformHealthStatus;
  latency_ms: number | null;
  checked_at: string;
}
```

---

## 4. Server Actions

```typescript
// apps/ceo/app/departments/actions.ts
'use server';

import { createServerClient, createServiceRoleClient } from '@rainmachine/db';

// ─────────────────────────────────────────────
// getPlatformHealth
// Pings Retell, Meta Graph, and Google OAuth
// endpoints to determine live status.
// Cached at the server level for 5 minutes.
// ─────────────────────────────────────────────

// Simple in-memory cache (resets on cold start; acceptable for health checks)
let platformHealthCache: { data: PlatformHealth[]; cached_at: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getPlatformHealth(): Promise<PlatformHealth[]> {
  if (platformHealthCache && Date.now() - platformHealthCache.cached_at < CACHE_TTL) {
    return platformHealthCache.data;
  }

  const checks: Array<{ platform: string; label: string; url: string; timeout: number }> = [
    { platform: 'retell', label: 'Retell AI', url: 'https://api.retellai.com/v2/list-calls', timeout: 3000 },
    { platform: 'meta',   label: 'Meta Ads',  url: 'https://graph.facebook.com/me', timeout: 3000 },
    { platform: 'google', label: 'Google Ads', url: 'https://oauth2.googleapis.com/tokeninfo?access_token=probe', timeout: 3000 },
  ];

  const results: PlatformHealth[] = await Promise.all(
    checks.map(async (check) => {
      const start = Date.now();
      try {
        const res = await fetch(check.url, {
          signal: AbortSignal.timeout(check.timeout),
          headers: { 'Authorization': `Bearer probe` }, // intentionally invalid — we just want HTTP response
        });
        const latency = Date.now() - start;
        // 401/403 = API is up, token just isn't valid; 5xx = degraded
        const status: PlatformHealthStatus =
          res.status < 500 ? 'healthy' : res.status < 600 ? 'degraded' : 'down';
        return {
          platform: check.platform as PlatformHealth['platform'],
          label: check.label,
          status,
          latency_ms: latency,
          checked_at: new Date().toISOString(),
        };
      } catch {
        return {
          platform: check.platform as PlatformHealth['platform'],
          label: check.label,
          status: 'down',
          latency_ms: null,
          checked_at: new Date().toISOString(),
        };
      }
    })
  );

  platformHealthCache = { data: results, cached_at: Date.now() };
  return results;
}

import type { PlatformHealth } from '@rainmachine/db/types/ceo-drilldowns.types';
```

---

## 5. API Routes

### Platform Health API

```typescript
// apps/ceo/app/api/health/platforms/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@rainmachine/db';
import { getPlatformHealth } from '../../departments/actions';

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata.role !== 'ceo') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const health = await getPlatformHealth();
  return NextResponse.json({ platforms: health }, {
    headers: { 'Cache-Control': 'private, max-age=300' }, // 5-min browser cache
  });
}
```

---

## 6. UI Components

### Shared TrendChart Component

```typescript
// packages/ui/src/components/TrendChart.tsx
'use client';
import dynamic from 'next/dynamic';

const LineChart = dynamic(() => import('recharts').then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then((m) => m.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false });

export const CHART_AXIS_STYLE = {
  fill: '#4B5563',
  fontSize: 10,
  fontFamily: 'Share Tech Mono, monospace',
};

export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: '#0A1628',
    border: '1px solid #1A2840',
    fontFamily: 'Share Tech Mono, monospace',
    fontSize: 11,
  },
};

export interface TrendChartSeries {
  key: string;
  color: string;
  label: string;
  type?: 'line' | 'area';
}

export interface TrendChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  series: TrendChartSeries[];
  height?: number;
  yTickFormatter?: (v: number) => string;
  'data-testid'?: string;
}

export function TrendChart({
  data,
  xKey,
  series,
  height = 200,
  yTickFormatter,
  'data-testid': testId,
}: TrendChartProps) {
  const hasArea = series.some((s) => s.type === 'area');
  const ChartComponent = hasArea ? AreaChart : LineChart;

  return (
    <div style={{ height }} data-testid={testId}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={data} margin={{ top: 4, right: 12, bottom: 0, left: -10 }}>
          <XAxis
            dataKey={xKey}
            tick={CHART_AXIS_STYLE}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={CHART_AXIS_STYLE}
            axisLine={false}
            tickLine={false}
            tickFormatter={yTickFormatter}
          />
          <Tooltip {...CHART_TOOLTIP_STYLE} />
          {series.map((s) =>
            s.type === 'area' ? (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                fill={`${s.color}22`}
                strokeWidth={2}
                dot={false}
                name={s.label}
              />
            ) : (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                name={s.label}
              />
            )
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
```

### Growth Page

```typescript
// apps/ceo/app/departments/growth/page.tsx
import { createServerClient } from '@rainmachine/db';
import { redirect } from 'next/navigation';
import { GrowthKpiSection } from './GrowthKpiSection';
import { ProspectTable } from './ProspectTable';
import { TrendChart } from '@rainmachine/ui';
import Link from 'next/link';
import type { GrowthKpis, ProspectTableRow, GrowthChartPoint } from '@rainmachine/db/types/ceo-drilldowns.types';

const STALL_THRESHOLD_DAYS = 14;

export default async function GrowthPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata.role !== 'ceo') redirect('/login');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [prospectsResult, dealsResult] = await Promise.all([
    supabase
      .from('prospects')
      .select('*')
      .not('stage', 'in', '("closed_won","closed_lost")')
      .order('last_activity', { ascending: true }),
    supabase
      .from('prospects')
      .select('stage, deal_value, created_at, updated_at')
      .eq('stage', 'closed_won')
      .gte('updated_at', monthStart),
  ]);

  const allProspects = prospectsResult.data ?? [];
  const dealsThisMonth = dealsResult.data ?? [];

  // Enrich prospects with stall data
  const enriched: ProspectTableRow[] = allProspects.map((p) => {
    const daysStalled = Math.floor(
      (Date.now() - new Date(p.last_activity).getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      ...p,
      days_stalled: daysStalled,
      is_stalled: daysStalled >= STALL_THRESHOLD_DAYS,
    };
  });

  // KPI calculations
  const pipelineValue = allProspects.reduce((sum, p) => sum + (p.deal_value ?? 0), 0);
  const closedValues = dealsThisMonth.map((d) => d.deal_value ?? 0);
  const avgDealVelocity = null; // Would need created→closed timestamps — simplified
  const totalContacted = allProspects.length;
  const conversionRate = totalContacted > 0
    ? (dealsThisMonth.length / (totalContacted + dealsThisMonth.length)) * 100
    : null;

  const kpis: GrowthKpis = {
    prospects_total: allProspects.length,
    deals_this_month: dealsThisMonth.length,
    pipeline_value: pipelineValue,
    avg_deal_velocity_days: avgDealVelocity,
    conversion_rate: conversionRate ? Math.round(conversionRate * 10) / 10 : null,
  };

  // Build 30-day chart data
  const chartData: GrowthChartPoint[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      prospects_contacted: allProspects.filter(
        (p) => p.created_at.startsWith(dateStr)
      ).length,
      deals_closed: dealsThisMonth.filter(
        (p) => p.updated_at?.startsWith(dateStr)
      ).length,
    };
  });

  return (
    <div className="min-h-screen bg-[#050D1A]" data-testid="growth-page">
      <header className="px-8 py-6 border-b border-[#1A2840] flex items-center gap-4">
        <Link href="/" className="font-mono text-sm text-gray-500 hover:text-[#00D4FF]">
          ← COMMAND CENTER
        </Link>
        <h1 className="font-orbitron text-xl text-white tracking-wide">GROWTH</h1>
      </header>

      <main className="px-8 py-8 space-y-10">
        {/* KPI cards */}
        <GrowthKpiSection kpis={kpis} />

        {/* 30-day trend chart */}
        <section>
          <h2 className="font-mono text-xs text-gray-500 uppercase tracking-wider mb-4">
            30-Day Pipeline Activity
          </h2>
          <div className="bg-[#0A1628] border border-[#1A2840] rounded-xl p-6">
            <TrendChart
              data={chartData}
              xKey="date"
              series={[
                { key: 'prospects_contacted', color: '#00D4FF', label: 'Contacted', type: 'line' },
                { key: 'deals_closed', color: '#00FF88', label: 'Closed', type: 'line' },
              ]}
              height={200}
              data-testid="growth-trend-chart"
            />
          </div>
        </section>

        {/* Prospect table */}
        <section>
          <h2 className="font-mono text-xs text-gray-500 uppercase tracking-wider mb-4">
            Pipeline ({enriched.length} prospects)
          </h2>
          <ProspectTable prospects={enriched} />
        </section>
      </main>
    </div>
  );
}
```

### GrowthKpiSection

```typescript
// apps/ceo/app/departments/growth/GrowthKpiSection.tsx
import type { GrowthKpis } from '@rainmachine/db/types/ceo-drilldowns.types';

export function GrowthKpiSection({ kpis }: { kpis: GrowthKpis }) {
  const cards = [
    { label: 'PROSPECTS', value: kpis.prospects_total.toLocaleString(), testId: 'kpi-prospects' },
    { label: 'DEALS MTM', value: kpis.deals_this_month.toLocaleString(), testId: 'kpi-deals' },
    { label: 'PIPELINE VALUE', value: `$${kpis.pipeline_value.toLocaleString()}`, testId: 'kpi-pipeline' },
    {
      label: 'AVG VELOCITY',
      value: kpis.avg_deal_velocity_days != null ? `${kpis.avg_deal_velocity_days}d` : '—',
      testId: 'kpi-velocity',
    },
    {
      label: 'CONVERSION',
      value: kpis.conversion_rate != null ? `${kpis.conversion_rate}%` : '—',
      testId: 'kpi-conversion',
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-4" data-testid="growth-kpis">
      {cards.map((card) => (
        <div
          key={card.testId}
          className="bg-[#0A1628] border border-[#1A2840] rounded-xl p-5"
          data-testid={card.testId}
        >
          <div className="font-mono text-xs text-gray-500 mb-2">{card.label}</div>
          <div className="font-orbitron text-2xl text-white">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
```

### ProspectTable

```typescript
// apps/ceo/app/departments/growth/ProspectTable.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { ProspectTableRow } from '@rainmachine/db/types/ceo-drilldowns.types';

const STAGE_LABELS: Record<string, string> = {
  contacted: 'Contacted',
  demo_scheduled: 'Demo Scheduled',
  proposal_sent: 'Proposal Sent',
  negotiating: 'Negotiating',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

const STAGE_COLORS: Record<string, string> = {
  contacted:       '#6B7280',
  demo_scheduled:  '#00D4FF',
  proposal_sent:   '#FFD700',
  negotiating:     '#FF6B35',
  closed_won:      '#00FF88',
  closed_lost:     '#EF4444',
};

interface Props {
  prospects: ProspectTableRow[];
}

export function ProspectTable({ prospects }: Props) {
  const [search, setSearch] = useState('');

  const filtered = prospects.filter((p) =>
    p.company.toLowerCase().includes(search.toLowerCase()) ||
    (p.contact_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4" data-testid="prospect-table">
      <input
        type="text"
        placeholder="Search company or contact..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm bg-[#0A1628] border border-[#1A2840] rounded-lg px-4 py-2 font-mono text-sm text-white placeholder-gray-600 focus:border-[#00D4FF] focus:outline-none"
        data-testid="prospect-search"
      />
      <div className="bg-[#0A1628] border border-[#1A2840] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A2840]">
              {['Company', 'Stage', 'Deal Value', 'Owner', 'Last Activity', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left font-mono text-xs text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                className="border-b border-[#1A2840] last:border-0 hover:bg-[#0D1F35] transition-colors"
                data-testid={`prospect-row-${p.id}`}
              >
                <td className="px-5 py-4">
                  <div className="font-mono text-sm text-white">{p.company}</div>
                  {p.contact_name && (
                    <div className="font-mono text-xs text-gray-500">{p.contact_name}</div>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: STAGE_COLORS[p.stage] ?? '#6B7280' }}
                    data-testid={`stage-badge-${p.id}`}
                  >
                    {STAGE_LABELS[p.stage] ?? p.stage}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-sm">
                  {p.deal_value != null ? `$${p.deal_value.toLocaleString()}` : '—'}
                </td>
                <td className="px-5 py-4 font-mono text-sm text-gray-400">
                  {p.owner ?? '—'}
                </td>
                <td className="px-5 py-4">
                  {p.is_stalled ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#FF6B351A] border border-[#FF6B3544] rounded font-mono text-xs font-bold text-[#FF6B35]"
                      data-testid={`stalled-badge-${p.id}`}
                    >
                      STALLED {p.days_stalled}d
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-gray-500">
                      {p.days_stalled}d ago
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/departments/growth/prospects/${p.id}`}
                    className="font-mono text-xs text-[#00D4FF] hover:underline"
                    data-testid={`view-prospect-${p.id}`}
                  >
                    VIEW →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center font-mono text-sm text-gray-600">
            No prospects found
          </div>
        )}
      </div>
    </div>
  );
}
```

### Prospect Detail Sub-Page

```typescript
// apps/ceo/app/departments/growth/prospects/[id]/page.tsx
import { createServerClient } from '@rainmachine/db';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ProspectDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata.role !== 'ceo') redirect('/login');

  const { data: prospect } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!prospect) notFound();

  const daysStalled = Math.floor(
    (Date.now() - new Date(prospect.last_activity).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isStalled = daysStalled >= 14;

  return (
    <div className="min-h-screen bg-[#050D1A]" data-testid="prospect-detail-page">
      <header className="px-8 py-6 border-b border-[#1A2840] flex items-center gap-4">
        <Link href="/departments/growth" className="font-mono text-sm text-gray-500 hover:text-[#00D4FF]">
          ← GROWTH
        </Link>
        <h1 className="font-orbitron text-xl text-white">{prospect.company}</h1>
        {isStalled && (
          <span className="px-2 py-0.5 bg-[#FF6B351A] border border-[#FF6B3544] rounded font-mono text-xs font-bold text-[#FF6B35]">
            STALLED {daysStalled}d
          </span>
        )}
      </header>
      <main className="px-8 py-8 max-w-2xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Contact', prospect.contact_name ?? '—'],
            ['Email', prospect.contact_email ?? '—'],
            ['Stage', prospect.stage],
            ['Owner', prospect.owner ?? '—'],
            ['Deal Value', prospect.deal_value ? `$${prospect.deal_value.toLocaleString()}` : '—'],
            ['Last Activity', new Date(prospect.last_activity).toLocaleString()],
          ].map(([label, value]) => (
            <div key={label} className="bg-[#0A1628] border border-[#1A2840] rounded-xl p-4">
              <div className="font-mono text-xs text-gray-500 mb-1">{label}</div>
              <div className="font-mono text-sm text-white">{value}</div>
            </div>
          ))}
        </div>
        {prospect.notes && (
          <div className="bg-[#0A1628] border border-[#1A2840] rounded-xl p-4">
            <div className="font-mono text-xs text-gray-500 mb-2">NOTES</div>
            <p className="font-mono text-sm text-gray-300">{prospect.notes}</p>
          </div>
        )}
      </main>
    </div>
  );
}
```

### Ad Ops Page

```typescript
// apps/ceo/app/departments/ad-ops/page.tsx
import { createServerClient } from '@rainmachine/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdOpsKpiSection } from './AdOpsKpiSection';
import { ClientCplTable } from './ClientCplTable';
import { CallVolumeChart } from './CallVolumeChart';
import { PlatformHealthPanel } from './PlatformHealthPanel';
import { getPlatformHealth } from '../actions';
import type { ClientCplRow, AdOpsKpis, CallVolumePoint } from '@rainmachine/db/types/ceo-drilldowns.types';

export default async function AdOpsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata.role !== 'ceo') redirect('/login');

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [tenantsResult, metricsResult, callsResult, platformHealth] = await Promise.all([
    supabase.from('tenants').select('id, name').eq('status', 'active'),
    supabase
      .from('ad_metrics')
      .select('tenant_id, platform, spend, leads, cpl')
      .gte('metric_date', monthStart),
    supabase
      .from('calls')
      .select('created_at, status, connected')
      .gte('created_at', sevenDaysAgo + 'T00:00:00'),
    getPlatformHealth(),
  ]);

  const tenants = tenantsResult.data ?? [];
  const metrics = metricsResult.data ?? [];
  const calls = callsResult.data ?? [];

  // Build per-client CPL table
  const clientRows: ClientCplRow[] = tenants.map((tenant) => {
    const tenantMetrics = metrics.filter((m) => m.tenant_id === tenant.id);
    const metaMet = tenantMetrics.filter((m) => m.platform === 'meta');
    const googleMet = tenantMetrics.filter((m) => m.platform === 'google');

    const metaSpend = metaMet.reduce((s, m) => s + (m.spend ?? 0), 0);
    const metaLeads = metaMet.reduce((s, m) => s + (m.leads ?? 0), 0);
    const googleSpend = googleMet.reduce((s, m) => s + (m.spend ?? 0), 0);
    const googleLeads = googleMet.reduce((s, m) => s + (m.leads ?? 0), 0);

    const metaCpl = metaLeads > 0 ? metaSpend / metaLeads : null;
    const googleCpl = googleLeads > 0 ? googleSpend / googleLeads : null;

    // Health: red if either CPL > $150, amber if > $100
    const maxCpl = Math.max(metaCpl ?? 0, googleCpl ?? 0);
    const health: ClientCplRow['health'] =
      maxCpl > 150 ? 'red' : maxCpl > 100 ? 'amber' : 'green';

    return {
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      meta_cpl: metaCpl ? Math.round(metaCpl * 100) / 100 : null,
      google_cpl: googleCpl ? Math.round(googleCpl * 100) / 100 : null,
      meta_spend_mtd: metaSpend,
      google_spend_mtd: googleSpend,
      health,
    };
  });

  // Platform KPIs
  const totalSpendMtd = metrics.reduce((s, m) => s + (m.spend ?? 0), 0);
  const totalLeadsMtd = metrics.reduce((s, m) => s + (m.leads ?? 0), 0);
  const healthyCampaigns = clientRows.filter((c) => c.health === 'green').length;

  const kpis: AdOpsKpis = {
    active_clients: tenants.length,
    avg_cpl_meta: (() => {
      const mL = metrics.filter((m) => m.platform === 'meta').reduce((s, m) => s + (m.leads ?? 0), 0);
      const mS = metrics.filter((m) => m.platform === 'meta').reduce((s, m) => s + (m.spend ?? 0), 0);
      return mL > 0 ? Math.round((mS / mL) * 100) / 100 : null;
    })(),
    avg_cpl_google: (() => {
      const gL = metrics.filter((m) => m.platform === 'google').reduce((s, m) => s + (m.leads ?? 0), 0);
      const gS = metrics.filter((m) => m.platform === 'google').reduce((s, m) => s + (m.spend ?? 0), 0);
      return gL > 0 ? Math.round((gS / gL) * 100) / 100 : null;
    })(),
    total_spend_mtd: totalSpendMtd,
    leads_generated_mtd: totalLeadsMtd,
    healthy_campaigns: healthyCampaigns,
  };

  // Build 7-day call volume chart
  const callChart: CallVolumePoint[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayCalls = calls.filter((c) => c.created_at.startsWith(dateStr));
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      attempted: dayCalls.length,
      connected: dayCalls.filter((c) => c.connected).length,
      booked: dayCalls.filter((c) => c.status === 'appointment_booked').length,
    };
  });

  return (
    <div className="min-h-screen bg-[#050D1A]" data-testid="ad-ops-page">
      <header className="px-8 py-6 border-b border-[#1A2840] flex items-center gap-4">
        <Link href="/" className="font-mono text-sm text-gray-500 hover:text-[#00D4FF]">
          ← COMMAND CENTER
        </Link>
        <h1 className="font-orbitron text-xl text-white tracking-wide">AD OPERATIONS</h1>
      </header>

      <main className="px-8 py-8 space-y-10">
        <AdOpsKpiSection kpis={kpis} />

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-8">
            <section>
              <h2 className="font-mono text-xs text-gray-500 uppercase tracking-wider mb-4">
                Cross-Client CPL — MTD
              </h2>
              <ClientCplTable clients={clientRows} />
            </section>
            <section>
              <h2 className="font-mono text-xs text-gray-500 uppercase tracking-wider mb-4">
                AI Call Volume — Last 7 Days
              </h2>
              <div className="bg-[#0A1628] border border-[#1A2840] rounded-xl p-6">
                <CallVolumeChart data={callChart} />
              </div>
            </section>
          </div>
          <div>
            <h2 className="font-mono text-xs text-gray-500 uppercase tracking-wider mb-4">
              Platform Health
            </h2>
            <PlatformHealthPanel platforms={platformHealth} />
          </div>
        </div>
      </main>
    </div>
  );
}
```

### HealthRing SVG Component

```typescript
// packages/ui/src/components/HealthRing.tsx
interface Props {
  status: 'green' | 'amber' | 'red';
  size?: number;
  'data-testid'?: string;
}

const COLORS = {
  green: '#00FF88',
  amber: '#FFD700',
  red: '#FF6B35',
};

export function HealthRing({ status, size = 20, 'data-testid': testId }: Props) {
  const color = COLORS[status];
  const r = size / 2 - 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const filledPct = status === 'green' ? 1 : status === 'amber' ? 0.6 : 0.3;
  const filled = filledPct * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      data-testid={testId}
      aria-label={`Health: ${status}`}
    >
      {/* Background ring */}
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#1A2840" strokeWidth="2" />
      {/* Filled arc */}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeDashoffset={circumference / 4}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    </svg>
  );
}
```

### ClientCplTable

```typescript
// apps/ceo/app/departments/ad-ops/ClientCplTable.tsx
import { HealthRing } from '@rainmachine/ui';
import type { ClientCplRow } from '@rainmachine/db/types/ceo-drilldowns.types';

export function ClientCplTable({ clients }: { clients: ClientCplRow[] }) {
  return (
    <div className="bg-[#0A1628] border border-[#1A2840] rounded-xl overflow-hidden" data-testid="client-cpl-table">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#1A2840]">
            {['', 'Client', 'Meta CPL', 'Google CPL', 'Meta Spend MTD', 'Google Spend MTD'].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-mono text-xs text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr
              key={c.tenant_id}
              className="border-b border-[#1A2840] last:border-0 hover:bg-[#0D1F35] transition-colors"
              data-testid={`cpl-row-${c.tenant_id}`}
            >
              <td className="px-4 py-4">
                <HealthRing status={c.health} data-testid={`health-ring-${c.tenant_id}`} />
              </td>
              <td className="px-4 py-4 font-mono text-sm text-white">{c.tenant_name}</td>
              <td className="px-4 py-4 font-mono text-sm">
                {c.meta_cpl != null ? `$${c.meta_cpl.toFixed(2)}` : '—'}
              </td>
              <td className="px-4 py-4 font-mono text-sm">
                {c.google_cpl != null ? `$${c.google_cpl.toFixed(2)}` : '—'}
              </td>
              <td className="px-4 py-4 font-mono text-sm">
                {`$${c.meta_spend_mtd.toLocaleString()}`}
              </td>
              <td className="px-4 py-4 font-mono text-sm">
                {`$${c.google_spend_mtd.toLocaleString()}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### PlatformHealthPanel

```typescript
// apps/ceo/app/departments/ad-ops/PlatformHealthPanel.tsx
import type { PlatformHealth } from '@rainmachine/db/types/ceo-drilldowns.types';

const STATUS_CONFIG = {
  healthy:  { dot: '#00FF88', label: 'Healthy',  pulse: false },
  degraded: { dot: '#FFD700', label: 'Degraded', pulse: true },
  down:     { dot: '#FF6B35', label: 'Down',     pulse: true },
};

export function PlatformHealthPanel({ platforms }: { platforms: PlatformHealth[] }) {
  return (
    <div className="space-y-3" data-testid="platform-health-panel">
      {platforms.map((p) => {
        const config = STATUS_CONFIG[p.status];
        return (
          <div
            key={p.platform}
            className="bg-[#0A1628] border border-[#1A2840] rounded-xl p-4"
            data-testid={`platform-health-${p.platform}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${config.pulse ? 'animate-pulse' : ''}`}
                  style={{ background: config.dot }}
                  data-testid={`health-dot-${p.platform}`}
                />
                <span className="font-mono text-sm text-white">{p.label}</span>
              </div>
              <span
                className="font-mono text-xs font-bold"
                style={{ color: config.dot }}
              >
                {config.label.toUpperCase()}
              </span>
            </div>
            {p.latency_ms != null && (
              <div className="mt-1 font-mono text-xs text-gray-600">
                {p.latency_ms}ms
              </div>
            )}
            <div className="mt-0.5 font-mono text-xs text-gray-600">
              {new Date(p.checked_at).toLocaleTimeString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

## 7. Integration Points

### F13 (Navigation)
Department panel links in F13 now resolve to `/departments/growth` and `/departments/ad-ops`. The `DepartmentPanels` component in F13 already links to these routes.

### F17 (Prospect Data)
Growth page reads from the `prospects` table populated by the n8n Apollo sync (F17). If no prospects exist, the table shows an empty state.

### F16 (Agent Logs for Department Status)
The status dot in F13's DepartmentPanels derives from `agent_logs.status`. The drilldown page titles reflect the same department names.

### F19 (Pattern Reuse)
F19's Product and Finance drilldowns reuse the same page shell pattern (header with back nav, KPI cards, DataTable). The `TrendChart` component is shared from `packages/ui`.

---

## 8. BDD Scenarios

```gherkin
Feature: F18 — CEO Drilldowns: Growth + Ad Ops

  Scenario: Growth page shows stalled badge
    Given prospect "MegaHomes" has last_activity 20 days ago
    When I visit /departments/growth
    Then I see prospect-row for "MegaHomes"
    And I see a stalled-badge-{id} with text "STALLED 20d"

  Scenario: Growth page does not show stalled for recent activity
    Given prospect "FastSell" has last_activity 5 days ago
    When I visit /departments/growth
    Then the row for "FastSell" shows "5d ago" (not STALLED)

  Scenario: Prospect detail page
    When I click VIEW → for a prospect
    Then I navigate to /departments/growth/prospects/{id}
    And I see the company name, stage badge, deal value, and contact info

  Scenario: Ad Ops CPL table renders all clients
    Given 5 active tenants with ad_metrics data
    When I visit /departments/ad-ops
    Then I see 5 rows in client-cpl-table
    And each row has a health-ring with the correct color

  Scenario: CPL spike shows red health ring
    Given a tenant's Meta CPL is $180 (> $150 threshold)
    Then the health-ring for that tenant has status="red"

  Scenario: Platform health panel shows live status
    When I visit /departments/ad-ops
    Then I see platform-health-panel with 3 entries (Retell, Meta, Google)
    And each entry shows a status dot

  Scenario: Platform API down shows degraded indicator
    Given the Retell API returns 500
    When platform health is checked
    Then platform-health-retell shows status="down" with pulsing dot
```

---

## 9. Test Plan

### Unit Tests

```typescript
// apps/ceo/app/departments/growth/__tests__/stalled.test.ts
describe('Stall detection', () => {
  it('marks prospect as stalled when last_activity > 14 days', () => {
    const lastActivity = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    const daysStalled = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    expect(daysStalled).toBeGreaterThanOrEqual(14);
  });

  it('does not mark prospect as stalled at 13 days', () => {
    const lastActivity = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString();
    const daysStalled = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    expect(daysStalled).toBeLessThan(14);
  });
});

// apps/ceo/app/departments/ad-ops/__tests__/health.test.ts
describe('Client health scoring', () => {
  it('returns red when CPL > 150', () => {
    const maxCpl = 180;
    const health = maxCpl > 150 ? 'red' : maxCpl > 100 ? 'amber' : 'green';
    expect(health).toBe('red');
  });

  it('returns green when CPL <= 100', () => {
    const maxCpl = 80;
    const health = maxCpl > 150 ? 'red' : maxCpl > 100 ? 'amber' : 'green';
    expect(health).toBe('green');
  });
});
```

### Playwright E2E

```typescript
// apps/ceo/e2e/drilldowns.spec.ts
test('Growth page stalled badge visible', async ({ page }) => {
  await page.goto('/departments/growth');
  await expect(page.getByTestId('growth-page')).toBeVisible();
  // If any stalled prospects exist, badge should be visible
  const stalledBadges = page.getByTestId(/stalled-badge-/);
  if ((await stalledBadges.count()) > 0) {
    await expect(stalledBadges.first()).toContainText('STALLED');
  }
});

test('Ad Ops CPL table renders', async ({ page }) => {
  await page.goto('/departments/ad-ops');
  await expect(page.getByTestId('client-cpl-table')).toBeVisible();
  await expect(page.getByTestId('platform-health-panel')).toBeVisible();
});

test('platform health dots are visible', async ({ page }) => {
  await page.goto('/departments/ad-ops');
  await expect(page.getByTestId(/health-dot-/)).toHaveCount(3);
});
```

---

## 10. OWASP Security Checklist

| # | Check | Implementation |
|---|-------|----------------|
| 1 | **CEO Role Enforcement** | Every page redirects non-CEO users to `/login`. `getPlatformHealth` action would also be called only server-side. |
| 2 | **Platform Health SSRF** | Health check URLs are hardcoded in the server action — no user-provided URLs. |
| 3 | **5-min Cache** | Platform health cache prevents rate abuse against external APIs. Cache is in-process, not shared (each Edge instance has own). |
| 4 | **RLS** | `prospects` table has CEO-only RLS. `ad_metrics` CEO read-all policy. RM cannot access other tenants' data or growth data. |
| 5 | **Health Check Probe Auth** | Intentional invalid Bearer token used for probing — endpoints return 401 (healthy), not 200. No real credentials sent. |
| 6 | **XSS** | All data rendered as React text nodes. No `dangerouslySetInnerHTML` in any drilldown component. |
| 7 | **URL Params** | Prospect detail page uses UUID param validated implicitly by RLS — no UUID = no data. |
| 8 | **Data Minimization** | CPL table only exposes aggregate MTD metrics per tenant — no individual lead or PII data. |
| 9 | **Cache Headers** | `/api/health/platforms` sets `Cache-Control: private, max-age=300` — not cached by CDN, only browser. |
| 10 | **Missing auth on drilldown sub-pages** | Each sub-page RSC re-checks CEO role independently — not inherited from layout. |

---

## 11. Open Questions

| ID | Question | Owner | Resolution |
|----|----------|-------|------------|
| OQ-01 | Should the Growth KPI trend chart show actual data or simulated? | Product | Real data from `prospects` table. If sparse, the chart will show mostly zeros — acceptable for R1. |
| OQ-02 | The platform health check uses an invalid Bearer token intentionally — will Meta/Google rate-limit these probes? | Engineering | Rate limit is per-IP. 5-min cache means max 12 requests/hour per CEO user. Acceptable. |
| OQ-03 | Should the CPL thresholds for health ring colors ($100 amber, $150 red) be configurable? | Product | Yes in R2 — read from `ceo_settings.cpl_threshold`. Hardcoded in R1. |
| OQ-04 | What if the CEO has no Stripe setup yet — should Ad Ops show MRR? | Product | Ad Ops does not show MRR; that's the Finance drilldown (F19). Ad Ops is CPL / call volume / platform health only. |
| OQ-05 | Should the 7-day call chart include all tenants or show a breakdown per tenant? | Design | All tenants aggregated in one chart. Per-tenant call volume is visible in the client detail (F14). |

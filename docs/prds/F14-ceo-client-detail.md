# F14 — CEO Client Detail

**Source pitch:** P14
**Cycle:** 7 (R1: Overview + Timeline) + Cycle 9 (R2: Campaigns + Leads + Financials)
**Release:** R1 / R2 split | **Appetite:** Medium
**Status:** Ready for implementation

---

## 1. Overview

### Problem
The CEO needs deep visibility into any individual client's performance. Clicking a client row in the Command Center (F13) should open a rich detail view showing KPIs, activity history, campaigns, leads, and financial status. Currently the Command Center only shows health scores — there's no way to drill in.

### Solution
A tabbed client detail page at `apps/ceo/app/clients/[id]/page.tsx`. Five tabs navigated via URL params. The CEO can view but not mutate any RM data (read-only enforcement at the database layer). Only `client_notes` are writable.

**R1 (Cycle 7):** Overview tab (KPIs + CPL trend + pipeline funnel + notes) and Timeline tab (activity history).
**R2 (Cycle 9):** Campaigns tab (reuse F10 table), Leads tab (reuse F08 table), and Financials tab (Stripe invoice data from F17).

### Success Criteria
- Overview KPI cards load within 2 seconds
- CPL LineChart is Recharts with JARVIS Dark theme, dynamic import (no SSR flash)
- Pipeline funnel SVG renders relative bar widths correctly for any lead counts
- Timeline groups events by date with icons per event type
- CEO cannot mutate leads, calls, or appointments via this page
- Playwright E2E covers tab navigation, note creation, and chart render

### Out of Scope (MVP)
- Editing client settings from the CEO view
- Sending the client messages (separate channel)
- Historical KPI period picker (fixed 30-day window in R1)

---

## 2. Database

No new tables. This feature reads from tables established in prior PRDs:
- `tenants`, `leads`, `calls`, `appointments`, `campaigns`, `ad_metrics`, `invoices` (F17)
- `activity_events` view (F07/F08 union)
- `client_notes` (F13)

### New View: Activity Events Per Tenant

```sql
-- supabase/migrations/0025_activity_events_view.sql

-- CEO-accessible version of activity_feed (F07) without tenant_id filter
-- (RLS handles tenant scoping; CEO reads all via policy)
CREATE OR REPLACE VIEW activity_events AS
SELECT
  'lead_created'          AS event_type,
  id                      AS entity_id,
  tenant_id,
  created_at              AS event_at,
  jsonb_build_object('name', full_name, 'source', lead_source) AS metadata
FROM leads
UNION ALL
SELECT
  'call_completed'        AS event_type,
  id,
  tenant_id,
  created_at              AS event_at,
  jsonb_build_object('outcome', outcome, 'duration_seconds', duration_seconds) AS metadata
FROM calls
WHERE status IN ('completed', 'voicemail', 'no_answer')
UNION ALL
SELECT
  'appointment_scheduled' AS event_type,
  id,
  tenant_id,
  created_at              AS event_at,
  jsonb_build_object('scheduled_at', scheduled_at, 'status', status) AS metadata
FROM appointments;

-- Allow CEO to read via existing RLS (view inherits base table policies)
```

### CPL Trend Query (30 days)

```sql
-- Used in the Overview tab CPL LineChart
-- 30 days of daily CPL: spend / leads per day
SELECT
  am.metric_date,
  SUM(am.spend)::NUMERIC AS total_spend,
  SUM(am.leads)::INTEGER AS total_leads,
  CASE
    WHEN SUM(am.leads) > 0 THEN ROUND(SUM(am.spend) / SUM(am.leads), 2)
    ELSE NULL
  END AS cpl
FROM ad_metrics am
WHERE am.tenant_id = $1
  AND am.metric_date >= CURRENT_DATE - INTERVAL '29 days'
GROUP BY am.metric_date
ORDER BY am.metric_date ASC;
```

---

## 3. TypeScript Interfaces

```typescript
// packages/db/src/types/ceo-client.types.ts

export type ClientDetailTab = 'overview' | 'timeline' | 'campaigns' | 'leads' | 'financials';

export interface ClientKpis {
  avg_cpl: number | null;
  leads_mtd: number;
  appointments_mtd: number;
  close_rate: number | null;
  mrr: number | null;
}

export interface CplDataPoint {
  date: string;        // YYYY-MM-DD
  cpl: number | null;
  spend: number;
  leads: number;
}

export interface PipelineStage {
  stage: string;
  count: number;
  label: string;
}

export interface ActivityEvent {
  event_type: 'lead_created' | 'call_completed' | 'appointment_scheduled' | 'onboarding_step';
  entity_id: string;
  tenant_id: string;
  event_at: string;
  metadata: Record<string, unknown>;
}

export interface ActivityGroup {
  date: string;        // YYYY-MM-DD
  label: string;       // e.g. "Monday, Jan 20"
  events: ActivityEvent[];
}

export interface ClientNote {
  id: string;
  tenant_id: string;
  author_id: string;
  text: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  stripe_invoice_id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  due_date: string;
  paid_at: string | null;
  period_start: string;
  period_end: string;
}

export interface ClientDetailData {
  tenant: {
    id: string;
    name: string;
    status: string;
    created_at: string;
  };
  kpis: ClientKpis;
  cpl_trend: CplDataPoint[];
  pipeline: PipelineStage[];
  recent_events: ActivityEvent[];
  notes: ClientNote[];
  // R2 additions
  invoices?: Invoice[];
}
```

---

## 4. Server Actions

```typescript
// apps/ceo/app/clients/[id]/actions.ts
'use server';

// Re-export from F13 actions (same file pattern)
export { addClientNote } from '../../actions';

// generateOnboardingToken also re-exported here for the client detail context
export { generateOnboardingToken } from '../../actions';
```

---

## 5. API Routes

No new API routes. All data loaded via RSC.

---

## 6. UI Components

### Client Detail Page (RSC)

```typescript
// apps/ceo/app/clients/[id]/page.tsx
import { createServerClient } from '@rainmachine/db';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ClientDetailHeader } from './ClientDetailHeader';
import { ClientTabBar } from './ClientTabBar';
import { OverviewTab } from './tabs/OverviewTab';
import { TimelineTab } from './tabs/TimelineTab';
import type { ClientDetailData, ClientDetailTab } from '@rainmachine/db/types/ceo-client.types';

const VALID_TABS: ClientDetailTab[] = ['overview', 'timeline', 'campaigns', 'leads', 'financials'];

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string };
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata.role !== 'ceo') redirect('/login');

  const tab: ClientDetailTab = (VALID_TABS.includes(searchParams.tab as ClientDetailTab)
    ? searchParams.tab
    : 'overview') as ClientDetailTab;

  // Load tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, status, created_at')
    .eq('id', params.id)
    .single();

  if (!tenant) notFound();

  // Parallel data loads for Overview tab
  const [kpisResult, cplResult, pipelineResult, eventsResult, notesResult] = await Promise.all([
    loadClientKpis(params.id, supabase),
    supabase.rpc('get_client_cpl_trend', { p_tenant_id: params.id }),
    loadPipeline(params.id, supabase),
    supabase
      .from('activity_events')
      .select('*')
      .eq('tenant_id', params.id)
      .order('event_at', { ascending: false })
      .limit(50),
    supabase
      .from('client_notes')
      .select('*')
      .eq('tenant_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const data: ClientDetailData = {
    tenant,
    kpis: kpisResult,
    cpl_trend: cplResult.data ?? [],
    pipeline: pipelineResult,
    recent_events: eventsResult.data ?? [],
    notes: notesResult.data ?? [],
  };

  return (
    <div className="min-h-screen bg-[#050D1A]" data-testid="client-detail-page">
      {/* Back nav */}
      <div className="px-8 pt-6">
        <Link
          href="/"
          className="font-mono text-sm text-gray-500 hover:text-[#00D4FF] transition-colors"
          data-testid="back-to-command-center"
        >
          ← COMMAND CENTER
        </Link>
      </div>

      {/* Header */}
      <ClientDetailHeader tenant={tenant} />

      {/* Read-only banner */}
      <div className="mx-8 mt-4 px-4 py-2.5 bg-[#1A2840] border border-[#2A3850] rounded-lg">
        <span className="font-mono text-xs text-gray-500">
          READ ONLY — CEO view. Changes must be made by the client's team leader.
        </span>
      </div>

      {/* Tab bar */}
      <ClientTabBar tenantId={params.id} activeTab={tab} />

      {/* Tab content */}
      <main className="px-8 py-8">
        {tab === 'overview' && <OverviewTab data={data} tenantId={params.id} />}
        {tab === 'timeline' && <TimelineTab events={data.recent_events} />}
        {tab === 'campaigns' && (
          <div className="font-mono text-gray-500 py-12 text-center" data-testid="campaigns-tab-placeholder">
            Campaigns view — available in R2
          </div>
        )}
        {tab === 'leads' && (
          <div className="font-mono text-gray-500 py-12 text-center" data-testid="leads-tab-placeholder">
            Leads view — available in R2
          </div>
        )}
        {tab === 'financials' && (
          <div className="font-mono text-gray-500 py-12 text-center" data-testid="financials-tab-placeholder">
            Financials — available in R2
          </div>
        )}
      </main>
    </div>
  );
}

async function loadClientKpis(tenantId: string, supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [leadsRes, appointmentsRes, metricsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgo),
    supabase
      .from('appointments')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgo),
    supabase
      .from('ad_metrics')
      .select('spend, leads, cpl')
      .eq('tenant_id', tenantId)
      .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
  ]);

  const totalLeads = leadsRes.count ?? 0;
  const totalAppts = appointmentsRes.count ?? 0;
  const metrics = metricsRes.data ?? [];
  const totalSpend = metrics.reduce((sum, m) => sum + (m.spend ?? 0), 0);
  const adLeads = metrics.reduce((sum, m) => sum + (m.leads ?? 0), 0);
  const avgCpl = adLeads > 0 ? totalSpend / adLeads : null;
  const closeRate = totalLeads > 0 ? (totalAppts / totalLeads) * 100 : null;

  return {
    avg_cpl: avgCpl ? Math.round(avgCpl * 100) / 100 : null,
    leads_mtd: totalLeads,
    appointments_mtd: totalAppts,
    close_rate: closeRate ? Math.round(closeRate * 10) / 10 : null,
    mrr: null, // populated in R2 from Stripe
  };
}

async function loadPipeline(tenantId: string, supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const { data } = await supabase
    .from('leads')
    .select('stage')
    .eq('tenant_id', tenantId)
    .eq('archived', false);

  const STAGES = ['new', 'contacted', 'appointment_set', 'appointment_held', 'closed'];
  const LABELS: Record<string, string> = {
    new: 'New', contacted: 'Contacted', appointment_set: 'Appt Set',
    appointment_held: 'Appt Held', closed: 'Closed',
  };

  return STAGES.map((stage) => ({
    stage,
    label: LABELS[stage],
    count: (data ?? []).filter((l) => l.stage === stage).length,
  }));
}
```

### ClientDetailHeader

```typescript
// apps/ceo/app/clients/[id]/ClientDetailHeader.tsx
interface Props {
  tenant: { id: string; name: string; status: string; created_at: string };
}

export function ClientDetailHeader({ tenant }: Props) {
  const statusColor = tenant.status === 'active' ? '#00FF88' : '#FF6B35';
  return (
    <header className="px-8 py-6 flex items-center gap-4" data-testid="client-detail-header">
      <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ background: statusColor }}
        data-testid="client-status-dot"
      />
      <h1 className="font-orbitron text-2xl text-white" data-testid="client-name">
        {tenant.name}
      </h1>
      <span className="font-mono text-xs text-gray-500 ml-2">
        Client since {new Date(tenant.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      </span>
    </header>
  );
}
```

### ClientTabBar

```typescript
// apps/ceo/app/clients/[id]/ClientTabBar.tsx
import Link from 'next/link';
import type { ClientDetailTab } from '@rainmachine/db/types/ceo-client.types';

const TABS: Array<{ key: ClientDetailTab; label: string; r2?: boolean }> = [
  { key: 'overview',    label: 'Overview' },
  { key: 'timeline',   label: 'Timeline' },
  { key: 'campaigns',  label: 'Campaigns', r2: true },
  { key: 'leads',      label: 'Leads',     r2: true },
  { key: 'financials', label: 'Financials', r2: true },
];

interface Props {
  tenantId: string;
  activeTab: ClientDetailTab;
}

export function ClientTabBar({ tenantId, activeTab }: Props) {
  return (
    <nav className="px-8 border-b border-[#1A2840] flex gap-1" data-testid="client-tab-bar">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`/clients/${tenantId}?tab=${tab.key}`}
          className={`px-5 py-3 font-mono text-sm border-b-2 transition-colors ${
            activeTab === tab.key
              ? 'border-[#00D4FF] text-[#00D4FF]'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
          data-testid={`tab-${tab.key}`}
        >
          {tab.label}
          {tab.r2 && (
            <span className="ml-2 text-xs text-gray-600 font-normal">R2</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
```

### OverviewTab

```typescript
// apps/ceo/app/clients/[id]/tabs/OverviewTab.tsx
'use client';
import dynamic from 'next/dynamic';
import { useState, useTransition } from 'react';
import { addClientNote } from '../actions';
import type { ClientDetailData } from '@rainmachine/db/types/ceo-client.types';

// Recharts dynamic imports (JARVIS Dark theme)
const LineChart = dynamic(() => import('recharts').then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false });

interface Props {
  data: ClientDetailData;
  tenantId: string;
}

export function OverviewTab({ data, tenantId }: Props) {
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState(data.notes);
  const [noteSaved, setNoteSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    startTransition(async () => {
      const result = await addClientNote({ tenant_id: tenantId, text: noteText });
      if (result.success) {
        setNotes((prev) => [
          {
            id: crypto.randomUUID(),
            tenant_id: tenantId,
            author_id: '',
            text: noteText,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setNoteText('');
        setNoteSaved(true);
        setTimeout(() => setNoteSaved(false), 2000);
      }
    });
  };

  // Chart data: format dates for x-axis
  const chartData = data.cpl_trend.map((p) => ({
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cpl: p.cpl,
    spend: p.spend,
  }));

  // Pipeline funnel: max count for relative bar width
  const maxCount = Math.max(...data.pipeline.map((s) => s.count), 1);

  return (
    <div className="space-y-10" data-testid="overview-tab">
      {/* KPI cards */}
      <section>
        <h2 className="font-mono text-xs text-gray-500 uppercase tracking-wider mb-4">Performance — Last 30 Days</h2>
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'AVG CPL', value: data.kpis.avg_cpl != null ? `$${data.kpis.avg_cpl.toFixed(2)}` : '—', testId: 'kpi-avg-cpl' },
            { label: 'LEADS MTD', value: data.kpis.leads_mtd.toLocaleString(), testId: 'kpi-leads-mtd' },
            { label: 'APPTS MTD', value: data.kpis.appointments_mtd.toLocaleString(), testId: 'kpi-appts-mtd' },
            { label: 'CLOSE RATE', value: data.kpis.close_rate != null ? `${data.kpis.close_rate}%` : '—', testId: 'kpi-close-rate' },
            { label: 'MRR', value: data.kpis.mrr != null ? `$${data.kpis.mrr.toLocaleString()}` : '—', testId: 'kpi-mrr' },
          ].map((card) => (
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
      </section>

      {/* CPL Trend Chart */}
      <section>
        <h2 className="font-mono text-xs text-gray-500 uppercase tracking-wider mb-4">CPL Trend — Last 30 Days</h2>
        <div
          className="bg-[#0A1628] border border-[#1A2840] rounded-xl p-6 h-56"
          data-testid="cpl-trend-chart"
        >
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: -10 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#4B5563', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                  axisLine={false}
                  tickLine={false}
                  interval={6}
                />
                <YAxis
                  tick={{ fill: '#4B5563', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{ background: '#050D1A', border: '1px solid #1A2840', fontFamily: 'Share Tech Mono', fontSize: 11 }}
                  formatter={(value: number) => [`$${value?.toFixed(2) ?? '—'}`, 'CPL']}
                />
                <Line
                  type="monotone"
                  dataKey="cpl"
                  stroke="#00D4FF"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full font-mono text-sm text-gray-600">
              No CPL data for this period
            </div>
          )}
        </div>
      </section>

      {/* Pipeline Funnel */}
      <section>
        <h2 className="font-mono text-xs text-gray-500 uppercase tracking-wider mb-4">Pipeline Funnel</h2>
        <div
          className="bg-[#0A1628] border border-[#1A2840] rounded-xl p-6 space-y-3"
          data-testid="pipeline-funnel"
        >
          {data.pipeline.map((stage) => {
            const widthPct = Math.round((stage.count / maxCount) * 100);
            return (
              <div key={stage.stage} className="flex items-center gap-4">
                <div className="w-28 font-mono text-xs text-gray-500 text-right">{stage.label}</div>
                <div className="flex-1 bg-[#1A2840] rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full bg-[#00D4FF] rounded-full transition-all duration-500"
                    style={{ width: `${widthPct}%` }}
                    data-testid={`funnel-bar-${stage.stage}`}
                  />
                </div>
                <div className="w-12 font-mono text-sm text-white text-right">
                  {stage.count.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Client Notes */}
      <section>
        <h2 className="font-mono text-xs text-gray-500 uppercase tracking-wider mb-4">Client Notes</h2>
        <div className="space-y-4">
          {/* Add note */}
          <div className="flex gap-3">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note about this client..."
              rows={2}
              className="flex-1 bg-[#0A1628] border border-[#1A2840] rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-gray-600 resize-none focus:border-[#00D4FF] focus:outline-none"
              data-testid="client-note-input"
            />
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim() || isPending}
              className="px-4 py-2 bg-[#00D4FF] text-[#050D1A] font-mono font-bold text-sm rounded-lg
                         disabled:opacity-40 hover:bg-[#00BFEF] self-end transition-colors"
              data-testid="add-note-button"
            >
              {isPending ? '…' : 'ADD'}
            </button>
          </div>
          {noteSaved && (
            <span className="font-mono text-xs text-[#00FF88]">Note saved</span>
          )}

          {/* Notes list */}
          <div className="space-y-2" data-testid="notes-list">
            {notes.length === 0 ? (
              <p className="font-mono text-sm text-gray-600">No notes yet.</p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-[#0A1628] border border-[#1A2840] rounded-lg px-4 py-3"
                  data-testid={`note-${note.id}`}
                >
                  <p className="font-mono text-sm text-gray-300">{note.text}</p>
                  <p className="font-mono text-xs text-gray-600 mt-1">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
```

### TimelineTab

```typescript
// apps/ceo/app/clients/[id]/tabs/TimelineTab.tsx
import type { ActivityEvent, ActivityGroup } from '@rainmachine/db/types/ceo-client.types';

const EVENT_CONFIG = {
  lead_created:          { icon: '◎', color: '#00D4FF', label: 'New Lead' },
  call_completed:        { icon: '◉', color: '#00FF88', label: 'Call' },
  appointment_scheduled: { icon: '◈', color: '#FFD700', label: 'Appointment' },
  onboarding_step:       { icon: '◆', color: '#A78BFA', label: 'Onboarding' },
};

function groupEventsByDate(events: ActivityEvent[]): ActivityGroup[] {
  const groups: Record<string, ActivityEvent[]> = {};
  for (const event of events) {
    const dateKey = event.event_at.split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(event);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, evts]) => ({
      date,
      label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      }),
      events: evts,
    }));
}

export function TimelineTab({ events }: { events: ActivityEvent[] }) {
  const groups = groupEventsByDate(events);

  return (
    <div className="space-y-8" data-testid="timeline-tab">
      {groups.length === 0 ? (
        <p className="font-mono text-sm text-gray-600">No activity recorded yet.</p>
      ) : (
        groups.map((group) => (
          <div key={group.date} data-testid={`timeline-group-${group.date}`}>
            <h3 className="font-mono text-xs text-gray-500 uppercase mb-3">{group.label}</h3>
            <div className="space-y-2 pl-4 border-l border-[#1A2840]">
              {group.events.map((event, idx) => {
                const config = EVENT_CONFIG[event.event_type] ?? { icon: '○', color: '#6B7280', label: event.event_type };
                return (
                  <div
                    key={`${event.entity_id}-${idx}`}
                    className="flex items-start gap-4 -ml-[11px]"
                    data-testid={`timeline-event-${event.entity_id}`}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0"
                      style={{ background: `${config.color}22`, color: config.color }}
                    >
                      {config.icon}
                    </span>
                    <div>
                      <div className="font-mono text-sm text-white">{config.label}</div>
                      <div className="font-mono text-xs text-gray-500 mt-0.5">
                        {new Date(event.event_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {event.metadata?.name && ` — ${event.metadata.name}`}
                        {event.metadata?.outcome && ` — ${event.metadata.outcome}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
```

---

## 7. Integration Points

### R2 — Campaigns Tab
In R2, the Campaigns placeholder is replaced with the actual `CampaignsClient` component from F10, scoped to the `tenantId` param. The CEO Supabase client has read-only RLS for `campaigns` (CEO select-all policy from F13).

### R2 — Leads Tab
In R2, the Leads placeholder is replaced with `LeadsClient` from F08 in read-only mode. A `readOnly` prop disables all mutations (stage changes, bulk actions, export).

### R2 — Financials Tab
In R2, the Financials placeholder is replaced with an invoice table reading from the `invoices` table (populated by F17 Stripe webhook). MRR, contract end, and billed-YTD KPIs display in the header.

### Recharts JARVIS Dark Config
All charts in the CEO app use a shared config:
```typescript
// packages/ui/src/lib/chart-theme.ts
export const CHART_THEME = {
  backgroundColor: '#050D1A',
  gridColor: '#1A2840',
  textColor: '#4B5563',
  primaryLine: '#00D4FF',
  successLine: '#00FF88',
  alertLine: '#FF6B35',
  tooltipBg: '#0A1628',
  tooltipBorder: '#1A2840',
  fontFamily: 'Share Tech Mono, monospace',
};
```

---

## 8. BDD Scenarios

```gherkin
Feature: F14 — CEO Client Detail

  Background:
    Given I am authenticated as CEO
    And tenant "Acme Realty" exists with 30 days of lead/campaign data

  Scenario: Navigate to client detail from Command Center
    Given I am on the CEO Command Center
    When I click "VIEW →" for "Acme Realty"
    Then I navigate to /clients/{acme_id}
    And I see client-detail-header with "Acme Realty"
    And I see the read-only banner

  Scenario: Overview tab KPIs load correctly
    Given "Acme Realty" has 40 leads and 15 appointments in the last 30 days
    When I view the overview-tab
    Then kpi-leads-mtd shows 40
    And kpi-appts-mtd shows 15
    And kpi-close-rate shows "37.5%"

  Scenario: CPL trend chart renders
    Given "Acme Realty" has ad_metrics data for the last 30 days
    When I view the cpl-trend-chart
    Then the LineChart renders without SSR flash
    And the x-axis shows date labels
    And no errors in console

  Scenario: Pipeline funnel bar widths are proportional
    Given pipeline: new=40, contacted=30, appt_set=15, appt_held=10, closed=5
    When I view the pipeline-funnel
    Then funnel-bar-new has width 100%
    And funnel-bar-contacted has width 75%
    And funnel-bar-closed has width 12%

  Scenario: Add client note
    When I type "Client mentioned they're switching ISA vendors" in client-note-input
    And I click ADD
    Then the note appears in notes-list
    And client_notes table has the new row

  Scenario: Timeline groups by date
    Given "Acme Realty" has events on Jan 20 and Jan 21
    When I click the Timeline tab
    Then I see two timeline groups
    And events within each group show icons and timestamps

  Scenario: Tab navigation via URL
    When I navigate to /clients/{id}?tab=timeline
    Then the timeline tab is active (cyan underline)
    And the browser URL contains ?tab=timeline

  Scenario: R2 tabs show placeholder
    When I click the Campaigns tab
    Then I see "available in R2" placeholder message
    And no errors occur
```

---

## 9. Test Plan

### Unit Tests

```typescript
// apps/ceo/app/clients/[id]/__tests__/groupEventsByDate.test.ts
describe('groupEventsByDate', () => {
  it('groups events from same day together', () => {
    const events = [
      { event_at: '2025-01-20T10:00:00Z', entity_id: '1', event_type: 'lead_created' },
      { event_at: '2025-01-20T14:00:00Z', entity_id: '2', event_type: 'call_completed' },
      { event_at: '2025-01-21T09:00:00Z', entity_id: '3', event_type: 'appointment_scheduled' },
    ];
    const groups = groupEventsByDate(events as ActivityEvent[]);
    expect(groups).toHaveLength(2);
    expect(groups[0].events).toHaveLength(2); // Jan 21 is first (most recent)
    expect(groups[1].events).toHaveLength(1);
  });

  it('sorts groups most recent first', () => {
    const events = [
      { event_at: '2025-01-18T10:00:00Z', entity_id: '1', event_type: 'lead_created' },
      { event_at: '2025-01-22T10:00:00Z', entity_id: '2', event_type: 'lead_created' },
    ];
    const groups = groupEventsByDate(events as ActivityEvent[]);
    expect(groups[0].date).toBe('2025-01-22');
  });
});

describe('loadClientKpis (pipeline funnel)', () => {
  it('calculates close_rate as (appointments / leads) * 100', () => {
    // Mock: 40 leads, 15 appts
    // Expect: close_rate = 37.5
  });

  it('returns null close_rate when leads = 0', () => {
    // Mock: 0 leads
    // Expect: close_rate = null
  });
});
```

### Playwright E2E

```typescript
// apps/ceo/e2e/client-detail.spec.ts
test('tab navigation', async ({ page }) => {
  await page.goto('/clients/test-tenant-id');
  await expect(page.getByTestId('tab-overview')).toHaveClass(/border-\[#00D4FF\]/);
  await page.getByTestId('tab-timeline').click();
  await expect(page.url()).toContain('?tab=timeline');
  await expect(page.getByTestId('timeline-tab')).toBeVisible();
});

test('CPL chart renders without SSR flash', async ({ page }) => {
  await page.goto('/clients/test-tenant-id');
  // Wait for dynamic import
  await expect(page.getByTestId('cpl-trend-chart')).toBeVisible();
  const errors: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  expect(errors.filter((e) => e.includes('hydration'))).toHaveLength(0);
});

test('add client note', async ({ page }) => {
  await page.goto('/clients/test-tenant-id');
  await page.getByTestId('client-note-input').fill('Test note from E2E');
  await page.getByTestId('add-note-button').click();
  await expect(page.getByText('Test note from E2E')).toBeVisible();
});

test('read-only banner is visible', async ({ page }) => {
  await page.goto('/clients/test-tenant-id');
  await expect(page.getByText('READ ONLY')).toBeVisible();
});
```

---

## 10. OWASP Security Checklist

| # | Check | Implementation |
|---|-------|----------------|
| 1 | **Broken Access Control** | Page redirects non-CEO users to login. All data queries use CEO-role supabase client. |
| 2 | **Read-Only Enforcement** | CEO RLS policies have no UPDATE/INSERT for leads, calls, appointments. Only `client_notes` has CEO insert policy. |
| 3 | **IDOR** | `params.id` (tenant ID) is validated by RLS — CEO policy allows all tenants, but anonymous requests return nothing. |
| 4 | **Input Validation** | `addClientNote` Zod-validates text length (1–2000 chars). |
| 5 | **XSS** | Chart tooltip uses `formatter` callback (numeric values only, not user text). All text rendered via React text nodes. |
| 6 | **Recharts SSR** | Dynamic imports prevent server-side rendering of chart components — no client/server mismatch errors or XSS vectors. |
| 7 | **SQL Injection** | CPL trend query uses parameterized RPC (`p_tenant_id`). No raw string interpolation in queries. |
| 8 | **Stale Data** | `revalidatePath` called after note insertion. Chart data loaded fresh on each page render (no stale cache). |
| 9 | **Role Enforcement** | `addClientNote` server action double-checks `role !== 'ceo'` even though page-level redirect exists. |
| 10 | **Sensitive Tenant Data** | CEO client detail is accessible to CEO only. No shared links, no public slugs. URL uses internal UUID only. |

---

## 11. Open Questions

| ID | Question | Owner | Resolution |
|----|----------|-------|------------|
| OQ-01 | Should the CPL trend chart include a target CPL line (from CEO settings)? | Design | Yes in R2 — a dashed reference line at `ceo_settings.cpl_threshold`. Not in R1. |
| OQ-02 | Should the pipeline funnel show percentage conversion between stages? | Design | No — counts only in R1. Conversion percentages added in a future enhancement cycle. |
| OQ-03 | How should the timeline handle extremely high event volumes (1000+/day)? | Engineering | Timeline is capped at 50 events. "Load more" button deferred to R2. |
| OQ-04 | In R2, what does "read-only" mean for the Leads tab? Can CEO filter/sort? | Product | Yes — filtering and sorting is allowed. Row-level actions (stage change, archive) are hidden. Export is allowed. |
| OQ-05 | Should MRR in the Overview KPIs show an up/down arrow vs. last month? | Design | Yes — add delta badge in R2 when Stripe data is available. R1 shows raw value or "—". |

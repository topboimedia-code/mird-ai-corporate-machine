# F19 — CEO Drilldowns: Product + Finance

## 1. Overview

### Feature Summary
Two full-page CEO drilldown views: **Product Operations** (`/departments/product`) and **Finance Intelligence** (`/departments/finance`). Product shows the onboarding pipeline and workflow health. Finance shows MRR trends, P&L breakdowns, and per-client revenue detail. Both pages are React Server Components under the CEO app, CEO-gated at every data boundary.

### Goals
- Give the CEO a real-time view into onboarding queue depth and workflow failures without digging into individual client records
- Surface MRR trend, churn, and P&L data synthesized by the Financial Intelligence agent (F17)
- Enable per-client financial drilldown from a single page without a full client context switch

### Non-Goals
- No editing of onboarding steps from this view (ops team manages via direct Supabase access)
- No payment collection or invoice generation (Stripe manages this)
- No historical data before RainMachine launch date

### Cycle
Cycle 10 — R2, Medium

### App
`apps/ceo`

---

## 2. Database Schema

### New Tables

#### `onboarding_jobs` (already defined in F06 — referenced here, not re-created)
```sql
-- Existing columns relevant to F19:
-- id uuid PK
-- tenant_id uuid FK tenants
-- status text CHECK ('pending','processing','completed','failed')
-- step_statuses JSONB  -- { "step1": "completed", "step2": "completed", ... }
-- current_step integer
-- started_at timestamptz
-- completed_at timestamptz
-- error_message text
-- created_at timestamptz DEFAULT now()
```

#### `workflow_runs` (already defined in F17 — referenced here, not re-created)
```sql
-- Existing columns relevant to F19:
-- id uuid PK
-- tenant_id uuid FK tenants (nullable — platform-level runs have no tenant)
-- workflow_name text NOT NULL
-- n8n_execution_id text
-- status text CHECK ('success','failed','partial')
-- started_at timestamptz
-- finished_at timestamptz
-- records_processed integer DEFAULT 0
-- error_details JSONB
-- created_at timestamptz DEFAULT now()
```

#### `invoices` (already defined in F17 — referenced here, not re-created)
```sql
-- Existing columns relevant to F19:
-- id uuid PK
-- tenant_id uuid FK tenants
-- stripe_invoice_id text UNIQUE
-- amount_cents integer
-- currency text DEFAULT 'usd'
-- status text CHECK ('draft','open','paid','void','uncollectible')
-- invoice_date date
-- due_date date
-- paid_at timestamptz
-- stripe_customer_id text
-- created_at timestamptz DEFAULT now()
```

#### `agent_finance_reports` — NEW (migration 0033)
```sql
CREATE TABLE agent_finance_reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start   date NOT NULL,
  raw_output   JSONB NOT NULL,       -- full FinanceReportSchemaZod output
  created_at   timestamptz DEFAULT now(),
  UNIQUE (week_start)
);

-- RLS
ALTER TABLE agent_finance_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO can read finance reports"
  ON agent_finance_reports
  FOR SELECT
  USING (auth.is_ceo());
```

> **Why a separate table?** The Finance agent (F17) writes a platform-wide P&L report, not a per-tenant report. It doesn't belong in `reports` (which is per-tenant). Separating concerns keeps querying simple.

### New Views

#### `onboarding_queue_view` (migration 0034)
```sql
CREATE VIEW onboarding_queue_view AS
SELECT
  oj.id                                                     AS job_id,
  t.id                                                      AS tenant_id,
  t.name                                                    AS client_name,
  t.slug,
  oj.status                                                 AS job_status,
  oj.current_step,
  oj.step_statuses,
  oj.started_at,
  oj.completed_at,
  oj.error_message,
  EXTRACT(DAY FROM now() - oj.started_at)::integer         AS days_active,
  CASE
    WHEN oj.status = 'failed' THEN 'error'
    WHEN oj.status = 'completed' THEN 'live'
    WHEN EXTRACT(DAY FROM now() - oj.started_at) > 7 THEN 'stalled'
    ELSE 'active'
  END                                                       AS queue_status
FROM onboarding_jobs oj
JOIN tenants t ON t.id = oj.tenant_id
ORDER BY
  CASE oj.status WHEN 'failed' THEN 0 WHEN 'processing' THEN 1 ELSE 2 END,
  oj.started_at DESC;
```

#### `workflow_health_view` (migration 0034)
```sql
CREATE VIEW workflow_health_view AS
SELECT
  workflow_name,
  COUNT(*)                                                  AS total_runs_7d,
  COUNT(*) FILTER (WHERE status = 'failed')                 AS failed_runs_7d,
  COUNT(*) FILTER (WHERE status = 'success')                AS success_runs_7d,
  MAX(finished_at)                                          AS last_run_at,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'success')
    / NULLIF(COUNT(*), 0), 1
  )                                                         AS success_rate_pct,
  MAX(finished_at) FILTER (WHERE status = 'failed')         AS last_failure_at
FROM workflow_runs
WHERE started_at >= now() - INTERVAL '7 days'
GROUP BY workflow_name
ORDER BY failed_runs_7d DESC, workflow_name;
```

#### `mrr_trend_view` (migration 0034)
```sql
CREATE VIEW mrr_trend_view AS
SELECT
  date_trunc('month', dm.date)::date    AS month,
  SUM(dm.mrr)                           AS total_mrr,
  COUNT(DISTINCT dm.tenant_id)          AS active_clients,
  LAG(SUM(dm.mrr)) OVER (
    ORDER BY date_trunc('month', dm.date)
  )                                     AS prev_month_mrr
FROM daily_metrics dm
WHERE dm.date >= now() - INTERVAL '12 months'
  AND dm.mrr > 0
GROUP BY date_trunc('month', dm.date)
ORDER BY month;
```

#### `client_financials_view` (migration 0034)
```sql
CREATE VIEW client_financials_view AS
SELECT
  t.id                                                      AS tenant_id,
  t.name                                                    AS client_name,
  t.slug,
  COALESCE(SUM(i.amount_cents) FILTER (
    WHERE i.status = 'paid'
    AND i.invoice_date >= date_trunc('month', now())
  ), 0) / 100.0                                             AS mrr_current,
  COALESCE(SUM(i.amount_cents) FILTER (
    WHERE i.status = 'paid'
    AND i.invoice_date >= date_trunc('year', now())
  ), 0) / 100.0                                             AS arr_ytd,
  COUNT(i.id) FILTER (WHERE i.status = 'open')              AS open_invoices,
  COUNT(i.id) FILTER (WHERE i.status = 'uncollectible')     AS uncollectible_invoices,
  MAX(i.paid_at)                                            AS last_payment_at
FROM tenants t
LEFT JOIN invoices i ON i.tenant_id = t.id
WHERE t.status = 'active'
GROUP BY t.id, t.name, t.slug
ORDER BY mrr_current DESC;
```

### Migrations Summary
| Migration | Description |
|-----------|-------------|
| 0033 | `agent_finance_reports` table + RLS |
| 0034 | Views: `onboarding_queue_view`, `workflow_health_view`, `mrr_trend_view`, `client_financials_view` |

---

## 3. TypeScript Interfaces

```typescript
// packages/db/src/types/product.types.ts

export type QueueStatus = 'active' | 'stalled' | 'error' | 'live';

export interface OnboardingQueueRow {
  job_id: string;
  tenant_id: string;
  client_name: string;
  slug: string;
  job_status: 'pending' | 'processing' | 'completed' | 'failed';
  current_step: number;
  step_statuses: Record<string, 'pending' | 'in_progress' | 'completed' | 'failed'>;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  days_active: number;
  queue_status: QueueStatus;
}

export interface WorkflowHealthRow {
  workflow_name: string;
  total_runs_7d: number;
  failed_runs_7d: number;
  success_runs_7d: number;
  last_run_at: string | null;
  success_rate_pct: number | null;
  last_failure_at: string | null;
}

export interface ProductKpis {
  onboarding_queue_count: number;     // non-completed jobs
  active_workflows_count: number;     // distinct workflows with runs in 7d
  workflow_errors_7d: number;         // total failed runs in 7d
  avg_days_to_launch: number;         // avg days from started_at to completed_at
  clients_live_this_month: number;    // completed_at in current calendar month
}
```

```typescript
// packages/db/src/types/finance.types.ts

import { z } from 'zod';

export interface MrrTrendRow {
  month: string;          // ISO date string 'YYYY-MM-DD'
  total_mrr: number;
  active_clients: number;
  prev_month_mrr: number | null;
  mom_growth_pct: number | null;   // computed client-side: (total_mrr - prev) / prev * 100
}

export interface ClientFinancialsRow {
  tenant_id: string;
  client_name: string;
  slug: string;
  mrr_current: number;
  arr_ytd: number;
  open_invoices: number;
  uncollectible_invoices: number;
  last_payment_at: string | null;
}

export interface FinanceKpis {
  total_mrr: number;
  churn_rate_pct: number;        // clients churned this month / active last month * 100
  new_arr_this_month: number;    // sum of new client ARR (started this calendar month)
  net_revenue_retention: number; // NRR: (MRR_end - churn + expansion) / MRR_start * 100
  active_client_count: number;
}

// P&L row from agent_finance_reports (raw_output JSONB)
export const PlRowSchema = z.object({
  month: z.string(),            // 'YYYY-MM'
  revenue: z.number(),
  cogs: z.number(),
  gross_margin_pct: z.number(),
  net_margin_pct: z.number(),
  operating_expenses: z.number().optional(),
});
export type PlRow = z.infer<typeof PlRowSchema>;

export const FinanceReportSchema = z.object({
  week_start: z.string(),
  generated_at: z.string(),
  total_mrr: z.number(),
  churn_rate_pct: z.number(),
  new_arr_this_month: z.number(),
  net_revenue_retention: z.number(),
  pl_rows: z.array(PlRowSchema),
  narrative: z.string(),
});
export type FinanceReport = z.infer<typeof FinanceReportSchema>;
```

```typescript
// packages/db/src/types/agents.types.ts  (additions to F17 definition)

// FinanceReportSchemaZod — already defined in F17
// Exported for use by F19 UI layer
export { FinanceReportSchemaZod } from './finance.types';
```

---

## 4. Server Actions

All server actions live in `apps/ceo/src/actions/`.

### `product.actions.ts`

```typescript
'use server';

import { createServerClient } from '@/lib/supabase/server';
import {
  OnboardingQueueRow,
  WorkflowHealthRow,
  ProductKpis,
} from '@rainmachine/db/types/product.types';

async function assertCeo() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'ceo') {
    throw new Error('Unauthorized');
  }
  return supabase;
}

export async function getProductKpis(): Promise<ProductKpis> {
  const supabase = await assertCeo();

  const [
    { count: queueCount },
    { data: workflowRows },
    { data: launchData },
  ] = await Promise.all([
    supabase
      .from('onboarding_jobs')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'completed'),
    supabase
      .from('workflow_health_view')
      .select('workflow_name, total_runs_7d, failed_runs_7d'),
    supabase
      .from('onboarding_jobs')
      .select('started_at, completed_at')
      .eq('status', 'completed'),
  ]);

  const activeWorkflows = (workflowRows ?? []).filter(w => w.total_runs_7d > 0).length;
  const workflowErrors7d = (workflowRows ?? []).reduce(
    (sum, w) => sum + (w.failed_runs_7d ?? 0), 0
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let totalDays = 0;
  let completedCount = 0;
  let liveThisMonth = 0;

  for (const job of launchData ?? []) {
    const start = new Date(job.started_at);
    const end = new Date(job.completed_at!);
    totalDays += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    completedCount++;
    if (end >= monthStart) liveThisMonth++;
  }

  return {
    onboarding_queue_count: queueCount ?? 0,
    active_workflows_count: activeWorkflows,
    workflow_errors_7d: workflowErrors7d,
    avg_days_to_launch: completedCount > 0 ? Math.round(totalDays / completedCount) : 0,
    clients_live_this_month: liveThisMonth,
  };
}

export async function getOnboardingQueue(): Promise<OnboardingQueueRow[]> {
  const supabase = await assertCeo();
  const { data, error } = await supabase
    .from('onboarding_queue_view')
    .select('*');
  if (error) throw new Error(error.message);
  return (data ?? []) as OnboardingQueueRow[];
}

export async function getOnboardingJobDetail(
  jobId: string
): Promise<OnboardingQueueRow | null> {
  const supabase = await assertCeo();
  const { data, error } = await supabase
    .from('onboarding_queue_view')
    .select('*')
    .eq('job_id', jobId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as OnboardingQueueRow | null;
}

export async function getWorkflowHealth(): Promise<WorkflowHealthRow[]> {
  const supabase = await assertCeo();
  const { data, error } = await supabase
    .from('workflow_health_view')
    .select('*');
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkflowHealthRow[];
}

export async function retriggerOnboardingJob(jobId: string): Promise<void> {
  const supabase = await assertCeo();

  // Reset job to pending so the processor picks it up again
  const { error } = await supabase
    .from('onboarding_jobs')
    .update({
      status: 'pending',
      error_message: null,
      current_step: 1,
    })
    .eq('id', jobId)
    .eq('status', 'failed'); // safety: only re-trigger failed jobs

  if (error) throw new Error(error.message);
}
```

### `finance.actions.ts`

```typescript
'use server';

import { createServerClient } from '@/lib/supabase/server';
import {
  MrrTrendRow,
  ClientFinancialsRow,
  FinanceKpis,
  FinanceReport,
  FinanceReportSchema,
} from '@rainmachine/db/types/finance.types';

async function assertCeo() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'ceo') {
    throw new Error('Unauthorized');
  }
  return supabase;
}

export async function getFinanceKpis(): Promise<FinanceKpis> {
  const supabase = await assertCeo();

  const { data: mrrRows } = await supabase
    .from('mrr_trend_view')
    .select('month, total_mrr, active_clients')
    .order('month', { ascending: false })
    .limit(2);

  const [current, previous] = mrrRows ?? [];
  const currentMrr = current?.total_mrr ?? 0;
  const prevMrr = previous?.total_mrr ?? 0;

  // Churn approximation: clients lost = prev active - current active (if negative = growth)
  const clientsLost = Math.max(0, (previous?.active_clients ?? 0) - (current?.active_clients ?? 0));
  const churnRate = previous?.active_clients
    ? Math.round((clientsLost / previous.active_clients) * 100 * 10) / 10
    : 0;

  // NRR: if MRR grew, NRR > 100; simplified as (current / prev) * 100
  const nrr = prevMrr > 0
    ? Math.round((currentMrr / prevMrr) * 100 * 10) / 10
    : 100;

  // New ARR: sum of new clients this month (started_at in current month)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data: newClients } = await supabase
    .from('tenants')
    .select('id')
    .gte('created_at', monthStart)
    .eq('status', 'active');

  // Approximate new ARR as new clients * avg MRR * 12
  const avgMrr = (current?.active_clients ?? 1) > 0
    ? currentMrr / (current?.active_clients ?? 1)
    : 0;
  const newArr = (newClients?.length ?? 0) * avgMrr * 12;

  return {
    total_mrr: currentMrr,
    churn_rate_pct: churnRate,
    new_arr_this_month: Math.round(newArr),
    net_revenue_retention: nrr,
    active_client_count: current?.active_clients ?? 0,
  };
}

export async function getMrrTrend(): Promise<MrrTrendRow[]> {
  const supabase = await assertCeo();
  const { data, error } = await supabase
    .from('mrr_trend_view')
    .select('*')
    .order('month', { ascending: true });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    ...row,
    mom_growth_pct: row.prev_month_mrr
      ? Math.round(
          ((row.total_mrr - row.prev_month_mrr) / row.prev_month_mrr) * 100 * 10
        ) / 10
      : null,
  })) as MrrTrendRow[];
}

export async function getClientFinancials(): Promise<ClientFinancialsRow[]> {
  const supabase = await assertCeo();
  const { data, error } = await supabase
    .from('client_financials_view')
    .select('*');
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientFinancialsRow[];
}

export async function getLatestFinanceReport(): Promise<FinanceReport | null> {
  const supabase = await assertCeo();
  const { data, error } = await supabase
    .from('agent_finance_reports')
    .select('raw_output')
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const parsed = FinanceReportSchema.safeParse(data.raw_output);
  return parsed.success ? parsed.data : null;
}
```

---

## 5. API Routes

### `GET /api/departments/product/onboarding/[jobId]`
```
apps/ceo/app/api/departments/product/onboarding/[jobId]/route.ts
```

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'ceo') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('onboarding_queue_view')
    .select('*')
    .eq('job_id', params.jobId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
```

### `POST /api/departments/product/onboarding/[jobId]/retrigger`
```typescript
// apps/ceo/app/api/departments/product/onboarding/[jobId]/retrigger/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { retriggerOnboardingJob } from '@/actions/product.actions';

export async function POST(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await retriggerOnboardingJob(params.jobId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const status = msg === 'Unauthorized' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
```

---

## 6. UI Components

### Product Page — `apps/ceo/app/departments/product/page.tsx`

```typescript
import { Suspense } from 'react';
import { getProductKpis, getOnboardingQueue, getWorkflowHealth } from '@/actions/product.actions';
import { ProductKpiSection } from './_components/ProductKpiSection';
import { OnboardingQueueTable } from './_components/OnboardingQueueTable';
import { WorkflowHealthPanel } from './_components/WorkflowHealthPanel';
import { KpiSkeleton, TableSkeleton } from '@rainmachine/ui';

export const metadata = { title: 'Product Operations — RainMachine CEO' };

export default async function ProductPage() {
  const [kpis, queue, workflows] = await Promise.all([
    getProductKpis(),
    getOnboardingQueue(),
    getWorkflowHealth(),
  ]);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-orbitron text-white">
          Product Operations
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Onboarding pipeline · Workflow health · Launch metrics
        </p>
      </div>

      <Suspense fallback={<KpiSkeleton count={5} />}>
        <ProductKpiSection kpis={kpis} />
      </Suspense>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Suspense fallback={<TableSkeleton rows={8} />}>
            <OnboardingQueueTable rows={queue} />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<TableSkeleton rows={6} />}>
            <WorkflowHealthPanel rows={workflows} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
```

### `ProductKpiSection`

```typescript
// apps/ceo/app/departments/product/_components/ProductKpiSection.tsx
'use client';

import { KpiCard } from '@rainmachine/ui';
import type { ProductKpis } from '@rainmachine/db/types/product.types';

const DEFINITIONS = [
  { key: 'onboarding_queue_count', label: 'Onboarding Queue', suffix: '', description: 'Active (non-completed) jobs' },
  { key: 'active_workflows_count', label: 'Active Workflows', suffix: '', description: 'Distinct workflows run in 7d' },
  { key: 'workflow_errors_7d', label: 'Workflow Errors 7D', suffix: '', description: 'Failed workflow runs this week', alertThreshold: 3 },
  { key: 'avg_days_to_launch', label: 'Avg Days to Launch', suffix: 'd', description: 'From job start to completed' },
  { key: 'clients_live_this_month', label: 'Launched This Month', suffix: '', description: 'Clients went live in current month' },
] as const;

export function ProductKpiSection({ kpis }: { kpis: ProductKpis }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {DEFINITIONS.map(({ key, label, suffix, description, alertThreshold }) => {
        const value = kpis[key];
        const isAlert = alertThreshold !== undefined && value >= alertThreshold;
        return (
          <KpiCard
            key={key}
            label={label}
            value={`${value}${suffix}`}
            description={description}
            variant={isAlert ? 'alert' : 'default'}
          />
        );
      })}
    </div>
  );
}
```

### `OnboardingQueueTable`

```typescript
// apps/ceo/app/departments/product/_components/OnboardingQueueTable.tsx
'use client';

import Link from 'next/link';
import type { OnboardingQueueRow, QueueStatus } from '@rainmachine/db/types/product.types';

const STATUS_BADGE: Record<QueueStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  stalled: { label: 'Stalled', className: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' },
  error: { label: 'Error', className: 'bg-red-500/20 text-red-300 border border-red-500/30' },
  live: { label: 'Live', className: 'bg-green-500/20 text-green-300 border border-green-500/30' },
};

const STEP_LABELS = ['Contract', 'Mission', 'Ad Account', 'Google', 'Launch Config'];

export function OnboardingQueueTable({ rows }: { rows: OnboardingQueueRow[] }) {
  return (
    <div className="bg-[#0A1628] border border-white/10 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white font-orbitron tracking-wider uppercase">
          Onboarding Queue
        </h2>
        <span className="text-xs text-gray-400">{rows.length} jobs</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Client</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Step</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Days Active</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => {
              const badge = STATUS_BADGE[row.queue_status];
              const stepLabel = STEP_LABELS[row.current_step - 1] ?? `Step ${row.current_step}`;
              return (
                <tr key={row.job_id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{row.client_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{stepLabel}</td>
                  <td className="px-4 py-3 text-gray-300">
                    <span className={row.days_active > 7 ? 'text-orange-400 font-medium' : ''}>
                      {row.days_active}d
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/departments/product/onboarding/${row.job_id}`}
                      className="text-[#00D4FF] hover:underline text-xs"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                  No active onboarding jobs
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### `WorkflowHealthPanel`

```typescript
// apps/ceo/app/departments/product/_components/WorkflowHealthPanel.tsx
'use client';

import type { WorkflowHealthRow } from '@rainmachine/db/types/product.types';
import { formatDistanceToNow } from 'date-fns';

function HealthDot({ rate }: { rate: number | null }) {
  if (rate === null) return <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" />;
  if (rate >= 95) return <span className="w-2 h-2 rounded-full bg-[#00FF88] inline-block" />;
  if (rate >= 80) return <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />;
}

const WORKFLOW_DISPLAY_NAMES: Record<string, string> = {
  'ad-sync': 'Ad Sync',
  'weekly-intelligence': 'Weekly Intel',
  'ad-ops-agent': 'Ad Ops Agent',
  'growth-agent': 'Growth Agent',
  'finance-agent': 'Finance Agent',
  'apollo-sync': 'Apollo Sync',
  'routing-sync': 'Routing Sync',
};

export function WorkflowHealthPanel({ rows }: { rows: WorkflowHealthRow[] }) {
  return (
    <div className="bg-[#0A1628] border border-white/10 rounded-xl overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-white/10">
        <h2 className="text-sm font-semibold text-white font-orbitron tracking-wider uppercase">
          Workflow Health (7d)
        </h2>
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((row) => (
          <div key={row.workflow_name} className="px-4 py-3 flex items-center gap-3">
            <HealthDot rate={row.success_rate_pct} />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">
                {WORKFLOW_DISPLAY_NAMES[row.workflow_name] ?? row.workflow_name}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {row.success_rate_pct !== null ? `${row.success_rate_pct}% success` : 'No runs'} ·{' '}
                {row.failed_runs_7d > 0 && (
                  <span className="text-red-400">{row.failed_runs_7d} failed</span>
                )}
                {row.failed_runs_7d === 0 && (
                  <span className="text-green-400">{row.success_runs_7d} succeeded</span>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500 text-right shrink-0">
              {row.last_run_at
                ? formatDistanceToNow(new Date(row.last_run_at), { addSuffix: true })
                : 'Never'}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            No workflow runs in the past 7 days
          </div>
        )}
      </div>
    </div>
  );
}
```

### Onboarding Status Sub-page — `apps/ceo/app/departments/product/onboarding/[jobId]/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import { getOnboardingJobDetail } from '@/actions/product.actions';
import { StepProgressIndicator } from './_components/StepProgressIndicator';
import { StepHistoryTimeline } from './_components/StepHistoryTimeline';
import { RetriggerButton } from './_components/RetriggerButton';
import Link from 'next/link';

export default async function OnboardingJobPage({
  params,
}: {
  params: { jobId: string };
}) {
  const job = await getOnboardingJobDetail(params.jobId);
  if (!job) notFound();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/departments/product"
            className="text-xs text-gray-400 hover:text-[#00D4FF] mb-2 inline-block"
          >
            ← Product Operations
          </Link>
          <h1 className="text-2xl font-bold font-orbitron text-white">
            {job.client_name}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Onboarding Job · Started {new Date(job.started_at).toLocaleDateString()}
          </p>
        </div>
        {job.queue_status === 'error' && (
          <RetriggerButton jobId={job.job_id} />
        )}
      </div>

      {job.error_message && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-300">
          <span className="font-semibold">Last error: </span>{job.error_message}
        </div>
      )}

      <StepProgressIndicator
        currentStep={job.current_step}
        stepStatuses={job.step_statuses}
        jobStatus={job.job_status}
      />

      <StepHistoryTimeline stepStatuses={job.step_statuses} />
    </div>
  );
}
```

### `StepProgressIndicator`

```typescript
// apps/ceo/app/departments/product/onboarding/[jobId]/_components/StepProgressIndicator.tsx
'use client';

const STEPS = [
  { number: 1, label: 'Contract' },
  { number: 2, label: 'Mission' },
  { number: 3, label: 'Ad Account' },
  { number: 4, label: 'Google' },
  { number: 5, label: 'Launch Config' },
];

type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

interface Props {
  currentStep: number;
  stepStatuses: Record<string, StepStatus>;
  jobStatus: string;
}

function StepCircle({ status, number }: { status: StepStatus; number: number }) {
  const baseClass = 'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2';
  if (status === 'completed')
    return <div className={`${baseClass} bg-[#00FF88]/20 border-[#00FF88] text-[#00FF88]`}>✓</div>;
  if (status === 'failed')
    return <div className={`${baseClass} bg-red-500/20 border-red-400 text-red-400`}>✗</div>;
  if (status === 'in_progress')
    return <div className={`${baseClass} bg-[#00D4FF]/20 border-[#00D4FF] text-[#00D4FF] animate-pulse`}>{number}</div>;
  return <div className={`${baseClass} bg-white/5 border-white/20 text-gray-500`}>{number}</div>;
}

export function StepProgressIndicator({ currentStep, stepStatuses, jobStatus }: Props) {
  return (
    <div className="bg-[#0A1628] border border-white/10 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-white font-orbitron tracking-wider uppercase mb-6">
        Step Progress
      </h2>
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const statusKey = `step${step.number}`;
          const status: StepStatus = stepStatuses[statusKey] ?? 'pending';
          return (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-2">
                <StepCircle status={status} number={step.number} />
                <span className="text-xs text-gray-400 text-center">{step.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 -mt-6 ${
                    stepStatuses[`step${step.number + 1}`] !== 'pending'
                      ? 'bg-[#00D4FF]/40'
                      : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### `StepHistoryTimeline`

```typescript
// apps/ceo/app/departments/product/onboarding/[jobId]/_components/StepHistoryTimeline.tsx
'use client';

const STEP_LABELS: Record<string, string> = {
  step1: 'Contract signed',
  step2: 'Mission parameters saved',
  step3: 'Ad account connected',
  step4: 'Google Ads / GMB configured',
  step5: 'Launch config submitted',
};

type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export function StepHistoryTimeline({
  stepStatuses,
}: {
  stepStatuses: Record<string, StepStatus>;
}) {
  const entries = Object.entries(stepStatuses)
    .filter(([, status]) => status !== 'pending')
    .sort(([a], [b]) => {
      const numA = parseInt(a.replace('step', ''), 10);
      const numB = parseInt(b.replace('step', ''), 10);
      return numB - numA; // most recent first
    });

  if (entries.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-6">
        No steps completed yet
      </div>
    );
  }

  return (
    <div className="bg-[#0A1628] border border-white/10 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-white font-orbitron tracking-wider uppercase mb-4">
        Step History
      </h2>
      <div className="relative space-y-4">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-white/10" />
        {entries.map(([key, status]) => (
          <div key={key} className="flex items-start gap-4 pl-8 relative">
            <div
              className={`absolute left-1 top-1.5 w-4 h-4 rounded-full border-2 ${
                status === 'completed'
                  ? 'bg-[#00FF88]/20 border-[#00FF88]'
                  : status === 'failed'
                  ? 'bg-red-500/20 border-red-400'
                  : 'bg-[#00D4FF]/20 border-[#00D4FF]'
              }`}
            />
            <div>
              <p className="text-sm text-white">{STEP_LABELS[key] ?? key}</p>
              <p className={`text-xs mt-0.5 capitalize ${
                status === 'completed' ? 'text-[#00FF88]'
                : status === 'failed' ? 'text-red-400'
                : 'text-[#00D4FF]'
              }`}>
                {status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### `RetriggerButton`

```typescript
// apps/ceo/app/departments/product/onboarding/[jobId]/_components/RetriggerButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { retriggerOnboardingJob } from '@/actions/product.actions';

export function RetriggerButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRetrigger() {
    setLoading(true);
    try {
      await retriggerOnboardingJob(jobId);
      router.refresh();
    } catch (err) {
      console.error('Retrigger failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRetrigger}
      disabled={loading}
      className="px-4 py-2 bg-[#FF6B35]/20 border border-[#FF6B35]/40 text-[#FF6B35] rounded-lg text-sm font-medium hover:bg-[#FF6B35]/30 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Retriggering...' : 'Re-trigger Job'}
    </button>
  );
}
```

---

### Finance Page — `apps/ceo/app/departments/finance/page.tsx`

```typescript
import { Suspense } from 'react';
import {
  getFinanceKpis,
  getMrrTrend,
  getClientFinancials,
  getLatestFinanceReport,
} from '@/actions/finance.actions';
import { FinanceKpiSection } from './_components/FinanceKpiSection';
import { MrrTrendChart } from './_components/MrrTrendChart';
import { PlDataTable } from './_components/PlDataTable';
import { ClientFinancialsGrid } from './_components/ClientFinancialsGrid';
import { KpiSkeleton, TableSkeleton } from '@rainmachine/ui';

export const metadata = { title: 'Finance Intelligence — RainMachine CEO' };

export default async function FinancePage() {
  const [kpis, mrrTrend, clientFinancials, financeReport] = await Promise.all([
    getFinanceKpis(),
    getMrrTrend(),
    getClientFinancials(),
    getLatestFinanceReport(),
  ]);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-orbitron text-white">
          Finance Intelligence
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          MRR trends · P&amp;L analysis · Per-client revenue
        </p>
      </div>

      <Suspense fallback={<KpiSkeleton count={5} />}>
        <FinanceKpiSection kpis={kpis} />
      </Suspense>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Suspense fallback={<div className="h-64 bg-[#0A1628] rounded-xl animate-pulse" />}>
          <MrrTrendChart data={mrrTrend} />
        </Suspense>
        <Suspense fallback={<TableSkeleton rows={6} />}>
          <PlDataTable report={financeReport} />
        </Suspense>
      </div>

      <Suspense fallback={<TableSkeleton rows={10} />}>
        <ClientFinancialsGrid rows={clientFinancials} />
      </Suspense>
    </div>
  );
}
```

### `FinanceKpiSection`

```typescript
// apps/ceo/app/departments/finance/_components/FinanceKpiSection.tsx
'use client';

import { KpiCard } from '@rainmachine/ui';
import type { FinanceKpis } from '@rainmachine/db/types/finance.types';

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function FinanceKpiSection({ kpis }: { kpis: FinanceKpis }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <KpiCard label="Total MRR" value={formatCurrency(kpis.total_mrr)} description="Current month recurring revenue" />
      <KpiCard
        label="Churn Rate"
        value={`${kpis.churn_rate_pct}%`}
        description="Clients lost this month"
        variant={kpis.churn_rate_pct > 5 ? 'alert' : 'default'}
      />
      <KpiCard label="New ARR" value={formatCurrency(kpis.new_arr_this_month)} description="New client ARR added this month" />
      <KpiCard
        label="Net Rev Retention"
        value={`${kpis.net_revenue_retention}%`}
        description="MRR growth vs prior month"
        variant={kpis.net_revenue_retention < 100 ? 'alert' : 'positive'}
      />
      <KpiCard label="Active Clients" value={String(kpis.active_client_count)} description="Clients with paid invoices this month" />
    </div>
  );
}
```

### `MrrTrendChart`

```typescript
// apps/ceo/app/departments/finance/_components/MrrTrendChart.tsx
'use client';

import dynamic from 'next/dynamic';
import type { MrrTrendRow } from '@rainmachine/db/types/finance.types';
import { CHART_THEME } from '@rainmachine/ui/lib/chart-theme';

const DynamicAreaChart = dynamic(
  () => import('recharts').then((m) => ({
    default: function Chart({ data }: { data: MrrTrendRow[] }) {
      const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = m;
      const formatted = data.map((row) => ({
        ...row,
        monthLabel: new Date(row.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        mrr_k: Math.round(row.total_mrr / 100) / 10, // display in $K
      }));
      return (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_THEME.colors[0]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_THEME.colors[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridColor} />
            <XAxis dataKey="monthLabel" tick={CHART_THEME.tickStyle} />
            <YAxis
              tickFormatter={(v) => `$${v}K`}
              tick={CHART_THEME.tickStyle}
              width={55}
            />
            <Tooltip
              contentStyle={CHART_THEME.tooltipStyle}
              formatter={(v: number) => [`$${v}K`, 'MRR']}
            />
            <Area
              type="monotone"
              dataKey="mrr_k"
              stroke={CHART_THEME.colors[0]}
              fill="url(#mrrGrad)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    },
  })),
  { ssr: false }
);

export function MrrTrendChart({ data }: { data: MrrTrendRow[] }) {
  return (
    <div className="bg-[#0A1628] border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-white font-orbitron tracking-wider uppercase">
          MRR Trend (12 months)
        </h2>
        {data.length > 0 && data[data.length - 1].mom_growth_pct !== null && (
          <span className={`text-sm font-medium ${
            (data[data.length - 1].mom_growth_pct ?? 0) >= 0
              ? 'text-[#00FF88]'
              : 'text-red-400'
          }`}>
            {(data[data.length - 1].mom_growth_pct ?? 0) >= 0 ? '▲' : '▼'}
            {Math.abs(data[data.length - 1].mom_growth_pct ?? 0)}% MoM
          </span>
        )}
      </div>
      <DynamicAreaChart data={data} />
    </div>
  );
}
```

### `PlDataTable`

```typescript
// apps/ceo/app/departments/finance/_components/PlDataTable.tsx
'use client';

import type { FinanceReport, PlRow } from '@rainmachine/db/types/finance.types';

function MarginBadge({ pct }: { pct: number }) {
  const color = pct >= 60 ? 'text-[#00FF88]' : pct >= 40 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-medium ${color}`}>{pct.toFixed(1)}%</span>;
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

export function PlDataTable({ report }: { report: FinanceReport | null }) {
  if (!report || report.pl_rows.length === 0) {
    return (
      <div className="bg-[#0A1628] border border-white/10 rounded-xl p-6 flex items-center justify-center">
        <p className="text-sm text-gray-500">
          P&L data available after first Finance Agent run (Mondays 6am ET)
        </p>
      </div>
    );
  }

  const rows = report.pl_rows.slice(-6); // last 6 months

  return (
    <div className="bg-[#0A1628] border border-white/10 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10">
        <h2 className="text-sm font-semibold text-white font-orbitron tracking-wider uppercase">
          P&amp;L Summary (6 months)
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Month</th>
              <th className="px-4 py-3 text-right text-xs text-gray-400 uppercase tracking-wider">Revenue</th>
              <th className="px-4 py-3 text-right text-xs text-gray-400 uppercase tracking-wider">COGS</th>
              <th className="px-4 py-3 text-right text-xs text-gray-400 uppercase tracking-wider">Gross %</th>
              <th className="px-4 py-3 text-right text-xs text-gray-400 uppercase tracking-wider">Net %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row: PlRow) => (
              <tr key={row.month} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-gray-300">{row.month}</td>
                <td className="px-4 py-3 text-right text-white">{formatMoney(row.revenue)}</td>
                <td className="px-4 py-3 text-right text-gray-300">{formatMoney(row.cogs)}</td>
                <td className="px-4 py-3 text-right"><MarginBadge pct={row.gross_margin_pct} /></td>
                <td className="px-4 py-3 text-right"><MarginBadge pct={row.net_margin_pct} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {report.narrative && (
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-xs text-gray-400 leading-relaxed">{report.narrative}</p>
        </div>
      )}
    </div>
  );
}
```

### `ClientFinancialsGrid`

```typescript
// apps/ceo/app/departments/finance/_components/ClientFinancialsGrid.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ClientFinancialsRow } from '@rainmachine/db/types/finance.types';

function InvoiceStatusBadge({ open, uncollectible }: { open: number; uncollectible: number }) {
  if (uncollectible > 0)
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">At Risk</span>;
  if (open > 0)
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">{open} Open</span>;
  return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">Current</span>;
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function ClientFinancialsGrid({ rows }: { rows: ClientFinancialsRow[] }) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = rows.filter((r) =>
    r.client_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#0A1628] border border-white/10 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-white font-orbitron tracking-wider uppercase">
          Per-Client Revenue
        </h2>
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]/50 w-48"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Client</th>
              <th className="px-4 py-3 text-right text-xs text-gray-400 uppercase tracking-wider">MRR</th>
              <th className="px-4 py-3 text-right text-xs text-gray-400 uppercase tracking-wider">ARR YTD</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Invoice Status</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Last Payment</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((row) => (
              <>
                <tr
                  key={row.tenant_id}
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === row.tenant_id ? null : row.tenant_id)
                  }
                >
                  <td className="px-4 py-3 text-white font-medium">{row.client_name}</td>
                  <td className="px-4 py-3 text-right text-white">{formatCurrency(row.mrr_current)}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{formatCurrency(row.arr_ytd)}</td>
                  <td className="px-4 py-3">
                    <InvoiceStatusBadge open={row.open_invoices} uncollectible={row.uncollectible_invoices} />
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">
                    {row.last_payment_at
                      ? new Date(row.last_payment_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${row.tenant_id}?tab=financials`}
                      className="text-[#00D4FF] hover:underline text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Full Detail →
                    </Link>
                  </td>
                </tr>
                {expandedId === row.tenant_id && (
                  <tr key={`${row.tenant_id}-expand`} className="bg-white/[0.02]">
                    <td colSpan={6} className="px-8 py-4">
                      <div className="grid grid-cols-3 gap-6 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Current MRR</p>
                          <p className="text-white font-medium">{formatCurrency(row.mrr_current)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">ARR YTD</p>
                          <p className="text-white font-medium">{formatCurrency(row.arr_ytd)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Open Invoices</p>
                          <p className={`font-medium ${row.open_invoices > 0 ? 'text-yellow-400' : 'text-[#00FF88]'}`}>
                            {row.open_invoices}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No clients match your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 7. Integration Points

### F17 → F19: Finance Agent Output
The `financial-intelligence-agent` Edge Function (F17) writes `agent_finance_reports` each Monday. `PlDataTable` reads this table for the P&L section. The Zod schema `FinanceReportSchema` is shared between agent output validation (F17) and UI parsing (F19).

### F06 → F19: Onboarding Jobs
The `process-onboarding-job` Edge Function (F06) writes `onboarding_jobs` and updates `step_statuses`. F19 reads these for the queue table and status sub-page. F19 can write `status = 'pending'` to re-trigger failed jobs.

### F17 → F19: Invoices / MRR
Stripe webhook (F17) writes `invoices`. `client_financials_view` and `mrr_trend_view` aggregate from these. F19 does not write to `invoices`.

### F13 → F19: Navigation
`DepartmentPanels` in F13 contains links to `/departments/product` and `/departments/finance`. Both pages live under `apps/ceo`.

### F14 → F19: Per-Client Link
`ClientFinancialsGrid` links to `/clients/[tenantId]?tab=financials` which is the F14 client detail financials tab.

### Packages Used
- `@rainmachine/ui`: `KpiCard`, `KpiSkeleton`, `TableSkeleton`, `TrendChart` (F18)
- `@rainmachine/db`: `FinanceReportSchema`, `OnboardingQueueRow`, `WorkflowHealthRow`, type exports
- `date-fns`: `formatDistanceToNow` in `WorkflowHealthPanel`
- `recharts`: MRR AreaChart (dynamic import, ssr:false)

---

## 8. BDD Scenarios

```gherkin
Feature: CEO Product Operations Page

  Scenario: Viewing the onboarding queue
    Given I am authenticated as the CEO
    When I navigate to /departments/product
    Then I see 5 KPI cards including "Onboarding Queue"
    And I see the OnboardingQueueTable with one row per non-completed job
    And the WorkflowHealthPanel shows one row per distinct workflow

  Scenario: Stalled job highlighted
    Given an onboarding job started 10 days ago has status "processing"
    When I view the OnboardingQueueTable
    Then that row shows a "Stalled" badge
    And the "Days Active" cell renders in orange

  Scenario: Drilling into a failed job
    Given job J1 has status "failed" and error_message "Meta token invalid"
    When I click "View →" for job J1
    Then I see the error message alert block
    And I see the StepProgressIndicator with step 3 showing "✗"
    And the "Re-trigger Job" button is visible

  Scenario: Re-triggering a failed job
    Given I am on the onboarding detail page for a failed job
    When I click "Re-trigger Job"
    Then the job status is set to "pending" and error_message is cleared
    And the page refreshes showing status "active"

  Scenario: No active onboarding jobs
    Given there are no non-completed onboarding jobs
    When I view the OnboardingQueueTable
    Then I see "No active onboarding jobs"

Feature: CEO Finance Intelligence Page

  Scenario: Viewing finance KPIs
    Given I am authenticated as the CEO
    When I navigate to /departments/finance
    Then I see 5 KPI cards including "Total MRR" and "Churn Rate"

  Scenario: MRR trend chart renders
    Given there are 12 months of daily_metrics with mrr > 0
    When I view the Finance page
    Then the MRR AreaChart shows 12 data points
    And the MoM growth badge shows the most recent month's change

  Scenario: P&L table empty state before first agent run
    Given agent_finance_reports is empty
    When I view the Finance page
    Then the PlDataTable shows "P&L data available after first Finance Agent run"

  Scenario: P&L table with data
    Given agent_finance_reports contains a report with 6 pl_rows
    When I view the Finance page
    Then the P&L table shows 6 rows with Revenue, COGS, Gross %, Net %
    And the narrative section is displayed below the table

  Scenario: Expanding a client row
    Given the ClientFinancialsGrid is showing client "Acme Realty"
    When I click on the "Acme Realty" row
    Then an expanded row appears with MRR, ARR YTD, and open invoice count

  Scenario: Client with uncollectible invoices flagged
    Given client "Beta Group" has 1 uncollectible invoice
    When I view the ClientFinancialsGrid
    Then "Beta Group" shows an "At Risk" badge in red

  Scenario: CEO role check enforced
    Given I am authenticated as a non-CEO user
    When I navigate to /departments/finance
    Then the server action throws "Unauthorized"
    And I am redirected to the login page
```

---

## 9. Test Plan

### Unit Tests

| Test | File | Assertion |
|------|------|-----------|
| `getProductKpis` computes avg_days_to_launch correctly | `__tests__/product.actions.test.ts` | Given 2 completed jobs (3d and 7d), avg = 5 |
| `getProductKpis` clients_live_this_month only counts current month | `__tests__/product.actions.test.ts` | Job completed last month not counted |
| `getMrrTrend` computes mom_growth_pct | `__tests__/finance.actions.test.ts` | MRR 1000→1100 = 10.0% |
| `FinanceReportSchema.safeParse` rejects invalid JSONB | `__tests__/finance.types.test.ts` | Returns success:false |
| `PlDataTable` shows empty state when report is null | `__tests__/PlDataTable.test.tsx` | Renders "P&L data available" |
| `InvoiceStatusBadge` renders "At Risk" for uncollectible > 0 | `__tests__/ClientFinancialsGrid.test.tsx` | Text "At Risk" present |
| `StepProgressIndicator` renders green checkmark for completed steps | `__tests__/StepProgressIndicator.test.tsx` | Step 1 completed = "✓" |
| `StepHistoryTimeline` sorts most-recent step first | `__tests__/StepHistoryTimeline.test.tsx` | step5 before step1 in output |

### Integration Tests

| Test | Description |
|------|-------------|
| `onboarding_queue_view` returns correct queue_status | Given job started 10d ago with status 'processing' → queue_status = 'stalled' |
| `workflow_health_view` computes success_rate_pct | 8 success + 2 failed = 80.0% |
| `mrr_trend_view` aggregates per month | 3 tenants each with MRR 1000 in Jan → total_mrr = 3000 |
| `client_financials_view` excludes inactive tenants | Tenant with status='churned' not in results |
| `agent_finance_reports` RLS blocks non-CEO | Authenticated as RM user → 0 rows returned |
| Retrigger only affects failed jobs | Job with status='processing' → update blocked |

### E2E Tests (Playwright)

```typescript
test('product page loads with kpi section', async ({ page }) => {
  await page.goto('/departments/product');
  await expect(page.getByText('Onboarding Queue')).toBeVisible();
  await expect(page.getByText('Active Workflows')).toBeVisible();
});

test('onboarding detail page shows error message', async ({ page }) => {
  // Seed: insert failed onboarding_job with error_message
  await page.goto(`/departments/product/onboarding/${JOB_ID}`);
  await expect(page.getByText('Last error:')).toBeVisible();
  await expect(page.getByText('Re-trigger Job')).toBeVisible();
});

test('finance page mrr chart renders', async ({ page }) => {
  await page.goto('/departments/finance');
  await expect(page.getByText('MRR Trend (12 months)')).toBeVisible();
  // Chart container present (ssr:false — wait for hydration)
  await expect(page.locator('.recharts-wrapper')).toBeVisible({ timeout: 5000 });
});

test('client financials row expands on click', async ({ page }) => {
  await page.goto('/departments/finance');
  const firstRow = page.locator('tbody tr').first();
  await firstRow.click();
  await expect(page.getByText('Current MRR')).toBeVisible();
});
```

---

## 10. OWASP Security Checklist

| # | Threat | Mitigation |
|---|--------|-----------|
| A01 | Broken Access Control — CEO-only pages accessible to tenant users | Every server action calls `assertCeo()` independently; CEO RLS policies on all views; layout-level check is not the only gate |
| A01 | Re-trigger writes to `onboarding_jobs` | `retriggerOnboardingJob` filters `.eq('status', 'failed')` — can only reset failed jobs, not running/completed |
| A03 | SQL injection via `jobId` path param | Supabase JS SDK uses parameterized queries; `params.jobId` passed as value, never interpolated |
| A03 | `FinanceReportSchema` Zod parse on raw JSONB | Prevents malformed agent output from crashing UI; parsing errors return `null` (empty state shown) |
| A05 | Security misconfiguration — `agent_finance_reports` missing RLS | Migration 0033 enables RLS and creates CEO-only SELECT policy immediately after table creation |
| A07 | Identification failures — JWT not re-validated in sub-page | `getOnboardingJobDetail` calls `assertCeo()` like all other actions; sub-page is not trusted just because user navigated there |
| A08 | Data integrity — `retrigger` called via API route, not just server action | API route at `POST /api/departments/product/onboarding/[jobId]/retrigger` also calls `retriggerOnboardingJob` which re-checks CEO role |
| A09 | Logging failure — finance report parse errors not surfaced | If `FinanceReportSchema.safeParse` fails, `getLatestFinanceReport` returns `null` (empty state shown); agent logs in F17 capture the malformed output |
| A10 | SSRF — no outbound HTTP in F19 | F19 is purely read/display; no outbound calls; all data fetched from Supabase |

---

## 11. Open Questions

| # | Question | Owner | Priority |
|---|----------|-------|----------|
| 1 | Should `retriggerOnboardingJob` also re-fire the Edge Function directly, or just set status=pending and let the pg_cron processor pick it up? | Engineering | Medium |
| 2 | Does the Finance agent write `agent_finance_reports` or the existing `reports` table? F17 defined a separate `agent_finance_reports` table — confirm this is the intended separation | Product | High |
| 3 | The churn rate and NRR calculations in `getFinanceKpis` are approximations based on `active_clients` change. Should these use the Finance agent's `churn_rate_pct` field directly once a report exists? | Engineering | Medium |
| 4 | `ClientFinancialsGrid` links to `/clients/[tenantId]?tab=financials`. The F14 financials tab is a placeholder div. Should F19 ship before F14 financials is complete, or should both ship together? | Product | Low |
| 5 | `StepHistoryTimeline` shows step completion status but no timestamps (timestamps not in `step_statuses` JSONB). Should we add per-step timestamps to the JSONB schema? | Engineering | Low |

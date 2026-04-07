# F17 — Claude AI Business Intelligence Agents

**Source pitch:** P16b
**Cycle:** 10 | **Release:** R2 | **Appetite:** Medium
**Status:** Ready for implementation

---

## 1. Overview

### Problem
The CEO needs AI-generated intelligence at the business level — not just per-client performance, but: which prospects in the sales pipeline are going stale? How is the overall business performing financially? Currently these questions require manual analysis across Stripe and a separate CRM system.

### Solution
Two Supabase Edge Functions extending the agent infrastructure from F16:

1. **`growth-acquisition-agent`** — Runs daily 7:00am ET. Reads from a `prospects` table (Apollo data cache synced nightly by n8n). Detects stalled deals (last_activity > threshold days). Generates recommendations. Writes to `agent_logs`. Creates CEO alerts for critical stalls.

2. **`financial-intelligence-agent`** — Runs Monday 6:00am ET (before weekly intel). Pulls Stripe subscription and invoice data. Calculates MRR, churn, and revenue trends. Writes a finance summary to `agent_logs`. Updates `metrics.mrr` for each tenant.

Additionally, this PRD covers the **Stripe integration (BE-11)**:
- `stripe_customers` table mapping tenants to Stripe customers
- `invoices` table synced via Stripe webhook
- `/api/webhooks/stripe` handler in `apps/ceo`

### Success Criteria
- Growth agent runs daily and creates CEO alerts for prospects stalled > 14 days
- Finance agent calculates MRR correctly from active Stripe subscriptions
- Stripe webhook handler validates signatures and processes `invoice.payment_succeeded` / `invoice.payment_failed`
- Both agents write `agent_logs` entries for F20 viewer
- Claude API costs tracked per run

### Out of Scope (MVP)
- Automated outreach to stalled prospects
- Multi-currency support (USD only)
- Stripe Revenue Recognition reports

---

## 2. Database

### New Tables

```sql
-- supabase/migrations/0030_business_intel.sql

-- Prospects table: Apollo data cache (synced nightly by n8n)
CREATE TABLE prospects (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company        TEXT NOT NULL,
  contact_name   TEXT,
  contact_email  TEXT,
  stage          TEXT NOT NULL DEFAULT 'contacted'
                 CHECK (stage IN ('contacted', 'demo_scheduled', 'proposal_sent', 'negotiating', 'closed_won', 'closed_lost')),
  deal_value     NUMERIC(12,2),
  last_activity  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  owner          TEXT,                           -- RM/sales rep name
  apollo_id      TEXT UNIQUE,                    -- Apollo person/company ID
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_prospects_stage ON prospects(stage);
CREATE INDEX idx_prospects_last_activity ON prospects(last_activity DESC);

-- Stripe customer mapping
CREATE TABLE stripe_customers (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id  TEXT NOT NULL UNIQUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);

-- Invoices: synced from Stripe webhooks
CREATE TABLE invoices (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  amount            NUMERIC(12,2) NOT NULL,       -- in dollars
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('paid', 'pending', 'overdue', 'void')),
  due_date          DATE,
  paid_at           TIMESTAMPTZ,
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  line_items        JSONB DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id, period_start DESC);
CREATE INDEX idx_invoices_status ON invoices(status) WHERE status IN ('pending', 'overdue');

-- Mark invoices as overdue (due_date < NOW and still pending)
-- This is handled by a query filter, not a scheduled job
-- Overdue = due_date < CURRENT_DATE AND status = 'pending'

-- Add MRR column to daily_metrics if not present
ALTER TABLE daily_metrics
  ADD COLUMN IF NOT EXISTS mrr NUMERIC(12,2);

-- workflow_runs table for n8n run logging (used by F19 Product drilldown)
CREATE TABLE workflow_runs (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name  TEXT NOT NULL,
  run_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status         TEXT NOT NULL DEFAULT 'success'
                 CHECK (status IN ('success', 'error')),
  duration_ms    INTEGER,
  error_message  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_runs_name_run_at ON workflow_runs(workflow_name, run_at DESC);
```

### RLS Policies

```sql
-- supabase/migrations/0031_business_intel_rls.sql

ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;

-- Prospects: CEO only (business-level data)
CREATE POLICY "prospects_ceo_select"
  ON prospects FOR SELECT
  USING (auth.is_ceo());

-- stripe_customers: CEO only
CREATE POLICY "stripe_customers_ceo_select"
  ON stripe_customers FOR SELECT
  USING (auth.is_ceo());

-- invoices: CEO reads all; RM reads their own
CREATE POLICY "invoices_ceo_select"
  ON invoices FOR SELECT
  USING (auth.is_ceo());

CREATE POLICY "invoices_tenant_select"
  ON invoices FOR SELECT
  USING (tenant_id = auth.tenant_id());

-- workflow_runs: CEO only
CREATE POLICY "workflow_runs_ceo_select"
  ON workflow_runs FOR SELECT
  USING (auth.is_ceo());
```

---

## 3. TypeScript Interfaces

```typescript
// packages/db/src/types/business-intel.types.ts
import { z } from 'zod';

// ─── Growth agent types ──────────────────────────────────────
export interface ProspectRow {
  id: string;
  company: string;
  contact_name: string | null;
  contact_email: string | null;
  stage: ProspectStage;
  deal_value: number | null;
  last_activity: string;
  owner: string | null;
  apollo_id: string | null;
  notes: string | null;
  created_at: string;
}

export type ProspectStage =
  | 'contacted'
  | 'demo_scheduled'
  | 'proposal_sent'
  | 'negotiating'
  | 'closed_won'
  | 'closed_lost';

export interface StalledProspect extends ProspectRow {
  days_stalled: number;
}

// ─── Finance agent types ──────────────────────────────────────
export const FinanceReportSchemaZod = z.object({
  period: z.string(),              // e.g. "Q1 2025"
  mrr_total: z.number(),
  mrr_change_pct: z.number(),
  churn_rate: z.number(),
  new_arr: z.number(),
  active_subscriptions: z.number(),
  summary: z.string().min(20).max(500),
  risks: z.array(z.string()),
  opportunities: z.array(z.string()),
  generated_at: z.string().datetime(),
});

export type FinanceReport = z.infer<typeof FinanceReportSchemaZod>;

// ─── Stripe types ────────────────────────────────────────────
export interface StripeInvoiceWebhook {
  id: string;
  type: 'invoice.payment_succeeded' | 'invoice.payment_failed';
  data: {
    object: {
      id: string;
      customer: string;
      amount_paid: number;      // in cents
      amount_due: number;
      status: 'paid' | 'open' | 'void';
      due_date: number | null;  // Unix timestamp
      period_start: number;
      period_end: number;
      paid: boolean;
      lines: {
        data: Array<{
          description: string;
          amount: number;
        }>;
      };
    };
  };
}

export interface InvoiceRow {
  id: string;
  tenant_id: string;
  stripe_invoice_id: string;
  stripe_customer_id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'void';
  due_date: string | null;
  paid_at: string | null;
  period_start: string;
  period_end: string;
  line_items: Array<{ description: string; amount: number }>;
}

// ─── Apollo n8n webhook ──────────────────────────────────────
export interface ApolloProspectSyncPayload {
  prospects: Array<{
    apollo_id: string;
    company: string;
    contact_name: string;
    contact_email: string;
    stage: ProspectStage;
    deal_value: number | null;
    last_activity: string;
    owner: string;
  }>;
}
```

---

## 4. Supabase Edge Functions

### growth-acquisition-agent

```typescript
// supabase/functions/growth-acquisition-agent/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.0';

const STALL_THRESHOLD_DAYS = 14;

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
  const runAt = new Date().toISOString();

  // Load all active prospects (not closed)
  const { data: prospects } = await supabase
    .from('prospects')
    .select('*')
    .not('stage', 'in', '("closed_won","closed_lost")')
    .order('last_activity', { ascending: true });

  if (!prospects?.length) {
    await supabase.from('agent_logs').insert({
      department: 'growth',
      run_at: runAt,
      status: 'success',
      summary: 'No active prospects to analyze',
      entries: [],
    });
    return new Response(JSON.stringify({ alerts: 0 }), { status: 200 });
  }

  // Detect stalled prospects
  const stalledProspects = prospects
    .map((p) => ({
      ...p,
      days_stalled: Math.floor(
        (Date.now() - new Date(p.last_activity).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }))
    .filter((p) => p.days_stalled >= STALL_THRESHOLD_DAYS);

  // Create CEO alerts for stalled prospects
  const alertsToInsert = stalledProspects.map((p) => ({
    tenant_id: null,  // Business-level alert (not tenant-specific)
    severity: p.days_stalled >= 30 ? 'critical' : 'warning',
    type: 'stalled_prospect',
    title: `Stalled Deal: ${p.company}`,
    message: `${p.company} (${p.stage}) has had no activity for ${p.days_stalled} days. Deal value: ${p.deal_value ? `$${p.deal_value.toLocaleString()}` : 'unknown'}.`,
    recommended_action: `Contact ${p.contact_name ?? p.company} to re-engage. Owner: ${p.owner ?? 'unassigned'}.`,
  }));

  if (alertsToInsert.length > 0) {
    await supabase.from('alerts').insert(alertsToInsert);
  }

  // Use Claude for strategic growth recommendations
  let claudeSummary = '';
  try {
    const pipelineSummary = buildPipelineSummary(prospects as ProspectRow[]);
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: 'You are a business development AI for a SaaS company. Analyze the sales pipeline and provide 3 concise recommendations. Respond in plain text, not JSON.',
      messages: [{
        role: 'user',
        content: `Sales pipeline summary:\n${pipelineSummary}\n\nStalled deals: ${stalledProspects.length}\nProvide 3 specific recommendations to improve pipeline velocity.`,
      }],
    });

    claudeSummary = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    const costUsd = (message.usage.input_tokens * 3 + message.usage.output_tokens * 15) / 1_000_000;
    await supabase.from('claude_api_usage').insert({
      agent_type: 'growth',
      tokens_in: message.usage.input_tokens,
      tokens_out: message.usage.output_tokens,
      cost_usd: costUsd,
      model: 'claude-sonnet-4-6',
    });
  } catch {
    claudeSummary = 'Claude analysis unavailable this run.';
  }

  // Write agent log
  await supabase.from('agent_logs').insert({
    department: 'growth',
    run_at: runAt,
    status: 'success',
    summary: `${stalledProspects.length} stalled deals detected. ${alertsToInsert.length} alerts created.`,
    entries: [
      ...stalledProspects.map((p) => ({
        message: `${p.company}: stalled ${p.days_stalled}d`,
        level: 'warning',
        timestamp: runAt,
      })),
      { message: claudeSummary, level: 'info', timestamp: runAt },
    ],
  });

  return new Response(
    JSON.stringify({ stalled: stalledProspects.length, alerts: alertsToInsert.length }),
    { status: 200 }
  );
});

type ProspectRow = {
  company: string;
  stage: string;
  deal_value: number | null;
  owner: string | null;
};

function buildPipelineSummary(prospects: ProspectRow[]): string {
  const byStage: Record<string, number> = {};
  let totalPipelineValue = 0;
  for (const p of prospects) {
    byStage[p.stage] = (byStage[p.stage] ?? 0) + 1;
    totalPipelineValue += p.deal_value ?? 0;
  }
  const lines = [
    `Total prospects: ${prospects.length}`,
    `Total pipeline value: $${totalPipelineValue.toLocaleString()}`,
    ...Object.entries(byStage).map(([stage, count]) => `${stage}: ${count}`),
  ];
  return lines.join('\n');
}
```

### financial-intelligence-agent

```typescript
// supabase/functions/financial-intelligence-agent/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.0.0';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.0';
import { FinanceReportSchemaZod } from '../../packages/db/src/types/business-intel.types.ts';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2024-04-10',
  });
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
  const runAt = new Date().toISOString();

  try {
    // Pull active Stripe subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      expand: ['data.customer'],
      limit: 100,
    });

    // Pull invoices from last 30 days
    const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    const recentInvoices = await stripe.invoices.list({
      created: { gte: thirtyDaysAgo },
      limit: 100,
    });

    // Calculate MRR
    let mrrTotal = 0;
    const tenantMrr: Map<string, number> = new Map();

    for (const sub of subscriptions.data) {
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
      // Look up tenant from stripe_customers
      const { data: stripeCustomer } = await supabase
        .from('stripe_customers')
        .select('tenant_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (!stripeCustomer) continue;

      // MRR = monthly amount (Stripe amounts are in cents, period amounts need normalization)
      const monthlyAmount = sub.items.data.reduce((sum, item) => {
        const price = item.price;
        const unitAmount = price.unit_amount ?? 0;
        // Normalize to monthly
        const interval = price.recurring?.interval ?? 'month';
        const intervalCount = price.recurring?.interval_count ?? 1;
        const multiplier = interval === 'year' ? 1 / 12 : interval === 'month' ? 1 / intervalCount : 0;
        return sum + (unitAmount / 100) * multiplier;
      }, 0);

      mrrTotal += monthlyAmount;
      tenantMrr.set(stripeCustomer.tenant_id, (tenantMrr.get(stripeCustomer.tenant_id) ?? 0) + monthlyAmount);
    }

    // Update metrics.mrr per tenant
    for (const [tenantId, mrr] of tenantMrr) {
      await supabase
        .from('daily_metrics')
        .upsert(
          { tenant_id: tenantId, metric_date: new Date().toISOString().split('T')[0], mrr },
          { onConflict: 'tenant_id,metric_date' }
        );
    }

    // Calculate churn (subscriptions cancelled last 30 days)
    const cancelledSubs = await stripe.subscriptions.list({
      status: 'canceled',
      created: { gte: thirtyDaysAgo },
      limit: 100,
    });
    const churnRate = subscriptions.data.length > 0
      ? (cancelledSubs.data.length / subscriptions.data.length) * 100
      : 0;

    // Calculate new ARR (new subscriptions last 30 days)
    const newSubs = await stripe.subscriptions.list({
      created: { gte: thirtyDaysAgo },
      status: 'active',
      limit: 100,
    });
    const newArr = newSubs.data.reduce((sum, sub) => {
      const monthly = sub.items.data.reduce((s, item) => s + (item.price.unit_amount ?? 0) / 100, 0);
      return sum + monthly * 12;
    }, 0);

    // Build finance summary for Claude
    const financeSummary = [
      `MRR: $${mrrTotal.toFixed(2)}`,
      `Active subscriptions: ${subscriptions.data.length}`,
      `Churn rate (30d): ${churnRate.toFixed(1)}%`,
      `New ARR (30d): $${newArr.toFixed(2)}`,
      `Recent invoices: ${recentInvoices.data.length}`,
      `Paid invoices: ${recentInvoices.data.filter((i) => i.paid).length}`,
    ].join('\n');

    // Claude analysis
    let financeReport: FinanceReport | null = null;
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: 'You are a financial intelligence agent for a SaaS company. Generate a FinanceReportSchema JSON object based on the metrics provided.',
        messages: [{
          role: 'user',
          content: `Financial metrics:\n${financeSummary}\n\nGenerate a FinanceReportSchema with: period (current month), mrr_total, mrr_change_pct (estimate 0 if unknown), churn_rate, new_arr, active_subscriptions, summary (2-3 sentences), risks (2-3 items), opportunities (2-3 items), generated_at.`,
        }],
      });

      const rawText = message.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { type: 'text'; text: string }).text)
        .join('');

      const costUsd = (message.usage.input_tokens * 3 + message.usage.output_tokens * 15) / 1_000_000;
      await supabase.from('claude_api_usage').insert({
        agent_type: 'finance',
        tokens_in: message.usage.input_tokens,
        tokens_out: message.usage.output_tokens,
        cost_usd: costUsd,
        model: 'claude-sonnet-4-6',
      });

      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ?? [null, rawText];
      const parsed = JSON.parse(jsonMatch[1] ?? rawText);
      const validated = FinanceReportSchemaZod.safeParse({
        ...parsed,
        mrr_total: mrrTotal,
        churn_rate: churnRate,
        new_arr: newArr,
        active_subscriptions: subscriptions.data.length,
        generated_at: runAt,
      });

      if (validated.success) {
        financeReport = validated.data;
      }
    } catch { /* Non-fatal — log will still be written */ }

    // Write agent log with finance report embedded
    await supabase.from('agent_logs').insert({
      department: 'finance',
      run_at: runAt,
      status: 'success',
      summary: `MRR: $${mrrTotal.toFixed(2)} | Churn: ${churnRate.toFixed(1)}% | New ARR: $${newArr.toFixed(2)}`,
      entries: [
        { message: financeSummary, level: 'info', timestamp: runAt },
        ...(financeReport
          ? [{ message: financeReport.summary, level: 'info', timestamp: runAt }]
          : []),
        ...financeReport?.risks?.map((r) => ({ message: `Risk: ${r}`, level: 'warning', timestamp: runAt })) ?? [],
      ],
    });

    return new Response(
      JSON.stringify({ mrr: mrrTotal, churn_rate: churnRate, new_arr: newArr }),
      { status: 200 }
    );
  } catch (err) {
    await supabase.from('agent_logs').insert({
      department: 'finance',
      run_at: runAt,
      status: 'api_error',
      summary: `Error: ${err instanceof Error ? err.message : 'unknown'}`,
      entries: [],
    });
    return new Response(JSON.stringify({ error: 'Finance agent failed' }), { status: 500 });
  }
});
```

---

## 5. API Routes

### Stripe Webhook Handler

```typescript
// apps/ceo/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceRoleClient } from '@rainmachine/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;

    // Look up tenant from stripe_customers
    const { data: stripeCustomer } = await supabase
      .from('stripe_customers')
      .select('tenant_id')
      .eq('stripe_customer_id', invoice.customer as string)
      .single();

    if (!stripeCustomer) {
      // Customer not in our system — ignore
      return NextResponse.json({ received: true });
    }

    const status = event.type === 'invoice.payment_succeeded' ? 'paid' : 'pending';
    const dueDateMs = invoice.due_date ? invoice.due_date * 1000 : null;

    await supabase.from('invoices').upsert(
      {
        tenant_id: stripeCustomer.tenant_id,
        stripe_invoice_id: invoice.id,
        stripe_customer_id: invoice.customer as string,
        amount: invoice.amount_paid / 100,
        status,
        due_date: dueDateMs ? new Date(dueDateMs).toISOString().split('T')[0] : null,
        paid_at: event.type === 'invoice.payment_succeeded' ? new Date().toISOString() : null,
        period_start: new Date(invoice.period_start * 1000).toISOString().split('T')[0],
        period_end: new Date(invoice.period_end * 1000).toISOString().split('T')[0],
        line_items: invoice.lines.data.map((line) => ({
          description: line.description ?? '',
          amount: (line.amount ?? 0) / 100,
        })),
      },
      { onConflict: 'stripe_invoice_id' }
    );

    // If payment failed and amount > 0, create a CEO alert
    if (event.type === 'invoice.payment_failed' && invoice.amount_due > 0) {
      await supabase.from('alerts').insert({
        tenant_id: stripeCustomer.tenant_id,
        severity: 'critical',
        type: 'payment_failed',
        title: 'Invoice Payment Failed',
        message: `Invoice for $${(invoice.amount_due / 100).toFixed(2)} failed for this client.`,
        recommended_action: 'Contact client to update payment method in Stripe.',
      });
    }
  }

  return NextResponse.json({ received: true });
}

// Disable Next.js body parsing for raw body access (needed for Stripe signature)
export const config = { api: { bodyParser: false } };
```

### n8n Apollo Sync Webhook

```typescript
// apps/ceo/app/api/webhooks/apollo-sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@rainmachine/db';
import type { ApolloProspectSyncPayload } from '@rainmachine/db/types/business-intel.types';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload: ApolloProspectSyncPayload = await req.json();
  const supabase = createServiceRoleClient();

  for (const prospect of payload.prospects) {
    await supabase.from('prospects').upsert(
      {
        apollo_id: prospect.apollo_id,
        company: prospect.company,
        contact_name: prospect.contact_name,
        contact_email: prospect.contact_email,
        stage: prospect.stage,
        deal_value: prospect.deal_value,
        last_activity: prospect.last_activity,
        owner: prospect.owner,
      },
      { onConflict: 'apollo_id' }
    );
  }

  return NextResponse.json({ synced: payload.prospects.length });
}
```

---

## 6. UI Components

No UI components in this PRD. Outputs are:
- `agent_logs` entries → viewed in F20
- `alerts` → viewed in F13
- `invoices` → viewed in F14 (Financials tab) and F19 (Finance drilldown)
- `metrics.mrr` → viewed in F14 KPI cards

---

## 7. Integration Points

### F13 (Alerts)
Both agents create `alerts` rows that surface in the CEO Command Center. Stalled prospect alerts have `tenant_id = null` (business-level). Payment failure alerts have `tenant_id` set.

### F14 (Financials Tab — R2)
The `invoices` table is populated by the Stripe webhook handler. F14's Financials tab reads this table to display invoice history and MRR per client.

### F18 (Growth Drilldown)
F18's `ProspectTable` reads from the `prospects` table. The `stalled` detection is derived from `last_activity` field — F18 re-derives it on the frontend using `last_activity > 14d`.

### F19 (Finance Drilldown)
F19's Finance page reads `agent_logs` (department='finance') for the latest finance report summary. It also reads `invoices` for the P&L DataTable.

### n8n `apollo-prospect-sync` Workflow
Runs nightly. Fetches prospects from Apollo API, posts to `/api/webhooks/apollo-sync`. The webhook upserts using `apollo_id` as conflict key.

### Environment Variables

```bash
# Edge Function secrets
STRIPE_SECRET_KEY=sk_live_...
# or for test: sk_test_...

# apps/ceo .env additions
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 8. BDD Scenarios

```gherkin
Feature: F17 — Claude AI Business Intelligence Agents

  Scenario: Growth agent detects stalled prospect
    Given prospect "Acme RE" is in stage "proposal_sent" with last_activity 20 days ago
    When the growth-acquisition-agent runs
    Then an alert is created with type='stalled_prospect' and severity='critical' (>14d)
    And agent_logs has entry for "Acme RE: stalled 20d"

  Scenario: Growth agent skips closed prospects
    Given "Beta Realty" is in stage "closed_won"
    When the growth-acquisition-agent runs
    Then no alert is created for "Beta Realty"

  Scenario: Finance agent calculates MRR correctly
    Given 3 active Stripe subscriptions: $500/mo, $750/mo, $500/mo
    When the financial-intelligence-agent runs
    Then mrr_total = 1750
    And daily_metrics.mrr is updated for each tenant

  Scenario: Stripe webhook processes payment_succeeded
    Given a Stripe invoice.payment_succeeded event for customer "cus_abc"
    And "cus_abc" maps to tenant "tenant-xyz" in stripe_customers
    When the webhook is received at /api/webhooks/stripe
    Then a paid invoice row is inserted
    And no alert is created

  Scenario: Stripe webhook creates alert on payment_failed
    Given a Stripe invoice.payment_failed event for $1200
    When the webhook is received
    Then an alert with severity='critical' and type='payment_failed' is created
    And the alert message contains "$1200.00"

  Scenario: Stripe webhook rejects invalid signature
    Given a POST to /api/webhooks/stripe with wrong stripe-signature header
    Then the response is 400
    And no DB changes are made

  Scenario: Apollo sync upserts prospects without duplicates
    Given 5 prospects already exist with known apollo_ids
    When the apollo-sync webhook fires with the same 5 + 2 new prospects
    Then the DB has 7 prospects total (5 updated, 2 inserted)

  Scenario: Finance agent fails gracefully on Stripe API error
    Given the Stripe API returns a 500 error
    When the financial-intelligence-agent runs
    Then agent_logs has status='api_error' for department='finance'
    And the Edge Function returns HTTP 500 without crashing the cron
```

---

## 9. Test Plan

### Unit Tests

```typescript
// supabase/functions/financial-intelligence-agent/__tests__/mrr.test.ts
describe('MRR calculation', () => {
  it('normalizes annual subscription to monthly amount', () => {
    // Input: $6000/year subscription
    // Expect: MRR = 500
  });

  it('handles multiple line items per subscription', () => {
    // Input: $500/mo + $200/mo add-on
    // Expect: MRR += 700
  });
});

// apps/ceo/app/api/webhooks/stripe/__tests__/stripe.test.ts
describe('Stripe webhook handler', () => {
  it('returns 400 for invalid Stripe signature', async () => {
    const res = await POST(mockRequest({ headers: { 'stripe-signature': 'bad' }, body: '{}' }));
    expect(res.status).toBe(400);
  });

  it('upserts paid invoice on payment_succeeded', async () => {
    // Mock: valid stripe event, stripe_customers has matching row
    // Assert: invoices.upsert called with status='paid'
  });

  it('creates CEO alert on payment_failed', async () => {
    // Mock: valid payment_failed event, amount_due=120000 (cents)
    // Assert: alerts.insert with type='payment_failed'
  });
});
```

---

## 10. OWASP Security Checklist

| # | Check | Implementation |
|---|-------|----------------|
| 1 | **Stripe Webhook Signature** | `stripe.webhooks.constructEvent()` validates HMAC signature before processing. Rejects any unsigned or tampered webhook. |
| 2 | **Secret Key Security** | `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` stored in Supabase Edge Function secrets. Never exposed to client. |
| 3 | **Apollo Sync Auth** | `/api/webhooks/apollo-sync` requires `x-webhook-secret` header. Same shared-secret pattern as other n8n webhooks. |
| 4 | **Stripe Raw Body** | `body: await req.text()` preserves raw body for HMAC validation. No JSON parsing before signature check. |
| 5 | **Tenant Isolation** | Stripe customer → tenant mapping enforced. Invoices and MRR updates scoped to the correct tenant only. |
| 6 | **CEO-Only Data** | `prospects`, `stripe_customers`, `workflow_runs` tables have CEO-only RLS policies. RM cannot access business-level data. |
| 7 | **Claude API Cost Control** | Finance agent uses `max_tokens: 1000`. Growth agent uses `max_tokens: 800`. Both are capped by pg_cron schedule frequency. |
| 8 | **Prompt Data Minimization** | Only aggregate figures sent to Claude (not individual customer PII). |
| 9 | **Schema Validation** | `FinanceReportSchemaZod` validates Claude response. Failures logged but do not crash the agent. |
| 10 | **Input Validation (Apollo)** | Apollo sync payload is typed. `apollo_id` used as upsert key prevents duplicate insertion. |

---

## 11. Open Questions

| ID | Question | Owner | Resolution |
|----|----------|-------|------------|
| OQ-01 | Should MRR be stored as a separate `mrr_history` table or just in `daily_metrics`? | Engineering | `daily_metrics.mrr` in R1. A separate MRR history table (monthly snapshots) deferred to R3 if needed for the Finance drilldown chart. |
| OQ-02 | How do we handle Stripe test mode vs. live mode in staging? | Engineering | Use `STRIPE_SECRET_KEY=sk_test_...` in staging. Webhook events replay from Stripe CLI: `stripe trigger invoice.payment_succeeded`. |
| OQ-03 | What if a Stripe customer exists but has no corresponding `stripe_customers` row? | Engineering | Log a warning, skip processing for that event. Manual reconciliation in Stripe dashboard. |
| OQ-04 | Should the growth agent alert threshold (14 days) be configurable in CEO settings? | Product | Yes in R2 — add `stall_threshold_days` field to `ceo_settings`. Hardcoded to 14 days in R1. |
| OQ-05 | How is a new client added to `stripe_customers`? | Engineering | When the CEO creates a new tenant in the onboarding flow, they also create a Stripe customer via the Stripe API and insert to `stripe_customers`. This is a manual step in R1. |

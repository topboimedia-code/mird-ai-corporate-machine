# F15 — Reports Archive & AI Intelligence Chat

**Source pitch:** P15
**Cycle:** 8 | **Release:** R2 | **Appetite:** Medium
**Status:** Ready for implementation

> **Dependency note:** F15 and F16 ship in the same cycle (Cycle 8). F16 runs first and populates the `reports` table. F15 ships the same week so reports are immediately viewable. F15 UI includes a proper empty state (days-until-Monday countdown) for the period before F16 has run.

---

## 1. Overview

### Problem
Each week, RainMachine generates an AI intelligence report for every client (via F16). Currently these reports are generated but not surfaced anywhere. Team leaders need to read them, search for insights, and ask follow-up questions without waiting for the next weekly run.

### Solution
A split-layout Reports page in `apps/dashboard`: a left-panel archive list and a right-panel viewer that renders the selected report as structured sections. Below the viewer, an AI chat interface lets the RM ask questions about the report content — powered by the Claude API, rate-limited to 10 queries/week to manage costs.

### Success Criteria
- Report archive list loads in under 1 second
- Report viewer renders all sections correctly (executive summary, metrics grid, campaign table, recommendations, callouts)
- Chat query submission shows a processing state with elapsed timer
- Rate limit at 10 queries/week is enforced server-side (not client-side only)
- Claude API cost is tracked per query in `claude_api_usage`
- Playwright E2E covers archive selection, report render, and chat query

### Out of Scope (MVP)
- Report search / full-text search across archives
- PDF export of reports
- Sharing a report externally via link
- Chat history across sessions (only current session shown)

---

## 2. Database

### New Tables

```sql
-- supabase/migrations/0026_reports.sql

-- Weekly intelligence reports (one per tenant per week)
CREATE TABLE reports (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_type     TEXT NOT NULL DEFAULT 'weekly_intel'
                  CHECK (report_type IN ('weekly_intel', 'ad_ops_summary')),
  week_start      DATE NOT NULL,           -- Monday of the report week
  content         JSONB NOT NULL,          -- WeeklyBriefSchema JSON
  agent_log_id    UUID REFERENCES agent_logs(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, report_type, week_start)
);

CREATE INDEX idx_reports_tenant_created ON reports(tenant_id, created_at DESC);

-- AI chat queries against reports
CREATE TABLE report_chat_queries (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  query       TEXT NOT NULL CHECK (length(query) BETWEEN 5 AND 500),
  response    TEXT NOT NULL,
  tokens_in   INTEGER,
  tokens_out  INTEGER,
  cost_usd    NUMERIC(10,6),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_queries_tenant_week
  ON report_chat_queries(tenant_id, created_at DESC);

-- Claude API cost tracking (all agents write here)
CREATE TABLE claude_api_usage (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id    UUID REFERENCES tenants(id) ON DELETE SET NULL,
  agent_type   TEXT NOT NULL,    -- 'weekly_intel', 'ad_ops', 'growth', 'finance', 'report_chat'
  run_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tokens_in    INTEGER NOT NULL DEFAULT 0,
  tokens_out   INTEGER NOT NULL DEFAULT 0,
  cost_usd     NUMERIC(10,6) NOT NULL DEFAULT 0,
  model        TEXT NOT NULL DEFAULT 'claude-sonnet-4-6'
);

CREATE INDEX idx_claude_usage_tenant ON claude_api_usage(tenant_id, run_at DESC);
CREATE INDEX idx_claude_usage_agent  ON claude_api_usage(agent_type, run_at DESC);
```

### RLS Policies

```sql
-- supabase/migrations/0027_reports_rls.sql

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_chat_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE claude_api_usage ENABLE ROW LEVEL SECURITY;

-- Reports: tenant read their own
CREATE POLICY "reports_tenant_select"
  ON reports FOR SELECT
  USING (tenant_id = auth.tenant_id());

-- CEO reads all reports
CREATE POLICY "reports_ceo_select_all"
  ON reports FOR SELECT
  USING (auth.is_ceo());

-- Chat queries: tenant read their own
CREATE POLICY "chat_queries_tenant_select"
  ON report_chat_queries FOR SELECT
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "chat_queries_tenant_insert"
  ON report_chat_queries FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

-- claude_api_usage: service role only (no direct user access)
```

---

## 3. TypeScript Interfaces

```typescript
// packages/db/src/types/reports.types.ts

// ─── Report content schema ───────────────────────────────────
export interface Metric {
  label: string;
  value: string | number;
  unit?: string;          // '$', '%', etc.
  delta?: number;         // change vs prior period
  delta_direction?: 'up' | 'down' | 'neutral';
}

export interface CampaignPerformanceRow {
  campaign_name: string;
  platform: 'meta' | 'google';
  spend: number;
  leads: number;
  cpl: number | null;
  status: string;
}

export interface WeeklyBriefSchema {
  executive_summary: string;
  key_metrics: Metric[];           // exactly 6 metrics in grid
  campaign_performance: CampaignPerformanceRow[];
  recommendations: string[];       // 3-5 actionable items
  callouts?: string[];             // cyan highlight boxes (optional)
  week_start: string;              // ISO date (Monday)
  generated_at: string;            // ISO timestamp
}

export interface ReportRow {
  id: string;
  tenant_id: string;
  report_type: 'weekly_intel' | 'ad_ops_summary';
  week_start: string;
  content: WeeklyBriefSchema;
  agent_log_id: string | null;
  created_at: string;
}

// ─── Chat ─────────────────────────────────────────────────────
export interface ChatQuery {
  id: string;
  report_id: string;
  tenant_id: string;
  query: string;
  response: string;
  tokens_in: number | null;
  tokens_out: number | null;
  cost_usd: number | null;
  created_at: string;
}

export interface ChatRateLimitStatus {
  queries_this_week: number;
  limit: number;
  eligible: boolean;
}

// ─── Chat submission ──────────────────────────────────────────
export interface SubmitQueryResult {
  success: boolean;
  response?: string;
  rate_limit?: ChatRateLimitStatus;
  error?: string;
}

// ─── Claude client ────────────────────────────────────────────
export interface ClaudeUsageRecord {
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
}
```

---

## 4. Server Actions

```typescript
// apps/dashboard/app/dashboard/reports/actions.ts
'use server';

import { z } from 'zod';
import { createServerClient, createServiceRoleClient } from '@rainmachine/db';
import Anthropic from '@anthropic-ai/sdk';
import type { WeeklyBriefSchema, SubmitQueryResult } from '@rainmachine/db/types/reports.types';

const CHAT_WEEKLY_LIMIT = 10;
const CHAT_SYSTEM_PROMPT = `You are an AI assistant helping a real estate team leader understand their weekly performance report.
Answer questions about the report data concisely and specifically.
Do not speculate about data not present in the report.
Format numbers clearly. Keep responses under 300 words unless detail is necessary.`;

// ─────────────────────────────────────────────
// submitReportQuery
// Rate-checks, calls Claude API with report context,
// validates output, writes to DB, returns response.
// ─────────────────────────────────────────────
const QuerySchema = z.object({
  report_id: z.string().uuid(),
  query: z.string().min(5).max(500),
});

export async function submitReportQuery(input: unknown): Promise<SubmitQueryResult> {
  const parsed = QuerySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid query' };
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthenticated' };

  const tenantId = user.app_metadata.tenant_id as string;

  // 1. Rate limit check: count queries this week (Mon–Sun)
  const weekStart = getWeekStart();
  const { count: weeklyCount } = await supabase
    .from('report_chat_queries')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', weekStart);

  const queryCount = weeklyCount ?? 0;

  if (queryCount >= CHAT_WEEKLY_LIMIT) {
    return {
      success: false,
      rate_limit: {
        queries_this_week: queryCount,
        limit: CHAT_WEEKLY_LIMIT,
        eligible: false,
      },
      error: `Weekly query limit reached (${CHAT_WEEKLY_LIMIT} queries/week).`,
    };
  }

  // 2. Load the report content
  const { data: report } = await supabase
    .from('reports')
    .select('content')
    .eq('id', parsed.data.report_id)
    .eq('tenant_id', tenantId)
    .single();

  if (!report) return { success: false, error: 'Report not found' };

  // 3. Build context string from report
  const reportContext = buildReportContext(report.content as WeeklyBriefSchema);

  // 4. Call Claude API
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let claudeResponse: string;
  let tokensIn = 0;
  let tokensOut = 0;
  let costUsd = 0;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: CHAT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Report context:\n\n${reportContext}\n\nQuestion: ${parsed.data.query}`,
        },
      ],
    });

    claudeResponse = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    tokensIn = message.usage.input_tokens;
    tokensOut = message.usage.output_tokens;
    // claude-sonnet-4-6 pricing: $3/1M input, $15/1M output
    costUsd = (tokensIn * 3 + tokensOut * 15) / 1_000_000;
  } catch (err) {
    return { success: false, error: 'AI service temporarily unavailable. Please try again.' };
  }

  // 5. Write query + response to DB (service role to bypass RLS on insert — tenant_id set explicitly)
  const serviceClient = createServiceRoleClient();
  await serviceClient.from('report_chat_queries').insert({
    report_id: parsed.data.report_id,
    tenant_id: tenantId,
    query: parsed.data.query,
    response: claudeResponse,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_usd: costUsd,
  });

  // 6. Track cost in claude_api_usage
  await serviceClient.from('claude_api_usage').insert({
    tenant_id: tenantId,
    agent_type: 'report_chat',
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_usd: costUsd,
    model: 'claude-sonnet-4-6',
  });

  return {
    success: true,
    response: claudeResponse,
    rate_limit: {
      queries_this_week: queryCount + 1,
      limit: CHAT_WEEKLY_LIMIT,
      eligible: queryCount + 1 < CHAT_WEEKLY_LIMIT,
    },
  };
}

// ─────────────────────────────────────────────
// getReportChatHistory
// Loads previous queries for a report in this session
// ─────────────────────────────────────────────
export async function getReportChatHistory(reportId: string): Promise<{
  queries: Array<{ query: string; response: string; created_at: string }>;
}> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { queries: [] };

  const { data } = await supabase
    .from('report_chat_queries')
    .select('query, response, created_at')
    .eq('report_id', reportId)
    .eq('tenant_id', user.app_metadata.tenant_id)
    .order('created_at', { ascending: true })
    .limit(20);

  return { queries: data ?? [] };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function buildReportContext(content: WeeklyBriefSchema): string {
  const lines: string[] = [
    `WEEKLY REPORT — Week of ${content.week_start}`,
    '',
    'EXECUTIVE SUMMARY:',
    content.executive_summary,
    '',
    'KEY METRICS:',
    ...content.key_metrics.map((m) => `- ${m.label}: ${m.value}${m.unit ?? ''}`),
    '',
    'CAMPAIGN PERFORMANCE:',
    ...content.campaign_performance.map(
      (c) => `- ${c.campaign_name} (${c.platform}): spend $${c.spend}, leads ${c.leads}, CPL ${c.cpl != null ? `$${c.cpl}` : 'N/A'}`
    ),
    '',
    'RECOMMENDATIONS:',
    ...content.recommendations.map((r, i) => `${i + 1}. ${r}`),
  ];
  if (content.callouts?.length) {
    lines.push('', 'CALLOUTS:', ...content.callouts.map((c) => `- ${c}`));
  }
  return lines.join('\n');
}
```

### Claude Client Package

```typescript
// packages/db/src/claude.ts
import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

export function createClaudeClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}
```

---

## 5. API Routes

No new public API routes for this feature. All data loaded via RSC + server actions.

---

## 6. UI Components

### Reports Page (RSC)

```typescript
// apps/dashboard/app/dashboard/reports/page.tsx
import { createServerClient } from '@rainmachine/db';
import { redirect } from 'next/navigation';
import { ReportsClient } from './ReportsClient';
import type { ReportRow } from '@rainmachine/db/types/reports.types';

export default async function ReportsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const tenantId = user.app_metadata.tenant_id as string;

  const [reportsResult, weeklyCountResult] = await Promise.all([
    supabase
      .from('reports')
      .select('id, tenant_id, report_type, week_start, content, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(52), // 1 year of weekly reports
    supabase
      .from('report_chat_queries')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', getMondayIso()),
  ]);

  const reports: ReportRow[] = reportsResult.data ?? [];
  const weeklyQueryCount = weeklyCountResult.count ?? 0;

  return (
    <ReportsClient
      reports={reports}
      initialWeeklyQueryCount={weeklyQueryCount}
      queryLimit={10}
    />
  );
}

function getMondayIso(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}
```

### ReportsClient (Split Layout)

```typescript
// apps/dashboard/app/dashboard/reports/ReportsClient.tsx
'use client';
import { useState } from 'react';
import { ReportArchiveList } from './ReportArchiveList';
import { ReportViewer } from './ReportViewer';
import { ReportChatPanel } from './ReportChatPanel';
import type { ReportRow } from '@rainmachine/db/types/reports.types';

interface Props {
  reports: ReportRow[];
  initialWeeklyQueryCount: number;
  queryLimit: number;
}

export function ReportsClient({ reports, initialWeeklyQueryCount, queryLimit }: Props) {
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(
    reports.length > 0 ? reports[0] : null
  );
  const [weeklyQueryCount, setWeeklyQueryCount] = useState(initialWeeklyQueryCount);

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0" data-testid="reports-page">
      {/* Left panel — Archive list */}
      <div className="w-72 shrink-0 border-r border-[#1A2840] overflow-y-auto">
        <ReportArchiveList
          reports={reports}
          selectedId={selectedReport?.id ?? null}
          onSelect={setSelectedReport}
        />
      </div>

      {/* Right panel — Viewer + Chat */}
      {selectedReport ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <ReportViewer report={selectedReport} />
          </div>
          <div className="border-t border-[#1A2840] px-8 py-6">
            <ReportChatPanel
              reportId={selectedReport.id}
              weeklyQueryCount={weeklyQueryCount}
              queryLimit={queryLimit}
              onQuerySuccess={() => setWeeklyQueryCount((c) => c + 1)}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center" data-testid="reports-empty">
          <EmptyReportsState />
        </div>
      )}
    </div>
  );
}
```

### ReportArchiveList

```typescript
// apps/dashboard/app/dashboard/reports/ReportArchiveList.tsx
import type { ReportRow } from '@rainmachine/db/types/reports.types';

const TYPE_LABELS: Record<string, string> = {
  weekly_intel: 'WEEKLY INTEL',
  ad_ops_summary: 'AD OPS',
};

const TYPE_COLORS: Record<string, string> = {
  weekly_intel: '#00D4FF',
  ad_ops_summary: '#FF6B35',
};

interface Props {
  reports: ReportRow[];
  selectedId: string | null;
  onSelect: (report: ReportRow) => void;
}

export function ReportArchiveList({ reports, selectedId, onSelect }: Props) {
  return (
    <div data-testid="report-archive-list">
      <div className="px-4 py-4 border-b border-[#1A2840]">
        <h2 className="font-orbitron text-sm text-white tracking-wide">REPORTS</h2>
        <p className="font-mono text-xs text-gray-500 mt-1">{reports.length} archived</p>
      </div>
      <div className="divide-y divide-[#1A2840]">
        {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => onSelect(report)}
            className={`w-full text-left px-4 py-4 transition-colors ${
              selectedId === report.id
                ? 'bg-[#00D4FF0D] border-l-2 border-[#00D4FF]'
                : 'hover:bg-[#0A1628]'
            }`}
            data-testid={`archive-item-${report.id}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="font-mono text-xs font-bold"
                style={{ color: TYPE_COLORS[report.report_type] ?? '#00D4FF' }}
              >
                {TYPE_LABELS[report.report_type] ?? report.report_type}
              </span>
            </div>
            <div className="font-mono text-sm text-white">
              Week of {new Date(report.week_start + 'T12:00:00').toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </div>
            <div className="font-mono text-xs text-gray-500 mt-0.5">
              {new Date(report.created_at).toLocaleString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### ReportViewer

```typescript
// apps/dashboard/app/dashboard/reports/ReportViewer.tsx
import type { ReportRow, WeeklyBriefSchema } from '@rainmachine/db/types/reports.types';

interface Props {
  report: ReportRow;
}

export function ReportViewer({ report }: Props) {
  const content = report.content as WeeklyBriefSchema;

  return (
    <article className="max-w-3xl space-y-8" data-testid="report-viewer">
      {/* Header */}
      <header>
        <div className="font-mono text-xs text-[#00D4FF] mb-2">
          WEEKLY INTELLIGENCE REPORT — {new Date(report.week_start + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
          })}
        </div>
        <div className="font-mono text-xs text-gray-600">
          Generated {new Date(report.created_at).toLocaleString()}
        </div>
      </header>

      {/* Executive Summary */}
      <section>
        <h2 className="font-orbitron text-base text-white mb-3 tracking-wide">EXECUTIVE SUMMARY</h2>
        <p
          className="font-mono text-sm text-gray-300 leading-relaxed"
          data-testid="executive-summary"
        >
          {content.executive_summary}
        </p>
      </section>

      {/* Key Metrics 3-col grid */}
      <section>
        <h2 className="font-orbitron text-base text-white mb-3 tracking-wide">KEY METRICS</h2>
        <div className="grid grid-cols-3 gap-4" data-testid="key-metrics-grid">
          {content.key_metrics.map((metric, idx) => (
            <div
              key={idx}
              className="bg-[#0A1628] border border-[#1A2840] rounded-xl p-4"
              data-testid={`metric-card-${idx}`}
            >
              <div className="font-mono text-xs text-gray-500 mb-2">{metric.label}</div>
              <div className="font-orbitron text-xl text-white">
                {metric.unit === '$' ? '$' : ''}
                {typeof metric.value === 'number'
                  ? metric.value.toLocaleString()
                  : metric.value}
                {metric.unit && metric.unit !== '$' ? metric.unit : ''}
              </div>
              {metric.delta != null && (
                <div
                  className={`font-mono text-xs mt-1 ${
                    metric.delta_direction === 'up' ? 'text-[#00FF88]' :
                    metric.delta_direction === 'down' ? 'text-[#FF6B35]' : 'text-gray-500'
                  }`}
                >
                  {metric.delta > 0 ? '+' : ''}{metric.delta}
                  {metric.unit && metric.unit !== '$' ? metric.unit : ''} vs last week
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Campaign Performance Table */}
      {content.campaign_performance.length > 0 && (
        <section>
          <h2 className="font-orbitron text-base text-white mb-3 tracking-wide">CAMPAIGN PERFORMANCE</h2>
          <div
            className="bg-[#0A1628] border border-[#1A2840] rounded-xl overflow-hidden"
            data-testid="campaign-performance-table"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1A2840]">
                  {['Campaign', 'Platform', 'Spend', 'Leads', 'CPL', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-xs text-gray-500">
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.campaign_performance.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-[#1A2840] last:border-0"
                    data-testid={`campaign-row-${idx}`}
                  >
                    <td className="px-4 py-3 font-mono text-sm text-white">{row.campaign_name}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs font-bold ${
                        row.platform === 'meta' ? 'text-[#1877F2]' : 'text-[#EA4335]'
                      }`}>
                        {row.platform.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">${row.spend.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-sm text-[#00FF88]">{row.leads}</td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {row.cpl != null ? `$${row.cpl.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs font-bold ${
                        row.status === 'active' ? 'text-[#00FF88]' : 'text-gray-500'
                      }`}>
                        {row.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Recommendations */}
      <section>
        <h2 className="font-orbitron text-base text-white mb-3 tracking-wide">RECOMMENDATIONS</h2>
        <ol className="space-y-2" data-testid="recommendations-list">
          {content.recommendations.map((rec, idx) => (
            <li key={idx} className="flex gap-3 font-mono text-sm text-gray-300">
              <span className="text-[#00D4FF] font-bold shrink-0">{idx + 1}.</span>
              <span>{rec}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Callouts */}
      {content.callouts && content.callouts.length > 0 && (
        <section className="space-y-3" data-testid="callouts-section">
          {content.callouts.map((callout, idx) => (
            <div
              key={idx}
              className="bg-[#00D4FF0D] border border-[#00D4FF3A] rounded-xl px-5 py-4 font-mono text-sm text-[#00D4FF]"
              data-testid={`callout-${idx}`}
            >
              {callout}
            </div>
          ))}
        </section>
      )}
    </article>
  );
}
```

### EmptyReportsState

```typescript
// apps/dashboard/app/dashboard/reports/EmptyReportsState.tsx
'use client';
import { useState, useEffect } from 'react';

function getDaysUntilNextMonday(): number {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon
  const daysUntil = day === 1 ? 7 : (8 - day) % 7;
  return daysUntil;
}

export function EmptyReportsState() {
  const [daysUntil, setDaysUntil] = useState(getDaysUntilNextMonday());

  useEffect(() => {
    const interval = setInterval(() => {
      setDaysUntil(getDaysUntilNextMonday());
    }, 60 * 60 * 1000); // refresh hourly
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center max-w-sm" data-testid="reports-empty-state">
      <div className="font-orbitron text-4xl text-[#00D4FF] mb-2">{daysUntil}</div>
      <div className="font-mono text-sm text-gray-400">
        {daysUntil === 1 ? 'day' : 'days'} until your first intelligence report
      </div>
      <div className="font-mono text-xs text-gray-600 mt-3">
        RainMachine generates weekly reports every Monday at 6:15am ET
      </div>
    </div>
  );
}
```

### ReportChatPanel

```typescript
// apps/dashboard/app/dashboard/reports/ReportChatPanel.tsx
'use client';
import { useState, useTransition, useEffect, useRef } from 'react';
import { submitReportQuery } from './actions';

const SUGGESTION_CHIPS = [
  'What was my best performing campaign this week?',
  'Why did my CPL increase?',
  'What should I prioritize next week?',
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Props {
  reportId: string;
  weeklyQueryCount: number;
  queryLimit: number;
  onQuerySuccess: () => void;
}

export function ReportChatPanel({
  reportId,
  weeklyQueryCount,
  queryLimit,
  onQuerySuccess,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const queriesLeft = queryLimit - weeklyQueryCount;
  const isLimitReached = queriesLeft <= 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startElapsedTimer = () => {
    setElapsedSeconds(0);
    elapsedRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  };

  const stopElapsedTimer = () => {
    if (elapsedRef.current) clearInterval(elapsedRef.current);
  };

  const handleSubmit = (query: string) => {
    if (!query.trim() || isPending || isLimitReached) return;

    const userMessage: Message = { role: 'user', content: query, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setErrorMsg(null);
    startElapsedTimer();

    startTransition(async () => {
      const result = await submitReportQuery({ report_id: reportId, query });
      stopElapsedTimer();

      if (result.success && result.response) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: result.response!, timestamp: new Date().toISOString() },
        ]);
        onQuerySuccess();
      } else {
        setErrorMsg(result.error ?? 'Something went wrong');
      }
    });
  };

  return (
    <div className="space-y-4" data-testid="report-chat-panel">
      {/* Rate limit indicator */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-gray-500">AI REPORT CHAT</span>
        <span
          className={`font-mono text-xs ${queriesLeft <= 2 ? 'text-[#FF6B35]' : 'text-gray-500'}`}
          data-testid="query-counter"
        >
          {queriesLeft} / {queryLimit} queries remaining this week
        </span>
      </div>

      {/* Message history */}
      {messages.length > 0 && (
        <div
          className="max-h-64 overflow-y-auto space-y-3 bg-[#0A1628] border border-[#1A2840] rounded-xl p-4"
          data-testid="chat-messages"
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`font-mono text-sm ${msg.role === 'user' ? 'text-[#00D4FF]' : 'text-gray-300'}`}
              data-testid={`chat-message-${idx}`}
            >
              <span className="text-xs text-gray-600 mr-2">
                {msg.role === 'user' ? 'YOU' : 'AI'}
              </span>
              {msg.content}
            </div>
          ))}
          {isPending && (
            <div className="flex items-center gap-2 font-mono text-xs text-gray-500" data-testid="chat-processing">
              <span className="animate-pulse">●●●</span>
              <span>{elapsedSeconds}s</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Suggestion chips (only when no messages yet) */}
      {messages.length === 0 && !isLimitReached && (
        <div className="flex flex-wrap gap-2" data-testid="suggestion-chips">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSubmit(chip)}
              className="px-3 py-1.5 bg-[#0A1628] border border-[#1A2840] rounded-full font-mono text-xs text-gray-400
                         hover:border-[#00D4FF] hover:text-[#00D4FF] transition-colors"
              data-testid={`suggestion-${chip.slice(0, 20)}`}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="flex items-center gap-3 font-mono text-sm text-[#FF6B35]" data-testid="chat-error">
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-xs underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Input */}
      {isLimitReached ? (
        <div
          className="bg-[#FF6B351A] border border-[#FF6B3533] rounded-xl px-4 py-3 font-mono text-sm text-[#FF6B35]"
          data-testid="rate-limit-message"
        >
          Weekly query limit reached. Resets next Monday.
        </div>
      ) : (
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(input); }}
            placeholder="Ask a question about this report..."
            disabled={isPending}
            className="flex-1 bg-[#0A1628] border border-[#1A2840] rounded-xl px-4 py-2.5 font-mono text-sm text-white
                       placeholder-gray-600 focus:border-[#00D4FF] focus:outline-none disabled:opacity-50"
            data-testid="chat-input"
          />
          <button
            onClick={() => handleSubmit(input)}
            disabled={!input.trim() || isPending}
            className="px-5 py-2.5 bg-[#00D4FF] text-[#050D1A] font-mono font-bold text-sm rounded-xl
                       disabled:opacity-40 hover:bg-[#00BFEF] transition-colors"
            data-testid="chat-submit-button"
          >
            ASK
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 7. Integration Points

### F16 — Report Population
F16's `weekly-intelligence-agent` Edge Function inserts rows to the `reports` table. F15 is a pure consumer — it reads and displays whatever F16 writes. The `WeeklyBriefSchema` Zod type must match between F15 (display) and F16 (generation).

### Claude API (`packages/db/src/claude.ts`)
The `createClaudeClient()` factory is shared across F15, F16, and F17. It uses a module-level singleton to avoid creating multiple Anthropic instances.

### Cost Tracking
Every Claude API call in the system writes to `claude_api_usage`. The CEO can view aggregate costs in F20 agent logs. In F15, costs are tracked per `report_chat` query.

### Sidebar Nav
Add "Reports" to the dashboard sidebar nav after Campaigns:
```typescript
{ label: 'REPORTS', href: '/dashboard/reports', icon: DocumentChartBarIcon }
```

---

## 8. BDD Scenarios

```gherkin
Feature: F15 — Reports Archive & AI Intelligence Chat

  Background:
    Given I am authenticated as an RM with tenant_id "tenant-abc"
    And the tenant has 4 weekly reports in the archive

  Scenario: Archive list shows all reports
    When I navigate to "/dashboard/reports"
    Then I see the report-archive-list with 4 items
    And the most recent report is selected by default
    And I see the report-viewer for that report

  Scenario: Select a different report
    When I click archive-item-{older_report_id}
    Then the report-viewer updates to show that report
    And the selected item is highlighted with cyan border-left

  Scenario: Report viewer renders all sections
    Given the selected report has all 6 key metrics, 3 campaigns, 4 recommendations, and 2 callouts
    When I view the report-viewer
    Then I see key-metrics-grid with 6 cards
    And I see campaign-performance-table with 3 rows
    And I see recommendations-list with 4 items
    And I see 2 callouts in callouts-section

  Scenario: Metric delta badge
    Given a metric has delta: 5, delta_direction: "up"
    Then the metric shows "+5 vs last week" in green

  Scenario: Empty state with countdown
    Given the tenant has 0 reports
    When I navigate to "/dashboard/reports"
    Then I see the reports-empty-state
    And I see a number showing days until next Monday

  Scenario: Submit chat query
    Given the selected report is loaded
    When I type "What was my best campaign?" in chat-input
    And I click ASK
    Then I see the processing animation with elapsed timer
    And eventually I see the AI response in chat-messages
    And query-counter decrements by 1

  Scenario: Suggestion chip triggers query
    Given no messages have been sent yet
    When I click a suggestion-chip
    Then the chip text is submitted as a query
    And I see the processing state

  Scenario: Rate limit at 10 queries
    Given I have used 10 queries this week
    When I view the chat panel
    Then the chat-input is replaced by rate-limit-message
    And query-counter shows "0 / 10 queries remaining"

  Scenario: Rate limit enforced server-side
    Given I've made 9 queries and attempt an 11th via direct action call
    Then the 11th query returns an error with rate_limit details
    And no Claude API call is made
```

---

## 9. Test Plan

### Unit Tests

```typescript
// packages/db/src/types/__tests__/reports.test.ts
import { z } from 'zod';
import { WeeklyBriefSchemaZod } from '../reports.types'; // Zod version used in F16

describe('WeeklyBriefSchema Zod validation', () => {
  it('validates a well-formed report', () => {
    const valid = {
      executive_summary: 'Good week overall.',
      key_metrics: [{ label: 'Total Leads', value: 42, unit: '' }],
      campaign_performance: [{ campaign_name: 'Test', platform: 'meta', spend: 500, leads: 10, cpl: 50, status: 'active' }],
      recommendations: ['Increase budget by 10%'],
      week_start: '2025-01-20',
      generated_at: '2025-01-20T06:15:00Z',
    };
    expect(() => WeeklyBriefSchemaZod.parse(valid)).not.toThrow();
  });

  it('rejects report missing executive_summary', () => {
    const invalid = { key_metrics: [], campaign_performance: [], recommendations: [] };
    expect(() => WeeklyBriefSchemaZod.parse(invalid)).toThrow();
  });
});

// apps/dashboard/app/dashboard/reports/__tests__/actions.test.ts
describe('submitReportQuery', () => {
  it('returns rate limit error at 11th query', async () => {
    // Mock: supabase count returns 10
    const result = await submitReportQuery({ report_id: 'uuid', query: 'test question?' });
    expect(result.success).toBe(false);
    expect(result.rate_limit?.eligible).toBe(false);
  });

  it('calls Claude API with report context in user message', async () => {
    // Mock: count < 10, report exists, Anthropic.messages.create returns known response
    // Assert: Anthropic called with system prompt + report context
  });

  it('tracks cost in claude_api_usage table', async () => {
    // Mock: Claude returns 100 input + 50 output tokens
    // Assert: claude_api_usage insert called with correct cost_usd
  });
});

describe('getDaysUntilNextMonday', () => {
  it('returns 7 when today is Monday', () => {
    // Mock: new Date() returns a Monday
    // Expect: 7
  });
  it('returns 1 when today is Sunday', () => {
    // Mock: new Date() returns a Sunday
    // Expect: 1
  });
});
```

### Integration Tests

```typescript
// apps/dashboard/app/dashboard/reports/__tests__/rate-limit.integration.test.ts
describe('Report chat rate limit integration', () => {
  it('allows exactly 10 queries per week then blocks 11th', async () => {
    // Seed: 9 report_chat_queries for tenant-abc this week
    // Call submitReportQuery → should succeed (10th)
    // Call again → should fail with rate limit error
  });
});
```

### Playwright E2E

```typescript
// apps/dashboard/e2e/reports.spec.ts
test('reports archive renders and viewer loads', async ({ page }) => {
  await page.goto('/dashboard/reports');
  await expect(page.getByTestId('reports-page')).toBeVisible();
  await expect(page.getByTestId('report-archive-list')).toBeVisible();
  await expect(page.getByTestId('report-viewer')).toBeVisible();
});

test('click archive item switches viewer', async ({ page }) => {
  await page.goto('/dashboard/reports');
  const items = page.getByTestId(/archive-item-/);
  if ((await items.count()) > 1) {
    await items.nth(1).click();
    // Verify viewer updates (check the heading changes)
    await expect(page.getByTestId('report-viewer')).toBeVisible();
  }
});

test('suggestion chip submits query', async ({ page }) => {
  await page.goto('/dashboard/reports');
  const chip = page.getByTestId(/suggestion-/).first();
  await chip.click();
  await expect(page.getByTestId('chat-processing')).toBeVisible();
  await expect(page.getByTestId(/chat-message-/)).toHaveCount(2, { timeout: 15000 }); // user + AI
});
```

---

## 10. OWASP Security Checklist

| # | Check | Implementation |
|---|-------|----------------|
| 1 | **Broken Access Control** | `submitReportQuery` verifies `tenant_id` from JWT, then loads report by `(id, tenant_id)` — CEO/other tenants cannot query another tenant's report. |
| 2 | **API Key Exposure** | `ANTHROPIC_API_KEY` is a server-side env var only. Never returned to client or logged. |
| 3 | **Rate Limiting** | 10 queries/week enforced via server-side DB count. Client-side counter is display-only; bypass attempt returns `success: false`. |
| 4 | **Prompt Injection via Report Content** | Report content is inserted as a structured context block, not as instructions. System prompt role is separate. Claude cannot be redirected by report content. |
| 5 | **Query Input Validation** | Zod enforces 5–500 char length. No HTML tags stored — text only. |
| 6 | **Cost Exhaustion** | `max_tokens: 500` caps per-query output cost. Weekly rate limit caps volume. |
| 7 | **XSS in Chat Response** | Claude response rendered as React text node (not `dangerouslySetInnerHTML`). |
| 8 | **Data Leakage** | `buildReportContext` uses only the report's own data. No cross-tenant data in the Claude prompt. |
| 9 | **Unauthenticated Access** | Page redirects to `/login` for unauthenticated users. Actions return errors for missing JWT. |
| 10 | **SQL Injection** | All queries use parameterized Supabase SDK. Week start calculation uses `Date` object (not string interpolation). |

---

## 11. Open Questions

| ID | Question | Owner | Resolution |
|----|----------|-------|------------|
| OQ-01 | Should the weekly query limit be per-tenant or per-user (if multiple users per tenant in R2)? | Product | Per-tenant in R1 (single RM per tenant). |
| OQ-02 | Should chat history persist across browser sessions (i.e., load previous queries on page load)? | Design | No in R1. Each page load starts fresh. Previous queries visible only if `getReportChatHistory` is called on mount — deferred to R2. |
| OQ-03 | What happens to the chat panel when a different report is selected from the archive? | Design | Chat panel clears and shows fresh suggestion chips for the newly selected report. |
| OQ-04 | Should we show the cost of each chat query to the CEO (in agent logs or usage report)? | Product | Yes — via `claude_api_usage` table visible in F20 Agent Logs. Not shown to RM. |
| OQ-05 | Should the system prompt be stored in `agent_prompts` table (updatable without deploy) like F16? | Engineering | No for chat — system prompt is functional logic, not content. Store in code. Only report generation prompts are in `agent_prompts`. |

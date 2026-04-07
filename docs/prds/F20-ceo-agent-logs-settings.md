# F20 — CEO Agent Logs & Alert Settings

## 1. Overview

### Feature Summary
Two final CEO views: **Agent Logs** (`/agent-logs`) and **CEO Settings** (`/settings`). Agent Logs provides a dated, per-department view of every AI agent run — with abbreviated entry previews, an expand button for full log detail, and a streaming CSV export. CEO Settings provides a threshold configuration form (CPL target, close-rate floor, spend over-target %) plus notification preference toggles, backed by the `ceo_settings` table.

### Goals
- Give the CEO a transparent window into what every AI agent did on any given day
- Allow the CEO to tune alert thresholds without a code deploy
- Enable CSV export of agent log history for offline analysis / audits

### Non-Goals
- No real-time streaming of agent runs as they happen (logs are read after completion)
- No per-tenant notification preferences from this screen (tenant notification prefs are in F11 RM Settings)
- No creating or editing agent prompts from this screen (prompt management is a direct DB operation for now)

### Cycle
Cycle 11 — R2, Small

### App
`apps/ceo`

---

## 2. Database Schema

### New Tables

#### `ceo_settings` (migration 0035)
```sql
CREATE TABLE ceo_settings (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Alert thresholds
  cpl_threshold_pct      numeric(5,2) NOT NULL DEFAULT 50.0,
    -- Alert when CPL exceeds (baseline * (1 + cpl_threshold_pct/100))
    -- e.g., 50.0 means alert at 1.5x baseline
  close_rate_floor_pct   numeric(5,2) NOT NULL DEFAULT 10.0,
    -- Alert when rolling 30d close rate falls below this
  spend_over_target_pct  numeric(5,2) NOT NULL DEFAULT 20.0,
    -- Alert when weekly spend exceeds budget by this %
  -- Notification prefs
  notification_prefs     JSONB NOT NULL DEFAULT '{
    "weekly_summary_email": true,
    "critical_alert_email": true,
    "critical_alert_sms": false,
    "agent_error_email": true
  }'::jsonb,
  -- Singleton enforcement
  singleton_key          text UNIQUE NOT NULL DEFAULT 'ceo',
  updated_at             timestamptz DEFAULT now(),
  updated_by             uuid REFERENCES auth.users(id)
);

-- Seed default row so there's always one row
INSERT INTO ceo_settings (singleton_key) VALUES ('ceo')
ON CONFLICT (singleton_key) DO NOTHING;

-- RLS
ALTER TABLE ceo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO can read settings"
  ON ceo_settings FOR SELECT USING (auth.is_ceo());

CREATE POLICY "CEO can update settings"
  ON ceo_settings FOR UPDATE USING (auth.is_ceo());
```

> **Singleton pattern**: `singleton_key` column with UNIQUE constraint + ON CONFLICT seed ensures exactly one row exists. Server action uses `UPDATE ... WHERE singleton_key = 'ceo'`.

### Existing Tables Referenced

#### `agent_logs` (scaffolded in F13 — full structure confirmed here)
```sql
-- Full schema for reference:
CREATE TABLE agent_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department   text NOT NULL CHECK (department IN ('growth','ad-ops','finance','weekly-intel')),
  run_date     date NOT NULL,
  status       text NOT NULL CHECK (status IN ('success','partial','error')),
  entries      JSONB NOT NULL DEFAULT '[]',
    -- Array of: { timestamp: string, level: 'info'|'warn'|'error', message: string, tenant_id?: string }
  tenant_scope text CHECK (tenant_scope IN ('platform','per-tenant')) DEFAULT 'platform',
  duration_ms  integer,
  created_at   timestamptz DEFAULT now()
);

-- Already enabled in F13
-- CEO-only RLS SELECT policy already created in F13
```

### Migrations Summary
| Migration | Description |
|-----------|-------------|
| 0035 | `ceo_settings` table + RLS + seed row |

---

## 3. TypeScript Interfaces

```typescript
// packages/db/src/types/ceo.types.ts

export interface CeoSettings {
  id: string;
  cpl_threshold_pct: number;
  close_rate_floor_pct: number;
  spend_over_target_pct: number;
  notification_prefs: CeoNotificationPrefs;
  singleton_key: 'ceo';
  updated_at: string;
  updated_by: string | null;
}

export interface CeoNotificationPrefs {
  weekly_summary_email: boolean;
  critical_alert_email: boolean;
  critical_alert_sms: boolean;
  agent_error_email: boolean;
}

export interface AgentLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  tenant_id?: string;
}

export interface AgentLogRow {
  id: string;
  department: 'growth' | 'ad-ops' | 'finance' | 'weekly-intel';
  run_date: string;         // ISO date 'YYYY-MM-DD'
  status: 'success' | 'partial' | 'error';
  entries: AgentLogEntry[];
  tenant_scope: 'platform' | 'per-tenant';
  duration_ms: number | null;
  created_at: string;
}

// View model for the abbreviated log card
export interface AgentLogCard {
  id: string;
  department: AgentLogRow['department'];
  run_date: string;
  status: AgentLogRow['status'];
  duration_ms: number | null;
  entry_count: number;
  preview_entries: AgentLogEntry[];  // first 3 entries
  has_more: boolean;
}
```

```typescript
// Zod validation for settings form
// packages/db/src/types/ceo.types.ts (additions)

import { z } from 'zod';

export const CeoSettingsFormSchema = z.object({
  cpl_threshold_pct: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Must be ≥ 0')
    .max(500, 'Must be ≤ 500'),
  close_rate_floor_pct: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Must be ≥ 0')
    .max(100, 'Must be ≤ 100'),
  spend_over_target_pct: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Must be ≥ 0')
    .max(500, 'Must be ≤ 500'),
  notification_prefs: z.object({
    weekly_summary_email: z.boolean(),
    critical_alert_email: z.boolean(),
    critical_alert_sms: z.boolean(),
    agent_error_email: z.boolean(),
  }),
});

export type CeoSettingsFormValues = z.infer<typeof CeoSettingsFormSchema>;
```

---

## 4. Server Actions

All server actions in `apps/ceo/src/actions/`.

### `agent-logs.actions.ts`

```typescript
'use server';

import { createServerClient } from '@/lib/supabase/server';
import type { AgentLogRow, AgentLogCard } from '@rainmachine/db/types/ceo.types';

async function assertCeo() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'ceo') {
    throw new Error('Unauthorized');
  }
  return supabase;
}

export async function getAgentLogs(
  runDate: string // ISO date 'YYYY-MM-DD'
): Promise<AgentLogCard[]> {
  const supabase = await assertCeo();

  const { data, error } = await supabase
    .from('agent_logs')
    .select('*')
    .eq('run_date', runDate)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: AgentLogRow): AgentLogCard => ({
    id: row.id,
    department: row.department,
    run_date: row.run_date,
    status: row.status,
    duration_ms: row.duration_ms,
    entry_count: row.entries.length,
    preview_entries: row.entries.slice(0, 3),
    has_more: row.entries.length > 3,
  }));
}

export async function getAgentLogDetail(logId: string): Promise<AgentLogRow | null> {
  const supabase = await assertCeo();

  const { data, error } = await supabase
    .from('agent_logs')
    .select('*')
    .eq('id', logId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as AgentLogRow | null;
}

export async function getAvailableLogDates(): Promise<string[]> {
  const supabase = await assertCeo();

  const { data, error } = await supabase
    .from('agent_logs')
    .select('run_date')
    .order('run_date', { ascending: false })
    .limit(90); // last 90 days at most

  if (error) throw new Error(error.message);

  // deduplicate dates
  const unique = Array.from(new Set((data ?? []).map((r) => r.run_date)));
  return unique;
}

export async function exportAgentLog(
  department: AgentLogRow['department'],
  startDate: string,
  endDate: string
): Promise<string> {
  const supabase = await assertCeo();

  const { data, error } = await supabase
    .from('agent_logs')
    .select('*')
    .eq('department', department)
    .gte('run_date', startDate)
    .lte('run_date', endDate)
    .order('run_date', { ascending: true });

  if (error) throw new Error(error.message);

  const rows: AgentLogRow[] = (data ?? []) as AgentLogRow[];

  // Build CSV: one row per log entry
  const csvLines: string[] = [
    'run_date,department,status,duration_ms,entry_timestamp,level,message,tenant_id',
  ];

  for (const log of rows) {
    for (const entry of log.entries) {
      const cols = [
        log.run_date,
        log.department,
        log.status,
        log.duration_ms ?? '',
        entry.timestamp,
        entry.level,
        // Escape commas and quotes in message
        `"${entry.message.replace(/"/g, '""')}"`,
        entry.tenant_id ?? '',
      ];
      csvLines.push(cols.join(','));
    }
  }

  return csvLines.join('\n');
}
```

### `ceo-settings.actions.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import {
  CeoSettings,
  CeoSettingsFormSchema,
  CeoSettingsFormValues,
} from '@rainmachine/db/types/ceo.types';

async function assertCeo() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'ceo') {
    throw new Error('Unauthorized');
  }
  return { supabase, user };
}

export async function getCeoSettings(): Promise<CeoSettings> {
  const { supabase } = await assertCeo();

  const { data, error } = await supabase
    .from('ceo_settings')
    .select('*')
    .eq('singleton_key', 'ceo')
    .single();

  if (error) throw new Error(error.message);
  return data as CeoSettings;
}

export async function saveCeoSettings(
  values: CeoSettingsFormValues
): Promise<{ success: true } | { success: false; error: string }> {
  // Validate first
  const parsed = CeoSettingsFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
  }

  const { supabase, user } = await assertCeo();

  const { error } = await supabase
    .from('ceo_settings')
    .update({
      cpl_threshold_pct: parsed.data.cpl_threshold_pct,
      close_rate_floor_pct: parsed.data.close_rate_floor_pct,
      spend_over_target_pct: parsed.data.spend_over_target_pct,
      notification_prefs: parsed.data.notification_prefs,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('singleton_key', 'ceo');

  if (error) return { success: false, error: error.message };

  revalidatePath('/settings');
  return { success: true };
}
```

---

## 5. API Routes

### `GET /api/agent-logs/export`
Streams CSV export to client so the browser triggers a file download.

```typescript
// apps/ceo/app/api/agent-logs/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { exportAgentLog } from '@/actions/agent-logs.actions';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'ceo') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const department = searchParams.get('department');
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  if (!department || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // Validate department value
  const validDepts = ['growth', 'ad-ops', 'finance', 'weekly-intel'];
  if (!validDepts.includes(department)) {
    return NextResponse.json({ error: 'Invalid department' }, { status: 400 });
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }

  try {
    const csv = await exportAgentLog(
      department as 'growth' | 'ad-ops' | 'finance' | 'weekly-intel',
      startDate,
      endDate
    );

    const filename = `agent-logs-${department}-${startDate}-to-${endDate}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Export failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

---

## 6. UI Components

### Agent Logs Page — `apps/ceo/app/agent-logs/page.tsx`

```typescript
import { Suspense } from 'react';
import { getAgentLogs, getAvailableLogDates } from '@/actions/agent-logs.actions';
import { AgentLogsClient } from './_components/AgentLogsClient';

export const metadata = { title: 'Agent Logs — RainMachine CEO' };

// Default to today's date
function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export default async function AgentLogsPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const selectedDate = searchParams.date ?? todayIso();

  const [logs, availableDates] = await Promise.all([
    getAgentLogs(selectedDate),
    getAvailableLogDates(),
  ]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-orbitron text-white">Agent Logs</h1>
        <p className="text-sm text-gray-400 mt-1">
          AI agent activity log · All departments · By run date
        </p>
      </div>

      <Suspense fallback={<div className="h-64 animate-pulse bg-[#0A1628] rounded-xl" />}>
        <AgentLogsClient
          logs={logs}
          selectedDate={selectedDate}
          availableDates={availableDates}
        />
      </Suspense>
    </div>
  );
}
```

### `AgentLogsClient`

```typescript
// apps/ceo/app/agent-logs/_components/AgentLogsClient.tsx
'use client';

import { useRouter } from 'next/navigation';
import type { AgentLogCard } from '@rainmachine/db/types/ceo.types';
import { AgentLogPanel } from './AgentLogPanel';
import { ExportButton } from './ExportButton';

const DEPARTMENT_ORDER = ['weekly-intel', 'ad-ops', 'growth', 'finance'] as const;

const DEPARTMENT_LABELS: Record<string, string> = {
  'weekly-intel': 'Weekly Intelligence',
  'ad-ops': 'Ad Operations',
  'growth': 'Growth Acquisition',
  'finance': 'Finance Intelligence',
};

interface Props {
  logs: AgentLogCard[];
  selectedDate: string;
  availableDates: string[];
}

export function AgentLogsClient({ logs, selectedDate, availableDates }: Props) {
  const router = useRouter();

  function handleDateChange(date: string) {
    router.push(`/agent-logs?date=${date}`);
  }

  // Index logs by department for O(1) lookup
  const logsByDept = Object.fromEntries(logs.map((l) => [l.department, l]));

  return (
    <div className="space-y-6">
      {/* Controls row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400">Run Date:</label>
          <select
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-[#0A1628] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#00D4FF]/50"
          >
            {availableDates.map((date) => (
              <option key={date} value={date}>
                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </option>
            ))}
          </select>
        </div>
        <ExportButton selectedDate={selectedDate} />
      </div>

      {/* 4 department panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {DEPARTMENT_ORDER.map((dept) => (
          <AgentLogPanel
            key={dept}
            department={dept}
            label={DEPARTMENT_LABELS[dept]}
            log={logsByDept[dept] ?? null}
            runDate={selectedDate}
          />
        ))}
      </div>
    </div>
  );
}
```

### `AgentLogPanel`

```typescript
// apps/ceo/app/agent-logs/_components/AgentLogPanel.tsx
'use client';

import Link from 'next/link';
import type { AgentLogCard, AgentLogEntry } from '@rainmachine/db/types/ceo.types';
import { formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG = {
  success: { label: 'Success', className: 'text-[#00FF88] bg-[#00FF88]/10 border-[#00FF88]/30' },
  partial: { label: 'Partial', className: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  error: { label: 'Error', className: 'text-red-400 bg-red-400/10 border-red-400/30' },
};

const LEVEL_COLOR: Record<string, string> = {
  info: 'text-gray-300',
  warn: 'text-yellow-300',
  error: 'text-red-400',
};

const DEPT_ICONS: Record<string, string> = {
  'weekly-intel': '🧠',
  'ad-ops': '📊',
  'growth': '🚀',
  'finance': '💰',
};

function LogEntryRow({ entry }: { entry: AgentLogEntry }) {
  return (
    <div className="flex items-start gap-2 text-xs font-mono">
      <span className="text-gray-600 shrink-0 w-20 truncate">
        {new Date(entry.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })}
      </span>
      <span className={`uppercase font-bold w-10 shrink-0 ${LEVEL_COLOR[entry.level]}`}>
        [{entry.level.toUpperCase().slice(0, 4)}]
      </span>
      <span className={`flex-1 ${LEVEL_COLOR[entry.level]}`}>
        {entry.message}
        {entry.tenant_id && (
          <span className="text-gray-500 ml-1">· {entry.tenant_id.slice(0, 8)}</span>
        )}
      </span>
    </div>
  );
}

interface Props {
  department: string;
  label: string;
  log: AgentLogCard | null;
  runDate: string;
}

export function AgentLogPanel({ department, label, log, runDate }: Props) {
  const icon = DEPT_ICONS[department] ?? '🤖';

  if (!log) {
    return (
      <div className="bg-[#0A1628] border border-white/10 rounded-xl p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">{icon}</span>
          <h3 className="text-sm font-semibold text-white font-orbitron tracking-wider uppercase">
            {label}
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center py-6">
          <p className="text-sm text-gray-500">No run found for {runDate}</p>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[log.status];

  return (
    <div className="bg-[#0A1628] border border-white/10 rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="text-sm font-semibold text-white font-orbitron tracking-wider uppercase">
            {label}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {log.entry_count} entries
            {log.duration_ms && ` · ${(log.duration_ms / 1000).toFixed(1)}s`}
          </span>
          <span className={`px-2 py-0.5 rounded border text-xs font-medium ${statusCfg.className}`}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Preview entries */}
      <div className="px-5 py-4 space-y-2 bg-black/20 flex-1">
        {log.preview_entries.map((entry, idx) => (
          <LogEntryRow key={idx} entry={entry} />
        ))}
        {log.entry_count === 0 && (
          <p className="text-xs text-gray-600 italic">No log entries</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
        {log.has_more && (
          <span className="text-xs text-gray-500">
            +{log.entry_count - 3} more entries
          </span>
        )}
        <Link
          href={`/agent-logs/${log.id}`}
          className="text-xs text-[#00D4FF] hover:underline ml-auto"
        >
          View full log →
        </Link>
      </div>
    </div>
  );
}
```

### Full Log Sub-page — `apps/ceo/app/agent-logs/[logId]/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAgentLogDetail } from '@/actions/agent-logs.actions';
import { FullLogViewer } from './_components/FullLogViewer';

export default async function FullLogPage({
  params,
}: {
  params: { logId: string };
}) {
  const log = await getAgentLogDetail(params.logId);
  if (!log) notFound();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <Link
          href={`/agent-logs?date=${log.run_date}`}
          className="text-xs text-gray-400 hover:text-[#00D4FF] mb-2 inline-block"
        >
          ← Agent Logs ({log.run_date})
        </Link>
        <h1 className="text-2xl font-bold font-orbitron text-white capitalize">
          {log.department.replace('-', ' ')} Agent
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {log.run_date} · {log.entries.length} entries
          {log.duration_ms && ` · ${(log.duration_ms / 1000).toFixed(1)}s`}
        </p>
      </div>

      <FullLogViewer log={log} />
    </div>
  );
}
```

### `FullLogViewer`

```typescript
// apps/ceo/app/agent-logs/[logId]/_components/FullLogViewer.tsx
'use client';

import type { AgentLogRow, AgentLogEntry } from '@rainmachine/db/types/ceo.types';

const LEVEL_COLOR: Record<string, string> = {
  info: 'text-gray-300',
  warn: 'text-yellow-300',
  error: 'text-red-400',
};

const LEVEL_BG: Record<string, string> = {
  info: '',
  warn: 'bg-yellow-400/5',
  error: 'bg-red-400/5',
};

export function FullLogViewer({ log }: { log: AgentLogRow }) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="text-xs text-gray-500 ml-2 font-mono">agent-log.txt</span>
      </div>
      <div className="p-5 space-y-1 font-mono text-xs max-h-[600px] overflow-y-auto">
        {log.entries.map((entry, idx) => (
          <div key={idx} className={`flex items-start gap-3 py-0.5 px-1 rounded ${LEVEL_BG[entry.level]}`}>
            <span className="text-gray-600 shrink-0 w-24">
              {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </span>
            <span className={`uppercase font-bold w-12 shrink-0 ${LEVEL_COLOR[entry.level]}`}>
              [{entry.level.slice(0, 4).toUpperCase()}]
            </span>
            <span className={`flex-1 break-all ${LEVEL_COLOR[entry.level]}`}>
              {entry.tenant_id && (
                <span className="text-gray-500">[{entry.tenant_id.slice(0, 8)}] </span>
              )}
              {entry.message}
            </span>
          </div>
        ))}
        {log.entries.length === 0 && (
          <p className="text-gray-600 italic">No entries recorded for this run</p>
        )}
      </div>
    </div>
  );
}
```

### `ExportButton`

```typescript
// apps/ceo/app/agent-logs/_components/ExportButton.tsx
'use client';

import { useState } from 'react';

const DEPARTMENTS = [
  { value: 'weekly-intel', label: 'Weekly Intelligence' },
  { value: 'ad-ops', label: 'Ad Operations' },
  { value: 'growth', label: 'Growth Acquisition' },
  { value: 'finance', label: 'Finance Intelligence' },
];

function subtractDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export function ExportButton({ selectedDate }: { selectedDate: string }) {
  const [open, setOpen] = useState(false);
  const [dept, setDept] = useState('growth');
  const [range, setRange] = useState(30);

  function handleExport() {
    const endDate = selectedDate;
    const startDate = subtractDays(selectedDate, range);
    const url = `/api/agent-logs/export?department=${dept}&start=${startDate}&end=${endDate}`;
    window.open(url, '_blank');
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
      >
        Export CSV ↓
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[#0D1E36] border border-white/10 rounded-xl shadow-xl p-4 space-y-3 z-10">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Department</label>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-full bg-[#0A1628] border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Date Range</label>
            <select
              value={range}
              onChange={(e) => setRange(Number(e.target.value))}
              className="w-full bg-[#0A1628] border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="w-full py-2 bg-[#00D4FF]/20 border border-[#00D4FF]/40 text-[#00D4FF] rounded-lg text-sm font-medium hover:bg-[#00D4FF]/30 transition-colors"
          >
            Download CSV
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### CEO Settings Page — `apps/ceo/app/settings/page.tsx`

```typescript
import { getCeoSettings } from '@/actions/ceo-settings.actions';
import { AlertThresholdForm } from './_components/AlertThresholdForm';
import { NotificationPrefsForm } from './_components/NotificationPrefsForm';

export const metadata = { title: 'CEO Settings — RainMachine CEO' };

export default async function CeoSettingsPage() {
  const settings = await getCeoSettings();

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-orbitron text-white">CEO Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Alert thresholds · Notification preferences
        </p>
      </div>

      <AlertThresholdForm settings={settings} />
      <NotificationPrefsForm settings={settings} />
    </div>
  );
}
```

### `AlertThresholdForm`

```typescript
// apps/ceo/app/settings/_components/AlertThresholdForm.tsx
'use client';

import { useState } from 'react';
import { saveCeoSettings } from '@/actions/ceo-settings.actions';
import type { CeoSettings } from '@rainmachine/db/types/ceo.types';

interface Props {
  settings: CeoSettings;
}

export function AlertThresholdForm({ settings }: Props) {
  const [cplPct, setCplPct] = useState(settings.cpl_threshold_pct);
  const [closeFloor, setCloseFloor] = useState(settings.close_rate_floor_pct);
  const [spendOver, setSpendOver] = useState(settings.spend_over_target_pct);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setResult(null);

    const res = await saveCeoSettings({
      cpl_threshold_pct: cplPct,
      close_rate_floor_pct: closeFloor,
      spend_over_target_pct: spendOver,
      notification_prefs: settings.notification_prefs,
    });

    setSaving(false);
    setResult({
      success: res.success,
      message: res.success ? 'Settings saved.' : (res as { success: false; error: string }).error,
    });
  }

  return (
    <div className="bg-[#0A1628] border border-white/10 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-white font-orbitron tracking-wider uppercase mb-6">
        Alert Thresholds
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <ThresholdField
          label="CPL Alert Threshold"
          description="Alert when CPL exceeds baseline by this percentage"
          value={cplPct}
          onChange={setCplPct}
          suffix="%"
          min={0}
          max={500}
          example="50 = alert at 1.5× baseline CPL"
        />
        <ThresholdField
          label="Close Rate Floor"
          description="Alert when 30-day close rate falls below this"
          value={closeFloor}
          onChange={setCloseFloor}
          suffix="%"
          min={0}
          max={100}
          example="10 = alert below 10% close rate"
        />
        <ThresholdField
          label="Spend Over Target"
          description="Alert when weekly ad spend exceeds budget by this percentage"
          value={spendOver}
          onChange={setSpendOver}
          suffix="%"
          min={0}
          max={500}
          example="20 = alert at 120% of budget"
        />

        {result && (
          <p className={`text-sm ${result.success ? 'text-[#00FF88]' : 'text-red-400'}`}>
            {result.message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-[#00D4FF]/20 border border-[#00D4FF]/40 text-[#00D4FF] rounded-lg text-sm font-medium hover:bg-[#00D4FF]/30 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Thresholds'}
        </button>
      </form>
    </div>
  );
}

function ThresholdField({
  label,
  description,
  value,
  onChange,
  suffix,
  min,
  max,
  example,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  suffix: string;
  min: number;
  max: number;
  example: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-white font-medium">{label}</label>
      <p className="text-xs text-gray-400">{description}</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={0.5}
          className="w-28 bg-[#050D1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00D4FF]/50"
        />
        <span className="text-sm text-gray-400">{suffix}</span>
        <span className="text-xs text-gray-600 italic">{example}</span>
      </div>
    </div>
  );
}
```

### `NotificationPrefsForm`

```typescript
// apps/ceo/app/settings/_components/NotificationPrefsForm.tsx
'use client';

import { useState } from 'react';
import { saveCeoSettings } from '@/actions/ceo-settings.actions';
import type { CeoSettings, CeoNotificationPrefs } from '@rainmachine/db/types/ceo.types';

const PREF_DEFINITIONS = [
  {
    key: 'weekly_summary_email' as keyof CeoNotificationPrefs,
    label: 'Weekly Summary Email',
    description: 'Receive the weekly intelligence report via email every Monday',
    comingSoon: false,
  },
  {
    key: 'critical_alert_email' as keyof CeoNotificationPrefs,
    label: 'Critical Alert Emails',
    description: 'Receive email notifications for critical severity alerts',
    comingSoon: false,
  },
  {
    key: 'critical_alert_sms' as keyof CeoNotificationPrefs,
    label: 'Critical Alert SMS',
    description: 'Receive SMS for critical severity alerts',
    comingSoon: true,
  },
  {
    key: 'agent_error_email' as keyof CeoNotificationPrefs,
    label: 'Agent Error Emails',
    description: 'Receive email when an AI agent run fails or produces errors',
    comingSoon: false,
  },
];

export function NotificationPrefsForm({ settings }: { settings: CeoSettings }) {
  const [prefs, setPrefs] = useState<CeoNotificationPrefs>(settings.notification_prefs);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleToggle(key: keyof CeoNotificationPrefs) {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    setSaved(false);

    await saveCeoSettings({
      cpl_threshold_pct: settings.cpl_threshold_pct,
      close_rate_floor_pct: settings.close_rate_floor_pct,
      spend_over_target_pct: settings.spend_over_target_pct,
      notification_prefs: updated,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-[#0A1628] border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-white font-orbitron tracking-wider uppercase">
          Notification Preferences
        </h2>
        {saving && <span className="text-xs text-gray-400">Saving...</span>}
        {saved && <span className="text-xs text-[#00FF88]">Saved ✓</span>}
      </div>
      <div className="space-y-4">
        {PREF_DEFINITIONS.map(({ key, label, description, comingSoon }) => (
          <div key={key} className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm text-white">{label}</p>
                {comingSoon && (
                  <span
                    title="Coming soon — SMS integration not yet available"
                    className="px-1.5 py-0.5 rounded text-xs bg-white/5 text-gray-500 border border-white/10 cursor-default"
                  >
                    Coming soon
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
            <button
              type="button"
              disabled={comingSoon}
              onClick={() => !comingSoon && handleToggle(key)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${
                comingSoon
                  ? 'opacity-40 cursor-not-allowed bg-white/10'
                  : prefs[key]
                  ? 'bg-[#00D4FF]'
                  : 'bg-white/10'
              }`}
              aria-checked={prefs[key]}
              role="switch"
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  prefs[key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 7. Integration Points

### F16/F17 → F20: Agent Logs Written by Agents
Every Edge Function (weekly-intelligence-agent, ad-ops-agent, growth-acquisition-agent, financial-intelligence-agent) writes to `agent_logs` after each run. F20 is a pure read layer on top of those writes.

### F13 → F20: Navigation Links
The CEO Command Center navigation (sidebar or top-nav) links to `/agent-logs` and `/settings`. These links are defined in the `apps/ceo` layout navigation config.

### F16 Ad Ops Agent → F20 Threshold Consumption
The ad-ops agent (F16) reads alert thresholds from the `ceo_settings` table (specifically `cpl_threshold_pct` and `spend_over_target_pct`) when generating rule-based alerts. F20 provides the UI to update those thresholds.

```typescript
// How F16 reads thresholds (already in F16, shown here for cross-reference):
const { data: ceoSettings } = await supabase
  .from('ceo_settings')
  .select('cpl_threshold_pct, spend_over_target_pct')
  .eq('singleton_key', 'ceo')
  .single();

const CPL_MULTIPLIER = 1 + ((ceoSettings?.cpl_threshold_pct ?? 50) / 100);
```

### F17 Growth Agent → F20 Threshold Consumption
The growth agent (F17) reads `close_rate_floor_pct` from `ceo_settings` to determine when to generate a CEO alert.

### CSV Export → API Route
`ExportButton` opens the `/api/agent-logs/export` GET route in a new tab. The response is `Content-Disposition: attachment` so the browser downloads the file rather than rendering it. No client-side file generation — all data processing happens server-side.

### Packages Used
- `@rainmachine/ui`: `KpiCard` (not used directly in F20 but available)
- `@rainmachine/db`: `CeoSettings`, `AgentLogRow`, `AgentLogCard`, `CeoSettingsFormSchema`
- `date-fns`: `formatDistanceToNow` in log panels
- No Recharts in F20

---

## 8. BDD Scenarios

```gherkin
Feature: CEO Agent Logs Page

  Scenario: Viewing agent logs for today
    Given I am authenticated as the CEO
    When I navigate to /agent-logs
    Then I see 4 department panels (Weekly Intel, Ad Ops, Growth, Finance)
    And the date selector defaults to today's date

  Scenario: Viewing logs for a specific date
    Given agent logs exist for 2026-04-01
    When I select 2026-04-01 from the date selector
    Then the URL changes to /agent-logs?date=2026-04-01
    And each panel shows the log for that date

  Scenario: Department with no log shows empty state
    Given the Finance agent did not run on 2026-04-01
    When I view logs for 2026-04-01
    Then the Finance Intelligence panel shows "No run found for 2026-04-01"

  Scenario: Error entries highlighted in panels
    Given the growth agent ran on 2026-04-02 with an error entry
    When I view logs for 2026-04-02
    Then the Growth Acquisition panel shows a red "Error" status badge
    And the error log entry is rendered in red

  Scenario: Expand button navigates to full log
    Given an agent log has 15 entries (preview shows 3)
    When I click "View full log →"
    Then I navigate to /agent-logs/[logId]
    And I see all 15 entries in the terminal-style viewer

  Scenario: CSV export triggers download
    Given I have selected date 2026-04-04
    When I click "Export CSV ↓"
    And I select "Growth Acquisition" and "Last 30 days"
    And I click "Download CSV"
    Then my browser downloads agent-logs-growth-2026-03-05-to-2026-04-04.csv
    And the file contains one row per log entry

Feature: CEO Settings Page

  Scenario: Viewing current thresholds
    Given I am authenticated as the CEO
    When I navigate to /settings
    Then I see the AlertThresholdForm with current values
    And I see the NotificationPrefsForm with toggle switches

  Scenario: Updating CPL threshold
    Given the CPL threshold is currently 50%
    When I change the value to 75
    And click "Save Thresholds"
    Then the ceo_settings row is updated with cpl_threshold_pct = 75
    And I see "Settings saved."

  Scenario: Invalid threshold rejected
    Given I enter -10 for CPL threshold
    When I click "Save Thresholds"
    Then Zod validation returns error "Must be ≥ 0"
    And the database is not updated

  Scenario: SMS toggle disabled with coming soon label
    Given I am on /settings
    When I view the "Critical Alert SMS" toggle
    Then the toggle is disabled
    And the "Coming soon" tooltip is visible
    And clicking the toggle does nothing

  Scenario: Notification pref toggle auto-saves
    Given weekly_summary_email is currently true
    When I click the "Weekly Summary Email" toggle
    Then the toggle moves to off
    And "Saving..." appears briefly
    Then "Saved ✓" appears
    And the ceo_settings row reflects weekly_summary_email = false

  Scenario: Non-CEO cannot access settings
    Given I am authenticated as an RM user (non-CEO)
    When a server action call is made to getCeoSettings
    Then the action throws "Unauthorized"
```

---

## 9. Test Plan

### Unit Tests

| Test | File | Assertion |
|------|------|-----------|
| `getAgentLogs` maps entries to `AgentLogCard` with preview_entries = first 3 | `__tests__/agent-logs.actions.test.ts` | Card with 10 entries → preview has 3, has_more=true |
| `getAgentLogs` sets has_more=false when ≤ 3 entries | `__tests__/agent-logs.actions.test.ts` | Card with 2 entries → has_more=false |
| `exportAgentLog` escapes quotes in message field | `__tests__/agent-logs.actions.test.ts` | Message with `"` → CSV wraps in quotes, inner quotes doubled |
| `exportAgentLog` returns header row | `__tests__/agent-logs.actions.test.ts` | First line = 'run_date,department,...' |
| `CeoSettingsFormSchema` rejects cpl_threshold_pct > 500 | `__tests__/ceo.types.test.ts` | safeParse returns error |
| `CeoSettingsFormSchema` rejects close_rate_floor_pct > 100 | `__tests__/ceo.types.test.ts` | safeParse returns error |
| `CeoSettingsFormSchema` accepts 0 values | `__tests__/ceo.types.test.ts` | All zeros = success |
| `saveCeoSettings` returns error message when Zod fails | `__tests__/ceo-settings.actions.test.ts` | Returns `{ success: false, error: '...' }` |
| `NotificationPrefsForm` toggles call saveCeoSettings | `__tests__/NotificationPrefsForm.test.tsx` | Click weekly_summary_email toggle → action called |
| `NotificationPrefsForm` SMS toggle is disabled | `__tests__/NotificationPrefsForm.test.tsx` | critical_alert_sms button has disabled attribute |

### Integration Tests

| Test | Description |
|------|-------------|
| `ceo_settings` singleton seed | After migration, exactly 1 row with singleton_key='ceo' |
| `saveCeoSettings` updates only the singleton row | UPDATE affects 1 row; no additional rows created |
| Non-CEO RLS on `ceo_settings` | RM user SELECT returns 0 rows |
| `agent_logs` CEO SELECT policy | Non-CEO gets 0 rows; CEO gets all rows |
| Export API rejects non-CEO | Returns 403 |
| Export API rejects invalid department | Returns 400 |
| Export API rejects malformed dates | Returns 400 |

### E2E Tests (Playwright)

```typescript
test('agent logs page shows 4 panels', async ({ page }) => {
  await page.goto('/agent-logs');
  await expect(page.getByText('Weekly Intelligence')).toBeVisible();
  await expect(page.getByText('Ad Operations')).toBeVisible();
  await expect(page.getByText('Growth Acquisition')).toBeVisible();
  await expect(page.getByText('Finance Intelligence')).toBeVisible();
});

test('full log sub-page renders all entries', async ({ page }) => {
  // Seed: insert agent_log with 10 entries
  await page.goto(`/agent-logs/${LOG_ID}`);
  const rows = page.locator('.font-mono > div');
  await expect(rows).toHaveCount(10);
});

test('CEO settings saves successfully', async ({ page }) => {
  await page.goto('/settings');
  const cplInput = page.getByLabel('CPL Alert Threshold').first();
  await cplInput.fill('75');
  await page.getByText('Save Thresholds').click();
  await expect(page.getByText('Settings saved.')).toBeVisible();
});

test('notification toggle auto-saves', async ({ page }) => {
  await page.goto('/settings');
  const toggle = page.getByRole('switch', { name: 'Weekly Summary Email' });
  await toggle.click();
  await expect(page.getByText('Saved ✓')).toBeVisible({ timeout: 3000 });
});

test('export dropdown triggers download', async ({ page }) => {
  await page.goto('/agent-logs');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByText('Export CSV ↓').click().then(async () => {
      await page.getByText('Download CSV').click();
    }),
  ]);
  expect(download.suggestedFilename()).toMatch(/^agent-logs-growth-/);
});
```

---

## 10. OWASP Security Checklist

| # | Threat | Mitigation |
|---|--------|-----------|
| A01 | Agent logs contain per-tenant data — non-CEO must not see | `agent_logs` RLS CEO-only policy; every server action calls `assertCeo()` |
| A01 | Export API route could be called by authenticated non-CEO | Route checks `user.app_metadata?.role !== 'ceo'` and returns 403 |
| A03 | CSV injection — log messages containing `=`, `+`, `-`, `@` could be interpreted as formulas in spreadsheet software | Messages with leading formula characters are not escaped in current implementation — **KNOWN LIMITATION**; recommend sanitizing with leading space or prefix in v2 |
| A03 | SQL injection via `department` query param in export route | Whitelisted against `validDepts` array before use; Supabase SDK parameterized query |
| A03 | SQL injection via `startDate`/`endDate` query params | Validated against `/^\d{4}-\d{2}-\d{2}$/` regex; Supabase SDK parameterizes the values |
| A05 | `ceo_settings` singleton seed creates row at migration time — could fail silently | `ON CONFLICT DO NOTHING` ensures idempotency; `single()` in `getCeoSettings` throws if 0 rows (surface migration failure in CI) |
| A07 | Settings form submits with manipulated values (e.g., cpl_threshold_pct=-1) | `CeoSettingsFormSchema` Zod validates min/max on server-side before DB write |
| A08 | Full log sub-page accessed with guessed `logId` UUIDs | CEO RLS on `agent_logs` ensures only CEO can read; non-CEO gets 0 rows → `notFound()` |
| A09 | Export of sensitive client data in CSV | Export is CEO-gated; CSV contains department/status/message — no PII beyond tenant_id UUID fragments |
| A10 | No outbound calls in F20 | Confirmed: F20 is pure read + CSV generation; no external HTTP calls |

---

## 11. Open Questions

| # | Question | Owner | Priority |
|---|----------|-------|----------|
| 1 | Should CSV export sanitize leading formula characters in log messages to prevent CSV injection in Excel? | Security | High |
| 2 | `ceo_settings.updated_by` stores the UUID of the CEO user. Is there always exactly one CEO user or could there be multiple CEO-role users? The singleton pattern assumes one settings row regardless of who edits it. | Product | Medium |
| 3 | The date selector shows all available dates from `getAvailableLogDates()` (up to 90). If there are gaps (days where no agents ran), those dates won't appear. Should we show a date-picker calendar instead to make gaps visible? | Product/UX | Low |
| 4 | `FullLogViewer` has a fixed `max-h-[600px]` with overflow scroll. Very large logs (100+ entries) will scroll fine, but should we add a "Load more" or virtual list for logs with 500+ entries? | Engineering | Low |
| 5 | The F16 ad-ops agent reads `cpl_threshold_pct` from `ceo_settings`. Should changes to thresholds take effect immediately (next agent run) or should there be a confirmation step to prevent accidental threshold changes triggering/suppressing alerts? | Product | Medium |

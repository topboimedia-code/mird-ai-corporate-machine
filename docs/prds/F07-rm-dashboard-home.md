# F07 — RainMachine Dashboard Home
# RainMachine · MIRD AI Corporate Machine
# Sigma Protocol Step 11 · PRD Generation
# Source Pitch: P07 · Cycle: 4 · Release: R1 · Appetite: Small
# Date: 2026-04-02 | Status: Ready for Implementation

---

## 1. Overview

### Pitch Summary

Marcus logs in and needs to know in 10 seconds: how many leads came in, how many appointments are set, how his AI is performing, and what needs attention. Right now he has to open GHL, scroll through pipelines, and mentally calculate. This PRD gives him a single screen — the RainMachine Dashboard Home — with live KPI cards, an activity feed, and an AI insights widget. The page is server-rendered with a Realtime subscription that updates KPI cards without a refresh. It's the first real screen Marcus sees after logging in.

### User-Facing Outcome

Marcus lands on his dashboard at 7am. Five KPI cards boot-count from 0 to their current values. The activity feed shows the last 20 events across leads, calls, and appointments. The AI Insights widget shows a one-paragraph excerpt from the latest weekly report with a "READ FULL REPORT →" link. The sidebar collapses to icons on smaller screens. If there's no data yet (new client), all three widgets show tasteful empty states with no JS errors.

### What This PRD Covers

- `apps/dashboard/app/dashboard/page.tsx` — RSC with KPI, activity feed, AI insights
- 5 KPI card components with Realtime wrapper
- `useCountUp` hook for boot-counter animation
- Sparkline component integration (7-day trend)
- Delta badge component (↑↓ vs yesterday)
- Activity feed (20 events, type icons, relative timestamps)
- AI insights widget (latest report excerpt)
- Collapsible sidebar layout
- Empty states for all 3 widgets
- Playwright E2E: KPI cards visible, Realtime fires, empty states

### What This PRD Does Not Cover

- Leads table (F08)
- Agents roster (F09)
- Campaigns table (F10)
- Settings (F11)
- Full weekly report viewer (F15)
- CEO dashboard (F13)

### Acceptance Summary

- All 5 KPI cards render with correct values from Supabase
- KPI cards count up from 0 on initial load (300ms animation)
- Inserting a `metrics` row triggers Realtime update to KPI values
- Activity feed shows 20 most recent events with correct icons
- AI insights widget shows excerpt from latest `reports` row
- All three widgets show empty states with no errors when no data exists
- Sidebar active route highlights the correct nav item

---

## 2. Database

### 2.1 No New Tables

All data is read from tables established in F03–F05: `metrics`, `leads`, `calls`, `appointments`, `reports`.

### 2.2 New View: `activity_feed`

To support the activity feed (which unions leads, calls, and appointments into a chronological event stream), we add a Supabase view.

```sql
-- supabase/migrations/0012_activity_view.sql

CREATE OR REPLACE VIEW activity_feed AS
  -- New lead
  SELECT
    l.id AS event_id,
    l.tenant_id,
    'lead_created' AS event_type,
    COALESCE(l.first_name || ' ' || l.last_name, l.phone) AS title,
    'New lead' AS subtitle,
    l.created_at AS occurred_at
  FROM leads l
  WHERE l.archived_at IS NULL

  UNION ALL

  -- Call completed
  SELECT
    c.id AS event_id,
    c.tenant_id,
    CASE
      WHEN c.outcome = 'appointment_set' THEN 'call_appointment'
      WHEN c.status = 'voicemail' THEN 'call_voicemail'
      ELSE 'call_completed'
    END AS event_type,
    COALESCE(
      (SELECT first_name || ' ' || last_name FROM leads WHERE id = c.lead_id),
      'Unknown lead'
    ) AS title,
    COALESCE(c.outcome, c.status) AS subtitle,
    c.ended_at AS occurred_at
  FROM calls c
  WHERE c.status IN ('completed', 'voicemail', 'failed')
    AND c.ended_at IS NOT NULL

  UNION ALL

  -- Appointment event
  SELECT
    a.id AS event_id,
    a.tenant_id,
    CASE
      WHEN a.status = 'held' THEN 'appointment_held'
      WHEN a.status = 'no_show' THEN 'appointment_noshow'
      WHEN a.status = 'cancelled' THEN 'appointment_cancelled'
      ELSE 'appointment_scheduled'
    END AS event_type,
    COALESCE(
      (SELECT first_name || ' ' || last_name FROM leads WHERE id = a.lead_id),
      'Unknown lead'
    ) AS title,
    a.status AS subtitle,
    a.scheduled_at AS occurred_at
  FROM appointments a;

-- RLS on view: inherit from base tables (view is SECURITY INVOKER by default)
-- Users can only see events for their tenant via leads/calls/appointments RLS
```

---

## 3. TypeScript Interfaces

### 3.1 Dashboard Data Types

```typescript
// apps/dashboard/src/types/dashboard.types.ts

export interface KpiCard {
  id: string;
  label: string;           // "LEADS TODAY"
  value: number;
  previousValue: number;   // yesterday's value for delta calculation
  trend: number[];         // 7 data points for sparkline (oldest → newest)
  format?: "number" | "percent" | "currency";
  unit?: string;           // "%" or "$"
}

export interface KpiDelta {
  direction: "up" | "down" | "flat";
  percentChange: number;   // e.g. 25 = +25%
  label: string;           // "vs yesterday"
}

export type ActivityEventType =
  | "lead_created"
  | "call_completed"
  | "call_appointment"
  | "call_voicemail"
  | "appointment_scheduled"
  | "appointment_held"
  | "appointment_noshow"
  | "appointment_cancelled";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  title: string;
  subtitle: string;
  occurredAt: string;       // ISO string
  relativeTime: string;     // "2h ago", "just now"
}

export interface AiInsightsData {
  reportId: string;
  weekStart: string;
  excerpt: string;          // First 400 chars of executive_summary
  hasFullReport: boolean;
}

export interface DashboardPageData {
  kpis: KpiCard[];
  activity: ActivityEvent[];
  aiInsights: AiInsightsData | null;
  tenantId: string;
}
```

### 3.2 Hooks

```typescript
// apps/dashboard/src/hooks/useCountUp.ts
export interface UseCountUpOptions {
  target: number;
  duration?: number;       // ms; default 600
  easing?: "linear" | "easeOut";
  startFrom?: number;      // default 0
}

export function useCountUp(options: UseCountUpOptions): number;
// Returns current animated value, updates on animation frame
// Resets when `target` changes

// apps/dashboard/src/hooks/useMetricsRealtime.ts
export function useMetricsRealtime(
  tenantId: string,
  onUpdate: (metrics: Partial<import("@rainmachine/db").Metrics>) => void,
): { isConnected: boolean };
// Sets up Supabase Realtime subscription on metrics table
// Calls onUpdate on each INSERT or UPDATE event
// Returns connection status for debugging
```

---

## 4. Server Actions

No user-initiated server actions on the dashboard home page. All data is read-only (RSC queries). The KPI update comes via Realtime (client-side subscription), not via server actions.

---

## 5. API Routes

No new API routes in F07. Data is loaded via Supabase client in RSC. Realtime is handled client-side.

---

## 6. UI Components

### 6.1 Dashboard Page Layout

**File:** `apps/dashboard/app/dashboard/page.tsx`

```typescript
// apps/dashboard/app/dashboard/page.tsx
import { Suspense } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@rainmachine/db";
import { KpiSection } from "./_components/KpiSection";
import { ActivityFeed } from "./_components/ActivityFeed";
import { AiInsightsWidget } from "./_components/AiInsightsWidget";
import { Skeleton } from "@rainmachine/ui";
import type { DashboardPageData } from "@/types/dashboard.types";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  const tenantId = (user?.user_metadata as { tenant_id?: string })?.tenant_id!;

  const today = new Date().toISOString().split("T")[0]!;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]!;
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]!;

  // Fetch today + yesterday metrics (for delta calculation)
  const { data: metricsRows } = await supabase
    .from("metrics")
    .select("date, leads_total, appointments_set, calls_total, calls_connected, close_rate")
    .eq("tenant_id", tenantId)
    .gte("date", sevenDaysAgo)
    .order("date", { ascending: false });

  // Fetch activity feed (last 20 events)
  const { data: activityRows } = await supabase
    .from("activity_feed")
    .select("event_id, event_type, title, subtitle, occurred_at")
    .eq("tenant_id", tenantId)
    .order("occurred_at", { ascending: false })
    .limit(20);

  // Fetch latest AI report
  const { data: latestReport } = await supabase
    .from("reports")
    .select("id, week_start, content")
    .eq("tenant_id", tenantId)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  const pageData = buildDashboardData(
    tenantId,
    metricsRows ?? [],
    activityRows ?? [],
    latestReport,
    today,
    yesterday,
  );

  return (
    <div
      data-testid="dashboard-home"
      className="p-6 space-y-6"
    >
      {/* KPI Cards — Client Component for Realtime */}
      <Suspense fallback={<KpiSectionSkeleton />}>
        <KpiSection
          initialKpis={pageData.kpis}
          tenantId={tenantId}
        />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed — 2/3 width */}
        <div className="lg:col-span-2">
          <Suspense fallback={<Skeleton variant="rect" height={400} />}>
            <ActivityFeed
              events={pageData.activity}
              tenantId={tenantId}
            />
          </Suspense>
        </div>

        {/* AI Insights — 1/3 width */}
        <div className="lg:col-span-1">
          <AiInsightsWidget data={pageData.aiInsights} />
        </div>
      </div>
    </div>
  );
}

function KpiSectionSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} variant="rect" height={120} />
      ))}
    </div>
  );
}
```

### 6.2 KPI Section (Client Component — Realtime)

**File:** `apps/dashboard/app/dashboard/_components/KpiSection.tsx`

```typescript
"use client";

import { useState } from "react";
import { KpiCard } from "./KpiCard";
import { useMetricsRealtime } from "@/hooks/useMetricsRealtime";
import type { KpiCard as KpiCardType } from "@/types/dashboard.types";

interface Props {
  initialKpis: KpiCardType[];
  tenantId: string;
}

export function KpiSection({ initialKpis, tenantId }: Props) {
  const [kpis, setKpis] = useState(initialKpis);

  useMetricsRealtime(tenantId, (updated) => {
    setKpis((prev) =>
      prev.map((kpi) => {
        // Map metrics fields to KPI cards
        if (kpi.id === "leads_total" && updated.leads_total !== undefined) {
          return { ...kpi, value: updated.leads_total };
        }
        if (kpi.id === "appointments_set" && updated.appointments_set !== undefined) {
          return { ...kpi, value: updated.appointments_set };
        }
        // ... etc
        return kpi;
      }),
    );
  });

  return (
    <div
      data-testid="kpi-section"
      className="grid grid-cols-2 lg:grid-cols-5 gap-4"
    >
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
```

### 6.3 KPI Card Component

**File:** `apps/dashboard/app/dashboard/_components/KpiCard.tsx`

```typescript
"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { Sparkline, Badge } from "@rainmachine/ui";
import type { KpiCard as KpiCardType, KpiDelta } from "@/types/dashboard.types";

interface Props {
  kpi: KpiCardType;
}

export function KpiCard({ kpi }: Props) {
  const animatedValue = useCountUp({ target: kpi.value, duration: 600 });
  const delta = calculateDelta(kpi.value, kpi.previousValue);

  const formattedValue = formatKpiValue(animatedValue, kpi.format, kpi.unit);

  return (
    <div
      data-testid={`kpi-card-${kpi.id}`}
      className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-3"
    >
      <p className="font-mono text-text-muted text-[10px] uppercase tracking-[0.2em]">
        {kpi.label}
      </p>
      <div className="flex items-end justify-between">
        <span
          data-testid={`kpi-value-${kpi.id}`}
          className="font-display text-cyan text-3xl font-bold leading-none"
        >
          {formattedValue}
        </span>
        <Sparkline
          data={kpi.trend}
          width={48}
          height={24}
          color="#00D4FF"
        />
      </div>
      <DeltaBadge delta={delta} />
    </div>
  );
}

function DeltaBadge({ delta }: { delta: KpiDelta }) {
  if (delta.direction === "flat") {
    return <span className="text-text-dim text-xs">No change</span>;
  }
  return (
    <div className="flex items-center gap-1">
      <Badge
        color={delta.direction === "up" ? "green" : "red"}
        size="sm"
        variant="subtle"
      >
        {delta.direction === "up" ? "↑" : "↓"} {delta.percentChange}%
      </Badge>
      <span className="text-text-dim text-[11px]">vs yesterday</span>
    </div>
  );
}

function calculateDelta(current: number, previous: number): KpiDelta {
  if (previous === 0 && current === 0) {
    return { direction: "flat", percentChange: 0, label: "vs yesterday" };
  }
  if (previous === 0) {
    return { direction: "up", percentChange: 100, label: "vs yesterday" };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
    percentChange: Math.abs(Math.round(change)),
    label: "vs yesterday",
  };
}

function formatKpiValue(
  value: number,
  format?: string,
  unit?: string,
): string {
  if (format === "percent") return `${Math.round(value * 100)}%`;
  if (format === "currency") return `$${value.toLocaleString()}`;
  return value.toLocaleString();
}
```

**5 KPI Cards configuration:**

| ID | Label | Metric Field | Format |
|---|---|---|---|
| `leads_total` | LEADS TODAY | `metrics.leads_total` | number |
| `appointments_set` | APPTS SET | `metrics.appointments_set` | number |
| `calls_total` | AI CALLS | `metrics.calls_total` | number |
| `close_rate` | CLOSE RATE | `metrics.close_rate` | percent |
| `appointments_held` | APPTS HELD | `metrics.appointments_held` | number |

### 6.4 Activity Feed Component

**File:** `apps/dashboard/app/dashboard/_components/ActivityFeed.tsx`

```typescript
import { Card, EmptyState } from "@rainmachine/ui";
import type { ActivityEvent, ActivityEventType } from "@/types/dashboard.types";

const EVENT_ICONS: Record<ActivityEventType, string> = {
  lead_created: "👤",       // replaced with SVG icons in F07 implementation
  call_completed: "📞",
  call_appointment: "📅",
  call_voicemail: "📮",
  appointment_scheduled: "📅",
  appointment_held: "✅",
  appointment_noshow: "❌",
  appointment_cancelled: "🚫",
};

const EVENT_COLORS: Record<ActivityEventType, string> = {
  lead_created: "text-cyan",
  call_completed: "text-text-muted",
  call_appointment: "text-green",
  call_voicemail: "text-text-dim",
  appointment_scheduled: "text-cyan",
  appointment_held: "text-green",
  appointment_noshow: "text-orange",
  appointment_cancelled: "text-red",
};

interface Props {
  events: ActivityEvent[];
  tenantId: string;
}

export function ActivityFeed({ events }: Props) {
  return (
    <Card variant="default" padding="none" data-testid="activity-feed">
      <div className="p-5 border-b border-border">
        <h2 className="font-mono text-text-muted text-[10px] uppercase tracking-[0.2em]">
          Activity Feed
        </h2>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Events will appear here as leads come in and calls are made."
          data-testid="activity-feed-empty"
        />
      ) : (
        <div className="divide-y divide-border">
          {events.map((event) => (
            <ActivityRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </Card>
  );
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  return (
    <div
      data-testid="activity-row"
      className="flex items-center gap-3 px-5 py-3 hover:bg-surface-hover transition-colors"
    >
      <span className={`text-base ${EVENT_COLORS[event.type]}`}>
        {EVENT_ICONS[event.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-text text-sm truncate">{event.title}</p>
        <p className="text-text-muted text-xs capitalize">
          {event.subtitle.replace(/_/g, " ")}
        </p>
      </div>
      <span className="text-text-dim text-xs flex-shrink-0">
        {event.relativeTime}
      </span>
    </div>
  );
}
```

### 6.5 AI Insights Widget

**File:** `apps/dashboard/app/dashboard/_components/AiInsightsWidget.tsx`

```typescript
import Link from "next/link";
import { Card, EmptyState } from "@rainmachine/ui";
import type { AiInsightsData } from "@/types/dashboard.types";

interface Props {
  data: AiInsightsData | null;
}

export function AiInsightsWidget({ data }: Props) {
  return (
    <Card variant="glow" padding="md" data-testid="ai-insights-widget">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-cyan animate-pulse-slow" />
        <h2 className="font-mono text-text-muted text-[10px] uppercase tracking-[0.2em]">
          AI Intelligence
        </h2>
      </div>

      {!data ? (
        <EmptyState
          title="First report incoming"
          description="Your weekly AI intelligence report generates every Monday at 6:15am."
          data-testid="ai-insights-empty"
        />
      ) : (
        <>
          <p className="text-text-muted text-[10px] font-mono uppercase tracking-wider mb-3">
            Week of {new Date(data.weekStart).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
          <p
            data-testid="ai-insights-excerpt"
            className="text-text text-sm leading-relaxed line-clamp-6"
          >
            {data.excerpt}
          </p>
          <Link
            href="/dashboard/reports"
            className="mt-4 flex items-center gap-1 text-cyan text-xs font-mono uppercase tracking-wider hover:text-cyan/80 transition-colors"
          >
            READ FULL REPORT →
          </Link>
        </>
      )}
    </Card>
  );
}
```

### 6.6 Sidebar Layout

**File:** `apps/dashboard/app/dashboard/layout.tsx`

```typescript
import { Sidebar } from "@rainmachine/ui";
import type { NavItem } from "@rainmachine/ui";
import { headers } from "next/headers";

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Dashboard", href: "/dashboard", icon: null },
  { id: "leads", label: "Leads", href: "/dashboard/leads", icon: null },
  { id: "agents", label: "Agents", href: "/dashboard/agents", icon: null },
  { id: "campaigns", label: "Campaigns", href: "/dashboard/campaigns", icon: null },
  { id: "reports", label: "Reports", href: "/dashboard/reports", icon: null },
  { id: "settings", label: "Settings", href: "/dashboard/settings", icon: null },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current pathname for active state (server-side)
  const headersList = headers();
  const pathname = headersList.get("x-current-path") ?? "/dashboard";

  return (
    <div className="flex h-screen bg-background">
      <SidebarWrapper items={NAV_ITEMS} activeHref={pathname} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
```

**Note on active route detection:** Next.js App Router doesn't easily expose `pathname` in server layouts. Use a `SidebarWrapper` client component that reads `usePathname()`:

```typescript
// apps/dashboard/app/dashboard/_components/SidebarWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@rainmachine/ui";
import type { NavItem } from "@rainmachine/ui";

interface Props {
  items: NavItem[];
  activeHref: string;
}

export function SidebarWrapper({ items }: Pick<Props, "items">) {
  const pathname = usePathname();
  return <Sidebar items={items} activeHref={pathname} />;
}
```

### 6.7 `useCountUp` Hook Implementation

```typescript
// apps/dashboard/src/hooks/useCountUp.ts
"use client";

import { useState, useEffect, useRef } from "react";

export function useCountUp({
  target,
  duration = 600,
  startFrom = 0,
}: {
  target: number;
  duration?: number;
  startFrom?: number;
}): number {
  const [current, setCurrent] = useState(startFrom);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevTargetRef = useRef(startFrom);

  useEffect(() => {
    const from = prevTargetRef.current;
    prevTargetRef.current = target;
    startRef.current = null;

    if (from === target) return;

    function step(timestamp: number) {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(from + (target - from) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return current;
}
```

### 6.8 `useMetricsRealtime` Hook

```typescript
// apps/dashboard/src/hooks/useMetricsRealtime.ts
"use client";

import { useEffect, useState } from "react";
import { createBrowserClient, subscribeToMetrics } from "@rainmachine/db";
import type { Metrics } from "@rainmachine/db";

export function useMetricsRealtime(
  tenantId: string,
  onUpdate: (metrics: Partial<Metrics>) => void,
): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = createBrowserClient();
    const { channel, unsubscribe } = subscribeToMetrics(
      client,
      tenantId,
      (payload) => {
        onUpdate(payload.new);
        setIsConnected(true);
      },
    );

    channel.on("system", {}, (status: { status: string }) => {
      setIsConnected(status.status === "SUBSCRIBED");
    });

    return () => unsubscribe();
  }, [tenantId, onUpdate]);

  return { isConnected };
}
```

---

## 7. Integration Points

### 7.1 Supabase Realtime

**Tables subscribed:** `metrics` (per-tenant channel, established in F04)

**Client:** `createBrowserClient()` from `@rainmachine/db`

**Channel:** `metrics:{tenantId}` — filters to current tenant only

**Subscription lifecycle:** Created on `KpiSection` mount, destroyed on unmount. One subscription per page load.

### 7.2 Supabase Database (RSC Queries)

| Query | Table | Purpose |
|---|---|---|
| KPI data | `metrics` | Today + yesterday + 7-day trend |
| Activity feed | `activity_feed` (view) | Last 20 events |
| AI insights | `reports` | Latest report excerpt |

All queries use `createServerClient(cookieStore)` — server-side, RLS-scoped to tenant.

### 7.3 No External APIs in F07

The dashboard home reads only from Supabase. No calls to GHL, Retell, or Claude in this cycle.

---

## 8. BDD Scenarios

### Scenario 1: KPI Cards Load With Correct Values

```
Given Marcus is logged in and his tenant has a metrics row for today
When he navigates to /dashboard
Then 5 KPI cards are visible
And each card shows the correct value from today's metrics row
And the Sparkline shows the 7-day trend correctly
```

### Scenario 2: KPI Count-Up Animation

```
Given Marcus navigates to /dashboard
When the page loads
Then each KPI value animates from 0 to its target value
And the animation completes within 600ms
And the final value is correct
```

### Scenario 3: Realtime KPI Update

```
Given Marcus is viewing the dashboard
And the KpiSection is subscribed to the metrics Realtime channel
When a metrics row is inserted or updated in Supabase for his tenant
Then the KPI card values update within 2 seconds
And no page refresh occurs
And the count-up animation re-fires from the previous value to the new value
```

### Scenario 4: Activity Feed Shows Events

```
Given Marcus's tenant has 5 leads, 3 calls, and 2 appointments
When he views the dashboard
Then the activity feed shows up to 20 events ordered by occurred_at DESC
And each row shows the lead name, event type, and relative time
And "call_appointment" events show a green icon
And "appointment_noshow" events show an orange icon
```

### Scenario 5: AI Insights Shows Report Excerpt

```
Given a reports row exists for Marcus's tenant
When he views the dashboard
Then the AI Insights widget shows the week start date
And shows the first ~400 characters of the executive_summary
And shows a "READ FULL REPORT →" link pointing to /dashboard/reports
```

### Scenario 6: Empty States — No Data

```
Given Marcus is a brand new client with no data in any table
When he views the dashboard
Then all 5 KPI cards show "0" values
And the activity feed shows "No activity yet" empty state
And the AI Insights widget shows "First report incoming" empty state
And there are no JavaScript errors in the console
```

### Scenario 7: Sidebar Active Route

```
Given Marcus is on /dashboard
When the sidebar renders
Then the "Dashboard" nav item is highlighted in cyan
And all other nav items are in the default muted state
When Marcus clicks "Leads" in the sidebar
Then the sidebar navigates to /dashboard/leads
And "Leads" becomes the highlighted item
```

### Scenario 8: Sidebar Collapse

```
Given the sidebar is in expanded state (240px)
When Marcus clicks the collapse toggle
Then the sidebar shrinks to 60px
And nav item labels are hidden
And nav item icons remain visible and centered
And the collapse state persists across page navigations within the dashboard
```

### Scenario 9: Metrics Null Handling

```
Given today's metrics row does not exist (no rollup has run yet)
When the page data is built
Then KPI values default to 0
And sparkline trends default to empty arrays (no error)
And delta badges show "No change"
And no runtime error is thrown
```

### Scenario 10: Report Excerpt Truncation

```
Given a report with executive_summary longer than 400 characters
When the AI Insights widget renders the excerpt
Then the text is truncated at ~400 characters
And the full text is not shown (use line-clamp CSS)
And the "READ FULL REPORT →" link is always visible
```

---

## 9. Test Plan

### 9.1 Component Tests (Vitest + RTL)

```typescript
// apps/dashboard/src/hooks/__tests__/useCountUp.test.ts
describe("useCountUp", () => {
  it("starts at 0 and reaches target", async () => { /* ... */ });
  it("re-animates when target changes", async () => { /* ... */ });
  it("handles target = 0 without NaN", () => { /* ... */ });
});

// apps/dashboard/app/dashboard/_components/__tests__/KpiCard.test.tsx
describe("KpiCard", () => {
  it("renders label and value", () => { /* ... */ });
  it("shows green delta badge for increase", () => { /* ... */ });
  it("shows red delta badge for decrease", () => { /* ... */ });
  it("shows 'No change' for flat delta", () => { /* ... */ });
});

// apps/dashboard/app/dashboard/_components/__tests__/ActivityFeed.test.tsx
describe("ActivityFeed", () => {
  it("renders empty state when events is empty", () => { /* ... */ });
  it("renders N event rows when N events provided", () => { /* ... */ });
  it("shows relative time string in each row", () => { /* ... */ });
});

// apps/dashboard/app/dashboard/_components/__tests__/AiInsightsWidget.test.tsx
describe("AiInsightsWidget", () => {
  it("renders empty state when data is null", () => { /* ... */ });
  it("renders excerpt and report link when data provided", () => { /* ... */ });
  it("report link href points to /dashboard/reports", () => { /* ... */ });
});
```

### 9.2 E2E Tests (Playwright)

```typescript
// apps/dashboard/e2e/dashboard-home.spec.ts
import { test, expect } from "@playwright/test";

test.describe("F07 — Dashboard Home", () => {
  test.beforeEach(async ({ page }) => {
    // Auth helper: set session cookies for test tenant
    await page.goto("/dashboard");
  });

  test("KPI cards are visible", async ({ page }) => {
    await expect(page.getByTestId("kpi-section")).toBeVisible();
    for (const id of ["leads_total", "appointments_set", "calls_total", "close_rate", "appointments_held"]) {
      await expect(page.getByTestId(`kpi-card-${id}`)).toBeVisible();
    }
  });

  test("activity feed renders or shows empty state", async ({ page }) => {
    const feed = page.getByTestId("activity-feed");
    await expect(feed).toBeVisible();
    const rows = page.getByTestId("activity-row");
    const empty = page.getByTestId("activity-feed-empty");
    await expect(rows.or(empty).first()).toBeVisible();
  });

  test("AI insights widget renders or shows empty state", async ({ page }) => {
    const widget = page.getByTestId("ai-insights-widget");
    await expect(widget).toBeVisible();
    await expect(
      page.getByTestId("ai-insights-excerpt").or(page.getByTestId("ai-insights-empty"))
    ).toBeVisible();
  });

  test("Realtime fires on metrics INSERT", async ({ page }) => {
    await page.goto("/dashboard");
    const initialValue = await page
      .getByTestId("kpi-value-leads_total")
      .textContent();

    // Trigger metrics upsert via test API
    await page.request.post("/api/test/trigger-metrics-upsert");

    // Wait for Realtime update (max 2s)
    await page.waitForFunction(
      (initial) => {
        const el = document.querySelector('[data-testid="kpi-value-leads_total"]');
        return el?.textContent !== initial;
      },
      initialValue,
      { timeout: 2000 },
    );
  });

  test("no console errors on page load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    expect(errors).toHaveLength(0);
  });
});
```

### 9.3 Data Builder Function Tests

```typescript
// apps/dashboard/src/utils/__tests__/buildDashboardData.test.ts
describe("buildDashboardData", () => {
  it("returns 5 KPI cards", () => { /* ... */ });
  it("builds 7-day trend array from metrics rows", () => { /* ... */ });
  it("calculates delta correctly for increase", () => { /* ... */ });
  it("handles null metricsRows gracefully", () => { /* ... */ });
  it("builds activity events from activityRows", () => { /* ... */ });
  it("formats relative time correctly", () => { /* ... */ });
  it("returns null aiInsights when no reports", () => { /* ... */ });
  it("truncates excerpt to 400 chars", () => { /* ... */ });
});
```

---

## 10. OWASP Security Checklist

### 10.1 Data Access Control (A01)

- [ ] **RLS enforced** — All Supabase queries use `createServerClient(cookieStore)` (not service role). RLS policies in F03 ensure Marcus only sees his tenant's data. The `activity_feed` view is `SECURITY INVOKER` — it inherits the session's RLS context.
- [ ] **No tenant_id from URL** — tenant_id is read from the JWT claims (`user.user_metadata.tenant_id`), not from URL params or request body. A malicious user cannot spoof another tenant's data by changing a URL parameter.

### 10.2 XSS Prevention (A03)

- [ ] **Activity feed — title/subtitle fields** — These come from `leads.first_name/last_name` (GHL-synced). Rendered as text content (no `dangerouslySetInnerHTML`). React escapes automatically.
- [ ] **Report excerpt** — `reports.content` is JSON. The `executive_summary` string is rendered as text, not HTML. No markdown parsing in F07 (plain text only).
- [ ] **Event icons** — Currently emoji strings. When replaced with SVG icons in implementation, ensure SVGs are imported as static assets (not fetched from untrusted URLs).

### 10.3 Realtime Security

- [ ] **Per-tenant channel** — Channel name `metrics:{tenantId}` ensures one tenant cannot subscribe to another's updates. Supabase Realtime enforces RLS on change payloads — only rows passing RLS are broadcast to the subscriber.
- [ ] **Browser client key** — `createBrowserClient()` uses the anon key (public). The anon key combined with RLS is the intended security model. Never use the service role key in browser code.

### 10.4 Performance as a Security Property

- [ ] **Query limits** — All RSC queries have explicit `.limit()` calls (activity feed: 20, metrics: 7 days, reports: 1). No unbounded queries that could cause timeout DoS on large datasets.
- [ ] **Realtime connection** — One channel per client. No accumulation of channels on re-renders (hook cleanup function removes channel on unmount).

---

## 11. Open Questions

### OQ-01 — `pathname` Detection in Server Layout for Active Sidebar Item

**Question:** The `SidebarWrapper` client component uses `usePathname()` to set the active nav item. Is there a better pattern that avoids a client component for this purpose?

**Current solution:** `SidebarWrapper` is a minimal client component that wraps the `Sidebar` UI component. This is the standard Next.js App Router pattern for reading `pathname` in a layout.

**Alternative:** Pass `activeHref` from the server layout via a Next.js middleware header (`x-current-path`). More complex, no real benefit.

**Recommendation:** Keep `SidebarWrapper` as a client component. This is idiomatic Next.js 15.

**Decision gate:** F07 implementation.

---

### OQ-02 — Relative Time Formatting: `date-fns` or Custom?

**Question:** Relative time strings ("2h ago", "just now") — use `date-fns/formatDistanceToNow` or a custom function?

**Options:**
- A: `date-fns` — comprehensive, well-tested, adds ~10kB to bundle
- B: Custom function — 10 lines, no dep

**Recommendation:** Option B — custom function. The use case is simple (< 1min = "just now", < 1h = "Xm ago", < 24h = "Xh ago", else date). No need for `date-fns` in F07.

**Decision gate:** F07 implementation.

---

### OQ-03 — `activity_feed` View: Include Only Today's Events or All-Time?

**Question:** The activity feed view unions all historical events. With 1,000 leads, this could be a slow query even with LIMIT 20.

**Recommendation:** Add a `WHERE occurred_at > NOW() - INTERVAL '30 days'` filter to the view definition. The index on `leads.created_at`, `calls.ended_at`, and `appointments.scheduled_at` makes this fast.

**Decision gate:** F07 implementation. Add the filter and verify query plan with EXPLAIN ANALYZE.

---

*PRD F07 — RainMachine Dashboard Home*
*Sigma Protocol Step 11 · MIRD AI Corporate Machine*
*Written: 2026-04-02 · Cycle 4 · Release 1*
*Depends on: F03 (auth + DB), F04 (metrics data must exist)*
*Unlocks: F08, F09, F10 (sidebar nav shared)*

# F04 — GHL ↔ Supabase Data Sync & Realtime
# RainMachine · MIRD AI Corporate Machine
# Sigma Protocol Step 11 · PRD Generation
# Source Pitch: P04 · Cycle: 2 · Release: R0 · Appetite: Medium
# Date: 2026-04-02 | Status: Ready for Implementation

---

## 1. Overview

### Pitch Summary

GoHighLevel (GHL) is the operational CRM where leads are captured, appointments are tracked, and Marcus's team works daily. Supabase is where RainMachine's intelligence lives. Right now they're two separate islands. This PRD builds the bridge: an n8n workflow that continuously syncs GHL data into Supabase, a Supabase Realtime subscription that pushes live metrics updates to the dashboard, and a CEO alert if the sync starts failing. When this cycle is done, every new lead or appointment in GHL appears in Supabase within 30 seconds — and the dashboard counter updates without a page refresh.

### User-Facing Outcome

Marcus refreshes nothing. When a new lead comes in through a Meta Ad, it appears in his `metrics` KPI card within 30 seconds. When an appointment is booked in GHL, the appointment counter increments in real time. Shomari sees a CEO alert if the sync pipeline goes silent or starts throwing errors.

### What This PRD Covers

- n8n workflow `ghl-to-supabase-sync`: GHL webhook → Supabase upsert for leads + appointments
- Daily rollup to `metrics` table (n8n scheduled step)
- `sync_errors` table: error branch in n8n writes failure records
- CEO alert generation: if `sync_errors.count > 3` in 1 hour → insert alert
- Supabase Realtime: channel-per-tenant on `metrics` table
- Stub dashboard page `apps/dashboard/app/dashboard/sync-test/page.tsx` with realtime counter
- n8n error webhook handler: Next.js API route `/api/webhooks/n8n-error`
- Integration tests: GHL webhook → lead in DB within 30s, duplicate idempotency, Realtime fires within 2s

### What This PRD Does Not Cover

- Ad metrics sync (Meta/Google APIs) — that belongs to F10 (Campaigns)
- Retell AI call data sync — that's F05
- n8n self-hosting or infrastructure — n8n Cloud is assumed (see Section 7)

### Acceptance Summary

- A simulated GHL contact webhook lands a lead row in Supabase within 30 seconds
- Sending the same webhook twice does NOT create a duplicate lead (idempotency via `ghl_contact_id`)
- A simulated appointment webhook upserts an appointment row linked to the correct lead
- After 4 `sync_error` rows within 60 minutes, an `alerts` row appears in Supabase
- The `/dashboard/sync-test` page shows a counter that increments when a `metrics` row is inserted (Realtime)
- Realtime fires within 2 seconds of the database write

---

## 2. Database

### 2.1 New Tables

#### `sync_errors`

```sql
-- supabase/migrations/0004_sync_errors.sql

CREATE TYPE sync_error_type AS ENUM (
  'webhook_parse_error',
  'lead_upsert_error',
  'appointment_upsert_error',
  'metrics_rollup_error',
  'unknown'
);

CREATE TABLE sync_errors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  error_type      sync_error_type NOT NULL DEFAULT 'unknown',
  workflow_name   TEXT NOT NULL,
  payload         JSONB,           -- the GHL webhook payload that caused the error
  error_message   TEXT NOT NULL,
  n8n_execution_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_errors_tenant_created ON sync_errors(tenant_id, created_at DESC);
CREATE INDEX idx_sync_errors_recent ON sync_errors(created_at DESC)
  WHERE created_at > NOW() - INTERVAL '1 hour';
```

#### `campaign_sync_log` (scaffolded here, used in F10)

```sql
-- Added here because F04's daily rollup triggers the need for this table stub
-- Full use in F10 (Campaigns)

CREATE TABLE campaign_sync_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('scheduled', 'manual')),
  status      TEXT NOT NULL CHECK (status IN ('running', 'success', 'error')),
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);
```

### 2.2 RLS Policies

```sql
-- supabase/migrations/0005_sync_rls.sql

ALTER TABLE sync_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sync_log ENABLE ROW LEVEL SECURITY;

-- sync_errors: CEO read only (RM users cannot see error details)
CREATE POLICY "sync_errors_ceo_only" ON sync_errors
  FOR SELECT USING (auth.is_ceo());

-- Service role writes sync_errors (n8n error webhook)
-- No INSERT policy needed for anon/authenticated — only service role inserts

-- campaign_sync_log: own tenant + CEO
CREATE POLICY "campaign_sync_log_own_tenant" ON campaign_sync_log
  FOR SELECT USING (tenant_id = auth.tenant_id() OR auth.is_ceo());

CREATE POLICY "campaign_sync_log_insert" ON campaign_sync_log
  FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());
```

### 2.3 Realtime Configuration

```sql
-- supabase/migrations/0006_realtime.sql
-- metrics and alerts already added in 0001_initial_schema.sql
-- sync_errors added here for CEO dashboard real-time alert feed

ALTER PUBLICATION supabase_realtime ADD TABLE sync_errors;
```

---

## 3. TypeScript Interfaces

### 3.1 GHL Webhook Payloads

GHL sends webhooks in a proprietary format. These types model the payloads we receive and must handle.

```typescript
// packages/db/src/types/ghl.types.ts

/**
 * GHL Contact webhook — fires on contact.create and contact.update
 * Field names are GHL's native format (snake_case with GHL prefixes).
 */
export interface GhlContactWebhook {
  type: "ContactCreate" | "ContactUpdate" | "ContactDelete";
  locationId: string;          // GHL sub-account ID = tenant's ghl_sub_account_id
  contact: {
    id: string;                // ghl_contact_id (our idempotency key)
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    tags?: string[];
    customFields?: Array<{
      id: string;
      value: string | null;
    }>;
    source?: string;
    createdAt?: string;        // ISO 8601
    updatedAt?: string;
  };
}

/**
 * GHL Appointment webhook — fires on appointment.create and appointment.update
 */
export interface GhlAppointmentWebhook {
  type: "AppointmentCreate" | "AppointmentUpdate" | "AppointmentDelete";
  locationId: string;
  appointment: {
    id: string;                // ghl_appointment_id
    contactId: string;         // ghl_contact_id → maps to leads.ghl_contact_id
    userId?: string;           // GHL user ID → maps to agents.ghl_user_id
    title?: string;
    appointmentStatus?: "scheduled" | "confirmed" | "showed" | "noshow" | "cancelled";
    selectedTimezone?: string;
    startTime: string;         // ISO 8601
    endTime?: string;
  };
}

/**
 * n8n error notification payload — sent by n8n error workflow to our webhook
 */
export interface N8nErrorNotification {
  workflowName: string;
  executionId: string;
  errorMessage: string;
  errorType: string;
  tenantId?: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}
```

### 3.2 Sync Result Types

```typescript
// packages/db/src/sync/types.ts

export interface SyncResult {
  success: boolean;
  leadId?: string;
  appointmentId?: string;
  isNew?: boolean;        // true = INSERT, false = UPDATE (idempotent)
  error?: string;
}

export interface MetricsRollupResult {
  success: boolean;
  tenantId: string;
  date: string;           // ISO date
  leadsTotal: number;
  appointmentsSet: number;
  error?: string;
}
```

### 3.3 Realtime Channel Types

```typescript
// packages/db/src/realtime/types.ts
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Metrics } from "./index";

export type MetricsRealtimePayload = {
  schema: "public";
  table: "metrics";
  commit_timestamp: string;
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Metrics;
  old: Partial<Metrics>;
};

export type MetricsSubscription = {
  channel: RealtimeChannel;
  unsubscribe: () => void;
};

/**
 * Factory function for creating a per-tenant metrics realtime subscription.
 * Usage: const { unsubscribe } = subscribeToMetrics(client, tenantId, (payload) => { ... })
 */
export type SubscribeToMetrics = (
  client: ReturnType<typeof import("./client").createBrowserClient>,
  tenantId: string,
  onUpdate: (payload: MetricsRealtimePayload) => void,
) => MetricsSubscription;
```

### 3.4 Realtime Subscription Helper

```typescript
// packages/db/src/realtime/subscriptions.ts
import type { SupabaseBrowserClient } from "../client";
import type { MetricsRealtimePayload, MetricsSubscription } from "./types";

export function subscribeToMetrics(
  client: SupabaseBrowserClient,
  tenantId: string,
  onUpdate: (payload: MetricsRealtimePayload) => void,
): MetricsSubscription {
  const channel = client
    .channel(`metrics:${tenantId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "metrics",
        filter: `tenant_id=eq.${tenantId}`,
      },
      (payload) => onUpdate(payload as MetricsRealtimePayload),
    )
    .subscribe();

  return {
    channel,
    unsubscribe: () => {
      client.removeChannel(channel);
    },
  };
}
```

---

## 4. Server Actions

### 4.1 No User-Facing Server Actions in F04

The sync pipeline is entirely backend-driven (n8n → Supabase). There are no user-initiated server actions in this cycle. The one Next.js surface (the n8n error webhook handler) is a Route Handler, not a Server Action.

---

## 5. API Routes

### 5.1 n8n Error Webhook Handler

**File:** `apps/dashboard/app/api/webhooks/n8n-error/route.ts`

This endpoint receives error notifications from n8n when a sync workflow fails. It writes to `sync_errors` and triggers alert creation if threshold is exceeded.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@rainmachine/db";

const n8nErrorSchema = z.object({
  workflowName: z.string().min(1),
  executionId: z.string().min(1),
  errorMessage: z.string().min(1),
  errorType: z.string().default("unknown"),
  tenantId: z.string().uuid().optional(),
  payload: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime(),
});

// Shared secret authentication
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET;

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth: verify shared secret in header
  const authHeader = req.headers.get("x-webhook-secret");
  if (!WEBHOOK_SECRET || authHeader !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = n8nErrorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = createServiceRoleClient();
  const { workflowName, executionId, errorMessage, errorType, tenantId, payload } =
    parsed.data;

  // Write sync_error row
  const { error: insertError } = await supabase.from("sync_errors").insert({
    tenant_id: tenantId ?? null,
    workflow_name: workflowName,
    n8n_execution_id: executionId,
    error_message: errorMessage,
    error_type: mapErrorType(errorType),
    payload: payload ?? null,
  });

  if (insertError) {
    console.error("[n8n-error webhook] Failed to write sync_error:", insertError);
    return NextResponse.json({ error: "Database write failed" }, { status: 500 });
  }

  // Check alert threshold: > 3 errors in last 60 minutes for this tenant
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("sync_errors")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId ?? null)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) > 3) {
    // Check if an active alert already exists for this tenant's sync failure
    const { data: existingAlert } = await supabase
      .from("alerts")
      .select("id")
      .eq("tenant_id", tenantId ?? null)
      .eq("status", "active")
      .ilike("title", "%sync%")
      .maybeSingle();

    if (!existingAlert) {
      await supabase.from("alerts").insert({
        tenant_id: tenantId ?? null,
        severity: "warning",
        status: "active",
        title: "Data Sync Failure",
        description: `${count} sync errors in the last 60 minutes. Workflow: ${workflowName}.`,
        recommended_action:
          "Check n8n workflow execution logs and verify GHL webhook configuration.",
      });
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

function mapErrorType(raw: string): "webhook_parse_error" | "lead_upsert_error" | "appointment_upsert_error" | "metrics_rollup_error" | "unknown" {
  const map: Record<string, "webhook_parse_error" | "lead_upsert_error" | "appointment_upsert_error" | "metrics_rollup_error"> = {
    "webhook_parse": "webhook_parse_error",
    "lead_upsert": "lead_upsert_error",
    "appointment_upsert": "appointment_upsert_error",
    "metrics_rollup": "metrics_rollup_error",
  };
  return map[raw] ?? "unknown";
}
```

### 5.2 Route Security

- Auth: `x-webhook-secret` header matches `N8N_WEBHOOK_SECRET` env var
- Method: POST only; GET returns 405
- Rate limiting: not needed (n8n is the only caller; secret prevents unauthorized access)
- The route is exempt from Next.js CSRF protection because it's not a form submission (no session cookies needed)

---

## 6. UI Components

### 6.1 Sync Test Page (Developer/Staging Tool)

**File:** `apps/dashboard/app/dashboard/sync-test/page.tsx`

This page is a living proof that Supabase Realtime works end-to-end. It is not user-facing — it's gated by `NODE_ENV !== 'production'` and removed when F07 ships.

```typescript
// apps/dashboard/app/dashboard/sync-test/page.tsx
import { notFound } from "next/navigation";
import { SyncTestClient } from "./SyncTestClient";
import { createServerClient } from "@rainmachine/db";
import { cookies } from "next/headers";

export default async function SyncTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Get the tenant_id from JWT claims
  const tenantId = (user.user_metadata as { tenant_id?: string }).tenant_id;

  // Read initial metrics row for today
  const today = new Date().toISOString().split("T")[0];
  const { data: initialMetrics } = await supabase
    .from("metrics")
    .select("leads_total, appointments_set")
    .eq("tenant_id", tenantId!)
    .eq("date", today!)
    .maybeSingle();

  return (
    <div className="p-8">
      <h1 className="font-display text-cyan text-xl uppercase tracking-widest mb-6">
        Sync Test — Realtime Proof
      </h1>
      <SyncTestClient
        tenantId={tenantId!}
        initialLeadsTotal={initialMetrics?.leads_total ?? 0}
        initialAppointmentsSet={initialMetrics?.appointments_set ?? 0}
      />
    </div>
  );
}
```

```typescript
// apps/dashboard/app/dashboard/sync-test/SyncTestClient.tsx
"use client";

import { useEffect, useState } from "react";
import { createBrowserClient, subscribeToMetrics } from "@rainmachine/db";
import type { MetricsRealtimePayload } from "@rainmachine/db";

interface Props {
  tenantId: string;
  initialLeadsTotal: number;
  initialAppointmentsSet: number;
}

export function SyncTestClient({
  tenantId,
  initialLeadsTotal,
  initialAppointmentsSet,
}: Props) {
  const [leadsTotal, setLeadsTotal] = useState(initialLeadsTotal);
  const [apptSet, setApptSet] = useState(initialAppointmentsSet);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  useEffect(() => {
    const client = createBrowserClient();
    const { unsubscribe } = subscribeToMetrics(
      client,
      tenantId,
      (payload: MetricsRealtimePayload) => {
        setLeadsTotal(payload.new.leads_total);
        setApptSet(payload.new.appointments_set);
        setLastEvent(new Date().toLocaleTimeString());
      },
    );

    return () => unsubscribe();
  }, [tenantId]);

  return (
    <div
      data-testid="sync-test-panel"
      className="bg-surface border border-border rounded-lg p-6 max-w-md"
    >
      <p className="text-text-muted text-xs font-mono uppercase tracking-wider mb-4">
        Realtime Metrics Counter
      </p>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-text-muted text-sm">Leads Total (Today)</span>
          <span
            data-testid="leads-total"
            className="font-mono text-cyan text-2xl"
          >
            {leadsTotal}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-text-muted text-sm">Appointments Set</span>
          <span
            data-testid="appointments-set"
            className="font-mono text-cyan text-2xl"
          >
            {apptSet}
          </span>
        </div>
      </div>
      {lastEvent && (
        <p
          data-testid="last-realtime-event"
          className="text-text-dim text-xs mt-4"
        >
          Last Realtime event: {lastEvent}
        </p>
      )}
    </div>
  );
}
```

**Replacement:** This page is deleted when F07 ships the real dashboard home.

---

## 7. Integration Points

### 7.1 GoHighLevel (GHL) Webhooks

GHL sends webhook events when contacts or appointments are created/updated. Webhooks are configured per sub-account (per tenant) in GHL.

**Webhook configuration in GHL:**
- URL: `https://[n8n-instance]/webhook/ghl-contact-sync`
- Events to enable: Contact Created, Contact Updated, Appointment Created, Appointment Updated

**Authentication:** GHL signs webhooks with a shared secret. n8n validates the signature in the first node.

**Field mapping — GHL Contact → Supabase `leads`:**

| GHL Field | Supabase Column | Notes |
|---|---|---|
| `contact.id` | `ghl_contact_id` | Idempotency key |
| `locationId` | → lookup `tenants.ghl_sub_account_id` | Maps GHL sub-account to tenant |
| `contact.firstName` | `first_name` | |
| `contact.lastName` | `last_name` | |
| `contact.email` | `email` | |
| `contact.phone` | `phone` | Required — leads without phone skipped |
| `contact.source` | `source` | Mapped to `lead_source` enum |
| `contact.tags` | `stage` | Tag-to-stage mapping (configurable per tenant) |

**Field mapping — GHL Appointment → Supabase `appointments`:**

| GHL Field | Supabase Column | Notes |
|---|---|---|
| `appointment.id` | `ghl_appointment_id` | Idempotency key |
| `locationId` | → lookup `tenants.ghl_sub_account_id` | |
| `appointment.contactId` | → lookup `leads.ghl_contact_id` → `lead_id` | |
| `appointment.userId` | → lookup `agents.ghl_user_id` → `agent_id` | |
| `appointment.startTime` | `scheduled_at` | |
| `appointment.appointmentStatus` | `status` | Mapped to `appointment_status` enum |

**Status mapping — GHL → Supabase:**

| GHL `appointmentStatus` | Supabase `appointment_status` |
|---|---|
| `scheduled` | `scheduled` |
| `confirmed` | `confirmed` |
| `showed` | `held` |
| `noshow` | `no_show` |
| `cancelled` | `cancelled` |

### 7.2 n8n Workflow: `ghl-to-supabase-sync`

**Tool:** n8n Cloud (hosted) — see OQ-01 for self-host vs cloud decision.

**Workflow overview:**

```
[GHL Webhook Trigger]
  ↓
[Validate signature node]
  ↓
[Lookup tenant by locationId]  ← query Supabase tenants WHERE ghl_sub_account_id = locationId
  ↓ (tenant found)
[Route by event type]
  ├── Contact event ──→ [Map fields] ──→ [Upsert lead] ──→ [Update metrics rollup]
  │                                              ↓ (error)
  │                                       [Error branch] ──→ POST /api/webhooks/n8n-error
  │
  └── Appointment event ──→ [Map fields] ──→ [Upsert appointment] ──→ [Update metrics rollup]
                                                        ↓ (error)
                                                 [Error branch] ──→ POST /api/webhooks/n8n-error
```

**Upsert node — leads:**

```
HTTP Request node → POST to Supabase REST API
URL: https://[project].supabase.co/rest/v1/leads
Method: POST
Headers:
  Authorization: Bearer <service_role_key>
  apikey: <anon_key>
  Prefer: resolution=merge-duplicates
Body:
  {
    "tenant_id": "{{ $json.tenantId }}",
    "ghl_contact_id": "{{ $json.contactId }}",
    "first_name": "{{ $json.firstName }}",
    "last_name": "{{ $json.lastName }}",
    "email": "{{ $json.email }}",
    "phone": "{{ $json.phone }}",
    "source": "{{ $json.mappedSource }}",
    "stage": "{{ $json.mappedStage }}",
    "last_activity_at": "{{ $now }}"
  }
```

The `Prefer: resolution=merge-duplicates` header combined with the `UNIQUE(ghl_contact_id)` constraint provides idempotency — duplicate webhooks update the existing row instead of inserting a new one.

**Daily metrics rollup node (scheduled, not webhook-triggered):**

```
n8n Schedule Trigger: daily at 11:55 PM (per tenant timezone)
  ↓
For each active tenant:
  ↓
Supabase RPC call: "upsert_daily_metrics(tenant_id, date)"
```

The `upsert_daily_metrics` function (defined in migration below) calculates KPI aggregates and upserts to `metrics`.

**Metrics rollup function:**

```sql
-- supabase/migrations/0007_metrics_rollup.sql

CREATE OR REPLACE FUNCTION upsert_daily_metrics(
  p_tenant_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS void AS $$
DECLARE
  v_leads_total INTEGER;
  v_leads_new INTEGER;
  v_appointments_set INTEGER;
  v_appointments_held INTEGER;
  v_calls_total INTEGER;
  v_calls_connected INTEGER;
  v_close_rate NUMERIC;
BEGIN
  -- Leads
  SELECT COUNT(*) INTO v_leads_total
    FROM leads
   WHERE tenant_id = p_tenant_id
     AND DATE(created_at) = p_date;

  SELECT COUNT(*) INTO v_leads_new
    FROM leads
   WHERE tenant_id = p_tenant_id
     AND DATE(created_at) = p_date
     AND stage = 'new';

  -- Appointments
  SELECT COUNT(*) INTO v_appointments_set
    FROM appointments
   WHERE tenant_id = p_tenant_id
     AND DATE(created_at) = p_date;

  SELECT COUNT(*) INTO v_appointments_held
    FROM appointments
   WHERE tenant_id = p_tenant_id
     AND status = 'held'
     AND DATE(held_at) = p_date;

  -- Calls
  SELECT COUNT(*) INTO v_calls_total
    FROM calls
   WHERE tenant_id = p_tenant_id
     AND DATE(initiated_at) = p_date;

  SELECT COUNT(*) INTO v_calls_connected
    FROM calls
   WHERE tenant_id = p_tenant_id
     AND DATE(initiated_at) = p_date
     AND status = 'completed';

  -- Close rate: closed_won / (closed_won + closed_lost) from all time
  SELECT
    CASE
      WHEN (COUNT(*) FILTER (WHERE stage IN ('closed_won', 'closed_lost'))) = 0 THEN NULL
      ELSE COUNT(*) FILTER (WHERE stage = 'closed_won')::NUMERIC /
           COUNT(*) FILTER (WHERE stage IN ('closed_won', 'closed_lost'))
    END
    INTO v_close_rate
    FROM leads
   WHERE tenant_id = p_tenant_id;

  -- Upsert metrics row
  INSERT INTO metrics (
    tenant_id, date,
    leads_total, leads_new,
    appointments_set, appointments_held,
    calls_total, calls_connected,
    close_rate
  ) VALUES (
    p_tenant_id, p_date,
    v_leads_total, v_leads_new,
    v_appointments_set, v_appointments_held,
    v_calls_total, v_calls_connected,
    v_close_rate
  )
  ON CONFLICT (tenant_id, date) DO UPDATE SET
    leads_total = EXCLUDED.leads_total,
    leads_new = EXCLUDED.leads_new,
    appointments_set = EXCLUDED.appointments_set,
    appointments_held = EXCLUDED.appointments_held,
    calls_total = EXCLUDED.calls_total,
    calls_connected = EXCLUDED.calls_connected,
    close_rate = EXCLUDED.close_rate,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant to service role
GRANT EXECUTE ON FUNCTION upsert_daily_metrics TO service_role;
```

### 7.3 Supabase Realtime

**Configuration:** Already enabled on `metrics` table (migration `0001_initial_schema.sql`).

**Channel pattern:** One channel per tenant: `metrics:{tenantId}`

This prevents all tenants' Realtime events from flooding a single global channel. Each dashboard client subscribes only to their tenant's channel.

**Supabase dashboard settings:**
- Realtime → Enabled ✓
- `metrics` table → Broadcast changes ✓
- Filter: `tenant_id` (enabled via the RLS policies — Realtime respects RLS in Supabase)

### 7.4 n8n Error Webhook → Next.js

n8n has a built-in "Error Workflow" feature. When any node in a workflow throws, n8n can route execution to an error workflow. That error workflow POSTs to `/api/webhooks/n8n-error` with the execution details.

**n8n Error Workflow configuration:**

```
[Error Trigger node]
  ↓
[Set node — extract fields]
  - workflowName: {{ $workflow.name }}
  - executionId: {{ $execution.id }}
  - errorMessage: {{ $execution.lastNodeExecuted.error.message }}
  - errorType: {{ $execution.lastNodeExecuted.parameters.errorType }}
  - tenantId: {{ $('Lookup Tenant').item.json.tenantId }}
  - timestamp: {{ $now }}
  ↓
[HTTP Request node]
  - URL: {{ $env.DASHBOARD_URL }}/api/webhooks/n8n-error
  - Method: POST
  - Headers: x-webhook-secret: {{ $env.N8N_WEBHOOK_SECRET }}
  - Body: {{ $json }}
```

**Environment variables needed in n8n:**

| Variable | Value |
|---|---|
| `DASHBOARD_URL` | `https://app.rainmachine.io` (or staging URL) |
| `N8N_WEBHOOK_SECRET` | Shared secret — matches `N8N_WEBHOOK_SECRET` in dashboard app |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |

**New env var to add to `apps/dashboard/src/env.ts`:**

```typescript
server: {
  // ... existing vars
  N8N_WEBHOOK_SECRET: z.string().min(16),
}
```

---

## 8. BDD Scenarios

### Scenario 1: New Lead Webhook Creates Lead Row

```
Given n8n is running and the ghl-to-supabase-sync workflow is active
When GHL fires a ContactCreate webhook for Tenant A
Then the n8n workflow processes the webhook within 10 seconds
And a new lead row appears in Supabase within 30 seconds
And lead.ghl_contact_id matches the GHL contact ID
And lead.tenant_id matches Tenant A's tenant ID
And lead.phone is populated
And lead.stage is "new"
```

### Scenario 2: Duplicate Webhook Is Idempotent

```
Given a lead with ghl_contact_id "contact-123" already exists for Tenant A
When the same ContactCreate webhook fires a second time
Then no new lead row is created
And the existing lead row is updated with the latest data
And leads.count for Tenant A remains unchanged
And no sync_error row is written
```

### Scenario 3: Appointment Webhook Links to Correct Lead

```
Given a lead exists with ghl_contact_id "contact-456"
When GHL fires an AppointmentCreate webhook referencing contactId "contact-456"
Then an appointment row is created in Supabase
And appointment.lead_id references the correct lead
And appointment.scheduled_at matches the GHL appointment startTime
And appointment.status is "scheduled"
```

### Scenario 4: Appointment for Unknown Contact Triggers Error

```
Given no lead exists with ghl_contact_id "contact-unknown"
When GHL fires an AppointmentCreate webhook referencing contactId "contact-unknown"
Then the n8n workflow routes to the error branch
And a sync_error row is written with error_type "appointment_upsert_error"
And the error_message mentions the unknown contact ID
And no appointment row is created
```

### Scenario 5: Sync Error Alert Threshold

```
Given Tenant A has had 3 sync_error rows in the last 60 minutes
When a 4th n8n error fires and the webhook handler writes a 4th sync_error row
Then the webhook handler queries the error count (= 4, which is > 3)
And a new alerts row is inserted with severity "warning" and title "Data Sync Failure"
And the alert is visible in the CEO command center (F13)
```

### Scenario 6: Sync Error Alert Not Duplicated

```
Given an active alert for "Data Sync Failure" already exists for Tenant A
When the webhook handler detects error count > 3 again
Then NO new alert row is inserted
And the existing alert remains active
```

### Scenario 7: Realtime Counter Increments

```
Given the /dashboard/sync-test page is open in a browser
And the SyncTestClient component has subscribed to the metrics:tenantId channel
When a metrics row is upserted for that tenant (by the daily rollup)
Then the leads_total counter on the page updates within 2 seconds
And no page refresh occurs
And the "Last Realtime event" timestamp updates
```

### Scenario 8: Source Mapping

```
Given a GHL contact with source "Facebook Ad"
When the n8n workflow maps the source field
Then lead.source is set to "meta_ads"
Given a GHL contact with source "Google Ad"
Then lead.source is set to "google_ads"
Given a GHL contact with source not in the map
Then lead.source is set to "other"
```

### Scenario 9: Unknown Tenant Location ID

```
Given a GHL webhook with locationId "unknown-location-999"
When n8n processes the webhook
Then no matching tenant is found via ghl_sub_account_id lookup
And n8n routes to the error branch
And a sync_error is written with error_type "webhook_parse_error"
And the error_message mentions the unknown locationId
```

### Scenario 10: n8n Error Webhook Authentication

```
Given the n8n error webhook handler requires x-webhook-secret header
When a request arrives without the header
Then the handler returns 401 Unauthorized
And no sync_error row is written
When a request arrives with an incorrect secret
Then the handler returns 401 Unauthorized
```

---

## 9. Test Plan

### 9.1 Integration Tests

These tests run against a local Supabase instance (`supabase start`) with seed data.

**File:** `apps/dashboard/__tests__/integration/sync.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServiceRoleClient } from "@rainmachine/db";

const TENANT_ID = process.env.TEST_TENANT_ID!;
const DASHBOARD_URL = "http://localhost:3000";
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET!;

describe("F04 — GHL Sync Integration Tests", () => {
  const supabase = createServiceRoleClient();

  it("POST /api/webhooks/n8n-error writes sync_error row", async () => {
    const before = await supabase
      .from("sync_errors")
      .select("id", { count: "exact" });

    const res = await fetch(`${DASHBOARD_URL}/api/webhooks/n8n-error`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        workflowName: "ghl-to-supabase-sync",
        executionId: "test-exec-001",
        errorMessage: "Contact upsert failed",
        errorType: "lead_upsert",
        tenantId: TENANT_ID,
        timestamp: new Date().toISOString(),
      }),
    });

    expect(res.status).toBe(200);

    const after = await supabase
      .from("sync_errors")
      .select("id", { count: "exact" });

    expect((after.count ?? 0)).toBe((before.count ?? 0) + 1);
  });

  it("returns 401 without webhook secret", async () => {
    const res = await fetch(`${DASHBOARD_URL}/api/webhooks/n8n-error`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });

  it("creates alert after 4 errors in 60 minutes", async () => {
    // Write 4 sync_errors with recent timestamps for test tenant
    for (let i = 0; i < 4; i++) {
      await supabase.from("sync_errors").insert({
        tenant_id: TENANT_ID,
        workflow_name: "ghl-to-supabase-sync",
        error_type: "lead_upsert_error",
        error_message: `Test error ${i}`,
      });
    }

    // Trigger the alert check via webhook
    await fetch(`${DASHBOARD_URL}/api/webhooks/n8n-error`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        workflowName: "ghl-to-supabase-sync",
        executionId: "test-exec-alert",
        errorMessage: "Triggering alert",
        errorType: "lead_upsert",
        tenantId: TENANT_ID,
        timestamp: new Date().toISOString(),
      }),
    });

    const { data: alerts } = await supabase
      .from("alerts")
      .select("id")
      .eq("tenant_id", TENANT_ID)
      .eq("status", "active")
      .ilike("title", "%sync%");

    expect(alerts?.length).toBeGreaterThan(0);
  });
});
```

### 9.2 Realtime Integration Test (Playwright)

```typescript
// apps/dashboard/e2e/realtime.spec.ts
import { test, expect } from "@playwright/test";

test.describe("F04 — Realtime Sync Test Page", () => {
  test.skip(
    process.env.NODE_ENV === "production",
    "Sync test page not available in production",
  );

  test("realtime counter updates within 2 seconds of DB write", async ({
    page,
  }) => {
    // Requires test user to be logged in (see auth helper)
    await page.goto("/dashboard/sync-test");
    await expect(page.getByTestId("sync-test-panel")).toBeVisible();

    const initialValue = await page
      .getByTestId("leads-total")
      .textContent();

    // Trigger a metrics upsert via Supabase admin API (test utility)
    // This simulates the n8n daily rollup
    await page.evaluate(async () => {
      await fetch("/api/test/trigger-metrics-upsert", { method: "POST" });
    });

    // Wait max 2s for Realtime update
    await expect(page.getByTestId("last-realtime-event")).toBeVisible({
      timeout: 2000,
    });
  });
});
```

### 9.3 n8n Workflow Tests (Manual + Staging)

n8n workflows cannot be unit-tested with Jest/Vitest — they are tested by triggering test executions in the n8n UI against a staging environment.

**Manual test checklist for n8n staging:**

- [ ] Trigger ContactCreate webhook with valid payload → lead upserted in Supabase staging
- [ ] Trigger ContactCreate webhook twice with same contact ID → only 1 lead row exists
- [ ] Trigger AppointmentCreate with valid contactId → appointment linked to lead
- [ ] Trigger webhook with unknown locationId → error branch fires, sync_error written
- [ ] Disable n8n → trigger 4+ manual error webhook calls → alert created in Supabase

### 9.4 Unit Tests

```typescript
// apps/dashboard/app/api/webhooks/n8n-error/__tests__/route.test.ts
// Test mapErrorType function
// Test Zod schema validation — invalid payload returns 400
// Test missing auth header returns 401
// Test valid payload returns 200
```

---

## 10. OWASP Security Checklist

### 10.1 Webhook Authentication (A07)

- [ ] **n8n error webhook** — Protected by shared secret in `x-webhook-secret` header. The secret is a minimum 16-character random string generated by `openssl rand -hex 32`. Stored as env var on both sides.
- [ ] **GHL webhooks to n8n** — GHL signs webhook payloads with a signature that n8n validates (HMAC-SHA256). The GHL webhook secret is stored in n8n environment variables.
- [ ] **No unauthenticated webhook endpoints** — All webhook routes check auth before processing payload.

### 10.2 Injection Prevention (A03)

- [ ] **n8n → Supabase writes** — Use Supabase REST API with parameterized bodies (not raw SQL). Field values are passed as JSON — no interpolation into SQL strings.
- [ ] **n8n error webhook → Supabase** — Route handler validates with Zod before any DB write. `payload` field stored as-is in `sync_errors.payload` (JSONB) — no interpolation.
- [ ] **GHL field values** — All GHL contact/appointment field values are mapped by n8n before reaching Supabase. Source and stage mapping uses a lookup table, not direct interpolation.

### 10.3 Data Exposure (A02)

- [ ] **sync_errors table** — Contains potentially sensitive GHL payload data (contact info). RLS: CEO read only. RM users cannot query this table.
- [ ] **sync_errors.payload** — Stores raw GHL webhook payload. Review what GHL includes in webhook payloads — if it includes PII beyond what's needed, strip fields in n8n before storing.
- [ ] **n8n environment** — `SUPABASE_SERVICE_ROLE_KEY` is stored in n8n environment variables (encrypted at rest by n8n Cloud). Never logged in n8n execution outputs.

### 10.4 Rate Limiting

- [ ] **n8n error webhook** — No rate limiting implemented in F04. Acceptable for MVP because the only caller is n8n. If n8n goes rogue and floods the endpoint, the `sync_errors` table grows but no user data is compromised. Add rate limiting in a later cycle if needed.
- [ ] **Supabase Realtime** — Supabase applies connection limits per plan. Monitor active Realtime connections in Supabase dashboard. Each browser tab opens one channel. With 100 tenants × 5 concurrent users = 500 channels — well within Supabase Pro plan limits.

### 10.5 Idempotency as a Security Property

- [ ] **Lead upsert idempotency** — The `UNIQUE(ghl_contact_id)` constraint prevents duplicate leads from replay attacks or duplicate webhook fires. This is both a data integrity and a DoS mitigation measure.
- [ ] **Appointment upsert idempotency** — `UNIQUE(ghl_appointment_id)` provides the same protection.

### 10.6 Secret Rotation Plan

- [ ] **N8N_WEBHOOK_SECRET** — Can be rotated by updating the env var on both the n8n side and the dashboard app side, then redeploying. No data loss.
- [ ] **GHL webhook secret** — Rotated in GHL sub-account settings and n8n environment simultaneously.

---

## 11. Open Questions

### OQ-01 — n8n: Cloud vs Self-Hosted?

**Question:** Use n8n Cloud (hosted, managed) or self-host n8n on a VPS?

**Options:**
- A: n8n Cloud — $20/mo starter plan, managed infrastructure, zero ops burden
- B: Self-hosted — full control, lower cost at scale, higher ops burden

**Recommendation:** n8n Cloud for all of R0. If cost becomes significant (>$200/mo) when workflows multiply in R2, migrate to self-hosted. The workflow definitions are portable (JSON export/import).

**Decision gate:** Before starting F04 implementation.

---

### OQ-02 — GHL Webhook Delivery: Pull vs Push

**Question:** GHL webhooks are push (GHL sends to us). If our endpoint is down when a webhook fires, GHL retries 3 times with 1-second intervals, then drops the event. Is this acceptable?

**Context:** Vercel preview/production deployments have near-zero downtime. The 3-retry window covers brief deployments. If GHL drops events during an extended outage, we miss data.

**Mitigation:** n8n Cloud persists execution history. A "catch-up" workflow can be triggered manually to re-sync data for a date range using the GHL API (polling, not webhooks).

**Recommendation:** Accept the push model in R0. Add the catch-up workflow as a manual tool in F10 or later.

**Decision gate:** Acceptable risk for R0. Document in `RABBIT-HOLES.md` addendum.

---

### OQ-03 — Metrics Rollup: Real-Time or Scheduled?

**Question:** The daily metrics rollup currently runs once per day via n8n scheduler. For the real-time counter on the sync-test page (and later the dashboard), should the rollup also fire after each lead/appointment upsert?

**Context:** If Marcus gets a new lead at 10am, the KPI counter won't update until midnight (next rollup). For a "real-time" feel, we want the counter to increment immediately.

**Options:**
- A: Keep scheduled daily rollup + Realtime listens to `leads` table directly (not `metrics`)
- B: n8n calls `upsert_daily_metrics` after every lead/appointment upsert (real-time rollup)

**Recommendation:** Option B for R0 — call `upsert_daily_metrics` in n8n after each successful lead/appointment upsert. This ensures `metrics` is always current. The Realtime subscription on `metrics` then correctly shows live data.

**Decision gate:** F04 n8n workflow implementation. Low-complexity change (add one more node after upsert).

---

### OQ-04 — Tag-to-Stage Mapping: Where Is the Config Stored?

**Question:** GHL uses contact tags to represent pipeline stage (e.g., tag "appointment-set" = stage "appointment_set"). This mapping varies per tenant. Where is the mapping stored?

**Options:**
- A: Hardcoded in n8n workflow (simple, but non-configurable per tenant)
- B: Stored in `tenants` JSONB column `stage_tag_mapping`
- C: Stored in a separate `routing_rules` table (used in F11 Settings)

**Recommendation:** Option B for R0. Add a `stage_tag_mapping` JSONB column to `tenants` with a sensible default. n8n reads this from the tenant lookup step. F11 (Settings) adds a UI to edit it.

**Default mapping:**

```json
{
  "appointment-set": "appointment_set",
  "appointment-held": "appointment_held",
  "qualified": "qualified",
  "contacted": "contacted",
  "under-contract": "under_contract",
  "closed-won": "closed_won",
  "closed-lost": "closed_lost"
}
```

**Decision gate:** Before writing the n8n workflow. Add the column in a migration addendum.

---

*PRD F04 — GHL ↔ Supabase Data Sync & Realtime*
*Sigma Protocol Step 11 · MIRD AI Corporate Machine*
*Written: 2026-04-02 · Cycle 2 · Release 0*
*Depends on: F03 (schema + auth)*
*Unlocks: F05, F06, all R1 app pitches*

# F05 — Retell AI Lead Response Workflow
# RainMachine · MIRD AI Corporate Machine
# Sigma Protocol Step 11 · PRD Generation
# Source Pitch: P05 · Cycle: 2 · Release: R0 · Appetite: Medium
# Date: 2026-04-02 | Status: Ready for Implementation

---

## 1. Overview

### Pitch Summary

Speed-to-lead is the single most important variable in real estate lead conversion. A new lead who gets called within 5 minutes is 100× more likely to convert than one called an hour later. Marcus's team can't watch a screen 24/7 — but Retell AI can. This PRD wires Retell AI to the RainMachine platform: when a new lead arrives in GHL (tagged `new-lead`), Retell AI dials within 60 seconds, handles the conversation, and writes the outcome back to Supabase. Marcus sees the call transcript in his dashboard without ever picking up the phone.

There is a second workflow for warm contacts: GHL Native Voice Agent handles appointment confirmation calls (no-show follow-up, reminder calls). These are warm contacts with existing relationships — Retell AI's aggressive outbound personality isn't appropriate. The GHL Native Voice workflow uses a softer GHL-native agent.

### User-Facing Outcome

A lead submits a Facebook ad form at 2am. Within 60 seconds, Retell AI calls them. The conversation is recorded, the transcript is written to Supabase, and by the time Marcus opens his dashboard in the morning, he sees: Lead: "Jane Smith" · Outcome: "Appointment Set" · Duration: 4:23 · [VIEW TRANSCRIPT]. His team never touched it.

### What This PRD Covers

- n8n workflow `new-lead-retell-trigger`: new-lead tag → Retell API call creation
- Retell `call_ended` webhook handler: Next.js API route `/api/webhooks/retell`
- Call concurrency guard (2-second stagger, 10-min duplicate guard)
- GHL Native Voice Agent workflow (warm contacts: appointment no-show trigger)
- `calls` TypeScript type and DB writes
- Stub call log page: `apps/dashboard/app/dashboard/calls/page.tsx`
- Integration tests: new lead → call within 60s, call_ended → DB updated, duplicate guard

### What This PRD Does Not Cover

- Retell AI agent script/prompt configuration (done in Retell dashboard by Shomari, not code)
- Voice agent personality tuning (operational, not code)
- Call recordings storage/playback beyond `recording_url` (UI for playback is F08)
- Billing/credit consumption tracking for Retell (future)
- SMS fallback if call fails (future)

### Acceptance Summary (from VERTICAL-SLICE-VERIFICATION.md · P05)

- New lead tagged `new-lead` in GHL → Retell call initiated within 60 seconds
- `calls` row with `status: initiated` exists immediately after Retell API call
- `call_ended` webhook → `calls` row updated with status, outcome, duration, transcript within 5 seconds
- `leads.ai_call_status` updated to match final call status
- Duplicate call guard: second trigger for same phone number within 10 minutes → no second call
- The stub call log page renders last 10 calls with outcome badges

---

## 2. Database

### 2.1 No New Tables

`calls` table was created in F03 migration. This PRD adds write logic only.

### 2.2 Migration: Add Index and AI-Call Guard Function

```sql
-- supabase/migrations/0008_call_guard.sql

-- Additional index for duplicate call guard query
CREATE INDEX idx_calls_phone_recent ON calls(tenant_id, (
  SELECT phone FROM leads WHERE leads.id = calls.lead_id
), initiated_at DESC);

-- Function: check if a call was placed to this phone within N minutes
CREATE OR REPLACE FUNCTION check_duplicate_call(
  p_tenant_id UUID,
  p_lead_id UUID,
  p_window_minutes INTEGER DEFAULT 10
) RETURNS BOOLEAN AS $$
DECLARE
  v_recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_recent_count
    FROM calls c
   WHERE c.tenant_id = p_tenant_id
     AND c.lead_id = p_lead_id
     AND c.initiated_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL
     AND c.status NOT IN ('failed');

  RETURN v_recent_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_duplicate_call TO service_role;
```

### 2.3 RLS (No Changes)

`calls` table RLS policies were established in F03:
- RM tenant read/write scoped to own tenant
- CEO reads all
- Service role (n8n, Edge Functions, webhook handlers) bypasses RLS

---

## 3. TypeScript Interfaces

### 3.1 Calls Domain Types

```typescript
// packages/db/src/types/calls.types.ts

import type { Call, CallStatus, CallOutcome } from "./index";

/**
 * Retell AI `call_ended` webhook payload.
 * Retell sends this when a call terminates for any reason.
 * Reference: https://docs.retellai.com/webhooks/call-ended
 */
export interface RetellCallEndedWebhook {
  event: "call_ended";
  call_id: string;               // retell_call_id
  call_type: "outbound_api";
  agent_id: string;              // Retell agent ID
  call_status: RetellCallStatus;
  start_timestamp: number;       // Unix ms
  end_timestamp: number;         // Unix ms
  duration_ms: number;
  transcript?: string;
  recording_url?: string;
  call_analysis?: {
    call_summary?: string;
    user_sentiment?: "Positive" | "Negative" | "Neutral" | "Unknown";
    call_successful?: boolean;
    custom_analysis_data?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>; // metadata we passed when creating the call
}

export type RetellCallStatus =
  | "registered"
  | "ongoing"
  | "ended"
  | "error"
  | "voicemail_reached";

/**
 * Retell API — create phone call request body.
 * Reference: https://docs.retellai.com/api-references/create-phone-call
 */
export interface RetellCreateCallRequest {
  from_number: string;            // Retell provisioned number
  to_number: string;              // lead's phone number
  override_agent_id?: string;     // use tenant-specific agent if configured
  metadata?: {
    tenant_id: string;
    lead_id: string;
    call_record_id: string;       // our pre-created calls.id for idempotency
  };
}

export interface RetellCreateCallResponse {
  call_id: string;
  agent_id: string;
  call_status: RetellCallStatus;
  from_number: string;
  to_number: string;
  metadata?: Record<string, unknown>;
  start_timestamp?: number;
}

/**
 * Call log entry for the stub call log page.
 * RSC-friendly shape: denormalized join of calls + leads.
 */
export interface CallLogEntry {
  id: string;
  leadId: string;
  leadName: string;              // leads.first_name + last_name
  leadPhone: string;
  status: CallStatus;
  outcome: CallOutcome | null;
  durationS: number | null;
  transcript: string | null;
  initiatedAt: string;           // ISO string
}

/**
 * Outcome mapping: Retell custom_analysis_data keys → our CallOutcome enum.
 * Retell's AI fills in the custom_analysis_data based on agent prompt instructions.
 */
export interface RetellOutcomeAnalysis {
  appointment_set?: boolean;
  callback_requested?: boolean;
  not_interested?: boolean;
  wrong_number?: boolean;
  voicemail?: boolean;
}
```

### 3.2 Retell Client

```typescript
// packages/db/src/retell/client.ts

import type {
  RetellCreateCallRequest,
  RetellCreateCallResponse,
} from "../types/calls.types";

export class RetellClient {
  private apiKey: string;
  private baseUrl = "https://api.retellai.com";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createPhoneCall(
    request: RetellCreateCallRequest,
  ): Promise<RetellCreateCallResponse> {
    const response = await fetch(`${this.baseUrl}/v2/create-phone-call`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new RetellApiError(
        `Retell API error ${response.status}: ${error}`,
        response.status,
      );
    }

    return response.json() as Promise<RetellCreateCallResponse>;
  }

  verifyWebhookSignature(
    rawBody: string,
    signature: string,
    secret: string,
  ): boolean {
    const crypto = require("node:crypto");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex"),
    );
  }
}

export class RetellApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "RetellApiError";
  }
}
```

---

## 4. Server Actions

No user-initiated server actions in F05. The Retell trigger is backend-automated (n8n → Retell API). The call result is written by the webhook handler. No user action required.

---

## 5. API Routes

### 5.1 Retell Webhook Handler

**File:** `apps/dashboard/app/api/webhooks/retell/route.ts`

This endpoint receives Retell webhook events (`call_ended`, `call_started`, etc.) and writes to the `calls` table.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@rainmachine/db";
import type {
  RetellCallEndedWebhook,
  RetellOutcomeAnalysis,
  CallOutcome,
  CallStatus,
} from "@rainmachine/db";

// Retell webhook secret for signature verification
const RETELL_WEBHOOK_SECRET = process.env.RETELL_WEBHOOK_SECRET!;

const callEndedSchema = z.object({
  event: z.literal("call_ended"),
  call_id: z.string().min(1),
  call_status: z.enum([
    "registered", "ongoing", "ended", "error", "voicemail_reached",
  ]),
  start_timestamp: z.number().optional(),
  end_timestamp: z.number().optional(),
  duration_ms: z.number().optional(),
  transcript: z.string().optional(),
  recording_url: z.string().url().optional(),
  call_analysis: z
    .object({
      call_summary: z.string().optional(),
      call_successful: z.boolean().optional(),
      custom_analysis_data: z.record(z.unknown()).optional(),
    })
    .optional(),
  metadata: z
    .object({
      tenant_id: z.string().uuid(),
      lead_id: z.string().uuid(),
      call_record_id: z.string().uuid(),
    })
    .optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();

  // Verify Retell webhook signature
  const signature = req.headers.get("x-retell-signature") ?? "";
  if (!verifyRetellSignature(rawBody, signature, RETELL_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only handle call_ended — log and ignore other events
  const eventType = (payload as { event?: string }).event;
  if (eventType !== "call_ended") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const parsed = callEndedSchema.safeParse(payload);
  if (!parsed.success) {
    console.error("[retell webhook] Schema validation failed:", parsed.error);
    return NextResponse.json({ error: "Invalid payload schema" }, { status: 400 });
  }

  const data = parsed.data as RetellCallEndedWebhook;
  const supabase = createServiceRoleClient();

  // Determine final status + outcome
  const status = mapRetellStatus(data.call_status);
  const outcome = extractOutcome(data);
  const durationS = data.duration_ms ? Math.floor(data.duration_ms / 1000) : null;

  // Look up the call record by retell_call_id OR metadata.call_record_id
  let callId = data.metadata?.call_record_id ?? null;

  if (!callId) {
    // Fallback: find by retell_call_id
    const { data: callRow } = await supabase
      .from("calls")
      .select("id, lead_id, tenant_id")
      .eq("retell_call_id", data.call_id)
      .maybeSingle();

    if (!callRow) {
      // Retell fired call_ended for a call we didn't initiate (or race condition)
      // Log and return 200 to prevent Retell retrying
      console.warn("[retell webhook] No matching call record for:", data.call_id);
      return NextResponse.json({ received: true }, { status: 200 });
    }
    callId = callRow.id;
  }

  // Update calls row
  const { error: updateError } = await supabase
    .from("calls")
    .update({
      status,
      outcome,
      duration_s: durationS,
      transcript: data.transcript ?? null,
      recording_url: data.recording_url ?? null,
      ended_at: data.end_timestamp
        ? new Date(data.end_timestamp).toISOString()
        : new Date().toISOString(),
    })
    .eq("id", callId);

  if (updateError) {
    console.error("[retell webhook] Failed to update call:", updateError);
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  // Update lead.ai_call_status
  const leadId = data.metadata?.lead_id;
  if (leadId) {
    await supabase
      .from("leads")
      .update({ ai_call_status: status })
      .eq("id", leadId);
  }

  // Notify Supabase Realtime (the update already triggers Realtime via DB)
  // No additional action needed — Realtime listens to calls table changes in F07+

  return NextResponse.json({ success: true }, { status: 200 });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function verifyRetellSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const crypto = require("node:crypto");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

function mapRetellStatus(retellStatus: string): CallStatus {
  const map: Record<string, CallStatus> = {
    ended: "completed",
    error: "failed",
    voicemail_reached: "voicemail",
    registered: "initiated",
    ongoing: "in_progress",
  };
  return (map[retellStatus] ?? "failed") as CallStatus;
}

function extractOutcome(data: RetellCallEndedWebhook): CallOutcome | null {
  const analysis = data.call_analysis?.custom_analysis_data as
    | RetellOutcomeAnalysis
    | undefined;

  if (!analysis) {
    // Fallback: voicemail_reached status → voicemail outcome
    if (data.call_status === "voicemail_reached") return "voicemail";
    return null;
  }

  if (analysis.appointment_set) return "appointment_set";
  if (analysis.callback_requested) return "callback_requested";
  if (analysis.wrong_number) return "wrong_number";
  if (analysis.not_interested) return "not_interested";
  if (analysis.voicemail) return "voicemail";

  return "other";
}
```

**New env vars required:**

```typescript
// apps/dashboard/src/env.ts additions:
server: {
  // ...
  RETELL_API_KEY: z.string().min(1),
  RETELL_WEBHOOK_SECRET: z.string().min(16),
  RETELL_FROM_NUMBER: z.string().min(10),  // Retell provisioned phone number
}
```

---

## 6. UI Components

### 6.1 Call Log Stub Page

**File:** `apps/dashboard/app/dashboard/calls/page.tsx`

This is a living proof that the Retell workflow writes to Supabase correctly. It shows the last 10 calls with outcome badges. It is replaced by the full Leads Detail panel in F08 (where transcripts are accessible via slide-over).

```typescript
// apps/dashboard/app/dashboard/calls/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@rainmachine/db";
import { Badge } from "@rainmachine/ui";
import type { CallLogEntry } from "@rainmachine/db";

export default async function CallsStubPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  const tenantId = (user?.user_metadata as { tenant_id?: string })?.tenant_id;

  // Get last 10 calls with lead info
  const { data: calls } = await supabase
    .from("calls")
    .select(`
      id,
      status,
      outcome,
      duration_s,
      transcript,
      initiated_at,
      leads!inner (
        id,
        first_name,
        last_name,
        phone
      )
    `)
    .eq("tenant_id", tenantId!)
    .order("initiated_at", { ascending: false })
    .limit(10);

  const callEntries: CallLogEntry[] = (calls ?? []).map((c) => ({
    id: c.id,
    leadId: (c.leads as { id: string }).id,
    leadName: [
      (c.leads as { first_name?: string }).first_name,
      (c.leads as { last_name?: string }).last_name,
    ]
      .filter(Boolean)
      .join(" ") || "Unknown",
    leadPhone: (c.leads as { phone: string }).phone,
    status: c.status as CallLogEntry["status"],
    outcome: c.outcome as CallLogEntry["outcome"],
    durationS: c.duration_s,
    transcript: c.transcript,
    initiatedAt: c.initiated_at,
  }));

  return (
    <div
      className="p-8"
      data-testid="calls-stub-page"
    >
      <h1 className="font-display text-cyan text-xl uppercase tracking-widest mb-6">
        Recent AI Calls
      </h1>

      {callEntries.length === 0 ? (
        <p className="text-text-muted text-sm">No calls yet.</p>
      ) : (
        <div className="space-y-3">
          {callEntries.map((call) => (
            <div
              key={call.id}
              data-testid="call-log-row"
              className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-text text-sm font-medium">{call.leadName}</p>
                <p className="text-text-muted text-xs font-mono">{call.leadPhone}</p>
              </div>
              <div className="flex items-center gap-3">
                {call.outcome && (
                  <OutcomeBadge outcome={call.outcome} />
                )}
                <Badge color="gray" size="sm">
                  {call.durationS != null
                    ? formatDuration(call.durationS)
                    : call.status}
                </Badge>
                <p className="text-text-dim text-xs">
                  {new Date(call.initiatedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: CallLogEntry["outcome"] }) {
  const outcomeConfig: Record<
    string,
    { label: string; color: "green" | "cyan" | "orange" | "red" | "gray" }
  > = {
    appointment_set: { label: "APPT SET", color: "green" },
    callback_requested: { label: "CALLBACK", color: "cyan" },
    not_interested: { label: "NOT INT.", color: "red" },
    wrong_number: { label: "WRONG #", color: "red" },
    voicemail: { label: "VOICEMAIL", color: "gray" },
    no_answer: { label: "NO ANSWER", color: "orange" },
    other: { label: "OTHER", color: "gray" },
  };

  if (!outcome) return null;
  const config = outcomeConfig[outcome] ?? { label: outcome, color: "gray" };
  return <Badge color={config.color} size="sm">{config.label}</Badge>;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
```

---

## 7. Integration Points

### 7.1 Retell AI API

**API base URL:** `https://api.retellai.com`

**Authentication:** Bearer token (`RETELL_API_KEY`) in Authorization header.

**Endpoints used:**

| Endpoint | Method | Purpose |
|---|---|---|
| `/v2/create-phone-call` | POST | Initiate outbound call to new lead |
| Webhook `call_ended` | Inbound POST | Receive call outcome + transcript |

**Retell `create-phone-call` request body:**

```json
{
  "from_number": "+1XXXXXXXXXX",
  "to_number": "+1XXXXXXXXXX",
  "override_agent_id": "optional-tenant-specific-agent-id",
  "metadata": {
    "tenant_id": "uuid",
    "lead_id": "uuid",
    "call_record_id": "uuid"
  }
}
```

**Critical:** `metadata` is passed through and returned in `call_ended` webhook. We use `call_record_id` to look up our pre-created `calls` row without needing a Retell call ID to row ID mapping.

**Retell webhook configuration:**
- URL: `https://app.rainmachine.io/api/webhooks/retell`
- Events: `call_ended` (minimum required). Optionally: `call_started` (for logging).
- Signature: HMAC-SHA256 using `RETELL_WEBHOOK_SECRET`

**Retell agent configuration (operational, not code):**

The Retell agent is configured in the Retell dashboard by Shomari. Key settings:
- Agent name: "RainMachine Lead AI"
- Voice: human-like, professional
- Prompt: Provided by Shomari based on real estate script
- Custom analysis data schema:
  ```json
  {
    "appointment_set": "boolean",
    "callback_requested": "boolean",
    "not_interested": "boolean",
    "wrong_number": "boolean",
    "voicemail": "boolean"
  }
  ```
  This tells Retell what to extract from the call and return in `call_analysis.custom_analysis_data`.

### 7.2 n8n Workflow: `new-lead-retell-trigger`

**Trigger:** GHL webhook with tag `new-lead` applied to contact.

```
[GHL Webhook Trigger]
  Filter: tags contains "new-lead"
  ↓
[Lookup tenant by locationId]
  ↓
[Guard: tenant active + Retell configured]
  Branch: tenants.status = 'active' AND tenants.retell_agent_id IS NOT NULL AND tenants.ai_enabled = true
  ↓ (pass)             ↓ (fail)
  Continue           → [Log: Retell not configured for tenant] → END
  ↓
[Guard: duplicate call check]
  Call Supabase RPC: check_duplicate_call(tenant_id, lead_id, 10)
  Branch: result = false (no recent call)
  ↓ (no duplicate)     ↓ (duplicate)
  Continue           → [Log: duplicate call skipped] → END
  ↓
[Pre-create calls row]
  POST Supabase /rest/v1/calls
  Body: { tenant_id, lead_id, status: "initiated" }
  Returns: { id: call_record_id }
  ↓
[2-second wait]
  (stagger for concurrent leads from same tenant)
  ↓
[POST Retell /v2/create-phone-call]
  Body: { from_number, to_number: lead.phone, override_agent_id: tenant.retell_agent_id, metadata: { tenant_id, lead_id, call_record_id } }
  ↓ (success)          ↓ (error)
  ↓                 → [Update calls.status = "failed"]
  ↓                 → [POST /api/webhooks/n8n-error]
  ↓                 → END
[Update calls.retell_call_id]
  POST Supabase /rest/v1/calls?id=eq.{call_record_id}
  Body: { retell_call_id: response.call_id }
```

**Concurrency guard logic:** The 2-second wait node uses n8n's built-in "Wait" node. For a tenant that gets 3 simultaneous leads, n8n fires 3 executions in parallel. Each execution checks `check_duplicate_call` before calling Retell. The 2-second stagger means execution 1 initiates at T+0, execution 2 at T+2, execution 3 at T+4. After execution 1 creates a call row at T+0, execution 2's duplicate check at T+2 will find the T+0 call and skip. This prevents 3 simultaneous calls to 3 different leads from interfering with each other's duplicate check, while the `check_duplicate_call` prevents double-calling the same lead.

**Note:** The 2-second stagger is per-execution, not global. If lead A and lead B arrive simultaneously (different phone numbers), both calls fire without collision. The guard only blocks same-lead duplicates.

### 7.3 n8n Workflow: `ghl-native-voice-appointment-noshow`

This is a separate workflow for warm contacts using GHL's native voice agent.

**Trigger:** GHL `appointment_no_show` event webhook.

```
[GHL Webhook: appointment_no_show]
  ↓
[Lookup tenant + lead]
  ↓
[Guard: tenant active]
  ↓
[POST GHL API: trigger GHL Native Voice Agent call]
  GHL API: POST /v1/conversations/voicecall
  Body: { contactId, agentScript: "appointment-noshow-followup" }
  ↓
[Log to calls table]
  status: initiated, notes: "GHL Native Voice — no-show follow-up"
```

**No Retell for warm contacts.** GHL Native Voice Agent is used here because:
1. The contact has an existing relationship with Marcus's team
2. GHL Native Voice can reference appointment history
3. Retell's aggressive outbound tone is inappropriate for a warm follow-up call

This workflow is simpler than the Retell workflow. It does not require the same concurrency guard because appointment no-shows are lower volume and not triggered by ad events.

---

## 8. BDD Scenarios

### Scenario 1: New Lead Triggers Retell Call

```
Given a tenant with status "active", retell_agent_id configured, and ai_enabled = true
And a new lead with a valid phone number exists in Supabase
When the "new-lead" tag is applied to the contact in GHL
Then the n8n workflow processes the webhook
And a calls row is created with status "initiated"
And the Retell API is called with the lead's phone number
And the calls row is updated with the Retell call_id
And the entire sequence completes within 60 seconds
```

### Scenario 2: Call Ended Webhook Updates Call Record

```
Given a calls row with status "initiated" and a valid retell_call_id
When Retell sends a call_ended webhook with call_status "ended"
And custom_analysis_data.appointment_set = true
Then the webhook handler validates the Retell signature
And updates calls.status to "completed"
And updates calls.outcome to "appointment_set"
And updates calls.duration_s to the call duration
And updates calls.transcript with the call transcript
And updates calls.ended_at with the call end time
And updates leads.ai_call_status to "completed"
```

### Scenario 3: Duplicate Call Guard — Same Lead, 10-Minute Window

```
Given a call was initiated for lead "Jane Smith" at 10:00am
When the same new-lead webhook fires again for "Jane Smith" at 10:05am
Then the duplicate call check finds the existing initiated call
And the n8n workflow exits without calling Retell
And NO second calls row is created
And a log entry notes "duplicate call skipped"
```

### Scenario 4: Duplicate Call Guard — Different Leads, Same Time

```
Given two different leads arrive simultaneously (different phone numbers)
When n8n processes both webhooks concurrently
Then both calls are initiated (no false positive duplicate detection)
And two separate calls rows exist with different lead_ids
```

### Scenario 5: Retell Not Configured for Tenant

```
Given a tenant with retell_agent_id = NULL or ai_enabled = false
When a new-lead webhook fires for that tenant
Then the n8n workflow guard check fails
And no Retell API call is made
And no calls row is created
And a log entry notes "Retell not configured for tenant"
```

### Scenario 6: Retell API Call Fails

```
Given the Retell API is temporarily unavailable
When n8n attempts to call Retell /v2/create-phone-call
Then the Retell API returns a non-200 response
And the n8n workflow routes to the error branch
And the pre-created calls row is updated to status "failed"
And an error notification is sent to /api/webhooks/n8n-error
And no duplicate call is attempted (the failed call record prevents retry within 10 minutes)
```

### Scenario 7: Voicemail Outcome

```
Given Retell reaches a voicemail for a lead
When the call_ended webhook arrives with call_status "voicemail_reached"
Then calls.status is set to "voicemail"
And calls.outcome is set to "voicemail"
And leads.ai_call_status is set to "voicemail"
```

### Scenario 8: Webhook Signature Verification Fails

```
Given an incoming request to /api/webhooks/retell
When the x-retell-signature header is missing or incorrect
Then the handler returns 401 Unauthorized
And no database writes occur
```

### Scenario 9: Call Log Page Shows Recent Calls

```
Given 5 completed calls exist for Tenant A
When a logged-in Marcus user navigates to /dashboard/calls
Then he sees up to 10 call log rows
And each row shows lead name, phone, outcome badge, and duration
And calls are ordered by initiated_at descending (most recent first)
```

### Scenario 10: GHL Native Voice No-Show Workflow

```
Given an appointment with status "no_show" fires a GHL webhook
When the ghl-native-voice-appointment-noshow workflow processes it
Then a GHL Native Voice call is initiated via GHL API
And a calls row is logged in Supabase with status "initiated"
And the call is NOT routed through Retell AI
```

---

## 9. Test Plan

### 9.1 Unit Tests

```typescript
// apps/dashboard/app/api/webhooks/retell/__tests__/route.test.ts
import { describe, it, expect, vi } from "vitest";

describe("Retell webhook handler", () => {
  it("returns 401 on invalid signature", async () => {
    // Mock invalid signature
    // Expect 401
  });

  it("ignores non-call_ended events", async () => {
    // POST with event: "call_started"
    // Expect 200 { received: true }
    // Expect no DB writes
  });

  it("maps RetellCallStatus to CallStatus correctly", () => {
    // Test all enum mappings
    // ended → completed
    // error → failed
    // voicemail_reached → voicemail
  });

  it("extracts appointment_set outcome from custom_analysis_data", () => {
    // Mock call_analysis with appointment_set: true
    // Expect outcome = "appointment_set"
  });

  it("extracts voicemail outcome from call_status when no analysis data", () => {
    // call_status: voicemail_reached, no custom_analysis_data
    // Expect outcome = "voicemail"
  });

  it("returns 200 and logs warning for unknown call_id", async () => {
    // Mock supabase returning no matching call
    // Expect 200 response (not 404 — prevents Retell retrying)
    // Expect console.warn
  });
});
```

```typescript
// packages/db/src/retell/__tests__/client.test.ts
describe("RetellClient", () => {
  it("sets Authorization header correctly", () => { /* ... */ });
  it("throws RetellApiError on non-200 response", async () => { /* ... */ });
  it("verifyWebhookSignature returns true for valid signature", () => { /* ... */ });
  it("verifyWebhookSignature returns false for tampered payload", () => { /* ... */ });
});
```

### 9.2 Integration Tests

```typescript
// apps/dashboard/__tests__/integration/retell-webhook.test.ts
import { describe, it, expect } from "vitest";
import { createServiceRoleClient } from "@rainmachine/db";
import crypto from "node:crypto";

const WEBHOOK_SECRET = process.env.RETELL_WEBHOOK_SECRET!;
const DASHBOARD_URL = "http://localhost:3000";
const TENANT_ID = process.env.TEST_TENANT_ID!;

function signPayload(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("F05 — Retell Webhook Integration", () => {
  const supabase = createServiceRoleClient();

  it("call_ended updates calls row and lead ai_call_status", async () => {
    // 1. Insert test lead
    const { data: lead } = await supabase
      .from("leads")
      .insert({ tenant_id: TENANT_ID, phone: "+15551234567" })
      .select("id")
      .single();

    // 2. Insert test calls row (simulating n8n pre-creation)
    const { data: callRow } = await supabase
      .from("calls")
      .insert({
        tenant_id: TENANT_ID,
        lead_id: lead!.id,
        retell_call_id: "retell-test-call-001",
        status: "initiated",
      })
      .select("id")
      .single();

    // 3. POST call_ended webhook
    const webhookBody = JSON.stringify({
      event: "call_ended",
      call_id: "retell-test-call-001",
      call_status: "ended",
      duration_ms: 125000,
      transcript: "Hi, this is RainMachine...",
      call_analysis: {
        custom_analysis_data: { appointment_set: true },
      },
      metadata: {
        tenant_id: TENANT_ID,
        lead_id: lead!.id,
        call_record_id: callRow!.id,
      },
    });

    const res = await fetch(`${DASHBOARD_URL}/api/webhooks/retell`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-retell-signature": signPayload(webhookBody, WEBHOOK_SECRET),
      },
      body: webhookBody,
    });

    expect(res.status).toBe(200);

    // 4. Verify DB state
    const { data: updatedCall } = await supabase
      .from("calls")
      .select("status, outcome, duration_s, transcript")
      .eq("id", callRow!.id)
      .single();

    expect(updatedCall?.status).toBe("completed");
    expect(updatedCall?.outcome).toBe("appointment_set");
    expect(updatedCall?.duration_s).toBe(125);
    expect(updatedCall?.transcript).toBe("Hi, this is RainMachine...");

    const { data: updatedLead } = await supabase
      .from("leads")
      .select("ai_call_status")
      .eq("id", lead!.id)
      .single();

    expect(updatedLead?.ai_call_status).toBe("completed");
  });

  it("duplicate call check prevents second call within 10 minutes", async () => {
    const { data: lead } = await supabase
      .from("leads")
      .insert({ tenant_id: TENANT_ID, phone: "+15557654321" })
      .select("id")
      .single();

    // Insert existing call for this lead (initiated 5 minutes ago)
    await supabase.from("calls").insert({
      tenant_id: TENANT_ID,
      lead_id: lead!.id,
      status: "initiated",
      initiated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    });

    // Check duplicate
    const { data: isDuplicate } = await supabase.rpc(
      "check_duplicate_call",
      { p_tenant_id: TENANT_ID, p_lead_id: lead!.id, p_window_minutes: 10 },
    );

    expect(isDuplicate).toBe(true);
  });
});
```

### 9.3 n8n Workflow Staging Tests (Manual)

**Checklist:**

- [ ] Trigger `new-lead` tag on a test contact in GHL staging → verify call log entry in Supabase
- [ ] Trigger same webhook twice → verify only 1 call row exists
- [ ] Trigger for tenant with `ai_enabled = false` → verify no Retell call
- [ ] Kill Retell test credentials → trigger workflow → verify calls row updated to "failed"
- [ ] Confirm real Retell call completes → verify transcript written to DB

### 9.4 E2E Playwright Test

```typescript
// apps/dashboard/e2e/calls-stub.spec.ts
import { test, expect } from "@playwright/test";

test("calls stub page renders call log rows", async ({ page }) => {
  // Requires auth + seed data
  await page.goto("/dashboard/calls");
  await expect(page.getByTestId("calls-stub-page")).toBeVisible();
  // If no calls seeded, expect empty state text
  await expect(page.getByText(/no calls yet|APPT SET|VOICEMAIL/i)).toBeVisible();
});
```

---

## 10. OWASP Security Checklist

### 10.1 Webhook Authentication (A07)

- [ ] **Retell signature verification** — Every request to `/api/webhooks/retell` is verified using HMAC-SHA256. `crypto.timingSafeEqual` prevents timing-based signature oracle attacks.
- [ ] **Raw body preserved** — Signature verification requires the exact raw body bytes. We read `req.text()` before parsing, not `req.json()`. Parsing first and re-stringifying would break the signature.
- [ ] **Secret storage** — `RETELL_WEBHOOK_SECRET` stored in Vercel environment variables (encrypted at rest). Not in code, not in `.env.local` committed to git.

### 10.2 Phone Number Handling (A02 + Privacy)

- [ ] **Phone numbers are PII.** They are stored in `leads.phone` (from GHL sync in F04). The Retell webhook handler does not log phone numbers.
- [ ] **No phone number in error logs** — The n8n error webhook handler stores the GHL payload in `sync_errors.payload`. If the GHL payload includes phone numbers, they will be stored in the DB. This is acceptable (same sensitivity level as `leads.phone`), but should not be logged to external services.
- [ ] **n8n logs** — Verify that n8n Cloud execution logs do not expose full phone numbers in plaintext. n8n Pro/Enterprise supports log masking for sensitive fields. Configure this for the `phone` field.

### 10.3 Race Condition Mitigation

- [ ] **Duplicate call guard** — The `check_duplicate_call` DB function uses a single query with a time window. This is not 100% atomic (a race condition where two executions check simultaneously could still produce a double call), but the 2-second stagger in n8n virtually eliminates this in practice. True atomic locking would require a SELECT FOR UPDATE or advisory lock pattern — deferred to a future cycle.

### 10.4 Retell API Key Security (A02)

- [ ] **`RETELL_API_KEY`** — Server-only env var (no `NEXT_PUBLIC_` prefix). Only used in n8n and server-side code. Never exposed to the browser.
- [ ] **Key rotation** — Retell API keys can be rotated in the Retell dashboard. Rotation requires updating the env var on n8n and the dashboard app simultaneously. Document this in the operational runbook.

### 10.5 Input Validation (A03)

- [ ] **Webhook payload Zod schema** — `callEndedSchema` validates all expected fields. Unknown fields are stripped (Zod default). Malformed payloads return 400 before any DB writes.
- [ ] **`transcript` field** — Text field, stored as-is. Rendered in F08 as escaped text (no HTML injection).
- [ ] **`recording_url` field** — Validated as URL by Zod. Stored as-is. If rendered in browser, use a trusted domain allowlist (Retell recording domain only) in F08.

---

## 11. Open Questions

### OQ-01 — Retell Agent Per Tenant vs. One Shared Agent?

**Question:** Should each tenant have their own Retell AI agent (with tenant-specific scripts), or do all tenants share one agent?

**Context:**
- One shared agent: simpler to manage, all tenants sound identical
- Per-tenant agent: each agent can be customized with the team leader's name, market (e.g., "Atlanta real estate"), and specific talking points

**How it works today:** `tenants.retell_agent_id` supports per-tenant agent IDs. If `retell_agent_id` is null, the workflow uses a default shared agent (from `RETELL_DEFAULT_AGENT_ID` env var).

**Recommendation:** Support per-tenant agents from day 1 (column already exists). Default to shared agent for initial clients. Give high-value clients a customized agent in onboarding.

**Decision gate:** F05 implementation + F06 onboarding (Step 2: Retell agent config creates per-tenant agent).

---

### OQ-02 — Call Retry Logic: If Retell Call Fails, Retry?

**Question:** If a Retell call fails (busy signal, temporary API error), should we automatically retry after a delay?

**Context:** Lead response time is critical. A failed call could mean a missed appointment.

**Options:**
- A: No retry — if call fails, Marcus sees "FAILED" in call log and can call manually
- B: Retry once after 10 minutes (use n8n "Wait" node + re-check `check_duplicate_call`)

**Recommendation:** Option B. Add a simple retry: if Retell call fails, update `calls.status = "failed"`, wait 10 minutes, re-check duplicate guard, retry once. After second failure, update to `status: "failed"` permanently and create a low-severity alert.

**Decision gate:** F05 n8n workflow implementation. Low-complexity addition.

---

### OQ-03 — Transcript Storage: Full Text vs. Chunked?

**Question:** Transcripts from 5+ minute calls can be 5,000–15,000 characters. PostgreSQL TEXT type handles this fine. Is there any need to chunk or compress?

**Context:** No chunking needed for storage. For the AI chat feature (F15), transcripts are passed to Claude — long transcripts increase token cost. F15 truncates to 5K chars in the UI but passes the full transcript to Claude. Claude's context window handles this.

**Recommendation:** Store full transcript in `calls.transcript`. No chunking. F08 truncates for display (5K chars + expand). F15 considers token budgets.

**Decision gate:** F05 implementation. No action required.

---

### OQ-04 — What Happens If `call_ended` Arrives Before `calls` Row Exists?

**Question:** n8n pre-creates the `calls` row before calling Retell. If n8n's Supabase write takes > 5 seconds (slow DB), Retell might fire `call_ended` before the row exists.

**Current handling:** The webhook handler falls back to looking up by `retell_call_id`. If no row is found, it logs a warning and returns 200 (so Retell doesn't retry).

**Risk:** Call outcome is lost if this race condition occurs.

**Mitigation:** n8n waits for Supabase to confirm the insert (the response includes the row ID which becomes `call_record_id` in metadata). The n8n workflow only proceeds to call Retell after the insert succeeds. The race condition window is effectively zero.

**Additional safety net:** If `call_ended` arrives and no row is found, create the row from the webhook payload. This handles the edge case.

**Decision gate:** F05 webhook handler implementation. Add the "create from webhook" fallback.

---

*PRD F05 — Retell AI Lead Response Workflow*
*Sigma Protocol Step 11 · MIRD AI Corporate Machine*
*Written: 2026-04-02 · Cycle 2 · Release 0*
*Depends on: F03 (schema + auth), F04 (leads data must exist)*
*Unlocks: F06, R1 leads features (F08)*

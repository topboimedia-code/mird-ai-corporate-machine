# Retell AI Integration — MIRD AI Corporate Machine
**Project:** RainMachine (by Make It Rain Digital)  
**Owner:** Shomari Williams  
**PRD Source:** F05 — Retell AI Lead Response Workflow  
**Status:** Cycle 2 (depends on F03 + F04 being complete first)

---

## What This Document Is

A complete breakdown of how Retell AI fits into the RainMachine system — the technical architecture, the data flow, what is handled by code, and what Shomari must configure manually. Written for handoff to another AI assistant with full context.

---

## Project Context

RainMachine is a multi-tenant SaaS platform for real estate team leaders. It combines done-for-you ad management with AI-powered lead follow-up. The system runs on:

- **Next.js 15** (App Router) + **Supabase** (PostgreSQL + Auth + Realtime)
- **n8n** (self-hosted on Railway) for cross-system workflow automation
- **GoHighLevel (GHL)** as the CRM/marketing layer
- **Retell AI** for outbound voice calls
- **Claude (Anthropic)** for internal business intelligence agents (never customer-facing)

The monorepo lives at `mird-ai-corporate-machine` with three apps:
- `apps/dashboard/` → `app.rainmachine.io` (client-facing CRM)
- `apps/ceo/` → `ceo.rainmachine.io` (Shomari's ops dashboard)
- `apps/onboarding/` → `onboard.rainmachine.io` (client setup wizard)

---

## The Three AI Systems — Critical Distinction

RainMachine has three AI systems that must never be conflated:

| System | Vendor | Who It Talks To | Trigger |
|--------|--------|-----------------|---------|
| **Retell AI** | Retell | External prospects (cold) | New lead tag in GHL |
| **GHL Native Voice** | GoHighLevel | Warm contacts | Appointment no-show / confirmation |
| **Claude Agents** | Anthropic | Nobody — internal only | pg_cron schedule |

Retell AI handles **cold outbound only**. GHL Native Voice handles **warm follow-up**. Claude agents **never make calls**.

---

## What Retell AI Does in This System

When a new lead submits a Facebook (or Google) ad form, they expect a response fast. The industry benchmark is under 5 minutes — most brokerages call back hours later and lose the lead. Retell AI closes that gap.

**Core behavior:** A lead gets a phone call within 60 seconds of being tagged `new-lead` in GHL. Retell AI handles the conversation, extracts outcomes (appointment set, callback requested, not interested, etc.), and writes the transcript back to Supabase. The team leader sees the result in their dashboard — they never touch the call.

---

## End-to-End Data Flow

```
1. Lead submits ad form (Facebook / Google / web)
         ↓
2. GHL receives contact → automation applies tag "new-lead"
         ↓
3. GHL fires webhook → n8n workflow "new-lead-retell-trigger"
         ↓
4. n8n guard #1: Is tenant active + retell_agent_id configured + ai_enabled = true?
         → NO  → log "Retell not configured" → END
         → YES → continue
         ↓
5. n8n guard #2: Was this lead called in the last 10 minutes?
         → YES → log "duplicate call skipped" → END
         → NO  → continue
         ↓
6. n8n pre-creates a `calls` row in Supabase
         { tenant_id, lead_id, status: "initiated" }
         Returns: call_record_id (used for idempotency)
         ↓
7. n8n waits 2 seconds (stagger for concurrent leads)
         ↓
8. n8n POST → Retell /v2/create-phone-call
         { from_number, to_number: lead.phone,
           override_agent_id: tenant.retell_agent_id,
           metadata: { tenant_id, lead_id, call_record_id } }
         ↓ success              ↓ error
         continue          → update calls.status = "failed"
                           → POST /api/webhooks/n8n-error → END
         ↓
9. n8n updates calls.retell_call_id with Retell's returned call_id
         ↓
10. Retell AI calls the lead, handles the conversation
         ↓
11. Call ends → Retell fires POST to:
        https://app.rainmachine.io/api/webhooks/retell
         ↓
12. Webhook handler:
        a. Reads raw body (must be raw — not parsed — for signature verification)
        b. Verifies HMAC-SHA256 signature (x-retell-signature header)
           → invalid → return 401, no DB writes
        c. Parses + Zod-validates payload
        d. Maps Retell call_status → internal CallStatus
        e. Extracts outcome from call_analysis.custom_analysis_data
        f. Updates calls row: status, outcome, duration_s, transcript,
           recording_url, ended_at
        g. Updates leads.ai_call_status
         ↓
13. Supabase Realtime broadcasts the calls table update
14. Dashboard (F07+) reflects outcome in real time
```

---

## Call Status + Outcome Mapping

### Retell Status → Internal Status

| Retell `call_status` | Internal `CallStatus` |
|---------------------|-----------------------|
| `ended` | `completed` |
| `error` | `failed` |
| `voicemail_reached` | `voicemail` |
| `registered` | `initiated` |
| `ongoing` | `in_progress` |

### Retell `custom_analysis_data` → Outcome

Retell's AI fills this based on the agent prompt instructions. The schema you configure in the Retell dashboard:

```json
{
  "appointment_set": "boolean",
  "callback_requested": "boolean",
  "not_interested": "boolean",
  "wrong_number": "boolean",
  "voicemail": "boolean"
}
```

Priority order in code (first truthy wins):
1. `appointment_set` → `"appointment_set"`
2. `callback_requested` → `"callback_requested"`
3. `wrong_number` → `"wrong_number"`
4. `not_interested` → `"not_interested"`
5. `voicemail` → `"voicemail"`
6. Fallback: `call_status === "voicemail_reached"` → `"voicemail"`
7. Default: `"other"`

---

## Database

### `calls` Table (created in F03 migration)

F05 adds no new tables — it only adds write logic. The `calls` table schema (relevant columns):

```sql
CREATE TABLE calls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  retell_call_id  TEXT,                          -- set after Retell responds
  status          TEXT NOT NULL DEFAULT 'initiated',
  outcome         TEXT,                          -- appointment_set, voicemail, etc.
  duration_s      INTEGER,
  transcript      TEXT,
  recording_url   TEXT,
  initiated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Duplicate Call Guard (DB function added in F05)

```sql
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
```

n8n calls this via Supabase RPC before triggering Retell. Returns `true` = duplicate, skip. Returns `false` = safe to call.

---

## Files F05 Builds (Code)

| File | What It Does |
|------|-------------|
| `apps/dashboard/app/api/webhooks/retell/route.ts` | Webhook handler — receives `call_ended`, verifies signature, writes to DB |
| `packages/db/src/types/calls.types.ts` | TypeScript interfaces for Retell webhook payload, API request/response, call log entry |
| `packages/db/src/retell/client.ts` | `RetellClient` class — wraps `createPhoneCall` + `verifyWebhookSignature` |
| `apps/dashboard/app/dashboard/calls/page.tsx` | Stub call log page at `/dashboard/calls` — shows last 10 calls with outcome badges |
| `supabase/migrations/0008_call_guard.sql` | Adds `check_duplicate_call` function + index |

The n8n workflow (`new-lead-retell-trigger`) is built in the n8n UI — not a file in this repo. The PRD documents the exact node-by-node logic.

---

## What Shomari Must Do Manually

### One-Time Account Setup

- [ ] Create a Retell AI account
- [ ] Get `RETELL_API_KEY` from Retell dashboard
- [ ] Purchase/provision a phone number in Retell → `RETELL_FROM_NUMBER`
- [ ] Generate a webhook signing secret → `RETELL_WEBHOOK_SECRET`

### Build the Retell Agent (Retell Dashboard UI — No Code)

- [ ] Create an agent named "RainMachine Lead AI"
- [ ] Choose voice and set personality to professional outbound
- [ ] Write the conversation script/prompt (real estate focus — use lead's name, market)
- [ ] Configure the **custom analysis data schema** exactly as shown:
  ```json
  {
    "appointment_set": "boolean",
    "callback_requested": "boolean",
    "not_interested": "boolean",
    "wrong_number": "boolean",
    "voicemail": "boolean"
  }
  ```
  This is what Retell sends back in `call_analysis.custom_analysis_data`. Without this, outcome extraction won't work.
- [ ] Save the agent ID → goes into `tenants.retell_agent_id` per client (or `RETELL_DEFAULT_AGENT_ID` env var for shared agent)

### Configure Webhook in Retell Dashboard

- [ ] Set webhook URL: `https://app.rainmachine.io/api/webhooks/retell`
- [ ] Enable event: `call_ended` (minimum required)
- [ ] Copy the signing secret → `RETELL_WEBHOOK_SECRET`

### Add Env Vars to Vercel (dashboard app)

```
RETELL_API_KEY=
RETELL_WEBHOOK_SECRET=
RETELL_FROM_NUMBER=
RETELL_DEFAULT_AGENT_ID=
```

### Build the n8n Workflow

In n8n (self-hosted on Railway), build `new-lead-retell-trigger` with these nodes in order:

1. **GHL Webhook Trigger** — filter: tags contains `new-lead`
2. **Lookup tenant** by GHL `locationId` → Supabase query
3. **Guard: tenant active** — check `tenants.status = 'active' AND retell_agent_id IS NOT NULL AND ai_enabled = true`
4. **Guard: duplicate call** — Supabase RPC `check_duplicate_call(tenant_id, lead_id, 10)`
5. **Pre-create calls row** — POST to Supabase `/rest/v1/calls` with `status: "initiated"` → capture `call_record_id`
6. **Wait 2 seconds**
7. **POST to Retell** `/v2/create-phone-call` with `from_number`, `to_number`, `override_agent_id`, `metadata`
8. **On success** → PATCH calls row with `retell_call_id`
9. **On error** → PATCH calls row to `status: "failed"` → POST error to `/api/webhooks/n8n-error`

Also build `ghl-native-voice-appointment-noshow` separately (different workflow — GHL Native Voice for warm contacts, not Retell).

### Manual Staging Tests (Before Going Live)

- [ ] Trigger `new-lead` tag on a test GHL contact → verify `calls` row appears in Supabase with `status: "initiated"`
- [ ] Trigger same webhook twice within 10 minutes → verify only 1 `calls` row exists
- [ ] Set `ai_enabled = false` on test tenant → trigger webhook → verify no Retell call fires
- [ ] Use invalid Retell credentials → trigger workflow → verify `calls.status` updates to `"failed"`
- [ ] Let a real test call complete → verify `transcript`, `outcome`, `duration_s` all written to DB
- [ ] Verify `/dashboard/calls` page shows the completed call with correct outcome badge

---

## Per-Client Setup (Repeated for Each New Tenant)

When onboarding a new client (F06 handles this automatically later, but manually for now):

1. Create a Retell agent for that client (or use the shared default)
2. Set `tenants.retell_agent_id` to the agent ID in Supabase
3. Set `tenants.ai_enabled = true`
4. Verify `tenants.status = 'active'`

The n8n workflow reads these values per `locationId` (the GHL sub-account ID). If `retell_agent_id` is null, it falls back to `RETELL_DEFAULT_AGENT_ID`.

---

## The Warm Contact Flow (GHL Native Voice — Separate System)

For appointment no-shows and confirmation calls, Retell is NOT used. GHL's native voice agent is used instead:

**Trigger:** GHL fires `appointment_no_show` event  
**Flow:** n8n workflow `ghl-native-voice-appointment-noshow` → POST GHL API to trigger GHL Native Voice call → log to `calls` table with `notes: "GHL Native Voice — no-show follow-up"`

Reasons Retell is not used here:
- The contact has an existing relationship with the team
- GHL Native Voice can reference appointment history
- Retell's aggressive outbound tone is wrong for a warm follow-up

---

## Security Checklist

- **Webhook signature** — every incoming request verified via HMAC-SHA256 before any DB write. Uses `crypto.timingSafeEqual` to prevent timing oracle attacks.
- **Raw body preservation** — `req.text()` is called before `JSON.parse()`. Re-stringifying a parsed payload changes byte order and breaks signature verification.
- **`RETELL_API_KEY` is server-only** — no `NEXT_PUBLIC_` prefix, never touches the client bundle.
- **Phone numbers are PII** — not logged to external services. Stored only in `leads.phone` (DB level).
- **Zod validation** — all webhook payloads are schema-validated before DB writes. Malformed payloads return 400.

---

## Open Questions (From PRD)

| # | Question | Recommendation |
|---|----------|---------------|
| OQ-01 | One shared Retell agent vs. per-tenant agents? | Support both — `tenants.retell_agent_id` is nullable. Default to shared, give custom to high-value clients. |
| OQ-02 | Auto-retry if Retell call fails? | Retry once after 10 minutes via n8n Wait node. After second failure → permanent `"failed"` + CEO alert. |
| OQ-03 | Store full transcript or chunk it? | Full text in `calls.transcript`. F08 truncates for display. F15 handles token budgets when passing to Claude. |
| OQ-04 | What if `call_ended` webhook arrives before `calls` row exists? | Webhook handler falls back to lookup by `retell_call_id`. If still not found → create row from webhook payload as safety net. |

---

## Build Order Dependency

F05 cannot be built until:
- **F03** (Supabase + Auth) — `calls` table + RLS policies are defined here
- **F04** (GHL ↔ Supabase sync) — `leads` table must be populated before Retell can call anyone

F05 unlocks:
- **F06** (Onboarding job processor) — Step 2 provisions a per-tenant Retell agent
- **F08** (Leads) — call transcript accessible via lead detail slide-over

---

*Source: docs/prds/F05-retell-ai-workflow.md + docs/MASTER_PRD.md*  
*Generated: 2026-05-12*

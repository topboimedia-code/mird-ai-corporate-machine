# n8n Workflow: `ghl-to-supabase-sync`
# F04 — GHL ↔ Supabase Data Sync
# Decision: n8n Cloud (OQ-01 — use Cloud for all of R0)

---

## Overview

This workflow listens for GHL contact and appointment webhook events and upserts them
into Supabase. It also calls `upsert_daily_metrics` after each successful write so the
dashboard Realtime counter updates immediately (OQ-03 decision: real-time rollup).

**Trigger:** GHL Webhook (push)
**Error handler:** Built-in n8n Error Workflow → `POST /api/webhooks/n8n-error`

---

## Environment Variables (n8n Cloud)

| Variable | Description |
|---|---|
| `DASHBOARD_URL` | `https://app.rainmachine.io` (or staging URL) |
| `N8N_WEBHOOK_SECRET` | Shared secret — must match dashboard `N8N_WEBHOOK_SECRET` env var |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS for upserts) |
| `GHL_WEBHOOK_SECRET` | GHL HMAC secret for signature validation |

---

## Workflow Nodes

### Node 1: GHL Webhook Trigger
- Type: Webhook
- URL: `https://[n8n-instance]/webhook/ghl-contact-sync`
- Method: POST
- GHL events to enable per sub-account: `Contact Created`, `Contact Updated`, `Appointment Created`, `Appointment Updated`

### Node 2: Validate GHL Signature
- Type: Code (JavaScript)
- Validates `X-GHL-Signature` HMAC-SHA256 against `GHL_WEBHOOK_SECRET`
- Rejects invalid signatures → routes to Error Branch

### Node 3: Lookup Tenant by locationId
- Type: HTTP Request → Supabase REST API
- `GET /rest/v1/tenants?ghl_sub_account_id=eq.{{ $json.locationId }}&select=id,stage_tag_mapping`
- If no tenant found → route to Error Branch with `webhook_parse_error`

### Node 4: Route by Event Type
- Type: Switch
- `ContactCreate` / `ContactUpdate` → Lead Branch
- `AppointmentCreate` / `AppointmentUpdate` → Appointment Branch
- `*Delete` → No-op (log and exit)

---

## Lead Branch

### Node 5L: Map Contact Fields
- Type: Code (JavaScript)

```javascript
const contact = $json.contact;
const tenant = $('Lookup Tenant').first().json;

// Source mapping
const SOURCE_MAP = {
  'Facebook Ad': 'meta_ads', 'Facebook Ads': 'meta_ads', 'Meta Ads': 'meta_ads',
  'Google Ad': 'google_ads', 'Google Ads': 'google_ads',
  'Referral': 'referral', 'Organic': 'organic',
};

// Stage tag mapping (per-tenant, stored in tenants.stage_tag_mapping)
const stageMap = tenant.stage_tag_mapping ?? {};
const firstMappedTag = (contact.tags ?? [])
  .map(tag => stageMap[tag])
  .find(stage => stage !== undefined);

return [{
  json: {
    tenant_id: tenant.id,
    ghl_contact_id: contact.id,
    first_name: contact.firstName ?? null,
    last_name: contact.lastName ?? null,
    email: contact.email ?? null,
    phone: contact.phone,   // required — validated next
    source: SOURCE_MAP[contact.source] ?? 'other',
    stage: firstMappedTag ?? 'new',
    last_activity_at: new Date().toISOString(),
  }
}];
```

### Node 6L: Guard — Phone Required
- Type: IF
- Condition: `{{ $json.phone }}` is not empty
- False branch → Error Branch with `webhook_parse_error` ("Lead skipped: no phone number")

### Node 7L: Upsert Lead
- Type: HTTP Request → Supabase REST API
- URL: `{{ $env.SUPABASE_URL }}/rest/v1/leads`
- Method: POST
- Headers:
  - `Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}`
  - `apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}`
  - `Prefer: resolution=merge-duplicates,return=representation`
  - `Content-Type: application/json`
- Body: `{{ $json }}` (mapped fields from Node 5L)
- On error → Error Branch with `lead_upsert_error`

**Idempotency:** `Prefer: resolution=merge-duplicates` + `UNIQUE(ghl_contact_id)` constraint
means duplicate webhooks update the row instead of inserting a new one.

### Node 8L: Trigger Metrics Rollup
- Type: HTTP Request → Supabase REST API
- URL: `{{ $env.SUPABASE_URL }}/rest/v1/rpc/upsert_daily_metrics`
- Method: POST
- Body: `{ "p_tenant_id": "{{ $('Lookup Tenant').first().json.id }}" }`
- On error → Error Branch with `metrics_rollup_error`

---

## Appointment Branch

### Node 5A: Map Appointment Fields
- Type: Code (JavaScript)

```javascript
const appt = $json.appointment;
const tenant = $('Lookup Tenant').first().json;

const STATUS_MAP = {
  scheduled: 'scheduled', confirmed: 'confirmed',
  showed: 'held', noshow: 'no_show', cancelled: 'cancelled',
};

return [{
  json: {
    ghl_appointment_id: appt.id,
    ghl_contact_id: appt.contactId,   // used to look up lead_id
    ghl_user_id: appt.userId ?? null, // used to look up agent_id
    tenant_id: tenant.id,
    scheduled_at: appt.startTime,
    status: STATUS_MAP[appt.appointmentStatus] ?? 'scheduled',
  }
}];
```

### Node 6A: Lookup Lead by ghl_contact_id
- Type: HTTP Request → Supabase REST API
- `GET /rest/v1/leads?ghl_contact_id=eq.{{ $json.ghl_contact_id }}&select=id`
- If no lead found → Error Branch with `appointment_upsert_error` ("Unknown contact ID")

### Node 7A: Lookup Agent by ghl_user_id (optional)
- Type: HTTP Request → Supabase REST API
- `GET /rest/v1/agents?ghl_user_id=eq.{{ $json.ghl_user_id }}&select=id`
- If not found → continue with `agent_id: null` (not an error)

### Node 8A: Upsert Appointment
- Type: HTTP Request → Supabase REST API
- URL: `{{ $env.SUPABASE_URL }}/rest/v1/appointments`
- Method: POST
- Headers: same as Node 7L + `Prefer: resolution=merge-duplicates`
- Body:
  ```json
  {
    "tenant_id": "...",
    "lead_id": "...",
    "agent_id": "...",
    "ghl_appointment_id": "...",
    "scheduled_at": "...",
    "status": "..."
  }
  ```
- On error → Error Branch with `appointment_upsert_error`

### Node 9A: Trigger Metrics Rollup
- Same as Node 8L

---

## Error Branch

### Node E1: Build Error Payload
- Type: Set
- Fields:
  - `workflowName`: `{{ $workflow.name }}`
  - `executionId`: `{{ $execution.id }}`
  - `errorMessage`: `{{ $execution.lastNodeExecuted.error.message ?? "Unknown error" }}`
  - `errorType`: `{{ $execution.lastNodeExecuted.parameters.errorType ?? "unknown" }}`
  - `tenantId`: `{{ $('Lookup Tenant').first().json.id ?? undefined }}`
  - `timestamp`: `{{ $now }}`

### Node E2: POST to n8n Error Webhook
- Type: HTTP Request
- URL: `{{ $env.DASHBOARD_URL }}/api/webhooks/n8n-error`
- Method: POST
- Headers:
  - `Content-Type: application/json`
  - `x-webhook-secret: {{ $env.N8N_WEBHOOK_SECRET }}`
- Body: `{{ $json }}`

---

## n8n Error Workflow (Separate)

n8n has a built-in "Error Workflow" feature. Configure this workflow as the error
handler for `ghl-to-supabase-sync` in n8n settings.

**Nodes:**
1. Error Trigger (built-in)
2. Set — extract `workflowName`, `executionId`, `errorMessage`, `timestamp`
3. HTTP Request → POST to `{{ $env.DASHBOARD_URL }}/api/webhooks/n8n-error`

---

## Manual Test Checklist (staging)

- [ ] Trigger ContactCreate webhook with valid payload → lead upserted in Supabase
- [ ] Trigger ContactCreate twice with same `contact.id` → exactly 1 lead row exists
- [ ] Trigger ContactCreate without phone → `sync_error` written, no lead created
- [ ] Trigger AppointmentCreate with valid `contactId` → appointment linked to correct lead
- [ ] Trigger AppointmentCreate with unknown `contactId` → `sync_error` written
- [ ] Trigger webhook with unknown `locationId` → `sync_error` written
- [ ] Fire 4+ error webhooks manually → `alerts` row created in Supabase
- [ ] Fire 5th error → second alert NOT created (idempotency check)
- [ ] Open `/dashboard/sync-test` → trigger metrics upsert → counter increments within 2s

---

## Source Mapping Reference

| GHL `contact.source` | Supabase `lead_source` |
|---|---|
| `Facebook Ad`, `Facebook Ads`, `Meta Ads` | `meta_ads` |
| `Google Ad`, `Google Ads` | `google_ads` |
| `Referral` | `referral` |
| `Organic` | `organic` |
| *(anything else)* | `other` |

## Appointment Status Mapping Reference

| GHL `appointmentStatus` | Supabase `appointment_status` |
|---|---|
| `scheduled` | `scheduled` |
| `confirmed` | `confirmed` |
| `showed` | `held` |
| `noshow` | `no_show` |
| `cancelled` | `cancelled` |

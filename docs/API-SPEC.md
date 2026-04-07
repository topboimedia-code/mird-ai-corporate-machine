# API-SPEC.md — Make It Rain Digital (MIRD)
## RainMachine Platform — API Specification

**Version:** 1.0
**Date:** 2026-03-29
**Base URLs:**
- Dashboard API: `https://dashboard.rainmachine.io/api`
- CEO Dashboard API: `https://ceo.rainmachine.io/api`
- Onboarding Portal API: `https://onboarding.rainmachine.io/api`
- Supabase Edge Functions: `https://[project-ref].supabase.co/functions/v1`

**Authentication:** All endpoints require a valid Supabase JWT in `Authorization: Bearer <token>` unless marked `[TOKEN]` (uses access token) or `[WEBHOOK]` (uses HMAC signature verification).

---

## Table of Contents

1. [Webhook Handlers](#1-webhook-handlers)
2. [Dashboard Data Endpoints](#2-dashboard-data-endpoints)
3. [Lead Routing Endpoints](#3-lead-routing-endpoints)
4. [Claude AI Report Generation Endpoints](#4-claude-ai-report-generation-endpoints)
5. [Client Management Endpoints](#5-client-management-endpoints)
6. [Onboarding Portal Endpoints](#6-onboarding-portal-endpoints)
7. [CEO Dashboard Endpoints](#7-ceo-dashboard-endpoints)
8. [Common Patterns](#8-common-patterns)

---

## 1. Webhook Handlers

All webhook handlers live as **Supabase Edge Functions**. They receive events, verify signatures, log to `webhooks_log`, and trigger n8n workflows asynchronously.

---

### `POST /functions/v1/webhooks/ghl` [WEBHOOK]

**Source:** GoHighLevel
**Auth:** HMAC-SHA256 signature in `X-GHL-Signature` header

**Supported event types:**
- `contact.created`
- `contact.updated`
- `appointment.created`
- `appointment.status_changed`
- `opportunity.status_changed`
- `form.submitted`
- `call.status_changed`

**Request headers:**
```
X-GHL-Signature: sha256=<hmac_hex>
Content-Type: application/json
```

**Request body (example — contact.created):**
```json
{
  "type": "contact.created",
  "locationId": "abc123locationId",
  "contact": {
    "id": "ghl_contact_id_xyz",
    "firstName": "Marcus",
    "lastName": "Johnson",
    "email": "marcus@example.com",
    "phone": "+14045551234",
    "tags": ["meta-lead", "buyer"],
    "customFields": {
      "utm_source": "facebook",
      "utm_campaign": "seller-leads-atlanta"
    },
    "dateAdded": "2026-03-29T08:00:00.000Z"
  }
}
```

**Response (success):**
```json
{
  "received": true,
  "webhook_log_id": "uuid",
  "n8n_triggered": true
}
```

**Response (signature failure):**
```json
{
  "error": "invalid_signature",
  "message": "HMAC signature verification failed"
}
```
HTTP 401

**Processing logic:**
1. Verify `X-GHL-Signature` against `WEBHOOK_SECRET_GHL` using HMAC-SHA256
2. Insert into `webhooks_log` (status: 'received')
3. Resolve `organization_id` from `locationId` via `ghl_accounts` table
4. POST to n8n webhook URL for the event type (async, no await)
5. Return 200 immediately

---

### `POST /functions/v1/webhooks/retell` [WEBHOOK]

**Source:** Retell AI
**Auth:** `X-Retell-Signature` header (HMAC-SHA256)

**Supported event types:**
- `call_started`
- `call_ended`
- `call_analyzed` (post-call analysis available)

**Request body (call.ended):**
```json
{
  "event": "call_ended",
  "call": {
    "call_id": "retell_call_abc123",
    "agent_id": "retell_agent_xyz",
    "call_status": "ended",
    "direction": "outbound",
    "from_number": "+14045550001",
    "to_number": "+14045551234",
    "start_timestamp": 1711699200000,
    "end_timestamp": 1711699380000,
    "duration_ms": 180000,
    "disconnection_reason": "agent_hangup",
    "transcript": "Agent: Hi, is this Marcus? ...",
    "transcript_object": [
      { "role": "agent", "content": "Hi, is this Marcus?", "words": [] },
      { "role": "user", "content": "Yes, this is Marcus.", "words": [] }
    ],
    "recording_url": "https://storage.retellai.com/recordings/abc123.mp3",
    "call_analysis": {
      "call_summary": "Called Marcus about buyer leads. Expressed interest.",
      "user_sentiment": "Positive",
      "agent_sentiment": "Positive",
      "call_successful": true,
      "custom_analysis_data": {
        "outcome": "interested",
        "appointment_requested": true,
        "lead_id": "supabase-lead-uuid",
        "org_id": "supabase-org-uuid"
      }
    },
    "metadata": {
      "lead_id": "supabase-lead-uuid",
      "org_id": "supabase-org-uuid",
      "ghl_contact_id": "ghl_contact_id_xyz"
    }
  }
}
```

**Response (success):**
```json
{
  "received": true,
  "call_logged": true,
  "ai_call_id": "supabase-ai-call-uuid"
}
```

**Processing logic:**
1. Verify `X-Retell-Signature`
2. Upsert `ai_calls` record (key on `retell_call_id`)
3. Update `leads.status` based on outcome
4. Trigger n8n Post-Call Router workflow
5. Return 200

---

### `POST /functions/v1/webhooks/meta` [WEBHOOK]

**Source:** Meta (ad lead gen form webhook)
**Auth:** `X-Hub-Signature-256` header (Meta standard)

**Supported events:**
- `leadgen` — new lead from Meta Lead Ad form

**Request body:**
```json
{
  "object": "page",
  "entry": [
    {
      "id": "page_id",
      "time": 1711699200,
      "changes": [
        {
          "value": {
            "form_id": "meta_form_id_123",
            "leadgen_id": "meta_lead_id_456",
            "page_id": "meta_page_id",
            "ad_id": "meta_ad_id_789",
            "adgroup_id": "meta_adset_id",
            "campaign_id": "meta_campaign_id",
            "created_time": 1711699200
          },
          "field": "leadgen"
        }
      ]
    }
  ]
}
```

**Note:** Meta lead gen webhooks only contain IDs. The Edge Function must call `GET /leadgen/{leadgen_id}` to retrieve lead data.

**Response:** HTTP 200 with `{"received": true}` (Meta requires fast response)

---

### `POST /functions/v1/webhooks/google-ads` [WEBHOOK]

**Source:** Google Ads conversion tracking (Offline Conversion Import)
**Auth:** Service account token in `Authorization` header

**Body:** Google's standard Offline Conversion format
**Processing:** Log to `webhooks_log`, trigger n8n for Supabase sync

---

## 2. Dashboard Data Endpoints

All dashboard endpoints require authenticated session (client_admin or agent role).

---

### `GET /api/dashboard/overview`

Returns the North Star metrics for the client's dashboard home screen.

**Auth:** client_admin, agent (agents see filtered view)

**Query params:**
```
?period=last_7d|last_30d|this_month|custom
&from=2026-03-01   (required if period=custom)
&to=2026-03-29     (required if period=custom)
```

**Response:**
```json
{
  "period": {
    "label": "Last 7 Days",
    "from": "2026-03-22",
    "to": "2026-03-29"
  },
  "leads": {
    "total": 47,
    "new": 12,
    "by_source": {
      "meta_ads": 28,
      "google_ads": 11,
      "organic": 4,
      "other": 4
    },
    "delta_pct": 15.2
  },
  "calls": {
    "total": 38,
    "connected": 22,
    "connect_rate": 0.579,
    "outcomes": {
      "interested": 14,
      "voicemail": 9,
      "no_answer": 7,
      "not_interested": 6,
      "error": 2
    }
  },
  "appointments": {
    "scheduled": 11,
    "confirmed": 9,
    "completed": 7,
    "no_show": 2,
    "show_rate": 0.778,
    "book_rate": 0.368
  },
  "pipeline_value": {
    "total_cents": 15000000,
    "active_opportunities": 8
  },
  "ad_spend": {
    "total_cents": 420000,
    "blended_cpl_cents": 8936,
    "meta_spend_cents": 280000,
    "google_spend_cents": 140000
  }
}
```

---

### `GET /api/dashboard/leads`

Paginated lead list with filtering.

**Query params:**
```
?page=1
&limit=25
&status=new|call_queued|appointment_scheduled|...
&source=meta_ads|google_ads|...
&assigned_agent_id=uuid
&search=marcus
&from=2026-03-01
&to=2026-03-29
&sort=created_at|updated_at|status
&order=desc|asc
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "full_name": "Marcus Johnson",
      "email": "marcus@example.com",
      "phone": "+14045551234",
      "status": "appointment_scheduled",
      "source": "meta_ads",
      "created_at": "2026-03-28T14:22:00Z",
      "assigned_agent": {
        "id": "uuid",
        "full_name": "Sarah Williams"
      },
      "last_call": {
        "id": "uuid",
        "call_system": "retell_ai",
        "outcome": "interested",
        "initiated_at": "2026-03-28T14:25:00Z"
      },
      "appointment": {
        "id": "uuid",
        "scheduled_at": "2026-03-30T10:00:00Z",
        "status": "scheduled"
      },
      "ghl_contact_id": "ghl_contact_id_xyz"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 143,
    "total_pages": 6
  }
}
```

---

### `GET /api/dashboard/leads/:id`

Full lead detail with call history and appointment history.

**Response:**
```json
{
  "lead": {
    "id": "uuid",
    "full_name": "Marcus Johnson",
    "email": "marcus@example.com",
    "phone": "+14045551234",
    "status": "appointment_scheduled",
    "source": "meta_ads",
    "source_campaign": {
      "id": "uuid",
      "name": "Atlanta Seller Leads - March 2026",
      "platform": "meta"
    },
    "tags": ["buyer", "warm"],
    "custom_fields": {},
    "created_at": "2026-03-28T14:22:00Z",
    "assigned_agent": { "id": "uuid", "full_name": "Sarah Williams" }
  },
  "calls": [
    {
      "id": "uuid",
      "call_system": "retell_ai",
      "direction": "outbound",
      "outcome": "interested",
      "duration_seconds": 187,
      "initiated_at": "2026-03-28T14:25:00Z",
      "ai_summary": "Lead expressed strong interest in selling current home. Has 2-3 month timeline. Requested appointment.",
      "key_topics": ["seller", "timeline", "price range"],
      "recording_url": "https://storage.retellai.com/recordings/abc123.mp3"
    }
  ],
  "appointments": [
    {
      "id": "uuid",
      "scheduled_at": "2026-03-30T10:00:00Z",
      "status": "scheduled",
      "assigned_agent": { "id": "uuid", "full_name": "Sarah Williams" }
    }
  ]
}
```

---

### `GET /api/dashboard/campaigns`

Ad campaign performance for the client.

**Query params:**
```
?platform=meta|google|all
&period=last_7d|last_30d|this_month
```

**Response:**
```json
{
  "period": { "from": "2026-03-22", "to": "2026-03-29" },
  "summary": {
    "total_spend_cents": 420000,
    "total_leads": 39,
    "blended_cpl_cents": 10769,
    "total_impressions": 84200,
    "total_clicks": 1247
  },
  "campaigns": [
    {
      "id": "uuid",
      "platform": "meta",
      "name": "Atlanta Seller Leads - Spring 2026",
      "status": "active",
      "spend_cents": 180000,
      "leads": 22,
      "cpl_cents": 8182,
      "impressions": 42000,
      "clicks": 680,
      "ctr": 0.0162,
      "reach": 31400
    }
  ]
}
```

---

### `GET /api/dashboard/agents`

Agent roster and performance for the client's team.

**Response:**
```json
{
  "agents": [
    {
      "id": "uuid",
      "full_name": "Sarah Williams",
      "email": "sarah@marcusrealty.com",
      "is_active": true,
      "seat_active": true,
      "performance": {
        "leads_assigned": 24,
        "appointments_booked": 8,
        "appointments_completed": 6,
        "deals_closed": 2,
        "show_rate": 0.75,
        "close_rate": 0.333
      }
    }
  ],
  "seats": {
    "plan_limit": 5,
    "active_seats": 3,
    "available": 2
  }
}
```

---

## 3. Lead Routing Endpoints

These endpoints are called by n8n workflows — not by UI clients directly.

---

### `POST /api/leads/route` [INTERNAL — n8n only]

Routes an incoming lead to the correct AI system (Retell or GHL Native Voice).

**Auth:** Service role key in `X-Service-Key` header

**Request:**
```json
{
  "ghl_contact_id": "ghl_contact_id_xyz",
  "ghl_location_id": "abc123locationId",
  "contact": {
    "firstName": "Marcus",
    "lastName": "Johnson",
    "phone": "+14045551234",
    "email": "marcus@example.com",
    "tags": ["meta-lead"],
    "source": "meta_ads"
  },
  "event_type": "contact.created"
}
```

**Response:**
```json
{
  "lead_id": "supabase-uuid",
  "routing_decision": "retell_ai",
  "routing_reason": "new_contact_no_prior_interactions",
  "retell_call_params": {
    "agent_id": "retell_agent_xyz",
    "from_number": "+14045550001",
    "to_number": "+14045551234",
    "metadata": {
      "lead_id": "supabase-uuid",
      "org_id": "org-uuid",
      "ghl_contact_id": "ghl_contact_id_xyz"
    }
  }
}
```

**Routing logic:**
- `retell_ai` → new contacts with no prior call history and source is `meta_ads`, `google_ads`, or `dbr`
- `ghl_native_voice` → warm contacts (has prior calls, is in appointment pipeline, existing tag "warm")
- `none` → contact is tagged DNC, or is an existing client/agent

---

### `POST /api/leads/:id/assign`

Assign a lead to an agent.

**Auth:** client_admin

**Request:**
```json
{
  "agent_id": "agent-uuid"
}
```

**Response:**
```json
{
  "lead_id": "uuid",
  "assigned_agent_id": "agent-uuid",
  "ghl_synced": true
}
```

---

### `POST /api/leads/:id/status`

Update lead status (and sync to GHL pipeline stage).

**Auth:** client_admin, agent (own assigned leads only)

**Request:**
```json
{
  "status": "appointment_scheduled",
  "notes": "Booked for March 30 at 10AM"
}
```

**Response:**
```json
{
  "lead_id": "uuid",
  "status": "appointment_scheduled",
  "ghl_pipeline_stage_updated": true
}
```

---

## 4. Claude AI Report Generation Endpoints

These endpoints trigger Claude agent runs. Called by n8n cron workflows or manually by Shomari.

---

### `POST /api/agents/run` [INTERNAL — n8n or MIRD admin]

Triggers a Claude AI department agent run.

**Auth:** Service role key (`X-Service-Key`) or `mird_admin` JWT

**Request:**
```json
{
  "department": "dept4_finance",
  "trigger": "cron_morning",
  "data_payload": {
    "period_start": "2026-03-29T00:00:00Z",
    "period_end": "2026-03-29T07:00:00Z",
    "organizations": [
      {
        "id": "org-uuid-1",
        "name": "Marcus Realty Group",
        "plan": "growth",
        "mrr_cents": 499700
      }
    ],
    "leads_today": 12,
    "calls_today": 8,
    "appointments_today": { "scheduled": 3, "confirmed": 2, "no_show": 1 },
    "ad_spend_7d_cents": 420000,
    "blended_cpl_7d_cents": 10769,
    "subscription_events": [],
    "agent_run_errors": []
  }
}
```

**Response (streaming):**

The endpoint streams Claude's structured output as Server-Sent Events (SSE):

```
data: {"type":"thinking","content":"Analyzing MRR data..."}

data: {"type":"output_chunk","content":"## North Star Summary\n\n..."}

data: {"type":"complete","report":{"north_star":{"mrr_cents":15483700,"leads_today":47},"flags":[],"ad_summary":{},"wins":["CPL improved 12% vs last week"],"priorities":["Follow up on 2 no-shows from this morning"]}}
```

Final `complete` event payload matches the `reports.report_data` schema and is persisted automatically.

---

### `GET /api/agents/reports`

List Claude agent reports.

**Auth:** mird_admin (all reports), client_admin (org-scoped reports only)

**Query params:**
```
?report_type=ceo_loop|ad_performance|client_health
&department=dept1_growth|dept2_ad_ops|dept3_product|dept4_finance
&organization_id=uuid  (mird_admin only)
&from=2026-03-22
&to=2026-03-29
&limit=10
```

**Response:**
```json
{
  "reports": [
    {
      "id": "uuid",
      "created_at": "2026-03-29T07:05:00Z",
      "report_type": "ceo_loop",
      "report_period": "morning",
      "agent_department": "dept4_finance",
      "title": "Morning CEO Loop — March 29, 2026",
      "summary": "3 new leads overnight. 1 appointment confirmed. CPL steady at $107.",
      "flags": [
        {
          "severity": "warning",
          "category": "ad_ops",
          "message": "Google Ads campaign 'Atlanta Buyers March' CTR dropped 18% vs last week.",
          "recommended_action": "Review ad creative rotation — possible ad fatigue."
        }
      ],
      "wins": ["8 appointments confirmed this week — best week of Q1"],
      "priorities": ["Review Google creative rotation", "Follow up: Marcus no-show from March 28"]
    }
  ],
  "total": 28
}
```

---

### `GET /api/agents/reports/:id`

Full report detail including complete `report_data` JSON.

**Response:** Same as list item but includes full `report_data` object.

---

## 5. Client Management Endpoints

MIRD admin endpoints for managing client organizations.

---

### `GET /api/admin/organizations`

List all client organizations.

**Auth:** mird_admin only

**Query params:**
```
?plan=starter|growth|scale|build_release
&status=active|past_due|canceled
&search=marcus
&page=1&limit=25
```

**Response:**
```json
{
  "organizations": [
    {
      "id": "uuid",
      "name": "Marcus Realty Group",
      "slug": "marcus-realty-group",
      "owner_name": "Marcus Johnson",
      "owner_email": "marcus@example.com",
      "subscription_plan": "growth",
      "subscription_status": "active",
      "mrr_cents": 499700,
      "ghl_provisioned": true,
      "onboarding_completed": true,
      "created_at": "2026-01-15T00:00:00Z",
      "team_size": 8,
      "primary_market": "Atlanta, GA",
      "agents_count": 6,
      "leads_last_30d": 89,
      "appointments_last_30d": 22
    }
  ],
  "pagination": { "page": 1, "limit": 25, "total": 14 },
  "summary": {
    "total_active": 12,
    "total_mrr_cents": 4897600,
    "past_due_count": 1
  }
}
```

---

### `POST /api/admin/organizations`

Create a new client organization (after sale is closed).

**Auth:** mird_admin only

**Request:**
```json
{
  "name": "Marcus Realty Group",
  "owner_name": "Marcus Johnson",
  "owner_email": "marcus@example.com",
  "owner_phone": "+14045559999",
  "industry": "real_estate",
  "team_size": 8,
  "primary_market": "Atlanta, GA",
  "subscription_plan": "growth",
  "mrr_cents": 499700,
  "notes": "Referred by John Smith. High LTV potential."
}
```

**Response:**
```json
{
  "organization": {
    "id": "uuid",
    "slug": "marcus-realty-group",
    "created_at": "2026-03-29T10:00:00Z"
  },
  "onboarding_link": "https://onboarding.rainmachine.io/start?token=abc123token",
  "onboarding_token_expires_at": "2026-04-05T10:00:00Z"
}
```

---

### `PUT /api/admin/organizations/:id`

Update organization details or plan.

**Auth:** mird_admin only

**Request:** Partial update — any fields from the organizations table.

---

### `GET /api/admin/organizations/:id/health`

Full health dashboard for a single client. Used by Dept 2 agent and CEO loop.

**Auth:** mird_admin only

**Response:**
```json
{
  "organization": { "id": "uuid", "name": "Marcus Realty Group" },
  "subscription": {
    "plan": "growth",
    "status": "active",
    "mrr_cents": 499700,
    "days_active": 74
  },
  "performance_30d": {
    "leads": 89,
    "calls": 71,
    "connect_rate": 0.62,
    "appointments_booked": 22,
    "appointments_completed": 17,
    "show_rate": 0.773,
    "deals_closed": 5,
    "close_rate": 0.294
  },
  "ad_performance": {
    "spend_30d_cents": 1847000,
    "leads_30d": 74,
    "cpl_30d_cents": 24959,
    "meta_cpl_cents": 22000,
    "google_cpl_cents": 31000,
    "best_campaign": "Atlanta Seller Leads - Spring 2026"
  },
  "health_score": 82,
  "churn_risk": "low",
  "flags": []
}
```

---

## 6. Onboarding Portal Endpoints

The onboarding portal uses token-based auth — no Supabase JWT required. Tokens are generated when an organization is created and sent via email.

---

### `GET /api/onboarding/verify` [TOKEN]

Verify an onboarding token and return organization context.

**Query params:** `?token=abc123token`

**Response (valid):**
```json
{
  "valid": true,
  "organization": {
    "name": "Marcus Realty Group",
    "owner_name": "Marcus Johnson",
    "subscription_plan": "growth"
  },
  "steps": {
    "business_info": "pending",
    "meta_access": "pending",
    "google_ads": "pending",
    "gmb": "pending",
    "creative_assets": "pending"
  },
  "expires_at": "2026-04-05T10:00:00Z"
}
```

**Response (invalid/expired):**
```json
{ "valid": false, "error": "token_expired" }
```
HTTP 401

---

### `PUT /api/onboarding/steps/business-info` [TOKEN]

Save business info step.

**Query params:** `?token=abc123token`

**Request:**
```json
{
  "business_name": "Marcus Realty Group",
  "owner_name": "Marcus Johnson",
  "phone": "+14045559999",
  "website": "https://marcusrealty.com",
  "address": "123 Peachtree St, Atlanta, GA 30303",
  "icp_description": "First-time homebuyers aged 28-42, household income $80K-$150K, working in Atlanta metro area, interested in suburban neighborhoods.",
  "target_markets": ["Atlanta, GA", "Marietta, GA"],
  "team_size": 8
}
```

**Response:**
```json
{
  "step": "business_info",
  "status": "completed",
  "next_step": "meta_access"
}
```

---

### `PUT /api/onboarding/steps/meta-access` [TOKEN]

Save Meta advertising account information.

**Query params:** `?token=abc123token`

**Request:**
```json
{
  "business_manager_id": "123456789012345",
  "ad_account_ids": ["act_987654321098765"],
  "pixel_id": "111222333444555",
  "access_granted": true,
  "notes": "System User 'MIRD Rainmaker' has been added to BM with Analyst access"
}
```

**Response:**
```json
{
  "step": "meta_access",
  "status": "completed",
  "next_step": "google_ads"
}
```

---

### `PUT /api/onboarding/steps/google-ads` [TOKEN]

**Query params:** `?token=abc123token`

**Request:**
```json
{
  "customer_id": "123-456-7890",
  "mcc_access_granted": true,
  "notes": "MIRD MCC 987-654-3210 linked as manager"
}
```

---

### `PUT /api/onboarding/steps/gmb` [TOKEN]

**Query params:** `?token=abc123token`

**Request:**
```json
{
  "account_id": "gmb_account_id",
  "location_id": "gmb_location_id",
  "business_name": "Marcus Realty Group",
  "access_granted": true
}
```

---

### `PUT /api/onboarding/steps/creative-assets` [TOKEN]

Upload creative assets. Files are uploaded to Supabase Storage, URLs stored in `onboarding_submissions.creative_assets`.

**Query params:** `?token=abc123token`
**Content-Type:** `multipart/form-data`

**Form fields:**
- `logo` (file) — primary logo
- `headshot` (file) — team leader headshot
- `team_photo` (file, optional)
- `brand_colors` (JSON string) — `{"primary": "#1B4FFF", "secondary": "#FFFFFF"}`
- `tagline` (text)

**Response:**
```json
{
  "step": "creative_assets",
  "status": "completed",
  "assets": [
    { "type": "logo", "url": "https://[project].supabase.co/storage/v1/object/public/assets/org-uuid/logo.png" },
    { "type": "headshot", "url": "https://[project].supabase.co/storage/v1/object/public/assets/org-uuid/headshot.jpg" }
  ],
  "next_step": null,
  "all_steps_complete": true
}
```

---

### `POST /api/onboarding/submit` [TOKEN]

Final submission — triggers provisioning workflow.

**Query params:** `?token=abc123token`

**Request:** `{}` (empty — all data already saved per step)

**Response:**
```json
{
  "submitted": true,
  "organization_id": "uuid",
  "provisioning_started": true,
  "estimated_completion_minutes": 15,
  "ghl_access_email": "Your GoHighLevel access will be emailed to marcus@example.com within 15 minutes."
}
```

**Post-submission:**
1. Marks `onboarding_submissions.submitted_at`
2. Triggers n8n Provisioning Workflow (async)
3. n8n creates GHL sub-account, configures pipelines, sends access email

---

## 7. CEO Dashboard Endpoints

All CEO dashboard endpoints require `mird_admin` role.

---

### `GET /api/ceo/north-star`

The primary CEO dashboard data endpoint. Returns current period North Star metrics across all clients.

**Query params:**
```
?period=today|last_7d|last_30d|this_month
```

**Response:**
```json
{
  "as_of": "2026-03-29T12:00:00Z",
  "period": "last_7d",
  "mrr": {
    "current_cents": 4897600,
    "delta_cents": 499700,
    "delta_pct": 11.35,
    "active_clients": 12,
    "churned_this_month": 0,
    "new_this_month": 1
  },
  "leads": {
    "total": 312,
    "by_source": { "meta_ads": 198, "google_ads": 89, "organic": 25 },
    "delta_pct": 8.2
  },
  "calls": {
    "total_retell": 248,
    "total_ghl_voice": 89,
    "connect_rate": 0.61
  },
  "appointments": {
    "scheduled": 78,
    "confirmed": 61,
    "completed": 54,
    "no_show": 7,
    "show_rate": 0.885
  },
  "ad_spend": {
    "total_7d_cents": 5820000,
    "blended_cpl_cents": 18654,
    "meta_cpl_cents": 16200,
    "google_cpl_cents": 24800,
    "clients_over_target_cpl": 2
  },
  "flags": [
    {
      "severity": "warning",
      "client": "Marcus Realty Group",
      "category": "ad_ops",
      "message": "Google CPL spiked to $248 vs $180 target",
      "action": "Review campaign settings"
    }
  ]
}
```

---

### `GET /api/ceo/loop`

Returns the latest CEO loop report for the requested period.

**Query params:** `?period=morning|midday|evening&date=2026-03-29`

**Response:** Latest `reports` row matching the criteria, including full `report_data`, flags, wins, and priorities.

---

### `GET /api/ceo/clients`

Summary table of all active clients for the CEO dashboard.

**Response:** See `/api/admin/organizations` — same shape with additional health scores.

---

### `GET /api/ceo/agent-runs`

Recent Claude agent run log.

**Query params:** `?department=dept4_finance&limit=20`

**Response:**
```json
{
  "runs": [
    {
      "id": "uuid",
      "department": "dept4_finance",
      "run_trigger": "cron_morning",
      "status": "completed",
      "started_at": "2026-03-29T07:00:00Z",
      "duration_ms": 8240,
      "report_id": "uuid",
      "prompt_tokens": 4821,
      "completion_tokens": 1247,
      "estimated_cost_cents": 8
    }
  ]
}
```

---

### `POST /api/ceo/agents/trigger`

Manually trigger a Claude agent run outside of cron schedule.

**Auth:** mird_admin only

**Request:**
```json
{
  "department": "dept2_ad_ops",
  "trigger": "manual",
  "organization_id": "uuid"  // Optional: scope to one client
}
```

**Response:**
```json
{
  "run_id": "agent-performance-uuid",
  "status": "running",
  "estimated_duration_seconds": 30
}
```

---

### `GET /api/ceo/mrr-history`

MRR trend data for the finance chart.

**Query params:** `?months=6`

**Response:**
```json
{
  "history": [
    { "month": "2025-10", "mrr_cents": 997000, "clients": 1 },
    { "month": "2025-11", "mrr_cents": 1996000, "clients": 2 },
    { "month": "2025-12", "mrr_cents": 3990000, "clients": 4 },
    { "month": "2026-01", "mrr_cents": 4987000, "clients": 6 },
    { "month": "2026-02", "mrr_cents": 4397600, "clients": 11 },
    { "month": "2026-03", "mrr_cents": 4897600, "clients": 12 }
  ]
}
```

---

## 8. Common Patterns

### Error Response Format

All errors follow this shape:

```json
{
  "error": "error_code",
  "message": "Human-readable description",
  "details": {}  // Optional additional context
}
```

Common error codes:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `unauthorized` | 401 | Missing or invalid JWT |
| `forbidden` | 403 | Valid JWT but insufficient role |
| `not_found` | 404 | Resource does not exist in this tenant |
| `validation_error` | 422 | Request body failed validation |
| `invalid_signature` | 401 | Webhook HMAC signature mismatch |
| `token_expired` | 401 | Onboarding portal token expired |
| `rate_limited` | 429 | Too many requests |
| `internal_error` | 500 | Unexpected server error |

### Pagination

All list endpoints support:
```
?page=1&limit=25
```

Response always includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 143,
    "total_pages": 6,
    "has_next": true,
    "has_prev": false
  }
}
```

### Date Handling

All timestamps are ISO 8601 UTC: `2026-03-29T14:22:00Z`
All date-only fields are `YYYY-MM-DD`: `2026-03-29`
Timezone is stored on the organization record and applied for display in the dashboard.

### Idempotency

Webhook handlers and provisioning endpoints accept `Idempotency-Key` header. Duplicate requests with the same key return the cached response without re-executing.

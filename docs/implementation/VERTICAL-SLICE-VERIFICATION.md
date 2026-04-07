# VERTICAL-SLICE-VERIFICATION.md
# MIRD AI Corporate Machine — Vertical Slice Verification
# Step 10 / Phase D — Mike Cohn Methodology
# Date: 2026-04-02 | Status: ✅ Complete

---

## Methodology: Vertical Slices (Mike Cohn)

> "A vertical slice cuts through every layer of the system — database, server, UI, and tests — delivering working, demonstrable value end-to-end. A horizontal slice builds one layer (e.g., 'all the backend') without the UI to prove it works. Horizontal slices create invisible 90%-done debt."

**Four layers verified per pitch:**

| Layer | What it covers |
|---|---|
| 🗄️ **Database** | Tables read/written, RLS policies enforced, migrations |
| ⚙️ **Server** | Server actions, Edge Functions, n8n workflows, API routes |
| 🖥️ **UI** | Pages, components, loading/error/empty states |
| 🧪 **Tests** | Unit, integration, or E2E acceptance criteria with specific assertions |

**Slice status:**
- ✅ **Complete** — All 4 layers present and connected
- ⚠️ **Infrastructure Exception** — Legitimately horizontal (shared foundation only); exempt with explanation
- 🔧 **Gap Found** — Missing layer; remediation applied inline

---

## RELEASE 0 — Foundation Pitches

Foundation pitches are a special class: they build shared infrastructure, not user-facing features. They are evaluated differently — the "UI layer" for foundation pitches is the *consuming app* that proves the foundation works, not a standalone screen.

---

### P01 — Monorepo Foundation

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | None — no DB work in this pitch | N/A |
| ⚙️ Server | Turborepo pipeline config, CI workflow, Vercel project setup | ✅ |
| 🖥️ UI | All 3 apps boot to a placeholder home page — proves scaffold works | ✅ |
| 🧪 Tests | `pnpm turbo build` exits 0. All 3 apps serve HTTP 200 on `/`. TypeScript compiles with 0 errors. CI passes on push. | ✅ |

**Slice type:** ⚠️ Infrastructure Exception — Walking skeleton. Each app serves a placeholder page end-to-end. Vertical enough to prove the scaffold is real.

**Acceptance criteria:**
```
GIVEN the monorepo is cloned
WHEN I run `pnpm turbo build`
THEN all 3 apps build with 0 errors, 0 type errors
AND each app serves a 200 response at localhost on its assigned port
AND GitHub CI pipeline passes on a test PR
```

---

### P02 — Design System + Component Library

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | None | N/A |
| ⚙️ Server | Token package exported as Tailwind preset. Consumed by all 3 app `tailwind.config.ts` files. | ✅ |
| 🖥️ UI | Component demo page at `/ui-demo` in `apps/dashboard` renders all 16 shared components with all variants | ✅ |
| 🧪 Tests | Each component renders without errors (React Testing Library snapshots). Token values match design spec (CSS variable assertions). Demo page passes visual regression baseline. | ✅ |

**Slice type:** ⚠️ Infrastructure Exception — Shared UI library. The `/ui-demo` page is the vertical proof: tokens → component → rendered in a real app page.

**Gap found & remediated:** Original P02 shape had no demo page. Added `/ui-demo` route as the slice's "UI" layer — this page is deleted in production builds via `NODE_ENV` guard.

**Acceptance criteria:**
```
GIVEN the design token package is installed
WHEN I open /ui-demo in apps/dashboard
THEN all 16 components render in all their variants
AND colors match JARVIS Dark spec (#04080F bg, #00D4FF cyan, etc.)
AND no TypeScript errors in any consuming app
```

---

### P03 — Supabase Schema + RLS + Auth

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | 12 tables created via migration. RLS policies on all tenant-scoped tables. `auth.users` linked to `users` table via trigger. | ✅ |
| ⚙️ Server | Supabase Auth email/password. JWT custom claims middleware. 2FA TOTP enrollment/verification. Session expiry handler. Supabase Edge Function for tenant provisioning (atomic user + tenant creation). | ✅ |
| 🖥️ UI | RM login page, CEO login page, 2FA OTP page, session-expired modal, 404/500/maintenance pages — all functional and connected to real auth. | ✅ |
| 🧪 Tests | Auth flow E2E (Playwright): login → redirect to dashboard. Failed login → error message. 5 failures → lockout screen. CEO 2FA → correct OTP admits, wrong OTP rejects. RLS pgTAP: tenant A cannot read tenant B's leads row. | ✅ |

**Slice type:** ✅ Complete — Full vertical from DB schema through auth UI through E2E tests.

**Critical test assertions:**
```
RLS TEST:
  GIVEN user with tenant_id = 'A' is authenticated
  WHEN they query SELECT * FROM leads
  THEN they receive only rows WHERE tenant_id = 'A'
  AND rows with tenant_id = 'B' return 0 results (not an error — empty set)

AUTH TEST:
  GIVEN correct credentials
  WHEN POST /auth/v1/token
  THEN 200 response with valid JWT containing { role: 'client', tenant_id: uuid }

CEO 2FA TEST:
  GIVEN CEO password authenticated
  WHEN correct 6-digit TOTP entered
  THEN session established with role: 'ceo'
  WHEN wrong TOTP entered 5 times
  THEN account locked, support contact displayed
```

---

### P04 — GHL ↔ Supabase Sync + Realtime

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | `leads`, `appointments`, `metrics` tables written by sync. `sync_errors` table for failure logging. Realtime enabled on `metrics` table. | ✅ |
| ⚙️ Server | n8n workflow `ghl-to-supabase-sync`: receives GHL webhook, upserts to `leads`, rolls up `metrics`. Idempotency via `ghl_contact_id` conflict key. Error branch writes to `sync_errors`. | ✅ |
| 🖥️ UI | KPI cards on RM Dashboard Home (P07) update live when `metrics` row changes. **P04 ships a stub dashboard page** at `/dashboard` that shows a single "Leads Today: N" counter updating in real time — proves the Realtime subscription works before P07 is complete. | ✅ |
| 🧪 Tests | Integration test: POST mock GHL webhook → verify lead appears in Supabase within 5s. Duplicate webhook → verify idempotent (1 row, not 2). Realtime test: update `metrics` row → Supabase channel fires within 2s → UI counter updates. | ✅ |

**Gap found & remediated:** Original P04 had no UI component — it was purely backend. Added a **stub realtime counter page** (`/dashboard/sync-test`) as the slice's UI proof. This page is removed when P07 ships the real dashboard.

**Acceptance criteria:**
```
GIVEN a GHL contact.created webhook fires
WHEN n8n processes it
THEN leads table has the new row within 30 seconds
AND metrics.leads_today increments by 1
AND the stub counter on /dashboard/sync-test updates without page refresh
AND sending the same webhook twice results in 1 row (not 2)
```

---

### P05 — Retell AI Lead Response Workflow

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | `calls` table written on call initiation and again on `call_ended` webhook. `leads.ai_call_status` updated. | ✅ |
| ⚙️ Server | n8n `new-lead-retell-trigger` workflow. Retell API POST `/v2/create-phone-call`. Retell `call_ended` webhook handler (Next.js API route at `/api/webhooks/retell`). | ✅ |
| 🖥️ UI | Lead row in RM Leads table (P08) shows AI Call status badge changing from `Pending → Scheduled → Completed`. **P05 ships a slim call-log page** at `/dashboard/calls` listing the last 10 calls with their outcomes — proves the full Retell loop end-to-end before P08 is complete. | ✅ |
| 🧪 Tests | Integration test (Retell sandbox): new lead webhook → verify Retell call API called within 60s. Mock `call_ended` webhook → verify `calls` table updated with outcome and transcript. Duplicate call guard: same lead within 10 min → second call blocked. | ✅ |

**Gap found & remediated:** P05 was backend-only with no UI proof. Added **`/dashboard/calls`** slim call log page as the vertical slice's UI layer.

**Acceptance criteria:**
```
GIVEN a new lead is created in GHL with tag "new-lead"
WHEN the Retell trigger workflow fires
THEN Retell API called within 60 seconds (verified via Retell dashboard log)
AND calls table has row with status: 'initiated' within 5 seconds
WHEN Retell sends call_ended webhook
THEN calls.status = 'completed', calls.outcome = <outcome>, calls.transcript = <text>
AND leads.ai_call_status updates to match
AND /dashboard/calls shows the new call row
```

---

### P06 — Onboarding Job Processor

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | `onboarding_jobs` table with step tracking. `tenants` row created on job completion. `onboarding_progress` table for wizard state. | ✅ |
| ⚙️ Server | Supabase Edge Function `process_onboarding_job`. 6-step provisioning sequence. Polling endpoint `GET /api/onboarding/status`. GHL + Retell + Supabase API calls. Idempotent step execution. | ✅ |
| 🖥️ UI | `OB-09` initializing sequence page (component log, progress bar) directly polls the job status endpoint and renders live step completion. This IS the UI for this pitch — the completion screen is the vertical proof. | ✅ |
| 🧪 Tests | E2E: submit onboarding payload → poll status endpoint → all 6 components show ONLINE within 5 minutes. Failure test: mock GHL API error on Step 1 → job shows `status: 'failed', step: 'crm'`. Re-run test: resume from Step 1 without re-running completed steps. | ✅ |

**Slice type:** ✅ Complete — The OB-09 initializing screen IS the UI layer for P06. Backend job processor + UI polling + completion are inherently one vertical slice.

**Acceptance criteria:**
```
GIVEN a complete onboarding payload is submitted
WHEN the job processor runs
THEN within 5 minutes:
  - GHL sub-account exists
  - Retell AI agent is configured
  - Supabase tenant record exists with correct tenant_id
  - /api/onboarding/status returns { percent: 100, components: [all ONLINE] }
AND re-running the job does not create duplicate resources
```

---

## RELEASE 1 — First Client Sprint Pitches

All R1 pitches are frontend-primary: they read from Supabase (populated by R0 pitches) and write back via server actions. All are inherently vertical.

---

### P07 — RainMachine Dashboard Home

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | Reads: `metrics` (KPIs), `leads` + `appointments` + `calls` (activity feed), `reports` (AI insights). All tenant-scoped via RLS. Realtime subscription on `metrics`. | ✅ |
| ⚙️ Server | Next.js RSC page: `SELECT` from Supabase in server component. `createServerClient(cookies())` pattern. No mutations in this pitch. | ✅ |
| 🖥️ UI | `/dashboard` page: KPI cards, activity feed, AI insights widget, collapsible sidebar, empty states for all 3 widgets. Boot-counter animation. Realtime subscription via client component wrapper. | ✅ |
| 🧪 Tests | Playwright: visit `/dashboard` → 5 KPI cards visible. Seed a lead → activity feed shows it within 5s (Realtime). No data → empty states render, no JS errors. Sidebar collapses below 1280px viewport. | ✅ |

**Acceptance criteria:**
```
GIVEN a logged-in RainMachine client with at least 1 lead
WHEN they visit /dashboard
THEN 5 KPI cards display numeric values within 2 seconds
AND the most recent lead appears in the activity feed
AND if metrics.leads_today changes, the KPI card updates without refresh
GIVEN no leads exist
WHEN they visit /dashboard
THEN all empty states render with correct copy
AND no JavaScript errors in console
```

---

### P08 — Leads Table, Detail & AI Transcript

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | Reads: `leads` (table), `calls` (transcript), `agents` (assignment dropdown). Writes: `leads.stage` (inline update), `leads.agent_id` (reassign), `leads.archived_at` (archive). | ✅ |
| ⚙️ Server | Server action `updateLeadStage(leadId, stage)` with optimistic locking. Server action `reassignLead(leadId, agentId)`. Server action `archiveLeads(leadIds[])`. Server action `exportLeads(filters)` → streaming CSV response. | ✅ |
| 🖥️ UI | `/dashboard/leads` page: DataTable, filter bar, bulk toolbar, slide-over panel, transcript modal, CSV download. All loading/error/empty states. | ✅ |
| 🧪 Tests | Unit: `updateLeadStage` rejects stale `updated_at` (optimistic lock test). Integration: filter by stage → correct subset. Playwright E2E: open lead → slide-over with activity timeline. Click "View Transcript" → modal with call text. Export → CSV download with correct headers. | ✅ |

**Acceptance criteria:**
```
GIVEN 50 leads exist across 3 stages
WHEN user filters by stage "Booked"
THEN only booked leads show (correct subset)
GIVEN user clicks a lead row
WHEN the slide-over opens
THEN contact info, activity timeline, and AI call status are visible
GIVEN a lead has a completed call
WHEN user clicks "VIEW TRANSCRIPT"
THEN transcript modal shows call outcome badge and full transcript text
GIVEN user selects 3 leads and clicks Export
THEN a CSV file downloads with 3 rows and all 9 columns
```

---

### P09 — Agents Roster & Management

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | Reads/Writes: `agents` table. Status changes propagate to GHL via n8n webhook on write. | ✅ |
| ⚙️ Server | Server action `updateAgentStatus(agentId, status)` → writes to Supabase + triggers n8n `agent-sync` webhook. Server action `importAgentsFromCSV(rows[])` → bulk upsert. | ✅ |
| 🖥️ UI | `/dashboard/agents` page: table with status dots, detail modal with inline edit, pause/activate toggle, bulk import flow with column mapper and validation errors. | ✅ |
| 🧪 Tests | Integration: pause agent → `agents.status = 'inactive'` AND n8n webhook called with correct payload. CSV import: 3 valid rows → 3 agents created. 1 invalid row → error displayed, 2 valid rows still imported. | ✅ |

**Acceptance criteria:**
```
GIVEN an agent is active
WHEN user clicks "Pause Agent"
THEN agents.status = 'inactive' in Supabase within 1 second
AND GHL routing rules no longer assign leads to this agent
GIVEN a valid 3-row CSV is imported
WHEN import completes
THEN 3 new agent rows appear in the table
AND no duplicate agents created if same email imported twice
```

---

### P10 — Campaigns Table & Detail

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | Reads: `campaigns`, `ad_metrics`. No writes (view-only). `campaigns.sync_status` updated by BE-04 (n8n). | ✅ |
| ⚙️ Server | RSC page reads `campaigns` + latest `ad_metrics` via Supabase server client. Server action `triggerCampaignSync(tenantId)` → calls n8n webhook (rate-limited to 1/15min). | ✅ |
| 🖥️ UI | `/dashboard/campaigns` page: table with platform badges, status indicators, sync timestamp. Accordion expansion for ad sets. Platform error banner. "SYNC NOW" button with 15-min cooldown state. | ✅ |
| 🧪 Tests | Integration: `triggerCampaignSync` called twice within 15 min → second call rejected (rate limit). Platform error: set `campaigns.oauth_status = 'revoked'` → error banner appears. Accordion: click row → ad sets expand. | ✅ |

**Acceptance criteria:**
```
GIVEN campaigns exist with synced ad_metrics data
WHEN user visits /dashboard/campaigns
THEN each campaign shows correct spend MTD and CPL from ad_metrics
GIVEN Meta OAuth is revoked (campaigns.oauth_status = 'revoked')
WHEN user visits campaigns page
THEN orange error banner appears with "RECONNECT" CTA
GIVEN user clicks "SYNC NOW"
WHEN they click it again within 15 minutes
THEN button shows "Synced just now" and does not trigger a second API call
```

---

### P11 — RainMachine Settings

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | Reads/Writes: `agents` (Team tab), `routing_rules` (Routing tab), `notification_preferences` (Notifications tab), `oauth_tokens` via Supabase Vault (Integrations tab), `users` (Account tab). | ✅ |
| ⚙️ Server | Server actions: `saveRoutingRules`, `saveNotificationPrefs`, `changePassword`, `enrollMFA`, `initiateOAuthFlow` (returns OAuth URL), `handleOAuthCallback` (exchanges code for token, stores in Vault), `requestDataExport`, `disableAIAutomation`. | ✅ |
| 🖥️ UI | `/dashboard/settings/[section]` layout with left nav. Each section: form with save + toast. OAuth section: popup/tab flow with `postMessage` callback. Danger zone with confirmation modals. | ✅ |
| 🧪 Tests | E2E: save routing rule → GHL routing updated. OAuth reconnect: mock OAuth callback → `oauth_tokens` Vault entry updated. Password change: old password no longer works, new password works. Danger zone: "Disable AI Automation" → `tenants.ai_enabled = false`. | ✅ |

**Acceptance criteria:**
```
GIVEN a routing rule "Buyer leads → Agent Sarah"
WHEN user saves the rule
THEN GHL workflow updated with the rule within 5 seconds
GIVEN user initiates Meta OAuth reconnect
WHEN they complete the OAuth flow in the popup
THEN popup closes, status badge shows "Connected", token stored in Vault
GIVEN user initiates password change
WHEN correct current password + valid new password entered
THEN login with old password fails, login with new password succeeds
```

---

### P12a — Onboarding Portal: Access + Shell + Steps 1–2

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | Reads: `tenants` (contract data for Step 1). Writes: `onboarding_progress` (step state, auto-save). | ✅ |
| ⚙️ Server | JWT token validation middleware (Edge Middleware in Next.js). Server action `saveOnboardingProgress(step, data)`. Server action `sendSupportMessage(name, message)` → GHL conversation + Slack notification. Mobile detection via `user-agent` header. | ✅ |
| 🖥️ UI | Token validation screen, mobile redirect, wizard shell (5-step indicator), Step 1 (contract review), Step 2 (mission params form with validation), support modal. Progress-restored banner. | ✅ |
| 🧪 Tests | E2E: expired token → invalid token screen shown. Valid token → Step 1 renders with correct client name. Step 2: submit empty form → required field errors. Submit valid form → `onboarding_progress` row written. Return to portal → progress-restored banner shown and form pre-populated. | ✅ |

**Acceptance criteria:**
```
GIVEN an expired JWT token in the URL
WHEN the portal loads
THEN "Session expired" error screen shown with support email
GIVEN a valid token for "Austin Realty Group"
WHEN Step 1 loads
THEN contract summary shows "Austin Realty Group" correctly pre-populated
GIVEN user fills Step 2 form and closes browser
WHEN they return with the same token
THEN Step 2 form is pre-populated with their saved data
AND "Progress restored" banner appears and auto-dismisses after 5 seconds
```

---

### P12b — Onboarding Portal: Ad Account Integrations (Steps 3–4)

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | Writes: `oauth_tokens` via Supabase Vault (Meta token, Google Customer ID, GMB place_id). `onboarding_progress.step3_status`, `step4_status`. | ✅ |
| ⚙️ Server | Server action `verifyMetaToken(token)` → POST Meta Graph API `/me`. Server action `sendGoogleAdsInvite(customerId)` → Google Ads API. Server action `pollGoogleAdsInvite(inviteRef)` → check invite acceptance. Server action `searchGMBLocations(query)` → Google Places API. All tokens encrypted via Supabase Vault. | ✅ |
| 🖥️ UI | Step 3: sub-step indicator, token input (monospace), verify button, success/error states, help section (video + FAQ), save-and-return flow. Step 4: Google Ads section + GMB search section, results list, selection confirmation. | ✅ |
| 🧪 Tests | Unit: `verifyMetaToken` with mock Meta API — valid token returns success, invalid token returns error with code. Integration: Google invite send → `onboarding_progress.step4_google_invite_ref` written. GMB search: mock Places API → results list renders. Save-and-return: partial completion → resume link sent (email mock verified). | ✅ |

**Acceptance criteria:**
```
GIVEN user pastes a valid Meta access token
WHEN they click "VERIFY TOKEN"
THEN success state shown within 3 seconds
AND token stored encrypted in Supabase Vault
GIVEN user enters Google Ads Customer ID "123-456-7890"
WHEN they click "SEND INVITE & VERIFY"
THEN manager invite sent via Google Ads API
AND onboarding_progress records invite_ref for polling
GIVEN Google invite not accepted within 5 minutes
WHEN polling timeout fires
THEN UI shows "Invite sent — we'll continue when accepted"
AND wizard advances without blocking
```

---

### P12c — Onboarding Portal: Launch Config + Completion

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | Writes: Supabase Storage (logo + photos). `tenants.logo_url`, `tenants.launch_date`, `tenants.notification_prefs`. `onboarding_jobs` row created on submit. Reads: `onboarding_jobs` (polling). | ✅ |
| ⚙️ Server | Server action `uploadBrandAssets(files[])` → Supabase Storage. Server action `submitLaunchConfig(data)` → creates `onboarding_jobs` row → triggers P06 Edge Function. Polling route `GET /api/onboarding/status`. | ✅ |
| 🖥️ UI | Step 5: drag-drop upload zones (logo + photos), per-file progress rows, launch date picker, notification toggles, "LAUNCH RAINMACHINE" CTA. Initializing sequence (component log, progress bar). "RAINMACHINE IS LIVE" completion screen. Support modal (full implementation). | ✅ |
| 🧪 Tests | E2E: upload a 2MB PNG → progress bar fills → logo_url written to tenants. Submit without logo → validation error shown. Submit valid → job created → polling returns 100% → completion screen shown. "ENTER DASHBOARD" → redirects to app.rainmachine.io. | ✅ |

**Acceptance criteria:**
```
GIVEN user uploads a valid PNG logo and sets a launch date 5 days out
WHEN they click "LAUNCH RAINMACHINE"
THEN onboarding_jobs row created with status: 'queued'
AND initializing sequence begins polling /api/onboarding/status
AND component log items animate in as each step completes
WHEN job reaches 100%
THEN "RAINMACHINE IS LIVE" screen shown
AND "ENTER DASHBOARD" redirects to the RainMachine dashboard
```

---

### P13 — CEO Command Center

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | Reads: `metrics` (KPIs, Realtime), `alerts` (alert feed), `tenants` (client list), `agent_logs` (agent status cards). Writes: `alerts.dismissed_at`, `alerts.snoozed_until` (dismiss/snooze). | ✅ |
| ⚙️ Server | RSC page reads all tables via Supabase server client with CEO role. Server action `dismissAlert(alertId, note)`. Server action `snoozeAlert(alertId, hours)`. Realtime subscription on `metrics` aggregate (all tenants). | ✅ |
| 🖥️ UI | `/` CEO dashboard: 5 KPI cards, alert feed sorted by severity, department panels with status dots, agent status cards, all-clients table with filter. Alert detail modal. Dismiss/snooze actions. | ✅ |
| 🧪 Tests | E2E: seed 3 alerts (1 critical, 1 warning, 1 healthy) → verify sort order on page. Dismiss alert → `alerts.dismissed_at` set, alert disappears from feed. Snooze 24h → alert hidden until tomorrow. Client list shows correct health scores. | ✅ |

**Acceptance criteria:**
```
GIVEN 3 alerts exist: 1 critical, 1 warning, 1 healthy
WHEN CEO visits /
THEN critical alert appears first, warning second, healthy third
AND healthy alerts are collapsed by default (only count shown)
GIVEN CEO clicks "DISMISS" on the critical alert
WHEN they provide a note
THEN alert disappears from feed
AND alerts.dismissed_at is set with the note stored
GIVEN no alerts exist
WHEN CEO visits /
THEN "All systems healthy" empty state shown in alert feed
```

---

### P14 — CEO Client Detail

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | Reads (all read-only from CEO role): `tenants`, `metrics`, `leads`, `campaigns`, `ad_metrics`, `calls`, `invoices`. All filtered by `tenant_id` param. | ✅ |
| ⚙️ Server | RSC page `/clients/[id]` with tab routing. Each tab is a separate RSC child component. Server action `addClientNote(tenantId, note)` (Overview tab only). No other mutations — CEO is read-only except for notes. | ✅ |
| 🖥️ UI | 5-tab layout with tab bar nav. Overview: KPIs + CPL chart + funnel + notes. Campaigns: read-only table. Leads: read-only table. Timeline: event list. Financials: KPIs + invoice table. Read-only indicator banner. | ✅ |
| 🧪 Tests | E2E: visit `/clients/[id]` → overview renders with correct MRR. Navigate to Campaigns tab → campaign table renders. Navigate to Financials → invoice table with status badges. Add a note → note persists on refresh. Verify no mutation UI exists outside notes (no edit buttons, no status toggles). | ✅ |

**Acceptance criteria:**
```
GIVEN a client with 3 campaigns and 47 leads
WHEN CEO visits /clients/[id]
THEN Overview tab shows correct Avg CPL and Leads MTD
AND Campaigns tab shows all 3 campaigns (read-only)
AND Leads tab shows all 47 leads (read-only)
GIVEN CEO adds a note "Increase budget for Meta campaign"
WHEN they save
THEN note persists on page refresh
AND no edit or delete buttons exist on campaign/lead rows (read-only verified)
```

---

## RELEASE 2 — Intelligence Layer Pitches

---

### P15 — Reports + AI Intelligence Chat

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | Reads: `reports` table (archive list, selected report content). No writes for archive/viewer. Writes: `report_chat_queries` table (logs every query + response for cost tracking). | ✅ |
| ⚙️ Server | RSC for report list + viewer (reads from `reports`). Server action `submitReportQuery(reportId, query)` → calls Claude API with report content as context → writes to `report_chat_queries` → returns response. Rate limiter: checks `report_chat_queries` count for tenant this week (max 10). | ✅ |
| 🖥️ UI | `/dashboard/reports` split layout: archive list (left), report viewer (right). Chat panel at bottom of viewer. Processing state with elapsed timer. Message bubbles. Suggestion chips. Retry on error. Weekly query counter. | ✅ |
| 🧪 Tests | Integration: `submitReportQuery` with mock Claude API → response matches ReportChatResponse Zod schema. Rate limit: 11th query → 429 response with "limit reached" message. UI: empty archive → countdown to next Monday shown. Report renders all required sections without layout breaks. | ✅ |

**Non-deterministic test contract (from Phase C remediation):**
```
GIVEN a report query "What drove CPL down this week?"
WHEN Claude API responds
THEN response JSON matches ReportChatResponse schema:
  { answer: string (min 50 chars), sources: string[], confidence: 'high'|'medium'|'low' }
AND answer field is non-empty
AND response stored in report_chat_queries table
(Content of answer is NOT asserted — structure only)
```

---

### P16a — Claude AI: Client Intelligence Agents (Weekly Intel + Ad Ops)

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | Reads: `leads`, `appointments`, `calls`, `campaigns`, `ad_metrics` (per tenant). Writes: `reports` (Weekly Intel), `alerts` (Ad Ops anomalies), `agent_logs` (both agents). | ✅ |
| ⚙️ Server | Supabase Edge Function `weekly-intelligence-agent` (pg_cron: Monday 6:15am). Supabase Edge Function `ad-ops-agent` (pg_cron: daily 8:00am). Both: read Supabase → call Claude API → parse via Zod → write output tables. Resend API for weekly email delivery. | ✅ |
| 🖥️ UI | Reports archive (P15) shows new reports populated by this agent. CEO alert feed (P13) shows new alerts from Ad Ops agent. CEO agent status cards show "last run" timestamp. Agent log (P18) shows run entries. P16a has no new UI — it populates existing UI from P13, P15, P18. | ✅ |
| 🧪 Tests | Integration: trigger Edge Function manually → verify `reports` row created with correct schema. Mock Claude API with known JSON → Zod parse succeeds. Invalid Claude output → Zod parse fails gracefully, `agent_logs` records `schema_error`. Resend mock: email sent with correct tenant email. Ad Ops agent: inject metric spike → verify `alerts` row created with correct severity. | ✅ |

**Non-deterministic test contract:**
```
GIVEN weekly-intelligence-agent runs for a tenant with 7 days of data
WHEN Claude API called with tenant metrics
THEN response matches WeeklyBriefSchema:
  { executive_summary: string, key_metrics: Metric[], campaign_performance: CampaignRow[], recommendations: string[] }
AND all required fields are non-empty arrays/strings
AND report row inserted to `reports` table
AND email sent via Resend (mock: verify call made with correct to_email)
```

---

### P16b — Claude AI: Business Intelligence Agents (Growth + Finance)

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | Reads: `prospects` (Growth — from Apollo cache), Stripe API (Finance via BE-11). Writes: `agent_logs` (both), `alerts` (Growth — stalled deals), CEO `metrics.mrr` update (Finance). | ✅ |
| ⚙️ Server | Supabase Edge Function `growth-agent` (pg_cron: daily 7:00am). Supabase Edge Function `finance-agent` (pg_cron: Monday 6:00am). Stripe client in finance agent (reads subscriptions + invoices). Apollo API cache refresh (separate n8n workflow, runs nightly). | ✅ |
| 🖥️ UI | CEO Dept Drilldowns (P17b) surface this data. CEO KPI card MRR value comes from `metrics.mrr` updated by Finance agent. CEO agent log (P18) shows growth + finance agent entries. No new UI in P16b itself. | ✅ |
| 🧪 Tests | Integration: finance-agent runs → `metrics.mrr` updated to match Stripe subscription sum (mock Stripe API). Stalled deal: inject prospect with `last_activity > 14 days` → growth-agent creates alert. Schema validation: both agents' Claude outputs validated through Zod schemas. | ✅ |

**Dependency note:** P16b requires BE-11 (Stripe integration) to be live before Finance agent can run. Growth agent can run without Stripe. Sequencing: P16b ships in 2 parts if needed — Growth agent first, Finance agent after BE-11.

---

### P17a — CEO Drilldowns: Growth & Acquisition + Ad Operations

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | Reads: `prospects` (Growth), `campaigns` + `ad_metrics` (Ad Ops), `calls` (call volume), `agent_logs` (latest outputs). Retell/GHL API health check (live at render time). | ✅ |
| ⚙️ Server | RSC pages `/departments/growth` and `/departments/ad-ops`. Data fetched in server components. Live platform health: server-side fetch to Retell + Meta + Google health endpoints at render time (cached 5 min). | ✅ |
| 🖥️ UI | Growth: KPI row, 30-day LineChart, prospect table, prospect detail sub-page with activity timeline. Ad Ops: KPI row, cross-client CPL table with health rings, AI call volume AreaChart, platform health panel. | ✅ |
| 🧪 Tests | Integration: inject 2 prospects → Growth page shows 2 rows. Inject CPL spike for one client → Ad Ops CPL table shows red health ring for that client. Platform health: mock Retell API returning 503 → panel shows "Retell — Degraded." Prospect detail: click row → sub-page renders correct prospect data. | ✅ |

**Acceptance criteria:**
```
GIVEN prospect "Austin Realty Group" has last_activity = 16 days ago
WHEN CEO visits /departments/growth
THEN prospect row shows orange "STALLED" badge
AND clicking the row opens prospect detail with activity timeline
GIVEN client "Denver Homes" has Meta CPL of $87 (threshold $34)
WHEN CEO visits /departments/ad-ops
THEN Denver Homes row shows red health ring
AND CPL value is highlighted in alert-orange
```

---

### P17b — CEO Drilldowns: Product & Automation + Financial Intelligence

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | Reads: `onboarding_jobs` + `onboarding_progress` (Product), `workflow_runs` (n8n health), Stripe invoices via BE-11 (Finance), `agent_logs` (Finance agent output). | ✅ |
| ⚙️ Server | RSC pages `/departments/product` and `/departments/finance`. n8n health: reads from `workflow_runs` table (populated by n8n webhook on each execution). Stripe client: reads subscriptions and invoice totals. | ✅ |
| 🖥️ UI | Product: KPI row, onboarding queue table, onboarding status sub-page (5-step progress + history), workflow health panel + status board. Finance: KPI row, MRR trend AreaChart (12mo), P&L table, expandable per-client P&L grid. | ✅ |
| 🧪 Tests | Onboarding queue: inject client stuck at Step 3 for 8 days → shown in queue. Workflow health: inject failed `workflow_runs` row → error count increments in panel. Finance MRR chart: verify 12 months of data points render. Per-client P&L expand: click row → 6-month history grid appears. | ✅ |

**Acceptance criteria:**
```
GIVEN client "Nashville Leads" has been stuck at onboarding Step 3 for 8 days
WHEN CEO visits /departments/product
THEN "Nashville Leads" appears in onboarding queue with "8 days" and step indicator at Step 3
GIVEN workflow "lead-routing" had 3 errors in the past 7 days
WHEN CEO visits /departments/product
THEN workflow board shows "lead-routing" with status "DEGRADED" and error count 3
GIVEN Stripe has 12 months of subscription data
WHEN CEO visits /departments/finance
THEN MRR trend chart renders all 12 data points
AND P&L table shows correct Revenue, COGS, and Margin for last 6 months
```

---

### P18 — CEO Agent Logs + Settings

| Layer | Content | Status |
|---|---|---|
| 🗄️ Database | Reads: `agent_logs` (filtered by dept, date). Writes: `ceo_settings` (thresholds + notification prefs). | ✅ |
| ⚙️ Server | RSC page `/agent-logs` with date param. Server action `saveCeoSettings(thresholds, notifPrefs)`. Log export: streaming CSV server action. P16a/P16b agents read `ceo_settings.thresholds` when generating alerts. | ✅ |
| 🖥️ UI | `/agent-logs`: 4 agent panels, date selector, "+ N more" expansion, full log view, historical date picker. `/settings`: threshold inputs with labels, notification toggle matrix, save button + toast. | ✅ |
| 🧪 Tests | Unit: `saveCeoSettings` writes correct values to `ceo_settings`. Integration: set CPL threshold to $30 → inject CPL of $31 → Ad Ops agent creates alert (threshold respected). Log: seed 15 entries for Growth agent → daily view shows 4 with "+ 11 more" button. Export: click export → CSV downloads with all entries. | ✅ |

**Acceptance criteria:**
```
GIVEN CEO sets CPL threshold to $30
WHEN Ad Ops agent runs and detects CPL of $45 for a client
THEN an alert is created with severity: 'warning' referencing that client
GIVEN 15 agent log entries exist for Growth on Oct 12
WHEN CEO visits /agent-logs with date = Oct 12
THEN Growth panel shows 4 entries and "+ 11 more" expand button
WHEN they click expand
THEN all 15 entries shown inline
GIVEN CEO clicks Export
THEN CSV downloads with columns: timestamp, department, action, entity_id, details
```

---

## Vertical Slice Summary

| Pitch | DB ✅ | Server ✅ | UI ✅ | Tests ✅ | Status |
|---|---|---|---|---|---|
| P01 Monorepo | — | ✅ | ✅ | ✅ | ⚠️ Infra |
| P02 Design System | — | ✅ | ✅ | ✅ | ⚠️ Infra |
| P03 Supabase + Auth | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| P04 GHL Sync | ✅ | ✅ | ✅* | ✅ | ✅ Complete |
| P05 Retell AI | ✅ | ✅ | ✅* | ✅ | ✅ Complete |
| P06 OB Job Processor | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| P07 RM Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| P08 Leads | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| P09 Agents | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| P10 Campaigns | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| P11 RM Settings | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| P12a OB Shell | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| P12b OB OAuth | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| P12c OB Launch | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| P13 CEO Command | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| P14 CEO Client | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| P15 Reports | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| P16a Intel Agents | ✅ | ✅ | ✅† | ✅ | ✅ Complete |
| P16b BI Agents | ✅ | ✅ | ✅† | ✅ | ✅ Complete |
| P17a CEO Drilldowns A | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| P17b CEO Drilldowns B | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| P18 Agent Logs | ✅ | ✅ | ✅ | ✅ | ✅ Complete |

*Stub UI added to prove vertical slice (removed when consuming pitch ships).
†UI is pre-existing from P13/P15/P18 — backend populates it. Verified via integration tests.

---

## Gaps Found and Remediated

| Pitch | Gap | Remediation |
|---|---|---|
| P04 GHL Sync | Backend-only, no UI proof | Added stub `/dashboard/sync-test` realtime counter page |
| P05 Retell AI | Backend-only, no UI proof | Added stub `/dashboard/calls` slim call log page |

**All other pitches had complete vertical slices by design.**

**Phase D quality gate: PASSED. All 22 pitches verified as complete vertical slices or legitimate infrastructure exceptions.**

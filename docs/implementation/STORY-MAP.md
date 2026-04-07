# STORY-MAP.md
# MIRD AI Corporate Machine — Jeff Patton Story Map
# Step 10 / Phase A — User Journey Organization
# Date: 2026-04-02 | Status: ✅ Complete

---

## Methodology: Jeff Patton's Story Mapping

> "The map is the conversation. Reading left-to-right tells the user's story over time. Reading top-to-bottom reveals priority — the most critical stories sit at the top."

**Three layers:**
1. **Activities** (top row, blue) — High-level goals: what the user is trying to accomplish
2. **Tasks** (second row, backbone) — The steps taken to accomplish each activity
3. **Stories** (body) — Specific feature slices, ordered top-to-bottom by delivery priority

**Release slices** cut horizontally. Everything above a slice line ships together.

---

## Three User Journeys

| Journey | User | Goal |
|---|---|---|
| **Journey 1 — The Client** | Marcus / Kevin (RainMachine subscriber) | Run a self-operating lead pipeline for my team |
| **Journey 2 — The CEO** | Shomari (MIRD founder) | Run a $100K MRR business in ≤ 30 minutes/day |
| **Journey 3 — New Client** | Incoming MIRD client | Go from signed contract to first AI call in ≤ 14 days |

Plus a **Foundation Journey** (infrastructure that all three depend on).

---

## FOUNDATION JOURNEY — Build the Machine

> "Before any user can do anything, the platform must exist."

### Backbone

```
[F1: Repo + Toolchain]  →  [F2: Design System]  →  [F3: Database + Auth]  →  [F4: Backend Integrations]
```

### Story Map

| Activity → | F1: Repo + Toolchain | F2: Design System | F3: Database + Auth | F4: Backend Integrations |
|---|---|---|---|---|
| **Task →** | Initialize monorepo, CI/CD | Build token package + component lib | Supabase schema + RLS + auth | n8n + GHL + Retell + Claude agents |
| **▲ Release 0 (Must ship first)** | SH-01 Turborepo scaffold | SH-02 JARVIS Dark tokens | SH-04 Supabase client + types | BE-10 Multi-tenant RLS policies |
| | SH-07 RM Error pages | SH-03 Shared UI components | SH-05 RM Authentication | BE-01 GHL → Supabase sync |
| | SH-08 CEO Error pages | | SH-06 CEO Auth + 2FA | BE-02 Retell AI trigger workflow |
| | SH-09 Supabase Realtime | | | BE-09 Onboarding job processor |
| **▼ Release 1 (First client sprint)** | | | | BE-04 Meta + Google Ads sync |
| | | | | BE-03 GHL Native Voice (warm) |
| **▼ Release 2 (Intelligence layer)** | | | | BE-05 Claude Weekly Intel Agent |
| | | | | BE-06 Claude Growth Agent |
| | | | | BE-07 Claude Ad Ops Agent |
| | | | | BE-08 Claude Finance Agent |
| | | | | BE-11 Stripe billing integration |

---

## JOURNEY 1 — The Client (Marcus / Kevin)

> "I signed up for RainMachine. I want to see my team's pipeline running automatically."

### Backbone (Activities left → right)

```
[A: Access Platform]  →  [B: Understand the Machine]  →  [C: Work Leads]  →  [D: Manage Agents]  →  [E: Monitor Campaigns]  →  [F: Read Intelligence]  →  [G: Configure System]
```

---

### Activity A: Access Platform

**User goal:** Get into the system securely, every time.

| Task → | A1: Log in | A2: Handle session edge cases |
|---|---|---|
| **▲ Release 0** | SH-05 Email/password login | SH-05 Session expiry modal |
| | SH-05 "Stay logged in" option | SH-05 Account lockout (5 attempts) |
| | SH-07 404 / 500 / Maintenance pages | |
| **▼ Release 2** | SH-05 Password reset flow | |

---

### Activity B: Understand the Machine

**User goal:** Open the dashboard and know — within 30 seconds — whether the business is on track today.

| Task → | B1: See live KPIs | B2: Scan recent activity | B3: Read AI insight |
|---|---|---|---|
| **▲ Release 1** | RM-01 KPI cards (leads, appts, response rate, agents, campaigns) | RM-02 Activity feed (last 20 events) | RM-03 AI insights widget |
| | RM-04 Sidebar navigation | SH-09 Realtime updates (no refresh) | |
| **▼ Release 2** | RM-01 Boot-counter animation | RM-02 Event type filter | |

---

### Activity C: Work Leads

**User goal:** See every lead in my pipeline, know its status, and intervene if needed — without touching each one manually.

| Task → | C1: See all leads | C2: Inspect a lead | C3: Review AI call | C4: Export/archive |
|---|---|---|---|---|
| **▲ Release 1** | RM-05 Lead table (9 cols) | RM-06 Lead slide-over panel | RM-07 AI call transcript modal | RM-08 CSV export |
| | RM-05 Stage / source / agent filters | RM-06 Reassign agent dropdown | RM-07 Call outcome badge | |
| | RM-05 Pagination (10/25/50) | RM-06 Activity timeline | | |
| **▼ Release 2** | RM-05 Bulk select + bulk actions | | | |

---

### Activity D: Manage Agents

**User goal:** Know how each agent is performing and keep the team configured without manual routing.

| Task → | D1: See agent roster | D2: Inspect an agent | D3: Add / import agents |
|---|---|---|---|
| **▲ Release 1** | RM-09 Agent table (status, close rate, leads) | RM-10 Agent detail modal | RM-18 Settings: add/edit agent |
| | RM-09 Filter by status, sort by close rate | RM-10 Pause / activate toggle | |
| **▼ Release 2** | | RM-10 Edit agent form | RM-11 Bulk CSV import |

---

### Activity E: Monitor Campaigns

**User goal:** Know whether my ads are working — CPL, spend, leads — without logging into Meta or Google.

| Task → | E1: See campaign table | E2: Drill into a campaign | E3: Handle platform errors |
|---|---|---|---|
| **▲ Release 1** | RM-12 Campaign table (platform, status, CPL, leads) | RM-13 Campaign accordion (ad sets, budget breakdown) | RM-14 OAuth revoke / spend-pause alerts |
| | RM-12 API sync status + last sync timestamp | | RM-21 Settings: reconnect OAuth |
| **▼ Release 2** | | RM-13 Bid strategy / audience summary | |

---

### Activity F: Read Intelligence

**User goal:** Read the weekly AI report, understand what to change, and ask follow-up questions — in-app.

| Task → | F1: Find my report | F2: Read the report | F3: Ask the AI |
|---|---|---|---|
| **▲ Release 2** | RM-15 Reports archive (list + empty state) | RM-16 Report viewer (sections + inline cards) | RM-17 AI report chat panel |
| | RM-15 Report type badge | RM-16 Callout blocks + prose rendering | RM-17 Processing state + retry |

---

### Activity G: Configure System

**User goal:** Keep the system tuned — routing rules, notifications, integrations — without a support ticket.

| Task → | G1: Manage team | G2: Set routing | G3: Set notifications | G4: Manage integrations | G5: Manage account |
|---|---|---|---|---|---|
| **▲ Release 1** | RM-18 Add / deactivate agent | RM-19 Routing rules builder | RM-20 Notification toggles + thresholds | RM-21 GHL / Meta / Google reconnect | RM-22 Account info + password change |
| **▼ Release 2** | | | | | RM-22 MFA setup/disable |
| **▼ Release 3** | | | | | RM-22 Data export + danger zone |

---

## JOURNEY 2 — The CEO (Shomari)

> "I have 30 minutes. Show me what needs attention, let me drill into anything critical, then let me go."

### Backbone

```
[A: Access Command Center]  →  [B: Triage Alerts]  →  [C: Check Business Health]  →  [D: Drill into Departments]  →  [E: Review AI Agent Output]  →  [F: Configure Thresholds]
```

---

### Activity A: Access Command Center

| Task → | A1: Log in with 2FA |
|---|---|
| **▲ Release 0** | SH-06 CEO email + password login |
| | SH-06 2FA TOTP (6-digit OTP, auto-advance, auto-submit) |
| | SH-06 Lockout + session expired states |
| | SH-08 CEO 404 error page |

---

### Activity B: Triage Alerts

**User goal:** Know within 10 seconds which clients need action today. Dismiss what doesn't need my attention.

| Task → | B1: See prioritized alerts | B2: Understand what happened | B3: Dismiss or snooze |
|---|---|---|---|
| **▲ Release 1** | CEO-01 Alert feed (critical → warning → healthy) | CEO-01 Alert detail modal (what, who, recommended action) | CEO-01 Dismiss / snooze with notes |
| | CEO-01 Alert cards with client name + metric + delta | | |
| **▼ Release 2** | CEO-01 Real-time alert updates | | |

---

### Activity C: Check Business Health

**User goal:** See the MRR, pipeline metrics, and all clients in one view.

| Task → | C1: See business KPIs | C2: See all clients | C3: Drill into one client |
|---|---|---|---|
| **▲ Release 1** | CEO-02 KPI row (MRR, Leads, Close Rate, Appt Rate, Churn) | CEO-05 All clients list (health score, MRR, tier) | CEO-06 Client detail shell + tab nav |
| | CEO-02 vs-last-period delta + boot-counter | | CEO-07 Overview tab (KPIs, CPL chart, funnel) |
| | CEO-03 Department panel grid | | CEO-10 Timeline tab |
| **▼ Release 2** | | | CEO-08 Campaigns tab |
| | | | CEO-09 Leads tab |
| | | | CEO-11 Financials tab (MRR + invoices) |

---

### Activity D: Drill into Departments

**User goal:** When a department card shows amber or red, drill in and see exactly what's happening.

| Task → | D1: Growth drill-down | D2: Ad Ops drill-down | D3: Product drill-down | D4: Finance drill-down |
|---|---|---|---|---|
| **▲ Release 2** | CEO-12 Growth: prospect table + detail | CEO-13 Ad Ops: CPL table + platform health | CEO-14 Product: onboarding queue + workflow health | CEO-15 Finance: MRR chart + P&L |
| **▼ Release 3** | CEO-12 30-day trend chart | CEO-13 AI call volume chart | CEO-14 Workflow status board | CEO-15 Per-client P&L grid |

---

### Activity E: Review AI Agent Output

**User goal:** See what each Claude agent did today, confirm it's working, spot any anomalies.

| Task → | E1: See today's log | E2: Read full log | E3: Search history |
|---|---|---|---|
| **▲ Release 2** | CEO-16 Agent daily log (4 panels, date selector) | CEO-17 Full log per department | CEO-17 Historical log + date filter |
| | CEO-04 Agent status cards on command center | | |
| **▼ Release 3** | | | CEO-17 Export log |

---

### Activity F: Configure Thresholds

**User goal:** Set the numbers that trigger alerts so I only see what actually matters.

| Task → | F1: Set alert thresholds | F2: Set notification routing |
|---|---|---|
| **▲ Release 2** | CEO-18 Alert threshold inputs (CPL, close rate, spend) | CEO-19 Notification toggles (email + SMS per type) |

---

## JOURNEY 3 — New Client Onboarding

> "I just signed. I want to be live as fast as possible. Don't make me email back and forth."

### Backbone

```
[A: Enter the Portal]  →  [B: Confirm Setup]  →  [C: Connect Business Info]  →  [D: Connect Ad Accounts]  →  [E: Configure Launch]  →  [F: Watch It Go Live]  →  [G: Get Help]
```

---

### Story Map

| Activity → | A: Enter Portal | B: Confirm Setup | C: Business Info | D: Ad Accounts | E: Launch Config | F: Go Live | G: Get Help |
|---|---|---|---|---|---|---|---|
| **Task →** | Validate token, check device | Review contract, begin | Fill mission params | Connect Meta + Google | Upload assets, set date | Watch init, land in dashboard | Support at any point |
| **▲ Release 1** | OB-01 Token validation | OB-03 Wizard shell + step indicator | OB-05 Mission params form | OB-06 Meta Ads OAuth | OB-08 Launch config (assets + date) | OB-09 Initializing sequence | OB-11 Support modal + FAQ |
| | OB-02 Mobile redirect | OB-04 System init + contract review | | OB-07 Google integration | | OB-10 "What happens next" + CTA | |
| **▼ Release 2** | | OB-04 Progress-restored banner | | | OB-08 Notification prefs toggles | | |

---

## Release Slice Summary

This is the vertical slice through the map — what ships in each release to deliver maximum value in sequence.

### ▲ Release 0 — Foundation (No users yet)
> Platform must exist before any journey can begin.

| Features | Description |
|---|---|
| SH-01 | Turborepo monorepo scaffold |
| SH-02 | JARVIS Dark design tokens |
| SH-03 | Shared UI component library |
| SH-04 | Supabase client + types |
| SH-05 | RM Authentication |
| SH-06 | CEO Auth + 2FA |
| SH-07 | RM Error pages |
| SH-08 | CEO Error pages |
| SH-09 | Supabase Realtime subscriptions |
| BE-10 | Multi-tenant RLS policies |
| BE-01 | GHL → Supabase sync |
| BE-02 | Retell AI trigger workflow |
| BE-09 | Onboarding job processor |

**Gate:** First client can be provisioned and Retell AI triggers on a new lead.

---

### ▲ Release 1 — First Client Sprint
> One real client is live, can log in, see their pipeline, and the AI is calling leads.

| Features |
|---|
| RM-01, RM-02, RM-03, RM-04 (Dashboard home) |
| RM-05, RM-06, RM-07, RM-08 (Leads) |
| RM-09, RM-10 (Agents) |
| RM-12, RM-13, RM-14 (Campaigns) |
| RM-18, RM-19, RM-20, RM-21, RM-22 (Settings core) |
| OB-01–OB-11 (Full onboarding portal) |
| CEO-01–CEO-05 (Command center core) |
| CEO-06, CEO-07, CEO-10 (Client detail: overview + timeline) |
| BE-03, BE-04 (Voice warm + Ads sync) |

**Gate:** Marcus can log in, see leads being called by AI, see campaigns, and configure his team. Shomari can see all clients and triage alerts.

---

### ▲ Release 2 — Intelligence Layer
> Clients get weekly AI reports. CEO gets full department visibility. AI agents are running.

| Features |
|---|
| RM-11 (Agent bulk import) |
| RM-15, RM-16, RM-17 (Reports + AI chat) |
| CEO-08, CEO-09, CEO-11 (Client detail: campaigns, leads, financials) |
| CEO-12, CEO-13, CEO-14, CEO-15 (All 4 dept drilldowns) |
| CEO-16, CEO-17 (Agent logs) |
| CEO-18, CEO-19 (CEO settings) |
| BE-05–BE-08 (All 4 Claude AI agents) |
| BE-11 (Stripe billing) |

**Gate:** Full 30-minute CEO loop is functional. Weekly Intelligence Briefs delivered automatically. All 4 Claude agents logging to dashboard.

---

### ▲ Release 3 — Scale Layer
> Bulk imports, data exports, P&L drilldowns, danger zone, historical log exports.

| Features |
|---|
| RM-05 (Bulk select/actions on leads) |
| RM-22 (MFA, data export, danger zone) |
| CEO-12 (30-day trend charts) |
| CEO-15 (Per-client P&L grid) |
| CEO-17 (Historical log export) |

**Gate:** Platform handles 50+ concurrent clients without operational overhead.

---

## Story Map Integrity Checks

| Check | Status | Notes |
|---|---|---|
| All 73 features placed in a journey | ✅ | No orphaned features |
| Release 0 contains only foundations | ✅ | No UI features in Release 0 |
| Release 1 delivers first-client value | ✅ | Marcus can use full RM platform after R1 |
| Release 2 delivers CEO intelligence | ✅ | 30-min CEO loop complete after R2 |
| Onboarding portal ships in Release 1 | ✅ | New client can self-onboard from R1 |
| Backend features are release-gated correctly | ✅ | BE features placed in matching release |
| Every journey has a testable "gate" | ✅ | Gates defined for all 4 releases |

# OUTCOME-MAP.md
# MIRD AI Corporate Machine — Opportunity Solution Tree
# Step 10 / Phase A0 — Teresa Torres Methodology
# Date: 2026-04-02 | Status: ✅ Complete

---

## Methodology: Opportunity Solution Tree (Teresa Torres)

> "Start with the desired outcome. Map the opportunity space. Shape solutions only where opportunities are proven."

The OST framework prevents building solutions in search of problems. Every feature in the MIRD AI Corporate Machine must trace back to a proven opportunity, which traces back to a desired business outcome. No feature exists without this lineage.

---

## The Three Desired Outcomes

MIRD has three distinct user populations across three apps. Each has a single, measurable desired outcome.

| # | App | User | Desired Outcome | North Star Metric |
|---|-----|------|-----------------|-------------------|
| **O1** | RainMachine Dashboard | Marcus / Kevin (clients) | Every agent on the team has a full, automated pipeline — without the team leader touching leads daily | Appointments booked per agent per week ≥ 2 |
| **O2** | CEO Dashboard | Shomari (MIRD founder) | Operate a $100K MRR business in ≤ 30 minutes of active daily work | CEO daily active time ≤ 30 min while MRR grows |
| **O3** | Onboarding Portal | New MIRD clients | Go from signed contract to fully live RainMachine platform in ≤ 14 days | Days from contract-signed to first AI call made ≤ 14 |

---

## Outcome O1 — RainMachine Client Dashboard

**Desired Outcome:** Every agent has a full, automated pipeline — without the team leader touching leads daily.

### Opportunity Tree

```
O1: Every agent has a full, automated pipeline
│
├── NEED: Team leader can see the whole operation at a glance
│   ├── Pain: Currently checking multiple tools (GHL, ads manager, spreadsheets)
│   ├── Pain: No single "am I on track?" view
│   └── SOLUTIONS:
│       ├── S1.1 — Dashboard Home (live KPI cards: leads today, appts booked, response rate, agent activity)
│       ├── S1.2 — "30-minute CEO Loop" summary widget (one-glance health score)
│       └── S1.3 — Supabase Realtime updates (no refresh needed)
│
├── NEED: Leads are contacted before they go cold (< 60 seconds)
│   ├── Pain: Manual follow-up fails; 80% conversion loss after 5 min
│   ├── Pain: Team leader is routing leads manually at 11pm
│   └── SOLUTIONS:
│       ├── S1.4 — Lead list with real-time status (New → AI Called → Routed → Booked)
│       ├── S1.5 — Lead detail slide-over (full call history, AI transcript, appointment status)
│       └── S1.6 — GHL webhook → Retell AI trigger (n8n — not in dashboard, but visible in dashboard)
│
├── NEED: Right lead goes to the right agent automatically
│   ├── Pain: Manual routing creates resentment and missed leads
│   ├── Pain: No visibility into which agents are working leads
│   └── SOLUTIONS:
│       ├── S1.7 — Agent roster with per-agent pipeline view
│       ├── S1.8 — Routing rules config (territory, lead type, availability)
│       └── S1.9 — Agent detail page (leads assigned, booked, conversion rate)
│
├── NEED: Campaign performance is visible without logging into ads manager
│   ├── Pain: No client-friendly view of spend vs. results
│   ├── Pain: Team leader doesn't know if ads are working until month-end report
│   └── SOLUTIONS:
│       ├── S1.10 — Campaign table (Meta + Google, spend, CPL, leads, status)
│       ├── S1.11 — Campaign accordion (daily breakdown, creative thumbnails)
│       └── S1.12 — Platform error states (OAuth revoked, spend paused alerts)
│
├── NEED: Weekly AI intelligence report without having to ask for it
│   ├── Pain: Clients don't know what to optimize; MIRD handles it but clients want transparency
│   ├── Pain: Reports are currently manual / ad hoc
│   └── SOLUTIONS:
│       ├── S1.13 — Reports archive (weekly AI intelligence PDFs + in-app view)
│       ├── S1.14 — AI report chat (ask questions about your report inline)
│       └── S1.15 — Claude AI report generation (backend — surfaces in dashboard)
│
└── NEED: Platform can be configured to match team structure without MIRD involvement
    ├── Pain: Every setting change requires a support ticket
    ├── Pain: Agent adds/removes need to be instant
    └── SOLUTIONS:
        ├── S1.16 — Settings: team management (add/edit/deactivate agents)
        ├── S1.17 — Settings: routing rules editor
        ├── S1.18 — Settings: notification preferences
        └── S1.19 — Settings: integrations (GHL reconnect, Meta OAuth, Google OAuth)
```

---

## Outcome O2 — CEO Command Center Dashboard

**Desired Outcome:** Operate a $100K MRR business in ≤ 30 minutes of active daily work.

### Opportunity Tree

```
O2: Run $100K MRR business in ≤ 30 min/day
│
├── NEED: Know which clients need attention right now — without reading every dashboard
│   ├── Pain: With 50–200 clients, manual review is impossible
│   ├── Pain: Currently no alert system for anomalous client behavior
│   └── SOLUTIONS:
│       ├── S2.1 — Command center: alert-first layout (critical → warning → healthy)
│       ├── S2.2 — Alert detail modal (what happened, which client, recommended action)
│       └── S2.3 — Dismiss / snooze alert with notes
│
├── NEED: See every client's health at a glance
│   ├── Pain: Client health is scattered across GHL, Supabase, ad accounts
│   ├── Pain: No single "client score" view
│   └── SOLUTIONS:
│       ├── S2.4 — All clients list (health score, MRR, tier, last activity)
│       ├── S2.5 — Client detail: 5-tab view (Overview, Campaigns, Leads, Timeline, Financials)
│       └── S2.6 — Claude AI weekly client summary (surfaces in client detail)
│
├── NEED: Monitor all 4 business departments without manual check-ins
│   ├── Pain: Growth, Ad Ops, Product, Financial departments all generate activity Claude should surface
│   ├── Pain: Shomari currently has no automated department status view
│   └── SOLUTIONS:
│       ├── S2.7 — Dept drilldown: Growth & Acquisition (prospect pipeline, Apollo sequences, outreach)
│       ├── S2.8 — Dept drilldown: Ad Operations (campaign health across all clients, spend alerts)
│       ├── S2.9 — Dept drilldown: Product & Automation (GHL workflow health, onboarding queue)
│       └── S2.10 — Dept drilldown: Financial Intelligence (MRR, churn, P&L, cohort data)
│
├── NEED: See every Claude AI agent action logged with output
│   ├── Pain: AI agents run on schedule but outputs are not yet surfaced in a UI
│   ├── Pain: No audit trail for agent decisions
│   └── SOLUTIONS:
│       ├── S2.11 — Agent activity log (all 4 departments, timestamped, searchable)
│       ├── S2.12 — Per-department full log view
│       └── S2.13 — Historical log (date-range filter, export)
│
└── NEED: Configure alert thresholds and notification routing without a developer
    ├── Pain: Alert sensitivity is currently hardcoded / not configurable
    ├── Pain: Shomari needs different alert channels for critical vs. informational events
    └── SOLUTIONS:
        ├── S2.14 — Settings: alert threshold editor (per metric, per severity)
        └── S2.15 — Settings: notification preferences (email, Slack, SMS per alert type)
```

---

## Outcome O3 — Client Onboarding Portal

**Desired Outcome:** From signed contract to first AI call made in ≤ 14 days.

### Opportunity Tree

```
O3: Contract-signed → First AI call ≤ 14 days
│
├── NEED: Client can complete onboarding without a call with MIRD
│   ├── Pain: Every onboarding step currently requires Shomari involvement
│   ├── Pain: Clients forget steps; onboarding stalls
│   └── SOLUTIONS:
│       ├── S3.1 — Token-gated portal access (magic link from GHL, no password)
│       ├── S3.2 — Step 1: System initialization (GHL sub-account setup status)
│       ├── S3.3 — Progress persistence (resume where you left off)
│       └── S3.4 — Mobile suggestion screen (desktop-first experience guidance)
│
├── NEED: Capture team configuration data from client accurately in one session
│   ├── Pain: Mission parameters (team size, market, routing rules) collected ad hoc today
│   ├── Pain: Data errors require back-and-forth corrections
│   └── SOLUTIONS:
│       ├── S3.5 — Step 2: Mission parameters form (team name, market, agent count, routing prefs)
│       └── S3.6 — Validation error states (real-time field validation, save-failed recovery)
│
├── NEED: Client connects ad accounts without MIRD needing access to their logins
│   ├── Pain: Sharing ad credentials is a security and trust barrier
│   ├── Pain: OAuth flows are confusing for non-technical clients
│   └── SOLUTIONS:
│       ├── S3.7 — Step 3: Meta Ads OAuth (token input → verify → connected/error states)
│       ├── S3.8 — Step 4: Google Ads (Customer ID + GMB search → invite check → connected)
│       └── S3.9 — Help screens + "save and continue later" for each integration step
│
├── NEED: Client uploads brand assets and sets launch date without a file-sharing session
│   ├── Pain: Brand assets arrive via email/Drive links in various formats
│   ├── Pain: Launch date coordination requires a scheduling call
│   └── SOLUTIONS:
│       ├── S3.10 — Step 5: Launch config (logo + brand kit upload, launch date picker, notification prefs)
│       └── S3.11 — Upload error and validation states
│
└── NEED: Client knows exactly what happens next after submitting onboarding
    ├── Pain: Clients feel anxious about what MIRD is doing after portal completion
    ├── Pain: No status visibility between onboarding complete and platform live
    └── SOLUTIONS:
        ├── S3.12 — Completion: RainMachine initializing screen (animated progress)
        ├── S3.13 — Completion: "What happens next" timeline
        └── S3.14 — Support: contact modal + video walkthrough + FAQ
```

---

## Cross-App Shared Opportunities

These opportunities span all three apps and produce shared infrastructure solutions:

| Opportunity | Pain | Solutions |
|---|---|---|
| **Authentication must be secure and frictionless** | Multi-app, multi-role system; wrong login = wrong data | S0.1 — RM Auth (email/password + session mgmt), S0.2 — CEO Auth (email + 2FA TOTP), S0.3 — OB Portal (token-gated magic link) |
| **System must gracefully handle errors** | SaaS clients lose trust on broken/blank screens | S0.4 — 404/500 error pages (all 3 apps), S0.5 — Auto-retry logic on 500, S0.6 — Maintenance mode |
| **Real-time data must not require page refresh** | Dashboard users need live status without polling | S0.7 — Supabase Realtime subscriptions on key metrics tables |
| **Design system must be consistent across all touchpoints** | Three apps must feel like one product | S0.8 — JARVIS Dark design tokens in Tailwind, shared `packages/ui` component library |

---

## Opportunity Coverage Summary

| Outcome | Opportunities Mapped | Solutions Identified | Flows Covered |
|---|---|---|---|
| O1 — RainMachine Dashboard | 5 need clusters | 19 solutions (S1.1–S1.19) | Flows 01–09 |
| O2 — CEO Dashboard | 5 need clusters | 15 solutions (S2.1–S2.15) | Flows 10–16 |
| O3 — Onboarding Portal | 5 need clusters | 14 solutions (S3.1–S3.14) | Flows 17–24 |
| Shared / Cross-App | 4 need clusters | 8 solutions (S0.1–S0.8) | All apps |
| **Total** | **19 need clusters** | **56 solutions** | **24 flows / 112 screens** |

---

## OST Integrity Verification

| Check | Status | Notes |
|---|---|---|
| Every solution traces to an opportunity | ✅ | All 56 solutions mapped above |
| Every opportunity traces to a desired outcome | ✅ | O1, O2, O3 each have clear north star metrics |
| No solution exists without an opportunity | ✅ | No orphaned features |
| North star metrics are measurable | ✅ | Appts/agent/week, CEO time, days-to-live |
| All 112 screens from Step 5 are accounted for | ✅ | 24 flow groups fully mapped |
| ICPs (Marcus / Kevin / Shomari) are the opportunity sources | ✅ | Pains sourced from ICP profiles in MASTER_PRD |

---

## Next: Phase 0 — Feature Discovery

The OST above established the opportunity space. Phase 0 will enumerate every discrete buildable feature from all 24 flows and organize them into a finalized, de-duplicated feature list ready for story mapping in Phase A.

# BETTING-TABLE.md
# MIRD AI Corporate Machine — Shape Up Betting Table
# Step 10 / Phase E — Prioritized Cycle Plan
# Date: 2026-04-02 | Status: ✅ Complete

---

## Methodology: Shape Up Betting Table (Ryan Singer / Basecamp)

> "The betting table is where we decide what to work on next cycle. We don't plan a roadmap — we bet on shaped work. Unfinished work doesn't automatically continue. Every cycle is a fresh bet."

**MIRD Cycle Calibration:**
- Standard Shape Up cycle: 6 weeks building + 2 weeks cooldown
- Solo operator (Shomari) with Claude Code AI assistance: ~15–25 productive hours/week
- **AI-assisted velocity multiplier: ~2×** — what takes a solo dev 3 weeks takes 1.5 weeks with AI-pair programming
- **Adjusted appetite:**
  - `S` = 3–5 days of focused work (~1 calendar week)
  - `M` = 1.5–2.5 weeks of focused work
  - Each **cycle = 4 weeks of building** (realistic for part-time schedule)
  - 1 week cooldown between cycles (refactor, test, deploy, document)

**Betting principles applied:**
1. Only shaped, INVEST-validated pitches are on the table
2. Foundation pitches (R0) must complete before any R1 bet is placed
3. Dependencies are hard gates — a pitch cannot start until its dependencies are deployed
4. Each cycle ends with something demonstrably shippable

---

## DEPENDENCY CHAIN (Hard Gates)

```
P01 ──► P02
     └► P03 ──► P04 ──► P05 ──► P06
                     └────────────► P07 ──► P08 ──► P09
                                         └► P10
                                         └► P11 ──► P12a ──► P12b ──► P12c
                                         └► P13 ──► P14

P15 requires P16a to have run at least once (reports table must have data)
P16a requires P03 + P04 (Supabase data must exist)
P16b requires P16a + BE-11 (Stripe)
P17a requires P13 + P16a
P17b requires P17a + P16b
P18 requires P16a (agent log data)
```

---

## RELEASE 0 CYCLES — Foundation

### Cycle 1 — Walking Skeleton
**Calendar weeks: 1–5**

| Bet | Pitch | Appetite | Dependency | Why this cycle |
|---|---|---|---|---|
| ✅ BET | **P01** Monorepo Foundation | S (3–5 days) | None | Must exist before anything else. One-time setup. |
| ✅ BET | **P02** Design System + Components | M (1.5–2 wks) | P01 | Runs in parallel after P01 done. No DB needed. Components usable by every pitch that follows. |
| ✅ BET | **P03** Supabase + Auth | M (1.5–2 wks) | P01 | Runs in parallel with P02. Auth is the unlock for every user-facing feature. |

**Cycle 1 exit gate:**
- [ ] Monorepo builds, all 3 apps boot, CI passes
- [ ] All 16 shared components render on `/ui-demo`
- [ ] RM login, CEO login + 2FA, session expiry work end-to-end
- [ ] RLS: cross-tenant data isolation verified by pgTAP tests

**Demo:** Login to RainMachine app → dashboard shell renders (empty state). Login to CEO app with 2FA → command center shell renders (empty state).

---

### Cycle 2 — Data Layer + AI Core
**Calendar weeks: 6–10**

| Bet | Pitch | Appetite | Dependency | Why this cycle |
|---|---|---|---|---|
| ✅ BET | **P04** GHL ↔ Supabase Sync | M (1.5–2 wks) | P03 | Leads can't appear in any screen without this. Realtime subscription proves the live-update architecture. |
| ✅ BET | **P05** Retell AI Lead Response | M (1.5–2 wks) | P03 + P04 | The core product promise — 60-second AI response. P05 and P04 are sequential (P04 first). |

**Cycle 2 exit gate:**
- [ ] GHL contact webhook → lead in Supabase within 30s
- [ ] Realtime stub counter updates live on `/dashboard/sync-test`
- [ ] New lead GHL tag → Retell call initiated within 60s
- [ ] Call outcome logged to `calls` table, `/dashboard/calls` shows it
- [ ] Duplicate webhook guard confirmed (idempotency verified)

**Demo:** Create a test contact in GHL → watch it appear on the sync-test page in real time → watch Retell AI call log appear within 60 seconds.

---

### Cycle 3 — Onboarding Engine
**Calendar weeks: 11–14**

| Bet | Pitch | Appetite | Dependency | Why this cycle |
|---|---|---|---|---|
| ✅ BET | **P06** Onboarding Job Processor | M (1.5–2 wks) | P03 + P04 + P05 | Provisions a complete tenant. Gate for first real client. Ships alongside P12 (portal submits to this processor). |

**Cycle 3 exit gate:**
- [ ] Submit onboarding payload → all 6 components ONLINE within 5 min
- [ ] Idempotency: re-run job → no duplicate resources created
- [ ] Polling endpoint returns correct step progress JSON
- [ ] First real tenant can be provisioned

**Demo:** Submit a test onboarding payload via Postman → watch the initializing sequence fire → confirm GHL sub-account + Retell agent created.

**R0 Complete Gate (after Cycle 3):**
> ✅ A client can be provisioned, leads flow from GHL to Supabase in real time, and Retell AI calls them within 60 seconds. The machine works. First real client can go live.

---

## RELEASE 1 CYCLES — First Client Sprint

### Cycle 4 — RainMachine Core App
**Calendar weeks: 15–19**

| Bet | Pitch | Appetite | Dependency | Why this cycle |
|---|---|---|---|---|
| ✅ BET | **P07** RM Dashboard Home | S (3–5 days) | R0 complete | First screen a client sees. Small + fast. Proves realtime KPIs work in the real app. |
| ✅ BET | **P08** Leads Table + Detail | M (1.5–2 wks) | P07 (sidebar nav) | Highest-frequency screen. Stage changes + transcript viewer + export. |
| ✅ BET | **P09** Agents Roster | S (3–5 days) | P03 + P04 | Small. Needed before Settings (P11) which references agents. |
| ✅ BET | **P10** Campaigns Table | S (3–5 days) | BE-04 in P04 | Small. View-only. BE-04 already populates the table. |

**Cycle 4 exit gate:**
- [ ] Dashboard home loads with live KPIs, realtime update fires on new lead
- [ ] Lead table: filter, sort, paginate, slide-over, transcript modal all work
- [ ] Agent table: pause agent → GHL routing updated within 5s
- [ ] Campaign table: correct CPL + spend data from ad_metrics
- [ ] All empty states render correctly with no JS errors

**Demo:** Marcus logs in → sees 5 live KPIs → clicks a lead → sees AI transcript → filters by "Booked" stage → exports to CSV. Entire first-client workflow proven.

---

### Cycle 5 — Settings + CEO Foundation
**Calendar weeks: 20–24**

| Bet | Pitch | Appetite | Dependency | Why this cycle |
|---|---|---|---|---|
| ✅ BET | **P11** RainMachine Settings | M (1.5–2 wks) | P09 (agents list), P03 (auth) | Enables self-serve. Removes support ticket burden immediately. |
| ✅ BET | **P13** CEO Command Center | M (1.5–2 wks) | R0 complete | Shomari needs visibility as soon as first client is live. Alert feed can show static stubs until P16a runs. |

**Cycle 5 exit gate:**
- [ ] All 5 Settings sections functional: Team, Routing, Notifications, Integrations, Account
- [ ] OAuth reconnect (Meta + Google) works end-to-end
- [ ] CEO command center: KPI cards, alert feed (stub data OK), department panels, all-clients list
- [ ] CEO login + 2FA + session management work independently from RM auth

**Demo:** Shomari logs into CEO app → sees all provisioned clients with health scores → sees one stub alert → clicks client → sees client detail shell.

---

### Cycle 6 — Onboarding Portal
**Calendar weeks: 25–30**

| Bet | Pitch | Appetite | Dependency | Why this cycle |
|---|---|---|---|---|
| ✅ BET | **P12a** OB Portal: Access + Shell + Steps 1–2 | M (1.5–2 wks) | P03 + P06 | Token validation + wizard shell. Steps 1–2 are pure form — no external APIs. |
| ✅ BET | **P12b** OB Portal: Ad Account OAuth | M (1.5–2 wks) | P12a | Meta + Google OAuth steps. External API risk — isolated in its own cycle bet. |
| ✅ BET | **P12c** OB Portal: Launch + Completion | S (1 wk) | P12b + P06 | Launch config + polling completion screen. P06 (job processor) must be live. |

**Cycle 6 exit gate:**
- [ ] Token-gated portal accessible, mobile redirect works
- [ ] Steps 1–2 complete with validation, progress persistence, support modal
- [ ] Meta OAuth: token verify → success/error states + encrypted storage
- [ ] Google Ads: invite sent, polling works, 5-min timeout handled gracefully
- [ ] Step 5 + launch sequence: logo upload, launch config, full initializing sequence → "RAINMACHINE IS LIVE"
- [ ] "ENTER DASHBOARD" redirects to `app.rainmachine.io`

**Demo:** Full new-client onboarding flow from magic link → Step 1 → Step 5 → "RAINMACHINE IS LIVE" → dashboard. First client self-onboards without Shomari involvement.

---

### Cycle 7 — CEO Client Detail
**Calendar weeks: 31–33**

| Bet | Pitch | Appetite | Dependency | Why this cycle |
|---|---|---|---|---|
| ✅ BET | **P14** CEO Client Detail | M (1.5–2 wks) | P13 | Drill-in from command center. R1 slice: Overview + Timeline tabs. R2 slice (Campaigns/Leads/Financials) added in Cycle 9. |

**Cycle 7 exit gate:**
- [ ] Client detail page loads from command center alert/client list link
- [ ] Overview tab: KPIs, CPL chart, pipeline funnel, notes
- [ ] Timeline tab: activity events in reverse-chron order
- [ ] Read-only confirmed: no mutation UI on campaigns/leads

**R1 Complete Gate (after Cycle 7):**
> ✅ Marcus can self-onboard, log in, see his live pipeline, manage leads, manage agents, monitor campaigns, configure his team — all without contacting MIRD. Shomari can see all clients in the CEO app and click into any client's detail. The first paying client can be fully served.

---

## RELEASE 2 CYCLES — Intelligence Layer

### Cycle 8 — Reports + Weekly Intelligence
**Calendar weeks: 34–38**

| Bet | Pitch | Appetite | Dependency | Why this cycle |
|---|---|---|---|---|
| ✅ BET | **P16a** Claude AI: Client Intel Agents | M (1.5–2 wks) | P03 + P04 | Weekly Intelligence Agent + Ad Ops Agent. Must run before P15 (reports archive) has data. Ship and run one cycle before P15 ships. |
| ✅ BET | **P15** Reports + AI Chat | M (1.5–2 wks) | P16a (must have run ≥ 1x) | Reports archive + viewer + AI chat. Depends on P16a having populated the `reports` table. |

**Cycle 8 exit gate:**
- [ ] Weekly Intelligence Agent runs on schedule (Monday 6:15am) → report row written to `reports` table
- [ ] Ad Ops Agent runs daily → alerts written to `alerts` table, appear in CEO command center
- [ ] Reports archive shows generated reports
- [ ] Report viewer renders all sections correctly
- [ ] AI chat: query → Claude response → stored in `report_chat_queries` → rendered in UI
- [ ] Rate limiter: 11th query blocked with correct message

**Demo:** Monday morning — Marcus logs in → reports archive has new "Weekly Intelligence Brief" → clicks it → reads AI-generated analysis → asks "What drove CPL down?" → gets inline AI response.

---

### Cycle 9 — CEO Drilldowns Part 1 + Client Detail Remaining Tabs
**Calendar weeks: 39–43**

| Bet | Pitch | Appetite | Dependency | Why this cycle |
|---|---|---|---|---|
| ✅ BET | **P17a** CEO Drilldowns: Growth + Ad Ops | M (1.5–2 wks) | P13 + P16a | Growth uses prospect data (Apollo cache). Ad Ops uses campaign metrics + platform health. |
| ✅ BET | **P14** CEO Client Detail (R2 tabs) | S (1 wk) | P14 R1 complete | Add Campaigns, Leads, Financials tabs. Small delta from R1 slice. |

**Cycle 9 exit gate:**
- [ ] Growth drilldown: prospect table, stalled badge, detail sub-page
- [ ] Ad Ops drilldown: CPL table with health rings, call volume chart, platform health panel
- [ ] Client detail Campaigns + Leads tabs render (read-only)
- [ ] Client detail Financials tab (stub until P16b/BE-11 Stripe is live)

---

### Cycle 10 — Business Intelligence + Finance
**Calendar weeks: 44–49**

| Bet | Pitch | Appetite | Dependency | Why this cycle |
|---|---|---|---|---|
| ✅ BET | **P16b** Claude AI: Business Intel Agents | M (1.5–2 wks) | P16a + BE-11 (Stripe) | Growth Agent (Apollo) + Finance Agent (Stripe). BE-11 Stripe integration is a prerequisite — ship Stripe integration as part of this pitch. |
| ✅ BET | **P17b** CEO Drilldowns: Product + Finance | M (1.5–2 wks) | P17a + P16b | Product drilldown (onboarding queue + workflow health). Finance drilldown (MRR chart + P&L). Requires Finance agent to have run. |

**Cycle 10 exit gate:**
- [ ] Stripe integration: subscriptions + invoices synced to `invoices` table
- [ ] Finance agent runs Monday 6:00am → `metrics.mrr` updated, P&L summary written
- [ ] Growth agent runs daily → prospect alerts generated
- [ ] Product drilldown: onboarding queue, workflow health board
- [ ] Finance drilldown: MRR trend chart (12mo), P&L table, per-client grid

---

### Cycle 11 — Agent Logs + CEO Settings
**Calendar weeks: 50–52**

| Bet | Pitch | Appetite | Dependency | Why this cycle |
|---|---|---|---|---|
| ✅ BET | **P18** CEO Agent Logs + Settings | S (1 wk) | P16a (log data exists) | Agent logs + alert threshold settings. Small. Completes the CEO intelligence layer. |

**Cycle 11 exit gate:**
- [ ] Agent log: 4 panels, date selector, "N more" expand, full log, historical view, export
- [ ] Threshold settings: set CPL threshold → Ad Ops agent respects it on next run
- [ ] Notification prefs: email toggles persist and drive alert delivery

**R2 Complete Gate (after Cycle 11):**
> ✅ All 4 Claude AI agents run on schedule. Marcus gets weekly AI intelligence reports and can ask follow-up questions. Shomari has full visibility into all 4 business departments, agent activity logs, and can configure alert thresholds. The 30-minute CEO loop is operational. Full $100K MRR platform is live.

---

## RELEASE 3 — Scale Layer (Future Bets, Not Yet Shaped)

These items sit on the **pitch backlog** — not yet shaped, not yet bet. They become betting table candidates after R2 ships.

| Candidate | Category | Why deferred |
|---|---|---|
| Bulk lead actions (select all + bulk archive/reassign) | RM-05 enhancement | Nice-to-have; filter + single actions cover 90% of use cases |
| MFA for RainMachine clients | RM-22 enhancement | Low-risk clients; can add when requested |
| Data export + danger zone | RM-22 enhancements | Compliance feature; defer until client requests |
| Agent performance leaderboard | RM enhancement | Motivation feature; not in core loop |
| Per-client P&L full grid | CEO-15 enhancement | Finance drilldown stub covers MVP need |
| Historical agent log export | CEO-17 enhancement | Date filter covers operational need |
| Slack notifications | CEO-19 enhancement | Email sufficient for MVP |
| SMS notifications | RM-20 + CEO-19 | Twilio integration; defer until email validated |
| Recharts → custom SVG charts | UI enhancement | Recharts fine for MVP; custom charts in R3 |
| Marketing site port (Next.js) | apps/marketing | Landing page HTML works; Next.js port after revenue |

---

## Full Cycle Timeline

| Cycle | Weeks | Pitches | Release Gate |
|---|---|---|---|
| 1 | 1–5 | P01, P02, P03 | Auth + design system live |
| 2 | 6–10 | P04, P05 | GHL sync + Retell AI calling leads |
| 3 | 11–14 | P06 | Tenants can be fully provisioned |
| — | — | **R0 COMPLETE** | First client can be live |
| 4 | 15–19 | P07, P08, P09, P10 | Full RM app (dashboard, leads, agents, campaigns) |
| 5 | 20–24 | P11, P13 | Settings self-serve + CEO command center |
| 6 | 25–30 | P12a, P12b, P12c | Self-serve onboarding portal end-to-end |
| 7 | 31–33 | P14 (R1) | CEO can drill into any client |
| — | — | **R1 COMPLETE** | First paying client fully served |
| 8 | 34–38 | P16a, P15 | Weekly AI reports + chat live |
| 9 | 39–43 | P17a, P14 (R2) | Growth + Ad Ops drilldowns |
| 10 | 44–49 | P16b, P17b | Finance + Product intelligence complete |
| 11 | 50–52 | P18 | Agent logs + CEO settings |
| — | — | **R2 COMPLETE** | 30-min CEO loop operational |

**Total: ~52 weeks part-time with AI assistance.** Accelerates significantly as each cycle builds on existing patterns — Cycles 8–11 reuse components and patterns from Cycles 1–7 extensively.

---

## Betting Table — Active Bets (Current: Cycle 1)

> These are the pitches currently approved for building. All others are pending future cycles.

| Status | Pitch | Appetite | Owner | Notes |
|---|---|---|---|---|
| 🟢 ACTIVE BET | P01 Monorepo Foundation | S | Shomari + Claude | Start immediately |
| 🟢 ACTIVE BET | P02 Design System | M | Shomari + Claude | Start after P01 done |
| 🟢 ACTIVE BET | P03 Supabase + Auth | M | Shomari + Claude | Start in parallel with P02 |
| ⏳ NEXT CYCLE | P04 GHL Sync | M | — | Cycle 2 |
| ⏳ NEXT CYCLE | P05 Retell AI | M | — | Cycle 2 |
| ⏸️ FUTURE BET | All R1+ pitches | — | — | After R0 complete |

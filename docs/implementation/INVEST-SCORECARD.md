# INVEST-SCORECARD.md
# MIRD AI Corporate Machine — INVEST Criteria Validation
# Step 10 / Phase C — Bill Wake Methodology
# Date: 2026-04-02 | Status: ✅ Complete

---

## Methodology: INVEST Criteria (Bill Wake, 2003)

> "Good user stories are Independent, Negotiable, Valuable, Estimable, Small, and Testable. A story that fails any criterion should be reshaped before it enters the betting table."

**Scoring:** 1–5 per criterion. Threshold: all criteria ≥ 3, average ≥ 3.5.
**Flag:** Any criterion < 3 = ⚠️ Remediation required.
**Fail:** Any criterion = 1 OR average < 3.0 = ❌ Must reshape before betting.

**Independence note:** For this project, "Independent" is measured *within its release tier* — not across all releases. Foundation pitches (R0) are pre-requisites by definition; R1/R2 pitches are evaluated for independence from each other within their release window.

---

## Scoring Grid — 18 Original Pitches

| Pitch | I | N | V | E | S | T | Avg | Status |
|---|---|---|---|---|---|---|---|---|
| P01 Monorepo Foundation | 5 | 3 | 4 | 5 | 5 | 5 | **4.5** | ✅ Pass |
| P02 Design System | 4 | 4 | 4 | 4 | 4 | 4 | **4.0** | ✅ Pass |
| P03 Supabase + Auth | 4 | 3 | 5 | 4 | 4 | 5 | **4.2** | ✅ Pass |
| P04 GHL ↔ Supabase Sync | 3 | 4 | 5 | 4 | 4 | 4 | **4.0** | ✅ Pass |
| P05 Retell AI Workflow | 3 | 4 | 5 | 3 | 4 | 4 | **3.8** | ✅ Pass |
| P06 Onboarding Job Processor | 3 | 4 | 4 | 3 | 4 | 4 | **3.7** | ✅ Pass |
| P07 RM Dashboard Home | 3 | 4 | 5 | 5 | 5 | 5 | **4.5** | ✅ Pass |
| P08 Leads Table + Detail | 4 | 4 | 5 | 4 | 4 | 5 | **4.3** | ✅ Pass |
| P09 Agents Roster | 4 | 4 | 4 | 5 | 5 | 4 | **4.3** | ✅ Pass |
| P10 Campaigns Table | 4 | 4 | 4 | 5 | 5 | 4 | **4.3** | ✅ Pass |
| P11 RM Settings | 4 | 4 | 4 | 4 | 4 | 4 | **4.0** | ✅ Pass |
| **P12 Onboarding Portal** | 3 | 4 | 5 | 3 | **2** | 4 | **3.5** | ⚠️ Split |
| P13 CEO Command Center | 4 | 4 | 5 | 4 | 4 | 4 | **4.2** | ✅ Pass |
| P14 CEO Client Detail | 4 | 4 | 4 | 4 | 4 | 4 | **4.0** | ✅ Pass |
| P15 Reports + AI Chat | 3 | 4 | 5 | 3 | 4 | **3** | **3.7** | ✅ Pass* |
| **P16 Claude AI Agent Suite** | 3 | 4 | 5 | 3 | **2** | **2** | **3.2** | ⚠️ Split |
| **P17 CEO Dept Drilldowns** | 3 | 4 | 4 | 3 | **2** | 4 | **3.3** | ⚠️ Split |
| P18 CEO Agent Logs + Settings | 4 | 4 | 3 | 5 | 5 | 4 | **4.2** | ✅ Pass |

*P15 T=3 noted — see remediation below.

---

## Detailed Scoring Rationale

### P01 — Monorepo Foundation `4.5 ✅`
| Criterion | Score | Rationale |
|---|---|---|
| **Independent** | 5 | No upstream dependencies. First thing built. |
| **Negotiable** | 3 | Turborepo + pnpm is locked by architecture decision (ADR-01). File structure can flex. |
| **Valuable** | 4 | Not user-facing but every other pitch depends on it. Clear business necessity. |
| **Estimable** | 5 | Exact list of files/configs known. No uncertainty. |
| **Small** | 5 | 1 week. Turbo init + 3 Next.js apps + 3 packages. Well-bounded. |
| **Testable** | 5 | `pnpm turbo build` passes with zero errors. All 3 apps boot locally. CI green. |

---

### P02 — Design System + Component Library `4.0 ✅`
| Criterion | Score | Rationale |
|---|---|---|
| **Independent** | 4 | Depends only on P01 (monorepo must exist). Independent from all other R0 pitches. |
| **Negotiable** | 4 | Exact component API can flex. Which 16 components to build is negotiable at edges. |
| **Valuable** | 4 | Directly prevents UI inconsistency across 3 apps. Saves future dev time. |
| **Estimable** | 4 | 16 components × known scope. Medium confidence. |
| **Small** | 4 | 2–3 weeks. Bounded list. Risk: scope creep into Storybook (explicitly bounded as no-go). |
| **Testable** | 4 | Each component renders without errors. Token values match design spec. Snapshot tests pass. |

---

### P03 — Supabase Schema + RLS + Auth `4.2 ✅`
| Criterion | Score | Rationale |
|---|---|---|
| **Independent** | 4 | Depends on P01. Can be built in parallel with P02. |
| **Negotiable** | 3 | Schema is largely locked — it's the contract for all data. Some table columns negotiable. |
| **Valuable** | 5 | Zero features work without auth and RLS. Maximum foundational value. |
| **Estimable** | 4 | Known tables, known RLS patterns, known auth flows. Medium-high confidence. |
| **Small** | 4 | 2–3 weeks. Risk: RLS policy debugging can run long. Bounded by pgTAP test gate. |
| **Testable** | 5 | Login succeeds/fails correctly. RLS: client A cannot read client B's leads (automated test). 2FA works end-to-end. |

---

### P04 — GHL ↔ Supabase Sync `4.0 ✅`
| Criterion | Score | Rationale |
|---|---|---|
| **Independent** | 3 | Depends on P03 (Supabase schema must exist). But P04 is independent from P02, P05, P06. |
| **Negotiable** | 4 | Field mapping details, webhook event selection, and sync frequency are all negotiable. |
| **Valuable** | 5 | Without sync, the dashboard has no data. Highest dependency pitch in R0. |
| **Estimable** | 4 | n8n workflow patterns are known. GHL webhook behavior is documented. Medium-high confidence. |
| **Small** | 4 | 2–3 weeks. Risk: GHL webhook reliability edge cases. Bounded by idempotency key. |
| **Testable** | 4 | Create a lead in GHL → appears in Supabase within 30s. Dashboard KPI card updates live. |

---

### P05 — Retell AI Lead Response Workflow `3.8 ✅`
| Criterion | Score | Rationale |
|---|---|---|
| **Independent** | 3 | Depends on P03 + P04 (leads must exist in Supabase). Independent from P06. |
| **Negotiable** | 4 | Call script, outcome mapping, and retry logic are all negotiable. |
| **Valuable** | 5 | This IS the core product promise — 60-second AI response. Highest user-facing value in R0. |
| **Estimable** | 3 | Retell AI API behavior partially unknown until integrated. External API risk. |
| **Small** | 4 | 2–3 weeks. Bounded by explicit no-gos (no custom voice training, no SMS fallback). |
| **Testable** | 4 | Submit test lead → Retell call fires within 60s → outcome logged in `calls` table → dashboard status updates. Requires Retell test mode. |

---

### P06 — Onboarding Job Processor `3.7 ✅`
| Criterion | Score | Rationale |
|---|---|---|
| **Independent** | 3 | Depends on P03, P04, P05 (must be able to provision a complete tenant). Last R0 pitch. |
| **Negotiable** | 4 | Provisioning steps, error recovery behavior, and polling interval are all negotiable. |
| **Valuable** | 4 | Enables self-serve client onboarding. Reduces Shomari's onboarding time from hours to minutes. |
| **Estimable** | 3 | GHL sub-account creation API behavior is unpredictable. Edge Function cold-start latency unknown. |
| **Small** | 4 | 2–3 weeks. Risk: GHL API latency. Bounded by explicit idempotency design. |
| **Testable** | 4 | Submit onboarding payload → all 6 components show ONLINE in 5 minutes. Re-run is safe (idempotency verified). |

---

### P07 — RainMachine Dashboard Home `4.5 ✅`
| Criterion | Score | Rationale |
|---|---|---|
| **Independent** | 3 | Depends on R0 foundation. Within R1, independent from all other R1 pitches. |
| **Negotiable** | 4 | Card layout, feed length, widget order all negotiable. Data source is fixed. |
| **Valuable** | 5 | First screen a client sees. Determines first impression and trust on day one. |
| **Estimable** | 5 | Small scope, known components, known data sources. High confidence. |
| **Small** | 5 | 1 week. 4 features (RM-01–04), all UI-only reading from existing Supabase tables. |
| **Testable** | 5 | KPIs display correct values. Realtime update fires on new lead. Empty states render when no data. Sidebar collapses on < 1280px. |

---

### P08 — Leads Table, Detail & AI Transcript `4.3 ✅`
| Criterion | Score | Rationale |
|---|---|---|
| **Independent** | 4 | Depends on R0 + P07 (sidebar nav). Independent from P09, P10, P11 within R1. |
| **Negotiable** | 4 | Column selection, filter options, slide-over fields all negotiable. Core data (lead + call) is fixed. |
| **Valuable** | 5 | Highest-frequency screen in product. Marcus checks this multiple times per day. |
| **Estimable** | 4 | Medium scope, known patterns (DataTable + Drawer). Stage inline update has optimistic locking complexity. |
| **Small** | 4 | 2–3 weeks. Well-bounded by no-gos (no lead creation, no email sending). |
| **Testable** | 5 | Table loads within 2s. Filter by stage shows correct subset. Slide-over opens on row click. Transcript renders from `calls` table. CSV export downloads. |

---

### P09 — Agents Roster & Management `4.3 ✅`
| Criterion | Score | Rationale |
|---|---|---|
| **Independent** | 4 | Depends on R0. Within R1, independent from P08, P10. P11 (Settings > Team) references agent list but is separate. |
| **Negotiable** | 4 | Columns, stat period, detail modal fields all negotiable. |
| **Valuable** | 4 | Agents are the delivery mechanism. Visibility + management = team leader's operational control. |
| **Estimable** | 5 | Small, known scope. 3 features (table + modal + import). |
| **Small** | 5 | 1 week. Well-bounded. Bulk import is the only non-trivial piece. |
| **Testable** | 4 | Agents display with correct status. Pause agent → removed from routing in GHL within 5s. Bulk import 3 agents → all appear in table. |

---

### P10 — Campaigns Table & Detail `4.3 ✅`
| Criterion | Score | Rationale |
|---|---|---|
| **Independent** | 4 | Depends on R0 (BE-04 ad sync). Within R1, independent from all other R1 pitches. |
| **Negotiable** | 4 | Column selection, accordion content, sync frequency all negotiable. |
| **Valuable** | 4 | Clients are paying for ads. Visibility without logging into Meta/Google is a clear value add. |
| **Estimable** | 5 | Small, view-only. BE-04 (data sync) is pre-built in R0. |
| **Small** | 5 | 1 week. Read-only table from existing `campaigns` + `ad_metrics` tables. |
| **Testable** | 4 | Campaign data matches Meta Ads Manager figures (spot-check). Platform error banner shows on OAuth revoke. Accordion expands on row click. |

---

### P11 — RainMachine Settings `4.0 ✅`
| Criterion | Score | Rationale |
|---|---|---|
| **Independent** | 4 | Depends on R0 + P09 (agents list needed for Team tab). Independent from P07, P08, P10. |
| **Negotiable** | 4 | Settings structure (5 sections) is fixed but each section's specific fields are negotiable. |
| **Valuable** | 4 | Eliminates support tickets for routine changes. Directly reduces Shomari's time cost. |
| **Estimable** | 4 | Medium, 5 sections. OAuth popup pattern is slightly risky. Well-bounded. |
| **Small** | 4 | 2–3 weeks. Risk: OAuth popup blocking (explicitly bounded with tab fallback). |
| **Testable** | 4 | Each setting saves and persists on refresh. OAuth reconnect completes end-to-end. Danger zone actions require confirmation. |

---

### P12 — Client Onboarding Portal ⚠️ SPLIT REQUIRED

**Original score:**
| I | N | V | E | S | T | Avg |
|---|---|---|---|---|---|---|
| 3 | 4 | 5 | 3 | **2** | 4 | 3.5 |

**S = 2 FAIL:** At 5–6 weeks for a solo developer working part-time, this pitch is too large to plan reliably. The 5-step wizard + 3 external OAuth integrations + job processor polling + completion sequence contains too many distinct risk surfaces to treat as one betting item.

**Remediation — Split into 3 pitches:**

#### P12a — Onboarding Portal: Access + Shell + Steps 1–2
| I | N | V | E | S | T | Avg |
|---|---|---|---|---|---|---|
| 3 | 4 | 4 | 4 | 4 | 5 | **4.0 ✅** |

Scope: Token validation, mobile redirect, wizard shell, Step 1 (contract review), Step 2 (mission params), support modal skeleton. 2 weeks.
Boundary: OAuth integrations explicitly excluded.

#### P12b — Onboarding Portal: Ad Account Integrations (Steps 3–4)
| I | N | V | E | S | T | Avg |
|---|---|---|---|---|---|---|
| 3 | 4 | 5 | 3 | 4 | 4 | **3.8 ✅** |

Scope: Meta Ads OAuth flow (Step 3), Google Ads Customer ID + GMB search (Step 4), token encryption, help section, "save and return later." 2–3 weeks.
Boundary: P12a must ship first (wizard shell required). Estimability = 3 due to Google Ads invite latency.

#### P12c — Onboarding Portal: Launch Config + Completion + Support (Step 5)
| I | N | V | E | S | T | Avg |
|---|---|---|---|---|---|---|
| 3 | 4 | 5 | 4 | 5 | 5 | **4.3 ✅** |

Scope: Logo/photo upload, launch date picker, notification toggles, "LAUNCH RAINMACHINE" CTA, initializing sequence (BE-09 polling), "what happens next" screen, full support modal + FAQ. 1–2 weeks.
Boundary: P12b must ship first (Steps 3–4 complete). BE-09 (P06) must be live.

---

### P13 — CEO Command Center `4.2 ✅`
| Criterion | Score | Rationale |
|---|---|---|
| **Independent** | 4 | Depends on R0. Within R1, independent from P14. |
| **Negotiable** | 4 | Alert card layout, KPI selection, department card design all negotiable. |
| **Valuable** | 5 | The CEO's primary daily touchpoint. Enables the 30-minute CEO loop. |
| **Estimable** | 4 | Medium, known patterns. Alert generation depends on BE-07 (can be stubbed for R1). |
| **Small** | 4 | 2–3 weeks. Alerts stubbed from static data initially; BE-07 fills them in R2. |
| **Testable** | 4 | Alerts display sorted by severity. KPIs match Supabase `metrics` values. Agent status cards show last run time. All clients list paginates. |

---

### P14 — CEO Client Detail `4.0 ✅`
| Criterion | Score | Rationale |
|---|---|---|
| **Independent** | 4 | Depends on P13 (navigation entry point). Ships as R1 (Overview + Timeline) → R2 (remaining tabs). |
| **Negotiable** | 4 | Tab selection, chart type, note-taking format all negotiable. |
| **Valuable** | 4 | Lets Shomari drill into any client without leaving the CEO app. Reduces context switching. |
| **Estimable** | 4 | Medium. Recharts dynamic import pattern is known. R1/R2 split clearly defined. |
| **Small** | 4 | R1 slice (2 tabs) = 1 week. R2 slice (4 tabs) = 1–2 weeks. Each slice well-bounded. |
| **Testable** | 4 | All 5 tabs render correct data. Read-only: no mutations possible from CEO app. Charts render with ≥ 2 data points. |

---

### P15 — Reports + AI Intelligence Chat `3.7 ✅*`
| Criterion | Score | Rationale |
|---|---|---|
| **Independent** | 3 | Depends on BE-05 (Weekly Intelligence Agent must run first to have report data). Can ship UI with empty state. |
| **Negotiable** | 4 | Chat suggestion chips, report section order, inline card format all negotiable. |
| **Valuable** | 5 | AI reports + chat = key product differentiator. Differentiates RainMachine from every competing CRM. |
| **Estimable** | 3 | Claude API chat integration behavior partially uncertain. Token cost + rate limit management adds risk. |
| **Small** | 4 | 2–3 weeks. Well-bounded by no-gos (no PDF, no email delivery). |
| **Testable** | 3 | *Non-deterministic AI outputs require structural testing (not content testing). Acceptance criteria: query returns a response with correct schema, not specific words. Report renders all required sections. |

*T=3 remediation: Acceptance tests validate response structure (JSON schema), not content. A mock Claude API response with known schema is used in CI.

---

### P16 — Claude AI Agent Suite ⚠️ SPLIT REQUIRED

**Original score:**
| I | N | V | E | S | T | Avg |
|---|---|---|---|---|---|---|
| 3 | 4 | 5 | 3 | **2** | **2** | 3.2 |

**S = 2 FAIL, T = 2 FAIL:** 4 distinct AI agents with different data sources, prompts, schedules, and output schemas in one pitch is untestable as a unit. Each agent has its own failure modes. Building all four in one cycle means a broken Finance agent can block all four from shipping.

**Remediation — Split into 2 pitches:**

#### P16a — Claude AI: Client Intelligence Agents (Weekly Intel + Ad Ops)
| I | N | V | E | S | T | Avg |
|---|---|---|---|---|---|---|
| 3 | 4 | 5 | 3 | 4 | 3 | **3.7 ✅** |

Scope: BE-05 (Weekly Intelligence Agent — generates reports, writes to `reports` table, sends email via Resend), BE-07 (Ad Ops Agent — reads campaign anomalies, writes alerts). These two agents share the same data sources (Supabase campaigns/metrics). 2–3 weeks.
T = 3: Same structural test approach as P15.

#### P16b — Claude AI: Business Intelligence Agents (Growth + Finance)
| I | N | V | E | S | T | Avg |
|---|---|---|---|---|---|---|
| 3 | 4 | 5 | 3 | 4 | 3 | **3.7 ✅** |

Scope: BE-06 (Growth Agent — reads Apollo prospect data, generates recommendations), BE-08 (Financial Intelligence Agent — reads Stripe + Supabase, generates P&L). Both require BE-11 (Stripe). 2–3 weeks.
Dependency: BE-11 (Stripe) must ship before P16b.

---

### P17 — CEO Department Drilldowns ⚠️ SPLIT REQUIRED

**Original score:**
| I | N | V | E | S | T | Avg |
|---|---|---|---|---|---|---|
| 3 | 4 | 4 | 3 | **2** | 4 | 3.3 |

**S = 2 FAIL:** 4 department drilldown pages with distinct data sources, charts, and sub-pages. At L (5–6 weeks solo) this is too large to commit to as one betting item. The Finance drilldown requires Stripe (BE-11); the others don't.

**Remediation — Split into 2 pitches:**

#### P17a — CEO Drilldowns: Growth & Acquisition + Ad Operations
| I | N | V | E | S | T | Avg |
|---|---|---|---|---|---|---|
| 3 | 4 | 4 | 4 | 4 | 4 | **3.8 ✅** |

Scope: CEO-12 (Growth: prospect table + detail + 30-day chart), CEO-13 (Ad Ops: CPL table + platform health + AI call volume chart). Both read from Supabase tables populated by BE-06 and BE-07. 2–3 weeks.

#### P17b — CEO Drilldowns: Product & Automation + Financial Intelligence
| I | N | V | E | S | T | Avg |
|---|---|---|---|---|---|---|
| 3 | 4 | 4 | 3 | 4 | 4 | **3.7 ✅** |

Scope: CEO-14 (Product: onboarding queue + workflow health board), CEO-15 (Finance: MRR chart + P&L table + per-client grid). Finance requires BE-11 (Stripe). Workflow health requires n8n status table. 2–3 weeks.
E = 3: n8n health API limitations noted (bounded by `workflow_runs` table approach).

---

### P18 — CEO Agent Logs + Settings `4.2 ✅`
| Criterion | Score | Rationale |
|---|---|---|
| **Independent** | 4 | Depends on P16a (agent logs need data). Settings can ship before agents run (empty state). |
| **Negotiable** | 4 | Log display format, filter UI, threshold defaults all negotiable. |
| **Valuable** | 3 | Important for CEO observability but not on the critical path. Non-blocking if delayed. |
| **Estimable** | 5 | Small. Log is a read-only table. Settings is a form with save. |
| **Small** | 5 | 1 week. No complex interactions. |
| **Testable** | 4 | Log entries display in reverse-chron. Date selector navigates history. Threshold saved → alert fires at correct threshold. |

---

## Remediation Summary

| Original Pitch | Issue | Action | Result |
|---|---|---|---|
| P12 Onboarding Portal | S=2 (L appetite, too large) | Split into P12a + P12b + P12c | 3 pitches, all M/S appetite |
| P16 Claude AI Agent Suite | S=2, T=2 (4 agents, non-deterministic) | Split into P16a + P16b | 2 pitches, structural test strategy |
| P17 CEO Dept Drilldowns | S=2 (4 pages, distinct data sources) | Split into P17a + P17b | 2 pitches, Stripe dependency isolated |
| P15 Reports + AI Chat | T=3 (non-deterministic AI) | Add structural test contract | Passes with JSON schema validation |

---

## Final Validated Pitch List — 22 Pitches

| # | Pitch | Avg | Release | Appetite |
|---|---|---|---|---|
| P01 | Monorepo Foundation | 4.5 ✅ | R0 | S |
| P02 | Design System + Component Library | 4.0 ✅ | R0 | M |
| P03 | Supabase Schema + RLS + Auth | 4.2 ✅ | R0 | M |
| P04 | GHL ↔ Supabase Sync | 4.0 ✅ | R0 | M |
| P05 | Retell AI Lead Response Workflow | 3.8 ✅ | R0 | M |
| P06 | Onboarding Job Processor | 3.7 ✅ | R0 | M |
| P07 | RM Dashboard Home | 4.5 ✅ | R1 | S |
| P08 | Leads Table, Detail & AI Transcript | 4.3 ✅ | R1 | M |
| P09 | Agents Roster & Management | 4.3 ✅ | R1 | S |
| P10 | Campaigns Table & Detail | 4.3 ✅ | R1 | S |
| P11 | RainMachine Settings | 4.0 ✅ | R1 | M |
| P12a | Onboarding Portal: Access + Shell + Steps 1–2 | 4.0 ✅ | R1 | M |
| P12b | Onboarding Portal: Ad Account Integrations | 3.8 ✅ | R1 | M |
| P12c | Onboarding Portal: Launch + Completion | 4.3 ✅ | R1 | S |
| P13 | CEO Command Center | 4.2 ✅ | R1 | M |
| P14 | CEO Client Detail | 4.0 ✅ | R1/R2 | M |
| P15 | Reports + AI Intelligence Chat | 3.7 ✅ | R2 | M |
| P16a | Claude AI: Client Intelligence Agents | 3.7 ✅ | R2 | M |
| P16b | Claude AI: Business Intelligence Agents | 3.7 ✅ | R2 | M |
| P17a | CEO Drilldowns: Growth + Ad Ops | 3.8 ✅ | R2 | M |
| P17b | CEO Drilldowns: Product + Finance | 3.7 ✅ | R2 | M |
| P18 | CEO Agent Logs + Settings | 4.2 ✅ | R2 | S |

**22 pitches · 0 failing · 3 splits applied · All criteria ≥ 3.0**

---

## INVEST Quality Gate

| Gate | Result |
|---|---|
| All pitches score ≥ 3.0 average | ✅ |
| No individual criterion scores < 3 (post-remediation) | ✅ |
| All "Large" pitches split to Medium or Small | ✅ |
| Non-deterministic AI pitches have structural test contract | ✅ |
| All splits preserve original feature coverage | ✅ |
| Dependency ordering preserved in release assignment | ✅ |

**Quality gate: PASSED. All 22 pitches cleared for betting table.**

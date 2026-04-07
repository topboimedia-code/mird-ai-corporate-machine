# MASTER PRD — MIRD AI Corporate Machine
**Make It Rain Digital | Version 2.0 | March 2026**
**Owner: Shomari Williams | Confidential — Internal Use Only**

---

## TABLE OF CONTENTS

1. Executive Summary
2. Problem Statement
3. Product Vision & Category Design
4. Market Validation
5. Ideal Client Profiles (ICPs)
6. Offer Stack & Value Equation
7. Success Metrics — 90-Day Targets
8. Full Tech Stack
9. System Architecture Overview
10. The 4 Autonomous Departments
11. Voice AI Agent System
12. Client Acquisition Engine (Internal — MIRD)
13. RainMachine Platform Spec (Client Delivery)
14. Rainmaker Leads Delivery Spec
15. The 30-Minute CEO Loop
16. Build Sequencing — Week by Week
17. Risk Register
18. Open Decisions
19. Brand Voice Rules
20. File Index

---

## 1. EXECUTIVE SUMMARY

The MIRD AI Corporate Machine is the full operating system for Make It Rain Digital. It is not a single product — it is a layered architecture consisting of two client-facing products (Rainmaker Leads and RainMachine), four internally autonomous business departments, an AI-powered client acquisition engine, and a Voice AI system that contacts leads within 5 minutes of submission.

The goal of this system is to allow MIRD to acquire clients, deliver results, and operate as a business — all within a 30-minute daily CEO window. Every component that requires more than 30 minutes of daily manual attention is a build target until it is automated.

This PRD is the operator manual. It documents what is live, what needs to be built, in what order, and why. It is not a pitch document. Full context is assumed.

**Current State:** Partially built. GHL is live, core automations exist, but the Voice AI system, Apollo outbound sequences, and full n8n workflow layer are either incomplete or not yet integrated end-to-end.

**Primary Constraint:** Owner operates a full-time role (9–5) at Innate Marketing. All build and sales activity happens evenings and weekends. The build sequencing in Section 16 is designed around this constraint — outreach starts Week 1, not after the build is complete.

**North Star Milestone:** $100,000 MRR

**Competitive Position:** MIRD is the only company in its market that checks three boxes simultaneously — AI voice follow-up, done-for-you paid ad management, and a fully automated CRM pipeline — built specifically for real estate brokerages and independent insurance agencies. No competitor does all three.

---

## 2. PROBLEM STATEMENT

### For MIRD as a Business
There is no consistent, automated client acquisition system running. Discovery calls are not being booked at a predictable rate. The business depends on manual outreach and referrals. Without a pipeline, revenue is unpredictable and the transition from Innate Marketing income is not on a defined timeline.

### For MIRD's Clients — Real Estate Brokerages
Real estate brokerage principals running 10–40 agent operations face a structural production inequality problem. The top 2–3 agents carry the entire brokerage. The remaining agents generate minimal commissionable activity. When top producers leave — which they do, because franchise systems (eXp, KW, Compass) actively recruit them with built-in lead gen tools — the brokerage revenue collapses.

The root cause is not agent quality. It is lead supply inequality. Brokerages have no system to consistently feed qualified leads to every agent. Manual follow-up fails. Generic CRMs sit unused. The industry benchmark for first response is under 5 minutes — most businesses are calling back in hours, if at all, losing 80%+ of leads in the process.

**Emotional trigger:** FOMO — fear of a competitor pulling ahead; existential fear of top producers leaving.

### For MIRD's Clients — Insurance Agencies
Independent insurance agency owners running 3–10 producers face the same structural problem: 1–2 motivated producers carry the rest. Self-sourcing is inconsistent. There is no system that puts qualified conversations in producers' calendars automatically.

Agencies miss approximately 30% of incoming calls relying solely on human staff. Databases of previously contacted prospects sit idle. Renewals are tracked manually. Cross-sell opportunities are missed — the average policyholder holds only 1.5 policies; optimal is 2.5+.

**Emotional trigger:** Producer-level proof — not agency-level aggregates. Show Kevin his own missed-call problem live during the pitch.

### The Gap MIRD Fills
The current market offers two incomplete solutions:
1. **Software tools** (Follow Up Boss, AgencyZoom, GHL) — CRM without ad management, without AI voice, without done-for-you execution
2. **Ad agencies** — Run ads but provide no CRM, no AI follow-up, no automation

No agency in this market combines done-for-you ad management (Rainmaker Leads) with full AI-powered automation infrastructure (RainMachine) as a single integrated offer. Pure ad agencies don't build the automation. Pure automation companies don't run the ads. MIRD does both.

---

## 3. PRODUCT VISION & CATEGORY DESIGN

**Make It Rain Digital is the growth infrastructure partner for real estate and insurance businesses that are ready to scale without adding headcount.**

MIRD is not competing in the "CRM" category or the "ad agency" category. MIRD is the category creator for:

> **AI-Native, Done-For-You Client Acquisition Infrastructure for Real Estate and Insurance**

### Two Products, One Machine

**Rainmaker Leads — Done-For-You Ad Management**
Full-service paid advertising management. MIRD owns creative, copy, targeting, optimization, and reporting for every client account. This is a managed growth operation, not a software product.

**RainMachine — AI-Powered Client Acquisition Operating System**
Proprietary client acquisition platform built on GHL + n8n. Handles lead intake, AI voice follow-up, appointment booking, pipeline management, lead routing, and performance reporting. Delivered as a fully built and managed system for each client.

**The moat is the combination.** Clients don't have to choose between ad performance and automation — they get both, managed by one team.

### The Jet Fuel Rule
> "Our ads are like jet fuel. You wouldn't put jet fuel in a Toyota. RainMachine is the jet. Rainmaker Leads is the fuel. Without the right vehicle, you can't handle that type of fuel."

**RainMachine is required to access Rainmaker Leads.** This is not a contract clause — it is a marketing strategy. Content creates desire for the leads. RainMachine is sold as the solution to access them.

**"We are not in the lead gen business. We are in the solutions business."**

### Positioning Rule
> We never say "we run ads for you." We say "we build and operate your full client acquisition system." This positions us as a growth partner, not a vendor.

### Marketing Content Pillars
All content (YouTube, LinkedIn, social) is built around three pillars:
1. **Lead Generation** — What is a Rainmaker Lead? How they're generated. Why they convert differently.
2. **Marketing Automation** — Tools and tactics. AI follow-up walkthroughs. CRM automation. n8n breakdowns.
3. **AI in Real Estate & Insurance** — AI voice in RE. How top teams scale with AI. Database reactivation case studies.

### Platform Roadmap
- **Phase 1 (Now):** GHL white-label + n8n + Retell AI + custom dashboard streamed in GHL + Claude AI reporting
- **Phase 2 (6–12 months):** Standalone RainMachine Dashboard (platform-independent); expanded Claude AI reporting
- **Phase 3 (12–24 months):** Proprietary core — custom CRM, native AI voice agent, full platform independence from GHL

---

## 4. MARKET VALIDATION

### 4.1 Market Size

| Segment | 2025 Market Size | CAGR |
|---|---|---|
| Real Estate CRM Software | $4.73B | 12.2% |
| Insurance Agency Software | $4.23B | 10.9% |
| AI Voice Agents | $2.4B | 34.8% |
| AI in Insurance (broad) | $10.36B | 35.7% |

**SAM:** ~85,000–100,000 qualifying real estate brokerages (10–40 agents) + ~35,000–50,000 independent insurance agencies (3–10 producers) in the US. At blended pricing: **$900M–$2.7B/year addressable**.

**SOM (3-year target):** Capturing 0.15–0.3% of SAM = $100K MRR milestone. Requires 200–400 active accounts — achievable.

### 4.2 Competitive Matrix

| Platform | AI Voice | Ad Mgmt | Done-For-You | RE-Specific | Insurance |
|---|---|---|---|---|---|
| Follow Up Boss | ❌ | ❌ | ❌ | ✅ | ❌ |
| LionDesk | ❌ | ❌ | ❌ | ✅ | ❌ |
| AgencyZoom | ❌ | ❌ | ❌ | ❌ | ✅ |
| HawkSoft | ❌ | ❌ | ❌ | ❌ | ✅ |
| GoHighLevel | Limited | ❌ | ❌ | ❌ | ❌ |
| **RainMachine (MIRD)** | **✅ Retell AI** | **✅** | **✅** | **✅** | **✅** |

**RainMachine is the only platform that checks all five boxes. This is the product-market fit anchor.**

### 4.3 Unclaimed Positioning Angles

1. **"Zero Headcount Growth"** — grow brokerage/agency production without adding a single employee
2. **"Speed to Revenue"** — first appointments in 14 days, or first month extended free (low actual risk; high perceived value)
3. **"The Full Machine"** — not a tool, not an agency, the whole client acquisition system
4. **"Dead Database Monetization"** — the only company that productizes database reactivation as a standalone entry offer
5. **"AI + Human Hybrid"** — AI-powered infrastructure with done-for-you execution; not DIY software, not a traditional agency

---

## 5. IDEAL CLIENT PROFILES (ICPs)

### ICP 1 — Marcus: Realtor Team Leader *(Primary)*

| Attribute | Detail |
|---|---|
| Who | Realtor running a production team of 5–30 agents under a brokerage |
| Team GCI | $3M–$20M/year |
| Current State | Managing lead distribution manually; paying for Zillow/Opcity leads agents complain about; top 2–3 carry everyone |
| Budget Authority | $3K–$10K/month |
| Core Pain | Lead distribution is a daily management burden; agent production inequality |
| Secondary Pain | Top agents threatening to leave for better-resourced teams |
| Buying Trigger | Competitor team starts dominating listings; top agent threatens to leave |
| Entry Point | DBR ($1,500) — prove ROI before platform conversation |
| Business Model Upside | Can charge agents $97–$800+/mo for platform access at their discretion — system can become self-funding or profit-generating |
| Best Proof | Team case study: agents went from self-sourcing to system-fed pipelines in 30 days |
| Primary Hook | "What if every agent on your team had a full pipeline — and your top producers stopped being the only ones carrying it?" |
| Never Say | "We run Facebook ads for realtors" |

**Agent Seat Economics (Team Leader's Discretion — MIRD never touches this):**

| Agents | Fee/Agent | Monthly Agent Revenue | Growth Tier Cost | Team Leader Net |
|---|---|---|---|---|
| 5 | $147/mo | $735 | $4,997 | $4,262 |
| 10 | $300/mo | $3,000 | $4,997 | $1,997 |
| 10 | $500/mo | $5,000 | $4,997 | **$0 + $3 profit** |
| 10 | $800/mo | $8,000 | $4,997 | **$3,003/mo profit** |

**Meta Ads CPL Benchmarks (Real Estate):**
- Tier 1 markets (NYC/LA/Miami): $35–$65 CPL
- Tier 2 markets (Austin/Denver/Nashville): $20–$45 CPL
- Tier 3 markets (smaller regional): $8–$20 CPL
- Lead Form Ads outperform video ads ($34.10 vs $45.80 avg CPL)

### ICP 2 — Kevin: Insurance Agency Owner *(Secondary)*

| Attribute | Detail |
|---|---|
| Business Size | Independent agency, 3–15 producers |
| Annual Revenue | $500K–$5M/year |
| Budget Authority | $3K–$8K/month |
| Core Pain | Missing 30% of incoming calls; no automated follow-up; 1–2 producers carry everyone |
| Secondary Pain | Recruiting/retaining good producers |
| Buying Trigger | Producer-level proof — CPL and booked appointments per producer |
| Entry Point | Live missed-call demo — show Kevin his own gap in real-time |
| Best Proof | One producer closing 2+ extra policies/month from the system |
| Business Model Upside | Same agent seat model applies — producers pay seat fees at agency owner's discretion |
| Primary Hook | "Stop waiting for your producers to self-source. Put qualified conversations in their calendar — automatically." |
| Never Say | "We generate insurance leads" |

**Closing hook for Kevin:** Agencies miss approximately 30% of incoming calls relying solely on human staff. Show the gap live — it's a closing tool, not just a pitch point.

---

## 6. OFFER STACK & VALUE EQUATION

### 6.1 Full Offer Stack (Value Ladder)

| Tier | Offer | Price | Gate |
|---|---|---|---|
| **0 — Entry** | Database Revival (DBR) | $1,500 one-time | None — trust builder |
| **1 — Starter** | RainMachine Starter | $997/mo | RainMachine required for Leads |
| **2 — Growth** ⭐ | RainMachine Pro + Rainmaker Leads Growth | $4,997/mo | Bundled |
| **3 — Scale** | RainMachine Pro + Rainmaker Leads Scale | $9,997/mo | Bundled |
| **4 — Own It** | RainMachine Build & Release + Management | $5K–$15K one-time + $500–$1K/mo | Custom |

**The Gate:** Rainmaker Leads (ad management) is only available to active RainMachine subscribers. This is enforced through marketing, not just contracts.

**RainMachine Seat Tiers:**
- Starter: Up to 5 agent seats — start with heavy hitters, prove ROI, then expand
- Pro (Growth/Scale): Unlimited agent seats

**Lead Routing (GHL native — already built):**
- Round robin across agents
- By housing type (buyer vs. seller)
- By property type or geography

**DBR Positioning Script:**
> "Before we talk about anything else — let's wake up the leads you already paid for. $1,500, one-time. We use AI to reactivate your dead database and book qualified appointments. 10 agents paying you $147/mo covers this in the first month. You haven't spent a dollar yet."

### 6.2 Custom Build Tier — RainMachine Build & Release

**For organizations that want to own their platform rather than subscribe.**

| Revenue Stream | Amount | Type |
|---|---|---|
| Build fee | $5K–$15K | One-time |
| Management fee | $500–$1K/mo | Recurring |
| GHL affiliate commission (40%) | ~$40–$200/mo | Passive |
| Rainmaker Leads (if added) | +$2,500–$7,500/mo | Optional |

Build fee range: $5K (standard) → $10K (complex integrations) → $15K (enterprise/multi-location)

### 6.3 Hormozi Value Equation

**Value = (Dream Outcome × Perceived Likelihood) / (Time Delay × Effort & Sacrifice)**

**Real Estate Team Leader — Growth @ $4,997/mo:**
- 4 extra closings/month × $12,000 avg GCI = **$576,000/year in incremental GCI**
- Annual cost: $59,964
- **Client ROI: 9.6x**
- If 10 agents pay $500/mo in seat fees: team leader net cost = **$1,997/mo for the full machine**

**Insurance — DBR @ $1,500 one-time:**
- 500 dead leads → 7–8 new clients @ $1,800 LTV = $12,600–$14,400 recovered
- **Client ROI: 9x on first pass**

**Why pricing is never the objection:** At 9x+ ROI, the conversation is about belief, not cost. Proof assets (case studies, live demos, DBR results) handle belief.

---

## 7. SUCCESS METRICS — 90-DAY TARGETS

These are the three non-negotiable outcomes. Everything in the build sequencing is optimized to hit these numbers.

### Metric 1: 5 Qualified Discovery Calls Per Week by Week 12

**Ramp schedule (honest math):**
- Weeks 1–4: Build Apollo sequences, warm up outbound, refine DBR pitch → **Target: 1–2 calls/week**
- Weeks 5–8: Sequences mature, Retell AI cold outbound running → **Target: 2–3 calls/week**
- Weeks 9–12: Full system operational + content inbound beginning → **Target: 5 calls/week**

**Dependencies:** Apollo loaded with ICP contacts (Week 1) → Retell AI cold outbound live (Week 2) → at least one content piece creating inbound pull (Week 6+)

**Financial assumptions:**
- 22% close rate on retainer (base case); 28% (aggressive scenario)
- DBR-to-retainer conversion: 40% (of every 5 DBR clients, 2 convert within 60 days)
- These are planning numbers — update monthly based on actuals from Week 3 onward

### Metric 2: 4 Active Retainer Clients by Day 90

**Honest math:**
- 3–4 discovery calls/week in months 1–2
- 20–25% close rate on retainer; higher on DBR
- 2–3 DBR clients converting to retainer

| Scenario | Clients | MRR |
|---|---|---|
| Conservative (3 clients) | 3 × $3,500 | $10,500 MRR |
| Base case (4 clients) | 4 × $3,500 | **$14,000 MRR** |
| Aggressive (5 clients) | 5 × $3,500 | $17,500 MRR |

**The constraint:** Every week outreach is delayed = one week pushed back on client count. Outreach starts Week 1 regardless of build completion status.

### Metric 3: 100% of New Leads Contacted by Retell AI Within 5 Minutes

**This is binary.** The system either works or it doesn't.

This is MIRD's core competitive claim in the market. If you are pitching AI-powered client acquisition and your own lead response system isn't live, that is a credibility gap you cannot afford.

**Architecture:** GHL marketing automation fires SMS immediately on all lead sources → Retell AI handles non-bookers within 5 minutes → GHL native voice handles warm follow-up

**Non-negotiable: Must be live before sending a single outreach message.**

---

## 8. FULL TECH STACK

| Tool | Role | Status |
|---|---|---|
| GoHighLevel (GHL) | CRM, pipeline, SMS/email automation, native voice agent, sub-accounts, lead routing | ✅ Live |
| n8n | Automation middleware — workflow orchestration, API connections, data pipelines | 🟡 Partially built |
| Retell AI | Voice AI for cold lead follow-up and cold outbound prospecting | 🔴 Not yet integrated end-to-end |
| Apollo.io | Prospecting database and outbound sequencing for MIRD client acquisition (via Claude plugin) | 🟡 Plugin available; sequences not loaded |
| Meta Ads Manager | Paid advertising for clients — primary ad platform | ✅ Live (client work) |
| Google Ads | Add-on platform — Growth and Scale tiers | ✅ Live |
| YouTube / TikTok Ads | Add-on platform — Scale tier only | 🔴 Not yet active |
| Claude + Apollo Plugin | MIRD's internal ICP prospecting — replaces n8n→Apollo for own pipeline | 🟡 Available; not yet in use |
| n8n → Apollo | Client-side outbound automation (RainMachine delivery) — NOT for MIRD's own pipeline | 🔴 In development |
| RainMachine Dashboard | Custom-built proprietary dashboard — streamed within GHL (Phase 1); standalone (Phase 2) | 🔴 To build |
| Claude AI Agents | Dynamic conversational reporting — replaces static PDF/email reports; clients query performance data | 🔴 To build |
| Slack | Internal comms, webhook alerts from onboarding portal | ✅ Live |
| Google Drive | Client file storage, onboarding uploads | ✅ Live |
| Notion | Documentation, SOPs, playbooks | ✅ Live |

**Meta Ads Reporting Standards (Non-Negotiable):**
- System Users only — no OAuth tokens (non-expiring programmatic access)
- Fruit Salad Rule: never sum unique metrics (Reach, Unique Clicks) across days; always query full date window as single API call
- Weekly client summaries; monthly strategy reviews
- Data pipeline: n8n pulls Meta API → GHL (future: MCP connector for conversational reporting)

---

## 9. SYSTEM ARCHITECTURE OVERVIEW

```
MIRD AI CORPORATE MACHINE
│
├── CLIENT ACQUISITION ENGINE (MIRD Internal)
│   ├── Apollo Plugin + Claude → ICP prospecting (Real Estate + Insurance)
│   ├── GHL → lead capture and pipeline management
│   ├── Retell AI → cold outbound calls + DBR campaigns
│   └── 2-Call Close Framework → discovery → proposal → close
│
├── RAINMAKER LEADS (Client-Facing Product 1)
│   ├── Meta Ads campaign management
│   ├── Creative production + copy
│   ├── Weekly/monthly reporting cadence
│   └── System User API access (non-expiring)
│
├── RAINMACHINE PLATFORM (Client-Facing Product 2)
│   ├── GHL sub-account buildout per client
│   ├── n8n workflow development + maintenance
│   ├── Retell AI configuration (cold lead + DBR)
│   ├── GHL Native Voice Agent (warm contacts)
│   └── Onboarding portal
│
└── INTERNAL OPERATIONS (4 Departments)
    ├── Department 1: Growth & Client Acquisition
    ├── Department 2: Ad Operations & AI Delivery
    ├── Department 3: Product & Automation (RainMachine)
    └── Department 4: Finance & Business Intelligence
```

**Critical Integration Path (must be tested end-to-end before outreach launch):**
```
Lead Source → GHL (contact created) → SMS fires immediately
                                     → GHL stage trigger detected
                                     → If no immediate booking: Retell AI fires within 5 min
                                     → Call outcome logged to GHL pipeline
                                     → Follow-up sequence triggered based on outcome
                                     → Call 1 booked → CRM updated
```

---

## 10. THE 4 AUTONOMOUS DEPARTMENTS

Each department runs on automation with defined KPIs. Manual CEO intervention = exception handling only.

### Department 1 — Growth & Client Acquisition

**Scope:**
- Outbound prospecting via Apollo + Claude plugin (MIRD internal)
- Retell AI cold outbound calls
- Content pipeline (YouTube, LinkedIn, social)
- Inbound lead capture and qualification
- Sales call scheduling and CRM entry

**KPIs:**

| Metric | Target |
|---|---|
| Qualified discovery calls/week | 5 (by Week 12) |
| DBR offers sent/week | 3–5 |
| Close rate on Call 2 | 25–35% |
| Cost per qualified call booked | Track from Week 1 |

**Automation layer:** Apollo plugin surfaces ICP contacts → Shomari reviews and approves → sequences launch → GHL captures inbound → SMS fires → Retell AI follows up → booked calls auto-confirmed via GHL

### Department 2 — Ad Operations & AI Delivery

**Scope:**
- Campaign setup, optimization, and management (Meta primary; Google/YouTube/TikTok secondary)
- Ad creative production and copy
- Client CPL and performance monitoring
- Reporting cadence execution (weekly summaries, monthly reviews)
- Creative testing and iteration

**KPIs:**

| Metric | Target |
|---|---|
| Client CPL (Real Estate — Tier 2) | $20–$45 |
| Client CPL (Real Estate — Tier 1) | $35–$65 |
| Client CPL (Insurance) | TBD — establish in month 1 |
| ROAS per client | Track per account |
| Campaign health score | Internal rubric (build in month 2) |
| Client retention rate | 95%+ monthly |

**Non-negotiable setup for every client:** Meta System User access (no OAuth tokens); Fruit Salad Rule enforced on all reporting; n8n → Meta API data pipeline configured on onboarding.

### Department 3 — Product & Automation (RainMachine)

**Scope:**
- GHL sub-account buildouts for new clients
- n8n workflow development and maintenance
- Retell AI workflow configuration per client
- Apollo → n8n outbound sequences for clients (distinct from MIRD's own prospecting)
- Client Onboarding Portal management
- Feature development and platform releases

**KPIs:**

| Metric | Target |
|---|---|
| Automation uptime | 99%+ |
| Onboarding portal completion rate | 100% before campaign launch |
| Time-to-live per new client | <5 business days |
| Active n8n workflows in production | Track per client |

**Error handling requirement:** Every n8n workflow must have error alerting configured on deployment. No silent failures. Slack or email notification on any workflow error before it affects client deliverables.

### Department 4 — Finance & Business Intelligence

**Scope:**
- MRR tracking and forecasting
- Client P&L and margin analysis
- Churn alerts and at-risk client flagging
- CAC and LTV calculations
- North Star dashboard maintenance

**KPIs:**

| Metric | Target |
|---|---|
| MRR | $14,000 by Day 90; $100K first major milestone |
| MRR growth rate | 15–20%/month |
| Churn rate | <5%/month |
| LTV:CAC ratio | 5:1+ |
| Gross margin per client | Track from client 1; target 60%+ |

**North Star metric:** MRR. Everything else is a supporting metric.

---

## 11. VOICE AI AGENT SYSTEM

This is the highest-priority build component. It must be live before any outreach is sent.

### Two-Layer Contact Model

**Layer 1 — Immediate SMS (GHL Marketing Automation)**
- Fires on ALL lead sources: Meta ads, Apollo inbound, manual entry, web form
- Fires within 60 seconds of lead submission
- Message: Personalized intro + booking link
- **Requirement:** Verify trigger fires on every lead source, not just one pipeline stage

**Layer 2 — Retell AI Voice (Non-Bookers)**
- Fires when: Lead enters GHL but does not book within 10–15 minutes after SMS
- Goal: Book the appointment or qualify for follow-up
- Script structure: Introduction → pain point hook → book/qualify → fallback to follow-up sequence
- Call outcome logged to GHL automatically
- **SLA target: 100% of non-bookers called within 5 minutes of trigger**

### Retell AI Use Cases

| Use Case | Trigger | Goal |
|---|---|---|
| New lead follow-up | Lead enters GHL, no booking within 10–15 min | Book appointment |
| Database Reactivation (DBR) | Manual campaign trigger | Reactivate dead contacts, generate DBR offer |
| Cold outbound prospecting | Apollo sequence reaches call step | Qualify ICP and book discovery call |

### GHL Native Voice Agent Use Cases (Warm Contacts)

| Use Case | Trigger | Goal |
|---|---|---|
| Appointment confirmation | 24–48 hours before scheduled call | Reduce no-show rate |
| No-show re-engagement | Missed appointment flag in GHL | Rebook |
| Warm lead follow-up | Contacts already in pipeline | Progress to next stage |
| Post-appointment check-in | 24 hours post-call | Gather feedback, set next step |

### Voice AI Build Checklist (Pre-Launch — Non-Negotiable)

- [ ] Retell AI account configured with MIRD phone number
- [ ] Call script written and tested: new lead follow-up
- [ ] Call script written and tested: DBR campaign
- [ ] Call script written and tested: cold outbound
- [ ] GHL webhook → n8n → Retell AI trigger tested end-to-end
- [ ] GHL pipeline stage updates on call outcome (booked / not interested / voicemail / callback)
- [ ] Follow-up sequence fires correctly based on call outcome
- [ ] GHL native voice agent configured: confirmation, no-show, check-in
- [ ] End-to-end test: fake lead submitted → SMS fires → Retell AI calls → outcome logged → follow-up triggers

**Do not launch outreach until every item above is checked.**

---

## 12. CLIENT ACQUISITION ENGINE (MIRD INTERNAL)

### Tool Stack: Claude + Apollo Plugin

MIRD's own pipeline runs through the Claude + Apollo plugin. This keeps the build simple for internal acquisition — no automation overhead required at the 5 call/week target volume.

**Workflow:**
1. Claude + Apollo plugin → search for ICP contacts matching David or Kevin profile
2. Review and approve contact list
3. Apollo sequences launch (email + LinkedIn touchpoints)
4. GHL captures replies and inbound interest
5. Retell AI handles cold call step within sequences
6. Booked call → GHL CRM updated → Call 1 prep triggered

**Note:** n8n → Apollo is reserved for RainMachine client delivery (their automated outbound), not for MIRD's own prospecting.

### 2-Call Close Framework

**Call 1 — Business Analysis & Qualification (30 min)**
- Frame as a business analysis, not a sales pitch
- Diagnose: current lead gen situation, core gap
- Qualify: budget, team size, current CRM usage, motivation level
- If dead database exists: position DBR ($1,500) as the first step — fast win, low-risk entry
- Outcome: Move to Call 2 or disqualify

**Call 2 — Close (30 min)**
- Present growth plan built from Call 1 intel — specific to their situation
- Walk through offer stack, pricing, timeline to results
- Handle objections → collect payment
- If no close: GHL same-day or next-day follow-up sequence fires automatically

---

## 13. RAINMACHINE PLATFORM SPEC (CLIENT DELIVERY)

RainMachine is the automation infrastructure product delivered to clients. Each client gets a fully configured environment, not a DIY tool.

### What Each Client Gets

| Component | Description |
|---|---|
| GHL Sub-Account | Isolated client environment — CRM, pipeline, calendar, SMS, email |
| Lead Intake Automation | Captures leads from Meta ads, web forms, manual entry |
| Retell AI (Cold + New Leads) | Voice AI for immediate new lead follow-up and DBR campaigns |
| GHL Native Voice Agent | Warm contact follow-up — confirmations, no-shows, check-ins |
| n8n → Apollo Sequences | Automated outbound prospecting (for clients who need outbound) |
| Email + SMS Follow-Up | Multi-touch nurture from lead to booked appointment |
| Pipeline Management | Stage-based CRM tracking with automated stage progression |
| Performance Reporting | Weekly summaries via n8n → Meta API → GHL |
| Onboarding Portal | Self-serve portal for client data submission and onboarding checklist |

### Client Onboarding Spec

**Time-to-live target: <5 business days from signed contract**

| Day | Task |
|---|---|
| Day 1 | Contract signed → GHL sub-account created → onboarding portal link sent |
| Day 1–2 | Client completes onboarding portal (business info, ICP, ad account access, CRM data) |
| Day 2–3 | n8n workflows deployed → Retell AI configured → GHL sequences built |
| Day 3–4 | Meta System User setup → campaign structure built → creative assets requested/received |
| Day 5 | End-to-end test → campaigns live → client briefed on reporting cadence |

### Vertical-Specific Pipeline Templates

**Real Estate — Buyer Lead Pipeline:**
New Lead → AI Called → Appointment Set → Shown Properties → Offer Made → Under Contract → Closed

**Real Estate — Seller Lead Pipeline:**
New Lead → AI Called → Listing Appointment Set → Listing Signed → Active → Under Contract → Closed

**Insurance — P&C Pipeline:**
New Lead → AI Called → Quote Requested → Quote Sent → Follow-Up → Bound → Renewal Queue

### RainMachine Client Outbound Architecture (n8n → Apollo)

```
n8n scheduler → Apollo API (ICP search) → contact list filtered
             → GHL (new contacts added to pipeline)
             → Apollo sequence enrolled
             → Retell AI call step triggered at sequence day X
             → Outcome logged to GHL
             → Follow-up sequence continues based on outcome
```

---

## 14. RAINMAKER LEADS DELIVERY SPEC

Done-for-you paid ad management. MIRD owns everything.

### Scope Per Client
- Campaign setup, optimization, and management (Meta primary; Google/YouTube/TikTok on Growth/Scale)
- Ad creative production (static, video, carousel)
- Copy (ad headlines, body, CTAs)
- Audience and targeting strategy
- Weekly performance summaries
- Monthly strategy reviews
- A/B creative testing and iteration

### Reporting Standards
- **System Users only** — Business Manager → System User → Ad Account. No personal OAuth tokens.
- **Fruit Salad Rule** — Never sum Reach, Unique Clicks, or other unique metrics across date ranges. Always query the full campaign window as a single API call.
- Weekly report template: CPL, impressions, CTR, leads, spend, ROAS
- Monthly review: campaign health, creative performance rankings, next-month strategy

### Campaign Launch Checklist (Every New Client)

- [ ] Meta System User configured (not OAuth)
- [ ] Business Manager access verified
- [ ] ICP and offer confirmed with client
- [ ] Pixel installed and firing correctly
- [ ] Lead form or landing page tested end-to-end
- [ ] n8n → Meta API data pipeline active
- [ ] GHL sub-account receiving leads from Meta
- [ ] Reporting template configured
- [ ] Campaign live — client notified

---

## 15. THE 30-MINUTE CEO LOOP

The entire business runs on 30 minutes of CEO attention per day. This is a design constraint, not a goal. Any system requiring more than 30 minutes of daily manual input is a build target.

### Daily CEO Tasks (≤30 minutes total)

| Task | Time | Tool |
|---|---|---|
| Review North Star dashboard | 5 min | GHL / BI dashboard |
| Review overnight Retell AI call outcomes | 5 min | GHL pipeline |
| Review Apollo sequence replies + approve responses | 10 min | Claude + Apollo plugin |
| Handle any n8n error alerts | 5 min | Slack / email alerts |
| Flag any client delivery issues | 5 min | GHL client accounts |

**Everything else is automated, delegated to AI agents, or handled async.**

### What Must Be Automated for the Loop to Work

- Lead intake → SMS → Retell AI call (automated)
- Apollo sequence sending (automated; Shomari approves contacts up front)
- GHL pipeline stage progression on call outcomes (automated)
- Client reporting generation via n8n → Meta API (automated)
- Appointment confirmations and no-show re-engagement via GHL native voice (automated)
- Invoice and payment via GHL or Stripe (automate on contract)
- Onboarding portal submission → GHL sub-account setup trigger (automated)

---

## 16. BUILD SEQUENCING — WEEK BY WEEK

**Core principle: Build and sell in parallel. Outreach starts Week 1.**

The system does not need to be complete to generate revenue. The minimum viable stack for Week 1 outreach: Apollo + Claude plugin loaded, GHL SMS automation firing, Retell AI live for new leads.

### Week 1 — Non-Negotiable (All Must Complete)

- [ ] Apollo plugin loaded with ICP contacts (Real Estate first)
- [ ] GHL SMS automation verified firing on all lead sources
- [ ] Retell AI configured for new lead follow-up (script written, tested, live)
- [ ] First Apollo sequences launched (MIRD prospecting begins)
- [ ] GHL pipeline stages defined for MIRD's own sales process

### Week 2

- [ ] Retell AI cold outbound configured for DBR campaigns
- [ ] First DBR outreach launched (warm list or personal network)
- [ ] GHL native voice agent configured (appointment confirmation + no-show)
- [ ] Meta System User setup documented and ready for first client
- [ ] Call 1 script and Call 2 close deck finalized

### Week 3–4

- [ ] n8n automation layer hardened — error alerting on all active workflows
- [ ] End-to-end test: lead → SMS → Retell AI → GHL pipeline update → follow-up sequence
- [ ] First client onboarding portal built and tested
- [ ] RainMachine client sub-account template built (copy-paste for new clients)
- [ ] North Star dashboard v1 live (MRR, active clients, calls booked, pipeline value)

### Week 5–6

- [ ] n8n → Meta API reporting pipeline live for first client
- [ ] Retell AI cold outbound running (Apollo → call step in sequences)
- [ ] First content piece published (YouTube or LinkedIn — RE or insurance pain point)
- [ ] Department 4 (Finance/BI) framework live — MRR tracking, P&L per client

### Week 7–8

- [ ] Full 4-department operating model running
- [ ] 30-minute CEO loop operational and documented
- [ ] RainMachine client onboarding <5 days confirmed with first client
- [ ] n8n → Apollo client-side automation tested end-to-end

### Week 8 — Checkpoint Gate

- [ ] **Are we hitting 3+ qualified calls/week?**
  - If YES → continue current system, accelerate content
  - If NO → contingency: increase Apollo sequence volume + LinkedIn content blitz + add Retell AI cold outbound campaign to secondary ICP list
- [ ] MRR snapshot: On track for $14K by Day 90?
- [ ] Identify any automation failure points from Weeks 1–8 and resolve before Week 9 scale-up

### Week 9–12

- [ ] Content publishing cadence: 2+ pieces/week
- [ ] Inbound pull beginning from content
- [ ] 5 discovery calls/week target achieved
- [ ] 4 active retainer clients or on track by Day 90
- [ ] Campaign health scoring rubric built (Department 2)

---

## 17. RISK REGISTER

### 🟡 Medium Risk — Active Monitoring Required

**GHL trigger coverage across all lead sources.**
The SMS + Retell AI 5-minute SLA depends on the GHL automation firing on every lead source, not just one pipeline stage. Must be tested with fake leads from Meta ads, manual entry, web forms, and Apollo inbound before any campaign goes live.
*Mitigation: End-to-end test in Week 1 checklist.*

**Apollo outbound response rates for real estate and insurance ICPs.**
These are heavily prospected segments. Expected: 25–35% open rate, 3–8% reply rate without strong personalization. Generic sequences will not hit the 5 call/week target.
*Mitigation: Personalization variables built into sequences from Day 1. Claude reviews and customizes before sending.*

**GHL account structure — internal vs. client separation.**
MIRD's own operations and client sub-accounts must be cleanly separated from Day 1. Mixing internal CRM with client delivery creates reporting conflicts.
*Mitigation: Dedicated MIRD operations account; all client work in sub-accounts.*

**9–5 time constraint compressing build timeline.**
The full build is 60–90 days of focused work. Available time is evenings and weekends. Without discipline on the Week 1 non-negotiables, the first 30 days become setup time instead of outreach time.
*Mitigation: Week 1 checklist is locked and binding. Outreach starts before everything else is built.*

**GHL dependency risk (Phase 1 → Phase 2).**
If GoHighLevel changes pricing or terms, margin compresses. Phase 2 proprietary dashboard reduces this dependency.
*Mitigation: Contractual pricing locks; roadmap toward proprietary platform by month 12.*

### 🟢 Low Risk — Noted

**n8n workflow maintenance overhead.** Error alerting required on all workflows. Not a blocker — a deployment requirement. Build alerting in Week 3–4.

**Retell AI call volume limits.** Verify account tier supports volume needed for both MIRD prospecting and client delivery before scaling.

**Meta Advantage+ Leads adoption.** Research confirms Advantage+ outperforms manual targeting by 22% on average. Test on new client campaigns in first 30 days.

---

## 18. OPEN DECISIONS

| Decision | Context | Deadline |
|---|---|---|
| RainMachine pricing — standalone vs. bundle | Is RainMachine sold separately from Rainmaker Leads, or primarily as a bundle? Affects sales positioning on Call 2. | Before first Call 2 |
| Retell AI account tier | What volume tier is needed for MIRD + first 3–4 clients running simultaneously? | Week 1 |
| DBR campaign target list source | First DBR campaign — MIRD's warm network, purchased list, or Apollo-pulled contacts? | Week 2 |
| Content channel priority | YouTube or LinkedIn as primary channel for inbound? Determines Week 6 content build. | Week 5 |
| North Star dashboard tool | GHL native reporting, n8n + Airtable, or custom build? | Week 3 |
| Insurance ICP outreach sequencing | Real estate is primary focus for Weeks 1–4. When does insurance ICP outreach start? | Week 4 |
| "Speed to Revenue" guarantee terms | If offering "first appointments in 14 days or first month extended free" — what are the exact terms and eligibility conditions? | Before first retainer close |

---

## 19. BRAND VOICE RULES

- **Never say** "we run ads" → **Say** "we build and operate your client acquisition system"
- **Never say** "we generate leads" → **Say** "we deliver qualified appointments"
- **Never say** "our software" → **Say** "the RainMachine platform"
- **Never say** "we run Facebook ads for realtors" — this is the commodity trap
- **Never say** "we generate insurance leads" — too generic, no differentiation
- Always lead with the **outcome**, not the technology
- Always **quantify**: appointments booked, CPL, policies closed, GCI generated
- Position MIRD as a **growth partner**, not a vendor

---

## 20. FILE INDEX

| File | Path | Status |
|---|---|---|
| MASTER_PRD.md | /docs/MASTER_PRD.md | ✅ Complete (v2.0) |
| OFFER_ARCHITECTURE.md | /docs/OFFER_ARCHITECTURE.md | ✅ Complete (Step 1.5) |
| ARCHITECTURE.md | /docs/ARCHITECTURE.md | 🔜 Step 2 |
| UX-DESIGN.md | /docs/UX-DESIGN.md | 🔜 Step 3 |
| FLOW-TREE.md | /docs/FLOW-TREE.md | 🔜 Step 4 |
| WIREFRAME-SPEC.md | /docs/WIREFRAME-SPEC.md | 🔜 Step 5 |
| DESIGN-SYSTEM.md | /docs/DESIGN-SYSTEM.md | 🔜 Step 6 |
| TECHNICAL-SPEC.md | /docs/TECHNICAL-SPEC.md | 🔜 Step 8 |
| Feature PRDs | /docs/prds/F*.md | 🔜 Step 11 |

---

*MASTER_PRD.md — Make It Rain Digital | Version 2.0 | March 2026*
*Owner: Shomari Williams | Internal Use Only*
*Generated via Sigma Protocol — Step 1: Ideation (Merged)*

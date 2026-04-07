# FLOW-TREE.md
# Make It Rain Digital — Complete Screen Flow Tree
# Version 1.0 | 2026-03-29
# Product Director: MIRD Internal

> "If it's not in the tree, it doesn't exist."

---

## APP 1: RAINMACHINE DASHBOARD

**App ID:** rainmachine-dashboard
**Prefix:** `rm`
**Platform:** Web (desktop-first, mobile responsive)
**Primary User:** Marcus — Realtor Team Leader + Agents
**URL Base:** dashboard.makeitrain.digital

---

### Flow 1.1: Authentication

---

#### 1.1.1 Login — Main

**Screen ID:** `rm-auth-login-main`
**Display Name:** Login
**Description:** Primary login screen for Marcus and his agents to authenticate into the RainMachine Dashboard.

- **Entry Points:** Direct URL, session expiry redirect, logout redirect, password reset success redirect
- **Exit Points:** `rm-dashboard-home-main` (success), `rm-auth-forgot-password-main` (forgot password link), `rm-auth-login-error` (failed auth)
- **Complexity:** Medium
- **Animation Complexity:** Medium
- **Priority:** P0
- **Data Requirements:** Email/password input, auth token response, user profile stub

**States:** default, loading (authenticating), error (invalid credentials)

---

#### 1.1.2 Login — Error State

**Screen ID:** `rm-auth-login-error`
**Display Name:** Login Error
**Description:** Login screen displaying inline error after failed authentication attempt (wrong credentials, locked account, or service unavailable).

- **Entry Points:** `rm-auth-login-main` (failed submission)
- **Exit Points:** `rm-auth-login-main` (retry), `rm-auth-forgot-password-main` (forgot password)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** Error code from auth service, attempt count

---

#### 1.1.3 Forgot Password — Request

**Screen ID:** `rm-auth-forgot-password-main`
**Display Name:** Forgot Password
**Description:** Email input screen for initiating a password reset. User enters their registered email to receive a reset link.

- **Entry Points:** `rm-auth-login-main` (forgot password link)
- **Exit Points:** `rm-auth-forgot-password-confirmation` (email submitted), `rm-auth-login-main` (back link)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** Email input, user record lookup

---

#### 1.1.4 Forgot Password — Confirmation

**Screen ID:** `rm-auth-forgot-password-confirmation`
**Display Name:** Password Reset Email Sent
**Description:** Confirmation screen shown after reset email is dispatched. Instructs user to check their inbox.

- **Entry Points:** `rm-auth-forgot-password-main` (successful submission)
- **Exit Points:** `rm-auth-login-main` (back to login link)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** Masked email address for display

---

#### 1.1.5 Password Reset — New Password

**Screen ID:** `rm-auth-password-reset-form`
**Display Name:** Set New Password
**Description:** Form for entering and confirming a new password, accessed via the reset link in email.

- **Entry Points:** Password reset email link (token-gated URL)
- **Exit Points:** `rm-auth-password-reset-success` (success), `rm-auth-login-main` (token expired/invalid)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** Reset token validation, password strength rules

---

#### 1.1.6 Password Reset — Success

**Screen ID:** `rm-auth-password-reset-success`
**Display Name:** Password Updated
**Description:** Success confirmation after a password has been successfully reset. Auto-redirects to login.

- **Entry Points:** `rm-auth-password-reset-form` (successful submission)
- **Exit Points:** `rm-auth-login-main` (auto-redirect after 3s, or manual link)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** None

---

#### 1.1.7 Session Expired

**Screen ID:** `rm-auth-session-expired`
**Display Name:** Session Expired
**Description:** Full-screen interstitial shown when the user's session token expires mid-use. Displays "SESSION EXPIRED — REINITIALIZING AUTHENTICATION" per JARVIS voice. Auto-redirects to login.

- **Entry Points:** Any authenticated screen (token TTL exceeded)
- **Exit Points:** `rm-auth-login-main` (auto-redirect after 3s)
- **Complexity:** Simple
- **Animation Complexity:** Medium
- **Priority:** P0
- **Data Requirements:** Session state, expiry timestamp

---

### Flow 1.2: First-Time Setup (Post-Login, First Visit)

---

#### 1.2.1 Welcome Splash

**Screen ID:** `rm-onboard-welcome-splash`
**Display Name:** Welcome to RainMachine
**Description:** First-time user welcome screen shown after initial login before any data is populated. Introduces the system and guides Marcus to complete team setup.

- **Entry Points:** `rm-auth-login-main` (first login only, onboarding_complete = false)
- **Exit Points:** `rm-onboard-team-setup-main` (begin setup CTA), `rm-dashboard-home-main` (skip for now — not recommended)
- **Complexity:** Simple
- **Animation Complexity:** Complex
- **Priority:** P1
- **Data Requirements:** Client name, package tier

---

#### 1.2.2 Team Setup — Add Agents

**Screen ID:** `rm-onboard-team-setup-main`
**Display Name:** Team Setup — Add Your Agents
**Description:** Guided step for Marcus to add his agent roster. Each agent gets a login and is enrolled in the lead routing system.

- **Entry Points:** `rm-onboard-welcome-splash`, `rm-settings-team-main` (revisit)
- **Exit Points:** `rm-onboard-routing-config` (next step), `rm-dashboard-home-main` (skip)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Agent name, email, phone, role fields; invite email trigger

---

#### 1.2.3 Routing Configuration — Initial

**Screen ID:** `rm-onboard-routing-config`
**Display Name:** Lead Routing Setup
**Description:** First-time configuration of lead routing rules: which agent receives which lead type from which ad source.

- **Entry Points:** `rm-onboard-team-setup-main`
- **Exit Points:** `rm-onboard-notifications-setup` (next), `rm-dashboard-home-main` (skip)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Agent list, source types (Meta, Google, Organic), routing rule structure

---

#### 1.2.4 Notifications Setup — Initial

**Screen ID:** `rm-onboard-notifications-setup`
**Display Name:** Notification Preferences
**Description:** First-time notification preferences — email vs. SMS for weekly reports, lead alerts, and campaign performance notifications.

- **Entry Points:** `rm-onboard-routing-config`
- **Exit Points:** `rm-onboard-setup-complete` (finish)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Email, SMS number, notification type toggles

---

#### 1.2.5 Setup Complete

**Screen ID:** `rm-onboard-setup-complete`
**Display Name:** Setup Complete — System Online
**Description:** Confirmation screen after first-time setup. Animates "RAINMACHINE SYSTEM ONLINE" and transitions to main dashboard.

- **Entry Points:** `rm-onboard-notifications-setup`
- **Exit Points:** `rm-dashboard-home-main` (auto-transition or CTA)
- **Complexity:** Simple
- **Animation Complexity:** Complex
- **Priority:** P1
- **Data Requirements:** Onboarding completion flag written to user record

---

### Flow 1.3: Main Dashboard

---

#### 1.3.1 Home — Main (Data Loaded)

**Screen ID:** `rm-dashboard-home-main`
**Display Name:** RainMachine Dashboard — Home
**Description:** The primary 4-quadrant command center showing Lead Acquisition, Pipeline, Agent Performance, and Campaign Intelligence panels plus the Claude AI Intelligence panel. Numbers boot-up animate on load.

- **Entry Points:** Sidebar nav, login success redirect, `rm-onboard-setup-complete`, any back-navigation
- **Exit Points:** `rm-leads-main`, `rm-agents-main`, `rm-campaigns-main`, `rm-reports-main`, `rm-settings-main`, Lead detail panel, Agent detail
- **Complexity:** Complex
- **Animation Complexity:** Complex
- **Priority:** P0
- **Data Requirements:** Aggregated leads count/CPL/call rate (7d), pipeline stage counts, agent performance summary, campaign spend/CPL/ROAS (Meta+Google), Claude weekly brief

---

#### 1.3.2 Home — Loading / Skeleton State

**Screen ID:** `rm-dashboard-home-loading`
**Display Name:** Dashboard Loading
**Description:** Skeleton shimmer state while dashboard data fetches from Meta API, Google API, and CRM. Panels visible in structure, content shimmer. Boot sequence animation plays.

- **Entry Points:** `rm-dashboard-home-main` (page load / data pending)
- **Exit Points:** `rm-dashboard-home-main` (data resolves), `rm-dashboard-home-error` (fetch fails)
- **Complexity:** Simple
- **Animation Complexity:** Complex
- **Priority:** P0
- **Data Requirements:** None (loading state)

---

#### 1.3.3 Home — Empty State (No Data Yet)

**Screen ID:** `rm-dashboard-home-empty`
**Display Name:** Dashboard — Awaiting First Data Sync
**Description:** Empty state displayed for new clients whose campaigns have not yet gone live. Shows "SYSTEM ONLINE — AWAITING FIRST DATA SYNC" with pulsing MIRD logo. No panels populated.

- **Entry Points:** `rm-dashboard-home-main` (campaigns not yet live)
- **Exit Points:** `rm-dashboard-home-main` (data arrives after campaign launch), `rm-settings-integrations` (connect ad accounts)
- **Complexity:** Simple
- **Animation Complexity:** Complex
- **Priority:** P1
- **Data Requirements:** Campaign live status flag, onboarding completion status

---

#### 1.3.4 Home — Data Error State

**Screen ID:** `rm-dashboard-home-error`
**Display Name:** Dashboard — Signal Lost
**Description:** Error state when one or more data feeds fail to load. Panel borders turn orange, "SIGNAL LOST" labels appear per panel. Partial data still displayed where available.

- **Entry Points:** `rm-dashboard-home-loading` (fetch failure)
- **Exit Points:** `rm-dashboard-home-main` (retry resolves), `rm-settings-integrations` (reconnect)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** API error codes, partial data sets

---

### Flow 1.4: Leads

---

#### 1.4.1 Leads — Main List

**Screen ID:** `rm-leads-main`
**Display Name:** Lead Acquisition Intelligence
**Description:** Full lead list with filter bar (stage, source, date range, AI call status), sortable table or card-toggle view, pagination. Real-time lead count badge in header.

- **Entry Points:** Sidebar nav, `rm-dashboard-home-main` panel CTA "VIEW ALL LEADS →"
- **Exit Points:** `rm-leads-detail-panel` (row click), `rm-leads-empty` (no leads), `rm-leads-filtered-empty` (no filter results)
- **Complexity:** Complex
- **Animation Complexity:** Medium
- **Priority:** P0
- **Data Requirements:** Full lead list (paginated, 25/page), stage, source, AI call status, CPL, last activity timestamp

---

#### 1.4.2 Leads — Detail Side Panel

**Screen ID:** `rm-leads-detail-panel`
**Display Name:** Lead Intelligence Panel
**Description:** 400px right-side slide-in panel showing full lead profile: stage, source, timeline of events, AI call transcript summary, assigned agent, and reassign option.

- **Entry Points:** `rm-leads-main` (row click / arrow click)
- **Exit Points:** `rm-leads-main` (close panel), `rm-leads-detail-full` (expand to full page), `rm-agents-detail-main` (assigned agent link)
- **Complexity:** Complex
- **Animation Complexity:** Medium
- **Priority:** P0
- **Data Requirements:** Lead profile, timeline events, AI call transcript summary, agent assignment

---

#### 1.4.3 Leads — Detail Full Page

**Screen ID:** `rm-leads-detail-full`
**Display Name:** Lead Full Profile
**Description:** Full-page expanded view of a single lead. Shows complete timeline, full AI call transcript, qualification notes, all contact attempts, and appointment detail if booked.

- **Entry Points:** `rm-leads-detail-panel` (expand), direct URL
- **Exit Points:** `rm-leads-main` (back), `rm-leads-detail-call-history`, `rm-leads-detail-appointment`
- **Complexity:** Complex
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Full lead record, all call logs, transcript data, appointment record

---

#### 1.4.4 Leads — Call History Tab

**Screen ID:** `rm-leads-detail-call-history`
**Display Name:** Lead Call History
**Description:** Tab within lead full profile showing every AI call attempt: timestamp, duration, outcome (connected/voicemail/no answer/bad number), and full transcript per connected call.

- **Entry Points:** `rm-leads-detail-full` (Call History tab)
- **Exit Points:** `rm-leads-detail-full` (other tabs)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** All call records for lead, outcomes, transcripts

---

#### 1.4.5 Leads — Appointment Detail Tab

**Screen ID:** `rm-leads-detail-appointment`
**Display Name:** Lead Appointment Detail
**Description:** Tab showing confirmed appointment details: date/time, agent assigned, confirmation status, show/no-show outcome, and reminder delivery history.

- **Entry Points:** `rm-leads-detail-full` (Appointment tab)
- **Exit Points:** `rm-leads-detail-full` (other tabs)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Appointment record, confirmation status, show/no-show flag

---

#### 1.4.6 Leads — Empty State (No Leads)

**Screen ID:** `rm-leads-empty`
**Display Name:** Leads — Awaiting Incoming Signals
**Description:** Empty state when no leads exist yet. JARVIS-voice copy: "AWAITING INCOMING SIGNALS — Lead acquisition pipeline is active."

- **Entry Points:** `rm-leads-main` (lead count = 0)
- **Exit Points:** `rm-leads-main` (when first lead arrives), `rm-settings-integrations` (connect ad accounts)
- **Complexity:** Simple
- **Animation Complexity:** Medium
- **Priority:** P1
- **Data Requirements:** Lead count, campaign live status

---

#### 1.4.7 Leads — Filtered Empty State

**Screen ID:** `rm-leads-filtered-empty`
**Display Name:** Leads — No Results for Filters
**Description:** Empty state when active filters produce zero results. Shows "NO LEADS MATCH CURRENT FILTERS" with a reset filters CTA.

- **Entry Points:** `rm-leads-main` (active filters, 0 results)
- **Exit Points:** `rm-leads-main` (reset filters)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P2
- **Data Requirements:** Active filter state

---

#### 1.4.8 Leads — Reassign Agent Modal

**Screen ID:** `rm-leads-reassign-modal`
**Display Name:** Reassign Lead Modal
**Description:** Modal overlay for reassigning a lead to a different agent. Dropdown of active agents, confirmation step, reason field (optional).

- **Entry Points:** `rm-leads-detail-panel` (REASSIGN link), `rm-leads-detail-full` (REASSIGN CTA)
- **Exit Points:** `rm-leads-detail-panel` / `rm-leads-detail-full` (confirm or cancel)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P2
- **Data Requirements:** Agent roster, current assignment, lead ID

---

### Flow 1.5: Agent Performance

---

#### 1.5.1 Agents — Main Overview

**Screen ID:** `rm-agents-main`
**Display Name:** Agent Performance Overview
**Description:** Summary bar (total agents, avg conversion rate, best performer) and 2-column grid of agent performance panels. Includes lead routing toggle view.

- **Entry Points:** Sidebar nav, `rm-dashboard-home-main` panel CTA "VIEW ALL AGENTS →"
- **Exit Points:** `rm-agents-detail-main` (per-agent CTA), `rm-agents-routing-view` (toggle), `rm-agents-empty`
- **Complexity:** Complex
- **Animation Complexity:** Medium
- **Priority:** P0
- **Data Requirements:** All agent records with leads assigned/contacted/converted, conversion rate, CPL, top source

---

#### 1.5.2 Agents — Lead Routing View

**Screen ID:** `rm-agents-routing-view`
**Display Name:** Lead Routing Diagram
**Description:** Visual flow diagram showing how leads route from sources (Meta, Google) to agents based on routing rules. Each connector labeled with rule conditions.

- **Entry Points:** `rm-agents-main` (toggle "ROUTING VIEW")
- **Exit Points:** `rm-agents-main` (toggle back), `rm-settings-routing` (edit rules CTA)
- **Complexity:** Complex
- **Animation Complexity:** Medium
- **Priority:** P1
- **Data Requirements:** Routing rules, agent list, lead source volumes

---

#### 1.5.3 Agent — Detail Full Profile

**Screen ID:** `rm-agents-detail-main`
**Display Name:** Agent Full Profile
**Description:** Full per-agent page: performance metrics over time, assigned leads list, conversion rate trend, call attempt log, and notes field.

- **Entry Points:** `rm-agents-main` (VIEW FULL PROFILE), `rm-leads-detail-panel` (agent link)
- **Exit Points:** `rm-agents-main` (back), `rm-leads-detail-panel` (lead row), `rm-agents-detail-leads-tab`
- **Complexity:** Complex
- **Animation Complexity:** Medium
- **Priority:** P1
- **Data Requirements:** Agent profile, full performance history, assigned leads list, call log

---

#### 1.5.4 Agent — Leads Tab

**Screen ID:** `rm-agents-detail-leads-tab`
**Display Name:** Agent — Assigned Leads
**Description:** Tab within agent detail showing all leads currently assigned to this agent, with stage, last activity, and quick-navigate to lead detail.

- **Entry Points:** `rm-agents-detail-main` (Leads tab)
- **Exit Points:** `rm-leads-detail-panel` (lead row click), `rm-agents-detail-main` (other tabs)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Lead records filtered by agent ID

---

#### 1.5.5 Agents — Empty State

**Screen ID:** `rm-agents-empty`
**Display Name:** Agents — No Agents Configured
**Description:** Empty state when no agents have been added yet. Prompts Marcus to add his team.

- **Entry Points:** `rm-agents-main` (agent count = 0)
- **Exit Points:** `rm-settings-team-main` (ADD AGENT CTA)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Agent count

---

### Flow 1.6: Campaign Intelligence

---

#### 1.6.1 Campaigns — Main Overview

**Screen ID:** `rm-campaigns-main`
**Display Name:** Campaign Intelligence
**Description:** Platform switcher (Meta / Google / All), performance overview panel with 5 aggregate metrics and sparklines, campaign table, and creative performance grid.

- **Entry Points:** Sidebar nav, `rm-dashboard-home-main` panel CTA
- **Exit Points:** `rm-campaigns-detail-accordion` (table row expand), `rm-campaigns-creative-detail-modal` (creative click), `rm-campaigns-empty`
- **Complexity:** Complex
- **Animation Complexity:** Medium
- **Priority:** P0
- **Data Requirements:** All active campaigns per platform, spend/CPL/ROAS/leads/CTR per campaign, creative thumbnails and metrics

---

#### 1.6.2 Campaigns — Campaign Detail Accordion

**Screen ID:** `rm-campaigns-detail-accordion`
**Display Name:** Campaign Detail Row
**Description:** Inline accordion expansion within campaign table showing 30-day performance charts (CPL trend, spend trend), ad set breakdown, and health assessment.

- **Entry Points:** `rm-campaigns-main` (campaign row click)
- **Exit Points:** `rm-campaigns-main` (collapse)
- **Complexity:** Complex
- **Animation Complexity:** Medium
- **Priority:** P1
- **Data Requirements:** 30-day campaign performance time series, ad set data

---

#### 1.6.3 Campaigns — Creative Detail Modal

**Screen ID:** `rm-campaigns-creative-detail-modal`
**Display Name:** Creative Performance Detail
**Description:** Modal overlay showing a single creative asset's full metrics: impressions, clicks, CTR, CPL, lead count, spend, frequency, and performance vs. account average.

- **Entry Points:** `rm-campaigns-main` (creative thumbnail click)
- **Exit Points:** `rm-campaigns-main` (close modal)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P2
- **Data Requirements:** Creative-level metrics, full-size asset preview

---

#### 1.6.4 Campaigns — Empty State (No Ads Connected)

**Screen ID:** `rm-campaigns-empty`
**Display Name:** Campaigns — No Active Campaigns Detected
**Description:** Empty state before ad accounts are connected. JARVIS copy: "NO ACTIVE CAMPAIGNS DETECTED." CTA to connect ad account.

- **Entry Points:** `rm-campaigns-main` (no ad accounts connected)
- **Exit Points:** `rm-settings-integrations` (CONNECT AD ACCOUNT CTA)
- **Complexity:** Simple
- **Animation Complexity:** Medium
- **Priority:** P1
- **Data Requirements:** Integration connection status

---

#### 1.6.5 Campaigns — Platform Error State

**Screen ID:** `rm-campaigns-platform-error`
**Display Name:** Campaigns — Platform Signal Lost
**Description:** Error state when Meta or Google API fails to return data. Panel shows "SIGNAL LOST" for the affected platform, remaining platform still displayed.

- **Entry Points:** `rm-campaigns-main` (API fetch failure)
- **Exit Points:** `rm-campaigns-main` (retry resolves), `rm-settings-integrations` (reconnect)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** API error code, partial platform data

---

### Flow 1.7: Claude AI Reports

---

#### 1.7.1 Reports — Main

**Screen ID:** `rm-reports-main`
**Display Name:** Intelligence Archive
**Description:** 60/40 split view: left panel shows searchable report history list; right panel shows active report or chat interface. Reports listed with week number, date range, and first-line summary.

- **Entry Points:** Sidebar nav, `rm-dashboard-home-main` Claude AI panel CTA
- **Exit Points:** `rm-reports-report-view` (select a report), `rm-reports-empty`
- **Complexity:** Complex
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** Report index (week, date range, summary), latest report full content, chat history

---

#### 1.7.2 Reports — Report Full View

**Screen ID:** `rm-reports-report-view`
**Display Name:** Weekly Intelligence Brief
**Description:** Full Claude-generated weekly report displayed in the right panel. Inter prose body, metadata header (generated timestamp, AI version), and follow-up chat interface below.

- **Entry Points:** `rm-reports-main` (report row click), `rm-dashboard-home-main` (READ FULL REPORT link)
- **Exit Points:** `rm-reports-main` (select different report), `rm-reports-chat-active` (chat interaction)
- **Complexity:** Complex
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** Full report text, generation metadata, chat context

---

#### 1.7.3 Reports — Chat Active State

**Screen ID:** `rm-reports-chat-active`
**Display Name:** AI Report Chat
**Description:** State of the report right-panel when a user has submitted a follow-up question. Shows chat history, "PROCESSING QUERY…" indicator during AI response, and rendered AI response.

- **Entry Points:** `rm-reports-report-view` (user submits chat message)
- **Exit Points:** `rm-reports-report-view` (idle / back to report), continues within same view
- **Complexity:** Complex
- **Animation Complexity:** Medium
- **Priority:** P0
- **Data Requirements:** User query, AI response stream, conversation history, current report context window

---

#### 1.7.4 Reports — AI Processing State

**Screen ID:** `rm-reports-chat-processing`
**Display Name:** AI Processing Query
**Description:** Transient state showing "PROCESSING QUERY…" with pulsing dots animation while waiting for Claude API response.

- **Entry Points:** `rm-reports-chat-active` (query submitted, awaiting response)
- **Exit Points:** `rm-reports-chat-active` (response received), `rm-reports-chat-error` (API failure)
- **Complexity:** Simple
- **Animation Complexity:** Medium
- **Priority:** P0
- **Data Requirements:** Query submitted state

---

#### 1.7.5 Reports — Chat Error State

**Screen ID:** `rm-reports-chat-error`
**Display Name:** AI Response Error
**Description:** Inline error state when the Claude API fails to return a response. "QUERY FAILED — SIGNAL LOST" message with retry option.

- **Entry Points:** `rm-reports-chat-processing` (API timeout or error)
- **Exit Points:** `rm-reports-chat-active` (retry)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Error type, retry capability flag

---

#### 1.7.6 Reports — Empty State (No Reports Yet)

**Screen ID:** `rm-reports-empty`
**Display Name:** Intelligence Reports Initializing
**Description:** Empty state when no reports have been generated yet (< 7 days since campaign launch). "INTELLIGENCE REPORTS INITIALIZING — FIRST REPORT GENERATES AFTER 7 DAYS LIVE."

- **Entry Points:** `rm-reports-main` (report count = 0)
- **Exit Points:** `rm-reports-main` (auto-refresh when first report generates)
- **Complexity:** Simple
- **Animation Complexity:** Medium
- **Priority:** P1
- **Data Requirements:** Campaign live date, report generation schedule

---

### Flow 1.8: Settings

---

#### 1.8.1 Settings — Team Management

**Screen ID:** `rm-settings-team-main`
**Display Name:** Settings — Team Management
**Description:** Table of all team members (agents and Marcus) with name, role, status, 30-day leads, last active. Add agent button triggers modal.

- **Entry Points:** Sidebar nav (Settings), `rm-onboard-team-setup-main` (revisit), any "MANAGE TEAM" CTA
- **Exit Points:** `rm-settings-add-agent-modal`, `rm-settings-edit-agent-modal`, `rm-settings-routing`, other settings tabs
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Team roster, agent status, 30-day performance summary per agent

---

#### 1.8.2 Settings — Add Agent Modal

**Screen ID:** `rm-settings-add-agent-modal`
**Display Name:** Add New Agent
**Description:** Modal for adding a new agent: name, email, phone, role. Triggers invite email upon save.

- **Entry Points:** `rm-settings-team-main` (+ ADD AGENT button)
- **Exit Points:** `rm-settings-team-main` (save or cancel)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Name, email, phone, role; invite email trigger

---

#### 1.8.3 Settings — Edit Agent Modal

**Screen ID:** `rm-settings-edit-agent-modal`
**Display Name:** Edit Agent
**Description:** Modal for editing an existing agent's details: name, contact, role, status (active/inactive).

- **Entry Points:** `rm-settings-team-main` (edit action on agent row)
- **Exit Points:** `rm-settings-team-main` (save or cancel)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P2
- **Data Requirements:** Existing agent record

---

#### 1.8.4 Settings — Lead Routing

**Screen ID:** `rm-settings-routing`
**Display Name:** Settings — Lead Routing
**Description:** Visual rule builder for configuring lead routing logic: IF source = X AND condition = Y THEN assign to agent Z with routing method. Drag-to-reorder rules.

- **Entry Points:** Settings tab nav, `rm-onboard-routing-config` (revisit), `rm-agents-routing-view` (edit rules CTA)
- **Exit Points:** Other settings tabs
- **Complexity:** Complex
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Routing rules, agent list, source types

---

#### 1.8.5 Settings — Notifications

**Screen ID:** `rm-settings-notifications`
**Display Name:** Settings — Notifications
**Description:** Toggle rows for all notification types: weekly AI report ready, new lead assigned, agent performance alerts, campaign CPL spike. Per-toggle: email / SMS / both.

- **Entry Points:** Settings tab nav, `rm-onboard-notifications-setup` (revisit)
- **Exit Points:** Other settings tabs
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** User notification preferences, contact details

---

#### 1.8.6 Settings — Integrations

**Screen ID:** `rm-settings-integrations`
**Display Name:** Settings — Integrations
**Description:** Status cards for each connected platform: Meta Business Manager, Google Ads, Google My Business, CRM Integration. Shows connection status, last sync time, reconnect/disconnect options.

- **Entry Points:** Settings tab nav, `rm-campaigns-empty` (CONNECT AD ACCOUNT CTA), `rm-dashboard-home-error` (reconnect CTA)
- **Exit Points:** `rm-settings-integrations-meta-reconnect`, `rm-settings-integrations-google-reconnect`, other settings tabs
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** Integration connection statuses, last sync timestamps

---

#### 1.8.7 Settings — Integrations — Meta Reconnect

**Screen ID:** `rm-settings-integrations-meta-reconnect`
**Display Name:** Reconnect Meta Ads
**Description:** Guided flow for reconnecting a disconnected Meta Business Manager integration. Re-uses the onboarding Step 3 token verification UI within settings context.

- **Entry Points:** `rm-settings-integrations` (Meta — RECONNECT)
- **Exit Points:** `rm-settings-integrations` (success or cancel)
- **Complexity:** Medium
- **Animation Complexity:** Medium
- **Priority:** P1
- **Data Requirements:** Meta token input, API verification call

---

#### 1.8.8 Settings — Integrations — Google Reconnect

**Screen ID:** `rm-settings-integrations-google-reconnect`
**Display Name:** Reconnect Google Ads
**Description:** Guided flow for reconnecting a disconnected Google Ads or GMB integration within settings context.

- **Entry Points:** `rm-settings-integrations` (Google — RECONNECT)
- **Exit Points:** `rm-settings-integrations` (success or cancel)
- **Complexity:** Medium
- **Animation Complexity:** Medium
- **Priority:** P1
- **Data Requirements:** Google Customer ID, manager account invite status

---

#### 1.8.9 Settings — Account & Billing

**Screen ID:** `rm-settings-account`
**Display Name:** Settings — Account & Billing
**Description:** Account details: client name, package tier, MRR, contract start date, renewal date. Invoice history table. Contact info for billing support.

- **Entry Points:** Settings tab nav
- **Exit Points:** Other settings tabs
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P2
- **Data Requirements:** Client account record, invoice history, contract details

---

### Flow 1.9: Global / System-Level

---

#### 1.9.1 Global Error — 404

**Screen ID:** `rm-global-404`
**Display Name:** Page Not Found
**Description:** Full-page 404 error in JARVIS aesthetic. "NAVIGATION TARGET NOT FOUND" with link back to dashboard.

- **Entry Points:** Any broken or mistyped URL
- **Exit Points:** `rm-dashboard-home-main` (return to dashboard)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** None

---

#### 1.9.2 Global Error — 500

**Screen ID:** `rm-global-500`
**Display Name:** System Fault
**Description:** Full-page server error. "SYSTEM FAULT — DIAGNOSTIC IN PROGRESS" in JARVIS aesthetic. Auto-retry logic with countdown.

- **Entry Points:** Any server-side error (5xx response)
- **Exit Points:** `rm-dashboard-home-main` (retry success), remains on page (retry pending)
- **Complexity:** Simple
- **Animation Complexity:** Medium
- **Priority:** P1
- **Data Requirements:** Error code, retry status

---

#### 1.9.3 Maintenance Mode

**Screen ID:** `rm-global-maintenance`
**Display Name:** System Maintenance
**Description:** Full-page maintenance screen shown during planned downtime. Estimated return time, MIRD contact info.

- **Entry Points:** Maintenance flag active (server-side redirect)
- **Exit Points:** `rm-dashboard-home-main` (maintenance ends)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P2
- **Data Requirements:** Maintenance window details, estimated return time

---
---

## APP 2: CEO DASHBOARD

**App ID:** ceo-dashboard
**Prefix:** `ceo`
**Platform:** Web (desktop only, 1024px minimum)
**Primary User:** Shomari Williams — MIRD CEO
**URL Base:** internal.makeitrain.digital/ceo

---

### Flow 2.1: Authentication

---

#### 2.1.1 CEO Login — Main

**Screen ID:** `ceo-auth-login-main`
**Display Name:** CEO Dashboard Login
**Description:** Isolated login screen for the CEO Dashboard. Single-user access. High-security context — may include 2FA prompt.

- **Entry Points:** Direct URL, session expiry redirect
- **Exit Points:** `ceo-command-center-main` (success), `ceo-auth-2fa-prompt` (2FA required), `ceo-auth-login-error` (failed)
- **Complexity:** Medium
- **Animation Complexity:** Medium
- **Priority:** P0
- **Data Requirements:** Email/password, 2FA token

---

#### 2.1.2 CEO Login — 2FA Prompt

**Screen ID:** `ceo-auth-2fa-prompt`
**Display Name:** Two-Factor Authentication
**Description:** 6-digit code entry after successful password authentication. Code delivered via SMS or authenticator app.

- **Entry Points:** `ceo-auth-login-main` (2FA required)
- **Exit Points:** `ceo-command-center-main` (success), `ceo-auth-login-main` (max attempts / cancel)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** 2FA code, attempt count

---

#### 2.1.3 CEO Login — Error State

**Screen ID:** `ceo-auth-login-error`
**Display Name:** CEO Login Error
**Description:** Login error after failed authentication. Inline error message, lockout countdown if max attempts reached.

- **Entry Points:** `ceo-auth-login-main` (invalid credentials)
- **Exit Points:** `ceo-auth-login-main` (retry)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** Error type, attempt count, lockout duration

---

#### 2.1.4 CEO Session Expired

**Screen ID:** `ceo-auth-session-expired`
**Display Name:** CEO Session Expired
**Description:** Full-screen session expiry interstitial. Auto-redirects to CEO login after 3 seconds.

- **Entry Points:** Any CEO authenticated screen (session TTL exceeded)
- **Exit Points:** `ceo-auth-login-main`
- **Complexity:** Simple
- **Animation Complexity:** Medium
- **Priority:** P0
- **Data Requirements:** Session expiry timestamp

---

### Flow 2.2: Command Center

---

#### 2.2.1 Command Center — Main

**Screen ID:** `ceo-command-center-main`
**Display Name:** MIRD Command Center
**Description:** The 30-minute CEO loop home screen. North Star bar (MRR, growth, client count, churn), alert tray, 2x2 department panel grid, and client health grid (5-column). Live clock in header.

- **Entry Points:** CEO login success, sidebar nav, any back-navigation
- **Exit Points:** `ceo-command-center-alert-detail` (alert investigate), `ceo-dept-growth-main` (dept 1), `ceo-dept-adops-main` (dept 2), `ceo-dept-product-main` (dept 3), `ceo-dept-finance-main` (dept 4), `ceo-clients-list`, `ceo-clients-detail` (client card click)
- **Complexity:** Complex
- **Animation Complexity:** Complex
- **Priority:** P0
- **Data Requirements:** MRR, MRR growth %, active client count, churn rate; per-dept: summary KPIs; all client health scores; alert queue

---

#### 2.2.2 Command Center — Alert Detail

**Screen ID:** `ceo-command-center-alert-detail`
**Display Name:** Alert Investigation
**Description:** Focused view when clicking INVESTIGATE on an alert tray item. Shows the alert context: client name, metric, % change, flagging agent, timestamp. Provides investigate-deeper CTA leading to client detail.

- **Entry Points:** `ceo-command-center-main` (INVESTIGATE → on alert item)
- **Exit Points:** `ceo-clients-detail` (full client deep dive), `ceo-command-center-main` (dismiss or back)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** Alert record, client summary, metric trend (7d), flagging agent ID

---

#### 2.2.3 Command Center — Alert Dismiss Modal

**Screen ID:** `ceo-command-center-alert-dismiss-modal`
**Display Name:** Dismiss Alert
**Description:** Confirmation modal for dismissing an alert. Requires a brief reason/note. Logs dismissal with timestamp.

- **Entry Points:** `ceo-command-center-alert-detail` (DISMISS), `ceo-command-center-main` (swipe-dismiss)
- **Exit Points:** `ceo-command-center-main` (confirmed), `ceo-command-center-alert-detail` (cancelled)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Alert ID, dismissal note input

---

#### 2.2.4 Command Center — All Clients Grid

**Screen ID:** `ceo-clients-list`
**Display Name:** All Clients
**Description:** Expanded full-page version of the client health grid. All clients sortable by health score, MRR, risk status, or alphabetically.

- **Entry Points:** `ceo-command-center-main` (VIEW ALL CLIENTS →)
- **Exit Points:** `ceo-clients-detail` (client card click), `ceo-command-center-main` (back)
- **Complexity:** Complex
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** All client records with health score, MRR, CPL, ROAS, risk status

---

### Flow 2.3: Client Detail

---

#### 2.3.1 Client Detail — Overview Tab

**Screen ID:** `ceo-clients-detail-overview`
**Display Name:** Client Detail — Overview
**Description:** Single-client deep dive. Header: client name, org, since date, MRR, health status. Overview tab: CPL trend (30d chart), pipeline funnel, quick stats, next report date, notes field.

- **Entry Points:** `ceo-command-center-main` (client card), `ceo-clients-list` (client row), `ceo-command-center-alert-detail` (client link)
- **Exit Points:** All client detail tabs, `ceo-clients-list` (back), `ceo-command-center-main` (breadcrumb)
- **Complexity:** Complex
- **Animation Complexity:** Medium
- **Priority:** P0
- **Data Requirements:** Client profile, 30-day CPL time series, pipeline stage counts, account notes

---

#### 2.3.2 Client Detail — Campaigns Tab

**Screen ID:** `ceo-clients-detail-campaigns`
**Display Name:** Client Detail — Campaigns
**Description:** Read-only campaign table for this client: same data as RainMachine Campaign Intelligence but with Shomari's internal view (includes cost vs. margin context).

- **Entry Points:** `ceo-clients-detail-overview` (Campaigns tab)
- **Exit Points:** Other client detail tabs
- **Complexity:** Complex
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Client campaign records (Meta + Google), spend, CPL, ROAS, health per campaign

---

#### 2.3.3 Client Detail — Leads Tab

**Screen ID:** `ceo-clients-detail-leads`
**Display Name:** Client Detail — Leads
**Description:** Read-only lead list for this client. Same data as Marcus's leads view but in CEO context with more operational detail.

- **Entry Points:** `ceo-clients-detail-overview` (Leads tab)
- **Exit Points:** Other client detail tabs
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Client lead records, stages, AI call statuses

---

#### 2.3.4 Client Detail — Timeline Tab

**Screen ID:** `ceo-clients-detail-timeline`
**Display Name:** Client Detail — Timeline
**Description:** Chronological log of all activity for this client: agent actions, human interventions, report generations, alert raises/dismissals, campaign changes.

- **Entry Points:** `ceo-clients-detail-overview` (Timeline tab)
- **Exit Points:** Other client detail tabs
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Full client activity log, actor types (AI / human / auto)

---

#### 2.3.5 Client Detail — Financials Tab

**Screen ID:** `ceo-clients-detail-financials`
**Display Name:** Client Detail — Financials
**Description:** Invoice history, MRR value, contract tier, renewal date, gross margin estimate, payment status.

- **Entry Points:** `ceo-clients-detail-overview` (Financials tab)
- **Exit Points:** Other client detail tabs
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Invoice records, contract terms, MRR, margin data

---

### Flow 2.4: Department Drill-Downs

---

#### 2.4.1 Department 1 — Growth & Client Acquisition

**Screen ID:** `ceo-dept-growth-main`
**Display Name:** Dept 1 — Growth & Client Acquisition
**Description:** Full department drill-down for growth operations. Shows calls booked (weekly trend), DBR pipeline (prospect list with stage and value), outbound activity volume, and close rate trend.

- **Entry Points:** `ceo-command-center-main` (VIEW DEPT 1 DETAIL →)
- **Exit Points:** `ceo-dept-growth-prospect-detail`, `ceo-command-center-main` (back)
- **Complexity:** Complex
- **Animation Complexity:** Medium
- **Priority:** P1
- **Data Requirements:** Calls booked time series, prospect pipeline with stages/values, outbound volume, close rate history

---

#### 2.4.2 Department 1 — Prospect Detail

**Screen ID:** `ceo-dept-growth-prospect-detail`
**Display Name:** Prospect Detail
**Description:** Individual prospect record in the DBR pipeline: company name, contact, last outreach date, stage, estimated MRR if closed, next action.

- **Entry Points:** `ceo-dept-growth-main` (prospect row)
- **Exit Points:** `ceo-dept-growth-main` (back)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P2
- **Data Requirements:** Prospect record, outreach history, stage data

---

#### 2.4.3 Department 2 — Ad Operations & AI Delivery

**Screen ID:** `ceo-dept-adops-main`
**Display Name:** Dept 2 — Ad Operations & AI Delivery
**Description:** Full Ad Operations drill-down. Active campaign count, CPL health distribution across all clients, clients at risk list, average ROAS, AI calling system performance summary.

- **Entry Points:** `ceo-command-center-main` (VIEW DEPT 2 DETAIL →)
- **Exit Points:** `ceo-clients-detail-overview` (client-at-risk row), `ceo-command-center-main` (back)
- **Complexity:** Complex
- **Animation Complexity:** Medium
- **Priority:** P1
- **Data Requirements:** Cross-client campaign metrics, CPL health distribution, AI call system metrics (connection rate, qualification rate)

---

#### 2.4.4 Department 3 — Product & Automation

**Screen ID:** `ceo-dept-product-main`
**Display Name:** Dept 3 — Product & Automation
**Description:** Onboarding queue (clients in-progress), average time-to-live, n8n uptime, active workflow count, automation error log. Each onboarding client card links to their onboarding status.

- **Entry Points:** `ceo-command-center-main` (VIEW DEPT 3 DETAIL →)
- **Exit Points:** `ceo-dept-product-onboarding-detail`, `ceo-dept-product-workflow-health`, `ceo-command-center-main` (back)
- **Complexity:** Complex
- **Animation Complexity:** Medium
- **Priority:** P1
- **Data Requirements:** Onboarding records, time-to-live metrics, n8n health metrics, workflow error log

---

#### 2.4.5 Department 3 — Onboarding Detail

**Screen ID:** `ceo-dept-product-onboarding-detail`
**Display Name:** Client Onboarding Status
**Description:** Individual client onboarding tracker: which wizard step completed, time spent, blockers (e.g., "Stalled at Step 3 — Meta verification failed"), and action options for MIRD team.

- **Entry Points:** `ceo-dept-product-main` (onboarding queue client row)
- **Exit Points:** `ceo-dept-product-main` (back)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Onboarding session record, step completion status, error flags, time elapsed

---

#### 2.4.6 Department 3 — Workflow Health Monitor

**Screen ID:** `ceo-dept-product-workflow-health`
**Display Name:** Workflow Health Monitor
**Description:** n8n workflow status board: each named workflow with last run timestamp, run count, success/error rate, and error log viewer.

- **Entry Points:** `ceo-dept-product-main` (N8N HEALTH link)
- **Exit Points:** `ceo-dept-product-main` (back)
- **Complexity:** Complex
- **Animation Complexity:** Simple
- **Priority:** P2
- **Data Requirements:** n8n workflow execution logs, error records

---

#### 2.4.7 Department 4 — Finance & Business Intelligence

**Screen ID:** `ceo-dept-finance-main`
**Display Name:** Dept 4 — Financial Intelligence
**Description:** Full Financial Intelligence screen. 12-month MRR trend chart, aggregate metrics (MRR, growth %, churn rate, LTV, CAC, LTV:CAC ratio), P&L per client table, 90-day forecast with 3 scenarios.

- **Entry Points:** `ceo-command-center-main` (VIEW DEPT 4 DETAIL →), sidebar nav
- **Exit Points:** `ceo-dept-finance-client-pl-detail`, `ceo-command-center-main` (back)
- **Complexity:** Complex
- **Animation Complexity:** Medium
- **Priority:** P1
- **Data Requirements:** MRR time series (12mo), per-client financials, CAC data, forecast model parameters

---

#### 2.4.8 Department 4 — Client P&L Detail

**Screen ID:** `ceo-dept-finance-client-pl-detail`
**Display Name:** Client P&L Detail
**Description:** Expanded inline row within the P&L table showing 6-month financial history for a single client: MRR, ad spend, labor estimate, gross margin per month.

- **Entry Points:** `ceo-dept-finance-main` (P&L table row expand)
- **Exit Points:** `ceo-dept-finance-main` (collapse)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P2
- **Data Requirements:** 6-month financial records for client, spend data

---

### Flow 2.5: Agent Activity Log

---

#### 2.5.1 Agent Activity Log — Main

**Screen ID:** `ceo-agents-log-main`
**Display Name:** Autonomous Department Activity Log
**Description:** Full-page log of all 4 autonomous department agents' activity for the current day. Expandable sections per department. Timestamped entries, color-coded by action type.

- **Entry Points:** Sidebar nav, `ceo-command-center-main` (agent log shortcut)
- **Exit Points:** `ceo-agents-log-dept-detail`, `ceo-command-center-main` (back)
- **Complexity:** Complex
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** All agent execution logs for today, action types, timestamps, alert cross-references

---

#### 2.5.2 Agent Activity Log — Department Full Log

**Screen ID:** `ceo-agents-log-dept-detail`
**Display Name:** Department Agent Full Log
**Description:** Full expanded log view for a single department agent: every action in the current day's run with all metadata, expandable error details, and downloadable log file.

- **Entry Points:** `ceo-agents-log-main` (VIEW FULL LOG per department)
- **Exit Points:** `ceo-agents-log-main` (back)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P2
- **Data Requirements:** Full agent run log for selected department, error records

---

#### 2.5.3 Agent Activity Log — Historical View

**Screen ID:** `ceo-agents-log-historical`
**Display Name:** Agent Log History
**Description:** Date-picker to view agent activity logs for previous days. Calendar navigation, daily summary cards, and log viewer.

- **Entry Points:** `ceo-agents-log-main` (date picker / history CTA)
- **Exit Points:** `ceo-agents-log-main` (return to today)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P2
- **Data Requirements:** Historical agent log records, date range selector

---

### Flow 2.6: CEO Settings

---

#### 2.6.1 CEO Settings — Main

**Screen ID:** `ceo-settings-main`
**Display Name:** CEO Settings
**Description:** Settings hub for the CEO dashboard. Tabs: Alert Thresholds, Notification Preferences, System Health, Account.

- **Entry Points:** Sidebar nav (settings icon)
- **Exit Points:** All settings sub-tabs
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P2
- **Data Requirements:** Current settings configuration

---

#### 2.6.2 CEO Settings — Alert Thresholds

**Screen ID:** `ceo-settings-alert-thresholds`
**Display Name:** Alert Threshold Configuration
**Description:** Configuration panel for each automated alert: CPL spike threshold %, churn risk triggers, onboarding stall time, agent error counts. Each threshold configurable with numeric input.

- **Entry Points:** `ceo-settings-main` (Alert Thresholds tab)
- **Exit Points:** `ceo-settings-main`
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P2
- **Data Requirements:** Current threshold values, historical alert rate data

---

#### 2.6.3 CEO Settings — Notification Preferences

**Screen ID:** `ceo-settings-notifications`
**Display Name:** CEO Notification Preferences
**Description:** Shomari's notification configuration: alert delivery method (Slack, email, SMS), daily digest timing, escalation urgency levels.

- **Entry Points:** `ceo-settings-main` (Notifications tab)
- **Exit Points:** `ceo-settings-main`
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P2
- **Data Requirements:** Notification config, contact details

---

### Flow 2.7: CEO Global / System-Level

---

#### 2.7.1 CEO Global — 404

**Screen ID:** `ceo-global-404`
**Display Name:** CEO — Page Not Found
**Description:** CEO-context 404 with JARVIS aesthetic. Link back to command center.

- **Entry Points:** Any broken URL within CEO subdomain
- **Exit Points:** `ceo-command-center-main`
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** None

---
---

## APP 3: CLIENT ONBOARDING PORTAL

**App ID:** onboarding-portal
**Prefix:** `ob`
**Platform:** Web (mobile-first, responsive)
**Primary User:** New Client (Marcus — first use, one-time flow)
**URL Base:** onboard.makeitrain.digital/[token]

---

### Flow 3.1: Portal Access

---

#### 3.1.1 Token Validation — Loading

**Screen ID:** `ob-access-token-validating`
**Display Name:** Validating Access Link
**Description:** Brief loading screen while the portal validates the client's unique token from the email link. MIRD logo pulse animation.

- **Entry Points:** Email CTA link click (onboarding invite email)
- **Exit Points:** `ob-welcome-main` (valid token), `ob-access-token-invalid` (invalid/expired)
- **Complexity:** Simple
- **Animation Complexity:** Complex
- **Priority:** P0
- **Data Requirements:** URL token, client record lookup

---

#### 3.1.2 Token Invalid / Expired

**Screen ID:** `ob-access-token-invalid`
**Display Name:** Access Link Expired
**Description:** Error screen when the token is expired (7-day window) or invalid. "ACCESS TOKEN EXPIRED" in JARVIS style. Instructions to contact MIRD for a new link.

- **Entry Points:** `ob-access-token-validating` (invalid token)
- **Exit Points:** External (support email link)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** Token expiry date, support contact

---

#### 3.1.3 Mobile Optimization Suggestion

**Screen ID:** `ob-access-mobile-suggestion`
**Display Name:** Desktop Recommended
**Description:** Soft interstitial on mobile viewport suggesting desktop for the best experience. Not a hard block — user can continue on mobile. One-time dismissable.

- **Entry Points:** `ob-access-token-validating` (valid token, mobile viewport detected)
- **Exit Points:** `ob-welcome-main` (continue anyway or on desktop)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P2
- **Data Requirements:** Viewport size, user-agent

---

### Flow 3.2: Onboarding Wizard — Step 1: System Initialization

---

#### 3.2.1 Welcome / System Initialization — Main

**Screen ID:** `ob-wizard-step1-main`
**Display Name:** Step 1 — System Initialization
**Description:** Welcome screen with personalized client name ("Welcome, Marcus"), 5-step overview checklist, contract details display (client name, package, start date, MRR), required checkbox, name confirmation field, and BEGIN SETUP CTA (disabled until form complete).

- **Entry Points:** `ob-access-token-validating` (valid token, no prior progress), `ob-access-mobile-suggestion` (continue)
- **Exit Points:** `ob-wizard-step2-main` (BEGIN SETUP — all fields valid), `ob-wizard-step1-error` (invalid submission)
- **Complexity:** Medium
- **Animation Complexity:** Complex
- **Priority:** P0
- **Data Requirements:** Client name, package tier, start date, MRR from client record

---

#### 3.2.2 Step 1 — Contract Details Wrong

**Screen ID:** `ob-wizard-step1-wrong-details`
**Display Name:** Step 1 — Contract Details Incorrect
**Description:** State activated when client clicks "Details look wrong? [CONTACT US]". Shows a contact support panel within the step — does not navigate away. Support email + phone displayed.

- **Entry Points:** `ob-wizard-step1-main` (CONTACT US link)
- **Exit Points:** `ob-wizard-step1-main` (dismiss)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** MIRD support contact info

---

#### 3.2.3 Step 1 — Returning / Progress Restored

**Screen ID:** `ob-wizard-step1-progress-restored`
**Display Name:** Step 1 — Progress Restored
**Description:** State shown when a client returns to the portal mid-flow and progress is restored from their saved session. Banner: "PROGRESS RESTORED — YOU LEFT OFF AT STEP [N]." Auto-advances to last-saved step after 2 seconds.

- **Entry Points:** `ob-access-token-validating` (valid token, prior progress exists)
- **Exit Points:** Whichever step was last in progress
- **Complexity:** Simple
- **Animation Complexity:** Medium
- **Priority:** P1
- **Data Requirements:** Onboarding session record, last completed step

---

### Flow 3.3: Onboarding Wizard — Step 2: Business Information

---

#### 3.3.1 Business Information — Main

**Screen ID:** `ob-wizard-step2-main`
**Display Name:** Step 2 — Mission Parameters
**Description:** Form screen: business name, primary markets, target audience, average transaction value, current monthly ad spend, main goal (radio: buyer/seller/both), optional notes textarea. All required fields validated on submit.

- **Entry Points:** `ob-wizard-step1-main` (CTA)
- **Exit Points:** `ob-wizard-step3-main` (continue, valid form), `ob-wizard-step2-validation-error` (form errors), `ob-wizard-step1-main` (back)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** Form field values, validation rules per field

---

#### 3.3.2 Business Information — Validation Error State

**Screen ID:** `ob-wizard-step2-validation-error`
**Display Name:** Step 2 — Form Validation Errors
**Description:** Inline validation error state when required fields are missing or incorrectly filled. Orange error text beneath each offending field. Step does not advance.

- **Entry Points:** `ob-wizard-step2-main` (submit with invalid fields)
- **Exit Points:** `ob-wizard-step2-main` (fields corrected, resubmit)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** Validation error messages per field

---

#### 3.3.3 Business Information — Saving State

**Screen ID:** `ob-wizard-step2-saving`
**Display Name:** Step 2 — Saving Progress
**Description:** Brief transitional state while form data is saved to backend before advancing to Step 3. Scan-line animation on the wizard panel. "SAVING MISSION PARAMETERS…"

- **Entry Points:** `ob-wizard-step2-main` (valid form submitted)
- **Exit Points:** `ob-wizard-step3-main` (save success), `ob-wizard-step2-save-error` (save failure)
- **Complexity:** Simple
- **Animation Complexity:** Medium
- **Priority:** P1
- **Data Requirements:** Form payload, API response

---

#### 3.3.4 Business Information — Save Error

**Screen ID:** `ob-wizard-step2-save-error`
**Display Name:** Step 2 — Save Failed
**Description:** Error state when the server fails to save business info. "SAVE FAILED — DATA NOT TRANSMITTED." Retry CTA. Data not lost — retained in local state.

- **Entry Points:** `ob-wizard-step2-saving` (API error)
- **Exit Points:** `ob-wizard-step2-saving` (retry)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Error code, retained form data

---

### Flow 3.4: Onboarding Wizard — Step 3: Meta Ads Connection

---

#### 3.4.1 Meta Ads Connection — Main

**Screen ID:** `ob-wizard-step3-main`
**Display Name:** Step 3 — Meta Ads Integration
**Description:** Guided 3-sub-step walkthrough: (3A) Open Meta Business Manager link, (3B) Add MIRD as system user, (3C) Paste token and verify. Status indicator starts "NOT VERIFIED."

- **Entry Points:** `ob-wizard-step2-saving` (success), `ob-wizard-step3-main` (returning user)
- **Exit Points:** `ob-wizard-step3-verifying` (VERIFY clicked), `ob-wizard-step3-help` (help section), `ob-wizard-step2-main` (back), `ob-wizard-step3-save-later` (save and return later)
- **Complexity:** Complex
- **Animation Complexity:** Complex
- **Priority:** P0
- **Data Requirements:** Token input, Meta API verification endpoint

---

#### 3.4.2 Meta Ads — Token Verifying

**Screen ID:** `ob-wizard-step3-verifying`
**Display Name:** Step 3 — Verifying Meta Token
**Description:** Transient state while Meta API call validates the token. Scanning animation on the input field. "VERIFYING TOKEN…" with pulsing indicator.

- **Entry Points:** `ob-wizard-step3-main` (VERIFY CTA)
- **Exit Points:** `ob-wizard-step3-connected` (success), `ob-wizard-step3-error` (failure)
- **Complexity:** Simple
- **Animation Complexity:** Complex
- **Priority:** P0
- **Data Requirements:** Token value, Meta API response

---

#### 3.4.3 Meta Ads — Connected Success

**Screen ID:** `ob-wizard-step3-connected`
**Display Name:** Step 3 — Meta Ads Connected
**Description:** Success state after token verification. "META ADS CONNECTED — SYSTEM USER ACTIVE" in green. Progress bar advances. CONTINUE CTA becomes active.

- **Entry Points:** `ob-wizard-step3-verifying` (success response)
- **Exit Points:** `ob-wizard-step4-main` (CONTINUE)
- **Complexity:** Simple
- **Animation Complexity:** Complex
- **Priority:** P0
- **Data Requirements:** Meta account name confirmed, connection record written

---

#### 3.4.4 Meta Ads — Verification Error

**Screen ID:** `ob-wizard-step3-error`
**Display Name:** Step 3 — Meta Token Not Recognized
**Description:** Error state after failed token verification. "[!] TOKEN NOT RECOGNIZED — Check permissions and try again." Token input cleared. Help section auto-expands.

- **Entry Points:** `ob-wizard-step3-verifying` (API rejection / invalid token)
- **Exit Points:** `ob-wizard-step3-main` (retry with new token), `ob-wizard-step3-help` (help section)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** Error code from Meta API

---

#### 3.4.5 Meta Ads — Help / Walkthrough Panel

**Screen ID:** `ob-wizard-step3-help`
**Display Name:** Step 3 — Meta Setup Help
**Description:** Expanded help section within Step 3. Contains: video walkthrough link, step-by-step screenshot guide, common errors FAQ, contact support button.

- **Entry Points:** `ob-wizard-step3-main` (help toggle), `ob-wizard-step3-error` (auto-expand)
- **Exit Points:** `ob-wizard-step3-main` (collapse)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Help content, support contact

---

#### 3.4.6 Meta Ads — Save and Return Later

**Screen ID:** `ob-wizard-step3-save-later`
**Display Name:** Step 3 — Progress Saved
**Description:** Confirmation state when client chooses to save progress and complete Meta setup later. "PROGRESS SAVED — YOUR LINK REMAINS ACTIVE FOR [N] DAYS." Email reminder option.

- **Entry Points:** `ob-wizard-step3-main` (SAVE AND CONTINUE LATER)
- **Exit Points:** External (browser close), `ob-wizard-step3-main` (re-entry via email link)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Session save, expiry date, email reminder option

---

### Flow 3.5: Onboarding Wizard — Step 4: Google Integration

---

#### 3.5.1 Google Integration — Main

**Screen ID:** `ob-wizard-step4-main`
**Display Name:** Step 4 — Google Integration
**Description:** Two-part step: (4A) Google Ads — Customer ID input + manager invite status check; (4B) Google My Business — business search + autocomplete + selection + GMB manager invite status. Each has independent status indicators.

- **Entry Points:** `ob-wizard-step3-connected` (CONTINUE), `ob-wizard-step4-main` (returning user)
- **Exit Points:** `ob-wizard-step4-google-ads-checking` (CHECK STATUS), `ob-wizard-step4-gmb-searching` (GMB SEARCH), `ob-wizard-step3-main` (back), `ob-wizard-step5-main` (continue — Google Ads verified)
- **Complexity:** Complex
- **Animation Complexity:** Medium
- **Priority:** P0
- **Data Requirements:** Google Ads Customer ID, manager invite status (async poll), GMB business search API, GMB business ID

---

#### 3.5.2 Google Ads — Checking Invite Status

**Screen ID:** `ob-wizard-step4-google-ads-checking`
**Display Name:** Step 4 — Checking Google Ads Invitation
**Description:** State while system polls for Google Ads manager invitation acceptance. "STATUS: INVITATION SENT — CHECK AGAIN IN A FEW MINUTES." Not a spinner — async check with manual re-check button.

- **Entry Points:** `ob-wizard-step4-main` (CHECK STATUS)
- **Exit Points:** `ob-wizard-step4-google-ads-connected` (accepted), `ob-wizard-step4-main` (not yet accepted)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Google Ads invitation status (async API poll)

---

#### 3.5.3 Google Ads — Connected

**Screen ID:** `ob-wizard-step4-google-ads-connected`
**Display Name:** Step 4 — Google Ads Connected
**Description:** Success state for Google Ads section. "GOOGLE ADS CONNECTED" in green. GMB section still pending completion.

- **Entry Points:** `ob-wizard-step4-google-ads-checking` (accepted)
- **Exit Points:** `ob-wizard-step4-main` (continue to GMB section)
- **Complexity:** Simple
- **Animation Complexity:** Medium
- **Priority:** P0
- **Data Requirements:** Google Ads connection record

---

#### 3.5.4 Google My Business — Searching

**Screen ID:** `ob-wizard-step4-gmb-searching`
**Display Name:** Step 4 — GMB Business Search
**Description:** State while GMB search API returns autocomplete results. Loading indicator in search input. Results render below as selectable cards.

- **Entry Points:** `ob-wizard-step4-main` (GMB SEARCH submit)
- **Exit Points:** `ob-wizard-step4-gmb-results` (results returned), `ob-wizard-step4-gmb-no-results` (no results)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** GMB Places API search results

---

#### 3.5.5 Google My Business — Search Results

**Screen ID:** `ob-wizard-step4-gmb-results`
**Display Name:** Step 4 — GMB Select Your Business
**Description:** Selectable list of GMB search results. Each result: business name, location, rating, type. SELECT THIS BUSINESS CTA per result.

- **Entry Points:** `ob-wizard-step4-gmb-searching` (results returned)
- **Exit Points:** `ob-wizard-step4-gmb-selected` (selection made), `ob-wizard-step4-main` (search again)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** GMB business list, rating, location, type

---

#### 3.5.6 Google My Business — No Search Results

**Screen ID:** `ob-wizard-step4-gmb-no-results`
**Display Name:** Step 4 — GMB Business Not Found
**Description:** State when GMB search returns no results. Prompts client to try alternate search terms or proceed without GMB.

- **Entry Points:** `ob-wizard-step4-gmb-searching` (empty results)
- **Exit Points:** `ob-wizard-step4-main` (retry search), `ob-wizard-step5-main` (skip GMB — Google Ads only required)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** None (empty result state)

---

#### 3.5.7 Google My Business — Selected

**Screen ID:** `ob-wizard-step4-gmb-selected`
**Display Name:** Step 4 — GMB Business Selected
**Description:** Confirmation state after business selection. Shows the selected business card, instructs client to invite GMB manager email, shows GMB invite status indicator.

- **Entry Points:** `ob-wizard-step4-gmb-results` (SELECT THIS BUSINESS)
- **Exit Points:** `ob-wizard-step4-main` (CHECK STATUS), `ob-wizard-step5-main` (continue when both connected)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Selected GMB business ID, invite status

---

### Flow 3.6: Onboarding Wizard — Step 5: Creative Assets & Launch Preferences

---

#### 3.6.1 Creative Assets & Launch — Main

**Screen ID:** `ob-wizard-step5-main`
**Display Name:** Step 5 — Launch Configuration
**Description:** Three file drop zones (logo, property photos, videos), launch date picker, campaign notes textarea, notification preference radio group (email/SMS/both), SMS number input. COMPLETE SETUP CTA.

- **Entry Points:** `ob-wizard-step4-main` (continue, Google Ads verified)
- **Exit Points:** `ob-wizard-step5-uploading` (file upload in progress), `ob-wizard-step5-validation-error` (missing required fields), `ob-wizard-completion-main` (all uploads done, submit success)
- **Complexity:** Complex
- **Animation Complexity:** Medium
- **Priority:** P0
- **Data Requirements:** File upload (CDN), launch date, notification preference, SMS number

---

#### 3.6.2 Creative Assets — File Uploading

**Screen ID:** `ob-wizard-step5-uploading`
**Display Name:** Step 5 — Uploading Assets
**Description:** Progress state while files upload to CDN. Per-file progress bars in the drop zone. Overall progress indicator. "TRANSMITTING ASSETS…"

- **Entry Points:** `ob-wizard-step5-main` (file drop / selection)
- **Exit Points:** `ob-wizard-step5-main` (upload complete, files in list), `ob-wizard-step5-upload-error` (upload failure)
- **Complexity:** Medium
- **Animation Complexity:** Medium
- **Priority:** P0
- **Data Requirements:** Upload progress per file, CDN response

---

#### 3.6.3 Creative Assets — Upload Error

**Screen ID:** `ob-wizard-step5-upload-error`
**Display Name:** Step 5 — Upload Failed
**Description:** Error state for a failed file upload. Per-file error indicator. "UPLOAD FAILED — FILE TOO LARGE" or "UNSUPPORTED FORMAT." Retry per file.

- **Entry Points:** `ob-wizard-step5-uploading` (CDN error, file too large, unsupported format)
- **Exit Points:** `ob-wizard-step5-main` (retry or remove file)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Error type, file name, size limit

---

#### 3.6.4 Creative Assets — Validation Error

**Screen ID:** `ob-wizard-step5-validation-error`
**Display Name:** Step 5 — Missing Required Fields
**Description:** Inline validation when client tries to complete setup without uploading a logo or selecting a launch date. Orange field error indicators.

- **Entry Points:** `ob-wizard-step5-main` (submit without logo or launch date)
- **Exit Points:** `ob-wizard-step5-main` (fields completed)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P0
- **Data Requirements:** Required field validation state

---

### Flow 3.7: Onboarding Completion

---

#### 3.7.1 Completion — Main

**Screen ID:** `ob-wizard-completion-main`
**Display Name:** RainMachine Initializing
**Description:** Full-screen completion celebration. MIRD logo expands and glows. Progress bar fills 0→100% over 3 seconds. "RAINMACHINE INITIALIZING." Timeline of next steps with real dates. Google Calendar CTA. Support contact.

- **Entry Points:** `ob-wizard-step5-main` (COMPLETE SETUP — all valid, all uploaded)
- **Exit Points:** External (Google Calendar), `ob-wizard-completion-whats-next` (scroll)
- **Complexity:** Complex
- **Animation Complexity:** Complex
- **Priority:** P0
- **Data Requirements:** Launch date, client name, next-step dates calculated from completion timestamp, onboarding webhook trigger

---

#### 3.7.2 Completion — What Happens Next

**Screen ID:** `ob-wizard-completion-whats-next`
**Display Name:** Completion — What Happens Next
**Description:** Scroll section below the completion hero. Timeline of the build period with real dates, campaign launch expectation, first lead timeline, and link to RainMachine dashboard (pre-launch landing state).

- **Entry Points:** `ob-wizard-completion-main` (scroll)
- **Exit Points:** `rm-dashboard-home-empty` (GO TO DASHBOARD link), External (calendar link)
- **Complexity:** Simple
- **Animation Complexity:** Medium
- **Priority:** P1
- **Data Requirements:** Expected campaign launch date, MIRD build SLA dates

---

#### 3.7.3 Completion — Already Completed (Re-Entry)

**Screen ID:** `ob-wizard-completion-already-done`
**Display Name:** Setup Already Complete
**Description:** State shown if a client re-clicks their onboarding link after already completing setup. "SETUP COMPLETE — YOUR RAINMACHINE IS BEING BUILT." Shows current build status and link to dashboard.

- **Entry Points:** `ob-access-token-validating` (token valid, onboarding_complete = true)
- **Exit Points:** `rm-dashboard-home-empty` or `rm-dashboard-home-main` (GO TO DASHBOARD)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Onboarding completion flag, build status, campaign live flag

---

### Flow 3.8: Onboarding — Support & Help

---

#### 3.8.1 Contact Support Modal

**Screen ID:** `ob-support-contact-modal`
**Display Name:** Contact Support
**Description:** Modal available on any wizard step. Shows MIRD support email, phone, and business hours. Option to submit a brief message with current step context auto-attached.

- **Entry Points:** Any wizard step (CONTACT SUPPORT / NEED HELP link), `ob-wizard-step3-help`
- **Exit Points:** Any wizard step (close modal)
- **Complexity:** Medium
- **Animation Complexity:** Simple
- **Priority:** P1
- **Data Requirements:** Support contact info, current step context, message input

---

#### 3.8.2 Help — Video Walkthrough (External Launch)

**Screen ID:** `ob-support-video-walkthrough`
**Display Name:** Video Walkthrough
**Description:** New browser tab or modal lightbox launching a setup help video for the current step (primarily Step 3 Meta setup). Not a full screen — a video embed state.

- **Entry Points:** `ob-wizard-step3-help` (WATCH 2-MINUTE WALKTHROUGH VIDEO)
- **Exit Points:** `ob-wizard-step3-main` (close/return)
- **Complexity:** Simple
- **Animation Complexity:** Simple
- **Priority:** P2
- **Data Requirements:** Video URL per step

---

---

*End of FLOW-TREE.md*
*Total Screens Enumerated: 97*
*Last Updated: 2026-03-29*

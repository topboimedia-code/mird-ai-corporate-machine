# TRACEABILITY-MATRIX.md
# Make It Rain Digital — Screen Traceability Matrix
# Version 1.0 | 2026-03-29

> Maps every screen to its user story, ICP served, department owner, and PRD feature.
> Reference alongside FLOW-TREE.md and SCREEN-INVENTORY.md.

---

## LEGEND

**ICP:**
- Marcus = Marcus Johnson (Realtor Team Leader — RainMachine client)
- Shomari = Shomari Williams (MIRD CEO — internal operator)
- New Client = New signing client (completing onboarding portal)
- Agent = Marcus's individual sales agents

**Department:**
- Dept 1 = Growth & Client Acquisition
- Dept 2 = Ad Operations & AI Delivery
- Dept 3 = Product & Automation
- Dept 4 = Finance & Business Intelligence
- N/A = Infrastructure / cross-cutting

---

## APP 1: RAINMACHINE DASHBOARD

| Screen ID | Display Name | User Story | ICP | Department | PRD Feature |
|-----------|--------------|------------|-----|------------|-------------|
| `rm-auth-login-main` | Login | As Marcus, I need to securely log into my RainMachine dashboard to review my lead pipeline. | Marcus, Agent | N/A | Authentication System — User Login |
| `rm-auth-login-error` | Login Error | As Marcus, I need clear feedback when my login fails so I can correct it and try again. | Marcus, Agent | N/A | Authentication System — Error Handling |
| `rm-auth-forgot-password-main` | Forgot Password | As Marcus, I need to recover access to my account if I forget my password. | Marcus, Agent | N/A | Authentication System — Password Recovery |
| `rm-auth-forgot-password-confirmation` | Reset Email Sent | As Marcus, I need to know my password reset email was sent so I can check my inbox. | Marcus, Agent | N/A | Authentication System — Password Recovery |
| `rm-auth-password-reset-form` | Set New Password | As Marcus, I need to set a new secure password after initiating a reset. | Marcus, Agent | N/A | Authentication System — Password Recovery |
| `rm-auth-password-reset-success` | Password Updated | As Marcus, I need confirmation that my password was changed so I can log in with confidence. | Marcus, Agent | N/A | Authentication System — Password Recovery |
| `rm-auth-session-expired` | Session Expired | As Marcus, I need to be gracefully informed when my session times out rather than hitting a confusing error. | Marcus, Agent | N/A | Authentication System — Session Management |
| `rm-onboard-welcome-splash` | Welcome to RainMachine | As a first-time user, I need an orientation screen that sets expectations for the system before I configure my team. | Marcus | Dept 3 | RainMachine Platform — First-Run Experience |
| `rm-onboard-team-setup-main` | Team Setup — Add Agents | As Marcus, I need to register my agent roster so that leads can be routed to the correct people. | Marcus | Dept 2 | RainMachine Platform — Agent Management |
| `rm-onboard-routing-config` | Lead Routing Setup | As Marcus, I need to configure how leads are distributed across my agents by source and budget. | Marcus | Dept 2 | RainMachine Platform — Lead Routing |
| `rm-onboard-notifications-setup` | Notification Preferences | As Marcus, I need to set up how and when I receive alerts so I stay informed without being overwhelmed. | Marcus | Dept 3 | RainMachine Platform — Notifications |
| `rm-onboard-setup-complete` | Setup Complete — System Online | As Marcus, I need a clear signal that my system is configured and ready so I feel confident it's operational. | Marcus | Dept 3 | RainMachine Platform — First-Run Experience |
| `rm-dashboard-home-main` | RainMachine Dashboard — Home | As Marcus, I need a single command center that shows me my lead volume, pipeline health, agent performance, and campaign efficiency in one 10-minute review. | Marcus | Dept 2 | RainMachine Platform — Command Center Dashboard |
| `rm-dashboard-home-loading` | Dashboard Loading | As Marcus, I need the system to communicate that it's loading data rather than appearing broken during initial load. | Marcus | N/A | RainMachine Platform — Loading States |
| `rm-dashboard-home-empty` | Dashboard — Awaiting First Data | As a new Marcus, I need to understand that the system is active but my campaigns haven't launched yet, so I don't think something is broken. | Marcus | Dept 3 | RainMachine Platform — Empty States |
| `rm-dashboard-home-error` | Dashboard — Signal Lost | As Marcus, I need to know when my data feed is interrupted and how to fix it so I'm not looking at stale numbers. | Marcus | N/A | RainMachine Platform — Error States |
| `rm-leads-main` | Lead Acquisition Intelligence | As Marcus, I need to see all leads in my system with filtering and AI call status so I can monitor pipeline quality at a glance. | Marcus | Dept 2 | RainMachine Platform — Lead Management |
| `rm-leads-detail-panel` | Lead Intelligence Panel | As Marcus, I need to quickly review an individual lead's full journey — source, AI call outcome, timeline — without leaving the leads list. | Marcus | Dept 2 | RainMachine Platform — Lead Detail View |
| `rm-leads-detail-full` | Lead Full Profile | As Marcus, I need a full-page view of a lead's history so I can review all interactions when investigating a specific case. | Marcus | Dept 2 | RainMachine Platform — Lead Detail View |
| `rm-leads-detail-call-history` | Lead Call History | As Marcus, I need to see every AI call attempt and outcome for a lead so I can understand why a lead was or wasn't connected. | Marcus | Dept 2 | Voice AI Agent System — Call Log |
| `rm-leads-detail-appointment` | Lead Appointment Detail | As Marcus, I need to see appointment confirmation status and show/no-show data for a specific lead so I can track follow-through. | Marcus | Dept 2 | Voice AI Agent System — Appointment Management |
| `rm-leads-empty` | Leads — Awaiting Incoming Signals | As a new Marcus whose campaigns haven't launched yet, I need to understand the system is ready and waiting — not that it's empty. | Marcus | Dept 3 | RainMachine Platform — Empty States |
| `rm-leads-filtered-empty` | Leads — No Filter Results | As Marcus, I need to know when my filters produce no results so I can reset them and try again. | Marcus | N/A | RainMachine Platform — Filter UX |
| `rm-leads-reassign-modal` | Reassign Lead Modal | As Marcus, I need to reassign a lead to a different agent when an agent's situation changes. | Marcus | Dept 2 | RainMachine Platform — Lead Routing |
| `rm-agents-main` | Agent Performance Overview | As Marcus, I need a visual summary of every agent's conversion performance so I can identify who needs coaching and who is excelling. | Marcus | Dept 2 | RainMachine Platform — Agent Performance |
| `rm-agents-routing-view` | Lead Routing Diagram | As Marcus, I need to see how leads flow to each agent visually so I understand the routing rules and their effect on distribution. | Marcus | Dept 2 | RainMachine Platform — Lead Routing |
| `rm-agents-detail-main` | Agent Full Profile | As Marcus, I need a deep-dive view of an individual agent's metrics over time so I can have informed performance conversations. | Marcus | Dept 2 | RainMachine Platform — Agent Performance |
| `rm-agents-detail-leads-tab` | Agent — Assigned Leads | As Marcus, I need to see which leads are currently assigned to an agent so I can understand their workload. | Marcus | Dept 2 | RainMachine Platform — Agent Management |
| `rm-agents-empty` | Agents — No Agents Configured | As Marcus, I need guidance on adding agents when none exist yet so the platform doesn't feel incomplete. | Marcus | Dept 3 | RainMachine Platform — Agent Management |
| `rm-campaigns-main` | Campaign Intelligence | As Marcus, I need to review my Meta and Google ad performance — CPL, ROAS, spend — without needing to log into the ad platforms myself. | Marcus | Dept 2 | Rainmaker Leads — Campaign Performance Reporting |
| `rm-campaigns-detail-accordion` | Campaign Detail Row | As Marcus, I need to drill into an individual campaign's 30-day performance trend so I can understand how a specific campaign is tracking. | Marcus | Dept 2 | Rainmaker Leads — Campaign Performance Reporting |
| `rm-campaigns-creative-detail-modal` | Creative Performance Detail | As Marcus, I need to see which ad creative is driving the most leads so I can understand what imagery and copy is resonating. | Marcus | Dept 2 | Rainmaker Leads — Creative Intelligence |
| `rm-campaigns-empty` | Campaigns — No Active Campaigns | As a new Marcus before ad accounts are connected, I need to understand why there's no data and what to do next. | Marcus | Dept 3 | RainMachine Platform — Empty States |
| `rm-campaigns-platform-error` | Campaigns — Platform Signal Lost | As Marcus, I need to know when a specific ad platform's data is unavailable and how to restore the connection. | Marcus | N/A | RainMachine Platform — Error States |
| `rm-reports-main` | Intelligence Archive | As Marcus, I need access to all of my AI-generated weekly reports so I can review historical performance and trends. | Marcus | Dept 2 | Claude AI Reports — Report Archive |
| `rm-reports-report-view` | Weekly Intelligence Brief | As Marcus, I need to read my weekly AI-generated performance narrative so I understand my business status without analyzing raw data. | Marcus | Dept 2 | Claude AI Reports — Weekly Intelligence Brief |
| `rm-reports-chat-active` | AI Report Chat | As Marcus, I need to ask follow-up questions about my performance data in natural language and get instant, contextual answers. | Marcus | Dept 2 | Claude AI Reports — AI Chat Interface |
| `rm-reports-chat-processing` | AI Processing Query | As Marcus, I need visible feedback that my query is being processed so I know the system is working. | Marcus | N/A | Claude AI Reports — AI Chat Interface |
| `rm-reports-chat-error` | AI Response Error | As Marcus, I need to know when an AI query fails so I can retry and get the answer I need. | Marcus | N/A | Claude AI Reports — Error Handling |
| `rm-reports-empty` | Intelligence Reports Initializing | As a new Marcus whose system just launched, I need to understand that reports will start generating after the system has enough data. | Marcus | Dept 3 | Claude AI Reports — Empty States |
| `rm-settings-team-main` | Settings — Team Management | As Marcus, I need to manage my agent roster — adding, editing, and deactivating agents — as my team changes over time. | Marcus | Dept 2 | RainMachine Platform — Team Management |
| `rm-settings-add-agent-modal` | Add New Agent | As Marcus, I need to add a new agent to the system with their contact details so they can receive lead assignments. | Marcus | Dept 2 | RainMachine Platform — Team Management |
| `rm-settings-edit-agent-modal` | Edit Agent | As Marcus, I need to update an agent's details when they change so records remain accurate. | Marcus | Dept 2 | RainMachine Platform — Team Management |
| `rm-settings-routing` | Settings — Lead Routing | As Marcus, I need to configure and update my lead routing rules so leads are always sent to the right agent. | Marcus | Dept 2 | RainMachine Platform — Lead Routing |
| `rm-settings-notifications` | Settings — Notifications | As Marcus, I need to control what notifications I receive and how, so I stay informed without being overwhelmed. | Marcus | Dept 3 | RainMachine Platform — Notifications |
| `rm-settings-integrations` | Settings — Integrations | As Marcus, I need to see the status of my Meta and Google connections and reconnect them if they break. | Marcus | Dept 3 | RainMachine Platform — Integrations |
| `rm-settings-integrations-meta-reconnect` | Reconnect Meta Ads | As Marcus, I need to re-authorize my Meta Ads connection when the token expires or is revoked. | Marcus | Dept 3 | RainMachine Platform — Integrations |
| `rm-settings-integrations-google-reconnect` | Reconnect Google Ads | As Marcus, I need to re-establish my Google Ads connection when access lapses. | Marcus | Dept 3 | RainMachine Platform — Integrations |
| `rm-settings-account` | Settings — Account & Billing | As Marcus, I need to view my billing details, package tier, and invoice history so I can manage the financial side of my account. | Marcus | Dept 4 | RainMachine Platform — Account Management |
| `rm-global-404` | Page Not Found | As any user, I need a clear and branded error page when I navigate to a URL that doesn't exist. | Marcus, Agent | N/A | RainMachine Platform — Error Handling |
| `rm-global-500` | System Fault | As any user, I need to be informed gracefully when the server has an error rather than seeing a raw browser error page. | Marcus, Agent | N/A | RainMachine Platform — Error Handling |
| `rm-global-maintenance` | System Maintenance | As any user, I need to know when the system is down for maintenance and when it will return. | Marcus, Agent | N/A | RainMachine Platform — System Maintenance |

---

## APP 2: CEO DASHBOARD

| Screen ID | Display Name | User Story | ICP | Department | PRD Feature |
|-----------|--------------|------------|-----|------------|-------------|
| `ceo-auth-login-main` | CEO Dashboard Login | As Shomari, I need secure, isolated access to the CEO dashboard to begin my daily review loop. | Shomari | N/A | CEO Dashboard — Authentication |
| `ceo-auth-2fa-prompt` | Two-Factor Authentication | As Shomari, I need 2FA to protect the CEO dashboard from unauthorized access given the sensitive business data it contains. | Shomari | N/A | CEO Dashboard — Authentication |
| `ceo-auth-login-error` | CEO Login Error | As Shomari, I need clear error feedback on failed CEO login attempts. | Shomari | N/A | CEO Dashboard — Authentication |
| `ceo-auth-session-expired` | CEO Session Expired | As Shomari, I need to be gracefully re-authenticated when my CEO session times out. | Shomari | N/A | CEO Dashboard — Session Management |
| `ceo-command-center-main` | MIRD Command Center | As Shomari, I need a single screen that shows me MRR, all active departments' health, all client health scores, and any alerts requiring action — all in under 12 minutes. | Shomari | Dept 1, 2, 3, 4 | CEO Dashboard — The 30-Minute CEO Loop |
| `ceo-command-center-alert-detail` | Alert Investigation | As Shomari, I need to quickly understand the context of an agent-raised alert so I can decide whether to act or dismiss. | Shomari | Dept 2 | CEO Dashboard — Alert Management |
| `ceo-command-center-alert-dismiss-modal` | Dismiss Alert | As Shomari, I need to log a dismissal with a note so there's an audit trail of my review decisions. | Shomari | N/A | CEO Dashboard — Alert Management |
| `ceo-clients-list` | All Clients | As Shomari, I need a sortable view of all clients' health scores so I can quickly identify who is at risk across the entire portfolio. | Shomari | Dept 2 | CEO Dashboard — Client Portfolio View |
| `ceo-clients-detail-overview` | Client Detail — Overview | As Shomari, I need to do a deep dive on a single client's CPL trend, pipeline, and quick stats when an alert fires or during routine review. | Shomari | Dept 2 | CEO Dashboard — Client Deep Dive |
| `ceo-clients-detail-campaigns` | Client Detail — Campaigns | As Shomari, I need to see a client's full campaign performance in CEO context to understand what the Ad Operations agent is managing. | Shomari | Dept 2 | CEO Dashboard — Client Deep Dive |
| `ceo-clients-detail-leads` | Client Detail — Leads | As Shomari, I need to see a client's full lead list when investigating performance anomalies. | Shomari | Dept 2 | CEO Dashboard — Client Deep Dive |
| `ceo-clients-detail-timeline` | Client Detail — Timeline | As Shomari, I need a chronological activity log per client so I can trace what actions (AI or human) led to the current state. | Shomari | Dept 2, 3 | CEO Dashboard — Client Deep Dive |
| `ceo-clients-detail-financials` | Client Detail — Financials | As Shomari, I need to see a client's financial history (MRR, spend, margin) to understand their profitability at the individual level. | Shomari | Dept 4 | CEO Dashboard — Financial Intelligence |
| `ceo-dept-growth-main` | Dept 1 — Growth & Acquisition | As Shomari, I need a full view of MIRD's new business pipeline — calls booked, prospect stages, close rate — to ensure the acquisition machine is running. | Shomari | Dept 1 | CEO Dashboard — Department 1 Operations |
| `ceo-dept-growth-prospect-detail` | Prospect Detail | As Shomari, I need to review an individual prospect record to assess deal progress and determine next actions. | Shomari | Dept 1 | CEO Dashboard — Department 1 Operations |
| `ceo-dept-adops-main` | Dept 2 — Ad Operations | As Shomari, I need a cross-client view of campaign health so I can see the aggregate state of all client campaigns and identify systemic issues. | Shomari | Dept 2 | CEO Dashboard — Department 2 Operations |
| `ceo-dept-product-main` | Dept 3 — Product & Automation | As Shomari, I need to monitor onboarding queue status, automation uptime, and workflow health so the infrastructure layer is always reliable. | Shomari | Dept 3 | CEO Dashboard — Department 3 Operations |
| `ceo-dept-product-onboarding-detail` | Client Onboarding Status | As Shomari, I need to see exactly where a new client is stuck in the onboarding portal so I can intervene before it delays their launch. | Shomari | Dept 3 | Client Onboarding Portal — Admin View |
| `ceo-dept-product-workflow-health` | Workflow Health Monitor | As Shomari, I need to monitor n8n workflow execution health to catch automation failures before they impact clients. | Shomari | Dept 3 | CEO Dashboard — Automation Monitoring |
| `ceo-dept-finance-main` | Dept 4 — Financial Intelligence | As Shomari, I need a complete financial picture — MRR trend, LTV:CAC, P&L per client, 90-day forecast — to make confident growth decisions. | Shomari | Dept 4 | CEO Dashboard — Financial Intelligence |
| `ceo-dept-finance-client-pl-detail` | Client P&L Detail | As Shomari, I need to see 6 months of financial history for an individual client to assess their profitability trajectory. | Shomari | Dept 4 | CEO Dashboard — Financial Intelligence |
| `ceo-agents-log-main` | Autonomous Department Activity Log | As Shomari, I need a complete log of what each of the 4 autonomous department agents did today so I can supervise the machine's work. | Shomari | Dept 1, 2, 3, 4 | CEO Dashboard — Agent Oversight |
| `ceo-agents-log-dept-detail` | Department Agent Full Log | As Shomari, I need to drill into a single department's full execution log when I need to investigate a specific agent action. | Shomari | Dept 1, 2, 3, 4 | CEO Dashboard — Agent Oversight |
| `ceo-agents-log-historical` | Agent Log History | As Shomari, I need to view historical agent logs to investigate past incidents or audit automation behavior. | Shomari | Dept 1, 2, 3, 4 | CEO Dashboard — Agent Oversight |
| `ceo-settings-main` | CEO Settings | As Shomari, I need access to system configuration for alert thresholds, notifications, and account settings. | Shomari | N/A | CEO Dashboard — Settings |
| `ceo-settings-alert-thresholds` | Alert Threshold Configuration | As Shomari, I need to tune the thresholds that trigger alerts so I can calibrate the signal-to-noise ratio of my alert tray. | Shomari | Dept 2, 3 | CEO Dashboard — Alert Management |
| `ceo-settings-notifications` | CEO Notification Preferences | As Shomari, I need to control how I'm notified of critical events (Slack, email, SMS) so alerts reach me regardless of whether I'm at my desk. | Shomari | N/A | CEO Dashboard — Notifications |
| `ceo-global-404` | CEO — Page Not Found | As Shomari, I need a branded 404 within the CEO context that guides me back to the command center. | Shomari | N/A | CEO Dashboard — Error Handling |

---

## APP 3: CLIENT ONBOARDING PORTAL

| Screen ID | Display Name | User Story | ICP | Department | PRD Feature |
|-----------|--------------|------------|-----|------------|-------------|
| `ob-access-token-validating` | Validating Access Link | As a new client, I need the portal to validate my access link quickly so I can begin setup without friction. | New Client | Dept 3 | Client Onboarding Portal — Access Control |
| `ob-access-token-invalid` | Access Link Expired | As a new client with an expired link, I need clear instructions on how to get a new one so I'm not blocked from starting. | New Client | Dept 3 | Client Onboarding Portal — Access Control |
| `ob-access-mobile-suggestion` | Desktop Recommended | As a new client on mobile, I need to know that desktop is recommended so I can make an informed choice about my device. | New Client | Dept 3 | Client Onboarding Portal — Device Optimization |
| `ob-wizard-step1-main` | Step 1 — System Initialization | As a new client, I need to confirm my contract details and formally authorize MIRD to begin building my system so both parties are aligned. | New Client | Dept 3 | Client Onboarding Portal — Step 1: Contract Confirmation |
| `ob-wizard-step1-wrong-details` | Step 1 — Contract Details Wrong | As a new client who sees incorrect contract details, I need a clear path to contact MIRD support without abandoning my progress. | New Client | Dept 3 | Client Onboarding Portal — Step 1: Contract Confirmation |
| `ob-wizard-step1-progress-restored` | Step 1 — Progress Restored | As a returning client, I need to know my previous progress was saved and be taken to where I left off automatically. | New Client | Dept 3 | Client Onboarding Portal — Session Persistence |
| `ob-wizard-step2-main` | Step 2 — Mission Parameters | As a new client, I need to provide my business information and target market data so MIRD can build campaigns configured for my specific situation. | New Client | Dept 2 | Client Onboarding Portal — Step 2: Business Information |
| `ob-wizard-step2-validation-error` | Step 2 — Form Validation Errors | As a new client submitting incomplete form data, I need clear inline error messages so I know exactly what to fix. | New Client | Dept 3 | Client Onboarding Portal — Step 2: Form Validation |
| `ob-wizard-step2-saving` | Step 2 — Saving Progress | As a new client, I need visible confirmation that my business information is being saved before I advance to the next step. | New Client | Dept 3 | Client Onboarding Portal — Step 2: Session Save |
| `ob-wizard-step2-save-error` | Step 2 — Save Failed | As a new client, I need to know if the system failed to save my data and have an easy retry option so I don't lose my work. | New Client | Dept 3 | Client Onboarding Portal — Error Handling |
| `ob-wizard-step3-main` | Step 3 — Meta Ads Integration | As a new client, I need step-by-step guidance to connect my Meta Business Manager so MIRD can run ads in my account. | New Client | Dept 2 | Client Onboarding Portal — Step 3: Meta Ads Connection |
| `ob-wizard-step3-verifying` | Step 3 — Verifying Meta Token | As a new client, I need visible feedback that my Meta token is being verified so I know the system is working. | New Client | Dept 2 | Client Onboarding Portal — Step 3: Token Verification |
| `ob-wizard-step3-connected` | Step 3 — Meta Ads Connected | As a new client, I need a clear success state after Meta verification so I feel confident the connection was established. | New Client | Dept 2 | Client Onboarding Portal — Step 3: Meta Ads Connection |
| `ob-wizard-step3-error` | Step 3 — Meta Token Not Recognized | As a new client whose token failed verification, I need a clear error message and help resources so I can troubleshoot and retry. | New Client | Dept 3 | Client Onboarding Portal — Step 3: Error Handling |
| `ob-wizard-step3-help` | Step 3 — Meta Setup Help | As a new client struggling with Meta setup, I need access to a video walkthrough and support options so I can complete this step without calling MIRD. | New Client | Dept 3 | Client Onboarding Portal — Step 3: Help & Support |
| `ob-wizard-step3-save-later` | Step 3 — Progress Saved | As a new client who needs to pause mid-setup, I need confirmation that my progress is saved and instructions for returning later. | New Client | Dept 3 | Client Onboarding Portal — Session Persistence |
| `ob-wizard-step4-main` | Step 4 — Google Integration | As a new client, I need guided instructions for connecting my Google Ads account and finding my Google Business Profile so MIRD can manage search campaigns. | New Client | Dept 2 | Client Onboarding Portal — Step 4: Google Integration |
| `ob-wizard-step4-google-ads-checking` | Step 4 — Checking Google Invite | As a new client who has sent the Google Ads manager invite, I need an async status check so I'm not stuck waiting for an instant confirmation. | New Client | Dept 2 | Client Onboarding Portal — Step 4: Google Ads Connection |
| `ob-wizard-step4-google-ads-connected` | Step 4 — Google Ads Connected | As a new client, I need a clear success state after Google Ads acceptance so I can confidently proceed to the GMB section. | New Client | Dept 2 | Client Onboarding Portal — Step 4: Google Ads Connection |
| `ob-wizard-step4-gmb-searching` | Step 4 — GMB Business Search | As a new client, I need a real-time search to find my Google Business Profile so MIRD can access my reviews and local SEO data. | New Client | Dept 2 | Client Onboarding Portal — Step 4: GMB Connection |
| `ob-wizard-step4-gmb-results` | Step 4 — GMB Select Business | As a new client, I need to select my specific business from search results so MIRD connects to the correct profile. | New Client | Dept 2 | Client Onboarding Portal — Step 4: GMB Connection |
| `ob-wizard-step4-gmb-no-results` | Step 4 — GMB Business Not Found | As a new client whose business doesn't appear in GMB search, I need alternative options so I'm not blocked from completing setup. | New Client | Dept 3 | Client Onboarding Portal — Step 4: Error Handling |
| `ob-wizard-step4-gmb-selected` | Step 4 — GMB Business Selected | As a new client, I need confirmation that my GMB profile was selected and instructions for the final invite step. | New Client | Dept 2 | Client Onboarding Portal — Step 4: GMB Connection |
| `ob-wizard-step5-main` | Step 5 — Launch Configuration | As a new client, I need to upload my creative assets, set my launch date, and configure my notification preferences so MIRD has everything needed to build my campaigns. | New Client | Dept 2 | Client Onboarding Portal — Step 5: Asset Upload & Launch Prefs |
| `ob-wizard-step5-uploading` | Step 5 — Uploading Assets | As a new client uploading files, I need visible upload progress so I know my assets are being transmitted successfully. | New Client | Dept 3 | Client Onboarding Portal — Step 5: File Upload |
| `ob-wizard-step5-upload-error` | Step 5 — Upload Failed | As a new client whose file upload fails, I need a clear error with the reason (too large, wrong format) and a retry option. | New Client | Dept 3 | Client Onboarding Portal — Step 5: Error Handling |
| `ob-wizard-step5-validation-error` | Step 5 — Missing Required Fields | As a new client trying to submit without all required assets, I need to be told exactly what's missing before completing setup. | New Client | Dept 3 | Client Onboarding Portal — Step 5: Form Validation |
| `ob-wizard-completion-main` | RainMachine Initializing | As a new client who has completed all 5 steps, I need a celebratory completion moment that confirms the system is being built and tells me exactly what happens next. | New Client | Dept 3 | Client Onboarding Portal — Completion Celebration |
| `ob-wizard-completion-whats-next` | Completion — What Happens Next | As a new client, I need a clear timeline of the build and launch period with real dates so I have certainty about when my campaigns will go live. | New Client | Dept 3 | Client Onboarding Portal — Post-Completion Handoff |
| `ob-wizard-completion-already-done` | Setup Already Complete | As a client who has already completed setup and revisits their onboarding link, I need confirmation and a direct link to my dashboard. | New Client | Dept 3 | Client Onboarding Portal — Re-Entry Handling |
| `ob-support-contact-modal` | Contact Support | As a new client encountering any difficulty during setup, I need immediate access to MIRD support contact details without losing my place in the wizard. | New Client | Dept 3 | Client Onboarding Portal — Support Access |
| `ob-support-video-walkthrough` | Video Walkthrough | As a new client struggling with Meta setup, I need a video demonstration so I can follow along visually rather than reading instructions. | New Client | Dept 3 | Client Onboarding Portal — Step 3: Help & Support |

---

## CROSS-CUTTING TRACEABILITY SUMMARY

| PRD Feature | Screen Count | Primary ICP | Primary Department |
|-------------|-------------|-------------|-------------------|
| Authentication System | 11 screens | Marcus, Shomari, New Client | N/A |
| RainMachine Platform — Dashboard | 4 screens | Marcus | Dept 2 |
| RainMachine Platform — Leads | 8 screens | Marcus | Dept 2 |
| RainMachine Platform — Agents | 5 screens | Marcus | Dept 2 |
| Rainmaker Leads — Campaign Intelligence | 5 screens | Marcus | Dept 2 |
| Claude AI Reports | 6 screens | Marcus | Dept 2 |
| RainMachine Platform — Settings | 9 screens | Marcus | Dept 2, 3 |
| CEO Dashboard — The 30-Minute CEO Loop | 1 screen | Shomari | All Depts |
| CEO Dashboard — Alert Management | 3 screens | Shomari | Dept 2 |
| CEO Dashboard — Client Portfolio | 6 screens | Shomari | Dept 2 |
| CEO Dashboard — Department Operations | 8 screens | Shomari | Dept 1, 2, 3, 4 |
| CEO Dashboard — Agent Oversight | 3 screens | Shomari | All Depts |
| CEO Dashboard — Financial Intelligence | 2 screens | Shomari | Dept 4 |
| Client Onboarding Portal | 29 screens | New Client | Dept 3 |
| Global / Error Handling | 7 screens | All | N/A |

---

*Total screens traced: 112*
*Generated: 2026-03-29 | Make It Rain Digital*

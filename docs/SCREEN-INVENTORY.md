# SCREEN-INVENTORY.md
# Make It Rain Digital — Complete Screen Inventory
# Version 1.0 | 2026-03-29

> Flat master list of every screen across all 3 MIRD applications.
> Reference alongside FLOW-TREE.md for full context.

---

| # | Screen ID | Display Name | App | Flow | Priority | Complexity | Animation | Description |
|---|-----------|--------------|-----|------|----------|------------|-----------|-------------|
| 1 | `rm-auth-login-main` | Login | RainMachine | Auth | P0 | Medium | Medium | Primary login screen for Marcus and agents |
| 2 | `rm-auth-login-error` | Login Error | RainMachine | Auth | P0 | Simple | Simple | Inline error state after failed auth attempt |
| 3 | `rm-auth-forgot-password-main` | Forgot Password | RainMachine | Auth | P0 | Simple | Simple | Email input to initiate password reset |
| 4 | `rm-auth-forgot-password-confirmation` | Reset Email Sent | RainMachine | Auth | P0 | Simple | Simple | Confirmation after reset email dispatched |
| 5 | `rm-auth-password-reset-form` | Set New Password | RainMachine | Auth | P0 | Medium | Simple | New password entry form via reset token link |
| 6 | `rm-auth-password-reset-success` | Password Updated | RainMachine | Auth | P0 | Simple | Simple | Success confirmation after password reset |
| 7 | `rm-auth-session-expired` | Session Expired | RainMachine | Auth | P0 | Simple | Medium | Full-screen session expiry interstitial |
| 8 | `rm-onboard-welcome-splash` | Welcome to RainMachine | RainMachine | First-Time Setup | P1 | Simple | Complex | First-login welcome screen before data population |
| 9 | `rm-onboard-team-setup-main` | Team Setup — Add Agents | RainMachine | First-Time Setup | P1 | Medium | Simple | Guided agent roster entry for Marcus |
| 10 | `rm-onboard-routing-config` | Lead Routing Setup | RainMachine | First-Time Setup | P1 | Medium | Simple | First-time routing rule configuration |
| 11 | `rm-onboard-notifications-setup` | Notification Preferences | RainMachine | First-Time Setup | P1 | Simple | Simple | First-time notification prefs (email/SMS) |
| 12 | `rm-onboard-setup-complete` | Setup Complete — System Online | RainMachine | First-Time Setup | P1 | Simple | Complex | Completion animation before first dashboard |
| 13 | `rm-dashboard-home-main` | RainMachine Dashboard — Home | RainMachine | Main Dashboard | P0 | Complex | Complex | 4-quadrant command center with Claude AI panel |
| 14 | `rm-dashboard-home-loading` | Dashboard Loading | RainMachine | Main Dashboard | P0 | Simple | Complex | Skeleton shimmer + boot sequence animation |
| 15 | `rm-dashboard-home-empty` | Dashboard — Awaiting First Data | RainMachine | Main Dashboard | P1 | Simple | Complex | Pre-launch empty state with pulsing MIRD logo |
| 16 | `rm-dashboard-home-error` | Dashboard — Signal Lost | RainMachine | Main Dashboard | P0 | Medium | Simple | Partial/full data fetch failure state |
| 17 | `rm-leads-main` | Lead Acquisition Intelligence | RainMachine | Leads | P0 | Complex | Medium | Full lead list with filters, table/card toggle |
| 18 | `rm-leads-detail-panel` | Lead Intelligence Panel | RainMachine | Leads | P0 | Complex | Medium | 400px slide-in panel: timeline, AI summary, agent |
| 19 | `rm-leads-detail-full` | Lead Full Profile | RainMachine | Leads | P1 | Complex | Simple | Full-page expanded lead view |
| 20 | `rm-leads-detail-call-history` | Lead Call History | RainMachine | Leads | P1 | Medium | Simple | All AI call attempts, outcomes, transcripts |
| 21 | `rm-leads-detail-appointment` | Lead Appointment Detail | RainMachine | Leads | P1 | Medium | Simple | Appointment details, show/no-show, reminders |
| 22 | `rm-leads-empty` | Leads — Awaiting Incoming Signals | RainMachine | Leads | P1 | Simple | Medium | Zero leads empty state |
| 23 | `rm-leads-filtered-empty` | Leads — No Filter Results | RainMachine | Leads | P2 | Simple | Simple | No results for active filter combination |
| 24 | `rm-leads-reassign-modal` | Reassign Lead Modal | RainMachine | Leads | P2 | Medium | Simple | Modal to reassign lead to different agent |
| 25 | `rm-agents-main` | Agent Performance Overview | RainMachine | Agents | P0 | Complex | Medium | Summary + 2-col agent panel grid |
| 26 | `rm-agents-routing-view` | Lead Routing Diagram | RainMachine | Agents | P1 | Complex | Medium | Visual flow diagram of routing rules |
| 27 | `rm-agents-detail-main` | Agent Full Profile | RainMachine | Agents | P1 | Complex | Medium | Full per-agent performance + lead history page |
| 28 | `rm-agents-detail-leads-tab` | Agent — Assigned Leads | RainMachine | Agents | P1 | Medium | Simple | Leads assigned to this agent (tab view) |
| 29 | `rm-agents-empty` | Agents — No Agents Configured | RainMachine | Agents | P1 | Simple | Simple | Zero agents empty state |
| 30 | `rm-campaigns-main` | Campaign Intelligence | RainMachine | Campaigns | P0 | Complex | Medium | Platform switcher, perf overview, table, creatives |
| 31 | `rm-campaigns-detail-accordion` | Campaign Detail Row | RainMachine | Campaigns | P1 | Complex | Medium | Inline accordion: 30-day charts, ad set breakdown |
| 32 | `rm-campaigns-creative-detail-modal` | Creative Performance Detail | RainMachine | Campaigns | P2 | Medium | Simple | Full creative metrics in overlay modal |
| 33 | `rm-campaigns-empty` | Campaigns — No Active Campaigns | RainMachine | Campaigns | P1 | Simple | Medium | Pre-connection empty state |
| 34 | `rm-campaigns-platform-error` | Campaigns — Platform Signal Lost | RainMachine | Campaigns | P0 | Medium | Simple | API failure error for Meta or Google data |
| 35 | `rm-reports-main` | Intelligence Archive | RainMachine | AI Reports | P0 | Complex | Simple | 60/40 split: report history + active report/chat |
| 36 | `rm-reports-report-view` | Weekly Intelligence Brief | RainMachine | AI Reports | P0 | Complex | Simple | Full Claude report prose + follow-up chat |
| 37 | `rm-reports-chat-active` | AI Report Chat | RainMachine | AI Reports | P0 | Complex | Medium | Chat history + user query + AI response rendered |
| 38 | `rm-reports-chat-processing` | AI Processing Query | RainMachine | AI Reports | P0 | Simple | Medium | "PROCESSING QUERY…" pulsing dot state |
| 39 | `rm-reports-chat-error` | AI Response Error | RainMachine | AI Reports | P1 | Simple | Simple | "QUERY FAILED" with retry option |
| 40 | `rm-reports-empty` | Intelligence Reports Initializing | RainMachine | AI Reports | P1 | Simple | Medium | Pre-7-day empty state for new clients |
| 41 | `rm-settings-team-main` | Settings — Team Management | RainMachine | Settings | P1 | Medium | Simple | Agent roster table with add/edit actions |
| 42 | `rm-settings-add-agent-modal` | Add New Agent | RainMachine | Settings | P1 | Medium | Simple | Modal form for adding a new agent |
| 43 | `rm-settings-edit-agent-modal` | Edit Agent | RainMachine | Settings | P2 | Medium | Simple | Modal form for editing existing agent |
| 44 | `rm-settings-routing` | Settings — Lead Routing | RainMachine | Settings | P1 | Complex | Simple | Visual rule builder for routing configuration |
| 45 | `rm-settings-notifications` | Settings — Notifications | RainMachine | Settings | P1 | Medium | Simple | Notification toggle rows per type |
| 46 | `rm-settings-integrations` | Settings — Integrations | RainMachine | Settings | P0 | Medium | Simple | Platform connection status cards |
| 47 | `rm-settings-integrations-meta-reconnect` | Reconnect Meta Ads | RainMachine | Settings | P1 | Medium | Medium | Guided Meta token re-verification in settings |
| 48 | `rm-settings-integrations-google-reconnect` | Reconnect Google Ads | RainMachine | Settings | P1 | Medium | Medium | Guided Google Ads re-connect in settings |
| 49 | `rm-settings-account` | Settings — Account & Billing | RainMachine | Settings | P2 | Medium | Simple | Package details, invoices, billing support |
| 50 | `rm-global-404` | Page Not Found | RainMachine | Global | P1 | Simple | Simple | JARVIS-style 404 with dashboard link |
| 51 | `rm-global-500` | System Fault | RainMachine | Global | P1 | Simple | Medium | Server error with auto-retry countdown |
| 52 | `rm-global-maintenance` | System Maintenance | RainMachine | Global | P2 | Simple | Simple | Planned downtime notice with return ETA |
| | | | | | | | | |
| 53 | `ceo-auth-login-main` | CEO Dashboard Login | CEO Dashboard | Auth | P0 | Medium | Medium | Isolated login for Shomari, may include 2FA |
| 54 | `ceo-auth-2fa-prompt` | Two-Factor Authentication | CEO Dashboard | Auth | P0 | Medium | Simple | 6-digit 2FA code entry |
| 55 | `ceo-auth-login-error` | CEO Login Error | CEO Dashboard | Auth | P0 | Simple | Simple | Failed auth with lockout counter |
| 56 | `ceo-auth-session-expired` | CEO Session Expired | CEO Dashboard | Auth | P0 | Simple | Medium | Session expiry redirect to CEO login |
| 57 | `ceo-command-center-main` | MIRD Command Center | CEO Dashboard | Command Center | P0 | Complex | Complex | North Star bar + alerts + dept grid + client grid |
| 58 | `ceo-command-center-alert-detail` | Alert Investigation | CEO Dashboard | Command Center | P0 | Medium | Simple | Alert detail context with investigate CTA |
| 59 | `ceo-command-center-alert-dismiss-modal` | Dismiss Alert | CEO Dashboard | Command Center | P1 | Simple | Simple | Confirm alert dismiss with required note |
| 60 | `ceo-clients-list` | All Clients | CEO Dashboard | Command Center | P1 | Complex | Simple | Full expanded client health grid, sortable |
| 61 | `ceo-clients-detail-overview` | Client Detail — Overview | CEO Dashboard | Client Detail | P0 | Complex | Medium | Per-client: CPL trend, pipeline funnel, notes |
| 62 | `ceo-clients-detail-campaigns` | Client Detail — Campaigns | CEO Dashboard | Client Detail | P1 | Complex | Simple | Client campaign data, CEO read-only view |
| 63 | `ceo-clients-detail-leads` | Client Detail — Leads | CEO Dashboard | Client Detail | P1 | Medium | Simple | Client lead list, CEO context |
| 64 | `ceo-clients-detail-timeline` | Client Detail — Timeline | CEO Dashboard | Client Detail | P1 | Medium | Simple | Chronological client activity log |
| 65 | `ceo-clients-detail-financials` | Client Detail — Financials | CEO Dashboard | Client Detail | P1 | Medium | Simple | Invoices, contract, MRR, margin data |
| 66 | `ceo-dept-growth-main` | Dept 1 — Growth & Acquisition | CEO Dashboard | Dept Drill-Down | P1 | Complex | Medium | Calls booked, DBR pipeline, outbound, close rate |
| 67 | `ceo-dept-growth-prospect-detail` | Prospect Detail | CEO Dashboard | Dept Drill-Down | P2 | Medium | Simple | Individual DBR prospect record |
| 68 | `ceo-dept-adops-main` | Dept 2 — Ad Operations | CEO Dashboard | Dept Drill-Down | P1 | Complex | Medium | Cross-client campaign health, AI call metrics |
| 69 | `ceo-dept-product-main` | Dept 3 — Product & Automation | CEO Dashboard | Dept Drill-Down | P1 | Complex | Medium | Onboarding queue, n8n uptime, workflow health |
| 70 | `ceo-dept-product-onboarding-detail` | Client Onboarding Status | CEO Dashboard | Dept Drill-Down | P1 | Medium | Simple | Per-client onboarding step tracker |
| 71 | `ceo-dept-product-workflow-health` | Workflow Health Monitor | CEO Dashboard | Dept Drill-Down | P2 | Complex | Simple | n8n workflow run status board |
| 72 | `ceo-dept-finance-main` | Dept 4 — Financial Intelligence | CEO Dashboard | Dept Drill-Down | P1 | Complex | Medium | MRR chart, P&L table, 90-day forecast |
| 73 | `ceo-dept-finance-client-pl-detail` | Client P&L Detail | CEO Dashboard | Dept Drill-Down | P2 | Medium | Simple | Inline 6-month financial history per client |
| 74 | `ceo-agents-log-main` | Autonomous Department Activity Log | CEO Dashboard | Agent Log | P1 | Complex | Simple | All 4 agent daily logs, expandable by dept |
| 75 | `ceo-agents-log-dept-detail` | Department Agent Full Log | CEO Dashboard | Agent Log | P2 | Medium | Simple | Full expanded single-dept agent log |
| 76 | `ceo-agents-log-historical` | Agent Log History | CEO Dashboard | Agent Log | P2 | Medium | Simple | Date-picker historical log view |
| 77 | `ceo-settings-main` | CEO Settings | CEO Dashboard | Settings | P2 | Medium | Simple | Settings hub: thresholds, notifications, account |
| 78 | `ceo-settings-alert-thresholds` | Alert Threshold Configuration | CEO Dashboard | Settings | P2 | Medium | Simple | Numeric threshold config per alert type |
| 79 | `ceo-settings-notifications` | CEO Notification Preferences | CEO Dashboard | Settings | P2 | Medium | Simple | Alert delivery method and timing config |
| 80 | `ceo-global-404` | CEO — Page Not Found | CEO Dashboard | Global | P1 | Simple | Simple | CEO-context 404 page |
| | | | | | | | | |
| 81 | `ob-access-token-validating` | Validating Access Link | Onboarding Portal | Portal Access | P0 | Simple | Complex | Token validation loading screen |
| 82 | `ob-access-token-invalid` | Access Link Expired | Onboarding Portal | Portal Access | P0 | Simple | Simple | Expired/invalid token error with support link |
| 83 | `ob-access-mobile-suggestion` | Desktop Recommended | Onboarding Portal | Portal Access | P2 | Simple | Simple | Soft mobile-to-desktop suggestion interstitial |
| 84 | `ob-wizard-step1-main` | Step 1 — System Initialization | Onboarding Portal | Wizard Step 1 | P0 | Medium | Complex | Welcome + contract confirmation + BEGIN SETUP |
| 85 | `ob-wizard-step1-wrong-details` | Step 1 — Contract Details Wrong | Onboarding Portal | Wizard Step 1 | P1 | Simple | Simple | Contact support panel for incorrect contract info |
| 86 | `ob-wizard-step1-progress-restored` | Step 1 — Progress Restored | Onboarding Portal | Wizard Step 1 | P1 | Simple | Medium | Returning user progress restoration banner |
| 87 | `ob-wizard-step2-main` | Step 2 — Mission Parameters | Onboarding Portal | Wizard Step 2 | P0 | Medium | Simple | Business info form (6 fields + textarea) |
| 88 | `ob-wizard-step2-validation-error` | Step 2 — Form Validation Errors | Onboarding Portal | Wizard Step 2 | P0 | Simple | Simple | Inline field validation errors |
| 89 | `ob-wizard-step2-saving` | Step 2 — Saving Progress | Onboarding Portal | Wizard Step 2 | P1 | Simple | Medium | Transitional save state with scan-line animation |
| 90 | `ob-wizard-step2-save-error` | Step 2 — Save Failed | Onboarding Portal | Wizard Step 2 | P1 | Simple | Simple | Server save failure with retry |
| 91 | `ob-wizard-step3-main` | Step 3 — Meta Ads Integration | Onboarding Portal | Wizard Step 3 | P0 | Complex | Complex | 3-sub-step guided Meta token setup |
| 92 | `ob-wizard-step3-verifying` | Step 3 — Verifying Meta Token | Onboarding Portal | Wizard Step 3 | P0 | Simple | Complex | Token scanning animation + API call |
| 93 | `ob-wizard-step3-connected` | Step 3 — Meta Ads Connected | Onboarding Portal | Wizard Step 3 | P0 | Simple | Complex | Green success state, progress bar advances |
| 94 | `ob-wizard-step3-error` | Step 3 — Meta Token Not Recognized | Onboarding Portal | Wizard Step 3 | P0 | Medium | Simple | API rejection error with help auto-expand |
| 95 | `ob-wizard-step3-help` | Step 3 — Meta Setup Help | Onboarding Portal | Wizard Step 3 | P1 | Simple | Simple | Expanded help section with video + FAQ |
| 96 | `ob-wizard-step3-save-later` | Step 3 — Progress Saved | Onboarding Portal | Wizard Step 3 | P1 | Simple | Simple | Save-and-return-later confirmation |
| 97 | `ob-wizard-step4-main` | Step 4 — Google Integration | Onboarding Portal | Wizard Step 4 | P0 | Complex | Medium | Google Ads Customer ID + GMB search, dual status |
| 98 | `ob-wizard-step4-google-ads-checking` | Step 4 — Checking Google Invite | Onboarding Portal | Wizard Step 4 | P1 | Simple | Simple | Async invite acceptance check state |
| 99 | `ob-wizard-step4-google-ads-connected` | Step 4 — Google Ads Connected | Onboarding Portal | Wizard Step 4 | P0 | Simple | Medium | Google Ads connection success state |
| 100 | `ob-wizard-step4-gmb-searching` | Step 4 — GMB Business Search | Onboarding Portal | Wizard Step 4 | P1 | Simple | Simple | Loading state for GMB Places API search |
| 101 | `ob-wizard-step4-gmb-results` | Step 4 — GMB Select Business | Onboarding Portal | Wizard Step 4 | P1 | Simple | Simple | Selectable GMB search result list |
| 102 | `ob-wizard-step4-gmb-no-results` | Step 4 — GMB Not Found | Onboarding Portal | Wizard Step 4 | P1 | Simple | Simple | Empty GMB search result with retry/skip |
| 103 | `ob-wizard-step4-gmb-selected` | Step 4 — GMB Business Selected | Onboarding Portal | Wizard Step 4 | P1 | Medium | Simple | Selected business card + invite instruction |
| 104 | `ob-wizard-step5-main` | Step 5 — Launch Configuration | Onboarding Portal | Wizard Step 5 | P0 | Complex | Medium | File uploads + launch date + notification prefs |
| 105 | `ob-wizard-step5-uploading` | Step 5 — Uploading Assets | Onboarding Portal | Wizard Step 5 | P0 | Medium | Medium | Per-file progress bars, CDN upload state |
| 106 | `ob-wizard-step5-upload-error` | Step 5 — Upload Failed | Onboarding Portal | Wizard Step 5 | P1 | Simple | Simple | File-level error (too large, wrong format) |
| 107 | `ob-wizard-step5-validation-error` | Step 5 — Missing Required Fields | Onboarding Portal | Wizard Step 5 | P0 | Simple | Simple | Required field errors on final step |
| 108 | `ob-wizard-completion-main` | RainMachine Initializing | Onboarding Portal | Completion | P0 | Complex | Complex | Full-screen completion: logo glow + progress bar |
| 109 | `ob-wizard-completion-whats-next` | Completion — What Happens Next | Onboarding Portal | Completion | P1 | Simple | Medium | Animated next-steps timeline with real dates |
| 110 | `ob-wizard-completion-already-done` | Setup Already Complete | Onboarding Portal | Completion | P1 | Simple | Simple | Re-entry state for already-completed onboarding |
| 111 | `ob-support-contact-modal` | Contact Support | Onboarding Portal | Support | P1 | Medium | Simple | Support contact modal available on all wizard steps |
| 112 | `ob-support-video-walkthrough` | Video Walkthrough | Onboarding Portal | Support | P2 | Simple | Simple | Help video embed state for Meta setup |

---

## TOTALS

| App | Screen Count |
|-----|-------------|
| RainMachine Dashboard (`rm`) | 52 |
| CEO Dashboard (`ceo`) | 28 |
| Onboarding Portal (`ob`) | 32 |
| **TOTAL** | **112** |

---

## PRIORITY BREAKDOWN

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | 36 | Launch blockers — must exist at v1.0 release |
| P1 | 55 | Core functionality — required for full feature completeness |
| P2 | 21 | Important enhancements — polish and edge cases |
| P3 | 0 | None at this stage |
| **Total** | **112** | |

---

## COMPLEXITY BREAKDOWN

| Complexity | Count |
|------------|-------|
| Simple | 46 |
| Medium | 41 |
| Complex | 25 |

---

*Generated: 2026-03-29 | Make It Rain Digital*

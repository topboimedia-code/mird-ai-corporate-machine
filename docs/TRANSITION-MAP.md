# TRANSITION-MAP.md
# Make It Rain Digital — Screen Transition Map
# Version 1.0 | 2026-03-29

> Documents every user movement between screens. Covers happy paths, error paths, and edge cases.
> Transition types: **push** (forward navigate), **back** (reverse navigate), **replace** (replaces history), **modal** (overlay, no history change), **redirect** (programmatic), **external** (leaves app)

---

## APP 1: RAINMACHINE DASHBOARD TRANSITIONS

---

### Flow 1.1: Authentication Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| Direct URL / bookmark | Page load, no session | `rm-auth-login-main` | replace | Always replace — no back to unauthenticated state |
| `rm-auth-login-main` | Submit valid credentials | `rm-dashboard-home-main` | replace | Replaces login in history; back button should not return to login |
| `rm-auth-login-main` | Submit valid credentials (first ever login) | `rm-onboard-welcome-splash` | replace | onboarding_complete = false check on auth |
| `rm-auth-login-main` | Submit valid credentials (2FA required) | N/A — CEO only | N/A | RainMachine does not use 2FA |
| `rm-auth-login-main` | Invalid credentials | `rm-auth-login-error` | replace | Same page, error state replaces default |
| `rm-auth-login-main` | Click "Forgot Password?" | `rm-auth-forgot-password-main` | push | Standard forward navigation |
| `rm-auth-login-error` | Click "Forgot Password?" | `rm-auth-forgot-password-main` | push | From error state, same path |
| `rm-auth-login-error` | Clear error + retry | `rm-auth-login-main` | replace | Error cleared on interaction |
| `rm-auth-forgot-password-main` | Submit valid email | `rm-auth-forgot-password-confirmation` | push | Email dispatched |
| `rm-auth-forgot-password-main` | Click "Back to Login" | `rm-auth-login-main` | back | |
| `rm-auth-forgot-password-confirmation` | Click "Back to Login" | `rm-auth-login-main` | push | |
| `rm-auth-forgot-password-confirmation` | Resend email | `rm-auth-forgot-password-confirmation` | replace | Same screen, resend triggered |
| Email reset link | Click link in email | `rm-auth-password-reset-form` | replace | Token in URL, replaces current history |
| Email reset link | Click expired link | `rm-auth-login-main` | redirect | Token invalid, redirect to login with "link expired" toast |
| `rm-auth-password-reset-form` | Submit new password (valid) | `rm-auth-password-reset-success` | push | |
| `rm-auth-password-reset-form` | Submit mismatched password | `rm-auth-password-reset-form` | replace | Inline error, no navigation |
| `rm-auth-password-reset-success` | Auto-redirect (3s) | `rm-auth-login-main` | replace | Countdown visible |
| `rm-auth-password-reset-success` | Click "Back to Login" | `rm-auth-login-main` | replace | Manual option |
| Any authenticated screen | Session token expires | `rm-auth-session-expired` | redirect | Overlay or full replace; 3s then login |
| `rm-auth-session-expired` | Auto-redirect (3s) | `rm-auth-login-main` | replace | |
| Any screen | User clicks Logout | `rm-auth-login-main` | replace | Session cleared, history replaced |

---

### Flow 1.2: First-Time Setup Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| `rm-auth-login-main` | First login (onboarding_complete = false) | `rm-onboard-welcome-splash` | replace | |
| `rm-onboard-welcome-splash` | Click "BEGIN SETUP" | `rm-onboard-team-setup-main` | push | |
| `rm-onboard-welcome-splash` | Click "Skip for now" | `rm-dashboard-home-main` | replace | onboarding flagged as deferred |
| `rm-onboard-team-setup-main` | Save agents, click "Next" | `rm-onboard-routing-config` | push | |
| `rm-onboard-team-setup-main` | Click "Skip" | `rm-dashboard-home-main` | replace | |
| `rm-onboard-routing-config` | Save rules, click "Next" | `rm-onboard-notifications-setup` | push | |
| `rm-onboard-routing-config` | Click "Back" | `rm-onboard-team-setup-main` | back | |
| `rm-onboard-routing-config` | Click "Skip" | `rm-dashboard-home-main` | replace | |
| `rm-onboard-notifications-setup` | Click "Finish" | `rm-onboard-setup-complete` | push | |
| `rm-onboard-notifications-setup` | Click "Back" | `rm-onboard-routing-config` | back | |
| `rm-onboard-setup-complete` | Auto-transition (2s) or click CTA | `rm-dashboard-home-main` | replace | |

---

### Flow 1.3: Main Dashboard Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| `rm-dashboard-home-main` | Page load (data fetching) | `rm-dashboard-home-loading` | replace | Loading is a state, same URL |
| `rm-dashboard-home-loading` | Data resolves successfully | `rm-dashboard-home-main` | replace | Skeleton → live data |
| `rm-dashboard-home-loading` | Data fetch fails (all panels) | `rm-dashboard-home-error` | replace | |
| `rm-dashboard-home-loading` | Campaigns not live yet | `rm-dashboard-home-empty` | replace | |
| `rm-dashboard-home-error` | Click "[↻ RECONNECT]" | `rm-settings-integrations` | push | |
| `rm-dashboard-home-error` | Retry resolves | `rm-dashboard-home-main` | replace | |
| `rm-dashboard-home-empty` | First data arrives (live) | `rm-dashboard-home-main` | replace | Polled check |
| `rm-dashboard-home-empty` | Click "CONNECT AD ACCOUNT" | `rm-settings-integrations` | push | |
| `rm-dashboard-home-main` | Click Sidebar: LEADS | `rm-leads-main` | push | |
| `rm-dashboard-home-main` | Click Sidebar: AGENTS | `rm-agents-main` | push | |
| `rm-dashboard-home-main` | Click Sidebar: CAMPAIGNS | `rm-campaigns-main` | push | |
| `rm-dashboard-home-main` | Click Sidebar: AI REPORTS | `rm-reports-main` | push | |
| `rm-dashboard-home-main` | Click Sidebar: SETTINGS | `rm-settings-team-main` | push | |
| `rm-dashboard-home-main` | Click Panel 1 "VIEW ALL LEADS →" | `rm-leads-main` | push | |
| `rm-dashboard-home-main` | Click Panel 3 "VIEW ALL AGENTS →" | `rm-agents-main` | push | |
| `rm-dashboard-home-main` | Click Claude AI "READ FULL REPORT →" | `rm-reports-report-view` | push | |

---

### Flow 1.4: Leads Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| `rm-leads-main` | Lead count = 0 | `rm-leads-empty` | replace | State within same URL |
| `rm-leads-main` | Active filters = 0 results | `rm-leads-filtered-empty` | replace | State within same URL |
| `rm-leads-main` | Click lead row / arrow | `rm-leads-detail-panel` | modal | Slides in from right, no URL change |
| `rm-leads-detail-panel` | Click "✕" close button | `rm-leads-main` | modal-close | Panel slides out |
| `rm-leads-detail-panel` | Click "EXPAND →" | `rm-leads-detail-full` | push | Full URL change |
| `rm-leads-detail-panel` | Click agent name link | `rm-agents-detail-main` | push | |
| `rm-leads-detail-panel` | Click "REASSIGN →" | `rm-leads-reassign-modal` | modal | |
| `rm-leads-reassign-modal` | Confirm reassign | `rm-leads-detail-panel` | modal-close | Panel refreshes with new agent |
| `rm-leads-reassign-modal` | Cancel | `rm-leads-detail-panel` | modal-close | No change |
| `rm-leads-detail-full` | Click "Back" breadcrumb | `rm-leads-main` | back | |
| `rm-leads-detail-full` | Click "Call History" tab | `rm-leads-detail-call-history` | replace | Tab navigation, same URL |
| `rm-leads-detail-full` | Click "Appointment" tab | `rm-leads-detail-appointment` | replace | Tab navigation, same URL |
| `rm-leads-detail-call-history` | Click other tab | `rm-leads-detail-full` | replace | Tab navigation |
| `rm-leads-detail-appointment` | Click other tab | `rm-leads-detail-full` | replace | Tab navigation |
| `rm-leads-filtered-empty` | Click "Reset Filters" | `rm-leads-main` | replace | Filters cleared |
| `rm-leads-empty` | Campaigns go live, lead arrives | `rm-leads-main` | replace | Poll-triggered |

---

### Flow 1.5: Agent Performance Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| `rm-agents-main` | Agent count = 0 | `rm-agents-empty` | replace | Empty state |
| `rm-agents-main` | Click "ROUTING VIEW" toggle | `rm-agents-routing-view` | replace | Toggle within page |
| `rm-agents-routing-view` | Click toggle back | `rm-agents-main` | replace | Toggle back |
| `rm-agents-routing-view` | Click "Edit Routing Rules →" | `rm-settings-routing` | push | |
| `rm-agents-main` | Click "VIEW FULL PROFILE →" per agent | `rm-agents-detail-main` | push | |
| `rm-agents-detail-main` | Click "Back" | `rm-agents-main` | back | |
| `rm-agents-detail-main` | Click "Leads" tab | `rm-agents-detail-leads-tab` | replace | Tab nav |
| `rm-agents-detail-leads-tab` | Click lead row | `rm-leads-detail-panel` | modal | |
| `rm-agents-detail-leads-tab` | Click "Overview" tab | `rm-agents-detail-main` | replace | Tab nav |
| `rm-agents-empty` | Click "ADD AGENT" CTA | `rm-settings-team-main` | push | |

---

### Flow 1.6: Campaign Intelligence Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| `rm-campaigns-main` | No ad accounts connected | `rm-campaigns-empty` | replace | |
| `rm-campaigns-main` | API failure (Meta or Google) | `rm-campaigns-platform-error` | replace | Partial or full error state |
| `rm-campaigns-main` | Click campaign row | `rm-campaigns-detail-accordion` | replace | Inline accordion expands |
| `rm-campaigns-detail-accordion` | Click same row again | `rm-campaigns-main` | replace | Accordion collapses |
| `rm-campaigns-main` | Click creative thumbnail | `rm-campaigns-creative-detail-modal` | modal | |
| `rm-campaigns-creative-detail-modal` | Close modal | `rm-campaigns-main` | modal-close | |
| `rm-campaigns-empty` | Click "CONNECT AD ACCOUNT →" | `rm-settings-integrations` | push | |
| `rm-campaigns-platform-error` | Click "[↻ RECONNECT]" | `rm-settings-integrations` | push | |
| `rm-campaigns-platform-error` | Retry resolves | `rm-campaigns-main` | replace | |

---

### Flow 1.7: Claude AI Reports Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| `rm-reports-main` | No reports exist | `rm-reports-empty` | replace | Left panel shows empty state |
| `rm-reports-main` | Click report row | `rm-reports-report-view` | replace | Right panel updates; no URL push |
| `rm-reports-report-view` | Submit chat message | `rm-reports-chat-processing` | replace | Right panel state changes |
| `rm-reports-chat-processing` | AI response received | `rm-reports-chat-active` | replace | Response rendered |
| `rm-reports-chat-processing` | API failure | `rm-reports-chat-error` | replace | Error state in chat |
| `rm-reports-chat-error` | Click "Retry" | `rm-reports-chat-processing` | replace | Re-submit query |
| `rm-reports-chat-active` | User sends another message | `rm-reports-chat-processing` | replace | Loop |
| `rm-reports-empty` | First report generates (7+ days) | `rm-reports-main` | replace | Poll-triggered refresh |
| `rm-dashboard-home-main` | Click "READ FULL REPORT →" in Claude panel | `rm-reports-report-view` | push | |

---

### Flow 1.8: Settings Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| Any screen | Click Sidebar: SETTINGS | `rm-settings-team-main` | push | Default settings tab is Team |
| `rm-settings-team-main` | Click "+ ADD AGENT" | `rm-settings-add-agent-modal` | modal | |
| `rm-settings-add-agent-modal` | Save agent | `rm-settings-team-main` | modal-close | Table refreshes |
| `rm-settings-add-agent-modal` | Cancel | `rm-settings-team-main` | modal-close | No change |
| `rm-settings-team-main` | Click edit on agent row | `rm-settings-edit-agent-modal` | modal | |
| `rm-settings-edit-agent-modal` | Save changes | `rm-settings-team-main` | modal-close | Row updated |
| `rm-settings-edit-agent-modal` | Cancel | `rm-settings-team-main` | modal-close | |
| `rm-settings-team-main` | Click "LEAD ROUTING" tab | `rm-settings-routing` | replace | Tab nav |
| `rm-settings-routing` | Click "NOTIFICATIONS" tab | `rm-settings-notifications` | replace | Tab nav |
| `rm-settings-notifications` | Click "INTEGRATIONS" tab | `rm-settings-integrations` | replace | Tab nav |
| `rm-settings-integrations` | Click "ACCOUNT" tab | `rm-settings-account` | replace | Tab nav |
| `rm-settings-integrations` | Click Meta "RECONNECT" | `rm-settings-integrations-meta-reconnect` | push | |
| `rm-settings-integrations-meta-reconnect` | Reconnect success | `rm-settings-integrations` | back | Integration status updated |
| `rm-settings-integrations-meta-reconnect` | Cancel | `rm-settings-integrations` | back | |
| `rm-settings-integrations` | Click Google "RECONNECT" | `rm-settings-integrations-google-reconnect` | push | |
| `rm-settings-integrations-google-reconnect` | Reconnect success | `rm-settings-integrations` | back | |
| `rm-settings-integrations-google-reconnect` | Cancel | `rm-settings-integrations` | back | |

---
---

## APP 2: CEO DASHBOARD TRANSITIONS

---

### Flow 2.1: Authentication Transitions (CEO)

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| Direct URL | Page load, no session | `ceo-auth-login-main` | replace | |
| `ceo-auth-login-main` | Valid credentials, no 2FA | `ceo-command-center-main` | replace | |
| `ceo-auth-login-main` | Valid credentials, 2FA required | `ceo-auth-2fa-prompt` | push | |
| `ceo-auth-login-main` | Invalid credentials | `ceo-auth-login-error` | replace | |
| `ceo-auth-2fa-prompt` | Valid 2FA code | `ceo-command-center-main` | replace | |
| `ceo-auth-2fa-prompt` | Invalid code / max attempts | `ceo-auth-login-main` | replace | Lockout period if max exceeded |
| `ceo-auth-login-error` | Retry | `ceo-auth-login-main` | replace | |
| Any CEO authenticated screen | Session expires | `ceo-auth-session-expired` | redirect | |
| `ceo-auth-session-expired` | Auto-redirect (3s) | `ceo-auth-login-main` | replace | |
| Any CEO screen | Logout | `ceo-auth-login-main` | replace | |

---

### Flow 2.2: Command Center Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| `ceo-command-center-main` | Click "INVESTIGATE →" on alert | `ceo-command-center-alert-detail` | push | |
| `ceo-command-center-alert-detail` | Click "FULL CLIENT DETAIL →" | `ceo-clients-detail-overview` | push | |
| `ceo-command-center-alert-detail` | Click "DISMISS" | `ceo-command-center-alert-dismiss-modal` | modal | |
| `ceo-command-center-alert-dismiss-modal` | Confirm dismiss with note | `ceo-command-center-main` | replace | Alert removed from tray; back-navigation |
| `ceo-command-center-alert-dismiss-modal` | Cancel | `ceo-command-center-alert-detail` | modal-close | |
| `ceo-command-center-alert-detail` | Click "Back" | `ceo-command-center-main` | back | |
| `ceo-command-center-main` | Click client card in health grid | `ceo-clients-detail-overview` | push | |
| `ceo-command-center-main` | Click "VIEW ALL CLIENTS →" | `ceo-clients-list` | push | |
| `ceo-clients-list` | Click client row | `ceo-clients-detail-overview` | push | |
| `ceo-clients-list` | Click "Back" | `ceo-command-center-main` | back | |
| `ceo-command-center-main` | Click "VIEW DEPT 1 DETAIL →" | `ceo-dept-growth-main` | push | |
| `ceo-command-center-main` | Click "VIEW DEPT 2 DETAIL →" | `ceo-dept-adops-main` | push | |
| `ceo-command-center-main` | Click "VIEW DEPT 3 DETAIL →" | `ceo-dept-product-main` | push | |
| `ceo-command-center-main` | Click "VIEW DEPT 4 DETAIL →" | `ceo-dept-finance-main` | push | |

---

### Flow 2.3: Client Detail Transitions (CEO)

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| `ceo-clients-detail-overview` | Click "Campaigns" tab | `ceo-clients-detail-campaigns` | replace | Tab nav, same URL base |
| `ceo-clients-detail-overview` | Click "Leads" tab | `ceo-clients-detail-leads` | replace | Tab nav |
| `ceo-clients-detail-overview` | Click "Timeline" tab | `ceo-clients-detail-timeline` | replace | Tab nav |
| `ceo-clients-detail-overview` | Click "Financials" tab | `ceo-clients-detail-financials` | replace | Tab nav |
| All client detail tabs | Click "← COMMAND CENTER" breadcrumb | `ceo-command-center-main` | back | |
| All client detail tabs | Click "← ALL CLIENTS" breadcrumb | `ceo-clients-list` | back | If entered from list |
| `ceo-clients-detail-campaigns` | Click back to overview | `ceo-clients-detail-overview` | replace | Tab nav |
| `ceo-clients-detail-leads` | Click back to overview | `ceo-clients-detail-overview` | replace | Tab nav |
| `ceo-clients-detail-timeline` | Click back to overview | `ceo-clients-detail-overview` | replace | Tab nav |
| `ceo-clients-detail-financials` | Click back to overview | `ceo-clients-detail-overview` | replace | Tab nav |

---

### Flow 2.4: Department Drill-Down Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| `ceo-dept-growth-main` | Click prospect row | `ceo-dept-growth-prospect-detail` | push | |
| `ceo-dept-growth-prospect-detail` | Click "Back" | `ceo-dept-growth-main` | back | |
| `ceo-dept-growth-main` | Click "← COMMAND CENTER" | `ceo-command-center-main` | back | |
| `ceo-dept-adops-main` | Click client-at-risk row | `ceo-clients-detail-overview` | push | |
| `ceo-dept-adops-main` | Click "← COMMAND CENTER" | `ceo-command-center-main` | back | |
| `ceo-dept-product-main` | Click onboarding client row | `ceo-dept-product-onboarding-detail` | push | |
| `ceo-dept-product-onboarding-detail` | Click "Back" | `ceo-dept-product-main` | back | |
| `ceo-dept-product-main` | Click "N8N HEALTH →" | `ceo-dept-product-workflow-health` | push | |
| `ceo-dept-product-workflow-health` | Click "Back" | `ceo-dept-product-main` | back | |
| `ceo-dept-product-main` | Click "← COMMAND CENTER" | `ceo-command-center-main` | back | |
| `ceo-dept-finance-main` | Expand client row in P&L table | `ceo-dept-finance-client-pl-detail` | replace | Inline expand |
| `ceo-dept-finance-client-pl-detail` | Collapse row | `ceo-dept-finance-main` | replace | Inline collapse |
| `ceo-dept-finance-main` | Click "← COMMAND CENTER" | `ceo-command-center-main` | back | |

---

### Flow 2.5: Agent Activity Log Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| `ceo-command-center-main` | Click agent log sidebar nav | `ceo-agents-log-main` | push | |
| `ceo-agents-log-main` | Click "VIEW FULL LOG" per dept | `ceo-agents-log-dept-detail` | push | |
| `ceo-agents-log-dept-detail` | Click "Back" | `ceo-agents-log-main` | back | |
| `ceo-agents-log-main` | Click "VIEW HISTORY" / date picker | `ceo-agents-log-historical` | push | |
| `ceo-agents-log-historical` | Click "Return to Today" | `ceo-agents-log-main` | back | |

---

### Flow 2.6: CEO Settings Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| Any CEO screen | Click settings icon | `ceo-settings-main` | push | |
| `ceo-settings-main` | Click "Alert Thresholds" tab | `ceo-settings-alert-thresholds` | replace | Tab nav |
| `ceo-settings-main` | Click "Notifications" tab | `ceo-settings-notifications` | replace | Tab nav |
| `ceo-settings-alert-thresholds` | Click "Back to Settings" | `ceo-settings-main` | replace | Tab nav |
| `ceo-settings-notifications` | Click "Back to Settings" | `ceo-settings-main` | replace | Tab nav |

---
---

## APP 3: ONBOARDING PORTAL TRANSITIONS

---

### Flow 3.1: Portal Access Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| Email link click | Valid token, no prior progress, desktop | `ob-wizard-step1-main` | replace | Token validated |
| Email link click | Valid token, no prior progress, mobile | `ob-access-mobile-suggestion` | replace | Soft interstitial first |
| `ob-access-mobile-suggestion` | Click "CONTINUE ON MOBILE" | `ob-wizard-step1-main` | replace | User acknowledged |
| `ob-access-mobile-suggestion` | Click "CONTINUE ON DESKTOP" (conceptual) | `ob-access-mobile-suggestion` | — | No auto-action; user switches device |
| Email link click | Valid token, prior progress exists | `ob-wizard-step1-progress-restored` | replace | |
| `ob-wizard-step1-progress-restored` | Auto-advance (2s) | Last saved step (e.g., `ob-wizard-step3-main`) | replace | |
| Email link click | Invalid/expired token | `ob-access-token-invalid` | replace | |
| `ob-access-token-invalid` | Click "CONTACT MIRD SUPPORT" | External email client | external | mailto link |
| `ob-access-token-validating` | (loading) | Various | redirect | Per token state above |

---

### Flow 3.2: Wizard Step 1 Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| `ob-wizard-step1-main` | Fill checkbox + name, click "BEGIN SETUP →" | `ob-wizard-step2-main` | push | |
| `ob-wizard-step1-main` | Click "BEGIN SETUP →" with fields empty | `ob-wizard-step1-main` | replace | Button remains disabled; no action until valid |
| `ob-wizard-step1-main` | Click "Details look wrong? CONTACT US" | `ob-wizard-step1-wrong-details` | modal | Panel slides up within page |
| `ob-wizard-step1-wrong-details` | Click dismiss / close | `ob-wizard-step1-main` | modal-close | |
| `ob-wizard-step1-wrong-details` | Click support email | External email client | external | |

---

### Flow 3.3: Wizard Step 2 Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| `ob-wizard-step2-main` | Submit valid form | `ob-wizard-step2-saving` | replace | Saving state |
| `ob-wizard-step2-saving` | Save success | `ob-wizard-step3-main` | push | |
| `ob-wizard-step2-saving` | Save failure | `ob-wizard-step2-save-error` | replace | |
| `ob-wizard-step2-save-error` | Click "RETRY" | `ob-wizard-step2-saving` | replace | |
| `ob-wizard-step2-main` | Submit with invalid fields | `ob-wizard-step2-validation-error` | replace | Inline errors appear, no nav |
| `ob-wizard-step2-validation-error` | User corrects fields + resubmit | `ob-wizard-step2-saving` | replace | Errors cleared |
| `ob-wizard-step2-main` | Click "← Back" | `ob-wizard-step1-main` | back | |

---

### Flow 3.4: Wizard Step 3 Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| `ob-wizard-step3-main` | Click "VERIFY →" with token | `ob-wizard-step3-verifying` | replace | |
| `ob-wizard-step3-verifying` | Token valid (Meta API success) | `ob-wizard-step3-connected` | replace | |
| `ob-wizard-step3-verifying` | Token invalid (Meta API rejection) | `ob-wizard-step3-error` | replace | |
| `ob-wizard-step3-connected` | Click "CONTINUE →" | `ob-wizard-step4-main` | push | |
| `ob-wizard-step3-error` | Click "TRY AGAIN" | `ob-wizard-step3-main` | replace | Token input cleared |
| `ob-wizard-step3-error` | Help auto-expands | `ob-wizard-step3-help` | replace | Inline expand, no nav |
| `ob-wizard-step3-main` | Click "Having trouble? [HELP]" | `ob-wizard-step3-help` | replace | Inline expand |
| `ob-wizard-step3-help` | Click "WATCH WALKTHROUGH VIDEO" | `ob-support-video-walkthrough` | modal | Video lightbox |
| `ob-support-video-walkthrough` | Close video | `ob-wizard-step3-main` | modal-close | |
| `ob-wizard-step3-help` | Click "CONTACT SUPPORT" | `ob-support-contact-modal` | modal | |
| `ob-support-contact-modal` | Close modal | Returns to originating step | modal-close | Step context preserved |
| `ob-support-contact-modal` | Submit message | Returns to originating step | modal-close | Confirmation toast shown |
| `ob-wizard-step3-main` | Click "SAVE AND CONTINUE LATER" | `ob-wizard-step3-save-later` | replace | Progress saved to backend |
| `ob-wizard-step3-save-later` | Browser closed / user leaves | — | external | Session persists; re-entry via email |
| `ob-wizard-step3-main` | Click "← Back" | `ob-wizard-step2-main` | back | |

---

### Flow 3.5: Wizard Step 4 Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| `ob-wizard-step4-main` | Click "CHECK STATUS" (Google Ads) | `ob-wizard-step4-google-ads-checking` | replace | Async API poll initiated |
| `ob-wizard-step4-google-ads-checking` | Invitation accepted | `ob-wizard-step4-google-ads-connected` | replace | |
| `ob-wizard-step4-google-ads-checking` | Invitation not yet accepted | `ob-wizard-step4-main` | replace | "Check again in a few minutes" message |
| `ob-wizard-step4-google-ads-connected` | Component renders | `ob-wizard-step4-main` | replace | Within step, GMB section revealed |
| `ob-wizard-step4-main` | Click "SEARCH" (GMB) | `ob-wizard-step4-gmb-searching` | replace | |
| `ob-wizard-step4-gmb-searching` | Results returned | `ob-wizard-step4-gmb-results` | replace | |
| `ob-wizard-step4-gmb-searching` | No results | `ob-wizard-step4-gmb-no-results` | replace | |
| `ob-wizard-step4-gmb-results` | Click "SELECT THIS BUSINESS" | `ob-wizard-step4-gmb-selected` | replace | |
| `ob-wizard-step4-gmb-results` | Click "Search Again" | `ob-wizard-step4-main` | replace | Search input re-focused |
| `ob-wizard-step4-gmb-no-results` | Click "Try Different Search" | `ob-wizard-step4-main` | replace | |
| `ob-wizard-step4-gmb-no-results` | Click "Skip GMB, continue" | `ob-wizard-step5-main` | push | Google Ads required; GMB optional |
| `ob-wizard-step4-gmb-selected` | Click "CHECK GMB STATUS" | `ob-wizard-step4-main` | replace | GMB invite poll |
| `ob-wizard-step4-main` | Google Ads connected (GMB optional) + click Continue | `ob-wizard-step5-main` | push | |
| `ob-wizard-step4-main` | Click "← Back" | `ob-wizard-step3-main` | back | |

---

### Flow 3.6: Wizard Step 5 Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| `ob-wizard-step5-main` | File dropped into zone | `ob-wizard-step5-uploading` | replace | Upload begins immediately |
| `ob-wizard-step5-uploading` | All files uploaded successfully | `ob-wizard-step5-main` | replace | Files appear in list view, zone clears |
| `ob-wizard-step5-uploading` | File upload fails | `ob-wizard-step5-upload-error` | replace | Per-file error shown |
| `ob-wizard-step5-upload-error` | Click "RETRY" on file | `ob-wizard-step5-uploading` | replace | |
| `ob-wizard-step5-upload-error` | Click "REMOVE FILE" | `ob-wizard-step5-main` | replace | File removed from queue |
| `ob-wizard-step5-main` | Submit without logo or launch date | `ob-wizard-step5-validation-error` | replace | Inline errors |
| `ob-wizard-step5-validation-error` | User completes required fields + resubmit | `ob-wizard-step5-main` | replace | Errors cleared |
| `ob-wizard-step5-main` | All valid, click "COMPLETE SETUP" | `ob-wizard-completion-main` | push | Webhook fires on server |
| `ob-wizard-step5-main` | Click "← Back" | `ob-wizard-step4-main` | back | |

---

### Flow 3.7: Completion Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| `ob-wizard-completion-main` | Scroll down | `ob-wizard-completion-whats-next` | — | Scroll, same page |
| `ob-wizard-completion-main` | Click "+ ADD TO GOOGLE CALENDAR" | External Google Calendar | external | New tab |
| `ob-wizard-completion-whats-next` | Click "GO TO DASHBOARD →" | `rm-dashboard-home-empty` | external | New app domain |
| Email link re-click after completion | Token valid, onboarding_complete = true | `ob-wizard-completion-already-done` | replace | |
| `ob-wizard-completion-already-done` | Click "GO TO DASHBOARD →" | `rm-dashboard-home-empty` or `rm-dashboard-home-main` | external | Depends on campaign live status |

---

### Flow 3.8: Support & Help Transitions

| From Screen | Trigger | To Screen | Transition | Notes |
|-------------|---------|-----------|------------|-------|
| Any wizard step | Click "NEED HELP?" / "CONTACT SUPPORT" | `ob-support-contact-modal` | modal | Context-aware: step # passed |
| `ob-support-contact-modal` | Close | Originating wizard step | modal-close | |
| `ob-support-contact-modal` | Submit support message | Originating wizard step | modal-close | Success toast confirmation |
| `ob-wizard-step3-help` | Click video link | `ob-support-video-walkthrough` | modal | Video lightbox |
| `ob-support-video-walkthrough` | Close / dismiss | `ob-wizard-step3-help` | modal-close | |

---

## EDGE CASES AND SYSTEM-LEVEL TRANSITIONS

| Scenario | From | To | Transition | Notes |
|----------|------|----|------------|-------|
| Any RM URL hit while unauthenticated | Any `rm-*` URL | `rm-auth-login-main` | redirect | 401 guard |
| Any CEO URL hit (not Shomari session) | Any `ceo-*` URL | `ceo-auth-login-main` | redirect | 401 guard |
| Onboarding link after campaign live | `ob-wizard-completion-already-done` | `rm-dashboard-home-main` | external | |
| Invalid URL (any app) | Any broken URL | `rm-global-404` or `ceo-global-404` | replace | Per-app |
| Server error (any app) | Any screen | `rm-global-500` | replace | 5xx response |
| Maintenance mode active | Any URL | `rm-global-maintenance` | redirect | Server-side flag |
| RM mobile (portrait < 375px) | Any screen | Responsive layout switch | — | CSS breakpoint, no navigation |
| CEO Dashboard on mobile | Any `ceo-*` URL | Hard block or warning | redirect | Desktop 1024px minimum enforced |

---

*End of TRANSITION-MAP.md*
*Last Updated: 2026-03-29 | Make It Rain Digital*

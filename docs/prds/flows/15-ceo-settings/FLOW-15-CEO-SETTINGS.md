# Flow PRD: CEO Dashboard — Settings

**Flow ID:** F-15-CEO-SETTINGS
**App:** CEO Dashboard (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 3 screens | P0: 0 | P1: 0 | P2: 3

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | Navigation "SETTINGS" |
| **Exit Points** | Back to Command Center |
| **Primary User** | Shomari — configuring alert thresholds and notification preferences |
| **Dependencies** | Settings API, alert threshold config store |
| **URL Prefix** | `/settings` |

---

## 4. Screen Specifications

---

### Screen 1: CEO Settings Hub

**Screen ID:** `ceo-settings-main`
**Priority:** P2 | **Route:** `/settings`

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  HEADER: CEO SETTINGS                                                    │
│  padding: 24px                                                           │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  SETTINGS NAVIGATION  Panel card  max-width: 720px               │  │
│  │                                                                  │  │
│  │  ALERT THRESHOLDS  →                                             │  │
│  │  Orbitron 13px #E8F4F8  Inter 13px #7ECFDF description           │  │
│  │  Configure CPL, close rate, and spend alert triggers             │  │
│  │  border-bottom rgba(0,212,255,0.08)  padding: 16px               │  │
│  │                                                                  │  │
│  │  NOTIFICATION PREFERENCES  →                                     │  │
│  │  Configure how and when CEO alerts are delivered                 │  │
│  │  border-bottom rgba(0,212,255,0.08)  padding: 16px               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Screen 2: Alert Threshold Configuration

**Screen ID:** `ceo-settings-alert-thresholds`
**Priority:** P2 | **Route:** `/settings/thresholds`

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  HEADER  [←] SETTINGS    ALERT THRESHOLD CONFIGURATION                   │
│  padding: 24px  max-width: 720px                                         │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Panel card                                                      │  │
│  │                                                                  │  │
│  │  CPL ALERT THRESHOLD                                             │  │
│  │  Orbitron 13px #E8F4F8  mb:4px                                   │  │
│  │  Trigger alert when avg CPL exceeds this value                   │  │
│  │  Inter 13px #7ECFDF  mb:12px                                     │  │
│  │  $  [Input field — number, default: 65]  USD                     │  │
│  │     JARVIS input field  w:120px                                  │  │
│  │                                              mb:24px              │  │
│  │  CLOSE RATE ALERT THRESHOLD                                      │  │
│  │  Trigger alert when close rate drops below:                      │  │
│  │  [Input field — number, default: 20]  %                          │  │
│  │                                              mb:24px              │  │
│  │  AD SPEND ALERT THRESHOLD                                        │  │
│  │  Trigger alert when client CPL vs target exceeds:                │  │
│  │  [Input field — number, default: 25]  % above target             │  │
│  │                                              mb:32px              │  │
│  │  [SAVE THRESHOLDS →]  Primary button                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**
- Threshold inputs: JARVIS input field, `type="number"`, `width: 120px`
- Prefix/suffix labels: Share Tech Mono 13px `#7ECFDF` inline
- Save: Primary button with toast confirmation on success

---

### Screen 3: CEO Notification Preferences

**Screen ID:** `ceo-settings-notifications`
**Priority:** P2 | **Route:** `/settings/notifications`

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  HEADER  [←] SETTINGS    CEO NOTIFICATION PREFERENCES                    │
│  padding: 24px  max-width: 720px                                         │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Panel card                                                      │  │
│  │                                                                  │  │
│  │  CRITICAL ALERTS               EMAIL  [●]    SMS  [●]           │  │
│  │  Orbitron 13px #E8F4F8         toggle on     toggle on          │  │
│  │  Inter 13px #7ECFDF descr                                       │  │
│  │  border-bottom rgba(0,212,255,0.08)  padding: 16px               │  │
│  │                                                                  │  │
│  │  WARNING ALERTS                EMAIL  [●]    SMS  [○]           │  │
│  │  padding: 16px  border-bottom                                    │  │
│  │                                                                  │  │
│  │  WEEKLY SUMMARY REPORT         EMAIL  [●]    SMS  [○]           │  │
│  │  padding: 16px  border-bottom                                    │  │
│  │                                                                  │  │
│  │  AGENT ACTIVITY DIGEST         EMAIL  [○]    SMS  [○]           │  │
│  │  padding: 16px                                                   │  │
│  │                                          mb:24px                 │  │
│  │  [SAVE PREFERENCES →]  Primary button                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Toggle ON | `bg: #00D4FF`, `border: none`, 40×22px pill, thumb `#050D1A` |
| Toggle OFF | `bg: rgba(0,212,255,0.1)`, `border: 1px solid rgba(0,212,255,0.2)`, thumb `#2A4A5A` |
| Toggle transition | 200ms ease |
| Notification row | `padding: 16px 0`, `border-bottom: 1px solid rgba(0,212,255,0.08)` |
| Row label | Orbitron 13px `#E8F4F8` |
| Row description | Inter 13px `#7ECFDF` |
| Channel labels (EMAIL/SMS) | Orbitron 11px `#7ECFDF` above toggle |

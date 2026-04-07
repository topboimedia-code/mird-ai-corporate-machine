# Flow PRD: RainMachine Settings

| Field | Value |
|---|---|
| **Flow ID** | FLOW-08 |
| **App** | RainMachine (Client Dashboard) |
| **Platform** | Web — Desktop Primary (1280px+) |
| **Date** | 2026-03-30 |
| **Status** | Wireframe |
| **Screen Count** | 9 |
| **URL Prefix** | `/settings` |

---

## 1. Flow Metadata

| Screen ID | Screen Name | Priority | Complexity | Animation |
|---|---|---|---|---|
| rm-settings-team-main | Team Management | P1 | Medium | Simple |
| rm-settings-add-agent-modal | Add New Agent | P1 | Medium | Simple |
| rm-settings-edit-agent-modal | Edit Agent | P2 | Medium | Simple |
| rm-settings-routing | Lead Routing | P1 | Complex | Simple |
| rm-settings-notifications | Notifications | P1 | Medium | Simple |
| rm-settings-integrations | Integrations | P0 | Medium | Simple |
| rm-settings-integrations-meta-reconnect | Reconnect Meta Ads | P1 | Medium | Medium |
| rm-settings-integrations-google-reconnect | Reconnect Google Ads | P1 | Medium | Medium |
| rm-settings-account | Account & Billing | P2 | Medium | Simple |

---

## 1A. UI Profile Compliance

| Token | Value | Usage |
|---|---|---|
| bg-base | `#050D1A` | Page background |
| bg-panel | `#0A1628` | All panel cards, sidebar, modals |
| bg-panel-hover | `#0D1E35` | Row hover states |
| cyan-primary | `#00D4FF` | Active nav, primary buttons, active toggles |
| cyan-muted | `#7ECFDF` | Labels, inactive sub-nav, muted text |
| border-glow | `rgba(0,212,255,0.2)` | Panel borders, input default borders |
| border-strong | `rgba(0,212,255,0.4)` | Panel hover, focus rings |
| text-primary | `#E8F4F8` | Body text, table cell data |
| text-disabled | `#2A4A5A` | Disabled states, placeholders |
| success | `#00FF88` | CONNECTED status |
| error | `#FF3333` | DISCONNECTED status |
| warning | `#FFB800` | PENDING status, routing warning banner |
| alert | `#FF6B35` | Destructive actions |
| Font: Headings | Orbitron | All labels, page titles, tab names |
| Font: Data | Share Tech Mono (STM) | IDs, metrics, status values |
| Font: Body | Inter | Descriptions, instructions |
| Panel radius | 4px | All panels and modals |
| Button radius | 4px | All buttons |

**BANNED elements confirmed absent:** no emoji icons, no pulsating decorative circles, no soft gradients as backgrounds, no border-radius > 8px on panels.

---

## 2. CMO Context

Marcus is the client-side operator managing his RainMachine deployment. Settings is his control room for team configuration, lead distribution, notifications, and platform connections. He accesses settings either from the sidebar "SETTINGS" nav item or by following error prompts (e.g., a disconnected integration badge redirects him to the integrations page).

Settings is mission-critical: a misconfigured routing rule means leads go unassigned. A broken Meta integration means performance data goes dark. Marcus needs confidence that his configuration is active and correct at all times.

---

## 3. User Journey

```
SIDEBAR NAV: "SETTINGS"
         |
         v
+---------------------------+
|  rm-settings-team-main    | <-- default settings landing
|  (TEAM tab active)        |
+---------------------------+
    |           |         |
    v           v         v
[ADD AGENT] [EDIT]  [SUB-NAV TABS]
    |           |         |
    v           v         |
+----------+ +--------+   |
| add-agent| | edit-  |   +---> ROUTING tab
|  -modal  | | agent  |   |     rm-settings-routing
+----------+ | -modal |   |
    |         +--------+   +---> NOTIFICATIONS tab
    |             |        |     rm-settings-notifications
    v             v        |
settings-team-main         +---> INTEGRATIONS tab
(on close)                 |     rm-settings-integrations
                           |         |           |
                           |     [META]      [GOOGLE]
                           |     reconnect   reconnect
                           |         |           |
                           |  meta-reconnect  google-reconnect
                           |
                           +---> ACCOUNT tab
                                 rm-settings-account
```

---

## 4. Screen Specifications

---

### 4.1 Screen: `rm-settings-team-main`
**Name:** Team Management
**URL:** `/settings/team`
**Priority:** P1 | **Complexity:** Medium | **Animation:** Simple

#### Wireframe

```
+----------------------------------------------------------------------------------------------------------------------------------+
| SIDEBAR (240px)             | MAIN CONTENT AREA                                                                                  |
|                             |                                                                                                    |
| [RM LOGO]                   | HEADER: MARCUS JOHNSON   [Bell]  [Avatar]                                                          |
|                             +----------------------------------------------------------------------------------------------------+
| DASHBOARD                   | SETTINGS — TEAM MANAGEMENT                                                                        |
| LEADS                       |                                                                                                    |
| AGENTS                      | +--sub-nav bar--------------------------------------------------------+                                   |
| CAMPAIGNS                   | | TEAM [active] | ROUTING | NOTIFICATIONS | INTEGRATIONS | ACCOUNT |                                   |
| REPORTS                     | +----------------------------------------------------------------+                                   |
| > SETTINGS [active]         |                                                                                                    |
|                             | TEAM MANAGEMENT                              [+ ADD AGENT]                                        |
| ----------------            |                                                                                                    |
| SUPPORT                     | +--data-table---------------------------------------------------------+                                   |
| ACCOUNT                     | | AGENT             | ROLE         | PHONE          | EMAIL               | STATUS | ACTIONS  |   |
|                             | |-------------------+--------------+----------------+---------------------+--------+----------|   |
|                             | | [AV] Sarah Chen   | Senior Agent | (555) 234-5678 | s.chen@client.com   | [●] ON | Edit | X |   |
|                             | | [AV] Mike Torres  | Agent        | (555) 345-6789 | m.torres@client.com | [●] ON | Edit | X |   |
|                             | | [AV] Aisha Grant  | Team Lead    | (555) 456-7890 | a.grant@client.com  | [●] ON | Edit | X |   |
|                             | | [AV] Derek Owens  | Agent        | (555) 567-8901 | d.owens@client.com  | [●] OFF| Edit | X |   |
|                             | +----------------------------------------------------------------------+                                   |
|                             |                                                                                                    |
|                             | [Pagination: 1-4 of 4 agents]                                                                     |
+----------------------------------------------------------------------------------------------------------------------------------+
```

#### Empty State Wireframe

```
|                             | +--data-table-header-------------------------------------------+                                   |
|                             | | AGENT   | ROLE | PHONE | EMAIL | STATUS | ACTIONS            |   |
|                             | +----------------------------------------------------------+   |
|                             |                                                                                                    |
|                             |              NO AGENTS CONFIGURED                                                                 |
|                             |              Add your first team member to begin routing leads.                                   |
|                             |              [+ ADD YOUR FIRST AGENT]                                                             |
```

#### Component Specs

**Page Shell:**
- Sidebar: 240px, `bg: rgba(10,22,40,0.95)`, `border-right: 1px solid rgba(0,212,255,0.15)`
- SETTINGS item: active state — `bg: rgba(0,212,255,0.08)`, `border-left: 2px solid #00D4FF`, text `#00D4FF`
- Main area: `bg: #050D1A`, padding `32px`

**Page Title:**
- "SETTINGS — TEAM MANAGEMENT": Orbitron 18px 600 0.06em `#E8F4F8`, `mb: 24px`

**Settings Sub-Nav Bar:**
- Container: `bg: #0A1628`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, `padding: 0`, `mb: 32px`
- Each tab: Orbitron 11px 400 0.12em UPPERCASE, padding `14px 24px`
- Active tab: text `#00D4FF`, `border-bottom: 2px solid #00D4FF`
- Inactive tab: text `#7ECFDF`
- Hover tab: text `#E8F4F8`, `bg: rgba(0,212,255,0.04)`
- Tab order: TEAM | ROUTING | NOTIFICATIONS | INTEGRATIONS | ACCOUNT

**"+ ADD AGENT" Button:**
- Primary button: `bg: #00D4FF`, text `#050D1A`, Orbitron 600 13px UPPERCASE 0.1em
- Padding: `12px 24px`, `border-radius: 4px`
- Position: top-right, aligned with page title row
- Hover: `bg: #1ADCFF`, `box-shadow: 0 0 20px rgba(0,212,255,0.3)`

**Agent Table:**
- Container: panel card — `bg: #0A1628`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`
- `box-shadow: 0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1)`
- Header row: Orbitron 11px `#7ECFDF`, `border-bottom: 1px solid rgba(0,212,255,0.15)`, padding `12px 16px`
- Columns: AGENT (30%), ROLE (12%), PHONE (15%), EMAIL (22%), STATUS (8%), ACTIONS (13%)
- Data cells: STM 13px `#E8F4F8`, `border-bottom: 1px solid rgba(0,212,255,0.06)`, padding `12px 16px`
- Row hover: `bg: rgba(0,212,255,0.04)`, first-td `border-left: 2px solid #00D4FF`

**Agent Column:**
- Avatar: 32px circle, `bg: rgba(0,212,255,0.08)`, `border: 1px solid rgba(0,212,255,0.15)`, initials in STM 13px `#00D4FF`
- Name: Inter 15px `#E8F4F8`, `ml: 12px`
- Avatar + name in flex row

**Status Column:**
- ACTIVE: dot 8px circle `#00FF88`, `box-shadow: 0 0 6px rgba(0,255,136,0.4)`, label "ACTIVE" STM 11px `#00FF88`
- INACTIVE: dot 8px circle `#2A4A5A`, label "INACTIVE" STM 11px `#2A4A5A`

**Actions Column:**
- "Edit" ghost button: Orbitron 11px `#00D4FF` UPPERCASE, hover underline
- Deactivate "X": Lucide `XCircle` icon 16px `#7ECFDF`, hover `#FF6B35`

**Empty State:**
- Message: Orbitron 14px `#7ECFDF` centered
- Sub-text: Inter 13px `#2A4A5A`
- CTA button: same as primary ADD AGENT button

#### Animations

| Element | Animation | Timing |
|---|---|---|
| Page enter | panel-enter: slide-up 8px + fade | 400ms spring, stagger 80ms per panel |
| Table rows | stagger fade-in from bottom | 80ms per row |
| Row hover | border-left + bg transition | 150ms ease-out |
| Status dots | subtle glow pulse (active only) | 2s ease-in-out infinite, opacity 0.6→1 |

#### States

| State | Behavior |
|---|---|
| Loading | Shimmer skeleton rows: `bg: rgba(0,212,255,0.04)` animated 1.8s |
| Empty | Empty state centered message + CTA |
| Error fetch | Inline error bar: "FAILED TO LOAD AGENTS — RETRY" in `#FF6B35` |
| Agent deactivated | Row fades, status dot → INACTIVE, toast confirmation |

#### Data Requirements

```
GET /api/agents
Response: [
  {
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    role: "Agent" | "Senior Agent" | "Team Lead",
    status: "active" | "inactive",
    avatarInitials: string,
    timezone: string,
    accessLevel: "view_only" | "manage_leads"
  }
]
```

---

### 4.2 Screen: `rm-settings-add-agent-modal`
**Name:** Add New Agent
**URL:** `/settings/team` (modal overlay)
**Priority:** P1 | **Complexity:** Medium | **Animation:** Simple

#### Wireframe

```
+----------------------------------------------------------------------------------------------------------------------------------+
| [OVERLAY: rgba(0,0,0,0.6) — full screen]                                                                                        |
|                                                                                                                                  |
|                    +-----------------------------------------------+                                                            |
|                    | ADD NEW AGENT                           [X]   |                                                            |
|                    | ---------------------------------------------- |                                                            |
|                    |                                               |                                                            |
|                    | FIRST NAME *                LAST NAME *       |                                                            |
|                    | [______________________]   [_______________]  |                                                            |
|                    |                                               |                                                            |
|                    | EMAIL ADDRESS *                               |                                                            |
|                    | [__________________________________________]  |                                                            |
|                    |                                               |                                                            |
|                    | PHONE NUMBER               TIME ZONE         |                                                            |
|                    | [______________________]   [v_______________] |                                                            |
|                    |                                               |                                                            |
|                    | ROLE *                                        |                                                            |
|                    | [v Agent_____________________________]        |                                                            |
|                    |                                               |                                                            |
|                    | ACCESS LEVEL                                  |                                                            |
|                    | (o) CAN VIEW ONLY                             |                                                            |
|                    |     View leads and performance data           |                                                            |
|                    | ( ) CAN MANAGE LEADS                          |                                                            |
|                    |     Update, assign, and close leads           |                                                            |
|                    |                                               |                                                            |
|                    | ---------------------------------------------- |                                                            |
|                    | [CANCEL]              [CREATE AGENT]           |                                                            |
|                    +-----------------------------------------------+                                                            |
|                                                                                                                                  |
+----------------------------------------------------------------------------------------------------------------------------------+
```

#### Component Specs

**Modal Overlay:**
- `bg: rgba(0,0,0,0.6)`, `z-index: 40`, full viewport
- Click-outside behavior: closes modal (equivalent to CANCEL)

**Modal Container:**
- `bg: #0A1628`, `border-radius: 4px`, `max-width: 520px`, `width: 100%`, `margin: auto`
- `border: 1px solid rgba(0,212,255,0.2)`
- `box-shadow: 0 0 40px rgba(0,212,255,0.1)`
- Vertically centered in viewport

**Modal Header:**
- Title: "ADD NEW AGENT" — Orbitron 18px 600 0.06em `#E8F4F8`
- Close [X]: Lucide `X` icon 20px `#7ECFDF`, hover `#00D4FF`
- `border-bottom: 1px solid rgba(0,212,255,0.1)`, `pb: 16px`, `mb: 24px`
- Header row: flex space-between align-center

**Form Layout:**
- Padding: `32px` all sides
- Section gap: `20px` between field groups

**Two-Column Row (First/Last Name and Phone/Time Zone):**
- Grid: `display: grid; grid-template-columns: 1fr 1fr; gap: 16px`

**Input Fields:**
- `bg: rgba(0,212,255,0.04)`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`
- Padding: `12px 16px`, Inter 15px `#E8F4F8`, placeholder `#2A4A5A`
- Focus: `border-color: #00D4FF`, `box-shadow: 0 0 0 3px rgba(0,212,255,0.15)`
- Error: `border-color: rgba(255,107,53,0.6)`, `box-shadow: 0 0 0 3px rgba(255,107,53,0.1)`
- Label: Orbitron 11px UPPERCASE `#7ECFDF`, `mb: 8px`
- Required asterisk: `#FF6B35`

**Role Dropdown:**
- Same input styling with chevron-down Lucide icon right-aligned
- Options: Agent | Senior Agent | Team Lead
- Dropdown menu: `bg: #0A1628`, `border: 1px solid rgba(0,212,255,0.4)`, `border-radius: 4px`
- Option hover: `bg: rgba(0,212,255,0.08)`, text `#00D4FF`

**Time Zone Dropdown:**
- Same dropdown styling
- Options: list of US timezones (EST, CST, MST, PST + UTC)

**ACCESS LEVEL Section:**
- Section label: Orbitron 11px UPPERCASE `#7ECFDF`, `mb: 12px`
- Radio group container: `border: 1px solid rgba(0,212,255,0.1)`, `border-radius: 4px`, overflow hidden
- Each option: padding `14px 16px`, `border-bottom: 1px solid rgba(0,212,255,0.06)` (last: no border)
- Radio input: custom styled — circle 16px, `border: 1px solid rgba(0,212,255,0.4)`, selected fill `#00D4FF`
- Option title: Orbitron 12px UPPERCASE `#E8F4F8`, `ml: 10px`
- Option desc: Inter 13px `#7ECFDF`, `ml: 26px`, `mt: 4px`
- Selected row: `bg: rgba(0,212,255,0.04)`

**Footer CTAs:**
- `border-top: 1px solid rgba(0,212,255,0.1)`, `pt: 20px`, flex row, space-between
- "CANCEL": secondary button — transparent, `border: 1px solid rgba(0,212,255,0.4)`, text `#00D4FF`, Orbitron 11px
  Hover: `border-color: #00D4FF`, `bg: rgba(0,212,255,0.08)`
- "CREATE AGENT": primary button — `bg: #00D4FF`, text `#050D1A`, Orbitron 600 13px
  Loading state: spinner icon replacing text, `bg: #0A4F6E`
  Disabled (invalid form): `bg: #0A4F6E`, text `#2A4A5A`

#### Animations

| Element | Animation | Timing |
|---|---|---|
| Modal open | scale 0.96→1 + fade 0→1 | 300ms spring |
| Modal close | scale 1→0.96 + fade 1→0 | 200ms ease-in |
| Field focus | border-color + glow transition | 150ms ease-out |
| Submit loading | button text → Lucide `Loader2` spin | immediate |
| Success close | modal fade out | 200ms, then toast |

#### States

| State | Behavior |
|---|---|
| Default | All fields empty, CREATE AGENT disabled |
| Filling | Live validation on blur for email format, phone format |
| Submitting | Button shows spinner, inputs disabled |
| Success | Modal closes, toast: "AGENT CREATED — [NAME] ADDED TO TEAM" in `#00FF88` |
| Error | Inline error below field in `#FF7D52`, Inter 13px |

#### Validation Rules

| Field | Rule |
|---|---|
| First Name | Required, 2–50 chars |
| Last Name | Required, 2–50 chars |
| Email | Required, valid email format, unique check on submit |
| Phone | Optional, E.164 format validation |
| Role | Required, must select |
| Access Level | Defaults to "Can view only" |

---

### 4.3 Screen: `rm-settings-edit-agent-modal`
**Name:** Edit Agent
**URL:** `/settings/team` (modal overlay)
**Priority:** P2 | **Complexity:** Medium | **Animation:** Simple

#### Wireframe

```
+----------------------------------------------------------------------------------------------------------------------------------+
| [OVERLAY: rgba(0,0,0,0.6) — full screen]                                                                                        |
|                                                                                                                                  |
|                    +-----------------------------------------------+                                                            |
|                    | EDIT AGENT — SARAH CHEN               [X]    |                                                            |
|                    | ---------------------------------------------- |                                                            |
|                    |                                               |                                                            |
|                    | FIRST NAME *                LAST NAME *       |                                                            |
|                    | [Sarah__________________]   [Chen___________] |                                                            |
|                    |                                               |                                                            |
|                    | EMAIL ADDRESS *                               |                                                            |
|                    | [s.chen@clientdomain.com_________________]    |                                                            |
|                    |                                               |                                                            |
|                    | PHONE NUMBER               TIME ZONE         |                                                            |
|                    | [(555) 234-5678_______]   [v Eastern (EST)__] |                                                            |
|                    |                                               |                                                            |
|                    | ROLE *                                        |                                                            |
|                    | [v Senior Agent_____________________________] |                                                            |
|                    |                                               |                                                            |
|                    | ACCESS LEVEL                                  |                                                            |
|                    | ( ) CAN VIEW ONLY                             |                                                            |
|                    |     View leads and performance data           |                                                            |
|                    | (o) CAN MANAGE LEADS                          |                                                            |
|                    |     Update, assign, and close leads           |                                                            |
|                    |                                               |                                                            |
|                    | ---------------------------------------------- |                                                            |
|                    | [DEACTIVATE AGENT]    [CANCEL] [SAVE CHANGES] |                                                            |
|                    +-----------------------------------------------+                                                            |
|                                                                                                                                  |
+----------------------------------------------------------------------------------------------------------------------------------+
```

#### Component Specs

**Modal Header:**
- Title: "EDIT AGENT — [FULL NAME]" — Orbitron 18px 600 0.06em `#E8F4F8`
- Name in title is dynamically injected from selected agent record
- All other modal structure identical to add-agent-modal

**Pre-populated Fields:**
- All form fields loaded with current agent data on modal open
- Fields remain editable — same focus/error/hover states as add-agent-modal

**Footer CTAs (3 items):**
- Left: "DEACTIVATE AGENT" — destructive ghost link
  - Orbitron 11px UPPERCASE, text `#FF6B35`, no border, no bg
  - Hover: text `#FF3333`, `text-decoration: underline`
  - Click: opens inline confirmation prompt within modal (see Deactivation Confirmation state)
- Right group: "CANCEL" secondary + "SAVE CHANGES" primary
  - Identical styling to add-agent-modal CTAs

**Deactivation Confirmation (inline):**
- Footer area transforms:
  - Message: "DEACTIVATE [NAME]? THIS REMOVES THEM FROM ROUTING." Inter 13px `#FF7D52`
  - CTAs: "CONFIRM DEACTIVATE" (red primary: `bg: #FF3333`, text white) + "CANCEL" secondary

#### Animations

| Element | Animation | Timing |
|---|---|---|
| Modal open | Same as add-agent-modal | 300ms spring |
| Fields pre-fill | Instant (data loaded before open) | — |
| Deactivation confirm | Footer area slides height transition | 200ms ease |
| Deactivation action | Row removes from table + toast | 300ms |

#### States

| State | Behavior |
|---|---|
| Default | All fields pre-populated, SAVE CHANGES enabled |
| Unchanged | SAVE CHANGES disabled if no fields changed (optional: track dirty state) |
| Deactivation confirm | Inline confirm prompt replaces footer |
| Deactivated | Modal closes, agent row fades and status → INACTIVE, toast: "AGENT DEACTIVATED" |
| Save success | Modal closes, table row updates, toast: "CHANGES SAVED" |

---

### 4.4 Screen: `rm-settings-routing`
**Name:** Lead Routing Configuration
**URL:** `/settings/routing`
**Priority:** P1 | **Complexity:** Complex | **Animation:** Simple

#### Wireframe

```
+----------------------------------------------------------------------------------------------------------------------------------+
| SIDEBAR (240px)             | MAIN CONTENT AREA                                                                                  |
|                             |                                                                                                    |
| [RM LOGO]                   | HEADER: MARCUS JOHNSON   [Bell]  [Avatar]                                                          |
|                             +----------------------------------------------------------------------------------------------------+
| DASHBOARD                   | SETTINGS — LEAD ROUTING CONFIGURATION                                                             |
| LEADS                       |                                                                                                    |
| AGENTS                      | +--sub-nav bar---------------------------------------------------------+                                  |
| CAMPAIGNS                   | | TEAM | ROUTING [active] | NOTIFICATIONS | INTEGRATIONS | ACCOUNT |                                  |
| REPORTS                     | +------------------------------------------------------------------+                                  |
| > SETTINGS [active]         |                                                                                                    |
|                             | LEAD ROUTING CONFIGURATION                                                                        |
|                             |                                                                                                    |
|                             | [ ! WARNING: Some leads may not be routed. Add a catch-all rule. ]                               |
|                             |                                                                                                    |
|                             | ROUTING RULES  (drag to reorder priority)                                                         |
|                             |                                                                                                    |
|                             | +-- Rule Card 1 -------------------------------------------------------+                          |
|                             | | [::] PRIORITY 1                                                   |                          |
|                             | |                                                                   |                          |
|                             | |  SOURCE           TIME WINDOW         ASSIGN TO                  |                          |
|                             | |  [v Meta Ads___]  [v Business Hrs __]  [-->]  [v Sarah Chen____]  |                          |
|                             | |                                               [Delete rule X]    |                          |
|                             | +-------------------------------------------------------------------+                          |
|                             |                                                                                                    |
|                             | +-- Rule Card 2 -------------------------------------------------------+                          |
|                             | | [::] PRIORITY 2                                                   |                          |
|                             | |                                                                   |                          |
|                             | |  SOURCE           TIME WINDOW         ASSIGN TO                  |                          |
|                             | |  [v Google Ads_]  [v Any Time______]  [-->]  [v Round Robin___]  |                          |
|                             | |                                               [Delete rule X]    |                          |
|                             | +-------------------------------------------------------------------+                          |
|                             |                                                                                                    |
|                             | +-- Rule Card 3 (catch-all) -------------------------------------------+                          |
|                             | | [::] PRIORITY 3 — CATCH-ALL                                       |                          |
|                             | |                                                                   |                          |
|                             | |  SOURCE           TIME WINDOW         ASSIGN TO                  |                          |
|                             | |  [v All Leads__]  [v Any Time______]  [-->]  [v Queue_________]  |                          |
|                             | |                                               [Delete rule X]    |                          |
|                             | +-------------------------------------------------------------------+                          |
|                             |                                                                                                    |
|                             |  [+ ADD RULE]                                                                                     |
|                             |                                                                                                    |
|                             |                              [SAVE ROUTING RULES]                                                 |
|                             |                                                                                                    |
+----------------------------------------------------------------------------------------------------------------------------------+
```

#### Component Specs

**Warning Banner (conditional):**
- Shows when: no catch-all rule exists OR gaps detected in routing coverage
- Container: `bg: rgba(255,184,0,0.08)`, `border: 1px solid rgba(255,184,0,0.3)`, `border-radius: 4px`, padding `12px 16px`, `mb: 24px`
- Left icon: Lucide `AlertTriangle` 16px `#FFB800`
- Text: Orbitron 11px `#FFB800` — "[!] WARNING: SOME LEADS MAY NOT BE ROUTED. ADD A CATCH-ALL RULE."
- Hidden when all leads are covered by routing rules

**Section Header:**
- "ROUTING RULES" — Orbitron 14px 600 `#E8F4F8`
- Sub-label: Inter 13px `#7ECFDF` — "(drag to reorder priority)"
- Flex row, `mb: 20px`

**Rule Card:**
- `bg: #0A1628`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, padding `20px 24px`, `mb: 12px`
- `box-shadow: 0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1)`
- Drag active: `border-color: rgba(0,212,255,0.4)`, `box-shadow: 0 0 30px rgba(0,212,255,0.12)`

**Drag Handle:**
- Lucide `GripVertical` icon 16px `#2A4A5A`
- Hover: `#7ECFDF`
- Cursor: `grab`, active: `grabbing`
- Position: left edge of card, vertically centered

**Priority Badge:**
- "PRIORITY [N]" — Orbitron 11px `#7ECFDF`, `bg: rgba(0,212,255,0.08)`, `border-radius: 4px`, padding `4px 8px`
- Catch-all rule: "PRIORITY [N] — CATCH-ALL" with `#FFB800` text

**Rule Row Layout:**
- Grid: `display: grid; grid-template-columns: 1fr 1fr 40px 1fr auto; gap: 12px; align-items: center`
- Labels above dropdowns: Orbitron 11px `#7ECFDF`

**SOURCE Dropdown options:** All Leads | Meta Ads | Google Ads | Organic/Direct | Referral
**TIME WINDOW Dropdown options:** Any Time | Business Hours (8am–5pm) | After Hours | Weekends
**ASSIGN TO Dropdown options:** [Agent names] | Round Robin — All Agents | Lead Queue (Unassigned)

**Arrow Separator:**
- Lucide `ArrowRight` 16px `#00D4FF`
- Centered in its grid column

**Delete Rule:**
- Lucide `Trash2` icon 16px `#2A4A5A`, hover `#FF6B35`
- Tooltip on hover: "REMOVE RULE" Orbitron 11px

**"+ ADD RULE" Ghost Link:**
- Orbitron 11px UPPERCASE `#00D4FF`, no border, no bg
- `::after` content: ` →`
- Hover: text `#1ADCFF`
- Position: below last rule card, left-aligned

**"SAVE ROUTING RULES" Primary Button:**
- Standard primary button spec
- Position: bottom-right
- Disabled: no unsaved changes

#### Animations

| Element | Animation | Timing |
|---|---|---|
| Page enter | panel-enter stagger | 400ms |
| Drag and drop | Rule card lifts (scale 1.02, shadow) | 150ms ease-out |
| Reorder | Other cards shift position | 200ms spring |
| New rule added | Card slides in from bottom + fade | 300ms spring |
| Rule deleted | Card slides out + fade | 200ms ease-in |
| Save success | Toast notification | 200ms |

#### States

| State | Behavior |
|---|---|
| No rules | Empty state + "ADD YOUR FIRST RULE" CTA |
| Rules with gaps | Warning banner visible |
| All leads covered | Warning banner hidden |
| Dragging | Card lifts, other cards shift with spring animation |
| Unsaved changes | SAVE button enables, "UNSAVED CHANGES" label appears |
| Saving | Button spinner |
| Save success | Toast "ROUTING RULES SAVED", SAVE button resets |
| Save error | Toast "FAILED TO SAVE — RETRY" in `#FF7D52` |

#### Data Requirements

```
GET /api/settings/routing-rules
Response: [
  {
    id: string,
    priority: number,
    sourceCondition: "all" | "meta" | "google" | "organic" | "referral",
    timeCondition: "any" | "business_hours" | "after_hours" | "weekends",
    assignTo: "agent:[id]" | "round_robin" | "queue"
  }
]

PUT /api/settings/routing-rules
Body: { rules: RoutingRule[] }
```

---

### 4.5 Screen: `rm-settings-notifications`
**Name:** Notification Preferences
**URL:** `/settings/notifications`
**Priority:** P1 | **Complexity:** Medium | **Animation:** Simple

#### Wireframe

```
+----------------------------------------------------------------------------------------------------------------------------------+
| SIDEBAR (240px)             | MAIN CONTENT AREA                                                                                  |
|                             |                                                                                                    |
| [RM LOGO]                   | HEADER: MARCUS JOHNSON   [Bell]  [Avatar]                                                          |
|                             +----------------------------------------------------------------------------------------------------+
| DASHBOARD                   | SETTINGS — NOTIFICATION PREFERENCES                                                               |
| LEADS                       |                                                                                                    |
| AGENTS                      | +--sub-nav bar--------------------------------------------------------------+                             |
| CAMPAIGNS                   | | TEAM | ROUTING | NOTIFICATIONS [active] | INTEGRATIONS | ACCOUNT |                             |
| REPORTS                     | +-----------------------------------------------------------------------+                             |
| > SETTINGS [active]         |                                                                                                    |
|                             | NOTIFICATION PREFERENCES                                                                          |
|                             |                                                                                                    |
|                             | +--notification-panel------------------------------------------------------+                       |
|                             | | EVENT                       DESCRIPTION                  EMAIL  SMS  |                       |
|                             | |--------------------------------------------------------------------|                       |
|                             | | NEW LEAD CAPTURED           Alert when a new lead           [ ] [ ] |                       |
|                             | |                             enters the system                       |                       |
|                             | |--------------------------------------------------------------------|                       |
|                             | | APPOINTMENT BOOKED          Alert when a lead books          [ ] [ ] |                       |
|                             | |                             an appointment                          |                       |
|                             | |--------------------------------------------------------------------|                       |
|                             | | LEAD STATUS CHANGED         Alert when a lead status         [ ] [ ] |                       |
|                             | |                             is updated                              |                       |
|                             | |--------------------------------------------------------------------|                       |
|                             | | DAILY PERFORMANCE SUMMARY   Daily 6pm digest of              [ ]     |                       |
|                             | |                             key metrics                             |                       |
|                             | |--------------------------------------------------------------------|                       |
|                             | | WEEKLY INTELLIGENCE BRIEF   Monday morning                   [ ]     |                       |
|                             | |                             performance report                       |                       |
|                             | |--------------------------------------------------------------------|                       |
|                             | | SYSTEM ALERTS               Critical system and              [ ] [ ] |                       |
|                             | |                             integration alerts                        |                       |
|                             | +--------------------------------------------------------------------+                       |
|                             |                                                                                                    |
|                             |                              [SAVE PREFERENCES]                                                    |
|                             |                                                                                                    |
+----------------------------------------------------------------------------------------------------------------------------------+
```

#### Component Specs

**Notification Panel:**
- Panel card: `bg: #0A1628`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`
- `box-shadow: 0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1)`

**Panel Header Row:**
- Orbitron 11px `#7ECFDF`, `border-bottom: 1px solid rgba(0,212,255,0.15)`, padding `12px 16px 12px 20px`
- Columns: EVENT (40%), DESCRIPTION (40%), EMAIL (10%), SMS (10%)
- "EMAIL" and "SMS" centered in their columns

**Notification Row:**
- Padding: `16px 16px 16px 20px`
- `border-bottom: 1px solid rgba(0,212,255,0.06)`, last row: no border
- Hover: `bg: rgba(0,212,255,0.04)`
- EVENT label: Orbitron 13px UPPERCASE `#E8F4F8`
- Description: Inter 13px `#7ECFDF`, `mt: 4px`
- Toggle cells: centered

**Toggle Switch:**
- Track OFF: `bg: rgba(0,212,255,0.1)`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 12px`
- Track ON: `bg: #00D4FF`, `box-shadow: 0 0 8px rgba(0,212,255,0.3)`
- Thumb: 20px circle `bg: #E8F4F8`, transition 200ms
- Size: 44px × 24px
- Focus ring: `box-shadow: 0 0 0 3px rgba(0,212,255,0.15)`
- SMS toggles hidden for DAILY PERFORMANCE SUMMARY and WEEKLY INTELLIGENCE BRIEF (email-only events) — replaced by empty cell

**"SAVE PREFERENCES" Button:**
- Standard primary button, bottom-right
- Disabled if no unsaved changes

#### Animations

| Element | Animation | Timing |
|---|---|---|
| Page enter | panel-enter | 400ms |
| Toggle switch | thumb slides, track color transitions | 200ms ease |
| Save success | toast "PREFERENCES SAVED" | 200ms |

#### States

| State | Behavior |
|---|---|
| Default | Loaded with current preferences |
| Changed | SAVE button enables |
| Saving | Button spinner |
| Success | Toast confirmation |

#### Data Requirements

```
GET /api/settings/notifications
Response: {
  newLeadCaptured: { email: boolean, sms: boolean },
  appointmentBooked: { email: boolean, sms: boolean },
  leadStatusChanged: { email: boolean, sms: boolean },
  dailyPerformanceSummary: { email: boolean },
  weeklyIntelligenceBrief: { email: boolean },
  systemAlerts: { email: boolean, sms: boolean }
}

PUT /api/settings/notifications
Body: NotificationPreferences
```

---

### 4.6 Screen: `rm-settings-integrations`
**Name:** Platform Integrations
**URL:** `/settings/integrations`
**Priority:** P0 | **Complexity:** Medium | **Animation:** Simple

#### Wireframe

```
+----------------------------------------------------------------------------------------------------------------------------------+
| SIDEBAR (240px)             | MAIN CONTENT AREA                                                                                  |
|                             |                                                                                                    |
| [RM LOGO]                   | HEADER: MARCUS JOHNSON   [Bell]  [Avatar]                                                          |
|                             +----------------------------------------------------------------------------------------------------+
| DASHBOARD                   | SETTINGS — PLATFORM INTEGRATIONS                                                                  |
| LEADS                       |                                                                                                    |
| AGENTS                      | +--sub-nav bar--------------------------------------------------------------+                             |
| CAMPAIGNS                   | | TEAM | ROUTING | NOTIFICATIONS | INTEGRATIONS [active] | ACCOUNT |                             |
| REPORTS                     | +-----------------------------------------------------------------------+                             |
| > SETTINGS [active]         |                                                                                                    |
|                             | PLATFORM INTEGRATIONS                                                                             |
|                             |                                                                                                    |
|                             | +-integration-card (col 1)--+ +-integration-card (col 2)--+                                       |
|                             | | [|||] META ADS             | | [G] GOOGLE ADS            |                                       |
|                             | | ● CONNECTED               | | ● CONNECTED               |                                       |
|                             | |                           | |                           |                                       |
|                             | | Account: Best Roofing LLC | | Account: Best Roofing LLC |                                       |
|                             | | ID: act_123456789         | | Customer ID: 123-456-7890 |                                       |
|                             | | Scope: Leads, Insights    | | Scope: Clicks, Conversions|                                       |
|                             | | Last sync: 5 min ago      | | Last sync: 12 min ago     |                                       |
|                             | |                           | |                           |                                       |
|                             | | [VIEW DETAILS →]          | | [VIEW DETAILS →]          |                                       |
|                             | +---------------------------+ +---------------------------+                                       |
|                             |                                                                                                    |
|                             | +-integration-card (col 1)--+ +-integration-card (col 2)--+                                       |
|                             | | [G] GOOGLE MY BUSINESS    | | [V] VAPI (AI CALLING)     |                                       |
|                             | | ✕ DISCONNECTED            | | ◎ PENDING                 |                                       |
|                             | |                           | |                           |                                       |
|                             | | Account: —                | | Account: —                |                                       |
|                             | | Last sync: Never          | | Agent ID: Awaiting config |                                       |
|                             | |                           | |                           |                                       |
|                             | | [CONNECT →]               | | [CONFIGURE →]             |                                       |
|                             | +---------------------------+ +---------------------------+                                       |
|                             |                                                                                                    |
+----------------------------------------------------------------------------------------------------------------------------------+
```

#### Component Specs

**Integration Cards Grid:**
- `display: grid; grid-template-columns: 1fr 1fr; gap: 20px`
- Max content width: `800px`

**Integration Status Card:**
- Base: panel card spec — `bg: #0A1628`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, padding `24px`
- `box-shadow: 0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1)`
- Left status indicator bar: 3px vertical bar, full card height, `border-radius: 2px 0 0 2px`, positioned absolute left edge
  - CONNECTED: `#00FF88`
  - DISCONNECTED: `#FF3333`
  - PENDING: `#FFB800`
- Hover: `border-color: rgba(0,212,255,0.4)`, `box-shadow: 0 0 30px rgba(0,212,255,0.12)`

**Card Header Row:**
- Platform icon placeholder: 40px × 40px square, `bg: rgba(0,212,255,0.08)`, `border: 1px solid rgba(0,212,255,0.15)`, `border-radius: 4px`
  - Icon: Lucide icons — Meta: `Share2` | Google: `Search` | GMB: `MapPin` | VAPI: `Phone`
  - Icon size 20px `#00D4FF`
- Platform name: Orbitron 14px 600 `#E8F4F8`, `ml: 12px`
- Header row: flex align-center, `border-bottom: 1px solid rgba(0,212,255,0.1)`, `pb: 16px`, `mb: 16px`

**Status Badge:**
- Below platform name in header
- CONNECTED: Lucide `CheckCircle` 12px `#00FF88` + "CONNECTED" STM 12px `#00FF88`
- DISCONNECTED: Lucide `XCircle` 12px `#FF3333` + "DISCONNECTED" STM 12px `#FF3333`
- PENDING: Lucide `Clock` 12px `#FFB800` + "PENDING" STM 12px `#FFB800`

**Sub-Details (CONNECTED state):**
- Labels: Orbitron 11px `#7ECFDF`, `mb: 4px`
- Values: STM 13px `#E8F4F8`
- Row spacing: `mb: 8px`
- Fields: Account Name, Account ID / Customer ID, Data Scope, Last Sync

**Sub-Details (DISCONNECTED state):**
- "Account: —" STM 13px `#2A4A5A`
- "Last sync: Never" STM 13px `#2A4A5A`

**CTA Buttons:**
- CONNECTED: "VIEW DETAILS →" ghost button — Orbitron 11px `#00D4FF`, `::after: ' →'`
- DISCONNECTED: "CONNECT →" secondary button
- PENDING: "CONFIGURE →" secondary button

#### Animations

| Element | Animation | Timing |
|---|---|---|
| Page enter | panel-enter stagger | 400ms, 80ms per card |
| Card hover | border + shadow transition | 150ms ease-out |
| Status sync pulse | CONNECTED status dot subtle glow | 2s ease-in-out |

#### States

| State | Behavior |
|---|---|
| All connected | All cards show CONNECTED with sync times |
| Partial disconnect | Affected card(s) show DISCONNECTED with CONNECT → CTA |
| Token expiry | Card status → DISCONNECTED, header shows "[!] TOKEN EXPIRED" badge |

#### Data Requirements

```
GET /api/settings/integrations
Response: {
  metaAds: { status: "connected" | "disconnected" | "pending", accountName, accountId, lastSync, dataScope },
  googleAds: { status, accountName, customerId, lastSync, dataScope },
  googleMyBusiness: { status, accountName, locationId, lastSync },
  vapi: { status, agentId, phoneNumber, lastSync }
}
```

---

### 4.7 Screen: `rm-settings-integrations-meta-reconnect`
**Name:** Reconnect Meta Ads
**URL:** `/settings/integrations/meta/reconnect`
**Priority:** P1 | **Complexity:** Medium | **Animation:** Medium

#### Wireframe

```
+----------------------------------------------------------------------------------------------------------------------------------+
| SIDEBAR (240px)             | MAIN CONTENT AREA                                                                                  |
|                             |                                                                                                    |
| [RM LOGO]                   | HEADER: MARCUS JOHNSON   [Bell]  [Avatar]                                                          |
|                             +----------------------------------------------------------------------------------------------------+
| > SETTINGS [active]         |                                                                                                    |
|                             | [<-- Back to Integrations]                                                                        |
|                             |                                                                                                    |
|                             | RECONNECT META ADS                [! TOKEN EXPIRED]                                                |
|                             |                                                                                                    |
|                             | +--step-indicator-------------------------------------------------+                                  |
|                             | |  [1] OPEN META  ----  [2] COPY TOKEN  ----  [3] PASTE BELOW   |                                  |
|                             | +------------------------------------------------------------------+                                  |
|                             |                                                                                                    |
|                             | +--step-card---STEP 1: OPEN META BUSINESS SUITE------------------+                                  |
|                             | |                                                                  |                                  |
|                             | | 1. Go to business.facebook.com and log in as your page admin.  |                                  |
|                             | | 2. Navigate to Settings > Security > API Access.               |                                  |
|                             | | 3. Click "Generate New Token" — select ads_read and            |                                  |
|                             | |    leads_retrieval permissions.                                |                                  |
|                             | |                                                                  |                                  |
|                             | | [SCREENSHOT PLACEHOLDER — 80px height gray bg]                 |                                  |
|                             | |                                                                  |                                  |
|                             | +------------------------------------------------------------------+                                  |
|                             |                                                                                                    |
|                             | +--step-card---STEP 2: COPY YOUR TOKEN--------------------------+                                  |
|                             | |                                                                  |                                  |
|                             | | 1. After generating, copy the full token string.               |                                  |
|                             | | 2. Tokens begin with "EAA..." — ensure you copy the full value. |                                  |
|                             | | 3. Do not share this token — it grants access to your ad data.  |                                  |
|                             | |                                                                  |                                  |
|                             | | [SCREENSHOT PLACEHOLDER — 80px height gray bg]                 |                                  |
|                             | |                                                                  |                                  |
|                             | +------------------------------------------------------------------+                                  |
|                             |                                                                                                    |
|                             | +--step-card---STEP 3: PASTE BELOW------------------------------+                                  |
|                             | |                                                                  |                                  |
|                             | | PASTE YOUR META API TOKEN                                        |                                  |
|                             | | +-------------------------------------------------------------+  |                                  |
|                             | | | EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  |  |                                  |
|                             | | |                                                             |  |                                  |
|                             | | +-------------------------------------------------------------+  |                                  |
|                             | |                                                                  |                                  |
|                             | | [VERIFY TOKEN]                                                   |                                  |
|                             | |                                                                  |                                  |
|                             | +------------------------------------------------------------------+                                  |
|                             |                                                                                                    |
+----------------------------------------------------------------------------------------------------------------------------------+
```

#### Component Specs

**Back Navigation:**
- Lucide `ChevronLeft` 14px `#00D4FF` + "BACK TO INTEGRATIONS" Orbitron 11px `#00D4FF`
- Hover: text `#1ADCFF`
- `mb: 24px`

**Page Title Row:**
- "RECONNECT META ADS" — Orbitron 18px 600 `#E8F4F8`
- "[! TOKEN EXPIRED]" warning badge: `bg: rgba(255,107,53,0.1)`, `border: 1px solid rgba(255,107,53,0.3)`, `border-radius: 4px`, padding `4px 10px`
  - Lucide `AlertTriangle` 12px `#FF6B35` + "TOKEN EXPIRED" Orbitron 11px `#FF6B35`
- Title row: flex align-center gap-16, `mb: 32px`

**Step Indicator:**
- Container: `bg: #0A1628`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, padding `16px 24px`, `mb: 32px`
- Three steps connected by lines
- Active step: circle `#00D4FF`, number Orbitron 12px `#050D1A`, label Orbitron 11px `#00D4FF`
- Completed step: circle `#00FF88`, Lucide `Check` icon 12px `#050D1A`
- Upcoming step: circle `rgba(0,212,255,0.1)`, `border: 1px solid rgba(0,212,255,0.2)`, number `#2A4A5A`
- Connector line: `border-top: 1px dashed rgba(0,212,255,0.2)`
- Default active: Step 1 (progresses as user completes each step)

**Step Cards:**
- Panel card spec, `mb: 16px`
- Card header: "STEP [N]: [TITLE]" Orbitron 14px 600 `#E8F4F8`, `border-bottom: 1px solid rgba(0,212,255,0.1)`, `pb: 16px`, `mb: 16px`
- Instructions: Inter 15px `#E8F4F8`, numbered list, `line-height: 1.6`
  - List numbers: Orbitron 12px `#00D4FF`

**Screenshot Placeholder:**
- Height: 80px, `bg: rgba(0,212,255,0.04)`, `border: 1px solid rgba(0,212,255,0.1)`, `border-radius: 4px`
- Centered text: "SCREENSHOT PLACEHOLDER" Orbitron 11px `#2A4A5A`
- `mt: 16px`

**Token Input (Step 3):**
- Label: "PASTE YOUR META API TOKEN" — Orbitron 11px UPPERCASE `#7ECFDF`, `mb: 8px`
- Textarea: `bg: rgba(0,212,255,0.04)`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`
- Padding: `12px 16px`, Inter 15px `#E8F4F8`, `font-family: Share Tech Mono`
- Height: `80px`, `resize: vertical`
- Placeholder: "EAAxxxxxxx..." in `#2A4A5A`
- Focus: `border-color: #00D4FF`, `box-shadow: 0 0 0 3px rgba(0,212,255,0.15)`
- Error: `border-color: rgba(255,107,53,0.6)`, error message below: "INVALID TOKEN FORMAT" Inter 13px `#FF7D52`

**"VERIFY TOKEN" Primary Button:**
- Standard primary button, `mt: 16px`
- Loading: Lucide `Loader2` spin + "VERIFYING..." text
- Success state: `bg: #00FF88`, text `#050D1A`, Lucide `Check` icon — "TOKEN VERIFIED"
- Error state: shake animation + error message below

#### Animations

| Element | Animation | Timing |
|---|---|---|
| Page enter | panel-enter stagger for step cards | 400ms, 80ms stagger |
| Step indicator progress | line fills left-to-right | 400ms ease |
| Verify loading | button spinner | immediate |
| Token valid | button → success green + scale | 200ms spring |
| Token invalid | input shake (translateX ±6px) | 400ms ease |
| Success redirect | 1s delay then fade to integrations page | 1200ms |

#### States

| State | Behavior |
|---|---|
| Initial | Step 1 active, no token entered |
| Token pasted | VERIFY TOKEN enables |
| Verifying | Button loading spinner |
| Token valid | Success state, auto-redirect to integrations in 1.5s |
| Token invalid | Error message below input, input shake |
| Network error | Toast "VERIFICATION FAILED — CHECK CONNECTION" |

---

### 4.8 Screen: `rm-settings-integrations-google-reconnect`
**Name:** Reconnect Google Ads
**URL:** `/settings/integrations/google/reconnect`
**Priority:** P1 | **Complexity:** Medium | **Animation:** Medium

#### Wireframe

```
+----------------------------------------------------------------------------------------------------------------------------------+
| SIDEBAR (240px)             | MAIN CONTENT AREA                                                                                  |
|                             |                                                                                                    |
| [RM LOGO]                   | HEADER: MARCUS JOHNSON   [Bell]  [Avatar]                                                          |
|                             +----------------------------------------------------------------------------------------------------+
| > SETTINGS [active]         |                                                                                                    |
|                             | [<-- Back to Integrations]                                                                        |
|                             |                                                                                                    |
|                             | RECONNECT GOOGLE ADS              [! CONNECTION REQUIRED]                                         |
|                             |                                                                                                    |
|                             | +--step-indicator-----------------------------------------------+                                  |
|                             | | [1] LOCATE ACCOUNT  ----  [2] ACCEPT MCC INVITE  ---- [3] ENTER ID  |                           |
|                             | +------------------------------------------------------------------+                                  |
|                             |                                                                                                    |
|                             | +--step-card---STEP 1: LOCATE YOUR GOOGLE ADS ACCOUNT-----------+                                  |
|                             | |                                                                  |                                  |
|                             | | 1. Log in to ads.google.com using your Google account.         |                                  |
|                             | | 2. In the top navigation, locate your Customer ID.             |                                  |
|                             | | 3. Customer IDs are 10 digits in XXX-XXX-XXXX format.          |                                  |
|                             | |                                                                  |                                  |
|                             | | [SCREENSHOT PLACEHOLDER — 80px height gray bg]                 |                                  |
|                             | |                                                                  |                                  |
|                             | +------------------------------------------------------------------+                                  |
|                             |                                                                                                    |
|                             | +--step-card---STEP 2: ACCEPT THE MCC INVITE------------------------+                                |
|                             | |                                                                  |                                  |
|                             | | Make It Rain Digital uses a Manager Account (MCC) to access     |                                  |
|                             | | your campaign data without requiring your password.             |                                  |
|                             | |                                                                  |                                  |
|                             | | 1. You will have received an invite email from Google Ads.     |                                  |
|                             | | 2. Click "Accept Invitation" in the email, or navigate to:     |                                  |
|                             | |    Google Ads > Settings > Account Access > Manager Accounts.  |                                  |
|                             | | 3. Accept the invite from "Make It Rain Digital".              |                                  |
|                             | |                                                                  |                                  |
|                             | | [SCREENSHOT PLACEHOLDER — 80px height gray bg]                 |                                  |
|                             | |                                                                  |                                  |
|                             | | [I HAVE ACCEPTED THE INVITE]                                    |                                  |
|                             | |                                                                  |                                  |
|                             | +------------------------------------------------------------------+                                  |
|                             |                                                                                                    |
|                             | +--step-card---STEP 3: ENTER YOUR CUSTOMER ID-------------------+                                  |
|                             | |                                                                  |                                  |
|                             | | YOUR GOOGLE ADS CUSTOMER ID                                      |                                  |
|                             | | [___XXX-XXX-XXXX_______________]                                 |                                  |
|                             | | Format: XXX-XXX-XXXX (10 digits, dashes added automatically)    |                                  |
|                             | |                                                                  |                                  |
|                             | | [VERIFY CONNECTION]                                              |                                  |
|                             | |                                                                  |                                  |
|                             | +------------------------------------------------------------------+                                  |
|                             |                                                                                                    |
+----------------------------------------------------------------------------------------------------------------------------------+
```

#### Component Specs

**Differences from Meta Reconnect screen:**

**Step Labels:** LOCATE ACCOUNT | ACCEPT MCC INVITE | ENTER ID

**Step 2 — MCC Invite Emphasis:**
- Above instructions: info callout box
  - `bg: rgba(0,212,255,0.04)`, `border-left: 3px solid #00D4FF`, padding `12px 16px`, `mb: 16px`
  - Text: Inter 15px `#7ECFDF` — "Make It Rain Digital uses a Manager Account (MCC) to access your campaign data without requiring your password."
- "I HAVE ACCEPTED THE INVITE" — secondary button within step card
  - Acts as a checklist confirmation, enables Step 3 card

**Customer ID Input (Step 3):**
- Label: "YOUR GOOGLE ADS CUSTOMER ID" — Orbitron 11px UPPERCASE `#7ECFDF`
- Input: standard input field spec, `width: 240px`
- Auto-format: as user types digits, auto-inserts dashes in XXX-XXX-XXXX format
- Format hint below: Inter 13px `#7ECFDF` — "Format: XXX-XXX-XXXX (10 digits, dashes added automatically)"
- Validation: must be 10 digits when dashes removed
- Error: "INVALID CUSTOMER ID FORMAT" or "CUSTOMER ID NOT FOUND — CHECK YOUR ACCOUNT"

**"VERIFY CONNECTION" Primary Button:**
- Same behavior as Meta VERIFY TOKEN button
- Loading: "VERIFYING CONNECTION..."
- Success: "CONNECTION VERIFIED"

All other component specs, animations, and states follow the same pattern as `rm-settings-integrations-meta-reconnect`.

---

### 4.9 Screen: `rm-settings-account`
**Name:** Account & Billing
**URL:** `/settings/account`
**Priority:** P2 | **Complexity:** Medium | **Animation:** Simple

#### Wireframe

```
+----------------------------------------------------------------------------------------------------------------------------------+
| SIDEBAR (240px)             | MAIN CONTENT AREA                                                                                  |
|                             |                                                                                                    |
| [RM LOGO]                   | HEADER: MARCUS JOHNSON   [Bell]  [Avatar]                                                          |
|                             +----------------------------------------------------------------------------------------------------+
| > SETTINGS [active]         | SETTINGS — ACCOUNT & BILLING                                                                      |
|                             |                                                                                                    |
|                             | +--sub-nav bar--------------------------------------------------------------+                             |
|                             | | TEAM | ROUTING | NOTIFICATIONS | INTEGRATIONS | ACCOUNT [active] |                             |
|                             | +-----------------------------------------------------------------------+                             |
|                             |                                                                                                    |
|                             | ACCOUNT & BILLING                                                                                 |
|                             |                                                                                                    |
|                             | +--section: PACKAGE DETAILS--------------------------------------+                                  |
|                             | | PACKAGE DETAILS                                                 |                                  |
|                             | | ---------------------------------------------------------------  |                                  |
|                             | |                                                                 |                                  |
|                             | | CURRENT PLAN                       RENEWAL DATE               |                                  |
|                             | | RAINMACHINE PRO                    APR 15, 2026               |                                  |
|                             | |                                                                 |                                  |
|                             | | FEATURES INCLUDED                                              |                                  |
|                             | | [Check] Lead Management & Routing                              |                                  |
|                             | | [Check] AI Calling via VAPI                                    |                                  |
|                             | | [Check] Meta & Google Ads Integration                          |                                  |
|                             | | [Check] Performance Analytics Dashboard                        |                                  |
|                             | | [Check] Up to 5 Agents                                         |                                  |
|                             | | [Check] Weekly Intelligence Reports                            |                                  |
|                             | |                                                                 |                                  |
|                             | | [Read-only notice: Contact your MIRD account manager to        |                                  |
|                             | |  modify your plan or billing information.]                      |                                  |
|                             | |                                                                 |                                  |
|                             | +---------------------------------------------------------------+                                  |
|                             |                                                                                                    |
|                             | +--section: BILLING HISTORY--------------------------------------+                                  |
|                             | | BILLING HISTORY                                                 |                                  |
|                             | | ---------------------------------------------------------------  |                                  |
|                             | |                                                                 |                                  |
|                             | | DATE          DESCRIPTION          AMOUNT    STATUS  DOWNLOAD |                                  |
|                             | | MAR 15, 2026  RainMachine Pro — Mar $497.00  PAID    [PDF]    |                                  |
|                             | | FEB 15, 2026  RainMachine Pro — Feb $497.00  PAID    [PDF]    |                                  |
|                             | | JAN 15, 2026  RainMachine Pro — Jan $497.00  PAID    [PDF]    |                                  |
|                             | |                                                                 |                                  |
|                             | +---------------------------------------------------------------+                                  |
|                             |                                                                                                    |
|                             | +--section: SUPPORT----------------------------------------------+                                  |
|                             | | SUPPORT                                                         |                                  |
|                             | | ---------------------------------------------------------------  |                                  |
|                             | |                                                                 |                                  |
|                             | | Have a question or need help? Our team is standing by.         |                                  |
|                             | |                                                                 |                                  |
|                             | | [CONTACT SUPPORT →]          [DOCUMENTATION →]                  |                                  |
|                             | |                                                                 |                                  |
|                             | +---------------------------------------------------------------+                                  |
|                             |                                                                                                    |
+----------------------------------------------------------------------------------------------------------------------------------+
```

#### Component Specs

**Package Details Card:**
- Panel card spec: `bg: #0A1628`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, padding `24px`
- Card header: "PACKAGE DETAILS" — Orbitron 14px 600 `#E8F4F8`, `border-bottom: 1px solid rgba(0,212,255,0.1)`, `pb: 16px`, `mb: 20px`
- Two-column summary row:
  - "CURRENT PLAN" label: Orbitron 11px `#7ECFDF`
  - "RAINMACHINE PRO" value: Orbitron 16px `#00D4FF`
  - "RENEWAL DATE" label: Orbitron 11px `#7ECFDF`
  - Date value: STM 16px `#E8F4F8`
- Features list, `mt: 20px`:
  - Section label: Orbitron 11px `#7ECFDF` — "FEATURES INCLUDED"
  - Each feature: Lucide `CheckCircle` 14px `#00FF88` + Inter 15px `#E8F4F8`, `mb: 8px`
- Read-only notice: `bg: rgba(0,212,255,0.04)`, `border-left: 3px solid rgba(0,212,255,0.3)`, padding `12px 16px`, `mt: 20px`
  - Inter 13px `#7ECFDF`

**Billing History Card:**
- Panel card spec, `mt: 20px`
- Card header: "BILLING HISTORY"
- Table: same data table spec
  - Columns: DATE | DESCRIPTION | AMOUNT | STATUS | DOWNLOAD
  - DATE: STM 13px `#E8F4F8`
  - DESCRIPTION: Inter 13px `#E8F4F8`
  - AMOUNT: STM 13px `#E8F4F8`
  - STATUS: "PAID" — STM 12px `#00FF88` with `bg: rgba(0,255,136,0.08)` pill, `border-radius: 4px`, padding `2px 8px`
  - DOWNLOAD: Lucide `Download` 14px `#00D4FF` + "PDF" Orbitron 11px `#00D4FF`, ghost link behavior

**Support Card:**
- Panel card spec, `mt: 20px`
- Intro text: Inter 15px `#7ECFDF`
- Ghost links: "CONTACT SUPPORT →" and "DOCUMENTATION →"
  - Orbitron 11px UPPERCASE `#00D4FF`, `::after: ' →'`
  - Spacing: `gap: 24px` between links

#### Animations

| Element | Animation | Timing |
|---|---|---|
| Page enter | panel-enter stagger for 3 sections | 400ms, 80ms stagger |
| PDF download | Lucide Download icon brief scale | 150ms |

#### States

| State | Behavior |
|---|---|
| Default (read-only) | All fields display only, no edit affordances |
| PDF download | Opens PDF in new tab |

#### Data Requirements

```
GET /api/settings/account
Response: {
  plan: { name: string, renewalDate: string, features: string[] },
  billing: [{ date: string, description: string, amount: number, status: "paid" | "pending", invoiceUrl: string }],
  support: { contactUrl: string, docsUrl: string }
}
```

---

## 5. Stack Integration

### Libraries

| Library | Usage |
|---|---|
| `react` | Component architecture |
| `react-router-dom` | `/settings/*` routing, sub-nav tabs as routes |
| `lucide-react` | All icons (no emoji, no other icon libraries) |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-and-drop routing rule reordering |
| `react-hook-form` | All form state — add/edit agent modals, token fields |
| `zod` | Schema validation for all form inputs |
| `zustand` | Settings state store (unsaved changes tracking) |
| `react-query` (TanStack Query) | All API calls with cache invalidation |
| `framer-motion` | Panel enter, modal open/close, toast animations |

### Key Patterns

**Settings Shell Layout:**
```
/settings → redirect to /settings/team
/settings/team
/settings/routing
/settings/notifications
/settings/integrations
/settings/integrations/meta/reconnect
/settings/integrations/google/reconnect
/settings/account
```

**Sub-nav:** Rendered as `<NavLink>` components matching the route path. Active detection via `isActive` prop.

**Unsaved Changes Guard:** React Router `useBlocker` hook prevents navigation away when `isDirty` state is true. Shows confirmation dialog.

**Toggle Switch:** Controlled component with `checked` state bound to notification preferences. Syncs to API on save only (not on each toggle).

**Routing Rules Drag and Drop:** `@dnd-kit/sortable` SortableContext wrapping rule cards. On drag end, recompute priority numbers based on new order. Mark form as dirty for save.

**Token Verification:** Debounced input → POST to `/api/integrations/verify` with token → on success animate → redirect with delay.

**Modal Pattern:** Portal-rendered modal using `createPortal` into `document.body`. Accessible with `role="dialog"`, `aria-modal="true"`, `aria-labelledby` referencing modal title.

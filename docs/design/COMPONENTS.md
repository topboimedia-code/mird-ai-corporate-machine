# MIRD Component Library
## Make It Rain Digital | Sigma Protocol Step 6

> Component specifications for all 13 MIRD UI components. Each entry documents variants, states, props, CSS, accessibility requirements, and screen usage across RainMachine, CEO Dashboard, and Onboarding Portal.

---

## Atomic Design Structure

```
Atoms           Molecules           Organisms
──────────      ──────────────      ──────────────────────
Status Dot  →   Status Indicator →  Panel Card
Button          Metric Readout      Navigation Sidebar
Input Field     Progress Ring       Data Table
Tooltip         Lead Avatar         Alert Tray
Icon            Badge               Chart Panel
                                    Onboarding Wizard
```

---

## Component Index

| # | Component | Atom/Molecule/Organism | Screens |
|---|-----------|----------------------|---------|
| 1 | Panel Card | Organism | All |
| 2 | Metric Readout | Molecule | Dashboard KPIs |
| 3 | Status Indicator | Molecule | Agent status, system health |
| 4 | Lead Card | Organism | Lead tables, grids |
| 5 | Progress Ring | Molecule | Health scores |
| 6 | Navigation Sidebar | Organism | RainMachine, CEO |
| 7 | Navigation Tab Bar | Organism | Mobile only |
| 8 | Data Table | Organism | Leads, campaigns, finance |
| 9 | Alert Item | Molecule | CEO alert tray |
| 10 | Input Field | Molecule | Onboarding, settings |
| 11 | Button | Atom | All |
| 12 | Tooltip | Atom | Truncated data, icons |
| 13 | Chart Components | Organism | Analytics panels |

---

## 01 — Panel Card

### Overview
The foundational container for every dashboard section. Every piece of content in the MIRD system lives inside a Panel Card.

### Props
| Prop | Type | Default | Options |
|------|------|---------|---------|
| `variant` | string | `default` | `default`, `loading`, `error`, `empty`, `highlighted` |
| `title` | string | — | Any string |
| `badge` | string | — | Status label string |
| `fullWidth` | boolean | `false` | Spans full grid width |
| `animated` | boolean | `true` | Panel-enter animation on mount |

### Variants & States

**Default**
```css
background:    var(--color-bg-panel);
border:        1px solid var(--color-border-glow);
border-radius: var(--radius-default);
padding:       var(--panel-padding);
box-shadow:    var(--glow-panel);
```

**Hover (interactive panels)**
```css
border-color: var(--color-border-strong);
box-shadow:   var(--glow-panel-hover);
transition:   border-color var(--dur-fast), box-shadow var(--dur-fast);
```

**Loading**
- Content area: `opacity: 0.3`
- Scan-line animation plays once (top to bottom)
- Content replaced with shimmer bars:
  ```css
  .shimmer-bar {
    height: 16px;
    border-radius: var(--radius-sharp);
    background: linear-gradient(90deg,
      var(--color-cyan-dim-trace) 25%,
      var(--color-cyan-dim-soft) 50%,
      var(--color-cyan-dim-trace) 75%
    );
    background-size: 200% 100%;
    animation: shimmer var(--dur-shimmer) ease-in-out infinite;
  }
  ```

**Error**
```css
border-color: var(--color-border-alert);
```
- Header badge text: `[!] SIGNAL LOST`
- Badge color: `--color-status-alert-text`

**Empty**
```
Layout: centered column
  ↓ Icon (32px, --icon-xl, color: --color-text-disabled)
  ↓ Title (Orbitron 13px, --color-text-muted)
  ↓ Body (Inter 13px, --color-text-disabled) — optional
```
Empty state copy examples:
- Leads: "AWAITING INCOMING SIGNALS"
- Campaigns: "NO ACTIVE CAMPAIGNS DETECTED"
- Agents: "AGENT STANDBY — AWAITING FIRST RUN"
- Alerts: "NO ESCALATIONS — ALL SYSTEMS NOMINAL"

**Highlighted**
```css
border-color: var(--color-border-strong);
box-shadow:   var(--glow-panel-hover); /* permanent, not just hover */
```

### Panel Header
```css
.panel-header {
  display:        flex;
  align-items:    center;
  justify-content: space-between;
  padding-bottom: var(--space-4);
  border-bottom:  1px solid rgba(0,212,255,0.10);
  margin-bottom:  var(--space-4);
}

.panel-title {
  font:           600 14px/1.4 var(--font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color:          var(--color-text-primary);
}

.panel-badge {
  font:           400 10px/1.4 var(--font-display);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color:          var(--color-text-muted);
}
```

### Accessibility
- `role="region"` with `aria-label` for the panel title
- Error state: `aria-live="polite"` announces state change
- Loading state: `aria-busy="true"` during load

### Screen Usage
Every screen across all three products.

---

## 02 — Metric Readout

### Overview
Single KPI display — label above, value large, optional delta below. The star of the dashboard composition.

### Props
| Prop | Type | Default | Options |
|------|------|---------|---------|
| `size` | string | `xl` | `xl`, `lg`, `md`, `sm` |
| `label` | string | required | — |
| `value` | number/string | required | — |
| `format` | string | `number` | `number`, `currency`, `percent`, `count` |
| `delta` | number | — | Positive/negative/zero |
| `deltaLabel` | string | — | e.g. "vs last week" |
| `animate` | boolean | `true` | Boot counter animation |

### Size Variants
| Size | Value Font | Delta Font | Label Font |
|------|------------|-----------|------------|
| XL | 48px mono | 13px mono | 11px Orbitron |
| LG | 32px mono | 13px mono | 11px Orbitron |
| MD | 24px mono | 12px mono | 11px Orbitron |
| SM | 16px mono | 11px mono | 10px Orbitron |

### CSS
```css
.metric {
  display:        flex;
  flex-direction: column;
  gap:            var(--space-1);
}

.metric__label {
  font:           400 11px/1.4 var(--font-display);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color:          var(--color-text-muted);
}

.metric__value {
  font:   400 48px/1.0 var(--font-data); /* xl — override size per variant */
  color:  var(--color-text-primary);
}

.metric__delta {
  display:     flex;
  align-items: center;
  gap:         var(--space-1);
  font:        400 13px/1.0 var(--font-data);
}

.metric__delta--positive { color: var(--color-status-success); }
.metric__delta--negative { color: var(--color-status-alert-text); }
.metric__delta--neutral  { color: var(--color-text-muted); }

.metric__delta-period {
  font:           400 10px/1.4 var(--font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color:          var(--color-text-muted);
}
```

### Boot Counter Animation
JavaScript counter from 0 to final value, 1200ms, ease-out cubic. See `MOTION.md` for implementation.

### Accessibility
- Wrap in `<output>` or `aria-live="polite"` region for real-time values
- `aria-label` on outer element: `"{label}: {value}"`
- Delta: `aria-label="{+/-} {value} {period}"`, hidden from main flow

### Screen Usage
- RainMachine: Revenue Today, Leads Today, Appointments, Conversion Rate
- CEO: MRR, Total Revenue, Active Agents, Total Leads
- All KPI summary rows

---

## 03 — Status Indicator

### Overview
Live system state dot + label. The pulse is the heartbeat of the MIRD interface.

### Props
| Prop | Type | Default | Options |
|------|------|---------|---------|
| `state` | string | required | `online`, `processing`, `at-risk`, `offline`, `standby` |
| `label` | string | — | Custom label text |
| `size` | string | `default` | `default`, `sm` |

### State Reference
| State | Dot Color | Animation | Label |
|-------|-----------|-----------|-------|
| `online` | `#00FF88` | pulse 2s infinite | ONLINE |
| `processing` | `#00D4FF` | pulse 1.2s infinite | PROCESSING |
| `at-risk` | `#FF6B35` | flash 3× then static | AT RISK |
| `offline` | `#FF3333` | none | OFFLINE |
| `standby` | `#2A4A5A` | pulse 4s infinite | STANDBY |

### CSS
```css
.status-indicator {
  display:     flex;
  align-items: center;
  gap:         var(--space-2);
}

.status-dot {
  width:         8px;
  height:        8px;
  border-radius: var(--radius-full);
  flex-shrink:   0;
}

.status-dot.online {
  background: #00FF88;
  box-shadow: var(--glow-status-online);
  animation:  system-pulse var(--dur-pulse) ease-in-out infinite;
}

.status-dot.processing {
  background: #00D4FF;
  box-shadow: var(--glow-status-proc);
  animation:  system-pulse 1.2s ease-in-out infinite;
}

.status-dot.at-risk {
  background: #FF6B35;
  box-shadow: var(--glow-status-alert);
  animation:  alert-flash 0.8s ease-in-out 3;
}

.status-dot.offline {
  background: #FF3333;
  box-shadow: none;
  animation:  none;
}

.status-dot.standby {
  background: #2A4A5A;
  box-shadow: none;
  animation:  system-pulse 4s ease-in-out infinite;
}

.status-label {
  font:           400 11px/1.4 var(--font-display);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color:          var(--color-text-muted);
}
```

### Accessibility
- `role="status"` on the indicator container
- `aria-label="System status: {state}"` on the dot
- Static visible label (not icon-only)

### Screen Usage
- RainMachine header: system status
- Agent cards: agent operational state
- CEO dashboard: department health indicators
- Sidebar footer: connection state

---

## 04 — Lead Card

### Overview
Represents a single lead in list or table views.

### Variants
| Variant | Layout | Use |
|---------|--------|-----|
| `row` | Horizontal, table-like | Leads table (desktop) |
| `card` | Vertical, boxed | Grid view option |
| `compact` | Minimal row | Mobile / dense lists |

### Row Variant
```css
.lead-row {
  display:        flex;
  align-items:    center;
  gap:            var(--space-4);
  padding:        var(--space-3) var(--space-4);
  border-bottom:  1px solid var(--color-border-subtle);
  transition:     background var(--dur-fast);
  cursor:         pointer;
}

.lead-row:hover {
  background:  var(--color-cyan-dim-trace);
  border-left: 2px solid var(--color-cyan-primary);
  padding-left: calc(var(--space-4) - 2px);
}

.lead-avatar {
  width:         32px;
  height:        32px;
  border-radius: var(--radius-full);
  border:        1px solid rgba(0,212,255,0.30);
  background:    var(--color-cyan-dim-trace);
  font:          600 12px/32px var(--font-display);
  text-align:    center;
  color:         var(--color-cyan-primary);
  flex-shrink:   0;
  text-transform: uppercase;
}

.lead-name {
  font:           400 13px/1.4 var(--font-display);
  letter-spacing: 0.06em;
  color:          var(--color-text-primary);
}

.lead-org {
  font:  400 12px/1.4 var(--font-body);
  color: var(--color-text-muted);
}

.lead-meta {
  font:  400 11px/1.4 var(--font-data);
  color: var(--color-text-muted);
}
```

### Stage Badge CSS
```css
.badge {
  display:        inline-flex;
  align-items:    center;
  padding:        3px 10px;
  border-radius:  var(--radius-sharp);
  border:         1px solid;
  font:           400 10px/1.4 var(--font-display);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  white-space:    nowrap;
}

.badge--new       { background: rgba(0,212,255,0.12); border-color: rgba(0,212,255,0.40); color: #00D4FF; }
.badge--contacted { background: rgba(255,184,0,0.12); border-color: rgba(255,184,0,0.40); color: #FFB800; }
.badge--appt-set  { background: rgba(0,255,136,0.12); border-color: rgba(0,255,136,0.40); color: #00FF88; }
.badge--closed    { background: rgba(0,255,136,0.20); border-color: rgba(0,255,136,0.60); color: #00FF88; }
.badge--lost      { background: rgba(255,107,53,0.08); border-color: rgba(255,107,53,0.20); color: #FF7D52; }
```

### Accessibility
- Rows are `role="row"` within `role="rowgroup"`
- Stage badge: `aria-label="Stage: {stage name}"`
- Active row: `aria-selected="true"`

---

## 05 — Progress Ring

### Overview
SVG circular progress indicator for percentage metrics and health scores.

### Props
| Prop | Type | Default | Options |
|------|------|---------|---------|
| `size` | string | `md` | `lg`, `md`, `sm` |
| `value` | number | required | 0–100 |
| `health` | string | auto | `high`, `medium`, `low` |
| `animate` | boolean | `true` | Draw on mount |
| `label` | boolean | `true` | Show value in center |

### Size Reference
| Size | Radius | Stroke | Label Size | `viewBox` |
|------|--------|--------|------------|-----------|
| LG | 40px | 3px | 16px | `0 0 100 100` |
| MD | 28px | 2.5px | 12px | `0 0 68 68` |
| SM | 20px | 2px | 10px | `0 0 52 52` |

### Health Threshold (auto-select color)
| Health | Range | Color |
|--------|-------|-------|
| High | 70–100% | `#00FF88` |
| Medium | 40–69% | `#FFB800` |
| Low | 0–39% | `#FF6B35` |

### HTML Structure
```html
<div class="progress-ring progress-ring--md">
  <svg viewBox="0 0 68 68">
    <!-- Track ring -->
    <circle class="progress-ring__track"
      cx="34" cy="34" r="28"
      stroke-width="2.5" />
    <!-- Progress arc -->
    <circle class="progress-ring__fill health-high"
      cx="34" cy="34" r="28"
      stroke-width="2.5" />
  </svg>
  <span class="progress-ring__label">74%</span>
</div>
```

### CSS
```css
.progress-ring {
  position: relative;
  display:  inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-ring__label {
  position: absolute;
  font:     400 12px/1 var(--font-data);
  color:    var(--color-text-primary);
}

.progress-ring__track {
  stroke: rgba(0,212,255,0.10);
  fill:   none;
}

.progress-ring__fill {
  fill:              none;
  stroke-linecap:    round;
  transform:         rotate(-90deg);
  transform-origin:  center;
  transition:        stroke-dashoffset var(--dur-draw) var(--ease-standard);
}

.progress-ring__fill.health-high   { stroke: #00FF88; filter: drop-shadow(0 0 4px #00FF88); }
.progress-ring__fill.health-medium { stroke: #FFB800; filter: drop-shadow(0 0 4px #FFB800); }
.progress-ring__fill.health-low    { stroke: #FF6B35; filter: drop-shadow(0 0 4px #FF6B35); }
```

### Accessibility
- `role="meter"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`
- `aria-label="{metric name}: {value}%"`

---

## 06 — Navigation Sidebar

### Overview
Primary navigation for RainMachine and CEO dashboards. Collapsible.

### States
| State | Width | Labels | Behavior |
|-------|-------|--------|---------|
| Expanded | 240px | Visible | Default on desktop |
| Collapsed | 64px | Hidden | Icon-only, tooltip on hover |
| Mobile hidden | 0 | — | Hidden below 768px |

### Structure
```
Sidebar (240px)
├── Logo Area (logomark + "RAINMACHINE")
├── Nav Section — Primary
│   ├── Nav Item (icon + label) × N
├── Divider
├── Nav Section — Utility
│   ├── Settings
│   └── Help
└── User Area (avatar + name + logout)
```

### CSS
```css
.sidebar {
  width:          240px;
  height:         100vh;
  background:     rgba(10,22,40,0.95);
  border-right:   1px solid rgba(0,212,255,0.15);
  display:        flex;
  flex-direction: column;
  position:       sticky;
  top:            0;
  transition:     width var(--dur-fast) var(--ease-standard);
  overflow:       hidden;
}

.sidebar.collapsed      { width: 64px; }
.sidebar.collapsed .nav-label { opacity: 0; pointer-events: none; transition: opacity var(--dur-fast); }

.nav-section-title {
  font:           400 9px/1.4 var(--font-display);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color:          var(--color-text-disabled);
  padding:        var(--space-4) var(--space-5) var(--space-2);
}

.nav-item {
  display:        flex;
  align-items:    center;
  gap:            var(--space-3);
  padding:        var(--space-3) var(--space-5);
  font:           400 11px/1.4 var(--font-display);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color:          var(--color-text-muted);
  cursor:         pointer;
  transition:     background var(--dur-fast), color var(--dur-fast);
  border-left:    2px solid transparent;
  text-decoration: none;
}

.nav-item:hover {
  background: var(--color-cyan-dim-soft);
  color:      var(--color-text-primary);
}

.nav-item.active {
  background:   var(--color-cyan-dim-soft);
  color:        var(--color-cyan-primary);
  border-color: var(--color-cyan-primary);
  padding-left: calc(var(--space-5) - 2px);
}

.nav-icon { width: 20px; height: 20px; flex-shrink: 0; color: inherit; }

.sidebar-divider {
  height:     1px;
  background: rgba(0,212,255,0.10);
  margin:     var(--space-3) var(--space-4);
}
```

### User Area
```css
.sidebar-user {
  display:     flex;
  align-items: center;
  gap:         var(--space-3);
  padding:     var(--space-4) var(--space-5);
  margin-top:  auto;
  border-top:  1px solid rgba(0,212,255,0.10);
}

.user-avatar {
  width:         36px;
  height:        36px;
  border-radius: var(--radius-full);
  border:        1px solid var(--color-border-glow);
  background:    var(--color-bg-panel-hover);
  flex-shrink:   0;
}

.user-name {
  font:           400 11px/1.4 var(--font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color:          var(--color-text-primary);
}

.user-role {
  font:  400 10px/1.4 var(--font-data);
  color: var(--color-text-muted);
}
```

### Accessibility
- `role="navigation"` with `aria-label="Primary navigation"`
- Active item: `aria-current="page"`
- Collapsed state: show tooltips with full nav item name
- Collapse toggle: `aria-expanded` attribute

---

## 07 — Navigation Tab Bar

### Overview
Fixed bottom navigation for screens below 768px. Replaces sidebar on mobile.

### Display Rule
```css
.tab-bar         { display: none; }
@media (max-width: 767px) { .tab-bar { display: flex; } }
```

### CSS
```css
.tab-bar {
  position:       fixed;
  bottom:         0; left: 0; right: 0;
  height:         60px;
  background:     rgba(10,22,40,0.98);
  border-top:     1px solid rgba(0,212,255,0.15);
  display:        flex;
  align-items:    stretch;
  padding-bottom: env(safe-area-inset-bottom);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index:        var(--z-panel);
}

.tab-item {
  flex:           1;
  display:        flex;
  flex-direction: column;
  align-items:    center;
  justify-content: center;
  gap:            2px;
  color:          var(--color-text-muted);
  cursor:         pointer;
  position:       relative;
  transition:     color var(--dur-fast);
}

.tab-item.active {
  color:      var(--color-cyan-primary);
}

.tab-item.active::before {
  content:    '';
  position:   absolute;
  top:        0; left: 20%; right: 20%;
  height:     2px;
  background: var(--color-cyan-primary);
  border-radius: 0 0 var(--radius-default) var(--radius-default);
}

.tab-icon  { width: 22px; height: 22px; }
.tab-label {
  font:           400 10px/1 var(--font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

### Accessibility
- `role="tablist"` on container, `role="tab"` on each item
- `aria-selected="true"` on active item
- `aria-label` on each tab item

---

## 08 — Data Table

### Overview
Tabular data for leads, campaigns, agents, and finance.

### CSS
```css
.data-table-wrapper { overflow-x: auto; }

.data-table {
  width:            100%;
  border-collapse:  collapse;
  table-layout:     fixed;
}

.data-table thead tr { border-bottom: 1px solid rgba(0,212,255,0.15); }

.data-table th {
  font:           400 11px/1.4 var(--font-display);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color:          var(--color-text-muted);
  padding:        var(--space-3) var(--space-4);
  text-align:     left;
  white-space:    nowrap;
  cursor:         pointer;
  user-select:    none;
}

.data-table th:hover { color: var(--color-text-primary); }

.data-table td {
  padding:     var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-subtle);
  font:        400 13px/1.5 var(--font-data);
  color:       var(--color-text-primary);
  white-space: nowrap;
  overflow:    hidden;
  text-overflow: ellipsis;
}

.data-table tbody tr:nth-child(even) td {
  background: var(--color-cyan-dim-trace);
}

.data-table tbody tr:hover td {
  background: var(--color-cyan-dim-soft);
}

.data-table tbody tr:hover td:first-child {
  border-left:  2px solid var(--color-cyan-primary);
  padding-left: calc(var(--space-4) - 2px);
}

/* Sort indicator */
.th-sort { display: flex; align-items: center; gap: var(--space-1); }
.sort-icon        { width: 12px; height: 12px; color: var(--color-text-disabled); }
.sort-icon.active { color: var(--color-cyan-primary); filter: drop-shadow(0 0 3px rgba(0,212,255,0.6)); }
```

### Table Actions Row
```css
.table-toolbar {
  display:         flex;
  align-items:     center;
  justify-content: space-between;
  gap:             var(--space-4);
  padding-bottom:  var(--space-4);
  border-bottom:   1px solid var(--color-border-subtle);
  margin-bottom:   var(--space-3);
}
```

### Accessibility
- `role="table"` (or native `<table>`)
- `scope="col"` on all `<th>` elements
- Sortable columns: `aria-sort="ascending"` / `"descending"` / `"none"`
- Row click: ensure keyboard focus and Enter key support

---

## 09 — Alert Item

### Overview
Actionable alert in the CEO Dashboard alert tray. Left-border severity indicator is the primary visual differentiator.

### Severity Levels
| Level | Left Border | Background | Use |
|-------|------------|-----------|-----|
| `critical` | `3px solid #FF6B35` | `rgba(255,107,53,0.04)` | Offline agents, auth failures |
| `warning` | `3px solid #FFB800` | `rgba(255,184,0,0.04)` | CPL spike, conversion drop |
| `info` | `3px solid #00D4FF` | `rgba(0,212,255,0.04)` | New lead volumes, updates |

### CSS
```css
.alert-item {
  padding:        var(--space-3) var(--space-4);
  border-radius:  0 var(--radius-default) var(--radius-default) 0;
  margin-bottom:  var(--space-2);
  display:        grid;
  grid-template-rows: auto auto auto;
  gap:            var(--space-1);
}

.alert-item.critical { border-left: 3px solid #FF6B35; background: rgba(255,107,53,0.04); }
.alert-item.warning  { border-left: 3px solid #FFB800; background: rgba(255,184,0,0.04); }
.alert-item.info     { border-left: 3px solid #00D4FF; background: rgba(0,212,255,0.04); }

.alert-category {
  font:           400 10px/1.4 var(--font-display);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color:          var(--color-text-muted);
}

.alert-detail {
  font:  400 14px/1.5 var(--font-body);
  color: var(--color-text-primary);
}

.alert-footer {
  display:         flex;
  align-items:     center;
  justify-content: space-between;
}

.alert-source {
  font:  400 11px/1.4 var(--font-data);
  color: var(--color-text-muted);
}

.alert-action {
  font:           400 11px/1.0 var(--font-display);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color:          var(--color-cyan-primary);
  cursor:         pointer;
  background:     none;
  border:         none;
  padding:        0;
}
.alert-action::after { content: ' →'; }
.alert-action:hover  { color: var(--color-cyan-primary-hover); }
```

### Accessibility
- Critical alerts: `role="alert"` (announced immediately)
- Warning/info: `role="status"` (polite announcement)
- Alert action: keyboard focusable `<button>`

---

## 10 — Input Field

### Overview
Form data entry in the Onboarding Portal and settings. The focus state is the most important micro-interaction in the onboarding experience.

### CSS
```css
.field { display: flex; flex-direction: column; gap: var(--space-2); }

.field-label {
  font:           400 11px/1.4 var(--font-display);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color:          var(--color-text-muted);
}

.field-label.required::after {
  content: ' *';
  color:   var(--color-status-alert-text);
}

.field-input {
  width:          100%;
  background:     var(--color-cyan-dim-trace);
  border:         1px solid var(--color-border-glow);
  border-radius:  var(--radius-default);
  padding:        var(--space-3) var(--space-4);
  font:           400 15px/1.5 var(--font-body);
  color:          var(--color-text-primary);
  transition:     border-color var(--dur-fast), box-shadow var(--dur-fast);
}

.field-input::placeholder { color: var(--color-text-disabled); }

.field-input:focus {
  outline:      none;
  border-color: var(--color-cyan-primary);
  box-shadow:   var(--glow-focus);
}

.field-input.error {
  border-color: rgba(255,107,53,0.60);
  box-shadow:   0 0 0 3px rgba(255,107,53,0.10);
}

.field-input:disabled {
  background:   var(--color-cyan-dim-trace);
  border-color: var(--color-border-subtle);
  color:        var(--color-text-disabled);
  cursor:       not-allowed;
}

.field-error {
  font:  400 12px/1.4 var(--font-body);
  color: var(--color-status-alert-text);
}

.field-hint {
  font:  400 12px/1.4 var(--font-body);
  color: var(--color-text-muted);
}
```

### Additional Types
- **Select**: Same styling as input, custom chevron icon in cyan
- **Textarea**: Same styling, `resize: vertical`, min-height 100px
- **Checkbox**: Custom 16×16px box, cyan checkmark on check, border `--color-border-glow`

### Accessibility
- `<label>` always associated via `for` / `id` pair
- Error message: `role="alert"` with `aria-describedby` linking to input
- Required: `aria-required="true"` on input, asterisk is decorative

---

## 11 — Button

### Overview
CTAs across all three products. All variants use Orbitron uppercase — buttons are commands.

### Variants
| Variant | Use Case | Feel |
|---------|----------|------|
| `primary` | Main CTA, submit forms | Solid JARVIS cyan — decisive |
| `secondary` | Alternative action | Ghost border — present but not dominant |
| `ghost` | Inline navigation links | Minimal — link-like with → arrow |
| `destructive` | Delete, disconnect | Warm orange — danger signal |
| `icon-only` | Toolbar actions | 44×44px minimum hit target |

### Loading State (all variants)
```css
.btn.loading {
  pointer-events: none;
  opacity: 0.7;
  /* Replace label with spinner or "PROCESSING..." text */
}
```

### Full CSS (see DESIGN-SYSTEM.md Section 8.11)

### Size Variants
| Size | Padding | Font Size |
|------|---------|-----------|
| Default | `12px 24px` | 13px |
| SM | `8px 16px` | 11px |
| Icon | `10px` | — |

### Accessibility
- `type="button"` on all non-submit buttons
- `aria-disabled="true"` on disabled state (not `disabled` attribute — preserves keyboard focus)
- Loading state: `aria-busy="true"`, visually-hidden `<span>` with "Loading..."
- Icon-only: `aria-label` required

---

## 12 — Tooltip

### Overview
Supplementary information on hover. For truncated data and icon button labels.

### Trigger Rules
- Show on hover: 300ms delay
- Show on focus: immediate
- Hide on mouse-leave or blur: 150ms fade out
- Max width: 240px
- Position: above by default, flips if no room

### CSS
```css
.tooltip-wrapper { position: relative; display: inline-flex; }

.tooltip {
  position:       absolute;
  bottom:         calc(100% + 8px);
  left:           50%;
  transform:      translateX(-50%);
  background:     var(--color-bg-panel-hover);
  border:         1px solid rgba(0,212,255,0.30);
  border-radius:  var(--radius-default);
  padding:        var(--space-2) var(--space-3);
  font:           400 12px/1.5 var(--font-body);
  color:          var(--color-text-primary);
  white-space:    nowrap;
  max-width:      240px;
  white-space:    normal;
  box-shadow:     0 4px 16px rgba(0,0,0,0.40);
  pointer-events: none;
  opacity:        0;
  transition:     opacity var(--dur-flash);
  z-index:        var(--z-tooltip);
}

.tooltip-wrapper:hover .tooltip,
.tooltip-wrapper:focus-within .tooltip { opacity: 1; }
```

### Accessibility
- `role="tooltip"` with `id`
- Trigger: `aria-describedby="{tooltip-id}"`

---

## 13 — Chart Components

### Overview
Data visualization for analytics panels. All charts must feel like live intelligence feeds.

### Global Chart Rules
1. No chart titles inside the chart — title lives in panel header
2. Minimal decoration — grid lines are barely visible
3. Hover states use the `.tooltip` component style
4. All charts respond to `prefers-reduced-motion` (skip entrance animation)

### Line Chart (MRR Trend, CPL Trend)

**Configuration (Recharts):**
```jsx
<LineChart data={data}>
  <CartesianGrid
    strokeDasharray="0"
    stroke="rgba(0,212,255,0.06)"
    horizontal={true}
    vertical={false}
  />
  <XAxis
    stroke="#7ECFDF"
    tick={{ fontFamily: 'Share Tech Mono', fontSize: 11, fill: '#7ECFDF' }}
    axisLine={{ stroke: 'rgba(0,212,255,0.15)' }}
    tickLine={false}
  />
  <YAxis
    stroke="#7ECFDF"
    tick={{ fontFamily: 'Share Tech Mono', fontSize: 11, fill: '#7ECFDF' }}
    axisLine={false}
    tickLine={false}
  />
  <Tooltip content={<CustomTooltip />} />
  <defs>
    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.15} />
      <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
    </linearGradient>
  </defs>
  <Area type="monotone" dataKey="value" fill="url(#lineGradient)" stroke="none" />
  <Line
    type="monotone"
    dataKey="value"
    stroke="#00D4FF"
    strokeWidth={2}
    dot={false}
    activeDot={{ r: 4, fill: '#00D4FF', stroke: '#050D1A', strokeWidth: 2 }}
  />
</LineChart>
```

### Sparkline (7-day inline trend)
- 28px height, no axes, no labels, no grid
- Single line, color = parent metric health
- Used inline in metric panels

### Horizontal Bar Chart (Lead Sources)
```css
.bar-row {
  display:     flex;
  align-items: center;
  gap:         var(--space-3);
  margin-bottom: var(--space-2);
}
.bar-label {
  font:        400 11px/1 var(--font-display);
  color:       var(--color-text-muted);
  width:       80px;
  text-align:  right;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.bar-track {
  flex:        1;
  height:      8px;
  background:  var(--color-cyan-dim-trace);
  border-radius: var(--radius-sharp);
}
.bar-fill {
  height:      100%;
  border-radius: 0 var(--radius-sharp) var(--radius-sharp) 0;
  transition:  width var(--dur-draw) var(--ease-standard);
}
.bar-fill.meta    { background: var(--color-platform-meta); }
.bar-fill.google  { background: var(--color-platform-google); }
.bar-fill.organic { background: var(--color-platform-organic); }
.bar-value {
  font:  400 12px/1 var(--font-data);
  color: var(--color-text-primary);
  width: 48px;
}
```

### Pipeline Funnel
- Horizontal segments proportional to stage count
- Each segment color: `#00D4FF` at varying opacity (100% → 30%)
- Count centered in each segment in Share Tech Mono
- Hover: segment brightens 20% opacity + tooltip

### Accessibility
- Wrap chart in `figure` with `figcaption`
- Provide data table alternative accessible via "View as table" toggle
- ARIA attributes on interactive chart elements

---

*MIRD Component Library | Sigma Protocol Step 6*
*See also: [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) | [TOKENS.md](./TOKENS.md) | [MOTION.md](./MOTION.md) | [ICONS.md](./ICONS.md)*

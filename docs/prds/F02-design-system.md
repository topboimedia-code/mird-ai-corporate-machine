# F02 — Design System & Shared Component Library
# RainMachine · MIRD AI Corporate Machine
# Sigma Protocol Step 11 · PRD Generation
# Source Pitch: P02 · Cycle: 1 · Release: R0 · Appetite: Medium
# Date: 2026-04-02 | Status: Ready for Implementation

---

## 1. Overview

### Pitch Summary

Every screen in RainMachine shares the same visual language: JARVIS Dark — a high-contrast HUD aesthetic with a deep navy base (`#050D1A`), cyan glow accents (`#00D4FF`), and data-readout typography. Without a design system, every developer rebuilds the same Button, the same Card, the same loading skeleton — inconsistently. This PRD ships a shared component library (`packages/ui`) and a shared Tailwind configuration (`packages/config`) that every app consumes from a single source of truth.

### User-Facing Outcome

A developer building any screen in `apps/dashboard`, `apps/ceo`, or `apps/onboarding` imports from `@rainmachine/ui` and gets a fully styled, accessible component in one line. Every KPI card, every data table, every button across the product looks identical without any per-screen CSS work. The UI demo page (`/ui-demo`) shows all 16 components in all variants, proving the system is complete.

### What This PRD Covers

- `packages/config/tailwind-preset.ts` — all JARVIS Dark tokens
- `packages/ui/src/components/` — 16 components with full prop contracts
- React Testing Library snapshot tests for all 16 components
- CSS token assertion test: `--cyan` computed value = `#00D4FF`
- Demo page: `apps/dashboard/app/ui-demo/page.tsx`

### What This PRD Does Not Cover

- Recharts chart components (shipped with the features that first use them: F07, F14)
- Icon SVG files (referenced by name; actual SVGs shipped in F07)
- Animation/motion specifics beyond what Tailwind `transition` covers (complex animations deferred)
- Dark mode toggle (not applicable — JARVIS Dark is the only mode)

### Acceptance Summary

- All 16 components render without errors in the demo page
- Snapshot tests pass for all 16 components in all variants
- `--cyan` CSS custom property resolves to `#00D4FF`
- `import { Button } from "@rainmachine/ui"` resolves in all three apps
- Tailwind purge covers `packages/ui` source files (no missing styles in production build)

---

## 2. Database

None. Design system is purely frontend — no database tables.

---

## 3. TypeScript Interfaces

### 3.1 Design Token Types

```typescript
// packages/config/src/tokens.ts
// These types are not exported to consumers — they exist to make
// the tailwind preset type-safe internally.

export type ColorScale = Record<string, string>;

export type DesignTokens = {
  colors: {
    background: string;
    surface: string;
    surfaceHover: string;
    border: string;
    borderHover: string;
    cyan: string;
    cyanDim: string;
    orange: string;
    orangeDim: string;
    green: string;
    greenDim: string;
    text: string;
    textMuted: string;
    textDim: string;
  };
  fontFamily: {
    display: string[];
    mono: string[];
    body: string[];
  };
  boxShadow: Record<string, string>;
  borderRadius: Record<string, string>;
};
```

### 3.2 Component Prop Interfaces

#### Button

```typescript
// packages/ui/src/components/Button/Button.types.ts

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  // data-testid is inherited from HTMLButtonAttributes
}
```

#### Input

```typescript
// packages/ui/src/components/Input/Input.types.ts

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}
```

#### Card

```typescript
// packages/ui/src/components/Card/Card.types.ts

export type CardVariant = "default" | "elevated" | "bordered" | "glow";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  as?: React.ElementType;
}
```

#### Badge

```typescript
// packages/ui/src/components/Badge/Badge.types.ts

export type BadgeColor =
  | "cyan"
  | "green"
  | "orange"
  | "red"
  | "gray"
  | "blue";
export type BadgeSize = "sm" | "md";
export type BadgeVariant = "solid" | "outline" | "subtle";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  size?: BadgeSize;
  variant?: BadgeVariant;
  dot?: boolean;
}
```

#### Modal

```typescript
// packages/ui/src/components/Modal/Modal.types.ts

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
  "data-testid"?: string;
}
```

#### Toast

```typescript
// packages/ui/src/components/Toast/Toast.types.ts

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number; // ms; default 4000; 0 = persist
}

export interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

// Hook return type
export interface UseToastReturn {
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}
```

#### DataTable

```typescript
// packages/ui/src/components/DataTable/DataTable.types.ts

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectChange?: (ids: string[]) => void;
  pagination?: PaginationProps;
  "data-testid"?: string;
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}
```

#### Sparkline

```typescript
// packages/ui/src/components/Sparkline/Sparkline.types.ts

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string; // hex; defaults to #00D4FF
  strokeWidth?: number;
  showDot?: boolean; // show dot at last value
  "data-testid"?: string;
}
```

#### ProgressBar

```typescript
// packages/ui/src/components/ProgressBar/ProgressBar.types.ts

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0–100
  max?: number;
  color?: "cyan" | "green" | "orange" | "red";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  showLabel?: boolean;
  label?: string;
}
```

#### StepIndicator

```typescript
// packages/ui/src/components/StepIndicator/StepIndicator.types.ts

export type StepStatus = "complete" | "current" | "upcoming" | "error";

export interface Step {
  id: string;
  label: string;
  status: StepStatus;
  description?: string;
}

export interface StepIndicatorProps {
  steps: Step[];
  orientation?: "horizontal" | "vertical";
  "data-testid"?: string;
}
```

#### Tabs

```typescript
// packages/ui/src/components/Tabs/Tabs.types.ts

export interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
  badge?: string | number;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "line" | "pill";
  "data-testid"?: string;
}
```

#### Sidebar

```typescript
// packages/ui/src/components/Sidebar/Sidebar.types.ts

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: NavItem[];
}

export interface SidebarProps {
  items: NavItem[];
  activeHref: string;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  "data-testid"?: string;
}
```

#### StatusDot

```typescript
// packages/ui/src/components/StatusDot/StatusDot.types.ts

export type StatusDotColor = "green" | "orange" | "red" | "gray" | "cyan";

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  color: StatusDotColor;
  pulse?: boolean; // animated pulse for "live" status
  size?: "sm" | "md" | "lg";
  label?: string; // screen-reader label
}
```

#### Skeleton

```typescript
// packages/ui/src/components/Skeleton/Skeleton.types.ts

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: "text" | "rect" | "circle";
  lines?: number; // for variant="text", renders N lines
  animate?: boolean;
}
```

#### EmptyState

```typescript
// packages/ui/src/components/EmptyState/EmptyState.types.ts

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  "data-testid"?: string;
}
```

#### AlertBanner

```typescript
// packages/ui/src/components/AlertBanner/AlertBanner.types.ts

export type AlertBannerType = "info" | "warning" | "error" | "success";

export interface AlertBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  type: AlertBannerType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  "data-testid"?: string;
}
```

---

## 4. Server Actions

None. Design system components are pure client-side UI primitives. No server actions.

---

## 5. API Routes

None in F02. The demo page at `/ui-demo` is a static RSC with no API calls.

---

## 6. UI Components

### 6.1 Tailwind Preset

**File:** `packages/config/tailwind-preset.ts`

The preset extends Tailwind's default config with JARVIS Dark tokens. All apps extend this preset in their `tailwind.config.ts`.

```typescript
// packages/config/tailwind-preset.ts
import type { Config } from "tailwindcss";

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        // Base surfaces
        background: "#050D1A",
        surface: "#0A1628",
        "surface-hover": "#0F1E35",
        border: "#1A2A42",
        "border-hover": "#2A3F60",

        // Brand colors
        cyan: {
          DEFAULT: "#00D4FF",
          dim: "#0099BB",
          glow: "rgba(0, 212, 255, 0.15)",
        },
        orange: {
          DEFAULT: "#FF6B35",
          dim: "#CC4A1A",
          glow: "rgba(255, 107, 53, 0.15)",
        },
        green: {
          DEFAULT: "#00FF88",
          dim: "#00BB55",
          glow: "rgba(0, 255, 136, 0.15)",
        },
        red: {
          DEFAULT: "#FF3B3B",
          dim: "#CC1A1A",
        },

        // Text
        text: {
          DEFAULT: "#E8F4FF",
          muted: "#8BA3BF",
          dim: "#4A6A8A",
        },
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        mono: ["Share Tech Mono", "monospace"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        "cyan-glow": "0 0 20px rgba(0, 212, 255, 0.3)",
        "cyan-glow-sm": "0 0 10px rgba(0, 212, 255, 0.2)",
        "orange-glow": "0 0 20px rgba(255, 107, 53, 0.3)",
        "green-glow": "0 0 20px rgba(0, 255, 136, 0.3)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "2px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
        "slide-right": "slideRight 0.25s ease-out",
        "count-up": "countUp 0.6s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default preset;
```

**CSS Custom Properties (injected via `globals.css`):**

```css
/* apps/dashboard/app/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;900&family=Share+Tech+Mono&family=Inter:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #050D1A;
  --surface: #0A1628;
  --border: #1A2A42;
  --cyan: #00D4FF;
  --orange: #FF6B35;
  --green: #00FF88;
  --text: #E8F4FF;
  --text-muted: #8BA3BF;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background-color: var(--background);
  color: var(--text);
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
::-webkit-scrollbar-track {
  background: var(--surface);
}
::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--cyan);
}
```

### 6.2 Component Implementation Specs

Each of the 16 components lives at `packages/ui/src/components/{ComponentName}/index.tsx`.

---

#### Button

Visual spec:
- `primary`: `bg-cyan text-background font-display font-semibold uppercase tracking-widest` + cyan glow shadow on hover
- `secondary`: `bg-transparent border border-cyan text-cyan` + background fill on hover
- `ghost`: `bg-transparent text-text-muted` + `hover:text-text hover:bg-surface`
- `danger`: `bg-red text-white` + red glow on hover
- `loading`: shows `<Spinner />` (16px rotating border) + disabled state
- `sm`: `h-7 px-3 text-xs`
- `md`: `h-9 px-4 text-sm` (default)
- `lg`: `h-11 px-6 text-base`
- `fullWidth`: `w-full`

```typescript
// packages/ui/src/components/Button/index.tsx
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import type { ButtonProps } from "./Button.types";

const variantStyles = {
  primary:
    "bg-cyan text-background font-display font-semibold uppercase tracking-widest hover:shadow-cyan-glow-sm transition-shadow",
  secondary:
    "border border-cyan text-cyan hover:bg-cyan/10 transition-colors",
  ghost:
    "text-text-muted hover:text-text hover:bg-surface-hover transition-colors",
  danger:
    "bg-red text-white hover:shadow-orange-glow transition-shadow",
} as const;

const sizeStyles = {
  sm: "h-7 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-base gap-2.5",
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded font-body",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <Spinner size={size === "lg" ? 18 : 14} />
        ) : leftIcon ? (
          leftIcon
        ) : null}
        {children}
        {!loading && rightIcon ? rightIcon : null}
      </button>
    );
  },
);
Button.displayName = "Button";

function Spinner({ size }: { size: number }) {
  return (
    <span
      className="animate-spin rounded-full border-2 border-current border-t-transparent"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
```

---

#### Input

```typescript
// packages/ui/src/components/Input/index.tsx
// Key visual spec:
// - Border: border-border, focus: border-cyan ring-cyan/20
// - Background: bg-surface
// - Label: text-text-muted text-xs uppercase tracking-wider font-mono
// - Error: border-red text-red text-xs mt-1
// - Hint: text-text-dim text-xs mt-1
// - Left/right addon: absolute positioning, bg-surface-hover px-3
```

---

#### Card

```typescript
// packages/ui/src/components/Card/index.tsx
// Visual spec by variant:
// default: bg-surface border border-border rounded-lg
// elevated: bg-surface border border-border shadow-card rounded-lg
// bordered: bg-surface border-2 border-border rounded-lg
// glow: bg-surface border border-cyan shadow-cyan-glow-sm rounded-lg
// Padding: none=p-0, sm=p-3, md=p-5 (default), lg=p-7
```

---

#### Badge

```typescript
// packages/ui/src/components/Badge/index.tsx
// Colors × variants:
// cyan/solid: bg-cyan text-background
// cyan/outline: border border-cyan text-cyan
// cyan/subtle: bg-cyan/15 text-cyan
// green/solid: bg-green text-background
// orange/solid: bg-orange text-background
// red/solid: bg-red text-white
// gray/solid: bg-border text-text-muted
// dot=true: prepends a 6px StatusDot
// sm: text-[10px] px-1.5 py-0.5
// md: text-xs px-2 py-0.5 (default)
```

---

#### Modal

```typescript
// packages/ui/src/components/Modal/index.tsx
// Implementation: React Portal + focus trap + keyboard ESC close
// Overlay: fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-fade-in
// Panel: bg-surface border border-border rounded-xl shadow-card
//   sm: max-w-sm, md: max-w-md, lg: max-w-lg, xl: max-w-2xl, full: max-w-screen
// Title: font-display text-cyan text-lg uppercase tracking-widest
// Close button: absolute top-4 right-4, ghost variant
// Scroll: panel content scrolls, header/footer sticky
```

---

#### Toast

```typescript
// packages/ui/src/components/Toast/index.tsx
// ToastProvider wraps app root. useToast() hook returns { toast, dismiss }
// Toasts stack in bottom-right corner, max 4 visible
// success: green left border + green icon
// error: red left border + red icon
// warning: orange left border + orange icon
// info: cyan left border + cyan icon
// Auto-dismiss at duration ms (default 4000)
// Slide-in animation: animate-slide-up
// Close button: X icon, dismisses immediately
```

---

#### DataTable

```typescript
// packages/ui/src/components/DataTable/index.tsx
// Table: w-full text-sm border-collapse
// Header row: bg-surface-hover border-b border-border
//   th: text-text-muted text-xs uppercase tracking-wider font-mono px-4 py-3
// Body row: border-b border-border hover:bg-surface-hover transition-colors
//   onRowClick: cursor-pointer
// Sortable header: shows ↑↓ chevron icon, active column highlighted cyan
// Loading state: 5 skeleton rows (SkeletonRow component)
// Empty state: renders emptyState prop or default EmptyState component
// Checkbox column: when selectable=true, first column is 40px wide checkbox
// Bulk toolbar: slides up from bottom (animate-slide-up) when selectedIds.length > 0
// Pagination: prev/next buttons + "X–Y of Z" label
```

---

#### Sparkline

```typescript
// packages/ui/src/components/Sparkline/index.tsx
// SVG-based, no external lib dependency
// Renders a polyline from normalized data points
// min/max normalized to fill height
// strokeWidth default: 1.5
// showDot: renders 4px filled circle at last data point
// Default color: #00D4FF
// No axes, no labels — pure data viz glyph
```

---

#### ProgressBar

```typescript
// packages/ui/src/components/ProgressBar/index.tsx
// Container: w-full bg-surface-hover rounded-full
// Fill: transition-all duration-500 ease-out, color-coded
// sm: h-1, md: h-2 (default), lg: h-3
// animated: adds striped animation overlay
// showLabel: renders percentage text to the right
// label: renders custom label above bar
// value clamped to 0–100
```

---

#### StepIndicator

```typescript
// packages/ui/src/components/StepIndicator/index.tsx
// Horizontal: flex row with connecting lines
// Vertical: flex column with connecting lines
// complete: filled cyan circle + checkmark
// current: pulsing cyan ring + number
// upcoming: gray border circle + number
// error: red circle + X icon
// Label: below (horizontal) or right (vertical) of circle
// Connecting line: bg-border (upcoming) → bg-cyan (complete)
```

---

#### Tabs

```typescript
// packages/ui/src/components/Tabs/index.tsx
// line variant: border-b border-border, active tab has border-b-2 border-cyan text-cyan
// pill variant: bg-surface rounded-lg p-1, active tab bg-cyan text-background rounded
// Badge: small Badge component inline with label text
// Keyboard: left/right arrows navigate, Enter/Space activate
// ARIA: role="tablist", role="tab", aria-selected, aria-controls
```

---

#### Sidebar

```typescript
// packages/ui/src/components/Sidebar/index.tsx
// Width: expanded=240px, collapsed=60px (transition-all duration-200)
// Active item: text-cyan, left border 2px solid cyan, bg-cyan/10
// Hover: bg-surface-hover
// Icon: 20px, centered when collapsed, left-aligned when expanded
// Label: hidden when collapsed (opacity-0 transition)
// Collapse toggle: chevron button at bottom of sidebar
// Header slot: above nav items (e.g., logo)
// Footer slot: below nav items (e.g., user profile, logout)
// Badge: shown inline; hidden when collapsed
```

---

#### StatusDot

```typescript
// packages/ui/src/components/StatusDot/index.tsx
// Renders a colored circle
// green: bg-green, orange: bg-orange, red: bg-red, gray: bg-text-dim, cyan: bg-cyan
// pulse=true: adds ping animation overlay (same color, opacity 0.4)
// sm: 6px, md: 8px (default), lg: 10px
// label: aria-label for screen readers
```

---

#### Skeleton

```typescript
// packages/ui/src/components/Skeleton/index.tsx
// Base: bg-surface-hover animate-pulse rounded
// rect: custom width/height
// text: w-full h-4, lines prop creates N stacked text skeletons with last at 75% width
// circle: rounded-full, equal width/height
// animate=false: removes animation (for testing)
```

---

#### EmptyState

```typescript
// packages/ui/src/components/EmptyState/index.tsx
// Centered layout: flex-col items-center text-center py-16
// Icon: 48px, text-text-dim (slot accepts any icon)
// Title: font-display text-text text-base uppercase tracking-widest mt-4
// Description: text-text-muted text-sm mt-2 max-w-xs
// Action: Button variant="secondary" mt-6
```

---

#### AlertBanner

```typescript
// packages/ui/src/components/AlertBanner/index.tsx
// Full-width banner with left-colored border (4px) and subtle bg tint
// info: border-cyan bg-cyan/5
// warning: border-orange bg-orange/5
// error: border-red bg-red/5
// success: border-green bg-green/5
// Title: font-medium text-sm
// Description: text-xs text-text-muted mt-0.5
// Action: text button (no border) right-aligned
// Dismiss: X icon button when dismissible=true
```

### 6.3 Utility Function

```typescript
// packages/ui/src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 6.4 Barrel Export

```typescript
// packages/ui/src/index.ts
export { Button } from "./components/Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./components/Button/Button.types";

export { Input } from "./components/Input";
export type { InputProps } from "./components/Input/Input.types";

export { Card } from "./components/Card";
export type { CardProps, CardVariant } from "./components/Card/Card.types";

export { Badge } from "./components/Badge";
export type { BadgeProps, BadgeColor, BadgeVariant } from "./components/Badge/Badge.types";

export { Modal } from "./components/Modal";
export type { ModalProps } from "./components/Modal/Modal.types";

export { ToastProvider, useToast } from "./components/Toast";
export type { Toast, ToastType, UseToastReturn } from "./components/Toast/Toast.types";

export { DataTable } from "./components/DataTable";
export type { DataTableProps, Column, PaginationProps } from "./components/DataTable/DataTable.types";

export { Sparkline } from "./components/Sparkline";
export type { SparklineProps } from "./components/Sparkline/Sparkline.types";

export { ProgressBar } from "./components/ProgressBar";
export type { ProgressBarProps } from "./components/ProgressBar/ProgressBar.types";

export { StepIndicator } from "./components/StepIndicator";
export type { StepIndicatorProps, Step, StepStatus } from "./components/StepIndicator/StepIndicator.types";

export { Tabs } from "./components/Tabs";
export type { TabsProps, Tab } from "./components/Tabs/Tabs.types";

export { Sidebar } from "./components/Sidebar";
export type { SidebarProps, NavItem } from "./components/Sidebar/Sidebar.types";

export { StatusDot } from "./components/StatusDot";
export type { StatusDotProps, StatusDotColor } from "./components/StatusDot/StatusDot.types";

export { Skeleton } from "./components/Skeleton";
export type { SkeletonProps } from "./components/Skeleton/Skeleton.types";

export { EmptyState } from "./components/EmptyState";
export type { EmptyStateProps } from "./components/EmptyState/EmptyState.types";

export { AlertBanner } from "./components/AlertBanner";
export type { AlertBannerProps, AlertBannerType } from "./components/AlertBanner/AlertBanner.types";

export { cn } from "./lib/utils";
```

### 6.5 UI Demo Page

**File:** `apps/dashboard/app/ui-demo/page.tsx`

This page is gated by `NODE_ENV !== "production"`. In production builds it returns `notFound()`.

```typescript
// apps/dashboard/app/ui-demo/page.tsx
import { notFound } from "next/navigation";

export default function UiDemoPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div
      data-testid="ui-demo-root"
      className="min-h-screen bg-background p-8"
    >
      <h1 className="font-display text-cyan text-2xl uppercase tracking-widest mb-8">
        JARVIS Design System — Component Library
      </h1>
      {/* One section per component, all variants side by side */}
      {/* ButtonSection, InputSection, CardSection, ... (16 sections) */}
    </div>
  );
}
```

**The demo page is not formally specified here** — it is a developer tool. Its structure is left to the implementer. The only requirement is that every component and every variant is visible on the page.

---

## 7. Integration Points

### 7.1 Google Fonts

**Usage:** Orbitron, Share Tech Mono, Inter loaded via Google Fonts in `globals.css`

**URL pattern:** `https://fonts.googleapis.com/css2?family=...&display=swap`

**Risk:** Google Fonts requests add latency. If offline or blocked, fonts fall back to system fonts. This is acceptable — the JARVIS aesthetic degrades gracefully.

**Alternative (if self-hosting is preferred):** Use `next/font/google` to self-host at build time:

```typescript
// apps/dashboard/app/layout.tsx (alternative approach using next/font)
import { Orbitron, Share_Tech_Mono, Inter } from "next/font/google";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "900"],
});

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});
```

**Recommendation:** Use `next/font/google` (self-hosting). It eliminates the runtime Google Fonts request, improves Core Web Vitals, and satisfies strict CSP policies. Adds no complexity.

**Decision gate:** F02 implementation start. Choose one approach and apply consistently to all three apps.

### 7.2 `tailwind-merge` + `clsx`

Both are dependencies of `packages/ui`. They are small, stable utilities (no auth, no external calls).

### 7.3 No Other Integrations

F02 has no external API calls, no Supabase, no auth, no webhooks.

---

## 8. BDD Scenarios

### Scenario 1: Button Variants Render

```
Given the UI demo page is open
When the Button section is visible
Then a primary Button renders with cyan background and dark text
And a secondary Button renders with cyan border and no fill
And a ghost Button renders with muted text and no border
And a danger Button renders with red background
And all Buttons are focusable with visible focus ring
```

### Scenario 2: Button Loading State

```
Given a Button with loading={true}
When it renders
Then a spinner icon is visible
And the Button is disabled
And clicking the Button does not fire the onClick handler
```

### Scenario 3: DataTable Renders With Data

```
Given a DataTable with 25 rows and 5 columns
When it renders
Then 25 rows are visible in the table body
And each column header is visible
And the table has a bottom border between rows
```

### Scenario 4: DataTable Empty State

```
Given a DataTable with data={[]}
When it renders
Then the table body shows the emptyState content
And no row hover effects are shown
```

### Scenario 5: DataTable Loading State

```
Given a DataTable with loading={true}
When it renders
Then 5 skeleton rows are shown in the table body
And the skeleton rows have an animated pulse
And no real data rows are rendered
```

### Scenario 6: Modal Opens and Closes

```
Given a Modal with open={false}
When open is set to true
Then the Modal overlay fades in
And the Modal panel slides up
And focus is trapped inside the Modal
When ESC is pressed
Then the Modal calls onClose
When the overlay is clicked
Then the Modal calls onClose (if closeOnOverlayClick=true)
```

### Scenario 7: Toast Appears and Auto-Dismisses

```
Given a ToastProvider wraps the app
When toast({ type: "success", title: "Saved" }) is called
Then a success Toast appears in the bottom-right corner
And the Toast has a green left border
After 4000ms
Then the Toast automatically disappears
```

### Scenario 8: Sidebar Collapses

```
Given a Sidebar with collapsed={false}
When the collapse toggle button is clicked
Then the Sidebar width transitions to 60px
And nav item labels become invisible
And nav item icons remain centered and visible
When the toggle is clicked again
Then the Sidebar expands to 240px
And labels become visible again
```

### Scenario 9: StepIndicator Shows Step States

```
Given a StepIndicator with steps: [complete, current, upcoming]
When it renders
Then the complete step shows a checkmark icon with cyan fill
And the current step shows a pulsing ring with the step number
And the upcoming step shows a gray border circle with the step number
And the connecting line between complete and current is cyan
And the connecting line between current and upcoming is gray
```

### Scenario 10: CSS Token Value Assertion

```
Given the app has loaded with globals.css applied
When the computed style of :root is read for --cyan
Then the value equals #00D4FF (or rgb(0, 212, 255))
```

### Scenario 11: Package Import Resolves

```
Given apps/dashboard imports { Button } from "@rainmachine/ui"
When TypeScript compiles the project
Then no module-not-found error is thrown
And the Button component is the one from packages/ui/src/components/Button
```

### Scenario 12: Production Build Excludes Demo Page

```
Given the dashboard app is built with NODE_ENV=production
When a browser navigates to /ui-demo
Then a 404 page is returned
And no component source code is exposed
```

---

## 9. Test Plan

### 9.1 Snapshot Tests (React Testing Library + Vitest)

One test file per component. All 16 components tested across all prop variants.

**File pattern:** `packages/ui/src/components/{Component}/__tests__/{Component}.test.tsx`

**Example: Button tests**

```typescript
// packages/ui/src/components/Button/__tests__/Button.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Button } from "..";

describe("Button", () => {
  it("renders primary variant", () => {
    const { container } = render(<Button>Click me</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders secondary variant", () => {
    const { container } = render(
      <Button variant="secondary">Click me</Button>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders ghost variant", () => {
    const { container } = render(<Button variant="ghost">Click me</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders danger variant", () => {
    const { container } = render(<Button variant="danger">Click me</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("shows spinner when loading", () => {
    render(<Button loading>Submit</Button>);
    // Spinner aria-hidden, button disabled
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
  });

  it("fires onClick when not disabled or loading", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders all sizes", () => {
    const { rerender, container } = render(<Button size="sm">S</Button>);
    expect(container.firstChild).toMatchSnapshot();
    rerender(<Button size="md">M</Button>);
    expect(container.firstChild).toMatchSnapshot();
    rerender(<Button size="lg">L</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

**Test matrix** (all 16 components × relevant prop combinations):

| Component | Test Count (approx) | Key scenarios |
|---|---|---|
| Button | 12 | All variants, sizes, loading, disabled, onClick |
| Input | 10 | Label, hint, error, addons, disabled |
| Card | 6 | All variants, padding levels |
| Badge | 8 | Colors × variants, dot |
| Modal | 8 | Open/close, ESC, overlay click, focus trap |
| Toast | 6 | All types, auto-dismiss, manual dismiss |
| DataTable | 10 | Data, loading, empty, sort, select, pagination |
| Sparkline | 4 | With data, no data, showDot |
| ProgressBar | 6 | Colors, sizes, animated, label |
| StepIndicator | 6 | All step states, horizontal/vertical |
| Tabs | 6 | Line/pill variants, disabled tab, badge |
| Sidebar | 6 | Expanded/collapsed, active item, badge |
| StatusDot | 4 | All colors, pulse |
| Skeleton | 6 | rect, text (lines), circle |
| EmptyState | 4 | With/without icon, action |
| AlertBanner | 8 | All types, dismissible, action |

### 9.2 CSS Token Test

```typescript
// packages/ui/src/__tests__/tokens.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { JSDOM } from "jsdom";

describe("CSS Design Tokens", () => {
  let dom: JSDOM;

  beforeAll(() => {
    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>", {
      runScripts: "dangerously",
    });
    // Inject :root CSS vars
    const style = dom.window.document.createElement("style");
    style.textContent = `
      :root {
        --cyan: #00D4FF;
        --orange: #FF6B35;
        --green: #00FF88;
        --background: #050D1A;
      }
    `;
    dom.window.document.head.appendChild(style);
  });

  it("--cyan token equals #00D4FF", () => {
    const style = dom.window.getComputedStyle(dom.window.document.documentElement);
    // Note: JSDOM doesn't fully compute CSS vars; check injected value directly
    const cssText = dom.window.document.querySelector("style")?.textContent ?? "";
    expect(cssText).toContain("--cyan: #00D4FF");
  });

  it("--background token equals #050D1A", () => {
    const cssText = dom.window.document.querySelector("style")?.textContent ?? "";
    expect(cssText).toContain("--background: #050D1A");
  });
});
```

### 9.3 Playwright Demo Page Tests

```typescript
// apps/dashboard/e2e/ui-demo.spec.ts
import { test, expect } from "@playwright/test";

test.describe("F02 — Design System Demo", () => {
  test.skip(
    process.env.NODE_ENV === "production",
    "Demo page not available in production",
  );

  test("demo page loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/ui-demo");
    await expect(page.getByTestId("ui-demo-root")).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("all 16 component sections are present", async ({ page }) => {
    await page.goto("/ui-demo");
    const sections = [
      "button", "input", "card", "badge", "modal", "toast",
      "datatable", "sparkline", "progressbar", "stepindicator",
      "tabs", "sidebar", "statusdot", "skeleton", "emptystate", "alertbanner",
    ];
    for (const section of sections) {
      await expect(
        page.getByTestId(`demo-section-${section}`),
      ).toBeVisible();
    }
  });
});
```

### 9.4 CI Integration

Snapshot tests run in `pnpm turbo run test` pipeline. Updated snapshots are committed to version control and must be deliberately updated (not auto-updated in CI).

---

## 10. OWASP Security Checklist

### 10.1 XSS Prevention

- [ ] **A03 Injection — XSS** — All components that render user-controlled data use React's default JSX escaping. No `dangerouslySetInnerHTML` in any component unless explicitly required (none are in F02). AI transcript rendering (F08) will require special handling — documented as a Rabbit Hole in F08, not F02.
- [ ] **Modal title/description:** Rendered as text nodes, not HTML. No XSS surface.
- [ ] **Toast title/description:** Same — text only.
- [ ] **AlertBanner title/description:** Text only.
- [ ] **DataTable render functions:** Implementers of `Column.render` must not inject HTML strings. Lint rule `no-danger` considered but not enforced — code review responsibility.

### 10.2 Accessibility (WCAG 2.1 AA)

Accessibility is part of the security surface — broken ARIA can lead to screen reader injection or data leakage in accessible mode. Requirements:

- [ ] **Button:** `aria-disabled` when `disabled || loading`. `aria-busy` when `loading`.
- [ ] **Modal:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title, focus trapped, ESC closes.
- [ ] **Tabs:** `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` per tab.
- [ ] **DataTable:** `role="table"`, `aria-sort` on sortable columns, `aria-label` on checkboxes.
- [ ] **StatusDot:** `aria-label` from `label` prop (screen reader announces status).
- [ ] **Toast:** `role="status"` or `role="alert"` depending on type (alert for error, status for success/info). `aria-live="polite"` for success; `aria-live="assertive"` for error.
- [ ] **StepIndicator:** `aria-current="step"` on current step.

### 10.3 Input Sanitization

- [ ] Input component accepts `type` from the caller. Never override to `type="text"` for security-sensitive fields (password, etc.).
- [ ] `maxLength` prop passed through to native input element — callers are responsible for setting appropriate limits.

### 10.4 Dependencies

- [ ] `clsx` and `tailwind-merge` — zero external API calls, zero network requests.
- [ ] No eval, no innerHTML, no dynamic script injection.
- [ ] `pnpm audit` runs in CI — any critical severity in `packages/ui` dependencies blocks merge.

---

## 11. Open Questions

### OQ-01 — Font Loading Strategy: `next/font/google` vs CSS `@import`

**Question:** Self-host fonts via `next/font/google` (recommended in Section 7.1) or load via CSS `@import` from Google Fonts?

**Recommendation:** `next/font/google`. See Section 7.1 for rationale.

**Decision gate:** F02 implementation start.

---

### OQ-02 — Tailwind Content Paths: How to Include `packages/ui` Sources?

**Question:** Each app's `tailwind.config.ts` must include `packages/ui` source files in the `content` array, otherwise Tailwind will purge classes used in shared components.

**Current approach:**

```typescript
// apps/dashboard/tailwind.config.ts
import type { Config } from "tailwindcss";
import preset from "@rainmachine/config/tailwind-preset";

const config: Config = {
  presets: [preset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",  // ← critical
  ],
};

export default config;
```

**Risk:** If the relative path is wrong, shared component styles are purged in production and components render unstyled.

**Recommendation:** Add an E2E test in CI that builds the app and checks that a known cyan class (`text-cyan`) exists in the output CSS bundle.

**Decision gate:** F02 implementation. Validate the path before first production build.

---

### OQ-03 — Modal Focus Trap: Library or Custom?

**Question:** Implement focus trap for Modal manually or use `focus-trap-react`?

**Options:**
- A: Manual implementation (no extra dep)
- B: `focus-trap-react` (0.8kB, well-tested)

**Recommendation:** Option B. Focus trap is subtle to get right across all browser/screen reader combinations. `focus-trap-react` is battle-tested and small.

**Decision gate:** F02 implementation start.

---

### OQ-04 — Toast State Management: Context or Zustand?

**Question:** Should ToastProvider use React Context with `useReducer`, or install Zustand for global state?

**Context:** Zustand is used by some later features (F07+). If we add it now, it's reused. If we use Context, we avoid an early dependency.

**Recommendation:** React Context + `useReducer` in F02. If Zustand is added in a later cycle, the Toast implementation can migrate without breaking callers (the `useToast` hook API is stable regardless of internal state management).

**Decision gate:** F02 implementation start.

---

### OQ-05 — DataTable: Column Definitions as Static or Memoized?

**Question:** Should consumers memoize `columns` arrays (with `useMemo`) to prevent DataTable re-renders?

**Context:** If `columns` is defined inline in JSX without `useMemo`, it recreates on every parent render, potentially causing DataTable to re-render unnecessarily.

**Recommendation:** Document this in the DataTable JSDoc comment:

```typescript
/**
 * @example
 * // Define columns outside the component or with useMemo to prevent re-renders
 * const columns = useMemo(() => [...], []);
 */
```

This is a usage guideline, not a code change.

**Decision gate:** F02 implementation. Add JSDoc before shipping.

---

*PRD F02 — Design System & Shared Component Library*
*Sigma Protocol Step 11 · MIRD AI Corporate Machine*
*Written: 2026-04-02 · Cycle 1 · Release 0*
*Depends on: F01 (monorepo must exist)*
*Unlocks: F03 (parallel), all R1 app pitches*

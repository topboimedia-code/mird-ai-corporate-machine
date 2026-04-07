# F01 — Monorepo Foundation & CI/CD
# RainMachine · MIRD AI Corporate Machine
# Sigma Protocol Step 11 · PRD Generation
# Source Pitch: P01 · Cycle: 1 · Release: R0 · Appetite: Small
# Date: 2026-04-02 | Status: Ready for Implementation

---

## 1. Overview

### Pitch Summary

RainMachine is an AI-powered client acquisition platform for real estate team leaders. Before a single feature can be built, the monorepo must exist: one repository, four Next.js 15 applications, three shared packages, a working CI pipeline, and a verified Vercel deployment. This is the walking skeleton — nothing user-facing ships, but every subsequent cycle depends on this scaffold being sound.

### User-Facing Outcome

At the end of Cycle 1, a developer clones the repo, runs `pnpm install && pnpm dev`, and all four apps start locally. The `apps/dashboard` home page renders a single "RainMachine" heading in the browser. A push to any PR branch triggers lint + typecheck on GitHub Actions. A merge to `main` triggers a Vercel preview build for each app. The foundation is provably alive.

### What This PRD Is Not

This PRD does not cover design system tokens, Supabase schema, authentication, or any application feature. Those are F02 and F03 respectively. This PRD ends the moment the monorepo boots and CI is green.

### Acceptance Summary (from VERTICAL-SLICE-VERIFICATION.md · P01)

- `pnpm turbo run build` exits 0 for all workspaces
- `pnpm turbo run lint` exits 0 for all workspaces
- `pnpm turbo run typecheck` exits 0 for all workspaces
- `apps/dashboard/app/page.tsx` renders `<h1>RainMachine</h1>` (Playwright assertion)
- GitHub Actions CI workflow passes on a test PR
- Environment variable validation throws on missing required vars

---

## 2. Database

### New Tables

None. F01 is pure infrastructure — no database tables are created in this cycle.

### Migration File

None in this cycle. The first migration (`0001_initial_schema.sql`) is written in F03.

### Notes for Future Cycles

The `packages/db` package created in this cycle will be the home for all Supabase client code and generated TypeScript types. The package is scaffolded as an empty shell here; F03 populates it with the actual schema client, query helpers, and generated types.

---

## 3. TypeScript Interfaces

### 3.1 Environment Variable Schemas

Each app validates its environment variables at startup using `@t3-oss/env-nextjs`. Invalid or missing vars throw at build time (not runtime).

#### `apps/dashboard` — `src/env.ts`

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
```

#### `apps/ceo` — `src/env.ts`

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_CEO_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_CEO_APP_URL: process.env.NEXT_PUBLIC_CEO_APP_URL,
  },
});
```

#### `apps/onboarding` — `src/env.ts`

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    ONBOARDING_JWT_SECRET: z.string().min(32),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_ONBOARDING_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ONBOARDING_JWT_SECRET: process.env.ONBOARDING_JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_ONBOARDING_APP_URL: process.env.NEXT_PUBLIC_ONBOARDING_APP_URL,
  },
});
```

### 3.2 Workspace Package Types

#### `packages/config` — `src/index.ts` (stub, populated in F02)

```typescript
// Barrel export — populated by F02 (Design System)
export * from "./tailwind-preset";
```

#### `packages/db` — `src/index.ts` (stub, populated in F03)

```typescript
// Barrel export — populated by F03 (Supabase Schema + Auth)
export * from "./client";
export type * from "./types";
```

#### `packages/ui` — `src/index.ts` (stub, populated in F02)

```typescript
// Barrel export — populated by F02 (Design System)
// No components until F02
export {};
```

### 3.3 Turbo Pipeline Types (internal, not exported)

```typescript
// Internal type representing a turbo task — used in turbo.json (JSON, not TS)
// Documented here for clarity on pipeline shape:
type TurboTask = {
  dependsOn?: string[];  // e.g. ["^build"] means: wait for all deps to build first
  outputs?: string[];    // e.g. [".next/**", "!.next/cache/**"]
  cache?: boolean;
  persistent?: boolean;  // true for dev servers
};
```

---

## 4. Server Actions

None in this cycle. F01 establishes the monorepo scaffold; no server actions exist until F03 (auth) at the earliest.

**Note:** The `"use server"` directive pattern and server action file conventions are established in F03. This PRD does not dictate those patterns — F03 owns them.

---

## 5. API Routes

None in this cycle. The only "route" is the `apps/dashboard/app/page.tsx` home page, which is a static placeholder RSC — no data fetching, no API calls.

**Future routes** (documented here for reference, not scope):
- `/api/webhooks/n8n-error` → F04
- `/api/webhooks/retell` → F05
- `/api/onboarding/status` → F06

---

## 6. UI Components

### 6.1 Component Scope for F01

F01 ships exactly one UI artifact: the `apps/dashboard` home page placeholder. No reusable components are built. The `packages/ui` package is scaffolded as an empty shell.

### 6.2 Dashboard Placeholder Page

**File:** `apps/dashboard/app/page.tsx`

```typescript
// apps/dashboard/app/page.tsx
// Purpose: Proves the dashboard app boots. Removed when F07 ships.
// No data fetching. No client components. Pure RSC.

export default function RootPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050D1A",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1
        data-testid="rainmachine-heading"
        style={{
          color: "#00D4FF",
          fontSize: "2rem",
          letterSpacing: "0.2em",
          margin: 0,
        }}
      >
        RainMachine
      </h1>
    </main>
  );
}
```

**Props:** None (RSC, no props)
**States:** None (static)
**data-testid:** `rainmachine-heading` — used by Playwright smoke test

**Replacement:** This page is replaced wholesale when F07 ships. No migration needed — F07 simply overwrites `app/page.tsx` with the real dashboard home.

### 6.3 CEO App Placeholder Page

**File:** `apps/ceo/app/page.tsx`

```typescript
export default function CeoRootPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050D1A",
      }}
    >
      <h1
        data-testid="ceo-heading"
        style={{ color: "#00D4FF", fontSize: "2rem", letterSpacing: "0.2em" }}
      >
        CEO Dashboard
      </h1>
    </main>
  );
}
```

### 6.4 Onboarding App Placeholder Page

**File:** `apps/onboarding/app/page.tsx`

```typescript
export default function OnboardingRootPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050D1A",
      }}
    >
      <h1
        data-testid="onboarding-heading"
        style={{ color: "#00D4FF", fontSize: "2rem", letterSpacing: "0.2em" }}
      >
        RainMachine Onboarding
      </h1>
    </main>
  );
}
```

### 6.5 Marketing App

`apps/marketing` is scaffolded but not deployed to Vercel in this cycle. It is included in the Turborepo workspace so `turbo run build` covers it, but Vercel project creation for marketing ships with the marketing site PRD (future cycle).

### 6.6 `packages/ui` Shell

```
packages/ui/
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts       ← empty barrel export
└── __tests__/
    └── .gitkeep       ← placeholder; real tests ship in F02
```

### 6.7 Layout Files (Minimal)

Each app ships a minimal `app/layout.tsx` with:
- HTML lang attribute (`en`)
- No fonts (fonts ship in F02 with Tailwind integration)
- No global CSS beyond a single `globals.css` that resets margin/padding and sets `background: #050D1A`

```typescript
// apps/dashboard/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RainMachine",
  description: "AI-powered client acquisition for real estate team leaders",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

---

## 7. Integration Points

### 7.1 External Services — F01 Scope

F01 touches two external services: **GitHub** (CI) and **Vercel** (deployments). No application-level APIs (GHL, Retell, Supabase data APIs) are called in this cycle.

---

### 7.2 GitHub Actions CI

**Trigger 1 — PR Check (every PR targeting `main`):**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run lint typecheck
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

**Trigger 2 — Build Check (merge to `main`):**

```yaml
# .github/workflows/build.yml
name: Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      # Stub env vars — apps validate at build, stubs satisfy schema
      NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co"
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key"
      NEXT_PUBLIC_APP_URL: "https://app.rainmachine.io"
      NEXT_PUBLIC_CEO_APP_URL: "https://ceo.rainmachine.io"
      NEXT_PUBLIC_ONBOARDING_APP_URL: "https://onboard.rainmachine.io"
      SUPABASE_SERVICE_ROLE_KEY: "placeholder-service-role-key"
      ONBOARDING_JWT_SECRET: "placeholder-jwt-secret-32-chars-ok"
      NODE_ENV: "test"
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run build
```

**Secrets to configure in GitHub repository settings:**
- `TURBO_TOKEN` — Vercel Remote Cache token (optional in Cycle 1, enables caching)
- `TURBO_TEAM` — Vercel team slug (optional in Cycle 1)

---

### 7.3 Vercel Projects

Three Vercel projects are created manually before the first deploy. One project per deployed app.

| App | Vercel Project Name | Domain (Production) | Branch |
|---|---|---|---|
| `apps/dashboard` | `rainmachine-dashboard` | `app.rainmachine.io` | `main` |
| `apps/ceo` | `rainmachine-ceo` | `ceo.rainmachine.io` | `main` |
| `apps/onboarding` | `rainmachine-onboarding` | `onboard.rainmachine.io` | `main` |

**Root Directory setting per project:** Set to `apps/dashboard` (or `/ceo`, `/onboarding` respectively). This tells Vercel where to run `next build`.

**Framework preset:** Next.js (Vercel auto-detects)

**Build command override:** `cd ../.. && pnpm turbo run build --filter=dashboard` (adjust per app name)

**Preview deployments:** Enabled for all branches. Every PR gets a unique preview URL per app.

**Environment variables in Vercel:** Set in Vercel dashboard per project. For Cycle 1 these are stubs — real values from Supabase are added in F03.

---

### 7.4 Turborepo Remote Cache (Optional — Cycle 1)

Vercel provides a free remote cache for Turborepo. Steps to enable:

1. Run `pnpm dlx turbo login` and follow OAuth flow
2. Run `pnpm dlx turbo link` to link the repo to the Vercel team
3. Add `TURBO_TOKEN` and `TURBO_TEAM` to GitHub Secrets

This is optional in Cycle 1 but strongly recommended — it makes CI 3–5× faster once builds are cached.

---

## 8. BDD Scenarios

### Scenario 1: Monorepo Boots Locally

```
Given a developer has cloned the repository and run `pnpm install`
When they run `pnpm dev` from the repo root
Then all four apps start without errors
And `apps/dashboard` is accessible at localhost:3000
And `apps/ceo` is accessible at localhost:3001
And `apps/onboarding` is accessible at localhost:3002
And `apps/marketing` is accessible at localhost:3003
```

### Scenario 2: Dashboard Placeholder Renders

```
Given `apps/dashboard` is running locally at localhost:3000
When a browser navigates to http://localhost:3000
Then the page renders without JavaScript errors
And the element with data-testid="rainmachine-heading" is visible
And the element contains the text "RainMachine"
And the page background color is #050D1A
And the heading color is #00D4FF
```

### Scenario 3: Turborepo Build Passes All Workspaces

```
Given all packages and apps are properly configured
When `pnpm turbo run build` is executed from the repo root
Then the build exits with code 0
And all four apps produce a `.next` build artifact
And the build output shows caching behavior (HIT or MISS)
And no TypeScript errors appear in the output
```

### Scenario 4: Lint Passes All Workspaces

```
Given all apps and packages contain only scaffolded code
When `pnpm turbo run lint` is executed from the repo root
Then all lint checks exit with code 0
And no ESLint errors or warnings are reported
```

### Scenario 5: Typecheck Passes All Workspaces

```
Given all apps and packages have TypeScript configured
When `pnpm turbo run typecheck` is executed from the repo root
Then `tsc --noEmit` exits with code 0 for all workspaces
And no TypeScript errors are reported
```

### Scenario 6: Environment Variable Validation Throws on Missing Var

```
Given the `apps/dashboard` env schema requires NEXT_PUBLIC_SUPABASE_URL
When the app starts with NEXT_PUBLIC_SUPABASE_URL missing or empty
Then the process throws a descriptive validation error at startup
And the error message names the missing variable
And the process exits with a non-zero code
And no request is served
```

### Scenario 7: GitHub Actions CI Passes on PR

```
Given a developer opens a pull request targeting main
When the PR is created or a new commit is pushed to the branch
Then the "CI" workflow triggers automatically
And the lint step passes
And the typecheck step passes
And the GitHub check appears as green on the PR
```

### Scenario 8: GitHub Actions Build Passes on Merge to Main

```
Given a pull request has been merged to main
When the merge commit is pushed
Then the "Build" workflow triggers automatically
And `pnpm turbo run build` completes successfully for all workspaces
And the workflow exits green
```

### Scenario 9: Vercel Preview Deploy on PR

```
Given a developer opens a pull request
When Vercel detects a new commit on the branch
Then Vercel triggers a preview build for apps/dashboard
And a unique preview URL is generated for the branch
And the preview URL renders the "RainMachine" heading
```

### Scenario 10: Package Imports Resolve Correctly

```
Given `apps/dashboard` imports from `@rainmachine/ui`
When TypeScript resolves the import
Then the import resolves to `packages/ui/src/index.ts`
And the import does not produce a module-not-found error
And the build succeeds
```

---

## 9. Test Plan

### 9.1 Smoke Test (Playwright)

One Playwright test file covers the walking skeleton. Runs in CI on merge to `main`.

**File:** `apps/dashboard/e2e/smoke.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("F01 — Monorepo Smoke Tests", () => {
  test("dashboard placeholder page renders", async ({ page }) => {
    await page.goto("/");
    const heading = page.getByTestId("rainmachine-heading");
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("RainMachine");
  });

  test("no console errors on page load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    expect(errors).toHaveLength(0);
  });

  test("page title is set", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/RainMachine/);
  });
});
```

**Playwright config:** `apps/dashboard/playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### 9.2 Unit Tests

No unit tests in F01. The placeholder pages have no logic to test.

**Test framework:** Vitest (configured in `packages/config/vitest.config.ts`, consumed by all packages)

```typescript
// packages/config/vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test-setup.ts"],
  },
});
```

### 9.3 Integration Tests

None in F01. No external services are integrated.

### 9.4 CI Test Matrix

| Test Type | Tool | Trigger | Target |
|---|---|---|---|
| Lint | ESLint | PR + merge | All workspaces |
| Typecheck | tsc --noEmit | PR + merge | All workspaces |
| Build | next build | Merge to main | All apps |
| E2E Smoke | Playwright | Merge to main | apps/dashboard |

### 9.5 Local Dev Commands

```bash
# Install all dependencies
pnpm install

# Run all apps in dev mode (parallel via turbo)
pnpm dev

# Run one app only
pnpm dev --filter=dashboard

# Build all
pnpm turbo run build

# Lint all
pnpm turbo run lint

# Typecheck all
pnpm turbo run typecheck

# Run Playwright smoke tests (dashboard must be running)
pnpm --filter=dashboard exec playwright test

# Run all tests
pnpm turbo run test
```

---

## 10. OWASP Security Checklist

F01 is infrastructure scaffolding with no user data, no auth, and no external API calls. Security posture for this cycle is about establishing correct defaults that cannot be accidentally weakened in later cycles.

### 10.1 Dependency Security

- [ ] **A06 Vulnerable and Outdated Components** — All dependencies pinned to specific versions in `package.json`. `pnpm audit` runs as part of CI on every PR. Any critical vulnerability blocks the PR from merging.
- [ ] **Supply Chain** — `pnpm-lock.yaml` committed and checked. `--frozen-lockfile` flag used in CI so CI never installs a different version than local.
- [ ] **Minimal footprint** — Only install packages explicitly needed in Cycle 1. Do not add packages "we'll probably need later" — they expand the attack surface without providing value.

### 10.2 Environment Variables

- [ ] **A02 Cryptographic Failures / Secrets Exposure** — No secrets in code. All secrets in `.env.local` (gitignored). `.env.example` committed with placeholder values only.
- [ ] **A05 Security Misconfiguration** — `@t3-oss/env-nextjs` schema enforces that all required env vars are present at build time. Missing vars throw, not silently use undefined.
- [ ] **NEXT_PUBLIC_ discipline** — Only variables that must be in the browser bundle use the `NEXT_PUBLIC_` prefix. Server-only secrets (service role key, JWT secret) are never prefixed.

### 10.3 Next.js Security Headers

Set security headers in `next.config.ts` for all apps. These are defaults that F01 establishes — later cycles inherit them automatically.

```typescript
// apps/dashboard/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ],
    },
  ],
  // Disable x-powered-by header (hides Next.js fingerprint)
  poweredByHeader: false,
};

export default nextConfig;
```

Apply the same `next.config.ts` structure to `apps/ceo` and `apps/onboarding`.

### 10.4 TypeScript Strict Mode

- [ ] `tsconfig.json` in all packages and apps has `"strict": true` — catches null/undefined errors at compile time before runtime
- [ ] `noImplicitAny: true` (covered by strict)
- [ ] `strictNullChecks: true` (covered by strict)

### 10.5 ESLint Security Rules

```json
// packages/config/eslint-preset.js (consumed by all apps)
{
  "extends": [
    "next/core-web-vitals",
    "next/typescript"
  ],
  "rules": {
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error"
  }
}
```

### 10.6 Gitignore Requirements

The `.gitignore` at repo root must include:

```
# Environment variables — NEVER commit these
.env
.env.local
.env.*.local

# Build artifacts
.next/
dist/
build/
out/

# Turborepo cache
.turbo/

# Testing
playwright-report/
test-results/

# Misc
node_modules/
.DS_Store
```

### 10.7 Content Security Policy (Deferred)

CSP headers are **not** set in F01. CSP requires knowing all script/style/connect sources, which won't be known until F02 (fonts) and F03 (Supabase URLs). CSP is an open question — see Section 11.

### 10.8 Authentication

Not applicable in F01 (no auth). Auth is F03's responsibility. This section is acknowledged as a placeholder to confirm it was considered, not overlooked.

---

## 11. Open Questions

### OQ-01 — Turborepo Remote Cache: Enable in Cycle 1?

**Question:** Should Vercel Remote Cache be enabled for Turborepo in Cycle 1, or deferred until CI builds become noticeably slow?

**Context:** Remote cache requires linking the repo to a Vercel team via `turbo link`. In Cycle 1 with minimal code, builds are fast (< 60s). Cache provides diminishing returns early but eliminates the setup step later.

**Recommendation:** Enable it in Cycle 1. The setup takes < 10 minutes and the habit of caching is easier to establish early than to retrofit.

**Decision gate:** Before first CI run. Resolve by: developer starting Cycle 1.

---

### OQ-02 — `apps/marketing` Build in CI: Include or Exclude?

**Question:** Should `apps/marketing` be included in `pnpm turbo run build` from the start, or excluded until the marketing site PRD is written?

**Context:** The marketing app (`makeitraindigital.com`) is in the monorepo workspace so it participates in `turbo run build`. If it's a bare Next.js scaffold with no pages, it builds fine. If it's excluded, the `turbo.json` filter must be updated later.

**Options:**
- A: Include from start — simplest, no filter changes needed later
- B: Exclude with `--filter=!marketing` until marketing PRD is written

**Recommendation:** Option A. Include from start. A bare Next.js scaffold with a single placeholder page builds fine and adds < 15s to CI.

**Decision gate:** Before writing `turbo.json`. Resolve by: developer starting Cycle 1.

---

### OQ-03 — Node.js Version: 20 LTS vs 22?

**Question:** Pin Node.js to 20 LTS or 22 LTS in CI and Vercel?

**Context:** Next.js 15 supports Node 18+. Node 20 is the current LTS. Node 22 became LTS in October 2025. Vercel uses the version specified in `package.json` `engines` field or `.nvmrc`.

**Recommendation:** Node 20 LTS. Most stable, widest ecosystem support, lowest risk for a new project. Upgrade to 22 in a future cycle when tooling support is confirmed.

**Decision gate:** Before writing CI workflows. Resolve by: developer starting Cycle 1.

---

### OQ-04 — pnpm Version: 9 vs 10?

**Question:** Pin pnpm to version 9 or 10?

**Context:** pnpm 10 was released in early 2025 with breaking changes to `peerDependencies` handling. Some packages in the ecosystem have not fully updated. pnpm 9 is stable and widely tested.

**Recommendation:** pnpm 9. Specifically `9.x` (latest patch). Use `packageManager` field in root `package.json` to pin exact version.

```json
{
  "packageManager": "pnpm@9.15.0"
}
```

**Decision gate:** Before `pnpm install`. Resolve by: developer starting Cycle 1.

---

### OQ-05 — Content Security Policy Headers

**Question:** When should CSP headers be added to `next.config.ts`?

**Context:** CSP requires knowing all external sources: Supabase URL (F03), Google Fonts (F02), Vercel Analytics (future). Adding CSP too early means constant header updates as integrations are added; too late means a period of operation without CSP.

**Recommendation:** Add CSP as part of F03 (when Supabase URL is known) or F02 (when fonts are added), whichever comes first. The `next.config.ts` structure established in F01 makes this a one-line addition.

**Decision gate:** F02 or F03, whichever adds the first external script/style source.

---

### OQ-06 — Monorepo Root `package.json` Scripts

**Question:** Should root-level `package.json` scripts alias `turbo run` commands for developer ergonomics?

**Context:** Developers can run `pnpm turbo run build` or a shorter `pnpm build` if aliased. Shorter aliases reduce friction.

**Recommendation:** Yes. Add the following to root `package.json`:

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules"
  }
}
```

**Decision gate:** When writing root `package.json`. No external dependency.

---

## Appendix A — Full File Structure

The complete file tree for F01 (scaffold only; no application logic):

```
rainmachine/                          ← repo root
├── .github/
│   └── workflows/
│       ├── ci.yml                    ← lint + typecheck on PR
│       └── build.yml                 ← build on merge to main
├── .gitignore
├── .nvmrc                            ← "20"
├── turbo.json
├── package.json                      ← root workspace config
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
│
├── apps/
│   ├── dashboard/                    ← app.rainmachine.io
│   │   ├── app/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx              ← "RainMachine" placeholder
│   │   ├── e2e/
│   │   │   └── smoke.spec.ts
│   │   ├── src/
│   │   │   └── env.ts
│   │   ├── next.config.ts
│   │   ├── playwright.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── ceo/                          ← ceo.rainmachine.io
│   │   ├── app/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── src/
│   │   │   └── env.ts
│   │   ├── next.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── onboarding/                   ← onboard.rainmachine.io
│   │   ├── app/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── src/
│   │   │   └── env.ts
│   │   ├── next.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── marketing/                    ← makeitraindigital.com (scaffold only)
│       ├── app/
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── next.config.ts
│       ├── tsconfig.json
│       └── package.json
│
└── packages/
    ├── config/                       ← shared configs
    │   ├── src/
    │   │   ├── index.ts              ← barrel (stub)
    │   │   └── vitest.config.ts
    │   ├── eslint-preset.js
    │   ├── tsconfig.json             ← base TS config
    │   └── package.json
    │
    ├── ui/                           ← shared components (empty in F01)
    │   ├── src/
    │   │   └── index.ts              ← empty barrel
    │   ├── __tests__/
    │   │   └── .gitkeep
    │   ├── tsconfig.json
    │   └── package.json
    │
    └── db/                           ← Supabase client (empty in F01)
        ├── src/
        │   └── index.ts              ← empty barrel
        ├── tsconfig.json
        └── package.json
```

---

## Appendix B — Key Configuration Files

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Root `package.json`

```json
{
  "name": "rainmachine",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.3.0"
  }
}
```

### `packages/config/tsconfig.json` (Base — Extended by All Apps)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "RainMachine Base",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "jsx": "preserve",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowJs": false,
    "incremental": true
  },
  "exclude": ["node_modules"]
}
```

### `apps/dashboard/tsconfig.json` (Extends Base)

```json
{
  "extends": "@rainmachine/config/tsconfig.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@rainmachine/ui": ["../../packages/ui/src/index.ts"],
      "@rainmachine/db": ["../../packages/db/src/index.ts"],
      "@rainmachine/config": ["../../packages/config/src/index.ts"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `apps/dashboard/package.json`

```json
{
  "name": "dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "next build",
    "dev": "next dev --port 3000",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "clean": "rm -rf .next"
  },
  "dependencies": {
    "@rainmachine/config": "workspace:*",
    "@rainmachine/db": "workspace:*",
    "@rainmachine/ui": "workspace:*",
    "@t3-oss/env-nextjs": "^0.11.0",
    "next": "^15.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.50.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

---

## Appendix C — Dependency Versions (Pinned for Cycle 1)

| Package | Version | Justification |
|---|---|---|
| `turbo` | `^2.3.0` | Latest stable; TUI enabled |
| `next` | `^15.2.0` | App Router, React 19 |
| `react` | `^19.0.0` | Required by Next.js 15 |
| `typescript` | `^5.7.0` | Latest stable; `moduleResolution: bundler` |
| `@t3-oss/env-nextjs` | `^0.11.0` | Env var validation |
| `zod` | `^3.24.0` | Peer dep of t3-env; used throughout |
| `vitest` | `^2.1.0` | Test framework for packages + apps |
| `@playwright/test` | `^1.50.0` | E2E for dashboard |
| `pnpm` | `9.15.0` | Pinned via `packageManager` field |

---

## Appendix D — Infrastructure Pre-Requisites

Before the first commit in Cycle 1, the following must exist outside the codebase:

| Item | Owner | Status |
|---|---|---|
| GitHub repository created (`rainmachine`) | Shomari | ✅ Assumed |
| Vercel account linked to GitHub | Shomari | Confirm before Cycle 1 |
| Vercel project `rainmachine-dashboard` created | Shomari | Create at start of Cycle 1 |
| Vercel project `rainmachine-ceo` created | Shomari | Create at start of Cycle 1 |
| Vercel project `rainmachine-onboarding` created | Shomari | Create at start of Cycle 1 |
| Custom domains configured in Vercel | Shomari | Can defer — preview URLs work first |
| Supabase project created | Shomari | Needed for F03, not F01 |
| GitHub Secrets: `TURBO_TOKEN`, `TURBO_TEAM` | Shomari | Optional in Cycle 1 |

---

*PRD F01 — Monorepo Foundation & CI/CD*
*Sigma Protocol Step 11 · MIRD AI Corporate Machine*
*Written: 2026-04-02 · Cycle 1 · Release 0*
*Next PRD: F02 (Design System) + F03 (Supabase Auth) — can be written in parallel*

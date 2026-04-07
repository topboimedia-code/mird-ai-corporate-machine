# MIRD AI Corporate Machine — Development Workflow
## Phase K Output | Step 8: Technical Specification
## Version: 1.0 | Date: 2026-03-31

---

## Overview

MIRD is a solo-operator build with occasional contractor contributions. The workflow is optimized for **shipping velocity with confidence** — fast local feedback loops, automatic quality gates in CI, and a branching strategy that keeps `main` always deployable. No bureaucratic process overhead.

---

## 1. Repository Structure

```
mird-ai-corporate-machine/          # Turborepo monorepo root
├── apps/
│   ├── rainmachine/                # Next.js 15 — app.makeitrain.digital
│   ├── ceo-dashboard/              # Next.js 15 — ceo.makeitrain.digital
│   └── onboarding/                 # Next.js 15 — setup.makeitrain.digital
├── packages/
│   ├── ui/                         # Shared JARVIS Dark components
│   ├── types/                      # Shared TypeScript types + Result<T,E>
│   ├── api-client/                 # Supabase client factories
│   ├── design-tokens/              # JARVIS Dark CSS variables + Tailwind config
│   └── ai-agents/                  # Claude agent runner + configs
├── supabase/
│   ├── migrations/                 # Numbered SQL migration files
│   ├── functions/                  # Deno Edge Function source
│   │   ├── ghl-webhook/
│   │   ├── retell-webhook/
│   │   ├── google-oauth-callback/
│   │   └── provision-org/
│   └── seed.ts                     # Local dev + CI seed data
├── e2e/                            # Playwright E2E specs (all apps)
├── docs/                           # All Sigma Protocol output docs
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Main CI pipeline
│       └── preview-cleanup.yml     # Clean up old preview deployments
├── turbo.json                      # Turborepo pipeline config
├── pnpm-workspace.yaml             # pnpm workspace definition
├── package.json                    # Root package.json (dev tooling)
├── tsconfig.base.json              # Shared TypeScript base config
├── .eslintrc.base.js               # Shared ESLint base config
└── prettier.config.ts              # Root Prettier config
```

---

## 2. Git Branching Strategy

### 2.1 Branch Model

```
main ─────────────────────────────────────────────────────► production
  │
  ├── feature/rm-lead-slideout        # RainMachine feature
  ├── feature/ceo-northstar-chart     # CEO Dashboard feature
  ├── feature/ob-step4-google-oauth   # Onboarding feature
  ├── fix/ghl-webhook-signature       # Bug fix
  ├── chore/update-dependencies       # Maintenance
  └── docs/add-adr-009                # Documentation only
```

**Two permanent branches:**
- `main` — always production-ready; auto-deploys to all 3 Vercel production projects + triggers DB migrations
- `staging` — optional pre-production gate for QA before merging to main (used for major releases)

**All work in short-lived feature branches.** No long-running branches. PRs merged with **squash merge** to keep `main` history linear.

### 2.2 Branch Naming Convention

```
<type>/<scope>-<short-description>

Types:
  feature/    New functionality
  fix/        Bug fix
  chore/      Dependencies, tooling, config
  docs/       Documentation only
  refactor/   Code restructure without behavior change
  perf/       Performance improvement
  test/       Test additions only

Examples:
  feature/rm-lead-pipeline-filters
  feature/ceo-client-drilldown-modal
  fix/retell-webhook-401-on-valid-sig
  chore/upgrade-next-15-1
  docs/update-openapi-retell-schema
  test/add-rls-cross-org-integration
```

### 2.3 Protected Branch Rules (GitHub)

```yaml
# Branch protection: main
require_pull_request_reviews: true
required_approving_review_count: 1        # Solo: Shomari reviews contractor PRs
dismiss_stale_reviews: true
require_status_checks_before_merging: true
required_status_checks:
  - quality (typecheck + lint)
  - test (unit + integration)
  - e2e (Playwright — on main PRs)
allow_force_pushes: false
allow_deletions: false
```

### 2.4 Commit Message Convention

Following [Conventional Commits](https://www.conventionalcommits.org/) — enforced by commitlint in CI.

```
<type>(<scope>): <short description>

[optional body]

[optional footer: BREAKING CHANGE, Closes #issue]
```

**Types:** `feat` | `fix` | `chore` | `docs` | `refactor` | `perf` | `test` | `style` | `ci`

**Scopes:** `rm` (RainMachine) | `ceo` (CEO Dashboard) | `ob` (Onboarding) | `db` (Database) | `edge` (Edge Functions) | `agents` (Claude agents) | `ui` (shared UI) | `types` | `infra` | `n8n`

```
# Examples
feat(rm): add lead stage filter to pipeline board
fix(edge): correct HMAC verification for GHL webhook
feat(agents): add churn risk detection to dept1-growth
chore(deps): upgrade @supabase/supabase-js to 2.45.0
docs(db): add rollback comment to migration 0008
test(rm): add RLS cross-org isolation integration tests
refactor(ob): extract onboarding token validation to shared utility
perf(ceo): add read replica routing for command center aggregate query
```

**Breaking changes:**
```
feat(db)!: rename lead_stage enum values to uppercase

BREAKING CHANGE: All client code must update LeadStage enum references.
Migration 0009 handles DB-side rename. See ADR-010.
```

---

## 3. Turborepo Pipeline

### 3.1 `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    "tsconfig.base.json",
    ".eslintrc.base.js"
  ],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"],
      "outputs": []
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "env": [
        "DATABASE_URL",
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY"
      ]
    },
    "e2e": {
      "dependsOn": ["build"],
      "outputs": ["playwright-report/**", "test-results/**"],
      "env": [
        "PLAYWRIGHT_BASE_URL",
        "E2E_USER_EMAIL",
        "E2E_USER_PASSWORD"
      ]
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

### 3.2 Key Pipeline Rules

- **`build` depends on `^build`** — shared packages (`ui`, `types`, `api-client`, `design-tokens`, `ai-agents`) always build before apps
- **`typecheck` depends on `^typecheck`** — types package checked first; downstream type errors surface correctly
- **`test` depends on `^build`** — tests run against compiled package output, not source
- **`dev` is not cached** — always runs fresh; `persistent: true` keeps watchers alive
- **Remote caching via Turbo Token** — CI uses `TURBO_TOKEN` + `TURBO_TEAM` to share build cache across runs, cutting CI time by ~60% after first run

### 3.3 Common Turbo Commands

```bash
# Root package.json scripts
pnpm turbo build                         # Build all apps + packages
pnpm turbo build --filter=rainmachine    # Build only RainMachine (+ its deps)
pnpm turbo typecheck                     # Type-check all packages
pnpm turbo lint                          # Lint all packages
pnpm turbo test                          # Run all Vitest suites
pnpm turbo test --filter=rainmachine     # Test only RainMachine
pnpm turbo dev                           # Start all 3 apps in dev mode

# Direct pnpm workspace commands
pnpm --filter rainmachine dev            # Dev server on :3000
pnpm --filter ceo-dashboard dev         # Dev server on :3001
pnpm --filter onboarding dev            # Dev server on :3002
pnpm --filter @mird/ui storybook        # Component library (if Storybook added)
```

---

## 4. Local Development Setup

### 4.1 Prerequisites

```bash
# Required tools
node --version   # 22.x LTS
pnpm --version   # 9.x
supabase --version  # latest CLI

# Install pnpm if needed
npm install -g pnpm@9

# Install Supabase CLI
brew install supabase/tap/supabase    # macOS
```

### 4.2 First-Time Setup

```bash
# 1. Clone and install
git clone https://github.com/makeitrain-digital/mird-ai-corporate-machine.git
cd mird-ai-corporate-machine
pnpm install

# 2. Copy env files
cp apps/rainmachine/.env.example apps/rainmachine/.env.local
cp apps/ceo-dashboard/.env.example apps/ceo-dashboard/.env.local
cp apps/onboarding/.env.example apps/onboarding/.env.local
# Fill in values from Supabase dashboard + 1Password vault

# 3. Start Supabase local stack
supabase start
# → Outputs: API URL, anon key, service_role key, DB URL

# 4. Apply schema + seed data
supabase db reset
# → Runs all migrations + supabase/seed.ts

# 5. Start all apps
pnpm turbo dev
# → rainmachine:   http://localhost:3000
# → ceo-dashboard: http://localhost:3001
# → onboarding:    http://localhost:3002
```

### 4.3 Supabase Local Dev Reference

```bash
supabase start          # Start local Postgres + Auth + Storage + Realtime
supabase stop           # Stop all local services
supabase db reset       # Wipe DB, apply migrations, run seed.ts
supabase db diff        # Show diff between local schema and migrations
supabase migration new <name>   # Create new timestamped migration file
supabase functions serve        # Run Edge Functions locally (Deno)
supabase status         # Show local service URLs + credentials
```

### 4.4 Database Migration Workflow

```bash
# 1. Make schema changes directly in Supabase Studio (local)
#    → http://localhost:54323

# 2. Generate migration from diff
supabase db diff -f add_lead_notes_column

# 3. Review generated file
cat supabase/migrations/20260401000000_add_lead_notes_column.sql

# 4. Add rollback comment at top
-- rollback: ALTER TABLE leads DROP COLUMN IF EXISTS notes;

# 5. Test reset works cleanly
supabase db reset

# 6. Commit migration file with chore(db) commit type
git add supabase/migrations/
git commit -m "feat(db): add notes column to leads table"
```

**Migration naming:** `YYYYMMDDHHMMSS_<description>.sql` — Supabase CLI handles timestamp.

---

## 5. Code Quality Tools

### 5.1 TypeScript Config

```json
// tsconfig.base.json (root — all apps extend this)
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "incremental": true
  }
}
```

```json
// apps/rainmachine/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@mird/ui": ["../../packages/ui/src"],
      "@mird/types": ["../../packages/types/src"],
      "@mird/api-client": ["../../packages/api-client/src"],
      "@mird/design-tokens": ["../../packages/design-tokens/src"],
      "@mird/ai-agents": ["../../packages/ai-agents/src"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Strict mode non-negotiables:**
- `"strict": true` — all strict checks enabled
- `"noUncheckedIndexedAccess": true` — array access returns `T | undefined`
- `"exactOptionalPropertyTypes": true` — `{ foo?: string }` ≠ `{ foo: string | undefined }`

These settings prevent entire categories of runtime errors. No exceptions.

### 5.2 ESLint Config

```javascript
// .eslintrc.base.js (root)
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks', 'jsx-a11y', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'next/core-web-vitals',
  ],
  rules: {
    // TypeScript
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-floating-promises': 'error',       // Must await or void
    '@typescript-eslint/no-misused-promises': 'error',        // No async in non-async handlers

    // React
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Imports
    'import/no-default-export': 'off',                        // Next.js uses default exports
    'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
    'no-restricted-imports': ['error', {
      paths: [
        {
          name: 'react',
          importNames: ['default'],
          message: 'Use named imports from react instead.',
        },
      ],
    }],

    // Accessibility
    'jsx-a11y/no-autofocus': 'warn',                          // Allow autofocus in modals
  },
}
```

```javascript
// apps/rainmachine/.eslintrc.js
module.exports = {
  root: true,
  extends: ['../../.eslintrc.base.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
}
```

### 5.3 Prettier Config

```typescript
// prettier.config.ts (root)
import type { Config } from 'prettier'

const config: Config = {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  printWidth: 100,
  plugins: ['prettier-plugin-tailwindcss'],    // Auto-sort Tailwind classes
  tailwindConfig: './packages/design-tokens/tailwind.config.ts',
}

export default config
```

**Prettier is non-negotiable formatting.** No editor config overrides. `prettier-plugin-tailwindcss` auto-sorts class names to match Tailwind's canonical order, preventing class drift between developers.

### 5.4 Git Hooks (Husky)

```bash
# .husky/pre-commit
#!/bin/sh
pnpm lint-staged

# .husky/commit-msg
#!/bin/sh
pnpm commitlint --edit $1
```

```javascript
// lint-staged.config.js
module.exports = {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{js,mjs,cjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,yaml,yml,md}': ['prettier --write'],
  '*.sql': ['prettier --write'],
}
```

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [
      'rm', 'ceo', 'ob', 'db', 'edge', 'agents', 'ui', 'types',
      'infra', 'n8n', 'ci', 'deps', 'config',
    ]],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
  },
}
```

---

## 6. Pull Request Process

### 6.1 PR Requirements

Every PR to `main` must satisfy:

- [ ] Branch named per convention (`feature/`, `fix/`, etc.)
- [ ] All CI checks passing (typecheck, lint, test, e2e on main PRs)
- [ ] PR description filled out (template below)
- [ ] No `// TODO` or `// FIXME` comments introduced
- [ ] No `console.log` left in production code
- [ ] No hardcoded org IDs, user IDs, or secrets
- [ ] Migration file includes `-- rollback:` comment if schema change
- [ ] WCAG check: new interactive components have axe-core test

### 6.2 PR Description Template

```markdown
## What
<!-- One sentence: what does this PR change? -->

## Why
<!-- Context: what problem does this solve? Link to issue/PRD if relevant -->

## How
<!-- Brief implementation notes — any non-obvious decisions -->

## Test plan
- [ ] Unit tests added/updated
- [ ] Integration test added if auth/RLS boundary touched
- [ ] E2E test added/updated if user flow changed
- [ ] Manually tested in local dev
- [ ] Verified in Vercel preview URL

## Screenshots (if UI change)
<!-- Before / After -->

## Checklist
- [ ] No hardcoded secrets
- [ ] Migration includes rollback comment
- [ ] `console.log` removed
- [ ] TypeScript strict — no `as any` added
```

### 6.3 Review Scope by Change Type

| Change Type | Review Focus |
|-------------|-------------|
| RLS policy change | Cross-org isolation test added; policy logic reviewed |
| Server action | Auth check present; explicit `organization_id` WHERE; Result<T,E> returned |
| Edge Function | Signature verification tested; error responses match OpenAPI spec |
| New DB table | RLS enabled; `organization_id` FK present; `updated_at` trigger |
| New route | Auth middleware applies; route in route map in FRONTEND-SPEC.md |
| Shared package change | No breaking change to apps; `@mird/types` version bumped if API changed |

---

## 7. Release Process

### 7.1 Normal Release (feature/fix)

```
1. Create feature branch from main
2. Develop + write tests locally
3. Push branch → Vercel creates preview URL automatically
4. Open PR with filled template
5. CI runs all checks (typecheck, lint, test, e2e)
6. Review (self or contractor)
7. Squash merge to main
8. GitHub Actions: deploy DB migrations + Edge Functions
9. Vercel: auto-deploys all 3 apps to production
10. Verify in production — Slack #mird-ops notified
```

### 7.2 Major Release (breaking changes / multi-PR)

```
1. Create staging branch from main
2. Merge all feature PRs into staging (not main)
3. Run full E2E suite against staging Vercel preview
4. QA sign-off (Shomari)
5. Open PR: staging → main
6. Full CI + e2e run
7. Deploy window: low-traffic period (weekday 2–4am UTC)
8. Merge + monitor Supabase logs + Slack alerts for 30 min
```

### 7.3 Hotfix Process

```
1. Create fix/ branch directly from main
2. Minimal targeted fix + regression test
3. Fast-track PR review (< 1 hour SLA for P0 issues)
4. Merge + deploy
5. Post-mortem in #mird-ops within 24h
```

---

## 8. Shared Package Development

### 8.1 Adding to `packages/ui`

```bash
# 1. Add component to packages/ui/src/components/
# 2. Export from packages/ui/src/index.ts
# 3. Add component test in packages/ui/src/__tests__/
# 4. Import in app: import { ComponentName } from '@mird/ui'

# Type-check UI package standalone
pnpm --filter @mird/ui typecheck
```

### 8.2 Adding to `packages/types`

```bash
# 1. Add type/interface to appropriate file in packages/types/src/
# 2. Export from packages/types/src/index.ts
# 3. Add type guard test in packages/types/src/__tests__/
# IMPORTANT: bump version in packages/types/package.json if public API changes
```

### 8.3 Adding to `packages/ai-agents`

```bash
# 1. Add agent config to packages/ai-agents/src/configs/
# 2. Add Zod output schema
# 3. Register in agentRegistry
# 4. Add cron route in apps/rainmachine/src/app/api/cron/
# 5. Add to vercel.json crons array
# 6. Test locally: supabase functions serve (for Edge) or pnpm dev (for cron)
```

---

## 9. Environment Variable Management

**Source of truth:** Vercel dashboard (production) and 1Password vault (all envs).

```bash
# Pull production env vars to local (Vercel CLI)
vercel env pull apps/rainmachine/.env.local --environment=production

# Add new secret to Supabase Edge Functions
supabase secrets set NEW_SECRET=value --linked

# Rotate a secret (e.g., CRON_SECRET quarterly)
# 1. Generate new secret: openssl rand -hex 32
# 2. Update in Vercel dashboard (all 3 apps if shared)
# 3. Redeploy: vercel --prod
# 4. Update in 1Password vault
# 5. Update in GitHub Actions secrets
```

**Adding a new env var checklist:**
- [ ] Add to `.env.example` (placeholder value, committed to git)
- [ ] Add to `vercel.json` or Vercel dashboard for each environment
- [ ] Document in INFRASTRUCTURE.md §2.2
- [ ] If needed in Edge Functions: `supabase secrets set`
- [ ] If needed in GitHub Actions: add to repo secrets
- [ ] Never prefix with `NEXT_PUBLIC_` unless browser-safe

---

*Development workflow complete as of 2026-03-31. Turborepo monorepo, conventional commits, Husky pre-commit hooks, CI-enforced quality gates, squash-merge to main, Vercel auto-deploy.*

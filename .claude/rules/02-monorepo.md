# Rule: Monorepo & Build System
# Loads when: setting up packages, editing turbo.json, pnpm workspaces, CI/CD

## Stack
- **Turborepo 2.3.x** — task runner and build cache
- **pnpm 9.x** — package manager with workspace support
- **Node.js 22 LTS**

## Monorepo Layout

```
/
├── apps/
│   ├── dashboard/          Next.js 15, port 3000
│   ├── ceo/                Next.js 15, port 3001
│   └── onboarding/         Next.js 15, port 3002
├── packages/
│   ├── ui/                 Shared component library (JARVIS Dark)
│   ├── db/                 Supabase client factory + generated types
│   └── config/             Tailwind preset + ESLint config + TS base config
├── turbo.json
├── pnpm-workspace.yaml
└── package.json            Root — no dependencies, scripts only
```

## turbo.json Pipeline

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
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
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## Package Naming Convention
- Apps: no scope prefix (`dashboard`, `ceo`, `onboarding`)
- Packages: `@rainmachine/ui`, `@rainmachine/db`, `@rainmachine/config`

## Workspace Imports
Always import packages by scope name, never by relative path across workspace boundaries:
```ts
// ✅ correct
import { Button } from '@rainmachine/ui'
import { createServerClient } from '@rainmachine/db'

// ❌ wrong
import { Button } from '../../packages/ui/src'
```

## Adding a New Package
1. Create `packages/[name]/package.json` with `"name": "@rainmachine/[name]"`
2. Add `"@rainmachine/[name]": "workspace:*"` to the consuming app's `package.json`
3. Run `pnpm install` from root
4. Add to `turbo.json` pipeline if it has build output

## Environment Variables
- Each app has its own `.env.local`
- Validated at startup via `@t3-oss/env-nextjs` schema in `apps/[name]/src/env.ts`
- Vercel: separate env var sets per project (dashboard, ceo, onboarding)
- Server-only vars: no `NEXT_PUBLIC_` prefix, never imported in client components

## CI Pipeline (GitHub Actions)
```yaml
# On PR:
- pnpm lint        (all packages)
- pnpm typecheck   (all packages)

# On merge to main:
- pnpm build       (Turborepo caches unchanged apps)
- pnpm test        (Vitest)
```

## Common Commands
```bash
pnpm dev                           # start all apps
pnpm dev --filter=dashboard        # start one app
pnpm build --filter=dashboard      # build one app
pnpm test                          # run all tests
pnpm typecheck                     # check types across all packages
pnpm lint                          # lint all packages
pnpm --filter=@rainmachine/db exec supabase gen types  # regenerate DB types
```

## Rules
- Root `package.json` has no `dependencies` — only scripts and `devDependencies` shared across all workspaces
- Never `npm install` — always `pnpm install`
- Never commit `.turbo/` or `node_modules/`
- `packages/config` exports: `tailwind-preset.ts`, `eslint-config.js`, `tsconfig.base.json`
- All apps extend `@rainmachine/config` for consistent TS/lint/tailwind settings

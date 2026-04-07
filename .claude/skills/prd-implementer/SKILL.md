---
name: prd-implementer
description: "Implement RainMachine features from PRD spec — read PRD, verify dependencies, follow implementation order, hit cycle exit gates"
version: "1.0.0"
triggers:
  - /prd-implementer
  - implement feature
  - implement prd
  - start feature
  - start cycle
  - implement f01
  - implement f02
  - implement f03
  - build feature from prd
  - next feature
---

# PRD Implementer — RainMachine Project Overlay

## Project Anchors
- `docs/prds/F0N-*.md` → current PRD (read ALL 11 sections)
- `docs/implementation/BETTING-TABLE.md` → cycle order + exit gates
- `docs/implementation/FEATURE-DEPENDENCIES.md` → dependency check
- `docs/implementation/RABBIT-HOLES.md` → known risks
- `.claude/rules/11-prd-workflow.md` → full workflow

## Step 0: Before Writing Any Code

```
1. Identify current active cycle in BETTING-TABLE.md
2. Read the target PRD completely (all 11 sections)
3. Check dependencies in FEATURE-DEPENDENCIES.md — all must be deployed
4. Check RABBIT-HOLES.md for this PRD's known risks
5. Note all BDD scenarios — these become your Playwright tests
6. Note all tables in the Database section — migrations come first
```

## Implementation Sequence (strict order)

```
STEP 1: DB Migration
  → Write SQL (CREATE TABLE + RLS + trigger)
  → Run migration against local Supabase
  → Regenerate TypeScript types

STEP 2: TypeScript Types
  → packages/db/src/types/domain.ts
  → Add extended types (WithAgent, WithCalls, etc.)

STEP 3: Server Actions
  → apps/[app]/app/actions/[domain].ts
  → Zod schema + auth guard + Result<T> return

STEP 4: API Routes (if any)
  → apps/[app]/app/api/webhooks/[service]/route.ts
  → Only for: webhooks, OAuth callbacks, polling, streaming

STEP 5: Test Stubs
  → Write Playwright test file from BDD scenarios (empty test bodies)
  → Write Vitest stubs for server action validation tests

STEP 6: RSC Page
  → apps/[app]/app/(group)/[path]/page.tsx
  → Fetch data on server, pass as props

STEP 7: Client Components
  → Extract interactive islands as 'use client'
  → Implement optimistic updates where PRD specifies

STEP 8: Integration Points
  → Connect external API calls (n8n webhooks, Retell, etc.)

STEP 9: Fill in Tests
  → Complete Playwright tests (all BDD scenarios)
  → Complete Vitest unit tests (validation + error paths)
  → pgTAP RLS test if new tables added

STEP 10: Validate
  → .sigma/tools/validate-feature.sh
  → All 4 checks must pass before continuing
```

## BDD → Playwright Mapping

For every scenario in the PRD, write this test:
```ts
test('[Given context — When action — Then outcome]', async ({ page }) => {
  // GIVEN: set up the precondition
  // WHEN: perform the action
  // THEN: assert the outcome
})
```

## Cycle 1 PRD Order
```
F01 → Monorepo Foundation        docs/prds/F01-monorepo-foundation.md
F02 → Design System              docs/prds/F02-design-system.md        (after F01)
F03 → Supabase + Auth            docs/prds/F03-supabase-auth.md        (parallel with F02)
```

## Definition of Done (every feature)
- [ ] All BDD scenarios have passing Playwright tests
- [ ] `pnpm typecheck` → 0 errors
- [ ] `pnpm lint` → 0 errors
- [ ] `pnpm test` → 0 failures
- [ ] `pnpm build` → 0 errors
- [ ] pgTAP RLS tests pass (if new tables)
- [ ] All empty states render without JS errors
- [ ] OWASP checklist verified (from PRD)
- [ ] Cycle exit gate items checked in BETTING-TABLE.md

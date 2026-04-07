# Rule: PRD Workflow — How to Implement Features
# Loads when: starting a new feature, reading a PRD, beginning a cycle

## The Build Contract

Every feature in RainMachine has a PRD in `docs/prds/F0N-*.md`.
**The PRD is the single source of truth.** If the PRD says to build it, build it exactly. If something is unclear, re-read the PRD before asking.

## Before Writing Any Code

1. **Read the PRD completely.** All 11 sections.
2. **Check dependencies.** `docs/implementation/FEATURE-DEPENDENCIES.md` — confirm all dependencies are deployed.
3. **Read the SCHEMA** if the PRD adds new tables: `docs/tech/database/SCHEMA-COMPLETE.sql`
4. **Note the BDD scenarios.** These are your acceptance tests. Write them before implementing.
5. **Check RABBIT-HOLES.md** for known risks on this PRD.

## PRD Sections and What to Do With Each

| Section | Action |
|---------|--------|
| **Overview** | Understand what you're building and why |
| **Database** | Run the DDL migrations FIRST before any app code |
| **TypeScript Interfaces** | Create types in `packages/db/src/types/` before writing logic |
| **Server Actions** | Implement with Zod validation + Result pattern |
| **API Routes** | Add to `app/api/` — webhook receivers + OAuth callbacks only |
| **UI Components** | Build from component library first, create new only if needed |
| **Integration Points** | Reference `08-external-apis.md` for each service |
| **BDD Scenarios** | Write Playwright tests BEFORE implementing the UI |
| **Test Plan** | Implement all three layers: unit + integration + E2E |
| **OWASP Checklist** | Verify each item before marking feature done |
| **Open Questions** | Decide before implementing — don't leave ambiguous |

## Implementation Order for a Feature

```
1. DB migration (DDL + RLS + pgTAP tests)
2. TypeScript types (generated + extended)
3. Server actions (with Zod validation)
4. API routes (if any — webhooks, OAuth)
5. Playwright test stubs (based on BDD scenarios)
6. RSC page (data fetching from Supabase)
7. Client components (interactive islands)
8. Integration points (external API calls)
9. Run .sigma/tools/typecheck.sh → fix all errors
10. Run .sigma/tools/test.sh → fix all failures
11. Run .sigma/tools/build.sh → fix all errors
12. Run Playwright tests → fix all failures
13. Verify OWASP checklist
14. Mark cycle exit gate items as complete
```

## Cycle Exit Gates

Each cycle has explicit exit gate criteria in `docs/implementation/BETTING-TABLE.md`.
A cycle is NOT complete until ALL exit gate items pass — not just the main feature.

**Cycle 1 exit gate example:**
```
✅ Monorepo builds, all 3 apps boot, CI passes
✅ All 16 shared components render on /ui-demo
✅ RM login, CEO login + 2FA, session expiry work end-to-end
✅ RLS: cross-tenant data isolation verified by pgTAP tests
```

## Feature File Structure Convention

```
apps/dashboard/
└── app/
    └── (dashboard)/
        └── dashboard/
            └── leads/
                ├── page.tsx              RSC — data fetching, pass to client
                ├── LeadsTable.tsx        'use client' — interactive table
                ├── LeadSlideOver.tsx     'use client' — slide-over panel
                ├── TranscriptModal.tsx   'use client' — modal
                └── actions.ts           'use server' — mutations

packages/ui/src/components/
└── DataTable/
    ├── index.tsx         component
    ├── DataTable.test.tsx  RTL tests
    └── types.ts          prop types
```

## How to Read BDD Scenarios

```
Given [initial context / system state]
When [user action or system event]
Then [expected outcome]
And [additional assertions]
```

```
// BDD → Playwright test mapping:
// Given: a tenant with 25 leads in "new" stage
// When: the team leader visits /dashboard/leads and filters by stage "new"
// Then: the table shows 25 rows
// And: the URL contains ?stage=new

test('lead table filters by stage', async ({ page }) => {
  // Given: seed 25 leads
  await seedLeads(TEST_TENANT_ID, 25, 'new')

  // When: visit and filter
  await page.goto('/dashboard/leads')
  await page.click('[data-testid="stage-filter"]')
  await page.click('[data-testid="filter-option-new"]')

  // Then: 25 rows
  await expect(page.locator('[data-testid="lead-row"]')).toHaveCount(25)

  // And: URL updated
  await expect(page).toHaveURL(/stage=new/)
})
```

## Definition of Done

A feature is done when:
- [ ] All PRD BDD scenarios have passing tests
- [ ] TypeScript: zero type errors (`pnpm typecheck`)
- [ ] Linting: zero errors (`pnpm lint`)
- [ ] Unit tests pass: zero failures (`pnpm test`)
- [ ] Build succeeds: zero errors (`pnpm build`)
- [ ] E2E tests pass: all Playwright scenarios green
- [ ] pgTAP: RLS tests pass (if new tables added)
- [ ] Empty states: all widgets/lists render with no data
- [ ] OWASP checklist: all items verified for this feature
- [ ] Cycle exit gate: all items checked off in BETTING-TABLE.md

## PRD Amendments

If you discover during implementation that a PRD is wrong, missing, or needs clarification:
1. Document the discrepancy in a comment at the top of the relevant file
2. Make the practical decision needed to unblock the build
3. Note it as an open question for the next planning pass
4. Do NOT silently deviate from the PRD without documenting why

## Current Build Target

Check `docs/implementation/BETTING-TABLE.md` for the current active cycle and which PRDs are the active bets. Start with the lowest F-number that has all dependencies met.

**Cycle 1 (current):**
- F01: Monorepo Foundation → `docs/prds/F01-monorepo-foundation.md`
- F02: Design System → `docs/prds/F02-design-system.md` (starts after F01)
- F03: Supabase + Auth → `docs/prds/F03-supabase-auth.md` (parallel with F02)

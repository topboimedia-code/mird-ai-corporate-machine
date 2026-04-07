---
name: test-engineer
description: "Write RainMachine tests — Playwright E2E from BDD scenarios, Vitest server action tests, pgTAP RLS tests, RTL component snapshots"
version: "1.0.0"
triggers:
  - /test-engineer
  - write tests
  - playwright test
  - vitest test
  - pgtap test
  - bdd test
  - e2e test
  - component test
  - acceptance test
  - test coverage
---

# Test Engineer — RainMachine Project Overlay

## Project Anchors
- `docs/prds/F0N-*.md` → BDD Scenarios + Test Plan sections
- `.claude/rules/09-testing.md` → full testing patterns
- `docs/tech/testing/TESTING-STRATEGY.md`

## The Rule

Tests are derived from BDD acceptance criteria in the PRD. Every `Given/When/Then` = one Playwright test. No exceptions.

## BDD → Playwright (exact pattern)

```ts
// PRD BDD Scenario:
// Given: a tenant with 25 leads in "new" stage
// When: user visits /dashboard/leads and selects stage filter "New"
// Then: table shows 25 rows
// And: URL contains ?stage=new

test('lead table filters by stage via URL param', async ({ page }) => {
  // GIVEN
  await seedLeads(TEST_TENANT_ID, 25, 'new')
  await loginAs(page, 'team-leader')

  // WHEN
  await page.goto('/dashboard/leads')
  await page.getByTestId('stage-filter').click()
  await page.getByTestId('filter-option-new').click()

  // THEN
  await expect(page.locator('[data-testid="lead-row"]')).toHaveCount(25)
  // AND
  await expect(page).toHaveURL(/stage=new/)
})
```

## Selector Rule — data-testid only
```ts
// ✅ stable
page.getByTestId('lead-stage-dropdown')
page.getByTestId('bulk-reassign-button')

// ❌ fragile — breaks on copy/style changes
page.locator('.text-cyan-500')
page.getByText('REASSIGN')
page.locator('button:nth-child(2)')
```

## Vitest Server Action Tests (always write these)
```ts
// Test 1: validation failure
it('returns error for invalid UUID', async () => {
  const result = await actionFn({ id: 'not-a-uuid' })
  expect(result.ok).toBe(false)
  expect(result.error).toBeDefined()
})

// Test 2: validation success (with mocked DB via MSW)
it('returns success for valid input', async () => {
  server.use(http.post('/supabase/...', () => HttpResponse.json({ data: mockData })))
  const result = await actionFn({ id: validUUID })
  expect(result.ok).toBe(true)
})
```

## pgTAP RLS (required for every new table)
```sql
BEGIN;
SELECT plan(3);
-- Tenant isolation test
-- CEO access test
-- Mutation test (only own tenant)
SELECT * FROM finish();
ROLLBACK;
```

## Component Snapshot (RTL)
```tsx
it('renders StatusDot in all variants without errors', () => {
  const statuses = ['online', 'processing', 'at-risk', 'offline', 'standby'] as const
  statuses.forEach(status => {
    const { container, unmount } = render(<StatusDot status={status} />)
    expect(container).toMatchSnapshot()
    unmount()
  })
})
```

## Empty State Test (always include)
```ts
test('renders empty state without JS errors when data is null', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

  await page.goto('/dashboard/leads') // seeded with 0 leads
  await expect(page.getByTestId('empty-state-leads')).toBeVisible()
  expect(errors).toHaveLength(0)
})
```

## Realtime Test Pattern
```ts
test('KPI updates live when metrics row inserted', async ({ page }) => {
  await page.goto('/dashboard')
  const before = await page.getByTestId('kpi-leads-count').textContent()
  await triggerRealtimeUpdate(TEST_TENANT_ID)
  await expect(page.getByTestId('kpi-leads-count')).not.toHaveText(before!, { timeout: 3000 })
})
```

## Testing Checklist
- [ ] Every BDD scenario in the PRD has a Playwright test
- [ ] Every server action has a Vitest test (validation failure path)
- [ ] Every new table has a pgTAP RLS test
- [ ] Every new component has a snapshot test
- [ ] Empty state test for every list/widget
- [ ] No `page.locator('.className')` selectors — only data-testid
- [ ] All tests pass: `pnpm test && .sigma/tools/e2e.sh`

# Rule: Testing Strategy
# Loads when: writing tests, test files, Vitest, Playwright, RTL, pgTAP, MSW

## Testing Pyramid for RainMachine

```
         ┌─────────────┐
         │  E2E (Playwright)    │  ← Critical user paths only
         ├─────────────────────┤
         │  Integration (Vitest + MSW)  │  ← Server actions + DB
         ├─────────────────────────────┤
         │     Unit (Vitest + RTL)       │  ← Components + pure functions
         └──────────────────────────────┘
```

**Rule:** Tests are derived from BDD acceptance criteria in each PRD. Every Given/When/Then scenario maps to at least one test.

---

## Vitest (Unit + Integration)

### Config
```ts
// vitest.config.ts (per app or at root)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80, functions: 80, branches: 70 },
    },
  },
})
```

### Server Action Unit Tests
```ts
// __tests__/actions/leads.test.ts
import { describe, it, expect, vi } from 'vitest'
import { updateLeadStage } from '../actions/leads'

describe('updateLeadStage', () => {
  it('returns error for invalid stage', async () => {
    const result = await updateLeadStage({
      leadId: crypto.randomUUID(),
      newStage: 'invalid_stage' as any,
      updatedAt: new Date().toISOString(),
    })
    expect(result.ok).toBe(false)
    expect(result.error).toContain('invalid')
  })

  it('returns error for malformed UUID', async () => {
    const result = await updateLeadStage({
      leadId: 'not-a-uuid',
      newStage: 'contacted',
      updatedAt: new Date().toISOString(),
    })
    expect(result.ok).toBe(false)
  })
})
```

### Component Tests (React Testing Library)
```tsx
// __tests__/components/StatusDot.test.tsx
import { render, screen } from '@testing-library/react'
import { StatusDot } from '@rainmachine/ui'

describe('StatusDot', () => {
  it('renders online state', () => {
    render(<StatusDot status="online" data-testid="status-dot" />)
    expect(screen.getByTestId('status-dot')).toBeInTheDocument()
    // snapshot test to catch visual regressions
    expect(screen.getByTestId('status-dot')).toMatchSnapshot()
  })

  it('renders all status variants without errors', () => {
    const statuses = ['online', 'processing', 'at-risk', 'offline', 'standby'] as const
    statuses.forEach(status => {
      const { unmount } = render(<StatusDot status={status} />)
      unmount()
    })
  })
})
```

### MSW for API Mocking
```ts
// src/test/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('https://api.retellai.com/v2/create-phone-call', () => {
    return HttpResponse.json({ call_id: 'test-call-id-123' })
  }),

  http.get('https://graph.facebook.com/me', () => {
    return HttpResponse.json({
      id: 'test-account-id',
      name: 'Test Ad Account',
    })
  }),
]

// src/test/setup.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

const server = setupServer(...handlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Claude API Output Tests
```ts
// Test schema validation — not Claude itself
it('parses valid Claude response correctly', () => {
  const mockClaudeOutput = {
    executive_summary: 'Strong week overall.',
    key_metrics: [{ label: 'Leads', value: '47', delta: '+12%' }],
    recommendations: ['Increase Meta budget on weekends'],
  }
  const result = WeeklyBriefSchema.safeParse(mockClaudeOutput)
  expect(result.success).toBe(true)
})

it('logs schema_error for malformed Claude response', async () => {
  const malformedOutput = { wrong_field: 'oops' }
  const result = WeeklyBriefSchema.safeParse(malformedOutput)
  expect(result.success).toBe(false)
  // schema_error path, not api_error
})
```

---

## Playwright (E2E)

### Config
```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev --filter=dashboard',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Critical Path Tests (Always Required)
Every PRD specifies Playwright tests. These are non-negotiable:

```ts
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('RM login flow', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', 'test@example.com')
  await page.fill('[data-testid="password-input"]', 'testpassword')
  await page.click('[data-testid="login-button"]')
  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByTestId('kpi-leads-card')).toBeVisible()
})

test('empty state renders without errors', async ({ page }) => {
  // seed: tenant with no leads
  await page.goto('/dashboard/leads')
  await expect(page.getByTestId('empty-state')).toBeVisible()
  // no console errors
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  expect(errors).toHaveLength(0)
})
```

### Selector Convention
Always use `data-testid` attributes — never CSS classes or text content:
```ts
// ✅ stable selectors
page.getByTestId('lead-stage-dropdown')
page.getByTestId('bulk-reassign-button')

// ❌ fragile selectors
page.locator('.text-cyan-500')
page.getByText('REASSIGN')
```

### Realtime Test Pattern
```ts
test('KPI card updates when metrics changes', async ({ page }) => {
  await page.goto('/dashboard')
  const initialValue = await page.getByTestId('kpi-leads-count').textContent()

  // Insert new metrics row via test API
  await page.request.post('/api/test/trigger-metrics-update', {
    data: { tenantId: TEST_TENANT_ID }
  })

  // Wait for Realtime update — max 3s
  await expect(page.getByTestId('kpi-leads-count')).not.toHaveText(initialValue!, { timeout: 3000 })
})
```

---

## pgTAP (Supabase RLS Testing)

### Setup
```sql
-- supabase/tests/rls/leads.sql
BEGIN;
SELECT plan(4);

-- Test: Client A cannot read Client B's leads
SET LOCAL role = authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "user-a", "tenant_id": "tenant-a"}';
SELECT is(
  (SELECT count(*)::int FROM leads WHERE tenant_id = 'tenant-b'),
  0,
  'Tenant A cannot read tenant B leads'
);

-- Test: CEO can read all tenants
SET LOCAL "request.jwt.claims" = '{"sub": "ceo-user", "role": "ceo"}';
SELECT ok(
  (SELECT count(*)::int FROM leads) > 0,
  'CEO can read all leads'
);

SELECT * FROM finish();
ROLLBACK;
```

Run with: `pnpm supabase test db`

---

## Accessibility Tests (axe-core)

```ts
import { checkA11y } from 'axe-playwright'

test('leads page has no accessibility violations', async ({ page }) => {
  await page.goto('/dashboard/leads')
  await checkA11y(page, '#main-content', {
    detailedReport: true,
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  })
})
```

---

## Test File Locations

```
apps/dashboard/
├── __tests__/
│   ├── actions/          unit tests for server actions
│   └── components/       RTL component tests
├── e2e/
│   ├── auth.spec.ts
│   ├── leads.spec.ts
│   └── settings.spec.ts
packages/ui/
└── __tests__/            snapshot + unit tests for all 16 components
supabase/
└── tests/
    └── rls/              pgTAP RLS policy tests
```

## Definition of Done (per feature)
- [ ] Server action unit tests: input validation + error paths
- [ ] Component snapshot tests for new components
- [ ] Playwright E2E for each BDD acceptance scenario
- [ ] pgTAP RLS test if new table added
- [ ] Axe a11y check on new pages
- [ ] All tests pass: `pnpm test && pnpm e2e`

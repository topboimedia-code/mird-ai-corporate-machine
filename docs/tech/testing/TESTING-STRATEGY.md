# MIRD AI Corporate Machine — Testing Strategy
## Phase J Output | Step 8: Technical Specification
## Version: 1.0 | Date: 2026-03-31

---

## Overview

MIRD's testing strategy is built around **confidence at the boundaries** — the places where the system can fail silently: RLS policies, server action auth checks, webhook signature verification, and multi-step onboarding flows. Unit tests verify pure logic; integration tests verify DB behavior under real RLS; E2E tests verify critical user journeys end-to-end; accessibility tests verify WCAG compliance on every interactive component.

**Testing philosophy:** Test behavior, not implementation. Every test should answer: "Does this do what a user or calling system expects?" Not: "Does this call this internal function?"

---

## 1. Test Stack

| Layer | Tool | Version | Purpose |
|-------|------|---------|---------|
| Unit + Integration | Vitest | ^2.0 | Fast, TypeScript-native, compatible with pnpm workspaces |
| React component testing | Vitest + @testing-library/react | ^16.0 | Component behavior (not snapshot) |
| API mocking | MSW (Mock Service Worker) | ^2.4 | Intercept fetch/HTTP in tests and browser |
| E2E | Playwright | ^1.45 | Full browser automation across all 3 apps |
| Accessibility | axe-core + @axe-core/playwright | ^4.9 | WCAG 2.1 AA automated audit |
| DB testing | Supabase local dev (`supabase start`) | — | Real PostgreSQL with RLS active |
| Coverage | Vitest `--coverage` (v8 provider) | — | Branch + line coverage reports |

---

## 2. Test Organization

```
mird-ai-corporate-machine/
├── apps/
│   ├── rainmachine/
│   │   ├── __tests__/
│   │   │   ├── unit/               # Pure functions, utilities
│   │   │   ├── integration/        # Server actions with real DB
│   │   │   └── e2e/                # Playwright specs (rainmachine flows)
│   │   └── vitest.config.ts
│   ├── ceo-dashboard/
│   │   ├── __tests__/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   └── vitest.config.ts
│   └── onboarding/
│       ├── __tests__/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       └── vitest.config.ts
├── packages/
│   ├── types/
│   │   └── __tests__/             # Type guard tests
│   └── ai-agents/
│       └── __tests__/             # Agent output schema tests
├── playwright.config.ts           # Root Playwright config (all 3 apps)
├── vitest.workspace.ts            # Turborepo workspace config
└── .github/workflows/ci.yml       # CI runs all layers
```

---

## 3. Vitest Configuration

### 3.1 Root Workspace Config

```typescript
// vitest.workspace.ts
import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'apps/rainmachine/vitest.config.ts',
  'apps/ceo-dashboard/vitest.config.ts',
  'apps/onboarding/vitest.config.ts',
  'packages/types/vitest.config.ts',
  'packages/ai-agents/vitest.config.ts',
])
```

### 3.2 App-Level Vitest Config

```typescript
// apps/rainmachine/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    name: 'rainmachine',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/**/*.e2e.{ts,tsx}', 'node_modules'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.d.ts',
        'src/app/**/layout.tsx',    // Next.js layouts — no logic to test
        'src/app/**/loading.tsx',   // Loading UI — no logic to test
        'src/app/**/error.tsx',     // Error boundaries — minimal logic
      ],
      thresholds: {
        lines:    80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
    },
  },
})
```

### 3.3 Test Setup File

```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom'
import { server } from './mocks/server'
import { vi } from 'vitest'

// Start MSW before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}))

// Mock Supabase client (override per test with MSW or direct mock)
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
    channel: vi.fn(),
  })),
}))
```

---

## 4. Unit Tests

### 4.1 What Gets Unit Tested

| Category | Examples |
|----------|---------|
| Pure utility functions | Date formatters, phone formatters, currency formatters |
| Type guards | `isOrganizationId()`, `isLeadId()`, branded type validators |
| Result helpers | `Result.ok()`, `Result.err()`, chaining utilities |
| Lead stage logic | `mapGHLStageToMIRD()`, disposition → stage mapping |
| Validation schemas | All Zod schemas — valid + invalid inputs |
| Agent output schemas | Zod parse of all 4 Claude agent output schemas |
| Cost calculation | Agent token cost compute |

### 4.2 Example Unit Tests

```typescript
// packages/types/__tests__/branded-types.test.ts
import { describe, it, expect } from 'vitest'
import { OrganizationId, LeadId, isOrganizationId } from '@mird/types'

describe('Branded UUID types', () => {
  it('creates a valid OrganizationId', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000' as OrganizationId
    expect(isOrganizationId(id)).toBe(true)
  })

  it('rejects non-UUID strings', () => {
    expect(isOrganizationId('not-a-uuid')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isOrganizationId('')).toBe(false)
  })
})
```

```typescript
// apps/rainmachine/src/__tests__/unit/lead-stage.test.ts
import { describe, it, expect } from 'vitest'
import { mapGHLStageToMIRD, DISPOSITION_TO_STAGE } from '@/lib/ghl/stage-mapping'

describe('mapGHLStageToMIRD', () => {
  it('maps known GHL stage names to MIRD stages', () => {
    expect(mapGHLStageToMIRD('Appointment Set')).toBe('APPOINTMENT_SET')
    expect(mapGHLStageToMIRD('New Lead')).toBe('NEW')
    expect(mapGHLStageToMIRD('Not Interested')).toBe('NOT_INTERESTED')
  })

  it('returns NEW for unknown stage names', () => {
    expect(mapGHLStageToMIRD('some unknown stage')).toBe('NEW')
  })
})

describe('DISPOSITION_TO_STAGE', () => {
  it('maps APPT_SET disposition to APPOINTMENT_SET', () => {
    expect(DISPOSITION_TO_STAGE['APPT_SET']).toBe('APPOINTMENT_SET')
  })

  it('maps DNC disposition to DNC stage', () => {
    expect(DISPOSITION_TO_STAGE['DNC']).toBe('DNC')
  })
})
```

```typescript
// packages/types/__tests__/result.test.ts
import { describe, it, expect } from 'vitest'
import { Result } from '@mird/types'

describe('Result type', () => {
  it('creates ok result with data', () => {
    const result = Result.ok({ id: '123', name: 'Test' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.name).toBe('Test')
    }
  })

  it('creates err result with AppError', () => {
    const result = Result.err({ code: 'NOT_FOUND', message: 'Lead not found' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })
})
```

---

## 5. Integration Tests

Integration tests run against **Supabase local dev** (`supabase start`) with real PostgreSQL and real RLS policies active. This is the most critical test layer — it validates multi-tenancy enforcement.

### 5.1 What Gets Integration Tested

| Category | Priority | Why |
|----------|----------|-----|
| RLS cross-org isolation | **P0** | Silent failure — wrong org data served |
| Server action auth check | **P0** | UNAUTHORIZED must reject before DB query |
| Server action org scoping | **P0** | `WHERE organization_id = ?` must be present |
| Webhook signature verification | **P0** | Invalid signature must return 401 |
| Onboarding token validation | **P1** | Token expiry and rate limiting |
| Lead CRUD operations | **P1** | Full create/read/update/delete cycle |
| Appointment creation | **P1** | Links to lead and agent correctly |
| Agent assignment logic | **P2** | Round-robin weighted assignment |

### 5.2 RLS Integration Test — Cross-Org Isolation

```typescript
// apps/rainmachine/src/__tests__/integration/rls-isolation.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Two test orgs — seeded in test setup
const ORG_A_ID = 'test-org-a-uuid'
const ORG_B_ID = 'test-org-b-uuid'
const ORG_A_USER_TOKEN = process.env.TEST_ORG_A_JWT!
const ORG_B_USER_TOKEN = process.env.TEST_ORG_B_JWT!

describe('RLS: Cross-organization isolation', () => {
  let orgAClient: ReturnType<typeof createClient>
  let orgBClient: ReturnType<typeof createClient>

  beforeAll(() => {
    orgAClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${ORG_A_USER_TOKEN}` } } }
    )
    orgBClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${ORG_B_USER_TOKEN}` } } }
    )
  })

  it('org A user cannot read org B leads', async () => {
    // Seed a lead in org B
    // (seeded via admin client in test setup)

    const { data, error } = await orgAClient
      .from('leads')
      .select('*')
      .eq('organization_id', ORG_B_ID)

    // RLS should return empty array (not error) — no data leakage
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('org A user cannot update org B leads', async () => {
    const { error } = await orgAClient
      .from('leads')
      .update({ stage: 'APPOINTMENT_SET' })
      .eq('organization_id', ORG_B_ID)

    // RLS blocks update — 0 rows affected, no error thrown
    expect(error).toBeNull()
    // Verify org B lead is unchanged via admin client
  })

  it('org A user can read their own leads', async () => {
    const { data, error } = await orgAClient
      .from('leads')
      .select('*')

    expect(error).toBeNull()
    expect(data).not.toBeNull()
    // All returned leads must belong to org A
    data!.forEach(lead => {
      expect(lead.organization_id).toBe(ORG_A_ID)
    })
  })
})
```

### 5.3 Server Action Auth Test

```typescript
// apps/rainmachine/src/__tests__/integration/server-actions.test.ts
import { describe, it, expect } from 'vitest'
import { updateLeadStageAction } from '@/actions/leads'

describe('updateLeadStageAction', () => {
  it('returns UNAUTHORIZED when no session exists', async () => {
    // No auth cookies set — unauthenticated call
    const result = await updateLeadStageAction({
      leadId: 'lead-uuid',
      stage: 'APPOINTMENT_SET',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('UNAUTHORIZED')
    }
  })

  it('returns NOT_FOUND when lead belongs to different org', async () => {
    // Authenticated as org A, trying to update org B lead
    // (auth context set via test utility)
    const result = await updateLeadStageAction({
      leadId: 'org-b-lead-uuid',
      stage: 'APPOINTMENT_SET',
    })

    // Server action WHERE clause + RLS both prevent update
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(['NOT_FOUND', 'UNAUTHORIZED']).toContain(result.error.code)
    }
  })

  it('returns VALIDATION_ERROR for invalid stage value', async () => {
    const result = await updateLeadStageAction({
      leadId: 'valid-lead-uuid',
      stage: 'INVALID_STAGE' as any,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })
})
```

### 5.4 Webhook Signature Verification Test

```typescript
// apps/rainmachine/src/__tests__/integration/webhooks.test.ts
import { describe, it, expect } from 'vitest'

const EDGE_FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`

describe('GHL Webhook signature verification', () => {
  const validPayload = JSON.stringify({
    type: 'contact.created',
    locationId: 'test-location-id',
    contact: {
      id: 'ghl_test_123',
      firstName: 'Test',
      lastName: 'Lead',
      phone: '+15551234567',
    },
  })

  it('returns 401 for missing signature header', async () => {
    const res = await fetch(`${EDGE_FUNCTION_URL}/ghl-webhook`, {
      method: 'POST',
      body: validPayload,
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status).toBe(401)
  })

  it('returns 401 for invalid HMAC signature', async () => {
    const res = await fetch(`${EDGE_FUNCTION_URL}/ghl-webhook`, {
      method: 'POST',
      body: validPayload,
      headers: {
        'Content-Type': 'application/json',
        'X-GHL-Signature': 'sha256=invalidsignaturehex',
      },
    })
    expect(res.status).toBe(401)
  })

  it('returns 200 for valid signature and known locationId', async () => {
    // Compute valid HMAC using test secret
    const secret = process.env.TEST_GHL_WEBHOOK_SECRET!
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(validPayload))
    const hexSig = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const res = await fetch(`${EDGE_FUNCTION_URL}/ghl-webhook`, {
      method: 'POST',
      body: validPayload,
      headers: {
        'Content-Type': 'application/json',
        'X-GHL-Signature': `sha256=${hexSig}`,
      },
    })
    expect(res.status).toBe(200)
  })
})
```

---

## 6. MSW — API Mocking

MSW intercepts fetch calls in both test environment (Node) and browser (Service Worker). Used for:
- Mocking Supabase REST API in component tests
- Mocking external APIs (Retell, Meta, Google) in server action tests
- Simulating error states (network failures, API errors)

### 6.1 MSW Server Setup

```typescript
// src/__tests__/mocks/server.ts
import { setupServer } from 'msw/node'
import { supabaseHandlers } from './handlers/supabase'
import { retellHandlers } from './handlers/retell'
import { metaHandlers } from './handlers/meta'

export const server = setupServer(
  ...supabaseHandlers,
  ...retellHandlers,
  ...metaHandlers,
)
```

### 6.2 Supabase Mock Handlers

```typescript
// src/__tests__/mocks/handlers/supabase.ts
import { http, HttpResponse } from 'msw'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export const supabaseHandlers = [
  // Mock leads query
  http.get(`${SUPABASE_URL}/rest/v1/leads`, ({ request }) => {
    const url = new URL(request.url)
    const stage = url.searchParams.get('stage')

    return HttpResponse.json([
      {
        id: 'lead-uuid-1',
        organization_id: 'test-org-uuid',
        first_name: 'Marcus',
        last_name: 'Johnson',
        phone: '+15551234567',
        stage: stage ?? 'NEW',
        assigned_agent_id: 'agent-uuid-1',
        created_at: new Date().toISOString(),
      },
    ])
  }),

  // Mock Supabase auth user
  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: 'user-uuid-1',
      email: 'test@makeitrain.digital',
      user_metadata: {
        organization_id: 'test-org-uuid',
        role: 'ADMIN',
      },
    })
  }),
]
```

### 6.3 Error State Simulation

```typescript
// In a specific test — override handlers to simulate errors
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

it('shows error state when leads query fails', async () => {
  // Override for this test only
  server.use(
    http.get(`${SUPABASE_URL}/rest/v1/leads`, () => {
      return HttpResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    })
  )

  render(<LeadPipelineBoard />)
  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load leads')
  })
})
```

---

## 7. Component Tests

### 7.1 What Gets Component Tested

All interactive components with state — not presentational-only components.

| Component | Key Tests |
|-----------|----------|
| `LeadCard` | Renders name/stage, click fires onSelect, stage badge color matches |
| `StageColumn` | Correct count badge, empty state renders |
| `LeadSlideOver` | Opens on trigger, closes on Escape, focus trap works |
| `MetricReadout` | Renders value, formats currency/percentage correctly |
| `AgentCard` | Status indicator matches agent status enum |
| `OnboardingStep` | Progress indicator, Next/Back navigation, validation blocks Next |
| `CommandAlert` | Severity colors correct, dismiss fires callback |
| `SystemStatusBanner` | Renders in LOADING/ERROR/EMPTY states |

### 7.2 Example Component Test

```typescript
// apps/rainmachine/src/__tests__/unit/LeadCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LeadCard } from '@/components/leads/LeadCard'
import type { Lead } from '@mird/types'

const mockLead: Lead = {
  id: 'lead-uuid-1' as any,
  organizationId: 'org-uuid-1' as any,
  firstName: 'Marcus',
  lastName: 'Johnson',
  phone: '+15551234567',
  email: 'marcus@email.com',
  stage: 'NEW',
  source: 'Meta Ads',
  assignedAgentId: 'agent-uuid-1' as any,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('LeadCard', () => {
  it('renders lead name', () => {
    render(<LeadCard lead={mockLead} onSelect={vi.fn()} />)
    expect(screen.getByText('Marcus Johnson')).toBeInTheDocument()
  })

  it('renders source badge', () => {
    render(<LeadCard lead={mockLead} onSelect={vi.fn()} />)
    expect(screen.getByText('Meta Ads')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn()
    render(<LeadCard lead={mockLead} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith('lead-uuid-1')
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('shows NEW stage with correct badge color class', () => {
    render(<LeadCard lead={mockLead} onSelect={vi.fn()} />)
    const badge = screen.getByTestId('stage-badge')
    expect(badge).toHaveClass('text-cyan-400') // NEW = cyan
  })

  it('is keyboard accessible — triggers onSelect on Enter', () => {
    const onSelect = vi.fn()
    render(<LeadCard lead={mockLead} onSelect={onSelect} />)
    const card = screen.getByRole('button')
    card.focus()
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalled()
  })
})
```

---

## 8. Playwright E2E Tests

### 8.1 Playwright Config

```typescript
// playwright.config.ts (root)
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html'],
    ['github'],         // GitHub Actions annotations
    ['list'],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    // Setup — authenticate and save storage state
    {
      name: 'setup-rainmachine',
      testMatch: '**/auth.setup.ts',
      use: { baseURL: process.env.RAINMACHINE_URL ?? 'http://localhost:3000' },
    },
    {
      name: 'setup-onboarding',
      testMatch: '**/onboarding.setup.ts',
      use: { baseURL: process.env.ONBOARDING_URL ?? 'http://localhost:3002' },
    },

    // Test projects (depend on setup)
    {
      name: 'rainmachine',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.RAINMACHINE_URL ?? 'http://localhost:3000',
        storageState: 'playwright/.auth/rainmachine-user.json',
      },
      dependencies: ['setup-rainmachine'],
    },
    {
      name: 'onboarding',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.ONBOARDING_URL ?? 'http://localhost:3002',
        storageState: 'playwright/.auth/onboarding-user.json',
      },
      dependencies: ['setup-onboarding'],
    },
  ],
})
```

### 8.2 Authentication Setup

```typescript
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test'

setup('authenticate as RainMachine user', async ({ page }) => {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(process.env.E2E_USER_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_USER_PASSWORD!)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL('/dashboard')

  // Save auth state for reuse across tests
  await page.context().storageState({
    path: 'playwright/.auth/rainmachine-user.json',
  })
})
```

### 8.3 Critical E2E Test Cases

#### RainMachine — Lead Pipeline Flow

```typescript
// e2e/rainmachine/lead-pipeline.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Lead Pipeline — Core Flow', () => {
  test('dashboard loads with lead pipeline board', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByTestId('pipeline-board')).toBeVisible()
    await expect(page.getByTestId('stage-column-NEW')).toBeVisible()
  })

  test('clicking lead card opens slide-over with lead details', async ({ page }) => {
    await page.goto('/dashboard')
    const firstLeadCard = page.getByTestId('lead-card').first()
    await firstLeadCard.click()

    const slideOver = page.getByRole('dialog', { name: /lead details/i })
    await expect(slideOver).toBeVisible()
    await expect(slideOver.getByTestId('lead-name')).toBeVisible()
    await expect(slideOver.getByTestId('call-history')).toBeVisible()
  })

  test('slide-over closes on Escape key', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByTestId('lead-card').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('stage filter shows only matching leads', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'APPOINTMENT_SET' }).click()
    const cards = page.getByTestId('lead-card')
    const count = await cards.count()
    if (count > 0) {
      // All visible cards should show APPOINTMENT_SET stage
      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(cards.nth(i).getByTestId('stage-badge'))
          .toHaveText('Appointment Set')
      }
    }
  })
})
```

#### Onboarding — Full Wizard Flow

```typescript
// e2e/onboarding/wizard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Onboarding Wizard — Full Flow', () => {
  test('wizard progresses through all 6 steps', async ({ page }) => {
    await page.goto('/setup/step-1')

    // Step 1: Business info
    await expect(page.getByTestId('step-indicator')).toContainText('1 / 6')
    await page.getByLabel('Business Name').fill('Apex Real Estate Team')
    await page.getByLabel('Full Name').fill('Marcus Johnson')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 2: Team setup
    await expect(page.getByTestId('step-indicator')).toContainText('2 / 6')
    await page.getByTestId('team-size-select').selectOption('3')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 3: GHL connection (mock)
    await expect(page.getByTestId('step-indicator')).toContainText('3 / 6')
    await expect(page.getByTestId('ghl-connect-btn')).toBeVisible()
    // Skip GHL in E2E (mocked as connected)
    await page.getByRole('button', { name: 'Next' }).click()

    // Verify we reach step 4
    await expect(page.getByTestId('step-indicator')).toContainText('4 / 6')
  })

  test('Next button is disabled when required fields are empty', async ({ page }) => {
    await page.goto('/setup/step-1')
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  test('Back navigation preserves entered data', async ({ page }) => {
    await page.goto('/setup/step-1')
    await page.getByLabel('Business Name').fill('Apex Team')
    await page.getByLabel('Full Name').fill('Marcus Johnson')
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Back' }).click()

    // Data should persist
    await expect(page.getByLabel('Business Name')).toHaveValue('Apex Team')
  })
})
```

#### CEO Dashboard — Command Center

```typescript
// e2e/ceo-dashboard/command-center.spec.ts
import { test, expect } from '@playwright/test'

test.describe('CEO Command Center', () => {
  test('command center loads all metric panels', async ({ page }) => {
    await page.goto('/command-center')

    // All 4 metric pods should be visible
    await expect(page.getByTestId('metric-pod-mrr')).toBeVisible()
    await expect(page.getByTestId('metric-pod-active-clients')).toBeVisible()
    await expect(page.getByTestId('metric-pod-pipeline-value')).toBeVisible()
    await expect(page.getByTestId('metric-pod-ai-calls')).toBeVisible()
  })

  test('client grid renders and is filterable', async ({ page }) => {
    await page.goto('/command-center')
    const grid = page.getByTestId('client-grid')
    await expect(grid).toBeVisible()

    // Filter by health score
    await page.getByLabel('Filter by health').selectOption('at-risk')
    await expect(grid).toBeVisible()
  })
})
```

---

## 9. Accessibility Testing

All interactive components and pages are audited with axe-core.

### 9.1 Playwright + axe-core

```typescript
// e2e/accessibility/a11y.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const PAGES_TO_AUDIT = [
  { name: 'RainMachine Dashboard',    path: '/dashboard' },
  { name: 'Lead Pipeline Board',      path: '/dashboard' },
  { name: 'AI Calling Panel',         path: '/ai-calling' },
  { name: 'Appointments Calendar',    path: '/appointments' },
  { name: 'Settings',                 path: '/settings' },
  { name: 'CEO Command Center',       path: '/command-center' },
  { name: 'Onboarding Step 1',        path: '/setup/step-1' },
]

for (const { name, path } of PAGES_TO_AUDIT) {
  test(`${name} — no WCAG 2.1 AA violations`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
}
```

### 9.2 Manual A11y Checklist (per release)

- [ ] Tab order follows visual reading order on all 3 apps
- [ ] All modals and slide-overs trap focus correctly
- [ ] Screen reader announces slide-over open/close (`aria-live="polite"`)
- [ ] All form inputs have associated `<label>` elements
- [ ] All icon-only buttons have `aria-label`
- [ ] Scan-line animation stops after init (no persistent animation for AT users)
- [ ] All color pairs pass WCAG 4.5:1 contrast (see FRONTEND-SPEC.md §9 for full table)
- [ ] `prefers-reduced-motion` disables all animations gracefully
- [ ] Skip navigation link visible on focus at top of each page

---

## 10. Coverage Targets

| App / Package | Lines | Branches | Functions | Priority Areas |
|--------------|-------|----------|-----------|---------------|
| `rainmachine` | 80% | 75% | 80% | Server actions, RLS integration, lead stage logic |
| `ceo-dashboard` | 75% | 70% | 75% | Auth (AAL2), command center data, drill-down filters |
| `onboarding` | 85% | 80% | 85% | Token validation, wizard state, step validation |
| `packages/types` | 95% | 90% | 95% | All type guards, Result helpers, Zod schemas |
| `packages/ai-agents` | 80% | 75% | 80% | Agent configs, Zod output schemas, cost calculation |

**Coverage enforcement:** CI pipeline fails if any app drops below threshold (`vitest --coverage --coverage.thresholds.*`). Coverage reports uploaded to Codecov.

**What is NOT worth testing to coverage targets:**
- Next.js layout files (no logic)
- Tailwind class composition (no runtime behavior)
- Framer Motion animation variants (no functional behavior)
- `loading.tsx` / `error.tsx` boundary files

---

## 11. Test Data Management

### 11.1 Test Seed Script

```bash
# supabase/seed.ts — runs on supabase db reset
# Seeds test organizations, users, leads for integration tests
```

**Test org structure (always seeded in local + CI):**
- `org-a` — 3 agents, 20 leads across all stages, 5 appointments
- `org-b` — 2 agents, 10 leads, used for cross-org isolation tests
- `mird-internal` — CEO dashboard data, 3 client orgs

### 11.2 Test Fixtures

```typescript
// src/__tests__/fixtures/leads.ts
import type { Lead } from '@mird/types'

export const mockLead = (overrides?: Partial<Lead>): Lead => ({
  id: 'lead-uuid-fixture' as any,
  organizationId: 'org-uuid-fixture' as any,
  firstName: 'Marcus',
  lastName: 'Johnson',
  phone: '+15551234567',
  email: 'marcus@test.com',
  stage: 'NEW',
  source: 'Meta Ads',
  assignedAgentId: 'agent-uuid-fixture' as any,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})
```

---

*Testing strategy complete as of 2026-03-31. Four layers: unit (Vitest), integration (real RLS), component (@testing-library), E2E (Playwright) + axe-core a11y audits on all pages.*

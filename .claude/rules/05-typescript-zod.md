# Rule: TypeScript & Zod
# Loads when: writing types, validation schemas, interfaces, error handling

## TypeScript Config

```json
// tsconfig.base.json (in packages/config)
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

**Rules:**
- No `any`. If you need to escape the type system, use `unknown` and narrow it.
- No type assertions (`as Foo`) without a comment explaining why it's safe.
- No `!` non-null assertions without a comment.
- `noUncheckedIndexedAccess` is on — array/object access returns `T | undefined`.

## Zod — Validation at All External Boundaries

### Server Action Input Validation
```ts
import { z } from 'zod'

export const CreateLeadSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  source: z.enum(['meta_ads', 'google_ads', 'referral', 'organic', 'manual', 'other']),
  tenantId: z.string().uuid(),
})

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>
```

### Claude API Output Validation
```ts
const WeeklyBriefSchema = z.object({
  executive_summary: z.string(),
  key_metrics: z.array(z.object({
    label: z.string(),
    value: z.string(),
    trend: z.enum(['up', 'down', 'flat']),
  })),
  recommendations: z.array(z.string()),
  callouts: z.array(z.string()).optional(),
})

// Always parse Claude output — never trust raw JSON
const result = WeeklyBriefSchema.safeParse(rawClaudeOutput)
if (!result.success) {
  // Log schema_error to agent_logs, skip tenant, continue
  await logAgentError({ type: 'schema_error', details: result.error.message })
  return
}
```

### Webhook Payload Validation
```ts
const RetellCallEndedSchema = z.object({
  call_id: z.string(),
  call_status: z.enum(['ended', 'error']),
  duration_ms: z.number().int().nonneg(),
  transcript: z.string().optional(),
  call_analysis: z.object({
    call_successful: z.boolean(),
    custom_analysis_data: z.unknown(),
  }).optional(),
})
```

## Result Pattern — No Thrown Exceptions in Server Actions

```ts
// packages/db/src/types/result.ts
export type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E }

export const ok = <T>(data: T): Result<T, never> => ({ ok: true, data })
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })
```

```ts
// Usage in server action
export async function updateLeadStage(input: UpdateInput): Promise<Result<Lead>> {
  const parsed = UpdateLeadStageSchema.safeParse(input)
  if (!parsed.success) return err(parsed.error.message)

  const { data, error } = await supabase.from('leads').update(...)
  if (error) return err(error.message)

  return ok(data)
}

// Usage in client component
const result = await updateLeadStage(input)
if (!result.ok) {
  toast.error(result.error)
  return
}
// result.data is typed here
```

## Branded Types

```ts
// packages/db/src/types/brands.ts
declare const __brand: unique symbol
type Brand<B> = { [__brand]: B }
export type Branded<T, B> = T & Brand<B>

export type TenantId  = Branded<string, 'TenantId'>
export type UserId    = Branded<string, 'UserId'>
export type LeadId    = Branded<string, 'LeadId'>
export type CampaignId = Branded<string, 'CampaignId'>

// Cast only at system boundaries (DB read, API input)
const id = row.tenant_id as TenantId
```

Use branded types wherever UUID identity matters — prevents passing the wrong ID to the wrong function.

## Domain Types (Generated + Extended)

```ts
// packages/db/src/types/domain.ts
import type { Tables } from './database.types'

// Generated base type
export type Lead = Tables<'leads'>

// Extended with computed/joined fields
export type LeadWithAgent = Lead & {
  agent: Pick<Tables<'agents'>, 'id' | 'name' | 'email'>
}

export type LeadWithCalls = Lead & {
  calls: Tables<'calls'>[]
}
```

## Enum Pattern

Define enums as `const` objects + type union (not TypeScript `enum`):

```ts
// ✅ preferred
export const LeadStage = {
  New: 'new',
  Contacted: 'contacted',
  Qualified: 'qualified',
  AppointmentSet: 'appointment_set',
  ClosedWon: 'closed_won',
  ClosedLost: 'closed_lost',
} as const

export type LeadStage = typeof LeadStage[keyof typeof LeadStage]

// ❌ avoid TypeScript enum
enum LeadStage { New = 'new', ... }
```

## Environment Variables

```ts
// apps/dashboard/src/env.ts
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    ANTHROPIC_API_KEY: z.string().min(1),
    RETELL_API_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    // ...
  },
})
```

If any required env var is missing at build time, the build fails with a clear error.

## Common Type Utilities

```ts
// Awaited return type of server action
type ActionResult = Awaited<ReturnType<typeof updateLeadStage>>

// Partial update (for PATCH-style server actions)
type LeadUpdate = Partial<Pick<Lead, 'stage' | 'assigned_agent_id' | 'notes'>>

// Discriminated union for component states
type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'success'; data: Lead[] }
```

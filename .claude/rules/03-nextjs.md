# Rule: Next.js 15 App Router
# Loads when: creating pages, layouts, server actions, middleware, API routes, state management

## Core Principles
- **RSC by default.** Every page and layout is a React Server Component unless it needs interactivity.
- **Server Actions for all mutations.** No separate API route files for form submissions or CRUD.
- **Keep client components small.** Extract only the interactive part into `'use client'` — not the whole page.

## File Conventions

### Route Structure
```
apps/dashboard/app/
├── (auth)/
│   └── login/page.tsx          # Public, no auth required
├── (dashboard)/
│   ├── layout.tsx              # Auth-guarded layout with sidebar
│   └── dashboard/
│       ├── page.tsx            # RSC: /dashboard
│       ├── leads/
│       │   ├── page.tsx        # RSC: /dashboard/leads
│       │   └── [id]/page.tsx   # RSC: /dashboard/leads/:id
│       └── settings/
│           └── [section]/page.tsx
└── api/
    └── webhooks/
        └── retell/route.ts     # POST handler — webhook receivers only
```

### When to Use API Routes vs Server Actions
| Use case | Solution |
|----------|---------|
| Form submit, mutation | Server Action (`'use server'`) |
| External webhook receiver | API Route (`route.ts`) |
| File download / streaming | API Route |
| OAuth callback | API Route |
| Polling endpoint | API Route |

## Server Actions Pattern

```ts
// apps/dashboard/app/actions/leads.ts
'use server'

import { z } from 'zod'
import { createServerClient } from '@rainmachine/db'
import { revalidatePath } from 'next/cache'
import type { Result } from '@rainmachine/db/types'

const UpdateLeadStageSchema = z.object({
  leadId: z.string().uuid(),
  newStage: z.enum(['new', 'contacted', 'qualified', 'appointment_set', 'closed_won', 'closed_lost']),
  updatedAt: z.string().datetime(),
})

export async function updateLeadStage(
  input: z.infer<typeof UpdateLeadStageSchema>
): Promise<Result<{ id: string }, string>> {
  const parsed = UpdateLeadStageSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message }
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('leads')
    .update({ stage: parsed.data.newStage })
    .eq('id', parsed.data.leadId)
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard/leads')
  return { ok: true, data }
}
```

**Rules for server actions:**
- Always validate input with Zod before touching DB
- Return `Result<T, E>` — never throw
- Call `revalidatePath` after mutations that affect visible data
- Import Supabase client as `createServerClient` (respects RLS)
- File lives in `app/actions/[domain].ts` or colocated with the feature

## RSC Data Fetching Pattern

```tsx
// app/(dashboard)/dashboard/leads/page.tsx
import { createServerClient } from '@rainmachine/db'

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { stage?: string; page?: string }
}) {
  const supabase = await createServerClient()
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .range(0, 24)

  return <LeadsTable leads={leads ?? []} />
}
```

- No `useEffect` for initial data — fetch in RSC
- Pass data as props to client components
- `searchParams` drives filtering — no client-side state for URL filters

## Client Component Pattern

```tsx
// components/LeadStageDropdown.tsx
'use client'

import { useState, useTransition } from 'react'
import { updateLeadStage } from '../actions/leads'

export function LeadStageDropdown({ leadId, currentStage }: Props) {
  const [optimisticStage, setOptimisticStage] = useState(currentStage)
  const [isPending, startTransition] = useTransition()

  function handleChange(newStage: LeadStage) {
    setOptimisticStage(newStage) // optimistic update
    startTransition(async () => {
      const result = await updateLeadStage({
        leadId,
        newStage,
        updatedAt: new Date().toISOString(),
      })
      if (!result.ok) {
        setOptimisticStage(currentStage) // rollback
      }
    })
  }

  return <select value={optimisticStage} onChange={e => handleChange(e.target.value as LeadStage)} disabled={isPending} />
}
```

## Middleware (Auth Guard)

```ts
// apps/dashboard/middleware.ts
import { createMiddlewareClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && !req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

## State Management

### Zustand — Global Client State
```ts
// Use for: auth state, UI state (sidebar open/closed), notifications, active tenant
import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
```

### TanStack Query — Server State
```ts
// Use for: data that needs background refetch, polling, optimistic updates
// Do NOT use for: initial page data (use RSC instead)
const { data, isLoading } = useQuery({
  queryKey: ['leads', filters],
  queryFn: () => fetchLeads(filters),
  staleTime: 30_000,
})
```

### Rule: When to use what
| State type | Solution |
|------------|---------|
| Initial page data | RSC fetch (no hook) |
| Mutation result / form state | Server Action + `useTransition` |
| Global UI state | Zustand |
| Polling / background refresh | TanStack Query |
| Form field state | React Hook Form |

## Performance Rules
- Dynamic import heavy components: `const Chart = dynamic(() => import('./Chart'), { ssr: false })`
- Always dynamic import Recharts — it's large
- `next/image` for all images (no `<img>` tags)
- `next/font` for Orbitron + Share Tech Mono + Inter
- Initial JS bundle target: < 200KB per app

## Common Patterns
- Loading UI: `loading.tsx` in route folder (suspense boundary)
- Error UI: `error.tsx` in route folder
- Not found: `not-found.tsx`
- `generateMetadata` for page titles
- URL search params for filters/pagination — never sessionStorage

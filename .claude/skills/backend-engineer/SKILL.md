---
name: backend-engineer
description: "Build RainMachine server actions, API routes, Supabase queries, n8n integrations, external API clients"
version: "1.0.0"
triggers:
  - /backend-engineer
  - server action
  - create action
  - api route
  - webhook handler
  - supabase query
  - n8n integration
  - external api
  - stripe integration
---

# Backend Engineer — RainMachine Project Overlay

## Project Anchors
- `docs/prds/F0N-*.md` → Server Actions + API Routes sections
- `docs/tech/api/OPENAPI-SPEC.yaml` → API contract
- `docs/tech/api/TYPESCRIPT-TYPES.ts` → domain types
- `.claude/rules/03-nextjs.md` → server action patterns
- `.claude/rules/08-external-apis.md` → GHL, Meta, Stripe, n8n patterns

## Non-Negotiables

### Canonical server action shape — no shortcuts
```ts
'use server'
// 1. Schema at top
const Schema = z.object({ ... })
// 2. Zod parse first
const parsed = Schema.safeParse(input)
if (!parsed.success) return err(parsed.error.message)
// 3. Auth check
const { data: { user } } = await supabase.auth.getUser()
if (!user) return err('Unauthorized')
// 4. DB operation
// 5. revalidatePath
// 6. return ok(data)
```

### API routes are for webhooks and OAuth only
Mutations belong in server actions. API routes (`route.ts`) are ONLY for:
- External webhook receivers (Retell, Stripe, GHL, n8n)
- OAuth callbacks
- Polling endpoints
- File streaming

### All external API calls wrapped with error handling
```ts
async function safeCall<T>(fn: () => Promise<T>, ctx: string): Promise<Result<T>> {
  try { return ok(await fn()) }
  catch (e) { return err(`[${ctx}] ${e instanceof Error ? e.message : 'Unknown'}`) }
}
```

### n8n handles cross-system orchestration
Do not call GHL API directly from a server action if an n8n workflow already handles that flow. Server actions call the n8n webhook URL instead.

### Stripe webhooks are verified before processing
```ts
const event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
// throws on invalid — handle at the catch boundary
```

## External API Quick Reference

| Service | Base URL | Auth |
|---------|----------|------|
| GHL | `https://services.leadconnectorhq.com` | `Bearer ${GHL_API_KEY}` |
| Retell | `https://api.retellai.com` | `Bearer ${RETELL_API_KEY}` |
| Meta | `https://graph.facebook.com/v21.0` | `access_token` query param |
| Google Ads | `https://googleads.googleapis.com/v17` | `Bearer ${accessToken}` + developer-token header |
| Anthropic | SDK | `process.env.ANTHROPIC_API_KEY` |
| Stripe | SDK | `process.env.STRIPE_SECRET_KEY` |

## Action File Placement
```
apps/[app]/app/actions/
├── leads.ts
├── agents.ts
├── campaigns.ts
├── settings.ts
└── reports.ts
```

## Backend Checklist (before marking done)
- [ ] Zod schema validates all input fields
- [ ] Auth check before any DB write
- [ ] Returns Result<T> (no throws)
- [ ] revalidatePath called after mutations
- [ ] External API calls wrapped with error handling
- [ ] Webhook handlers verify signature
- [ ] Unit tests cover validation error paths

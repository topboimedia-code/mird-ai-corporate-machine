# Rule: External APIs & Integrations
# Loads when: GHL, Meta, Google Ads, Stripe, n8n, Apollo, Resend, Slack webhook code

## Architecture Principle

External API calls follow this routing rule:
- **GHL mutations + webhook logic** → via n8n workflows (not direct from Next.js)
- **GHL reads (contact lookup)** → can be direct from server action if needed
- **Ad metrics** → n8n cron pulls Meta/Google, writes to Supabase `ad_metrics`
- **Claude agents** → direct from Supabase Edge Functions
- **Stripe webhooks** → Next.js API route (`/api/webhooks/stripe`)

---

## GoHighLevel (GHL API v2)

### Base Setup
```ts
const GHL_BASE = 'https://services.leadconnectorhq.com'
const GHL_API_KEY = process.env.GHL_API_KEY // server-only

async function ghlFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${GHL_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`GHL API ${res.status}: ${await res.text()}`)
  return res.json()
}
```

### Key Endpoints Used
```
POST /contacts/              → create contact
PUT  /contacts/{id}          → update contact / stage
GET  /contacts/{id}          → fetch contact
GET  /calendars/appointments/ → list appointments
POST /locations/             → create sub-account (onboarding)
PUT  /locations/{id}/customFields → configure routing
```

### Webhook Events Handled
- `contact.created` → n8n → Retell AI trigger
- `contact.tag.added` (tag: `new-lead`) → n8n → Retell call
- `appointment.status_changed` → n8n → Supabase `appointments` update
- `opportunity.status_changed` → n8n → Supabase `leads` stage update

### GHL Sub-Account Provisioning (Onboarding)
Done in Supabase Edge Function `process-onboarding-job`, Step 1:
```ts
const location = await ghlFetch('/locations/', {
  method: 'POST',
  body: JSON.stringify({
    name: tenantConfig.businessName,
    address: tenantConfig.address,
    timezone: tenantConfig.timezone,
    // clone from MIRD template sub-account
    snapshot_id: process.env.GHL_TEMPLATE_SNAPSHOT_ID,
  }),
})
```

---

## Meta Marketing API

### Authentication
Use System User tokens (non-expiring) — stored in Supabase Vault:
```ts
const metaToken = await vaultGet(`meta_token_${tenantId}`)

const META_BASE = 'https://graph.facebook.com/v21.0'
```

### Ad Metrics Sync (n8n workflow, runs every 4h)
```ts
// "Fruit Salad Rule": never loop daily aggregation — use time_range
const insights = await fetch(
  `${META_BASE}/${adAccountId}/insights?` + new URLSearchParams({
    fields: 'campaign_name,spend,impressions,clicks,actions,cost_per_action_type',
    time_range: JSON.stringify({ since: sevenDaysAgo, until: today }),
    level: 'campaign',
    access_token: metaToken,
  })
)
```

### Token Verification (Onboarding Step 3)
```ts
export async function verifyMetaToken(token: string): Promise<Result<MetaAccount>> {
  const res = await fetch(
    `https://graph.facebook.com/me?fields=id,name,ad_accounts&access_token=${token}`
  )
  if (!res.ok) return err('Invalid Meta token')
  const data = await res.json()
  if (data.error) return err(data.error.message)
  return ok(data)
}
```

---

## Google Ads API

### Authentication
OAuth with refresh tokens — stored in Supabase Vault:
```ts
async function refreshGoogleToken(tenantId: string): Promise<string> {
  const refreshToken = await vaultGet(`google_ads_refresh_${tenantId}`)
  // Exchange refresh token for access token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const { access_token } = await res.json()
  return access_token
}
```

### Manager (MCC) Account Pattern
All clients are linked under MIRD's MCC account:
```ts
const headers = {
  'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
  'login-customer-id': process.env.GOOGLE_ADS_MCC_CUSTOMER_ID!, // MIRD's MCC
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
}
```

### Invite to Manager Account (Onboarding Step 4)
```ts
// Send manager invitation → client accepts → MIRD gets MCC access
const invite = await fetch(
  `https://googleads.googleapis.com/v17/customers/${mccId}/customerManagerLinks:mutate`,
  { method: 'POST', headers, body: JSON.stringify({ ... }) }
)
// Poll acceptance for up to 5 minutes
```

---

## Stripe

### Webhook Handler
```ts
// apps/ceo/app/api/webhooks/stripe/route.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' })

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'invoice.payment_succeeded':
      await handleInvoicePaid(event.data.object as Stripe.Invoice)
      break
    case 'invoice.payment_failed':
      await handleInvoiceFailed(event.data.object as Stripe.Invoice)
      break
  }

  return Response.json({ received: true })
}
```

**Always verify Stripe webhook signature.** Never process unsigned payloads.

---

## n8n (Workflow Automation)

### Key Workflows
| Workflow | Trigger | Action |
|----------|---------|--------|
| `ghl-to-supabase-sync` | GHL webhook | Upsert leads/appointments to Supabase |
| `new-lead-retell-trigger` | GHL contact tag | Trigger Retell AI call |
| `agent-sync` | Server action call | Update GHL routing when agent status changes |
| `ad-metrics-sync` | Cron every 4h | Pull Meta + Google → write ad_metrics |
| `log-workflow-run` | After each workflow | Write to workflow_runs table |

### Calling n8n from Next.js
```ts
// apps/dashboard/app/actions/agents.ts
async function callN8nAgentSync(agentId: string, status: AgentStatus) {
  const res = await fetch(process.env.N8N_AGENT_SYNC_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, status }),
  })
  if (!res.ok) throw new Error(`n8n webhook failed: ${res.status}`)
}
```

n8n webhook URLs are stored as env vars, never hardcoded.

---

## Resend (Transactional Email)

```ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'RainMachine <noreply@rainmachine.io>',
  to: tenant.owner_email,
  subject: 'Your RainMachine is Live! 🎉',
  html: welcomeEmailHtml,
})
```

Used for: welcome email (F06), weekly intelligence summary (F16), data exports (F11).

---

## Apollo.io (Prospect Data Cache)

Apollo data is never queried in real-time from Next.js. An n8n workflow (`apollo-prospect-sync`) runs nightly, writes to `prospects` table in Supabase. Claude Growth Agent reads from `prospects` table.

```ts
// n8n pulls from Apollo API → writes to Supabase
// Claude agent reads from Supabase prospects table
// Never direct Apollo API call from Next.js
```

---

## Slack (Webhook Notifications)

```ts
async function notifySlack(message: string, channel = 'alerts') {
  const webhookUrl = process.env[`SLACK_WEBHOOK_${channel.toUpperCase()}`]
  if (!webhookUrl) return // graceful degradation

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  })
}
```

Slack notifications are fire-and-forget — never block user-facing flows on Slack delivery.

---

## Error Handling for External APIs

```ts
// Wrap all external API calls with consistent error handling
async function safeExternalCall<T>(
  fn: () => Promise<T>,
  context: string
): Promise<Result<T>> {
  try {
    const data = await fn()
    return ok(data)
  } catch (error) {
    console.error(`[${context}] External API error:`, error)
    return err(error instanceof Error ? error.message : 'Unknown error')
  }
}
```

External API failures should:
1. Log to `agent_logs` or `sync_errors` table
2. Generate CEO alert if threshold exceeded (>3 errors/hour)
3. Never crash the user-facing request — return graceful error state

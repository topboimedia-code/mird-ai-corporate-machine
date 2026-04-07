# Rule: AI & Voice Integrations
# Loads when: Claude API, Retell AI, GHL Native Voice, AI agent code

## THE THREE AI SYSTEMS — NEVER CONFLATE

This is the most important rule in this domain. RainMachine has THREE distinct AI systems:

| System | Vendor | Who it talks to | Trigger | Lives in |
|--------|--------|-----------------|---------|---------|
| **Retell AI** | Retell | External prospects | New lead / cold outbound / DBR | n8n → Retell API |
| **GHL Native Voice** | GHL | Warm contacts | Appointment confirmation / no-show / inbound | GHL workflow |
| **Claude Agents** | Anthropic | Nobody (internal only) | pg_cron schedule | Supabase Edge Functions |

Claude agents are **never** customer-facing. They analyze data and write to internal tables (`reports`, `alerts`, `agent_logs`). They do not make phone calls. They do not send messages to leads.

---

## Claude API (Anthropic)

### Client Setup
```ts
// packages/db/src/claude.ts
import Anthropic from '@anthropic-ai/sdk'

export function createClaudeClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
}
```

### Model
Always use `claude-sonnet-4-6`. Never hardcode a model string — reference the constant:
```ts
export const CLAUDE_MODEL = 'claude-sonnet-4-6' as const
```

### Structured Output Pattern (All Agents)
```ts
import { z } from 'zod'
import { createClaudeClient, CLAUDE_MODEL } from '@rainmachine/db/claude'

const WeeklyBriefSchema = z.object({
  executive_summary: z.string(),
  key_metrics: z.array(z.object({
    label: z.string(),
    value: z.string(),
    delta: z.string().optional(),
  })),
  campaign_performance: z.array(z.object({
    campaign_name: z.string(),
    platform: z.enum(['meta', 'google']),
    spend: z.number(),
    leads: z.number(),
    cpl: z.number(),
  })),
  recommendations: z.array(z.string()),
  callouts: z.array(z.string()).optional(),
})

export type WeeklyBrief = z.infer<typeof WeeklyBriefSchema>

async function runWeeklyIntelligenceAgent(tenantId: string): Promise<void> {
  const claude = createClaudeClient()

  // Fetch context data
  const contextData = await fetchTenantWeeklyData(tenantId)
  const promptTemplate = await fetchPromptTemplate('weekly-intelligence')

  // Call Claude
  const message = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: promptTemplate.replace('{{DATA}}', JSON.stringify(contextData)),
    }],
  })

  // Extract and validate JSON from response
  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/)
  const rawJson = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(content.text)

  const parsed = WeeklyBriefSchema.safeParse(rawJson)
  if (!parsed.success) {
    // Schema error — log and skip this tenant, never crash
    await logAgentRun({
      department: 'client-intel',
      status: 'schema_error',
      summary: parsed.error.message,
    })
    return
  }

  // Write to reports table
  await supabase.from('reports').insert({
    tenant_id: tenantId,
    type: 'weekly_brief',
    content: parsed.data,
    generated_at: new Date().toISOString(),
  })

  // Track cost
  await supabase.from('claude_api_usage').insert({
    agent: 'weekly-intelligence',
    tokens_in: message.usage.input_tokens,
    tokens_out: message.usage.output_tokens,
    cost_usd: calculateCost(message.usage),
    run_at: new Date().toISOString(),
  })
}
```

### Error Handling Rules for AI Agents
- Schema validation failure → log `schema_error` to `agent_logs`, skip tenant, **continue to next tenant**
- API error (rate limit, timeout) → log `api_error` to `agent_logs`, skip tenant, **continue**
- Never let one tenant's failure crash the entire agent run
- Always write an `agent_logs` entry regardless of success or failure

### Prompt Templates
Prompts are stored in the `agent_prompts` table (updatable without code deploy):
```ts
const { data } = await supabase
  .from('agent_prompts')
  .select('template')
  .eq('agent_name', 'weekly-intelligence')
  .single()

const prompt = data.template.replace('{{TENANT_DATA}}', JSON.stringify(contextData))
```

### Cost Tracking
```ts
function calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
  // claude-sonnet-4-6 pricing (update if pricing changes)
  const INPUT_COST_PER_1K  = 0.003
  const OUTPUT_COST_PER_1K = 0.015
  return (usage.input_tokens / 1000 * INPUT_COST_PER_1K) +
         (usage.output_tokens / 1000 * OUTPUT_COST_PER_1K)
}
```

### Rate Limiting (Report Chat)
```ts
// 10 queries per tenant per week
const { count } = await supabase
  .from('report_chat_queries')
  .select('*', { count: 'exact', head: true })
  .eq('tenant_id', tenantId)
  .gte('created_at', startOfWeek.toISOString())

if (count >= 10) {
  return err('Weekly query limit reached. Resets Monday.')
}
```

---

## Retell AI (Outbound Voice Calls)

### Trigger Flow (via n8n)
1. GHL webhook (tag: `new-lead`) → n8n
2. n8n guard: tenant active + Retell configured
3. POST to Retell `/v2/create-phone-call`
4. Write `calls` row with `status: 'initiated'`

### Retell API Client
```ts
async function triggerRetellCall(params: {
  toPhone: string
  agentId: string
  metadata: Record<string, string>
}) {
  const response = await fetch('https://api.retellai.com/v2/create-phone-call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from_number: process.env.RETELL_FROM_NUMBER,
      to_number: params.toPhone,
      agent_id: params.agentId,
      metadata: params.metadata,
    }),
  })

  if (!response.ok) {
    throw new Error(`Retell API error: ${response.status}`)
  }

  return response.json() as Promise<{ call_id: string }>
}
```

### call_ended Webhook Handler
```ts
// apps/dashboard/app/api/webhooks/retell/route.ts
export async function POST(req: Request) {
  const body = await req.json()
  const parsed = RetellCallEndedSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid payload' }, { status: 400 })

  const supabase = createAdminClient()

  await supabase.from('calls').update({
    status: parsed.data.call_status === 'ended' ? 'completed' : 'failed',
    duration_s: Math.round((parsed.data.duration_ms ?? 0) / 1000),
    transcript: parsed.data.transcript,
    outcome: extractOutcome(parsed.data.call_analysis),
  }).eq('retell_call_id', parsed.data.call_id)

  return Response.json({ ok: true })
}
```

### Concurrency Guard
- Never call same phone number twice within 10 minutes
- 2-second stagger when multiple simultaneous leads arrive
- Check `calls` table for recent calls before triggering

---

## Agent Logs Schema

All four Claude agents write to `agent_logs` after every run:
```ts
interface AgentLog {
  id: string
  department: 'client-intel' | 'ad-ops' | 'growth-acquisition' | 'financial-intelligence'
  run_at: string           // ISO timestamp
  status: 'success' | 'schema_error' | 'api_error'
  summary: string          // human-readable one-liner
  entries: AgentLogEntry[] // structured per-tenant results
}

interface AgentLogEntry {
  tenant_id?: string
  outcome: string
  details?: Record<string, unknown>
}
```

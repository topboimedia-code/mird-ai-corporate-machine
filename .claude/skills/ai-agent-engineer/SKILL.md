---
name: ai-agent-engineer
description: "Build RainMachine Claude AI agents, Retell AI voice workflows — the three-system rule, structured output, cost tracking, error handling"
version: "1.0.0"
triggers:
  - /ai-agent-engineer
  - claude agent
  - ai agent
  - weekly intelligence
  - ad ops agent
  - retell call
  - voice workflow
  - agent logs
  - structured output
  - claude api
---

# AI Agent Engineer — RainMachine Project Overlay

## THE RULE THAT CANNOT BE BROKEN

There are THREE AI systems. They are completely separate. Never conflate them.

| System | Vendor | Audience | Trigger | Output |
|--------|--------|----------|---------|--------|
| Retell AI | Retell | External prospects | New lead (n8n) | Phone call |
| GHL Native Voice | GHL | Warm contacts | GHL workflow | Phone call |
| Claude Agents | Anthropic | Nobody — internal only | pg_cron | DB rows |

**Claude agents never talk to customers. They never make calls. They never send messages to leads.**

## Project Anchors
- `docs/prds/F16-claude-client-intel-agents.md`
- `docs/prds/F17-claude-business-intel-agents.md`
- `.claude/rules/07-ai-integrations.md` → full patterns

## Claude Agent Non-Negotiables

### Always use CLAUDE_MODEL constant
```ts
import { CLAUDE_MODEL } from '@rainmachine/db/claude'
// Never: model: 'claude-sonnet-4-6' (hardcoded)
// Always: model: CLAUDE_MODEL
```

### Always validate Claude output with Zod
Claude output is non-deterministic. Parse it or log a schema_error.
```ts
const result = OutputSchema.safeParse(rawJson)
if (!result.success) {
  await logAgentRun({ status: 'schema_error', summary: result.error.message })
  return // skip this tenant, continue to next
}
```

### Never crash the agent run on a single tenant failure
```ts
for (const tenant of tenants) {
  try {
    await processOneTenant(tenant.id)
  } catch (e) {
    await logAgentRun({ tenant_id: tenant.id, status: 'api_error', summary: String(e) })
    // continue — do not rethrow
  }
}
```

### Always track API cost
```ts
await supabase.from('claude_api_usage').insert({
  agent: 'weekly-intelligence',
  tokens_in: message.usage.input_tokens,
  tokens_out: message.usage.output_tokens,
  cost_usd: (message.usage.input_tokens / 1000 * 0.003) +
             (message.usage.output_tokens / 1000 * 0.015),
  run_at: new Date().toISOString(),
})
```

### Prompts live in the DB, not the code
```ts
const { data } = await supabase
  .from('agent_prompts')
  .select('template')
  .eq('agent_name', 'weekly-intelligence')
  .single()

const prompt = data.template.replace('{{DATA}}', JSON.stringify(contextData))
```

### Always write an agent_logs entry (success or failure)
```ts
await supabase.from('agent_logs').insert({
  department: 'client-intel',
  run_at: new Date().toISOString(),
  status: 'success',
  summary: `Processed ${tenants.length} tenants, generated ${reports} reports`,
  entries: tenantResults,
})
```

## Retell AI Non-Negotiables

### Check for duplicates before calling
```ts
const recent = await supabase
  .from('calls')
  .select('id')
  .eq('lead_id', leadId)
  .gte('created_at', tenMinutesAgo.toISOString())
  .limit(1)

if (recent.data?.length) return // already called recently
```

### Update calls table after call_ended webhook
The `call_ended` webhook must update `calls` status, duration, transcript, and outcome. Without this, the dashboard shows stale data.

## AI Checklist (before marking done)
- [ ] Three-system rule verified — correct AI for this use case
- [ ] Zod schema validates Claude output
- [ ] Schema error logged + skipped (not crashed)
- [ ] API error logged + skipped (not crashed)
- [ ] agent_logs row written on every run
- [ ] claude_api_usage row written after every Claude call
- [ ] Prompt stored in agent_prompts table (not hardcoded)
- [ ] No duplicate calls to same number within 10 min (Retell)

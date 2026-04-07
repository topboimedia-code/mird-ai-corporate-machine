# MIRD AI Corporate Machine — Backend Implementation Spec
## Step 8 | Date: 2026-03-31

Implementation-ready specification for all backend concerns: server actions,
Edge Functions, Claude AI Department Agents, n8n workflows, and all external
integrations. A developer can implement from this document without clarifying questions.

---

## Table of Contents

1. [Service Architecture Overview](#1-service-architecture-overview)
2. [Server Action Layer](#2-server-action-layer)
3. [Supabase Edge Functions](#3-supabase-edge-functions)
4. [Claude AI Department Agents](#4-claude-ai-department-agents)
5. [n8n Workflow Specifications](#5-n8n-workflow-specifications)
6. [GHL Integration Layer](#6-ghl-integration-layer)
7. [Retell AI Integration](#7-retell-ai-integration)
8. [Meta Ads API Integration](#8-meta-ads-api-integration)
9. [Google Ads API Integration](#9-google-ads-api-integration)
10. [Background Job Architecture](#10-background-job-architecture)
11. [Step 11 Framework Alignment](#11-step-11-framework-alignment)

---

## 1. Service Architecture Overview

MIRD's backend has **no custom API server**. All backend logic lives in:

| Layer | Runtime | Trigger | Auth Context |
|-------|---------|---------|-------------|
| **Next.js Server Actions** | Node.js (Vercel Edge) | Client form/CTA | User session + RLS |
| **Supabase Edge Functions** | Deno (Supabase Edge) | External webhooks + n8n | HMAC / service_role |
| **Claude Agent Runner** | Node.js (Vercel Cron) | Cron schedule | service_role (read-only views) |
| **n8n Workflows** | n8n runtime | GHL webhooks + schedule | service_role REST API |

### Bounded Context → Backend Ownership

```
MIRD Operations Context
├── Claude AI Agents (packages/ai-agents)
│   ├── dept-1-growth.ts    — Apollo prospecting, sales pipeline health
│   ├── dept-2-ad-ops.ts    — CPL monitoring, campaign health alerts
│   ├── dept-3-product.ts   — GHL buildout status, workflow health
│   └── dept-4-finance.ts   — MRR, churn, P&L summary
└── CEO Dashboard server actions (apps/ceo-dashboard/actions/)

RainMachine Platform Context
├── Lead management server actions (apps/dashboard/actions/leads.ts)
├── Agent management server actions (apps/dashboard/actions/agents.ts)
├── GHL webhook Edge Function (supabase/functions/ghl-webhook/)
└── Retell AI webhook Edge Function (supabase/functions/retell-webhook/)

Rainmaker Leads Context
├── Meta Ads sync (n8n Ad Report Sync Workflow)
├── Google Ads sync (n8n Ad Report Sync Workflow)
└── Campaign server actions (apps/dashboard/actions/campaigns.ts)

Cross-Context Provisioning
└── Onboarding Provisioner (n8n → supabase/functions/provision-org/)
```

---

## 2. Server Action Layer

### 2.1 File Organization

```
apps/dashboard/actions/
├── auth.ts          — loginAction, logoutAction, forgotPasswordAction, resetPasswordAction
├── leads.ts         — getLeadsAction, getLeadAction, updateLeadStageAction, assignLeadAction
├── agents.ts        — getAgentsAction, createAgentAction, updateAgentAction, toggleRoutingAction
├── campaigns.ts     — getCampaignsAction, getCampaignDetailAction, syncCampaignsAction
├── reports.ts       — getReportsAction, getReportAction, markReportReadAction
└── settings.ts      — updateOrgSettingsAction, reconnectGHLAction, reconnectMetaAction

apps/ceo-dashboard/actions/
├── auth.ts          — ceoLoginAction, ceoVerifyMFAAction
├── command-center.ts — getCommandCenterAction, getAllClientsAction, dismissAlertAction
├── client.ts        — getClientDetailAction
├── departments.ts   — getDeptDrilldownAction
├── agent-log.ts     — getAgentLogAction
└── settings.ts      — getCEOSettingsAction, updateAlertThresholdsAction

apps/onboarding/actions/
├── session.ts       — validateTokenAction
├── steps.ts         — saveStep1Action…saveStep5Action
├── verify.ts        — verifyMetaTokenAction, initiateGoogleOAuthAction, searchGMBLocationsAction
└── submit.ts        — submitOnboardingAction
```

### 2.2 Standard Server Action Template

Every server action follows this exact pattern — no exceptions:

```typescript
// 'use server' directive at top of every actions/*.ts file
'use server'

import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { Result } from '@mird/types'
import type { AppError, Lead, LeadFilter } from '@mird/types'

// 1. Zod schema (colocated with action)
const GetLeadsSchema = z.object({
  stage:    z.enum(['NEW','CONTACTED','APPT_SET','CLOSED','LOST']).optional(),
  agentId:  z.string().uuid().optional(),
  platform: z.enum(['META','GOOGLE','ORGANIC','REFERRAL']).optional(),
  search:   z.string().max(200).optional(),
  page:     z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
})

// 2. Action function — async, returns Result<T>
export async function getLeadsAction(
  input: z.infer<typeof GetLeadsSchema>
): Promise<Result<PaginatedLeads, AppError>> {

  // 3. Validate input
  const parsed = GetLeadsSchema.safeParse(input)
  if (!parsed.success) {
    return Result.err({ code: 'VALIDATION_ERROR', message: parsed.error.message })
  }

  // 4. Auth check
  const session = await requireAuth()
  if (!session) {
    return Result.err({ code: 'SESSION_EXPIRED', message: 'Session expired.' })
  }

  // 5. Build Supabase query (RLS enforces org_id — explicit WHERE is belt+suspenders)
  const supabase = createSupabaseServerClient()
  let query = supabase
    .from('leads')
    .select('*, agents(full_name, avatar_url)', { count: 'exact' })
    .eq('organization_id', session.organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(
      (parsed.data.page - 1) * parsed.data.pageSize,
       parsed.data.page      * parsed.data.pageSize - 1
    )

  if (parsed.data.stage)   query = query.eq('stage', parsed.data.stage)
  if (parsed.data.agentId) query = query.eq('assigned_agent_id', parsed.data.agentId)
  if (parsed.data.platform) query = query.eq('platform', parsed.data.platform)
  if (parsed.data.search) {
    query = query.textSearch('fts', parsed.data.search, { type: 'websearch' })
  }

  // 6. Execute and map
  const { data, error, count } = await query
  if (error) {
    return Result.err({ code: 'INTERNAL_ERROR', message: error.message })
  }

  // 7. Map snake_case DB rows → camelCase domain types
  return Result.ok({
    leads:    data.map(mapLeadRow),
    total:    count ?? 0,
    page:     parsed.data.page,
    pageSize: parsed.data.pageSize,
    hasMore:  (count ?? 0) > parsed.data.page * parsed.data.pageSize,
  })
}
```

### 2.3 Auth Helper

```typescript
// apps/*/lib/auth.ts
import { createSupabaseServerClient } from './supabase/server'
import { asOrganizationId } from '@mird/types'

export interface ServerSession {
  userId:         string
  organizationId: OrganizationId
  role:           UserRole
}

export async function requireAuth(): Promise<ServerSession | null> {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  // Pull org context from users table (RLS ensures this is the right org)
  const { data: user } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', session.user.id)
    .single()

  if (!user) return null
  return {
    userId:         session.user.id,
    organizationId: asOrganizationId(user.organization_id),
    role:           user.role as UserRole,
  }
}

export async function requireRole(
  session: ServerSession | null,
  roles: UserRole[]
): Promise<boolean> {
  return session !== null && roles.includes(session.role)
}
```

---

## 3. Supabase Edge Functions

### 3.1 Shared Utilities

```typescript
// supabase/functions/_shared/supabase.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/** Admin client — bypasses RLS. Use only with explicit WHERE clauses. */
export function createAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )
}

/** Standard response helpers */
export const ok  = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ ok: true, ...data }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })

export const err = (code: string, message: string, status = 400) =>
  new Response(JSON.stringify({ ok: false, error: { code, message } }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
```

### 3.2 GHL Webhook Handler

```typescript
// supabase/functions/ghl-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createAdminClient, ok, err } from '../_shared/supabase.ts'
import { verifyGHLSignature } from '../_shared/hmac.ts'
import { GHLWebhookSchema } from '../_shared/schemas.ts'

serve(async (req) => {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // 2. Read body + verify HMAC signature
  const body = await req.text()
  const signature = req.headers.get('X-GHL-Signature') ?? ''
  const locationId = JSON.parse(body)?.locationId

  const admin = createAdminClient()

  // Lookup org by GHL location_id
  const { data: ghlAccount } = await admin
    .from('ghl_accounts')
    .select('organization_id, webhook_secret_ref')
    .eq('location_id', locationId)
    .single()

  if (!ghlAccount) return err('NOT_FOUND', 'No account for this location', 404)

  // Read webhook secret from Vault
  const webhookSecret = await readSecret(admin, ghlAccount.webhook_secret_ref)
  const valid = await verifyGHLSignature(body, signature, webhookSecret)
  if (!valid) return err('INVALID_SIGNATURE', 'Signature mismatch', 401)

  // 3. Parse + validate payload
  const parsed = GHLWebhookSchema.safeParse(JSON.parse(body))
  if (!parsed.success) return err('VALIDATION_ERROR', parsed.error.message)

  const payload = parsed.data
  const orgId = ghlAccount.organization_id

  // 4. Route by event type
  if (payload.type === 'contact.created') {
    await handleContactCreated(admin, orgId, payload)
  } else if (payload.type === 'pipeline_stage.updated') {
    await handleStageUpdated(admin, orgId, payload)
  }

  return ok({ message: 'Processed' })
})

async function handleContactCreated(admin, orgId, payload) {
  // Upsert lead — idempotent on ghl_contact_id
  await admin.from('leads').upsert({
    organization_id:  orgId,
    ghl_contact_id:   payload.contact.id,
    full_name:        `${payload.contact.firstName} ${payload.contact.lastName}`.trim(),
    email:            payload.contact.email ?? null,
    phone:            payload.contact.phone,
    stage:            'NEW',
    platform:         inferPlatform(payload.contact.source),
    last_ghl_sync_at: new Date().toISOString(),
  }, { onConflict: 'organization_id,ghl_contact_id' })

  // Broadcast Realtime update to org channel
  await admin.channel(`org:${orgId}:leads`).send({
    type: 'broadcast', event: 'lead_created', payload: { orgId }
  })
}

async function handleStageUpdated(admin, orgId, payload) {
  const stage = mapGHLStageToMIRD(payload.stageName)

  await admin.from('leads')
    .update({ stage, ghl_stage_id: payload.stageId, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('ghl_contact_id', payload.contactId)

  // Realtime push
  await admin.channel(`org:${orgId}:leads`).send({
    type: 'broadcast', event: 'stage_updated',
    payload: { orgId, contactId: payload.contactId, stage }
  })
}

/** Maps GHL stage names to MIRD stage enum */
function mapGHLStageToMIRD(stageName: string): string {
  const map: Record<string, string> = {
    'New Lead':        'NEW',
    'Contacted':       'CONTACTED',
    'Appointment Set': 'APPT_SET',
    'Closed':          'CLOSED',
    'Lost':            'LOST',
  }
  return map[stageName] ?? 'CONTACTED'
}
```

### 3.3 Retell Webhook Handler

```typescript
// supabase/functions/retell-webhook/index.ts
serve(async (req) => {
  const body = await req.text()
  const signature = req.headers.get('X-Retell-Signature') ?? ''

  // Verify Retell signature
  const valid = await verifyRetellSignature(body, signature, Deno.env.get('RETELL_WEBHOOK_SECRET')!)
  if (!valid) return err('INVALID_SIGNATURE', 'Invalid Retell signature', 401)

  const parsed = RetellCallEndedSchema.safeParse(JSON.parse(body))
  if (!parsed.success) return err('VALIDATION_ERROR', parsed.error.message)

  const { call } = parsed.data
  const { lead_id, organization_id, call_type } = call.metadata
  const admin = createAdminClient()

  // Verify lead belongs to claimed org (prevents metadata injection)
  const { data: lead } = await admin.from('leads')
    .select('id, organization_id')
    .eq('id', lead_id)
    .eq('organization_id', organization_id)
    .single()
  if (!lead) return err('NOT_FOUND', 'Lead not found', 404)

  const disposition = call.call_analysis?.custom_analysis_data?.disposition ?? null
  const sentiment   = mapSentiment(call.call_analysis?.user_sentiment)

  // Update ai_calls record (upsert on retell_call_id — idempotent)
  await admin.from('ai_calls').upsert({
    id:               call.call_id,              // use Retell call_id as PK
    organization_id:  organization_id,
    lead_id:          lead_id,
    call_type:        call_type,
    retell_call_id:   call.call_id,
    status:           'COMPLETED',
    disposition:      disposition,
    duration_seconds: Math.round(call.duration_ms / 1000),
    recording_url:    call.recording_url,
    transcript:       call.transcript,
    summary:          call.call_analysis?.call_summary,
    sentiment:        sentiment,
    initiated_at:     new Date(call.start_timestamp).toISOString(),
    ended_at:         new Date(call.end_timestamp).toISOString(),
  }, { onConflict: 'retell_call_id' })

  // If appointment set — update lead stage
  if (disposition === 'APPT_SET') {
    await admin.from('leads')
      .update({ stage: 'APPT_SET', updated_at: new Date().toISOString() })
      .eq('id', lead_id)
  }

  // Realtime push
  await admin.channel(`org:${organization_id}:leads`).send({
    type: 'broadcast', event: 'call_completed',
    payload: { lead_id, disposition }
  })

  return ok({ message: 'Call record updated' })
})
```

---

## 4. Claude AI Department Agents

### 4.1 Agent Runner Architecture

```typescript
// packages/ai-agents/src/runner.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export interface AgentRunConfig {
  agentName:  AgentName
  reportType: ReportType
  schedule:   string          // cron expression
  maxTokens:  number
  temperature: number
  buildContext: (supabase: SupabaseClient) => Promise<AgentContext>
  buildPrompt:  (context: AgentContext) => string
  parseOutput:  (response: string) => AgentOutput
}

export interface AgentContext {
  dateRange:   { from: string; to: string }
  metrics:     Record<string, unknown>
  alerts:      unknown[]
  rawData:     unknown
}

export interface AgentOutput {
  title:          string
  summary:        string
  content:        Record<string, unknown>
  alerts:         ReportAlert[]
  recommendations: ReportRecommendation[]
  actionItems:    ReportActionItem[]
}

export async function runAgent(config: AgentRunConfig): Promise<void> {
  const startTime = Date.now()
  const claude  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_AGENT_KEY!,    // limited key — read-only views + report INSERT
    { auth: { persistSession: false } }
  )

  let reportId: string | null = null

  try {
    // 1. Fetch context data from Supabase
    const context = await config.buildContext(supabase)

    // 2. Build and call Claude
    const prompt = config.buildPrompt(context)
    const response = await claude.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: AGENT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawOutput = response.content[0].type === 'text' ? response.content[0].text : ''

    // 3. Parse + validate output (Zod)
    const output = config.parseOutput(rawOutput)

    // 4. Write report to DB
    const { data: report } = await supabase.from('reports').insert({
      organization_id:   null,               // MIRD-level report
      report_type:       config.reportType,
      title:             output.title,
      summary:           output.summary,
      content:           output.content,
      alerts:            output.alerts,
      recommendations:   output.recommendations,
      action_items:      output.actionItems,
      model_used:        'claude-sonnet-4-6',
      tokens_input:      response.usage.input_tokens,
      tokens_output:     response.usage.output_tokens,
      cost_usd:          calculateCost(response.usage),
      generation_time_ms: Date.now() - startTime,
    }).select().single()
    reportId = report?.id ?? null

    // 5. Log performance
    await supabase.from('agent_performance').insert({
      agent_name:     config.agentName,
      status:         'SUCCESS',
      duration_ms:    Date.now() - startTime,
      tokens_input:   response.usage.input_tokens,
      tokens_output:  response.usage.output_tokens,
      cost_usd:       calculateCost(response.usage),
      report_id:      reportId,
    })

    // 6. Slack notification
    await postToSlack(formatSlackMessage(config.agentName, output))

  } catch (error) {
    await supabase.from('agent_performance').insert({
      agent_name:    config.agentName,
      status:        'FAILED',
      duration_ms:   Date.now() - startTime,
      error_message: error instanceof Error ? error.message : String(error),
      error_stack:   error instanceof Error ? error.stack : null,
    })
    await postToSlack({
      channel: '#mird-alerts',
      text: `🚨 ${config.agentName} agent FAILED: ${error instanceof Error ? error.message : error}`,
    })
    throw error   // Re-throw so Vercel Cron marks run as failed
  }
}

// Cost calculation: claude-sonnet-4-6 pricing
function calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
  const INPUT_COST_PER_1K  = 0.003   // $3/MTok
  const OUTPUT_COST_PER_1K = 0.015   // $15/MTok
  return (usage.input_tokens / 1000 * INPUT_COST_PER_1K) +
         (usage.output_tokens / 1000 * OUTPUT_COST_PER_1K)
}
```

### 4.2 System Prompt (All Agents)

```typescript
const AGENT_SYSTEM_PROMPT = `
You are an internal business intelligence agent for Make It Rain Digital (MIRD),
an AI-powered client acquisition company. You analyze business data and produce
structured operational reports for CEO review.

OUTPUT RULES — STRICT:
1. Respond ONLY with valid JSON matching the schema provided in the user message.
2. No markdown, no preamble, no explanation outside the JSON structure.
3. Use precise language — operational, not conversational.
4. Alerts must be actionable — include WHAT happened, WHY it matters, WHAT to do.
5. Recommendations must include a specific action, not a suggestion to "consider" something.
6. Financial figures must be exact — no rounding beyond cents.
7. If data is insufficient to make a claim, state "Insufficient data for {X}" in that field.
8. Never fabricate metrics — report only what the data supports.
`
```

### 4.3 Dept 1 — Growth & Acquisition Agent

**Schedule:** Daily 6:00 AM CST
**Data sources:** `leads`, `subscriptions`, `organizations`, Apollo API
**Slack channel:** `#ceo-loop`

```typescript
// packages/ai-agents/src/dept-1-growth.ts

const DEPT1_OUTPUT_SCHEMA = z.object({
  title:   z.string(),
  summary: z.string().max(500),
  content: z.object({
    pipeline: z.object({
      total_prospects:   z.number(),
      demos_scheduled:  z.number(),
      demos_completed:  z.number(),
      proposals_sent:   z.number(),
      new_clients_mtd:  z.number(),
      close_rate_mtd:   z.number(),
    }),
    outbound: z.object({
      sequences_active: z.number(),
      emails_sent_today: z.number(),
      replies_today:     z.number(),
      meetings_booked:   z.number(),
    }),
    churn_risk: z.array(z.object({
      org_id:   z.string(),
      org_name: z.string(),
      risk:     z.enum(['HIGH','MEDIUM']),
      reason:   z.string(),
    })),
  }),
  alerts:          ReportAlertSchema.array(),
  recommendations: ReportRecommendationSchema.array().max(3),
  action_items:    ReportActionItemSchema.array().max(5),
})

export const dept1Config: AgentRunConfig = {
  agentName:   'DEPT_1_GROWTH',
  reportType:  'DEPT_1_GROWTH',
  schedule:    '0 6 * * *',          // 6 AM daily
  maxTokens:   4096,
  temperature: 0.3,

  buildContext: async (supabase) => {
    const [orgs, subs, leads] = await Promise.all([
      supabase.from('organizations').select('id,name,status,created_at').eq('status','active'),
      supabase.from('subscriptions').select('organization_id,plan,mrr,status,cancelled_at')
                                    .gte('created_at', thirtyDaysAgo()),
      supabase.from('leads').select('stage,created_at,organization_id')
                            .gte('created_at', sevenDaysAgo()),
    ])
    return { dateRange: last7Days(), metrics: { orgs: orgs.data, subs: subs.data, leads: leads.data }, alerts: [], rawData: null }
  },

  buildPrompt: (ctx) => `
    Analyze MIRD's growth and client acquisition for ${ctx.dateRange.from} to ${ctx.dateRange.to}.

    DATA:
    ${JSON.stringify(ctx.metrics, null, 2)}

    Respond with JSON matching this exact schema:
    ${JSON.stringify(DEPT1_OUTPUT_SCHEMA._def, null, 2)}
  `,

  parseOutput: (raw) => {
    const parsed = DEPT1_OUTPUT_SCHEMA.safeParse(JSON.parse(raw))
    if (!parsed.success) throw new Error(`Invalid agent output: ${parsed.error.message}`)
    return parsed.data
  },
}
```

### 4.4 Dept 2 — Ad Ops & Delivery Agent

**Schedule:** Daily 7:00 AM CST
**Data sources:** `campaigns`, `leads` (platform=META/GOOGLE), `ad_accounts`
**Slack channel:** `#ceo-loop`

```typescript
const DEPT2_OUTPUT_SCHEMA = z.object({
  title:   z.string(),
  summary: z.string().max(500),
  content: z.object({
    portfolio: z.object({
      total_spend_mtd:    z.number(),
      total_leads_mtd:    z.number(),
      blended_cpl_mtd:    z.number(),
      meta_cpl_mtd:       z.number().nullable(),
      google_cpl_mtd:     z.number().nullable(),
      best_performing:    z.string().nullable(),   // campaign name
      worst_performing:   z.string().nullable(),
    }),
    by_client: z.array(z.object({
      org_name:   z.string(),
      spend_mtd:  z.number(),
      leads_mtd:  z.number(),
      cpl_mtd:    z.number().nullable(),
      cpl_trend:  z.enum(['IMPROVING','STABLE','DEGRADING']),
      health:     z.enum(['HIGH','MEDIUM','LOW']),
    })),
  }),
  alerts:          ReportAlertSchema.array(),
  recommendations: ReportRecommendationSchema.array().max(3),
  action_items:    ReportActionItemSchema.array().max(5),
})

// CPL alert threshold: if any client CPL > 2× their 30-day average → CRITICAL alert
// Budget pacing: if any client < 80% paced at 60% of month → WARNING alert
```

### 4.5 Dept 3 — Product & Automation Agent

**Schedule:** Daily 8:00 AM CST
**Data sources:** `onboarding_sessions`, `ghl_accounts`, `organizations`
**Slack channel:** `#ceo-loop`

```typescript
const DEPT3_OUTPUT_SCHEMA = z.object({
  title:   z.string(),
  summary: z.string().max(500),
  content: z.object({
    onboarding: z.object({
      in_progress:  z.number(),
      completed_7d: z.number(),
      stuck:        z.array(z.object({ client: z.string(), step: z.number(), days_stalled: z.number() })),
    }),
    integrations: z.object({
      ghl_connected:    z.number(),
      ghl_disconnected: z.number(),
      meta_connected:   z.number(),
      google_connected: z.number(),
      integration_errors: z.array(z.object({ org_name: z.string(), platform: z.string(), error: z.string() })),
    }),
  }),
  alerts:          ReportAlertSchema.array(),
  recommendations: ReportRecommendationSchema.array().max(3),
  action_items:    ReportActionItemSchema.array().max(5),
})
```

### 4.6 Dept 4 — Finance & BI Agent

**Schedule:** Daily 7:30 AM CST
**Data sources:** `subscriptions`, `organizations`, `agent_performance` (cost tracking)
**Slack channel:** `#ceo-loop`
**Temperature: 0.1** — lowest of all agents; financial data demands maximum precision

```typescript
const DEPT4_OUTPUT_SCHEMA = z.object({
  title:   z.string(),
  summary: z.string().max(500),
  content: z.object({
    mrr: z.object({
      current:         z.number(),
      previous_month:  z.number(),
      mom_change:      z.number(),         // absolute
      mom_change_pct:  z.number(),         // percentage
      new_mrr_mtd:     z.number(),
      churned_mrr_mtd: z.number(),
      expansion_mrr:   z.number(),
    }),
    clients: z.object({
      total_active:    z.number(),
      by_plan:         z.record(z.string(), z.number()),  // { starter: 3, growth: 2, grand_slam: 1 }
      at_risk_count:   z.number(),
      new_mtd:         z.number(),
      churned_mtd:     z.number(),
    }),
    ai_costs: z.object({
      total_cost_mtd:  z.number(),
      cost_by_agent:   z.record(z.string(), z.number()),
      budget_remaining: z.number(),         // $100 ceiling - spent
    }),
    north_star: z.object({
      score:      z.number().min(0).max(100),
      components: z.record(z.string(), z.number()),
      trend:      z.enum(['UP','FLAT','DOWN']),
    }),
  }),
  alerts:          ReportAlertSchema.array(),
  recommendations: ReportRecommendationSchema.array().max(3),
  action_items:    ReportActionItemSchema.array().max(5),
})
```

### 4.7 Slack Message Format

```typescript
function formatSlackMessage(agentName: AgentName, output: AgentOutput): SlackMessage {
  const emoji = {
    DEPT_1_GROWTH:    '📈',
    DEPT_2_AD_OPS:    '📊',
    DEPT_3_PRODUCT:   '⚙️',
    DEPT_4_FINANCE:   '💰',
  }[agentName]

  const criticalAlerts = output.alerts.filter(a => a.severity === 'CRITICAL')
  const alertText = criticalAlerts.length
    ? `\n🚨 *${criticalAlerts.length} CRITICAL ALERT${criticalAlerts.length > 1 ? 'S' : ''}:*\n` +
      criticalAlerts.map(a => `• ${a.message}`).join('\n')
    : ''

  return {
    channel: '#ceo-loop',
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${emoji} ${output.title}` }
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: output.summary + alertText }
      },
      output.actionItems.length > 0 && {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Action Items:*\n${output.actionItems.map(a => `• ${a.task} _(${a.owner})_`).join('\n')}`
        }
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `_Generated ${new Date().toLocaleTimeString()} CST_` }]
      }
    ].filter(Boolean)
  }
}
```

---

## 5. n8n Workflow Specifications

### 5.1 Lead Router Workflow

**Trigger:** GHL webhook → `contact.created`
**n8n trigger node:** Webhook (POST `/webhook/ghl-contact-created`)

```
Step 1: Receive GHL contact.created payload
Step 2: Lookup org by location_id → Supabase REST (GET /rest/v1/ghl_accounts)
Step 3: Lookup routing policy for org → GET /rest/v1/agents?organization_id=X&routing_enabled=true
Step 4: Apply routing algorithm:
    IF org has routing_enabled agents:
      → Weighted round-robin (routing_weight / sum of all weights)
      → Skip agents at max_leads_per_day limit
      → If all agents at limit → assign to owner
    ELSE:
      → Leave assigned_agent_id NULL
Step 5: Update lead with assigned_agent_id → PATCH /rest/v1/leads
Step 6: Create notification → POST /rest/v1/notifications
    { type: 'LEAD_ASSIGNED', user_id: agent.user_id, title: 'New lead assigned: {name}' }
Step 7: IF platform = META or GOOGLE:
    → Trigger Retell AI call (separate workflow)

Error handling: On any step failure → Slack alert to #mird-alerts with payload + step
Retry: 3 attempts, exponential backoff (1s, 5s, 30s)
```

**Routing algorithm (weighted round-robin):**
```javascript
// n8n Code Node
const agents = $input.first().json.agents
  .filter(a => a.routing_enabled && a.leads_today < a.max_leads_per_day)

if (agents.length === 0) return [{ json: { agentId: null } }]

const totalWeight = agents.reduce((sum, a) => sum + a.routing_weight, 0)
let random = Math.random() * totalWeight

for (const agent of agents) {
  random -= agent.routing_weight
  if (random <= 0) return [{ json: { agentId: agent.id } }]
}

return [{ json: { agentId: agents[agents.length - 1].id } }]
```

### 5.2 Retell AI Trigger Workflow

**Trigger:** Called by Lead Router (IF new lead from paid platform)
**Purpose:** Initiate Retell AI voice call within 60 seconds of lead form submit

```
Step 1: Receive { lead_id, organization_id, phone, full_name, platform, campaign_id }
Step 2: Validate phone number format (E.164) → skip if invalid
Step 3: Check DNC list → Supabase REST: GET /rest/v1/leads?phone=X&stage=LOST
    IF previous DNC disposition exists → skip, log, notify
Step 4: POST https://api.retellai.com/v2/create-phone-call
    Body: {
      from_number:   RETELL_FROM_NUMBER,
      to_number:     lead.phone,
      agent_id:      RETELL_AGENT_ID,
      metadata: {
        lead_id:         lead_id,
        organization_id: organization_id,
        call_type:       'RETELL_NEW_LEAD',
      },
      retell_llm_dynamic_variables: {
        lead_name:    full_name,
        platform:     platform,
      }
    }
Step 5: Update ai_calls → INSERT { status: 'INITIATED', retell_call_id, lead_id, org_id }
Step 6: Success → log call_id

Error handling:
  - Retell API 429: Wait 5s, retry once
  - Retell API 5xx: Alert #mird-alerts, mark ai_call status='FAILED'
  - Phone invalid: Mark lead tag 'invalid-phone', skip call
```

### 5.3 Ad Report Sync Workflow

**Trigger:** Scheduled — twice daily (7 AM + 7 PM CST)
**Purpose:** Pull fresh campaign metrics from Meta + Google, update `campaigns` table

```
Step 1: GET all connected ad_accounts → Supabase REST (is_connected = true)
Step 2: For each META ad_account:
    a. Read access_token from Supabase Vault (via Edge Function call)
    b. GET https://graph.facebook.com/v19.0/{ad_account_id}/campaigns
       ?fields=id,name,status,objective,daily_budget,lifetime_budget,
               insights{spend,impressions,clicks,actions}&date_preset=last_30d
    c. Upsert campaigns table with fresh metrics
    d. Calculate CPL = spend / lead_action_count
Step 3: For each GOOGLE ad_account:
    a. Read refresh_token from Vault → exchange for access_token
    b. Google Ads API: reports.search(GAQL query for campaign performance)
    c. Upsert campaigns table with fresh metrics
Step 4: Update ad_accounts.last_synced_at
Step 5: If any CPL > threshold → INSERT notification (CEO + org owner)

Error handling:
  - Token expired (Meta 190): Mark ad_account.sync_error, notify org owner via notification
  - Token expired (Google 401): Same pattern
  - API rate limit: Back off 60s, retry
```

### 5.4 Onboarding Provisioner Workflow

**Trigger:** Called by Onboarding Portal after `submitOnboardingAction` succeeds
**Purpose:** Create all MIRD backend infrastructure for a new client

```
Step 1: Receive { session_id } from Next.js server action (via Supabase Edge Function HTTP call)
Step 2: Read onboarding_session from Supabase (all step data)
Step 3: Create GHL sub-account
    POST https://services.leadconnectorhq.com/locations/
    Body from step1_data + step2_data
    → Receive { sub_account_id, location_id }
Step 4: Call provision-org Edge Function
    POST https://{project}.supabase.co/functions/v1/provision-org
    { session_id, ghlSubAccountId, ghlLocationId }
    → Edge Function creates: organization, ghl_accounts, ad_accounts, agents, subscription
Step 5: Register GHL webhook for new sub-account
    POST GHL webhook registration API
    { url: MIRD_GHL_WEBHOOK_URL, events: ['contact.created', 'pipeline_stage.updated'] }
Step 6: Update onboarding_session.provisioning_completed_at
Step 7: Send welcome email (via GHL email action or SendGrid)
Step 8: Post Slack notification to #mird-alerts
    "✅ New client provisioned: {client_name} | Plan: {plan}"

Rollback strategy (on any step failure):
  - Step 3 fails: Mark session provisioning_error, alert #mird-alerts, manual retry
  - Step 4 fails: Delete GHL sub-account if created, mark error, alert
  - Steps 5-8 fail: Non-critical — log error, do not rollback org creation
  - Idempotency: All Supabase writes use upsert — safe to re-run after failure
```

---

## 6. GHL Integration Layer

### 6.1 Sub-Account Architecture

Each MIRD client gets one GHL sub-account. The MIRD agency account is the parent.

| Entity | Level | Purpose |
|--------|-------|---------|
| MIRD Agency Account | Agency | Master pipelines, global automations, Voice Agent configuration |
| Client Sub-Account | Sub | Per-client contacts, pipeline, custom values, calendars, their Voice Agent |

### 6.2 Contact Sync Strategy

**Direction:** GHL → Supabase (GHL is source of truth)
**Method:** Webhook-driven (real-time) + periodic reconciliation (nightly)

```typescript
// Nightly reconciliation (Vercel Cron 2 AM):
// 1. Fetch all contacts from GHL REST API for each sub-account
// 2. Compare against leads table (by ghl_contact_id)
// 3. Upsert any missing or stale records
// 4. Log reconciliation stats (added, updated, unchanged)
// Purpose: Catches any webhooks that were missed during n8n downtime
```

### 6.3 Custom Values Mapping

GHL custom values ↔ Supabase `leads` table:

| GHL Custom Value Key | Supabase Column | Notes |
|---------------------|-----------------|-------|
| `property_type` | `leads.property_type` | Sync on contact created + updated |
| `budget_min` | `leads.budget_min` | Integer (dollars) |
| `budget_max` | `leads.budget_max` | Integer (dollars) |
| `pre_approved` | `leads.pre_approved` | Boolean from GHL checkbox |
| `timeline` | `leads.timeline` | Maps GHL dropdown to timeline enum |
| `lead_score` | `leads.lead_score` | Calculated by MIRD, written back to GHL |

---

## 7. Retell AI Integration

### 7.1 Call Types and Triggers

| Call Type | Trigger | Agent ID | Use Case |
|-----------|---------|---------|---------|
| `RETELL_NEW_LEAD` | New contact in GHL (paid platforms) | `RETELL_NEW_LEAD_AGENT_ID` | Immediate response to ad form submission |
| `RETELL_COLD_OUTBOUND` | Manual trigger from RainMachine | `RETELL_COLD_AGENT_ID` | Re-engagement of cold leads |
| `RETELL_DBR` | DBR campaign launch | `RETELL_DBR_AGENT_ID` | Database reactivation calls |

### 7.2 Disposition → Stage Mapping

```typescript
const DISPOSITION_TO_STAGE: Record<Disposition, LeadStage | null> = {
  'INTERESTED':       'CONTACTED',      // Positive, not yet scheduled
  'APPT_SET':         'APPT_SET',       // Auto-updates lead stage
  'CALL_BACK':        'CONTACTED',      // Requested callback — stays in CONTACTED
  'NOT_INTERESTED':   'LOST',           // Mark as lost
  'WRONG_NUMBER':     null,             // Don't change stage, add tag 'wrong-number'
  'DNC':              'LOST',           // Do Not Call — mark lost + add DNC tag
  'VOICEMAIL_LEFT':   'CONTACTED',      // Left voicemail — update to CONTACTED
}
```

### 7.3 Dynamic Variables (Per Agent)

Retell agents receive these dynamic variables from n8n at call creation time:

```typescript
// RETELL_NEW_LEAD_AGENT variables:
{
  lead_name:    string    // First name for greeting
  platform:     string    // "Meta Ads" or "Google Ads" — for opener context
  property_type?: string  // If known from lead form
  city?:         string   // Market area if captured
}
```

---

## 8. Meta Ads API Integration

### 8.1 Authentication

Meta integration uses **System User tokens** — long-lived, no expiry.

```typescript
// supabase/functions/_shared/meta.ts
export async function getMetaClient(admin: SupabaseClient, orgId: string) {
  const { data: adAccount } = await admin
    .from('ad_accounts')
    .select('platform_account_id, access_token_ref')
    .eq('organization_id', orgId)
    .eq('platform', 'META')
    .single()

  const accessToken = await readSecret(admin, adAccount.access_token_ref)

  return {
    accountId: adAccount.platform_account_id,
    fetch: (path: string, params: Record<string, string> = {}) => {
      const url = new URL(`https://graph.facebook.com/v19.0/${path}`)
      url.searchParams.set('access_token', accessToken)
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
      return globalThis.fetch(url.toString())
    }
  }
}
```

### 8.2 Campaigns Sync Query

```typescript
// Fetch last 30d campaign performance
const fields = [
  'id', 'name', 'status', 'objective',
  'daily_budget', 'lifetime_budget',
  'start_time', 'stop_time',
  'insights{spend,impressions,clicks,actions}'
].join(',')

const response = await meta.fetch(
  `act_${meta.accountId}/campaigns`,
  { fields, date_preset: 'last_30d', limit: '100' }
)

// Map insights to MIRD campaign metrics:
// cpl = spend / lead_action_count (where action_type = 'lead')
// ctr = clicks / impressions
```

---

## 9. Google Ads API Integration

### 9.1 OAuth Token Refresh Pattern

Google access tokens expire in 1 hour. All API calls go through a refresh wrapper:

```typescript
// supabase/functions/_shared/google.ts
export async function getGoogleAdsClient(admin: SupabaseClient, orgId: string) {
  const { data: adAccount } = await admin
    .from('ad_accounts')
    .select('platform_account_id, refresh_token_ref, token_expires_at')
    .eq('organization_id', orgId)
    .eq('platform', 'GOOGLE')
    .single()

  const refreshToken = await readSecret(admin, adAccount.refresh_token_ref)

  // Refresh access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id:     Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  })
  const { access_token, expires_in } = await tokenRes.json()

  // Store new access token in Vault (overwrites previous)
  await storeSecret(admin, `google_access_${orgId}`, access_token)
  await admin.from('ad_accounts')
    .update({ token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString() })
    .eq('organization_id', orgId).eq('platform', 'GOOGLE')

  return { customerId: adAccount.platform_account_id, accessToken: access_token }
}
```

### 9.2 GAQL Campaign Performance Query

```sql
-- Google Ads Query Language (GAQL)
SELECT
  campaign.id,
  campaign.name,
  campaign.status,
  campaign.advertising_channel_type,
  campaign_budget.amount_micros,
  metrics.cost_micros,
  metrics.impressions,
  metrics.clicks,
  metrics.conversions,
  metrics.ctr
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.status != 'REMOVED'
ORDER BY metrics.cost_micros DESC
LIMIT 50
```

---

## 10. Background Job Architecture

### 10.1 Cron Schedule (Vercel Cron)

```json
// vercel.json (apps/ceo-dashboard — agent runner lives here)
{
  "crons": [
    { "path": "/api/cron/dept-1-growth",  "schedule": "0 12 * * *" },
    { "path": "/api/cron/dept-2-ad-ops",  "schedule": "0 13 * * *" },
    { "path": "/api/cron/dept-4-finance", "schedule": "30 13 * * *" },
    { "path": "/api/cron/dept-3-product", "schedule": "0 14 * * *" },
    { "path": "/api/cron/lead-reconcile", "schedule": "0 8 * * *"  }
  ]
}
```

Times in UTC (CST = UTC-6 in winter, UTC-5 in summer).

### 10.2 Cron Route Pattern

```typescript
// apps/ceo-dashboard/app/api/cron/dept-2-ad-ops/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dept2Config } from '@mird/ai-agents'
import { runAgent } from '@mird/ai-agents/runner'

export async function GET(request: NextRequest) {
  // Verify request comes from Vercel Cron (not public)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await runAgent(dept2Config)
    return NextResponse.json({ ok: true, agent: 'DEPT_2_AD_OPS' })
  } catch (error) {
    // runAgent already logged + alerted — just return 500 so Vercel logs it
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
```

### 10.3 Nightly Lead Reconciliation Job

```typescript
// apps/ceo-dashboard/app/api/cron/lead-reconcile/route.ts
// Runs 2 AM CST — catches any GHL events missed during n8n downtime
export async function GET(request: NextRequest) {
  // For each connected ghl_account:
  //   1. Fetch all contacts from GHL REST API (paginated)
  //   2. Upsert to leads table
  //   3. Log: { org_id, added, updated, unchanged }
  // Target: < 5 min total runtime for 10 orgs × 500 leads each
}
```

---

## 11. Step 11 Framework Alignment

Per the step-8 spec, backend implementation must align with these frameworks
that Step 11 PRDs will expect.

### 11.1 Framework Alignment Matrix

| Framework | Implementation in MIRD | Step 11 Will Expect |
|-----------|----------------------|---------------------|
| **Vertical Slice (Bogard)** | Each domain folder = complete slice (`actions/leads.ts` owns DB + validation + response) | Each PRD = complete slice |
| **Railway-Oriented (Wlaschin)** | All server actions return `Result<T, E>` — never throw | Actions return Result, never throw |
| **Google API Design** | Resources: `/leads`, `/agents`, `/campaigns` — no verb URLs | Consistent resource naming |
| **Zod Best Practices** | Schema colocated with action in same file | Schemas at point of use |
| **OWASP API Security** | BOLA protection, rate limiting, HMAC webhooks | Each PRD inherits baseline |
| **Supabase RLS** | Every table has explicit RLS policies (see SCHEMA-COMPLETE.sql) | PRDs reference policy by name |
| **Server Actions (Next.js)** | Validate → auth check → explicit org_id WHERE → Result | Consistent pattern |
| **Feature-Sliced Design** | `actions/` by domain, `components/` by feature, `packages/` shared | Folder conventions enforced |

### 11.2 RLS Policy Naming Convention

PRDs in Step 11 will reference RLS policies by these exact names:

| Policy Name Pattern | Example |
|--------------------|---------|
| `"{table}: select own org"` | `"leads: select own org"` |
| `"{table}: write own org"` | `"leads: write own org"` |
| `"{table}: update own org"` | `"leads: update own org"` |
| `"{table}: mird_admin only"` | `"agent_performance: mird_admin only"` |
| `"{table}: owner or mird_admin"` | `"ghl_accounts: owner or mird_admin"` |
| `"{table}: service role writes"` | `"campaigns: service role writes"` |

### 11.3 Error Code → UI State Contract

Step 11 PRDs reference these error codes for UI state rendering:

| AppErrorCode | JARVIS UI State | Component |
|-------------|----------------|-----------|
| `SESSION_EXPIRED` | `SESSION EXPIRED` | Full-page overlay |
| `VALIDATION_ERROR` + `field` | `SYSTEM ALERT` Tier 1 | Inline field error |
| `VALIDATION_ERROR` (no field) | `SYSTEM ALERT` Tier 2 | AlertBanner |
| `GHL_API_ERROR` | `DEGRADED` | AlertBanner with reconnect CTA |
| `META_API_ERROR` | `DEGRADED` | AlertBanner with reconnect CTA |
| `INVALID_TOKEN` | `SYSTEM ALERT` | Full-page token error screen |
| `RATE_LIMITED` | `SYSTEM ALERT` Tier 3 | Toast |
| `INTERNAL_ERROR` | `SYSTEM ALERT` Tier 4 | Critical modal |
| `NOT_FOUND` | `STANDBY` | Empty state component |

---

*Backend spec complete as of 2026-03-31. Covers all integration layers, all 4 Claude agents, all 4 n8n workflows, all Edge Functions.*

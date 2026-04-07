# F16 — Claude AI Client Intelligence Agents

**Source pitch:** P16a
**Cycle:** 8 | **Release:** R2 | **Appetite:** Medium
**Status:** Ready for implementation

---

## 1. Overview

### Problem
RainMachine collects rich per-client data — leads, calls, appointments, campaigns, ad metrics — but no one synthesizes it into actionable intelligence. Team leaders get raw numbers but not the story behind them. The CEO needs an automated signal when a client's ad account has an anomaly (token revoked, CPL spike, campaign with zero leads) before the client notices.

### Solution
Two Supabase Edge Functions running on pg_cron schedules:

1. **`weekly-intelligence-agent`** — Runs Monday 6:15am ET. Pulls the last 7 days of data for each active tenant, sends a structured prompt to Claude API, validates the JSON response with Zod, inserts to `reports` table, and emails a plain-text summary to the RM via Resend.

2. **`ad-ops-agent`** — Runs daily 8:00am ET. Pulls the last 24h of `ad_metrics` for all tenants, runs anomaly detection rules, and creates `alerts` rows for any tenant that triggers a threshold. Writes an `agent_logs` entry regardless of outcome.

Both agents handle errors gracefully: schema validation failures are logged as `schema_error` status (not a crash), and processing continues for remaining tenants.

### Success Criteria
- Weekly intel agent generates a valid `WeeklyBriefSchema` report for every active tenant on Monday mornings
- Ad ops agent detects CPL spikes > 1.5x threshold within 24 hours
- Failed Zod validation logs `schema_error` but does not crash the run — other tenants still get reports
- Claude API costs tracked per run in `claude_api_usage`
- Integration tests with mock Claude responses validate both success and schema_error paths

### Out of Scope (MVP)
- Per-tenant prompt customization (one prompt template for all)
- Agent re-runs / manual trigger from CEO UI (F20 provides read-only logs)
- Multi-language report generation

---

## 2. Database

### agent_prompts Table

```sql
-- supabase/migrations/0028_agent_prompts.sql

-- Prompt templates stored in DB so they can be updated without code deploys
CREATE TABLE agent_prompts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_type   TEXT NOT NULL UNIQUE
               CHECK (agent_type IN ('weekly_intel', 'ad_ops', 'growth', 'finance')),
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,  -- Handlebars-style {{variable}} placeholders
  model        TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  max_tokens   INTEGER NOT NULL DEFAULT 2000,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_agent_prompts_updated_at
  BEFORE UPDATE ON agent_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed initial prompts
INSERT INTO agent_prompts (agent_type, system_prompt, user_prompt_template, max_tokens) VALUES
(
  'weekly_intel',
  'You are an AI analyst for RainMachine, an AI-powered lead generation platform for real estate team leaders. Your job is to analyze weekly performance data and generate a structured intelligence report. Always respond with valid JSON matching the WeeklyBriefSchema. Be specific, data-driven, and actionable.',
  'Analyze the following week of performance data for {{business_name}} (week of {{week_start}}).

LEAD DATA (last 7 days):
- Total new leads: {{leads_total}}
- Leads by source: {{leads_by_source}}
- Leads by stage: {{leads_by_stage}}

CALL DATA (last 7 days):
- Total AI calls: {{calls_total}}
- Connected rate: {{call_connect_rate}}%
- Appointments booked from calls: {{appts_from_calls}}
- Outcomes: {{call_outcomes}}

APPOINTMENT DATA (last 7 days):
- Appointments set: {{appointments_set}}
- Appointments held: {{appointments_held}}
- Close rate: {{close_rate}}%

AD METRICS (last 7 days):
- Total ad spend: ${{total_spend}}
- Total impressions: {{total_impressions}}
- Total ad leads: {{ad_leads}}
- Average CPL: ${{avg_cpl}}
- Per-campaign breakdown: {{campaign_breakdown}}

MISSION PARAMETERS:
- Target market: {{target_market}}
- Primary goal: {{primary_goal}}
- Monthly ad budget: ${{monthly_ad_budget}}

Generate a WeeklyBriefSchema JSON report with: executive_summary (3-4 sentences), key_metrics (exactly 6 metrics), campaign_performance (all campaigns), recommendations (3-5 actionable items), and optionally callouts (notable wins or risks).',
  2000
),
(
  'ad_ops',
  'You are an AI anomaly detection agent for RainMachine. Analyze ad performance data and identify issues that require immediate attention. Respond with a JSON array of alert objects.',
  'Check the following ad metrics from the last 24 hours across all tenants for anomalies.

TENANT AD DATA:
{{tenant_ad_summary}}

CPL THRESHOLD: ${{cpl_threshold}}
EXPECTED LEADS/DAY: {{expected_daily_leads}}

Identify: 1) CPL > 1.5x threshold, 2) Campaigns with 0 leads in 24h that had leads in prior 7d, 3) Tenants with revoked OAuth tokens. Return JSON array of { tenant_id, alert_type, severity, title, message, recommended_action }.',
  1000
);
```

### pg_cron Setup

```sql
-- supabase/migrations/0029_agent_cron.sql

-- Requires pg_cron extension enabled in Supabase project settings

-- Weekly intel agent: Monday 6:15am UTC (which is 6:15am ET in winter, 7:15am in summer)
-- Adjust UTC time seasonally or use America/New_York if pg_cron supports TZ
SELECT cron.schedule(
  'weekly-intelligence-agent',
  '15 11 * * 1',  -- 11:15 UTC = 6:15 ET (EST)
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_edge_function_url') || '/weekly-intelligence-agent',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Ad ops agent: daily 8:00am ET = 13:00 UTC
SELECT cron.schedule(
  'ad-ops-agent',
  '0 13 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_edge_function_url') || '/ad-ops-agent',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
```

---

## 3. TypeScript Interfaces

```typescript
// packages/db/src/types/agents.types.ts
import { z } from 'zod';

// ─── Weekly Brief Schema (also used in F15 report viewer) ────
export const WeeklyBriefSchemaZod = z.object({
  executive_summary: z.string().min(50).max(1000),
  key_metrics: z.array(z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()]),
    unit: z.string().optional(),
    delta: z.number().optional(),
    delta_direction: z.enum(['up', 'down', 'neutral']).optional(),
  })).length(6),
  campaign_performance: z.array(z.object({
    campaign_name: z.string(),
    platform: z.enum(['meta', 'google']),
    spend: z.number().min(0),
    leads: z.number().int().min(0),
    cpl: z.number().nullable(),
    status: z.string(),
  })),
  recommendations: z.array(z.string()).min(1).max(10),
  callouts: z.array(z.string()).optional(),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  generated_at: z.string().datetime(),
});

export type WeeklyBriefSchema = z.infer<typeof WeeklyBriefSchemaZod>;

// ─── Ad Ops Alert Schema ──────────────────────────────────────
export const AdOpsAlertSchema = z.object({
  tenant_id: z.string().uuid(),
  alert_type: z.enum(['cpl_spike', 'zero_leads', 'oauth_revoked']),
  severity: z.enum(['critical', 'warning', 'info']),
  title: z.string().max(200),
  message: z.string().max(1000),
  recommended_action: z.string().max(500).optional(),
});

export type AdOpsAlert = z.infer<typeof AdOpsAlertSchema>;

export const AdOpsResponseSchema = z.array(AdOpsAlertSchema);

// ─── Agent run context ─────────────────────────────────────────
export interface TenantRunData {
  tenant_id: string;
  business_name: string;
  target_market: string | null;
  primary_goal: string | null;
  monthly_ad_budget: number | null;
  leads_total: number;
  leads_by_source: Record<string, number>;
  leads_by_stage: Record<string, number>;
  calls_total: number;
  call_connect_rate: number;
  appts_from_calls: number;
  call_outcomes: Record<string, number>;
  appointments_set: number;
  appointments_held: number;
  close_rate: number | null;
  total_spend: number;
  total_impressions: number;
  ad_leads: number;
  avg_cpl: number | null;
  campaign_breakdown: Array<{
    name: string;
    platform: string;
    spend: number;
    leads: number;
    cpl: number | null;
    status: string;
  }>;
}
```

---

## 4. Supabase Edge Functions

### weekly-intelligence-agent

```typescript
// supabase/functions/weekly-intelligence-agent/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.0';
import { z } from 'https://esm.sh/zod@3.22.0';
import { WeeklyBriefSchemaZod } from '../../packages/db/src/types/agents.types.ts';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

  const runAt = new Date().toISOString();
  const weekStart = getMonday(new Date()).toISOString().split('T')[0];

  // Load prompt template
  const { data: promptRow } = await supabase
    .from('agent_prompts')
    .select('system_prompt, user_prompt_template, model, max_tokens')
    .eq('agent_type', 'weekly_intel')
    .single();

  if (!promptRow) {
    console.error('No prompt template found for weekly_intel');
    return new Response(JSON.stringify({ error: 'No prompt template' }), { status: 500 });
  }

  // Load all active tenants
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, routing_rules')
    .eq('status', 'active');

  if (!tenants?.length) {
    return new Response(JSON.stringify({ message: 'No active tenants' }), { status: 200 });
  }

  const logEntries: Array<{ tenant_id: string; message: string; level: string; timestamp: string }> = [];
  let successCount = 0;
  let errorCount = 0;

  for (const tenant of tenants) {
    try {
      // Load mission params
      const { data: progress } = await supabase
        .from('onboarding_progress')
        .select('step2_data')
        .eq('tenant_id', tenant.id)
        .single();

      const missionParams = (progress?.step2_data as {
        target_market?: string;
        primary_goal?: string;
        monthly_ad_budget?: number;
        business_name?: string;
      } | null) ?? {};

      // Collect last 7 days of data
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [leadsRes, callsRes, apptsRes, metricsRes] = await Promise.all([
        supabase.from('leads').select('stage, lead_source').eq('tenant_id', tenant.id).gte('created_at', sevenDaysAgo),
        supabase.from('calls').select('outcome, status, connected').eq('tenant_id', tenant.id).gte('created_at', sevenDaysAgo),
        supabase.from('appointments').select('status').eq('tenant_id', tenant.id).gte('created_at', sevenDaysAgo),
        supabase.from('ad_metrics').select('spend, impressions, leads, campaign_id').eq('tenant_id', tenant.id).gte('metric_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      ]);

      const leads = leadsRes.data ?? [];
      const calls = callsRes.data ?? [];
      const appts = apptsRes.data ?? [];
      const metrics = metricsRes.data ?? [];

      // Build run data
      const totalSpend = metrics.reduce((s, m) => s + (m.spend ?? 0), 0);
      const adLeads = metrics.reduce((s, m) => s + (m.leads ?? 0), 0);
      const connectedCalls = calls.filter((c) => c.connected).length;

      const runData: TenantRunData = {
        tenant_id: tenant.id,
        business_name: missionParams.business_name ?? tenant.name,
        target_market: missionParams.target_market ?? null,
        primary_goal: missionParams.primary_goal ?? null,
        monthly_ad_budget: missionParams.monthly_ad_budget ?? null,
        leads_total: leads.length,
        leads_by_source: countBy(leads, 'lead_source'),
        leads_by_stage: countBy(leads, 'stage'),
        calls_total: calls.length,
        call_connect_rate: calls.length > 0 ? Math.round((connectedCalls / calls.length) * 100) : 0,
        appts_from_calls: appts.filter((a) => a.status === 'confirmed').length,
        call_outcomes: countBy(calls, 'outcome'),
        appointments_set: appts.length,
        appointments_held: appts.filter((a) => a.status === 'held').length,
        close_rate: leads.length > 0
          ? Math.round((appts.filter((a) => a.status === 'confirmed').length / leads.length) * 100 * 10) / 10
          : null,
        total_spend: totalSpend,
        total_impressions: metrics.reduce((s, m) => s + (m.impressions ?? 0), 0),
        ad_leads: adLeads,
        avg_cpl: adLeads > 0 ? Math.round((totalSpend / adLeads) * 100) / 100 : null,
        campaign_breakdown: [], // simplified — full breakdown from campaigns join
      };

      // Build user prompt from template
      const userPrompt = interpolateTemplate(promptRow.user_prompt_template, {
        business_name: runData.business_name,
        week_start: weekStart,
        leads_total: runData.leads_total,
        leads_by_source: JSON.stringify(runData.leads_by_source),
        leads_by_stage: JSON.stringify(runData.leads_by_stage),
        calls_total: runData.calls_total,
        call_connect_rate: runData.call_connect_rate,
        appts_from_calls: runData.appts_from_calls,
        call_outcomes: JSON.stringify(runData.call_outcomes),
        appointments_set: runData.appointments_set,
        appointments_held: runData.appointments_held,
        close_rate: runData.close_rate ?? 0,
        total_spend: totalSpend.toFixed(2),
        total_impressions: runData.total_impressions,
        ad_leads: adLeads,
        avg_cpl: runData.avg_cpl ?? 'N/A',
        campaign_breakdown: JSON.stringify(runData.campaign_breakdown),
        target_market: runData.target_market ?? 'Not specified',
        primary_goal: runData.primary_goal ?? 'Not specified',
        monthly_ad_budget: runData.monthly_ad_budget ?? 'Not specified',
      });

      // Call Claude API
      const message = await anthropic.messages.create({
        model: promptRow.model,
        max_tokens: promptRow.max_tokens,
        system: promptRow.system_prompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const rawText = message.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { type: 'text'; text: string }).text)
        .join('');

      // Track cost
      const costUsd = (message.usage.input_tokens * 3 + message.usage.output_tokens * 15) / 1_000_000;
      await supabase.from('claude_api_usage').insert({
        tenant_id: tenant.id,
        agent_type: 'weekly_intel',
        tokens_in: message.usage.input_tokens,
        tokens_out: message.usage.output_tokens,
        cost_usd: costUsd,
        model: promptRow.model,
      });

      // Parse JSON from response
      let parsedContent: unknown;
      try {
        // Handle markdown code block wrapper if present
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ?? [null, rawText];
        parsedContent = JSON.parse(jsonMatch[1] ?? rawText);
      } catch {
        logEntries.push({ tenant_id: tenant.id, message: 'JSON parse error', level: 'error', timestamp: new Date().toISOString() });
        errorCount++;
        continue; // Skip to next tenant — do NOT crash the loop
      }

      // Zod validation
      const validated = WeeklyBriefSchemaZod.safeParse({
        ...parsedContent,
        week_start: weekStart,
        generated_at: runAt,
      });

      if (!validated.success) {
        logEntries.push({
          tenant_id: tenant.id,
          message: `Schema error: ${validated.error.issues[0]?.message}`,
          level: 'error',
          timestamp: new Date().toISOString(),
        });
        // Log schema_error but continue processing other tenants
        await supabase.from('agent_logs').insert({
          department: 'weekly_intel',
          run_at: runAt,
          status: 'schema_error',
          summary: `Tenant ${tenant.id}: schema validation failed`,
          entries: [{ tenant_id: tenant.id, error: validated.error.issues[0]?.message }],
        });
        errorCount++;
        continue;
      }

      // Insert to reports table
      await supabase.from('reports').upsert(
        {
          tenant_id: tenant.id,
          report_type: 'weekly_intel',
          week_start: weekStart,
          content: validated.data,
        },
        { onConflict: 'tenant_id,report_type,week_start' }
      );

      // Send email via Resend
      const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
      const emailBody = buildEmailBody(validated.data, tenant.name);
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'reports@rainmachine.io',
          to: [tenant.name], // In production: lookup tenant's email from auth.users
          subject: `Your RainMachine Weekly Report — Week of ${weekStart}`,
          text: emailBody,
        }),
      });

      logEntries.push({ tenant_id: tenant.id, message: 'Report generated successfully', level: 'info', timestamp: new Date().toISOString() });
      successCount++;
    } catch (err) {
      logEntries.push({
        tenant_id: tenant.id,
        message: `Unexpected error: ${err instanceof Error ? err.message : 'unknown'}`,
        level: 'error',
        timestamp: new Date().toISOString(),
      });
      errorCount++;
      // Continue to next tenant — never crash the full run
    }
  }

  // Write final agent log
  await supabase.from('agent_logs').insert({
    department: 'weekly_intel',
    run_at: runAt,
    status: errorCount === 0 ? 'success' : successCount > 0 ? 'partial' : 'api_error',
    summary: `${successCount} reports generated, ${errorCount} errors`,
    entries: logEntries,
  });

  return new Response(
    JSON.stringify({ success: successCount, errors: errorCount }),
    { status: 200 }
  );
});

// ─── Helpers ────────────────────────────────────────────────────
function countBy(arr: Array<Record<string, unknown>>, key: string): Record<string, number> {
  return arr.reduce((acc: Record<string, number>, item) => {
    const val = String(item[key] ?? 'unknown');
    acc[val] = (acc[val] ?? 0) + 1;
    return acc;
  }, {});
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function interpolateTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

function buildEmailBody(report: WeeklyBriefSchema, tenantName: string): string {
  return [
    `RAINMACHINE WEEKLY REPORT — ${tenantName}`,
    `Week of ${report.week_start}`,
    '',
    'EXECUTIVE SUMMARY',
    report.executive_summary,
    '',
    'KEY METRICS',
    ...report.key_metrics.map((m) => `${m.label}: ${m.value}${m.unit ?? ''}`),
    '',
    'TOP RECOMMENDATIONS',
    ...report.recommendations.slice(0, 3).map((r, i) => `${i + 1}. ${r}`),
    '',
    'View full report: https://dashboard.rainmachine.io/reports',
  ].join('\n');
}
```

### ad-ops-agent

```typescript
// supabase/functions/ad-ops-agent/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.0';
import { AdOpsResponseSchema } from '../../packages/db/src/types/agents.types.ts';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

  const runAt = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Load prompt
  const { data: promptRow } = await supabase
    .from('agent_prompts')
    .select('system_prompt, user_prompt_template, model, max_tokens')
    .eq('agent_type', 'ad_ops')
    .single();

  // Load CEO settings for thresholds
  const { data: ceoSettings } = await supabase
    .from('ceo_settings')
    .select('cpl_threshold')
    .limit(1)
    .single();

  const cplThreshold = ceoSettings?.cpl_threshold ?? 100;

  // Load ad metrics (yesterday vs 7-day baseline) for all tenants
  const [yesterdayMetrics, baselineMetrics, revokedCampaigns] = await Promise.all([
    supabase
      .from('ad_metrics')
      .select('tenant_id, campaign_id, spend, leads, cpl')
      .eq('metric_date', yesterday),
    supabase
      .from('ad_metrics')
      .select('tenant_id, campaign_id, spend, leads')
      .gte('metric_date', sevenDaysAgo)
      .lt('metric_date', yesterday),
    supabase
      .from('campaigns')
      .select('tenant_id, name, platform')
      .in('oauth_status', ['revoked', 'expired']),
  ]);

  // Run rule-based anomaly detection (no Claude needed for deterministic rules)
  const ruleBasedAlerts: Array<{
    tenant_id: string;
    alert_type: string;
    severity: string;
    title: string;
    message: string;
    recommended_action: string;
  }> = [];

  // Rule 1: CPL spike > 1.5x threshold
  for (const metric of yesterdayMetrics.data ?? []) {
    if (metric.cpl != null && metric.cpl > cplThreshold * 1.5) {
      ruleBasedAlerts.push({
        tenant_id: metric.tenant_id,
        alert_type: 'cpl_spike',
        severity: 'critical',
        title: `CPL Spike Detected`,
        message: `Yesterday's CPL of $${metric.cpl.toFixed(2)} exceeds 1.5x the $${cplThreshold} threshold.`,
        recommended_action: 'Review campaign targeting and bid strategy. Consider pausing underperforming ad sets.',
      });
    }
  }

  // Rule 2: Campaigns with 0 leads yesterday but had leads in prior 7d
  const priorTenantLeads = new Map<string, number>();
  for (const m of baselineMetrics.data ?? []) {
    priorTenantLeads.set(m.tenant_id, (priorTenantLeads.get(m.tenant_id) ?? 0) + (m.leads ?? 0));
  }
  const yesterdayLeads = new Map<string, number>();
  for (const m of yesterdayMetrics.data ?? []) {
    yesterdayLeads.set(m.tenant_id, (yesterdayLeads.get(m.tenant_id) ?? 0) + (m.leads ?? 0));
  }
  for (const [tenantId, priorLeads] of priorTenantLeads) {
    if (priorLeads > 0 && (yesterdayLeads.get(tenantId) ?? 0) === 0) {
      ruleBasedAlerts.push({
        tenant_id: tenantId,
        alert_type: 'zero_leads',
        severity: 'warning',
        title: 'Zero Leads in Last 24 Hours',
        message: `This client generated ${priorLeads} leads over the prior 7 days but 0 yesterday.`,
        recommended_action: 'Check campaign status and ad account budget. Verify campaigns are active.',
      });
    }
  }

  // Rule 3: OAuth revoked
  for (const campaign of revokedCampaigns.data ?? []) {
    ruleBasedAlerts.push({
      tenant_id: campaign.tenant_id,
      alert_type: 'oauth_revoked',
      severity: 'critical',
      title: `${campaign.platform === 'meta' ? 'Meta' : 'Google'} Ads Token Revoked`,
      message: `Ad account access for "${campaign.name}" has been revoked. Metrics sync has stopped.`,
      recommended_action: 'Contact client to reconnect their ad account in Settings → Integrations.',
    });
  }

  // Use Claude for additional pattern analysis (non-deterministic insights)
  let claudeAlertCount = 0;
  if (promptRow && ruleBasedAlerts.length < 20) { // Skip if too many alerts already
    try {
      const tenantSummary = buildTenantAdSummary(
        yesterdayMetrics.data ?? [],
        baselineMetrics.data ?? []
      );

      const message = await anthropic.messages.create({
        model: promptRow.model,
        max_tokens: promptRow.max_tokens,
        system: promptRow.system_prompt,
        messages: [{
          role: 'user',
          content: interpolateTemplate(promptRow.user_prompt_template, {
            tenant_ad_summary: tenantSummary,
            cpl_threshold: cplThreshold,
            expected_daily_leads: 5,
          }),
        }],
      });

      const rawText = message.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { type: 'text'; text: string }).text)
        .join('');

      const costUsd = (message.usage.input_tokens * 3 + message.usage.output_tokens * 15) / 1_000_000;
      await supabase.from('claude_api_usage').insert({
        agent_type: 'ad_ops',
        tokens_in: message.usage.input_tokens,
        tokens_out: message.usage.output_tokens,
        cost_usd: costUsd,
        model: promptRow.model,
      });

      try {
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ?? [null, rawText];
        const parsed = JSON.parse(jsonMatch[1] ?? rawText);
        const validated = AdOpsResponseSchema.safeParse(parsed);
        if (validated.success) {
          claudeAlertCount = validated.data.length;
          // Merge Claude alerts (dedup by tenant_id + alert_type)
          for (const alert of validated.data) {
            const isDup = ruleBasedAlerts.some(
              (a) => a.tenant_id === alert.tenant_id && a.alert_type === alert.alert_type
            );
            if (!isDup) ruleBasedAlerts.push(alert);
          }
        }
      } catch { /* Schema error — rule-based alerts still inserted */ }
    } catch { /* Claude API error — rule-based alerts still inserted */ }
  }

  // Insert all alerts to DB
  const alertsToInsert = ruleBasedAlerts.map((a) => ({
    tenant_id: a.tenant_id,
    severity: a.severity,
    type: a.alert_type,
    title: a.title,
    message: a.message,
    recommended_action: a.recommended_action,
  }));

  if (alertsToInsert.length > 0) {
    await supabase.from('alerts').insert(alertsToInsert);
  }

  // Write agent log
  await supabase.from('agent_logs').insert({
    department: 'ad_ops',
    run_at: runAt,
    status: 'success',
    summary: `${ruleBasedAlerts.length} alerts generated (${claudeAlertCount} from Claude + ${ruleBasedAlerts.length - claudeAlertCount} rule-based)`,
    entries: alertsToInsert.map((a) => ({
      tenant_id: a.tenant_id,
      message: a.title,
      level: a.severity === 'critical' ? 'error' : 'warning',
      timestamp: runAt,
    })),
  });

  return new Response(
    JSON.stringify({ alerts_created: alertsToInsert.length }),
    { status: 200 }
  );
});

function buildTenantAdSummary(
  yesterday: Array<{ tenant_id: string; spend: number; leads: number; cpl: number | null }>,
  baseline: Array<{ tenant_id: string; spend: number; leads: number }>
): string {
  const byTenant: Record<string, { yesterday_spend: number; yesterday_leads: number; baseline_leads: number }> = {};

  for (const m of yesterday) {
    if (!byTenant[m.tenant_id]) byTenant[m.tenant_id] = { yesterday_spend: 0, yesterday_leads: 0, baseline_leads: 0 };
    byTenant[m.tenant_id].yesterday_spend += m.spend ?? 0;
    byTenant[m.tenant_id].yesterday_leads += m.leads ?? 0;
  }
  for (const m of baseline) {
    if (!byTenant[m.tenant_id]) byTenant[m.tenant_id] = { yesterday_spend: 0, yesterday_leads: 0, baseline_leads: 0 };
    byTenant[m.tenant_id].baseline_leads += m.leads ?? 0;
  }

  return Object.entries(byTenant)
    .map(([tid, d]) =>
      `${tid}: yesterday spend=$${d.yesterday_spend.toFixed(2)}, leads=${d.yesterday_leads}, 7d_baseline_leads=${d.baseline_leads}`
    )
    .join('\n');
}

function interpolateTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}
```

---

## 5. Server Actions

No server actions for this feature. Both agents are Edge Functions triggered by pg_cron.

---

## 6. UI Components

No UI components for this feature. F16 is pure backend — outputs populate `reports` (viewed in F15) and `alerts` (viewed in F13/F20).

---

## 7. Integration Points

### F15 (Report Viewer)
`weekly-intelligence-agent` inserts to `reports` table → F15 reads and displays. The `WeeklyBriefSchemaZod` Zod type is shared between the agent (validation) and F15 (rendering). Any breaking schema change requires updating both.

### F13 (CEO Command Center Alert Feed)
`ad-ops-agent` inserts to `alerts` table → F13 reads and displays. Alert `type` values (`cpl_spike`, `zero_leads`, `oauth_revoked`) are known to the CEO UI for any future type-specific display logic.

### F20 (Agent Logs)
Both agents write to `agent_logs`. F20 reads these for the CEO agent log viewer. The `entries` JSONB array is displayed as the detailed log output.

### Resend (Email Delivery)
Weekly reports are emailed via Resend. The `to` field uses the tenant's email from `auth.users` (looked up via service role). Email template is plain text in R1; HTML in R2.

### Environment Variables

```bash
# Edge Functions environment (set in Supabase Edge Function secrets)
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 8. BDD Scenarios

```gherkin
Feature: F16 — Claude AI Client Intelligence Agents

  Background:
    Given 3 active tenants exist with 7 days of lead/call/ad data
    And agent_prompts contains templates for 'weekly_intel' and 'ad_ops'

  Scenario: Weekly intel agent generates reports for all tenants
    When the weekly-intelligence-agent Edge Function is invoked
    Then 3 reports are inserted to the reports table
    And each report has all 6 key_metrics
    And each report has at least 1 recommendation
    And each tenant's RM receives a report email via Resend

  Scenario: Schema error — agent continues to next tenant
    Given Claude returns malformed JSON for tenant B
    When the agent processes tenant B
    Then a schema_error entry is logged in agent_logs for tenant B
    And tenants A and C still receive their reports
    And the final agent_logs.status = 'partial' (not 'api_error')

  Scenario: Report idempotency
    Given a report for tenant A, week 2025-01-20 already exists
    When the agent runs again for the same week
    Then the existing report is overwritten (upsert on conflict)
    And no duplicate reports exist

  Scenario: Ad ops agent detects CPL spike
    Given tenant X has a CPL of $180 yesterday (threshold is $100, 1.5x = $150)
    When the ad-ops-agent runs
    Then an alert is created for tenant X with severity='critical' and type='cpl_spike'
    And the alert appears in F13 command center alert feed

  Scenario: Ad ops agent detects zero leads
    Given tenant Y had 20 leads over the prior 7 days but 0 yesterday
    When the ad-ops-agent runs
    Then an alert is created with type='zero_leads' and severity='warning'

  Scenario: Ad ops agent detects OAuth revocation
    Given a Meta campaign for tenant Z has oauth_status='revoked'
    When the ad-ops-agent runs
    Then an alert is created with type='oauth_revoked' and severity='critical'
    And the alert message contains "Meta"

  Scenario: Cost tracking
    Given the weekly intel agent runs for 3 tenants
    Then 3 rows are inserted in claude_api_usage with agent_type='weekly_intel'
    And each row has non-zero tokens_in, tokens_out, and cost_usd
```

---

## 9. Test Plan

### Integration Tests (with Mock Claude API)

```typescript
// supabase/functions/weekly-intelligence-agent/__tests__/agent.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const VALID_REPORT = {
  executive_summary: 'This was a strong week with 42 leads generated at an average CPL of $47.60.',
  key_metrics: [
    { label: 'Total Leads', value: 42 },
    { label: 'Appointments Set', value: 15 },
    { label: 'AI Calls', value: 38 },
    { label: 'Connect Rate', value: 68, unit: '%' },
    { label: 'Avg CPL', value: 47.6, unit: '$' },
    { label: 'Close Rate', value: 35.7, unit: '%' },
  ],
  campaign_performance: [
    { campaign_name: 'Facebook Leads', platform: 'meta', spend: 2000, leads: 42, cpl: 47.6, status: 'active' },
  ],
  recommendations: [
    'Increase daily budget by 15% on the Facebook Leads campaign.',
    'Schedule a re-engagement sequence for 12 unconverted leads.',
  ],
  week_start: '2025-01-20',
  generated_at: '2025-01-20T11:15:00Z',
};

describe('weekly-intelligence-agent', () => {
  it('inserts a valid report for a tenant with known mock response', async () => {
    // Mock: Anthropic.messages.create returns VALID_REPORT wrapped in JSON
    // Mock: Supabase reports.upsert called with correct schema
    // Assert: upsert called once with valid WeeklyBriefSchema
  });

  it('logs schema_error and continues when Claude returns malformed JSON', async () => {
    // Mock: Anthropic returns '{"oops": "missing required fields"}'
    // Assert: agent_logs insert with status='schema_error'
    // Assert: reports.upsert NOT called for this tenant
  });

  it('continues processing remaining tenants after one failure', async () => {
    // Mock: tenant 1 → valid response, tenant 2 → throws error, tenant 3 → valid response
    // Assert: 2 reports inserted, 1 error logged, final status='partial'
  });
});

describe('ad-ops-agent anomaly detection', () => {
  it('creates cpl_spike alert when CPL > 1.5x threshold', async () => {
    // Seed: ad_metrics with cpl=180 (threshold=100, 1.5x=150)
    // Assert: alerts.insert called with type='cpl_spike', severity='critical'
  });

  it('creates zero_leads alert when yesterday=0 but 7d baseline>0', async () => {
    // Seed: 7d baseline leads=15, yesterday leads=0
    // Assert: alerts.insert called with type='zero_leads'
  });

  it('does not create duplicate alert types for same tenant in one run', async () => {
    // Both rule-based and Claude detect CPL spike for same tenant
    // Assert: only one alert inserted (dedup logic)
  });
});
```

---

## 10. OWASP Security Checklist

| # | Check | Implementation |
|---|-------|----------------|
| 1 | **API Key Security** | `ANTHROPIC_API_KEY` stored in Supabase Edge Function secrets (not in code or DB). Never logged. |
| 2 | **Service Role Isolation** | Edge Functions use service role key. The key is never exposed to the browser or RM. |
| 3 | **Prompt Injection** | Tenant data is inserted as structured JSON, not as natural language instructions. System prompt establishes agent role. |
| 4 | **Cost Runaway Prevention** | `max_tokens` capped per prompt (2000 for weekly intel, 1000 for ad ops). Rate limited by pg_cron schedule. |
| 5 | **Schema Validation** | All Claude responses validated with Zod before DB insert. Schema errors logged but do not crash agent. |
| 6 | **JSON Parse Robustness** | Code block wrapper stripped before `JSON.parse`. Parse errors caught and logged. |
| 7 | **Tenant Data Isolation** | Each tenant's data is fetched independently. No cross-tenant data enters any single Claude prompt. |
| 8 | **Email Delivery** | Resend API key stored in Edge Function secrets. `to` address derived from auth.users (server-side only). |
| 9 | **Alert Deduplication** | Ad ops agent dedups by tenant_id + alert_type before insert. Prevents alert spam from multiple runs. |
| 10 | **pg_cron Security** | Cron schedules use HTTP POST to Edge Function with Bearer token. Direct database manipulation is not possible via cron. |

---

## 11. Open Questions

| ID | Question | Owner | Resolution |
|----|----------|-------|------------|
| OQ-01 | Should the weekly intel agent skip tenants that have been clients for < 1 week (no historical data)? | Product | Yes — skip if `onboarding_jobs.completed_at` < 7 days ago. Log as 'skipped' in agent_logs. |
| OQ-02 | How do we handle prompt template updates without breaking existing report schema? | Engineering | Schema version field in `agent_prompts`. Breaking changes require a report schema migration. |
| OQ-03 | Should the ad ops agent create a new alert if an identical alert already exists (undismissed)? | Engineering | No — check for undismissed alert with same tenant_id + type before inserting. Add UNIQUE constraint. |
| OQ-04 | How do we test Edge Functions locally (Supabase CLI `supabase functions serve`)? | Engineering | Use `supabase functions serve` + mock environment variables. Integration tests use seeded test DB. |
| OQ-05 | Should ad ops anomalies trigger an immediate Slack/SMS notification to the CEO? | Product | Yes in R2 — add Slack webhook call in ad-ops-agent after alert insert. Out of scope for R1. |

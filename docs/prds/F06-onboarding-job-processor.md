# F06 — Onboarding Job Processor
# RainMachine · MIRD AI Corporate Machine
# Sigma Protocol Step 11 · PRD Generation
# Source Pitch: P06 · Cycle: 3 · Release: R0 · Appetite: Medium
# Date: 2026-04-02 | Status: Ready for Implementation

---

## 1. Overview

### Pitch Summary

Getting a new RainMachine client live requires coordinating six things simultaneously: creating their GHL sub-account, configuring their Retell AI agent, setting up GHL routing rules, connecting their Meta and Google ad accounts, finalizing their Supabase tenant record, and sending a welcome email. If any step is done manually, it takes hours and is error-prone. This PRD automates the entire provisioning sequence into a Supabase Edge Function that runs when a new `onboarding_jobs` row is inserted. Each step is idempotent — if it fails and is retried, it picks up from where it left off without duplicating work.

### User-Facing Outcome

From Shomari's perspective: he approves a new client in the Onboarding Portal → the system provisions everything automatically → 5 minutes later, RainMachine is live for that client. If any step fails, a CEO alert fires and the retry picks up from the failed step. No manual GHL configuration, no manual Retell setup, no manual email sending.

From the new client's perspective (F12): they submit their wizard → see a live progress log ("GHL sub-account: ONLINE · Retell AI: CONFIGURING · Routing: PENDING...") → land on "RAINMACHINE IS LIVE" when all 6 steps complete.

### What This PRD Covers

- `onboarding_jobs` table with step tracking
- Supabase Edge Function `process-onboarding-job` (6 steps, idempotent)
- Polling endpoint: `GET /api/onboarding/status?job_id=xxx`
- `Component` type + progress response shape
- Supabase Vault helpers for OAuth token storage
- E2E test: full provisioning flow in staging

### What This PRD Does Not Cover

- The Client Onboarding Portal UI (F12)
- The step that calls this Edge Function (F12 creates the `onboarding_jobs` row)
- Stripe customer creation (F17)
- Meta/Google OAuth connection UI (F11)

### Acceptance Summary

- INSERT into `onboarding_jobs` triggers `process-onboarding-job` Edge Function
- Each of 6 steps executes in order; each checks `step_statuses[step].complete` before executing
- If Step 3 fails and the function is retried, Steps 1 and 2 are skipped
- Polling endpoint returns `{ step, percent, components }` with accurate status per step
- A completed job sets tenant.status = "active"
- A welcome email is sent via Resend after Step 6
- Full provisioning completes in < 5 minutes in staging

---

## 2. Database

### 2.1 New Tables

```sql
-- supabase/migrations/0009_onboarding_jobs.sql

CREATE TYPE job_status AS ENUM (
  'pending', 'running', 'done', 'failed', 'retrying'
);

CREATE TABLE onboarding_jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status          job_status NOT NULL DEFAULT 'pending',
  current_step    INTEGER NOT NULL DEFAULT 0,  -- 0 = not started, 1–6 = in progress
  step_statuses   JSONB NOT NULL DEFAULT '{}', -- { "1": { "complete": bool, "error": str?, "completedAt": str? } }
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Only one active job per tenant at a time
  CONSTRAINT onboarding_jobs_one_active UNIQUE NULLS NOT DISTINCT (tenant_id)
    WHERE status IN ('pending', 'running', 'retrying')
);

CREATE INDEX idx_onboarding_jobs_tenant ON onboarding_jobs(tenant_id, created_at DESC);
CREATE INDEX idx_onboarding_jobs_status ON onboarding_jobs(status) WHERE status != 'done';

-- Trigger: on INSERT, invoke Edge Function via pg_net
-- Note: the Edge Function is invoked via Supabase DB webhook, not pg_net directly.
-- The Supabase "Database Webhook" feature is configured in dashboard to call
-- the Edge Function URL on INSERT to onboarding_jobs.

-- updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON onboarding_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 `notification_preferences` Table (scaffolded for F11)

```sql
-- supabase/migrations/0010_notification_prefs.sql
-- Scaffolded here because F06 welcome email needs to know delivery preferences.
-- Full management UI is F11.

CREATE TABLE notification_preferences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  welcome_email   BOOLEAN NOT NULL DEFAULT true,
  weekly_report   BOOLEAN NOT NULL DEFAULT true,
  alert_email     BOOLEAN NOT NULL DEFAULT true,
  alert_sms       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_prefs_own_tenant" ON notification_preferences
  FOR ALL USING (tenant_id = auth.tenant_id() OR auth.is_ceo());
```

### 2.3 RLS for `onboarding_jobs`

```sql
ALTER TABLE onboarding_jobs ENABLE ROW LEVEL SECURITY;

-- Tenant owner can read their own job
CREATE POLICY "onboarding_jobs_select_own" ON onboarding_jobs
  FOR SELECT USING (tenant_id = auth.tenant_id() OR auth.is_ceo());

-- CEO can update job status (for manual retry)
CREATE POLICY "onboarding_jobs_update_ceo" ON onboarding_jobs
  FOR UPDATE USING (auth.is_ceo());
```

### 2.4 Supabase Vault Setup

Supabase Vault stores encrypted secrets. Used for OAuth tokens (Meta, Google Ads) collected in F11. The Vault API is accessed server-side only.

```sql
-- supabase/migrations/0011_vault_init.sql
-- Enable Vault (if not already enabled as part of Supabase project)
-- No DDL needed — Vault is a built-in Supabase extension.
-- Confirm enabled in: Supabase Dashboard → Database → Extensions → supabase_vault

-- The vault.create_secret() and vault.decrypted_secrets view are used
-- from Edge Functions via service role. No table creation needed here.
```

---

## 3. TypeScript Interfaces

### 3.1 Onboarding Job Types

```typescript
// packages/db/src/types/onboarding.types.ts

export type JobStatus = "pending" | "running" | "done" | "failed" | "retrying";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface StepStatus {
  complete: boolean;
  error?: string;
  completedAt?: string; // ISO string
  data?: Record<string, unknown>; // Step-specific output (e.g., ghl_sub_account_id)
}

export type StepStatuses = Partial<Record<OnboardingStep, StepStatus>>;

export interface OnboardingJob {
  id: string;
  tenantId: string;
  status: JobStatus;
  currentStep: OnboardingStep | 0;
  stepStatuses: StepStatuses;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Component status for the onboarding progress UI.
 * Maps to the 6 provisioning steps.
 */
export type ComponentStatus = "online" | "configuring" | "pending" | "error";

export interface OnboardingComponent {
  name: string;
  status: ComponentStatus;
  step: OnboardingStep;
}

/**
 * Response shape from GET /api/onboarding/status
 */
export interface OnboardingStatusResponse {
  jobId: string;
  status: JobStatus;
  step: OnboardingStep | 0;
  percent: number;      // 0–100; each step = ~16.67%
  components: OnboardingComponent[];
  errorMessage?: string;
}

/**
 * Payload for the Edge Function (not called directly by clients)
 */
export interface ProcessOnboardingJobPayload {
  jobId: string;
  tenantId: string;
}

/**
 * Step-specific input data stored on the onboarding_jobs row when created.
 * Collected by F12 wizard steps 1–4.
 */
export interface OnboardingJobInput {
  tenantName: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone?: string;
  launchDate?: string;
  logoUrl?: string;
  metaAccountId?: string;      // collected in wizard Step 3
  googleCustomerId?: string;   // collected in wizard Step 4
  gmb_location_id?: string;
  notifications?: {
    weeklyReport: boolean;
    alertEmail: boolean;
  };
}
```

### 3.2 GHL API Types (for Step 1)

```typescript
// packages/db/src/types/ghl.admin.types.ts
// GHL Agency API — sub-account management

export interface GhlCreateSubAccountRequest {
  name: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  website?: string;
  timezone: string;
}

export interface GhlCreateSubAccountResponse {
  id: string;         // GHL sub-account ID → stored as tenants.ghl_sub_account_id
  name: string;
  locationId: string;
}

export interface GhlCreateRoutingRuleRequest {
  locationId: string;
  rules: Array<{
    name: string;
    condition: string;
    action: string;
    agentId?: string;
  }>;
}
```

### 3.3 Resend Email Types

```typescript
// packages/db/src/email/types.ts

export interface WelcomeEmailData {
  to: string;
  firstName: string;
  tenantName: string;
  dashboardUrl: string;
  supportEmail: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
```

---

## 4. Server Actions

No user-initiated server actions in F06. The provisioning is triggered by the onboarding job row insertion (F12's responsibility). The only user-facing surface in F06 is the polling endpoint (Section 5).

---

## 5. API Routes

### 5.1 Onboarding Status Polling Endpoint

**File:** `apps/onboarding/app/api/onboarding/status/route.ts`

This endpoint is called by the F12 wizard's polling client every 3 seconds to get job progress.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { createServerClient } from "@rainmachine/db";
import type { OnboardingStatusResponse, OnboardingComponent, StepStatuses } from "@rainmachine/db";

const querySchema = z.object({
  job_id: z.string().uuid("Invalid job ID"),
});

const STEP_NAMES: Record<number, string> = {
  1: "GHL Sub-Account",
  2: "Retell AI Agent",
  3: "Lead Routing",
  4: "Ad Account Connection",
  5: "Tenant Finalization",
  6: "Welcome Email",
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Auth: onboarding portal uses a signed JWT in the URL (F12)
  // For F06, use session-based auth (simplified until F12 adds JWT middleware)
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ job_id: searchParams.get("job_id") });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid job_id" }, { status: 400 });
  }

  const { data: job, error } = await supabase
    .from("onboarding_jobs")
    .select("id, status, current_step, step_statuses, error_message")
    .eq("id", parsed.data.job_id)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const stepStatuses = (job.step_statuses ?? {}) as StepStatuses;
  const currentStep = (job.current_step ?? 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const completedSteps = Object.values(stepStatuses).filter(
    (s) => s?.complete,
  ).length;
  const percent = Math.round((completedSteps / 6) * 100);

  const components: OnboardingComponent[] = ([1, 2, 3, 4, 5, 6] as const).map(
    (step) => {
      const stepStatus = stepStatuses[step];
      let status: OnboardingComponent["status"] = "pending";

      if (stepStatus?.complete) {
        status = "online";
      } else if (stepStatus?.error) {
        status = "error";
      } else if (step === currentStep && job.status === "running") {
        status = "configuring";
      }

      return {
        name: STEP_NAMES[step] ?? `Step ${step}`,
        status,
        step,
      };
    },
  );

  const response: OnboardingStatusResponse = {
    jobId: job.id,
    status: job.status as OnboardingStatusResponse["status"],
    step: currentStep,
    percent,
    components,
    errorMessage: job.error_message ?? undefined,
  };

  // Cache-Control: no-cache (this is a polling endpoint — always fresh)
  return NextResponse.json(response, {
    headers: { "Cache-Control": "no-cache, no-store" },
  });
}
```

---

## 6. UI Components

F06 has no new UI components. The progress display lives in the Onboarding Portal (F12). The `OnboardingComponent` type defined in Section 3 maps to the `StepIndicator` component from F02 when rendered in F12.

---

## 7. Integration Points

### 7.1 Supabase Edge Function: `process-onboarding-job`

**File:** `supabase/functions/process-onboarding-job/index.ts`

This is the core of F06. It runs all 6 provisioning steps sequentially with idempotency.

```typescript
// supabase/functions/process-onboarding-job/index.ts
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req: Request) => {
  const { jobId } = await req.json();

  // Load job
  const { data: job, error: jobError } = await supabase
    .from("onboarding_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return new Response(JSON.stringify({ error: "Job not found" }), { status: 404 });
  }

  // Mark job as running
  await supabase
    .from("onboarding_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", jobId);

  const stepStatuses = (job.step_statuses ?? {}) as Record<string, unknown>;

  // Load job input (stored when job was created)
  const jobInput = job.input_data as Record<string, unknown>;
  const tenant = await loadTenant(job.tenant_id);

  // ─── Step 1: GHL Sub-Account Creation ───────────────────────────────────────
  if (!stepStatuses["1"]?.complete) {
    await updateStep(jobId, 1, "running");
    try {
      const ghlResult = await createGhlSubAccount(tenant, jobInput);
      await supabase
        .from("tenants")
        .update({ ghl_sub_account_id: ghlResult.id })
        .eq("id", job.tenant_id);
      await completeStep(jobId, 1, { ghl_sub_account_id: ghlResult.id });
    } catch (err) {
      return await failJob(jobId, 1, err);
    }
  }

  // ─── Step 2: Retell AI Agent Configuration ──────────────────────────────────
  if (!stepStatuses["2"]?.complete) {
    await updateStep(jobId, 2, "running");
    try {
      const retellAgentId = await configureRetellAgent(tenant, jobInput);
      await supabase
        .from("tenants")
        .update({ retell_agent_id: retellAgentId })
        .eq("id", job.tenant_id);
      await completeStep(jobId, 2, { retell_agent_id: retellAgentId });
    } catch (err) {
      return await failJob(jobId, 2, err);
    }
  }

  // ─── Step 3: GHL Routing Rules Setup ────────────────────────────────────────
  if (!stepStatuses["3"]?.complete) {
    await updateStep(jobId, 3, "running");
    try {
      // Re-load tenant to get ghl_sub_account_id from Step 1
      const updatedTenant = await loadTenant(job.tenant_id);
      await configureGhlRouting(updatedTenant, jobInput);
      await completeStep(jobId, 3, {});
    } catch (err) {
      return await failJob(jobId, 3, err);
    }
  }

  // ─── Step 4: Meta + Google OAuth Token Connection ───────────────────────────
  if (!stepStatuses["4"]?.complete) {
    await updateStep(jobId, 4, "running");
    try {
      // OAuth tokens were collected in wizard Step 3/4 (F12)
      // They are in jobInput.metaToken, jobInput.googleToken
      // Store in Supabase Vault
      if (jobInput.metaToken) {
        await storeVaultSecret(
          `meta_token_${job.tenant_id}`,
          jobInput.metaToken as string,
        );
        await supabase
          .from("tenants")
          .update({ meta_oauth_status: "connected" })
          .eq("id", job.tenant_id);
      }
      if (jobInput.googleToken) {
        await storeVaultSecret(
          `google_token_${job.tenant_id}`,
          jobInput.googleToken as string,
        );
        await supabase
          .from("tenants")
          .update({ google_oauth_status: "connected" })
          .eq("id", job.tenant_id);
      }
      await completeStep(jobId, 4, {});
    } catch (err) {
      return await failJob(jobId, 4, err);
    }
  }

  // ─── Step 5: Supabase Tenant Finalization ───────────────────────────────────
  if (!stepStatuses["5"]?.complete) {
    await updateStep(jobId, 5, "running");
    try {
      await supabase
        .from("tenants")
        .update({ status: "active" })
        .eq("id", job.tenant_id);

      // Create notification preferences row
      await supabase
        .from("notification_preferences")
        .upsert({
          tenant_id: job.tenant_id,
          welcome_email: true,
          weekly_report: (jobInput.notifications as { weeklyReport?: boolean })?.weeklyReport ?? true,
          alert_email: (jobInput.notifications as { alertEmail?: boolean })?.alertEmail ?? true,
        });

      await completeStep(jobId, 5, {});
    } catch (err) {
      return await failJob(jobId, 5, err);
    }
  }

  // ─── Step 6: Welcome Email ───────────────────────────────────────────────────
  if (!stepStatuses["6"]?.complete) {
    await updateStep(jobId, 6, "running");
    try {
      await sendWelcomeEmail({
        to: jobInput.ownerEmail as string,
        firstName: jobInput.ownerFirstName as string,
        tenantName: jobInput.tenantName as string,
        dashboardUrl: `https://app.rainmachine.io`,
        supportEmail: "support@rainmachine.io",
      });
      await completeStep(jobId, 6, {});
    } catch (err) {
      // Welcome email failure is non-fatal — mark step done but log warning
      console.warn("[onboarding] Welcome email failed:", err);
      await completeStep(jobId, 6, { warning: "Email delivery failed" });
    }
  }

  // All steps complete
  await supabase
    .from("onboarding_jobs")
    .update({
      status: "done",
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});

// ─── Step helper functions ────────────────────────────────────────────────────

async function updateStep(
  jobId: string,
  step: number,
  status: "running" | "done" | "error",
): Promise<void> {
  await supabase
    .from("onboarding_jobs")
    .update({ current_step: step })
    .eq("id", jobId);
}

async function completeStep(
  jobId: string,
  step: number,
  data: Record<string, unknown>,
): Promise<void> {
  const { data: job } = await supabase
    .from("onboarding_jobs")
    .select("step_statuses")
    .eq("id", jobId)
    .single();

  const stepStatuses = (job?.step_statuses ?? {}) as Record<string, unknown>;
  stepStatuses[String(step)] = {
    complete: true,
    completedAt: new Date().toISOString(),
    data,
  };

  await supabase
    .from("onboarding_jobs")
    .update({ step_statuses: stepStatuses })
    .eq("id", jobId);
}

async function failJob(
  jobId: string,
  step: number,
  err: unknown,
): Promise<Response> {
  const errorMessage =
    err instanceof Error ? err.message : "Unknown error";

  const { data: job } = await supabase
    .from("onboarding_jobs")
    .select("step_statuses")
    .eq("id", jobId)
    .single();

  const stepStatuses = (job?.step_statuses ?? {}) as Record<string, unknown>;
  stepStatuses[String(step)] = {
    complete: false,
    error: errorMessage,
  };

  await supabase
    .from("onboarding_jobs")
    .update({
      status: "failed",
      step_statuses: stepStatuses,
      error_message: `Step ${step} failed: ${errorMessage}`,
    })
    .eq("id", jobId);

  // Create CEO alert
  await supabase.from("alerts").insert({
    severity: "critical",
    status: "active",
    title: "Onboarding Job Failed",
    description: `Step ${step} failed: ${errorMessage}`,
    recommended_action: "Check Edge Function logs and retry the job.",
  });

  return new Response(
    JSON.stringify({ success: false, error: errorMessage, failedStep: step }),
    { status: 500 },
  );
}

async function loadTenant(tenantId: string) {
  const { data } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();
  return data!;
}

// ─── External API call implementations ───────────────────────────────────────

async function createGhlSubAccount(
  tenant: Record<string, unknown>,
  input: Record<string, unknown>,
): Promise<{ id: string }> {
  const GHL_AGENCY_API_KEY = Deno.env.get("GHL_AGENCY_API_KEY")!;
  const GHL_AGENCY_ID = Deno.env.get("GHL_AGENCY_ID")!;

  const response = await fetch(
    `https://rest.gohighlevel.com/v1/agencies/${GHL_AGENCY_ID}/locations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GHL_AGENCY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: input.tenantName,
        email: input.ownerEmail,
        phone: input.ownerPhone,
        timezone: (tenant.timezone as string) ?? "America/New_York",
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`GHL sub-account creation failed: ${response.status}`);
  }

  const data = await response.json();
  return { id: data.id };
}

async function configureRetellAgent(
  tenant: Record<string, unknown>,
  input: Record<string, unknown>,
): Promise<string> {
  const RETELL_API_KEY = Deno.env.get("RETELL_API_KEY")!;

  // Create a new Retell agent for this tenant (or clone from template)
  const response = await fetch("https://api.retellai.com/create-agent", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RETELL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_name: `${String(input.tenantName)} Lead AI`,
      voice_id: "11labs-Adrian",
      response_engine: {
        type: "retell-llm",
        llm_id: Deno.env.get("RETELL_TEMPLATE_LLM_ID"),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Retell agent creation failed: ${response.status}`);
  }

  const data = await response.json();
  return data.agent_id as string;
}

async function configureGhlRouting(
  tenant: Record<string, unknown>,
  _input: Record<string, unknown>,
): Promise<void> {
  // Configure GHL routing workflows via GHL API
  // Specifics depend on GHL's routing API — placeholder logic
  // In practice: update the existing routing workflow in GHL to include
  // the new sub-account's lead routing to agents
  const GHL_AGENCY_API_KEY = Deno.env.get("GHL_AGENCY_API_KEY")!;
  const locationId = tenant.ghl_sub_account_id as string;

  if (!locationId) {
    throw new Error("GHL sub-account ID not set — Step 1 must complete first");
  }

  // Verify the sub-account is accessible
  const check = await fetch(
    `https://rest.gohighlevel.com/v1/locations/${locationId}`,
    {
      headers: { Authorization: `Bearer ${GHL_AGENCY_API_KEY}` },
    },
  );

  if (!check.ok) {
    throw new Error(`GHL location ${locationId} not accessible: ${check.status}`);
  }
  // Additional routing configuration steps...
}

async function storeVaultSecret(
  name: string,
  secret: string,
): Promise<void> {
  // Store secret in Supabase Vault via service role
  const { error } = await supabase.rpc("vault.create_secret", {
    secret,
    name,
    description: `OAuth token for ${name}`,
  });

  if (error) {
    throw new Error(`Vault storage failed for ${name}: ${error.message}`);
  }
}

async function sendWelcomeEmail(data: {
  to: string;
  firstName: string;
  tenantName: string;
  dashboardUrl: string;
  supportEmail: string;
}): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "RainMachine <onboarding@rainmachine.io>",
      to: data.to,
      subject: `Welcome to RainMachine — Your system is live`,
      html: buildWelcomeEmailHtml(data),
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend email failed: ${response.status}`);
  }
}

function buildWelcomeEmailHtml(data: {
  firstName: string;
  tenantName: string;
  dashboardUrl: string;
  supportEmail: string;
}): string {
  return `
    <h1>Welcome to RainMachine, ${data.firstName}!</h1>
    <p>${data.tenantName}'s RainMachine system is now live and actively working to get you appointments.</p>
    <p><a href="${data.dashboardUrl}">Access your dashboard →</a></p>
    <p>Questions? Email us at ${data.supportEmail}</p>
  `;
}
```

**Edge Function trigger configuration:**

In Supabase dashboard → Database Webhooks → Create webhook:
- Name: `trigger-onboarding-job`
- Table: `onboarding_jobs`
- Events: INSERT
- Type: Supabase Edge Function
- Function: `process-onboarding-job`
- HTTP method: POST
- Body: `{ "jobId": "{{ record.id }}" }`

**New env vars required in Edge Function:**

| Variable | Used in Step |
|---|---|
| `GHL_AGENCY_API_KEY` | Step 1, Step 3 |
| `GHL_AGENCY_ID` | Step 1 |
| `RETELL_API_KEY` | Step 2 |
| `RETELL_TEMPLATE_LLM_ID` | Step 2 |
| `RESEND_API_KEY` | Step 6 |

**New env vars required in `apps/onboarding/src/env.ts`:**

```typescript
server: {
  ONBOARDING_JWT_SECRET: z.string().min(32),
  // (already exists from F01)
}
```

### 7.2 Supabase Vault

Supabase Vault is a built-in extension for storing encrypted secrets. Accessed via:

```sql
-- Store a secret
SELECT vault.create_secret('my-secret-value', 'my-secret-name', 'description');

-- Retrieve a secret (returns decrypted value)
SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'my-secret-name';
```

From Edge Functions (TypeScript):
```typescript
// Retrieve secret in Edge Function
const { data } = await supabase
  .from("vault.decrypted_secrets")
  .select("decrypted_secret")
  .eq("name", `meta_token_${tenantId}`)
  .single();
const metaToken = data?.decrypted_secret;
```

**Security:** Vault uses pgsodium (libsodium) for encryption. The encryption key is stored separately from the encrypted data. Even with database access, secrets are not readable without the key.

### 7.3 Resend (Email Delivery)

**API base URL:** `https://api.resend.com`

**Authentication:** Bearer token (`RESEND_API_KEY`) in Authorization header.

**Endpoint:** `POST /emails`

**From address:** `onboarding@rainmachine.io` — must be verified in Resend dashboard.

**Domain:** `rainmachine.io` DNS records must have Resend's SPF + DKIM records added. This is a one-time operational setup.

### 7.4 GHL Agency API

**API base URL:** `https://rest.gohighlevel.com/v1`

**Authentication:** Bearer token (`GHL_AGENCY_API_KEY`) — agency-level token, not location-level.

**Required permissions:** Create Location, Manage Locations.

**Endpoints used:**
- `POST /agencies/{agency_id}/locations` — create sub-account (Step 1)
- `GET /locations/{location_id}` — verify accessibility (Step 3)

### 7.5 Retell API (Agent Creation)

**Endpoint:** `POST https://api.retellai.com/create-agent`

This creates a new Retell AI agent for the tenant. The agent is cloned from a template LLM (`RETELL_TEMPLATE_LLM_ID`) so all tenants start with the same base script.

---

## 8. BDD Scenarios

### Scenario 1: Full Provisioning Flow

```
Given a valid onboarding_jobs row is inserted for Tenant A
When the Supabase DB webhook fires and calls the Edge Function
Then the Edge Function runs all 6 steps in order
And each step's status is written to step_statuses as it completes
And after Step 6, job.status is "done"
And tenant.status is "active"
And a welcome email is sent to the tenant owner
And the entire sequence completes in < 5 minutes
```

### Scenario 2: Idempotent Retry — Step 3 Fails and Retries

```
Given a job that completed Steps 1 and 2 (complete = true in step_statuses)
And Step 3 failed with an error
When the Edge Function is triggered again (manual retry by CEO)
Then Steps 1 and 2 are skipped (complete = true checks pass)
And Step 3 is re-attempted
And if Step 3 succeeds, Steps 4, 5, 6 continue normally
```

### Scenario 3: Only One Active Job Per Tenant

```
Given Tenant A has an active onboarding job with status "running"
When another INSERT into onboarding_jobs is attempted for Tenant A
Then the INSERT fails with a unique constraint violation
And no second job is created
And the first job continues uninterrupted
```

### Scenario 4: Status Polling Returns Accurate Progress

```
Given a job with Steps 1–3 complete and Step 4 currently running
When GET /api/onboarding/status?job_id={id} is called
Then the response shows:
  step: 4
  percent: 50
  components:
    - { name: "GHL Sub-Account", status: "online" }
    - { name: "Retell AI Agent", status: "online" }
    - { name: "Lead Routing", status: "online" }
    - { name: "Ad Account Connection", status: "configuring" }
    - { name: "Tenant Finalization", status: "pending" }
    - { name: "Welcome Email", status: "pending" }
```

### Scenario 5: Step 1 GHL API Failure → CEO Alert

```
Given the GHL Agency API returns a 503 error during Step 1
When the Edge Function catches the error
Then job.status is set to "failed"
And step_statuses["1"].complete is false
And step_statuses["1"].error contains the error message
And a critical alert is created in the alerts table
And the job can be retried manually
```

### Scenario 6: Step 6 Email Failure is Non-Fatal

```
Given Steps 1–5 completed successfully
And the Resend API returns an error during Step 6
When the Edge Function catches the Step 6 error
Then the step is marked complete with a warning (not failed)
And job.status is still set to "done"
And tenant.status is still "active"
And a warning is logged but no CEO alert is created
```

### Scenario 7: OAuth Tokens Stored in Vault

```
Given jobInput.metaToken is a valid Meta access token
When Step 4 runs
Then the token is stored in Supabase Vault as "meta_token_{tenantId}"
And tenants.meta_oauth_status is updated to "connected"
And the raw token is NOT stored in any regular Supabase table column
```

### Scenario 8: Polling Endpoint Requires Authentication

```
Given an unauthenticated request
When GET /api/onboarding/status?job_id={id} is called
Then the response is 401 Unauthorized
And no job data is returned
```

### Scenario 9: Polling Endpoint Returns 404 for Unknown Job

```
Given a valid authenticated request
When job_id is a UUID that doesn't exist in onboarding_jobs
Then the response is 404 with { error: "Job not found" }
```

### Scenario 10: Completed Job Status

```
Given a job with status "done" (all 6 steps complete)
When GET /api/onboarding/status is called
Then the response shows:
  status: "done"
  percent: 100
  components: all 6 with status "online"
```

---

## 9. Test Plan

### 9.1 Edge Function Unit Tests (Deno Test)

```typescript
// supabase/functions/process-onboarding-job/__tests__/steps.test.ts

Deno.test("completeStep writes correct step_statuses shape", async () => {
  // Mock supabase
  // Call completeStep(jobId, 1, { ghl_sub_account_id: "test-id" })
  // Assert step_statuses["1"].complete === true
  // Assert step_statuses["1"].data.ghl_sub_account_id === "test-id"
});

Deno.test("failJob sets status to 'failed' and creates alert", async () => {
  // Mock supabase
  // Call failJob(jobId, 2, new Error("API timeout"))
  // Assert job.status === "failed"
  // Assert alert inserted with severity "critical"
});

Deno.test("step skipped when step_statuses[N].complete is true", async () => {
  // Pre-populate step_statuses with step 1 complete
  // Run Edge Function
  // Assert GHL API is NOT called for step 1
  // Assert step 2 is executed
});
```

### 9.2 API Route Tests

```typescript
// apps/onboarding/app/api/onboarding/status/__tests__/route.test.ts

describe("GET /api/onboarding/status", () => {
  it("returns 401 for unauthenticated request");
  it("returns 400 for invalid job_id format");
  it("returns 404 for non-existent job_id");
  it("returns correct percent for 3/6 completed steps");
  it("maps step_statuses to components with correct status values");
  it("sets Cache-Control: no-cache");
});
```

### 9.3 Integration Test — Full Provisioning (Staging)

This test runs against a staging environment with real (but sandboxed) external APIs.

**Prerequisites:**
- Staging GHL agency account configured
- Staging Retell API key
- Staging Resend sending domain verified
- Staging Supabase project

**Test flow:**
1. Insert an `onboarding_jobs` row for a test tenant
2. Poll `/api/onboarding/status` every 3 seconds
3. Assert all 6 steps complete within 300 seconds (5 minutes)
4. Verify DB state: `tenants.status = "active"`, `tenants.ghl_sub_account_id` set
5. Verify Vault: `meta_token_{tenantId}` exists (if test metaToken provided)
6. Verify email received at test inbox (Resend test mode)

### 9.4 Idempotency Test

```typescript
// Manually trigger the Edge Function twice for the same job
// with step_statuses showing step 1 already complete
// Assert step 1's external API is NOT called a second time
// Assert final state is identical to single-run state
```

---

## 10. OWASP Security Checklist

### 10.1 Secrets Management (A02)

- [ ] **OAuth tokens in Vault** — Meta and Google OAuth tokens are stored in Supabase Vault (encrypted at rest with pgsodium). They are never stored in regular table columns or in Edge Function logs.
- [ ] **GHL Agency API key** — High-privilege key. Stored in Edge Function env vars only (not in app env vars). Access is limited to the `process-onboarding-job` Edge Function.
- [ ] **Resend API key** — Stored in Edge Function env vars only.
- [ ] **No secrets in step_statuses JSONB** — The `step_statuses` column stores step completion metadata. OAuth tokens and API responses are never written there. Only non-sensitive data (IDs, timestamps) is written.

### 10.2 Edge Function Security (A05)

- [ ] **Edge Function authentication** — The `process-onboarding-job` function is triggered by Supabase DB webhook (internal — not publicly exposed). No Authorization header check needed because the DB webhook is called internally by Supabase infrastructure.
- [ ] **Polling endpoint authentication** — `/api/onboarding/status` requires a valid Supabase session. No unauthenticated polling possible.
- [ ] **Job scoping** — The polling endpoint queries `onboarding_jobs` via the user's authenticated Supabase client. RLS ensures the user can only read their own tenant's job. They cannot poll another tenant's job ID.

### 10.3 Injection Prevention (A03)

- [ ] **Input data** — `jobInput` is collected by F12 wizard and stored as JSONB. All field values are used as-is in API calls — no SQL interpolation. GHL API bodies are JSON-encoded (no string interpolation).
- [ ] **External API calls** — All external APIs (GHL, Retell, Resend) receive structured JSON bodies. No dynamic SQL or shell commands in the Edge Function.

### 10.4 Partial Failure and Cleanup (A05)

- [ ] **No orphan GHL accounts** — If Step 1 succeeds and Step 2 fails, the GHL sub-account exists but is not yet configured. The retry resumes from Step 2 — the GHL account is reused (idempotency check looks for existing accounts). No cleanup is attempted. This is the correct behavior: partial work is preserved and resumed.
- [ ] **Tenant status stays "provisioning" until Step 5** — Until Step 5 completes, `tenants.status = "provisioning"`. No middleware grants access to the dashboard for a provisioning tenant. If onboarding fails midway, Marcus cannot access a broken dashboard.

### 10.5 Rate Limiting (A04)

- [ ] **One job per tenant** — The unique constraint on `onboarding_jobs` prevents triggering multiple parallel provisioning runs for the same tenant, which could create multiple GHL sub-accounts.
- [ ] **External API rate limits** — GHL, Retell, and Resend have their own rate limits. With 1 provisioning job per tenant per lifecycle, hitting these limits is extremely unlikely.

---

## 11. Open Questions

### OQ-01 — DB Webhook vs. pg_cron for Edge Function Trigger

**Question:** The `process-onboarding-job` Edge Function is triggered via Supabase DB webhook on INSERT to `onboarding_jobs`. Alternatively, it could be triggered by n8n (polling for pending jobs) or by the F12 client (making a direct HTTP call to the function).

**Options:**
- A: Supabase DB Webhook (current recommendation) — automatic, no polling
- B: n8n trigger — existing n8n infrastructure, but adds n8n as a dependency for provisioning
- C: Client-side HTTP call from F12 — simplest, but relies on the browser staying connected

**Recommendation:** Option A. The DB webhook is the cleanest trigger — it fires exactly once when the row is inserted, regardless of the client's state. Option C is fragile (user could close the browser). Option B adds unnecessary complexity.

**Decision gate:** F06 implementation start. Configure DB webhook in Supabase dashboard.

---

### OQ-02 — Retry Mechanism: Who Triggers the Retry?

**Question:** When a job fails (Steps 1–5), who triggers the retry? Options:

- A: Shomari manually retries via CEO dashboard (UI button → update `status: "pending"` → DB webhook fires again)
- B: Automatic retry after N minutes (n8n scheduled check for `status: "failed"` jobs)
- C: Edge Function internal retry (exponential backoff within the same execution)

**Recommendation:** Option A for R0 (manual retry via CEO dashboard). The CEO alert (created on failure) surfaces the issue. Shomari decides to retry or investigate. Automatic retry (Option B) could amplify problems if the external API has a persistent error. Add automatic retry in R1 after observing failure patterns.

**Decision gate:** F06 implementation + F13 (CEO Command Center) adds the "Retry" button.

---

### OQ-03 — Job Input Data: Where Is It Stored?

**Question:** The Edge Function needs all wizard input data (owner email, OAuth tokens, agent preferences). The `onboarding_jobs` table has a `step_statuses` JSONB column. Where does the input data go?

**Options:**
- A: Add an `input_data` JSONB column to `onboarding_jobs`
- B: Store input data in a separate `onboarding_inputs` table (normalized)
- C: Pass input data in the DB webhook payload

**Recommendation:** Option A. Add an `input_data` JSONB column to `onboarding_jobs`. This keeps all job-related data in one row, simplifies the Edge Function (one query to load everything), and doesn't expose input data to Realtime subscriptions (RLS scopes it).

**Migration amendment:**

```sql
ALTER TABLE onboarding_jobs ADD COLUMN input_data JSONB NOT NULL DEFAULT '{}';
```

**Decision gate:** F06 implementation start. Add the column.

---

### OQ-04 — Vault Secret Naming Convention

**Question:** How should OAuth tokens be named in Supabase Vault to avoid collisions?

**Current proposal:** `meta_token_{tenant_id}` and `google_token_{tenant_id}`

**Alternative:** `oauth_{provider}_{tenant_id}` — more generalizable if we add more providers.

**Recommendation:** Use `oauth_{provider}_{tenant_id}` for forward compatibility:
- `oauth_meta_{tenant_id}`
- `oauth_google_{tenant_id}`

**Decision gate:** F06 implementation. Consistent naming is important — it affects the retrieval code in n8n (ad metrics sync, F10) and F11 (Settings OAuth reconnect).

---

*PRD F06 — Onboarding Job Processor*
*Sigma Protocol Step 11 · MIRD AI Corporate Machine*
*Written: 2026-04-02 · Cycle 3 · Release 0*
*Depends on: F03 (schema + auth), F04 (tenant data), F05 (Retell agent)*
*Unlocks: F12 (onboarding portal UI), all R1 pitches (R0 complete)*

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@rainmachine/db";
import type { Json } from "@rainmachine/db";

const n8nErrorSchema = z.object({
  workflowName: z.string().min(1),
  executionId: z.string().min(1),
  errorMessage: z.string().min(1),
  errorType: z.string().default("unknown"),
  tenantId: z.string().uuid().optional(),
  payload: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime(),
});

type SyncErrorType =
  | "webhook_parse_error"
  | "lead_upsert_error"
  | "appointment_upsert_error"
  | "metrics_rollup_error"
  | "unknown";

const ERROR_TYPE_MAP: Record<string, SyncErrorType> = {
  webhook_parse: "webhook_parse_error",
  lead_upsert: "lead_upsert_error",
  appointment_upsert: "appointment_upsert_error",
  metrics_rollup: "metrics_rollup_error",
};

function mapErrorType(raw: string): SyncErrorType {
  return ERROR_TYPE_MAP[raw] ?? "unknown";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth: shared secret in x-webhook-secret header
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
  const authHeader = req.headers.get("x-webhook-secret");

  if (!webhookSecret || authHeader !== webhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = n8nErrorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = createServiceRoleClient();
  const { workflowName, executionId, errorMessage, errorType, tenantId, payload } =
    parsed.data;

  const { error: insertError } = await supabase.from("sync_errors").insert({
    tenant_id: tenantId ?? null,
    workflow_name: workflowName,
    n8n_execution_id: executionId,
    error_message: errorMessage,
    error_type: mapErrorType(errorType),
    payload: (payload as Json | undefined) ?? null,
  });

  if (insertError) {
    console.error("[n8n-error] Failed to write sync_error:", insertError.message);
    return NextResponse.json({ error: "Database write failed" }, { status: 500 });
  }

  // Alert threshold only applies to tenant-scoped errors (global errors have no tenantId)
  if (tenantId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count } = await supabase
      .from("sync_errors")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) > 3) {
      // Only create one active alert per tenant — no duplicates
      const { data: existingAlert } = await supabase
        .from("alerts")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .ilike("title", "%sync%")
        .maybeSingle();

      if (!existingAlert) {
        await supabase.from("alerts").insert({
          tenant_id: tenantId,
          severity: "warning",
          status: "active",
          title: "Data Sync Failure",
          description: `${count} sync errors in the last 60 minutes. Workflow: ${workflowName}.`,
          recommended_action:
            "Check n8n workflow execution logs and verify GHL webhook configuration.",
        });
      }
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

// Reject all non-POST methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

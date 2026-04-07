/**
 * F04 — GHL Sync Integration Tests
 * Runs against a local Supabase instance (`supabase start`) with seed data.
 *
 * Required env vars:
 *   TEST_TENANT_ID    — UUID of the seeded test tenant
 *   N8N_WEBHOOK_SECRET — shared secret (≥16 chars)
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createServiceRoleClient } from "@rainmachine/db";

const DASHBOARD_URL = process.env.DASHBOARD_URL ?? "http://localhost:3000";
const TENANT_ID = process.env.TEST_TENANT_ID ?? "";
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? "";

function postError(body: Record<string, unknown>, secret = WEBHOOK_SECRET) {
  return fetch(`${DASHBOARD_URL}/api/webhooks/n8n-error`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": secret,
    },
    body: JSON.stringify(body),
  });
}

describe("F04 — n8n Error Webhook", () => {
  const supabase = createServiceRoleClient();

  // Clean up sync_errors and alerts for the test tenant before each test
  beforeEach(async () => {
    await supabase
      .from("sync_errors")
      .delete()
      .eq("tenant_id", TENANT_ID);
    await supabase
      .from("alerts")
      .delete()
      .eq("tenant_id", TENANT_ID)
      .ilike("title", "%sync%");
  });

  // Scenario 10: n8n Error Webhook Authentication
  it("returns 401 without x-webhook-secret header", async () => {
    const res = await fetch(`${DASHBOARD_URL}/api/webhooks/n8n-error`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 with incorrect secret", async () => {
    const res = await postError(
      {
        workflowName: "test",
        executionId: "x",
        errorMessage: "x",
        timestamp: new Date().toISOString(),
      },
      "wrong-secret-value",
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing required fields", async () => {
    const res = await postError({ workflowName: "test" });
    expect(res.status).toBe(400);
  });

  // Scenario 10 (valid): writes sync_error row
  it("POST writes a sync_error row on valid payload", async () => {
    const { count: before } = await supabase
      .from("sync_errors")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", TENANT_ID);

    const res = await postError({
      workflowName: "ghl-to-supabase-sync",
      executionId: "test-exec-001",
      errorMessage: "Contact upsert failed",
      errorType: "lead_upsert",
      tenantId: TENANT_ID,
      timestamp: new Date().toISOString(),
    });

    expect(res.status).toBe(200);
    const json = await res.json() as { success: boolean };
    expect(json.success).toBe(true);

    const { count: after } = await supabase
      .from("sync_errors")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", TENANT_ID);

    expect((after ?? 0)).toBe((before ?? 0) + 1);
  });

  // Scenario 5: Sync Error Alert Threshold
  it("creates an alert after 4 errors in 60 minutes", async () => {
    // Seed 3 existing sync_errors for this tenant
    for (let i = 0; i < 3; i++) {
      await supabase.from("sync_errors").insert({
        tenant_id: TENANT_ID,
        workflow_name: "ghl-to-supabase-sync",
        error_type: "lead_upsert_error" as const,
        error_message: `Seeded error ${i}`,
      });
    }

    // 4th error via the webhook triggers alert creation
    const res = await postError({
      workflowName: "ghl-to-supabase-sync",
      executionId: "test-exec-alert",
      errorMessage: "Triggering alert threshold",
      errorType: "lead_upsert",
      tenantId: TENANT_ID,
      timestamp: new Date().toISOString(),
    });

    expect(res.status).toBe(200);

    const { data: alerts } = await supabase
      .from("alerts")
      .select("id, title, severity")
      .eq("tenant_id", TENANT_ID)
      .eq("status", "active")
      .ilike("title", "%sync%");

    expect(alerts?.length).toBeGreaterThan(0);
    expect(alerts?.[0]?.severity).toBe("warning");
  });

  // Scenario 6: Alert not duplicated
  it("does NOT create a second alert when one already exists", async () => {
    // Seed an existing active sync alert
    await supabase.from("alerts").insert({
      tenant_id: TENANT_ID,
      severity: "warning",
      status: "active",
      title: "Data Sync Failure",
      description: "Pre-existing alert",
    });

    // Seed 3 errors then fire a 4th
    for (let i = 0; i < 3; i++) {
      await supabase.from("sync_errors").insert({
        tenant_id: TENANT_ID,
        workflow_name: "ghl-to-supabase-sync",
        error_type: "lead_upsert_error" as const,
        error_message: `Error ${i}`,
      });
    }

    await postError({
      workflowName: "ghl-to-supabase-sync",
      executionId: "test-exec-no-dup",
      errorMessage: "Should not create duplicate alert",
      errorType: "lead_upsert",
      tenantId: TENANT_ID,
      timestamp: new Date().toISOString(),
    });

    const { count } = await supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", TENANT_ID)
      .eq("status", "active")
      .ilike("title", "%sync%");

    expect(count).toBe(1);
  });
});

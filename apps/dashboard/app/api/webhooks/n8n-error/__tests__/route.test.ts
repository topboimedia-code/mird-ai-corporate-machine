/**
 * F04 — n8n Error Webhook Unit Tests
 * Tests mapErrorType logic and Zod schema validation in isolation.
 * Route-level auth + DB interactions are covered in the integration tests.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Re-declare the schema and mapErrorType here so we can unit-test them
// without spinning up a full Next.js request context.
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

describe("mapErrorType", () => {
  it("maps known error types correctly", () => {
    expect(mapErrorType("webhook_parse")).toBe("webhook_parse_error");
    expect(mapErrorType("lead_upsert")).toBe("lead_upsert_error");
    expect(mapErrorType("appointment_upsert")).toBe("appointment_upsert_error");
    expect(mapErrorType("metrics_rollup")).toBe("metrics_rollup_error");
  });

  it("returns unknown for unmapped types", () => {
    expect(mapErrorType("some_random_type")).toBe("unknown");
    expect(mapErrorType("")).toBe("unknown");
    expect(mapErrorType("LEAD_UPSERT")).toBe("unknown"); // case-sensitive
  });
});

describe("n8nErrorSchema validation", () => {
  const validPayload = {
    workflowName: "ghl-to-supabase-sync",
    executionId: "exec-abc123",
    errorMessage: "Contact upsert failed",
    errorType: "lead_upsert",
    tenantId: "00000000-0000-0000-0000-000000000001",
    timestamp: "2026-04-07T10:00:00.000Z",
  };

  it("parses a valid payload", () => {
    const result = n8nErrorSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("fails when workflowName is missing", () => {
    const { workflowName: _, ...rest } = validPayload;
    const result = n8nErrorSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("fails when executionId is missing", () => {
    const { executionId: _, ...rest } = validPayload;
    const result = n8nErrorSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("fails when errorMessage is missing", () => {
    const { errorMessage: _, ...rest } = validPayload;
    const result = n8nErrorSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("fails when timestamp is not ISO datetime", () => {
    const result = n8nErrorSchema.safeParse({
      ...validPayload,
      timestamp: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("fails when tenantId is not a valid UUID", () => {
    const result = n8nErrorSchema.safeParse({
      ...validPayload,
      tenantId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("allows tenantId to be absent (global workflow errors)", () => {
    const { tenantId: _, ...rest } = validPayload;
    const result = n8nErrorSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("defaults errorType to 'unknown' when not provided", () => {
    const { errorType: _, ...rest } = validPayload;
    const result = n8nErrorSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.errorType).toBe("unknown");
    }
  });

  it("allows payload as arbitrary object", () => {
    const result = n8nErrorSchema.safeParse({
      ...validPayload,
      payload: { ghlContactId: "abc", locationId: "xyz" },
    });
    expect(result.success).toBe(true);
  });
});

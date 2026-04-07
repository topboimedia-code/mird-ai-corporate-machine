import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@rainmachine/db";
import type { Metrics } from "@rainmachine/db";
import { SyncTestClient } from "./SyncTestClient";

/**
 * Sync Test Page — developer/staging tool (non-production only).
 * Proves Supabase Realtime works end-to-end before F07 ships the real dashboard.
 * Deleted when F07 ships.
 */
export default async function SyncTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const tenantId = (user.user_metadata as { tenant_id?: string }).tenant_id;

  if (!tenantId) {
    notFound();
  }

  const today = new Date().toISOString().split("T")[0] as string;

  // Type assertion needed: postgrest-js@2.101.1 inference breaks on dev-only pages
  // when noUncheckedIndexedAccess is active — safe because we know the schema.
  const { data: initialMetrics } = (await supabase
    .from("metrics")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("date", today)
    .maybeSingle()) as unknown as { data: Metrics | null; error: unknown };

  return (
    <div className="p-8">
      <h1 className="font-display text-cyan text-xl uppercase tracking-widest mb-6">
        Sync Test — Realtime Proof
      </h1>
      <SyncTestClient
        tenantId={tenantId}
        initialLeadsTotal={initialMetrics?.leads_total ?? 0}
        initialAppointmentsSet={initialMetrics?.appointments_set ?? 0}
      />
    </div>
  );
}

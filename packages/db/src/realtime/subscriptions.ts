/**
 * Realtime subscription helpers — F04 GHL ↔ Supabase Sync
 * Import createBrowserClient, then pass the instance here.
 */

import type { RealtimeChannel } from "@supabase/supabase-js";
import type { MetricsRealtimePayload, MetricsSubscription } from "./types";

// Structural type: only the channel methods used in subscribeToMetrics.
// Avoids fighting SupabaseClient generic constraints across versions.
type RealtimeCapableClient = {
  channel: (name: string) => RealtimeChannel;
  removeChannel: (channel: RealtimeChannel) => Promise<"error" | "ok" | "timed out">;
};

/**
 * Subscribe to live metrics updates for a single tenant.
 *
 * Channel name pattern: `metrics:{tenantId}` — one channel per tenant.
 * Supabase Realtime respects RLS, so tenants only see their own rows.
 *
 * @example
 * const client = createBrowserClient()
 * const { unsubscribe } = subscribeToMetrics(client, tenantId, (payload) => {
 *   setLeadsTotal(payload.new.leads_total)
 * })
 * // cleanup
 * return () => unsubscribe()
 */
export function subscribeToMetrics(
  client: RealtimeCapableClient,
  tenantId: string,
  onUpdate: (payload: MetricsRealtimePayload) => void,
): MetricsSubscription {
  const channel = client
    .channel(`metrics:${tenantId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "metrics",
        filter: `tenant_id=eq.${tenantId}`,
      },
      (payload) => onUpdate(payload as unknown as MetricsRealtimePayload),
    )
    .subscribe();

  return {
    channel,
    unsubscribe: () => {
      client.removeChannel(channel);
    },
  };
}

/**
 * Realtime subscription types — F04 GHL ↔ Supabase Sync
 * One channel per tenant: `metrics:{tenantId}`
 */

import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Metrics } from "../types/index";

export type MetricsRealtimePayload = {
  schema: "public";
  table: "metrics";
  commit_timestamp: string;
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Metrics;
  old: Partial<Metrics>;
};

export type MetricsSubscription = {
  channel: RealtimeChannel;
  unsubscribe: () => void;
};

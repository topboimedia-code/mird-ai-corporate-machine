/**
 * Sync result types — F04 GHL ↔ Supabase Sync
 */

export interface SyncResult {
  success: boolean;
  /** The Supabase lead UUID if the operation affected a lead */
  leadId?: string;
  /** The Supabase appointment UUID if the operation affected an appointment */
  appointmentId?: string;
  /** true = INSERT (new record), false = UPDATE (idempotent upsert) */
  isNew?: boolean;
  error?: string;
}

export interface MetricsRollupResult {
  success: boolean;
  tenantId: string;
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  leadsTotal: number;
  appointmentsSet: number;
  error?: string;
}

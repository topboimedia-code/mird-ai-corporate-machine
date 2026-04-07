/**
 * GHL webhook payload types — F04 GHL ↔ Supabase Sync
 * These model the payloads GHL pushes to n8n; n8n maps them before writing to Supabase.
 */

/**
 * GHL Contact webhook — fires on ContactCreate and ContactUpdate.
 * Field names are GHL's native format.
 */
export interface GhlContactWebhook {
  type: "ContactCreate" | "ContactUpdate" | "ContactDelete";
  /** GHL sub-account ID — maps to tenants.ghl_sub_account_id */
  locationId: string;
  contact: {
    /** Idempotency key — maps to leads.ghl_contact_id */
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    /** Required — leads without phone are skipped by n8n */
    phone?: string;
    tags?: string[];
    customFields?: Array<{
      id: string;
      value: string | null;
    }>;
    source?: string;
    createdAt?: string; // ISO 8601
    updatedAt?: string; // ISO 8601
  };
}

/**
 * GHL Appointment webhook — fires on AppointmentCreate and AppointmentUpdate.
 */
export interface GhlAppointmentWebhook {
  type: "AppointmentCreate" | "AppointmentUpdate" | "AppointmentDelete";
  /** GHL sub-account ID — maps to tenants.ghl_sub_account_id */
  locationId: string;
  appointment: {
    /** Idempotency key — maps to appointments.ghl_appointment_id */
    id: string;
    /** Maps to leads.ghl_contact_id → looked up to get lead_id */
    contactId: string;
    /** GHL user ID → maps to agents.ghl_user_id → looked up to get agent_id */
    userId?: string;
    title?: string;
    appointmentStatus?: "scheduled" | "confirmed" | "showed" | "noshow" | "cancelled";
    selectedTimezone?: string;
    startTime: string; // ISO 8601
    endTime?: string;  // ISO 8601
  };
}

/**
 * n8n error notification — sent by the n8n Error Workflow to /api/webhooks/n8n-error.
 */
export interface N8nErrorNotification {
  workflowName: string;
  executionId: string;
  errorMessage: string;
  errorType: string;
  tenantId?: string;
  payload?: Record<string, unknown>;
  timestamp: string; // ISO 8601
}

/**
 * GHL → Supabase source field mapping.
 * All unmapped values fall back to "other".
 */
export const GHL_SOURCE_MAP: Record<string, string> = {
  "Facebook Ad": "meta_ads",
  "Facebook Ads": "meta_ads",
  "Meta Ads": "meta_ads",
  "Google Ad": "google_ads",
  "Google Ads": "google_ads",
  "Referral": "referral",
  "Organic": "organic",
} as const;

/**
 * GHL appointment status → Supabase appointment_status mapping.
 */
export const GHL_APPT_STATUS_MAP: Record<
  NonNullable<GhlAppointmentWebhook["appointment"]["appointmentStatus"]>,
  "scheduled" | "confirmed" | "held" | "no_show" | "cancelled"
> = {
  scheduled: "scheduled",
  confirmed: "confirmed",
  showed: "held",
  noshow: "no_show",
  cancelled: "cancelled",
} as const;

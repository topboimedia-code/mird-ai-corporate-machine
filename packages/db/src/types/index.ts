import type { Database, Json } from "./database.types";

export type { Database, Json };

// Table row types
export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type TenantInsert = Database["public"]["Tables"]["tenants"]["Insert"];
export type TenantUpdate = Database["public"]["Tables"]["tenants"]["Update"];

export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type Agent = Database["public"]["Tables"]["agents"]["Row"];
export type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
export type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

export type Call = Database["public"]["Tables"]["calls"]["Row"];
export type CallInsert = Database["public"]["Tables"]["calls"]["Insert"];
export type CallUpdate = Database["public"]["Tables"]["calls"]["Update"];

export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type AppointmentInsert = Database["public"]["Tables"]["appointments"]["Insert"];

export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"];

export type AdMetrics = Database["public"]["Tables"]["ad_metrics"]["Row"];
export type AdMetricsInsert = Database["public"]["Tables"]["ad_metrics"]["Insert"];

export type Metrics = Database["public"]["Tables"]["metrics"]["Row"];
export type MetricsInsert = Database["public"]["Tables"]["metrics"]["Insert"];

export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];

export type AgentLog = Database["public"]["Tables"]["agent_logs"]["Row"];
export type AgentLogInsert = Database["public"]["Tables"]["agent_logs"]["Insert"];

export type Alert = Database["public"]["Tables"]["alerts"]["Row"];
export type AlertInsert = Database["public"]["Tables"]["alerts"]["Insert"];
export type AlertUpdate = Database["public"]["Tables"]["alerts"]["Update"];

export type SyncError = Database["public"]["Tables"]["sync_errors"]["Row"];
export type SyncErrorInsert = Database["public"]["Tables"]["sync_errors"]["Insert"];

export type CampaignSyncLog = Database["public"]["Tables"]["campaign_sync_log"]["Row"];
export type CampaignSyncLogInsert = Database["public"]["Tables"]["campaign_sync_log"]["Insert"];

// Enum types
export type TenantStatus = Database["public"]["Enums"]["tenant_status"];
export type UserRole = Database["public"]["Enums"]["user_role"];
export type LeadStage = Database["public"]["Enums"]["lead_stage"];
export type LeadSource = Database["public"]["Enums"]["lead_source"];
export type CallStatus = Database["public"]["Enums"]["call_status"];
export type CallOutcome = Database["public"]["Enums"]["call_outcome"];
export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];
export type CampaignPlatform = Database["public"]["Enums"]["campaign_platform"];
export type CampaignStatus = Database["public"]["Enums"]["campaign_status"];
export type OAuthStatus = Database["public"]["Enums"]["oauth_status"];
export type AlertSeverity = Database["public"]["Enums"]["alert_severity"];
export type AlertStatus = Database["public"]["Enums"]["alert_status"];
export type SyncErrorType = Database["public"]["Enums"]["sync_error_type"];

// Result type
export type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export const ok = <T>(data: T): Result<T, never> => ({ ok: true, data });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

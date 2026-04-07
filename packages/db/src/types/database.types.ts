export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: "provisioning" | "active" | "paused" | "churned";
          ghl_sub_account_id: string | null;
          plan: string;
          ai_enabled: boolean;
          cpl_threshold: number | null;
          close_rate_floor: number | null;
          meta_oauth_status: "connected" | "revoked" | "expired" | "never_connected";
          google_oauth_status: "connected" | "revoked" | "expired" | "never_connected";
          retell_agent_id: string | null;
          timezone: string;
          stage_tag_mapping: Record<string, string>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: "provisioning" | "active" | "paused" | "churned";
          ghl_sub_account_id?: string | null;
          plan?: string;
          ai_enabled?: boolean;
          cpl_threshold?: number | null;
          close_rate_floor?: number | null;
          meta_oauth_status?: "connected" | "revoked" | "expired" | "never_connected";
          google_oauth_status?: "connected" | "revoked" | "expired" | "never_connected";
          retell_agent_id?: string | null;
          timezone?: string;
          stage_tag_mapping?: Record<string, string>;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          tenant_id: string | null;
          role: "owner" | "agent" | "ceo";
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          tenant_id?: string | null;
          role?: "owner" | "agent" | "ceo";
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      agents: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          role_label: string | null;
          status: string;
          ghl_user_id: string | null;
          close_rate: number | null;
          leads_assigned: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id?: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          role_label?: string | null;
          status?: string;
          ghl_user_id?: string | null;
          close_rate?: number | null;
          leads_assigned?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["agents"]["Insert"]>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          tenant_id: string;
          assigned_agent_id: string | null;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string;
          stage: "new" | "contacted" | "qualified" | "appointment_set" | "appointment_held" | "under_contract" | "closed_won" | "closed_lost" | "archived";
          source: "meta_ads" | "google_ads" | "referral" | "organic" | "manual" | "other";
          ghl_contact_id: string | null;
          ai_call_status: "initiated" | "ringing" | "in_progress" | "completed" | "failed" | "no_answer" | "voicemail" | null;
          last_activity_at: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          assigned_agent_id?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone: string;
          stage?: "new" | "contacted" | "qualified" | "appointment_set" | "appointment_held" | "under_contract" | "closed_won" | "closed_lost" | "archived";
          source?: "meta_ads" | "google_ads" | "referral" | "organic" | "manual" | "other";
          ghl_contact_id?: string | null;
          ai_call_status?: "initiated" | "ringing" | "in_progress" | "completed" | "failed" | "no_answer" | "voicemail" | null;
          last_activity_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
      calls: {
        Row: {
          id: string;
          tenant_id: string;
          lead_id: string;
          retell_call_id: string | null;
          status: "initiated" | "ringing" | "in_progress" | "completed" | "failed" | "no_answer" | "voicemail";
          outcome: "appointment_set" | "callback_requested" | "not_interested" | "wrong_number" | "voicemail" | "no_answer" | "other" | null;
          duration_s: number | null;
          transcript: string | null;
          recording_url: string | null;
          initiated_at: string;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          lead_id: string;
          retell_call_id?: string | null;
          status?: "initiated" | "ringing" | "in_progress" | "completed" | "failed" | "no_answer" | "voicemail";
          outcome?: "appointment_set" | "callback_requested" | "not_interested" | "wrong_number" | "voicemail" | "no_answer" | "other" | null;
          duration_s?: number | null;
          transcript?: string | null;
          recording_url?: string | null;
          initiated_at?: string;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["calls"]["Insert"]>;
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          tenant_id: string;
          lead_id: string;
          agent_id: string | null;
          status: "scheduled" | "confirmed" | "held" | "no_show" | "cancelled" | "rescheduled";
          scheduled_at: string;
          held_at: string | null;
          cancelled_at: string | null;
          ghl_appointment_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          lead_id: string;
          agent_id?: string | null;
          status?: "scheduled" | "confirmed" | "held" | "no_show" | "cancelled" | "rescheduled";
          scheduled_at: string;
          held_at?: string | null;
          cancelled_at?: string | null;
          ghl_appointment_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          tenant_id: string;
          platform: "meta" | "google";
          platform_campaign_id: string;
          name: string;
          status: "active" | "paused" | "archived" | "error";
          oauth_status: "connected" | "revoked" | "expired" | "never_connected";
          daily_budget_cents: number | null;
          bid_strategy: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          platform: "meta" | "google";
          platform_campaign_id: string;
          name: string;
          status?: "active" | "paused" | "archived" | "error";
          oauth_status?: "connected" | "revoked" | "expired" | "never_connected";
          daily_budget_cents?: number | null;
          bid_strategy?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
        Relationships: [];
      };
      ad_metrics: {
        Row: {
          id: string;
          tenant_id: string;
          campaign_id: string;
          date: string;
          spend_cents: number;
          impressions: number;
          clicks: number;
          leads: number;
          cpl_cents: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          campaign_id: string;
          date: string;
          spend_cents?: number;
          impressions?: number;
          clicks?: number;
          leads?: number;
          cpl_cents?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ad_metrics"]["Insert"]>;
        Relationships: [];
      };
      metrics: {
        Row: {
          id: string;
          tenant_id: string;
          date: string;
          leads_total: number;
          leads_new: number;
          appointments_set: number;
          appointments_held: number;
          close_rate: number | null;
          mrr: number | null;
          calls_total: number;
          calls_connected: number;
          avg_cpl_cents: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          date: string;
          leads_total?: number;
          leads_new?: number;
          appointments_set?: number;
          appointments_held?: number;
          close_rate?: number | null;
          mrr?: number | null;
          calls_total?: number;
          calls_connected?: number;
          avg_cpl_cents?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["metrics"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          tenant_id: string;
          week_start: string;
          content: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          week_start: string;
          content: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
      agent_logs: {
        Row: {
          id: string;
          department: "growth" | "ad_ops" | "product" | "finance";
          run_at: string;
          status: "success" | "schema_error" | "api_error" | "partial";
          summary: string | null;
          entries: Json;
          tokens_in: number | null;
          tokens_out: number | null;
          cost_usd: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          department: "growth" | "ad_ops" | "product" | "finance";
          run_at?: string;
          status: "success" | "schema_error" | "api_error" | "partial";
          summary?: string | null;
          entries?: Json;
          tokens_in?: number | null;
          tokens_out?: number | null;
          cost_usd?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["agent_logs"]["Insert"]>;
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          tenant_id: string | null;
          severity: "info" | "warning" | "critical";
          status: "active" | "dismissed" | "snoozed";
          title: string;
          description: string | null;
          recommended_action: string | null;
          snoozed_until: string | null;
          dismissed_at: string | null;
          dismissed_by: string | null;
          dismissed_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          severity?: "info" | "warning" | "critical";
          status?: "active" | "dismissed" | "snoozed";
          title: string;
          description?: string | null;
          recommended_action?: string | null;
          snoozed_until?: string | null;
          dismissed_at?: string | null;
          dismissed_by?: string | null;
          dismissed_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["alerts"]["Insert"]>;
        Relationships: [];
      };
      sync_errors: {
        Row: {
          id: string;
          tenant_id: string | null;
          error_type: "webhook_parse_error" | "lead_upsert_error" | "appointment_upsert_error" | "metrics_rollup_error" | "unknown";
          workflow_name: string;
          payload: Json | null;
          error_message: string;
          n8n_execution_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          error_type?: "webhook_parse_error" | "lead_upsert_error" | "appointment_upsert_error" | "metrics_rollup_error" | "unknown";
          workflow_name: string;
          payload?: Json | null;
          error_message: string;
          n8n_execution_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sync_errors"]["Insert"]>;
        Relationships: [];
      };
      campaign_sync_log: {
        Row: {
          id: string;
          tenant_id: string;
          triggered_by: "scheduled" | "manual";
          status: "running" | "success" | "error";
          started_at: string;
          completed_at: string | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          triggered_by: "scheduled" | "manual";
          status: "running" | "success" | "error";
          started_at?: string;
          completed_at?: string | null;
          error_message?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["campaign_sync_log"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      tenant_status: "provisioning" | "active" | "paused" | "churned";
      user_role: "owner" | "agent" | "ceo";
      lead_stage: "new" | "contacted" | "qualified" | "appointment_set" | "appointment_held" | "under_contract" | "closed_won" | "closed_lost" | "archived";
      lead_source: "meta_ads" | "google_ads" | "referral" | "organic" | "manual" | "other";
      call_status: "initiated" | "ringing" | "in_progress" | "completed" | "failed" | "no_answer" | "voicemail";
      call_outcome: "appointment_set" | "callback_requested" | "not_interested" | "wrong_number" | "voicemail" | "no_answer" | "other";
      appointment_status: "scheduled" | "confirmed" | "held" | "no_show" | "cancelled" | "rescheduled";
      campaign_platform: "meta" | "google";
      campaign_status: "active" | "paused" | "archived" | "error";
      oauth_status: "connected" | "revoked" | "expired" | "never_connected";
      alert_severity: "info" | "warning" | "critical";
      alert_status: "active" | "dismissed" | "snoozed";
      sync_error_type: "webhook_parse_error" | "lead_upsert_error" | "appointment_upsert_error" | "metrics_rollup_error" | "unknown";
    };
    CompositeTypes: Record<string, never>;
  };
}

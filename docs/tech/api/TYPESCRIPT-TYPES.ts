/**
 * MIRD AI Corporate Machine — Shared TypeScript Types
 * packages/types/src/index.ts
 * Step 8: Technical Specification | Date: 2026-03-31
 *
 * Source of truth for all domain types used across:
 *   - apps/dashboard (RainMachine)
 *   - apps/ceo-dashboard (CEO Dashboard)
 *   - apps/onboarding (Onboarding Portal)
 *   - packages/ai-agents (Claude Department Agents)
 *   - supabase/functions/* (Edge Functions)
 */

// =============================================================================
// RESULT PATTERN (Railway-Oriented Programming)
// All server actions return Result<T, E> — never throw
// =============================================================================

export type Result<T, E = AppError> =
  | { ok: true;  data: T }
  | { ok: false; error: E }

export const Result = {
  ok:  <T>(data: T): Result<T, never>       => ({ ok: true,  data }),
  err: <E>(error: E): Result<never, E>      => ({ ok: false, error }),
}

// Usage in server actions:
//   const result = await loginAction(email, password)
//   if (!result.ok) return result.error  ← type-narrowed to E
//   const session = result.data           ← type-narrowed to T

// =============================================================================
// BRANDED PRIMITIVE TYPES
// Prevent accidental UUID cross-contamination between domains
// =============================================================================

declare const __brand: unique symbol
type Brand<T, B> = T & { [__brand]: B }

export type OrganizationId   = Brand<string, 'OrganizationId'>
export type UserId           = Brand<string, 'UserId'>
export type AgentId          = Brand<string, 'AgentId'>
export type LeadId           = Brand<string, 'LeadId'>
export type CampaignId       = Brand<string, 'CampaignId'>
export type AdAccountId      = Brand<string, 'AdAccountId'>
export type AppointmentId    = Brand<string, 'AppointmentId'>
export type AiCallId         = Brand<string, 'AiCallId'>
export type ReportId         = Brand<string, 'ReportId'>
export type OnboardingToken  = Brand<string, 'OnboardingToken'>

// Cast helpers — use only at trust boundaries (DB reads, webhook inputs)
export const asOrganizationId  = (s: string) => s as OrganizationId
export const asLeadId          = (s: string) => s as LeadId
export const asAgentId         = (s: string) => s as AgentId
export const asCampaignId      = (s: string) => s as CampaignId
export const asOnboardingToken = (s: string) => s as OnboardingToken

// =============================================================================
// ERROR TYPES
// =============================================================================

export type AppErrorCode =
  // Auth
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'MFA_REQUIRED'
  | 'INVALID_OTP'
  | 'OTP_EXPIRED'
  | 'ACCESS_RESTRICTED'
  // Validation
  | 'VALIDATION_ERROR'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  // Network / External
  | 'GHL_API_ERROR'
  | 'META_API_ERROR'
  | 'GOOGLE_API_ERROR'
  | 'RETELL_API_ERROR'
  | 'CLAUDE_API_ERROR'
  // Data
  | 'NOT_FOUND'
  | 'DUPLICATE'
  | 'CONSTRAINT_VIOLATION'
  // System
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'PROVISIONING_FAILED'

export interface AppError {
  code:    AppErrorCode
  message: string             // Human-readable (for developer/logs)
  field?:  string             // Which input field caused the error (for inline validation)
  details?: Record<string, unknown>
}

// =============================================================================
// ENUMS (match database CHECK constraints exactly)
// =============================================================================

export const OrgPlan     = ['starter', 'growth', 'grand_slam']       as const
export const OrgStatus   = ['onboarding', 'active', 'paused', 'churned'] as const
export const UserRole    = ['owner', 'manager', 'agent', 'mird_admin'] as const
export const LeadStage   = ['NEW', 'CONTACTED', 'APPT_SET', 'CLOSED', 'LOST'] as const
export const LeadPlatform = ['META', 'GOOGLE', 'ORGANIC', 'REFERRAL'] as const
export const AdPlatform  = ['META', 'GOOGLE'] as const
export const AgentStatus = ['active', 'inactive', 'on_leave']         as const
export const CallType    = ['RETELL_NEW_LEAD', 'RETELL_COLD_OUTBOUND', 'RETELL_DBR',
                            'GHL_WARM', 'GHL_CONFIRMATION', 'GHL_INBOUND'] as const
export const CallStatus  = ['INITIATED', 'IN_PROGRESS', 'COMPLETED',
                            'FAILED', 'NO_ANSWER', 'VOICEMAIL', 'BUSY'] as const
export const Disposition = ['INTERESTED', 'NOT_INTERESTED', 'CALL_BACK',
                            'APPT_SET', 'WRONG_NUMBER', 'DNC', 'VOICEMAIL_LEFT'] as const
export const ApptStatus  = ['BOOKED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'] as const
export const CampaignStatus = ['ACTIVE', 'PAUSED', 'DELETED', 'ENDED', 'ERROR'] as const
export const ReportType  = ['DEPT_1_GROWTH', 'DEPT_2_AD_OPS', 'DEPT_3_PRODUCT',
                            'DEPT_4_FINANCE', 'WEEKLY_SUMMARY', 'CLIENT_HEALTH'] as const
export const AgentName   = ['DEPT_1_GROWTH', 'DEPT_2_AD_OPS',
                            'DEPT_3_PRODUCT', 'DEPT_4_FINANCE'] as const

export type OrgPlan       = typeof OrgPlan[number]
export type OrgStatus     = typeof OrgStatus[number]
export type UserRole      = typeof UserRole[number]
export type LeadStage     = typeof LeadStage[number]
export type LeadPlatform  = typeof LeadPlatform[number]
export type AdPlatform    = typeof AdPlatform[number]
export type AgentStatus   = typeof AgentStatus[number]
export type CallType      = typeof CallType[number]
export type CallStatus    = typeof CallStatus[number]
export type Disposition   = typeof Disposition[number]
export type ApptStatus    = typeof ApptStatus[number]
export type CampaignStatus = typeof CampaignStatus[number]
export type ReportType    = typeof ReportType[number]
export type AgentName     = typeof AgentName[number]

// =============================================================================
// DOMAIN TYPES
// =============================================================================

// --- Organization ---

export interface Organization {
  id:               OrganizationId
  name:             string
  slug:             string
  ownerUserId:      UserId | null
  plan:             OrgPlan
  status:           OrgStatus
  ghlSubAccountId:  string | null
  ghlLocationId:    string | null
  timezone:         string
  industry:         string | null
  createdAt:        string    // ISO 8601
  updatedAt:        string
}

export interface OrganizationSummary {
  id:     OrganizationId
  name:   string
  plan:   OrgPlan
  status: OrgStatus
}

// --- User ---

export interface UserNotificationPrefs {
  email:          boolean
  sms:            boolean
  leadAssigned:   boolean
  apptBooked:     boolean
  campaignAlert:  boolean
}

export interface User {
  id:                 UserId
  organizationId:     OrganizationId
  role:               UserRole
  fullName:           string
  email:              string
  phone:              string | null
  avatarUrl:          string | null
  isActive:           boolean
  lastActiveAt:       string | null
  notificationPrefs:  UserNotificationPrefs
  createdAt:          string
}

// --- Agent (Sales Rep) ---

export interface Agent {
  id:               AgentId
  organizationId:   OrganizationId
  userId:           UserId | null
  fullName:         string
  email:            string | null
  phone:            string | null
  avatarUrl:        string | null
  status:           AgentStatus
  maxLeadsPerDay:   number
  routingWeight:    number
  routingEnabled:   boolean
  // Denormalized stats
  leadsTotal:       number
  leadsThisMonth:   number
  apptsThisMonth:   number
  closeRate:        number | null
  createdAt:        string
}

// --- Lead ---

export interface Lead {
  id:                 LeadId
  organizationId:     OrganizationId
  ghlContactId:       string
  assignedAgentId:    AgentId | null
  sourceCampaignId:   CampaignId | null
  fullName:           string
  email:              string | null
  phone:              string
  address:            string | null
  city:               string | null
  state:              string | null
  stage:              LeadStage
  platform:           LeadPlatform
  leadScore:          number | null
  propertyType:       string | null
  budgetMin:          number | null
  budgetMax:          number | null
  timeline:           string | null
  preApproved:        boolean | null
  notes:              string | null
  tags:               string[]
  totalCalls:         number
  totalAppointments:  number
  daysInPipeline:     number
  lastGhlSyncAt:      string | null
  createdAt:          string
  updatedAt:          string
}

export interface LeadDetail extends Lead {
  assignedAgent:  Agent | null
  appointments:   Appointment[]
  calls:          AiCall[]
  campaign:       CampaignSummary | null
}

export interface LeadFilter {
  stage?:       LeadStage
  agentId?:     AgentId
  platform?:    LeadPlatform
  search?:      string          // Full-text search (name, email, phone)
  dateFrom?:    string          // ISO date
  dateTo?:      string
  sortBy?:      'createdAt' | 'updatedAt' | 'stage' | 'leadScore'
  sortDir?:     'asc' | 'desc'
}

export interface PaginatedLeads {
  leads:    Lead[]
  total:    number
  page:     number
  pageSize: number
  hasMore:  boolean
}

// --- Appointment ---

export interface Appointment {
  id:                 AppointmentId
  organizationId:     OrganizationId
  leadId:             LeadId
  agentId:            AgentId | null
  ghlAppointmentId:   string | null
  status:             ApptStatus
  scheduledAt:        string      // ISO 8601
  durationMinutes:    number
  meetingType:        'in_person' | 'phone' | 'video' | null
  location:           string | null
  notes:              string | null
  confirmedAt:        string | null
  completedAt:        string | null
  cancelledAt:        string | null
  cancellationReason: string | null
  createdAt:          string
}

// --- AI Call ---

export interface AiCall {
  id:               AiCallId
  organizationId:   OrganizationId
  leadId:           LeadId
  callType:         CallType
  retellCallId:     string | null
  ghlCallId:        string | null
  status:           CallStatus
  disposition:      Disposition | null
  durationSeconds:  number | null
  recordingUrl:     string | null
  transcript:       string | null
  summary:          string | null
  sentiment:        'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | null
  initiatedAt:      string
  connectedAt:      string | null
  endedAt:          string | null
  createdAt:        string
}

// --- Ad Account ---

export interface AdAccount {
  id:                 AdAccountId
  organizationId:     OrganizationId
  platform:           AdPlatform
  platformAccountId:  string
  accountName:        string | null
  currency:           string
  gmbAccountId:       string | null
  gmbLocationId:      string | null
  gmbLocationName:    string | null
  isConnected:        boolean
  connectedAt:        string | null
  lastSyncedAt:       string | null
  syncError:          string | null
  createdAt:          string
  // NOTE: access_token_ref / refresh_token_ref are NEVER included in client types
}

// --- Campaign ---

export interface Campaign {
  id:                 CampaignId
  organizationId:     OrganizationId
  adAccountId:        AdAccountId
  platform:           AdPlatform
  platformCampaignId: string
  name:               string
  status:             CampaignStatus
  objective:          string | null
  budgetDaily:        number | null
  budgetLifetime:     number | null
  spendTotal:         number
  spendThisMonth:     number
  impressions:        number
  clicks:             number
  leadsCount:         number
  cpl:                number | null
  ctr:                number | null
  conversionRate:     number | null
  startedAt:          string | null
  endedAt:            string | null
  lastSyncedAt:       string | null
  createdAt:          string
}

export interface CampaignSummary {
  id:       CampaignId
  name:     string
  platform: AdPlatform
  status:   CampaignStatus
  cpl:      number | null
}

// --- Report ---

export interface ReportAlert {
  severity:   'CRITICAL' | 'WARNING' | 'INFO'
  message:    string
  actionUrl?: string
}

export interface ReportRecommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  title:    string
  body:     string
}

export interface ReportActionItem {
  owner:   string
  task:    string
  dueDate: string | null
}

export interface Report {
  id:               ReportId
  organizationId:   OrganizationId | null
  reportType:       ReportType
  title:            string
  summary:          string | null
  content:          Record<string, unknown>
  alerts:           ReportAlert[]
  recommendations:  ReportRecommendation[]
  actionItems:      ReportActionItem[]
  modelUsed:        string
  tokensInput:      number | null
  tokensOutput:     number | null
  costUsd:          number | null
  generationTimeMs: number | null
  generatedAt:      string
  readAt:           string | null
  createdAt:        string
}

// --- Onboarding Session ---

export interface OnboardingStep1Data {
  fullName:     string
  company:      string
  phone:        string
  industry:     'real_estate' | 'insurance'
  teamSize:     number
}

export interface OnboardingStep2Data {
  targetMarket:   string
  geoTargets:     string[]
  monthlyBudget:  number
  primaryGoal:    string
  timeline:       string
}

export interface OnboardingStep3Data {
  adAccountId:   string
  accountName:   string
  // token stored in Vault — never in this type
}

export interface OnboardingStep4Data {
  customerId:       string
  gmbLocationId:    string | null
  gmbLocationName:  string | null
  accountName:      string
}

export interface OnboardingStep5Data {
  launchDate:      string   // ISO date
  notifyEmail:     boolean
  notifySms:       boolean
  uploadedAssets:  string[] // Storage URLs
}

export interface OnboardingSession {
  id:                       string
  organizationId:           OrganizationId | null
  token:                    OnboardingToken
  clientEmail:              string
  clientName:               string
  clientCompany:            string | null
  status:                   'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'EXPIRED' | 'FAILED'
  currentStep:              1 | 2 | 3 | 4 | 5
  step1Data:                OnboardingStep1Data | null
  step2Data:                OnboardingStep2Data | null
  step3Data:                OnboardingStep3Data | null
  step4Data:                OnboardingStep4Data | null
  step5Data:                OnboardingStep5Data | null
  metaVerified:             boolean
  googleVerified:           boolean
  provisioningStartedAt:    string | null
  provisioningCompletedAt:  string | null
  provisioningError:        string | null
  expiresAt:                string
  completedAt:              string | null
  createdAt:                string
}

// =============================================================================
// CEO DASHBOARD SPECIFIC TYPES
// =============================================================================

export interface ClientHealthScore {
  organizationId:   OrganizationId
  orgName:          string
  plan:             OrgPlan
  healthScore:      number          // 0–100
  healthLevel:      'high' | 'medium' | 'low'
  mrr:              number
  leadsThisMonth:   number
  cplAvg:           number | null
  activeAlerts:     number
  lastActivityAt:   string | null
}

export interface CommandCenterData {
  totalMrr:         number
  activeClients:    number
  totalLeadsToday:  number
  avgCpl:           number | null
  alerts:           CommandAlert[]
  clientHealth:     ClientHealthScore[]
  northStarTrend:   NorthStarDataPoint[]
}

export interface CommandAlert {
  id:             string
  orgId:          OrganizationId
  orgName:        string
  severity:       'CRITICAL' | 'WARNING'
  category:       'CPL' | 'MRR' | 'LEAD_VOLUME' | 'INTEGRATION' | 'AGENT'
  message:        string
  triggeredAt:    string
  dismissedAt:    string | null
}

export interface NorthStarDataPoint {
  date:    string     // ISO date
  mrr:     number
  leads:   number
  clients: number
}

export interface DeptDrilldownData {
  dept:           AgentName
  lastRunAt:      string | null
  lastStatus:     'SUCCESS' | 'FAILED' | 'PARTIAL' | null
  latestReport:   Report | null
  metrics:        Record<string, number | string>
  alerts:         ReportAlert[]
  actionItems:    ReportActionItem[]
}

// =============================================================================
// SERVER ACTION INPUT/OUTPUT TYPES
// =============================================================================

// --- Auth ---

export interface LoginInput {
  email:    string
  password: string
}

export interface LoginOutput {
  userId:         UserId
  organizationId: OrganizationId
  role:           UserRole
  requiresMFA?:   boolean          // CEO dashboard only
}

export interface MFAVerifyInput {
  factorId: string
  otp:      string
}

// --- Lead Actions ---

export interface UpdateLeadStageInput {
  leadId: LeadId
  stage:  LeadStage
}

export interface AssignLeadInput {
  leadId:  LeadId
  agentId: AgentId | null          // null = unassign
}

// --- Agent Actions ---

export interface CreateAgentInput {
  fullName:       string
  email?:         string
  phone?:         string
  maxLeadsPerDay: number
  routingWeight:  number
}

export interface UpdateAgentInput extends Partial<CreateAgentInput> {
  agentId:       AgentId
  status?:       AgentStatus
  routingEnabled?: boolean
}

// --- Onboarding Actions ---

export interface ValidateTokenOutput {
  session:     OnboardingSession
  resumeStep:  1 | 2 | 3 | 4 | 5
}

export interface VerifyMetaTokenInput {
  sessionId:   string
  accessToken: string              // Meta System User token
}

export interface VerifyMetaTokenOutput {
  adAccounts: Array<{ id: string; name: string; currency: string }>
}

export interface GoogleSearchGMBInput {
  sessionId:  string
  customerId: string
  query:      string
}

export interface GMBLocation {
  locationId:   string
  locationName: string
  address:      string
}

// --- CEO Actions ---

export interface DismissAlertInput {
  alertId: string
}

export interface GetClientDetailInput {
  orgId: OrganizationId
  tab?:  'overview' | 'campaigns' | 'leads' | 'timeline' | 'financials'
}

// =============================================================================
// WEBHOOK PAYLOAD TYPES (Supabase Edge Functions)
// =============================================================================

// GHL Webhook (contact.created, pipeline_stage.updated)
export interface GHLContactCreatedPayload {
  type:       'contact.created'
  locationId: string
  contact: {
    id:        string
    firstName: string
    lastName:  string
    email:     string
    phone:     string
    source:    string
    tags:      string[]
    customFields: Array<{ id: string; value: string }>
  }
}

export interface GHLPipelineStageUpdatedPayload {
  type:        'pipeline_stage.updated'
  locationId:  string
  contactId:   string
  pipelineId:  string
  stageId:     string
  stageName:   string
  previousStageId:   string
  previousStageName: string
}

export type GHLWebhookPayload =
  | GHLContactCreatedPayload
  | GHLPipelineStageUpdatedPayload

// Retell AI Webhook (call_ended)
export interface RetellCallEndedPayload {
  event:   'call_ended'
  call: {
    call_id:             string
    agent_id:            string
    call_status:         string
    call_type:           string
    start_timestamp:     number
    end_timestamp:       number
    duration_ms:         number
    recording_url:       string
    transcript:          string
    call_analysis: {
      call_summary:        string
      user_sentiment:      string
      call_successful:     boolean
      custom_analysis_data: Record<string, unknown>
    }
    metadata: {
      lead_id:            string
      organization_id:    string
      call_type:          CallType
    }
  }
}

// Supabase Realtime channel event
export interface RealtimeLeadUpdate {
  schema:  'public'
  table:   'leads'
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new:     Partial<Lead>
  old:     Partial<Lead>
}

// =============================================================================
// PAGINATION
// =============================================================================

export interface PaginationParams {
  page:      number    // 1-indexed
  pageSize:  number    // max 100
}

export interface PaginatedResult<T> {
  data:     T[]
  total:    number
  page:     number
  pageSize: number
  hasMore:  boolean
}

// =============================================================================
// NOTIFICATION TYPE
// =============================================================================

export interface Notification {
  id:             string
  organizationId: OrganizationId | null
  userId:         UserId | null
  type:           string
  severity:       'INFO' | 'WARNING' | 'CRITICAL'
  title:          string
  body:           string | null
  actionUrl:      string | null
  metadata:       Record<string, unknown>
  readAt:         string | null
  dismissedAt:    string | null
  createdAt:      string
}

// =============================================================================
// SUPABASE DATABASE GENERATED TYPE POINTER
// Actual generated types live at: packages/types/src/database.types.ts
// Generated via: supabase gen types typescript --linked
// =============================================================================

// Re-export hint — the generated file will be:
// export type { Database } from './database.types'
// And all the above types are manually crafted, camelCase domain types
// that wrap the snake_case DB rows.

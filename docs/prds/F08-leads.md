# F08 — Leads Table, Detail & AI Transcript
# RainMachine · MIRD AI Corporate Machine
# Sigma Protocol Step 11 · PRD Generation
# Source Pitch: P08 · Cycle: 4 · Release: R1 · Appetite: Medium
# Date: 2026-04-02 | Status: Ready for Implementation

---

## 1. Overview

### Pitch Summary

Marcus has 200 leads in the pipeline. He needs to see all of them at once, filter by stage or source, sort by recency, reassign a lead to a different agent, check what the AI said on a call, and export a CSV for his weekly team meeting — all without leaving one screen. This PRD builds the full leads experience: a filterable, sortable DataTable with bulk actions, a slide-over panel for lead detail and activity timeline, and a transcript modal for reviewing what Retell AI said on every call.

### User-Facing Outcome

Marcus opens `/dashboard/leads`. He sees all 200 leads in a paginated table. He filters to "Stage: Appointment Set" and sees 12 leads. He clicks one — a slide-over panel opens showing contact info, the activity timeline, and a reassign dropdown. He clicks "VIEW TRANSCRIPT" on the most recent call — a modal shows the full conversation. He selects 5 stale leads, clicks "Archive", and they disappear from the table. He exports filtered results to CSV for his CRM team.

### What This PRD Covers

- `apps/dashboard/app/dashboard/leads/page.tsx` RSC with URL-based filter params
- DataTable: 9 columns, column sort, filter bar (Stage/Source/Agent multi-select), pagination
- Bulk select + bulk toolbar: Reassign, Export, Archive
- Inline stage dropdown with optimistic update + `updateLeadStage` server action
- Lead slide-over panel (`Sheet` component): contact info, activity timeline, reassign
- AI transcript modal: outcome badge, formatted transcript, truncate + expand
- CSV export: `exportLeads` server action → streaming CSV
- Server actions: `archiveLeads`, `bulkReassign`
- Playwright E2E

### Acceptance Summary

- All leads for the current tenant render in the DataTable (paginated at 25)
- Filter by Stage multi-select returns only matching leads
- Sorting by a column header changes sort order and updates URL params
- Inline stage change optimistically updates the row; server confirms within 2s
- Slide-over opens on row click; shows activity timeline in chronological order
- Transcript modal shows full transcript; 5K char truncate with expand button
- Selecting 3 leads shows bulk toolbar; Archive removes them from the list
- CSV export downloads a file with correct column headers

---

## 2. Database

### 2.1 No New Tables

All data reads from `leads`, `calls`, `appointments`, `agents` (F03 schema). New write patterns via server actions on existing tables.

### 2.2 New View: `lead_activity_timeline`

```sql
-- supabase/migrations/0013_lead_activity_timeline.sql

CREATE OR REPLACE VIEW lead_activity_timeline AS
  -- Call events
  SELECT
    c.id AS event_id,
    c.lead_id,
    c.tenant_id,
    'call' AS event_type,
    c.status AS status,
    c.outcome::TEXT AS detail,
    c.duration_s,
    c.transcript,
    c.initiated_at AS occurred_at
  FROM calls c

  UNION ALL

  -- Appointment events
  SELECT
    a.id AS event_id,
    a.lead_id,
    a.tenant_id,
    'appointment' AS event_type,
    a.status::TEXT AS status,
    NULL AS detail,
    NULL AS duration_s,
    NULL AS transcript,
    a.scheduled_at AS occurred_at
  FROM appointments a

  ORDER BY occurred_at DESC;

-- RLS: inherits from base tables (SECURITY INVOKER)
```

### 2.3 Optimistic Lock Column

The `updateLeadStage` server action uses `updated_at` as an optimistic lock to prevent concurrent overwrites.

```sql
-- Already on leads table from F03 — no migration needed.
-- updated_at is managed by the trigger set in 0001_initial_schema.sql.
```

---

## 3. TypeScript Interfaces

### 3.1 Leads Page Types

```typescript
// apps/dashboard/src/types/leads.types.ts

import type { Lead, LeadStage, LeadSource, Agent } from "@rainmachine/db";

export interface LeadRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string;
  email: string | null;
  stage: LeadStage;
  source: LeadSource;
  assignedAgent: { id: string; firstName: string; lastName: string } | null;
  aiCallStatus: string | null;
  lastActivityAt: string | null;
  createdAt: string;
}

export interface LeadFilters {
  stage?: LeadStage[];
  source?: LeadSource[];
  agentId?: string[];
  search?: string;
}

export type LeadSortKey =
  | "createdAt"
  | "lastActivityAt"
  | "stage"
  | "firstName";

export interface LeadsPageParams {
  page?: string;
  pageSize?: string;
  sort?: LeadSortKey;
  dir?: "asc" | "desc";
  stage?: string;        // comma-separated LeadStage values
  source?: string;       // comma-separated LeadSource values
  agentId?: string;      // comma-separated UUIDs
  search?: string;
}

export interface LeadDetailData extends LeadRow {
  timeline: LeadTimelineEvent[];
}

export interface LeadTimelineEvent {
  id: string;
  type: "call" | "appointment";
  status: string;
  detail: string | null;
  durationS: number | null;
  transcript: string | null;
  occurredAt: string;
}

// CSV export column headers
export const CSV_COLUMNS = [
  "id", "first_name", "last_name", "phone", "email",
  "stage", "source", "assigned_agent", "ai_call_status",
  "last_activity_at", "created_at",
] as const;
```

### 3.2 Server Action Return Types

```typescript
// apps/dashboard/src/types/actions.types.ts

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface UpdateLeadStageResult extends ActionResult {
  updatedAt?: string;   // new updated_at value for client optimistic lock
}

export interface BulkReassignResult extends ActionResult {
  updatedCount?: number;
}

export interface ArchiveLeadsResult extends ActionResult {
  archivedCount?: number;
}
```

---

## 4. Server Actions

**File:** `apps/dashboard/app/dashboard/leads/actions.ts`

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServerClient } from "@rainmachine/db";
import type {
  UpdateLeadStageResult,
  BulkReassignResult,
  ArchiveLeadsResult,
} from "@/types/actions.types";

// ─── updateLeadStage ─────────────────────────────────────────────────────────

const updateLeadStageSchema = z.object({
  leadId: z.string().uuid(),
  newStage: z.enum([
    "new", "contacted", "qualified", "appointment_set",
    "appointment_held", "under_contract", "closed_won", "closed_lost", "archived",
  ]),
  updatedAt: z.string().datetime(), // optimistic lock: current updated_at from client
});

export async function updateLeadStage(
  leadId: string,
  newStage: string,
  updatedAt: string,
): Promise<UpdateLeadStageResult> {
  const parsed = updateLeadStageSchema.safeParse({ leadId, newStage, updatedAt });
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  // Optimistic lock: only update if updated_at matches
  const { data, error } = await supabase
    .from("leads")
    .update({ stage: parsed.data.newStage })
    .eq("id", parsed.data.leadId)
    .eq("updated_at", parsed.data.updatedAt) // lock check
    .select("updated_at")
    .single();

  if (error || !data) {
    // No rows updated = optimistic lock conflict
    return {
      success: false,
      error: "This lead was updated by someone else. Please refresh.",
    };
  }

  revalidatePath("/dashboard/leads");
  return { success: true, updatedAt: data.updated_at };
}

// ─── reassignLead ────────────────────────────────────────────────────────────

const reassignLeadSchema = z.object({
  leadId: z.string().uuid(),
  agentId: z.string().uuid(),
});

export async function reassignLead(
  leadId: string,
  agentId: string,
): Promise<ActionResult> {
  const parsed = reassignLeadSchema.safeParse({ leadId, agentId });
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { error } = await supabase
    .from("leads")
    .update({ assigned_agent_id: parsed.data.agentId })
    .eq("id", parsed.data.leadId);

  if (error) return { success: false, error: "Reassignment failed." };

  revalidatePath("/dashboard/leads");
  return { success: true };
}

// ─── archiveLeads ────────────────────────────────────────────────────────────

const archiveLeadsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export async function archiveLeads(
  ids: string[],
): Promise<ArchiveLeadsResult> {
  const parsed = archiveLeadsSchema.safeParse({ ids });
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data, error } = await supabase
    .from("leads")
    .update({ archived_at: new Date().toISOString(), stage: "archived" })
    .in("id", parsed.data.ids)
    .select("id");

  if (error) return { success: false, error: "Archive failed." };

  revalidatePath("/dashboard/leads");
  return { success: true, archivedCount: data?.length ?? 0 };
}

// ─── bulkReassign ────────────────────────────────────────────────────────────

const bulkReassignSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  agentId: z.string().uuid(),
});

export async function bulkReassign(
  ids: string[],
  agentId: string,
): Promise<BulkReassignResult> {
  const parsed = bulkReassignSchema.safeParse({ ids, agentId });
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data, error } = await supabase
    .from("leads")
    .update({ assigned_agent_id: parsed.data.agentId })
    .in("id", parsed.data.ids)
    .select("id");

  if (error) return { success: false, error: "Bulk reassign failed." };

  revalidatePath("/dashboard/leads");
  return { success: true, updatedCount: data?.length ?? 0 };
}

// ─── exportLeads ─────────────────────────────────────────────────────────────

export async function exportLeads(
  filters: import("@/types/leads.types").LeadFilters,
): Promise<{ csv: string } | { error: string }> {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  let query = supabase
    .from("leads")
    .select(`
      id, first_name, last_name, phone, email,
      stage, source, ai_call_status, last_activity_at, created_at,
      agents!assigned_agent_id (first_name, last_name)
    `)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(5000); // safety cap

  if (filters.stage?.length) query = query.in("stage", filters.stage);
  if (filters.source?.length) query = query.in("source", filters.source);
  if (filters.agentId?.length) query = query.in("assigned_agent_id", filters.agentId);

  const { data, error } = await query;
  if (error) return { error: "Export failed." };

  const header = [
    "id", "first_name", "last_name", "phone", "email",
    "stage", "source", "assigned_agent", "ai_call_status",
    "last_activity_at", "created_at",
  ].join(",");

  const rows = (data ?? []).map((row) => {
    const agent = row.agents as { first_name?: string; last_name?: string } | null;
    const agentName = agent
      ? `${agent.first_name ?? ""} ${agent.last_name ?? ""}`.trim()
      : "";
    return [
      row.id,
      row.first_name ?? "",
      row.last_name ?? "",
      row.phone,
      row.email ?? "",
      row.stage,
      row.source,
      agentName,
      row.ai_call_status ?? "",
      row.last_activity_at ?? "",
      row.created_at,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });

  return { csv: [header, ...rows].join("\n") };
}
```

---

## 5. API Routes

No new API routes in F08. CSV export is handled by a server action that returns a string, and the client triggers a browser download via `URL.createObjectURL`.

---

## 6. UI Components

### 6.1 Leads Page (RSC)

**File:** `apps/dashboard/app/dashboard/leads/page.tsx`

```typescript
// apps/dashboard/app/dashboard/leads/page.tsx
import { Suspense } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@rainmachine/db";
import { LeadsClient } from "./_components/LeadsClient";
import { Skeleton } from "@rainmachine/ui";
import type { LeadsPageParams } from "@/types/leads.types";

interface Props {
  searchParams: LeadsPageParams;
}

export default async function LeadsPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  const tenantId = (user?.user_metadata as { tenant_id?: string })?.tenant_id!;

  const page = parseInt(searchParams.page ?? "1", 10);
  const pageSize = parseInt(searchParams.pageSize ?? "25", 10);
  const sortKey = searchParams.sort ?? "createdAt";
  const sortDir = searchParams.dir ?? "desc";

  // Parse filters from URL
  const stageFilter = searchParams.stage?.split(",").filter(Boolean) ?? [];
  const sourceFilter = searchParams.source?.split(",").filter(Boolean) ?? [];
  const agentFilter = searchParams.agentId?.split(",").filter(Boolean) ?? [];

  // Build query
  let query = supabase
    .from("leads")
    .select(`
      id, first_name, last_name, phone, email, stage, source,
      ai_call_status, last_activity_at, created_at, updated_at,
      agents!assigned_agent_id (id, first_name, last_name)
    `, { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("archived_at", null);

  if (stageFilter.length) query = query.in("stage", stageFilter);
  if (sourceFilter.length) query = query.in("source", sourceFilter);
  if (agentFilter.length) query = query.in("assigned_agent_id", agentFilter);
  if (searchParams.search) {
    query = query.or(
      `first_name.ilike.%${searchParams.search}%,last_name.ilike.%${searchParams.search}%,phone.ilike.%${searchParams.search}%`,
    );
  }

  const dbSortKey =
    sortKey === "createdAt" ? "created_at" :
    sortKey === "lastActivityAt" ? "last_activity_at" :
    sortKey === "firstName" ? "first_name" : "stage";

  query = query
    .order(dbSortKey, { ascending: sortDir === "asc" })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data: leads, count } = await query;

  // Fetch agents list for filter bar + reassign dropdown
  const { data: agents } = await supabase
    .from("agents")
    .select("id, first_name, last_name")
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  return (
    <div className="p-6" data-testid="leads-page">
      <Suspense fallback={<Skeleton variant="rect" height={600} />}>
        <LeadsClient
          leads={leads ?? []}
          agents={agents ?? []}
          total={count ?? 0}
          page={page}
          pageSize={pageSize}
          filters={{ stage: stageFilter as any, source: sourceFilter as any, agentId: agentFilter }}
          sortKey={sortKey}
          sortDir={sortDir}
        />
      </Suspense>
    </div>
  );
}
```

### 6.2 Leads Client Component

**File:** `apps/dashboard/app/dashboard/leads/_components/LeadsClient.tsx`

```typescript
"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DataTable, Badge, Button, EmptyState } from "@rainmachine/ui";
import type { Column } from "@rainmachine/ui";
import { LeadSlideOver } from "./LeadSlideOver";
import { BulkToolbar } from "./BulkToolbar";
import { FilterBar } from "./FilterBar";
import { updateLeadStage, archiveLeads, bulkReassign, exportLeads } from "../actions";
import type { LeadRow, LeadFilters, LeadSortKey } from "@/types/leads.types";

interface Props {
  leads: any[];   // typed from Supabase query shape
  agents: { id: string; first_name: string; last_name: string }[];
  total: number;
  page: number;
  pageSize: number;
  filters: LeadFilters;
  sortKey: LeadSortKey;
  sortDir: "asc" | "desc";
}

export function LeadsClient({
  leads, agents, total, page, pageSize, filters, sortKey, sortDir,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Optimistic stage updates: { [leadId]: LeadStage }
  const [optimisticStages, setOptimisticStages] = useState<Record<string, string>>({});

  const activeLead = leads.find((l) => l.id === activeLeadId) ?? null;

  function updateUrlParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(window.location.search);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined) params.delete(k);
      else params.set(k, v);
    });
    params.set("page", "1"); // reset to page 1 on filter/sort change
    router.push(`${pathname}?${params.toString()}`);
  }

  async function handleStageChange(leadId: string, newStage: string, updatedAt: string) {
    // Optimistic update
    setOptimisticStages((prev) => ({ ...prev, [leadId]: newStage }));
    const result = await updateLeadStage(leadId, newStage, updatedAt);
    if (!result.success) {
      // Revert
      setOptimisticStages((prev) => {
        const next = { ...prev };
        delete next[leadId];
        return next;
      });
    }
  }

  async function handleExport() {
    const result = await exportLeads(filters);
    if ("error" in result) return;
    const blob = new Blob([result.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const STAGE_COLORS: Record<string, "cyan" | "green" | "orange" | "red" | "gray"> = {
    new: "cyan",
    contacted: "cyan",
    qualified: "cyan",
    appointment_set: "green",
    appointment_held: "green",
    under_contract: "green",
    closed_won: "green",
    closed_lost: "red",
    archived: "gray",
  };

  const columns: Column<typeof leads[number]>[] = [
    {
      key: "name",
      header: "LEAD",
      render: (_, row) => (
        <div>
          <p className="text-text text-sm">
            {[row.first_name, row.last_name].filter(Boolean).join(" ") || "—"}
          </p>
          <p className="text-text-dim text-xs font-mono">{row.phone}</p>
        </div>
      ),
    },
    {
      key: "stage",
      header: "STAGE",
      sortable: true,
      render: (_, row) => {
        const stage = optimisticStages[row.id] ?? row.stage;
        return (
          <StageSelect
            value={stage}
            onChange={(newStage) => handleStageChange(row.id, newStage, row.updated_at)}
          />
        );
      },
    },
    {
      key: "source",
      header: "SOURCE",
      render: (_, row) => (
        <Badge color="gray" size="sm" variant="subtle">
          {row.source.replace(/_/g, " ").toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "assignedAgent",
      header: "AGENT",
      render: (_, row) => {
        const agent = row.agents as { first_name?: string; last_name?: string } | null;
        return agent
          ? <span className="text-text-muted text-sm">{agent.first_name} {agent.last_name}</span>
          : <span className="text-text-dim text-xs">Unassigned</span>;
      },
    },
    {
      key: "ai_call_status",
      header: "AI CALL",
      render: (_, row) => row.ai_call_status
        ? <Badge color="gray" size="sm">{row.ai_call_status}</Badge>
        : <span className="text-text-dim text-xs">—</span>,
    },
    {
      key: "last_activity_at",
      header: "LAST ACTIVITY",
      sortable: true,
      render: (_, row) => row.last_activity_at
        ? <span className="text-text-muted text-xs">{formatRelative(row.last_activity_at)}</span>
        : <span className="text-text-dim text-xs">—</span>,
    },
    {
      key: "created_at",
      header: "CREATED",
      sortable: true,
      render: (_, row) => (
        <span className="text-text-muted text-xs">{formatRelative(row.created_at)}</span>
      ),
    },
  ];

  return (
    <div data-testid="leads-client">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-cyan text-xl uppercase tracking-widest">
          Leads
          <span className="text-text-dim text-sm font-body normal-case tracking-normal ml-3">
            {total.toLocaleString()} total
          </span>
        </h1>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          EXPORT CSV
        </Button>
      </div>

      <FilterBar
        filters={filters}
        agents={agents}
        onChange={(newFilters) => {
          updateUrlParams({
            stage: newFilters.stage?.join(","),
            source: newFilters.source?.join(","),
            agentId: newFilters.agentId?.join(","),
            search: newFilters.search,
          });
        }}
      />

      {selectedIds.length > 0 && (
        <BulkToolbar
          selectedCount={selectedIds.length}
          agents={agents}
          onReassign={async (agentId) => {
            await bulkReassign(selectedIds, agentId);
            setSelectedIds([]);
          }}
          onArchive={async () => {
            await archiveLeads(selectedIds);
            setSelectedIds([]);
          }}
          onExport={handleExport}
          onClear={() => setSelectedIds([])}
        />
      )}

      <DataTable
        columns={columns}
        data={leads}
        loading={isPending}
        emptyState={
          <EmptyState
            title="No leads found"
            description="Adjust your filters or check back after your first Meta/Google ad runs."
            data-testid="leads-empty-state"
          />
        }
        onRowClick={(row) => setActiveLeadId(row.id)}
        sortKey={sortKey}
        sortDirection={sortDir}
        onSort={(key) => {
          const newDir = sortKey === key && sortDir === "desc" ? "asc" : "desc";
          updateUrlParams({ sort: key, dir: newDir });
        }}
        selectable
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: (p) => updateUrlParams({ page: String(p) }),
        }}
        data-testid="leads-table"
      />

      <LeadSlideOver
        lead={activeLead}
        agents={agents}
        onClose={() => setActiveLeadId(null)}
        onReassign={reassignLead}
      />
    </div>
  );
}

// ── Inline stage select ────────────────────────────────────────────────────

function StageSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const STAGES = [
    "new", "contacted", "qualified", "appointment_set",
    "appointment_held", "under_contract", "closed_won", "closed_lost",
  ];
  return (
    <select
      data-testid="stage-select"
      value={value}
      onChange={(e) => { e.stopPropagation(); onChange(e.target.value); }}
      onClick={(e) => e.stopPropagation()}
      className="bg-surface border border-border text-text text-xs rounded px-2 py-1 font-mono uppercase tracking-wider focus:outline-none focus:border-cyan"
    >
      {STAGES.map((s) => (
        <option key={s} value={s}>{s.replace(/_/g, " ").toUpperCase()}</option>
      ))}
    </select>
  );
}
```

### 6.3 Lead Slide-Over Panel

**File:** `apps/dashboard/app/dashboard/leads/_components/LeadSlideOver.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@rainmachine/db";
import { Badge, Button } from "@rainmachine/ui";
import { TranscriptModal } from "./TranscriptModal";
import type { LeadTimelineEvent } from "@/types/leads.types";

interface Props {
  lead: any | null;
  agents: { id: string; first_name: string; last_name: string }[];
  onClose: () => void;
  onReassign: (leadId: string, agentId: string) => Promise<any>;
}

export function LeadSlideOver({ lead, agents, onClose, onReassign }: Props) {
  const [timeline, setTimeline] = useState<LeadTimelineEvent[]>([]);
  const [transcriptCall, setTranscriptCall] = useState<LeadTimelineEvent | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);

  useEffect(() => {
    if (!lead) { setTimeline([]); return; }
    const client = createBrowserClient();
    client
      .from("lead_activity_timeline")
      .select("*")
      .eq("lead_id", lead.id)
      .order("occurred_at", { ascending: false })
      .then(({ data }) => setTimeline((data ?? []) as LeadTimelineEvent[]));
  }, [lead?.id]);

  if (!lead) return null;

  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.phone;

  return (
    <>
      {/* Overlay */}
      <div
        data-testid="slide-over-overlay"
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        data-testid="lead-slide-over"
        className="fixed right-0 top-0 bottom-0 w-[480px] bg-surface border-l border-border z-50 flex flex-col animate-slide-right overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-display text-cyan text-base uppercase tracking-widest">
              {fullName}
            </h2>
            <p className="text-text-muted text-xs font-mono mt-0.5">{lead.phone}</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text transition-colors p-1"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Contact info */}
          <section>
            <p className="text-text-muted text-[10px] font-mono uppercase tracking-[0.2em] mb-3">
              Contact Info
            </p>
            <div className="space-y-2">
              {lead.email && (
                <p className="text-text text-sm">{lead.email}</p>
              )}
              <div className="flex gap-2">
                <Badge color="gray" size="sm">{lead.source?.replace(/_/g, " ").toUpperCase()}</Badge>
                <Badge
                  color={lead.stage === "closed_won" ? "green" : lead.stage === "closed_lost" ? "red" : "cyan"}
                  size="sm"
                >
                  {lead.stage?.replace(/_/g, " ").toUpperCase()}
                </Badge>
              </div>
            </div>
          </section>

          {/* Reassign agent */}
          <section>
            <p className="text-text-muted text-[10px] font-mono uppercase tracking-[0.2em] mb-2">
              Assigned Agent
            </p>
            <div className="flex items-center gap-2">
              <select
                data-testid="reassign-select"
                defaultValue={lead.agents?.id ?? ""}
                onChange={async (e) => {
                  setIsReassigning(true);
                  await onReassign(lead.id, e.target.value);
                  setIsReassigning(false);
                }}
                className="bg-surface-hover border border-border text-text text-sm rounded px-3 py-2 flex-1 focus:outline-none focus:border-cyan"
              >
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.first_name} {a.last_name}
                  </option>
                ))}
              </select>
              {isReassigning && (
                <span className="text-text-dim text-xs animate-pulse">Saving…</span>
              )}
            </div>
          </section>

          {/* Activity timeline */}
          <section>
            <p className="text-text-muted text-[10px] font-mono uppercase tracking-[0.2em] mb-3">
              Activity Timeline
            </p>
            {timeline.length === 0 ? (
              <p className="text-text-dim text-sm">No activity yet.</p>
            ) : (
              <div className="space-y-2">
                {timeline.map((event) => (
                  <TimelineRow
                    key={event.id}
                    event={event}
                    onViewTranscript={() => setTranscriptCall(event)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Transcript Modal */}
      {transcriptCall && (
        <TranscriptModal
          call={transcriptCall}
          onClose={() => setTranscriptCall(null)}
        />
      )}
    </>
  );
}

function TimelineRow({
  event,
  onViewTranscript,
}: {
  event: LeadTimelineEvent;
  onViewTranscript: () => void;
}) {
  const isCall = event.type === "call";
  const hasTranscript = isCall && !!event.transcript;

  return (
    <div
      data-testid="timeline-row"
      className="flex items-start gap-3 p-3 bg-surface-hover rounded-lg"
    >
      <span className="text-base mt-0.5">{isCall ? "📞" : "📅"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-text text-sm capitalize">
            {event.type} — {event.status.replace(/_/g, " ")}
          </span>
          {event.detail && (
            <Badge color="green" size="sm" variant="subtle">
              {event.detail.replace(/_/g, " ").toUpperCase()}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-text-dim text-xs">
            {new Date(event.occurredAt).toLocaleString()}
          </span>
          {event.durationS && (
            <span className="text-text-dim text-xs">
              {Math.floor(event.durationS / 60)}:{String(event.durationS % 60).padStart(2, "0")}
            </span>
          )}
          {hasTranscript && (
            <button
              onClick={onViewTranscript}
              className="text-cyan text-xs hover:underline"
              data-testid="view-transcript-btn"
            >
              VIEW TRANSCRIPT
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 6.4 Transcript Modal

**File:** `apps/dashboard/app/dashboard/leads/_components/TranscriptModal.tsx`

```typescript
"use client";

import { useState } from "react";
import { Modal, Badge, Button } from "@rainmachine/ui";
import type { LeadTimelineEvent } from "@/types/leads.types";

const TRUNCATE_LENGTH = 5000;

interface Props {
  call: LeadTimelineEvent;
  onClose: () => void;
}

export function TranscriptModal({ call, onClose }: Props) {
  const [expanded, setExpanded] = useState(false);

  const transcript = call.transcript ?? "";
  const isTruncated = transcript.length > TRUNCATE_LENGTH;
  const displayText = isTruncated && !expanded
    ? transcript.slice(0, TRUNCATE_LENGTH) + "…"
    : transcript;

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="AI CALL TRANSCRIPT"
      size="lg"
      data-testid="transcript-modal"
      footer={
        <div className="flex items-center justify-between w-full">
          {isTruncated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "COLLAPSE" : `SHOW FULL TRANSCRIPT`}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onClose}>
            CLOSE
          </Button>
        </div>
      }
    >
      {/* Outcome badge */}
      {call.detail && (
        <div className="mb-4">
          <Badge color="green" variant="subtle">
            OUTCOME: {call.detail.replace(/_/g, " ").toUpperCase()}
          </Badge>
          {call.durationS && (
            <span className="text-text-muted text-xs ml-3">
              Duration: {Math.floor(call.durationS / 60)}:{String(call.durationS % 60).padStart(2, "0")}
            </span>
          )}
        </div>
      )}

      {/* Transcript text */}
      {transcript ? (
        <pre
          data-testid="transcript-text"
          className="text-text text-sm font-body leading-relaxed whitespace-pre-wrap break-words bg-background rounded-lg p-4 border border-border max-h-[60vh] overflow-y-auto"
        >
          {displayText}
        </pre>
      ) : (
        <p className="text-text-muted text-sm">No transcript available for this call.</p>
      )}
    </Modal>
  );
}
```

### 6.5 Filter Bar

**File:** `apps/dashboard/app/dashboard/leads/_components/FilterBar.tsx`

```typescript
"use client";
// Multi-select dropdowns for Stage, Source, Agent + text search input
// Each filter changes state, fires onChange callback
// "Clear filters" button resets all to empty
// data-testid="filter-bar"
// data-testid="filter-stage", "filter-source", "filter-agent", "filter-search"
// data-testid="filter-clear"
```

### 6.6 Bulk Toolbar

**File:** `apps/dashboard/app/dashboard/leads/_components/BulkToolbar.tsx`

```typescript
"use client";
// Slides up from bottom of table when selectedIds.length > 0
// Shows: "X selected" + REASSIGN (opens agent select dropdown) + EXPORT + ARCHIVE + CLEAR
// Animate in: animate-slide-up
// data-testid="bulk-toolbar"
// Confirm dialog for Archive: "Archive X leads? This cannot be undone."
```

---

## 7. Integration Points

### 7.1 Supabase Database

All reads and writes use `createServerClient(cookieStore)` (server actions) or `createBrowserClient()` (slide-over timeline fetch).

RLS ensures Marcus only sees and modifies his own tenant's leads.

### 7.2 No External APIs

F08 is purely Supabase reads/writes. No GHL, Retell, or Claude calls.

---

## 8. BDD Scenarios

### Scenario 1: Leads Table Renders With Pagination

```
Given Marcus has 75 leads in Supabase (not archived)
When he navigates to /dashboard/leads
Then a table with 25 rows is visible
And pagination shows "1–25 of 75"
When he clicks "Next"
Then the URL updates to ?page=2
And the next 25 leads are shown
```

### Scenario 2: Filter by Stage

```
Given Marcus has 75 leads with mixed stages
When he selects "Appointment Set" in the Stage filter
Then the URL updates to ?stage=appointment_set
And only leads with stage="appointment_set" are shown
And the count in the header reflects the filtered total
```

### Scenario 3: Inline Stage Change — Optimistic Update

```
Given a lead with stage="new" is visible in the table
When Marcus changes the stage dropdown to "Contacted"
Then the dropdown immediately shows "CONTACTED" (optimistic)
And within 2 seconds, the server confirms the update
And the row reflects the new stage without a full page reload
```

### Scenario 4: Optimistic Lock Conflict

```
Given Marcus has lead X open and another team member updates it simultaneously
When Marcus changes the stage
Then the server action detects the updated_at mismatch
And returns an error
And the dropdown reverts to its previous value
And a toast error says "This lead was updated by someone else. Please refresh."
```

### Scenario 5: Slide-Over Opens With Activity Timeline

```
Given a lead with 2 calls and 1 appointment in its history
When Marcus clicks the lead row
Then the slide-over panel slides in from the right
And shows the lead's contact info
And shows all 3 events in the timeline ordered by occurred_at DESC
And one call event shows a "VIEW TRANSCRIPT" link
```

### Scenario 6: Transcript Modal Shows Transcript

```
Given a call with a 6,000-character transcript
When Marcus clicks "VIEW TRANSCRIPT"
Then the TranscriptModal opens
And shows the outcome badge
And shows the first 5,000 characters of the transcript
And shows a "SHOW FULL TRANSCRIPT" button
When he clicks "SHOW FULL TRANSCRIPT"
Then the full 6,000-character transcript is visible
```

### Scenario 7: Bulk Archive

```
Given Marcus has 5 stale leads selected (checkboxes checked)
When he sees the bulk toolbar and clicks "ARCHIVE"
Then a confirmation dialog appears: "Archive 5 leads?"
When he confirms
Then all 5 leads are removed from the table
And the total count decreases by 5
And a success toast appears
```

### Scenario 8: CSV Export

```
Given Marcus has 75 leads, filtered to stage="appointment_set" (12 leads)
When he clicks "EXPORT CSV"
Then a CSV file downloads with 12 data rows + header row
And the file is named "leads-YYYY-MM-DD.csv"
And each row contains id, first_name, last_name, phone, email, stage, source, assigned_agent
```

### Scenario 9: Empty State — No Leads

```
Given Marcus's tenant has no leads (new client, no sync yet)
When he navigates to /dashboard/leads
Then the DataTable shows the EmptyState component
And the message says "No leads found"
And no errors are thrown
```

### Scenario 10: Search by Phone Number

```
Given Marcus types "+1555" in the search field
When the filter applies (URL updates with search=+1555)
Then only leads whose phone contains "+1555" are shown
And the result is scoped to his tenant only
```

---

## 9. Test Plan

### 9.1 Server Action Tests (Vitest)

```typescript
describe("updateLeadStage", () => {
  it("updates stage when updated_at matches", async () => { /* ... */ });
  it("returns error when updated_at mismatch (optimistic lock)", async () => { /* ... */ });
  it("rejects invalid stage enum", async () => { /* ... */ });
  it("rejects non-UUID leadId", async () => { /* ... */ });
});

describe("archiveLeads", () => {
  it("sets archived_at on specified lead IDs", async () => { /* ... */ });
  it("rejects more than 100 IDs", async () => { /* ... */ });
  it("cannot archive another tenant's leads (RLS)", async () => { /* ... */ });
});

describe("exportLeads", () => {
  it("returns CSV with correct header row", async () => { /* ... */ });
  it("applies stage filter to exported rows", async () => { /* ... */ });
  it("properly escapes commas in field values", async () => { /* ... */ });
  it("caps at 5000 rows", async () => { /* ... */ });
});
```

### 9.2 Component Tests (Vitest + RTL)

```typescript
describe("TranscriptModal", () => {
  it("truncates transcript at 5000 chars", () => { /* ... */ });
  it("shows 'SHOW FULL TRANSCRIPT' when truncated", () => { /* ... */ });
  it("expands to full text on button click", () => { /* ... */ });
  it("shows 'No transcript available' when null", () => { /* ... */ });
});

describe("LeadSlideOver", () => {
  it("renders null when no lead provided", () => { /* ... */ });
  it("shows lead name in header", () => { /* ... */ });
  it("shows reassign dropdown with agents", () => { /* ... */ });
});
```

### 9.3 Playwright E2E

```typescript
test("leads table is visible and sortable", async ({ page }) => { /* ... */ });
test("stage filter updates URL and table", async ({ page }) => { /* ... */ });
test("row click opens slide-over", async ({ page }) => { /* ... */ });
test("view transcript button opens modal", async ({ page }) => { /* ... */ });
test("bulk select shows toolbar", async ({ page }) => { /* ... */ });
test("CSV export downloads file", async ({ page }) => { /* ... */ });
```

---

## 10. OWASP Security Checklist

### 10.1 Access Control (A01)
- [ ] **RLS enforced** — All server actions use `createServerClient(cookieStore)`. Marcus cannot archive another tenant's leads even with a forged request.
- [ ] **Bulk action IDs validated** — `archiveLeads` and `bulkReassign` use Zod to validate all IDs are UUIDs. Combined with RLS, Marcus cannot affect leads outside his tenant by injecting IDs.
- [ ] **Export limit** — `exportLeads` caps at 5,000 rows to prevent DoS via unbounded query.

### 10.2 Injection Prevention (A03)
- [ ] **Search field** — Search uses Supabase `.or()` with parameterized ILIKE. No raw SQL interpolation.
- [ ] **Stage/Source filter** — Values validated against the enum before passing to `.in()`. Rejects arbitrary strings.
- [ ] **CSV export** — Each field value is quoted and internal quotes are escaped (`"" `). Prevents CSV injection.

### 10.3 XSS (A03)
- [ ] **Transcript display** — Rendered in a `<pre>` tag as text content, not innerHTML. React escapes automatically.
- [ ] **Lead names** — GHL-sourced strings rendered as React text nodes only.

### 10.4 Optimistic Lock Security
- [ ] **`updated_at` lock** — Prevents blind overwrites of concurrent edits. Not a security boundary (it's a UX protection), but prevents data integrity issues from concurrent access.

---

## 11. Open Questions

### OQ-01 — Transcript: Render as Plain Text or Parse Speaker Labels?

Retell transcripts include speaker labels ("AI: Hello... / User: Hi..."). Should these be rendered as structured speaker blocks or plain text?

**Recommendation:** Plain text in F08. Parse speaker labels in F15 (Reports) or a future enhancement. Plain text is faster to implement and covers the primary use case (Marcus reviewing what was said).

### OQ-02 — Filter Bar: URL Params or Local State?

URL params are used so filters survive page refresh and can be shared. This means every filter change triggers a server-side RSC re-render (full page reload via Next.js navigation). Is this acceptable?

**Recommendation:** Yes for F08. The RSC re-render is fast (Supabase query + server render). If performance becomes an issue, migrate the filter to client-side pagination (Tanstack Query) in a later cycle.

### OQ-03 — Slide-Over Timeline: Server or Client Fetch?

The slide-over timeline loads on row click via a client-side `createBrowserClient()` query. An alternative is pre-fetching timeline data in the RSC for all visible leads.

**Recommendation:** Client-side fetch on click. Pre-fetching all timelines for 25 rows would be expensive. On-demand client fetch is correct — the slide-over is a detail panel.

---

*PRD F08 — Leads Table, Detail & AI Transcript*
*Sigma Protocol Step 11 · MIRD AI Corporate Machine*
*Written: 2026-04-02 · Cycle 4 · Release 1*
*Depends on: F07 (sidebar nav), F05 (calls/transcripts)*
*Unlocks: (none required)*

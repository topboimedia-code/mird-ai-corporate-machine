# F09 — Agents Roster & Management
# RainMachine · MIRD AI Corporate Machine
# Sigma Protocol Step 11 · PRD Generation
# Source Pitch: P09 · Cycle: 4 · Release: R1 · Appetite: Small
# Date: 2026-04-02 | Status: Ready for Implementation

---

## 1. Overview

### Pitch Summary

Marcus has 8 agents on his team. He needs to see who's active, who's paused, how many leads each agent has, and who's closing at the best rate. When he hires a new agent or someone leaves, he needs to update the roster without opening GHL. This PRD builds the Agents page: a sortable DataTable with inline editing, a detail modal with stats, a pause/activate toggle that syncs to GHL via n8n, and a CSV bulk import for onboarding multiple agents at once.

### User-Facing Outcome

Marcus opens `/dashboard/agents`. He sees 8 agent cards with status dots, close rate sparklines, and lead counts. He clicks Sarah's row — her modal opens with her stats and an inline edit form. He changes her role label to "Senior Buyer's Agent" and saves. He notices Mike is on vacation, clicks "PAUSE" — Mike's status turns orange in real time, and within 5 seconds GHL stops routing new leads to him. He uploads a CSV to add 3 new agents at once.

### What This PRD Covers

- `apps/dashboard/app/dashboard/agents/page.tsx` RSC
- Agent DataTable: status dot, close rate sparkline, sort, filter, search
- Agent detail modal: profile, stats, inline edit, pause/activate toggle
- `updateAgentStatus` server action → Supabase write + n8n webhook
- `updateAgent` server action
- `importAgentsFromCSV` server action with per-row validation, partial success
- n8n `agent-sync` workflow: receives status change → updates GHL routing
- Integration test: pause agent → GHL routing updated within 5s

### Acceptance Summary

- All agents for the current tenant render in the DataTable
- Sorting by Close Rate shows agents in descending order
- Agent detail modal opens on row click, shows accurate stats
- Edit form saves name/phone/email/role; toast confirms
- Pause toggle sets status = "paused" in DB and in GHL routing within 5s
- CSV import of 3 valid rows creates 3 new agents; invalid rows return per-row errors
- Agent with status "paused" shows orange status dot in table

---

## 2. Database

### 2.1 No New Tables

`agents` table was created in F03. This PRD adds write patterns.

### 2.2 New Index

```sql
-- supabase/migrations/0014_agents_indexes.sql

-- For sorting by close_rate
CREATE INDEX idx_agents_close_rate ON agents(tenant_id, close_rate DESC NULLS LAST);

-- For status filter
CREATE INDEX idx_agents_status ON agents(tenant_id, status);
```

---

## 3. TypeScript Interfaces

```typescript
// apps/dashboard/src/types/agents.types.ts

import type { Agent } from "@rainmachine/db";

export interface AgentRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  roleLabel: string | null;
  status: "active" | "paused" | "inactive";
  closeRate: number | null;        // 0.0–1.0
  leadsAssigned: number;
  closeRateTrend: number[];        // 7-day sparkline data (placeholder until reports populate it)
  ghlUserId: string | null;
}

export interface AgentUpdatePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleLabel?: string;
}

export interface AgentCsvRow {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role_label?: string;
}

export interface CsvImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

// n8n agent sync webhook payload
export interface AgentSyncWebhookPayload {
  agentId: string;
  tenantId: string;
  ghlUserId: string | null;
  newStatus: "active" | "paused" | "inactive";
  timestamp: string;
}
```

---

## 4. Server Actions

**File:** `apps/dashboard/app/dashboard/agents/actions.ts`

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServerClient } from "@rainmachine/db";
import type { CsvImportResult, AgentUpdatePayload } from "@/types/agents.types";

// ─── updateAgentStatus ───────────────────────────────────────────────────────

const updateAgentStatusSchema = z.object({
  agentId: z.string().uuid(),
  status: z.enum(["active", "paused", "inactive"]),
});

export async function updateAgentStatus(
  agentId: string,
  status: string,
): Promise<{ success: boolean; error?: string }> {
  const parsed = updateAgentStatusSchema.safeParse({ agentId, status });
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  // 1. Update Supabase
  const { data: agent, error: dbError } = await supabase
    .from("agents")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.agentId)
    .select("id, tenant_id, ghl_user_id")
    .single();

  if (dbError || !agent) {
    return { success: false, error: "Status update failed." };
  }

  // 2. Sync to GHL via n8n webhook (fire-and-forget with timeout)
  const n8nPayload = {
    agentId: parsed.data.agentId,
    tenantId: agent.tenant_id,
    ghlUserId: agent.ghl_user_id,
    newStatus: parsed.data.status,
    timestamp: new Date().toISOString(),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout
    await fetch(process.env.N8N_AGENT_SYNC_WEBHOOK_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET!,
      },
      body: JSON.stringify(n8nPayload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err) {
    // Log but don't fail — DB is source of truth; n8n will retry
    console.error("[updateAgentStatus] n8n sync call failed:", err);
  }

  revalidatePath("/dashboard/agents");
  return { success: true };
}

// ─── updateAgent ─────────────────────────────────────────────────────────────

const updateAgentSchema = z.object({
  agentId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  roleLabel: z.string().max(100).optional(),
});

export async function updateAgent(
  agentId: string,
  data: AgentUpdatePayload,
): Promise<{ success: boolean; error?: string }> {
  const parsed = updateAgentSchema.safeParse({ agentId, ...data });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { error } = await supabase
    .from("agents")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      role_label: parsed.data.roleLabel ?? null,
    })
    .eq("id", parsed.data.agentId);

  if (error) return { success: false, error: "Update failed." };

  revalidatePath("/dashboard/agents");
  return { success: true };
}

// ─── importAgentsFromCSV ─────────────────────────────────────────────────────

const agentCsvRowSchema = z.object({
  first_name: z.string().min(1, "first_name required").max(100),
  last_name: z.string().min(1, "last_name required").max(100),
  email: z.string().email("Invalid email"),
  phone: z.string().max(20).optional(),
  role_label: z.string().max(100).optional(),
});

export async function importAgentsFromCSV(
  rows: Record<string, string>[],
): Promise<CsvImportResult> {
  if (rows.length > 50) {
    return { success: false, imported: 0, errors: [{ row: 0, field: "file", message: "Max 50 agents per import." }] };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  const tenantId = (user?.user_metadata as { tenant_id?: string })?.tenant_id!;

  const validRows: Array<{ first_name: string; last_name: string; email: string; phone?: string; role_label?: string }> = [];
  const errors: CsvImportResult["errors"] = [];

  // Validate all rows first
  rows.forEach((row, index) => {
    const parsed = agentCsvRowSchema.safeParse(row);
    if (!parsed.success) {
      parsed.error.errors.forEach((e) => {
        errors.push({ row: index + 1, field: e.path[0]?.toString() ?? "unknown", message: e.message });
      });
    } else {
      validRows.push(parsed.data);
    }
  });

  if (validRows.length === 0) {
    return { success: false, imported: 0, errors };
  }

  // Insert valid rows (partial success)
  const { data: inserted, error: insertError } = await supabase
    .from("agents")
    .insert(
      validRows.map((r) => ({
        tenant_id: tenantId,
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
        phone: r.phone ?? null,
        role_label: r.role_label ?? null,
        status: "active",
      })),
    )
    .select("id");

  if (insertError) {
    return { success: false, imported: 0, errors: [{ row: 0, field: "database", message: "Import failed." }] };
  }

  revalidatePath("/dashboard/agents");
  return {
    success: true,
    imported: inserted?.length ?? 0,
    errors,
  };
}
```

---

## 5. API Routes

No new API routes in F09. The n8n agent sync is triggered from the `updateAgentStatus` server action via a direct HTTP call to the n8n webhook URL.

---

## 6. UI Components

### 6.1 Agents Page (RSC)

```typescript
// apps/dashboard/app/dashboard/agents/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@rainmachine/db";
import { AgentsClient } from "./_components/AgentsClient";

export default async function AgentsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  const tenantId = (user?.user_metadata as { tenant_id?: string })?.tenant_id!;

  const { data: agents } = await supabase
    .from("agents")
    .select("id, first_name, last_name, email, phone, role_label, status, close_rate, leads_assigned, ghl_user_id")
    .eq("tenant_id", tenantId)
    .order("close_rate", { ascending: false, nullsFirst: false });

  return (
    <div className="p-6" data-testid="agents-page">
      <AgentsClient agents={agents ?? []} />
    </div>
  );
}
```

### 6.2 Agents Client

**File:** `apps/dashboard/app/dashboard/agents/_components/AgentsClient.tsx`

```typescript
"use client";

import { useState } from "react";
import { DataTable, StatusDot, Sparkline, Badge, Button } from "@rainmachine/ui";
import type { Column } from "@rainmachine/ui";
import { AgentDetailModal } from "./AgentDetailModal";
import { CsvImportModal } from "./CsvImportModal";
import { updateAgentStatus } from "../actions";
import type { AgentRow } from "@/types/agents.types";

export function AgentsClient({ agents }: { agents: any[] }) {
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pendingStatus, setPendingStatus] = useState<Record<string, boolean>>({});

  const activeAgent = agents.find((a) => a.id === activeAgentId) ?? null;

  const filtered = agents.filter((a) => {
    const matchesSearch =
      !search ||
      `${a.first_name} ${a.last_name} ${a.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleToggleStatus(agent: any) {
    const newStatus = agent.status === "active" ? "paused" : "active";
    setPendingStatus((prev) => ({ ...prev, [agent.id]: true }));
    await updateAgentStatus(agent.id, newStatus);
    setPendingStatus((prev) => ({ ...prev, [agent.id]: false }));
  }

  const columns: Column<typeof agents[number]>[] = [
    {
      key: "name",
      header: "AGENT",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <StatusDot
            color={row.status === "active" ? "green" : row.status === "paused" ? "orange" : "gray"}
            size="sm"
            pulse={row.status === "active"}
            label={row.status}
          />
          <div>
            <p className="text-text text-sm font-medium">
              {row.first_name} {row.last_name}
            </p>
            {row.role_label && (
              <p className="text-text-dim text-xs">{row.role_label}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "close_rate",
      header: "CLOSE RATE",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <span className="font-mono text-cyan text-sm">
            {row.close_rate != null
              ? `${Math.round(row.close_rate * 100)}%`
              : "—"}
          </span>
          <Sparkline data={row.closeRateTrend ?? []} width={40} height={18} />
        </div>
      ),
    },
    {
      key: "leads_assigned",
      header: "LEADS",
      sortable: true,
      render: (_, row) => (
        <span className="font-mono text-text text-sm">{row.leads_assigned}</span>
      ),
    },
    {
      key: "email",
      header: "EMAIL",
      render: (_, row) => (
        <span className="text-text-muted text-xs">{row.email}</span>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Badge
            color={row.status === "active" ? "green" : row.status === "paused" ? "orange" : "gray"}
            size="sm"
            variant="subtle"
          >
            {row.status.toUpperCase()}
          </Badge>
          <button
            data-testid={`toggle-status-${row.id}`}
            disabled={pendingStatus[row.id]}
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
            className="text-text-dim text-xs hover:text-cyan transition-colors disabled:opacity-40"
          >
            {pendingStatus[row.id] ? "…" : row.status === "active" ? "PAUSE" : "ACTIVATE"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div data-testid="agents-client">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-cyan text-xl uppercase tracking-widest">
          Agents
          <span className="text-text-dim text-sm font-body normal-case tracking-normal ml-3">
            {agents.length} total
          </span>
        </h1>
        <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
          IMPORT CSV
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 mb-4" data-testid="agents-filter-bar">
        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="agents-search"
          className="bg-surface border border-border text-text text-sm rounded px-3 py-2 flex-1 max-w-xs focus:outline-none focus:border-cyan"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          data-testid="agents-status-filter"
          className="bg-surface border border-border text-text text-sm rounded px-3 py-2 focus:outline-none focus:border-cyan"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => setActiveAgentId(row.id)}
        emptyState={
          <div data-testid="agents-empty-state" className="py-12 text-center">
            <p className="text-text-muted text-sm">No agents found.</p>
            <p className="text-text-dim text-xs mt-1">Import a CSV to add your team.</p>
          </div>
        }
        data-testid="agents-table"
      />

      {activeAgent && (
        <AgentDetailModal
          agent={activeAgent}
          onClose={() => setActiveAgentId(null)}
          onUpdate={updateAgent}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {showImport && (
        <CsvImportModal onClose={() => setShowImport(false)} />
      )}
    </div>
  );
}
```

### 6.3 Agent Detail Modal

**File:** `apps/dashboard/app/dashboard/agents/_components/AgentDetailModal.tsx`

```typescript
"use client";

import { useState } from "react";
import { Modal, Button, Input, Badge, StatusDot } from "@rainmachine/ui";
import { updateAgent } from "../actions";

interface Props {
  agent: any;
  onClose: () => void;
  onUpdate: typeof updateAgent;
  onToggleStatus: (agent: any) => void;
}

export function AgentDetailModal({ agent, onClose, onUpdate, onToggleStatus }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: agent.first_name,
    lastName: agent.last_name,
    email: agent.email,
    phone: agent.phone ?? "",
    roleLabel: agent.role_label ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);
    const result = await onUpdate(agent.id, form);
    setIsSaving(false);
    if (result.success) {
      setIsEditing(false);
    } else {
      setSaveError(result.error ?? "Save failed.");
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`${agent.first_name} ${agent.last_name}`}
      size="md"
      data-testid="agent-detail-modal"
      footer={
        isEditing ? (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>CANCEL</Button>
            <Button size="sm" loading={isSaving} onClick={handleSave}>SAVE CHANGES</Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onToggleStatus(agent)}>
              {agent.status === "active" ? "PAUSE AGENT" : "ACTIVATE AGENT"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>EDIT</Button>
          </div>
        )
      }
    >
      {!isEditing ? (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCell label="CLOSE RATE" value={agent.close_rate != null ? `${Math.round(agent.close_rate * 100)}%` : "—"} />
            <StatCell label="LEADS" value={String(agent.leads_assigned)} />
            <StatCell label="STATUS">
              <StatusDot
                color={agent.status === "active" ? "green" : agent.status === "paused" ? "orange" : "gray"}
                pulse={agent.status === "active"}
                label={agent.status}
              />
              <span className="text-text-muted text-xs ml-1 capitalize">{agent.status}</span>
            </StatCell>
          </div>

          {/* Info */}
          <div className="space-y-2 text-sm">
            <InfoRow label="Email" value={agent.email} />
            <InfoRow label="Phone" value={agent.phone ?? "—"} />
            <InfoRow label="Role" value={agent.role_label ?? "—"} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {saveError && (
            <p className="text-red text-sm">{saveError}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Role Label" value={form.roleLabel} onChange={(e) => setForm({ ...form, roleLabel: e.target.value })} />
        </div>
      )}
    </Modal>
  );
}

function StatCell({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="bg-surface-hover rounded-lg p-3">
      <p className="text-text-muted text-[9px] font-mono uppercase tracking-widest mb-1">{label}</p>
      {children ?? <p className="font-mono text-cyan text-lg">{value}</p>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-muted text-xs">{label}</span>
      <span className="text-text text-xs">{value}</span>
    </div>
  );
}
```

### 6.4 CSV Import Modal

**File:** `apps/dashboard/app/dashboard/agents/_components/CsvImportModal.tsx`

```typescript
"use client";
import { useState, useRef } from "react";
import { Modal, Button, AlertBanner } from "@rainmachine/ui";
import { importAgentsFromCSV } from "../actions";
import type { CsvImportResult } from "@/types/agents.types";

// CSV format expected:
// first_name,last_name,email,phone,role_label
// (header row required, phone and role_label optional)

export function CsvImportModal({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.trim().split("\n");
    const headers = lines[0]?.split(",").map((h) => h.trim().toLowerCase()) ?? [];
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
    });

    setIsLoading(true);
    const res = await importAgentsFromCSV(rows);
    setResult(res);
    setIsLoading(false);
  }

  return (
    <Modal open={true} onClose={onClose} title="IMPORT AGENTS — CSV" size="md" data-testid="csv-import-modal">
      <div className="space-y-4">
        <p className="text-text-muted text-sm">
          Upload a CSV with columns: <span className="font-mono text-cyan">first_name, last_name, email</span> (+ optional: phone, role_label). Max 50 rows.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          data-testid="csv-file-input"
          className="text-text-muted text-sm"
        />
        {result && (
          <div className="space-y-2">
            {result.imported > 0 && (
              <AlertBanner type="success" title={`${result.imported} agent(s) imported successfully.`} />
            )}
            {result.errors.length > 0 && (
              <AlertBanner
                type="warning"
                title={`${result.errors.length} row(s) had errors:`}
                description={result.errors.map((e) => `Row ${e.row}: ${e.field} — ${e.message}`).join(" · ")}
              />
            )}
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>CANCEL</Button>
          <Button size="sm" loading={isLoading} onClick={handleImport}>IMPORT</Button>
        </div>
      </div>
    </Modal>
  );
}
```

---

## 7. Integration Points

### 7.1 n8n Workflow: `agent-sync`

**Trigger:** HTTP webhook call from `updateAgentStatus` server action.

```
[Webhook Trigger]
  URL: /webhook/agent-sync
  Method: POST
  Auth: x-webhook-secret header
  ↓
[Validate payload]
  - agentId, tenantId, ghlUserId, newStatus required
  ↓
[Guard: ghlUserId present]
  ↓ (has GHL user ID)         ↓ (no GHL user ID — not yet synced)
  Continue                  → Log and END
  ↓
[Lookup GHL sub-account]
  GET tenants.ghl_sub_account_id WHERE tenant_id = tenantId
  ↓
[Update GHL routing workflow]
  If status = "paused" or "inactive":
    PUT GHL /v1/users/{ghlUserId}/routing-status → { status: "unavailable" }
  If status = "active":
    PUT GHL /v1/users/{ghlUserId}/routing-status → { status: "available" }
  ↓ (success)               ↓ (GHL API error)
  Log success             → POST /api/webhooks/n8n-error
  END                       END
```

**n8n env vars needed:** `GHL_AGENCY_API_KEY`, `DASHBOARD_URL`, `N8N_WEBHOOK_SECRET`

**New env var for dashboard app:**
```typescript
// apps/dashboard/src/env.ts additions:
server: {
  N8N_AGENT_SYNC_WEBHOOK_URL: z.string().url(),
}
```

**Integration test requirement:** Pause agent → GHL routing updated within 5 seconds.

---

## 8. BDD Scenarios

### Scenario 1: Agents Table Renders With Status Dots

```
Given Marcus has 8 agents (6 active, 2 paused)
When he navigates to /dashboard/agents
Then a table with 8 rows is visible
And active agents have a green pulsing StatusDot
And paused agents have an orange static StatusDot
And the table is sorted by close_rate descending by default
```

### Scenario 2: Sort by Close Rate

```
Given agents have varying close rates
When Marcus clicks the "CLOSE RATE" column header
Then the table re-sorts by close rate descending
And the agent with the highest close rate is at the top
And the sparkline column shows the 7-day trend for each agent
```

### Scenario 3: Agent Detail Modal

```
Given Marcus clicks agent "Sarah Johnson"
When the modal opens
Then he sees Sarah's close rate, leads assigned, and current status
And he sees her email, phone, and role label
And he sees a "PAUSE AGENT" button (since she is active)
And he sees an "EDIT" button
```

### Scenario 4: Edit Agent and Save

```
Given the agent detail modal is open with isEditing = false
When Marcus clicks "EDIT"
Then a form appears with pre-filled fields
When he changes the Role Label to "Senior Buyer's Agent" and clicks "SAVE CHANGES"
Then the server action updates the DB
And the modal returns to view mode
And the table re-renders with the updated role label
```

### Scenario 5: Pause Agent Syncs to GHL

```
Given Marcus clicks "PAUSE AGENT" for Mike
When the server action runs
Then Mike's status updates to "paused" in Supabase
And the n8n agent-sync webhook is called within 1 second
And within 5 seconds, GHL routing marks Mike as unavailable
And Mike's row shows an orange "PAUSED" badge in the table
```

### Scenario 6: Activate Paused Agent

```
Given Mike is currently paused
When Marcus clicks the "ACTIVATE" button on Mike's row
Then Mike's status updates to "active" in Supabase
And the n8n webhook fires, marking Mike as available in GHL
And Mike's row shows a green pulsing StatusDot
```

### Scenario 7: CSV Import — All Valid Rows

```
Given a CSV with 3 valid rows (first_name, last_name, email)
When Marcus uploads it and clicks IMPORT
Then 3 new agent rows are created in Supabase with status "active"
And a success banner shows "3 agent(s) imported successfully."
And the agents table refreshes with 3 new rows
```

### Scenario 8: CSV Import — Mixed Valid/Invalid

```
Given a CSV with 4 rows (2 valid, 2 with missing email)
When Marcus imports it
Then 2 agents are created (the valid ones)
And a warning banner shows "2 row(s) had errors: Row 2: email — Invalid email · Row 4: email — Invalid email"
And the import still reports success for the 2 valid rows
```

### Scenario 9: Search by Name

```
Given Marcus types "sarah" in the search field
Then only agents whose name contains "sarah" (case-insensitive) are shown
And the filter is client-side (no URL update required)
```

### Scenario 10: Status Filter — Paused Only

```
Given Marcus selects "Paused" in the status dropdown
Then only paused agents are shown
And active agents are hidden
And the count in the header reflects the filtered count
```

---

## 9. Test Plan

### 9.1 Server Action Tests (Vitest)

```typescript
describe("updateAgentStatus", () => {
  it("updates status to paused in DB", async () => { /* ... */ });
  it("calls n8n webhook after DB update", async () => { /* ... */ });
  it("succeeds even if n8n webhook times out", async () => { /* ... */ });
  it("rejects invalid status values", async () => { /* ... */ });
});

describe("updateAgent", () => {
  it("updates name/email/phone/roleLabel", async () => { /* ... */ });
  it("rejects invalid email format", async () => { /* ... */ });
  it("cannot update another tenant's agent (RLS)", async () => { /* ... */ });
});

describe("importAgentsFromCSV", () => {
  it("imports 3 valid rows successfully", async () => { /* ... */ });
  it("returns per-row errors for invalid emails", async () => { /* ... */ });
  it("partially imports when some rows are valid", async () => { /* ... */ });
  it("rejects files with > 50 rows", async () => { /* ... */ });
});
```

### 9.2 Integration Test — Pause Agent → GHL Sync

```typescript
it("pause agent → GHL routing updated within 5s", async () => {
  // 1. Create test agent in DB with ghl_user_id set
  // 2. Call updateAgentStatus(agentId, "paused")
  // 3. Assert DB status = "paused" immediately
  // 4. Wait up to 5s, poll GHL API for routing status
  // 5. Assert GHL routing status = "unavailable"
});
```

### 9.3 Playwright E2E

```typescript
test("agents table renders with status dots", async ({ page }) => { /* ... */ });
test("agent detail modal opens on row click", async ({ page }) => { /* ... */ });
test("pause toggle changes badge color", async ({ page }) => { /* ... */ });
test("CSV import modal accepts file upload", async ({ page }) => { /* ... */ });
```

---

## 10. OWASP Security Checklist

### 10.1 Access Control (A01)
- [ ] **RLS on agents table** — Server actions use session client. Marcus cannot update another tenant's agents. `updateAgent` and `updateAgentStatus` are implicitly scoped by RLS.
- [ ] **n8n webhook auth** — `N8N_WEBHOOK_SECRET` in `x-webhook-secret` header. Prevent unauthorized agent sync triggers.

### 10.2 Input Validation (A03)
- [ ] **updateAgent Zod schema** — All fields validated: name max 100 chars, valid email, phone max 20 chars.
- [ ] **CSV import** — Per-row Zod validation. No raw CSV data reaches the DB without validation. `email` must pass `z.string().email()`. Max 50 rows per import.
- [ ] **No injection via role_label** — `role_label` is stored as TEXT, rendered as a text node. Max 100 chars prevents storage bloat.

### 10.3 n8n Webhook (A05)
- [ ] **Timeout guard** — `updateAgentStatus` uses `AbortController` with 4-second timeout on the n8n call. Slow n8n does not block the server action response to the user.
- [ ] **Fire-and-forget safety** — n8n call failure is logged but does not fail the DB update. Supabase is source of truth; GHL sync is best-effort with n8n retry handling.

---

## 11. Open Questions

### OQ-01 — Close Rate Trend Sparkline Data Source

The `closeRateTrend` sparkline shows a 7-day trend, but `agents.close_rate` is a single scalar. The 7-day history doesn't exist yet.

**Recommendation:** For F09, show a flat sparkline using the current close_rate repeated 7 times (placeholder). When F16 (Claude AI agents) runs weekly reports, update the trend data. Add a `close_rate_history` JSONB column to `agents` in F16.

### OQ-02 — GHL Routing API: User Status vs. Workflow Rule?

The n8n agent-sync workflow updates a GHL user's routing status. Does GHL have a direct "user availability" API, or must we update a workflow rule?

**Context:** GHL's routing works via workflow conditions. There may not be a single "set user availability" endpoint. The n8n workflow may need to update a routing workflow condition instead.

**Recommendation:** Research GHL Agency API before F09 n8n implementation. If no direct availability API exists, the n8n workflow pauses the agent's GHL user account instead (or adds them to a "paused" tag used as a routing exclusion condition).

**Decision gate:** F09 n8n workflow implementation.

---

*PRD F09 — Agents Roster & Management*
*Sigma Protocol Step 11 · MIRD AI Corporate Machine*
*Written: 2026-04-02 · Cycle 4 · Release 1*
*Depends on: F04 (agents table in DB)*
*Unlocks: F11 (Settings > Team references agents)*

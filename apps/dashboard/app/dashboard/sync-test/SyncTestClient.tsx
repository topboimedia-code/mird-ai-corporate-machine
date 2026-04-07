"use client";

import { useEffect, useState } from "react";
import { createBrowserClient, subscribeToMetrics } from "@rainmachine/db";
import type { MetricsRealtimePayload } from "@rainmachine/db";

interface Props {
  tenantId: string;
  initialLeadsTotal: number;
  initialAppointmentsSet: number;
}

export function SyncTestClient({
  tenantId,
  initialLeadsTotal,
  initialAppointmentsSet,
}: Props) {
  const [leadsTotal, setLeadsTotal] = useState(initialLeadsTotal);
  const [apptSet, setApptSet] = useState(initialAppointmentsSet);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  useEffect(() => {
    const client = createBrowserClient();

    const { unsubscribe } = subscribeToMetrics(
      client,
      tenantId,
      (payload: MetricsRealtimePayload) => {
        setLeadsTotal(payload.new.leads_total);
        setApptSet(payload.new.appointments_set);
        setLastEvent(new Date().toLocaleTimeString());
      },
    );

    return () => unsubscribe();
  }, [tenantId]);

  return (
    <div
      data-testid="sync-test-panel"
      className="bg-surface border border-border rounded-lg p-6 max-w-md"
    >
      <p className="text-text-muted text-xs font-mono uppercase tracking-wider mb-4">
        Realtime Metrics Counter
      </p>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-text-muted text-sm">Leads Total (Today)</span>
          <span
            data-testid="leads-total"
            className="font-mono text-cyan text-2xl"
          >
            {leadsTotal}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-text-muted text-sm">Appointments Set</span>
          <span
            data-testid="appointments-set"
            className="font-mono text-cyan text-2xl"
          >
            {apptSet}
          </span>
        </div>
      </div>
      {lastEvent !== null && (
        <p
          data-testid="last-realtime-event"
          className="text-text-muted text-xs mt-4"
        >
          Last Realtime event: {lastEvent}
        </p>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { cn } from "../../lib/utils";
import type { TabsProps } from "./Tabs.types";
export type { TabsProps, Tab } from "./Tabs.types";

export function Tabs({ tabs, defaultTab, "data-testid": testId }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? "");

  const activeTab = tabs.find((t) => t.id === active);

  return (
    <div data-testid={testId}>
      <div className="flex border-b border-border" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            disabled={tab.disabled}
            onClick={() => setActive(tab.id)}
            className={cn(
              "px-4 py-2 font-display text-xs uppercase tracking-widest transition-all border-b-2 -mb-px",
              active === tab.id
                ? "border-cyan text-cyan"
                : "border-transparent text-text-muted hover:text-text",
              tab.disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div id={`tabpanel-${active}`} role="tabpanel" className="pt-4">
        {activeTab?.content}
      </div>
    </div>
  );
}

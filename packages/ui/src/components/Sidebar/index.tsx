"use client";
import { cn } from "../../lib/utils";
import type { SidebarProps } from "./Sidebar.types";
export type { SidebarProps, NavItem } from "./Sidebar.types";

export function Sidebar({
  items,
  collapsed = false,
  onToggle,
  logo,
  "data-testid": testId,
}: SidebarProps) {
  return (
    <aside
      data-testid={testId}
      className={cn(
        "flex flex-col h-full bg-surface border-r border-border transition-all duration-300",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      <div
        className={cn(
          "flex items-center h-16 px-4 border-b border-border",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && logo && <div className="overflow-hidden">{logo}</div>}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            data-testid="sidebar-toggle"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d={collapsed ? "M6 4l4 4-4 4" : "M10 4L6 8l4 4"}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="flex flex-col gap-1 px-2">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded px-2 py-2 transition-all",
                  "font-display text-xs uppercase tracking-widest",
                  item.active
                    ? "bg-cyan/10 text-cyan"
                    : "text-text-muted hover:text-text hover:bg-surface-hover",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.label : undefined}
                data-testid={`sidebar-item-${item.id}`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
                {!collapsed && item.badge !== undefined && (
                  <span className="ml-auto bg-cyan/20 text-cyan text-[10px] font-mono px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

"use client";
import { cn } from "../../lib/utils";
import type { DataTableProps } from "./DataTable.types";

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyState,
  pagination,
  onRowClick,
  "data-testid": testId,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto" data-testid={testId}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className="py-3 px-4 text-left font-display text-xs uppercase tracking-widest text-text-muted"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {columns.map((col) => (
                  <td key={col.key} className="py-3 px-4">
                    <div className="h-4 rounded bg-surface-hover animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-16 text-center text-text-muted font-body text-sm"
              >
                {emptyState ?? "No data"}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-border",
                  onRowClick && "cursor-pointer hover:bg-surface-hover transition-colors"
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                data-testid="data-table-row"
              >
                {columns.map((col) => (
                  <td key={col.key} className="py-3 px-4 font-mono text-sm text-text">
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="font-mono text-xs text-text-muted">{pagination.total} total</span>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-xs font-display uppercase tracking-widest text-text-muted border border-border rounded hover:border-cyan hover:text-cyan disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              className="px-3 py-1 text-xs font-display uppercase tracking-widest text-text-muted border border-border rounded hover:border-cyan hover:text-cyan disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { cn } from "../../lib/utils";
import type { EmptyStateProps } from "./EmptyState.types";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center text-center py-16 px-4", className)}
      {...props}
    >
      {icon && <div className="text-text-dim mb-4">{icon}</div>}
      <h3 className="font-display text-base uppercase tracking-widest text-text mt-4">
        {title}
      </h3>
      {description && (
        <p className="font-body text-sm text-text-muted mt-2 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

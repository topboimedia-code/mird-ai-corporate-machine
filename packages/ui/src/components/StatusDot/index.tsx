import { cn } from "../../lib/utils";
import type { StatusDotProps } from "./StatusDot.types";
export type { StatusDotProps, StatusDotColor } from "./StatusDot.types";

const colorStyles: Record<string, string> = {
  online: "bg-green",
  processing: "bg-cyan animate-pulse",
  "at-risk": "bg-orange",
  offline: "bg-red",
  standby: "bg-text-dim",
};

const sizeStyles: Record<string, string> = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-2.5 h-2.5",
};

export function StatusDot({
  status,
  size = "md",
  label,
  pulse,
  className,
  ...props
}: StatusDotProps) {
  return (
    <span
      className={cn("relative inline-flex", className)}
      aria-label={label ?? status}
      {...props}
    >
      <span className={cn("rounded-full", colorStyles[status], sizeStyles[size])} />
      {pulse && (
        <span
          className={cn(
            "absolute inset-0 rounded-full opacity-40 animate-ping",
            colorStyles[status]
          )}
        />
      )}
    </span>
  );
}

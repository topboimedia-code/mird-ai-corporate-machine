import { cn } from "../../lib/utils";
import type { ProgressBarProps } from "./ProgressBar.types";

const colorStyles: Record<string, string> = {
  cyan: "bg-cyan",
  green: "bg-green",
  orange: "bg-orange",
  red: "bg-red",
};

const sizeStyles: Record<string, string> = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

export function ProgressBar({
  value,
  max = 100,
  color = "cyan",
  size = "md",
  label,
  showValue = false,
  "data-testid": testId,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full" data-testid={testId}>
      {(label || showValue) && (
        <div className="flex justify-between mb-1">
          {label && <span className="font-body text-xs text-text-muted">{label}</span>}
          {showValue && (
            <span className="font-mono text-xs text-text-muted">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div className={cn("w-full rounded-full bg-surface-hover", sizeStyles[size])}>
        <div
          className={cn(
            "rounded-full transition-all duration-300",
            colorStyles[color],
            sizeStyles[size]
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}

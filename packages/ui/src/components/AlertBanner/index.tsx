"use client";
import { useState } from "react";
import { cn } from "../../lib/utils";
import type { AlertBannerProps } from "./AlertBanner.types";

const typeStyles: Record<string, { border: string; bg: string }> = {
  info: { border: "border-cyan", bg: "bg-cyan/5" },
  warning: { border: "border-orange", bg: "bg-orange/5" },
  error: { border: "border-red", bg: "bg-red/5" },
  success: { border: "border-green", bg: "bg-green/5" },
};

export function AlertBanner({
  type,
  title,
  description,
  action,
  dismissible = false,
  onDismiss,
  "data-testid": testId,
}: AlertBannerProps) {
  const [visible, setVisible] = useState(true);
  // typeStyles covers all AlertBannerType values — safe to assert
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { border, bg } = typeStyles[type]!;

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div
      data-testid={testId}
      className={cn(
        "w-full border-l-4 px-4 py-3 flex items-start gap-3 rounded-r",
        border,
        bg
      )}
      role="alert"
    >
      <div className="flex-1">
        <p className="font-display text-xs uppercase tracking-widest text-text">{title}</p>
        {description && (
          <p className="font-body text-xs text-text-muted mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-text-muted hover:text-text transition-colors"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 2l10 10M12 2L2 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

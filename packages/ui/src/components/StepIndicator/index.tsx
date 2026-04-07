import { cn } from "../../lib/utils";
import type { StepIndicatorProps, StepStatus } from "./StepIndicator.types";
export type { StepIndicatorProps, Step, StepStatus } from "./StepIndicator.types";

const circleStyles: Record<StepStatus, string> = {
  complete: "bg-cyan border-cyan",
  current:
    "border-cyan bg-background ring-2 ring-cyan ring-offset-2 ring-offset-background",
  upcoming: "border-border bg-background",
};

const labelStyles: Record<StepStatus, string> = {
  complete: "text-text",
  current: "text-cyan",
  upcoming: "text-text-muted",
};

export function StepIndicator({
  steps,
  orientation = "horizontal",
  "data-testid": testId,
}: StepIndicatorProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-row items-center gap-0" : "flex-col gap-0"
      )}
    >
      {steps.map((step, i) => (
        <div
          key={step.id}
          className={cn(
            "flex",
            orientation === "horizontal" ? "flex-row items-center" : "flex-col items-start"
          )}
        >
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                circleStyles[step.status]
              )}
              aria-label={`Step ${i + 1}: ${step.label} — ${step.status}`}
            >
              {step.status === "complete" ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2 7l4 4 6-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-background"
                  />
                </svg>
              ) : (
                <span
                  className={cn(
                    "font-mono text-xs",
                    step.status === "current" ? "text-cyan" : "text-text-muted"
                  )}
                >
                  {i + 1}
                </span>
              )}
            </div>
            <span
              className={cn("mt-2 font-body text-xs text-center", labelStyles[step.status])}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                orientation === "horizontal"
                  ? "h-px w-16 mx-2 mb-6"
                  : "w-px h-8 ml-4 mt-1",
                step.status === "complete" ? "bg-cyan" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

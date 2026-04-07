import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import type { BadgeProps } from "./Badge.types";

const colorSolid: Record<string, string> = {
  cyan: "bg-cyan/20 text-cyan",
  green: "bg-green/20 text-green",
  orange: "bg-orange/20 text-orange",
  red: "bg-red/20 text-red",
  gray: "bg-surface-hover text-text-muted",
};

const colorOutline: Record<string, string> = {
  cyan: "border border-cyan text-cyan",
  green: "border border-green text-green",
  orange: "border border-orange text-orange",
  red: "border border-red text-red",
  gray: "border border-border text-text-muted",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ color = "gray", variant = "solid", size = "sm", className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded font-display uppercase tracking-widest",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
          variant === "solid" ? colorSolid[color] : colorOutline[color],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";

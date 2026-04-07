import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import type { CardProps } from "./Card.types";

const variantStyles: Record<string, string> = {
  default: "bg-surface border border-border",
  elevated: "bg-surface border border-border shadow-card",
  outlined: "bg-transparent border border-border-hover",
};

const paddingStyles: Record<string, string> = {
  none: "",
  sm: "p-3",
  md: "p-6",
  lg: "p-8",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padding = "md", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg",
          variantStyles[variant],
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

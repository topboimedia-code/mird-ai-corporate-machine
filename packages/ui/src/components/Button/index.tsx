"use client";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import type { ButtonProps } from "./Button.types";

const variantStyles: Record<string, string> = {
  primary:
    "bg-cyan text-background hover:opacity-90 font-display uppercase tracking-widest text-xs",
  secondary:
    "border border-cyan text-cyan hover:bg-cyan/10 font-display uppercase tracking-widest text-xs",
  ghost: "text-text-muted hover:text-text hover:bg-surface-hover font-body",
  danger:
    "bg-red text-white hover:opacity-90 font-display uppercase tracking-widest text-xs",
};

const sizeStyles: Record<string, string> = {
  sm: "h-7 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

function Spinner({ size }: { size: number }) {
  return (
    <svg
      aria-hidden="true"
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <Spinner size={size === "lg" ? 18 : 14} />
        ) : leftIcon ? (
          leftIcon
        ) : null}
        {children}
        {!loading && rightIcon ? rightIcon : null}
      </button>
    );
  }
);
Button.displayName = "Button";

"use client";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import type { InputProps } from "./Input.types";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, leftIcon, rightIcon, fullWidth, className, id, ...props },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="font-display text-xs uppercase tracking-widest text-text-muted"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-text-muted">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded border bg-surface text-text font-body text-sm",
              "border-border placeholder:text-text-dim",
              "px-3 py-2",
              "focus:outline-none focus:ring-1 focus:ring-cyan focus:border-cyan",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              error && "border-red focus:ring-red focus:border-red",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-text-muted">{rightIcon}</span>
          )}
        </div>
        {error && <p className="text-xs text-red font-body">{error}</p>}
        {hint && !error && <p className="text-xs text-text-muted font-body">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

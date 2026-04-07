import type { HTMLAttributes } from "react";

export type BadgeColor = "cyan" | "green" | "orange" | "red" | "gray";
export type BadgeVariant = "solid" | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

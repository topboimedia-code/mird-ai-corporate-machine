import type { HTMLAttributes } from "react";

export type CardVariant = "default" | "elevated" | "outlined";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
}

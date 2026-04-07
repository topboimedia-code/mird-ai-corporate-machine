import type { HTMLAttributes } from "react";

export type StatusDotColor = "online" | "processing" | "at-risk" | "offline" | "standby";

export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  status: StatusDotColor;
  size?: "sm" | "md" | "lg";
  label?: string;
  pulse?: boolean;
}

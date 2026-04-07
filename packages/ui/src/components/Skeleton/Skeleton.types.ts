import type { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "rect" | "text" | "circle";
  width?: number | string;
  height?: number | string;
  lines?: number;
  animate?: boolean;
}

import type { ReactNode } from "react";

export type AlertBannerType = "info" | "warning" | "error" | "success";

export interface AlertBannerProps {
  type: AlertBannerType;
  title: string;
  description?: string;
  action?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  "data-testid"?: string;
}

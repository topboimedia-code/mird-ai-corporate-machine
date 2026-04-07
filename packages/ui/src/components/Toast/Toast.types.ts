import type { ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

export interface UseToastReturn {
  toast: (opts: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

export interface ToastProviderProps {
  children: ReactNode;
}

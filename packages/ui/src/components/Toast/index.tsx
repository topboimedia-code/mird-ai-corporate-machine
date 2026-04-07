"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "../../lib/utils";
import type { Toast, ToastType, ToastProviderProps, UseToastReturn } from "./Toast.types";

const ToastContext = createContext<UseToastReturn | null>(null);

const borderColors: Record<ToastType, string> = {
  success: "border-l-green",
  error: "border-l-red",
  warning: "border-l-orange",
  info: "border-l-cyan",
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((opts: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    const duration = opts.duration ?? 4000;
    setToasts((prev) => [...prev, { ...opts, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        data-testid="toast-container"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            data-testid={`toast-${t.type}`}
            className={cn(
              "w-80 rounded bg-surface border border-border border-l-4 p-4 shadow-card animate-slide-up",
              borderColors[t.type]
            )}
          >
            <p className="font-display text-xs uppercase tracking-widest text-text">
              {t.title}
            </p>
            {t.description && (
              <p className="font-body text-xs text-text-muted mt-1">{t.description}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): UseToastReturn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

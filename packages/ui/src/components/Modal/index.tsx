"use client";
import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import type { ModalProps } from "./Modal.types";

const sizeStyles: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlayClick = true,
  "data-testid": testId,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      data-testid={testId}
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={cn(
          "relative z-50 w-full rounded-lg bg-surface border border-border shadow-card animate-slide-up",
          "p-6 mx-4",
          sizeStyles[size]
        )}
      >
        {title && (
          <h2
            id="modal-title"
            className="font-display text-sm uppercase tracking-widest text-text mb-4"
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}

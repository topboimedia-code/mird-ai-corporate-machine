"use client";
import { Modal } from "../Modal";

export interface SessionExpiryModalProps {
  open: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

export function SessionExpiryModal({
  open,
  onRefresh,
  onLogout,
}: SessionExpiryModalProps) {
  return (
    <Modal open={open} onClose={onLogout} title="SESSION EXPIRED" size="sm">
      <div className="flex flex-col gap-6">
        <p className="font-body text-sm text-text-muted">
          Your session has timed out. Please log in again to continue.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onLogout}
            className="font-display text-xs uppercase tracking-widest text-text-muted hover:text-text transition-colors px-3 py-2"
            data-testid="session-logout-button"
          >
            LOG OUT
          </button>
          <button
            onClick={onRefresh}
            className="font-display text-xs uppercase tracking-widest bg-cyan text-background px-4 py-2 rounded hover:opacity-90 transition-opacity"
            data-testid="session-refresh-button"
          >
            REFRESH SESSION
          </button>
        </div>
      </div>
    </Modal>
  );
}

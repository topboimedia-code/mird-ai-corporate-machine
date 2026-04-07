"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <p className="font-display text-[--color-status-warning] text-7xl font-black">
        500
      </p>
      <p className="font-body text-text-muted mt-4 text-sm">
        {error.message || "Something went wrong."}
      </p>
      <button
        onClick={reset}
        className="mt-6 font-display text-xs uppercase tracking-widest text-cyan border border-[--color-cyan-primary] px-4 py-2 rounded hover:bg-[--color-cyan-muted] transition-colors"
        data-testid="retry-button"
      >
        RETRY
      </button>
    </main>
  );
}

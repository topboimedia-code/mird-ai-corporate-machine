export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <p className="font-display text-[--color-status-warning] text-xl uppercase tracking-widest">
        MAINTENANCE IN PROGRESS
      </p>
      <p className="font-body text-text-muted mt-4 text-sm max-w-xs text-center">
        We are currently performing scheduled maintenance. We will be back
        shortly.
      </p>
    </main>
  );
}

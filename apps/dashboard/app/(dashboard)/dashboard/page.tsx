export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background p-8">
      <h1
        className="font-display text-cyan text-2xl uppercase tracking-widest"
        data-testid="dashboard-heading"
      >
        DASHBOARD
      </h1>
      <p className="font-body text-text-muted mt-2 text-sm">
        Cycle 1 placeholder — full dashboard ships in Cycle 4 (F07).
      </p>
    </main>
  );
}

// apps/dashboard/app/page.tsx
// Purpose: Proves the dashboard app boots. Replaced when F07 ships.
// No data fetching. No client components. Pure RSC.

export default function RootPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050D1A",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1
        data-testid="rainmachine-heading"
        style={{
          color: "#00D4FF",
          fontSize: "2rem",
          letterSpacing: "0.2em",
          margin: 0,
        }}
      >
        RainMachine
      </h1>
    </main>
  );
}

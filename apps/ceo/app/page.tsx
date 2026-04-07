export default function CeoRootPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050D1A",
      }}
    >
      <h1
        data-testid="ceo-heading"
        style={{
          color: "#00D4FF",
          fontSize: "2rem",
          letterSpacing: "0.2em",
          fontFamily: "system-ui, sans-serif",
          margin: 0,
        }}
      >
        CEO Dashboard
      </h1>
    </main>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <p className="font-display text-cyan text-7xl font-black">404</p>
      <p className="font-body text-text-muted mt-4 text-sm">Page not found.</p>
      <Link
        href="/"
        className="mt-6 font-display text-xs uppercase tracking-widest text-cyan hover:opacity-80 transition-opacity"
      >
        GO HOME
      </Link>
    </main>
  );
}

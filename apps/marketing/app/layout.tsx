import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Make It Rain Digital",
  description: "AI-powered client acquisition for real estate team leaders",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

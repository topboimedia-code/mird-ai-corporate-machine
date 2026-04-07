import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RainMachine Onboarding",
  description: "Get your RainMachine set up and running",
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

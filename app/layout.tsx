import type { Metadata } from "next";
import "./globals.css";
import "@/styles/hologram.css";

export const metadata: Metadata = {
  title: "HoloCodex Deck",
  description: "Local holographic control deck for Codex-style agent workflows."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

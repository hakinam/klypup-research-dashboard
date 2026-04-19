import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Klypup Research Dashboard",
  description: "AI-powered investment research platform",
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
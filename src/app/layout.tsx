import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas Talent",
  description: "The applicant tracking system for TM Systems Pvt. Ltd.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg font-sans text-ink">{children}</body>
    </html>
  );
}

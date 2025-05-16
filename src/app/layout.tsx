// NO "use client" here at all

import type { Metadata } from "next";
import "./globals.css";
import "./common.css";

export const metadata: Metadata = {
  title: "Placecom Interviewer",
  description: "An Interviewer from Placecom",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-cursorstyle="true" data-effect-ective="true">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

import "./globals.css";
import type { ReactNode } from "react";
import { QueryProvider } from "../lib/query-provider";

export const metadata = {
  title: "LokSaarthi",
  description:
    "AI-powered civic access, scheme discovery and learning platform for Bharat."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <QueryProvider>
          <div className="max-w-4xl mx-auto px-4 py-4">{children}</div>
        </QueryProvider>
      </body>
    </html>
  );
}


import "./globals.css";
import type { ReactNode } from "react";
import { QueryProvider } from "../lib/query-provider";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "JanSaarthi",
  description:
    "AI-powered civic access, scheme discovery and learning platform for Bharat."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-700">
        <QueryProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}


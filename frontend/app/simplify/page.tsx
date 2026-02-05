"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Simple redirect so both /upload and /simplify work as entry points
export default function SimplifyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/upload");
  }, [router]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <h1 className="text-xl font-semibold">Document Simplifier</h1>
      <p className="text-sm text-slate-700">
        Redirecting to the main simplifier page…
      </p>
    </div>
  );
}


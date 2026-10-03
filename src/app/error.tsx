"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-bold text-white tracking-tight">Something went wrong</h2>
        <p className="text-xs text-slate-400">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try Again
        </button>
        <Link
          href="/"
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all flex items-center gap-2 border border-slate-700"
        >
          <Home className="w-3.5 h-3.5" /> Return Home
        </Link>
      </div>
    </div>
  );
}

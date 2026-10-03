import Link from "next/link";
import { Tv, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
        <Tv className="w-8 h-8" />
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">404 — Room or Page Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested room or page does not exist or may have been closed.
        </p>
      </div>

      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-2"
      >
        <Home className="w-4 h-4" /> Return to Watch Party Home
      </Link>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded-2xl border-2 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center">
        <div className="w-6 h-6 rounded-xl bg-indigo-600/30"></div>
      </div>
      <p className="text-xs font-medium text-slate-400 animate-pulse">Loading Watch Party...</p>
    </div>
  );
}

/**
 * Loading skeleton for /floor-plan
 * Shown by Next.js while the page chunk is streaming in.
 * No 'use client' needed — this is a static skeleton.
 */

export default function FloorPlanLoading() {
  return (
    <div className="w-full h-screen flex flex-col bg-slate-950 animate-pulse">

      {/* Toolbar skeleton */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-3">
        <div className="w-36 h-7 bg-slate-700 rounded" />
        <div className="w-px h-6 bg-slate-700" />
        <div className="w-14 h-7 bg-slate-700 rounded" />
        <div className="w-14 h-7 bg-slate-700 rounded" />
        <div className="ml-auto w-20 h-7 bg-orange-900/40 rounded" />
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar skeleton */}
        <div className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-3">
          <div className="w-9 h-9 bg-orange-800/40 rounded-lg" />
          <div className="w-8 h-px bg-slate-700" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-10 h-10 bg-slate-700/60 rounded-lg" />
          ))}
        </div>

        {/* Canvas skeleton */}
        <div className="flex-1 bg-white relative overflow-hidden">
          {/* Grid dots pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="1" fill="#94a3b8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Centre loading indicator */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-orange-400 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading Floor Plan Designer…</p>
          </div>
        </div>

        {/* Properties panel skeleton */}
        <div className="w-64 bg-slate-800 border-l border-slate-700 p-4 flex flex-col gap-4">
          <div className="h-5 bg-slate-700 rounded w-24" />
          <div className="h-px bg-slate-700" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 bg-slate-700 rounded w-16" />
              <div className="h-8 bg-slate-700/60 rounded w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Status bar skeleton */}
      <div className="h-6 bg-slate-900 border-t border-slate-800 flex items-center px-4 gap-4">
        <div className="w-24 h-3 bg-slate-700 rounded" />
        <div className="w-16 h-3 bg-slate-700 rounded" />
      </div>
    </div>
  );
}

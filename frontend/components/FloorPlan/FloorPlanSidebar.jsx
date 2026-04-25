'use client';

/**
 * FloorPlanSidebar — left icon rail for tool selection
 * Each button shows an SVG icon + label underneath.
 * Active tool is highlighted orange.
 */

const TOOLS = [
  {
    id: 'select',
    label: 'Select',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M5 3l14 9-7 2-3 7L5 3z" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'room',
    label: 'Room',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="1" />
      </svg>
    ),
  },
  {
    id: 'wall',
    label: 'Wall',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <line x1="4" y1="20" x2="20" y2="4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'door',
    label: 'Door',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="4" y="4" width="10" height="16" rx="1" />
        {/* Arc indicating swing */}
        <path d="M4 20 Q4 12 12 12" strokeDasharray="3 2" />
      </svg>
    ),
  },
  {
    id: 'window',
    label: 'Window',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="9" width="18" height="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
  {
    id: 'eraser',
    label: 'Eraser',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M20 20H7L3 16l11-11 6 6-5 5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="6" y1="17" x2="9" y2="14" />
      </svg>
    ),
  },
];

export default function FloorPlanSidebar({ tool, setTool }) {
  return (
    <aside className="w-16 bg-slate-900 border-r border-slate-700 flex flex-col items-center py-3 gap-1 z-10">
      {/* App logo / home link */}
      <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center mb-3">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-slate-700 mb-2" />

      {/* Tool buttons */}
      {TOOLS.map(({ id, label, icon }) => {
        const active = tool === id;
        return (
          <button
            key={id}
            onClick={() => setTool(id)}
            title={label}
            className={`
              w-12 flex flex-col items-center gap-0.5 p-2 rounded-lg cursor-pointer
              transition-all select-none
              ${active
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'}
            `}
          >
            {icon}
            <span className="text-[9px] font-medium leading-none mt-0.5">{label}</span>
          </button>
        );
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Keyboard hint */}
      <div className="text-slate-600 text-[8px] text-center px-1 pb-1 leading-tight">
        Del<br />delete<br />⎵ pan
      </div>
    </aside>
  );
}

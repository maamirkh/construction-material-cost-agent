'use client';

/**
 * FloorPlanPreview — displays the Stable Diffusion generated blueprint image.
 *
 * Props:
 *   floorPlan  — full API response object:
 *                { image_base64, layout, prompt_used, model_used, generation_time_ms, cached }
 *   className  — optional extra CSS classes
 */

const pxToFt = (px) => Math.round(px / 10);

// ─── Room legend from layout JSON ────────────────────────────
function RoomLegend({ layout }) {
  if (!layout?.rooms?.length) return null;

  const COLOR_MAP = {
    bedroom:          '#dbeafe',
    bathroom:         '#dcfce7',
    kitchen:          '#fef9c3',
    lounge:           '#fce7f3',
    'drawing room':   '#fde68a',
    dining:           '#ede9fe',
    'store room':     '#f1f5f9',
    'servant quarter':'#e0f2fe',
    veranda:          '#ecfdf5',
    garage:           '#f8fafc',
    staircase:        '#fff7ed',
  };

  // Count by type
  const counts = {};
  layout.rooms.forEach(r => {
    const t = (r.type || 'other').toLowerCase();
    counts[t] = (counts[t] || 0) + (r.count || 1);
  });

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {Object.entries(counts).map(([type, count]) => (
        <div key={type} className="flex items-center gap-1.5 text-xs text-slate-400">
          <span
            className="w-3 h-3 rounded-sm border border-slate-500/50 shrink-0"
            style={{ background: COLOR_MAP[type] || '#f1f5f9' }}
          />
          <span className="capitalize">{type}{count > 1 ? ` ×${count}` : ''}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function FloorPlanPreview({ floorPlan, className = '' }) {
  if (!floorPlan) return null;

  const {
    image_base64,
    layout        = {},
    model_used    = '',
    cached        = false,
  } = floorPlan;

  const imgSrc    = `data:image/png;base64,${image_base64}`;
  const plotW     = layout.plot_width  || '—';
  const plotH     = layout.plot_height || '—';
  const roomCount = layout.rooms?.length ?? 0;
  const plotArea  = typeof plotW === 'number' && typeof plotH === 'number'
    ? (plotW * plotH).toLocaleString()
    : '—';

  return (
    <div className={`space-y-3 ${className}`}>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-900 rounded-lg py-2">
          <div className="text-orange-400 font-bold text-sm">{plotW}×{plotH}′</div>
          <div className="text-slate-500 text-xs">Plot size</div>
        </div>
        <div className="bg-slate-900 rounded-lg py-2">
          <div className="text-blue-400 font-bold text-sm">{roomCount}</div>
          <div className="text-slate-500 text-xs">Rooms</div>
        </div>
        <div className="bg-slate-900 rounded-lg py-2">
          <div className="text-green-400 font-bold text-sm">{plotArea} ft²</div>
          <div className="text-slate-500 text-xs">Total area</div>
        </div>
      </div>

      {/* Blueprint image */}
      <div className="rounded-lg border border-slate-600 overflow-hidden bg-white">
        <img
          src={imgSrc}
          alt="AI generated floor plan blueprint"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>

      {/* Model + cache badge */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>{model_used}</span>
        {cached && (
          <span className="bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
            cached
          </span>
        )}
      </div>

      {/* Room legend */}
      <RoomLegend layout={layout} />
    </div>
  );
}

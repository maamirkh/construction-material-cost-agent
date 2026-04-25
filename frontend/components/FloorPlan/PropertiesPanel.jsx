'use client';

/**
 * PropertiesPanel — right-hand properties editor
 * Shows editable fields for the currently selected element.
 * Room: name, type, color, dimensions
 * Wall: length (read-only)
 * Door / Window: position, angle
 */

const ROOM_TYPES = [
  { value: 'living',    label: 'Living Room' },
  { value: 'bedroom',   label: 'Bedroom' },
  { value: 'bathroom',  label: 'Bathroom' },
  { value: 'kitchen',   label: 'Kitchen' },
  { value: 'dining',    label: 'Dining Room' },
  { value: 'garage',    label: 'Garage' },
  { value: 'balcony',   label: 'Balcony / Terrace' },
  { value: 'store',     label: 'Store Room' },
  { value: 'stairs',    label: 'Staircase' },
  { value: 'other',     label: 'Other' },
];

// Palette of room fill colours
const COLOURS = [
  '#fef3c7', // amber-100
  '#dbeafe', // blue-100
  '#dcfce7', // green-100
  '#fce7f3', // pink-100
  '#ede9fe', // violet-100
  '#ffedd5', // orange-100
  '#e0f2fe', // sky-100
  '#f0fdf4', // emerald-50
  '#faf5ff', // purple-50
  '#fff7ed', // orange-50
];

const GRID = 50; // world px per metre

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-slate-400 text-xs mb-1 font-medium uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = 'text', step, min, className = '' }) {
  return (
    <input
      type={type}
      value={value}
      step={step}
      min={min}
      onChange={onChange}
      className={`w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5
                  text-white text-sm focus:outline-none focus:border-orange-500 transition-colors ${className}`}
    />
  );
}

export default function PropertiesPanel({ state, dispatch }) {
  const { selectedId, rooms, walls, doors, windows } = state;

  // Find selected element
  const room   = rooms.find(r => r.id === selectedId);
  const wall   = walls.find(w => w.id === selectedId);
  const door   = doors.find(d => d.id === selectedId);
  const window_ = windows.find(w => w.id === selectedId);

  const selected = room || wall || door || window_;

  const update = (u) =>
    dispatch({ type: 'UPDATE', id: selectedId, u });

  const deleteEl = () =>
    dispatch({ type: 'DELETE', payload: selectedId });

  // Empty state
  if (!selected) {
    return (
      <aside className="w-64 bg-slate-800 border-l border-slate-700 flex flex-col p-4 shrink-0">
        <h2 className="text-slate-300 font-semibold text-sm mb-3">Properties</h2>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <svg viewBox="0 0 24 24" className="w-10 h-10 text-slate-600 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6M9 13h4" strokeLinecap="round" />
          </svg>
          <p className="text-slate-500 text-xs leading-relaxed">
            Select an element on the canvas to edit its properties.
          </p>
        </div>

        {/* Summary counts */}
        <div className="mt-auto border-t border-slate-700 pt-3 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Rooms</span><span className="text-white font-medium">{rooms.length}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Walls</span><span className="text-white font-medium">{walls.length}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Doors</span><span className="text-white font-medium">{doors.length}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Windows</span><span className="text-white font-medium">{windows.length}</span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-slate-800 border-l border-slate-700 flex flex-col shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-slate-200 font-semibold text-sm capitalize">
          {room ? (room.name || 'Room') : wall ? 'Wall' : door ? 'Door' : 'Window'}
        </h2>
        <span className="text-slate-500 text-xs bg-slate-700 px-2 py-0.5 rounded-full capitalize">
          {room ? 'room' : wall ? 'wall' : door ? 'door' : 'window'}
        </span>
      </div>

      <div className="p-4 flex-1">

        {/* ── ROOM ─────────────────────────────────────────── */}
        {room && (
          <>
            <Field label="Room Name">
              <Input
                value={room.name || ''}
                onChange={e => update({ name: e.target.value })}
                placeholder="e.g. Master Bedroom"
              />
            </Field>

            <Field label="Room Type">
              <select
                value={room.type || 'living'}
                onChange={e => update({ type: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5
                           text-white text-sm focus:outline-none focus:border-orange-500"
              >
                {ROOM_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Fill Color">
              <div className="flex flex-wrap gap-1.5">
                {COLOURS.map(c => (
                  <button
                    key={c}
                    onClick={() => update({ color: c })}
                    style={{ background: c }}
                    className={`w-6 h-6 rounded border-2 transition-all
                      ${room.color === c
                        ? 'border-orange-400 scale-110'
                        : 'border-slate-600 hover:border-slate-400'}`}
                  />
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Width (m)">
                <Input
                  type="number"
                  value={+(room.w / 50).toFixed(2)}
                  step="0.5"
                  min="0.5"
                  onChange={e => update({ w: parseFloat(e.target.value) * GRID })}
                />
              </Field>
              <Field label="Height (m)">
                <Input
                  type="number"
                  value={+(room.h / 50).toFixed(2)}
                  step="0.5"
                  min="0.5"
                  onChange={e => update({ h: parseFloat(e.target.value) * GRID })}
                />
              </Field>
            </div>

            <Field label="Area">
              <div className="bg-slate-700/50 rounded px-2 py-2 text-slate-300 text-sm">
                <div>{((room.w / GRID) * (room.h / GRID)).toFixed(2)} m²</div>
                <div className="text-slate-400 text-xs">
                  {((room.w / GRID) * (room.h / GRID) * 10.764).toFixed(1)} ft²
                </div>
              </div>
            </Field>
          </>
        )}

        {/* ── WALL ─────────────────────────────────────────── */}
        {wall && (
          <>
            <Field label="Length">
              <div className="bg-slate-700/50 rounded px-2 py-2 text-slate-300 text-sm">
                {(Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1) / GRID).toFixed(2)} m
              </div>
            </Field>
            <Field label="Start (m)">
              <div className="grid grid-cols-2 gap-1">
                <Input
                  type="number"
                  value={+(wall.x1 / GRID).toFixed(2)}
                  step="0.5"
                  onChange={e => update({ x1: parseFloat(e.target.value) * GRID })}
                />
                <Input
                  type="number"
                  value={+(wall.y1 / GRID).toFixed(2)}
                  step="0.5"
                  onChange={e => update({ y1: parseFloat(e.target.value) * GRID })}
                />
              </div>
            </Field>
            <Field label="End (m)">
              <div className="grid grid-cols-2 gap-1">
                <Input
                  type="number"
                  value={+(wall.x2 / GRID).toFixed(2)}
                  step="0.5"
                  onChange={e => update({ x2: parseFloat(e.target.value) * GRID })}
                />
                <Input
                  type="number"
                  value={+(wall.y2 / GRID).toFixed(2)}
                  step="0.5"
                  onChange={e => update({ y2: parseFloat(e.target.value) * GRID })}
                />
              </div>
            </Field>
          </>
        )}

        {/* ── DOOR ─────────────────────────────────────────── */}
        {door && (
          <>
            <Field label="Position (m)">
              <div className="grid grid-cols-2 gap-1">
                <Input
                  type="number"
                  value={+(door.x / GRID).toFixed(2)}
                  step="0.5"
                  onChange={e => update({ x: parseFloat(e.target.value) * GRID })}
                />
                <Input
                  type="number"
                  value={+(door.y / GRID).toFixed(2)}
                  step="0.5"
                  onChange={e => update({ y: parseFloat(e.target.value) * GRID })}
                />
              </div>
            </Field>
            <Field label="Rotation (°)">
              <Input
                type="number"
                value={Math.round((door.angle || 0) * (180 / Math.PI))}
                step="15"
                onChange={e => update({ angle: parseFloat(e.target.value) * (Math.PI / 180) })}
              />
            </Field>
          </>
        )}

        {/* ── WINDOW ───────────────────────────────────────── */}
        {window_ && (
          <>
            <Field label="Position (m)">
              <div className="grid grid-cols-2 gap-1">
                <Input
                  type="number"
                  value={+(window_.x / GRID).toFixed(2)}
                  step="0.5"
                  onChange={e => update({ x: parseFloat(e.target.value) * GRID })}
                />
                <Input
                  type="number"
                  value={+(window_.y / GRID).toFixed(2)}
                  step="0.5"
                  onChange={e => update({ y: parseFloat(e.target.value) * GRID })}
                />
              </div>
            </Field>
            <Field label="Width (m)">
              <Input
                type="number"
                value={+(( window_.width || 30) / GRID).toFixed(2)}
                step="0.5"
                min="0.5"
                onChange={e => update({ width: parseFloat(e.target.value) * GRID })}
              />
            </Field>
            <Field label="Rotation (°)">
              <Input
                type="number"
                value={Math.round((window_.angle || 0) * (180 / Math.PI))}
                step="15"
                onChange={e => update({ angle: parseFloat(e.target.value) * (Math.PI / 180) })}
              />
            </Field>
          </>
        )}
      </div>

      {/* Delete button */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={deleteEl}
          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium
                     rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Delete Element
        </button>
        <p className="text-slate-600 text-xs text-center mt-1">or press Delete key</p>
      </div>
    </aside>
  );
}

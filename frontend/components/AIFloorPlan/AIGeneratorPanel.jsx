'use client';

/**
 * AIGeneratorPanel — slide-in drawer for AI floor plan generation.
 *
 * Props:
 *   onPlanReady(canvasState)  — called when user clicks "Load in Floor Planner"
 *                               receives a canvas-format state object ready to
 *                               dispatch({ type: 'RESTORE', payload: canvasState })
 *   onClose()                 — called to close the drawer
 *
 * Internal flow:
 *   1. User fills the form
 *   2. "Generate" → calls useAIGeneration.generateFloorPlan()
 *   3. Shows cycling loading messages + spinner
 *   4. On success: shows FloorPlanPreview + action buttons
 *   5. "Load in Floor Planner" → converts AI JSON → canvas format → calls onPlanReady()
 */

import { useState, useCallback } from 'react';
import { useAIGeneration } from './useAIGeneration';
import FloorPlanPreview   from './FloorPlanPreview';

// ─── Room configuration ────────────────────────────────────────
const ROOM_CONFIGS = [
  { type: 'bedroom',          label: 'Bedroom',          max: 5, default: 2, checked: true  },
  { type: 'bathroom',         label: 'Bathroom',         max: 4, default: 1, checked: true  },
  { type: 'kitchen',          label: 'Kitchen',          max: 2, default: 1, checked: true  },
  { type: 'lounge',           label: 'Lounge',           max: 1, default: 1, checked: true  },
  { type: 'drawing room',     label: 'Drawing Room',     max: 1, default: 1, checked: false },
  { type: 'dining',           label: 'Dining Room',      max: 1, default: 1, checked: false },
  { type: 'store room',       label: 'Store Room',       max: 2, default: 1, checked: false },
  { type: 'servant quarter',  label: 'Servant Quarter',  max: 2, default: 1, checked: false },
  { type: 'veranda',          label: 'Veranda / Porch',  max: 1, default: 1, checked: false },
  { type: 'garage',           label: 'Garage',           max: 1, default: 1, checked: false },
];

const STYLES = [
  'Pakistani Traditional',
  'Modern Pakistani',
  'Contemporary',
  'Minimalist',
  'Classic',
];

// Build default room state from configs
function defaultRoomState() {
  const state = {};
  ROOM_CONFIGS.forEach(rc => {
    state[rc.type] = { checked: rc.checked, count: rc.default };
  });
  return state;
}

// ─── Small reusable sub-components ────────────────────────────

function Label({ children }) {
  return (
    <label className="text-slate-400 text-xs mb-1 block uppercase tracking-wide font-medium">
      {children}
    </label>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 w-full
                  focus:border-orange-500 focus:outline-none transition-colors text-sm ${className}`}
      {...props}
    />
  );
}

function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 w-full
                  focus:border-orange-500 focus:outline-none transition-colors text-sm ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

// ─── Loading overlay ───────────────────────────────────────────
function LoadingState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      {/* Multi-ring spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-slate-700 rounded-full" />
        <div className="absolute inset-0 border-4 border-t-orange-500 border-r-transparent
                        border-b-transparent border-l-transparent rounded-full animate-spin" />
        <div className="absolute inset-2 border-4 border-t-transparent border-r-blue-400
                        border-b-transparent border-l-transparent rounded-full animate-spin"
             style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        {/* AI icon in the middle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-orange-400" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
        </div>
      </div>

      {/* Cycling message */}
      <div className="text-center">
        <p className="text-white font-medium text-sm">{message}</p>
        <p className="text-slate-500 text-xs mt-1">Calculating your floor plan layout…</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Error state ───────────────────────────────────────────────
function ErrorState({ error, onRetry }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-2">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none"
             stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9"  y1="9" x2="15" y2="15" />
        </svg>
        <div>
          <p className="text-red-400 font-medium text-sm">Generation failed</p>
          <p className="text-red-300/70 text-xs mt-1 font-mono leading-relaxed break-all">{error}</p>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm
                   rounded-lg border border-red-500/30 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

// ─── Main panel ────────────────────────────────────────────────
export default function AIGeneratorPanel({ onPlanReady, onClose = null }) {
  // Form state
  const [plotWidth,   setPlotWidth]   = useState(40);
  const [plotHeight,  setPlotHeight]  = useState(60);
  const [floors,      setFloors]      = useState(1);
  const [rooms,       setRooms]       = useState(defaultRoomState);
  const [style,       setStyle]       = useState('Pakistani Traditional');
  const [extraNotes,  setExtraNotes]  = useState('');

  // AI generation hook
  const {
    isLoading, error, generatedPlan, generationTime,
    loadingMessage, generateFloorPlan, resetGeneration,
  } = useAIGeneration();

  // ── Room checkbox / count handlers ────────────────────────
  const toggleRoom = useCallback((type) => {
    setRooms(prev => ({
      ...prev,
      [type]: { ...prev[type], checked: !prev[type].checked },
    }));
  }, []);

  const setRoomCount = useCallback((type, count) => {
    setRooms(prev => ({
      ...prev,
      [type]: { ...prev[type], count: Number(count) },
    }));
  }, []);

  // ── Build request body and call API ───────────────────────
  const handleGenerate = useCallback(() => {
    const selectedRooms = ROOM_CONFIGS
      .filter(rc => rooms[rc.type]?.checked)
      .map(rc => ({ type: rc.type, count: rooms[rc.type].count }));

    if (selectedRooms.length === 0) {
      alert('Please select at least one room type.');
      return;
    }

    generateFloorPlan({
      plot_width:  Number(plotWidth),
      plot_height: Number(plotHeight),
      floors:      Number(floors),
      rooms:       selectedRooms,
      style,
      extra_notes: extraNotes.trim(),
    });
  }, [plotWidth, plotHeight, floors, rooms, style, extraNotes, generateFloorPlan]);

  // ── Download PNG ───────────────────────────────────────────
  const handleDownloadPNG = useCallback(() => {
    if (!generatedPlan?.image_base64) return;
    const a   = document.createElement('a');
    a.href     = `data:image/png;base64,${generatedPlan.image_base64}`;
    a.download = 'floor-plan.png';
    a.click();
  }, [generatedPlan]);

  // ── Download PDF (print dialog) ────────────────────────────
  const handleDownloadPDF = useCallback(() => {
    if (!generatedPlan?.image_base64) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Floor Plan</title>
      <style>
        body { margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#fff; }
        img  { max-width:100%; max-height:100vh; }
        @media print { body { margin:0; } }
      </style></head>
      <body>
        <img src="data:image/png;base64,${generatedPlan.image_base64}" alt="Floor Plan"/>
        <script>window.onload = () => { window.print(); }<\/script>
      </body></html>
    `);
    win.document.close();
  }, [generatedPlan]);

  const hasResult = !!generatedPlan?.image_base64;

  return (
    /* ── Drawer container ────────────────────────────────── */
    <div className="flex flex-col h-full bg-slate-800 border-r border-slate-700
                    w-[420px] shrink-0 overflow-hidden">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4
                      border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Sparkle icon */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-purple-600
                          flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm leading-none">AI Floor Plan</h2>
            <p className="text-slate-500 text-xs mt-0.5">Llama 3 + Stable Diffusion</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
            title="Close panel"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6"  y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Scrollable body ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* Loading state — replaces form while generating */}
        {isLoading && <LoadingState message={loadingMessage} />}

        {/* Error state */}
        {!isLoading && error && (
          <ErrorState error={error} onRetry={resetGeneration} />
        )}

        {/* ── FORM (hidden while loading or showing result) ── */}
        {!isLoading && !hasResult && !error && (
          <>
            {/* ── Plot Dimensions ─────────────────────────── */}
            <section>
              <p className="text-slate-300 text-xs font-medium mb-3 uppercase tracking-wide">
                Plot Dimensions
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Width (feet)</Label>
                  <Input
                    type="number"
                    value={plotWidth}
                    min={20} max={200}
                    onChange={e => setPlotWidth(e.target.value)}
                    placeholder="e.g. 40"
                  />
                </div>
                <div>
                  <Label>Depth (feet)</Label>
                  <Input
                    type="number"
                    value={plotHeight}
                    min={20} max={300}
                    onChange={e => setPlotHeight(e.target.value)}
                    placeholder="e.g. 60"
                  />
                </div>
              </div>
            </section>

            {/* ── Floors ──────────────────────────────────── */}
            <section>
              <Label>Number of Floors</Label>
              <Select value={floors} onChange={e => setFloors(e.target.value)}>
                <option value={1}>Ground Floor (1 Floor)</option>
                <option value={2}>Ground + First (2 Floors)</option>
                <option value={3}>3 Floors</option>
              </Select>
            </section>

            {/* ── Room Requirements ───────────────────────── */}
            <section>
              <p className="text-slate-300 text-xs font-medium mb-3 uppercase tracking-wide">
                Rooms to Include
              </p>
              <div className="space-y-2">
                {ROOM_CONFIGS.map(rc => {
                  const isChecked = rooms[rc.type]?.checked ?? false;
                  const count     = rooms[rc.type]?.count   ?? rc.default;
                  return (
                    <div
                      key={rc.type}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5
                                  border transition-colors cursor-pointer
                                  ${isChecked
                                    ? 'bg-orange-500/10 border-orange-500/40'
                                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}
                      onClick={() => toggleRoom(rc.type)}
                    >
                      {/* Checkbox + label */}
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center
                                         shrink-0 transition-colors
                                         ${isChecked
                                           ? 'bg-orange-500 border-orange-500'
                                           : 'border-slate-500'}`}>
                          {isChecked && (
                            <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="none"
                                 stroke="currentColor" strokeWidth={3}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm ${isChecked ? 'text-white' : 'text-slate-400'}`}>
                          {rc.label}
                        </span>
                      </div>

                      {/* Count selector (only when checked) */}
                      {isChecked && (
                        <div
                          className="flex items-center gap-1"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setRoomCount(rc.type, Math.max(1, count - 1))}
                            className="w-6 h-6 bg-slate-700 hover:bg-slate-600 text-white rounded
                                       flex items-center justify-center text-xs transition-colors"
                          >
                            −
                          </button>
                          <span className="text-white text-sm font-medium w-5 text-center">
                            {count}
                          </span>
                          <button
                            onClick={() => setRoomCount(rc.type, Math.min(rc.max, count + 1))}
                            className="w-6 h-6 bg-slate-700 hover:bg-slate-600 text-white rounded
                                       flex items-center justify-center text-xs transition-colors"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── House Style ─────────────────────────────── */}
            <section>
              <Label>House Style</Label>
              <Select value={style} onChange={e => setStyle(e.target.value)}>
                {STYLES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </section>

            {/* ── Extra Notes ─────────────────────────────── */}
            <section>
              <Label>Extra Notes (optional)</Label>
              <textarea
                value={extraNotes}
                onChange={e => setExtraNotes(e.target.value)}
                placeholder="e.g. Include a veranda at front, separate kitchen entrance…"
                rows={3}
                className="bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 w-full
                           focus:border-orange-500 focus:outline-none transition-colors text-sm
                           resize-none placeholder:text-slate-600"
              />
            </section>
          </>
        )}

        {/* ── RESULT: Image Preview + Actions ────────────── */}
        {!isLoading && hasResult && (
          <>
            {/* Success badge */}
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30
                            rounded-lg px-3 py-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-400 shrink-0" fill="none"
                   stroke="currentColor" strokeWidth={2.5}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-green-400 text-xs font-medium">
                {generatedPlan.cached ? 'Loaded from cache' : `Generated in ${generationTime ? `${(generationTime / 1000).toFixed(1)}s` : '–'}`}
              </span>
            </div>

            {/* Blueprint image preview */}
            <FloorPlanPreview floorPlan={generatedPlan} />
          </>
        )}
      </div>

      {/* ── Footer action buttons ─────────────────────────── */}
      <div className="px-5 py-4 border-t border-slate-700 shrink-0 space-y-2">

        {/* Form state — Generate button */}
        {!isLoading && !hasResult && (
          <button
            onClick={handleGenerate}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600
                       hover:from-orange-600 hover:to-orange-700 text-white font-medium py-3
                       rounded-lg transition-all shadow-lg shadow-orange-500/20
                       flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
            Generate Floor Plan with AI
          </button>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="w-full bg-slate-700 text-slate-400 font-medium py-3 rounded-lg
                          flex items-center justify-center gap-2 cursor-not-allowed">
            <span className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
            Generating… (may take up to 2 min)
          </div>
        )}

        {/* Result state — Download + Regenerate */}
        {!isLoading && hasResult && (
          <>
            {/* Download PNG */}
            <button
              onClick={handleDownloadPNG}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3
                         rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PNG
            </button>

            <div className="grid grid-cols-2 gap-2">
              {/* Regenerate */}
              <button
                onClick={resetGeneration}
                className="py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm
                           rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
                </svg>
                Regenerate
              </button>

              {/* Download PDF via print */}
              <button
                onClick={handleDownloadPDF}
                className="py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm
                           rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print / PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

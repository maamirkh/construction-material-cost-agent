'use client';

/**
 * FloorPlanPage — two-mode client component for /floor-plan
 *
 * MODE 1 — "AI Generate ✨" (default)
 *   Full AIGeneratorPanel (inline, no drawer/close button).
 *   Panel already renders form → loading → FloorPlanPreview internally.
 *   Clicking "Load in Floor Planner" inside the panel calls onPlanReady →
 *   switches to MODE 2.
 *
 * MODE 2 — "Manual Editor ✏️"
 *   Full FloorPlanDesigner canvas.
 *   "AI Generate ✨" tab + banner bar let the user jump back.
 *   The pending canvas state is injected via loadedPlan prop → RESTORE dispatch.
 *
 * State:
 *   activeTab:    'ai' | 'editor'
 *   pendingPlan:  canvas-format state waiting to be dispatched (set on plan ready,
 *                 cleared after FloorPlanDesigner confirms RESTORE via onPlanLoaded)
 *   aiPlanLoaded: true after an AI plan has been loaded at least once
 */

import { useState, useCallback } from 'react';
import FloorPlanDesigner    from './FloorPlanDesigner';
import { AIGeneratorPanel } from '../AIFloorPlan';

export default function FloorPlanPage({ projectName = 'My Floor Plan' }) {
  const [activeTab,    setActiveTab]    = useState('ai');
  const [pendingPlan,  setPendingPlan]  = useState(null);
  const [aiPlanLoaded, setAiPlanLoaded] = useState(false);

  // AIGeneratorPanel calls this when user clicks "Load in Floor Planner"
  // canvasState is already in canvas format (convertAIToCanvas was called internally)
  const handlePlanReady = useCallback((canvasState) => {
    setPendingPlan(canvasState);
    setActiveTab('editor');
  }, []);

  // FloorPlanDesigner calls this after dispatching RESTORE
  const handlePlanLoaded = useCallback(() => {
    setPendingPlan(null);
    setAiPlanLoaded(true);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">

      {/* ── Tab bar ─────────────────────────────────────────────── */}
      <div className="h-11 bg-slate-900 border-b border-slate-700 flex items-center px-4 gap-1 shrink-0 z-10">

        {/* AI Generate tab */}
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors
            ${activeTab === 'ai'
              ? 'bg-gradient-to-r from-orange-500/20 to-purple-500/20 text-orange-300 border border-orange-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
          AI Generate
        </button>

        {/* Manual Editor tab */}
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors
            ${activeTab === 'editor'
              ? 'bg-slate-800 text-white border border-slate-600'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Manual Editor
        </button>

        {/* AI-plan-loaded indicator */}
        {aiPlanLoaded && (
          <>
            <div className="w-px h-5 bg-slate-700 mx-2" />
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              AI plan in canvas
            </span>
          </>
        )}
      </div>

      {/* ── MODE 1: AI Generator ────────────────────────────────── */}
      {activeTab === 'ai' && (
        <div className="flex flex-1 overflow-hidden justify-center">
          {/*
            AIGeneratorPanel is fixed-width (420px). Center it and add a
            decorative right panel so the page doesn't look bare on wide screens.
          */}
          <div className="flex w-full max-w-5xl">

            {/* Panel */}
            <div className="w-[420px] shrink-0 overflow-y-auto h-full bg-slate-800 border-r border-slate-700">
              <AIGeneratorPanel
                onPlanReady={handlePlanReady}
                onClose={null}
              />
            </div>

            {/* Right info / illustration panel */}
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <BlueprintIllustration />
              <h2 className="text-slate-200 font-semibold text-xl mt-6 mb-3">
                AI-Powered Floor Plan Design
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6">
                Describe your plot size and room requirements. Gemini 2.0 Flash will
                generate a complete floor plan — rooms, walls, and doors — that you
                can load directly into the canvas editor and fine-tune.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-xs text-xs text-slate-500 text-left">
                {[
                  { icon: '⚡', text: 'Generated in seconds' },
                  { icon: '🏠', text: 'Pakistani layout styles' },
                  { icon: '✏️', text: 'Fully editable in canvas' },
                  { icon: '📐', text: 'Walls & doors included' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-2.5">
                    <span>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 2: Manual Editor ──────────────────────────────── */}
      {activeTab === 'editor' && (
        <div className="flex-1 overflow-hidden relative flex flex-col">

          {/* AI plan banner — only if plan was loaded from AI */}
          {aiPlanLoaded && (
            <div className="flex items-center justify-between px-4 py-2
                            bg-emerald-900/70 border-b border-emerald-700/50 text-xs shrink-0">
              <span className="text-emerald-300 flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                </svg>
                AI floor plan loaded — edit manually, add rooms, adjust walls
              </span>
              <button
                onClick={() => setActiveTab('ai')}
                className="text-emerald-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 5 5 12 12 19" />
                </svg>
                Back to AI Generator
              </button>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <FloorPlanDesigner
              projectName={projectName}
              loadedPlan={pendingPlan}
              onPlanLoaded={handlePlanLoaded}
              onAIButtonClick={() => setActiveTab('ai')}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Blueprint illustration SVG ─────────────────────────────────
function BlueprintIllustration() {
  return (
    <div className="w-32 h-32 rounded-2xl bg-slate-800 border border-slate-700
                    flex items-center justify-center">
      <svg viewBox="0 0 100 80" className="w-20 h-20" fill="none">
        {/* Outer border */}
        <rect x="4" y="4" width="92" height="72" rx="3" stroke="#475569" strokeWidth="1.5" />
        {/* Rooms */}
        <rect x="4" y="4" width="45" height="35" rx="2" fill="#f97316" fillOpacity="0.12"
              stroke="#f97316" strokeOpacity="0.4" strokeWidth="1" />
        <rect x="4" y="39" width="30" height="37" rx="2" fill="#a855f7" fillOpacity="0.12"
              stroke="#a855f7" strokeOpacity="0.4" strokeWidth="1" />
        <rect x="34" y="39" width="15" height="37" rx="2" fill="#3b82f6" fillOpacity="0.12"
              stroke="#3b82f6" strokeOpacity="0.4" strokeWidth="1" />
        <rect x="49" y="4" width="47" height="72" rx="2" fill="#10b981" fillOpacity="0.10"
              stroke="#10b981" strokeOpacity="0.4" strokeWidth="1" />
        {/* Door arc */}
        <path d="M49 39 Q56 32 63 39" stroke="#f97316" strokeOpacity="0.6"
              strokeWidth="1" strokeDasharray="2 1" />
        {/* Labels */}
        <text x="26" y="25" textAnchor="middle" fill="#94a3b8" fontSize="5">Bedroom</text>
        <text x="19" y="60" textAnchor="middle" fill="#94a3b8" fontSize="4.5">Lounge</text>
        <text x="41" y="60" textAnchor="middle" fill="#94a3b8" fontSize="4">Bath</text>
        <text x="72" y="44" textAnchor="middle" fill="#94a3b8" fontSize="5">Living Room</text>
      </svg>
    </div>
  );
}

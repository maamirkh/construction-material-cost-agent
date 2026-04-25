'use client';

/**
 * FloorPlanToolbar — top action bar
 * Contains: project name, undo/redo, snap toggle, save/load, export
 */

import { useState } from 'react';

export default function FloorPlanToolbar({
  projectName,
  setProjectName,
  zoom,
  snapEnabled,
  setSnapEnabled,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onLoad,
  onExportPNG,
  onExportJSON,
  onClear,
  onSaveServer,
  onLoadServer,
  isSavingServer,
  onAIButtonClick = null,   // opens the AI floor plan generator drawer
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <header className="h-12 bg-slate-900 border-b border-slate-700 flex items-center px-3 gap-2 shrink-0 z-20">

      {/* Project name */}
      <input
        type="text"
        value={projectName}
        onChange={e => setProjectName(e.target.value)}
        placeholder="Project name…"
        className="bg-slate-800 text-white border border-slate-600 rounded px-2 h-8 text-sm w-40
                   focus:outline-none focus:border-orange-500 transition-colors"
      />

      {/* Divider */}
      <div className="w-px h-6 bg-slate-700" />

      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className="px-2 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded
                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M3 7v6h6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 13A9 9 0 1 0 6 6.7L3 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Undo
      </button>

      {/* Redo */}
      <button
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        className="px-2 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded
                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
      >
        Redo
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M21 7v6h-6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 13A9 9 0 1 1 18 6.7L21 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-700" />

      {/* Snap toggle */}
      <button
        onClick={() => setSnapEnabled(!snapEnabled)}
        title="Toggle snap-to-grid"
        className={`px-2 py-1 text-sm rounded transition-colors flex items-center gap-1
          ${snapEnabled
            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
            : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'}`}
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="2" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" />
        </svg>
        Snap
      </button>

      {/* Scale info */}
      <span className="text-slate-500 text-xs hidden lg:block">
        1 grid = 1m
      </span>

      {/* Zoom */}
      <span className="text-slate-400 text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700">
        {Math.round(zoom * 100)}%
      </span>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-700" />

      {/* Save locally */}
      <button
        onClick={onSave}
        title="Save to browser storage"
        className="px-2 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors flex items-center gap-1"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        Save
      </button>

      {/* Load locally */}
      <button
        onClick={onLoad}
        title="Load from browser storage"
        className="px-2 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors flex items-center gap-1"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Load
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-700" />

      {/* Server save */}
      <button
        onClick={onSaveServer}
        disabled={isSavingServer}
        title="Save to Python backend"
        className="px-2 py-1 text-sm bg-blue-700 hover:bg-blue-600 text-white rounded
                   disabled:opacity-50 transition-colors flex items-center gap-1"
      >
        {isSavingServer
          ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          : (
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          )
        }
        Server
      </button>

      {/* Server load */}
      <button
        onClick={onLoadServer}
        title="Load from Python backend"
        className="px-2 py-1 text-sm bg-blue-700 hover:bg-blue-600 text-white rounded transition-colors flex items-center gap-1"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="8 18 12 22 16 18" />
          <line x1="12" y1="22" x2="12" y2="9" />
        </svg>
        Load↓
      </button>

      {/* ── AI Generate button ── only shown when parent wired it up */}
      {onAIButtonClick && (
        <>
          <div className="w-px h-6 bg-slate-700" />
          <button
            onClick={onAIButtonClick}
            title="Generate floor plan with AI (Gemini)"
            className="px-3 py-1 text-sm rounded transition-all flex items-center gap-1.5 font-medium
                       bg-gradient-to-r from-orange-500/20 to-purple-500/20
                       hover:from-orange-500/30 hover:to-purple-500/30
                       text-orange-300 border border-orange-500/30 hover:border-orange-500/50"
          >
            {/* Sparkle star icon */}
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
            AI Generate
          </button>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(m => !m)}
          className="px-3 py-1 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded
                     transition-colors flex items-center gap-1.5 font-medium"
        >
          Export
          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showExportMenu && (
          <>
            {/* Overlay to close */}
            <div className="fixed inset-0 z-30" onClick={() => setShowExportMenu(false)} />
            <div className="absolute right-0 top-10 bg-slate-800 border border-slate-700 rounded-lg
                            shadow-xl z-40 min-w-36 overflow-hidden">
              <button
                onClick={() => { onExportPNG(); setShowExportMenu(false); }}
                className="w-full px-4 py-2.5 text-sm text-white hover:bg-slate-700 text-left flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Export PNG
              </button>
              <button
                onClick={() => { onExportJSON(); setShowExportMenu(false); }}
                className="w-full px-4 py-2.5 text-sm text-white hover:bg-slate-700 text-left flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Export JSON
              </button>
              <div className="h-px bg-slate-700" />
              <button
                onClick={() => { onClear(); setShowExportMenu(false); }}
                className="w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 text-left flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Clear All
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

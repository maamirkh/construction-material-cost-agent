'use client';

/**
 * FloorPlanDesigner — main layout component
 * Assembles: Toolbar + Sidebar + Canvas + PropertiesPanel + StatusBar
 * Also handles backend save/load and toast notifications.
 */

import { useState, useCallback, useEffect } from 'react';
import { useFloorPlanCanvas } from './useFloorPlanCanvas';
import FloorPlanToolbar     from './FloorPlanToolbar';
import FloorPlanSidebar     from './FloorPlanSidebar';
import PropertiesPanel      from './PropertiesPanel';

// ─── Toast notification ───────────────────────────────────────
function Toast({ message, type }) {
  if (!message) return null;
  const bg = type === 'error' ? 'bg-red-600' : type === 'warn' ? 'bg-yellow-600' : 'bg-emerald-600';
  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg shadow-xl
                     text-white text-sm font-medium flex items-center gap-2 ${bg} animate-fade-in-up`}>
      {type === 'error' && '✕'}
      {type === 'success' && '✓'}
      {type === 'warn' && '⚠'}
      {message}
    </div>
  );
}

// ─── Empty-canvas placeholder ─────────────────────────────────
function EmptyState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
      {/* House SVG outline */}
      <svg viewBox="0 0 120 100" className="w-32 h-32 text-slate-200 mb-6" fill="none" stroke="currentColor" strokeWidth={2}>
        <polygon points="60,5 5,45 115,45" strokeLinejoin="round" />
        <rect x="15" y="45" width="90" height="50" />
        <rect x="45" y="65" width="30" height="30" />
        <rect x="25" y="55" width="18" height="18" />
        <rect x="77" y="55" width="18" height="18" />
      </svg>

      <h3 className="text-slate-400 text-lg font-semibold mb-2">Start Designing Your Floor Plan</h3>
      <p className="text-slate-500 text-sm text-center max-w-xs leading-relaxed mb-8">
        Select the <strong className="text-slate-400">Room</strong> tool from the left sidebar,
        then click and drag on the canvas to draw your first room.
      </p>

      {/* Shortcut cards */}
      <div className="grid grid-cols-2 gap-3 max-w-sm">
        {[
          { key: 'Drag', desc: 'Draw a room (Room tool active)' },
          { key: 'Click×2', desc: 'Place a wall (start → end)' },
          { key: 'Delete', desc: 'Delete selected element' },
          { key: 'Ctrl+Z', desc: 'Undo last action' },
          { key: 'Scroll', desc: 'Zoom in / out' },
          { key: '⎵ Drag', desc: 'Pan the canvas' },
        ].map(({ key, desc }) => (
          <div key={key} className="bg-slate-100/5 rounded-lg px-3 py-2 flex items-start gap-2">
            <kbd className="shrink-0 bg-slate-700 text-slate-300 text-xs px-1.5 py-0.5 rounded font-mono">
              {key}
            </kbd>
            <span className="text-slate-500 text-xs leading-tight">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function FloorPlanDesigner({
  projectName:    initialProjectName = 'My Floor Plan',
  // ── AI integration props ───────────────────────────────────
  // loadedPlan: canvas-format state from AI generator; when non-null this
  //             component dispatches RESTORE then calls onPlanLoaded()
  loadedPlan    = null,
  onPlanLoaded  = null,
  // onAIButtonClick: opens the AI panel drawer (set by FloorPlanPageLayout)
  onAIButtonClick = null,
}) {
  const [projectName, setProjectName]   = useState(initialProjectName);
  const [toast, setToast]               = useState({ message: '', type: 'success' });
  const [isSavingServer, setIsSavingServer] = useState(false);

  // Core canvas hook
  const fp = useFloorPlanCanvas();

  // ── Load AI-generated plan into canvas ─────────────────────
  // When FloorPlanPageLayout sets pendingPlan, this effect fires once,
  // dispatches RESTORE to replace the whole canvas state, then clears it.
  useEffect(() => {
    if (!loadedPlan) return;
    fp.dispatch({ type: 'RESTORE', payload: loadedPlan });
    onPlanLoaded?.();
    showToast('AI floor plan loaded into canvas ✓', 'success');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedPlan]);

  const isEmpty =
    fp.state.rooms.length === 0 &&
    fp.state.walls.length === 0 &&
    fp.state.doors.length === 0 &&
    fp.state.windows.length === 0;

  // ── Toast helper ────────────────────────────────────────────
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  }, []);

  // ── Local save / load ────────────────────────────────────────
  const handleSave = useCallback(() => {
    const ok = fp.saveToLocalStorage();
    showToast(ok ? 'Floor plan saved locally.' : 'Save failed.', ok ? 'success' : 'error');
  }, [fp, showToast]);

  const handleLoad = useCallback(() => {
    const ok = fp.loadFromLocalStorage();
    showToast(ok ? 'Floor plan loaded.' : 'No saved floor plan found.', ok ? 'success' : 'warn');
  }, [fp, showToast]);

  // ── Backend save (POST) ──────────────────────────────────────
  const handleSaveServer = useCallback(async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      showToast('NEXT_PUBLIC_API_URL is not set in .env.local', 'error');
      return;
    }
    setIsSavingServer(true);
    try {
      const res = await fetch(`${apiUrl}/api/floor-plans/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: projectName,
          floor_plan_data: JSON.stringify(fp.state),
          created_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      showToast('Saved to server ✓', 'success');
    } catch (err) {
      showToast(`Server error: ${err.message}`, 'error');
    } finally {
      setIsSavingServer(false);
    }
  }, [fp.state, projectName, showToast]);

  // ── Backend load (GET) ───────────────────────────────────────
  const handleLoadServer = useCallback(async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      showToast('NEXT_PUBLIC_API_URL is not set in .env.local', 'error');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/api/floor-plans/latest`);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const json = await res.json();
      if (json.floor_plan_data) {
        fp.dispatch({ type: 'RESTORE', payload: JSON.parse(json.floor_plan_data) });
        showToast('Loaded from server ✓', 'success');
      } else {
        showToast('No floor plan found on server.', 'warn');
      }
    } catch (err) {
      showToast(`Server error: ${err.message}`, 'error');
    }
  }, [fp, showToast]);

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">

      {/* ── TOP TOOLBAR ──────────────────────────────────────── */}
      <FloorPlanToolbar
        projectName={projectName}
        setProjectName={setProjectName}
        zoom={fp.zoom}
        snapEnabled={fp.snapEnabled}
        setSnapEnabled={fp.setSnapEnabled}
        canUndo={fp.canUndo}
        canRedo={fp.canRedo}
        onUndo={fp.undo}
        onRedo={fp.redo}
        onSave={handleSave}
        onLoad={handleLoad}
        onExportPNG={fp.exportAsPNG}
        onExportJSON={fp.exportJSON}
        onClear={fp.clearAll}
        onSaveServer={handleSaveServer}
        onLoadServer={handleLoadServer}
        isSavingServer={isSavingServer}
        onAIButtonClick={onAIButtonClick}
      />

      {/* ── MAIN AREA ────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left tool sidebar */}
        <FloorPlanSidebar tool={fp.tool} setTool={fp.setTool} />

        {/* Canvas area */}
        <div
          ref={fp.containerRef}
          className="relative flex-1 bg-white overflow-hidden"
          style={{ cursor: fp.cursor }}
        >
          {/* Empty state overlay */}
          {isEmpty && <EmptyState />}

          {/* THE CANVAS */}
          <canvas
            ref={fp.canvasRef}
            className="absolute inset-0 w-full h-full"
          />

          {/* Active-tool hint badge (top-center) */}
          {fp.tool !== 'select' && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur
                            text-white text-xs px-3 py-1.5 rounded-full border border-slate-700 pointer-events-none">
              {fp.tool === 'room'   && 'Click & drag to draw a room'}
              {fp.tool === 'wall'   && 'Click to set start point, click again to finish wall'}
              {fp.tool === 'door'   && 'Click on canvas to place a door'}
              {fp.tool === 'window' && 'Click on canvas to place a window'}
              {fp.tool === 'eraser' && 'Click on an element to erase it'}
            </div>
          )}
        </div>

        {/* Right properties panel */}
        <PropertiesPanel state={fp.state} dispatch={fp.dispatch} />
      </div>

      {/* ── STATUS BAR ───────────────────────────────────────── */}
      <footer className="h-6 bg-slate-900 border-t border-slate-700 flex items-center px-4 gap-6
                         text-slate-400 text-xs shrink-0">
        <span>
          X: {fp.mousePos.x}m &nbsp; Y: {fp.mousePos.y}m
        </span>
        <span className="text-slate-600">|</span>
        <span>Zoom: {Math.round(fp.zoom * 100)}%</span>
        <span className="text-slate-600">|</span>
        <span>
          Rooms: {fp.state.rooms.length} &nbsp;
          Walls: {fp.state.walls.length} &nbsp;
          Doors: {fp.state.doors.length} &nbsp;
          Windows: {fp.state.windows.length}
        </span>
        {fp.state.selectedId && (
          <>
            <span className="text-slate-600">|</span>
            <span className="text-orange-400">1 element selected &mdash; Del to delete</span>
          </>
        )}
        <div className="flex-1" />
        <span className="text-slate-600">
          Snap: {fp.snapEnabled ? 'ON' : 'OFF'} &nbsp;|&nbsp; 1 grid = 1m
        </span>
      </footer>

      {/* Toast */}
      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}

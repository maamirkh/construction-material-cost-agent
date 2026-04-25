'use client';

/**
 * FloorPlanPageLayout — client wrapper for the /floor-plan page.
 *
 * Manages:
 *  - Whether the AI panel drawer is open
 *  - The converted canvas-format plan waiting to be loaded ("pendingPlan")
 *
 * Data flow when user clicks "Load in Floor Planner":
 *
 *   AIGeneratorPanel
 *     └─ convertAIToCanvasFormat(aiPlan)
 *     └─ onPlanReady(canvasState)          ← sets pendingPlan here
 *         └─ FloorPlanDesigner
 *             └─ useEffect watches loadedPlan prop
 *                 └─ fp.dispatch({ type: 'RESTORE', payload: loadedPlan })
 *                     └─ histReducer → fpReducer('RESTORE') replaces present state
 *                 └─ onPlanLoaded()        ← clears pendingPlan back to null
 *
 * No Redux needed — the canvas state lives in useFloorPlanCanvas (useReducer).
 * The RESTORE action is already implemented in useFloorPlanCanvas.js.
 */

import { useState, useCallback } from 'react';
import FloorPlanDesigner       from './FloorPlanDesigner';
import { AIGeneratorPanel }    from '../AIFloorPlan';

export default function FloorPlanPageLayout({ projectName = 'My Floor Plan' }) {
  // Whether the AI drawer is visible
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // Canvas-format plan ready to be loaded — set by AI panel, cleared after dispatch
  const [pendingPlan, setPendingPlan] = useState(null);

  // Called by AIGeneratorPanel when user clicks "Load in Floor Planner"
  const handlePlanReady = useCallback((canvasState) => {
    setPendingPlan(canvasState);
  }, []);

  // Called by FloorPlanDesigner after it has dispatched RESTORE
  const handlePlanLoaded = useCallback(() => {
    setPendingPlan(null);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── AI Generator Drawer ──────────────────────────────
          Slides in from the left. Does NOT push the canvas —
          it overlays it so the canvas always stays full-width.   */}
      {aiPanelOpen && (
        <>
          {/* Semi-transparent backdrop — clicking it closes the drawer */}
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
            onClick={() => setAiPanelOpen(false)}
          />

          {/* The drawer itself */}
          <div className="fixed left-0 top-0 bottom-0 z-40 shadow-2xl shadow-black/50
                          animate-slide-in-left">
            <AIGeneratorPanel
              onPlanReady={handlePlanReady}
              onClose={() => setAiPanelOpen(false)}
            />
          </div>
        </>
      )}

      {/* ── Floor Plan Designer (always full width) ────────── */}
      <FloorPlanDesigner
        projectName={projectName}
        loadedPlan={pendingPlan}
        onPlanLoaded={handlePlanLoaded}
        onAIButtonClick={() => setAiPanelOpen(true)}
      />
    </div>
  );
}

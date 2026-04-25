/**
 * convertToReactPlanner.js
 *
 * NOTE: Despite the file name, this does NOT target the "react-planner" npm
 * package. It converts the Gemini AI JSON response into the canvas state format
 * used by the custom HTML5 Canvas floor plan designer (useFloorPlanCanvas.js).
 *
 * AI JSON format (from /api/ai-floor-plan/generate):
 *   rooms:   [{ id, type, label, x, y, width, height, color }]
 *   walls:   [{ id, x1, y1, x2, y2, thickness }]
 *   doors:   [{ id, x, y, width, height, rotation }]  rotation in degrees
 *   windows: [{ id, x, y, width, height, rotation }]
 *
 * Canvas state format (useFloorPlanCanvas reducer):
 *   rooms:   [{ id, type, name,  x, y, w,     h,      color }]
 *   walls:   [{ id, x1, y1, x2, y2 }]
 *   doors:   [{ id, x, y, width, angle }]              angle in radians
 *   windows: [{ id, x, y, width, angle }]
 *   selectedId: null
 *
 * Usage:
 *   import { convertAIToCanvas } from '@/utils/convertToReactPlanner';
 *   const canvasState = convertAIToCanvas(generatedPlan.floor_plan);
 *   fp.dispatch({ type: 'RESTORE', payload: canvasState });
 */

const uid = () =>
  `ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return isFinite(n) ? n : fallback;
};

/**
 * Convert an AI-generated floor plan object into canvas state format.
 *
 * @param {object} aiPlan  — the `floor_plan` field from the Gemini API response
 * @returns {object}       — canvas state ready for dispatch({ type: 'RESTORE', payload })
 */
export function convertAIToCanvas(aiPlan) {
  return {
    rooms: (aiPlan.rooms || []).map(r => ({
      id:    r.id    || uid(),
      x:     safeNum(r.x),
      y:     safeNum(r.y),
      w:     safeNum(r.width,  100),
      h:     safeNum(r.height, 100),
      name:  r.label || r.type || 'Room',
      type:  (r.type || 'other').toLowerCase(),
      color: r.color || '#fef3c7',
    })),

    walls: (aiPlan.walls || []).map(w => ({
      id: w.id || uid(),
      x1: safeNum(w.x1),
      y1: safeNum(w.y1),
      x2: safeNum(w.x2),
      y2: safeNum(w.y2),
    })),

    doors: (aiPlan.doors || []).map(d => ({
      id:    d.id || uid(),
      x:     safeNum(d.x),
      y:     safeNum(d.y),
      width: safeNum(d.width, 30),
      angle: (safeNum(d.rotation, 0) * Math.PI) / 180,
    })),

    windows: (aiPlan.windows || []).map(w => ({
      id:    w.id || uid(),
      x:     safeNum(w.x),
      y:     safeNum(w.y),
      width: safeNum(w.width, 30),
      angle: (safeNum(w.rotation, 0) * Math.PI) / 180,
    })),

    selectedId: null,
  };
}

// Default export for convenience
export default convertAIToCanvas;

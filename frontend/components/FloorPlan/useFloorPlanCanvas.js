'use client';

/**
 * useFloorPlanCanvas — core hook for the Floor Plan Designer
 *
 * Manages:
 *  - Canvas drawing (rooms, walls, doors, windows, grid)
 *  - Mouse / keyboard interaction (draw, select, move, delete)
 *  - Zoom & pan (scroll wheel + Space+drag)
 *  - Undo / redo with 50-step history (built into reducer)
 *  - Snap-to-grid toggle
 *  - Export (PNG, JSON) and localStorage persistence
 */

import { useReducer, useRef, useEffect, useCallback, useState } from 'react';

// ─── Constants ────────────────────────────────────────────────
const GRID = 50;       // world-space pixels per metre (1 grid cell = 1 m)
const MAX_HIST = 50;   // undo/redo stack depth
const WALL_HIT = 8;    // px tolerance for wall click
const PT_HIT   = 16;   // px tolerance for door/window click

// ─── Helper: generate unique ID ───────────────────────────────
function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Helper: snap a value to the nearest grid line ────────────
function snap(v, g) {
  return Math.round(v / g) * g;
}

// ─── Convert screen → world coordinates ──────────────────────
function toWorld(clientX, clientY, canvas, pan, zoom) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (clientX - r.left - pan.x) / zoom,
    y: (clientY - r.top  - pan.y) / zoom,
  };
}

// ─── Hit testing ─────────────────────────────────────────────
function inRoom(r, wx, wy) {
  return wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h;
}

function distSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function nearWall(w, wx, wy, zoom) {
  return distSeg(wx, wy, w.x1, w.y1, w.x2, w.y2) < WALL_HIT / zoom;
}

function nearPt(el, wx, wy, zoom) {
  return Math.hypot(wx - el.x, wy - el.y) < PT_HIT / zoom;
}

// ─── Inner floor-plan reducer (no history knowledge) ─────────
const EMPTY_FP = { rooms: [], walls: [], doors: [], windows: [], selectedId: null };

function fpReducer(s, a) {
  switch (a.type) {
    case 'ADD_ROOM':    return { ...s, rooms:   [...s.rooms,   a.payload] };
    case 'ADD_WALL':    return { ...s, walls:   [...s.walls,   a.payload] };
    case 'ADD_DOOR':    return { ...s, doors:   [...s.doors,   a.payload] };
    case 'ADD_WINDOW':  return { ...s, windows: [...s.windows, a.payload] };

    case 'UPDATE': {
      const { id, u } = a;
      return {
        ...s,
        rooms:   s.rooms.map(r => r.id === id ? { ...r, ...u } : r),
        walls:   s.walls.map(w => w.id === id ? { ...w, ...u } : w),
        doors:   s.doors.map(d => d.id === id ? { ...d, ...u } : d),
        windows: s.windows.map(w => w.id === id ? { ...w, ...u } : w),
      };
    }

    case 'DELETE': {
      const id = a.payload;
      return {
        ...s,
        rooms:      s.rooms.filter(r => r.id !== id),
        walls:      s.walls.filter(w => w.id !== id),
        doors:      s.doors.filter(d => d.id !== id),
        windows:    s.windows.filter(w => w.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      };
    }

    case 'SELECT':  return { ...s, selectedId: a.payload };
    case 'RESTORE': return a.payload;    // full state replacement
    case 'CLEAR':   return { ...EMPTY_FP };
    default:        return s;
  }
}

// ─── History wrapper reducer ──────────────────────────────────
// Actions that do NOT create undo checkpoints:
const SKIP_HIST = new Set(['SELECT', 'UPDATE_PREVIEW']);

const INIT_HIST = { past: [], present: EMPTY_FP, future: [] };

function histReducer({ past, present, future }, action) {
  // Undo
  if (action.type === 'UNDO') {
    if (!past.length) return { past, present, future };
    return {
      past: past.slice(0, -1),
      present: past[past.length - 1],
      future: [present, ...future].slice(0, MAX_HIST),
    };
  }

  // Redo
  if (action.type === 'REDO') {
    if (!future.length) return { past, present, future };
    return {
      past: [...past, present].slice(-MAX_HIST),
      present: future[0],
      future: future.slice(1),
    };
  }

  // Map UPDATE_PREVIEW → UPDATE so inner reducer handles live drag without history
  const inner = action.type === 'UPDATE_PREVIEW'
    ? { ...action, type: 'UPDATE' }
    : action;

  const newPresent = fpReducer(present, inner);

  // No-history actions (SELECT, UPDATE_PREVIEW)
  if (SKIP_HIST.has(action.type)) {
    return { past, present: newPresent, future };
  }

  // Normal action: save current present to past, clear redo
  return {
    past: [...past, present].slice(-MAX_HIST),
    present: newPresent,
    future: [],
  };
}

// ─── Canvas drawing functions ─────────────────────────────────

function drawGrid(ctx, cw, ch, pan, zoom) {
  const minor = GRID * zoom;
  const major = minor * 5;

  ctx.save();

  // Minor grid lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 0.5;
  for (let x = pan.x % minor; x < cw; x += minor) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
  }
  for (let y = pan.y % minor; y < ch; y += minor) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
  }

  // Major grid lines (every 5 m)
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  for (let x = pan.x % major; x < cw; x += major) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
  }
  for (let y = pan.y % major; y < ch; y += major) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
  }

  ctx.restore();
}

function drawRoom(ctx, room, selected, pan, zoom) {
  const sx = room.x * zoom + pan.x;
  const sy = room.y * zoom + pan.y;
  const sw = room.w * zoom;
  const sh = room.h * zoom;

  ctx.save();

  // Fill
  ctx.fillStyle = room.color || '#fef3c7';
  ctx.globalAlpha = 0.55;
  ctx.fillRect(sx, sy, sw, sh);
  ctx.globalAlpha = 1;

  // Border
  ctx.strokeStyle = selected ? '#f97316' : '#334155';
  ctx.lineWidth = selected ? 2.5 : 1.5;
  ctx.strokeRect(sx, sy, sw, sh);

  // Selection resize handles
  if (selected) {
    const pts = [
      [sx, sy], [sx + sw, sy], [sx, sy + sh], [sx + sw, sy + sh],
      [sx + sw / 2, sy], [sx + sw / 2, sy + sh],
      [sx, sy + sh / 2], [sx + sw, sy + sh / 2],
    ];
    pts.forEach(([hx, hy]) => {
      ctx.fillStyle = '#f97316';
      ctx.fillRect(hx - 4, hy - 4, 8, 8);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(hx - 4, hy - 4, 8, 8);
    });
  }

  // Room label + area + dimensions
  if (sw > 50 && sh > 36) {
    const wM = (room.w / GRID).toFixed(1);
    const hM = (room.h / GRID).toFixed(1);
    const areaFt = ((room.w / GRID) * (room.h / GRID) * 10.764).toFixed(1);
    const fSize = Math.max(10, Math.min(14, sw / 8));

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = `bold ${fSize}px Inter, sans-serif`;
    ctx.fillStyle = '#1e293b';
    ctx.fillText(room.name || 'Room', sx + sw / 2, sy + sh / 2 - 9);

    ctx.font = `${fSize - 1}px Inter, sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.fillText(`${areaFt} ft²`, sx + sw / 2, sy + sh / 2 + 9);

    if (zoom > 0.55) {
      ctx.font = `9px sans-serif`;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${wM}m × ${hM}m`, sx + sw / 2, sy + sh / 2 + 24);
    }
  }

  ctx.restore();
}

function drawWall(ctx, wall, selected, pan, zoom) {
  const sx1 = wall.x1 * zoom + pan.x;
  const sy1 = wall.y1 * zoom + pan.y;
  const sx2 = wall.x2 * zoom + pan.x;
  const sy2 = wall.y2 * zoom + pan.y;

  ctx.save();
  ctx.strokeStyle = selected ? '#f97316' : '#0f172a';
  ctx.lineWidth   = selected ? 4 : 3;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(sx1, sy1);
  ctx.lineTo(sx2, sy2);
  ctx.stroke();

  // Endpoint handles when selected
  if (selected) {
    [[sx1, sy1], [sx2, sy2]].forEach(([hx, hy]) => {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Length label (only when zoomed in enough)
  if (zoom > 0.4) {
    const lenM = (Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1) / GRID).toFixed(1);
    const mx = (sx1 + sx2) / 2;
    const my = (sy1 + sy2) / 2;
    const ang = Math.atan2(sy2 - sy1, sx2 - sx1);

    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(ang);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${lenM}m`, 0, -5);
    ctx.restore();
  }

  ctx.restore();
}

function drawDoor(ctx, door, selected, pan, zoom) {
  const sx = door.x * zoom + pan.x;
  const sy = door.y * zoom + pan.y;
  const sz = 24 * zoom;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(door.angle || 0);

  // Frame
  ctx.strokeStyle = selected ? '#f97316' : '#7c3aed';
  ctx.lineWidth = 2;
  ctx.strokeRect(-sz / 2, -sz / 4, sz, sz / 2);

  // Swing arc
  ctx.beginPath();
  ctx.arc(-sz / 2, -sz / 4, sz, 0, Math.PI / 2);
  ctx.strokeStyle = selected ? '#fb923c' : '#a78bfa';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Center dot when selected
  if (selected) {
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawWindow(ctx, win, selected, pan, zoom) {
  const sx  = win.x * zoom + pan.x;
  const sy  = win.y * zoom + pan.y;
  const sw  = (win.width || 30) * zoom;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(win.angle || 0);

  // Outer frame
  ctx.strokeStyle = selected ? '#f97316' : '#0369a1';
  ctx.lineWidth = 2;
  ctx.strokeRect(-sw / 2, -5, sw, 10);

  // Center pane line
  ctx.strokeStyle = selected ? '#fb923c' : '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-sw / 2, 0);
  ctx.lineTo(sw / 2, 0);
  ctx.stroke();

  // Center dot when selected
  if (selected) {
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ─── Ghost preview helpers ────────────────────────────────────
function drawRoomPreview(ctx, prev, pan, zoom) {
  ctx.save();
  ctx.globalAlpha = 0.45;
  drawRoom(ctx, { ...prev, id: '_p', name: 'New Room', color: '#fed7aa' }, false, pan, zoom);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawWallPreview(ctx, prev, pan, zoom) {
  const sx1 = prev.x1 * zoom + pan.x;
  const sy1 = prev.y1 * zoom + pan.y;
  const sx2 = prev.x2 * zoom + pan.x;
  const sy2 = prev.y2 * zoom + pan.y;

  ctx.save();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 5]);
  ctx.globalAlpha = 0.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx1, sy1);
  ctx.lineTo(sx2, sy2);
  ctx.stroke();
  ctx.setLineDash([]);

  // First-point anchor dot
  ctx.fillStyle = '#f97316';
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(sx1, sy1, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// ─── MAIN HOOK ────────────────────────────────────────────────
export function useFloorPlanCanvas() {
  // Canvas / container refs
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);

  // Tool state (ref for event handlers + state for re-renders)
  const toolRef = useRef('select');
  const [tool, _setTool] = useState('select');
  const setTool = useCallback((t) => {
    toolRef.current = t;
    _setTool(t);
    wallPt1Ref.current = null;    // reset wall-drawing anchor
    previewRef.current = null;
  }, []);

  // Viewport
  const panRef    = useRef({ x: 60, y: 60 });
  const zoomRef   = useRef(1);
  const [zoom, setZoomState] = useState(1);

  // Snap
  const [snapEnabled, setSnapEnabled] = useState(true);
  const snapRef = useRef(true);
  useEffect(() => { snapRef.current = snapEnabled; }, [snapEnabled]);

  // Mouse position (world metres) for status bar
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Interaction refs (all mutated directly to avoid render cost during drag)
  const isDrawingRef  = useRef(false);   // room rect drag in progress
  const isPanningRef  = useRef(false);
  const isSpaceRef    = useRef(false);
  const panStartRef   = useRef(null);    // { x, y, panX, panY }
  const drawStartRef  = useRef(null);    // room draw start world point
  const wallPt1Ref    = useRef(null);    // first wall point (world)
  const previewRef    = useRef(null);    // ghost shape data

  // Drag-select refs
  const dragIdRef     = useRef(null);
  const dragOffRef    = useRef(null);
  const dragStartPxRef = useRef(null);  // screen px to detect actual drag
  const isDraggingRef = useRef(false);

  // RAF handle
  const rafRef = useRef(null);

  // Floor-plan state through history reducer
  const [histState, dispatch] = useReducer(histReducer, INIT_HIST);
  const state = histState.present;
  const canUndo = histState.past.length > 0;
  const canRedo  = histState.future.length > 0;

  // Keep a ref to current state for use inside event handlers
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Snapper shorthand ──────────────────────────────────────
  const maybeSnap = useCallback((v) =>
    snapRef.current ? snap(v, GRID) : v, []);

  // ── Hit-test the floor plan ────────────────────────────────
  const hitTest = useCallback((wx, wy) => {
    const s   = stateRef.current;
    const z   = zoomRef.current;

    // Test in reverse draw order (topmost first)
    for (const w of [...s.windows].reverse())
      if (nearPt(w, wx, wy, z)) return { kind: 'window', el: w };
    for (const d of [...s.doors].reverse())
      if (nearPt(d, wx, wy, z)) return { kind: 'door', el: d };
    for (const w of [...s.walls].reverse())
      if (nearWall(w, wx, wy, z)) return { kind: 'wall', el: w };
    for (const r of [...s.rooms].reverse())
      if (inRoom(r, wx, wy)) return { kind: 'room', el: r };

    return null;
  }, []);

  // ── Draw everything ────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pan  = panRef.current;
    const zoom = zoomRef.current;
    const s    = stateRef.current;
    const { width: cw, height: ch } = canvas;

    // Clear
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);

    // Grid
    drawGrid(ctx, cw, ch, pan, zoom);

    // Rooms (bottom layer)
    s.rooms.forEach(r => drawRoom(ctx, r, r.id === s.selectedId, pan, zoom));

    // Walls
    s.walls.forEach(w => drawWall(ctx, w, w.id === s.selectedId, pan, zoom));

    // Doors
    s.doors.forEach(d => drawDoor(ctx, d, d.id === s.selectedId, pan, zoom));

    // Windows (top layer)
    s.windows.forEach(w => drawWindow(ctx, w, w.id === s.selectedId, pan, zoom));

    // Ghost preview while drawing
    const prev = previewRef.current;
    if (prev) {
      if (prev.type === 'room') drawRoomPreview(ctx, prev, pan, zoom);
      if (prev.type === 'wall') drawWallPreview(ctx, prev, pan, zoom);
    }
  }, []);

  const requestDraw = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  // Re-draw on every state change
  useEffect(() => { requestDraw(); }, [state, requestDraw]);

  // ── Zoom ──────────────────────────────────────────────────
  const handleZoom = useCallback((deltaY, clientX, clientY) => {
    const canvas = canvasRef.current;
    const oldZ   = zoomRef.current;
    const newZ   = Math.max(0.1, Math.min(5, oldZ * (deltaY < 0 ? 1.1 : 0.9)));
    zoomRef.current = newZ;
    setZoomState(newZ);

    // Zoom toward cursor position
    if (canvas && clientX !== undefined) {
      const r = canvas.getBoundingClientRect();
      const cx = clientX - r.left;
      const cy = clientY - r.top;
      panRef.current = {
        x: cx - (cx - panRef.current.x) * (newZ / oldZ),
        y: cy - (cy - panRef.current.y) * (newZ / oldZ),
      };
    }
    requestDraw();
  }, [requestDraw]);

  // ── Mouse: down ───────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Middle-click or Space = pan mode
    if (e.button === 1 || isSpaceRef.current) {
      isPanningRef.current = true;
      panStartRef.current = {
        x: e.clientX, y: e.clientY,
        panX: panRef.current.x, panY: panRef.current.y,
      };
      return;
    }
    if (e.button !== 0) return;

    const { x: wx, y: wy } = toWorld(e.clientX, e.clientY, canvas, panRef.current, zoomRef.current);
    const swx = maybeSnap(wx);
    const swy = maybeSnap(wy);
    const t   = toolRef.current;

    if (t === 'select') {
      const hit = hitTest(wx, wy);
      if (hit) {
        dispatch({ type: 'SELECT', payload: hit.el.id });
        dragIdRef.current      = hit.el.id;
        dragStartPxRef.current = { x: e.clientX, y: e.clientY };
        isDraggingRef.current  = false;

        if (hit.kind === 'room') {
          dragOffRef.current = { type: 'room', dx: wx - hit.el.x, dy: wy - hit.el.y };
        } else if (hit.kind === 'wall') {
          dragOffRef.current = {
            type: 'wall',
            dx1: wx - hit.el.x1, dy1: wy - hit.el.y1,
            dx2: wx - hit.el.x2, dy2: wy - hit.el.y2,
          };
        } else {
          dragOffRef.current = { type: hit.kind, dx: wx - hit.el.x, dy: wy - hit.el.y };
        }
      } else {
        dispatch({ type: 'SELECT', payload: null });
        dragIdRef.current = null;
      }

    } else if (t === 'room') {
      isDrawingRef.current = true;
      drawStartRef.current = { x: swx, y: swy };

    } else if (t === 'wall') {
      if (!wallPt1Ref.current) {
        // Place first anchor
        wallPt1Ref.current = { x: swx, y: swy };
        previewRef.current = { type: 'wall', x1: swx, y1: swy, x2: swx, y2: swy };
      } else {
        // Complete the wall
        const p1 = wallPt1Ref.current;
        if (Math.hypot(swx - p1.x, swy - p1.y) > GRID / 4) {
          const wall = { id: uid(), x1: p1.x, y1: p1.y, x2: swx, y2: swy };
          dispatch({ type: 'ADD_WALL', payload: wall });
          dispatch({ type: 'SELECT', payload: wall.id });
        }
        wallPt1Ref.current = null;
        previewRef.current = null;
        requestDraw();
      }

    } else if (t === 'door') {
      const door = { id: uid(), x: swx, y: swy, angle: 0, width: 30 };
      dispatch({ type: 'ADD_DOOR', payload: door });
      dispatch({ type: 'SELECT', payload: door.id });

    } else if (t === 'window') {
      const win = { id: uid(), x: swx, y: swy, angle: 0, width: 30 };
      dispatch({ type: 'ADD_WINDOW', payload: win });
      dispatch({ type: 'SELECT', payload: win.id });

    } else if (t === 'eraser') {
      const hit = hitTest(wx, wy);
      if (hit) dispatch({ type: 'DELETE', payload: hit.el.id });
    }
  }, [maybeSnap, hitTest, requestDraw]);

  // ── Mouse: move ───────────────────────────────────────────
  const onMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x: wx, y: wy } = toWorld(e.clientX, e.clientY, canvas, panRef.current, zoomRef.current);
    const swx = maybeSnap(wx);
    const swy = maybeSnap(wy);

    // Update status bar (world metres)
    setMousePos({
      x: (wx / GRID).toFixed(2),
      y: (wy / GRID).toFixed(2),
    });

    // Pan
    if (isPanningRef.current && panStartRef.current) {
      panRef.current = {
        x: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
        y: panStartRef.current.panY + (e.clientY - panStartRef.current.y),
      };
      requestDraw();
      return;
    }

    const t = toolRef.current;

    // Room drag preview
    if (t === 'room' && isDrawingRef.current && drawStartRef.current) {
      const { x: sx, y: sy } = drawStartRef.current;
      previewRef.current = {
        type: 'room',
        x: Math.min(sx, swx), y: Math.min(sy, swy),
        w: Math.abs(swx - sx), h: Math.abs(swy - sy),
      };
      requestDraw();
      return;
    }

    // Wall second-point preview
    if (t === 'wall' && wallPt1Ref.current) {
      previewRef.current = {
        type: 'wall',
        x1: wallPt1Ref.current.x, y1: wallPt1Ref.current.y,
        x2: swx, y2: swy,
      };
      requestDraw();
      return;
    }

    // Drag move
    if (t === 'select' && dragIdRef.current && dragStartPxRef.current) {
      const moved = Math.hypot(
        e.clientX - dragStartPxRef.current.x,
        e.clientY - dragStartPxRef.current.y,
      );
      if (moved > 3) isDraggingRef.current = true;

      if (isDraggingRef.current) {
        const off = dragOffRef.current;
        if (off.type === 'room') {
          dispatch({ type: 'UPDATE_PREVIEW', id: dragIdRef.current,
            u: { x: maybeSnap(wx - off.dx), y: maybeSnap(wy - off.dy) } });
        } else if (off.type === 'wall') {
          dispatch({ type: 'UPDATE_PREVIEW', id: dragIdRef.current,
            u: {
              x1: maybeSnap(wx - off.dx1), y1: maybeSnap(wy - off.dy1),
              x2: maybeSnap(wx - off.dx2), y2: maybeSnap(wy - off.dy2),
            } });
        } else {
          dispatch({ type: 'UPDATE_PREVIEW', id: dragIdRef.current,
            u: { x: maybeSnap(wx - off.dx), y: maybeSnap(wy - off.dy) } });
        }
      }
    }
  }, [maybeSnap, requestDraw]);

  // ── Mouse: up ─────────────────────────────────────────────
  const onMouseUp = useCallback((e) => {
    // End pan
    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartRef.current  = null;
      return;
    }

    const t = toolRef.current;

    // Finish room draw
    if (t === 'room' && isDrawingRef.current) {
      const prev = previewRef.current;
      if (prev && prev.w > GRID / 2 && prev.h > GRID / 2) {
        const room = {
          id: uid(), x: prev.x, y: prev.y, w: prev.w, h: prev.h,
          name: 'Room', type: 'living', color: '#fef3c7',
        };
        dispatch({ type: 'ADD_ROOM', payload: room });
        dispatch({ type: 'SELECT', payload: room.id });
      }
      isDrawingRef.current = false;
      previewRef.current   = null;
      drawStartRef.current = null;
      requestDraw();
    }

    // Commit drag-move to history by dispatching a full UPDATE (adds to past)
    if (t === 'select' && isDraggingRef.current) {
      const s   = stateRef.current;
      const id  = dragIdRef.current;
      const off = dragOffRef.current;
      if (id && off) {
        // Re-dispatch as UPDATE (not UPDATE_PREVIEW) to push to history
        const { x: wx, y: wy } = toWorld(
          e.clientX, e.clientY,
          canvasRef.current, panRef.current, zoomRef.current,
        );
        if (off.type === 'room') {
          dispatch({ type: 'UPDATE', id,
            u: { x: maybeSnap(wx - off.dx), y: maybeSnap(wy - off.dy) } });
        } else if (off.type === 'wall') {
          dispatch({ type: 'UPDATE', id,
            u: {
              x1: maybeSnap(wx - off.dx1), y1: maybeSnap(wy - off.dy1),
              x2: maybeSnap(wx - off.dx2), y2: maybeSnap(wy - off.dy2),
            } });
        } else {
          dispatch({ type: 'UPDATE', id,
            u: { x: maybeSnap(wx - off.dx), y: maybeSnap(wy - off.dy) } });
        }
      }
    }

    // Reset select drag
    isDraggingRef.current  = false;
    dragIdRef.current      = null;
    dragOffRef.current     = null;
    dragStartPxRef.current = null;
  }, [maybeSnap, requestDraw]);

  // ── Scroll wheel → zoom ───────────────────────────────────
  const onWheel = useCallback((e) => {
    e.preventDefault();
    handleZoom(e.deltaY, e.clientX, e.clientY);
  }, [handleZoom]);

  // ── Keyboard ──────────────────────────────────────────────
  const onKeyDown = useCallback((e) => {
    // Delete / Backspace
    if ((e.key === 'Delete' || e.key === 'Backspace') && stateRef.current.selectedId) {
      e.preventDefault();
      dispatch({ type: 'DELETE', payload: stateRef.current.selectedId });
    }
    // Ctrl+Z → undo
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault();
      dispatch({ type: 'UNDO' });
    }
    // Ctrl+Y or Ctrl+Shift+Z → redo
    if (
      (e.key === 'y' && (e.ctrlKey || e.metaKey)) ||
      (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)
    ) {
      e.preventDefault();
      dispatch({ type: 'REDO' });
    }
    // Escape → cancel / deselect
    if (e.key === 'Escape') {
      wallPt1Ref.current  = null;
      previewRef.current  = null;
      isDrawingRef.current = false;
      dispatch({ type: 'SELECT', payload: null });
      requestDraw();
    }
    // Space → enable pan mode
    if (e.key === ' ') {
      e.preventDefault();
      isSpaceRef.current = true;
    }
  }, [requestDraw]);

  const onKeyUp = useCallback((e) => {
    if (e.key === ' ') {
      isSpaceRef.current   = false;
      isPanningRef.current = false;
    }
  }, []);

  // ── Canvas setup + event registration ────────────────────
  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Keep canvas pixel size in sync with container
    const ro = new ResizeObserver(() => {
      canvas.width  = container.clientWidth;
      canvas.height = container.clientHeight;
      requestDraw();
    });
    ro.observe(container);
    canvas.width  = container.clientWidth;
    canvas.height = container.clientHeight;
    requestDraw();

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup',   onMouseUp);
    canvas.addEventListener('wheel',     onWheel,   { passive: false });
    window.addEventListener('keydown',   onKeyDown);
    window.addEventListener('keyup',     onKeyUp);

    return () => {
      ro.disconnect();
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup',   onMouseUp);
      canvas.removeEventListener('wheel',     onWheel);
      window.removeEventListener('keydown',   onKeyDown);
      window.removeEventListener('keyup',     onKeyUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onMouseDown, onMouseMove, onMouseUp, onWheel, onKeyDown, onKeyUp, requestDraw]);

  // ── CSS cursor style ──────────────────────────────────────
  const cursor =
    (isPanningRef.current || isSpaceRef.current) ? 'grabbing' :
    isSpaceRef.current  ? 'grab'       :
    tool === 'eraser'   ? 'crosshair'  :
    tool === 'select'   ? 'default'    : 'crosshair';

  // ── Export ────────────────────────────────────────────────
  const exportAsPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a  = document.createElement('a');
    a.href   = canvas.toDataURL('image/png');
    a.download = 'floor-plan.png';
    a.click();
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(stateRef.current, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = 'floor-plan.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // ── localStorage persistence ──────────────────────────────
  const saveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem('buildcost_fp', JSON.stringify(stateRef.current));
      return true;
    } catch { return false; }
  }, []);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem('buildcost_fp');
      if (!raw) return false;
      dispatch({ type: 'RESTORE', payload: JSON.parse(raw) });
      return true;
    } catch { return false; }
  }, []);

  const clearAll = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  return {
    canvasRef,
    containerRef,
    tool,
    setTool,
    zoom,
    handleZoom,
    snapEnabled,
    setSnapEnabled,
    mousePos,
    state,
    dispatch,
    undo: () => dispatch({ type: 'UNDO' }),
    redo: () => dispatch({ type: 'REDO' }),
    canUndo,
    canRedo,
    exportAsPNG,
    exportJSON,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearAll,
    cursor,
  };
}

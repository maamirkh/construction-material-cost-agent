"""
routers/ai_floor_plan.py — Floor plan generator via Llama 3 + Stable Diffusion

Workflow:
    1. Receive user input (plot size, rooms)
    2. Check in-memory cache — return immediately if found
    3. Call Llama 3 (Ollama locally OR HuggingFace remotely) → structured JSON layout
    4. Convert JSON layout to a detailed Stable Diffusion prompt
    5. Call HuggingFace Stable Diffusion API → blueprint-style PNG image
    6. Return base64 image + layout JSON to frontend

Environment Variables (backend/.env):
    HUGGINGFACE_API_KEY  — HuggingFace token (required for SD + HF Llama)
    LLAMA_API_URL        — Llama endpoint (default: http://localhost:11434/api/generate)
    LLAMA_API_KEY        — API key for remote Llama (leave empty for local Ollama)
    USE_OLLAMA           — "true" = local Ollama, "false" = HuggingFace Llama
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import io
import json
import os
import time
from typing import Any, Dict, List, Optional

import httpx
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, field_validator

load_dotenv(override=True)

# ─── Router ───────────────────────────────────────────────────

router = APIRouter(
    prefix="/api/ai-floor-plan",
    tags=["AI Floor Plan"],
)

# ─── Config ───────────────────────────────────────────────────

HF_API_KEY    = os.getenv("HUGGINGFACE_API_KEY", "").strip()
LLAMA_API_URL = os.getenv("LLAMA_API_URL", "http://localhost:11434/api/generate").strip()
LLAMA_API_KEY = os.getenv("LLAMA_API_KEY", "").strip()
USE_OLLAMA    = os.getenv("USE_OLLAMA", "true").lower() == "true"

# HuggingFace model endpoints (new router endpoint)
SD_API_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"

LLAMA_HF_URL = "https://router.huggingface.co/hf-inference/models/meta-llama/Meta-Llama-3-8B-Instruct"
# ─── In-memory cache ──────────────────────────────────────────

_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_TTL = 3600  # 1 hour


def _cache_key(data: dict) -> str:
    return hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()


def _cache_get(key: str) -> Optional[Dict]:
    entry = _CACHE.get(key)
    if entry and (time.time() - entry["ts"]) < _CACHE_TTL:
        return entry["result"]
    return None


def _cache_set(key: str, result: dict) -> None:
    if len(_CACHE) >= 100:                      # evict oldest when full
        oldest = min(_CACHE, key=lambda k: _CACHE[k]["ts"])
        del _CACHE[oldest]
    _CACHE[key] = {"result": result, "ts": time.time()}


# ─── Pydantic schemas ─────────────────────────────────────────

class RoomRequirement(BaseModel):
    type:  str
    count: int

    @field_validator("count")
    @classmethod
    def count_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("count must be ≥ 1")
        return v

    @field_validator("type")
    @classmethod
    def type_not_empty(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("room type cannot be blank")
        return v


class GenerateFloorPlanRequest(BaseModel):
    plot_width:   float
    plot_height:  float
    floors:       int  = 1
    rooms:        List[RoomRequirement]
    style:        str  = "Pakistani"
    extra_notes:  str  = ""

    @field_validator("plot_width", "plot_height")
    @classmethod
    def dimensions_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Plot dimensions must be positive")
        return v

    @field_validator("floors")
    @classmethod
    def floors_valid(cls, v: int) -> int:
        if v < 1 or v > 5:
            raise ValueError("floors must be between 1 and 5")
        return v


class GenerateFloorPlanResponse(BaseModel):
    success:            bool
    image_base64:       str           # PNG image encoded as base64
    layout:             Dict[str, Any] # JSON layout from Llama 3
    prompt_used:        str           # SD prompt (for transparency / debugging)
    model_used:         str
    generation_time_ms: int
    cached:             bool = False


# ─── Llama 3 — prompt builder ─────────────────────────────────

def _build_llama_prompt(req: GenerateFloorPlanRequest) -> str:
    rooms_str = ", ".join(
        f"{r.count} {r.type}{'s' if r.count > 1 else ''}"
        for r in req.rooms
    )
    extra = (
        f" Additional requirements: {req.extra_notes.strip()}."
        if req.extra_notes.strip() else ""
    )
    return f"""You are an architectural layout planner specialising in Pakistani residential houses.
Generate a structured JSON floor plan layout for the following house.

Specifications:
- Plot size  : {req.plot_width} ft wide × {req.plot_height} ft deep
- Floors     : {req.floors}
- Rooms      : {rooms_str}
- Style      : {req.style}{extra}

Return ONLY valid JSON — no explanation, no markdown:
{{
  "plot_width": {req.plot_width},
  "plot_height": {req.plot_height},
  "style": "{req.style}",
  "rooms": [
    {{
      "type": "lounge",
      "label": "Lounge",
      "width_ft": 15,
      "height_ft": 12,
      "position": "front-centre"
    }}
  ],
  "features": ["main entrance south-centre", "car porch at front", "staircase central"]
}}

Include every room from this list: {rooms_str}.
Use realistic Pakistani house dimensions (bedroom ≥ 10×10 ft, bathroom ≥ 5×7 ft, kitchen ≥ 8×10 ft).
"""


# ─── Llama 3 — API calls ──────────────────────────────────────

async def _call_llama_ollama(prompt: str) -> dict:
    """Call local Ollama instance (llama3.1 model)."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            LLAMA_API_URL,
            json={
                "model":   "llama3.1",
                "prompt":  prompt,
                "stream":  False,
                "options": {"temperature": 0.3, "num_predict": 1024},
            },
        )
        resp.raise_for_status()
        raw = resp.json().get("response", "")

    start = raw.find("{")
    end   = raw.rfind("}") + 1
    if start == -1:
        raise ValueError("Ollama returned no JSON object")
    return json.loads(raw[start:end])


async def _call_llama_hf(prompt: str) -> dict:
    """Call Llama 3 via HuggingFace Inference API."""
    if not HF_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="HUGGINGFACE_API_KEY is not set in backend/.env",
        )
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens":  1024,
            "temperature":     0.3,
            "return_full_text": False,
        },
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(LLAMA_HF_URL, headers=headers, json=payload)
        resp.raise_for_status()
        data     = resp.json()
        raw_text = data[0]["generated_text"] if isinstance(data, list) else str(data)

    start = raw_text.find("{")
    end   = raw_text.rfind("}") + 1
    if start == -1:
        raise ValueError("HF Llama returned no JSON object")
    return json.loads(raw_text[start:end])


async def _get_llama_layout(req: GenerateFloorPlanRequest) -> dict:
    """
    Fetch JSON layout from Llama 3.
    Falls back to a minimal layout dict if the API call fails,
    so SD generation can still proceed.
    """
    prompt = _build_llama_prompt(req)
    try:
        if USE_OLLAMA:
            return await _call_llama_ollama(prompt)
        else:
            return await _call_llama_hf(prompt)
    except Exception:
        # Graceful fallback — build layout from request data with default dimensions
        _DEFAULT_DIMS = {
            "bedroom":          (12, 10),
            "bathroom":         (7,  5),
            "kitchen":          (10, 8),
            "lounge":           (15, 12),
            "drawing room":     (14, 12),
            "dining":           (12, 10),
            "store room":       (8,  7),
            "servant quarter":  (10, 8),
            "veranda":          (10, 8),
            "garage":           (12, 10),
            "staircase":        (8,  8),
        }
        _FALLBACK_POSITIONS = [
            "back-left", "back-centre", "back-right",
            "mid-left",  "mid-centre",  "mid-right",
            "front-left","front-centre","front-right",
        ]
        rooms_out = []
        pos_idx = 0
        for r in req.rooms:
            w, h = _DEFAULT_DIMS.get(r.type.lower(), (10, 10))
            for _ in range(r.count):
                rooms_out.append({
                    "type":      r.type,
                    "label":     r.type.title(),
                    "count":     1,
                    "width_ft":  w,
                    "height_ft": h,
                    "position":  _FALLBACK_POSITIONS[pos_idx % len(_FALLBACK_POSITIONS)],
                })
                pos_idx += 1
        return {
            "plot_width":  req.plot_width,
            "plot_height": req.plot_height,
            "style":       req.style,
            "rooms":       rooms_out,
            "features": [
                "main entrance at south centre",
                "car porch at front",
                "Pakistani traditional layout",
            ],
        }


# ─── Stable Diffusion — prompt builder ───────────────────────

def _build_sd_prompts(layout: dict, req: GenerateFloorPlanRequest) -> tuple[str, str]:
    """Return (positive_prompt, negative_prompt) for Stable Diffusion."""
    room_parts: List[str] = []
    for room in layout.get("rooms", []):
        rtype  = room.get("type",  "room")
        label  = room.get("label", rtype)
        w_ft   = room.get("width_ft",  "")
        h_ft   = room.get("height_ft", "")
        count  = room.get("count", 1)
        if count > 1:
            room_parts.append(f"{count} {label}s")
        elif w_ft and h_ft:
            room_parts.append(f"{label} {w_ft}×{h_ft}ft")
        else:
            room_parts.append(label)

    rooms_desc = ", ".join(room_parts) if room_parts else "multiple rooms"
    features   = ", ".join(layout.get("features", []))
    style_note = f"{req.style} style house" if req.style else "house"

    # Build per-room dimension strings for the prompt
    dim_parts: List[str] = []
    for room in layout.get("rooms", []):
        label = room.get("label", room.get("type", "Room"))
        w_ft  = room.get("width_ft",  "")
        h_ft  = room.get("height_ft", "")
        if w_ft and h_ft:
            dim_parts.append(f"{label}: {w_ft}'-0\" x {h_ft}'-0\"")

    dim_text = ", ".join(dim_parts) if dim_parts else ""

    positive = (
        "2D architectural floor plan, top-down overhead view, "
        f"{int(req.plot_width)} x {int(req.plot_height)} feet residential plot, "
        f"{rooms_desc}, {style_note}, {features}, "
        "clean black lines on pure white background, "
        "wall thickness shown with cross-hatching, "
        "door openings with quarter-circle swing arcs, "
        "window openings as gaps in walls, "
        "Pakistani residential house ground floor plan, "
        "rooms clearly separated by walls, no overlapping rooms, "
        "professional architect technical drawing, no text, no labels"
    )

    negative = (
        "3D render, perspective, isometric, "
        "interior design, colors, shadows, gradients, realistic photo, "
        "painting, sketch, people, trees, outdoor landscape, elevation view, "
        "side view, blurry, distorted, watermark, logo, "
        "text, letters, words, labels, numbers, measurements, writing, "
        "any text inside image, room names, dimensions text, "
        "Arabic text, Urdu text, Hindi text, mirrored text, reversed text, "
        "furniture, beds, sofas, tables, chairs"
    )

    return positive, negative


# ─── Pillow: dimension annotation ────────────────────────────

def _get_font(size: int):
    """Load a system font or fall back to PIL default."""
    candidates = [
        # Linux
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        # Windows
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
        # macOS
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    return ImageFont.load_default()


def _annotate_dimensions(
    image_bytes: bytes,
    plot_width:  float,
    plot_height: float,
    layout:      dict,
) -> bytes:
    """
    Draw dimension lines, room labels, and a room schedule on the SD image.

    Adds:
      - Top border:    plot width  "35'-0""  with arrow line
      - Right border:  plot height "70'-0""  with arrow line (rotated)
      - Room labels overlaid DIRECTLY on the SD image (covers garbled SD text)
      - Room schedule legend below the image
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    PAD_TOP   = 60   # space for width dimension
    PAD_RIGHT = 80   # space for height dimension
    PAD_BOT   = 10
    PAD_LEFT  = 10

    canvas_w = img.width  + PAD_LEFT + PAD_RIGHT
    canvas_h = img.height + PAD_TOP  + PAD_BOT

    canvas = Image.new("RGB", (canvas_w, canvas_h), (255, 255, 255))
    canvas.paste(img, (PAD_LEFT, PAD_TOP))

    draw   = ImageDraw.Draw(canvas)
    font_l = _get_font(20)   # large  — dimension values
    font_s = _get_font(14)   # small  — room labels
    font_r = _get_font(12)   # tiny   — room size text inside image

    # Image region boundaries on canvas
    ix = PAD_LEFT
    iy = PAD_TOP
    iw = img.width
    ih = img.height

    # ── Room labels overlaid on SD image (covers garbled text) ──
    rooms = layout.get("rooms", [])

    # Position grid: maps position keyword → (col_frac, row_frac) centre of cell
    # Rows: front=bottom (0.85), mid=middle (0.5), back=top (0.15)
    # Cols: left=0.17, centre=0.5, right=0.83
    _POS_MAP = {
        "front-left":   (0.17, 0.83), "front-centre":  (0.50, 0.83), "front-right":  (0.83, 0.83),
        "mid-left":     (0.17, 0.50), "mid-centre":    (0.50, 0.50), "mid-right":    (0.83, 0.50),
        "back-left":    (0.17, 0.17), "back-centre":   (0.50, 0.17), "back-right":   (0.83, 0.17),
        # aliases
        "front":        (0.50, 0.83),
        "middle":       (0.50, 0.50),
        "back":         (0.50, 0.17),
        "left":         (0.17, 0.50),
        "right":        (0.83, 0.50),
        "centre":       (0.50, 0.50),
        "center":       (0.50, 0.50),
    }
    # Auto-assign grid slots to rooms that have no position
    _AUTO_SLOTS = [
        (0.17, 0.17), (0.50, 0.17), (0.83, 0.17),
        (0.17, 0.50), (0.50, 0.50), (0.83, 0.50),
        (0.17, 0.83), (0.50, 0.83), (0.83, 0.83),
    ]
    auto_idx = 0
    used_slots: set = set()

    def _best_slot(pos_str: str):
        nonlocal auto_idx
        key = (pos_str or "").strip().lower()
        # Try full key first, then first word, then auto
        for k in [key, key.split("-")[0]]:
            if k in _POS_MAP:
                slot = _POS_MAP[k]
                if slot not in used_slots:
                    used_slots.add(slot)
                    return slot
        # Auto-assign an unused slot
        while auto_idx < len(_AUTO_SLOTS):
            slot = _AUTO_SLOTS[auto_idx]
            auto_idx += 1
            if slot not in used_slots:
                used_slots.add(slot)
                return slot
        return (0.5, 0.5)  # fallback centre

    for room in rooms:
        label  = room.get("label", room.get("type", "Room"))
        w_ft   = room.get("width_ft",  "")
        h_ft   = room.get("height_ft", "")
        pos    = room.get("position",  "")
        count  = room.get("count", 1)

        cf, rf = _best_slot(pos)
        cx = ix + int(iw * cf)   # canvas x centre
        cy = iy + int(ih * rf)   # canvas y centre

        # Build label lines
        name_line = f"{label}" + (f" x{count}" if count > 1 else "")
        size_line  = f"{w_ft}' x {h_ft}'" if (w_ft and h_ft) else ""

        # Measure text
        try:
            nb = draw.textbbox((0, 0), name_line, font=font_r)
            nw, nh = nb[2] - nb[0], nb[3] - nb[1]
        except Exception:
            nw, nh = len(name_line) * 8, 14
        try:
            sb = draw.textbbox((0, 0), size_line, font=font_r) if size_line else (0,0,0,0)
            sw, sh = (sb[2]-sb[0], sb[3]-sb[1]) if size_line else (0, 0)
        except Exception:
            sw, sh = len(size_line) * 8, 12

        box_w = max(nw, sw) + 12
        box_h = nh + (sh + 4 if size_line else 0) + 8

        bx1 = cx - box_w // 2
        by1 = cy - box_h // 2
        bx2 = bx1 + box_w
        by2 = by1 + box_h

        # White filled box to cover any garbled SD text beneath
        draw.rectangle([bx1, by1, bx2, by2],
                       fill=(255, 255, 255, 230) if hasattr(draw, 'rectangle') else "white",
                       outline="#334155", width=1)
        # Room name
        draw.text((bx1 + 6, by1 + 4), name_line, fill="#1d4ed8", font=font_r)
        # Size (feet)
        if size_line:
            draw.text((bx1 + 6, by1 + 4 + nh + 2), size_line, fill="#374151", font=font_r)

    # ── Width dimension (top) ───────────────────────────────
    width_label = f"{int(plot_width)}'-0\""
    dy = PAD_TOP // 2                       # y of dimension line

    draw.line([(ix, dy), (ix + iw, dy)], fill="black", width=2)
    draw.line([(ix, dy - 10), (ix, dy + 10)], fill="black", width=2)
    draw.line([(ix + iw, dy - 10), (ix + iw, dy + 10)], fill="black", width=2)
    draw.polygon([(ix,    dy), (ix + 12, dy - 5), (ix + 12, dy + 5)], fill="black")
    draw.polygon([(ix+iw, dy), (ix+iw-12, dy - 5), (ix+iw-12, dy + 5)], fill="black")
    try:
        bbox = draw.textbbox((0, 0), width_label, font=font_l)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    except Exception:
        tw, th = len(width_label) * 12, 20
    tx = ix + (iw - tw) // 2
    ty = dy - th // 2
    draw.rectangle([tx - 5, ty - 3, tx + tw + 5, ty + th + 3], fill="white")
    draw.text((tx, ty), width_label, fill="black", font=font_l)

    # ── Height dimension (right side) ──────────────────────
    height_label = f"{int(plot_height)}'-0\""
    dx = ix + iw + PAD_RIGHT // 2

    draw.line([(dx, iy), (dx, iy + ih)], fill="black", width=2)
    draw.line([(dx - 10, iy), (dx + 10, iy)], fill="black", width=2)
    draw.line([(dx - 10, iy + ih), (dx + 10, iy + ih)], fill="black", width=2)
    draw.polygon([(dx, iy),    (dx - 5, iy + 12), (dx + 5, iy + 12)], fill="black")
    draw.polygon([(dx, iy+ih), (dx - 5, iy+ih-12), (dx + 5, iy+ih-12)], fill="black")
    try:
        bbox2 = draw.textbbox((0, 0), height_label, font=font_l)
        tw2, th2 = bbox2[2] - bbox2[0], bbox2[3] - bbox2[1]
    except Exception:
        tw2, th2 = len(height_label) * 12, 20

    txt_img = Image.new("RGBA", (tw2 + 10, th2 + 6), (255, 255, 255, 0))
    txt_d   = ImageDraw.Draw(txt_img)
    txt_d.rectangle([0, 0, tw2 + 9, th2 + 5], fill="white")
    txt_d.text((5, 3), height_label, fill="black", font=font_l)
    rotated = txt_img.rotate(90, expand=True)
    ry = iy + (ih - rotated.height) // 2
    rx = dx - rotated.width // 2
    canvas.paste(rotated, (rx, ry), mask=rotated)

    # ── Room schedule legend (below image) ──────────────────
    if rooms:
        legend_lines = ["ROOM SCHEDULE"]
        legend_lines.append(f"Plot: {int(plot_width)}' x {int(plot_height)}'")
        legend_lines.append("─" * 28)
        for room in rooms:
            label = room.get("label", room.get("type", "Room"))
            w_ft  = room.get("width_ft",  "")
            h_ft  = room.get("height_ft", "")
            count = room.get("count", 1)
            if w_ft and h_ft:
                size_str = f"{w_ft}'-0\" x {h_ft}'-0\""
                sfx = f" x{count}" if count > 1 else ""
                legend_lines.append(f"{label}{sfx}  {size_str}")
            else:
                sfx = f" x{count}" if count > 1 else ""
                legend_lines.append(f"{label}{sfx}")

        line_h = 17
        box_h  = len(legend_lines) * line_h + 16
        box_w  = 260

        bx = ix
        by = iy + ih + 8

        needed_h = by + box_h + 10
        if needed_h > canvas.height:
            extra   = needed_h - canvas.height
            canvas2 = Image.new("RGB", (canvas.width, canvas.height + extra), (255, 255, 255))
            canvas2.paste(canvas, (0, 0))
            canvas  = canvas2
            draw    = ImageDraw.Draw(canvas)

        draw.rectangle([bx, by, bx + box_w, by + box_h],
                       fill="#f8fafc", outline="#334155", width=1)
        for i, line in enumerate(legend_lines):
            if i == 0:
                col, f = "#1d4ed8", font_l
            elif i == 1:
                col, f = "#0f172a", font_l
            elif line.startswith("─"):
                col, f = "#94a3b8", font_s
            else:
                col, f = "#0f172a", font_s
            draw.text((bx + 8, by + 8 + i * line_h), line, fill=col, font=f)

    out = io.BytesIO()
    canvas.save(out, format="PNG")
    return out.getvalue()


# ─── Stable Diffusion — API call ──────────────────────────────

async def _call_stable_diffusion(positive: str, negative: str) -> bytes:
    """
    Call HuggingFace Stable Diffusion XL API.
    Returns raw PNG bytes.
    Retries once if the model is still loading (503).
    """
    if not HF_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="HUGGINGFACE_API_KEY is not set in backend/.env",
        )

    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    payload = {
        "inputs": positive,
        "parameters": {
            "width":               768,
            "height":              1024,
            "num_inference_steps": 4,
            "guidance_scale":      0.0,
        },
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        for attempt in range(2):
            resp = await client.post(SD_API_URL, headers=headers, json=payload)

            # Model still loading — wait and retry
            if resp.status_code == 503:
                try:
                    wait_sec = float(resp.json().get("estimated_time", 25))
                except Exception:
                    wait_sec = 25.0
                await asyncio.sleep(min(wait_sec, 35))
                continue

            if resp.status_code == 429:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=(
                        "HuggingFace free tier rate limit reached. "
                        "Please wait a few minutes and try again."
                    ),
                )

            if resp.status_code != 200:
                try:
                    err_detail = resp.json()
                except Exception:
                    err_detail = resp.text[:300]
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Stable Diffusion API error {resp.status_code}: {err_detail}",
                )

            return resp.content   # raw PNG bytes

    raise HTTPException(
        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
        detail=(
            "Stable Diffusion model is still warming up. "
            "Please try again in 30 seconds."
        ),
    )


# ─── Endpoint ─────────────────────────────────────────────────

@router.post(
    "/generate",
    response_model=GenerateFloorPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate floor plan image",
    description=(
        "Calls Llama 3 to produce a JSON room layout, converts it to a "
        "Stable Diffusion prompt, and returns a blueprint-style PNG image "
        "encoded as base64."
    ),
)
async def generate_floor_plan(req: GenerateFloorPlanRequest) -> GenerateFloorPlanResponse:
    t_start = time.monotonic()

    # ── Cache check ────────────────────────────────────────────
    ck     = _cache_key(req.model_dump())
    cached = _cache_get(ck)
    if cached:
        return GenerateFloorPlanResponse(**cached, cached=True)

    # ── Step 1: Llama 3 → JSON layout ─────────────────────────
    layout = await _get_llama_layout(req)

    # ── Step 2: Build SD prompts ───────────────────────────────
    positive_prompt, negative_prompt = _build_sd_prompts(layout, req)

    # ── Step 3: Stable Diffusion → PNG ────────────────────────
    image_bytes = await _call_stable_diffusion(positive_prompt, negative_prompt)

    # ── Step 4: Annotate with guaranteed English measurements ─
    image_bytes  = _annotate_dimensions(image_bytes, req.plot_width, req.plot_height, layout)
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    generation_time_ms = int((time.monotonic() - t_start) * 1000)

    result = {
        "success":            True,
        "image_base64":       image_base64,
        "layout":             layout,
        "prompt_used":        positive_prompt,
        "model_used":         "FLUX.1-schnell + llama3",
        "generation_time_ms": generation_time_ms,
        "cached":             False,
    }

    _cache_set(ck, result)

    return GenerateFloorPlanResponse(**result)

import json
import os
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# ── Database: create all tables on startup ────────────────────
from database import engine, Base
Base.metadata.create_all(bind=engine)

# ── Routers ───────────────────────────────────────────────────
from routers.floor_plans    import router as floor_plans_router
from routers.ai_floor_plan  import router as ai_floor_plan_router
from routers.validation import router as validation_router

PRICES_FILE = os.path.join(os.path.dirname(__file__), "material_prices.json")

app = FastAPI(
    title="BuildCost API",
    version="2.0.0",
    description="Construction Cost Estimation + Floor Plan Designer API",
)

# ── CORS ──────────────────────────────────────────────────────
# Add your production domain to ALLOWED_ORIGINS in .env, e.g.:
#   ALLOWED_ORIGINS=https://buildcost.vercel.app,https://www.buildcost.pk
_extra_origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if o.strip()
]

ALLOWED_ORIGINS = [
    "http://localhost:3000",   # Next.js dev server
    "http://localhost:3001",
    *_extra_origins,           # production domains from .env
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount routers ─────────────────────────────────────────────
app.include_router(floor_plans_router)
app.include_router(ai_floor_plan_router)
app.include_router(validation_router)


class EstimateRequest(BaseModel):
    plot_size_sqft: float
    plot_length_ft: float
    plot_width_ft: float
    construction_percentage: Optional[float] = 100.0
    number_of_floors: int
    number_of_rooms: int
    number_of_bathrooms: int
    number_of_kitchens: int
    room_sizes: str
    bathroom_sizes: str
    kitchen_sizes: str
    number_of_washingareas: int
    number_of_geysers: int
    number_of_columns: int = 14
    include_underground_tank: bool = False
    ug_tank_length_ft: float = 0.0
    ug_tank_width_ft: float = 0.0
    include_overhead_tank: bool = False
    oh_tank_length_ft: float = 0.0
    oh_tank_width_ft: float = 0.0
    include_tower: bool = False
    tower_length_ft: float = 0.0
    tower_width_ft: float = 0.0


@app.get("/")
def health():
    return {"status": "ok", "message": "Construction Cost Estimate API is running"}


@app.get("/api/prices")
def get_prices():
    try:
        with open(PRICES_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/prices")
def update_prices(prices: dict):
    try:
        with open(PRICES_FILE, "w") as f:
            json.dump(prices, f, indent=2)
        return {"status": "ok", "message": "Prices updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Chat ──────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


def _build_chat_agent():
    """Build main agent with current shared_inputs context."""
    from dotenv import load_dotenv
    from agents import Agent, AsyncOpenAI, OpenAIChatCompletionsModel
    from agents.run import RunConfig
    from tools import (
        estimate_gray_structure, estimate_steel, estimate_plumbing,
        estimate_paint, estimate_electric, doors_windows_tool, estimate_labour
    )

    load_dotenv(override=True)
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY missing in .env")

    client = AsyncOpenAI(
        api_key=gemini_api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/"
    )
    model = OpenAIChatCompletionsModel(
        model="gemini-2.5-flash",
        openai_client=client
    )
    run_cfg = RunConfig(model=model, model_provider=client, tracing_disabled=True)

    from shared_inputs import shared_inputs

    has_estimate = any(
        isinstance(v, dict) and "total_cost" in v
        for v in shared_inputs.values()
    )

    estimate_summary = ""
    if has_estimate:
        lines = []
        total = 0
        for key, val in shared_inputs.items():
            if isinstance(val, dict) and "total_cost" in val:
                name = key.replace("_data", "").replace("_", " ").title()
                lines.append(f"- {name}: PKR {val['total_cost']:,}")
                total += val["total_cost"]
        lines.append(f"- **Grand Total: PKR {total:,}**")
        estimate_summary = "Previously generated estimate:\n" + "\n".join(lines)

    instructions = (
        "You are BuildCost AI Assistant — a professional, friendly construction advisor for Pakistan. "
        "Your primary goal is to collect all required inputs for the construction cost estimation engine.\n\n"
        "The FastAPI backend remains the only source of truth. You are NOT allowed to:\n"
        "- Calculate construction costs\n"
        "- Estimate materials\n"
        "- Perform business logic\n"
        "- Generate assumptions\n"
        "- Guess missing values\n"
        "- Override backend validations\n\n"
        "### Conversation Rules\n"
        "Collect all missing information. Only ask for missing fields. "
        "Maintain a structured state throughout the conversation. Never ask twice for information already collected.\n\n"
        "### Fields to Collect:\n"
        "1. Plot Size (sqft)\n"
        "2. Plot Length (ft)\n"
        "3. Plot Width (ft)\n"
        "4. Construction Percentage (Do NOT assume. Options: Economy 70%, Standard 80%, Maximum Utilization 100%, Custom %)\n"
        "5. Number of Floors\n"
        "6. Number of Rooms per floor\n"
        "7. Number of Bathrooms per floor\n"
        "8. Number of Kitchens per floor\n"
        "9. Number of Washing areas\n"
        "10. Number of Geysers\n"
        "11. Number of Columns (default 14)\n"
        "12. Underground tank required? (Yes/No) -> If yes, collect Length & Width\n"
        "13. Overhead tank required? (Yes/No) -> If yes, collect Length & Width\n"
        "14. Tower required? (Yes/No) -> If yes, collect Length & Width\n\n"
        "### Size Collection Rules (After receiving counts):\n"
        "- For Rooms: Ask for each room size (e.g., 12x12, 14x14).\n"
        "- For Bathrooms: Ask for each bathroom size (e.g., 5x8, 6x8).\n"
        "- For Kitchens: Ask for each kitchen size (e.g., 10x12).\n\n"
        "### Validation Rules:\n"
        "- Plot Consistency: Length × Width should approximately match Plot Size. If not: 'Your plot dimensions appear inconsistent with the provided plot size. Please verify the dimensions.'\n"
        "- Count Validation: Number of sizes provided must equal the count for rooms, bathrooms, and kitchens.\n"
        "- Dimension Format: Valid format is LxW (e.g., 12x12). Invalid formats like '12 by 12' or '12*12' must be corrected.\n\n"
        "### Completion Rule:\n"
        "When all required inputs are collected, use the `submit_estimate` tool to generate the final payload and get the results from the backend.\n"
        "Display backend results exactly as returned. You may format or explain them, but never modify the numbers.\n\n"
        f"Shared project inputs:\n{json.dumps(shared_inputs, indent=2)}\n\n"
        f"{estimate_summary}"
    )

    main = Agent(
        name="Construction Expert Agent",
        instructions=instructions,
        model=model,
        tools=[submit_estimate_tool],
    )
    return main, run_cfg


def submit_estimate(
    plot_size_sqft: float,
    plot_length_ft: float,
    plot_width_ft: float,
    number_of_floors: int,
    number_of_rooms: int,
    number_of_bathrooms: int,
    number_of_kitchens: int,
    room_sizes: str,
    bathroom_sizes: str,
    kitchen_sizes: str,
    number_of_washingareas: int,
    number_of_geysers: int,
    construction_percentage: float = 100.0,
    number_of_columns: int = 14,
    include_underground_tank: bool = False,
    ug_tank_length_ft: float = 0.0,
    ug_tank_width_ft: float = 0.0,
    include_overhead_tank: bool = False,
    oh_tank_length_ft: float = 0.0,
    oh_tank_width_ft: float = 0.0,
    include_tower: bool = False,
    tower_length_ft: float = 0.0,
    tower_width_ft: float = 0.0
) -> str:
    """
    Submits the collected data to the estimation engine and returns the final estimate results.
    Call this ONLY when ALL required fields have been collected from the user.
    """
    try:
        data = EstimateRequest(
            plot_size_sqft=plot_size_sqft,
            plot_length_ft=plot_length_ft,
            plot_width_ft=plot_width_ft,
            construction_percentage=construction_percentage,
            number_of_floors=number_of_floors,
            number_of_rooms=number_of_rooms,
            number_of_bathrooms=number_of_bathrooms,
            number_of_kitchens=number_of_kitchens,
            room_sizes=room_sizes,
            bathroom_sizes=bathroom_sizes,
            kitchen_sizes=kitchen_sizes,
            number_of_washingareas=number_of_washingareas,
            number_of_geysers=number_of_geysers,
            number_of_columns=number_of_columns,
            include_underground_tank=include_underground_tank,
            ug_tank_length_ft=ug_tank_length_ft,
            ug_tank_width_ft=ug_tank_width_ft,
            include_overhead_tank=include_overhead_tank,
            oh_tank_length_ft=oh_tank_length_ft,
            oh_tank_width_ft=oh_tank_width_ft,
            include_tower=include_tower,
            tower_length_ft=tower_length_ft,
            tower_width_ft=tower_width_ft
        )
        results = create_estimate(data)
        return json.dumps(results, indent=2)
    except Exception as e:
        return f"Error: {str(e)}"

from agents import function_tool
submit_estimate_tool = function_tool(submit_estimate)


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    try:
        agent, run_cfg = _build_chat_agent()

        from agents import Runner

        # Build input: history + new user message
        # Drop leading assistant messages — conversation must start with user role
        history = [{"role": m.role, "content": m.content} for m in req.history]
        while history and history[0]["role"] != "user":
            history.pop(0)
        input_messages = history + [{"role": "user", "content": req.message}]

        result = await Runner.run(agent, input_messages, run_config=run_cfg)
        reply = result.final_output or "Sorry, I could not generate a response."

        return {
            "reply": reply,
            "agent": result.last_agent.name if result.last_agent else "Construction Expert Agent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/estimate")
def create_estimate(data: EstimateRequest):
    try:
        from shared_inputs import shared_inputs
        from tools.gray_structure_tool import gray_structure_tool_func
        from tools.steel_estimate_tool import steel_estimate_tool_func
        from tools.plumbing_estimate_tool import plumbing_tool_func
        from tools.paint_estimate_tool import paint_estimate_tool_func
        from tools.electric_estimate_tool import electric_estimate_tool_func
        from tools.door_windows_tool import doors_windows_tool_func
        from tools.labour_cost_tool import labour_cost_tool_func
        from services.validation_service import ValidationService
        from models.plot_models import Plot
        from models.room_models import Room as RoomModel

        # 1. Validation Logic
        def parse_to_room_models(size_str, room_type):
            rooms = []
            if not size_str:
                return rooms
            for item in size_str.split(","):
                item = item.strip().lower().replace(" ", "")
                if "x" in item:
                    try:
                        l, w = map(float, item.split("x"))
                        rooms.append(RoomModel(room_type=room_type, length=l, width=w))
                    except:
                        continue
            return rooms

        validation_rooms = []
        validation_rooms.extend(parse_to_room_models(data.room_sizes, "bedroom"))
        validation_rooms.extend(parse_to_room_models(data.bathroom_sizes, "washroom"))
        validation_rooms.extend(parse_to_room_models(data.kitchen_sizes, "kitchen"))

        plot = Plot(
            length=data.plot_length_ft, 
            width=data.plot_width_ft, 
            construction_percentage=data.construction_percentage
        )
        
        v_service = ValidationService()
        v_res = v_service.validate_construction_plan(plot, validation_rooms)

        if not v_res.success:
            # Collect critical error messages
            critical_errors = [w.message for w in v_res.warnings if w.warning_code in ["AREA_EXCEEDED", "DIMENSION_TOO_SMALL", "NO_ROOMS"]]
            if not critical_errors:
                critical_errors = [v_res.message]
            
            raise HTTPException(
                status_code=400, 
                detail={
                    "error": "Validation Failed",
                    "message": "The provided plan is architecturally invalid.",
                    "details": critical_errors
                }
            )

        # 2. Proceed with Estimation if valid
        shared_inputs.update(data.model_dump())

        results = {}
        errors = {}

        for name, func in [
            ("gray_structure", gray_structure_tool_func),
            ("steel", steel_estimate_tool_func),
            ("plumbing", plumbing_tool_func),
            ("paint", paint_estimate_tool_func),
            ("electric", electric_estimate_tool_func),
            ("doors_windows", doors_windows_tool_func),
            ("labour", labour_cost_tool_func),
        ]:
            try:
                results[name] = func()
            except Exception as e:
                errors[name] = str(e)

        grand_total = sum(
            v.get("total_cost", 0)
            for v in results.values()
            if isinstance(v, dict) and "total_cost" in v
        )
        results["grand_total"] = grand_total
        
        # Include validation warnings in results if any (e.g., HIGH_DENSITY)
        if v_res.warnings:
            results["validation_warnings"] = [w.model_dump() for w in v_res.warnings]

        if errors:
            results["errors"] = errors

        return results

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


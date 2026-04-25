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


class EstimateRequest(BaseModel):
    plot_size_sqft: float
    plot_length_ft: float
    plot_width_ft: float
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
        "You specialize in residential construction cost estimation, material quantities, construction methods, "
        "market rates, and building best practices. "
        "Answer all questions in clear, simple English. "
        "If an estimate has been generated, refer to it in your answers. "
        "If asked about something unrelated to construction, politely redirect. "
        "Keep responses concise and well-structured.\n\n"
        f"Shared project inputs:\n{json.dumps(shared_inputs, indent=2)}\n\n"
        f"{estimate_summary}"
    )

    sub_agents = [
        Agent(name="Gray Structure Agent", instructions=instructions, tools=[estimate_gray_structure]),
        Agent(name="Steel Agent", instructions=instructions, tools=[estimate_steel]),
        Agent(name="Plumbing Agent", instructions=instructions, tools=[estimate_plumbing]),
        Agent(name="Paint Agent", instructions=instructions, tools=[estimate_paint]),
        Agent(name="Electrical Agent", instructions=instructions, tools=[estimate_electric]),
        Agent(name="Doors and Windows Agent", instructions=instructions, tools=[doors_windows_tool]),
        Agent(name="Labour Agent", instructions=instructions, tools=[estimate_labour]),
    ]

    main = Agent(
        name="Construction Expert Agent",
        instructions=instructions,
        model=model,
        handoffs=sub_agents,
    )
    return main, run_cfg


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

        if errors:
            results["errors"] = errors

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


import os
import json
import asyncio
from dotenv import load_dotenv
from agents import Agent, Runner, AsyncOpenAI, OpenAIChatCompletionsModel
from agents.run import RunConfig
from shared_inputs import shared_inputs, get_initial_inputs
from tools.bricks_estimate_tool import bricks_agent
from tools import (
    estimate_steel,
    estimate_plumbing, estimate_paint, estimate_electric, estimate_gray_structure, estimate_labour,
    doors_windows_tool,
    steel_estimate_tool_func, plumbing_tool_func, gray_structure_tool_func, 
    paint_estimate_tool_func, electric_estimate_tool_func, doors_windows_tool_func, labour_cost_tool_func
)

# Load environment variables
load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")

if not gemini_api_key:
    raise ValueError(" GEMINI_API_KEY is missing in .env")

# 🔌 Gemini API Client Setup
external_client = AsyncOpenAI(
    api_key=gemini_api_key,
    base_url="https://generativelanguage.googleapis.com/v1beta/"
)

model = OpenAIChatCompletionsModel(
    model="gemini-2.0-flash",
    openai_client=external_client
)

config = RunConfig(
    model=model,
    model_provider=external_client,
    tracing_disabled=True
)

main_agent = None  # will be created later
estimation_summary_text = ""  # global summary


#  PHASE 1 - INPUT + TOOL ESTIMATES
def phase_1_estimation():
    global main_agent, estimation_summary_text

    print("\n Project info do:")
    get_initial_inputs()

    print("\n Estimations shuru ho rahi hain...\n")


    try:
        gray_structure = gray_structure_tool_func(
            number_of_floors=shared_inputs["number_of_floors"],
            plot_length_ft=shared_inputs["plot_length_ft"],
            plot_width_ft=shared_inputs["plot_width_ft"],
            number_of_rooms=shared_inputs["number_of_rooms"],
            room_sizes=shared_inputs["room_sizes"],
            bathroom_sizes=shared_inputs["bathroom_sizes"],
            kitchen_sizes=shared_inputs["kitchen_sizes"]
        )
        shared_inputs["gray_structure_data"] = gray_structure
        print("\n🔹 gray structure Estimate:")
        print(json.dumps(gray_structure, indent=2))
    except Exception as e:
        print(f"❌ Grey structure tool error: {e}")


    try:
        steel = steel_estimate_tool_func()
        shared_inputs["steel_data"] = steel
        print("\n🔹 Steel Estimate:")
        print(json.dumps(steel, indent=2))
    except Exception as e:
        print(f"❌ Steel tool error: {e}")

    try:
        plumbing = plumbing_tool_func()
        shared_inputs["plumbing_data"] = plumbing
        print("\n🔹 Plumbing Estimate:")
        print(json.dumps(plumbing, indent=2))
    except Exception as e:
        print(f"❌ Plumbing tool error: {e}")

    try:
        paint = paint_estimate_tool_func()
        shared_inputs["paint_data"] = paint
        print("\n🔹 Paint Estimate:")
        print(json.dumps(paint, indent=2))
    except Exception as e:
        print(f"❌ Paint tool error: {e}")

    try:
        electric = electric_estimate_tool_func()
        shared_inputs["electric_data"] = electric
        print("\n🔹 Electric Estimate:")
        print(json.dumps(electric, indent=2))
    except Exception as e:
        print(f"❌ Electric tool error: {e}")

    try:
        doors_windows = doors_windows_tool_func()
        shared_inputs["doors_windows_data"] = doors_windows
        print("\n🔹 Doors / Windows Estimate:")
        print(json.dumps(doors_windows, indent=2))
    except Exception as e:
        print(f"❌ Doors_windows tool error: {e}")

    try:
        labour_cost = labour_cost_tool_func()
        shared_inputs["labour_data"] = labour_cost
        print("\n🔹 Labour Estimate:")
        print(json.dumps(labour_cost, indent=2))
    except Exception as e:
        print(f"❌ Labour cost tool error: {e}")

    def generate_summary():
        summary_lines = []
        total_cost = 0

        for key, value in shared_inputs.items():
            if isinstance(value, dict) and "total_cost" in value:
                name = key.replace("_data", "").replace("_", " ").title()
                cost = value["total_cost"]
                summary_lines.append(f"{name}: {cost:,} PKR")
                total_cost += cost

        summary_lines.append(f"\n**Grand Total**: {total_cost:,} PKR")
        return "\n".join(summary_lines)
    
    estimation_summary_text = generate_summary()
    print("\n📋 ESTIMATION SUMMARY:")
    print(estimation_summary_text)



    #  multiple Agents
    gray_structure_agent = Agent(
        name = "Gray Structure Agent",
        instructions = """You are a professional and friendly construction advisor who creates accurate 
                        material and cost estimates for gray structures in residential construction projects. 
                        You must always rely on the shared inputs provided below and the previously calculated 
                        material breakdown. You will respond in simple and easy-to-understand english. In the 
                        estimate, you will include a detailed breakdown and total cost for cement, bricks, steel, 
                        sand, gravel, roof slab, columns, beams, plaster, flooring, and related gray structure items. 
                        Every response will be based on realistic construction logic — you will not provide speculative 
                        or irrelevant information. If a user asks about something unrelated to construction, politely 
                        explain that you are only a construction estimate advisor."""
                      f"Shared Inputs:\n{json.dumps(shared_inputs, indent=2)}\n\n",
        tools = [estimate_gray_structure]
    )

    door_windows_agent = Agent(
        name = "Doors and Windows Agent",
        instructions = """
                        You are a professional and friendly construction advisor specializing in doors, 
                        windows, and frames (chokhat) estimation. This is part of a residential construction 
                        project where a complete material and cost estimate is being generated. Always use the 
                        shared inputs provided (plot size, number of rooms, bathrooms, kitchens, floors, etc.) 
                        and your internal logic to calculate accurate quantities, sizes, and costs for all doors, 
                        windows, and chokhat in square feet and running feet.
                        Provide the output in a well-structured, itemized format with each component's quantity, 
                        unit, rate, and total cost. Keep your tone professional, concise, and focused only on construction 
                        estimation.
                    """
                    f"Shared Inputs:\n{json.dumps(shared_inputs, indent=2)}\n\n",
        tools = [doors_windows_tool]
    )

    electrict_agent = Agent(
        name = "Electrical Agent",
        instructions = """
                        You are a professional and friendly construction advisor specializing in residential 
                        electrical work estimation. This is part of a complete construction cost estimation 
                        project. Always use the shared inputs provided (number of rooms, bathrooms, kitchens, 
                        floors, and other relevant details) to calculate accurate quantities and costs for:
                        Wires (phase and neutral only) by gauge type (3/29, 7/29, 7/36, 7/44)
                        Conduit pipes
                        Bands
                        Switch boards, fan boxes, light boxes, plastic sockets
                        Electric sheets
                        LED lights
                        Distribution Boards (DB)
                        Breakers (per room, AC, and main breaker)
                        Provide the output in an itemized table showing quantity, unit, rate, and total cost 
                        for each item, along with a grand total. Keep the tone professional, concise, and 
                        focused on accurate residential construction estimation only.
                    """
                    f"Shared Inputs:\n{json.dumps(shared_inputs, indent=2)}\n\n",
        tools = [estimate_electric]
    )

    paint_agent = Agent(
        name = "Paint Agent",
        instructions = """
                        You are a professional and friendly construction advisor specializing in paint works.
                        This is a residential construction project for which you have generated a detailed 
                        paint material and cost estimate. Always use the provided shared inputs and summary for reference.
                        You can also answer any other relevant questions about paint materials, application methods, 
                        coverage, types, durability, or maintenance. If the user asks something irrelevant to paint or 
                        construction, politely explain that you are only a construction estimate and materials advisor.
                    """
                    f"Shared Inputs:\n{json.dumps(shared_inputs, indent=2)}\n\n",
        tools = [estimate_paint]
    )

    steel_agent = Agent(
        name = "Steel Agent",
        instructions = """
                        You are a professional and friendly construction advisor specializing in steel works.
                        This is a residential construction project for which you have generated a detailed steel 
                        material and cost estimate. Always use the provided shared inputs and summary for reference.
                        You can also answer any other relevant questions about steel materials, grades, strength, usage 
                        in columns, beams, slabs, bending, cutting, or storage. If the user asks something irrelevant 
                        to steel or construction, politely explain that you are only a construction estimate and materials 
                        advisor.
                    """
                    f"Shared Inputs:\n{json.dumps(shared_inputs, indent=2)}\n\n",
        tools = [estimate_steel]     
    )

    plumbing_agent = Agent(
        name = "Plumbing Agent",
        instructions = """
                        You are a professional and friendly construction advisor specializing in plumbing works.
                        This is a residential construction project for which you have generated a detailed 
                        plumbing material and cost estimate. Always refer to the provided shared inputs and summary 
                        for your answers. You can also answer any other relevant questions about plumbing materials, 
                        pipe types and sizes, fittings, installation methods, water supply systems, drainage systems, 
                        and maintenance tips. If the user asks something unrelated to plumbing or construction, 
                        politely explain that you are only a construction estimate and materials advisor.
                    """
                    f"Shared Inputs:\n{json.dumps(shared_inputs, indent=2)}\n\n",
        tools = [estimate_plumbing]
    )

    labour_agent = Agent(
        name = "Labour Agent",
        instructions = """
                    You are a professional and friendly construction advisor specializing in labour estimation and 
                    workforce requirements. This is a residential construction project for which you have generated a 
                    detailed labour quantity and cost estimate. Always refer to the provided shared inputs and summary 
                    for your answers. You can also answer any other relevant questions about labour categories, 
                    daily wages, productivity rates, crew sizes, work timelines, and best practices for managing 
                    construction workers. If the user asks something unrelated to labour or construction, politely 
                    explain that you are only a construction labour estimation and workforce advisor.
                    """
                    f"Shared Inputs:\n{json.dumps(shared_inputs, indent=2)}\n\n",
        tools = [estimate_labour]
    )

    full_context = (
        "You are a professional and friendly construction advisor."  
        "This is a residential construction project for which an estimate has already been generated."  
        "Always rely on the shared inputs and summary provided below."
        "pass user query to relevent agent"  
        "If the user asks something irrelevant, politely explain that this is only a construction estimate advisor."
        f"Shared Inputs:\n{json.dumps(shared_inputs, indent=2)}\n\n"
        f"{estimation_summary_text}"
    )

    main_agent = Agent(
        name="Construction Expert Agent",
        instructions=full_context,
        model= model,
        handoffs = [gray_structure_agent, door_windows_agent, electrict_agent, plumbing_agent, 
                    labour_agent, steel_agent, paint_agent]
        
    )


# ✅ PHASE 2 - AGENT Q&A LOOP
async def phase_2_agent_loop():
    print("\n Ab aap kisi bhi construction ya material related sawal ka jawab le sakte hain (type 'quit' to exit):\n")
    while True:
        user_input = input("🧑 You: ")
        if user_input.lower() in ["quit", "exit"]:
            print("👋 Allah Hafiz!")
            break

        try:
            result = await Runner.run(main_agent, user_input, run_config=config)
            for item in reversed(result.new_items):
                try:
                    print(result.last_agent.name)
                    print(f"\n🤖 Agent: {result.final_output}\n")
                    break
                except Exception:
                    continue
        except Exception as e:
            print(f"❌ Agent error: {e}")


# ✅ MAIN PROGRAM
if __name__ == "__main__":
    phase_1_estimation()
    asyncio.run(phase_2_agent_loop())




# tools/bricks_estimate_tool.py

import json
from agents import Agent, function_tool
from shared_inputs import shared_inputs



def bricks_logic(
    number_of_floors: int,
    room_sizes: str,
    bathroom_sizes: str,
    kitchen_sizes: str
) -> dict:
    """
    Estimate number of bricks and cost based on room sizes and floor count.
    Room sizes should be given as comma-separated values like '12x12, 10x10'.
    """

    # Read shared inputs
    number_of_floors = shared_inputs.get("number_of_floors", number_of_floors)
    room_sizes = shared_inputs.get("room_sizes", room_sizes)
    bathroom_sizes = shared_inputs.get("bathroom_sizes", bathroom_sizes)
    kitchen_sizes = shared_inputs.get("kitchen_sizes", kitchen_sizes)

    # Load prices
    try:
        with open("material_prices.json", "r") as file:
            prices = json.load(file)
    except Exception as e:
        return {"error": f"Failed to load material_prices.json: {str(e)}"}

    # Validate bricks pricing
    if "bricks" not in prices or "price_per_brick" not in prices["bricks"]:
        return {"error": "Missing 'bricks' price info in material_prices.json"}

    brick_price = prices["bricks"]["price_per_brick"]

    # Helper to parse sizes like '12x12, 10x10'
    def parse_sizes(size_str):
        sizes = []
        for item in size_str.split(","):
            item = item.strip().lower().replace(" ", "")
            if "x" in item:
                try:
                    length, width = map(float, item.split("x"))
                    sizes.append((length, width))
                except:
                    continue
        return sizes

    try:
        room_sizes_list = parse_sizes(room_sizes)
        bathroom_sizes_list = parse_sizes(bathroom_sizes)
        kitchen_sizes_list = parse_sizes(kitchen_sizes)

        wall_height = 9  # ft
        total_wall_area = 0
        all_rooms = room_sizes_list + bathroom_sizes_list + kitchen_sizes_list

        for length, width in all_rooms:
            perimeter = 2 * (length + width)
            wall_area = perimeter * wall_height
            total_wall_area += wall_area

        total_wall_area *= number_of_floors
        total_wall_area *= 0.85  # shared walls factor

        bricks_per_sqft = 1.5
        estimated_bricks = int(total_wall_area * bricks_per_sqft)
        estimated_cost = int(estimated_bricks * brick_price)

        shared_inputs["bricks_data"] = {
            "estimated_bricks": estimated_bricks,
            "total_wall_area_sqft": total_wall_area
        }

        return {
            "estimated_bricks": estimated_bricks,
            "total_wall_area_sqft": round(total_wall_area, 2),
            "brick_price_per_unit": brick_price,
            "estimated_brick_cost": estimated_cost
        }

    except Exception as e:
        return {"error": str(e)}

bricks_tool_func = bricks_logic
estimate_bricks = function_tool(bricks_tool_func)
   

bricks_agent = Agent(
    name="Bricks Estimation Agent",
    instructions="You are a bricks estimation expert. Use shared inputs to calculate estimates."
                 "Always rely on the shared inputs and summary provided below.",
                 
    tools=[estimate_bricks]
)




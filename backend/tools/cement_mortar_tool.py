# tools/cement_mortar_tool.py

import json
from agents import function_tool
from shared_inputs import shared_inputs

def cement_mortar_logic(
    number_of_floors: int,
    room_sizes: str,
    bathroom_sizes: str,
    kitchen_sizes: str
) -> dict:
    """
    Estimate cement & sand needed for:
    - Brick masonry (1:6)
    - Plaster (1:4)
    - Flooring (1:4 with avg 1.5 inch thickness)
    """

    # Inputs from shared or arguments
    number_of_floors = shared_inputs.get("number_of_floors", number_of_floors)
    room_sizes = shared_inputs.get("room_sizes", room_sizes)
    bathroom_sizes = shared_inputs.get("bathroom_sizes", bathroom_sizes)
    kitchen_sizes = shared_inputs.get("kitchen_sizes", kitchen_sizes)
    bricks_data = shared_inputs.get("bricks_data", {})

    # Load prices
    try:
        with open("material_prices.json", "r") as file:
            prices = json.load(file)
    except Exception as e:
        return {"error": f"Failed to load material_prices.json: {str(e)}"}

    # Check for required prices
    if "cement" not in prices or "price_per_bag" not in prices["cement"]:
        return {"error": "Missing 'cement' price info in material_prices.json"}
    if "sand" not in prices or "price_per_cft" not in prices["sand"]:
        return {"error": "Missing 'sand' price info in material_prices.json"}

    cement_price = prices["cement"]["price_per_bag"]
    sand_price = prices["sand"]["price_per_cft"]

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
        room_list = parse_sizes(room_sizes)
        bath_list = parse_sizes(bathroom_sizes)
        kitchen_list = parse_sizes(kitchen_sizes)

        # 1️⃣ Brick Masonry (1:6)
        total_bricks = bricks_data.get("estimated_bricks", 0)
        cement_bags_masonry = total_bricks / 200
        sand_cft_masonry = cement_bags_masonry * 7.5
        cement_cost_masonry = cement_bags_masonry * cement_price
        sand_cost_masonry = sand_cft_masonry * sand_price

        # 2️⃣ Plaster (1:4)
        wall_area = bricks_data.get("total_wall_area_sqft", 0)
        plaster_volume = wall_area * 0.042  # Approx 12mm plaster
        cement_cft_plaster = plaster_volume * (1 / 5)
        sand_cft_plaster = plaster_volume * (4 / 5)
        cement_bags_plaster = cement_cft_plaster / 1.25
        cement_cost_plaster = cement_bags_plaster * cement_price
        sand_cost_plaster = sand_cft_plaster * sand_price

        # 3️⃣ Flooring (1:4)
        flooring_thickness = 0.125  # 1.5 inch in ft
        floor_area = sum(l * w for l, w in room_list + bath_list + kitchen_list)
        total_floor_area = floor_area * number_of_floors
        flooring_volume = total_floor_area * flooring_thickness
        cement_cft_flooring = flooring_volume * (1 / 5)
        sand_cft_flooring = flooring_volume * (4 / 5)
        cement_bags_flooring = cement_cft_flooring / 1.25
        cement_cost_flooring = cement_bags_flooring * cement_price
        sand_cost_flooring = sand_cft_flooring * sand_price

        # 🔢 Totals
        total_cement_bags = cement_bags_masonry + cement_bags_plaster + cement_bags_flooring
        total_sand_cft = sand_cft_masonry + sand_cft_plaster + sand_cft_flooring
        total_cement_cost = cement_cost_masonry + cement_cost_plaster + cement_cost_flooring
        total_sand_cost = sand_cost_masonry + sand_cost_plaster + sand_cost_flooring
        total_cost = total_cement_cost + total_sand_cost

        result = {
            "masonry": {
                "cement_bags": round(cement_bags_masonry, 1),
                "sand_cft": round(sand_cft_masonry, 1),
                "cement_cost": round(cement_cost_masonry),
                "sand_cost": round(sand_cost_masonry)
            },
            "plaster": {
                "wall_area_sqft": round(wall_area),
                "cement_bags": round(cement_bags_plaster, 1),
                "sand_cft": round(sand_cft_plaster, 1),
                "cement_cost": round(cement_cost_plaster),
                "sand_cost": round(sand_cost_plaster)
            },
            "flooring": {
                "floor_area_sqft": round(total_floor_area, 1),
                "cement_bags": round(cement_bags_flooring, 1),
                "sand_cft": round(sand_cft_flooring, 1),
                "cement_cost": round(cement_cost_flooring),
                "sand_cost": round(sand_cost_flooring)
            },
            "totals": {
                "total_cement_bags": round(total_cement_bags, 1),
                "total_sand_cft": round(total_sand_cft, 1),
                "cement_price_per_bag": cement_price,
                "sand_price_per_cft": sand_price,
                "total_cement_cost": round(total_cement_cost),
                "total_sand_cost": round(total_sand_cost),
                "total_cost": round(total_cost)
            }
        }

        # Optional: store in shared_inputs
        shared_inputs["cement_mortar_data"] = result

        return result

    except Exception as e:
        return {"error": f"Cement mortar tool error: {str(e)}"}


cement_mortar_tool_func = cement_mortar_logic
estimate_cement_mortar = function_tool(cement_mortar_logic)





# tools/concrete_mix_tool.py

import json
from agents import function_tool
from shared_inputs import shared_inputs


def concrete_logic(
    plot_length_ft: float = None,
    plot_width_ft: float = None,
    number_of_floors: int = None,
    number_of_rooms: int = None,
    number_of_columns: int = 14,
    include_underground_tank: bool = True,
    ug_tank_length_ft: float = 6.0,
    ug_tank_width_ft: float = 4.0,
    include_overhead_tank: bool = True,
    oh_tank_length_ft: float = 5.0,
    oh_tank_width_ft: float = 3.5
) -> dict:
    try:
        # 🧩 Pull from shared_inputs if missing
        plot_length_ft = shared_inputs.get("plot_length_ft", plot_length_ft)
        plot_width_ft = shared_inputs.get("plot_width_ft", plot_width_ft)
        number_of_floors = shared_inputs.get("number_of_floors", number_of_floors)
        number_of_rooms = shared_inputs.get("number_of_rooms", number_of_rooms)
        number_of_columns = shared_inputs.get("number_of_columns", number_of_columns)
        include_underground_tank = shared_inputs.get("include_underground_tank", include_underground_tank)
        ug_tank_length_ft = shared_inputs.get("ug_tank_length_ft", ug_tank_length_ft)
        ug_tank_width_ft = shared_inputs.get("ug_tank_width_ft", ug_tank_width_ft)
        include_overhead_tank = shared_inputs.get("include_overhead_tank", include_overhead_tank)
        oh_tank_length_ft = shared_inputs.get("oh_tank_length_ft", oh_tank_length_ft)
        oh_tank_width_ft = shared_inputs.get("oh_tank_width_ft", oh_tank_width_ft)

        # 📦 Load prices
        try:
            with open("material_prices.json", "r") as file:
                prices = json.load(file)
        except Exception as e:
            return {"error": f"Failed to load material_prices.json: {str(e)}"}

        for item in ["cement", "bajri", "crush", "rohri"]:
            if item not in prices or "price_per_cft" not in prices[item] and item != "cement":
                return {"error": f"Missing '{item}' price info in material_prices.json"}
        if "price_per_bag" not in prices["cement"]:
            return {"error": "Missing 'cement' price info in material_prices.json"}

        cement_price = prices["cement"]["price_per_bag"]
        bajri_price = prices["bajri"]["price_per_cft"]
        crush_price = prices["crush"]["price_per_cft"]
        rohri_price = prices["rohri"]["price_per_cft"]

        # 🔢 Volume Calculations
        base_concrete = 32 * number_of_columns
        short_col_concrete = 3 * number_of_columns
        full_col_concrete = 10.5 * number_of_columns

        wall_length = (plot_length_ft + plot_width_ft) * 2 + (number_of_rooms * 10)
        plinth_volume = wall_length * 2 * 0.5
        slab_volume = (plot_length_ft * plot_width_ft) * (0.42) * (number_of_floors)
        beam_volume = (plot_length_ft + plot_width_ft) * 1.5 * 0.5 + (number_of_rooms * 10) * number_of_floors

        tower_col_volume = 4 * (1.5 * 0.5 * 10)
        tower_slab_volume = 10 * 10 * 0.42
        tower_beam_volume = 18 * 1.5 * 0.5

        # base ground flooring
        base_ground = plot_length_ft * plot_width_ft * 0.33

        rohri_volume = plot_length_ft * plot_width_ft * (4 / 12)
    

        # UG Tank
        ug_volume = 0
        if include_underground_tank:
            wall_area = 2 * (ug_tank_length_ft * 9 + ug_tank_width_ft * 9)
            wall_volume = wall_area * 0.5
            floor = ug_tank_length_ft * ug_tank_width_ft * 0.5
            slab = floor
            ug_volume = wall_volume + floor + slab

        # OH Tank
        oh_volume = 0
        if include_overhead_tank:
            wall_area = 2 * (oh_tank_length_ft * 5 + oh_tank_width_ft * 5)
            wall_volume = wall_area * 0.5
            floor = oh_tank_length_ft * oh_tank_width_ft * 0.5
            slab = floor
            oh_volume = wall_volume + floor + slab

        # Stairs
        stairs_count = number_of_floors
        stair_width = 3.5
        tread_depth = 0.5
        riser_height = 0.583
        floor_height = 10
        steps_per_floor = int(floor_height / riser_height)
        step_volume = stair_width * tread_depth * riser_height
        stair_volume = stairs_count * steps_per_floor * step_volume

        # 📊 Material Totals
        total_volume = (
            base_concrete + short_col_concrete + full_col_concrete +
            slab_volume + beam_volume + plinth_volume +
            tower_col_volume + tower_slab_volume + tower_beam_volume +
            stair_volume + ug_volume + oh_volume + base_ground
        )
        

        cement_cft = total_volume * (1 / 7)
        bajri_cft = total_volume * (4 / 7)
        crush_cft = total_volume * (2 / 7)
        cement_bags = cement_cft 

        cement_cost = cement_bags * cement_price
        bajri_cost = bajri_cft * bajri_price
        crush_cost = crush_cft * crush_price
        rohri_cost = rohri_volume * rohri_price
        concrete_cost = cement_cost + bajri_cost + crush_cost + rohri_cost
        

        result = {
            "volume_breakdown": {
                "base": base_concrete,
                "short_columns": short_col_concrete,
                "full_columns": full_col_concrete,
                "plinth": plinth_volume,
                "slab": slab_volume,
                "beam": beam_volume,
                "tower_columns": tower_col_volume,
                "tower_slab": tower_slab_volume,
                "tower_beam": tower_beam_volume,
                "stair": round(stair_volume, 2),
                "base_ground": base_ground,
                "underground_tank": round(ug_volume, 2),
                "overhead_tank": round(oh_volume, 2),
                "total_volume_cft": round(total_volume, 2)
            },
            "material_breakdown": {
                "cement_bags": round(cement_bags, 2),
                "bajri_cft": round(bajri_cft, 2),
                "crush_cft": round(crush_cft, 2),
                "cement_cost": round(cement_cost),
                "bajri_cost": round(bajri_cost),
                "crush_cost": round(crush_cost),
                "rohri_cost": round(rohri_cost)
            },
            
            "totals": {
                "concrete_cost": round(concrete_cost),
                "cement_price_per_bag": cement_price,
                "bajri_price_per_cft": bajri_price,
                "crush_price_per_cft": crush_price,
                "rohri_price_per_cft": rohri_price
            }
        }

        # Optional: store in shared_inputs
        shared_inputs["concrete_data"] = result

        return result

    except Exception as e:
        return {"error": f"Concrete mix error: {str(e)}"}


concrete_tool_func = concrete_logic
estimate_concrete = function_tool(concrete_logic)





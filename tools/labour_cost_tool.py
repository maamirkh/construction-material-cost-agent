# tools/labour_cost_tool.py

import json
from agents import function_tool
from shared_inputs import shared_inputs

def labour_logic() -> dict:
    try:
        # ✅ Step 1: Get shared inputs

        # # 🔍 Debug: Check all shared inputs related to labour
        # print("\n[DEBUG] Shared Inputs for Labour Tool:")
        # print(json.dumps(shared_inputs, indent=2))

        base_area = shared_inputs.get("plot_size_sqft")
        floors = shared_inputs.get("number_of_floors", 1)

        if base_area is None:
            return {"error": "Plot size not found in shared_inputs."}

        total_area = base_area * floors

        # ✅ Step 2: Add underground tank area if included
        total_area_ug = 0
        if shared_inputs.get("include_underground_tank"):
            ug_length = shared_inputs.get("ug_tank_length_ft", 0)
            ug_width = shared_inputs.get("ug_tank_width_ft", 0)
            total_area_ug = ug_length * ug_width * 2

        # ✅ Step 3: Add overhead tank area if included
        total_area_oh = 0
        if shared_inputs.get("include_overhead_tank"):
            oh_length = shared_inputs.get("oh_tank_length_ft", 0)
            oh_width = shared_inputs.get("oh_tank_width_ft", 0)
            total_area_oh = oh_length * oh_width * 2

        # ✅ Step 4: Add tower area if
        total_area_tower = 0
        if shared_inputs.get("include_tower"):
            tower_length = shared_inputs.get("tower_length_ft", 0)
            tower_width = shared_inputs.get("tower_width_ft", 0)
            total_area_tower = tower_length * tower_width 

        total_area_sft = total_area + total_area_ug + total_area_oh + total_area_tower

        # ✅ Step 5: Load labour rate from material_prices.json
        def load_prices():
            with open("material_prices.json", "r") as f:
                return json.load(f)

        prices = load_prices()

        if "labour" not in prices or "rate_per_sqft" not in prices["labour"]:
            return {"error": "Missing 'labour' price info in material_prices.json"}

        labour_rate = prices["labour"]["rate_per_sqft"]

        # ✅ Step 6: Cost calculation
        total_cost = round(total_area_sft * labour_rate)

        # ✅ Step 7: Return result
        result = {
            "base_plot_area_sqft": base_area,
            "number_of_floors": floors,
            "total_area_including_tanks_and_tower_sqft": total_area_sft,
            "labour_rate_per_sqft": labour_rate,
            "total_labour_cost_pkr": total_cost
        }

        # 🔁 Store in shared_inputs
        shared_inputs["labour_data"] = result

        return result

    except Exception as e:
        return {"error": str(e)}

estimate_labour = function_tool(labour_logic)
labour_cost_tool_func = labour_logic

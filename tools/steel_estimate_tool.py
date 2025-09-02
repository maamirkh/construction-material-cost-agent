# tools/steel_estimate_tool.py

import json
from agents import function_tool
from shared_inputs import shared_inputs

def steel_logic() -> dict:
    try:
        # ✅ Step 1: Get total volume from concrete data
        concrete_data = shared_inputs.get("gray_structure_data", {})
        volume_info = concrete_data.get("concrete_mix", {})
        total_volume_cft = volume_info.get("total_volume_cft")

        if total_volume_cft is None:
            return {"error": "Concrete volume not found in shared_inputs. Please run concrete tool first."}

        # ✅ Step 2: Load and validate material prices
        def load_material_prices():
            with open("material_prices.json", "r") as file:
                return json.load(file)

        prices = load_material_prices()
        
        if "steel" not in prices or "price_per_ton" not in prices["steel"]:
            return {"error": "Missing 'steel' price info in material_prices.json"}

        steel_price = prices["steel"]["price_per_ton"]  # PKR per ton

        # ✅ Step 3: Steel calculation
        steel_per_cft = 2  # kg per cft
        steel_kg = round(total_volume_cft * steel_per_cft, 2)
        steel_tons = round(steel_kg / 1000, 3)

        # ✅ Step 4: Cost Calculation
        total_cost = round(steel_tons * steel_price)

        # ✅ Step 5: Return result
        result = {
            "rcc_volume_cft": total_volume_cft,
            "steel_per_cft_kg": steel_per_cft,
            "total_steel_kg": steel_kg,
            "total_steel_tons": steel_tons,
            "steel_rate_per_ton": steel_price,
            "total_steel_cost_pkr": total_cost
        }

        # 🔁 Store in shared_inputs
        shared_inputs["steel_data"] = result

        return result

    except Exception as e:
        return {"error": str(e)}

estimate_steel = function_tool(steel_logic)
steel_estimate_tool_func = steel_logic




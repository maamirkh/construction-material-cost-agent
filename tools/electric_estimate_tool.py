# tools/electric_tool.py

import json
from agents import function_tool
from shared_inputs import shared_inputs


def electric_estimate_logic() -> dict:
    try:
        number_of_floors = shared_inputs["number_of_floors"]
        number_of_rooms = shared_inputs["number_of_rooms"]
        bathroom_sizes = shared_inputs["bathroom_sizes"]
        kitchen_sizes = shared_inputs["kitchen_sizes"]
        number_of_washingareas = shared_inputs["number_of_washingareas"]

        # ✅ Dynamically infer counts from sizes
        # number_of_rooms = len([b for b in room_sizes.split(",") if b.strip()])
        number_of_bathrooms = len([b for b in bathroom_sizes.split(",") if b.strip()])
        number_of_kitchens = len([k for k in kitchen_sizes.split(",") if k.strip()])
        

        with open("material_prices.json", "r") as file:
            prices = json.load(file)
    except Exception as e:
        return {"error": f"Failed to load inputs or material_prices.json: {str(e)}"}

    # Point counts
    light_points = (
        (number_of_rooms * 8) +
        (number_of_bathrooms * 1) +
        (number_of_kitchens * 4) +
        (number_of_washingareas * 2)
    ) * number_of_floors
    fan_points = (number_of_rooms + number_of_bathrooms + number_of_kitchens) * number_of_floors # includes room fans + exhaust
    ac_points = number_of_rooms * number_of_floors
    multi_plugs = ((number_of_rooms * 2) + (number_of_kitchens * 2) 
                   + (number_of_washingareas * 1)) * number_of_floors

    # Wire calculation (Phase + Neutral only)
    wire_3_29_ft = light_points * 15 * 2
    wire_7_29_ft = (fan_points + multi_plugs) * 20 * 2
    wire_7_36_ft = ac_points * 25 * 2
    wire_7_44_ft = number_of_floors * 50 * 2

    conduit_pipe_ft = (wire_3_29_ft + wire_7_29_ft + wire_7_36_ft + wire_7_44_ft) * 0.8 / 2
    band_count = conduit_pipe_ft // 10
    plastic_sockets = conduit_pipe_ft // 10

    electric_sheets = (number_of_rooms + number_of_bathrooms + number_of_kitchens 
                       + number_of_washingareas) * number_of_floors + ac_points + multi_plugs
    led_lights = light_points
    fan_boxes = fan_points
    switch_boxes = electric_sheets
    db_count = number_of_floors
    breakers = (number_of_rooms * number_of_floors) + ac_points 

    result = {
        "wiring": {
            "3_29_ft": wire_3_29_ft,
            "7_29_ft": wire_7_29_ft,
            "7_36_ft": wire_7_36_ft,
            "7_44_ft": wire_7_44_ft,
            "cost": round(
                wire_3_29_ft * prices["wire_3_29"]["price_per_ft"] +
                wire_7_29_ft * prices["wire_7_29"]["price_per_ft"] +
                wire_7_36_ft * prices["wire_7_36"]["price_per_ft"] +
                wire_7_44_ft * prices["wire_7_44"]["price_per_ft"], 2
            )
        },
        "conduit_pipe": {
            "length_ft": round(conduit_pipe_ft, 2),
            "cost": round(conduit_pipe_ft * prices["pipe"]["price_per_ft"], 2)
        },
        "bands_and_socket": {
            "band_quantity": int(band_count),
            "socket_quantity": int(plastic_sockets),
            "cost": round(
                band_count * prices["band"]["price_per_unit"] + 
                plastic_sockets * prices["plastic_socket"]["price_per_unit"], 2),
            
        },
        "boxes": {
            "fan_boxes": fan_boxes,
            "switch_boxes": switch_boxes,
            "cost": round(
                fan_boxes * prices["fan_box"]["price_per_unit"] +
                switch_boxes * prices["switch_box"]["price_per_unit"] + 2)
        },

        "electric_sheets": {
            "quantity": electric_sheets,
            "cost": round(electric_sheets * prices["electric_sheet"]["price_per_unit"], 2)
        },
        "led_lights": {
            "quantity": led_lights,
            "cost": round(led_lights * prices["led_light"]["price_per_unit"], 2)
        },
        "db_and_breakers": {
            "db_quantity": db_count,
            "breaker_quantity": breakers,
            "cost": round(
                db_count * prices["db"]["price_per_unit"] +
                breakers * prices["breaker"]["price_per_unit"], 2
            )
        }
    }

    result["total_cost"] = round(sum(item["cost"] for item in result.values()), 2)
    shared_inputs["electric_data"] = result
    return result


# ✅ Wrapper for tool chaining
electric_estimate_tool_func = electric_estimate_logic

# ✅ Optional function tool
estimate_electric = function_tool(electric_estimate_logic)

